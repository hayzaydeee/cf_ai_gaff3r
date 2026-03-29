// GET /api/stats — accuracy statistics
// POST /api/resolve — trigger resolution of pending predictions

import type { Env } from '../types/env';
import type { AccuracyStats, Prediction } from '../types/app';
import type { StatsResponse } from '../types/api';
import { fetchFixtures, fetchBootstrap } from '../services/fpl';
import { fetchMatch } from '../services/football-data';
import { createRedisClient } from '../services/redis';

/**
 * GET /api/stats
 * Returns accuracy statistics for a user.
 */
export async function handleGetStats(
  userId: string,
  env: Env
): Promise<Response> {
  const doId = env.USER_STATE.idFromName(userId);
  const doStub = env.USER_STATE.get(doId);

  const res = await doStub.fetch(new Request('http://do/accuracy'));
  const accuracy = await res.json() as AccuracyStats;

  const body: StatsResponse = {
    totalPredictions: accuracy.totalPredictions,
    resolved: accuracy.resolved,
    outcomeAccuracy: accuracy.outcomeAccuracy,
    scoreAccuracy: accuracy.scoreAccuracy,
    currentStreak: accuracy.currentStreak,
    bestStreak: accuracy.bestStreak,
    byGameweek: accuracy.byGameweek,
  };

  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /api/resolve
 * Triggers resolution of pending predictions against actual results.
 * For V1, this is on-demand (user visits Predictions page).
 */
export async function handleResolve(
  userId: string,
  env: Env
): Promise<Response> {
  const doId = env.USER_STATE.idFromName(userId);
  const doStub = env.USER_STATE.get(doId);
  const redis = createRedisClient(env);

  // Get all predictions
  const predsRes = await doStub.fetch(new Request('http://do/predictions'));
  const allPredictions = await predsRes.json() as Record<string, Prediction[]>;

  let resolved = 0;
  let errors = 0;

  for (const preds of Object.values(allPredictions)) {
    for (const pred of preds) {
      if (pred.status !== 'pending') continue;

      try {
        let actualScore: { home: number; away: number } | null = null;

        if (pred.competitionCode === 'PL') {
          // Check FPL fixtures for the result
          const fixtures = await fetchFixtures(redis, pred.gameweek);
          const fixture = fixtures.find(f => f.id === pred.fixtureId);
          if (fixture && fixture.finished && fixture.team_h_score !== null && fixture.team_a_score !== null) {
            actualScore = { home: fixture.team_h_score, away: fixture.team_a_score };
          }
        } else {
          // Check football-data.org for the result
          try {
            const match = await fetchMatch(env, pred.fixtureId);
            if (match.status === 'FINISHED' && match.score.fullTime.home !== null && match.score.fullTime.away !== null) {
              actualScore = { home: match.score.fullTime.home, away: match.score.fullTime.away };
            }
          } catch {
            // Match not found or API error — skip
          }
        }

        if (actualScore) {
          await doStub.fetch(new Request('http://do/resolve', {
            method: 'POST',
            body: JSON.stringify({
              predictionId: pred.id,
              actualScore,
            }),
          }));
          resolved++;
        }
      } catch (err) {
        console.error(`Failed to resolve ${pred.id}:`, err);
        errors++;
      }
    }
  }

  return new Response(JSON.stringify({ resolved, errors }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
