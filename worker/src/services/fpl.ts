// FPL API client
// Endpoints: bootstrap-static, fixtures, event/live
// All requests server-side (FPL API blocks CORS)

import type { FPLBootstrapResponse, FPLTeam, FPLPlayer, FPLFixture, FPLEvent } from '../types/fpl';
import type { PLMatchContext, PLTeamContext, KeyPlayer, InjuryReport } from '../types/app';
import { getCachedOrFetch } from './cache';

const FPL_BASE = 'https://fantasy.premierleague.com/api';

// Cache TTLs in seconds
const BOOTSTRAP_TTL = 6 * 60 * 60;    // 6 hours
const FIXTURES_TTL = 30 * 60;          // 30 minutes

/**
 * Fetch the bootstrap-static endpoint (teams, players, events).
 * This is the main FPL data source — ~4MB raw, cached aggressively.
 */
export async function fetchBootstrap(kv: KVNamespace): Promise<FPLBootstrapResponse> {
  return getCachedOrFetch(kv, 'fpl:bootstrap', async () => {
    const res = await fetch(`${FPL_BASE}/bootstrap-static/`);
    if (!res.ok) throw new Error(`FPL bootstrap failed: ${res.status}`);
    return res.json() as Promise<FPLBootstrapResponse>;
  }, BOOTSTRAP_TTL);
}

/**
 * Fetch fixtures for a specific gameweek.
 */
export async function fetchFixtures(kv: KVNamespace, gameweek: number): Promise<FPLFixture[]> {
  return getCachedOrFetch(kv, `fpl:fixtures:${gameweek}`, async () => {
    const res = await fetch(`${FPL_BASE}/fixtures/?event=${gameweek}`);
    if (!res.ok) throw new Error(`FPL fixtures failed: ${res.status}`);
    return res.json() as Promise<FPLFixture[]>;
  }, FIXTURES_TTL);
}

/**
 * Derive current and next gameweek from bootstrap events.
 */
export async function getCurrentGameweek(kv: KVNamespace): Promise<{
  current: number;
  next: number;
  nextDeadline: string;
}> {
  const bootstrap = await fetchBootstrap(kv);
  const events = bootstrap.events;

  const current = events.find(e => e.is_current);
  const next = events.find(e => e.is_next);

  return {
    current: current?.id ?? 1,
    next: next?.id ?? (current ? current.id + 1 : 2),
    nextDeadline: next?.deadline_time ?? '',
  };
}

// Position map for FPL element_type
const POSITION_MAP: Record<number, string> = {
  1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD',
};

/**
 * Build a rich PL team context from FPL data.
 * Includes key players (top 5 by form), injuries, strength ratings, recent form.
 */
export function buildPLTeamContext(
  teamId: number,
  bootstrap: FPLBootstrapResponse,
  fixtures: FPLFixture[],
  gameweek: number
): PLTeamContext {
  const team = bootstrap.teams.find(t => t.id === teamId);
  if (!team) throw new Error(`FPL team ${teamId} not found`);

  // Get all players for this team
  const teamPlayers = bootstrap.elements.filter(p => p.team === teamId);

  // Key players: top 5 outfield players by form (exclude GKs unless exceptional)
  const keyPlayers = getKeyPlayers(teamPlayers);

  // Injuries: players with status != 'a' (available)
  const injuries = getInjuries(teamPlayers);

  // Form from recent fixtures
  const recentFixtures = getRecentResults(teamId, fixtures, bootstrap.teams);
  const form = recentFixtures.map(r => r.result);
  const formSummary = buildFormSummary(form);

  // Standings-like stats from fixtures (all GWs up to current)
  const stats = computeTeamStats(teamId, fixtures);

  return {
    name: team.name,
    leaguePosition: 0, // Will be set externally if needed — FPL doesn't provide directly
    points: stats.points,
    played: stats.played,
    won: stats.won,
    drawn: stats.drawn,
    lost: stats.lost,
    goalsFor: stats.goalsFor,
    goalsAgainst: stats.goalsAgainst,
    goalDifference: stats.goalsFor - stats.goalsAgainst,
    strength: {
      overall: team.strength,
      attackHome: team.strength_attack_home,
      attackAway: team.strength_attack_away,
      defenceHome: team.strength_defence_home,
      defenceAway: team.strength_defence_away,
    },
    form,
    formSummary,
    recentResults: recentFixtures,
    keyPlayers,
    injuries,
  };
}

function getKeyPlayers(players: FPLPlayer[]): KeyPlayer[] {
  return players
    .filter(p => p.minutes > 0) // Only players with minutes
    .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
    .slice(0, 5)
    .map(p => ({
      name: p.web_name,
      position: POSITION_MAP[p.element_type] ?? 'UNK',
      form: parseFloat(p.form),
      goals: p.goals_scored,
      assists: p.assists,
      xG: parseFloat(p.expected_goals),
      xA: parseFloat(p.expected_assists),
      minutes: p.minutes,
      status: mapPlayerStatus(p.status),
    }));
}

