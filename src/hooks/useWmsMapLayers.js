import {useCallback, useMemo} from 'react';
import {resolveWmsLayers} from '../helpers/resolveWmsLayers';
import useMapZoom from './useMapZoom';

export default function useWmsMapLayers({
  screenKey,
  mapMounted,
  wmsUrls,
  layerVisibility,
  forceLayers = {},
  debugLabel = 'map',
  onRegionChange,
}) {
  const {zoom, region, isRegionStable, onRegionChangeComplete} = useMapZoom();

  const {eligibleLayers} = useMemo(
    () =>
      resolveWmsLayers({
        screenKey,
        zoom,
        layerVisibility,
        wmsUrls,
        // Keep the overlay mounted while the map moves: the native tile layer
        // scales the current tiles (Google-Maps style) and refreshes them after
        // the gesture settles, instead of blanking the overlay on every pan/zoom.
        isRegionStable: true,
        forceSpecialty: forceLayers,
        debugLabel,
      }),
    [screenKey, zoom, layerVisibility, wmsUrls, forceLayers, debugLabel],
  );

  // Render the full eligible set in one pass once the map is laid out.
  // Staggering only made sense when each layer was a separate request; with
  // merged requests there is no burst to stagger against.
  const stagedLayers = useMemo(
    () => (mapMounted ? eligibleLayers : []),
    [mapMounted, eligibleLayers],
  );

  const handleRegionChangeComplete = useCallback(
    nextRegion => {
      onRegionChangeComplete(nextRegion);
      onRegionChange?.(nextRegion);
    },
    [onRegionChange, onRegionChangeComplete],
  );

  return {
    zoom,
    region,
    isRegionStable,
    eligibleLayers,
    stagedLayers,
    handleRegionChangeComplete,
  };
}
