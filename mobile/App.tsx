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
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Settings from "./src/screens/Settings";
import "./global.css";
import Toast, { BaseToast, BaseToastProps } from "react-native-toast-message";

const toastConfig = {
  success: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#FFFFFF", backgroundColor: "#076346" }}
      contentContainerStyle={{ paddingHorizontal: 15,}}
      text1Style={{ fontSize: 15, fontWeight: "600", color: "#fcca68", fontFamily: "myFont" }}
      text2Style={{ fontSize: 13 }}
    />
  ),
  error: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#fff2d9", backgroundColor: "#ad0241" }}
      text1Style={{ fontSize: 15, color: "#fcca68", fontFamily: "myFont" }}
    />
  ),
};

SplashScreen.preventAutoHideAsync(); // for fonts

const Stack = createNativeStackNavigator();

function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Settings" component={Settings} />
    </Stack.Navigator>
  );
}

function GlobalLayout() {
  const [loaded, error] = useFonts({
    myFont: require("./src/assets/fonts/posten.ttf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);
  const insets = useSafeAreaInsets();

  if (!loaded && !error) return null;

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
      <NavigationContainer>
        <RootStack />
      </NavigationContainer>
      <Toast config={toastConfig} />
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
