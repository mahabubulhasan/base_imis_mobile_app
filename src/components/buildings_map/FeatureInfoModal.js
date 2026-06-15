import React from "react";
import {ScrollView, StyleSheet, View} from "react-native";
import {Button, Caption, Dialog, Divider, Portal, Text} from "react-native-paper";
import {useSelector} from "react-redux";

import HorizontalSpacer from "../common/HorizontalSpacer";
import {COLORS, SPACINGS} from "../../core/theme";

// Generic read-only info box for a tapped map feature. Renders label/value rows
// (same style as BuildingDataScreen) inside the app's standard Portal + Dialog.
// Passing `onEdit` adds the Edit action; omit it for read-only layers.
const FeatureInfoModal = ({visible, title, rows = [], onClose, onEdit, editLabel}) => {
  const {contentsLabel} = useSelector(state => state.auth);
  const getLabel = key => contentsLabel?.[key] || key;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        <Text variant="titleLarge" style={styles.title}>
          {title || getLabel("Information")}
        </Text>
        <Divider style={styles.titleDivider} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollArea}
        >
          {rows.length === 0 ? (
            <Caption style={styles.empty}>
              {getLabel("No information available")}
            </Caption>
          ) : (
            rows.map(row => (
              <View style={styles.row} key={row.key}>
                <Caption style={styles.label}>{row.label}</Caption>
                <Text style={styles.value}>{row.value}</Text>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.actions}>
          <Button onPress={onClose} style={styles.actionBtn}>
            {getLabel("Close")}
          </Button>
          {onEdit ? (
            <>
              <HorizontalSpacer size={18} />
              <Button mode="contained" onPress={onEdit} style={styles.editBtn}>
                {editLabel || getLabel("EDIT")}
              </Button>
            </>
          ) : null}
        </View>
      </Dialog>
    </Portal>
  );
};

export default React.memo(FeatureInfoModal);

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 16,
    maxHeight: "80%",
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
  },
  titleDivider: {
    marginTop: 16,
    marginBottom: 6,
  },
  scrollArea: {
    paddingHorizontal: SPACINGS.md,
    paddingBottom: SPACINGS.sm,
  },
  row: {
    paddingVertical: SPACINGS.xxs,
  },
  label: {
    color: COLORS.dark,
  },
  value: {
    fontSize: 16,
  },
  empty: {
    textAlign: "center",
    paddingVertical: SPACINGS.md,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 38,
    marginBottom: 22,
  },
  actionBtn: {
    paddingHorizontal: 8,
  },
  editBtn: {
    borderRadius: 8,
  },
});
