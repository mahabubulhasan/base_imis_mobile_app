import React, { useState } from "react";
import { useSelector } from "react-redux";
import RNFB from "react-native-blob-util";
import { Alert, Platform, ScrollView, StyleSheet } from "react-native";
import { useDispatch } from "react-redux";

import { COLORS, SPACINGS } from "../../core/theme";
import { askStoragePermission } from "../../helpers/permissions";
import { addBuildingsData } from "../../store/slices/map.slice";
import { buildBuildingKml } from "../../helpers/kml/buildingKml";
import BuildingFormModal from "./BuildingFormModal";

const SaveDataModal = ({ visible, onClose, onDataSaved }) => {
  const dispatch = useDispatch();
  const { contentsLabel } = useSelector((state) => state.auth);
  const { buildingCoords } = useSelector((state) => state.map);
  const defaultImage =
    "https://st3.depositphotos.com/23594922/31822/v/600/depositphotos_318221368-stock-illustration-missing-picture-page-for-website.jpg";

  const getLabel = (key) => contentsLabel?.[key] || key;
  const [submitting, setSubmitting] = useState(false);

  const writeKmlAndStore = async ({ temp_building_code, tax_code }) => {
    if (!buildingCoords?.length) return;
    setSubmitting(true);
    const xml = buildBuildingKml({
      tempBuildingCode: temp_building_code,
      coords: buildingCoords,
    });

    const path = `${RNFB.fs.dirs.DownloadDir}/${temp_building_code}_${tax_code}.kml`;

    const finalize = () => {
      onDataSaved();
      setSubmitting(false);
    };

    const doWrite = () =>
      RNFB.fs
        .writeFile(path, xml)
        .then(() => {
          const payload = {
            temp_building_code,
            tax_code,
            path,
            coords: buildingCoords,
          };
          dispatch(addBuildingsData(payload));

          Alert.alert(
            getLabel("Saved"),
            getLabel("Building data saved to local storage"),
            [{ text: getLabel("OK") }]
          );
        })
        .catch(() => {})
        .finally(finalize);

    if (Platform.constants.Release >= 13) {
      await doWrite();
      return;
    }

    askStoragePermission(() => {
      doWrite();
    });
  };
  return (
    <BuildingFormModal
      visible={visible}
      onClose={onClose}
      initialValues={{ temp_building_code: "", tax_code: "" }}
      title={getLabel("Save Building Info")}
      submitLabel={submitting ? getLabel("Saving...") : getLabel("Save")}
      onSubmit={writeKmlAndStore}
    />
  );
};

export default SaveDataModal;

const styles = StyleSheet.create({
  scrollArea: {
    paddingTop: SPACINGS.md,
    paddingBottom: SPACINGS.lg,
  },

  errorText: {
    color: COLORS.error,
  },
});
