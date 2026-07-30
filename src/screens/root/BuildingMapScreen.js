import {FAB, Text} from 'react-native-paper';

import {useDispatch, useSelector} from 'react-redux';

import {

  Alert,

  Image,

  InteractionManager,

  Platform,

  StyleSheet,

  View,

} from 'react-native';

import React, {

  useRef,

  useEffect,

  useState,

  useCallback,

  useMemo,

} from 'react';

import {Marker, Polygon} from 'react-native-maps';

import IonIcon from 'react-native-vector-icons/Ionicons';

import {getDistance} from 'geolib';



import {COLORS} from '../../core/theme';

import {ROUTES} from '../../core/constants/routes';

import colors from '../../core/theme/colors';



import {addBuildingCoordsData} from '../../store/slices/map.slice';

import {getCurrentLocation} from '../../helpers/location';

import {askStoragePermission} from '../../helpers/permissions';



import MapInfoButton from '../../components/buildings_map/MapInfoButton';

import MapInfoModal from '../../components/buildings_map/MapInfoModal';

import {fetchWmsUrlsForScreen} from '../../store/thunks/fetchWmsUrlsForScreen';

import WmsView from '../../components/common/WmsView';

import WmsLayers from '../../components/map/WmsLayers';

import useWmsMapLayers from '../../hooks/useWmsMapLayers';



import MapComponent from '../../components/mapcomponent/MapComponent';

import {usePermissionContext} from '../../hooks/PermissionContext';

import {ErrorMessage} from '../../components/errorComponent';

import {Header} from '../../components/headers';

import {isPointInPolygon} from '../../helpers/geo';

import {getWmsFeatureInfo} from '../../service/wms_feature_info';

import FeatureInfoModal from '../../components/buildings_map/FeatureInfoModal';

import useBuildingFormMetadata from '../../hooks/useBuildingFormMetadata';

import {
  buildGenericFeatureRows,
  buildLocalBuildingRows,
  buildWmsBuildingRows,
} from '../../helpers/featureInfoRows';



