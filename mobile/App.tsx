import { AuthProvider } from "./src/context/AuthContext/AuthProvider";
import BudgetProvider from "./src/context/BudgetContext/BudgetProvider";
import DatabaseProvider from "./src/context/DatabaseContext/DatabaseProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Home from "./src/screens/Home";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "./global.css";

SplashScreen.preventAutoHideAsync(); // for fonts

// 1. Create a wrapper component inside App.js (or in its own file)
function GlobalLayout() {
  const [loaded, error] = useFonts({
    myFont: require("./src/assets/fonts/posten.ttf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      className="flex-1 bg-my-white-dark"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <Home />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BudgetProvider>
        <DatabaseProvider>
          {/* SafeAreaProvider stays at the root to calculate the measurements */}
          <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              {/* GlobalLayout consumes those measurements and forces the whole app into the safe zone */}
              <GlobalLayout />
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </DatabaseProvider>
      </BudgetProvider>
    </AuthProvider>
  );
}
