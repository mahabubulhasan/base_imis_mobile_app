import React, { useState, useEffect } from "react";
import { Alert, StyleSheet, View, Platform } from "react-native";
import { WMSTile } from "react-native-maps";
import { useSelector } from "react-redux";
import MapComponent from "../../components/mapcomponent/MapComponent";
import { Header } from "../../components/headers";
import { ROUTES } from "../../core/constants/routes";
import { askStoragePermission } from "../../helpers/permissions";
import {
  getBuildingFeatureInfoByCoordinate,
  getBuildingWmslink,
} from "../../service/building_service";

const EmptyingBuildingPickerScreen = ({ navigation, route }) => {
  const { contentsLabel } = useSelector((state) => state.auth);
  const selectedBuildingId = route?.params?.selectedBuildingId;
  const [selectedId, setSelectedId] = useState(selectedBuildingId || "");
  const [wmslinks, setWmslink] = useState("");

  const getLabel = (key) => contentsLabel?.[key] || key;

  useEffect(() => {
      if (Platform.constants.Release < 13) {
        askStoragePermission();
      }
      getWmsLink();
    }, []);

  const getWmsLink = () => {
      getBuildingWmslink()
        .then((response) => {
          const { data } = response.data;

          setWmslink(response.data.baseUrl + data.buildings);
        })
        .catch((err) => {
          console.log("Error!!", err);

          if (err?.response?.status === 500) {
            Alert.alert(
              "500",
              "Something is wrong, please try again or at a later time."
            );
          }
        });
    };

  const formatFeatureProperties = (feature, index) => {
    const props = feature?.properties || {};
    const lines = Object.entries(props)
      .filter(([, value]) => value !== null && value !== undefined && value !== "")
      .map(([key, value]) => `${key}: ${value}`);

    if (!lines.length) {
      return `Feature ${index + 1}: No properties`;
    }

    return [...lines].join("\n");
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    if (!wmslinks) {
      Alert.alert("Feature info", "Map layer is not ready yet.");
      return;
    }

    try {
      const features = await getBuildingFeatureInfoByCoordinate({
        wmsUrl: wmslinks,
        latitude,
        longitude,
      });

      if (!features.length) {
        Alert.alert(
          "Feature info",
          `No feature found at:\nLat: ${latitude.toFixed(6)}\nLng: ${longitude.toFixed(6)}`
        );
        return;
      }

      const feature = features[0];
      const bin = feature?.properties?.bin;
      const featureText = formatFeatureProperties(feature, 0);

      Alert.alert(
        getLabel("Selected Building"),
        featureText,
        [
          { text: getLabel("Cancel"), style: "cancel" },
          {
            text: getLabel("Confirm"),
            onPress: () => {
              const nextSelectedId = bin || "";
              setSelectedId(nextSelectedId);
              navigation.navigate({
                name: ROUTES.empty_submission,
                params: { selectedBuilding: nextSelectedId },
                merge: true,
              });
            },
          },
        ]
      );
    } catch (error) {
      console.log("Error fetching feature info", error);
      Alert.alert("Feature info", "Unable to fetch features for this location.");
    }
  };

  return (
    <View style={styles.container}>
      <Header title={getLabel("Select Building")} />
      <MapComponent handleMarkerPress={handleMapPress}>
        {wmslinks && (
          <WMSTile
            urlTemplate={wmslinks}
            zIndex={1}
            opacity={0.5}
            tileSize={512}
          />
        )}
      </MapComponent>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default EmptyingBuildingPickerScreen;
