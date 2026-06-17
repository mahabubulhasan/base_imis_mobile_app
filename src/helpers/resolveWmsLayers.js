import {
  SCREEN_WMS_CONFIG,
  SPECIALTY_WMS_LAYERS,
  ZOOM_LAYER_RULES,
} from '../core/constants/wmsLayers';
import {logWmsLayerResolve} from './wmsDebug';

function isLayerVisibleByZoom(layerKey, zoom, forceSpecialty) {
  const rules = ZOOM_LAYER_RULES[layerKey];
  if (!rules) {
    return true;
  }

  if (zoom == null) {
    return !SPECIALTY_WMS_LAYERS.includes(layerKey);
  }

  if (SPECIALTY_WMS_LAYERS.includes(layerKey) && forceSpecialty?.[layerKey]) {
    return true;
  }

  if (forceSpecialty?.[layerKey]) {
    return true;
  }

  return zoom >= rules.minZ && zoom <= rules.maxZ;
}

export function resolveWmsLayers({
  screenKey,
  zoom,
  layerVisibility = {},
  wmsUrls,
  isRegionStable = true,
  forceSpecialty = {},
  debugLabel = 'map',
}) {
  const config = SCREEN_WMS_CONFIG[screenKey];
  if (!config) {
    return {eligibleLayers: [], skipped: []};
  }

  if (!isRegionStable) {
    logWmsLayerResolve(debugLabel, {
      zoom,
      eligibleLayers: [],
      skipped: config.layers.map(key => ({key, reason: 'region_unstable'})),
    });
    return {eligibleLayers: [], skipped: []};
  }

  const skipped = [];
  const eligibleLayers = config.layers.filter(layerKey => {
    if (layerVisibility[layerKey] === false) {
      skipped.push({key: layerKey, reason: 'hidden_by_user'});
      return false;
    }

    if (!wmsUrls?.[layerKey]) {
      skipped.push({key: layerKey, reason: 'missing_url'});
      return false;
    }

    if (!isLayerVisibleByZoom(layerKey, zoom, forceSpecialty)) {
      skipped.push({key: layerKey, reason: 'below_min_zoom'});
      return false;
    }

    return true;
  });

  logWmsLayerResolve(debugLabel, {zoom, eligibleLayers, skipped});

  return {eligibleLayers, skipped};
}
