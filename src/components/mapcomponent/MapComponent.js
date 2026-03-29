import { useEffect, useState } from "react";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { getCurrentLocation } from "../../helpers/location";
import { useSelector } from "react-redux";
import { StyleSheet } from "react-native";
export default function MapComponent({
  handleMarkerPress,
  children,
  markerdrag,
  mapRef,
  onRegionChangeComplete,
  onMapLayout,
}) {
  const [location, setLocation] = useState();
  const { mapType } = useSelector((state) => state.map);
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const { coords } = await getCurrentLocation(false);
        if (!!coords) {
          setLocation(coords);
        }
      } catch (error) {}
    };
    fetchLocation();
  }, []);
  const initialRegion = location
    ? {
        longitude: location?.longitude,
        latitude: location?.latitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : undefined;

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={initialRegion}
      maxZoomLevel={30}
      poiClickEnabled={false}
      onPress={handleMarkerPress}
      onLongPress={handleMarkerPress}
      onRegionChangeComplete={onRegionChangeComplete}
      onLayout={onMapLayout}
      provider={PROVIDER_GOOGLE}
      showsUserLocation
      zoomControlEnabled
      mapType={mapType}
      showsIndoors={false}
      showsBuildings={false}
      moveOnMarkerPress={false}
      scrollEnabled={markerdrag ?? true}
      zoomEnabled={markerdrag ?? true}
      rotateEnabled={markerdrag ?? true}
      // followsUserLocation={true}
      showsPointsOfInterest={false}
    >
      {children}
    </MapView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },
});
