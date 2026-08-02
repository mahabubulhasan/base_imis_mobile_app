import {getOptionLabel, getYesNoOptions} from "./buildingFormOptions";
import {BUILDINGS_LAYER_PROPERTY_ORDER} from "../service/buildings_layer_property_names";

// Builds the human-readable [{key, label, value}] rows shown in the map feature
// info box, for three data shapes: WMS building attributes, local (drafted)
// building items stored as IDs, and arbitrary WMS features (road/ward).

const NA = "N/A";

const isEmpty = value =>
  value === null || value === undefined || String(value).trim() === "";

// snake_case / camelCase -> "Title Case", used as a label fallback when the CMS
// has no translation for a key.
export const humanizeKey = key =>
  String(key ?? "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());

// getLabel returns the key itself when no CMS label exists, so fall back to a
// humanized version of the key in that case.
const makeLabel = (getLabel, key) => {
  if (FIELD_LABEL_OVERRIDES[key]) return FIELD_LABEL_OVERRIDES[key];
  const fromCms = getLabel?.(key);
  return fromCms && fromCms !== key ? fromCms : humanizeKey(key);
};

const FIELD_LABEL_OVERRIDES = {
  house_number: 'Holding ID',
  house_locality: 'Address',
};

// Geometry / bookkeeping keys that should never be displayed on any layer.
const HIDDEN_KEYS = new Set([
  "geometry",
  "geom",
  "the_geom",
  "bbox",
  "boundedBy",
  "user_id",
  "created_at",
  "updated_at",
  "deleted_at",
]);

const GENDER_KEYS = new Set(["owner_gender", "gender"]);
const YESNO_KEYS = new Set([
  "main_building",
  "low_income_hh",
  "lic_status",
  "well_presence_status",
  "toilet_status",
  "desludging_vehicle_accessible",
]);

const genderLabel = (value, getLabel) => {
  const t = String(value).trim().toLowerCase();
  if (["0", "male", "m"].includes(t)) return getLabel("Male");
  if (["1", "female", "f"].includes(t)) return getLabel("Female");
  if (["2", "other", "others", "o"].includes(t)) return getLabel("Other");
  return String(value);
};

const yesNoLabel = (value, getLabel) => {
  const t = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(t)) return getLabel("YES");
  if (["0", "false", "no", "n"].includes(t)) return getLabel("NO");
  return String(value);
};

// Maps a small set of coded keys (shared by WMS building + generic features) to
// readable values. Keys it doesn't recognise pass through unchanged.
const formatCodedValue = (key, value, getLabel) => {
  if (GENDER_KEYS.has(key)) return genderLabel(value, getLabel);
  if (YESNO_KEYS.has(key)) return yesNoLabel(value, getLabel);
  return String(value);
};

// Builds a row, showing empty/null values as "N/A" rather than hiding them.
// `formatter` is only applied to non-empty raw values, so it never has to
// guard against null itself.
const makeRow = (getLabel, key, raw, formatter = String) => ({
  key,
  label: makeLabel(getLabel, key),
  value: isEmpty(raw) ? NA : formatter(raw),
});

// WMS building feature: values are already human-readable (e.g. *_name fields).
// Order by the curated list; append any extra returned keys after it.
export const buildWmsBuildingRows = (properties, getLabel) => {
  const props = properties || {};
  const rows = [];
  const seen = new Set();

  const add = key => {
    if (seen.has(key) || HIDDEN_KEYS.has(key) || !(key in props)) return;
    seen.add(key);
    rows.push(
      makeRow(getLabel, key, props[key], v => formatCodedValue(key, v, getLabel)),
    );
  };

  BUILDINGS_LAYER_PROPERTY_ORDER.forEach(add);
  Object.keys(props).forEach(add);

  return rows;
};

// Local building item: values are stored as IDs / coded values, so resolve
// dropdown labels via metadata and normalize yes/no & gender.
const LOCAL_FIELD_DESCRIPTORS = [
  {key: "temp_building_code"},
  {key: "tax_code"},
  {key: "house_number"},
  {key: "house_locality"},
  {key: "ward", dropdown: "ward"},
  {key: "road_code", dropdown: "roadCode"},
  {key: "main_building", format: "yesno"},
  {key: "building_associated_to"},
  {key: "structure_type_id", dropdown: "structureType"},
  {key: "construction_year"},
  {key: "floor_count"},
  {key: "functional_use_id", dropdown: "functionalUse"},
  {key: "use_category_id", dropdown: "useCategory"},
  {key: "water_source_id", dropdown: "waterSource"},
  {key: "watersupply_pipe_code"},
  {key: "household_served"},
  {key: "population_served"},
  {key: "lic_status", format: "yesno"},
  {key: "lic_id", dropdown: "licNames"},
  {key: "toilet_status", format: "yesno"},
  {key: "toilet_count"},
  {key: "household_with_private_toilet"},
  {key: "population_with_private_toilet"},
  {key: "sanitation_system_id", dropdown: "toiletConnection"},
  {key: "defecation_place", dropdown: "defecationPlace"},
  {key: "ctpt_name"},
  {key: "build_contain"},
  {key: "sewer_code", dropdown: "sewerCode"},
  {key: "drain_code", dropdown: "drainCode"},
  {key: "collected_date"},
];

// `dropdowns` must be built with the item's functional_use_id so use_category
// resolves correctly: getDropdowns(item.functional_use_id).
export const buildLocalBuildingRows = (item, dropdowns, getLabel) => {
  if (!item) return [];
  const yesNo = getYesNoOptions(getLabel);
  const rows = [];

  for (const desc of LOCAL_FIELD_DESCRIPTORS) {
    const formatter = raw => {
      if (desc.dropdown) {
        return getOptionLabel(dropdowns?.[desc.dropdown], raw) || String(raw);
      }
      if (desc.format === "yesno") {
        return getOptionLabel(yesNo, raw) || yesNoLabel(raw, getLabel);
      }
      if (desc.format === "gender") {
        return genderLabel(raw, getLabel);
      }
      return String(raw);
    };

    rows.push(makeRow(getLabel, desc.key, item[desc.key], formatter));
  }

  return rows;
};

// Generic WMS feature (road / ward) whose schema we don't curate: show every
// non-empty property, humanized.
export const buildGenericFeatureRows = (properties, getLabel) => {
  const props = properties || {};
  const rows = [];

  for (const key of Object.keys(props)) {
    if (HIDDEN_KEYS.has(key)) continue;
    rows.push(
      makeRow(getLabel, key, props[key], v => formatCodedValue(key, v, getLabel)),
    );
  }

  return rows;
};
