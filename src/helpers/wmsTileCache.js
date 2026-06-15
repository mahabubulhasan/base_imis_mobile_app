import RNFB from 'react-native-blob-util';

// Serve-stale-while-refresh: a cached tile older than this (in seconds) is
// shown immediately while a fresh copy is fetched in the background.
export const WMS_TILE_CACHE_MAX_AGE_SEC = 24 * 60 * 60;

let cacheRoot;
try {
  cacheRoot = RNFB?.fs?.dirs?.CacheDir ?? null;
} catch {
  cacheRoot = null;
}

// Each WMSTile must use its OWN sub-directory: the native layer stores tiles
// keyed only by {z}/{x}/{y}, so two layers sharing a path would overwrite each
// other's tiles. `name` is the layer-set identity (e.g. "road_ward_building").
//
// NB: disk tile caching is only supported on Android and on iOS-with-AppleMaps.
// This app uses PROVIDER_GOOGLE, so caching is active on Android only; on iOS it
// is a no-op (the prop is ignored), which is harmless.
export function getWmsTileCachePath(name) {
  if (!cacheRoot || !name) {
    return undefined;
  }
  const safe = String(name).replace(/[^a-z0-9_-]/gi, '_');
  return `${cacheRoot}/wms-tiles/${safe}`;
}
