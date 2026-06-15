import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  FlatList,
  StyleSheet,
  View,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { ROUTES } from "../../core/constants/routes";
import {
  assessmentService,
  emptyingService,
  pendingApplications,
  sludgeCollectionApplications,
} from "../../service/supervisor_service";
import { useSelector } from "react-redux";
import ApplicationListCard from "../../components/common/ApplicationListCard";
import PrimarySpinner from "../../components/common/PrimarySpinner";
import { ErrorMessage } from "../../components/errorComponent";
import { Header } from "../../components/headers";
import { geometryToCoords, geometryToMapPoint } from "../../helpers/geo";

export default function ApplicationListScreen({ navigation, route }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { assessment, emptying, sludgeCollection } = route.params;

  const getPendingApplicationsService = () => {
    setIsLoading(true);
    pendingApplications()
      .then((res) => {
        const { data, success, error } = res.data;
        if (success) {
          setData(data.applications);
        } else {
          console.log(error);
        }
      })
      .catch((err) => {
        console.log("errr", err);

        if (err?.response?.status === 500) {
          Alert.alert(
            "500",
            "Something is wrong, please try again or at a later time."
          );
        }
      })
      .finally(() => setIsLoading(false));
  };

  //Application Emptying Service api
  const getApplicationEmptyingService = () => {
    setIsLoading(true);
    emptyingService()
      .then((res) => {
        const { data, success, error } = res.data;
        if (success) {
          setData(data.applications);
        } else {
          console.log(error);
        }
      })
      .catch((err) => {
        console.log("errr", err);

        if (err?.response?.status === 500) {
          Alert.alert(
            "500",
            "Something is wrong, please try again or at a later time."
          );
        }
      })
      .finally(() => setIsLoading(false));
  };

  // Sludge Collection Applications api
  const getSludgeCollectionApplicationsService = () => {
    setIsLoading(true);
    sludgeCollectionApplications()
      .then((res) => {
        const { data, success, error } = res.data;
        if (success) {
          setData(data.applications);
        } else {
          console.log(error);
        }
      })
      .catch((err) => {
        console.log("errr", err);

        if (err?.response?.status === 500) {
          Alert.alert(
            "500",
            "Something is wrong, please try again or at a later time."
          );
        }
      })
      .finally(() => setIsLoading(false));
  };

  //Application Assessment api
  const getApplicationAssessment = () => {
    setIsLoading(true);
    assessmentService()
      .then((res) => {
        const { data, success, error } = res.data;

        if (success) {
          setData(data.applications);
        } else {
          console.log(error);
        }
      })
      .catch((err) => {
        console.log("Error", err);
        if (err?.response?.status === 500) {
          Alert.alert(
            "500",
            "Something is wrong, please try again or at a later time."
          );
        }
      })
      .finally(() => setIsLoading(false));
  };

  const fetchData = () => {
    if (emptying) {
      // getApplicationEmptyingService();
      getPendingApplicationsService();
    } else if (assessment) {
      getApplicationAssessment();
    } else if (sludgeCollection) {
      getSludgeCollectionApplicationsService();
    }
  };

  useFocusEffect(useCallback(fetchData, [navigation]));

  const onClick = (item) => {
    if (emptying) {
      navigation.navigate(ROUTES.empty_submission, { item });
    } else if (assessment) {
      navigation.navigate(ROUTES.containment_assessment, { item });
    } else if (sludgeCollection) {
      navigation.navigate(ROUTES.sludge_collection, { item });
    }
  };

  const { contentsLabel } = useSelector((state) => state.auth);
  const getLabel = (key) => contentsLabel?.[key] || key;

  const openPhone = (item) => {
    Linking.openURL(`tel:${item?.customer_contact}`);
  };

  const openGoogleMap = (item) => {
    const mapPoint = geometryToMapPoint(item?.geometry);
    if (!mapPoint) {
      Alert.alert(
        getLabel("Location unavailable"),
        getLabel("Location not available for this application.")
      );
      return;
    }

    const scheme = Platform.select({
      ios: "maps://0,0?q=",
      android: "geo:0,0?q=",
    });
    const latLng = `${mapPoint.latitude},${mapPoint.longitude}`;
    const label = `${item?.customer_name}'s location`;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    Linking.openURL(url);
  };
  return (
    <View style={styles.container}>
      <Header title={getLabel("Application List")} />
      {!!isLoading ? (
        <PrimarySpinner />
      ) : data.length > 0 ? (
        // <List.Section>
        <FlatList
          data={data}
          renderItem={({ item }) => (
            <ApplicationListCard
              item={item}
              locationAvailable={!!geometryToCoords(item?.geometry)}
              onCall={() => openPhone(item)}
              onLocation={() => openGoogleMap(item)}
              onStart={() => onClick(item)}
            />
          )}
          onRefresh={fetchData}
          refreshing={isLoading}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        />
      ) : (
        // </List.Section>
        <ErrorMessage
          message={getLabel(
            "No suitable applications available for this service."
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyText: {
    alignSelf: "center",
  },
});
