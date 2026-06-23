import client from '../axios';
import {URLS} from '../core/constants/urls';
import mime from 'mime';
import {
  getVisibleConditionalFields,
  normalizeBoolean01,
} from '../helpers/buildingDraft';

export {mapToOptions} from '../helpers/buildingFormMetadata';

export const getBuildingFormMetadata = async () => {
  return client.get(`${URLS.buildingInfoBuildings}/form-metadata`, {
    headers: {
      Accept: 'application/json',
    },
  });
};

export const uploadBuildingData = async data => {
  return await client.post(URLS.uploadBuildingData, data);
};

const RESERVED_DRAFT_KEYS = new Set([
  'coords',
  'path',
  'kml_file_name',
  'house_image',
  'created_date',
  'upload_status',
  'last_error',
  'updated_at',
  'field_errors',
  'structure_type_name',
]);

const BASE_FIELD_KEYS = [
  'temp_building_code',
  'tax_code',
  'collected_date',
  'owner_name',
  'owner_gender',
  'owner_contact',
  'owner_nid',
  'ward',
  'road_code',
  'house_number',
  'structure_type_id',
  'construction_year',
  'floor_count',
  'functional_use_id',
  'use_category_id',
  'water_source_id',
  'sanitation_system_id',
  'sewer_code',
  'drain_code',
  'toilet_status',
  'toilet_count',
  'defecation_place',
  'ctpt_name',
  'build_contain',
  'building_associated_to',
  'watersupply_pipe_code',
  'lic_id',
  'main_building',
  'lic_status',
  'household_served',
  'population_served',
  'household_with_private_toilet',
  'population_with_private_toilet',
  'house_locality',
];

export const buildSaveBuildingFormData = draft => {
  const data = new FormData();
  const visible = getVisibleConditionalFields(draft);
  const includeKey = key => {
    if (key === 'building_associated_to') return visible.building_associated_to;
    if (key === 'lic_id') return visible.lic_id;
    if (key === 'watersupply_pipe_code') return visible.watersupply_pipe_code;
    if (key === 'toilet_count') return visible.toilet_count;
    if (key === 'sanitation_system_id') return visible.sanitation_system_id;
    if (key === 'defecation_place') return visible.defecation_place;
    if (key === 'ctpt_name') return visible.ctpt_name;
    if (key === 'build_contain') return visible.build_contain;
    if (key === 'use_category_id') return visible.use_category_id;
    if (key === 'household_with_private_toilet') {
      return visible.household_with_private_toilet;
    }
    if (key === 'population_with_private_toilet') {
      return visible.population_with_private_toilet;
    }
    return true;
  };

  BASE_FIELD_KEYS.forEach(key => {
    if (!includeKey(key)) return;
    const value = draft[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      const normalized =
        key === 'toilet_status' ||
        key === 'main_building' ||
        key === 'lic_status'
          ? normalizeBoolean01(value, '0')
          : String(value);
      data.append(key, normalized);
      // The backend (BuildingSurveyRequest) validates a nested `payload_json`
      // array IN ADDITION to the flat fields — e.g. payload_json.structure_type_id
      // is required. Multipart `payload_json[key]` is parsed into that array by
      // PHP (a JSON string would fail the `array` rule).
      data.append(`payload_json[${key}]`, normalized);
    }
  });

  if (draft.path) {
    const kmlUri = `file://${draft.path}`;
    data.append('kml', {
      uri: kmlUri,
      type: mime.getType(kmlUri) || 'application/vnd.google-earth.kml+xml',
      name: draft.kml_file_name || 'building.kml',
    });
  }

  if (draft.house_image?.uri) {
    data.append('house_image', {
      uri: draft.house_image.uri,
      type: draft.house_image.type || 'image/jpeg',
      name: draft.house_image.name || 'house.jpg',
    });
  }

  Object.keys(draft).forEach(key => {
    if (RESERVED_DRAFT_KEYS.has(key) || BASE_FIELD_KEYS.includes(key)) {
      return;
    }
    const value = draft[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      data.append(key, String(value));
    }
  });

  return data;
};