function getInjuries(players: FPLPlayer[]): InjuryReport[] {
  return players
    .filter(p => p.status !== 'a' && p.news)
    .map(p => ({
      player: p.web_name,
      status: mapPlayerStatus(p.status),
      news: p.news,
      chanceOfPlaying: p.chance_of_playing_next_round,
    }));
}

function mapPlayerStatus(status: string): 'available' | 'injured' | 'doubtful' | 'suspended' {
  switch (status) {
    case 'a': return 'available';
    case 'd': return 'doubtful';
    case 'i': return 'injured';
    case 'u': return 'injured'; // unavailable treated as injured
    case 's': return 'suspended';
    default: return 'available';
  }
}

interface RecentResult {
  opponent: string;
  goalsFor: number;
  goalsAgainst: number;
  result: string; // W, D, L
  home: boolean;
}

function getRecentResults(
  teamId: number,
  fixtures: FPLFixture[],
  teams: FPLTeam[]
): RecentResult[] {
  const teamMap = new Map(teams.map(t => [t.id, t.short_name]));

  return fixtures
    .filter(f => f.finished && (f.team_h === teamId || f.team_a === teamId))
    .sort((a, b) => b.event - a.event) // Most recent first
    .slice(0, 5)
    .map(f => {
      const isHome = f.team_h === teamId;
      const gf = isHome ? (f.team_h_score ?? 0) : (f.team_a_score ?? 0);
      const ga = isHome ? (f.team_a_score ?? 0) : (f.team_h_score ?? 0);
      const opponentId = isHome ? f.team_a : f.team_h;

      return {
        opponent: teamMap.get(opponentId) ?? 'UNK',
        goalsFor: gf,
        goalsAgainst: ga,
        result: gf > ga ? 'W' : gf < ga ? 'L' : 'D',
        home: isHome,
      };
    });
}

function buildFormSummary(form: string[]): string {
  const wins = form.filter(r => r === 'W').length;
  const draws = form.filter(r => r === 'D').length;
  const losses = form.filter(r => r === 'L').length;
  return `${wins}W ${draws}D ${losses}L in last ${form.length}`;
}

function computeTeamStats(teamId: number, fixtures: FPLFixture[]) {
  let played = 0, won = 0, drawn = 0, lost = 0, goalsFor = 0, goalsAgainst = 0;

  for (const f of fixtures) {
    if (!f.finished) continue;
    if (f.team_h !== teamId && f.team_a !== teamId) continue;

    played++;
    const isHome = f.team_h === teamId;
    const gf = isHome ? (f.team_h_score ?? 0) : (f.team_a_score ?? 0);
    const ga = isHome ? (f.team_a_score ?? 0) : (f.team_h_score ?? 0);
    goalsFor += gf;
    goalsAgainst += ga;
    if (gf > ga) won++;
    else if (gf < ga) lost++;
    else drawn++;
  }

  return {
    played, won, drawn, lost, goalsFor, goalsAgainst,
    points: won * 3 + drawn,
  };
}

/**
 * Build the full PL match context for a fixture.
 */
export async function buildPLMatchContext(
  fixtureId: number,
  gameweek: number,
  kv: KVNamespace
): Promise<PLMatchContext> {
  const [bootstrap, gwFixtures] = await Promise.all([
    fetchBootstrap(kv),
    fetchFixtures(kv, gameweek),
  ]);

  const fixture = gwFixtures.find(f => f.id === fixtureId);
  if (!fixture) throw new Error(`Fixture ${fixtureId} not found in GW ${gameweek}`);

  const homeTeam = bootstrap.teams.find(t => t.id === fixture.team_h);
  const awayTeam = bootstrap.teams.find(t => t.id === fixture.team_a);
  if (!homeTeam || !awayTeam) throw new Error('Teams not found in bootstrap');

  // Fetch ALL fixtures for the season to compute standings + recent form
  const allFixtures = await getAllSeasonFixtures(kv, bootstrap.events);

  return {
    type: 'pl',
    fixture: {
      id: fixture.id,
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      competition: 'Premier League',
      matchDate: fixture.kickoff_time,
      matchday: gameweek,
    },
    fplDifficulty: {
      home: fixture.team_h_difficulty,
      away: fixture.team_a_difficulty,
    },
    homeTeam: buildPLTeamContext(fixture.team_h, bootstrap, allFixtures, gameweek),
    awayTeam: buildPLTeamContext(fixture.team_a, bootstrap, allFixtures, gameweek),
  };
}

/**
 * Fetch all finished fixtures across the season for standings computation.
 */
async function getAllSeasonFixtures(kv: KVNamespace, events: FPLEvent[]): Promise<FPLFixture[]> {
  const finishedGWs = events.filter(e => e.finished || e.is_current);
  const allFixtures: FPLFixture[] = [];

  // Fetch up to all finished GWs. We batch this via Promise.all.
  const batches = finishedGWs.map(e => fetchFixtures(kv, e.id));
  const results = await Promise.all(batches);
  for (const gwFixtures of results) {
    allFixtures.push(...gwFixtures);
  }

  return allFixtures;
}
