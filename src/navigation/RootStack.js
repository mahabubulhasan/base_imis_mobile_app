import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ROUTES } from "../core/constants/routes";

import HomeScreen from "../screens/root/HomeScreen";
import AboutUsScreen from "../screens/root/AboutUsScreen";
import ContainmentMap from "../screens/root/ContainmentMapScreen";
import BuildingMapScreen from "../screens/root/BuildingMapScreen";
import EmptyingServiceScreen from "../screens/root/EmptyingServiceScreen";
import ContainmentAssessmentScreen from "../screens/root/ContainmentAssessmentScreen";
import ContainmentDataScreen from "../screens/root/ContainmentDataScreen";
import BuildingDataScreen from "../screens/root/BuildingDataScreen";
import ApplicationListScreen from "../screens/root/ApplicationListScreen";

import HomeHeaderRight from "../components/home/HomeHeaderRight";
import BuidingsMapHeaderRight from "../components/buildings_map/HeaderRight";
import ContainmentMapHeaderRight from "../components/containment_map/HeaderRight";
import LoadingSpinner from "../components/common/LoadingSpinner";
import KmlViewerMapScreen from "../screens/root/KmlViewerMapScreen";
import ContainmentViewerScreen from "../screens/root/ContainmentViewerScreen";
import ApplicantMapScreen from "../screens/root/ApplicantMapScreen";
import { COLORS } from "../core/theme";
import LandApplicantListScreen from "../screens/root/LandApplicantListScreen";
import LandOwnerDetailScreen from "../screens/root/LandOwnerDetailScreen";
import BuildingSurveyScreen from "../screens/root/BuildingSurveyScreen";
import EmptyingSubmissionScreen from "../screens/root/EmptyingSubmissionScreen";
import EmptyingBuildingPickerScreen from "../screens/root/EmptyingBuildingPickerScreen";
import SewageMapScreen from "../screens/root/SewageMapScreen";
import SewageDataScreen from "../screens/root/SewageDataScreen";
import BuildingMapDetials from "../screens/root/BuildingMapDetails";
import EmptyingSubmissionScreen2 from "../screens/root/EmptyingSubmissionScreen2";
import SludgeCollectionScreen from "../screens/root/SludgeCollectionScreen";
import BuildingEditScreen from "../screens/root/BuildingEditScreen";
import CreateBuildingAfterDrawScreen from "../screens/root/CreateBuildingAfterDrawScreen";

const { Screen, Navigator } = createNativeStackNavigator();

