import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, HelperText, Switch, Text, TextInput } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import DocumentPicker from "react-native-document-picker";
import RNFB from "react-native-blob-util";
import dayjs from "dayjs";
import { SheetManager } from "react-native-actions-sheet";
import DatePicker from "react-native-date-picker";

import { Header } from "../../components/headers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SelectionInput from "../../components/inputs/SelectionInput";
import { COLORS, SPACINGS } from "../../core/theme";
import { kSheets } from "../../sheets";
import {
  BUILDING_FORM_INITIAL_VALUES,
  getVisibleConditionalFields,
  normalizeBoolean01,
  sanitizeBuildingDraftByVisibility,
  validateBuildingDraft,
} from "../../helpers/buildingDraft";
import { buildBuildingKml } from "../../helpers/buildingKml";
import { addBuildingsData, resetBuildingCoords } from "../../store/slices/map.slice";
import {
  getBuildingCreateData,
  getCtptOptionsFromCreateData,
  mapToOptions,
} from "../../service/building_service";

const INITIAL_DROPDOWNS = {
  ward: [],
  roadCode: [],
  structureType: [],
  functionalUse: [],
  useCategory: [],
  waterSource: [],
  toiletConnection: [],
  defecationPlace: [],
  licNames: [],
  buildingBin: [],
  preconnectedBin: [],
  sewerCode: [],
  drainCode: [],
  ctpt: [],
  waterSupply: [],
};

const getOptionLabel = (options, value) => {
  const found = options.find((item) => String(item.value) === String(value));
  return found?.label || "";
};

