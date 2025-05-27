import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./Context/AuthContext/AuthProvider.tsx";
import DatabaseProvider from "./Context/DatabaseContext/DatabaseProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <DatabaseProvider>
        <App />
      </DatabaseProvider>
    </AuthProvider>
  </StrictMode>
);
