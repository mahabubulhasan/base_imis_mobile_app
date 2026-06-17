import { useDispatch, useSelector } from "react-redux";
import { Alert, InteractionManager, StyleSheet, View } from "react-native";
import React, { useCallback, useMemo, useRef, useEffect, useState } from "react";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { INITIAL_LOCATION } from "../../core/constants/map";
import { MAP_SERVICE_BOUNDS } from "../../core/constants/wmsLayers";

import {
  storeContainmentCoords,
  removeContainmentCoords,
} from "../../store/slices/map.slice";
import { getCurrentLocation } from "../../helpers/location";
import { askLocationPermission } from "../../helpers/permissions";
import { FAB } from "react-native-paper";
import MapInfoButton from "../../components/containment_map/MapInfoButton";
import MapInfoModal from "../../components/containment_map/MapInfoModal";
import SaveDataModal from "../../components/containment_map/SaveDataModal";

import WmsView from "../../components/common/WmsView";
import WmsLayers from "../../components/map/WmsLayers";
import useWmsMapLayers from "../../hooks/useWmsMapLayers";
import { fetchWmsUrlsForScreen } from "../../store/thunks/fetchWmsUrlsForScreen";
import IonIcon from "react-native-vector-icons/Ionicons";
import { COLORS } from "../../core/theme";

const BuildingMapScreen = ({ navigation }) => {
  const mapRef = useRef();
  const dispatch = useDispatch();
  const [location, setLocation] = useState(INITIAL_LOCATION);
  const [modalVisible, setModalVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);

  const { containmentCoords, mapType, wmsUrls } = useSelector(
    (state) => state.map
  );
  const [showWmsLink, setShowWmsLink] = useState(true);
  const [showWmsDialog, setShowWmsDialog] = useState(false);
  const [roadWms, setRoadWms] = useState(true);
  const [wardWms, setWardWms] = useState(true);
  const [forceLayers, setForceLayers] = useState({});
  const [mapMounted, setMapMounted] = useState(false);

  const layerVisibility = useMemo(
    () => ({
      containment: showWmsLink,
      road: roadWms,
      ward: wardWms,
    }),
    [showWmsLink, roadWms, wardWms]
  );

  const { stagedLayers, handleRegionChangeComplete, zoom } = useWmsMapLayers({
    screenKey: "containment",
    mapMounted,
    wmsUrls,
    layerVisibility,
    forceLayers,
    debugLabel: "containment",
  });

  const toggleLayer = useCallback((layerKey, isOn, setter) => {
    const next = !isOn;
    setter(next);
    setForceLayers((prev) => {
      const updated = { ...prev };
      if (next) {
        updated[layerKey] = true;
      } else {
        delete updated[layerKey];
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    askLocationPermission(async () => {
      const position = await getCurrentLocation();
      setLocation({
        ...location,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    });

    dispatch(fetchWmsUrlsForScreen("containment"));

    return () => dispatch(removeContainmentCoords());
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setMapMounted(true);
    });
    return () => task.cancel();
  }, [location]);

  const handlePressOnMap = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    dispatch(storeContainmentCoords({ latitude, longitude }));
  };

  const handlePressOnMarker = () => {
    Alert.alert(
      "Delete",
      "Are you sure you want to remove the marker from the map?",
      [
        {
          text: "Yes",
          onPress: () => dispatch(removeContainmentCoords()),
        },
        {
          text: "Cancel",
        },
      ]
    );
  };

  const onDragEnd = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const payload = { latitude, longitude };
    dispatch(storeContainmentCoords(payload));
  };

  const closeVisibleModals = () => {
    dispatch(removeContainmentCoords());
    setModalVisible(false);
    setSaveModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <MapView
        onLayout={() =>
          mapRef.current.setMapBoundaries(
            MAP_SERVICE_BOUNDS.northEast,
            MAP_SERVICE_BOUNDS.southWest
          )
        }
        ref={mapRef}
        style={styles.map}
        initialRegion={location}
        onPress={handlePressOnMap}
        onRegionChangeComplete={handleRegionChangeComplete}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        zoomControlEnabled
        mapType={mapType}
        showsIndoors={false}
        showsBuildings={false}
        minZoomLevel={13}
        moveOnMarkerPress={false}
        showsPointsOfInterest={false}
      >
        {containmentCoords && (
          <Marker
            draggable
            coordinate={containmentCoords}
            onDragEnd={onDragEnd}
            onPress={handlePressOnMarker}
          />
        )}

        <WmsLayers
          debugLabel="containment"
          wmsUrls={wmsUrls}
          eligibleLayers={stagedLayers}
          layerVisibility={layerVisibility}
        />
      </MapView>
      <MapInfoButton onPress={setModalVisible} />

      <FAB
        animated={false}
        style={styles.fab}
        icon={() => <IonIcon name="layers" size={25} color="white" />}
        onPress={() => setShowWmsDialog(true)}
      />

      <WmsView
        visible={showWmsDialog}
        mode="Containment"
        onDismiss={() => setShowWmsDialog(false)}
        onWmsPress={() => toggleLayer("containment", showWmsLink, setShowWmsLink)}
        onRoadWmsPress={() => toggleLayer("road", roadWms, setRoadWms)}
        onWardWmsPress={() => toggleLayer("ward", wardWms, setWardWms)}
        isWmsOn={showWmsLink}
        isRoadWmsOn={roadWms}
        isWardWmsOn={wardWms}
        currentZoom={zoom}
        primaryLayerKey="containment"
      />

      <MapInfoModal
        visible={modalVisible}
        onClose={setModalVisible}
        onNext={() => setSaveModalVisible(true)}
      />
      <SaveDataModal
        visible={saveModalVisible}
        onClose={setSaveModalVisible}
        onDataSaved={closeVisibleModals}
      />
    </View>
  );
};

export default BuildingMapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  fab: {
    position: "absolute",
    bottom: 110,
    marginLeft: 15,
    backgroundColor: COLORS.primary,
  },
});
