import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { InteractionManager, StyleSheet, View } from "react-native";
import { INITIAL_LOCATION } from "../../core/constants/map";

import { useDispatch, useSelector } from "react-redux";
import MapView, { Polygon, PROVIDER_GOOGLE } from "react-native-maps";
import { COLORS } from "../../core/theme";
import { FAB } from "react-native-paper";
import IonIcon from "react-native-vector-icons/Ionicons";
import WmsView from "../../components/common/WmsView";
import WmsLayers from "../../components/map/WmsLayers";
import useWmsMapLayers from "../../hooks/useWmsMapLayers";
import { fetchWmsUrlsForScreen } from "../../store/thunks/fetchWmsUrlsForScreen";
import { Header } from "../../components/headers";
import { getCenter } from "geolib";

const KmlViewerMapScreen = ({ route, navigation }) => {
  const mapRef = useRef();
  const [location, setLocation] = useState(INITIAL_LOCATION);
  const { mapType, wmsUrls } = useSelector((state) => state.map);
  const { contentsLabel } = useSelector((state) => state.auth);
  const { item } = route.params;
  const getLabel = (key) => contentsLabel?.[key] || key;
  const dispatch = useDispatch();

  const [showWmsDialog, setShowWmsDialog] = useState(false);
  const [showWmsLink, setShowWmsLink] = useState(true);
  const [roadWms, setRoadWms] = useState(true);
  const [wardWms, setWardWms] = useState(true);
  const [forceLayers, setForceLayers] = useState({});
  const [mapMounted, setMapMounted] = useState(false);

  const layerVisibility = useMemo(
    () => ({
      building: showWmsLink,
      road: roadWms,
      ward: wardWms,
    }),
    [showWmsLink, roadWms, wardWms]
  );

  const { stagedLayers, handleRegionChangeComplete } = useWmsMapLayers({
    screenKey: "kml",
    mapMounted,
    wmsUrls,
    layerVisibility,
    forceLayers,
    debugLabel: "kml",
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
    getLocation();
    dispatch(fetchWmsUrlsForScreen("kml"));
  }, []);

  useEffect(() => {
    if (!location) {
      return undefined;
    }

    const task = InteractionManager.runAfterInteractions(() => {
      setMapMounted(true);
    });

    return () => task.cancel();
  }, [location]);
  const getLocation = (async) => {
    try {
      if (item) {
        const coordinates = item?.coords;
        const center = getCenter(coordinates);
        if (center) {
          setLocation({
            ...location,
            latitude: center?.latitude,
            longitude: center?.longitude,
          });
        }
        console.log("Coordinates", center);
      }
    } catch (error) {}
  };
  return (
    <View style={styles.container}>
      <Header
        title={getLabel("Building Location")}
        showMapStyle={location ? true : false}
      />
      {location && (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={location}
            region={location}
            onRegionChangeComplete={handleRegionChangeComplete}
            provider={PROVIDER_GOOGLE}
            showsUserLocation
            zoomControlEnabled
            mapType={mapType}
            showsIndoors={false}
            minZoomLevel={17}
            showsBuildings={false}
            moveOnMarkerPress={false}
            showsPointsOfInterest={false}
          >
            {/* <Polyline
              coordinates={'file://' + item.path}
              strokeColor={'orange'}
              strokeWidth={6}
              lineCap="round"
              lineDashPattern={[0]}
            /> */}

            {item?.coords.length > 0 && (
              <Polygon
                strokeWidth={2}
                strokeColor={COLORS.error}
                coordinates={[...item.coords, item.coords[0]]}
                fillColor="rgba(45,87,250,0.07)"
              />
            )}
            <WmsLayers
              debugLabel="kml"
              wmsUrls={wmsUrls}
              eligibleLayers={stagedLayers}
              layerVisibility={layerVisibility}
            />
          </MapView>
          <FAB
            animated={false}
            style={styles.fab}
            icon={() => <IonIcon name="layers" size={25} color="white" />}
            onPress={() => setShowWmsDialog(true)}
          />
          <WmsView
            visible={showWmsDialog}
            mode="Building"
            onDismiss={() => setShowWmsDialog(false)}
            onWmsPress={() => toggleLayer("building", showWmsLink, setShowWmsLink)}
            onRoadWmsPress={() => toggleLayer("road", roadWms, setRoadWms)}
            onWardWmsPress={() => toggleLayer("ward", wardWms, setWardWms)}
            isWmsOn={showWmsLink}
            isRoadWmsOn={roadWms}
            isWardWmsOn={wardWms}
          />
        </>
      )}
    </View>
  );
};

export default KmlViewerMapScreen;

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
