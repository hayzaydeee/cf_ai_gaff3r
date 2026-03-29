// POST /api/chat — full analysis pipeline
// 1. Parse user message
// 2. Route to user's Durable Object
// 3. Parallel fetch: DO state + upcoming fixtures (for identification)
// 4. Identify fixture from message (server-side) or use provided fixtureId
// 5. Fetch match context (FPL or football-data)
// 6. Assemble enriched prompt
// 7. Workers AI → analysis + PREDICTION_JSON
// 8. Parse prediction, store in DO
// 9. Return response

import type { Env } from '../types/env';
import type { ChatRequest, ChatResponse, FixtureItem } from '../types/api';
import type { ChatMessage, Prediction, AccuracyStats, Outcome } from '../types/app';
import { fetchMatchContext } from '../services/match-context';
import { runAnalysis, runAnalysisStreaming } from '../services/ai';
import { classifyIntent, shouldRunModel, buildIntentHint } from '../services/intentClassifier';
import { log } from '../utils/logger';
import { SYSTEM_PROMPT, buildPLUserMessage, buildStandardUserMessage } from '../prompts/gaffer';
import { fetchFixtures, fetchBootstrap } from '../services/fpl';
import { fetchUpcomingMatches } from '../services/football-data';
import { identifyFixture } from '../services/fixture-matcher';
import { runPLModel, runStandardModel, formatModelBlock, type SimResult, type ModelResult } from '../models';
import { queryRelevantAnalyses, storeAnalysis } from '../services/vectorStore';
import { createRedisClient } from '../services/redis';

/**
 * POST /api/chat
 * Full 9-step analysis pipeline with server-side fixture identification.
 */
