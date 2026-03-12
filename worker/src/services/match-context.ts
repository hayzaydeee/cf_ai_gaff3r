// Data source routing + context assembly
// Routes to FPL API for PL, football-data.org for other leagues
// Produces PLMatchContext or StandardMatchContext

import type { MatchContext } from '../types/app';
import type { Env } from '../types/env';
import { buildPLMatchContext } from './fpl';
import { buildStandardMatchContext, fetchUpcomingMatches } from './football-data';
import type { FDMatch } from '../types/football-data';

/**
 * Determine the data source and build the appropriate match context.
 *
 * For PL fixtures: uses FPL API (rich data — player xG, injuries, strength, FDR)
 * For everything else: uses football-data.org (standings, form, recent results)
 */
export async function fetchMatchContext(
  competitionCode: string,
  fixtureId: number,
  gameweek: number,
  kv: KVNamespace,
  env: Env
): Promise<MatchContext> {
  if (competitionCode === 'PL') {
    return buildPLMatchContext(fixtureId, gameweek, kv);
  } else {
    // For non-PL, we need to find the match in football-data.org
    const match = await findFDMatch(fixtureId, kv, env);
    if (!match) {
      throw new Error(`Match ${fixtureId} not found in football-data.org`);
    }
    return buildStandardMatchContext(match, kv, env);
  }
}

/**
 * Find a football-data.org match by ID from the upcoming matches cache.
 */
async function findFDMatch(
  matchId: number,
  kv: KVNamespace,
  env: Env
): Promise<FDMatch | null> {
  const matches = await fetchUpcomingMatches(kv, env);
  return matches.find(m => m.id === matchId) ?? null;
}

/**
 * Determine which data source to use based on competition code.
 */
export function getDataSource(competitionCode: string): 'fpl' | 'football-data' {
  return competitionCode === 'PL' ? 'fpl' : 'football-data';
}
