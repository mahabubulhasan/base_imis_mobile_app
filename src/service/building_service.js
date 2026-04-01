import client from '../axios';
import {URLS} from '../core/constants/urls';

export const uploadBuildingData = async data => {
  return await client.post(URLS.uploadBuildingData, data);
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
