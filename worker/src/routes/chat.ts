// POST /api/chat — full analysis pipeline
// 1. Parse user message
// 2. Route to user's Durable Object
// 3. Parallel fetch: DO state + match data
// 4. Assemble enriched prompt
// 5. Workers AI → analysis + PREDICTION_JSON
// 6. Parse prediction via regex
// 7. Store in DO
// 8. Return response

import type { Env } from '../types/env';
import type { ChatRequest, ChatResponse } from '../types/api';
import type { ChatMessage, Prediction, AccuracyStats, Outcome } from '../types/app';
import { fetchMatchContext, getDataSource } from '../services/match-context';
import { runAnalysis } from '../services/ai';
import { SYSTEM_PROMPT, buildPLUserMessage, buildStandardUserMessage } from '../prompts/gaffer';
import { getCurrentGameweek } from '../services/fpl';

/**
 * POST /api/chat
 * Full 9-step analysis pipeline.
 */
export async function handleChat(
  request: Request,
  userId: string,
  env: Env
): Promise<Response> {
  const body = await request.json() as ChatRequest;
  const { message, gameweek, fixtureId } = body;

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

  // Step 3: Parallel fetch — DO state + match context
  const [accuracyRes, chatHistoryRes, matchContext] = await Promise.all([
    doStub.fetch(new Request('http://do/accuracy')),
    doStub.fetch(new Request(`http://do/chat/${gameweek}`)),
    fixtureId
      ? fetchMatchContext('PL', fixtureId, gameweek, env.FPL_CACHE, env)
        .catch(() => null) // Gracefully handle missing context
      : Promise.resolve(null),
  ]);

  const accuracy = await accuracyRes.json() as AccuracyStats;
  const chatHistory = await chatHistoryRes.json() as ChatMessage[];

  // Step 5: Assemble prompt based on data source
  let userPrompt: string;
  if (matchContext && matchContext.type === 'pl') {
    userPrompt = buildPLUserMessage(matchContext, message, accuracy);
  } else if (matchContext && matchContext.type === 'standard') {
    userPrompt = buildStandardUserMessage(matchContext, message, accuracy);
  } else {
    // No fixture context — general football chat
    userPrompt = `USER MESSAGE: "${message}"\n\n(No specific fixture data available. Provide general football analysis based on the user's question.)`;
    if (accuracy.totalPredictions > 0) {
      userPrompt += `\n\n═══ YOUR TRACK RECORD ═══\nTotal: ${accuracy.totalPredictions} | Outcome: ${accuracy.outcomeAccuracy}% | Streak: ${accuracy.currentStreak}`;
    }
  }

  // Step 6: Call Workers AI
  const aiResult = await runAnalysis(env, SYSTEM_PROMPT, userPrompt);

  // Step 7: Store user message in chat history
  const userMsg: ChatMessage = {
    id: `msg_${crypto.randomUUID().slice(0, 8)}`,
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
    metadata: fixtureId ? { fixtureId } : undefined,
  };

  const assistantMsg: ChatMessage = {
    id: `msg_${crypto.randomUUID().slice(0, 8)}`,
    role: 'assistant',
    content: aiResult.response,
    timestamp: new Date().toISOString(),
    metadata: aiResult.prediction ? {
      fixtureId,
      predictionId: `pred_${crypto.randomUUID().slice(0, 8)}`,
    } : undefined,
  };

  // Store messages in DO
  await doStub.fetch(new Request(`http://do/chat/${gameweek}`, {
    method: 'POST',
    body: JSON.stringify(userMsg),
  }));
  await doStub.fetch(new Request(`http://do/chat/${gameweek}`, {
    method: 'POST',
    body: JSON.stringify(assistantMsg),
  }));

  // Step 8: Store prediction if one was made
  let storedPrediction: ChatResponse['prediction'] = null;
  if (aiResult.prediction && matchContext) {
    const predId = assistantMsg.metadata?.predictionId ?? `pred_${crypto.randomUUID().slice(0, 8)}`;
    const predictedOutcome: Outcome =
      aiResult.prediction.homeScore > aiResult.prediction.awayScore ? 'home' :
      aiResult.prediction.awayScore > aiResult.prediction.homeScore ? 'away' : 'draw';

    const prediction: Prediction = {
      id: predId,
      fixtureId: fixtureId ?? matchContext.fixture.id,
      gameweek,
      status: 'pending',
      homeTeam: aiResult.prediction.homeTeam,
      awayTeam: aiResult.prediction.awayTeam,
      homeTeamId: matchContext.type === 'pl' ? 0 : 0, // Simplified — IDs tracked via fixture
      awayTeamId: matchContext.type === 'pl' ? 0 : 0,
      competition: matchContext.fixture.competition,
      competitionCode: matchContext.type === 'pl' ? 'PL' : matchContext.fixture.competitionCode,
      kickoffTime: matchContext.fixture.matchDate,
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

  // Step 9: Return response
  const response: ChatResponse = {
    response: aiResult.response,
    prediction: storedPrediction,
    accuracy: {
      totalPredictions: accuracy.totalPredictions,
      outcomeAccuracy: accuracy.outcomeAccuracy,
      currentStreak: accuracy.currentStreak,
    },
  };

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
