import {createSlice} from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import {MAP_TYPES} from '../../core/constants/map';

const mapSlice = createSlice({
  name: 'map',
  initialState: {
    buildingCoords: [],
    buildingsData: [],
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
