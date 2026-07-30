import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Alert, Platform, ScrollView, StyleSheet, Text, ToastAndroid, View} from "react-native";
import {ActivityIndicator, Button, HelperText, TextInput} from "react-native-paper";
import {useDispatch, useSelector} from "react-redux";
import DocumentPicker from "react-native-document-picker";
import RNFB from "react-native-blob-util";
import DatePicker from "react-native-date-picker";
import dayjs from "dayjs";

import {Header} from "../../components/headers";
import SelectionInput from "../../components/inputs/SelectionInput";
import RemoteSelectionInput from "../../components/inputs/RemoteSelectionInput";
import {LOOKUP_CASCADE} from "../../helpers/buildingLookupFields";
import {buildBuildingKml} from "../../helpers/buildingKml";
import BuildingDraftForm from "../../components/building/BuildingDraftForm";
import {mapLocalBuildingToFormValues} from "../../helpers/buildingDraft";
import {askStoragePermission} from "../../helpers/permissions";
import {updateBuildingData} from "../../store/slices/map.slice";
import {getOptionLabel, getYesNoOptions} from "../../helpers/buildingFormOptions";
import {openSelectionSheet} from "../../helpers/openSelectionSheet";
import useBuildingFormMetadata from "../../hooks/useBuildingFormMetadata";
import {getBuildingEditData, updateBuildingInfo} from "../../service/building_service";

/** CMS keys omit trailing *; UI appends it for required fields via reqLabel(). */
const MAX_HOUSE_IMAGE_FILE_SIZE = 5e6;
const INITIAL_OPTION_LIMIT = 20;

const pickFirst = (source, keys, fallback = "") => {
  for (const key of keys) {
    const val = source?.[key];
    if (val !== undefined && val !== null && String(val).trim() !== "") return val;
  }
  return fallback;
};

const formatTaxCode = value => {
  const cleaned = String(value ?? "")
    .replace(/[^0-9]/g, "")
    .slice(0, 11);

  const parts = [
    cleaned.slice(0, 2),
    cleaned.slice(2, 5),
    cleaned.slice(5, 9),
    cleaned.slice(9, 11),
  ].filter(Boolean);

  return parts.join("-");
};

const numericOnly = value => String(value ?? "").replace(/[^0-9]/g, "");

const shouldHaveValue = value => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
};

const normalizeYesNoValue = val => {
  const t = String(val ?? "").trim().toLowerCase();
  if (t === "") return "";
  if (["1", "true", "yes", "y"].includes(t)) return "1";
  if (["0", "false", "no", "n"].includes(t)) return "0";
  return String(val);
};

const normalizeGenderValue = val => {
  const t = String(val ?? "").trim().toLowerCase();
  if (t === "") return "";
  if (["0", "male", "m"].includes(t)) return "0";
  if (["1", "female", "f"].includes(t)) return "1";
  if (["2", "other", "others", "o"].includes(t)) return "2";
  return String(val);
};

