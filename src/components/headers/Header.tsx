"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  Appbar,
  Menu,
  useTheme,
  type MD3Theme,
  Portal,
  Text,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  resetToken,
  setContentsLabel,
  setCurrentLang,
  setLanguages,
} from "../../store/slices/auth.slice";
import { logoutService } from "../../service/auth_service";
import {
  clearMapCache,
  resetBuildingCoords,
  toogleMapType,
} from "../../store/slices/map.slice";
import colors from "../../core/theme/colors";
import {
  getContentsLabel,
  getLanguagesList,
} from "../../service/supervisor_service";

// Import the check icon
import { List } from "react-native-paper";

interface IRegistrationHeaderProps {
  hideBackAction?: boolean;
  title?: string;
  showRemoveMarker?: boolean;
  showMapStyle?: boolean;
  type?: string;
}

export default function Header({
  hideBackAction = false,
  showRemoveMarker = false,
  showMapStyle = false,
  title,
  type = "",
}: IRegistrationHeaderProps) {
  console.log("type", type);
  const navigation = useNavigation();
  const { contentsLabel, currentLanguage, languages } = useSelector(
    (state) => state.auth
  );
  const getLabel = (key: string) => contentsLabel?.[key] || key;
  const route = useRoute();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  // const [languages, setLanguages] = useState([]);
  console.log("Languages", languages);
  const theme = useTheme();
  const dispatch = useDispatch();

  console.log("CurrentLanguage", currentLanguage);

  const onPressBackAction = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const hideMenu = () => setMenuVisible(false);
  const showMenu = () => setMenuVisible(true);

  const handleLogOut = () => {
    hideMenu();
    logoutService()
      .then((res) => console.log("log out", res.data))
      .catch((err) => console.log(err))
      .finally(() => {
        dispatch(clearMapCache());
        dispatch(resetToken());
      });
  };
  const handleToogleMapType = () => dispatch(toogleMapType());
  const handleResetBuildingCoords = () => {
    dispatch(resetBuildingCoords());
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      getLanguagesList()
        .then((response) => {
          console.log("Response", response?.data);

          if (response?.data?.languages) {
            dispatch(setLanguages(response?.data?.languages));
            console.log("Response!", response?.data);
          }
        })
        .catch((err) => {
          console.log("Error!!", err);
          return;
        });
    } catch (error) {
      console.error("Failed to fetch languages:", error);
    }
  };

  useEffect(() => {
    if (languages && languages.length > 0 && !currentLanguage) {
      const firstLangCode = languages[0];
      console.log("SettingCUrrentLNagas 222", firstLangCode);
      handleLanguageChange(firstLangCode);
    }
  }, [languages, currentLanguage]);

  const handleLanguageChange = async (langCode: string) => {
    try {
      if (langCode) {
        dispatch(setCurrentLang(langCode));
        getContentsLabel(langCode)
          .then((response) => {
            if (response.data && Object.keys(response.data).length > 0) {
              dispatch(setContentsLabel(response.data));
            } else {
              dispatch(setContentsLabel([]));
              console.error("No data in response:", response);
            }
          })
          .catch((err) => {
            dispatch(setContentsLabel([]));
            console.log("Error!!", err);

            return;
          });
      }

      // Call API to get content labels for selected language
      // const response = await getContentLabels(langCode)

      // // Update Redux state with new language and content
      // dispatch(setLanguage(langCode))
      // dispatch(setContentLabels(response.data))

      // Close the bottom sheet
      bottomSheetRef.current?.close();
    } catch (error) {
      console.error("Failed to fetch content labels:", error);
    }
  };

  const openLanguageSheet = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <>
      <Appbar.Header
        style={{
          backgroundColor: theme.colors.primary,
          borderBottomWidth: 0.5,
          borderColor: colors.lightGrey,
        }}
      >
        <StatusBar
          backgroundColor={theme.colors.primary}
          barStyle="light-content"
        />
        {!hideBackAction && (
          <Appbar.BackAction
            onPress={onPressBackAction}
            color={theme.colors.onPrimary}
          />
        )}

        <Appbar.Content
          title={title ? title : route?.name}
          style={{ marginLeft: hideBackAction ? 18 : 0 }}
          color={theme.colors.onPrimary}
        />
        {showRemoveMarker && (
          <Appbar.Action
            icon="layers-remove"
            onPress={handleResetBuildingCoords}
            color={theme.colors.onPrimary}
            style={{ opacity: 0.9 }}
          />
        )}
        {showMapStyle && (
          <Appbar.Action
            icon="map"
            onPress={handleToogleMapType}
            color={theme.colors.onPrimary}
            style={{ opacity: 0.9 }}
          />
        )}
        <TouchableOpacity
          style={styles(theme).languageButton}
          onPress={openLanguageSheet}
        >
          <Icon name="language" color={theme.colors.onPrimary} size={18} />
          <Text style={styles(theme).languageText}>
            {currentLanguage && currentLanguage.toUpperCase()}
          </Text>
        </TouchableOpacity>
        {type === "home" && (
          <>
            <Menu
              visible={menuVisible}
              onDismiss={hideMenu}
              anchor={
                <Appbar.Action
                  icon="dots-vertical"
                  onPress={showMenu}
                  color={theme.colors.onPrimary}
                  style={{ marginRight: -4 }}
                />
              }
            >
              <Menu.Item onPress={handleLogOut} title={getLabel("Log out")} />
            </Menu>
          </>
        )}
      </Appbar.Header>

      {/* Language Selection Bottom Sheet */}
      <Portal>
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={["50%"]}
          enablePanDownToClose={true}
          backgroundStyle={{ backgroundColor: theme.colors.background }}
          handleIndicatorStyle={{
            backgroundColor: theme.colors.onSurfaceVariant,
          }}
          backdropComponent={renderBackdrop}
        >
          <BottomSheetView style={{ paddingHorizontal: 16 }}>
            <Text style={styles(theme).bottomSheetTitle}>Select Language</Text>
          </BottomSheetView>
          <BottomSheetFlatList
            data={languages}
            keyExtractor={(item) => item}
            contentContainerStyle={styles(theme).bottomSheetContainer}
            renderItem={({ item: lang }) => {
              const isSelected =
                currentLanguage?.toLowerCase() === lang?.toLowerCase();
              return (
                <TouchableOpacity
                  style={[
                    styles(theme).languageItem,
                    isSelected && styles(theme).selectedLanguageItem,
                  ]}
                  onPress={() => handleLanguageChange(lang)}
                >
                  <View style={styles(theme).languageItemContent}>
                    <Text
                      style={[
                        styles(theme).languageItemText,
                        isSelected && styles(theme).selectedLanguageItemText,
                      ]}
                    >
                      {lang?.toUpperCase()}
                    </Text>

                    {isSelected && (
                      <List.Icon
                        icon="check"
                        color={theme.colors.primary}
                        style={styles(theme).checkIcon}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </BottomSheet>
      </Portal>
    </>
  );
}

const styles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      paddingTop: 12,
      backgroundColor: "red",
    },
    languageButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
    },
    languageText: {
      color: theme.colors.onPrimary,
      fontWeight: "bold",
    },
    bottomSheetContainer: {
      padding: 16,
    },
    bottomSheetTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 16,
      color: theme.colors.onBackground,
    },
    languageItem: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 8,
    },
    languageItemContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    selectedLanguageItem: {
      backgroundColor: theme.colors.primaryContainer,
    },
    languageItemText: {
      fontSize: 16,
      color: theme.colors.onBackground,
    },
    selectedLanguageItemText: {
      color: theme.colors.primary,
      fontWeight: "bold",
    },
    checkIcon: {
      margin: 0,
    },
  });
