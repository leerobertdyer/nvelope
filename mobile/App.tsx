import { AuthProvider } from "./src/context/AuthContext/AuthProvider";
import BudgetProvider from "./src/context/BudgetContext/BudgetProvider";
import DatabaseProvider from "./src/context/DatabaseContext/DatabaseProvider";
import Home from "./src/screens/Home";
import "./global.css";

export default function App() {
  return (
    <AuthProvider>
      <BudgetProvider>
        <DatabaseProvider>
          <Home />
        </DatabaseProvider>
      </BudgetProvider>
    </AuthProvider>
  );
}
