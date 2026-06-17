const TAG = '[WMS]';

export const WMS_DEBUG = __DEV__;

function truncate(value, max = 120) {
  if (value == null) {
    return value;
  }
  const text = String(value);
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

export function logWms(...args) {
  if (!WMS_DEBUG) {
    return;
  }
  console.log(TAG, ...args);
}

export function logWmsUrls(label, wmsUrls) {
  if (!WMS_DEBUG || !wmsUrls) {
    return;
  }
  const summary = Object.fromEntries(
    Object.entries(wmsUrls).map(([key, url]) => [
      key,
      url ? truncate(url) : null,
    ]),
  );
  logWms(label, summary);
}

export function logWmsLayerResolve(debugLabel, payload) {
  if (!WMS_DEBUG) {
    return;
  }
  logWms(`resolveWmsLayers[${debugLabel}]`, payload);
}

export function logWmsApiResponse(layerKey, response) {
  if (!WMS_DEBUG) {
    return;
  }
  const payload = response?.data;
  logWms(`API ${layerKey}`, {
    status: response?.status,
    hasData: !!payload?.data,
    baseUrl: payload?.baseUrl ? truncate(payload.baseUrl, 80) : null,
    keys: payload?.data ? Object.keys(payload.data) : [],
    wmslinks: payload?.data?.wmslinks
      ? truncate(payload.data.wmslinks)
      : null,
  });
}
