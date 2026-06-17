import React, {useState, useEffect, useMemo} from 'react';
import {Alert, StyleSheet, View, Platform, InteractionManager} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import MapComponent from '../../components/mapcomponent/MapComponent';
import WmsLayers from '../../components/map/WmsLayers';
import useWmsMapLayers from '../../hooks/useWmsMapLayers';
import {Header} from '../../components/headers';
import {ROUTES} from '../../core/constants/routes';
import {askStoragePermission} from '../../helpers/permissions';
import {getBuildingFeatureInfoByCoordinate} from '../../service/building_service';
import {fetchWmsUrlsForScreen} from '../../store/thunks/fetchWmsUrlsForScreen';

const EmptyingBuildingPickerScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const {contentsLabel} = useSelector(state => state.auth);
  const {wmsUrls} = useSelector(state => state.map);
  const selectedBuildingId = route?.params?.selectedBuildingId;
  const [selectedId, setSelectedId] = useState(selectedBuildingId || '');
  const [mapMounted, setMapMounted] = useState(false);
  const featureInfoBusyRef = React.useRef(false);

  const layerVisibility = useMemo(() => ({building: true}), []);

  const {stagedLayers, handleRegionChangeComplete} = useWmsMapLayers({
    screenKey: 'picker',
    mapMounted,
    wmsUrls,
    layerVisibility,
    forceLayers: {building: true},
    debugLabel: 'picker',
  });

  const getLabel = key => contentsLabel?.[key] || key;

  useEffect(() => {
    if (Platform.constants.Release < 13) {
      askStoragePermission();
    }
    dispatch(fetchWmsUrlsForScreen('picker'));
  }, [dispatch]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setMapMounted(true);
    });
    return () => task.cancel();
  }, []);

  const KEY_LABELS = {
    bin: 'BIN',
    owner_name: 'Owner Name',
    owner_contact: 'Owner Contact',
    ward: 'Ward',
    tax_code: 'Tax Code',
  };

  const formatFeatureProperties = (feature, index) => {
    const props = feature?.properties || {};
    const lines = Object.entries(props)
      .filter(
        ([, value]) => value !== null && value !== undefined && value !== '',
      )
      .map(([key, value]) => `${KEY_LABELS[key] ?? key}: ${value}`);

    if (!lines.length) {
      return `Feature ${index + 1}: No properties`;
    }

    return [...lines].join('\n');
  };

  const handleMapPress = async event => {
    const {latitude, longitude} = event.nativeEvent.coordinate;
    const buildingUrl = wmsUrls?.building;

    if (!buildingUrl) {
      Alert.alert('Feature info', 'Map layer is not ready yet.');
      return;
    }

    if (featureInfoBusyRef.current) {
      return;
    }

    featureInfoBusyRef.current = true;
    try {
      const features = await getBuildingFeatureInfoByCoordinate({
        wmsUrl: buildingUrl,
        latitude,
        longitude,
      });

      if (!features.length) {
        Alert.alert('Feature info', 'No feature found.');
        return;
      }

      const feature = features[0];
      const bin = feature?.properties?.bin;
      const featureText = formatFeatureProperties(feature, 0);

      Alert.alert(getLabel('Selected Building'), featureText, [
        {text: getLabel('Cancel'), style: 'cancel'},
        {
          text: getLabel('Confirm'),
          onPress: () => {
            const nextSelectedId = bin || '';
            setSelectedId(nextSelectedId);
            navigation.navigate({
              name: ROUTES.empty_submission,
              params: {selectedBuilding: nextSelectedId},
              merge: true,
            });
          },
        },
      ]);
    } catch (error) {
      console.log('Error fetching feature info', error);
      Alert.alert('Feature info', 'Unable to fetch features for this location.');
    } finally {
      featureInfoBusyRef.current = false;
    }
  };

  return (
    <View style={styles.container}>
      <Header title={getLabel('Select Building')} />
      {mapMounted ? (
        <MapComponent
          handleMarkerPress={handleMapPress}
          onRegionChangeComplete={handleRegionChangeComplete}>
          <WmsLayers
            debugLabel="picker"
            wmsUrls={wmsUrls}
            eligibleLayers={stagedLayers}
            layerVisibility={layerVisibility}
          />
        </MapComponent>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default EmptyingBuildingPickerScreen;
