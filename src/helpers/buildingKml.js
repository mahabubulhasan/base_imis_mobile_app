import builder from "xmlbuilder";

export function buildBuildingKml(coordsOrOptions, placemarkName) {
  let coords;
  let name;

  if (
    coordsOrOptions &&
    typeof coordsOrOptions === "object" &&
    !Array.isArray(coordsOrOptions) &&
    coordsOrOptions.coords
  ) {
    coords = coordsOrOptions.coords;
    name = coordsOrOptions.tempBuildingCode;
  } else {
    coords = coordsOrOptions;
    name = placemarkName;
  }

  if (!Array.isArray(coords) || coords.length < 3) {
    throw new Error("At least 3 points are required to build a KML polygon.");
  }

  const first = coords[0];
  const ring = coords.map((item) => `${item.longitude},${item.latitude}`);
  ring.push(`${first.longitude},${first.latitude}`);

  return builder
    .create("kml", { encoding: "utf-8", standalone: "yes" })
    .att("xmlns", "http://www.opengis.net/kml/2.2")
    .ele("Document")
    .ele("Placemark")
    .ele("name", name || "building")
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
