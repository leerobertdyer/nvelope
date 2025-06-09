import "./App.css";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Home from "./Views/Home";
import Settings from "./Views/Settings";
import { useAuth } from "./Context/AuthContext/useAuth";
import MainEnvelopesView from "./Views/MainEnvelopesView";
import Bills from "./Views/Bills";

// Protected route component that redirects to home if no user
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function App() {
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
          path="/nvelopes" 
          element={
            <ProtectedRoute>
              <MainEnvelopesView />
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
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
