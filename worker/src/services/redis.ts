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
 */
export async function getRedisOrFetch<T>(
  redis: Redis,
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached !== null) return cached;

  const data = await fetcher();
  // fire-and-forget the write so latency of the SET doesn't block the caller
  redis.set(key, data, { ex: ttlSeconds }).catch(() => {
    // swallow write errors — stale or cold cache is acceptable
  });
  return data;
}

/**
 * Invalidate a single cache key.
 */
export async function invalidateRedisKey(redis: Redis, key: string): Promise<void> {
  await redis.del(key);
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
