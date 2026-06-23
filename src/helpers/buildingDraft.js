import dayjs from "dayjs";

export const BUILDING_FORM_INITIAL_VALUES = {
  temp_building_code: "",
  tax_code: "",
  collected_date: dayjs().format("YYYY-MM-DD"),
  owner_name: "",
  owner_gender: "",
  owner_contact: "",
  ward: "",
  road_code: "",
  structure_type_id: "",
  construction_year: "",
  floor_count: "",
  functional_use_id: "",
  use_category_id: "",
  water_source_id: "",
  toilet_status: "1",
  main_building: "1",
  building_associated_to: "",
  lic_status: "0",
  lic_id: "",
  watersupply_pipe_code: "",
  toilet_count: "",
  household_with_private_toilet: "",
  population_with_private_toilet: "",
  sanitation_system_id: "",
  defecation_place: "",
  ctpt_name: "",
  build_contain: "",
  sewer_code: "",
  drain_code: "",
  house_number: "",
  household_served: "",
  population_served: "",
  house_locality: "",
};

const REQUIRED_KEYS = [
  "temp_building_code",
  "tax_code",
  "collected_date",
  "owner_name",
  "owner_gender",
  "owner_contact",
  "ward",
  "road_code",
  "structure_type_id",
  "construction_year",
  "floor_count",
  "functional_use_id",
  "water_source_id",
  "toilet_status",
  "household_served",
  "population_served",
];

const isEmpty = (value) =>
  value === null || value === undefined || String(value).trim() === "";

export const normalizeBoolean01 = (value, fallback = "0") => {
  if (value === true || value === "1" || value === 1) {
    return "1";
  }

  if (value === false || value === "0" || value === 0) {
    return "0";
  }

  return fallback;
};

export const validateBuildingDraft = (values) => {
  const errors = {};

  REQUIRED_KEYS.forEach((key) => {
    if (isEmpty(values[key])) {
      errors[key] = "This field is required.";
    }
  });

  if (!isEmpty(values.collected_date) && !dayjs(values.collected_date, "YYYY-MM-DD", true).isValid()) {
    errors.collected_date = "Collected date must be YYYY-MM-DD.";
  }

  if (!isEmpty(values.construction_year)) {
    const parsed = dayjs(values.construction_year, "YYYY-MM-DD", true);
    if (!parsed.isValid()) {
      errors.construction_year = "Construction year must be YYYY-MM-DD.";
    } else if (parsed.isAfter(dayjs(), "day")) {
      errors.construction_year = "Construction year can not be in the future.";
    }
  }

  if (!isEmpty(values.owner_contact)) {
    const contact = String(values.owner_contact).replace(/[^0-9]/g, "");
    if (contact.length < 10 || contact.length > 11) {
      errors.owner_contact = "Owner contact must be 10-11 digits.";
    }
  }

  if (!isEmpty(values.floor_count)) {
    const floorCount = Number(values.floor_count);
    if (Number.isNaN(floorCount) || floorCount < 0.1) {
      errors.floor_count = "Floor count must be a number >= 0.1.";
    }
  }

  if (!isEmpty(values.household_served)) {
    const householdServed = Number(values.household_served);
    if (Number.isNaN(householdServed) || householdServed < 1) {
      errors.household_served = "Household served must be a number >= 1.";
    }
  }

  if (!isEmpty(values.population_served)) {
    const populationServed = Number(values.population_served);
    if (Number.isNaN(populationServed) || populationServed < 1) {
      errors.population_served = "Population served must be a number >= 1.";
    }
  }

  const mainBuilding = normalizeBoolean01(values.main_building, "1");
  const licStatus = normalizeBoolean01(values.lic_status, "0");
  const toiletStatus = normalizeBoolean01(values.toilet_status, "0");

  if (mainBuilding === "0" && isEmpty(values.building_associated_to)) {
    errors.building_associated_to = "This field is required when not a main building.";
  }

  if (licStatus === "1" && isEmpty(values.lic_id)) {
    errors.lic_id = "LIC Name is required when LIC status is yes.";
  }

  if (toiletStatus === "1") {
    if (isEmpty(values.toilet_count)) {
      errors.toilet_count = "Toilet count is required when toilet status is yes.";
    }
    if (isEmpty(values.sanitation_system_id)) {
      errors.sanitation_system_id =
        "Sanitation system is required when toilet status is yes.";
    }
    if (!isEmpty(values.household_with_private_toilet)) {
      const privateHouseholds = Number(values.household_with_private_toilet);
      const householdServed = Number(values.household_served);
      if (
        !Number.isNaN(privateHouseholds) &&
        !Number.isNaN(householdServed) &&
        privateHouseholds > householdServed
      ) {
        errors.household_with_private_toilet =
          "The household with private toilet must be less than or equal to household served.";
      }
    }
  } else {
    if (isEmpty(values.defecation_place)) {
      errors.defecation_place =
        "Defecation place is required when toilet status is no.";
    }
  }

  if (String(values.defecation_place) === "9" && isEmpty(values.ctpt_name)) {
    errors.ctpt_name = "CTPT name is required when defecation place is 9.";
  }

  if (
    String(values.sanitation_system_id) === "11" &&
    isEmpty(values.build_contain)
  ) {
    errors.build_contain = "Build contain is required when sanitation system is 11.";
  }

  if (
    String(values.sanitation_system_id) === "1" &&
    isEmpty(values.sewer_code)
  ) {
    errors.sewer_code = "Sewer code is required when sanitation system is 1.";
  }

  if (
    String(values.sanitation_system_id) === "2" &&
    isEmpty(values.drain_code)
  ) {
    errors.drain_code = "Drain code is required when sanitation system is 2.";
  }

  return errors;
};

