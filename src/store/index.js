import {configureStore} from '@reduxjs/toolkit';
import {FLUSH, PAUSE, PURGE, PERSIST, REGISTER, REHYDRATE} from 'redux-persist';

import persistedRootReducer from './rootReducer';

// Large, mostly-static slices that are expensive for RTK's dev-only
// serializable/immutable checks to deep-scan on every dispatch. Skipping them
// removes the "state or actions are very large" slowdown warning while keeping
// the checks active for the rest of the state. (Both checks are stripped from
// production builds automatically.)
const LARGE_STATE_PATHS = [
  'map.buildingFormMetadata',
  'map.buildingsData',
  'map.buildingCoords',
  'auth.contentsLabel',
];

const store = configureStore({
  reducer: persistedRootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        warnAfter: 128,
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: LARGE_STATE_PATHS,
      },
      immutableCheck: {
        warnAfter: 128,
        ignoredPaths: LARGE_STATE_PATHS,
      },
    }),
});

export default store;
