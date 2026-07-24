import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Home from "./Pages/Home";
import Settings from "./Pages/Settings";
import { useAuth } from "./Context/AuthContext/useAuth";
import { useDisableNumberScroll } from "./hooks";
import Debt from "./Pages/Debt";
import Bills from "./Pages/Bills";
import Feedback from "./Pages/Feedback";
import InviteLandingPage from "./Pages/Invite";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoadingUser } = useAuth();

  if (!user && !isLoadingUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  useDisableNumberScroll();
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
        <Route
          path="/bills"
          element={
            <ProtectedRoute>
              <Bills />
            </ProtectedRoute>
          }
        />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/i/:token" element={<InviteLandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
