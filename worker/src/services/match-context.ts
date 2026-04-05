// Data source routing + context assembly
// Routes to FPL API for PL, football-data.org for other leagues
// Produces PLMatchContext or StandardMatchContext

import type { MatchContext } from '../types/app';
import type { Env } from '../types/env';
import { buildPLMatchContext } from './fpl';
import { buildStandardMatchContext, fetchUpcomingMatches } from './football-data';
import { getRedisOrFetchSWR } from './redis';
import type { Redis } from './redis';
import type { FDMatch } from '../types/football-data';

// Assembled match context TTL — 60 min.
// The hourly warm cron refreshes before this expires, eliminating cold gaps.
// Soft TTL (50 min) triggers background revalidation via SWR so users never wait.
const CONTEXT_SOFT_TTL = 50 * 60;  // 50 min — serve fresh
const CONTEXT_HARD_TTL = 90 * 60;  // 90 min — serve stale + revalidate in background

/**
 * Determine the data source and build the appropriate match context.
 * The fully assembled context is cached as a single Redis key, collapsing up to
 * 6 downstream API/cache reads into a single GET on cache hits.
 *
 * Uses stale-while-revalidate: within 50 min → instant. Between 50–90 min →
 * instant (stale) + background refresh via ctx.waitUntil(). Beyond 90 min →
 * synchronous rebuild (cold path).
 *
 * For PL fixtures: uses FPL API (rich data — player xG, injuries, strength, FDR)
 * For everything else: uses football-data.org (standings, form, recent results)
 */
export async function fetchMatchContext(
  competitionCode: string,
  fixtureId: number,
  gameweek: number,
  redis: Redis,
  env: Env,
  ctx?: ExecutionContext,
): Promise<MatchContext> {
  const cacheKey = `match-context:${fixtureId}:${gameweek}`;

  return getRedisOrFetchSWR(redis, cacheKey, async () => {
    if (competitionCode === 'PL') {
      return buildPLMatchContext(fixtureId, gameweek, redis, env);
    } else {
      // For non-PL, we need to find the match in football-data.org
      const match = await findFDMatch(fixtureId, redis, env);
      if (!match) {
        throw new Error(`Match ${fixtureId} not found in football-data.org`);
      }
      return buildStandardMatchContext(match, redis, env);
    }
  }, CONTEXT_SOFT_TTL, CONTEXT_HARD_TTL, ctx);
}

/**
 * Find a football-data.org match by ID from the upcoming matches cache.
 */
async function findFDMatch(
  matchId: number,
  redis: Redis,
  env: Env
): Promise<FDMatch | null> {
  const matches = await fetchUpcomingMatches(redis, env);
  return matches.find(m => m.id === matchId) ?? null;
}

/**
 * Determine which data source to use based on competition code.
 */
export function getDataSource(competitionCode: string): 'fpl' | 'football-data' {
  return competitionCode === 'PL' ? 'fpl' : 'football-data';
}
