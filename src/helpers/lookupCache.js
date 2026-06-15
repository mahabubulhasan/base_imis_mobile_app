import {CACHE_TTL, isStale} from "./cachePolicy";

// In-memory proxy cache for on-demand search lookups (roads, sewers, drains,
// water supplies, LICs, BINs). Read cache-first; the network layer merges fresh
// results in on every server response. Intentionally not persisted — that keeps
// the AsyncStorage savings that motivated splitting these out of form-metadata.

const store = new Map(); // cacheKey -> { options: [{value,label}], fetchedAt: number }

const nowIso = () => new Date().toISOString();

// Returns cached options for a key, or undefined when absent/stale.
export const get = cacheKey => {
  if (!cacheKey) return undefined;
  const entry = store.get(cacheKey);
  if (!entry) return undefined;
  if (isStale(entry.fetchedAt, CACHE_TTL.LOOKUP_MS)) {
    store.delete(cacheKey);
    return undefined;
  }
  return entry.options;
};

// Union-merge fresh options into a key (by value, last label wins) and refresh
// the timestamp. Returns the merged list.
export const merge = (cacheKey, options = []) => {
  if (!cacheKey) return options;
  const existing = store.get(cacheKey)?.options ?? [];
  const byValue = new Map();
  for (const opt of existing) byValue.set(String(opt.value), opt);
  for (const opt of options) byValue.set(String(opt.value), opt);
  const mergedOptions = [...byValue.values()];
  store.set(cacheKey, {options: mergedOptions, fetchedAt: nowIso()});
  return mergedOptions;
};

// Looks up a value's display label within a key's cached options.
export const resolveLabel = (cacheKey, value) => {
  if (!cacheKey || value === undefined || value === null) return undefined;
  const options = store.get(cacheKey)?.options ?? [];
  const found = options.find(opt => String(opt.value) === String(value));
  return found?.label;
};
