// Cron: Hourly match context pre-warm — runs every hour ("0 * * * *")
// Pre-builds and caches match-context:{fixtureId}:{gw} for all upcoming PL fixtures
// so users always hit warm cache instead of the cold ~4s path.

import type { Env } from '../types/env';
import { createRedisClient, mgetPipeline } from '../services/redis';
import { fetchBootstrap, fetchFixtures, getSeasonFixtures, getCurrentGameweek } from '../services/fpl';
import { fetchCompetitionScorers, fetchTeamDetails } from '../services/football-data';
import { fetchMatchContext } from '../services/match-context';
import { getFdIdByFplId, getFdIdByTeamName } from '../utils/team-aliases';
import { deriveSeason } from '../utils/season';
import { log } from '../utils/logger';

export async function runWarmMatchContext(env: Env): Promise<void> {
  const redis = createRedisClient(env);

  // ── Pre-warm shared dependency keys ────────────────────────────────
  // These have 1–6h TTLs. When warm, each is a single Redis GET (~1 command).
  // When cold, the fetcher fires and caches the result — all subsequent
  // fixture builds in this cron run (and user requests) hit warm cache.
  const [bootstrap, gwInfo] = await Promise.all([
    fetchBootstrap(redis),
    getCurrentGameweek(redis),
  ]);
  const currentGw = gwInfo.current;

  const [gwFixtures] = await Promise.all([
    fetchFixtures(redis, currentGw),
    // Season fixtures (D1 → FPL fallback) and PL scorers — warm in parallel.
    // These are the two slowest cold calls and have independent cache keys.
    getSeasonFixtures(env.DB, redis, deriveSeason()),
    fetchCompetitionScorers(redis, env, 'PL').catch(() => []),
  ]);

  // Pre-warm FD team detail keys for all upcoming fixture teams.
  // Only 20 PL teams exist — deduplication avoids redundant fetches.
  const upcoming = gwFixtures.filter(f => !f.finished);

  if (upcoming.length > 0) {
    const fdTeamIds = new Set<number>();
    for (const f of upcoming) {
      const homeTeam = bootstrap.teams.find(t => t.id === f.team_h);
      const awayTeam = bootstrap.teams.find(t => t.id === f.team_a);
      const homeFd = getFdIdByFplId(f.team_h) ?? (homeTeam ? getFdIdByTeamName(homeTeam.name) : undefined);
      const awayFd = getFdIdByFplId(f.team_a) ?? (awayTeam ? getFdIdByTeamName(awayTeam.name) : undefined);
      if (homeFd) fdTeamIds.add(homeFd);
      if (awayFd) fdTeamIds.add(awayFd);
    }
    // Parallel fan-out — each call is a Redis GET on hit, HTTP+SET on miss.
    await Promise.allSettled(
      [...fdTeamIds].map(id => fetchTeamDetails(redis, env, id))
    );
  }

  // ── Warm individual match-context keys ─────────────────────────────
  if (upcoming.length === 0) {
    log('cron_completed', { gw: currentGw, warmed: 0, message: 'No upcoming fixtures' });
    return;
  }

  // Check which keys are already cached — single pipeline HTTP request instead of N parallel EXISTS calls
  const cacheKeys = upcoming.map(f => `match-context:${f.id}:${currentGw}`);
  const cachedValues = await mgetPipeline(redis, cacheKeys);
  const missing = upcoming.filter((_, i) => cachedValues[i] === null);

  log('cron_started', {
    gw: currentGw,
    total: upcoming.length,
    alreadyWarm: upcoming.length - missing.length,
    toWarm: missing.length,
  });

  if (missing.length === 0) return;

  // Warm all missing fixtures in parallel — buildPLMatchContext caches the result via getRedisOrFetch
  const results = await Promise.allSettled(
    missing.map(fixture =>
      fetchMatchContext('PL', fixture.id, currentGw, redis, env)
    )
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  for (const [i, result] of results.entries()) {
    if (result.status === 'rejected') {
      log('cron_started', {
        fixtureId: missing[i].id,
        error: String((result as PromiseRejectedResult).reason),
      }, 'warn');
    }
  }

  log('cron_completed', { gw: currentGw, succeeded, failed });
}
