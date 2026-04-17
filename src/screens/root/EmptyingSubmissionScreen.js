import React, { useEffect } from "react";
import { StyleSheet, View, Pressable, Image, Alert } from "react-native";
import { ScrollView } from "react-native";
import theme, { COLORS } from "../../core/theme";
import {
  TextInput,
  Text,
  Button,
  Portal,
  Dialog,
  HelperText,
  Card,
  Icon,
  IconButton,
} from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import DatePicker from "react-native-date-picker";
import useEmptying from "../../hooks/useEmptying";
import dayjs from "dayjs";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { defaultImage } from "../../core/constants/urls";
import LoadingView from "../../components/common/LoadingView";
import colors, { lightTheme } from "../../core/theme/colors";
import { EmptyingFieldsEnum } from "../../constants/enum";
import { Header } from "../../components/headers";
import { useSelector } from "react-redux";
import { ROUTES } from "../../core/constants/routes";

const mode = "outlined";

const EmptyingSubmissionScreen = ({ route, navigation }) => {
  const { contentsLabel } = useSelector((state) => state.auth);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);
  const [image, setImage] = useState({
    name: "",
    open: false,
  });
  const [selectedBuildingName, setSelectedBuildingName] = useState("");

  const { item } = route.params;

  const getLabel = (key) => contentsLabel?.[key] || key;

  const {
    formik,
    drivers,
    emptiers,
    treatmentPlants,
    vacutugs,
    vehicles,
    containments,
    fetchTreatmentPlants,
    fetchVacugtugs,
    fetchDrivers,
    getEmptiers,
    fetchVehicles,
    fetchUserLocation,
    fetchContainments,
  } = useEmptying(item);

  const {
    values,
    errors,
    isSubmitting,
    setFieldValue,
    handleChange,
    handleSubmit,
  } = formik;

  const {
    date,
    driver,
    emptier1,
    emptier2,
    end_time,
    house_image,
    no_of_trips,
    place_of_disposal,
    receipt_image,
    start_time,
    total_cost,
    vacutug_id,
    volume_of_sludge,
    comments,
    desludging_vehicle_id,
    distance_closest_well,
    emptying_reason,
    service_receiver_gender,
    service_receiver_name,
    treatment_plant_id,
    service_receiver_contact,
    latitude,
    longitude,
    building_id,
    containment_id,
  } = values;

  useEffect(() => {
    fetchDrivers();
    getEmptiers();
    fetchTreatmentPlants();
    fetchVacugtugs();
    fetchVehicles();
    fetchUserLocation();
  }, []);

  useEffect(() => {
    const selectedBuilding = route?.params?.selectedBuilding;
    if (!selectedBuilding) return;

    const selectedBuildingId =
      typeof selectedBuilding === "object"
        ? selectedBuilding?.id || ""
        : selectedBuilding;
    const selectedBuildingDisplayName =
      typeof selectedBuilding === "object"
        ? selectedBuilding?.name || ""
        : selectedBuilding;

    setFieldValue("building_id", selectedBuildingId);
    setSelectedBuildingName(selectedBuildingDisplayName);
    navigation.setParams({ selectedBuilding: undefined });
  }, [navigation, route?.params?.selectedBuilding, setFieldValue]);

  useEffect(() => {
    if (!building_id) return;
    setFieldValue("containment_id", "");
    fetchContainments(building_id);
  }, [building_id]);

  useEffect(() => {
    if (containments.length === 1) {
      setFieldValue("containment_id", containments[0]);
    } else if (containments.length === 0) {
      setFieldValue("containment_id", "");
    }
  }, [containments]);

  const option = {
    mediaType: "photo",
    quality: 0.3,
    cameraType: "back",
    saveToPhotos: true,
  };

  const openCamera = (setFieldValue) => {
    launchCamera(option, (res) => {
      if (res.didCancel) return;
      const fileSizeInMB = (res.assets[0].fileSize / (1024 * 1024)).toFixed(2);
      if (res.assets[0].type === "image/png") {
        Alert.alert(
          getLabel("File format error"),
          getLabel("The image must be in jpg format, please try again."),
          [
            {
              text: getLabel("OK"),
            },
          ]
        );
        return;
      } else if (fileSizeInMB > 5) {
        Alert.alert(
          getLabel("File size error"),
          getLabel("The image size exceeds 5 MB, please try again."),
          [
            {
              text: getLabel("OK"),
            },
          ]
        );
        return;
      }

      setFieldValue(image.name, res.assets[0]);
    });
  };

  const openGallery = (setFieldValue) => {
    launchImageLibrary(option, (res) => {
      if (res.didCancel) return;
      const fileSizeInMB = (res.assets[0].fileSize / (1024 * 1024)).toFixed(2);

      if (res.assets[0].type === "image/png") {
        Alert.alert(
          getLabel("File format error"),
          getLabel("The image must be in jpg format, please try again."),
          [
            {
              text: getLabel("OK"),
            },
          ]
        );
        return;
      } else if (fileSizeInMB > 5) {
        Alert.alert(
          getLabel("File size error"),
          getLabel("The image size exceeds 5 MB, please try again."),
          [
            {
              text: getLabel("OK"),
            },
          ]
        );
        return;
      }

      setFieldValue(image.name, res.assets[0]);
    });
  };

  return (
    <View style={styles.mainCOntainer}>
      <Header
        title={`${getLabel("Emptying Service")} #${route?.params?.item?.id}`}
      />
      <ScrollView style={styles.container}>
        <View style={{ gap: 12, paddingHorizontal: 4 }}>
          <TextInput
            label={
              contentsLabel?.[EmptyingFieldsEnum.Date] ||
              EmptyingFieldsEnum.Date
            }
            editable={false}
            value={dayjs(date).format("DD MMMM YYYY")}
          />
          {errors.date && <HelperText type="error">{errors.date}</HelperText>}
          <DatePicker
            date={date}
            open={dateOpen}
            minimumDate={new Date()}
            modal
            mode="date"
            onCancel={() => setDateOpen(false)}
            onConfirm={(date) => {
              setDateOpen(false);
              setFieldValue("date", date);
            }}
          />

          <Card mode="contained" style={styles.mapSelectionCard}>
            <Card.Content style={styles.mapSelectionContent}>
              <Text variant="titleSmall">
                {contentsLabel?.["Building Selection"] || "Building Selection"}
              </Text>
              <Text variant="bodyMedium">
                {building_id
                  ? `${contentsLabel?.["Selected BIN"] || "Selected BIN"}: ${
                      selectedBuildingName || building_id
                    }`
                  : contentsLabel?.["No building selected"] ||
                    "No building selected"}
              </Text>
              <Button
                mode="contained-tonal"
                onPress={() =>
                  navigation.navigate(ROUTES.emptying_building_picker, {
                    selectedBuildingId: building_id,
                  })
                }
              >
                {building_id
                  ? contentsLabel?.["Change Building"] || "Change Building"
                  : contentsLabel?.["Select Building"] || "Select Building"}
              </Button>
            </Card.Content>
          </Card>
          {errors.building_id && (
            <HelperText type="error">{errors.building_id}</HelperText>
          )}

          {building_id ? (
            containments.length > 1 ? (
              <>
                <View
                  style={[
                    styles.picker,
                    {
                      borderColor: errors?.containment_id
                        ? theme.colors.error
                        : null,
                      borderBottomWidth: errors?.containment_id ? 2 : 0.5,
                    },
                  ]}
                >
                  <Picker
                    style={styles.pickerTextStyle}
                    selectedValue={containment_id}
                    onValueChange={(value) =>
                      setFieldValue("containment_id", value)
                    }
                  >
                    <Picker.Item
                      label={
                        contentsLabel?.["Select Containment"] ||
                        "Select Containment"
                      }
                      value=""
                      color="#767A7D"
                    />
                    {containments.map((c) => (
                      <Picker.Item
                        key={c}
                        value={c}
                        label={c}
                      />
                    ))}
                  </Picker>
                </View>
                {errors.containment_id && (
                  <HelperText type="error">{errors.containment_id}</HelperText>
                )}
              </>
            ) : (
              <>
                <TextInput
                  label={
                    contentsLabel?.["Containment"] || "Containment"
                  }
                  editable={false}
                  error={!!errors.containment_id}
                  value={containment_id.toString()}
                />
                {errors.containment_id && (
                  <HelperText type="error">{errors.containment_id}</HelperText>
                )}
              </>
            )
          ) : null}

          <TextInput
            label={
              contentsLabel?.[EmptyingFieldsEnum.ServiceReciverName] ||
              EmptyingFieldsEnum.ServiceReciverName
            }
            value={service_receiver_name}
            error={errors.service_receiver_name}
            onChangeText={handleChange("service_receiver_name")}
          />
          {errors.service_receiver_name && (
            <HelperText type="error">{errors.service_receiver_name}</HelperText>
          )}

          <View
            style={[
              styles.picker,
              {
                borderColor: errors?.service_receiver_gender
                  ? theme.colors.error
                  : null,
                borderBottomWidth: errors?.service_receiver_gender ? 2 : 0.5,
              },
            ]}
          >
            <Picker
              style={[styles.pickerTextStyle]}
              selectedValue={service_receiver_gender}
              onValueChange={(value) =>
                setFieldValue("service_receiver_gender", value)
              }
            >
              <Picker.Item
                label={
                  contentsLabel?.[EmptyingFieldsEnum.SelectReceiverGender] ||
                  EmptyingFieldsEnum.SelectReceiverGender
                }
                value=""
                color="#767A7D"
              />
              <Picker.Item
                label={contentsLabel?.["Male"] || "Male"}
                value="male"
              />
              <Picker.Item
                label={contentsLabel?.["Female"] || "Female"}
                value="female"
              />
              <Picker.Item
                label={contentsLabel?.["Others"] || "Others"}
                value="others"
              />
            </Picker>
          </View>
          {errors.service_receiver_gender && (
            <HelperText type="error">
              {errors.service_receiver_gender}
            </HelperText>
          )}

          <TextInput
            label={
              contentsLabel?.[EmptyingFieldsEnum.ServiceReciverPhone] ||
              EmptyingFieldsEnum.ServiceReciverPhone
            }
            keyboardType="number-pad"
            value={service_receiver_contact}
            error={errors.service_receiver_contact}
            onChangeText={handleChange("service_receiver_contact")}
          />
          {errors.service_receiver_contact && (
            <HelperText type="error">
              {errors.service_receiver_contact}
            </HelperText>
          )}

          <TextInput
            label={
              contentsLabel?.[EmptyingFieldsEnum.EmptyingReason] ||
              EmptyingFieldsEnum.EmptyingReason
            }
            numberOfLines={4}
            multiline
            value={emptying_reason}
            error={errors.emptying_reason}
            onChangeText={handleChange("emptying_reason")}
          />
          {errors.emptying_reason && (
            <HelperText type="error">{errors.emptying_reason}</HelperText>
          )}

          <TextInput
            label={contentsLabel?.["No. of trips"] || "No. of Trips"}
            keyboardType="number-pad"
            value={no_of_trips.toString()}
            error={errors.no_of_trips}
            onChangeText={handleChange("no_of_trips")}
          />
          {errors.no_of_trips && (
            <HelperText type="error">{errors.no_of_trips}</HelperText>
          )}

          <TextInput
            label={
              contentsLabel?.[EmptyingFieldsEnum.Sludge] ||
              EmptyingFieldsEnum.Sludge
            }
            value={volume_of_sludge.toString()}
            onChangeText={handleChange("volume_of_sludge")}
            keyboardType="number-pad"
            error={errors.volume_of_sludge}
          />
          {errors.volume_of_sludge && (
            <HelperText type="error">{errors.volume_of_sludge}</HelperText>
          )}

          {/* <TextInput
            label={EmptyingFieldsEnum.DistanceToWell}
            keyboardType="number-pad"
            value={distance_closest_well.toString()}
            onChangeText={handleChange("distance_closest_well")}
            error={errors.distance_closest_well}
          />
          {errors.distance_closest_well && (
            <HelperText type="error">{errors.distance_closest_well}</HelperText>
          )} */}

          <View
            style={[
              styles.picker,
              {
                borderColor: errors?.desludging_vehicle_id
                  ? theme.colors.error
                  : null,
                borderBottomWidth: errors?.desludging_vehicle_id ? 2 : 0.5,
              },
            ]}
          >
            <Picker
              style={styles.pickerTextStyle}
              selectedValue={desludging_vehicle_id}
              onValueChange={(value) =>
                setFieldValue("desludging_vehicle_id", value)
              }
            >
              <Picker.Item
                label={
                  contentsLabel?.[
                    EmptyingFieldsEnum.DesludginggVehicleNumber
                  ] || EmptyingFieldsEnum.DesludginggVehicleNumber
                }
                value=""
                color="#767A7D"
              />
              {vehicles.map((item) => (
                <Picker.Item
                  key={item?.id}
                  multiline
                  value={item?.id}
                  numberOfLines={3}
                  label={`${
                    contentsLabel?.["License plate"] || "License plate"
                  } ${item?.license_plate_number}/${
                    contentsLabel?.["Capacity"] || "Capacity"
                  }: ${item?.capacity}`}
                />
              ))}
            </Picker>
          </View>
          {errors.desludging_vehicle_id && (
            <HelperText type="error">{errors.desludging_vehicle_id}</HelperText>
          )}

          <View
            style={[
              styles.picker,
              {
                borderColor: errors?.driver ? theme.colors.error : null,
                borderBottomWidth: errors?.driver ? 2 : 0.5,
              },
            ]}
          >
            <Picker
              style={styles.pickerTextStyle}
              selectedValue={driver}
              onValueChange={(value) => setFieldValue("driver", value)}
            >
              <Picker.Item
                label={contentsLabel?.["Select A Driver"] || "Select A Driver"}
                value=""
                color="#767A7D"
              />
              {drivers.map((item) => (
                <Picker.Item
                  key={item?.id}
                  value={item?.id}
                  label={item?.name}
                />
              ))}
            </Picker>
          </View>
          {errors.driver && (
            <HelperText type="error">{errors.driver}</HelperText>
          )}

          <View
            style={[
              styles.picker,
              {
                borderColor: errors?.emptier1 ? theme.colors.error : null,
                borderBottomWidth: errors?.emptier1 ? 2 : 0.5,
              },
            ]}
          >
            <Picker
              style={styles.pickerTextStyle}
              selectedValue={emptier1}
              onValueChange={(value) => setFieldValue("emptier1", value)}
            >
              <Picker.Item
                label={
                  contentsLabel?.["Select Emptier 1"] || "Select Emptier 1"
                }
                value=""
                color="#767A7D"
              />
              {emptiers.map((item) => (
                <Picker.Item
                  key={item?.id}
                  value={item?.id}
                  label={item?.name}
                />
              ))}
            </Picker>
          </View>
          {errors.emptier1 && (
            <HelperText type="error">{errors.emptier1}</HelperText>
          )}

          <View
            style={[
              styles.picker,
              {
                borderColor: errors?.emptier2 ? theme.colors.error : null,
                borderBottomWidth: errors?.emptier2 ? 2 : 0.5,
              },
            ]}
          >
            <Picker
              style={styles.pickerTextStyle}
              selectedValue={emptier2}
              onValueChange={(value) => setFieldValue("emptier2", value)}
            >
              <Picker.Item
                label={
                  contentsLabel?.["Select Emptier 2"] || "Select Emptier 2"
                }
                value=""
                color="#767A7D"
              />
              {emptiers.map((item) => (
                <Picker.Item
                  key={item?.id}
                  value={item?.id}
                  label={item?.name}
                />
              ))}
            </Picker>
          </View>
          {errors.emptier2 && (
            <HelperText type="error">{errors.emptier2}</HelperText>
          )}

          <Pressable onPress={() => setTimeOpen(true)}>
            <TextInput
              label={contentsLabel?.["Start Time"] || "Start Time"}
              editable={false}
              error={errors.start_time}
              value={dayjs(start_time).format("HH:mm")}
            />
          </Pressable>
          {errors.start_time && (
            <HelperText type="error">{errors.start_time}</HelperText>
          )}

          <Pressable onPress={() => setEndTimeOpen(true)}>
            <TextInput
              label={contentsLabel?.["End Time"] || "End Time"}
              editable={false}
              error={errors.end_time}
              value={dayjs(end_time).format("HH:mm")}
            />
          </Pressable>
          {errors.end_time && (
            <HelperText type="error">{errors.end_time}</HelperText>
          )}

          <DatePicker
            date={start_time}
            open={timeOpen}
            modal
            mode="time"
            onCancel={() => setTimeOpen(false)}
            onConfirm={(date) => {
              setTimeOpen(false);
              console.log(date);
              setFieldValue("start_time", date);
            }}
          />
          <DatePicker
            date={end_time}
            open={endTimeOpen}
            modal
            mode="time"
            onCancel={() => setEndTimeOpen(false)}
            onConfirm={(date) => {
              setEndTimeOpen(false);
              setFieldValue("end_time", date);
            }}
          />

          <TextInput
            label={contentsLabel?.["Total Cost"] || "Total Cost"}
            value={total_cost.toString()}
            keyboardType="number-pad"
            error={errors.total_cost}
            onChangeText={handleChange("total_cost")}
          />
          {errors.total_cost && (
            <HelperText type="error">{errors.total_cost}</HelperText>
          )}

          <View
            style={[
              styles.picker,
              {
                borderColor: errors?.treatment_plant_id
                  ? theme.colors.error
                  : null,
                borderBottomWidth: errors?.treatment_plant_id ? 2 : 0.5,
              },
            ]}
          >
            <Picker
              style={styles.pickerTextStyle}
              selectedValue={treatment_plant_id}
              onValueChange={(value) =>
                setFieldValue("treatment_plant_id", value)
              }
            >
              <Picker.Item
                label={
                  contentsLabel?.["Select A Disposal Place"] ||
                  "Select A Disposal Place"
                }
                value=""
                color="#767A7D"
              />
              {treatmentPlants.map((item) => (
                <Picker.Item
                  key={item?.id}
                  value={item?.id}
                  label={item?.name}
                />
              ))}
            </Picker>
          </View>
          {errors.treatment_plant_id && (
            <HelperText type="error">{errors.treatment_plant_id}</HelperText>
          )}
          {item?.image_status == "false" && (
            <View style={styles.imgContainer}>
              {!!house_image ? (
                <Card mode="contained">
                  <Card.Cover
                    source={{
                      uri: house_image?.uri,
                    }}
                  />
                  <IconButton
                    mode="contained-tonal"
                    icon={"trash-can-outline"}
                    containerColor={"white"}
                    iconColor={"red"}
                    size={20}
                    style={styles.removeBtn}
                    onPress={() => setFieldValue("house_image", undefined)}
                  />
                </Card>
              ) : (
                <Card
                  mode="contained"
                  style={[
                    styles.uploadImageCard,
                    errors.house_image && styles.errorCard,
                  ]}
                  onPress={() => setImage({ open: true, name: "house_image" })}
                >
                  <Card.Content style={styles.uploadImageContainer}>
                    <Icon source={"image-plus"} size={36} />
                    <View style={{ alignItems: "center" }}>
                      <Text variant="labelLarge">
                        {contentsLabel?.[`Upload House Image`] ||
                          `Upload House Image`}
                      </Text>
                      <Text variant="labelLarge">
                        {contentsLabel?.[`(Max 5MB)`] || `(Max 5MB)`}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              )}
              {!house_image && errors.house_image ? (
                <HelperText type="error">
                  {contentsLabel?.["File Size should not exceed 5MB"] ||
                    "File Size should not exceed 5MB"}
                </HelperText>
              ) : null}
            </View>
          )}

          <View style={styles.imgContainer}>
            {!!receipt_image ? (
              <Card mode="contained">
                <Card.Cover
                  source={{
                    uri: receipt_image?.uri,
                  }}
                />

                <IconButton
                  mode="contained-tonal"
                  icon={"trash-can-outline"}
                  containerColor={"white"}
                  iconColor={"red"}
                  size={20}
                  style={styles.removeBtn}
                  onPress={() => setFieldValue("receipt_image", undefined)}
                />
              </Card>
            ) : (
              <Card
                mode="contained"
                style={[
                  styles.uploadImageCard,
                  errors.receipt_image && styles.errorCard,
                ]}
                onPress={() => setImage({ open: true, name: "receipt_image" })}
              >
                <Card.Content style={styles.uploadImageContainer}>
                  <Icon source={"image-plus"} size={36} />
                  <View style={{ alignItems: "center" }}>
                    <Text variant="labelLarge">
                      {contentsLabel?.[`Upload Site Photo`] ||
                        `Upload Site Photo`}
                    </Text>
                    <Text variant="labelLarge">
                      {contentsLabel?.[`(Max 5MB)`] || `(Max 5MB)`}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            )}
            {!receipt_image && errors.receipt_image ? (
              <HelperText type="error">
                {contentsLabel?.["File Size should not exceed 5MB"] ||
                  "File Size should not exceed 5MB"}
              </HelperText>
            ) : null}
          </View>

          <Portal>
            <Dialog
              style={{
                justifyContent: "center",
                alignItems: "center",
                paddingBottom: 18,
              }}
              visible={image.open}
              onDismiss={() => setImage({ ...image, open: false })}
            >
              <Button
                onPress={() => {
                  setImage({ ...image, open: false });
                  openCamera(setFieldValue);
                }}
              >
                {contentsLabel?.["Open Camera"] || "Open Camera"}
              </Button>
              <Button
                onPress={() => {
                  setImage({ ...image, open: false });
                  openGallery(setFieldValue);
                }}
              >
                {contentsLabel?.["Choose from gallery"] ||
                  "Choose from gallery"}
              </Button>
            </Dialog>
          </Portal>
          <TextInput
            label={contentsLabel?.["Comments (If any)"] || "Comments (If any)"}
            numberOfLines={4}
            multiline
            value={comments}
            onChangeText={handleChange("comments")}
          />
          {errors.comments && (
            <HelperText type="error">{errors.comments}</HelperText>
          )}

          <Button
            disabled={isSubmitting}
            loading={isSubmitting}
            style={styles.btn}
            mode="contained"
            onPress={handleSubmit}
          >
            {contentsLabel?.["Submit"] || "Submit"}
          </Button>
        </View>
        {isSubmitting && <LoadingView />}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainCOntainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 10,
    gap: 8,
  },
  pickerTextStyle: {
    color: lightTheme.colors.onSurfaceVariant,
  },
  input: {
    // marginVertical: 10,
    // backgroundColor: COLORS.background,
  },
  text: {
    marginVertical: 5,
  },
  img: {
    alignItems: "center",
    height: 200,
    width: "60%",
  },
  img1: {
    width: "100%",
    height: "100%",
  },
  btn: {
    marginVertical: 20,
  },
  picker: {
    backgroundColor: colors.fieldsColor,
    borderBottomColor: colors.darkGrey,
    borderBottomWidth: 0.6,
  },
  imgContainer: {
    gap: 10,
    // marginTop: 8,
    // paddingHorizontal: 8,
  },
  uploadImageCard: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderStyle: "dashed",
    borderRadius: 8,
  },
  errorCard: {
    borderColor: theme.colors.error,
  },
  removeBtn: {
    position: "absolute",
    right: 4,
    bottom: 4,
  },
  uploadImageContainer: {
    gap: 8,
    alignItems: "center",
  },
  uploadImageCardContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 160,
  },
  mapSelectionCard: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  mapSelectionContent: {
    gap: 8,
  },
});

export default EmptyingSubmissionScreen;
