import React, { useEffect } from "react";
import "react-native-gesture-handler";
import { Provider as StoreProvider } from "react-redux";
import { Provider as PaperProvider } from "react-native-paper";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import store from "./src/store";
import theme from "./src/core/theme";

import AppNavigation from "./src/navigation";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SheetProvider } from "react-native-actions-sheet";
import BootSplash from "react-native-bootsplash";
import "./src/sheets/sheets";
const persistor = persistStore(store);
const App = () => {
  useEffect(() => {
    const init = async () => {
      // …do multiple sync or async tasks
    };

    init().finally(async () => {
      await BootSplash.hide({ fade: true });
      console.log("BootSplash has been hidden successfully");
    });
  }, []);
  return (
    <GestureHandlerRootView style={styles.container}>
      <StoreProvider store={store}>
        <PersistGate persistor={persistor} loading={null}>
          <PaperProvider theme={theme}>
            <SheetProvider>
              <AppNavigation />
            </SheetProvider>
          </PaperProvider>
        </PersistGate>
      </StoreProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
