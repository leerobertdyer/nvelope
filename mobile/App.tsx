import { AuthProvider } from "./src/context/AuthContext/AuthProvider";
import Home from "./src/screens/Home";

export default function App() {
  return (
    <AuthProvider>
      <Home />
    </AuthProvider>
  );
}
