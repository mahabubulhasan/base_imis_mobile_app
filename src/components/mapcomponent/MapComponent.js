import { useEffect, useState } from "react";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { getCurrentLocation } from "../../helpers/location";
import { useSelector } from "react-redux";
import { StyleSheet } from "react-native";
export default function MapComponent({
  handleMarkerPress,
  children,
  markerdrag,
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
        // console.log('LocationResponse', coords);
      } catch (error) {}
    };
    fetchLocation();
  }, []);
  return (
    <MapView
      style={styles.map}
      region={{
        longitude: location?.longitude,
        latitude: location?.latitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }}
      cameraZoomRange={{ minCenterCoordinateDistance: 0 }}
      poiClickEnabled={false}
      onPress={handleMarkerPress}
      onLongPress={handleMarkerPress}
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
