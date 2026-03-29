// Data source routing + context assembly
// Routes to FPL API for PL, football-data.org for other leagues
// Produces PLMatchContext or StandardMatchContext

import type { MatchContext } from '../types/app';
import type { Env } from '../types/env';
import { buildPLMatchContext } from './fpl';
import { buildStandardMatchContext, fetchUpcomingMatches } from './football-data';
import { getRedisOrFetch } from './cache';
import type { Redis } from './redis';
import type { FDMatch } from '../types/football-data';

// Assembled match context TTL — 30 min (the shortest of any component)
const CONTEXT_TTL = 30 * 60;

/**
 * Determine the data source and build the appropriate match context.
 * The fully assembled context is cached as a single Redis key, collapsing up to
 * 6 downstream API/cache reads into a single GET on cache hits.
 *
 * For PL fixtures: uses FPL API (rich data — player xG, injuries, strength, FDR)
 * For everything else: uses football-data.org (standings, form, recent results)
 */
export async function fetchMatchContext(
  competitionCode: string,
  fixtureId: number,
  gameweek: number,
  redis: Redis,
  env: Env
): Promise<MatchContext> {
  const cacheKey = `match-context:${fixtureId}:${gameweek}`;

  return getRedisOrFetch(redis, cacheKey, async () => {
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
  }, CONTEXT_TTL);
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