const BuildingMapScreen = ({navigation}) => {

  const {contentsLabel} = useSelector(state => state.auth);

  const {permissionStatus, locationEnabled, requestPermissions} =

    usePermissionContext();

  const {buildingCoords, buildingsData, wmsUrls} = useSelector(

    state => state.map,

  );

  const dispatch = useDispatch();

  const {getDropdowns} = useBuildingFormMetadata();

  const [location, setLocation] = useState();

  const [buildingCoordsState, setBuildingCoordsState] = useState([]);

  const [featureInfo, setFeatureInfo] = useState({
    visible: false,
    title: '',
    rows: [],
    editTarget: null,
  });



  const [isEditing, setIsEditing] = useState(false);

  const [savedCoords, setSavedCoords] = useState([]);



  const [showWmsLink, setShowWmsLink] = useState(true);

  const [roadWms, setRoadWms] = useState(true);

  const [wardWms, setWardWms] = useState(true);

  const [forceLayers, setForceLayers] = useState({});



  const [showWmsDialog, setShowWmsDialog] = useState(false);

  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);



  const [selectedBuildingIndex, setSelectedBuildingIndex] = useState(null);

  const [selectedBuildingSource, setSelectedBuildingSource] = useState(null);

  const [mapSizePx, setMapSizePx] = useState(null);

  const [mapMounted, setMapMounted] = useState(false);

  const mapRef = useRef(null);

  const mapRegionRef = useRef(null);

  const markerPressedRef = useRef(false);

  const featureInfoBusyRef = useRef(false);

  const lastTapAtRef = useRef(0);



  const layerVisibility = useMemo(

    () => ({

      building: showWmsLink,

      road: roadWms,

      ward: wardWms,

    }),

    [showWmsLink, roadWms, wardWms],

  );



  const handleRegionChangeComplete = useCallback(region => {

    mapRegionRef.current = region;

  }, []);



  const {stagedLayers, handleRegionChangeComplete: onMapRegionChangeComplete, zoom} =

    useWmsMapLayers({

      screenKey: 'building',

      mapMounted,

      wmsUrls,

      layerVisibility,

      forceLayers,

      debugLabel: 'building',

      onRegionChange: handleRegionChangeComplete,

    });



  const toggleLayer = useCallback((layerKey, isOn, setter) => {

    const next = !isOn;

    setter(next);

    setForceLayers(prev => {

      const updated = {...prev};

      if (next) {

        updated[layerKey] = true;

      } else {

        delete updated[layerKey];

      }

      return updated;

    });

  }, []);



  const fetchLocation = useCallback(async () => {

    try {

      const response = await getCurrentLocation(true);

      if (response && response.coords) {

        setLocation(response.coords);

      } else {

        throw new Error('No coordinates found');

      }

    } catch (error) {

      if (error.code === 1 || error.code === 2) {

        await requestPermissions();

      }

    }

  }, [requestPermissions]);



  useEffect(() => {

    if (permissionStatus && locationEnabled) {

      fetchLocation();

    } else {

      requestPermissions();

    }

  }, [permissionStatus, locationEnabled, fetchLocation]);



  useEffect(() => {

    if (buildingCoords) {

      setBuildingCoordsState(buildingCoords);

      setSavedCoords(buildingCoords);

    }

  }, [buildingCoords]);



  useEffect(() => {

    if (Platform.constants.Release < 13) {

      askStoragePermission();

    }

    dispatch(fetchWmsUrlsForScreen('building'));

  }, [dispatch]);



  useEffect(() => {

    if (!location) {

      setMapMounted(false);

      return undefined;

    }



    const task = InteractionManager.runAfterInteractions(() => {

      setMapMounted(true);

    });



    return () => task.cancel();

  }, [location]);



  const handlePressOnMap = event => {

    if (!markerPressedRef.current) {

      const {latitude, longitude} = event.nativeEvent.coordinate;

      setBuildingCoordsState([...buildingCoordsState, {latitude, longitude}]);

    }

    markerPressedRef.current = false;

  };



  const getLabel = key => contentsLabel?.[key] || key;



  const closeFeatureInfo = () =>
    setFeatureInfo(prev => ({...prev, visible: false}));

  const onEditFromInfo = () => {
    const target = featureInfo.editTarget;
    closeFeatureInfo();
    if (target) {
      navigation.navigate(ROUTES.building_edit, target);
    }
  };

  const onSelectLocalBuilding = index => {

    if (isEditing) {

      return;

    }

    const item = buildingsData?.[index];

    if (!item) {

      return;

    }

    setSelectedBuildingIndex(index);

    setSelectedBuildingSource('local');

    setFeatureInfo({
      visible: true,
      title: getLabel('Building Information'),
      rows: buildLocalBuildingRows(
        item,
        getDropdowns(item.functional_use_id),
        getLabel,
      ),
      editTarget: {source: 'local', index},
    });

  };



  const onSelectWmsBuilding = feature => {

    if (isEditing) {

      return;

    }

    const bin = feature?.properties?.bin;

    const hasBin = bin != null && String(bin).trim() !== '';

    setSelectedBuildingIndex(null);

    setSelectedBuildingSource('wms');

    setFeatureInfo({
      visible: true,
      title: getLabel('Building Information'),
      rows: buildWmsBuildingRows(feature?.properties, getLabel),
      editTarget: hasBin ? {source: 'wms', bin} : null,
    });

  };



  const onSelectWmsRoad = feature => {

    if (isEditing) {

      return;

    }

    const {bn_name, old_code, road_ext, ...roadProps} = feature?.properties ?? {};
    setFeatureInfo({
      visible: true,
      title: getLabel('Road Information'),
      rows: buildGenericFeatureRows(roadProps, getLabel),
      editTarget: null,
    });

  };



  const onSelectWmsWard = feature => {

    if (isEditing) {

      return;

    }

    setFeatureInfo({
      visible: true,
      title: getLabel('Ward Information'),
      rows: buildGenericFeatureRows(feature?.properties, getLabel),
      editTarget: null,
    });

  };



  const selectLocalBuildingByTap = coordinate => {

    if (!buildingsData?.length) {

      return false;

    }



    const foundIndex = buildingsData.findIndex(

      b => !!b?.coords?.length && isPointInPolygon(coordinate, b.coords),

    );



    if (foundIndex >= 0) {

      onSelectLocalBuilding(foundIndex);

      return true;

    }



    return false;

  };



  const handleMapPress = event => {

    if (isEditing) {

      handlePressOnMap(event);

      return;

    }



    const coordinate = event?.nativeEvent?.coordinate;

    if (!coordinate) {

      return;

    }



    const foundLocal = selectLocalBuildingByTap(coordinate);

    if (foundLocal) {

      return;

    }



    if (featureInfoBusyRef.current) {

      return;

    }



    if (Date.now() - lastTapAtRef.current < 400) {

      return;

    }

    lastTapAtRef.current = Date.now();



    void (async () => {

      const mapRegion = mapRegionRef.current;



      if (!mapRef.current || !mapSizePx || !mapRegion) {

        return;

      }



      // Query the visible WMS layers most-specific first and stop at the first
      // layer that has a feature under the tap: building -> road -> ward.

      const layers = [

        {key: 'building', visible: showWmsLink, onHit: onSelectWmsBuilding},

        {key: 'road', visible: roadWms, onHit: onSelectWmsRoad},

        {key: 'ward', visible: wardWms, onHit: onSelectWmsWard},

      ];



      featureInfoBusyRef.current = true;

      try {

        const pointPx = await mapRef.current.pointForCoordinate(coordinate);

        for (const layer of layers) {

          const url = wmsUrls?.[layer.key];

          if (!layer.visible || !url) {

            continue;

          }

          const feature = await getWmsFeatureInfo({

            wmsTileTemplate: url,

            coordinate,

            region: mapRegion,

            mapSizePx,

            pointPx,

          });

          if (feature) {

            layer.onHit(feature);

            break;

          }

        }

      } catch (err) {

        console.warn('[BuildingMap] WMS tap lookup failed', err);

      } finally {

        featureInfoBusyRef.current = false;

      }

    })();

  };



  const handlePressOnMarker = index => {

    markerPressedRef.current = true;

    const markerNum = index + 1;

    Alert.alert(

      getLabel('DELETE'),

      getLabel(

        'Are you sure you want to remove marker number 1 from the map?',

      ).replace('1', markerNum),

      [

        {

          text: getLabel('YES'),

          onPress: () => {

            setBuildingCoordsState(

              buildingCoordsState.filter((_, i) => i !== index),

            );

          },

        },

        {

          text: getLabel('CANCEL'),

        },

      ],

    );

  };



  const onDragEnd = (index, event) => {

    const {latitude, longitude} = event.nativeEvent.coordinate;



    setBuildingCoordsState(prevState =>

      prevState.map((coord, i) =>

        i === index ? {latitude, longitude} : coord,

      ),

    );

  };



  const getMidpoint = (point1, point2) => ({

    latitude: (point1.latitude + point2.latitude) / 2,

    longitude: (point1.longitude + point2.longitude) / 2,

  });



  const getDistanceBetweenPoints = (point1, point2) => getDistance(point1, point2);



  const [dragging, setDragging] = useState(false);

  const handleMarkerDragStart = () => {

    setDragging(true);

  };



  const haveUnsavedChanges = useMemo(

    () => JSON.stringify(savedCoords) !== JSON.stringify(buildingCoordsState),

    [savedCoords, buildingCoordsState],

  );



  const onPressEditToggle = () => {

    if (!isEditing) {

      setIsEditing(true);

      setBuildingCoordsState(savedCoords || []);

    } else if (haveUnsavedChanges) {

      Alert.alert(

        getLabel('DISCARD_CHANGES'),

        getLabel(

          'Are you sure you want to discard your unsaved polygon changes?',

        ),

        [

          {

            text: getLabel('YES'),

            onPress: () => {

              setBuildingCoordsState(savedCoords || []);

              setIsEditing(false);

            },

          },

          {

            text: getLabel('CANCEL'),

            style: 'cancel',

          },

        ],

      );

    } else {

      setIsEditing(false);

    }

  };



  const openInfoModal = () => {

    dispatch(addBuildingCoordsData(buildingCoordsState));

    setIsInfoModalVisible(true);

  };



  const onPressInfoNext = () => {
    setIsInfoModalVisible(false);
    dispatch(addBuildingCoordsData(buildingCoordsState));
    navigation.navigate(ROUTES.create_building_after_draw);
  };



  return (

    <View style={styles.container}>

      <Header

        title={getLabel('Building Map')}

        showRemoveMarker={locationEnabled && permissionStatus && location}

        showMapStyle={locationEnabled && permissionStatus && location}

      />

      {locationEnabled && permissionStatus && location && mapMounted ? (

        <>

          <MapComponent

            handleMarkerPress={handleMapPress}

            markerdrag={!dragging}

            mapRef={mapRef}

            initialLocation={location}

            onRegionChangeComplete={onMapRegionChangeComplete}

            onMapLayout={e => {

              const {width, height} = e.nativeEvent.layout;

              setMapSizePx({width, height});

            }}>

            {buildingCoordsState.map((marker, index) => (

              <Marker

                zIndex={marker.zIndex}

                draggable={isEditing}

                poiClickEnabled={false}

                onDragStart={isEditing ? handleMarkerDragStart : undefined}

                onDragEnd={

                  isEditing

                    ? event => {

                        setDragging(false);

                        onDragEnd(index, event);

                      }

                    : undefined

                }

                onPress={

                  isEditing ? () => handlePressOnMarker(index) : undefined

                }

                coordinate={{

                  latitude: marker.latitude,

                  longitude: marker.longitude,

                }}

                key={`${marker.latitude}-${marker.longitude}-${index}`}>

                <View

                  style={{

                    width: marker.width,

                    height: marker.height,

                  }}>

                  <Image

                    source={require('../../../assets/images/marker1.png')}

                    style={{height: 34, width: 34}}

                  />

                </View>

              </Marker>

            ))}

            {buildingCoordsState.length > 0 && (

              <>

                <Polygon

                  coordinates={buildingCoordsState}

                  geodesic={false}

                  strokeWidth={2}

                  strokeColor={COLORS.success}

                  fillColor="rgba(45,87,250,0.15)"

                />

                {buildingCoordsState.length > 1 &&

                  buildingCoordsState.map((point, index) => {

                    const nextPoint =

                      buildingCoordsState[

                        (index + 1) % buildingCoordsState.length

                      ];

                    const midpoint = getMidpoint(point, nextPoint);

                    const distance = getDistanceBetweenPoints(point, nextPoint);

                    return (

                      <Marker

                        key={`distance-${index}`}

                        coordinate={midpoint}

                        pinColor="transparent">

                        <Text

                          variant="labelLarge"

                          style={{

                            color: colors.dark,

                            fontWeight: '800',

                            textShadowColor: '#FFFFFF',

                            textShadowOffset: {width: 0, height: 0},

                            textShadowRadius: 12,

                          }}>

                          {distance}m

                        </Text>

                      </Marker>

                    );

                  })}

              </>

            )}



            <WmsLayers
              debugLabel="building"
              wmsUrls={wmsUrls}
              eligibleLayers={stagedLayers}
              layerVisibility={layerVisibility}
            />



            {!!buildingsData?.length &&

              buildingsData.map((item, index) => {

                const isSelected =

                  selectedBuildingSource === 'local' &&

                  selectedBuildingIndex === index;



                if (!item?.coords?.length) {

                  return null;

                }



                return (

                  <Polygon

                    key={`local-building-${index}-${item?.temp_building_code ?? 'na'}`}

                    coordinates={item.coords}

                    tappable

                    strokeWidth={isSelected ? 3 : 2}

                    strokeColor={isSelected ? COLORS.error : COLORS.primary}

                    fillColor={

                      isSelected

                        ? 'rgba(244,67,54,0.18)'

                        : 'rgba(45,87,250,0.10)'

                    }

                    zIndex={20}

                    onPress={() => onSelectLocalBuilding(index)}

                  />

                );

              })}

          </MapComponent>



          <MapInfoButton

            onPress={openInfoModal}

            buildingCoords={buildingCoordsState}

          />



          <FAB

            animated={false}

            style={styles.fab}

            icon={() => <IonIcon name="layers" size={25} color="white" />}

            onPress={() => {

              setShowWmsDialog(true);

            }}

          />

          <FAB

            animated={false}

            style={styles.editFab}

            icon={() => (

              <IonIcon

                name={isEditing ? 'close' : 'add'}

                size={24}

                color="white"

              />

            )}

            onPress={onPressEditToggle}

          />

          <WmsView

            visible={showWmsDialog}

            mode="Building"

            onDismiss={() => setShowWmsDialog(false)}

            onWmsPress={() => toggleLayer('building', showWmsLink, setShowWmsLink)}

            onRoadWmsPress={() => toggleLayer('road', roadWms, setRoadWms)}

            onWardWmsPress={() => toggleLayer('ward', wardWms, setWardWms)}

            isWmsOn={showWmsLink}

            isRoadWmsOn={roadWms}

            isWardWmsOn={wardWms}

            currentZoom={zoom}

            primaryLayerKey="building"
          />

          <MapInfoModal

            buildingCoords={buildingCoordsState}

            visible={isInfoModalVisible}

            onClose={setIsInfoModalVisible}

            onNext={onPressInfoNext}

          />

          <FeatureInfoModal
            visible={featureInfo.visible}
            title={featureInfo.title}
            rows={featureInfo.rows}
            onClose={closeFeatureInfo}
            onEdit={featureInfo.editTarget ? onEditFromInfo : undefined}
            editLabel={getLabel('EDIT')}
          />

        </>

      ) : (

        <ErrorMessage message={getLabel('Error: Location Permission Denied')} />

      )}

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

  markerBadge: {

    top: 25,

    alignSelf: 'center',

    position: 'absolute',

    backgroundColor: COLORS.light,

  },

  fab: {

    position: 'absolute',

    bottom: 190,

    left: 15,

    backgroundColor: COLORS.primary,

  },

  editFab: {

    position: 'absolute',

    bottom: 110,

    left: 15,

    backgroundColor: COLORS.primary,

  },

});


