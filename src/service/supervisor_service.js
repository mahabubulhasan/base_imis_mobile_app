import client from "../axios";
import { URLS } from "../core/constants/urls";

export const emptyingService = async () => {
  return await client.get(URLS.emptyingService);
};
export const pendingApplications = async () => {
  return await client.get(URLS.peindingApplicatoins);
}
export const assessmentService = async () => {
  return await client.get(URLS.assessment);
};
export const driversAPI = async () => {
  return await client.get(URLS.drivers);
};
export const emptiersAPI = async () => {
  return await client.get(URLS.emptiers);
};
export const serviceProviderAPI = async () => {
  return await client.get(URLS.serviceProviders);
};
export const saveEmptyingServiceAPI = async (data) => {
  return await client.post(URLS.saveEmptyingService, data);
};

export const saveAssessmentServiceAPI = async (data) => {
  return await client.post(URLS.saveAssessment, data);
};

export const treatmentPlantsAPI = async () => {
  return await client.get(URLS.treatmentPlants);
};

export const vacutugTypesAPI = async () => {
  return await client.get(URLS.vacutugTypes);
};

export const containmentsAPI = async (bin) => {
  return await client.get(`${URLS.containments}/${bin}`);
};

//Language
export const getLanguagesList = async () => {
  return await client.get(URLS.getLanguages);
};
export const getContentsLabel = async (lang) => {
  return await client.get(`${URLS.getContentsLabel}/${lang}`);
};
