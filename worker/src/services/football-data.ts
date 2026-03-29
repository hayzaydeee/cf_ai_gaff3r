// football-data.org API client
// Endpoints: matches, standings, team matches
// Used for non-PL competitions (La Liga, Bundesliga, Serie A, Ligue 1, CL)

import type {
  FDMatchesResponse,
  FDMatch,
  FDScorer,
  FDScorersResponse,
  FDStandingsResponse,
  FDTableEntry,
  FDTeamResponse,
} from '../types/football-data';
import type { StandardMatchContext, StandardTeamContext, RecentResult } from '../types/app';
import type { Env } from '../types/env';
import { getRedisOrFetch } from './cache';
import type { Redis } from './redis';

const FD_BASE = 'https://api.football-data.org/v4';

// Cache TTLs in seconds
const MATCHES_TTL = 6 * 60 * 60;      // 6 hours
const STANDINGS_TTL = 60 * 60;         // 1 hour
const TEAM_MATCHES_TTL = 30 * 60;      // 30 minutes
const TEAM_DETAILS_TTL = 6 * 60 * 60;  // 6 hours
const SCORERS_TTL = 60 * 60;           // 1 hour

// Supported competition codes
export const SUPPORTED_COMPETITIONS = ['PL', 'PD', 'BL1', 'SA', 'FL1', 'CL', 'DED', 'ELC'] as const;
export type CompetitionCode = typeof SUPPORTED_COMPETITIONS[number];

/**
 * Make an authenticated request to football-data.org.
 */
async function fdFetch(path: string, apiKey: string): Promise<Response> {
  const res = await fetch(`${FD_BASE}${path}`, {
    headers: { 'X-Auth-Token': apiKey },
  });
  if (!res.ok) {
    throw new Error(`football-data.org ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res;
}

/**
 * Fetch upcoming matches across all supported competitions (next 7 days).
 */
export async function fetchUpcomingMatches(
  redis: Redis,
  env: Env
): Promise<FDMatch[]> {
  return getRedisOrFetch(redis, 'fd:matches:upcoming', async () => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dateFrom = now.toISOString().split('T')[0];
    const dateTo = weekFromNow.toISOString().split('T')[0];

    const res = await fdFetch(
      `/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      env.FOOTBALL_DATA_API_KEY
    );
    const data = await res.json() as FDMatchesResponse;
    // Filter to supported competitions only
    return data.matches.filter(m =>
      SUPPORTED_COMPETITIONS.includes(m.competition.code as CompetitionCode)
    );
  }, MATCHES_TTL);
}

/**
 * Fetch league standings for a competition.
 */
export async function fetchStandings(
  redis: Redis,
  env: Env,
  competitionCode: string
): Promise<FDStandingsResponse> {
  return getRedisOrFetch(redis, `fd:standings:${competitionCode}`, async () => {
    const res = await fdFetch(
      `/competitions/${competitionCode}/standings`,
      env.FOOTBALL_DATA_API_KEY
    );
    return res.json() as Promise<FDStandingsResponse>;
  }, STANDINGS_TTL);
}

/**
 * Fetch a team's recent finished matches (last 5).
 */
export async function fetchTeamRecentMatches(
  redis: Redis,
  env: Env,
  teamId: number
): Promise<FDMatch[]> {
  return getRedisOrFetch(redis, `fd:team:${teamId}:recent`, async () => {
    const res = await fdFetch(
      `/teams/${teamId}/matches?status=FINISHED&limit=5`,
      env.FOOTBALL_DATA_API_KEY
    );
    const data = await res.json() as FDMatchesResponse;
    return data.matches;
  }, TEAM_MATCHES_TTL);
}

/**
 * Fetch a single match by ID (for prediction resolution).
 */
export async function fetchMatch(
  env: Env,
  matchId: number
): Promise<FDMatch> {
  const res = await fdFetch(`/matches/${matchId}`, env.FOOTBALL_DATA_API_KEY);
  return res.json() as Promise<FDMatch>;
}

