import React, { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import DatePicker from "react-native-date-picker";
import dayjs from "dayjs";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useSelector } from "react-redux";
import { Header } from "../../components/headers";
import { saveSludgeCollectionAPI } from "../../service/supervisor_service";

const SludgeCollectionScreen = ({ route, navigation }) => {
  const { contentsLabel } = useSelector((state) => state.auth);
  const getLabel = (key) => contentsLabel?.[key] || key;

  const item = route?.params?.item || {};

  const treatmentPlantName =
    item?.treatment_plant_name || item?.treatment_plant || "N/A";
  const applicationId = item?.id ? String(item.id) : "N/A";
  const sludgeVolume =
    item?.volume_of_sludge !== undefined && item?.volume_of_sludge !== null
      ? String(item.volume_of_sludge)
      : "N/A";

  const [date, setDate] = useState(new Date());
  const [noOfTrips, setNoOfTrips] = useState("");
  const [entryTime, setEntryTime] = useState(new Date());
  const [exitTime, setExitTime] = useState(
    dayjs().add(10, "minute").toDate()
  );

  const [dateOpen, setDateOpen] = useState(false);
  const [entryTimeOpen, setEntryTimeOpen] = useState(false);
  const [exitTimeOpen, setExitTimeOpen] = useState(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formattedDate = useMemo(
    () => (date ? dayjs(date).format("MM/DD/YYYY") : ""),
    [date]
  );

  const formattedEntryTime = useMemo(
    () => (entryTime ? dayjs(entryTime).format("hh:mm A") : ""),
    [entryTime]
  );

  const formattedExitTime = useMemo(
    () => (exitTime ? dayjs(exitTime).format("hh:mm A") : ""),
    [exitTime]
  );

  const validate = () => {
    const validationErrors = {};

    if (!date) {
      validationErrors.date =
        getLabel("Date is required") || "Date is required";
    }

    if (!noOfTrips) {
      validationErrors.noOfTrips =
        getLabel("No. of Trips is required") || "No. of Trips is required";
    } else if (Number.isNaN(Number(noOfTrips)) || Number(noOfTrips) <= 0) {
      validationErrors.noOfTrips =
        getLabel("No. of Trips must be greater than 0") ||
        "No. of Trips must be greater than 0";
    }

    if (!entryTime) {
      validationErrors.entryTime =
        getLabel("Entry Time is required") || "Entry Time is required";
    }

    if (!exitTime) {
      validationErrors.exitTime =
        getLabel("Exit Time is required") || "Exit Time is required";
    }

    if (entryTime && exitTime) {
      const entryMinutes =
        dayjs(entryTime).hour() * 60 + dayjs(entryTime).minute();
      const exitMinutes = dayjs(exitTime).hour() * 60 + dayjs(exitTime).minute();

      if (exitMinutes <= entryMinutes) {
        validationErrors.exitTime =
          getLabel("Exit Time must be later than Entry Time") ||
          "Exit Time must be later than Entry Time";
      }
    }

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        application_id: item?.id,
        date: dayjs(date).format("YYYY-MM-DD"),
        no_of_trips: Number(noOfTrips),
        entry_time: dayjs(entryTime).format("HH:mm"),
        exit_time: dayjs(exitTime).format("HH:mm"),
      };

      const res = await saveSludgeCollectionAPI(payload);
      const { success, status, error, message } = res?.data || {};

      if (success || status) {
        Alert.alert(
          getLabel("Success"),
          getLabel("Sludge collection details saved successfully."),
          [
            {
              text: getLabel("OK"),
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          getLabel("Error"),
          message ||
            error ||
            getLabel("Failed to save sludge collection details. Please try again.")
        );
      }
    } catch (err) {
      Alert.alert(
        getLabel("Error"),
        getLabel("Failed to save sludge collection details. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <Header title={`${getLabel("Sludge Collection")} #${applicationId}`} />

      <ScrollView contentContainerStyle={styles.formContainer}>
        <TextInput
          mode="outlined"
          label={`${getLabel("Treatment Plant Name")}*`}
          value={treatmentPlantName}
          editable={false}
          style={styles.readonlyInput}
        />

        <TextInput
          mode="outlined"
          label={`${getLabel("Application ID")}*`}
          value={applicationId}
          editable={false}
          style={styles.readonlyInput}
        />

        <TextInput
          mode="outlined"
          label={`${getLabel("Sludge Volume (m3)")}*`}
          value={sludgeVolume}
          editable={false}
          style={styles.readonlyInput}
        />

        <TextInput
          mode="outlined"
          label={`${getLabel("Date")}*`}
          placeholder="MM/DD/YYYY"
          value={formattedDate}
          error={Boolean(errors.date)}
          editable={false}
          right={
            <TextInput.Icon
              icon="calendar"
              onPress={() => setDateOpen(true)}
            />
          }
          onPressIn={() => setDateOpen(true)}
        />
        {errors.date && <HelperText type="error">{errors.date}</HelperText>}

        <TextInput
          mode="outlined"
          label={`${getLabel("No. of Trips")}*`}
          placeholder={getLabel("No. of Trips")}
          keyboardType="number-pad"
          value={noOfTrips}
          error={Boolean(errors.noOfTrips)}
          onChangeText={(text) => {
            setNoOfTrips(text);
            if (errors.noOfTrips) {
              setErrors((prev) => ({ ...prev, noOfTrips: undefined }));
            }
          }}
        />
        {errors.noOfTrips && (
          <HelperText type="error">{errors.noOfTrips}</HelperText>
        )}

        <TextInput
          mode="outlined"
          label={`${getLabel("Entry Time")}*`}
          placeholder="--:-- --"
          value={formattedEntryTime}
          error={Boolean(errors.entryTime)}
          editable={false}
          right={
            <TextInput.Icon
              icon="clock-outline"
              onPress={() => setEntryTimeOpen(true)}
            />
          }
          onPressIn={() => setEntryTimeOpen(true)}
        />
        {errors.entryTime && (
          <HelperText type="error">{errors.entryTime}</HelperText>
        )}

        <TextInput
          mode="outlined"
          label={`${getLabel("Exit Time")}*`}
          placeholder="--:-- --"
          value={formattedExitTime}
          error={Boolean(errors.exitTime)}
          editable={false}
          right={
            <TextInput.Icon
              icon="clock-outline"
              onPress={() => setExitTimeOpen(true)}
            />
          }
          onPressIn={() => setExitTimeOpen(true)}
        />
        {errors.exitTime && (
          <HelperText type="error">{errors.exitTime}</HelperText>
        )}

        <Button
          mode="contained"
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
          loading={isSubmitting}
          disabled={isSubmitting}
          onPress={handleSubmit}
        >
          {getLabel("Submit")}
        </Button>
      </ScrollView>

      <DatePicker
        modal
        mode="date"
        open={dateOpen}
        date={date || new Date()}
        onConfirm={(selectedDate) => {
          setDateOpen(false);
          setDate(selectedDate);
          if (errors.date) {
            setErrors((prev) => ({ ...prev, date: undefined }));
          }
        }}
        onCancel={() => setDateOpen(false)}
      />

      <DatePicker
        modal
        mode="time"
        open={entryTimeOpen}
        date={entryTime || new Date()}
        onConfirm={(selectedTime) => {
          setEntryTimeOpen(false);
          setEntryTime(selectedTime);
          setExitTime(dayjs(selectedTime).add(10, "minute").toDate());
          if (errors.entryTime) {
            setErrors((prev) => ({ ...prev, entryTime: undefined }));
          }
          if (errors.exitTime) {
            setErrors((prev) => ({ ...prev, exitTime: undefined }));
          }
        }}
        onCancel={() => setEntryTimeOpen(false)}
      />

      <DatePicker
        modal
        mode="time"
        open={exitTimeOpen}
        date={exitTime || new Date()}
        onConfirm={(selectedTime) => {
          setExitTimeOpen(false);
          setExitTime(selectedTime);
          if (errors.exitTime) {
            setErrors((prev) => ({ ...prev, exitTime: undefined }));
          }
        }}
        onCancel={() => setExitTimeOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  formContainer: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  readonlyInput: {
    backgroundColor: "#E0E0E0",
  },
  submitButton: {
    marginTop: 8,
  },
  submitButtonContent: {
    height: 48,
  },
});

export default SludgeCollectionScreen;
