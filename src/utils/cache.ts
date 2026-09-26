import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache store for 0ms instantaneous reads across tab navigation
const memoryCache = new Map<string, CacheEntry<any>>();

export const CACHE_KEYS = {
  HOME_PRODUCTS: (family: string = 'all') => `@mfolks_cache_home_products_${family}`,
  HOME_NEWS: (family: string = 'all') => `@mfolks_cache_home_news_${family}`,
  WP_CATEGORIES: '@mfolks_cache_wp_categories',
  FAMILIES: '@mfolks_cache_families',
  ALL_PRODUCTS: '@mfolks_cache_all_products',
};

export const CACHE_TTL = {
  PRODUCTS: 5 * 60 * 1000, // 5 minutes
  NEWS: 10 * 60 * 1000, // 10 minutes
  CATEGORIES: 30 * 60 * 1000, // 30 minutes
  FAMILIES: 30 * 60 * 1000, // 30 minutes
};

/**
 * Synchronous in-memory lookup. Returns null if not in memory.
 * Useful for initializing React state immediately during render without any delay.
 */
export function getMemoryCache<T>(key: string, maxAgeMs: number = CACHE_TTL.PRODUCTS): { data: T; isStale: boolean } | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  return {
    data: entry.data as T,
    isStale: age > maxAgeMs,
  };
}

/**
 * Asynchronous cache retrieval: checks memory first, then AsyncStorage.
 * Populates memory cache if found in AsyncStorage.
 */
export async function getCache<T>(key: string, maxAgeMs: number = CACHE_TTL.PRODUCTS): Promise<{ data: T; isStale: boolean } | null> {
  // 1. Check in-memory
  const mem = getMemoryCache<T>(key, maxAgeMs);
  if (mem) {
    return mem;
  }

  // 2. Check AsyncStorage
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const parsed: CacheEntry<T> = JSON.parse(raw);
    if (!parsed || parsed.data === undefined) return null;

    // Save to memory for subsequent synchronous reads
    memoryCache.set(key, parsed);

    const age = Date.now() - parsed.timestamp;
    return {
      data: parsed.data,
      isStale: age > maxAgeMs,
    };
  } catch (err) {
    console.warn(`[Cache] Error reading cache for key "${key}":`, err);
    return null;
  }
}

/**
 * Saves data into both in-memory cache and AsyncStorage.
 */
export async function setCache<T>(key: string, data: T): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };

  // Immediate in-memory update
  memoryCache.set(key, entry);

  // Background AsyncStorage persistence
  try {
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch (err) {
    console.warn(`[Cache] Error persisting cache for key "${key}":`, err);
  }
}

/**
 * Clears cache for a specific key or all cache keys.
 */
export async function clearCache(key?: string): Promise<void> {
  if (key) {
    memoryCache.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.warn(`[Cache] Error clearing key "${key}":`, err);
    }
  } else {
    memoryCache.clear();
  }
}
