import builder from "xmlbuilder";

export function buildBuildingKml({ tempBuildingCode, coords }) {
  if (!coords?.length) {
    throw new Error("coords_required");
  }

  const { latitude, longitude } = coords[0];
  const ring = coords.map((item) => `${item.longitude},${item.latitude}`);
  ring.push(`${longitude},${latitude}`);

  return builder
    .create("kml", { encoding: "utf-8", standalone: "yes" })
    .att("xmlns", "http://www.opengis.net/kml/2.2")
    .ele("Document")
    .ele("Placemark")
    .ele("name", tempBuildingCode || "")
    .up()
    .ele("Polygon")
    .ele("outerBoundaryIs")
    .ele("LinearRing")
    .ele("tessellate", "1")
    .up()
    .ele("coordinates", ring.join(" "))
    .up()
    .end({ pretty: true });
}

