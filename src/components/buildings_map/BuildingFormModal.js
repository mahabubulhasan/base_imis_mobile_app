import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  Button,
  Dialog,
  HelperText,
  Portal,
  TextInput,
} from "react-native-paper";
import { useSelector } from "react-redux";

import { COLORS, SPACINGS } from "../../core/theme";
import VerticalSpacer from "../common/VerticalSpacer";
import HorizontalSpacer from "../common/HorizontalSpacer";

const BuildingFormModal = ({
  visible,
  onClose,
  initialValues,
  title,
  submitLabel,
  onSubmit,
}) => {
  const { contentsLabel } = useSelector((state) => state.auth);
  const getLabel = (key) => contentsLabel?.[key] || key;

  const initialTempCode = initialValues?.temp_building_code ?? "";
  const initialTaxCode = initialValues?.tax_code ?? "";

  const [buildingId, setBuildingId] = useState(initialTempCode);
  const [taxCode, setTaxCode] = useState(initialTaxCode);

  const [buildingIdError, setBuildingIdError] = useState(null);
  const [taxCodeError, setTaxCodeError] = useState(null);

  useEffect(() => {
    if (visible) {
      setBuildingId(initialTempCode);
      setTaxCode(initialTaxCode);
      setBuildingIdError(null);
      setTaxCodeError(null);
    }
  }, [visible, initialTempCode, initialTaxCode]);

  const dialogTitle = useMemo(() => {
    if (title) return title;
    return getLabel("Save Building Info");
  }, [title, getLabel]);

  const dialogSubmit = useMemo(() => {
    if (submitLabel) return submitLabel;
    return getLabel("Save");
  }, [submitLabel, getLabel]);

  const validateData = () => {
    setBuildingIdError(null);
    setTaxCodeError(null);

    if (buildingId === "") {
      setBuildingIdError(getLabel("Temporary building code can not be empty!"));
      return false;
    }

    if (taxCode === "") {
      setTaxCodeError(getLabel("Tax Code can not be empty!"));
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    const isValid = validateData();
    if (!isValid) return;
    onSubmit?.({ temp_building_code: buildingId, tax_code: taxCode });
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={() => onClose(false)}
        style={{ borderRadius: 16 }}
      >
        <Dialog.Title>{dialogTitle}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollArea}
          >
            <TextInput
              autoFocus
              mode="outlined"
              value={buildingId}
              onChangeText={setBuildingId}
              error={!!buildingIdError}
              label={getLabel("Temporary Building Code")}
            />
            {buildingIdError && (
              <HelperText style={styles.errorText}>{buildingIdError}</HelperText>
            )}
            <VerticalSpacer />
            <TextInput
              mode="outlined"
              value={taxCode}
              label={getLabel("Tax Code")}
              onChangeText={setTaxCode}
              error={!!taxCodeError}
            />
            {taxCodeError && (
              <HelperText style={styles.errorText}>{taxCodeError}</HelperText>
            )}
            <VerticalSpacer />
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={() => onClose(false)}>{getLabel("Close")}</Button>
          <HorizontalSpacer size={18} />
          <Button mode="contained" onPress={handleSubmit}>
            {dialogSubmit}
          </Button>
          <HorizontalSpacer />
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default BuildingFormModal;

const styles = StyleSheet.create({
  scrollArea: {
    paddingTop: SPACINGS.md,
    paddingBottom: SPACINGS.lg,
  },
  errorText: {
    color: COLORS.error,
  },
});

