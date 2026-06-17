import client from "../axios";
import {URLS} from "../core/constants/urls";
import {mapToOptions} from "../helpers/buildingFormMetadata";

// On-demand lookups split out of form-metadata. Each returns a normalized
// [{value, label}] list from the `{status, message, data}` envelope, where
// `data` is an OptionMap (Record<id, label>). See
// docs/building-form-search-apis-migration.md.

// Drop undefined/empty params so we never send `?q=` etc.
const cleanParams = params => {
  const out = {};
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      out[key] = value;
    }
  }
  return out;
};

const getOptions = async (url, params) => {
  const res = await client.get(url, {
    params: cleanParams(params),
    headers: {Accept: "application/json"},
  });
  return mapToOptions(res?.data?.data);
};

export const searchRoads = ({ward, q, limit}) =>
  getOptions(URLS.roadsSearch, {ward, q, limit});

export const searchSewers = ({road_code, q, limit}) =>
  getOptions(URLS.sewersSearch, {road_code, q, limit});

export const searchDrains = ({road_code, q, limit}) =>
  getOptions(URLS.drainsSearch, {road_code, q, limit});

export const searchWaterSupplies = ({road_code, q, limit}) =>
  getOptions(URLS.waterSuppliesSearch, {road_code, q, limit});

export const searchLics = ({q, limit} = {}) =>
  getOptions(URLS.licsSearch, {q, limit});

export const searchBins = ({q, type, limit}) =>
  getOptions(URLS.binsSearch, {q, type, limit});
