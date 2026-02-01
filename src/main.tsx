import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./Context/AuthContext/AuthProvider.tsx";
import BudgetProvider from "./Context/BudgetContext/BudgetProvider.tsx";
import DatabaseProvider from "./Context/DatabaseContext/DatabaseProvider.tsx";
import ToastProvider from "./Context/ToastContext/ToastProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BudgetProvider>
        <DatabaseProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </DatabaseProvider>
      </BudgetProvider>
    </AuthProvider>
  </StrictMode>
);