export const getVisibleConditionalFields = (values) => {
  const mainBuilding = normalizeBoolean01(values.main_building, "1");
  const licStatus = normalizeBoolean01(values.lic_status, "0");
  const toiletStatus = normalizeBoolean01(values.toilet_status, "0");

  return {
    building_associated_to: mainBuilding === "0",
    lic_id: licStatus === "1",
    watersupply_pipe_code: String(values.water_source_id) === "5",
    toilet_count: toiletStatus === "1",
    household_with_private_toilet: toiletStatus === "1",
    population_with_private_toilet: toiletStatus === "1",
    sanitation_system_id: toiletStatus === "1",
    defecation_place: toiletStatus === "0",
    ctpt_name: String(values.defecation_place) === "9",
    build_contain: String(values.sanitation_system_id) === "11",
    sewer_code: String(values.sanitation_system_id) === "1",
    drain_code: String(values.sanitation_system_id) === "2",
    use_category_id: !isEmpty(values.functional_use_id),
  };
};

export const sanitizeBuildingDraftByVisibility = (values) => {
  const visible = getVisibleConditionalFields(values);
  const next = { ...values };

  if (!visible.building_associated_to) next.building_associated_to = "";
  if (!visible.lic_id) next.lic_id = "";
  if (!visible.watersupply_pipe_code) next.watersupply_pipe_code = "";
  if (!visible.toilet_count) next.toilet_count = "";
  if (!visible.household_with_private_toilet) next.household_with_private_toilet = "";
  if (!visible.population_with_private_toilet) next.population_with_private_toilet = "";
  if (!visible.sanitation_system_id) next.sanitation_system_id = "";
  if (!visible.defecation_place) next.defecation_place = "";
  if (!visible.ctpt_name) next.ctpt_name = "";
  if (!visible.build_contain) next.build_contain = "";
  if (!visible.sewer_code) next.sewer_code = "";
  if (!visible.drain_code) next.drain_code = "";
  if (!visible.use_category_id) next.use_category_id = "";

  return next;
};

export function mapLocalBuildingToFormValues(buildingItem) {
  const defaults = {...BUILDING_FORM_INITIAL_VALUES};

  if (!buildingItem) {
    return defaults;
  }

  const mapped = {...defaults};

  Object.keys(defaults).forEach(key => {
    const value = buildingItem[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      mapped[key] = String(value);
    }
  });

  if (buildingItem.temp_building_code) {
    mapped.temp_building_code = String(buildingItem.temp_building_code);
  }

  if (buildingItem.tax_code) {
    mapped.tax_code = String(buildingItem.tax_code);
  }

  mapped.main_building = normalizeBoolean01(
    buildingItem.main_building ?? mapped.main_building,
    mapped.main_building,
  );
  mapped.lic_status = normalizeBoolean01(
    buildingItem.lic_status ?? mapped.lic_status,
    mapped.lic_status,
  );
  mapped.toilet_status = normalizeBoolean01(
    buildingItem.toilet_status ?? mapped.toilet_status,
    mapped.toilet_status,
  );

  return mapped;
}
