// GET /api/predictions — user's prediction history grouped by GW

import type { Env } from '../types/env';
import type { Prediction } from '../types/app';
import type { PredictionsResponse } from '../types/api';

/**
 * GET /api/predictions
 * Returns all predictions for a user, grouped by gameweek.
 */
export async function handleGetPredictions(
  userId: string,
  env: Env
): Promise<Response> {
  const doId = env.USER_STATE.idFromName(userId);
  const doStub = env.USER_STATE.get(doId);

  const res = await doStub.fetch(new Request('http://do/predictions'));
  const predictions = await res.json() as Record<string, Prediction[]>;

  // Count total predictions
  let total = 0;
  for (const preds of Object.values(predictions)) {
    total += preds.length;
  }

  const body: PredictionsResponse = { predictions, total };
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}
