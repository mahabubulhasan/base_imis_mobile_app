import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Dialog, Divider, Portal } from "react-native-paper";
import { Checkbox, Text } from "react-native-paper";
import { COLORS } from "../../core/theme";
import { useSelector } from "react-redux";
import { ZOOM_LAYER_RULES } from "../../core/constants/wmsLayers";

const SewerWMSView = ({
  mode,
  visible,
  onDismiss,
  onWmsPress,
  onRoadWmsPress,
  onWardWmsPress,
  isWmsOn,
  isRoadWmsOn,
  isWardWmsOn,
  isSewerWmsOn,
  onSewerWMSPress,
  currentZoom,
}) => {
  const { contentsLabel } = useSelector((state) => state.auth);
  const getLabel = (key) => contentsLabel?.[key] || key;
  const sewerMinZ = ZOOM_LAYER_RULES.sewer?.minZ;
  const showSewerZoomHint =
    currentZoom != null &&
    sewerMinZ != null &&
    currentZoom < sewerMinZ &&
    isSewerWmsOn;

  return (
    <Portal>
      <Dialog
        style={styles.container}
        visible={visible}
        onDismiss={onDismiss}
        theme={{ roundness: 2 }}
      >
        <Dialog.Content>
          <Dialog.Title style={styles.title}>
            {getLabel("WMS layers")}
          </Dialog.Title>

          {showSewerZoomHint ? (
            <Text style={styles.hint}>
              {getLabel("Zoom in for best sewer layer detail")}
            </Text>
          ) : null}

          <Divider />
          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.9}
            onPress={onWmsPress}
          >
            <Checkbox
              color={COLORS.primary}
              status={isWmsOn ? "checked" : "unchecked"}
            />
            <Text style={styles.text}>{getLabel("Building")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.9}
            onPress={onRoadWmsPress}
          >
            <Checkbox
              color={COLORS.primary}
              status={isRoadWmsOn ? "checked" : "unchecked"}
            />
            <Text style={styles.text}>{getLabel("Road")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.9}
            onPress={onWardWmsPress}
          >
            <Checkbox
              color={COLORS.primary}
              style={styles.checkBox}
              status={isWardWmsOn ? "checked" : "unchecked"}
            />
            <Text style={styles.text}>{getLabel("Ward")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.9}
            onPress={onSewerWMSPress}
          >
            <Checkbox
              color={COLORS.primary}
              style={styles.checkBox}
              status={isSewerWmsOn ? "checked" : "unchecked"}
            />
            <Text style={styles.text}>{getLabel("Sewer")}</Text>
          </TouchableOpacity>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  title: {
    textAlign: "center",
  },
  hint: {
    textAlign: "center",
    marginBottom: 8,
    color: COLORS.dark,
    fontSize: 14,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  text: {
    fontSize: 20,
  },

  container: {
    alignSelf: "center",
    padding: 10,
  },
});

export default React.memo(SewerWMSView);
