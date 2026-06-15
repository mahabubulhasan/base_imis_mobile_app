import React, {useRef, useEffect, useState, useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {INITIAL_LOCATION} from '../../core/constants/map';
import {useSelector} from 'react-redux';
import MapView, {Polygon, PROVIDER_GOOGLE} from 'react-native-maps';
import {askLocationPermission} from '../../helpers/permissions';
import {geometryToCoords, geometryToMapPoint} from '../../helpers/geo';
import {COLORS} from '../../core/theme';
import {Header} from '../../components/headers';
import {ErrorMessage} from '../../components/errorComponent';

const ApplicantMapScreen = ({route}) => {
  const mapRef = useRef();

  const {mapType} = useSelector(state => state.map);
  const {item} = route.params;

  const polygonCoords = useMemo(
    () => geometryToCoords(item?.geometry) ?? [],
    [item?.geometry],
  );

  const mapPoint = useMemo(
    () => geometryToMapPoint(item?.geometry),
    [item?.geometry],
  );

  const [location, setLocation] = useState(() => ({
    ...INITIAL_LOCATION,
    ...(mapPoint
      ? {
          longitude: mapPoint.longitude,
          latitude: mapPoint.latitude,
        }
      : {}),
  }));

  const [coords, setCoords] = useState(polygonCoords);
  const hasLocation = polygonCoords.length > 0;

  useEffect(() => {
    if (!hasLocation) {
      return;
    }

    askLocationPermission(() => {
      setCoords(polygonCoords);
      if (mapPoint) {
        setLocation(prev => ({
          ...prev,
          longitude: mapPoint.longitude,
          latitude: mapPoint.latitude,
        }));
      }
    });
  }, [hasLocation, mapPoint, polygonCoords]);

  const {contentsLabel} = useSelector(state => state.auth);
  const getLabel = key => contentsLabel?.[key] || key;

  return (
    <View style={styles.container}>
      <Header title={getLabel('Applicant Location')} />
      {hasLocation ? (
        <MapView
          onLayout={() => {
            mapRef.current?.setMapBoundaries(
              {latitude: 27.678, longitude: 85.442},
              {latitude: 27.587, longitude: 85.327},
            );

            mapRef.current?.animateToRegion(location);
          }}
          ref={mapRef}
          style={styles.map}
          initialRegion={location}
          region={location}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          zoomControlEnabled
          mapType={mapType}
          showsIndoors={false}
          minZoomLevel={13}
          showsBuildings={false}
          moveOnMarkerPress={false}
          showsPointsOfInterest={false}>
          {coords.length >= 1 && (
            <Polygon
              geodesic={false}
              strokeWidth={2}
              strokeColor={COLORS.error}
              fillColor="rgba(45,87,250,0.07)"
              coordinates={coords}
            />
          )}
        </MapView>
      ) : (
        <ErrorMessage
          message={getLabel('Location not available for this application.')}
        />
      )}
    </View>
  );
};

export default ApplicantMapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },
});
