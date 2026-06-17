import {persistReducer, createMigrate} from 'redux-persist';
import {combineReducers} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

import mapReducer from './slices/map.slice';
import authReducer from './slices/auth.slice';

const mapMigrations = {
  2: state => {
    if (!state) {
      return state;
    }

    const byLayer = {...(state.wmsUrlsFetchedAtByLayer || {})};
    const fetchedAt = state.wmsUrlsFetchedAt;

    if (fetchedAt && state.wmsUrls) {
      Object.entries(state.wmsUrls).forEach(([key, url]) => {
        if (url && !byLayer[key]) {
          byLayer[key] = fetchedAt;
        }
      });
    }

    return {
      ...state,
      wmsUrlsFetchedAtByLayer: byLayer,
    };
  },
};

const mapPersistConfig = {
  version: 2,
  key: 'map',
  storage: AsyncStorage,
  migrate: createMigrate(mapMigrations, {debug: false}),
  whitelist: [
    'wmsUrls',
    'wmsUrlsFetchedAt',
    'wmsUrlsFetchedAtByLayer',
    'buildingFormMetadata',
    'buildingFormMetadataStatus',
    'buildingFormMetadataFetchedAt',
    'mapType',
  ],
};

const persistedMapReducer = persistReducer(mapPersistConfig, mapReducer);

const reducers = combineReducers({
  auth: authReducer,
  map: persistedMapReducer,
});

const rootMigrations = {
  3: state => {
    if (!state) {
      return state;
    }

    const {map, ...rest} = state;
    return rest;
  },
};

const rootPersistConfig = {
  version: 3,
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'],
  migrate: createMigrate(rootMigrations, {debug: false}),
};

const rootReducer = persistReducer(rootPersistConfig, reducers);

export default rootReducer;