const RootStack = ({ navigation }) => {
  const [visible, setVisible] = useState(false);

  const loadSpinner = () => {
    setVisible(true);
  };

  useEffect(() => {
    return () => {
      setVisible(false);
    };
  }, []);

  return (
    <>
      <LoadingSpinner isVisible={visible} title="Logging out" />
      <Navigator
        screenOptions={{
          headerTintColor: COLORS.light,
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
        }}
      >
        <Screen
          options={{
            headerShown: false,
          }}
          // options={{
          //   title: 'Home',

          //   headerRight: () => (
          //     <HomeHeaderRight onVisible={() => loadSpinner()} />
          //   ),
          // }}
          name={ROUTES.home}
          component={HomeScreen}
        />
        <Screen
          options={{
            headerShown: false,
            // title: 'About us',
          }}
          name={ROUTES.about_us}
          component={AboutUsScreen}
        />

        {/********* map & info collection *********/}
        <Screen
          options={{
            headerShown: false,
          }}
          // options={{
          //   title: 'Building Map',
          //   headerRight: BuidingsMapHeaderRight,
          // }}
          name={ROUTES.building_map}
          component={BuildingMapScreen}
        />
        <Screen
          options={{
            title: "Building Map Information",
            headerShown: false,
            // headerRight: BuidingsMapHeaderRight,
          }}
          name={ROUTES.building_map_details}
          component={BuildingMapDetials}
        />
        <Screen
          options={{
            title: "Edit Building",
            headerShown: false,
          }}
          name={ROUTES.building_edit}
          component={BuildingEditScreen}
        />
        <Screen
          options={{
            title: "Create Building",
            headerShown: false,
          }}
          name={ROUTES.create_building_after_draw}
          component={CreateBuildingAfterDrawScreen}
        />
        <Screen
          options={{
            title: "Containment Map",
            headerRight: ContainmentMapHeaderRight,
          }}
          name={ROUTES.containment_map}
          component={ContainmentMap}
        />
        <Screen
          options={{
            title: "Building Data",
            headerShown: false,
          }}
          name={ROUTES.building_data}
          component={BuildingDataScreen}
        />
        <Screen
          options={{
            title: "Containments Data",
            headerShown: false,
          }}
          name={ROUTES.containment_data}
          component={ContainmentDataScreen}
        />
        <Screen
          options={{
            title: "Building location",
            headerShown: false,
            // headerRight: ContainmentMapHeaderRight,
          }}
          name={ROUTES.kml_viewer}
          component={KmlViewerMapScreen}
        />
        <Screen
          options={{
            title: "Containment location",
            headerShown: "false",
            //headerRight: BuidingsMapHeaderRight,
          }}
          name={ROUTES.containment_viewer}
          component={ContainmentViewerScreen}
        />

        <Screen
          options={{
            title: "Applicant location",
            headerShown: false,
            //headerRight: BuidingsMapHeaderRight,
          }}
          name={ROUTES.applicant_viewer}
          component={ApplicantMapScreen}
        />

        {/********* end of map & info collection *********/}

        {/********* form survey/assessment *********/}
        <Screen
          options={{
            title: "Containment Assessment",
            headerShown: false,
          }}
          name={ROUTES.containment_assessment}
          component={ContainmentAssessmentScreen}
        />
        {/* <Screen
          options={{
            title: 'Emptying Service',
            headerShown: false,
          }}
          name={ROUTES.emptying_service}
          component={EmptyingServiceScreen}
        /> */}
        {/********* end of form survey/assessment *********/}

        {/********* emptying service *********/}
        <Screen
          options={{
            title: "Application List",
            headerShown: false,
          }}
          name={ROUTES.application_list}
          component={ApplicationListScreen}
        />
        {/********* end of emptying service *********/}

        {/********* land service *********/}
        <Screen
          options={{
            title: "Land",
            headerShown: false,
          }}
          name={ROUTES.land_service}
          component={LandApplicantListScreen}
        />

        <Screen
          options={{
            title: "Detail",
            headerShown: false,
          }}
          name={ROUTES.land_detail}
          component={LandOwnerDetailScreen}
        />
        <Screen
          options={{
            title: "Building survey form",
            headerShown: false,
          }}
          name={ROUTES.building_survey}
          component={BuildingSurveyScreen}
        />
        {/* <Screen
          options={({route}) => ({
            title: `Emptying service #${route?.params?.item?.id}`,
          })}
          name={ROUTES.empty_submission}
          component={EmptyingSubmissionScreen}
        /> */}
        <Screen
          options={({ route }) => ({
            title: `Emptying service #${route?.params?.item?.id}`,
            headerShown: false,
          })}
          name={ROUTES.empty_submission}
          component={EmptyingSubmissionScreen}
        />
        <Screen
          options={({ route }) => ({
            title: `Sludge Collection #${route?.params?.item?.id}`,
            headerShown: false,
          })}
          name={ROUTES.sludge_collection}
          component={SludgeCollectionScreen}
        />
        <Screen
          options={{
            title: "Select Building",
            headerShown: false,
          }}
          name={ROUTES.emptying_building_picker}
          component={EmptyingBuildingPickerScreen}
        />
        <Screen
          options={({ route }) => ({
            title: "Sewer Map",
            headerShown: false,
            // headerRight: BuidingsMapHeaderRight,
          })}
          name={ROUTES.sewage_map}
          component={SewageMapScreen}
        />
        <Screen
          options={({ route }) => ({
            title: "Sewer Data",
            headerShown: false,
          })}
          name={ROUTES.sewage_data}
          component={SewageDataScreen}
        />
        {/********* end of land service *********/}
      </Navigator>
    </>
  );
};

export default RootStack;
