// Cron: Weekly FPL snapshot — runs Monday 2am UTC ("0 2 * * 1")
// 1. Fetches FPL bootstrap-static (teams + players + events)
// 2. Writes gameweek_snapshots for all 20 PL teams
// 3. Writes player_snapshots for all players with ≥1 minute
// 4. Upserts historical_results for finished gameweek fixtures

import type { Env } from '../types/env';

const FPL_BASE = 'https://fantasy.premierleague.com/api';
const POSITION_MAP: Record<number, string> = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };

interface FPLBootstrap {
  events: { id: number; is_current: boolean; is_next: boolean; finished: boolean }[];
  teams: {
    id: number; name: string; short_name: string;
    strength_overall_home: number; strength_overall_away: number;
    strength_attack_home: number; strength_attack_away: number;
    strength_defence_home: number; strength_defence_away: number;
    form: string | null;
  }[];
  elements: {
    id: number; team: number; element_type: number; web_name: string;
    minutes: number; goals_scored: number; assists: number;
    expected_goals: string; expected_assists: string;
    chance_of_playing_this_round: number | null;
    status: string; news: string;
  }[];
}

interface FPLFixture {
  id: number; event: number | null;
  team_h: number; team_a: number;
  team_h_score: number | null; team_a_score: number | null;
  finished: boolean; kickoff_time: string | null;
  team_h_difficulty: number; team_a_difficulty: number;
}

/**
 * Run the weekly FPL data snapshot.
 * Called by the scheduled() handler in index.ts.
 */
export async function runFplSnapshot(env: Env): Promise<void> {
  console.log('[fplSnapshot] Starting FPL snapshot...');

  // Fetch bootstrap and all fixtures in parallel
  const [bootstrap, allFixtures] = await Promise.all([
    fetchBootstrap(),
    fetchAllFixtures(),
  ]);

  const currentEvent = bootstrap.events.find(e => e.is_current);
  if (!currentEvent) {
    console.warn('[fplSnapshot] No current event found, aborting.');
    return;
  }

  const gw = currentEvent.id;
  const season = deriveSeason();
  const now = Math.floor(Date.now() / 1000);

  console.log(`[fplSnapshot] Snapshotting GW${gw} (${season})`);

  // 1. Gameweek snapshots (one row per team)
  const teamInserts = bootstrap.teams.map(team =>
    env.DB.prepare(`
      INSERT OR REPLACE INTO gameweek_snapshots
        (gameweek, season, team_id, strength_overall_home, strength_overall_away,
         strength_attack_home, strength_attack_away, strength_defence_home, strength_defence_away,
         form, captured_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      gw, season, String(team.id),
      team.strength_overall_home, team.strength_overall_away,
      team.strength_attack_home, team.strength_attack_away,
      team.strength_defence_home, team.strength_defence_away,
      team.form ? parseFloat(team.form) : null,
      now,
    )
  );

  await env.DB.batch(teamInserts);
  console.log(`[fplSnapshot] Wrote ${teamInserts.length} gameweek_snapshots`);

  // 2. Player snapshots (players with ≥ 45 minutes this season)
  const activePlayers = bootstrap.elements.filter(p => p.minutes >= 45);
  const playerInserts = activePlayers.map(p =>
    env.DB.prepare(`
      INSERT OR REPLACE INTO player_snapshots
        (gameweek, season, player_id, team_id, web_name, minutes, goals, assists,
         xg, xa, chance_of_playing, status, news, captured_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      gw, season, p.id, String(p.team), p.web_name,
      p.minutes, p.goals_scored, p.assists,
      parseFloat(p.expected_goals || '0'),
      parseFloat(p.expected_assists || '0'),
      p.chance_of_playing_this_round,
      p.status || null,
      sanitizeNews(p.news),
      now,
    )
  );

  // D1 batch limit is 100 — chunk if needed
  for (let i = 0; i < playerInserts.length; i += 100) {
    await env.DB.batch(playerInserts.slice(i, i + 100));
  }
  console.log(`[fplSnapshot] Wrote ${playerInserts.length} player_snapshots`);

  // 3. Historical results — upsert finished fixtures for this GW
  const gwFixtures = allFixtures.filter(f => f.event === gw && f.finished);
  if (gwFixtures.length > 0) {
    const teamMap = new Map(bootstrap.teams.map(t => [t.id, t]));
    const resultInserts = gwFixtures
      .filter(f => f.team_h_score !== null && f.team_a_score !== null)
      .map(f => {
        const kickoffTs = f.kickoff_time
          ? Math.floor(new Date(f.kickoff_time).getTime() / 1000)
          : now;
        return env.DB.prepare(`
          INSERT OR IGNORE INTO historical_results
            (home_team_id, away_team_id, home_goals, away_goals, match_date, season, league, gameweek)
          VALUES (?, ?, ?, ?, ?, ?, 'PL', ?)
        `).bind(
          String(f.team_h), String(f.team_a),
          f.team_h_score!, f.team_a_score!,
          kickoffTs, season, gw,
        );
      });

    if (resultInserts.length > 0) {
      await env.DB.batch(resultInserts);
      console.log(`[fplSnapshot] Wrote ${resultInserts.length} historical_results`);
    }
  }

  console.log('[fplSnapshot] Complete.');
}

// ── Helpers ──

async function fetchBootstrap(): Promise<FPLBootstrap> {
  const res = await fetch(`${FPL_BASE}/bootstrap-static/`, {
    headers: { 'User-Agent': 'Gaff3r/1.0' },
  });
  if (!res.ok) throw new Error(`FPL bootstrap failed: ${res.status}`);
  return res.json() as Promise<FPLBootstrap>;
}

async function fetchAllFixtures(): Promise<FPLFixture[]> {
  const res = await fetch(`${FPL_BASE}/fixtures/`, {
    headers: { 'User-Agent': 'Gaff3r/1.0' },
  });
  if (!res.ok) throw new Error(`FPL fixtures failed: ${res.status}`);
  return res.json() as Promise<FPLFixture[]>;
}

/** Derive the current PL season string e.g. "2024-25". */
function deriveSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  // PL season starts August — if before August, we're in the previous season
  const startYear = month >= 8 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(2)}`;
}

/** Strip HTML and limit news field length before storing. */
function sanitizeNews(news: string | undefined): string | null {
  if (!news) return null;
  return news.replace(/<[^>]+>/g, '').slice(0, 200) || null;
}
