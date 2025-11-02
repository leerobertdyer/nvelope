import "./App.css";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Home from "./Pages/Home";
import Settings from "./Pages/Settings";
import { useAuth } from "./Context/AuthContext/useAuth";
import Payments from "./Pages/OldPayments";

// Protected route component that redirects to home if no user
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoadingUser} = useAuth();
  
  if (!user && !isLoadingUser) {
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
          path="/payments" 
          element={
            <ProtectedRoute>
              <Payments />
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
