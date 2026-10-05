// Centralized IndexedDB cache for admin panel data
// Uses the same idb-keyval library as the map page (user-map/page.tsx)
// All functions are SSR-safe — they no-op on the server.

// Cache keys — follow the same naming convention as the map page
export const CACHE_KEYS = {
  jobSeekers: 'hirenest_admin_job_seekers',
  jobSeekersTime: 'hirenest_admin_job_seekers_ts',
  companies: 'hirenest_admin_companies',
  companiesTime: 'hirenest_admin_companies_ts',
  jobPosts: 'hirenest_admin_job_posts',
  jobPostsTime: 'hirenest_admin_job_posts_ts',
} as const;

// Lazy-load idb-keyval only in the browser to avoid SSR errors
async function getIdbKeyval() {
  if (typeof window === 'undefined') return null;
  return await import('idb-keyval');
}

/**
 * Retrieve cached data and its timestamp from IndexedDB.
 * Returns null if no cache exists or if running on server.
 */
export async function getCachedData<T>(
  dataKey: string,
  timeKey: string
): Promise<{ data: T; timestamp: number } | null> {
  try {
    const idb = await getIdbKeyval();
    if (!idb) return null;

    const data = await idb.get<T>(dataKey);
    const timestamp = await idb.get<number>(timeKey);

    if (data && timestamp) {
      return { data, timestamp };
    }
  } catch (err) {
    console.error('[Cache] Failed to read from IndexedDB:', err);
  }
  return null;
}

/**
 * Store data and its timestamp in IndexedDB.
 */
export async function setCachedData<T>(
  dataKey: string,
  timeKey: string,
  data: T
): Promise<void> {
  try {
    const idb = await getIdbKeyval();
    if (!idb) return;

    await idb.set(dataKey, data);
    await idb.set(timeKey, Date.now());
  } catch (err) {
    console.error('[Cache] Failed to write to IndexedDB:', err);
  }
}

/**
 * Clear all admin cache from IndexedDB.
 * Called on logout to prevent stale data across users.
 * Fire-and-forget safe — no-ops on server.
 */
export async function clearAllAdminCache(): Promise<void> {
  try {
    const idb = await getIdbKeyval();
    if (!idb) return;

    const allKeys = Object.values(CACHE_KEYS);
    await Promise.all(allKeys.map((key) => idb.del(key)));
    console.log('[Cache] All admin cache cleared');
  } catch (err) {
    console.error('[Cache] Failed to clear cache:', err);
  }
}
