type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL = 60_000; // 1 minute

/**
 * Fetches data with in-memory caching and request deduplication.
 *
 * - If a cached response exists within TTL, returns it immediately.
 * - If the same request is already in-flight, piggybacks on the existing promise.
 * - Otherwise, fires a new request and caches the result.
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const cached = cache.get(key) as CacheEntry<T> | undefined;
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, timestamp: Date.now() });
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}

/** Invalidate a single cache key or all keys matching a prefix. */
export function invalidateCache(keyOrPrefix?: string) {
  if (!keyOrPrefix) {
    cache.clear();
    return;
  }
  for (const k of cache.keys()) {
    if (k === keyOrPrefix || k.startsWith(keyOrPrefix + ':')) {
      cache.delete(k);
    }
  }
}

/** Invalidate cache entries matching a predicate. */
export function invalidateCacheWhere(predicate: (key: string) => boolean) {
  for (const k of cache.keys()) {
    if (predicate(k)) cache.delete(k);
  }
}
