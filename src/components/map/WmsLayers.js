import React, {useEffect, useMemo, useRef} from 'react';
import {WMSTile} from 'react-native-maps';
import {ZOOM_LAYER_RULES} from '../../core/constants/wmsLayers';
import {logWms} from '../../helpers/wmsDebug';
import {mergeWmsLayers} from '../../helpers/mergeWmsLayerUrls';
import {
  getWmsTileCachePath,
  WMS_TILE_CACHE_MAX_AGE_SEC,
} from '../../helpers/wmsTileCache';

const WmsLayers = ({
  wmsUrls,
  eligibleLayers = [],
  layerVisibility = {},
  tileSize = 256,
  debugLabel = 'map',
  zoomRules = ZOOM_LAYER_RULES,
}) => {
  const lastSkipReason = useRef(null);

  // Collapse layers that share a WMS endpoint into one GetMap request per tile.
  const tiles = useMemo(
    () =>
      mergeWmsLayers({
        eligibleLayers,
        wmsUrls,
        layerVisibility,
        zoomRules,
      }),
    [eligibleLayers, wmsUrls, layerVisibility, zoomRules],
  );

  useEffect(() => {
    if (!wmsUrls || !tiles.length) {
      const reason = !wmsUrls ? 'no wmsUrls' : 'no eligibleLayers';
      if (lastSkipReason.current !== reason) {
        lastSkipReason.current = reason;
        logWms(`WmsLayers[${debugLabel}] waiting`, {
          reason,
          eligibleLayers,
          urlKeys: wmsUrls
            ? Object.fromEntries(
                Object.entries(wmsUrls).map(([k, v]) => [k, !!v]),
              )
            : null,
        });
      }
      return;
    }

    lastSkipReason.current = null;
    logWms(`WmsLayers[${debugLabel}] render`, {
      eligibleLayers,
      mergedTiles: tiles.map(t => ({layers: t.layerKeys, url: t.urlTemplate})),
    });
  }, [wmsUrls, tiles, eligibleLayers, debugLabel]);

  if (!wmsUrls || !tiles.length) {
    return null;
  }

  return (
    <>
      {tiles.map(tile => (
        <WMSTile
          key={tile.tileKey}
          urlTemplate={tile.urlTemplate}
          zIndex={tile.zIndex}
          opacity={0.5}
          tileSize={tileSize}
          minimumZ={tile.minimumZ}
          maximumZ={tile.maximumZ}
          tileCachePath={getWmsTileCachePath(tile.cacheName)}
          tileCacheMaxAge={WMS_TILE_CACHE_MAX_AGE_SEC}
        />
      ))}
    </>
  );
};

export default React.memo(WmsLayers);
