// Merges multiple per-layer WMS GetMap templates that target the SAME endpoint
// into a single request with a comma-separated `layers=` parameter, so the map
// fires one GetMap per tile instead of one-per-layer.
//
// Templates only merge when every query parameter EXCEPT `layers` is byte
// identical (same base, version, srs, styles, bbox/size placeholders, ...).
// Anything that does not match (e.g. a specialty layer on a different GeoServer,
// or per-layer non-empty `styles`) falls back to its own standalone tile, so the
// merge is always safe.

function parseTemplate(url) {
  const qIndex = url.indexOf('?');
  if (qIndex === -1) {
    return {base: url, segments: [], layersIndex: -1, layersValue: null};
  }

  const base = url.slice(0, qIndex);
  const segments = url.slice(qIndex + 1).split('&');

  let layersIndex = -1;
  let layersValue = null;
  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i];
    const eq = seg.indexOf('=');
    const key = (eq >= 0 ? seg.slice(0, eq) : seg).toLowerCase();
    if (key === 'layers') {
      layersIndex = i;
      layersValue = eq >= 0 ? seg.slice(eq + 1) : '';
      break;
    }
  }

  return {base, segments, layersIndex, layersValue};
}

// Identity of a template ignoring its `layers` value. Two templates with the
// same signature render the same map area the same way and can share a request.
function signatureOf(parsed) {
  if (parsed.layersIndex === -1) {
    return `${parsed.base}?${parsed.segments.join('&')}`;
  }
  const others = parsed.segments
    .filter((_, i) => i !== parsed.layersIndex)
    .slice()
    .sort();
  return `${parsed.base}?${others.join('&')}`;
}

function rebuild(parsed, mergedLayersValue) {
  if (parsed.layersIndex === -1 || mergedLayersValue == null) {
    return parsed.segments.length
      ? `${parsed.base}?${parsed.segments.join('&')}`
      : parsed.base;
  }

  const segments = parsed.segments.slice();
  const seg = segments[parsed.layersIndex];
  const eq = seg.indexOf('=');
  const key = eq >= 0 ? seg.slice(0, eq) : seg;
  segments[parsed.layersIndex] = `${key}=${mergedLayersValue}`;
  return `${parsed.base}?${segments.join('&')}`;
}

export function mergeWmsLayers({
  eligibleLayers = [],
  wmsUrls,
  layerVisibility = {},
  zoomRules = {},
}) {
  if (!wmsUrls || !eligibleLayers.length) {
    return [];
  }

  const order = [];
  const bySignature = new Map();

  for (const layerKey of eligibleLayers) {
    if (layerVisibility[layerKey] === false) {
      continue;
    }
    const url = wmsUrls[layerKey];
    if (!url) {
      continue;
    }

    const parsed = parseTemplate(url);
    // Without a `layers` param there is nothing to merge — keep it standalone.
    const signature =
      parsed.layersIndex === -1
        ? `__standalone__:${layerKey}`
        : signatureOf(parsed);

    let group = bySignature.get(signature);
    if (!group) {
      group = {
        template: parsed,
        layerKeys: [],
        layerValues: [],
        minZ: undefined,
        maxZ: undefined,
      };
      bySignature.set(signature, group);
      order.push(group);
    }

    group.layerKeys.push(layerKey);
    if (parsed.layersValue != null && parsed.layersValue !== '') {
      group.layerValues.push(parsed.layersValue);
    }

    const rules = zoomRules[layerKey];
    if (rules) {
      group.minZ =
        group.minZ == null ? rules.minZ : Math.min(group.minZ, rules.minZ);
      group.maxZ =
        group.maxZ == null ? rules.maxZ : Math.max(group.maxZ, rules.maxZ);
    }
  }

  return order.map((group, index) => {
    const mergedValue = group.layerValues.length
      ? group.layerValues.join(',')
      : null;

    return {
      // Stable identity so the WMSTile instance (and its cache dir) survive
      // re-renders rather than remounting and re-fetching.
      tileKey: group.layerKeys.join('+'),
      cacheName: group.layerKeys.join('_'),
      urlTemplate: rebuild(group.template, mergedValue),
      layerKeys: group.layerKeys,
      zIndex: index + 1,
      minimumZ: group.minZ,
      maximumZ: group.maxZ,
    };
  });
}
