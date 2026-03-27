// FPL API client
// Endpoints: bootstrap-static, fixtures, event/live
// All requests server-side (FPL API blocks CORS)

import type { FPLBootstrapResponse, FPLTeam, FPLPlayer, FPLFixture, FPLEvent } from '../types/fpl';
import type { FDPerson, FDScorer } from '../types/football-data';
import type { PLMatchContext, PLTeamContext, KeyPlayer, InjuryReport } from '../types/app';
import type { Env } from '../types/env';
import { getCachedOrFetch } from './cache';
import { fetchCompetitionScorers, fetchTeamDetails } from './football-data';
import { getFdIdByFplId, getFdIdByTeamName } from '../utils/team-aliases';

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
    .sort((a, b) => {
      if (b.goals_scored !== a.goals_scored) return b.goals_scored - a.goals_scored;
      if (b.assists !== a.assists) return b.assists - a.assists;

      const bInvolvements = parseFloat(b.expected_goal_involvements || '0');
      const aInvolvements = parseFloat(a.expected_goal_involvements || '0');
      if (bInvolvements !== aInvolvements) return bInvolvements - aInvolvements;

      const bForm = parseFloat(b.form || '0');
      const aForm = parseFloat(a.form || '0');
      if (bForm !== aForm) return bForm - aForm;

      return b.minutes - a.minutes;
    })
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
  kv: KVNamespace,
  env: Env
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
  const leaguePositions = computeLeaguePositions(allFixtures);

  const homeTeamContext = buildPLTeamContext(fixture.team_h, bootstrap, allFixtures, gameweek);
  const awayTeamContext = buildPLTeamContext(fixture.team_a, bootstrap, allFixtures, gameweek);

  homeTeamContext.leaguePosition = leaguePositions.get(fixture.team_h) ?? 0;
  awayTeamContext.leaguePosition = leaguePositions.get(fixture.team_a) ?? 0;

  await enrichPLPersonnel(homeTeamContext, awayTeamContext, fixture.team_h, fixture.team_a, kv, env);

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
    homeTeam: homeTeamContext,
    awayTeam: awayTeamContext,
  };
}

async function enrichPLPersonnel(
  homeTeamContext: PLTeamContext,
  awayTeamContext: PLTeamContext,
  homeFplTeamId: number,
  awayFplTeamId: number,
  kv: KVNamespace,
  env: Env
): Promise<void> {
  const homeFdTeamId = getFdIdByFplId(homeFplTeamId) ?? getFdIdByTeamName(homeTeamContext.name);
  const awayFdTeamId = getFdIdByFplId(awayFplTeamId) ?? getFdIdByTeamName(awayTeamContext.name);

  if (!homeFdTeamId || !awayFdTeamId) {
    return;
  }

  const [homeTeamDetails, awayTeamDetails, scorers] = await Promise.all([
    fetchTeamDetails(kv, env, homeFdTeamId).catch(() => null),
    fetchTeamDetails(kv, env, awayFdTeamId).catch(() => null),
    fetchCompetitionScorers(kv, env, 'PL').catch(() => [] as FDScorer[]),
  ]);

  const homeSquad = homeTeamDetails?.squad ?? [];
  const awaySquad = awayTeamDetails?.squad ?? [];

  homeTeamContext.keyPlayers = selectPreferredKeyPlayers(
    homeTeamContext.keyPlayers,
    homeSquad,
    scorers,
    homeFdTeamId
  );
  awayTeamContext.keyPlayers = selectPreferredKeyPlayers(
    awayTeamContext.keyPlayers,
    awaySquad,
    scorers,
    awayFdTeamId
  );

  homeTeamContext.injuries = filterInjuriesByCurrentSquad(homeTeamContext.injuries, homeSquad);
  awayTeamContext.injuries = filterInjuriesByCurrentSquad(awayTeamContext.injuries, awaySquad);
}

function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function playerPositionFromSquad(position: string | null): string {
  if (!position) return 'UNK';
  const upper = position.toUpperCase();
  if (upper.includes('GOALKEEPER')) return 'GK';
  if (upper.includes('DEF')) return 'DEF';
  if (upper.includes('MID')) return 'MID';
  if (upper.includes('ATT') || upper.includes('FORWARD') || upper.includes('STRIKER')) return 'FWD';
  return 'UNK';
}

