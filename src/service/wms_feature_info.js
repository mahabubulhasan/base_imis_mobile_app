import {geometryToCoords} from '../helpers/geo';

export {geometryToCoords};

function splitUrl(href) {
  if (!href || typeof href !== "string") return { base: "", queryString: "" };
  const q = href.indexOf("?");
  if (q === -1) return { base: href, queryString: "" };
  return { base: href.slice(0, q), queryString: href.slice(q + 1) };
}

function decodeFormComponent(s) {
  if (s == null) return "";
  const t = String(s).replace(/\+/g, " ");
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
}

function parseQueryString(queryString) {
  const out = {};
  if (!queryString) return out;
  for (const segment of queryString.split("&")) {
    if (!segment) continue;
    const eq = segment.indexOf("=");
    const rawKey = eq >= 0 ? segment.slice(0, eq) : segment;
    const rawVal = eq >= 0 ? segment.slice(eq + 1) : "";
    const k = decodeFormComponent(rawKey);
    const v = decodeFormComponent(rawVal);
    out[k] = v;
  }
  return out;
}

function getParamCaseInsensitive(paramsObj, key) {
  if (!paramsObj || key == null) return null;
  const lower = String(key).toLowerCase();
  for (const k of Object.keys(paramsObj)) {
    if (k.toLowerCase() === lower) return paramsObj[k];
  }
  return null;
}

function buildQueryStringFromPairs(pairs) {
  return pairs
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v ?? ""))}`
    )
    .join("&");
}

function normalizeWmsCrs(queryParams) {
  const crs = getParamCaseInsensitive(queryParams, "crs");
  const srs = getParamCaseInsensitive(queryParams, "srs");
  return (crs || srs || "EPSG:4326").toUpperCase();
}

const WEB_MERCATOR_R = 6378137;
const toRad = (deg) => (deg * Math.PI) / 180;

function lonLatTo3857({ longitude, latitude }) {
  const x = WEB_MERCATOR_R * toRad(longitude);
  const y =
    WEB_MERCATOR_R * Math.log(Math.tan(Math.PI / 4 + toRad(latitude) / 2));
  return { x, y };
}

export async function getWmsFeatureInfo({
  wmsTileTemplate,
  coordinate,
  region,
  mapSizePx,
  pointPx,
  propertyNames,
}) {
  if (!wmsTileTemplate || !coordinate || !region || !mapSizePx || !pointPx) {
    return null;
  }

  const { base, queryString } = splitUrl(wmsTileTemplate);
  if (!base) return null;

  const q = parseQueryString(queryString);
  const layers =
    getParamCaseInsensitive(q, "layers") ||
    getParamCaseInsensitive(q, "LAYERS");

  if (!layers) return null;

  const version = getParamCaseInsensitive(q, "version") || "1.1.1";
  const format = getParamCaseInsensitive(q, "format") || "image/png";
  const crs = normalizeWmsCrs(q);

  let bbox;
  if (crs === "EPSG:3857") {
    const west = region.longitude - region.longitudeDelta / 2;
    const east = region.longitude + region.longitudeDelta / 2;
    const south = region.latitude - region.latitudeDelta / 2;
    const north = region.latitude + region.latitudeDelta / 2;

    const sw = lonLatTo3857({ longitude: west, latitude: south });
    const ne = lonLatTo3857({ longitude: east, latitude: north });
    bbox = `${sw.x},${sw.y},${ne.x},${ne.y}`;
  } else {
    const minX = region.longitude - region.longitudeDelta / 2;
    const maxX = region.longitude + region.longitudeDelta / 2;
    const minY = region.latitude - region.latitudeDelta / 2;
    const maxY = region.latitude + region.latitudeDelta / 2;
    bbox = `${minX},${minY},${maxX},${maxY}`;
  }

  const widthPx = Math.max(1, Math.round(mapSizePx.width));
  const heightPx = Math.max(1, Math.round(mapSizePx.height));

  const pairs = [
    ["service", "WMS"],
    ["request", "GetFeatureInfo"],
    ["version", version],
    ["layers", layers],
    ["query_layers", layers],
    ["styles", ""],
    ["bbox", bbox],
    ["width", String(widthPx)],
    ["height", String(heightPx)],
    ["info_format", "application/json"],
    ["FEATURE_COUNT", "1"],
    ["FORMAT", format],
    ["TRANSPARENT", "true"],
  ];


  if (typeof propertyNames === "string" && propertyNames.trim() !== "") {
    pairs.push(["PROPERTYNAME", propertyNames]);
  }

  if (version.startsWith("1.3")) {
    pairs.push(
      ["crs", crs],
      ["I", String(Math.round(pointPx.x))],
      ["J", String(Math.round(pointPx.y))]
    );
  } else {
    pairs.push(
      ["srs", crs],
      ["x", String(Math.round(pointPx.x))],
      ["y", String(Math.round(pointPx.y))]
    );
  }

  const infoUrlString = `${base}?${buildQueryStringFromPairs(pairs)}`;

  const resp = await fetch(infoUrlString);
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    console.warn(
      `[WMS][GetFeatureInfo] HTTP ${resp.status}: ${body.slice(0, 300)}`
    );
    return null;
  }

  const text = await resp.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // GeoServer reports invalid requests as an XML/HTML ServiceException with a
    // 200 status, which lands here. Surface it so silent failures are visible.
    console.warn(
      `[WMS][GetFeatureInfo] non-JSON response: ${text.slice(0, 300)}`
    );
    return null;
  }
  const feature = json?.features?.[0];
  if (!feature) return null;

  return {
    featureId: feature.id,
    properties: feature.properties || {},
    geometry: feature.geometry || null,
    coords: geometryToCoords(feature.geometry),
    raw: feature,
  };
}
