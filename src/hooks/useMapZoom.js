import {useCallback, useEffect, useRef, useState} from 'react';

export function regionToZoom(region) {
  if (!region?.latitudeDelta) {
    return null;
  }
  return Math.round(Math.log2(360 / region.latitudeDelta));
}

export default function useMapZoom({debounceMs = 150, initialRegion} = {}) {
  const [region, setRegion] = useState(initialRegion ?? null);
  const [zoom, setZoom] = useState(
    initialRegion ? regionToZoom(initialRegion) : null,
  );
  const [isRegionStable, setIsRegionStable] = useState(!initialRegion);
  const debounceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const onRegionChangeComplete = useCallback(
    nextRegion => {
      setRegion(nextRegion);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      setIsRegionStable(false);
      debounceRef.current = setTimeout(() => {
        setZoom(regionToZoom(nextRegion));
        setIsRegionStable(true);
      }, debounceMs);
    },
    [debounceMs],
  );

  return {
    zoom,
    region,
    isRegionStable,
    onRegionChangeComplete,
  };
}