export const createBuildingInfo = async (bin, fields) => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  }
  const path = `${URLS.buildingInfoBuildings}/${encodeURIComponent(String(bin))}`;
  return client.post(path, formData, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getBuildingEditData = async (bin) => {
  const path = `${URLS.buildingInfoEditData}/${encodeURIComponent(String(bin))}/edit-data`;
  return client.get(path, {
    headers: {
      Accept: 'application/json',
    },
  });
};

const shouldAppendValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

const appendFormDataValue = (formData, key, value) => {
  if (!shouldAppendValue(value)) return;

  // React Native file object: { uri, name, type }
  if (typeof value === 'object' && value.uri) {
    formData.append(key, value);
    return;
  }

  formData.append(key, String(value));
};

export const updateBuildingInfo = async (bin, fields) => {
  const formData = new FormData();

  if (fields && typeof fields === 'object') {
    for (const [key, value] of Object.entries(fields)) {
      appendFormDataValue(formData, key, value);
    }
  }

  const path = `${URLS.buildingInfoUpdate}/${encodeURIComponent(String(bin))}`;
  return client.post(path, formData, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const uploadContainmentData = async data => {
  return await client.post(URLS.uploadContainmentData, data);
};

export const getBuildingWmslink = async () => {
  return await client.get(URLS.wsBuildingLink);
};

export const getContainmentWmslink = async () => {
  return await client.get(URLS.wsContainmentLink);
};

export const getRoadWmsLink = async () => {
  return await client.get(URLS.wsRoadLink);
};

export const getWardWmsLink = async () => {
  return await client.get(URLS.wsWardLink);
};

export const getSewerWmsLink = async () => {
  return await client.get(URLS.wsSewerLink);
};

export const getBuildings = async () => {
  return await client.get(URLS.buildingCode);
};

export const getSewerCode = async () => {
  return await client.get(URLS.sewerCode);
};

const getQueryParam = (url, key) => {
  const query = url?.split('?')?.[1] || '';
  if (!query) return '';

  const pair = query
    .split('&')
    .find(item => (item.split('=')[0] || '').toLowerCase() === key.toLowerCase());

  if (!pair) return '';

  const [, value = ''] = pair.split('=');
  return decodeURIComponent(value);
};

export const getBuildingFeatureInfoByCoordinate = async ({
  wmsUrl,
  latitude,
  longitude,
}) => {
  const endpoint = wmsUrl?.split('?')?.[0] || '';
  const layer =
    getQueryParam(wmsUrl, 'layers') ||
    getQueryParam(wmsUrl, 'query_layers') ||
    getQueryParam(wmsUrl, 'typename');
  const version = getQueryParam(wmsUrl, 'version') || '1.1.1';

  if (!endpoint || !layer || latitude == null || longitude == null) {
    return [];
  }

  const pad = 0.00025;
  const params = {
    SERVICE: 'WMS',
    REQUEST: 'GetFeatureInfo',
    PROPERTYNAME: 'bin,owner_name,owner_contact,ward,tax_code',
    VERSION: version,
    INFO_FORMAT: 'application/json',
    FEATURE_COUNT: 5,
    FORMAT: 'image/png',
    TRANSPARENT: true,
    LAYERS: layer,
    QUERY_LAYERS: layer,
    STYLES: '',
    WIDTH: 101,
    HEIGHT: 101,
    BBOX: `${latitude - pad},${longitude - pad},${latitude + pad},${longitude + pad}`,
    SRS: 'EPSG:4326',
    CRS: 'EPSG:4326',
    X: 50,
    Y: 50,
    I: 50,
    J: 50,
  };

  const response = await client.get(endpoint, {
    baseURL: '',
    params,
  });

  return response?.data?.features || [];
};
