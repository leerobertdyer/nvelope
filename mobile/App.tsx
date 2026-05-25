import { AuthProvider } from "./src/context/AuthContext/AuthProvider";
import BudgetProvider from "./src/context/BudgetContext/BudgetProvider";
import DatabaseProvider from "./src/context/DatabaseContext/DatabaseProvider";
import Home from "./src/screens/Home";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import "./global.css";

// 1. Create a wrapper component inside App.js (or in its own file)
function GlobalLayout() {
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
            {/* GlobalLayout consumes those measurements and forces the whole app into the safe zone */}
            <GlobalLayout />
          </SafeAreaProvider>
        </DatabaseProvider>
      </BudgetProvider>
    </AuthProvider>
  );
}