// GET /api/fixtures/:gw — fixture list for a gameweek
// GET /api/gameweek/current — current + next GW IDs
// GET /api/fixtures/upcoming — upcoming fixtures across all competitions

import type { Env } from '../types/env';
import type { FixtureItem, FixturesResponse, GameweekResponse } from '../types/api';
import { getCurrentGameweek, fetchFixtures, fetchBootstrap } from '../services/fpl';
import { fetchUpcomingMatches } from '../services/football-data';

/**
 * GET /api/gameweek/current
 * Returns current + next GW IDs.
 */
export async function handleGetGameweek(env: Env): Promise<Response> {
  const gw = await getCurrentGameweek(env.FPL_CACHE);

  const body: GameweekResponse = {
    current: gw.current,
    next: gw.next,
    nextDeadline: gw.nextDeadline,
  };

  return json(body);
}

/**
 * GET /api/fixtures/:gw
 * Returns PL fixtures for a gameweek + non-PL upcoming fixtures.
 */
export async function handleGetFixtures(gameweek: number, env: Env): Promise<Response> {
  const [fplFixtures, bootstrap] = await Promise.all([
    fetchFixtures(env.FPL_CACHE, gameweek),
    fetchBootstrap(env.FPL_CACHE),
  ]);

  const teamMap = new Map(bootstrap.teams.map(t => [t.id, t]));

  const fixtures: FixtureItem[] = fplFixtures.map(f => {
    const home = teamMap.get(f.team_h);
    const away = teamMap.get(f.team_a);
    return {
      id: f.id,
      homeTeam: home?.name ?? `Team ${f.team_h}`,
      awayTeam: away?.name ?? `Team ${f.team_a}`,
      homeTeamId: f.team_h,
      awayTeamId: f.team_a,
      homeTeamShortName: home?.short_name,
      awayTeamShortName: away?.short_name,
      kickoffTime: f.kickoff_time,
      homeDifficulty: f.team_h_difficulty,
      awayDifficulty: f.team_a_difficulty,
      finished: f.finished,
      homeScore: f.team_h_score,
      awayScore: f.team_a_score,
      competition: 'Premier League',
      competitionCode: 'PL',
    };
  });

  const body: FixturesResponse = { gameweek, fixtures };
  return json(body);
}

/**
 * GET /api/fixtures/upcoming
 * Returns upcoming fixtures across all competitions (next 7 days).
 */
export async function handleGetUpcoming(env: Env): Promise<Response> {
  const [plGw, fdMatches] = await Promise.all([
    getCurrentGameweek(env.FPL_CACHE),
    fetchUpcomingMatches(env.FPL_CACHE, env),
  ]);

  // Get PL fixtures for current GW
  const [fplFixtures, bootstrap] = await Promise.all([
    fetchFixtures(env.FPL_CACHE, plGw.current),
    fetchBootstrap(env.FPL_CACHE),
  ]);

  const teamMap = new Map(bootstrap.teams.map(t => [t.id, t]));

  // PL fixtures
  const plFixtures: FixtureItem[] = fplFixtures
    .filter(f => !f.finished) // Only upcoming
    .map(f => ({
      id: f.id,
      homeTeam: teamMap.get(f.team_h)?.name ?? `Team ${f.team_h}`,
      awayTeam: teamMap.get(f.team_a)?.name ?? `Team ${f.team_a}`,
      homeTeamId: f.team_h,
      awayTeamId: f.team_a,
      homeTeamShortName: teamMap.get(f.team_h)?.short_name,
      awayTeamShortName: teamMap.get(f.team_a)?.short_name,
      kickoffTime: f.kickoff_time,
      homeDifficulty: f.team_h_difficulty,
      awayDifficulty: f.team_a_difficulty,
      finished: false,
      homeScore: null,
      awayScore: null,
      competition: 'Premier League',
      competitionCode: 'PL',
    }));

  // Non-PL fixtures from football-data.org (exclude PL to avoid duplicates)
  const otherFixtures: FixtureItem[] = fdMatches
    .filter(m => m.competition.code !== 'PL' && m.status !== 'FINISHED')
    .map(m => ({
      id: m.id,
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      homeTeamId: m.homeTeam.id,
      awayTeamId: m.awayTeam.id,
      homeTeamShortName: m.homeTeam.shortName,
      awayTeamShortName: m.awayTeam.shortName,
      kickoffTime: m.utcDate,
      homeDifficulty: 0,
      awayDifficulty: 0,
      finished: false,
      homeScore: null,
      awayScore: null,
      competition: m.competition.name,
      competitionCode: m.competition.code,
    }));

  const fixtures = [...plFixtures, ...otherFixtures]
    .sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime());

  return json({ fixtures });
}

// ── Helpers ──

function json(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}
