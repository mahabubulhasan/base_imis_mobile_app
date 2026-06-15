import {
  searchRoads,
  searchSewers,
  searchDrains,
  searchWaterSupplies,
  searchLics,
  searchBins,
} from "../service/building_lookup_service";

// Rows fetched per request — both the no-query prefetch on open and each
// server search page.
export const LOOKUP_PAGE_SIZE = 15;

// Declarative policy for every searchable (server-backed) building form field.
// RemoteSelectionInput reads a field's config from here, so behavior is data —
// adding/retuning a lookup is a config edit, not new branching.
//
// Per field:
//   search(params)   -> calls the lookup service; params merge context + {q, limit}
//   context(values)  -> required params derived from current form values
//   enabled(values)  -> false disables the picker until its context is present
//   serverMinChars   -> min query length before hitting the server with `q`
//                       (below it, the sheet filters the cached/prefetched set)
//   prefetch         -> load the list on open with no `q` (false = type to search)
//   allowRawEntry    -> let the user keep a typed code when offline / no match
//   resolveBy        -> how to resolve a saved value's label:
//                       'q'  = search({...context, q: value})  (value is the code)
//                       'all'= prefetch full list, then match by value (id-keyed)
//   cacheKey(context)-> proxy-cache bucket (must include context that scopes results)

export const BUILDING_LOOKUP_FIELDS = {
  road_code: {
    search: searchRoads,
    context: v => ({ward: v.ward}),
    enabled: v => !!v.ward,
    serverMinChars: 1,
    prefetch: true,
    allowRawEntry: true,
    resolveBy: "q",
    limit: LOOKUP_PAGE_SIZE,
    cacheKey: ctx => `road:${ctx.ward}`,
  },
  sewer_code: {
    search: searchSewers,
    context: v => ({road_code: v.road_code}),
    enabled: v => !!v.road_code,
    serverMinChars: 1,
    prefetch: true,
    allowRawEntry: true,
    resolveBy: "q",
    limit: LOOKUP_PAGE_SIZE,
    cacheKey: ctx => `sewer:${ctx.road_code}`,
  },
  drain_code: {
    search: searchDrains,
    context: v => ({road_code: v.road_code}),
    enabled: v => !!v.road_code,
    serverMinChars: 1,
    prefetch: true,
    allowRawEntry: true,
    resolveBy: "q",
    limit: LOOKUP_PAGE_SIZE,
    cacheKey: ctx => `drain:${ctx.road_code}`,
  },
  watersupply_pipe_code: {
    search: searchWaterSupplies,
    context: v => ({road_code: v.road_code}),
    enabled: v => !!v.road_code,
    serverMinChars: 1,
    prefetch: true,
    allowRawEntry: true,
    resolveBy: "q",
    limit: LOOKUP_PAGE_SIZE,
    cacheKey: ctx => `water:${ctx.road_code}`,
  },
  lic_id: {
    search: searchLics,
    context: () => ({}),
    enabled: () => true,
    serverMinChars: 3,
    prefetch: true,
    allowRawEntry: false,
    resolveBy: "all",
    limit: LOOKUP_PAGE_SIZE,
    cacheKey: () => "lic",
  },
  building_associated_to: {
    search: ({q, limit}) => searchBins({q, limit, type: "building_bin"}),
    context: () => ({}),
    enabled: () => true,
    serverMinChars: 1,
    prefetch: false,
    allowRawEntry: true,
    resolveBy: "q",
    cacheKey: () => "bin:building_bin",
  },
  build_contain: {
    search: ({q, limit}) => searchBins({q, limit, type: "preconnected_bin"}),
    context: () => ({}),
    enabled: () => true,
    serverMinChars: 1,
    prefetch: false,
    allowRawEntry: true,
    resolveBy: "q",
    cacheKey: () => "bin:preconnected_bin",
  },
};

// Fields whose value must be cleared when an upstream context field changes.
export const LOOKUP_CASCADE = {
  ward: ["road_code", "sewer_code", "drain_code", "watersupply_pipe_code"],
  road_code: ["sewer_code", "drain_code", "watersupply_pipe_code"],
};

export const getLookupField = field => BUILDING_LOOKUP_FIELDS[field];
