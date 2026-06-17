export function parseBuildingWmsUrl(response) {
  const {data, baseUrl} = response?.data ?? {};
  if (!baseUrl || !data?.buildings) {
    return null;
  }
  return `${baseUrl}${data.buildings}`;
}

export function parseRoadWmsUrl(response) {
  const {data, baseUrl} = response?.data ?? {};
  if (!baseUrl || !data?.roads) {
    return null;
  }
  return `${baseUrl}${data.roads}`;
}

export function parseWardWmsUrl(response) {
  const {data, baseUrl} = response?.data ?? {};
  if (!baseUrl || !data?.wards) {
    return null;
  }
  return `${baseUrl}${data.wards}`;
}

export function parseContainmentWmsUrl(response) {
  const {data, baseUrl} = response?.data ?? {};
  if (baseUrl && data?.containments) {
    return `${baseUrl}${data.containments}`;
  }
  return data?.wmslinks ?? null;
}

export function parseSewerWmsUrl(response) {
  const {data, baseUrl} = response?.data ?? {};
  if (!baseUrl || !data?.sewers) {
    return null;
  }
  return `${baseUrl}${data.sewers}`;
}
