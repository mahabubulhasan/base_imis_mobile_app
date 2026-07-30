import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";
import { useFormik } from "formik";
import { useState } from "react";
import { Alert, ToastAndroid } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { ROUTES } from "../core/constants/routes";
import { defaultImage, URLS } from "../core/constants/urls";
import { getCurrentLocation } from "../helpers/location";
import { askLocationPermission } from "../helpers/permissions";
import {
  containmentsAPI,
  driversAPI,
  emptiersAPI,
  treatmentPlantsAPI,
  vacutugTypesAPI,
} from "../service/supervisor_service";
import { resetToken } from "../store/slices/auth.slice";
import { BASE_URL_ENV } from "../constants/config";
import axios from "axios";

const useEmptying = (application) => {
  const { contentsLabel } = useSelector((state) => state.auth);

  const getLabel = (key) => contentsLabel?.[key] || key;
  const initialValues = {
    date: new Date(),
    volume_of_sludge: "",
    vacutug_id: "",
    place_of_disposal: "",
    driver: "",
    emptier1: "",
    emptier2: "",
    start_time: new Date(),
    end_time: new Date(new Date().getTime() + 10 * 60 * 1000),
    no_of_trips: "",
    total_cost: "",
    application_id: application?.id,
    house_image: "",
    receipt_image: "",
    desludging_vehicle_id: "",
    treatment_plant_id: "",
    distance_closest_well: "",
    comments: "",
    emptying_reason: "",
    service_receiver_gender: "",
    service_receiver_name: "",
    service_receiver_contact: "",
    latitude: "",
    longitude: "",
    building_id: "",
    containment_id: "",
    receipt_number: "",
  };

  const [drivers, setDrivers] = useState([]);
  const [emptiers, setEmptiers] = useState([]);
  const [vacutugs, setVacutugs] = useState([]);
  const [treatmentPlants, setTreatmentPlants] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [containments, setContainments] = useState([]);

  const dispatch = useDispatch();
  const navigation = useNavigation();

  // const {token} = useSelector(state => state.auth);

  // console.log('token', token);

  const fetchContainments = (bin) => {
    containmentsAPI(bin)
      .then((res) => {
        const { success, data } = res.data;

        if (success) {
          setContainments(data?.containments ?? []);
        }
      })
      .catch((e) => {
        if (e.response.status === 401) {
          Alert.alert(getLabel("401"), getLabel("Please log in again."), [
            {
              text: getLabel("OK"),
            },
          ]);
          dispatch(resetToken());
          return;
        }
        if (e.response.status === 500) {
          Alert.alert(
            getLabel("500"),
            getLabel(
              "Something is wrong, please try again or at a later time."
            ),
            [
              {
                text: getLabel("OK"),
              },
            ]
          );
        }
      });
  };

  const fetchDrivers = () => {
    driversAPI()
      .then((res) => {
        const { error, success, data } = res.data;

        if (success) {
          let temp = [];

          Object.entries(data).map(([k, v]) => temp.push({ id: k, name: v }));

          setDrivers(temp);
        }
      })
      .catch((e) => {
        if (e.response.status === 401) {
          Alert.alert(getLabel("401"), getLabel("Please log in again."), [
            {
              text: getLabel("OK"),
            },
          ]);
          dispatch(resetToken());
          return;
        }
        if (e.response.status === 500) {
          Alert.alert(
            getLabel("500"),
            getLabel(
              "Something is wrong, please try again or at a later time."
            ),
            [
              {
                text: getLabel("OK"),
              },
            ]
          );
        }
      });
  };

  const getEmptiers = () => {
    emptiersAPI()
      .then((res) => {
        const { error, success, data } = res.data;

        if (success) {
          let temp = [];

          Object.entries(data).map(([k, v]) => temp.push({ id: k, name: v }));

          setEmptiers(temp);
        }
      })
      .catch((e) => {
        if (e.response.status === 401) {
          Alert.alert(getLabel("401"), getLabel("Please log in again."), [
            {
              text: getLabel("OK"),
            },
          ]);
          dispatch(resetToken());
          return;
        }
        if (e.response.status === 500) {
          Alert.alert(
            getLabel("500"),
            getLabel(
              "Something is wrong, please try again or at a later time."
            ),
            [
              {
                text: getLabel("OK"),
              },
            ]
          );
        }
      });
  };

  const fetchTreatmentPlants = () => {
    treatmentPlantsAPI()
      .then((res) => {
        const { error, success } = res.data;

        if (success) {
          setTreatmentPlants(res?.data?.data["treatment-plants"]);
        }
      })
      .catch((e) => {
        if (e.response.status === 401) {
          Alert.alert(getLabel("401"), getLabel("Please log in again."), [
            {
              text: getLabel("OK"),
            },
          ]);
          dispatch(resetToken());
          return;
        }
        if (e.response.status === 500) {
          Alert.alert(
            getLabel("500"),
            getLabel(
              "Something is wrong, please try again or at a later time."
            ),
            [
              {
                text: getLabel("OK"),
              },
            ]
          );
        }
      });
  };

  const fetchVehicles = () => {
    vacutugTypesAPI()
      .then((res) => {
        const { success, data } = res?.data;

        if (success) {
          setVehicles(data);
        }
      })
      .catch((e) => {
        if (e.response.status === 401) {
          Alert.alert("401", "Please log in again.");
          dispatch(resetToken());
          return;
        }
        if (e.response.status === 500) {
          Alert.alert(
            getLabel("500"),
            getLabel(
              "Something is wrong, please try again or at a later time."
            ),
            [
              {
                text: getLabel("OK"),
              },
            ]
          );
        }
      });
  };

  const fetchVacugtugs = () => {
    treatmentPlantsAPI()
      .then((res) => {
        const { error, success, data } = res.data;

        if (success) {
          setVacutugs(data?.treatmentPlants);
        }
      })
      .catch((e) => {
        if (e.response.status === 401) {
          Alert.alert("401", "Please log in again.");
          dispatch(resetToken());
          return;
        }
        if (e.response.status === 500) {
          Alert.alert(
            getLabel("500"),
            getLabel(
              "Something is wrong, please try again or at a later time."
            ),
            [
              {
                text: getLabel("OK"),
              },
            ]
          );
        }
      });
  };

  const formik = useFormik({
    initialValues,
    validateOnChange: false,
    validate: (values) => {
      const errors = {};

      // Example validation for empty fields
      if (!values.service_receiver_name) {
        errors.service_receiver_name =
          contentsLabel?.["The Service Receiver Name is required."] ||
          "The Service Receiver Name is required.";
      }
      if (!values.service_receiver_gender) {
        errors.service_receiver_gender =
          contentsLabel?.["The Service Receiver Gender is required."] ||
          "The Service Receiver Gender is required.";
      }
      if (!values.service_receiver_contact) {
        errors.service_receiver_contact =
          contentsLabel?.["The Service Receiver Contact Number is required."] ||
          "The Service Receiver Contact Number is required.";
      }

      if (!values.emptying_reason) {
        errors.emptying_reason =
          contentsLabel?.["The reason for emptying is required."] ||
          "The reason for emptying is required.";
      }
      if (!values.volume_of_sludge) {
        errors.volume_of_sludge =
          contentsLabel?.["Sludge Volume is required."] ||
          "Sludge Volume is required.";
      }

      // Validate volume_of_sludge against application.size
      // User enters liters; containment_size from server is in m³ → multiply by 1000
      if (application?.containment_size) {
        if (application.containment_size.startsWith("{")) {
          // Handle multiple sizes
          const sizes = application.containment_size
            .replace(/[{}]/g, "")
            .split(",")
            .map(parseFloat);
          const totalSizeL = sizes.reduce((acc, size) => acc + size, 0) * 1000;

          if (parseFloat(values.volume_of_sludge) > totalSizeL) {
            errors.volume_of_sludge = `Volume of sludge cannot be more than ${totalSizeL} L.`;
          }
        } else {
          // Handle single size
          const limitL = parseFloat(application.containment_size) * 1000;
          if (parseFloat(values.volume_of_sludge) > limitL) {
            errors.volume_of_sludge = `Volume of sludge cannot be more than ${limitL} L.`;
          }
        }
      }
      // if (parseFloat(values.volume_of_sludge) > parseFloat(application?.size)) {
      //   errors.volume_of_sludge = `Volume of sludge cannot be more than ${application?.size}.`;
      // }
      if (!values.desludging_vehicle_id) {
        errors.desludging_vehicle_id =
          contentsLabel?.["The Desludging Vehicle Number Plate is required."] ||
          "The Desludging Vehicle Number Plate is required.";
      }
      if (!values.treatment_plant_id) {
        errors.treatment_plant_id =
          contentsLabel?.["The Disposal Place is required."] ||
          "The Disposal Place is required.";
      }
      if (!values.driver) {
        errors.driver =
          contentsLabel?.["The Driver Name is required."] ||
          "The Driver Name is required.";
      }
      if (!values.emptier1) {
        errors.emptier1 =
          contentsLabel?.["The emptier1 name is required."] ||
          "The emptier1 name is required.";
      }

      if (!values.start_time) {
        errors.start_time =
          contentsLabel?.["The Start Time is required."] ||
          "The Start Time is required.";
      }
      if (!values.end_time) {
        errors.end_time =
          contentsLabel?.["The End Time is required."] ||
          "The End Time is required.";
      }
      if (!values.no_of_trips) {
        errors.no_of_trips =
          contentsLabel?.["The number of trips is required."] ||
          "The number of trips is required.";
      }
      if (!values.total_cost) {
        errors.total_cost =
          contentsLabel?.["The Total Cost is required."] ||
          "The Total Cost is required.";
      }
      if (!values.building_id) {
        errors.building_id =
          contentsLabel?.["Please select a building from map."] ||
          "Please select a building from map.";
      }
      if (!values.containment_id) {
        errors.containment_id =
          contentsLabel?.["Please select a containment."] ||
          "Please select a containment.";
      }
      if (application?.image_status == "false" && !values.house_image) {
        errors.house_image =
          contentsLabel?.["The House Image must be an image file."] ||
          "The House Image must be an image file.";
      }
      if (!values.receipt_image) {
        errors.receipt_image =
          contentsLabel?.["The Receipt Image is required."] ||
          "The Receipt Image is required.";
      }
      // if (!!errors) {
      //   console.log("eRRORSSADSASDAS", errors.length);
      //   ToastAndroid.show("Fill all the required fields.", ToastAndroid.SHORT);
      // }
      // // Add similar checks for other fields as needed
      return errors;
    },
    onSubmit: async (values, { setErrors, setSubmitting }) => {
      const token = await AsyncStorage.getItem("token");
      console.log("Valuess---!!!", values);
      let formdata = new FormData();

      formdata.append("volume_of_sludge", parseFloat(values.volume_of_sludge) / 1000);
      // formdata.append('volume_of_sludge', 4);

      formdata.append("desludging_vehicle_id", values.desludging_vehicle_id);
      // formdata.append('desludging_vehicle_id', 1);

      formdata.append("treatment_plant_id", values.treatment_plant_id);
      // formdata.append('treatment_plant_id', 2);

      formdata.append("driver", values.driver);
      // formdata.append('driver', 1);

      formdata.append("emptier1", values.emptier1);
      // formdata.append('emptier1', 2);

      formdata.append("emptier2", values.emptier2);
      // formdata.append('emptier2', 2);

      formdata.append("start_time", dayjs(values.start_time).format("HH:mm"));
      formdata.append("end_time", dayjs(values.end_time).format("HH:mm"));

      formdata.append("no_of_trips", values.no_of_trips);
      // formdata.append('no_of_trips', 1);

      formdata.append("total_cost", values.total_cost);
      // formdata.append('total_cost', 55);

      formdata.append("application_id", values.application_id);
      formdata.append("building_id", values.building_id);
      formdata.append("containment_id", values.containment_id);
      // formdata.append('application_id', 2);

      formdata.append("emptying_reason", values.emptying_reason);
      formdata.append(
        "service_receiver_contact",
        Number(values.service_receiver_contact) // Convert to number
      );
      formdata.append(
        "service_receiver_gender",
        values.service_receiver_gender
      );
      formdata.append("service_receiver_name", values.service_receiver_name);
      formdata.append("receipt_number", values.receipt_number);
      formdata.append("comments", values.comments);
      formdata.append("date", dayjs(values.date).format("YYYY-MM-DD"));
      // formdata.append("distance_closest_well", values.distance_closest_well);

      if (!!values.house_image && values.house_image !== defaultImage) {
        console.log("SSSSSSSSSSSSSS", values.house_image);
        formdata.append("house_image", {
          uri: values.house_image?.uri,
          name: values.house_image?.fileName ?? "house_img.jpg",
          type: values.house_image?.type ?? "image/jpeg",
        });
      }

      if (!!values.receipt_image && values.receipt_image !== defaultImage) {
        console.log("SSSSSSSSSSSSsssSS", values.receipt_image);
        formdata.append("receipt_image", {
          uri: values.receipt_image?.uri,
          name: values.receipt_image?.fileName ?? "receipt_img.jpg",
          type: values.receipt_image?.type ?? "image/jpeg",
        });
      }

      console.log("FormData!!!!", formdata);
      const postUrl = `${BASE_URL_ENV}/api/${URLS.saveEmptyingService}`;

      try {
        const res = await axios.post(postUrl, formdata, {
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
        if (res?.status === 200) {
          const message = res?.data?.message;
          Alert.alert(getLabel("Success"), message, [
            {
              text: getLabel("OK"),
            },
          ]);
          navigation.goBack();
        }
      } catch (error) {
        const message = error?.response?.data?.message;
        const errors = error?.response?.data?.errors;
        console.log("Error!!!!", error?.response?.data);

        if (message) {
          setSubmitting(false);

          // Map over errors if they exist
          if (errors) {
            setSubmitting(false);
            setErrors(errors);
            const errorMessages = Object.values(errors) // Extract error messages
              .flat() // Flatten the array to handle multiple messages per key
              .join("\n"); // Separate each message with a new line

            Alert.alert(getLabel("Error"), `${errorMessages}`, [
              {
                text: getLabel("OK"),
              },
            ]); // Combine main message and error details
          } else {
            Alert.alert(getLabel("Error"), message, [
              {
                text: getLabel("OK"),
              },
            ]); // Show main message only if no specific errors
          }
        }
      }
      // } catch (error) {
      //   const message = error?.response?.data?.message;
      //   const errors = error?.response?.data?.errors;
      //   console.log("Error!!!!", error?.response?.data);

      //   if (message) {
      //     setSubmitting(false);
      //     Alert.alert("Error", message);
      //   }
      //   if (errors) {
      //     setSubmitting(false);
      //     setErrors(errors);
      //   }
      // }
    },
  });

  const fetchUserLocation = () => {
    askLocationPermission(async () => {
      try {
        const position = await getCurrentLocation();

        formik.setFieldValue("latitude", position.coords.latitude);
        formik.setFieldValue("longitude", position.coords.longitude);
      } catch (err) {
        Alert.alert(
          getLabel("Error"),
          getLabel("Please allow access to location in order to proceed."),
          [
            {
              text: getLabel("OK"),
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    });
  };

  return {
    formik,
    drivers,
    emptiers,
    treatmentPlants,
    vacutugs,
    vehicles,
    containments,
    fetchVacugtugs,
    fetchTreatmentPlants,
    getEmptiers,
    fetchDrivers,
    fetchVehicles,
    fetchUserLocation,
    fetchContainments,
  };
};

export default useEmptying;
