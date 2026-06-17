const toOptionMap = value =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const mapToOptions = obj =>
  Object.entries(toOptionMap(obj)).map(([value, label]) => ({
    value: String(value),
    label: String(label ?? ''),
  }));

export const buildFormDropdowns = (metadata, functionalUseId = '') => {
  const usecatgs = toOptionMap(metadata?.usecatgs_json);
  const useCategoryMap =
    usecatgs[functionalUseId] ?? usecatgs[String(functionalUseId)] ?? {};

  // Only the 8 static maps remain in form-metadata. Contextual/large lookups
  // (road_code, sewer_code, drain_code, water_supply, lic_names, building_bin,
  // preconnected_bin) are fetched on demand via building_lookup_service +
  // RemoteSelectionInput. See docs/building-form-search-apis-migration.md.
  return {
    ward: mapToOptions(metadata?.ward),
    structureType: mapToOptions(metadata?.structure_type),
    functionalUse: mapToOptions(metadata?.functional_use),
    useCategory: mapToOptions(useCategoryMap),
    waterSource: mapToOptions(metadata?.water_source),
    toiletConnection: mapToOptions(metadata?.toilet_connection),
    defecationPlace: mapToOptions(metadata?.defecation_place),
    ctpt: mapToOptions(metadata?.ctpt),
  };
};
