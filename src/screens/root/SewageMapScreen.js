import React, { useEffect, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { Marker, WMSTile } from "react-native-maps";
import { FAB, Text } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useDispatch, useSelector } from "react-redux";

import { COLORS } from "../../core/theme";

import { getCurrentLocation } from "../../helpers/location";
import {
  askLocationPermission,
  askStoragePermission,
} from "../../helpers/permissions";
import {
  removeFromBuildingCoords,
  resetBuildingCoords,
  updateBuildingCoord,
} from "../../store/slices/map.slice";

import MapInfoModal from "../../components/buildings_map/MapInfoModal";
import {
  getBuildingWmslink,
  getRoadWmsLink,
  getSewerWmsLink,
  getWardWmsLink,
} from "../../service/building_service";

import IonIcon from "react-native-vector-icons/Ionicons";

import { MAP_TYPES } from "react-native-maps";
import SewerWMSView from "../../components/common/SewerWMSView";
import SaveSewageModal from "../../components/sewage/SaveSewageModal";
import MapInfoButton from "../../components/sewage/MapInfoButton";
import MapComponent from "../../components/mapcomponent/MapComponent";
import { usePermissionContext } from "../../hooks/PermissionContext";
import { ErrorMessage } from "../../components/errorComponent";
import { Header } from "../../components/headers";

