import {useMemo} from 'react';
import MapView, {PROVIDER_GOOGLE} from 'react-native-maps';
import {useSelector} from 'react-redux';
import {StyleSheet} from 'react-native';

export default function MapComponent({
  handleMarkerPress,
  children,
  markerdrag,
  mapRef,
  onRegionChangeComplete,
  onMapLayout,
  initialLocation,
}) {
  const {mapType} = useSelector(state => state.map);

  const initialRegion = useMemo(() => {
    if (!initialLocation?.latitude || !initialLocation?.longitude) {
      return undefined;
    }

    return {
      longitude: initialLocation.longitude,
      latitude: initialLocation.latitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [initialLocation?.latitude, initialLocation?.longitude]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={initialRegion}
      maxZoomLevel={20}
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
      showsPointsOfInterest={false}>
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
