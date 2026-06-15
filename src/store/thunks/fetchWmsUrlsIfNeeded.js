import {CACHE_TTL, isStale} from '../../helpers/cachePolicy';
import {
  logWms,
  logWmsApiResponse,
  logWmsUrls,
} from '../../helpers/wmsDebug';
import {
  parseBuildingWmsUrl,
  parseContainmentWmsUrl,
  parseRoadWmsUrl,
  parseSewerWmsUrl,
  parseWardWmsUrl,
} from '../../helpers/wmsUrlParser';
import {BASE_WMS_LAYERS, WMS_LAYER_KEYS} from '../../core/constants/wmsLayers';
import {
  getBuildingWmslink,
  getContainmentWmslink,
  getRoadWmsLink,
  getSewerWmsLink,
  getWardWmsLink,
} from '../../service/building_service';
import {
  setWmsUrlsFailed,
  setWmsUrlsLoading,
  setWmsUrlsSuccess,
} from '../slices/map.slice';

const LAYER_FETCHERS = {
  building: getBuildingWmslink,
  road: getRoadWmsLink,
  ward: getWardWmsLink,
  containment: getContainmentWmslink,
  sewer: getSewerWmsLink,
};

const LAYER_PARSERS = {
  building: parseBuildingWmsUrl,
  road: parseRoadWmsUrl,
  ward: parseWardWmsUrl,
  containment: parseContainmentWmsUrl,
  sewer: parseSewerWmsUrl,
};

function normalizeLayers(layers) {
  const requested = layers?.length ? layers : BASE_WMS_LAYERS;
  return [...new Set(requested.filter(key => WMS_LAYER_KEYS.includes(key)))];
}

function getLayerFetchedAt(mapState, layerKey) {
  return (
    mapState.wmsUrlsFetchedAtByLayer?.[layerKey] ?? mapState.wmsUrlsFetchedAt
  );
}

function hasWmsUrlsFor(wmsUrls, layers, fetchedAtByLayer, globalFetchedAt) {
  if (!wmsUrls) {
    return false;
  }

  return layers.every(layerKey => {
    if (!wmsUrls[layerKey]) {
      return false;
    }
    const fetchedAt = fetchedAtByLayer?.[layerKey] ?? globalFetchedAt;
    return !isStale(fetchedAt, CACHE_TTL.WMS_URLS_MS);
  });
}

function missingUrlKeys(wmsUrls, layers, fetchedAtByLayer, globalFetchedAt) {
  return layers.filter(layerKey => {
    if (!wmsUrls?.[layerKey]) {
      return true;
    }
    const fetchedAt = fetchedAtByLayer?.[layerKey] ?? globalFetchedAt;
    return isStale(fetchedAt, CACHE_TTL.WMS_URLS_MS);
  });
}

export const fetchWmsUrlsIfNeeded =
  (options = {}) =>
  async (dispatch, getState) => {
    const {force = false, layers: requestedLayers} = options;
    const layers = normalizeLayers(requestedLayers);
    const map = getState().map ?? {};
    const {wmsUrls, wmsUrlsFetchedAt, wmsUrlsFetchedAtByLayer, wmsUrlsStatus} =
      map;

    logWms('fetchWmsUrlsIfNeeded called', {
      force,
      layers,
      wmsUrlsStatus,
      missing: missingUrlKeys(
        wmsUrls,
        layers,
        wmsUrlsFetchedAtByLayer,
        wmsUrlsFetchedAt,
      ),
    });

    if (
      !force &&
      hasWmsUrlsFor(
        wmsUrls,
        layers,
        wmsUrlsFetchedAtByLayer,
        wmsUrlsFetchedAt,
      )
    ) {
      logWms('skip: cache hit (requested URLs present and fresh)');
      logWmsUrls('cached', wmsUrls);
      return;
    }

    if (wmsUrlsStatus === 'loading') {
      logWms('skip: fetch already in progress');
      return;
    }

    const keysToFetch = force
      ? layers
      : missingUrlKeys(
          wmsUrls,
          layers,
          wmsUrlsFetchedAtByLayer,
          wmsUrlsFetchedAt,
        );

    if (!keysToFetch.length) {
      logWms('skip: nothing to fetch');
      return;
    }

    logWms(`starting fetch for layer URLs: ${keysToFetch.join(', ')}`);
    dispatch(setWmsUrlsLoading());

    try {
      const responses = await Promise.all(
        keysToFetch.map(layerKey => LAYER_FETCHERS[layerKey]()),
      );

      const parsedUrls = {};
      const fetchedAtByLayer = {};
      const now = new Date().toISOString();

      keysToFetch.forEach((layerKey, index) => {
        const response = responses[index];
        logWmsApiResponse(layerKey, response);
        parsedUrls[layerKey] = LAYER_PARSERS[layerKey](response);
        fetchedAtByLayer[layerKey] = now;
      });

      logWmsUrls('parsed', parsedUrls);

      const missingLayer = Object.entries(parsedUrls).find(([, url]) => !url);
      if (missingLayer) {
        throw new Error(`Invalid WMS URL response for ${missingLayer[0]}.`);
      }

      dispatch(
        setWmsUrlsSuccess({
          ...parsedUrls,
          fetchedAt: now,
          fetchedAtByLayer,
        }),
      );
      logWms('fetch succeeded', {layers: keysToFetch});
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to load map layer URLs.';

      logWms('fetch failed', {
        message,
        httpStatus: error?.response?.status,
        responseData: error?.response?.data,
      });

      dispatch(setWmsUrlsFailed(message));
    }
  };