export async function fetchTeamDetails(
  redis: Redis,
  env: Env,
  teamId: number
): Promise<FDTeamResponse> {
  return getRedisOrFetch(redis, `fd:team:${teamId}:details`, async () => {
    const res = await fdFetch(`/teams/${teamId}`, env.FOOTBALL_DATA_API_KEY);
    return res.json() as Promise<FDTeamResponse>;
  }, TEAM_DETAILS_TTL);
}

export async function fetchCompetitionScorers(
  redis: Redis,
  env: Env,
  competitionCode: string,
  limit = 40
): Promise<FDScorer[]> {
  return getRedisOrFetch(redis, `fd:scorers:${competitionCode}:${limit}`, async () => {
    const res = await fdFetch(
      `/competitions/${competitionCode}/scorers?limit=${limit}`,
      env.FOOTBALL_DATA_API_KEY
    );
    const data = await res.json() as FDScorersResponse;
    return data.scorers ?? [];
  }, SCORERS_TTL);
}

/**
 * Build a StandardTeamContext from standings and recent match data.
 */
export function buildStandardTeamContext(
  teamId: number,
  standingsData: FDStandingsResponse,
  recentMatches: FDMatch[]
): StandardTeamContext {
  // Find the team in standings (use TOTAL table)
  const totalStanding = standingsData.standings.find(s => s.type === 'TOTAL');
  if (!totalStanding) throw new Error('No TOTAL standings found');

  const entry = totalStanding.table.find(e => e.team.id === teamId);
  if (!entry) throw new Error(`Team ${teamId} not found in standings`);

  // Build form from recent matches
  const recentResults = recentMatches
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, 5)
    .map(m => matchToRecentResult(m, teamId));

  const form = recentResults.map(r => r.result);

  // Also use the standings form if available
  const standingsForm = entry.form ? entry.form.split(',') : form;

  return {
    name: entry.team.name,
    leaguePosition: entry.position,
    totalTeams: totalStanding.table.length,
    points: entry.points,
    played: entry.playedGames,
    won: entry.won,
    drawn: entry.draw,
    lost: entry.lost,
    goalsFor: entry.goalsFor,
    goalsAgainst: entry.goalsAgainst,
    goalDifference: entry.goalDifference,
    form: standingsForm,
    formSummary: buildFormSummary(standingsForm),
    recentResults,
  };
}

/**
 * Build the full standard match context for a non-PL fixture.
 */
export async function buildStandardMatchContext(
  match: FDMatch,
  redis: Redis,
  env: Env
): Promise<StandardMatchContext> {
  // Fetch standings and recent matches for both teams in parallel
  const [standings, homeRecent, awayRecent] = await Promise.all([
    fetchStandings(redis, env, match.competition.code),
    fetchTeamRecentMatches(redis, env, match.homeTeam.id),
    fetchTeamRecentMatches(redis, env, match.awayTeam.id),
  ]);

  return {
    type: 'standard',
    fixture: {
      id: match.id,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      competition: match.competition.name,
      competitionCode: match.competition.code,
      matchDate: match.utcDate,
      matchday: match.matchday,
    },
    homeTeam: buildStandardTeamContext(match.homeTeam.id, standings, homeRecent),
    awayTeam: buildStandardTeamContext(match.awayTeam.id, standings, awayRecent),
  };
}

// ── Helpers ──

function matchToRecentResult(match: FDMatch, teamId: number): RecentResult {
  const isHome = match.homeTeam.id === teamId;
  const gf = isHome
    ? (match.score.fullTime.home ?? 0)
    : (match.score.fullTime.away ?? 0);
  const ga = isHome
    ? (match.score.fullTime.away ?? 0)
    : (match.score.fullTime.home ?? 0);

  return {
    opponent: isHome ? match.awayTeam.shortName : match.homeTeam.shortName,
    goalsFor: gf,
    goalsAgainst: ga,
    result: gf > ga ? 'W' : gf < ga ? 'L' : 'D',
    home: isHome,
  };
}

function buildFormSummary(form: string[]): string {
  const wins = form.filter(r => r === 'W').length;
  const draws = form.filter(r => r === 'D').length;
  const losses = form.filter(r => r === 'L').length;
  return `${wins}W ${draws}D ${losses}L in last ${form.length}`;
}