export function selectPreferredKeyPlayers(
  fallbackPlayers: KeyPlayer[],
  squad: FDPerson[],
  scorers: FDScorer[],
  fdTeamId: number
): KeyPlayer[] {
  const fallbackByName = new Map(fallbackPlayers.map((player) => [normalizeName(player.name), player]));
  const squadByName = new Map(squad.map((person) => [normalizeName(person.name), person]));

  const prolificEntries = scorers
    .filter((entry) => entry.team.id === fdTeamId)
    .sort((a, b) => {
      const goalDiff = (b.goals ?? 0) - (a.goals ?? 0);
      if (goalDiff !== 0) return goalDiff;
      return (b.assists ?? 0) - (a.assists ?? 0);
    });
  const prolificNames = prolificEntries.map((entry) => entry.player.name);

  const captain = squad.find((person) => /captain/i.test(person.role ?? ''));

  const candidateNames: string[] = [];
  if (captain?.name) {
    candidateNames.push(captain.name);
  }
  candidateNames.push(...prolificNames);

  const uniqueNames: string[] = [];
  const seen = new Set<string>();
  for (const name of candidateNames) {
    const key = normalizeName(name);
    if (!key || seen.has(key)) continue;
    if (squadByName.size > 0 && !squadByName.has(key)) continue;
    seen.add(key);
    uniqueNames.push(name);
  }

  const selected: KeyPlayer[] = uniqueNames.slice(0, 5).map((name) => {
    const key = normalizeName(name);
    const fallback = fallbackByName.get(key);
    if (fallback) return fallback;

    const scorer = prolificEntries.find((entry) => normalizeName(entry.player.name) === key);
    const squadMember = squadByName.get(key);

    return {
      name,
      position: playerPositionFromSquad(squadMember?.position ?? null),
      form: 0,
      goals: scorer?.goals ?? 0,
      assists: scorer?.assists ?? 0,
      xG: 0,
      xA: 0,
      minutes: 0,
      status: 'available',
    };
  });

  if (selected.length > 0) {
    return selected;
  }

  if (squadByName.size > 0) {
    return fallbackPlayers
      .filter((player) => squadByName.has(normalizeName(player.name)))
      .slice(0, 5);
  }

  return fallbackPlayers;
}

export function filterInjuriesByCurrentSquad(injuries: InjuryReport[], squad: FDPerson[]): InjuryReport[] {
  if (squad.length === 0) {
    return injuries;
  }

  const squadNames = new Set(squad.map((person) => normalizeName(person.name)));
  const seen = new Set<string>();

  return injuries.filter((injury) => {
    const key = normalizeName(injury.player);
    if (!squadNames.has(key)) {
      return false;
    }
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function computeLeaguePositions(fixtures: FPLFixture[]): Map<number, number> {
  const table = new Map<number, { points: number; goalDifference: number; goalsFor: number }>();

  for (const fixture of fixtures) {
    if (!fixture.finished) {
      continue;
    }

    const homeGoals = fixture.team_h_score ?? 0;
    const awayGoals = fixture.team_a_score ?? 0;

    if (!table.has(fixture.team_h)) {
      table.set(fixture.team_h, { points: 0, goalDifference: 0, goalsFor: 0 });
    }
    if (!table.has(fixture.team_a)) {
      table.set(fixture.team_a, { points: 0, goalDifference: 0, goalsFor: 0 });
    }

    const homeRow = table.get(fixture.team_h)!;
    const awayRow = table.get(fixture.team_a)!;

    homeRow.goalsFor += homeGoals;
    awayRow.goalsFor += awayGoals;
    homeRow.goalDifference += homeGoals - awayGoals;
    awayRow.goalDifference += awayGoals - homeGoals;

    if (homeGoals > awayGoals) {
      homeRow.points += 3;
    } else if (homeGoals < awayGoals) {
      awayRow.points += 3;
    } else {
      homeRow.points += 1;
      awayRow.points += 1;
    }
  }

  const sorted = [...table.entries()].sort((a, b) => {
    const aStats = a[1];
    const bStats = b[1];
    if (bStats.points !== aStats.points) return bStats.points - aStats.points;
    if (bStats.goalDifference !== aStats.goalDifference) return bStats.goalDifference - aStats.goalDifference;
    if (bStats.goalsFor !== aStats.goalsFor) return bStats.goalsFor - aStats.goalsFor;
    return a[0] - b[0];
  });

  const positions = new Map<number, number>();
  sorted.forEach(([teamId], index) => {
    positions.set(teamId, index + 1);
  });

  return positions;
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
