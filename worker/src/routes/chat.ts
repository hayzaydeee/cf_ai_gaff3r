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
import { runAnalysis } from '../services/ai';
import { SYSTEM_PROMPT, buildPLUserMessage, buildStandardUserMessage } from '../prompts/gaffer';
import { fetchFixtures, fetchBootstrap } from '../services/fpl';
import { fetchUpcomingMatches } from '../services/football-data';
import { identifyFixture } from '../services/fixture-matcher';

/**
 * POST /api/chat
 * Full 9-step analysis pipeline with server-side fixture identification.
 */
export async function handleChat(
  request: Request,
  userId: string,
  env: Env
): Promise<Response> {
  const body = await request.json() as ChatRequest;
  const { message, gameweek, fixtureId: providedFixtureId } = body;

  if (!message || !gameweek) {
    return errorResponse('Missing message or gameweek', 400);
  }

  // Get user's Durable Object
  const doId = env.USER_STATE.idFromName(userId);
  const doStub = env.USER_STATE.get(doId);

  // Initialize profile
  await doStub.fetch(new Request('http://do/init', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  }));

  // Step 3: Parallel fetch — DO state + all upcoming fixtures for identification
  const [accuracyRes, chatHistoryRes, allUpcoming] = await Promise.all([
    doStub.fetch(new Request('http://do/accuracy')),
    doStub.fetch(new Request(`http://do/chat/${gameweek}`)),
    fetchAllUpcomingFixtures(gameweek, env),
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
        env.FPL_CACHE,
        env
      );
    } catch (err) {
      console.warn('Match context fetch failed:', err);
      // Continue — Gaffer responds with limited info
    }
  }

  // Step 6: Assemble prompt based on available context
  let userPrompt: string;
  if (matchContext && matchContext.type === 'pl') {
    userPrompt = buildPLUserMessage(matchContext, message, accuracy);
  } else if (matchContext && matchContext.type === 'standard') {
    userPrompt = buildStandardUserMessage(matchContext, message, accuracy);
  } else {
    // General football chat — no fixture context available
    userPrompt = `USER MESSAGE: "${message}"\n\n(No specific fixture data available. Provide general football analysis. If they're asking about a match you cannot identify, say so and offer general insights based on what you know.)`;
    if (accuracy.totalPredictions > 0) {
      userPrompt += `\n\n═══ YOUR TRACK RECORD ═══\nTotal: ${accuracy.totalPredictions} | Outcome: ${accuracy.outcomeAccuracy}% | Streak: ${accuracy.currentStreak}`;
    }
  }

  // Step 7: Call Workers AI
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
async function fetchAllUpcomingFixtures(gameweek: number, env: Env): Promise<FixtureItem[]> {
  try {
    const [fplFixtures, bootstrap, fdMatches] = await Promise.all([
      fetchFixtures(env.FPL_CACHE, gameweek),
      fetchBootstrap(env.FPL_CACHE),
      fetchUpcomingMatches(env.FPL_CACHE, env).catch(() => []),
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
