// KV cache helpers
// getCachedOrFetch(kv, key, fetcher, ttl) pattern

interface CachedValue<T> {
  data: T;
  cachedAt: number;
  ttl: number;
}

/**
 * Check KV for cached data, call fetcher on miss, store result with TTL.
 * Uses JSON metadata for expiry tracking since KV expiration only deletes, not refreshes.
 */
export async function getCachedOrFetch<T>(
  kv: KVNamespace,
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Try cache first
  const cached = await kv.get(key, 'text');
  if (cached) {
    try {
      const parsed: CachedValue<T> = JSON.parse(cached);
      const age = (Date.now() - parsed.cachedAt) / 1000;
      if (age < parsed.ttl) {
        return parsed.data;
      }
    } catch {
      // Corrupted cache entry, fall through to fetch
    }
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in KV with metadata
  const value: CachedValue<T> = {
    data,
    cachedAt: Date.now(),
    ttl: ttlSeconds,
  };

  // Use KV expiration as a backstop (double the TTL)
  await kv.put(key, JSON.stringify(value), {
    expirationTtl: ttlSeconds * 2,
  });

  return data;
}

/**
 * Manually invalidate a cache entry.
 */
export async function invalidateCache(kv: KVNamespace, key: string): Promise<void> {
  await kv.delete(key);
}
