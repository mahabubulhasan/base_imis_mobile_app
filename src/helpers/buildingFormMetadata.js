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

  return {
    ward: mapToOptions(metadata?.ward),
    roadCode: mapToOptions(metadata?.road_code),
    structureType: mapToOptions(metadata?.structure_type),
    functionalUse: mapToOptions(metadata?.functional_use),
    useCategory: mapToOptions(useCategoryMap),
    waterSource: mapToOptions(metadata?.water_source),
    toiletConnection: mapToOptions(metadata?.toilet_connection),
    defecationPlace: mapToOptions(metadata?.defecation_place),
    licNames: mapToOptions(metadata?.lic_names),
    buildingBin: mapToOptions(metadata?.building_bin),
    preconnectedBin: mapToOptions(metadata?.preconnected_bin),
    sewerCode: mapToOptions(metadata?.sewer_code),
    drainCode: mapToOptions(metadata?.drain_code),
    ctpt: mapToOptions(metadata?.ctpt),
    waterSupply: mapToOptions(metadata?.water_supply),
  };
};