const normalizeBuildingValues = raw => ({
  owner_name: String(pickFirst(raw, ["owner_name", "ownerName"], "")),
  nid: String(pickFirst(raw, ["nid", "owner_nid"], "")),
  owner_gender: normalizeGenderValue(pickFirst(raw, ["owner_gender", "gender"], "")),
  owner_contact: String(pickFirst(raw, ["owner_contact", "contact_number", "ownerPhone"], "")),

  main_building: normalizeYesNoValue(
    pickFirst(raw, ["main_building", "is_main_building", "mainBuilding"], "")
  ),
  building_associated_to: String(pickFirst(raw, ["building_associated_to", "bin_of_main_building", "associated_building_bin"], "")),

  ward: String(pickFirst(raw, ["ward", "ward_no", "wardNumber"], "")),
  road_code: String(pickFirst(raw, ["road_code", "roadCode"], "")),
  house_number: String(pickFirst(raw, ["house_number", "temp_building_code", "bin"], "")),
  house_locality: String(pickFirst(raw, ["house_locality", "house_address", "houseAddress"], "")),
  tax_code: String(pickFirst(raw, ["tax_code", "taxCode"], "")),

  structure_type_id: String(pickFirst(raw, ["structure_type_id", "structure_type", "structureType"], "")),
  surveyed_date: String(pickFirst(raw, ["surveyed_date", "surveyedDate"], "")),
  construction_year: String(pickFirst(raw, ["construction_year", "construction_date", "constructionDate"], "")),
  floor_count: String(pickFirst(raw, ["floor_count", "num_of_floors", "numOfFloors"], "")),

  functional_use_id: String(pickFirst(raw, ["functional_use_id", "functional_use", "functionalUseOfBuilding"], "")),
  use_category_id: String(pickFirst(raw, ["use_category_id", "use_category", "useCategory"], "")),
  office_business_name: String(pickFirst(raw, ["office_business_name", "office_name", "officeName"], "")),

  household_served: String(pickFirst(raw, ["household_served", "num_of_households", "numOfHouseholds"], "")),
  population_served: String(pickFirst(raw, ["population_served", "population_of_building", "populationOfBuilding"], "")),
  male_population: String(pickFirst(raw, ["male_population", "malePopulation"], "")),
  female_population: String(pickFirst(raw, ["female_population", "femalePopulation"], "")),
  other_population: String(pickFirst(raw, ["other_population", "otherPopulation"], "")),
  diff_abled_male_pop: String(pickFirst(raw, ["diff_abled_male_pop", "damp"], "")),
  diff_abled_female_pop: String(pickFirst(raw, ["diff_abled_female_pop", "dafp"], "")),
  diff_abled_others_pop: String(pickFirst(raw, ["diff_abled_others_pop", "daop"], "")),

  low_income_hh: normalizeYesNoValue(
    pickFirst(raw, ["low_income_hh", "is_low_income_house", "isLowIncomeHouse"], "")
  ),
  lic_status: normalizeYesNoValue(
    pickFirst(raw, ["lic_status", "located_in_lic", "locatedInLic"], "")
  ),
  lic_id: String(pickFirst(raw, ["lic_id", "lic_community", "licCommunity"], "")),

  water_source_id: String(pickFirst(raw, ["water_source_id", "main_drinking_source", "mainDrinkingSource"], "")),
  water_customer_id: String(pickFirst(raw, ["water_customer_id"], "")),
  watersupply_pipe_code: String(pickFirst(raw, ["watersupply_pipe_code"], "")),
  well_presence_status: normalizeYesNoValue(
    pickFirst(raw, ["well_presence_status", "well_in_premises", "wellInPremises"], "")
  ),
  distance_from_well: String(pickFirst(raw, ["distance_from_well"], "")),
  swm_customer_id: String(pickFirst(raw, ["swm_customer_id", "swmCustomerId"], "")),

  toilet_status: normalizeYesNoValue(
    pickFirst(raw, ["toilet_status", "presence_of_toilet", "presenceOfToilet"], "")
  ),
  toilet_count: String(pickFirst(raw, ["toilet_count"], "")),
  household_with_private_toilet: String(pickFirst(raw, ["household_with_private_toilet"], "")),
  population_with_private_toilet: String(pickFirst(raw, ["population_with_private_toilet"], "")),
  sanitation_system_id: String(pickFirst(raw, ["sanitation_system_id", "building_sanitation_system"], "")),
  defecation_place: String(pickFirst(raw, ["defecation_place"], "")),
  ctpt_name: String(pickFirst(raw, ["ctpt_name"], "")),
  build_contain: String(pickFirst(raw, ["build_contain"], "")),
  desludging_vehicle_accessible: normalizeYesNoValue(
    pickFirst(raw, ["desludging_vehicle_accessible", "vacutug_accessible"], "")
  ),
  sewer_code: String(pickFirst(raw, ["sewer_code"], "")),
  drain_code: String(pickFirst(raw, ["drain_code"], "")),
});

const BuildingEditScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const {buildingsData} = useSelector(state => state.map);
  const {contentsLabel} = useSelector(state => state.auth);
  const getLabel = useCallback(key => contentsLabel?.[key] || key, [contentsLabel]);
  const reqLabel = useCallback(key => `${getLabel(key)} *`, [getLabel]);

  const source = route?.params?.source;
  const localIndex = route?.params?.index;
  const bin = route?.params?.bin;

  const [loadingEditData, setLoadingEditData] = useState(source === "wms");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [containmentList, setContainmentList] = useState([]);
  const {
    isReady,
    isInitialLoading,
    status: metadataStatus,
    error: metadataError,
    retry,
    getDropdowns,
  } = useBuildingFormMetadata();
  const scrollRef = useRef(null);
  const fieldYRef = useRef({});
  const [activeDateField, setActiveDateField] = useState(null);

  const [localSaving, setLocalSaving] = useState(false);

  const localBuildingItem = useMemo(() => {
    if (source !== "local") return null;
    return buildingsData?.[localIndex] ?? null;
  }, [buildingsData, localIndex, source]);

  const localFormInitialValues = useMemo(
    () => mapLocalBuildingToFormValues(localBuildingItem),
    [localBuildingItem],
  );

  const [values, setValues] = useState({
    owner_name: "",
    nid: "",
    owner_gender: "",
    owner_contact: "",
    main_building: "",
    building_associated_to: "",
    ward: "",
    road_code: "",
    house_number: "",
    house_locality: "",
    tax_code: "",
    structure_type_id: "",
    surveyed_date: "",
    construction_year: "",
    floor_count: "",
    functional_use_id: "",
    use_category_id: "",
    office_business_name: "",
    household_served: "",
    population_served: "",
    male_population: "",
    female_population: "",
    other_population: "",
    diff_abled_male_pop: "",
    diff_abled_female_pop: "",
    diff_abled_others_pop: "",
    low_income_hh: "",
    lic_status: "",
    lic_id: "",
    water_source_id: "",
    water_customer_id: "",
    watersupply_pipe_code: "",
    well_presence_status: "",
    distance_from_well: "",
    swm_customer_id: "",
    toilet_status: "",
    toilet_count: "",
    household_with_private_toilet: "",
    population_with_private_toilet: "",
    sanitation_system_id: "",
    defecation_place: "",
    ctpt_name: "",
    build_contain: "",
    desludging_vehicle_accessible: "",
    sewer_code: "",
    drain_code: "",
    houseImageFile: null,
  });

  const setFieldValue = useCallback((key, val) => {
    setValues(prev => {
      const next = {...prev, [key]: val};

      // Clear downstream lookups whose context just changed (ward -> road -> ...).
      (LOOKUP_CASCADE[key] || []).forEach(dependent => {
        next[dependent] = "";
      });

      if (key === "toilet_status" && String(val) !== "1") {
        next.sanitation_system_id = "";
        next.drain_code = "";
        next.sewer_code = "";
      }

      if (key === "sanitation_system_id") {
        if (String(val) !== "1") next.sewer_code = "";
        if (String(val) !== "2") next.drain_code = "";
      }

      return next;
    });
    setFieldErrors(prev => {
      if (!prev[key]) return prev;
      const next = {...prev};
      delete next[key];
      return next;
    });
  }, []);

  const registerField = key => e => {
    const y = e?.nativeEvent?.layout?.y;
    if (typeof y === "number") fieldYRef.current[key] = y;
  };

  const scrollToField = useCallback(key => {
    const y = fieldYRef.current[key];
    console.debug(y);
    console.debug(fieldYRef);
    console.debug(fieldYRef.current);
    if (typeof y === "number" && scrollRef.current?.scrollTo) {
      console.debug('IN IF');
      scrollRef.current.scrollTo({y: Math.max(0, y - 16), animated: true});
    }
  }, []);

  const showAssociatedBuilding = useMemo(() => String(values.main_building) !== "1", [values.main_building]);
  const showLicId = useMemo(() => String(values.lic_status) === "1", [values.lic_status]);
  const showWaterPipe = useMemo(() => String(values.water_source_id) === "5", [values.water_source_id]); // 5 = Municipal/Public Water Supply
  const showWellDistance = useMemo(() => String(values.well_presence_status) === "1", [values.well_presence_status]);
  const showToiletConnection = useMemo(() => String(values.toilet_status) === "1", [values.toilet_status]);
  const showSewerCode = useMemo(
    () => showToiletConnection && String(values.sanitation_system_id) === "1",
    [showToiletConnection, values.sanitation_system_id],
  );
  const showDrainCode = useMemo(
    () => showToiletConnection && String(values.sanitation_system_id) === "2",
    [showToiletConnection, values.sanitation_system_id],
  );
  const showDefecation = useMemo(() => String(values.toilet_status) === "0", [values.toilet_status]);
  const showCtpt = useMemo(() => String(values.defecation_place) === "9", [values.defecation_place]);

  useEffect(() => {
    if (source !== "local") return;
    if (!localBuildingItem) {
      Alert.alert(getLabel("Error"), getLabel("Local building not found."), [
        {text: getLabel("OK"), onPress: () => navigation.goBack()},
      ]);
    }
  }, [source, localBuildingItem, getLabel, navigation]);

  useEffect(() => {
    if (source !== "wms" || !bin) return;
    setLoadingEditData(true);
    (async () => {
      try {
        const res = await getBuildingEditData(bin);
        const {building = {}, containment = []} = res?.data?.data ?? {};
        setContainmentList(Array.isArray(containment) ? containment : []);
        const normalized = normalizeBuildingValues(building);
        setValues(prev => ({...prev, ...normalized}));
      } catch (e) {
        const message = e?.response?.data?.message || getLabel("Failed to load edit data.");
        if (e?.response?.status === 404) {
          Alert.alert(getLabel("Error"), message, [
            {text: getLabel("OK"), onPress: () => navigation.goBack()},
          ]);
        } else {
          Alert.alert(getLabel("Error"), message);
        }
      } finally {
        setLoadingEditData(false);
      }
    })();
  }, [bin, source, getLabel, navigation]);

  const yesNoOptions = useMemo(() => getYesNoOptions(getLabel), [getLabel]);

  const genderOptions = useMemo(
    () => [
      {label: getLabel("Male"), value: "0"},
      {label: getLabel("Female"), value: "1"},
      {label: getLabel("Other"), value: "2"},
    ],
    [getLabel],
  );

  const dropdowns = useMemo(
    () => getDropdowns(values.functional_use_id),
    [getDropdowns, values.functional_use_id],
  );

  // Static maps from form-metadata. Contextual lookups (road, lic, sewer, drain)
  // are server-backed via RemoteSelectionInput.
  const options = useMemo(
    () => ({
      ward: dropdowns.ward,
      structure: dropdowns.structureType,
      functional: dropdowns.functionalUse,
      useCategory: dropdowns.useCategory,
      waterSource: dropdowns.waterSource,
      toiletConn: dropdowns.toiletConnection,
      defecation: dropdowns.defecationPlace,
      ctpt: dropdowns.ctpt,
    }),
    [dropdowns],
  );

  // Server-backed lookup field (resolves saved labels via cache -> server).
  const renderRemote = (key, label, title = label) => (
    <RemoteSelectionInput
      field={key}
      label={label}
      title={title}
      value={values[key]}
      values={values}
      error={!!fieldErrors[key]}
      onChange={val => setFieldValue(key, val)}
    />
  );

  const openSelect = async (title, list, current, onSelected, searchable = true) => {
    const selected = await openSelectionSheet({
      title,
      options: list,
      selectedValue: current,
      searchable,
      initialVisibleLimit: INITIAL_OPTION_LIMIT,
    });
    if (selected) onSelected(selected.value);
  };

  const validateWms = useCallback(() => {
    const errs = {};
    const req = (k, requiredMsgKey, cond = true) => {
      if (!cond) return;
      if (!shouldHaveValue(values[k]) && values[k] !== "0") errs[k] = getLabel(requiredMsgKey);
    };
    req("owner_name", "Owner Name is required.");
    req("owner_gender", "Owner Gender is required.");
    req("owner_contact", "Owner Contact is required.");
    req("main_building", "Main Building is required.");
    req("ward", "Ward is required.");
    req("road_code", "Road Code is required.");
    req("structure_type_id", "Structure Type is required.");
    req("construction_year", "Construction Year (YYYY-MM-DD) is required.");
    req("floor_count", "Floor Count is required.");
    req("functional_use_id", "Functional Use is required.");
    req("household_served", "Household Served is required.");
    req("population_served", "Population Served is required.");
    req("low_income_hh", "Low Income Household is required.");
    req("lic_status", "LIC Status is required.");
    req("water_source_id", "Water Source is required.");
    req("toilet_status", "Toilet Status is required.");
    req("building_associated_to", "Building Associated To is required.", showAssociatedBuilding);
    req("lic_id", "LIC Name is required.", showLicId);
    req("water_customer_id", "Water Customer ID is required.", showWaterPipe);
    req("distance_from_well", "Distance from well is required.", showWellDistance);
    req("toilet_count", "Toilet Count is required.", showToiletConnection);
    req("sanitation_system_id", "Sanitation System is required.", showToiletConnection);
    req("sewer_code", "Sewer Code is required.", showSewerCode);
    req("drain_code", "Drain Code is required.", showDrainCode);
    req("defecation_place", "Defecation Place is required.", showDefecation);
    req("ctpt_name", "CTPT Name is required.", showCtpt);
    return errs;
  }, [
    getLabel,
    showAssociatedBuilding,
    showCtpt,
    showDrainCode,
    showDefecation,
    showLicId,
    showSewerCode,
    showToiletConnection,
    showWaterPipe,
    showWellDistance,
    values,
  ]);

  const showError = key => (fieldErrors[key] ? <HelperText type="error">{fieldErrors[key]}</HelperText> : null);

  const getDateValue = key => {
    const parsed = dayjs(values[key]);
    return parsed.isValid() ? parsed.toDate() : new Date();
  };

  const renderDateInput = (key, label, {required = false, maximumDate} = {}) => (
    <View onLayout={registerField(key)}>
      <TextInput
        label={required ? reqLabel(label) : getLabel(label)}
        value={String(values[key] ?? "")}
        editable={false}
        showSoftInputOnFocus={false}
        error={!!fieldErrors[key]}
        right={<TextInput.Icon icon="calendar" onPress={() => setActiveDateField(key)} />}
        onPressIn={() => setActiveDateField(key)}
      />
      {showError(key)}
      <DatePicker
        modal
        mode="date"
        open={activeDateField === key}
        date={getDateValue(key)}
        maximumDate={maximumDate}
        onConfirm={date => {
          setFieldValue(key, dayjs(date).format("YYYY-MM-DD"));
          setActiveDateField(null);
        }}
        onCancel={() => setActiveDateField(null)}
      />
    </View>
  );

  const handleWmsSubmit = async () => {
    const errs = validateWms();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      const first = Object.keys(errs)[0];
      if (first) scrollToField(first);
      return;
    }

    try {
      setSaving(true);
      const payload = {...values};
      delete payload.houseImageFile;
      if (values.houseImageFile) payload.house_image = values.houseImageFile;

      await updateBuildingInfo(bin, payload);
      setFieldErrors({});
      Alert.alert(getLabel("Saved"), getLabel("Building information updated successfully."), [
        {text: getLabel("OK"), onPress: () => navigation.goBack()},
      ]);
    } catch (e) {
      const apiErrors = e?.response?.data?.errors;
      const errorMessage = e?.response?.data?.message;

      if (apiErrors && typeof apiErrors === "object") {
        const mapped = {};
        Object.entries(apiErrors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? String(v[0]) : String(v);
        });
        setFieldErrors(mapped);

        // Show toast notification for validation errors
        const message = errorMessage || getLabel("Please fix the errors below");
        if (Platform.OS === "android") {
          ToastAndroid.show(message, ToastAndroid.LONG);
        } else {
          Alert.alert(getLabel("Validation Error"), message);
        }

        const first = Object.keys(mapped)[0];
        if (first) scrollToField(first);
        return;
      }

      Alert.alert(getLabel("Error"), errorMessage || getLabel("Failed to update building."));
    } finally {
      setSaving(false);
    }
  };

  const handleLocalSave = async ({sanitizedValues, houseImageFile}) => {
    const item = buildingsData?.[localIndex];
    if (!item?.coords?.length) {
      return Alert.alert(getLabel("Error"), getLabel("Local building not found."));
    }

    try {
      setLocalSaving(true);
      const fileParts = [
        sanitizedValues.temp_building_code,
        sanitizedValues.tax_code,
      ].filter(Boolean);
      const fileBase = `${fileParts.join("_")}_${Date.now()}`;
      const newPath = `${RNFB.fs.dirs.DownloadDir}/${fileBase}.kml`;
      const xml = buildBuildingKml(item.coords, sanitizedValues.temp_building_code);

      const write = async () => {
        await RNFB.fs.writeFile(newPath, xml);
        if (item.path && item.path !== newPath) {
          try {
            await RNFB.fs.unlink(item.path);
          } catch {}
        }
        dispatch(
          updateBuildingData({
            index: localIndex,
            patch: {
              ...sanitizedValues,
              coords: item.coords,
              path: newPath,
              kml_file_name: `${fileBase}.kml`,
              house_image: houseImageFile ?? item.house_image ?? null,
            },
          }),
        );
        Alert.alert(getLabel("Saved"), getLabel("Building updated."), [
          {text: getLabel("OK"), onPress: () => navigation.goBack()},
        ]);
      };

      if (Platform.constants.Release >= 13) {
        await write();
      } else {
        askStoragePermission(write);
      }
    } finally {
      setLocalSaving(false);
    }
  };

  const pickHouseImage = async () => {
    try {
      const file = await DocumentPicker.pickSingle({type: [DocumentPicker.types.images]});
      if (file?.size && file.size > MAX_HOUSE_IMAGE_FILE_SIZE)
        return Alert.alert(getLabel("Error"), getLabel("Image size can not exceed 5 MB."));
      setFieldValue("houseImageFile", file);
    } catch {}
  };

  const showWmsOverlay =
    source === "wms" &&
    (isInitialLoading || loadingEditData || (!isReady && metadataStatus === "failed"));

  if (source === "local") {
    if (!localBuildingItem) {
      return (
        <View style={{flex: 1}}>
          <Header title={getLabel("Edit Building")} />
        </View>
      );
    }

    return (
      <View style={{flex: 1}}>
        <Header title={getLabel("Edit Building")} />
        <BuildingDraftForm
          initialValues={localFormInitialValues}
          initialHouseImage={localBuildingItem.house_image ?? null}
          onSave={handleLocalSave}
          saveLabel={localSaving ? getLabel("Saving...") : getLabel("Save")}
          saving={localSaving}
        />
      </View>
    );
  }

  return (
    <View style={{flex: 1}}>
      <Header title={getLabel("Edit Building")} />
      <ScrollView ref={scrollRef} style={styles.container}>
        {isReady && !loadingEditData && (
          <>
        {!!values.house_number && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              {getLabel("Holding Id")}: {values.house_number}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{getLabel("Owner Information")}</Text>
          <View onLayout={registerField("owner_name")}>
            <TextInput
              label={reqLabel("Owner Name")}
              value={values.owner_name}
              error={!!fieldErrors.owner_name}
              onChangeText={t => setFieldValue("owner_name", t)}
            />
            {showError("owner_name")}
          </View>
          <View onLayout={registerField("nid")}>
            <TextInput
              label={getLabel("Owner NID")}
              value={values.nid}
              error={!!fieldErrors.nid}
              onChangeText={t => setFieldValue("nid", t)}
            />
            {showError("nid")}
          </View>
          <View onLayout={registerField("owner_gender")}>
            <SelectionInput
              label={reqLabel("Owner Gender")}
              error={!!fieldErrors.owner_gender}
              value={getOptionLabel(genderOptions, values.owner_gender)}
              onPress={() =>
                openSelect(getLabel("Owner Gender"), genderOptions, values.owner_gender, v => setFieldValue("owner_gender", v))
              }
            />
            {showError("owner_gender")}
          </View>
          <View onLayout={registerField("owner_contact")}>
            <TextInput
              label={reqLabel("Owner Contact")}
              value={values.owner_contact}
              error={!!fieldErrors.owner_contact}
              keyboardType="numeric"
              maxLength={11}
              onChangeText={t => setFieldValue("owner_contact", numericOnly(t).slice(0, 11))}
            />
            {showError("owner_contact")}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{getLabel("Building Information")}</Text>
          <View onLayout={registerField("main_building")}>
            <SelectionInput
              label={reqLabel("Main Building")}
              error={!!fieldErrors.main_building}
              value={getOptionLabel(yesNoOptions, values.main_building)}
              onPress={() =>
                openSelect(getLabel("Main Building"), yesNoOptions, values.main_building, v => setFieldValue("main_building", v), false)
              }
            />
            {showError("main_building")}
          </View>
          {showAssociatedBuilding && (
            <View onLayout={registerField("building_associated_to")}>
              {renderRemote(
                "building_associated_to",
                reqLabel("Building Associated To"),
                getLabel("Building Bin"),
              )}
              {showError("building_associated_to")}
            </View>
          )}
          <View onLayout={registerField("ward")}>
            <SelectionInput
              label={reqLabel("Ward")}
              error={!!fieldErrors.ward}
              value={getOptionLabel(options.ward, values.ward)}
              onPress={() => openSelect(getLabel("Ward"), options.ward, values.ward, v => setFieldValue("ward", v))}
            />
            {showError("ward")}
          </View>
          <View onLayout={registerField("road_code")}>
            {renderRemote("road_code", reqLabel("Road Code"), getLabel("Road Code"))}
            {showError("road_code")}
          </View>
          <View onLayout={registerField("house_number")}>
            <TextInput
              label={getLabel("Holding Id")}
              value={values.house_number}
              error={!!fieldErrors.house_number}
              onChangeText={t => setFieldValue("house_number", t)}
            />
            {showError("house_number")}
          </View>
          <View onLayout={registerField("house_locality")}>
            <TextInput
              label={getLabel("Address")}
              value={values.house_locality}
              error={!!fieldErrors.house_locality}
              onChangeText={t => setFieldValue("house_locality", t)}
            />
            {showError("house_locality")}
          </View>
          <View onLayout={registerField("tax_code")}>
            <TextInput
              label={getLabel("Tax Code")}
              placeholder="ww-rrr-hhhh-xx"
              value={values.tax_code}
              error={!!fieldErrors.tax_code}
              keyboardType="numeric"
              onChangeText={t => setFieldValue("tax_code", formatTaxCode(t))}
            />
            {showError("tax_code")}
          </View>
          <View onLayout={registerField("structure_type_id")}>
            <SelectionInput
              label={reqLabel("Structure Type")}
              error={!!fieldErrors.structure_type_id}
              value={getOptionLabel(options.structure, values.structure_type_id)}
              onPress={() =>
                openSelect(getLabel("Structure Type"), options.structure, values.structure_type_id, v =>
                  setFieldValue("structure_type_id", v),
                )
              }
            />
            {showError("structure_type_id")}
          </View>
          {renderDateInput("surveyed_date", "Surveyed Date", {maximumDate: new Date()})}
          {renderDateInput("construction_year", "Construction Year", {required: true, maximumDate: new Date()})}
          <View onLayout={registerField("floor_count")}>
            <TextInput
              label={reqLabel("Number of Floors")}
              value={values.floor_count}
              error={!!fieldErrors.floor_count}
              keyboardType="numeric"
              onChangeText={t => setFieldValue("floor_count", numericOnly(t))}
            />
            {showError("floor_count")}
          </View>
          <View onLayout={registerField("population_served")}>
            <TextInput
              label={reqLabel("Population Served")}
              value={values.population_served}
              error={!!fieldErrors.population_served}
              keyboardType="numeric"
              onChangeText={t => setFieldValue("population_served", numericOnly(t))}
            />
            {showError("population_served")}
          </View>
          <View onLayout={registerField("functional_use_id")}>
            <SelectionInput
              label={reqLabel("Functional Use")}
              error={!!fieldErrors.functional_use_id}
              value={getOptionLabel(options.functional, values.functional_use_id)}
              onPress={() =>
                openSelect(getLabel("Functional Use"), options.functional, values.functional_use_id, v =>
                  setFieldValue("functional_use_id", v),
                )
              }
            />
            {showError("functional_use_id")}
          </View>
          <View onLayout={registerField("use_category_id")}>
            <SelectionInput
              label={getLabel("Use Category")}
              error={!!fieldErrors.use_category_id}
              value={getOptionLabel(options.useCategory, values.use_category_id)}
              onPress={() =>
                openSelect(getLabel("Use Category"), options.useCategory, values.use_category_id, v =>
                  setFieldValue("use_category_id", v),
                )
              }
            />
            {showError("use_category_id")}
          </View>
          <View onLayout={registerField("office_business_name")}>
            <TextInput
              label={getLabel("Office / Business Name")}
              value={values.office_business_name}
              error={!!fieldErrors.office_business_name}
              onChangeText={t => setFieldValue("office_business_name", t)}
            />
            {showError("office_business_name")}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{getLabel("Population")}</Text>
          <View onLayout={registerField("household_served")}>
            <TextInput
              label={reqLabel("Household Served")}
              value={values.household_served}
              error={!!fieldErrors.household_served}
              keyboardType="numeric"
              onChangeText={t => setFieldValue("household_served", numericOnly(t))}
            />
            {showError("household_served")}
          </View>
          <View onLayout={registerField("male_population")}>
            <TextInput
              label={getLabel("Male Population")}
              value={values.male_population}
              error={!!fieldErrors.male_population}
              keyboardType="numeric"
              onChangeText={t => setFieldValue("male_population", numericOnly(t))}
            />
            {showError("male_population")}
          </View>
          <View onLayout={registerField("female_population")}>
            <TextInput
              label={getLabel("Female Population")}
              value={values.female_population}
              error={!!fieldErrors.female_population}
              keyboardType="numeric"
              onChangeText={t => setFieldValue("female_population", numericOnly(t))}
            />
            {showError("female_population")}
          </View>
          <View onLayout={registerField("other_population")}>
            <TextInput
              label={getLabel("Other Population")}
              value={values.other_population}
              error={!!fieldErrors.other_population}
              keyboardType="numeric"
              onChangeText={t => setFieldValue("other_population", numericOnly(t))}
            />
            {showError("other_population")}
          </View>
          <View onLayout={registerField("diff_abled_male_pop")}>
            <TextInput
              label={getLabel("Differently Abled Male Population")}
              value={values.diff_abled_male_pop}
              error={!!fieldErrors.diff_abled_male_pop}
              keyboardType="numeric"
              onChangeText={t => setFieldValue("diff_abled_male_pop", numericOnly(t))}
            />
            {showError("diff_abled_male_pop")}
          </View>
          <View onLayout={registerField("diff_abled_female_pop")}>
            <TextInput
              label={getLabel("Differently Abled Female Population")}
              value={values.diff_abled_female_pop}
              error={!!fieldErrors.diff_abled_female_pop}
              keyboardType="numeric"
              onChangeText={t => setFieldValue("diff_abled_female_pop", numericOnly(t))}
            />
            {showError("diff_abled_female_pop")}
          </View>
          <View onLayout={registerField("diff_abled_others_pop")}>
            <TextInput
              label={getLabel("Differently Abled Other Population")}
              value={values.diff_abled_others_pop}
              error={!!fieldErrors.diff_abled_others_pop}
              keyboardType="numeric"
              onChangeText={t => setFieldValue("diff_abled_others_pop", numericOnly(t))}
            />
            {showError("diff_abled_others_pop")}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{getLabel("LIC Information")}</Text>
          <View onLayout={registerField("low_income_hh")}>
            <SelectionInput
              label={reqLabel("Low Income House")}
              error={!!fieldErrors.low_income_hh}
              value={getOptionLabel(yesNoOptions, values.low_income_hh)}
              onPress={() =>
                openSelect(getLabel("Low Income House"), yesNoOptions, values.low_income_hh, v => setFieldValue("low_income_hh", v), false)
              }
            />
            {showError("low_income_hh")}
          </View>
          <View onLayout={registerField("lic_status")}>
            <SelectionInput
              label={reqLabel("Located in LIC?")}
              error={!!fieldErrors.lic_status}
              value={getOptionLabel(yesNoOptions, values.lic_status)}
              onPress={() =>
                openSelect(getLabel("Located in LIC?"), yesNoOptions, values.lic_status, v => setFieldValue("lic_status", v), false)
              }
            />
            {showError("lic_status")}
          </View>
          {showLicId && (
            <View onLayout={registerField("lic_id")}>
              {renderRemote("lic_id", reqLabel("LIC Name"), getLabel("LIC Name"))}
              {showError("lic_id")}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{getLabel("Water Source Information")}</Text>
          <View onLayout={registerField("water_source_id")}>
            <SelectionInput
              label={reqLabel("Water Source")}
              error={!!fieldErrors.water_source_id}
              value={getOptionLabel(options.waterSource, values.water_source_id)}
              onPress={() =>
                openSelect(getLabel("Water Source"), options.waterSource, values.water_source_id, v =>
                  setFieldValue("water_source_id", v),
                )
              }
            />
            {showError("water_source_id")}
          </View>
          {showWaterPipe && (
            <>
              <View onLayout={registerField("water_customer_id")}>
                <TextInput
                  label={reqLabel("Water Customer ID")}
                  value={values.water_customer_id}
                  error={!!fieldErrors.water_customer_id}
                  onChangeText={t => setFieldValue("water_customer_id", t)}
                />
                {showError("water_customer_id")}
              </View>
              <View onLayout={registerField("watersupply_pipe_code")}>
                <TextInput
                  label={getLabel("Water Supply Pipe Code")}
                  value={values.watersupply_pipe_code}
                  error={!!fieldErrors.watersupply_pipe_code}
                  onChangeText={t => setFieldValue("watersupply_pipe_code", t)}
                />
                {showError("watersupply_pipe_code")}
              </View>
            </>
          )}
          <View onLayout={registerField("well_presence_status")}>
            <SelectionInput
              label={reqLabel("Well in Premises")}
              error={!!fieldErrors.well_presence_status}
              value={getOptionLabel(yesNoOptions, values.well_presence_status)}
              onPress={() =>
                openSelect(getLabel("Well in Premises"), yesNoOptions, values.well_presence_status, v =>
                  setFieldValue("well_presence_status", v), false,
                )
              }
            />
            {showError("well_presence_status")}
          </View>
          {showWellDistance && (
            <View onLayout={registerField("distance_from_well")}>
              <TextInput
                label={reqLabel("Distance from Well")}
                value={values.distance_from_well}
                error={!!fieldErrors.distance_from_well}
                onChangeText={t => setFieldValue("distance_from_well", t)}
              />
              {showError("distance_from_well")}
            </View>
          )}
          <View onLayout={registerField("swm_customer_id")}>
            <TextInput
              label={getLabel("SWM Customer ID")}
              value={values.swm_customer_id}
              error={!!fieldErrors.swm_customer_id}
              onChangeText={t => setFieldValue("swm_customer_id", t)}
            />
            {showError("swm_customer_id")}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{getLabel("Sanitation System Information")}</Text>
          <View onLayout={registerField("toilet_status")}>
            <SelectionInput
              label={reqLabel("Presence of Toilet")}
              error={!!fieldErrors.toilet_status}
              value={getOptionLabel(yesNoOptions, values.toilet_status)}
              onPress={() =>
                openSelect(getLabel("Presence of Toilet"), yesNoOptions, values.toilet_status, v => setFieldValue("toilet_status", v), false)
              }
            />
            {showError("toilet_status")}
          </View>
          {showToiletConnection ? (
            <>
              <View onLayout={registerField("toilet_count")}>
                <TextInput
                  label={reqLabel("Toilet Count")}
                  value={values.toilet_count}
                  error={!!fieldErrors.toilet_count}
                  onChangeText={t => setFieldValue("toilet_count", t)}
                />
                {showError("toilet_count")}
              </View>
              <View onLayout={registerField("household_with_private_toilet")}>
                <TextInput
                  label={getLabel("Households with Private Toilet")}
                  value={values.household_with_private_toilet}
                  error={!!fieldErrors.household_with_private_toilet}
                  onChangeText={t => setFieldValue("household_with_private_toilet", t)}
                />
                {showError("household_with_private_toilet")}
              </View>
              <View onLayout={registerField("population_with_private_toilet")}>
                <TextInput
                  label={getLabel("Population with Private Toilet")}
                  value={values.population_with_private_toilet}
                  error={!!fieldErrors.population_with_private_toilet}
                  onChangeText={t => setFieldValue("population_with_private_toilet", t)}
                />
                {showError("population_with_private_toilet")}
              </View>
              <View onLayout={registerField("sanitation_system_id")}>
                <SelectionInput
                  label={reqLabel("Sanitation System")}
                  error={!!fieldErrors.sanitation_system_id}
                  value={getOptionLabel(options.toiletConn, values.sanitation_system_id)}
                  onPress={() =>
                    openSelect(getLabel("Toilet Connection"), options.toiletConn, values.sanitation_system_id, v =>
                      setFieldValue("sanitation_system_id", v),
                    )
                  }
                />
                {showError("sanitation_system_id")}
              </View>
              {showDrainCode && (
                <View onLayout={registerField("drain_code")}>
                  {renderRemote("drain_code", reqLabel("Drain Code"), getLabel("Drain Code"))}
                  {showError("drain_code")}
                </View>
              )}
              {showSewerCode && (
                <View onLayout={registerField("sewer_code")}>
                  {renderRemote("sewer_code", reqLabel("Sewer Code"), getLabel("Sewer Code"))}
                  {showError("sewer_code")}
                </View>
              )}
              <View onLayout={registerField("desludging_vehicle_accessible")}>
                <SelectionInput
                  label={getLabel("Building Accessible to Desludging Vehicle")}
                  error={!!fieldErrors.desludging_vehicle_accessible}
                  value={getOptionLabel(yesNoOptions, values.desludging_vehicle_accessible)}
                  onPress={() =>
                    openSelect(
                      getLabel("Building Accessible to Desludging Vehicle"),
                      yesNoOptions,
                      values.desludging_vehicle_accessible,
                      v => setFieldValue("desludging_vehicle_accessible", v),
                      false,
                    )
                  }
                />
                {showError("desludging_vehicle_accessible")}
              </View>
            </>
          ) : (
            <>
              <View onLayout={registerField("defecation_place")}>
                <SelectionInput
                  label={reqLabel("Defecation Place")}
                  error={!!fieldErrors.defecation_place}
                  value={getOptionLabel(options.defecation, values.defecation_place)}
                  onPress={() =>
                    openSelect(getLabel("Defecation Place"), options.defecation, values.defecation_place, v =>
                      setFieldValue("defecation_place", v),
                    )
                  }
                />
                {showError("defecation_place")}
              </View>
              {showCtpt && (
                <View onLayout={registerField("ctpt_name")}>
                  <SelectionInput
                    label={reqLabel("CTPT Name")}
                    error={!!fieldErrors.ctpt_name}
                    value={getOptionLabel(options.ctpt, values.ctpt_name)}
                    onPress={() => openSelect(getLabel("CTPT Name"), options.ctpt, values.ctpt_name, v => setFieldValue("ctpt_name", v))}
                  />
                  {showError("ctpt_name")}
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{getLabel("House Image")}</Text>
          <Button mode="outlined" onPress={pickHouseImage}>
            {getLabel("Pick Image")}
          </Button>
          {!!values.houseImageFile && (
            <Text style={styles.fileMeta}>{values.houseImageFile?.name || getLabel("house.jpg")}</Text>
          )}
          <Text style={styles.helpText}>{getLabel("Image size can not exceed 5 MB.")}</Text>
        </View>

        <View style={styles.buttonArea}>
          <Button mode="contained" onPress={handleWmsSubmit} disabled={saving}>
            {saving ? getLabel("Saving...") : getLabel("Save")}
          </Button>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{getLabel("Containment Information")}</Text>
          {containmentList.length ? (
            containmentList.map((c, idx) => (
              <View key={`${c?.containment_id || idx}`} style={styles.containmentCard}>
                <Text style={styles.containmentTitle}>
                  {getLabel("Containment ID:")} {String(c?.containment_id || c?.id || "-")}
                </Text>
                <Text>
                  {getLabel("Sanitation System:")} {String(c?.toilet_name || c?.sanitation_system || "-")}
                </Text>
                <Text>
                  {getLabel("Containment Volume:")} {String(c?.containment_volume || c?.volume || "-")}
                </Text>
                <Text>
                  {getLabel("Containment Location:")} {String(c?.containment_location || c?.location || "-")}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.helpText}>{getLabel("No containment information available.")}</Text>
          )}
        </View>
          </>
        )}
      </ScrollView>
      {showWmsOverlay && (
        <View style={styles.overlay}>
          {isInitialLoading ? (
            <>
              <ActivityIndicator size="large" />
              <Text style={styles.overlayText}>{getLabel("Loading form options")}</Text>
            </>
          ) : loadingEditData ? (
            <>
              <ActivityIndicator size="large" />
              <Text style={styles.overlayText}>{getLabel("Loading edit data")}</Text>
            </>
          ) : (
            <>
              <HelperText type="error">{metadataError}</HelperText>
              <Button mode="outlined" onPress={retry}>
                {getLabel("Retry")}
              </Button>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 12},
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  overlayText: {marginTop: 8, fontSize: 16, textAlign: "center"},
  banner: {backgroundColor: "#12A6C4", borderRadius: 4, padding: 10, marginBottom: 10},
  bannerText: {color: "#fff", fontWeight: "700"},
  section: {gap: 8, marginBottom: 14},
  sectionTitle: {fontSize: 18, fontWeight: "700", marginTop: 2},
  buttonArea: {marginTop: 4, marginBottom: 12},
  fileMeta: {fontSize: 12, color: "#374151"},
  helpText: {fontSize: 12, color: "#6B7280"},
  containmentCard: {borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 6, padding: 10, gap: 2},
  containmentTitle: {fontWeight: "700"},
});

export default BuildingEditScreen;

