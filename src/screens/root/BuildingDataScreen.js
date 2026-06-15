import React from "react";
import {
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
  RefreshControl,
  View,
  Image,
} from "react-native";
import { Button, Caption, Card, Divider, Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

import HorizontalSpacer from "../../components/common/HorizontalSpacer";
import VerticalSpacer from "../../components/common/VerticalSpacer";

import { COLORS, SPACINGS } from "../../core/theme";
import { removeBuildingData, updateBuildingData } from "../../store/slices/map.slice";
import { buildSaveBuildingFormData } from "../../service/building_service";
import { validateBuildingDraft } from "../../helpers/buildingDraft";

import { useState } from "react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import RNFB from "react-native-blob-util";
import { ROUTES } from "../../core/constants/routes";
import { useEffect } from "react";
import { resetToken } from "../../store/slices/auth.slice";
import { URLS } from "../../core/constants/urls";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ErrorMessage } from "../../components/errorComponent";
import { Header } from "../../components/headers";
import { BASE_URL_ENV } from "../../constants/config";

const BuildingDataScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { contentsLabel } = useSelector((state) => state.auth);
  const { buildingsData } = useSelector((state) => state.map);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);
  const getLabel = (key) => contentsLabel?.[key] || key;
  const deleteBuildingData = (index) => {
    Alert.alert(
      getLabel("Confirm delete"),
      getLabel("Are you sure you want to delete this building information?"),
      [
        {
          text: getLabel("CANCEL"), // Using "CANCEL" from your provided list
        },
        {
          text: getLabel("DELETE"), // Using "DELETE" from your provided list
          onPress: () => {
            dispatch(removeBuildingData(index));
          },
        },
      ]
    );
  };

  const onUpload = async (item, index) => {
    // Guard legacy/incomplete drafts that predate form validation: catch missing
    // required fields here so they surface a clear message instead of a server 422
    // (e.g. "Structure type is required in payload_json").
    const validationErrors = validateBuildingDraft(item);
    if (!item?.path) {
      validationErrors.kml =
        "Building outline (KML) file is missing. Please redraw the building.";
    }

    if (Object.keys(validationErrors).length > 0) {
      const firstKey = Object.keys(validationErrors)[0];
      const firstMessage = validationErrors[firstKey];
      dispatch(
        updateBuildingData({
          index,
          patch: {
            upload_status: "failed",
            last_error: `${getLabel(firstKey)}: ${getLabel(firstMessage)}`,
            field_errors: validationErrors,
          },
        })
      );
      Alert.alert(
        getLabel("Error"),
        `${getLabel(firstKey)}: ${getLabel(firstMessage)}`,
        [{ text: getLabel("OK") }]
      );
      return;
    }

    setLoading(true);
    dispatch(
      updateBuildingData({
        index,
        patch: {
          upload_status: "uploading",
          last_error: null,
          field_errors: null,
        },
      })
    );

    const token = await AsyncStorage.getItem("token");
    const data = buildSaveBuildingFormData(item);

    const url = `${BASE_URL_ENV}/api/${URLS.uploadBuildingData}`;

    fetch(url, {
      method: "POST",
      body: data,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      redirect: "follow",
    })
      .then((res) => res.json())
      .then((res) => {
        console.log("res", res);

        const { status, success, errors, message } = res || {};
        const isUploadSuccess =
          success === true || status === 200 || status === "200";

        if (isUploadSuccess && !errors) {
          Alert.alert(getLabel("Uploaded"), message, [
            {
              text: getLabel("OK"), // Using "CANCEL" from your provided list
            },
          ]);
          dispatch(removeBuildingData(index));
          RNFB.fs.unlink(item.path);
        } else {
          if (errors) {
            const firstKey = Object.keys(errors)[0];
            const firstMessage = errors[firstKey]?.[0] || message;
            dispatch(
              updateBuildingData({
                index,
                patch: {
                  upload_status: "failed",
                  last_error: firstMessage || "Validation failed.",
                  field_errors: errors,
                },
              })
            );
            Alert.alert(getLabel("Error"), firstMessage || getLabel("Validation failed"), [
              {
                text: getLabel("OK"),
              },
            ]);
          } else {
            dispatch(
              updateBuildingData({
                index,
                patch: {
                  upload_status: "failed",
                  last_error: message || "Upload failed.",
                },
              })
            );
            Alert.alert(getLabel("Error"), message, [
              {
                text: getLabel("OK"), // Using "CANCEL" from your provided list
              },
            ]);
          }
        }
      })
      .catch((err) => {
        console.log("building err", err);

        const { message } = err?.response?.data;
        const fieldErrors = err?.response?.data?.errors;

        setLoading(false);

        dispatch(
          updateBuildingData({
            index,
            patch: {
              upload_status: "failed",
              last_error: message || err?.message || "Upload failed.",
              field_errors: fieldErrors || null,
            },
          })
        );

        if (err?.response?.status === 500) {
          if (message) {
            Alert.alert(getLabel("Invalid file format"), message, [
              {
                text: getLabel("OK"), // Using "CANCEL" from your provided list
              },
            ]);
            return;
          }

          Alert.alert(
            "500",
            "Something is wrong, please try again or at a later time."
          );
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const renderBuildlingItems = ({ item, index }) => {
    return (
      <Card style={styles.singleData} theme={{ roundness: 2 }}>
        <Card.Content
          style={{ flexDirection: "row", justifyContent: "space-between" }}
        >
          <View style={{ width: "100%" }}>
            <Caption>{getLabel("Temporary Building Code")}</Caption>
            <Text>{item?.temp_building_code}</Text>

            <Caption>{getLabel("Tax Code")}</Caption>
            <Text>{item?.tax_code}</Text>

            <Caption>{getLabel("Created date")}</Caption>
            <Text>{item?.created_date}</Text>
            <Caption>{getLabel("Upload status")}</Caption>
            <Text>{item?.upload_status || "pending"}</Text>
            {!!item?.last_error && (
              <>
                <Caption>{getLabel("Last error")}</Caption>
                <Text>{item?.last_error}</Text>
              </>
            )}
          </View>
        </Card.Content>
        <VerticalSpacer />
        <Divider />
        <VerticalSpacer size={2} />
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            paddingHorizontal: 16,
            paddingVertical: 16,
            gap: 8,
          }}
        >
          {/* <Card.Actions> */}
          <Button
            compact
            contentStyle={styles.deleteBtn}
            mode="outlined"
            onPress={() => deleteBuildingData(index)}
          >
            {getLabel("Delete")}
          </Button>

          <Button
            compact
            mode="contained"
            contentStyle={styles.btnContent}
            onPress={() => onUpload(item, index)}
          >
            {getLabel("Upload")}
          </Button>

          <Button
            compact
            mode="contained"
            contentStyle={styles.btnContent}
            onPress={() => navigation.navigate(ROUTES.kml_viewer, { item })}
          >
            {getLabel("View on map")}
          </Button>
          {/* </Card.Actions> */}
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header title={getLabel("Building Data")} />
      {buildingsData.length > 0 ? (
        <>
          <LoadingSpinner isVisible={loading} title="Uploading" />
          <FlatList
            data={buildingsData}
            contentContainerStyle={styles.contentContainer}
            renderItem={renderBuildlingItems}
            keyExtractor={(_, index) => index}
            ItemSeparatorComponent={VerticalSpacer}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <ErrorMessage
          message={getLabel("No building data stored in this device")}
        />
      )}
    </View>
  );
};

export default BuildingDataScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  singleData: {
    elevation: 1,
  },

  contentContainer: {
    padding: SPACINGS.xs,
    paddingBottom: SPACINGS.lg,
  },

  btnContent: {
    backgroundColor: COLORS.primary,
    minWidth: 85,
  },

  deleteBtn: {
    minWidth: 85,
  },
});
