// Upstash Redis client + cache helpers
// HTTP-based — native to Cloudflare Workers (no TCP connections needed)
// Replaces the KV-backed getCachedOrFetch pattern with sub-5ms Redis reads.

import { Redis } from '@upstash/redis/cloudflare';
import type { Env } from '../types/env';

export type { Redis };

/**
 * Create an Upstash Redis client from Worker env secrets.
 * Must be called inside a request handler — env is not available at module scope.
 */
export function createRedisClient(env: Env): Redis {
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Read from Redis cache; on miss call fetcher(), store result with TTL, return it.
 * Native Redis TTL replaces the CachedValue metadata wrapper used with KV.
 *
 * Redis failures are non-fatal: if GET throws (missing credentials, network error,
 * oversized value) we fall through to the fetcher so the app keeps working.
 * SET failures are logged so they're visible in CF observability logs.
 */
export async function getRedisOrFetch<T>(
  redis: Redis,
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  try {
    const cached = await redis.get<T>(key);
    if (cached !== null) return cached;
  } catch (err) {
    // Redis unavailable, bad credentials, or network error — serve uncached
    console.warn(`[redis] GET ${key} failed, proceeding without cache:`, String(err));
  }

  const data = await fetcher();

  try {
    await redis.set(key, data, { ex: ttlSeconds });
  } catch (err) {
    // SET failures are non-fatal but indicate a problem worth investigating.
    // Common cause: value exceeds Upstash REST 1MB limit.
    // fpl:bootstrap is slimmed before storage (~150KB) and should always succeed.
    console.warn(`[redis] SET ${key} failed (value may exceed size limit):`, String(err));
  }

  return data;
}

/**
 * Invalidate a single cache key.
 */
export async function invalidateRedisKey(redis: Redis, key: string): Promise<void> {
  await redis.del(key);
}

/**
 * Fixed-window rate limiter using INCR + EXPIRE.
 * Uses 2 Redis commands on the first request in a window, 1 command on subsequent ones.
 * Fails open — if Redis is unavailable the request is allowed through.
 *
 * @param key   e.g. 'ratelimit:chat:{userId}'
 * @param limit max requests allowed in the window
 * @param windowSeconds rolling window duration
 * @returns { allowed, remaining, resetInSeconds }
 */
export async function checkRateLimit(
  redis: Redis,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; resetInSeconds: number }> {
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      // First request in this window — stamp the expiry
      await redis.expire(key, windowSeconds);
    }
    const ttl = count === 1 ? windowSeconds : await redis.ttl(key);
    const remaining = Math.max(0, limit - count);
    return { allowed: count <= limit, remaining, resetInSeconds: ttl };
  } catch {
    // Fail open — don't block users due to Redis issues
    return { allowed: true, remaining: limit, resetInSeconds: windowSeconds };
  }
}

/**
 * Fetch multiple keys in one pipeline round-trip (1 HTTP request instead of N).
 * Returns results in key order; null for cache misses.
 */
export async function mgetPipeline<T>(redis: Redis, keys: string[]): Promise<(T | null)[]> {
  if (keys.length === 0) return [];
  const pipeline = redis.pipeline();
  for (const key of keys) {
    pipeline.get<T>(key);
  }
  const results = await pipeline.exec();
  return results as (T | null)[];
}

// ── Stale-While-Revalidate cache ──────────────────────────────────────

interface SWREnvelope<T> {
  data: T;
  cachedAt: number; // epoch ms
}

/**
 * Stale-while-revalidate cache wrapper.
 *
 * - Within softTTL: return cached data immediately (hot path — 1 Redis GET).
 * - Between softTTL and hardTTL: return stale data AND kick off a background
 *   revalidation via ctx.waitUntil() so the next request is fresh.
 * - Beyond hardTTL or no data: fetch synchronously (cold path — same as getRedisOrFetch).
 *
 * Same Redis command count as getRedisOrFetch — only changes WHEN the SET fires.
 * The envelope adds ~30 bytes overhead per stored value.
 */
export async function getRedisOrFetchSWR<T>(
  redis: Redis,
  key: string,
  fetcher: () => Promise<T>,
  softTtlSeconds: number,
  hardTtlSeconds: number,
  ctx?: { waitUntil: (promise: Promise<unknown>) => void },
): Promise<T> {
  try {
    const envelope = await redis.get<SWREnvelope<T>>(key);
    if (envelope?.data !== undefined && envelope?.cachedAt) {
      const ageMs = Date.now() - envelope.cachedAt;
      if (ageMs < softTtlSeconds * 1000) {
        // Hot path — data is fresh
        return envelope.data;
      }
      // Stale but within hard TTL — serve stale, revalidate in background
      if (ctx) {
        ctx.waitUntil(
          fetcher().then(fresh =>
            redis.set(key, { data: fresh, cachedAt: Date.now() } satisfies SWREnvelope<T>, { ex: hardTtlSeconds }).catch(() => {})
          ).catch(() => {})
        );
      }
      return envelope.data;
    }
  } catch {
    // Redis unavailable — fall through to fetcher
  }

  // Cold path — no cached data (or past hard TTL / Redis failure)
  const data = await fetcher();
  try {
    await redis.set(key, { data, cachedAt: Date.now() } satisfies SWREnvelope<T>, { ex: hardTtlSeconds });
  } catch {
    // SET failure is non-fatal
  }
  return data;
}
