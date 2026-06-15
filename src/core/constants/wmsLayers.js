export const WMS_LAYER_KEYS = ['building', 'road', 'ward', 'containment', 'sewer'];

export const BASE_WMS_LAYERS = ['road', 'ward', 'building'];

export const SPECIALTY_WMS_LAYERS = ['containment', 'sewer'];

export const SCREEN_WMS_CONFIG = {
  building: {layers: ['road', 'ward', 'building'], specialty: []},
  kml: {layers: ['road', 'ward', 'building'], specialty: []},
  picker: {layers: ['building'], specialty: []},
  containment: {layers: ['road', 'ward', 'containment'], specialty: ['containment']},
  sewage: {layers: ['road', 'ward', 'building', 'sewer'], specialty: ['sewer']},
};

export const ZOOM_LAYER_RULES = {
  road: {minZ: 13, maxZ: 22},
  ward: {minZ: 13, maxZ: 17},
  building: {minZ: 13, maxZ: 22},
  containment: {minZ: 16, maxZ: 22},
  sewer: {minZ: 16, maxZ: 22},
};

export const MAP_SERVICE_BOUNDS = {
  northEast: {latitude: 27.669721, longitude: 85.337964},
  southWest: {latitude: 27.589734, longitude: 85.416529},
};

export function getScreenWmsLayers(screenKey) {
  const config = SCREEN_WMS_CONFIG[screenKey];
  if (!config) {
    return [];
  }
  return [...new Set([...config.layers, ...config.specialty])];
}