const SewageMapScreen = ({ navigation }) => {
  const { permissionStatus, locationEnabled, requestPermissions } =
    usePermissionContext();
  const mapRef = useRef();
  const dispatch = useDispatch();
  const [location, setLocation] = useState();
  const [isInfoModalVisible, setisInfoModalVisible] = useState(false);
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const { buildingCoords, mapType } = useSelector((state) => state.map);

  const [wmslinks, setWmslink] = useState("***REMOVED***");
  // ***REMOVED***,
  const [showWmsLink, setShowWmsLink] = useState(false);
  const [showWmsDialog, setShowWmsDialog] = useState(false);

  const [roadWmsLink, setRoadWmsLink] = useState(
    "***REMOVED***"
  );

  const [wardWmsLink, setWardWmsLink] = useState(
    "***REMOVED***"
  );

  const [sewerWMSLink, setSewerWMSLink] = useState(
    "***REMOVED***"
  );

  const [roadWms, setRoadWms] = useState(false);
  const [wardWms, setWardWms] = useState(false);
  const [sewerWMS, setSewerWMS] = useState(false);

  useEffect(() => {
    if (permissionStatus && locationEnabled) {
      fetchLocation();
    } else {
      requestPermissions();
    }
  }, [permissionStatus, locationEnabled]);

  useEffect(() => {
    askLocationPermission(async () => {
      if (Platform.constants.Release < 13) {
        askStoragePermission();
      }
    });

    getWmsLink();
    roadLink();
    wardLink();
    sewerLink();
    // return () => dispatch(resetBuildingCoords());
  }, []);

  const fetchLocation = async () => {
    try {
      const { coords } = await getCurrentLocation(false);
      if (!!coords) {
        setLocation(coords);
      }
    } catch (error) {
      console.log("Error", error);
    }
  };
  const getWmsLink = () => {
    getBuildingWmslink()
      .then((response) => {
        const { success, data, error } = response.data;

        console.log("wms", response.data.baseUrl + data.buildings);

        setWmslink(response.data.baseUrl + data.buildings);
        setShowWmsLink(true);
      })
      .catch((err) => {
        console.log("Error", err);
        if (err?.response?.status === 500) {
          Alert.alert(
            "500",
            "Something is wrong, please try again or at a later time."
          );
        }
      });
  };

  const roadLink = () => {
    getRoadWmsLink()
      .then((response) => {
        const { success, data, error } = response.data;

        console.log("road", response.data.baseUrl + data.roads);

        setRoadWmsLink(response.data.baseUrl + data.roads);
      })
      .catch((err) => {
        console.log("Error", err);
        if (err?.response?.status === 500) {
          Alert.alert(
            "500",
            "Something is wrong, please try again or at a later time."
          );
        }
      });
  };

  const wardLink = () => {
    getWardWmsLink()
      .then((response) => {
        const { success, data, error } = response.data;

        console.log("ward", response.data.baseUrl + data.wards);

        setWardWmsLink(response.data.baseUrl + data.wards);
      })
      .catch((err) => {
        console.log("Error", err);
        if (err?.response?.status === 500) {
          Alert.alert(
            "500",
            "Something is wrong, please try again or at a later time."
          );
        }
      });
  };

  const sewerLink = () => {
    getSewerWmsLink()
      .then((response) => {
        const { success, data, error } = response.data;

        console.log("sewer", response.data.baseUrl + data.sewers);

        setSewerWMSLink(response.data.baseUrl + data.sewers);
        setSewerWMS(true);
      })
      .catch((err) => {
        console.log("Error", err);
        if (err?.response?.status === 500) {
          Alert.alert(
            "500",
            "Something is wrong, please try again or at a later time."
          );
        }
      });
  };

  useEffect(() => {
    askLocationPermission(async () => {
      if (Platform.constants.Release < 13) {
        askStoragePermission();
      }
    });

    getWmsLink();
    roadLink();
    wardLink();
    sewerLink();
    return () => dispatch(resetBuildingCoords());
  }, []);

  const handlePressOnMarker = (index) => {
    const markerNum = parseInt(index) + 1;

    // confirm and filter out the item in that particular index
    Alert.alert(
      "Delete",
      "Are you sure you want to remove number " +
        markerNum +
        " marker from the map?",
      [
        {
          text: "Yes",
          onPress: () => dispatch(removeFromBuildingCoords(index)),
        },
        {
          text: "Cancel",
        },
      ]
    );
  };
  const [highlightedPolygon, setHighlightedPolygon] = useState(null);
  const [highlightedSewerLine, setHighlightedSewerLine] = useState(false);

  const polygons = [
    {
      binCode: "A1",
      coordinates: [
        { latitude: 27.70508863056112, longitude: 85.27511615306139 },
        { latitude: 27.705058649969207, longitude: 85.27523014694452 },
        { latitude: 27.70489835755591, longitude: 85.27517583221197 },
        { latitude: 27.704927150840067, longitude: 85.27506284415722 },
      ],
    },
    {
      binCode: "A12",
      coordinates: [
        { latitude: 27.70487312632124, longitude: 85.27522712945938 },
        { latitude: 27.704850863462276, longitude: 85.27533542364836 },
        { latitude: 27.70479268316943, longitude: 85.27532268315554 },
        { latitude: 27.704822070157963, longitude: 85.27521338313818 },
      ],
    },
    {
      binCode: "A13",
      coordinates: [
        { latitude: 27.70435603314472, longitude: 85.27578335255384 },
        { latitude: 27.704527012560387, longitude: 85.27586616575718 },
        { latitude: 27.70443766397554, longitude: 85.27611427009106 },
        { latitude: 27.704245905636178, longitude: 85.27601603418589 },
        { latitude: 27.704296665229396, longitude: 85.27585845440626 },
        { latitude: 27.70432902074724, longitude: 85.27587756514549 },
      ],
    },
    {
      binCode: "A14",
      coordinates: [
        { latitude: 27.70470303796361, longitude: 85.27559727430344 },
        { latitude: 27.7046938359681, longitude: 85.2756593003869 },
        { latitude: 27.70459944125985, longitude: 85.27563516050577 },
        { latitude: 27.704612502167727, longitude: 85.27558017522097 },
      ],
    },
  ];
  const sewage = [
    {
      sewageCode: "S1",
      coordinates: [
        { latitude: 27.705627092462535, longitude: 85.27535554021597 },
        { latitude: 27.705360533374904, longitude: 85.27530893683434 },
        { latitude: 27.70515720000271, longitude: 85.27528211474419 },
        { latitude: 27.704966927117084, longitude: 85.27523651719093 },
      ],
    },
    {
      sewageCode: "S12",
      coordinates: [
        { latitude: 27.704818508099184, longitude: 85.27517884969711 },
        { latitude: 27.70469680435386, longitude: 85.27531933039427 },
        { latitude: 27.704637436623923, longitude: 85.2754232659936 },
        { latitude: 27.704577178345037, longitude: 85.27564689517021 },
      ],
    },
    {
      sewageCode: "S13",
      coordinates: [
        { latitude: 27.705294338756655, longitude: 85.27564689517021 },
        { latitude: 27.70519014893985, longitude: 85.27573440223932 },
        { latitude: 27.705096942010865, longitude: 85.27576591819525 },
        { latitude: 27.704937243329645, longitude: 85.2757354080677 },
        { latitude: 27.704666229976986, longitude: 85.27567036449909 },
      ],
    },
  ];
  const [markeredPoint, setMarkedPoint] = useState();
  const [buildingMarker, setBuildingMarker] = useState(null);
  const [sewerMarker, setSewerMarker] = useState(null);
  const [step, setStep] = useState("building");

  // const handleMarkerPress = async event => {
  //   const coordinate = event.nativeEvent.coordinate;
  //   if (step === 'building') {
  //     try {
  //       const resp = await getBuildings();
  //       if (resp) {
  //         setBuildingMarker(coordinate);
  //         const foundPolygon = polygons.find(polygon =>
  //           isPointInPolygon(
  //             {latitude: coordinate.latitude, longitude: coordinate.longitude},
  //             polygon.coordinates.map(p => ({
  //               latitude: p.latitude,
  //               longitude: p.longitude,
  //             })),
  //           ),
  //         );
  //         console.log('foundPolygon', foundPolygon);
  //         setHighlightedPolygon(foundPolygon || null);
  //       }
  //       // console.log('ResponseFrom Map', resp);
  //     } catch (error) {}
  //     setStep('sewer');
  //   } else if (step === 'sewer') {
  //     try {
  //       const resp = getSewerCode();
  //       if (resp) {
  //         setSewerMarker(coordinate);

  //         // Find the sewer line closest to the coordinate
  //         const foundSewerLine = sewage.find(sewerLine =>
  //           sewerLine.coordinates.some((point, index) => {
  //             if (index === sewerLine.coordinates.length - 1) return false;
  //             const nextPoint = sewerLine.coordinates[index + 1];

  //             // Log points and distance for debugging
  //             console.log('Point:', point);
  //             console.log('Next Point:', nextPoint);

  //             const distance = getDistanceFromLine(
  //               coordinate,
  //               point,
  //               nextPoint,
  //             );

  //             console.log('Distance:', distance);

  //             return distance < 10;
  //           }),
  //         );

  //         // Log found sewer line or null
  //         console.log('Found Sewer Line:', foundSewerLine);

  //         // Set the highlighted sewer line or null if not found
  //         setHighlightedSewerLine(foundSewerLine || null);
  //         setStep('done');
  //       }
  //     } catch (error) {}
  //   }
  // };
  // const handleMarkerPress = event => {
  //   const coordinate = event.nativeEvent.coordinate;
  //   console.log('Marker!!!', event); // Store tapped marker data
  //   setMarkedPoint(coordinate);
  //   const foundPolygon = polygons.find(polygon =>
  //     isPointInPolygon(coordinate, polygon),
  //   );
  //   setHighlightedPolygon(foundPolygon || null);

  //   const foundSewerLine = sewage.find(sewerLine =>
  //     sewerLine.some((point, index) => {
  //       if (index === sewerLine.length - 1) return false; // skip last point
  //       const nextPoint = sewerLine[index + 1];
  //       const distance = getDistanceFromLine(coordinate, point, nextPoint);
  //       return distance < 10;
  //     }),
  //   );
  //   setHighlightedSewerLine(foundSewerLine || null);
  // };
  const renderMarkeredPoint = () => {
    return (
      <Marker
        coordinate={markeredPoint}
        draggable
        onDragEnd={(event) => onDragEnd(index, event)}
        // onPress={() => handlePressOnMarker(index)}
      >
        <View style={{ position: "relative" }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              position: "absolute",
              zIndex: 1,
              top: 7,
              left: 13,
              height: 26,
              width: 26,
              borderRadius: 24,
              justifyContent: "center",
              alignItems: "center",
            }}
          ></View>
          <Icon name="map-marker" size={52} color={COLORS.primary} />
        </View>
      </Marker>
    );
  };
  const onDragEnd = (index, event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const payload = { index, coords: { latitude, longitude } };

    dispatch(updateBuildingCoord(payload));
  };

  // goes in place of callback function of marker coords
  const renderMarkers = (e, index) => {
    const markerNum = index + 1;

    return (
      <Marker
        draggable
        key={index}
        coordinate={e}
        onDragEnd={(event) => onDragEnd(index, event)}
        onPress={() => handlePressOnMarker(index)}
      >
        <>
          <Text
            style={{
              paddingLeft: 10,
              color: mapType === MAP_TYPES.HYBRID ? "#EC0404" : "#000",
              fontWeight: "bold",
            }}
          >
            {e.distance === null || e.distance === undefined
              ? null
              : e.distance}
          </Text>
          <Icon name="map-marker" size={40} color={COLORS.primary} />
          {/* <Badge style={styles.markerBadge}>{markerNum}</Badge> */}
        </>
      </Marker>
    );
  };

  const showSaveDataModal = () => {
    setIsSaveModalVisible(true);
  };

  const closeVisibleModals = () => {
    dispatch(resetBuildingCoords());
    setIsSaveModalVisible(false);
    setisInfoModalVisible(false);
  };
  const { contentsLabel } = useSelector((state) => state.auth);
  const getLabel = (key) => contentsLabel?.[key] || key;
  return (
    <View style={styles.container}>
      <Header
        title={getLabel("Sewer Map")}
        showMapStyle={locationEnabled && permissionStatus && location}
        showRemoveMarker={false}
      />
      {locationEnabled && permissionStatus && location ? (
        <>
          <MapComponent
            handleMarkerPress={() => {
              console.log("Feature currently disabled: handleMarkerPress");
            }}
          >
            {/* {buildingMarker && (
            <Marker coordinate={buildingMarker}>
              <View style={{position: 'relative'}}>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    position: 'absolute',
                    zIndex: 1,
                    top: 7,
                    left: 13,
                    height: 26,
                    width: 26,
                    borderRadius: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}></View>
                <Icon name="map-marker" size={52} color="blue" />
              </View>
            </Marker>
          )}
          {sewerMarker && (
            <Marker coordinate={sewerMarker}>
              <View style={{position: 'relative'}}>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    position: 'absolute',
                    zIndex: 1,
                    top: 7,
                    left: 13,
                    height: 26,
                    width: 26,
                    borderRadius: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}></View>
                <Icon name="map-marker" size={52} color="red" />
              </View>
            </Marker>
          )}
          {highlightedPolygon && (
            <>
              <Polygon
                coordinates={highlightedPolygon?.coordinates}
                strokeColor="#000"
                fillColor="rgba(0, 255, 0, 0.5)"
                strokeWidth={1}
              />
            </>
          )}
          {highlightedSewerLine && (
            <Polyline
              coordinates={highlightedSewerLine?.coordinates}
              strokeColor="red"
              strokeWidth={3}
            />
          )} */}
            {/* <MapView
        onLayout={() =>
          mapRef.current.setMapBoundaries(
            {latitude: 27.669721, longitude: 85.337964},
            {latitude: 27.589734, longitude: 85.416529},
          )
        }
        ref={mapRef}
        style={styles.map}
        initialRegion={location}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        zoomControlEnabled
        mapType={mapType}
        showsIndoors={false}
        showsBuildings={false}
        moveOnMarkerPress={false}
        showsPointsOfInterest={false}
        onPress={handleMarkerPress}> */}
            {/* {buildingCoords.map(renderMarkers)}
        {buildingCoords.length > 0 && (
          <Polygon
            geodesic={false}
            strokeWidth={2}
            strokeColor={COLORS.error}
            coordinates={buildingCoords}
            fillColor="rgba(45,87,250,0.07)"
          />
        )} */}
            {showWmsLink && (
              <WMSTile
                urlTemplate={wmslinks}
                zIndex={1}
                opacity={0.5}
                tileSize={512}
              />
            )}
            {roadWms && (
              <WMSTile
                urlTemplate={roadWmsLink}
                zIndex={1}
                opacity={0.5}
                tileSize={512}
              />
            )}
            {wardWms && (
              <WMSTile
                urlTemplate={wardWmsLink}
                zIndex={1}
                opacity={0.5}
                tileSize={512}
              />
            )}
            {sewerWMS && (
              <WMSTile
                urlTemplate={sewerWMSLink}
                zIndex={1}
                opacity={0.5}
                tileSize={512}
              />
            )}
          </MapComponent>

          <MapInfoButton onPress={() => setIsSaveModalVisible(true)} />

          <FAB
            animated={false}
            style={styles.fab}
            icon={() => <IonIcon name="layers" size={25} color="white" />}
            onPress={() => setShowWmsDialog(true)}
          />
          <SewerWMSView
            visible={showWmsDialog}
            onDismiss={() => setShowWmsDialog(false)}
            onWmsPress={() => setShowWmsLink(!showWmsLink)}
            onRoadWmsPress={() => setRoadWms(!roadWms)}
            onWardWmsPress={() => setWardWms(!wardWms)}
            isWmsOn={showWmsLink}
            isRoadWmsOn={roadWms}
            isWardWmsOn={wardWms}
            isSewerWmsOn={sewerWMS}
            onSewerWMSPress={() => setSewerWMS(!sewerWMS)}
          />

          <MapInfoModal
            visible={isInfoModalVisible}
            onClose={setisInfoModalVisible}
            onNext={showSaveDataModal}
            // onNext={() => {
            //   setisInfoModalVisible(false);
            //   navigation.navigate(ROUTES.building_survey);
            // }}
          />
          <SaveSewageModal
            visible={isSaveModalVisible}
            onClose={setIsSaveModalVisible}
            onDataSaved={closeVisibleModals}
          />
        </>
      ) : (
        <ErrorMessage message={getLabel("Error: Location Permission Denied")} />
      )}
    </View>
  );
};

export default SewageMapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  markerBadge: {
    top: 25,
    alignSelf: "center",
    position: "absolute",
    backgroundColor: COLORS.light,
  },
  fab: {
    position: "absolute",
    bottom: 110,
    marginLeft: 15,
    backgroundColor: COLORS.primary,
  },
});
