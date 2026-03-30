// Cron: Hourly match context pre-warm — runs every hour ("0 * * * *")
// Pre-builds and caches match-context:{fixtureId}:{gw} for all upcoming PL fixtures
// so users always hit warm cache instead of the cold ~4s path.

import type { Env } from '../types/env';
import { createRedisClient } from '../services/redis';
import { fetchBootstrap, fetchFixtures, getCurrentGameweek } from '../services/fpl';
import { fetchMatchContext } from '../services/match-context';
import { log } from '../utils/logger';

export async function runWarmMatchContext(env: Env): Promise<void> {
  const redis = createRedisClient(env);

  // Fetch bootstrap + current GW
  const [, gwInfo] = await Promise.all([
    fetchBootstrap(redis),
    getCurrentGameweek(redis),
  ]);
  const currentGw = gwInfo.current;

  const gwFixtures = await fetchFixtures(redis, currentGw);

  // Only upcoming (not yet finished) PL fixtures in this GW need warming
  const upcoming = gwFixtures.filter(f => !f.finished);

  if (upcoming.length === 0) {
    log('cron_completed', { gw: currentGw, warmed: 0, message: 'No upcoming fixtures' });
    return;
  }

  // Check which keys are already cached to avoid redundant work
  const cacheKeys = upcoming.map(f => `match-context:${f.id}:${currentGw}`);
  const existsResults = await Promise.all(cacheKeys.map(key => redis.exists(key)));

  const missing = upcoming.filter((_, i) => existsResults[i] === 0);

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
