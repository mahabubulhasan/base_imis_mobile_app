import client from '../axios';
import {URLS} from '../core/constants/urls';

export const uploadBuildingData = async data => {
  return await client.post(URLS.uploadBuildingData, data);
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