export async function handleChat(
  request: Request,
  userId: string,
  env: Env,
  isAuthenticated = false,
  ctx?: ExecutionContext,
): Promise<Response> {
  const body = await request.json() as ChatRequest;
  const { message, gameweek, fixtureId: providedFixtureId, stream: wantsStream } = body;

  if (!message || !gameweek) {
    return errorResponse('Missing message or gameweek', 400);
  }

  // Get user's Durable Object
  const doId = env.USER_STATE.idFromName(userId);
  const doStub = env.USER_STATE.get(doId);

  // Redis client — one instance for the lifetime of this request
  const redis = createRedisClient(env);

  // Initialize profile
  await doStub.fetch(new Request('http://do/init', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  }));

  // Step 3: Parallel fetch — DO state + all upcoming fixtures for identification
  const [accuracyRes, chatHistoryRes, allUpcoming] = await Promise.all([
    doStub.fetch(new Request('http://do/accuracy')),
    doStub.fetch(new Request(`http://do/chat/${gameweek}`)),
    fetchAllUpcomingFixtures(gameweek, redis, env),
  ]);

  const accuracy = await accuracyRes.json() as AccuracyStats;
  const chatHistory = await chatHistoryRes.json() as ChatMessage[];
  void chatHistory; // available for future context injection

  // Step 4: Identify fixture — from provided ID or by parsing the message
  let resolvedFixtureId = providedFixtureId;
  let resolvedCompetitionCode = 'PL';
  let fixtureItem: FixtureItem | null = null;

  if (resolvedFixtureId) {
    // Fixture chip was tapped — look up its competition code
    fixtureItem = allUpcoming.find(f => f.id === resolvedFixtureId) ?? null;
    resolvedCompetitionCode = fixtureItem?.competitionCode ?? 'PL';
  } else {
    // Free-text: identify fixture from message content
    const identified = identifyFixture(message, allUpcoming);
    if (identified) {
      fixtureItem = identified.fixture;
      resolvedFixtureId = identified.fixture.id;
      resolvedCompetitionCode = identified.fixture.competitionCode;
    }
  }

  // Step 5: Fetch match context (if a fixture was identified)
  let matchContext = null;
  if (resolvedFixtureId && fixtureItem) {
    try {
      matchContext = await fetchMatchContext(
        resolvedCompetitionCode,
        resolvedFixtureId,
        gameweek,
        redis,
        env
      );
    } catch (err) {
      console.warn('Match context fetch failed:', err);
      // Continue — Gaffer responds with limited info
    }
  }

  // Step 6: Classify intent — gates model execution and injects prompt hint
  const intent = classifyIntent(message);
  const intentHint = buildIntentHint(intent);

  // Run statistical model only for result/general queries (null intent)
  // Scorer, lineup, btts, and analyse queries don't benefit from Monte Carlo output
  let modelBlock: string | null = null;
  let simResult: SimResult | null = null;
  let adjustmentNotes: string[] = [];
  if (matchContext && shouldRunModel(intent)) {
    try {
      let modelResult: ModelResult | null = null;

      // Phase 5: Cache Monte Carlo results — params are stable for a given fixture+GW
      // Saves ~500ms-1s of CPU-bound simulation on repeated requests for the same match
      if (fixtureItem) {
        const modelKey = `model:${fixtureItem.homeTeamId}:${fixtureItem.awayTeamId}:${gameweek}`;
        const cachedModel = await redis.get<ModelResult>(modelKey);
        if (cachedModel) {
          modelResult = cachedModel;
        } else {
          if (matchContext.type === 'pl') {
            modelResult = runPLModel(matchContext);
          } else {
            modelResult = runStandardModel(matchContext);
          }
          if (modelResult) {
            await redis.set(modelKey, modelResult, { ex: 30 * 60 }).catch(() => {});
          }
        }
      } else {
        if (matchContext.type === 'pl') {
          modelResult = runPLModel(matchContext);
        } else {
          modelResult = runStandardModel(matchContext);
        }
      }

      if (modelResult) {
        simResult = modelResult.simResult;
        adjustmentNotes = modelResult.adjustmentNotes;
        modelBlock = formatModelBlock(simResult, matchContext.fixture.homeTeam, matchContext.fixture.awayTeam);
      }
    } catch (err) {
      console.warn('Statistical model failed, continuing without it:', err);
    }
  }

  // Query Vectorize for relevant past analyses (RAG context)
  let ragBlock: string | null = null;
  if (matchContext && fixtureItem) {
    try {
      ragBlock = await queryRelevantAnalyses(
        env,
        matchContext.fixture.homeTeam,
        matchContext.fixture.awayTeam,
        matchContext.fixture.competition,
      );
    } catch (err) {
      console.warn('RAG query failed, continuing without it:', err);
    }
  }

  let userPrompt: string;
  if (matchContext && matchContext.type === 'pl') {
    userPrompt = buildPLUserMessage(matchContext, message, accuracy, modelBlock, ragBlock, intentHint || null);
  } else if (matchContext && matchContext.type === 'standard') {
    userPrompt = buildStandardUserMessage(matchContext, message, accuracy, modelBlock, ragBlock, intentHint || null);
  } else {
    // General football chat — no fixture context available
    userPrompt = `USER MESSAGE: "${message}"\n\n(No specific fixture data available. Provide general football analysis. If they're asking about a match you cannot identify, say so and offer general insights based on what you know.)`;
    if (accuracy.totalPredictions > 0) {
      userPrompt += `\n\n═══ YOUR TRACK RECORD ═══\nTotal: ${accuracy.totalPredictions} | Outcome: ${accuracy.outcomeAccuracy}% | Streak: ${accuracy.currentStreak}`;
    }
  }

  // Shared post-processing: stores messages + prediction after AI response
  const runPostProcessing = async (
    cleanResponse: string,
    prediction: import('../services/ai').PredictionData | null,
    typedPrediction: import('../types/api').TypedPredictionPayload | null = null,
  ) => {
    const userMsg: ChatMessage = {
      id: `msg_${crypto.randomUUID().slice(0, 8)}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      metadata: resolvedFixtureId ? { fixtureId: resolvedFixtureId } : undefined,
    };
    const predictionId = prediction ? `pred_${crypto.randomUUID().slice(0, 8)}` : undefined;
    const assistantMsg: ChatMessage = {
      id: `msg_${crypto.randomUUID().slice(0, 8)}`,
      role: 'assistant',
      content: cleanResponse,
      timestamp: new Date().toISOString(),
      simResult: simResult ?? undefined,
      adjustmentNotes: adjustmentNotes.length > 0 ? adjustmentNotes : undefined,
      typedPrediction: typedPrediction ?? undefined,
      metadata: (resolvedFixtureId || predictionId) ? { fixtureId: resolvedFixtureId, predictionId } : undefined,
    };
    await doStub.fetch(new Request(`http://do/chat/${gameweek}`, { method: 'POST', body: JSON.stringify(userMsg) }));
    await doStub.fetch(new Request(`http://do/chat/${gameweek}`, { method: 'POST', body: JSON.stringify(assistantMsg) }));

    if (prediction && matchContext && resolvedFixtureId && fixtureItem) {
      const predId = predictionId ?? `pred_${crypto.randomUUID().slice(0, 8)}`;
      const predictedOutcome: Outcome =
        prediction.homeScore > prediction.awayScore ? 'home' :
        prediction.awayScore > prediction.homeScore ? 'away' : 'draw';
      const pred: Prediction = {
        id: predId, fixtureId: resolvedFixtureId, gameweek, status: 'pending',
        homeTeam: prediction.homeTeam, awayTeam: prediction.awayTeam,
        homeTeamId: fixtureItem.homeTeamId, awayTeamId: fixtureItem.awayTeamId,
        competition: fixtureItem.competition, competitionCode: resolvedCompetitionCode,
        kickoffTime: fixtureItem.kickoffTime,
        predictedScore: { home: prediction.homeScore, away: prediction.awayScore },
        predictedOutcome, confidence: prediction.confidence, reasoning: prediction.reasoning,
        createdAt: new Date().toISOString(),
      };
      await doStub.fetch(new Request('http://do/prediction', { method: 'POST', body: JSON.stringify(pred) }));

      const fixtureTs = fixtureItem.kickoffTime ? Math.floor(new Date(fixtureItem.kickoffTime).getTime() / 1000) : null;
      const outcomeProbsJson = simResult ? JSON.stringify({ home: simResult.homeWinPct, draw: simResult.drawPct, away: simResult.awayWinPct }) : null;
      const modelScorelinesJson = simResult ? JSON.stringify(simResult.topScorelinesWithPct.map(s => ({ score: `${s.home}-${s.away}`, pct: +(s.probability * 100).toFixed(1) }))) : null;
      try {
        await env.DB.prepare(`
          INSERT OR IGNORE INTO predictions
            (id, user_id, anon_user_id, home_team, away_team, fixture_id, competition_code,
             fixture_date, league, predicted_home, predicted_away,
             outcome_probs_json, model_scorelines_json, reasoning_summary, confidence, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', unixepoch())
        `).bind(predId, isAuthenticated ? userId : null, !isAuthenticated ? userId : null,
          pred.homeTeam, pred.awayTeam, resolvedFixtureId, resolvedCompetitionCode,
          fixtureTs, fixtureItem.competition, pred.predictedScore.home, pred.predictedScore.away,
          outcomeProbsJson, modelScorelinesJson, pred.reasoning, pred.confidence).run();
      } catch (dbErr) {
        console.warn('D1 prediction insert failed (streaming):', dbErr);
      }

      if (simResult) {
        const storeId = `analysis_${crypto.randomUUID().slice(0, 16)}`;
        void storeAnalysis(env, storeId, cleanResponse, {
          homeTeam: matchContext.fixture.homeTeam, awayTeam: matchContext.fixture.awayTeam,
          competition: matchContext.fixture.competition, date: new Date().toISOString(),
          predictedScore: `${prediction.homeScore}-${prediction.awayScore}`,
        });
      }
    }
  };

  // Step 7a: Streaming path — return SSE stream, post-processing runs inside it
  if (wantsStream) {
    const extraDone = {
      accuracy: { totalPredictions: accuracy.totalPredictions, outcomeAccuracy: accuracy.outcomeAccuracy, currentStreak: accuracy.currentStreak },
      fixtureFound: !!matchContext,
      dataSource: matchContext ? (matchContext.type === 'pl' ? 'fpl' : 'football-data') : null,
      identifiedFixture: fixtureItem ? { id: fixtureItem.id, homeTeam: fixtureItem.homeTeam, awayTeam: fixtureItem.awayTeam, kickoffTime: fixtureItem.kickoffTime, competition: fixtureItem.competition, competitionCode: resolvedCompetitionCode } : null,
      simResult: simResult ?? undefined,
      adjustmentNotes: adjustmentNotes.length > 0 ? adjustmentNotes : undefined,
    };
    const streamMeta = { hasModel: shouldRunModel(intent), intent: intent ?? 'result' };
    const streamBody = await runAnalysisStreaming(env, SYSTEM_PROMPT, userPrompt, extraDone, runPostProcessing, streamMeta, ctx);
    return new Response(streamBody, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  // Step 7b: Non-streaming path
  const aiResult = await runAnalysis(env, SYSTEM_PROMPT, userPrompt);

  // Step 8: Store messages in chat history
  const userMsg: ChatMessage = {
    id: `msg_${crypto.randomUUID().slice(0, 8)}`,
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
    metadata: resolvedFixtureId ? { fixtureId: resolvedFixtureId } : undefined,
  };

  const predictionId = aiResult.prediction
    ? `pred_${crypto.randomUUID().slice(0, 8)}`
    : undefined;

  const assistantMsg: ChatMessage = {
    id: `msg_${crypto.randomUUID().slice(0, 8)}`,
    role: 'assistant',
    content: aiResult.response,
    timestamp: new Date().toISOString(),
    metadata: (resolvedFixtureId || predictionId)
      ? { fixtureId: resolvedFixtureId, predictionId }
      : undefined,
  };

  await doStub.fetch(new Request(`http://do/chat/${gameweek}`, {
    method: 'POST',
    body: JSON.stringify(userMsg),
  }));
  await doStub.fetch(new Request(`http://do/chat/${gameweek}`, {
    method: 'POST',
    body: JSON.stringify(assistantMsg),
  }));

  // Store analysis in Vectorize (fire-and-forget, non-blocking)
  if (aiResult.prediction && matchContext && fixtureItem) {
    const storeId = `analysis_${crypto.randomUUID().slice(0, 16)}`;
    const storePromise = storeAnalysis(env, storeId, aiResult.response, {
      homeTeam: matchContext.fixture.homeTeam,
      awayTeam: matchContext.fixture.awayTeam,
      competition: matchContext.fixture.competition,
      date: new Date().toISOString(),
      predictedScore: `${aiResult.prediction.homeScore}-${aiResult.prediction.awayScore}`,
    });
    if (ctx) {
      ctx.waitUntil(storePromise);
    }
    // If no ctx, the promise runs but we don't await it — acceptable for non-critical side effect
  }

  // Step 9: Store prediction if one was generated and we have fixture data
  let storedPrediction: ChatResponse['prediction'] = null;
  if (aiResult.prediction && matchContext && resolvedFixtureId && fixtureItem) {
    const predId = predictionId ?? `pred_${crypto.randomUUID().slice(0, 8)}`;
    const predictedOutcome: Outcome =
      aiResult.prediction.homeScore > aiResult.prediction.awayScore ? 'home' :
      aiResult.prediction.awayScore > aiResult.prediction.homeScore ? 'away' : 'draw';

    const prediction: Prediction = {
      id: predId,
      fixtureId: resolvedFixtureId,
      gameweek,
      status: 'pending',
      homeTeam: aiResult.prediction.homeTeam,
      awayTeam: aiResult.prediction.awayTeam,
      homeTeamId: fixtureItem.homeTeamId,
      awayTeamId: fixtureItem.awayTeamId,
      competition: fixtureItem.competition,
      competitionCode: resolvedCompetitionCode,
      kickoffTime: fixtureItem.kickoffTime,
      predictedScore: {
        home: aiResult.prediction.homeScore,
        away: aiResult.prediction.awayScore,
      },
      predictedOutcome,
      confidence: aiResult.prediction.confidence,
      reasoning: aiResult.prediction.reasoning,
      createdAt: new Date().toISOString(),
    };

    await doStub.fetch(new Request('http://do/prediction', {
      method: 'POST',
      body: JSON.stringify(prediction),
    }));

    // Also persist to D1 for cron-based resolution and cross-user stats
    const fixtureTs = fixtureItem.kickoffTime
      ? Math.floor(new Date(fixtureItem.kickoffTime).getTime() / 1000)
      : null;
    const isAnon = !isAuthenticated;
    const outcomeProbsJson = simResult
      ? JSON.stringify({ home: simResult.homeWinPct, draw: simResult.drawPct, away: simResult.awayWinPct })
      : null;
    const modelScorelinesJson = simResult
      ? JSON.stringify(simResult.topScorelinesWithPct.map(s => ({ score: `${s.home}-${s.away}`, pct: +(s.probability * 100).toFixed(1) })))
      : null;

    try {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO predictions
          (id, user_id, anon_user_id, home_team, away_team, fixture_id, competition_code,
           fixture_date, league, predicted_home, predicted_away,
           outcome_probs_json, model_scorelines_json, reasoning_summary, confidence, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', unixepoch())
      `).bind(
        predId,
        isAuthenticated ? userId : null,
        !isAuthenticated ? userId : null,
        prediction.homeTeam,
        prediction.awayTeam,
        resolvedFixtureId,
        resolvedCompetitionCode,
        fixtureTs,
        fixtureItem.competition,
        prediction.predictedScore.home,
        prediction.predictedScore.away,
        outcomeProbsJson,
        modelScorelinesJson,
        prediction.reasoning,
        prediction.confidence,
      ).run();
    } catch (dbErr) {
      // Non-fatal — DO is the source of truth; D1 is for cron resolution
      console.warn('D1 prediction insert failed:', dbErr);
    }

    log('prediction_made', {
      userId,
      predId,
      fixtureId: resolvedFixtureId,
      homeTeam: prediction.homeTeam,
      awayTeam: prediction.awayTeam,
      confidence: prediction.confidence,
      authenticated: isAuthenticated,
    });

    storedPrediction = {
      id: predId,
      homeTeam: aiResult.prediction.homeTeam,
      awayTeam: aiResult.prediction.awayTeam,
      predictedScore: {
        home: aiResult.prediction.homeScore,
        away: aiResult.prediction.awayScore,
      },
      confidence: aiResult.prediction.confidence,
      reasoning: aiResult.prediction.reasoning,
    };
  }

  // Step 10: Return response with fixture identification metadata
  const response: ChatResponse = {
    response: aiResult.response,
    prediction: storedPrediction,
    accuracy: {
      totalPredictions: accuracy.totalPredictions,
      outcomeAccuracy: accuracy.outcomeAccuracy,
      currentStreak: accuracy.currentStreak,
    },
    fixtureFound: !!matchContext,
    dataSource: matchContext
      ? (matchContext.type === 'pl' ? 'fpl' : 'football-data')
      : null,
    identifiedFixture: fixtureItem
      ? {
          id: fixtureItem.id,
          homeTeam: fixtureItem.homeTeam,
          awayTeam: fixtureItem.awayTeam,
          kickoffTime: fixtureItem.kickoffTime,
          competition: fixtureItem.competition,
          competitionCode: fixtureItem.competitionCode,
        }
      : null,
  };

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Fetch all upcoming fixtures across PL + other competitions.
 * Used for server-side fixture identification from free text.
 */
async function fetchAllUpcomingFixtures(gameweek: number, redis: ReturnType<typeof createRedisClient>, env: Env): Promise<FixtureItem[]> {
  try {
    const [fplFixtures, bootstrap, fdMatches] = await Promise.all([
      fetchFixtures(redis, gameweek),
      fetchBootstrap(redis),
      fetchUpcomingMatches(redis, env).catch(() => []),
    ]);

    const teamMap = new Map(bootstrap.teams.map(t => [t.id, t]));

    const plFixtures: FixtureItem[] = fplFixtures.map(f => ({
      id: f.id,
      homeTeam: teamMap.get(f.team_h)?.name ?? `Team ${f.team_h}`,
      awayTeam: teamMap.get(f.team_a)?.name ?? `Team ${f.team_a}`,
      homeTeamId: f.team_h,
      awayTeamId: f.team_a,
      kickoffTime: f.kickoff_time,
      homeDifficulty: f.team_h_difficulty,
      awayDifficulty: f.team_a_difficulty,
      finished: f.finished,
      homeScore: f.team_h_score,
      awayScore: f.team_a_score,
      competition: 'Premier League',
      competitionCode: 'PL',
    }));

    const otherFixtures: FixtureItem[] = fdMatches
      .filter(m => m.competition.code !== 'PL' && m.status !== 'FINISHED')
      .map(m => ({
        id: m.id,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        homeTeamId: m.homeTeam.id,
        awayTeamId: m.awayTeam.id,
        kickoffTime: m.utcDate,
        homeDifficulty: 0,
        awayDifficulty: 0,
        finished: false,
        homeScore: null,
        awayScore: null,
        competition: m.competition.name,
        competitionCode: m.competition.code,
      }));

    return [...plFixtures, ...otherFixtures];
  } catch {
    return [];
  }
}

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
