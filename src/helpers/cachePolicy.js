export const CACHE_TTL = {
  WMS_URLS_MS: 24 * 60 * 60 * 1000,
  FORM_METADATA_MS: 7 * 24 * 60 * 60 * 1000,
  // In-memory proxy cache for on-demand search lookups (roads, bins, etc.).
  LOOKUP_MS: 30 * 60 * 1000,
};

export function isStale(fetchedAtIso, ttlMs) {
  if (!fetchedAtIso) {
    return true;
  }
  const fetchedAt = new Date(fetchedAtIso).getTime();
  if (Number.isNaN(fetchedAt)) {
    return true;
  }
  return Date.now() - fetchedAt > ttlMs;
}
