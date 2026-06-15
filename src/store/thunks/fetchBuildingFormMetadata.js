import {CACHE_TTL, isStale} from '../../helpers/cachePolicy';
import {getBuildingFormMetadata} from '../../service/building_service';
import {
  setBuildingFormMetadataFailed,
  setBuildingFormMetadataLoading,
  setBuildingFormMetadataSuccess,
} from '../slices/map.slice';

export const fetchBuildingFormMetadata =
  (options = {}) =>
  async (dispatch, getState) => {
    const {force = false} = options;
    const {
      buildingFormMetadata,
      buildingFormMetadataStatus,
      buildingFormMetadataFetchedAt,
    } = getState().map ?? {};

    if (buildingFormMetadataStatus === 'loading') {
      return;
    }

    const hasMetadata = !!buildingFormMetadata;
    const fresh = !isStale(
      buildingFormMetadataFetchedAt,
      CACHE_TTL.FORM_METADATA_MS,
    );

    if (!force && hasMetadata && fresh) {
      return;
    }

    if (!hasMetadata || force) {
      dispatch(setBuildingFormMetadataLoading());
    }

    try {
      const response = await getBuildingFormMetadata();
      const metadata = response?.data?.data ?? null;

      if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        throw new Error('Invalid form metadata response.');
      }

      dispatch(setBuildingFormMetadataSuccess(metadata));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to load form metadata.';

      if (!hasMetadata) {
        dispatch(setBuildingFormMetadataFailed(message));
      }
    }
  };
