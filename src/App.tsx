import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./Views/Home";
import Header from "./components/Header";
import { useAuth } from "./Context/AuthContext/useAuth";

function App() {
  const {user} = useAuth();

  return (
    <Router>
      {user && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
