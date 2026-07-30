import {createSlice} from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import {MAP_TYPES} from '../../core/constants/map';

const emptyWmsUrls = {
  building: null,
  road: null,
  ward: null,
  containment: null,
  sewer: null,
};

const mapSlice = createSlice({
  name: 'map',
  initialState: {
    buildingCoords: [],
    buildingsData: [],
    nextBuildingSeq: 1,
    buildingFormMetadata: null,
    buildingFormMetadataStatus: 'idle',
    buildingFormMetadataError: null,
    buildingFormMetadataFetchedAt: null,
    wmsUrls: {...emptyWmsUrls},
    wmsUrlsFetchedAt: null,
    wmsUrlsFetchedAtByLayer: {},
    wmsUrlsStatus: 'idle',
    wmsUrlsError: null,
    containmentCoords: null,
    containmentData: [],
    mapType: MAP_TYPES.STANDARD,
    sewageData: [],
  },
  reducers: {
    addToBuildingCoords: (state, {payload}) => {
      state.buildingCoords.push(payload);
    },

    removeFromBuildingCoords: (state, {payload}) => {
      const filteredCoords = state.buildingCoords.filter(
        (_, i) => i !== payload,
      );
      state.buildingCoords = filteredCoords;
    },
    addBuildingCoordsData: (state, action) => {
      state.buildingCoords = action.payload;
    },

    updateBuildingCoord: (state, {payload}) => {
      const {index, coords} = payload;
      const filteredCoords = state.buildingCoords.map((item, i) => {
        if (i === index) {
          return coords;
        }

        return item;
      });

      state.buildingCoords = filteredCoords;
    },

    resetBuildingCoords: state => {
      state.buildingCoords = [];
    },

    setBuildingFormMetadataLoading: state => {
      state.buildingFormMetadataStatus = 'loading';
      state.buildingFormMetadataError = null;
    },

    setBuildingFormMetadataSuccess: (state, {payload}) => {
      state.buildingFormMetadata = payload;
      state.buildingFormMetadataStatus = 'succeeded';
      state.buildingFormMetadataError = null;
      state.buildingFormMetadataFetchedAt = new Date().toISOString();
    },

    setWmsUrlsLoading: state => {
      state.wmsUrlsStatus = 'loading';
      state.wmsUrlsError = null;
    },

    setWmsUrlsSuccess: (state, {payload}) => {
      const fetchedAt = payload.fetchedAt ?? new Date().toISOString();

      state.wmsUrls = {
        building: payload.building ?? state.wmsUrls.building,
        road: payload.road ?? state.wmsUrls.road,
        ward: payload.ward ?? state.wmsUrls.ward,
        containment: payload.containment ?? state.wmsUrls.containment,
        sewer: payload.sewer ?? state.wmsUrls.sewer,
      };
      state.wmsUrlsFetchedAt = fetchedAt;
      state.wmsUrlsStatus = 'succeeded';
      state.wmsUrlsError = null;

      if (!state.wmsUrlsFetchedAtByLayer) {
        state.wmsUrlsFetchedAtByLayer = {};
      }

      Object.keys(payload).forEach(key => {
        if (key === 'fetchedAt' || key === 'fetchedAtByLayer') {
          return;
        }
        if (payload[key] != null) {
          state.wmsUrlsFetchedAtByLayer[key] =
            payload.fetchedAtByLayer?.[key] ?? fetchedAt;
        }
      });
    },

    setWmsUrlsFailed: (state, {payload}) => {
      state.wmsUrlsStatus = 'failed';
      state.wmsUrlsError = payload ?? 'Failed to load map layer URLs.';
    },

    clearMapCache: state => {
      state.wmsUrls = {...emptyWmsUrls};
      state.wmsUrlsFetchedAt = null;
      state.wmsUrlsFetchedAtByLayer = {};
      state.wmsUrlsStatus = 'idle';
      state.wmsUrlsError = null;
      state.buildingFormMetadata = null;
      state.buildingFormMetadataStatus = 'idle';
      state.buildingFormMetadataError = null;
      state.buildingFormMetadataFetchedAt = null;
    },

    setBuildingFormMetadataFailed: (state, {payload}) => {
      state.buildingFormMetadataStatus = 'failed';
      state.buildingFormMetadataError = payload ?? 'Failed to load form metadata.';
    },

    toogleMapType: state => {
      if (state.mapType === MAP_TYPES.STANDARD) {
        state.mapType = MAP_TYPES.HYBRID;
      } else {
        state.mapType = MAP_TYPES.STANDARD;
      }
    },

    addBuildingsData: (state, {payload}) => {
      const created_date = dayjs().format('MM-DD-YYYY, h:mm:ss a');
      const data = {
        upload_status: 'pending',
        last_error: null,
        updated_at: dayjs().toISOString(),
        ...payload,
        created_date,
      };
      if (!data.temp_building_code) {
        data.temp_building_code = `TB-${String(state.nextBuildingSeq).padStart(4, '0')}`;
      }
      state.nextBuildingSeq += 1;
      state.buildingsData.push(data);
    },

    updateBuildingData: (state, {payload}) => {
      const {index, patch} = payload;
      if (state.buildingsData[index]) {
        state.buildingsData[index] = {
          ...state.buildingsData[index],
          ...patch,
          updated_at: dayjs().toISOString(),
        };
      }
    },

    removeBuildingData: (state, {payload}) => {
      const filteredData = state.buildingsData.filter((_, i) => i !== payload);
      state.buildingsData = filteredData;
    },

    updateBuildingData: (state, {payload}) => {
      const {index, patch} = payload || {};
      if (index === null || index === undefined) return;
      if (!state.buildingsData[index]) return;
      state.buildingsData[index] = {...state.buildingsData[index], ...patch};
    },

    upsertBuildingData: (state, {payload}) => {
      if (!payload) return;
      const {featureId} = payload;

      if (featureId) {
        const existingIndex = state.buildingsData.findIndex(
          item => item?.featureId === featureId,
        );
        if (existingIndex >= 0) {
          state.buildingsData[existingIndex] = {
            ...state.buildingsData[existingIndex],
            ...payload,
          };
          return;
        }
      }

      const created_date = dayjs().format('MM-DD-YYYY, h:mm:ss a');
      state.buildingsData.push({...payload, created_date});
    },

    storeContainmentCoords: (state, {payload}) => {
      state.containmentCoords = payload;
    },

    addContainmentData: (state, {payload}) => {
      const created_date = dayjs().format('MM-DD-YYYY, h:mm:ss a');
      const data = {...payload, created_date};
      state.containmentData.push(data);
    },

    removeContainmentData: (state, {payload}) => {
      const filteredData = state.containmentData.filter(
        (_, i) => i !== payload,
      );
      state.containmentData = filteredData;
    },

    removeContainmentCoords: state => {
      state.containmentCoords = null;
    },
    addSewageData: (state, {payload}) => {
      const created_date = dayjs().format('MM-DD-YYYY, h:mm:ss a');
      const data = {...payload, created_date};
      state.sewageData.push(data);
    },
    removeSewageData: (state, {payload}) => {
      const filteredData = state.sewageData.filter((_, i) => i !== payload);
      state.sewageData = filteredData;
    },
  },
});

export const {
  toogleMapType,
  removeFromBuildingCoords,
  updateBuildingCoord,
  addToBuildingCoords,
  resetBuildingCoords,
  setBuildingFormMetadataLoading,
  setBuildingFormMetadataSuccess,
  setBuildingFormMetadataFailed,
  setWmsUrlsLoading,
  setWmsUrlsSuccess,
  setWmsUrlsFailed,
  clearMapCache,
  storeContainmentCoords,
  removeContainmentCoords,
  addBuildingsData,
  updateBuildingData,
  addDistanceData,
  removeBuildingData,
  upsertBuildingData,
  addContainmentData,
  removeContainmentData,
  addSewageData,
  removeSewageData,
  addBuildingCoordsData,
} = mapSlice.actions;

export default mapSlice.reducer;
