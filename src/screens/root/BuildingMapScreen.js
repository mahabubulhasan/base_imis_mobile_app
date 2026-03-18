import { FAB, Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Marker, Polygon, WMSTile } from "react-native-maps";
import IonIcon from "react-native-vector-icons/Ionicons";
import { getDistance } from "geolib";

import { COLORS } from "../../core/theme";

import {
  resetBuildingCoords,
  addBuildingCoordsData,
} from "../../store/slices/map.slice";
import { getCurrentLocation } from "../../helpers/location";
import { askStoragePermission } from "../../helpers/permissions";

import MapInfoButton from "../../components/buildings_map/MapInfoButton";
import MapInfoModal from "../../components/buildings_map/MapInfoModal";
import SaveDataModal from "../../components/buildings_map/SaveDataModal";
import {
  getBuildingWmslink,
  getRoadWmsLink,
  getWardWmsLink,
} from "../../service/building_service";
import WmsView from "../../components/common/WmsView";

import MapComponent from "../../components/mapcomponent/MapComponent";
import { usePermissionContext } from "../../hooks/PermissionContext";
import { ErrorMessage } from "../../components/errorComponent";
import { Header } from "../../components/headers";

const BuildingMapScreen = () => {
  const { contentsLabel } = useSelector((state) => state.auth);
  const { permissionStatus, locationEnabled, requestPermissions } =
    usePermissionContext();
  const { buildingCoords } = useSelector((state) => state.map);
  const dispatch = useDispatch();
  // INITIAL_LOCATION
  const [location, setLocation] = useState();
  const [isInfoModalVisible, setisInfoModalVisible] = useState(false);
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [buildingCoordsState, setBuildingCoordsState] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [savedCoords, setSavedCoords] = useState([]);
  const [hasEverSaved, setHasEverSaved] = useState(false);

  const [showWmsLink, setShowWmsLink] = useState(true);
  const [roadWms, setRoadWms] = useState(true);
  const [wardWms, setWardWms] = useState(true);

  const [wmslinks, setWmslink] = useState("");
  const [roadWmsLink, setRoadWmsLink] = useState("");
  const [wardWmsLink, setWardWmsLink] = useState("");

  const [showWmsDialog, setShowWmsDialog] = useState(false);

  const fetchLocation = useCallback(async () => {
    try {
      const response = await getCurrentLocation(true); // Fetch location
      if (response && response.coords) {
        setLocation(response.coords); // Set location state if available
      } else {
        throw new Error("No coordinates found");
      }
    } catch (error) {
      console.log("Error while fetching location:", error);

      if (error.code === 1) {
        await requestPermissions();
      } else if (error.code === 2) {
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
    if (!!buildingCoords) {
      setBuildingCoordsState(buildingCoords);
      setSavedCoords(buildingCoords);
    }
  }, [buildingCoords]);

  useEffect(() => {
    if (Platform.constants.Release < 13) {
      askStoragePermission();
    }
    getWmsLink();
    roadLink();
    wardLink();
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

  const roadLink = () => {
    getRoadWmsLink()
      .then((response) => {
        const { data } = response.data;
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

        setWardWmsLink(response.data.baseUrl + data.wards);
      })
      .catch((err) => {
        console.log("error", err);
        if (err?.response?.status === 500) {
          Alert.alert(
            "500",
            "Something is wrong, please try again or at a later time."
          );
        }
      });
  };

  const markerPressedRef = useRef(false);

  const handlePressOnMap = (event) => {
    if (!markerPressedRef.current) {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      setBuildingCoordsState([...buildingCoordsState, { latitude, longitude }]);
    }
    markerPressedRef.current = false;
  };

  // const renderMarkers = (coordinate, index) => {
  //   const distance = index > 0 ? coordinate.distance : 0;
  //   return (
  //     <Marker
  //       key={index}
  //       coordinate={coordinate}
  //       draggable
  //       onDragStart={handleMarkerDragStart}
  //       onDragEnd={(event) => {
  //         setDragging(false);
  //         onDragEnd(index, event);
  //       }}
  //       onPress={() => handlePressOnMarker(index)}
  //     >
  //       <View style={{ position: "relative" }}>
  //         <View
  //           style={{
  //             backgroundColor: "#FFFFFF",
  //             position: "absolute",
  //             zIndex: 1,
  //             top: 7,
  //             left: 13,
  //             height: 26,
  //             width: 26,
  //             borderRadius: 24,
  //             justifyContent: "center",
  //             alignItems: "center",
  //           }}
  //         ></View>
  //         <Icon name="map-marker" size={52} color={COLORS.primary} />
  //       </View>
  //     </Marker>
  //   );
  // };

  const handlePressOnMarker = (index) => {
    markerPressedRef.current = true;
    const markerNum = index + 1;
    Alert.alert(
      getLabel("DELETE"),
      getLabel(
        "Are you sure you want to remove marker number 1 from the map?"
      ).replace("1", markerNum),
      [
        {
          text: getLabel("YES"),
          onPress: () => {
            setBuildingCoordsState(
              buildingCoordsState.filter((_, i) => i !== index)
            );
          },
        },
        {
          text: getLabel("CANCEL"),
        },
      ]
    );
  };

  const onDragEnd = (index, event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    setBuildingCoordsState((prevState) =>
      prevState.map((coord, i) =>
        i === index ? { latitude, longitude } : coord
      )
    );
  };

  const showSaveDataModal = () => {
    setisInfoModalVisible(false);
    setIsSaveModalVisible(true);
  };

  const closeVisibleModals = () => {
    dispatch(resetBuildingCoords());
    setIsSaveModalVisible(false);
    setisInfoModalVisible(false);
  };
  const getMidpoint = (point1, point2) => ({
    latitude: (point1.latitude + point2.latitude) / 2,
    longitude: (point1.longitude + point2.longitude) / 2,
  });

  const getDistanceBetweenPoints = (point1, point2) => {
    return getDistance(point1, point2);
  };

  const [dragging, setDragging] = useState(false);
  const handleMarkerDragStart = () => {
    setDragging(true);
  };

  // const handleMarkerDragEnd = (index, event) => {
  //   setDragging(false);
  //   // handleMarkerDrag(index, event);
  // };

  const getLabel = (key) => contentsLabel?.[key] || key;

  const haveUnsavedChanges = useMemo(
    () => JSON.stringify(savedCoords) !== JSON.stringify(buildingCoordsState),
    [savedCoords, buildingCoordsState]
  );

  const onPressEditToggle = () => {
    if (!isEditing) {
      setIsEditing(true);
      setBuildingCoordsState(savedCoords || []);
    } else if (haveUnsavedChanges) {
      Alert.alert(
        getLabel("DISCARD_CHANGES"),
        getLabel(
          "Are you sure you want to discard your unsaved polygon changes?"
        ),
        [
          {
            text: getLabel("YES"),
            onPress: () => {
              setBuildingCoordsState(savedCoords || []);
              setIsEditing(false);
            },
          },
          {
            text: getLabel("CANCEL"),
            style: "cancel",
          },
        ]
      );
    } else {
      setIsEditing(false);
    }
  };

  const handleDataSaved = () => {
    setSavedCoords(buildingCoordsState);
    setHasEverSaved(true);
    setIsEditing(false);
    closeVisibleModals();
  };

  return (
    <View style={styles.container}>
      <Header
        title={getLabel("Building Map")}
        showRemoveMarker={locationEnabled && permissionStatus && location}
        showMapStyle={locationEnabled && permissionStatus && location}
      />
      {locationEnabled && permissionStatus && location ? (
        <>
          <MapComponent
            handleMarkerPress={isEditing ? handlePressOnMap : undefined}
            markerdrag={!dragging}
          >
            {buildingCoordsState.map((marker, index) => (
              <Marker
                zIndex={marker.zIndex}
                draggable={isEditing}
                poiClickEnabled={false}
                onDragStart={isEditing ? handleMarkerDragStart : undefined}
                onDragEnd={
                  isEditing
                    ? (event) => {
                        setDragging(false);
                        onDragEnd(index, event);
                      }
                    : undefined
                }
                onPress={isEditing ? () => handlePressOnMarker(index) : undefined}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                key={marker.latitude + "-" + marker.longitude + "-" + index}
              >
                <View
                  style={{
                    width: marker.width,
                    height: marker.height,
                  }}
                >
                  <Image
                    source={require("../../../assets/images/marker1.png")}
                    style={{ height: 34, width: 34 }}
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
                        const distance = getDistanceBetweenPoints(
                          point,
                          nextPoint
                        );
                        return (
                          <Marker
                            key={index}
                            coordinate={midpoint}
                            pinColor="transparent"
                          >
                            <Text
                              variant="labelLarge"
                              style={{
                                color: colors.dark,
                                fontWeight: "800",
                                textShadowColor: "#FFFFFF",
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: 12,
                              }}
                            >
                              {distance}m
                            </Text>
                          </Marker>
                        );
                      })}
                  </>
                )}
              </>
            )}
            {showWmsLink && wmslinks && (
              <WMSTile
                urlTemplate={wmslinks}
                zIndex={1}
                opacity={0.5}
                tileSize={512}
              />
            )}
            {roadWms && roadWmsLink && (
              <WMSTile
                urlTemplate={roadWmsLink}
                zIndex={1}
                opacity={0.5}
                tileSize={512}
              />
            )}
            {wardWms && wardWmsLink && (
              <WMSTile
                urlTemplate={wardWmsLink}
                zIndex={1}
                opacity={0.5}
                tileSize={512}
              />
            )}
          </MapComponent>

          <MapInfoButton
            onPress={() => {
              setisInfoModalVisible(true),
                dispatch(addBuildingCoordsData(buildingCoordsState));
            }}
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
                name={isEditing ? "close" : "add"}
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
            onWmsPress={() => setShowWmsLink(!showWmsLink)}
            onRoadWmsPress={() => setRoadWms(!roadWms)}
            onWardWmsPress={() => setWardWms(!wardWms)}
            isWmsOn={showWmsLink}
            isRoadWmsOn={roadWms}
            isWardWmsOn={wardWms}
          />

          <MapInfoModal
            buildingCoords={buildingCoordsState}
            visible={isInfoModalVisible}
            onClose={setisInfoModalVisible}
            onNext={showSaveDataModal}
          />
          <SaveDataModal
            visible={isSaveModalVisible}
            onClose={setIsSaveModalVisible}
            onDataSaved={handleDataSaved}
          />
        </>
      ) : (
        <ErrorMessage message={getLabel("Error: Location Permission Denied")} />
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
    alignSelf: "center",
    position: "absolute",
    backgroundColor: COLORS.light,
  },
  fab: {
    position: "absolute",
    bottom: 190,
    left: 15,
    backgroundColor: COLORS.primary,
  },
  editFab: {
    position: "absolute",
    bottom: 110,
    left: 15,
    backgroundColor: COLORS.primary,
  },
});