const formatTaxCode = (value) => {
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

const numericOnly = (value) => String(value ?? "").replace(/[^0-9]/g, "");

const CreateBuildingAfterDrawScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { contentsLabel } = useSelector((state) => state.auth);
  const { buildingCoords } = useSelector((state) => state.map);

  const [values, setValues] = useState(BUILDING_FORM_INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [houseImageFile, setHouseImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadMetaError, setLoadMetaError] = useState("");
  const [dropdowns, setDropdowns] = useState(INITIAL_DROPDOWNS);
  const [useCatByFunctional, setUseCatByFunctional] = useState({});
  const [activeDateField, setActiveDateField] = useState(null);

  const getLabel = (key) => contentsLabel?.[key] || key;
  const reqLabel = (key) => `${getLabel(key)} *`;

  const visible = useMemo(
    () => getVisibleConditionalFields(values),
    [values]
  );

  const fetchCreateData = async () => {
    try {
      setLoadingMeta(true);
      setLoadMetaError("");
      const response = await getBuildingCreateData();
      const d = response?.data?.data || {};
      let parsedUseCat = {};
      try {
        parsedUseCat =
          typeof d.usecatgsJson === "string"
            ? JSON.parse(d.usecatgsJson || "{}")
            : d.usecatgsJson || {};
      } catch {
        parsedUseCat = {};
      }

      setUseCatByFunctional(parsedUseCat);
      setDropdowns({
        ward: mapToOptions(d.ward),
        roadCode: mapToOptions(d.road_code),
        structureType: mapToOptions(d.structure_type),
        functionalUse: mapToOptions(d.functional_use),
        useCategory: [],
        waterSource: mapToOptions(d.water_source),
        toiletConnection: mapToOptions(d.toiletConnection),
        defecationPlace: mapToOptions(d.defecationPlace),
        licNames: mapToOptions(d.licNames),
        buildingBin: mapToOptions(d.buildingBin),
        preconnectedBin: mapToOptions(d.bin),
        sewerCode: mapToOptions(d.sewer_code),
        drainCode: mapToOptions(d.drain_code),
        ctpt: getCtptOptionsFromCreateData(d),
        waterSupply: mapToOptions(d.waterSupply),
      });
    } catch (error) {
      setLoadMetaError("Failed to load create form metadata.");
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    fetchCreateData();
  }, []);

  const openSelect = async (title, options, currentValue, onSelected) => {
    const selectedOption = options.find(
      (item) => String(item.value) === String(currentValue)
    );
    const payload = await SheetManager.show(kSheets.selectionSheet, {
      payload: {
        title,
        options,
        selectedOption,
      },
    });
    if (payload?.value !== undefined) {
      onSelected(String(payload.value));
    }
  };

  const setFieldValue = (key, value) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "functional_use_id") {
        const useCategoryOptions = mapToOptions(
          useCatByFunctional[String(value)] || {}
        );
        setDropdowns((prevDropdowns) => ({
          ...prevDropdowns,
          useCategory: useCategoryOptions,
        }));
        next.use_category_id = "";
      }

      if (key === "main_building" && String(value) !== "0") {
        next.building_associated_to = "";
      }

      if (key === "water_source_id" && String(value) !== "1") {
        next.watersupply_pipe_code = "";
      }

      if (key === "toilet_status" && String(value) === "1") {
        next.defecation_place = "";
        next.ctpt_name = "";
      }

      if (key === "toilet_status" && String(value) === "0") {
        next.sanitation_system_id = "";
        next.build_contain = "";
        next.sewer_code = "";
        next.drain_code = "";
        next.household_with_private_toilet = "";
        next.population_with_private_toilet = "";
      }

      if (key === "defecation_place" && String(value) !== "9") {
        next.ctpt_name = "";
      }

      if (key === "sanitation_system_id") {
        if (String(value) !== "11") next.build_contain = "";
        if (String(value) !== "1") next.sewer_code = "";
        if (String(value) !== "2") next.drain_code = "";
      }

      return next;
    });

    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onToggle = (key) => {
    const next = normalizeBoolean01(values[key], "0") === "1" ? "0" : "1";
    setFieldValue(key, next);
  };

  const pickHouseImage = async () => {
    try {
      const picked = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images],
      });
      if (picked?.size && picked.size > 5 * 1024 * 1024) {
        Alert.alert(getLabel("Error"), getLabel("Image size can not exceed 5 MB."));
        return;
      }
      setHouseImageFile({
        uri: picked.uri,
        type: picked.type || "image/jpeg",
        name: picked.name || "house.jpg",
      });
    } catch (error) {
      // picker cancelled
    }
  };

  const saveDraft = async () => {
    if (!Array.isArray(buildingCoords) || buildingCoords.length < 3) {
      Alert.alert(getLabel("Error"), getLabel("Please draw a valid building polygon first."));
      return;
    }

    const sanitizedValues = sanitizeBuildingDraftByVisibility(values);
    const validationErrors = validateBuildingDraft(sanitizedValues);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      Alert.alert(getLabel("Validation"), getLabel("Please fix form errors before saving."));
      return;
    }

    try {
      setSaving(true);
      const fileParts = [sanitizedValues.temp_building_code, sanitizedValues.tax_code].filter(Boolean);
      const fileBase = `${fileParts.join("_")}_${Date.now()}`;
      const kmlPath = `${RNFB.fs.dirs.DownloadDir}/${fileBase}.kml`;
      const xml = buildBuildingKml(buildingCoords, sanitizedValues.temp_building_code);
      await RNFB.fs.writeFile(kmlPath, xml);

      dispatch(
        addBuildingsData({
          ...sanitizedValues,
          coords: buildingCoords,
          path: kmlPath,
          kml_file_name: `${fileBase}.kml`,
          house_image: houseImageFile,
          upload_status: "pending",
          last_error: null,
          updated_at: dayjs().toISOString(),
        })
      );

      dispatch(resetBuildingCoords());
      Alert.alert(
        getLabel("Saved"),
        getLabel("Building draft has been saved locally and is ready to upload."),
        [{ text: getLabel("OK"), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(getLabel("Error"), getLabel("Building draft could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (key, label, props = {}) => (
    <View style={styles.inputWrap}>
      <TextInput
        mode="outlined"
        label={label}
        value={String(values[key] ?? "")}
        onChangeText={(text) => setFieldValue(key, text)}
        error={!!errors[key]}
        {...props}
      />
      {!!errors[key] && <HelperText type="error">{errors[key]}</HelperText>}
    </View>
  );

  const renderSelection = (key, label, options, title = label) => (
    <View style={styles.inputWrap}>
      <SelectionInput
        label={label}
        value={getOptionLabel(options, values[key])}
        error={!!errors[key]}
        onPress={() => openSelect(title, options, values[key], (val) => setFieldValue(key, val))}
      />
      {!!errors[key] && <HelperText type="error">{errors[key]}</HelperText>}
    </View>
  );

  const isOn = (key) => normalizeBoolean01(values[key], "0") === "1";

  const getDateValue = (key) => {
    const parsed = dayjs(values[key]);
    return parsed.isValid() ? parsed.toDate() : new Date();
  };

  const renderDateInput = (key, label, { required = false, maximumDate } = {}) => (
    <View style={styles.inputWrap}>
      <TextInput
        mode="outlined"
        label={required ? reqLabel(label) : getLabel(label)}
        value={String(values[key] ?? "")}
        editable={false}
        showSoftInputOnFocus={false}
        error={!!errors[key]}
        right={<TextInput.Icon icon="calendar" onPress={() => setActiveDateField(key)} />}
        onPressIn={() => setActiveDateField(key)}
      />
      {!!errors[key] && <HelperText type="error">{errors[key]}</HelperText>}
      <DatePicker
        modal
        mode="date"
        open={activeDateField === key}
        date={getDateValue(key)}
        maximumDate={maximumDate}
        onConfirm={(date) => {
          setFieldValue(key, dayjs(date).format("YYYY-MM-DD"));
          setActiveDateField(null);
        }}
        onCancel={() => setActiveDateField(null)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title={getLabel("Create Building")} />
      <LoadingSpinner isVisible={loadingMeta} title={getLabel("Loading form options")} />
      <ScrollView contentContainerStyle={styles.content}>
        {!!loadMetaError && (
          <View>
            <HelperText type="error">{loadMetaError}</HelperText>
            <Button mode="outlined" onPress={fetchCreateData}>
              Retry
            </Button>
          </View>
        )}
        <Text variant="titleMedium">{getLabel("Required Fields")}</Text>
        {renderInput("temp_building_code", reqLabel("Temp Building Code"))}
        {renderInput("tax_code", getLabel("Tax Code"), {
          placeholder: "ww-rrr-hhhh-xx",
          keyboardType: "numeric",
          onChangeText: (text) => setFieldValue("tax_code", formatTaxCode(text)),
        })}
        {renderDateInput("collected_date", "Collected Date (YYYY-MM-DD)", { required: true, maximumDate: new Date() })}
        {renderSelection("ward", reqLabel("Ward"), dropdowns.ward, getLabel("Ward"))}
        {renderSelection("road_code", reqLabel("Road Code"), dropdowns.roadCode, getLabel("Road Code"))}
        {renderInput("house_number", getLabel("House Number"))}
        {renderSelection(
          "structure_type_id",
          reqLabel("Structure Type"),
          dropdowns.structureType,
          getLabel("Structure Type")
        )}
        {renderDateInput("construction_year", "Construction Year (YYYY-MM-DD)", { required: true, maximumDate: new Date() })}
        {renderInput("floor_count", reqLabel("Floor Count"), { keyboardType: "decimal-pad" })}
        {renderSelection(
          "functional_use_id",
          reqLabel("Functional Use"),
          dropdowns.functionalUse,
          getLabel("Functional Use")
        )}
        {visible.use_category_id &&
          renderSelection(
            "use_category_id",
            reqLabel("Use Category"),
            dropdowns.useCategory,
            getLabel("Use Category")
          )}
        {renderSelection(
          "water_source_id",
          reqLabel("Water Source"),
          dropdowns.waterSource,
          getLabel("Water Source")
        )}

        <View style={styles.switchRow}>
          <Text>{getLabel("Main Building")}</Text>
          <Switch value={isOn("main_building")} onValueChange={() => onToggle("main_building")} />
        </View>
        {visible.building_associated_to &&
          renderSelection(
            "building_associated_to",
            reqLabel("Building Associated To"),
            dropdowns.buildingBin,
            getLabel("Building Bin")
          )}

        <View style={styles.switchRow}>
          <Text>{getLabel("LIC Status")}</Text>
          <Switch value={isOn("lic_status")} onValueChange={() => onToggle("lic_status")} />
        </View>
        {visible.lic_id &&
          renderSelection("lic_id", reqLabel("LIC ID"), dropdowns.licNames, getLabel("LIC Name"))}

        <View style={styles.switchRow}>
          <Text>{getLabel("Toilet Status")}</Text>
          <Switch value={isOn("toilet_status")} onValueChange={() => onToggle("toilet_status")} />
        </View>
        {!!errors.toilet_status && (
          <HelperText type="error">{errors.toilet_status}</HelperText>
        )}

        {visible.toilet_count &&
          renderInput("toilet_count", reqLabel("Toilet Count"), { keyboardType: "numeric" })}
        {visible.household_with_private_toilet &&
          renderInput("household_with_private_toilet", getLabel("Households with Private Toilet"), {
            keyboardType: "numeric",
            onChangeText: (text) => setFieldValue("household_with_private_toilet", numericOnly(text)),
          })}
        {visible.population_with_private_toilet &&
          renderInput("population_with_private_toilet", getLabel("Population with Private Toilet"), {
            keyboardType: "numeric",
            onChangeText: (text) => setFieldValue("population_with_private_toilet", numericOnly(text)),
          })}
        {visible.sanitation_system_id &&
          renderSelection(
            "sanitation_system_id",
            reqLabel("Sanitation System"),
            dropdowns.toiletConnection,
            getLabel("Toilet Connection")
          )}
        {visible.defecation_place &&
          renderSelection(
            "defecation_place",
            reqLabel("Defecation Place"),
            dropdowns.defecationPlace,
            getLabel("Defecation Place")
          )}
        {visible.ctpt_name &&
          renderSelection("ctpt_name", reqLabel("CTPT Name"), dropdowns.ctpt, getLabel("CTPT Name"))}
        {visible.build_contain &&
          renderSelection(
            "build_contain",
            reqLabel("Build Contain"),
            dropdowns.preconnectedBin,
            getLabel("Preconnected BIN")
          )}
        {visible.sewer_code &&
          renderSelection("sewer_code", reqLabel("Sewer Code"), dropdowns.sewerCode, getLabel("Sewer Code"))}
        {visible.drain_code &&
          renderSelection("drain_code", reqLabel("Drain Code"), dropdowns.drainCode, getLabel("Drain Code"))}
        {visible.watersupply_pipe_code &&
          renderSelection(
            "watersupply_pipe_code",
            reqLabel("Water Supply Pipe Code"),
            dropdowns.waterSupply,
            getLabel("Water Supply")
          )}

        {renderInput("population_served", reqLabel("Population Served"), {
          keyboardType: "numeric",
        })}
        {renderInput("house_locality", getLabel("House Locality / Address"))}

        <View style={styles.imageRow}>
          <Text numberOfLines={1} style={styles.fileName}>
            {houseImageFile?.name || getLabel("No house image selected")}
          </Text>
          <Button mode="outlined" onPress={pickHouseImage}>
            {getLabel("Pick Image")}
          </Button>
        </View>

        <Button
          mode="contained"
          onPress={saveDraft}
          loading={saving}
          disabled={saving || loadingMeta}
        >
          {getLabel("Save Locally")}
        </Button>
      </ScrollView>
    </View>
  );
};

export default CreateBuildingAfterDrawScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  content: {
    padding: SPACINGS.md,
    gap: SPACINGS.sm,
    paddingBottom: SPACINGS.xl,
  },
  inputWrap: {
    marginTop: 4,
  },
  switchRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  imageRow: {
    marginTop: 8,
    gap: 10,
  },
  fileName: {
    color: COLORS.dark,
  },
});
