import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getValue } from "../helpers/localstorage";
import { BASE_URL_ENV } from "../constants/config";
import * as AxiosLogger from "axios-logger";
import { Alert } from "react-native";
import store from "../store";

import { useNavigation } from "@react-navigation/native";
import { navigationRef } from "../utils/navigation";
import { ROUTES } from "../core/constants/routes";
import { resetToken } from "../store/slices/auth.slice";
let headers = { "Content-Type": "application/json" };

function shouldLogAxios(configOrResponse) {
  const url =
    configOrResponse?.url || configOrResponse?.config?.url || "";
  return !url.includes("form-metadata");
}

const client = axios.create({
  baseURL: `${BASE_URL_ENV}/api/`,
  headers,
});

client.interceptors.request.use(
  async (config) => {
    try {
      const token = await getValue("token");
      config.headers.Accept = `application/json`;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (shouldLogAxios(config)) {
        AxiosLogger.requestLogger(config);
      }
      config.timeout = 13000;
      return config;
    } catch (error) {
      console.log("axios token exception", error);
      return Promise.reject(error);
    }
  },
  (error) => error
);

client.interceptors.response.use(
  (response) =>
    new Promise((resolve, reject) => {
      if (shouldLogAxios(response)) {
        AxiosLogger.responseLogger(response);
      }
      resolve(response);
    }),

  (error) => {
    console.log("Error!!!!!!!!!!INTOPLEVEL", error?.response?.data);
    if (
      error?.response?.status === 401 &&
      (error?.response?.data?.message == "Unauthenticated." ||
        error?.response?.data?.error ==
          "Unauthenticated. Invalid or missing token.")
    ) {
      console.log("Token Expired!!");
      Alert.alert("Session expired", "Session expired, please log in again");
      logout();
    }
    return Promise.reject(error);
  }
);
const logout = async () => {
  store.dispatch(resetToken());
};
export default client;
