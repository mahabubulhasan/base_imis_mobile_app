import {BASE_WMS_LAYERS, getScreenWmsLayers} from '../../core/constants/wmsLayers';
import {fetchWmsUrlsIfNeeded} from './fetchWmsUrlsIfNeeded';

export const fetchWmsUrlsForScreen =
  (screenKey, options = {}) =>
  dispatch => {
    const layers = getScreenWmsLayers(screenKey);
    return dispatch(fetchWmsUrlsIfNeeded({layers, ...options}));
  };

export {BASE_WMS_LAYERS};
