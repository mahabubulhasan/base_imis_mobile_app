import {useCallback, useEffect, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {buildFormDropdowns} from '../helpers/buildingFormMetadata';
import {fetchBuildingFormMetadata} from '../store/thunks/fetchBuildingFormMetadata';

const useBuildingFormMetadata = () => {
  const dispatch = useDispatch();
  const {buildingFormMetadata, buildingFormMetadataStatus, buildingFormMetadataError} =
    useSelector(state => state.map);

  const status = buildingFormMetadataStatus ?? 'idle';
  const hasMetadata = !!buildingFormMetadata;
  const isReady = hasMetadata;
  const isInitialLoading = !hasMetadata && status === 'loading';
  const isRefreshing = hasMetadata && status === 'loading';
  const isLoading = status === 'loading';

  useEffect(() => {
    if (status === 'idle' || buildingFormMetadataStatus === undefined) {
      dispatch(fetchBuildingFormMetadata());
    }
  }, [status, buildingFormMetadataStatus, dispatch]);

  const retry = useCallback(() => {
    dispatch(fetchBuildingFormMetadata());
  }, [dispatch]);

  const getDropdowns = useCallback(
    functionalUseId => buildFormDropdowns(buildingFormMetadata, functionalUseId),
    [buildingFormMetadata],
  );

  const dropdowns = useMemo(
    () => buildFormDropdowns(buildingFormMetadata),
    [buildingFormMetadata],
  );

  return {
    metadata: buildingFormMetadata,
    status,
    isReady,
    isInitialLoading,
    isRefreshing,
    isLoading,
    error: buildingFormMetadataError,
    retry,
    getDropdowns,
    dropdowns,
  };
};

export default useBuildingFormMetadata;
