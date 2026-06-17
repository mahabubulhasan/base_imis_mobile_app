export function geometryToCoords(geometry) {
  if (!geometry) return null;

  const type = geometry.type;
  const coordinates = geometry.coordinates;

  const toLatLng = ([x, y]) => ({longitude: x, latitude: y});

  if (type === 'Polygon') {
    const ring = coordinates?.[0];
    return Array.isArray(ring) ? ring.map(toLatLng) : null;
  }

  if (type === 'MultiPolygon') {
    const ring = coordinates?.[0]?.[0];
    return Array.isArray(ring) ? ring.map(toLatLng) : null;
  }

  return null;
}

export function geometryToMapPoint(geometry) {
  const coords = geometryToCoords(geometry);
  return coords?.[0] ?? null;
}

export function isPointInPolygon(point, polygon) {
  if (!point || !polygon || polygon.length < 3) return false;

  const x = point.longitude;
  const y = point.latitude;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

