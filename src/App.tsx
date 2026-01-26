import "./App.css";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Home from "./Pages/Home";
import Settings from "./Pages/Settings";
import { useAuth } from "./Context/AuthContext/useAuth";
import { useDisableNumberScroll } from "./hooks";
import Debt from "./Pages/Debt";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoadingUser } = useAuth();

  if (!user && !isLoadingUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  useDisableNumberScroll()
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/debt"
          element={
            <ProtectedRoute>
              <Debt />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
