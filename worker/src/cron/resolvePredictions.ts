// Cron: Daily prediction resolution — runs 8am UTC ("0 8 * * *")
// 1. Queries D1 for pending predictions whose fixture_date < now
// 2. Fetches actual result from football-data.org by fixture_id
// 3. Updates outcome_correct, exact_score_correct, status = 'resolved'

import type { Env } from '../types/env';
import type { PredictionRow } from '../db/schema';

const FD_BASE = 'https://api.football-data.org/v4';

// Maximum predictions to resolve per run (rate limit: 10 req/min on free tier)
const BATCH_LIMIT = 8;

// Grace period: only attempt resolution if fixture was >90 min ago (match may still be live)
const GRACE_PERIOD_SECONDS = 110 * 60; // 110 minutes

interface FDMatchResult {
  id: number;
  status: string; // "FINISHED" | "IN_PLAY" | "TIMED" | etc.
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

/**
 * Resolve pending predictions against actual results.
 * Called by the scheduled() handler in index.ts.
 */
export async function runResolvePredictions(env: Env): Promise<void> {
  console.log('[resolvePredictions] Starting resolution run...');

  const nowTs = Math.floor(Date.now() / 1000);
  const cutoffTs = nowTs - GRACE_PERIOD_SECONDS;

  // Fetch pending predictions with a known fixture_id and past kickoff
  const result = await env.DB.prepare(`
    SELECT id, fixture_id, competition_code, predicted_home, predicted_away,
           home_team, away_team, fixture_date
    FROM predictions
    WHERE status = 'pending'
      AND fixture_id IS NOT NULL
      AND fixture_date IS NOT NULL
      AND fixture_date < ?
    ORDER BY fixture_date ASC
    LIMIT ?
  `).bind(cutoffTs, BATCH_LIMIT).all<PredictionRow>();

  const pending = result.results ?? [];
  console.log(`[resolvePredictions] Found ${pending.length} candidates`);

  if (pending.length === 0) return;

  let resolved = 0;
  let errors = 0;

  for (const pred of pending) {
    try {
      const match = await fetchMatchResult(pred.fixture_id!, env.FOOTBALL_DATA_API_KEY);

      if (match.status !== 'FINISHED') {
        console.log(`[resolvePredictions] Fixture ${pred.fixture_id} not finished yet (${match.status}), skipping`);
        continue;
      }

      const actualHome = match.score.fullTime.home;
      const actualAway = match.score.fullTime.away;

      if (actualHome === null || actualAway === null) {
        console.warn(`[resolvePredictions] Fixture ${pred.fixture_id} has null score, marking unresolvable`);
        await env.DB.prepare(`UPDATE predictions SET status = 'unresolvable' WHERE id = ?`)
          .bind(pred.id).run();
        continue;
      }

      const outcomeCorrect = deriveOutcomeCorrect(
        pred.predicted_home, pred.predicted_away,
        actualHome, actualAway,
      );
      const exactScoreCorrect =
        pred.predicted_home === actualHome && pred.predicted_away === actualAway ? 1 : 0;

      await env.DB.prepare(`
        UPDATE predictions
        SET actual_home = ?,
            actual_away = ?,
            outcome_correct = ?,
            exact_score_correct = ?,
            status = 'resolved',
            resolved_at = unixepoch()
        WHERE id = ?
      `).bind(actualHome, actualAway, outcomeCorrect, exactScoreCorrect, pred.id).run();

      console.log(
        `[resolvePredictions] Resolved ${pred.home_team} vs ${pred.away_team}: ` +
        `predicted ${pred.predicted_home}-${pred.predicted_away}, ` +
        `actual ${actualHome}-${actualAway} ` +
        `(outcome: ${outcomeCorrect ? '✓' : '✗'}, exact: ${exactScoreCorrect ? '✓' : '✗'})`
      );
      resolved++;

      // Respect football-data.org free-tier rate limit: ~6 req/min
      await sleep(10_000);
    } catch (err) {
      console.error(`[resolvePredictions] Error resolving prediction ${pred.id}:`, err);
      errors++;
    }
  }

  console.log(`[resolvePredictions] Done — resolved: ${resolved}, errors: ${errors}`);
}

// ── Helpers ──

async function fetchMatchResult(matchId: number, apiKey: string): Promise<FDMatchResult> {
  const res = await fetch(`${FD_BASE}/matches/${matchId}`, {
    headers: { 'X-Auth-Token': apiKey },
  });
  if (!res.ok) throw new Error(`football-data.org match ${matchId} failed: ${res.status}`);
  const data = await res.json() as { match: FDMatchResult };
  return data.match;
}

/**
 * Compare predicted vs actual outcome (home win / draw / away win).
 * Returns 1 if correct, 0 if not.
 */
function deriveOutcomeCorrect(
  predHome: number, predAway: number,
  actualHome: number, actualAway: number,
): 0 | 1 {
  const predicted = predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw';
  const actual = actualHome > actualAway ? 'home' : actualHome < actualAway ? 'away' : 'draw';
  return predicted === actual ? 1 : 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
