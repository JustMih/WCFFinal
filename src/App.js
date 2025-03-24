import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./auth/login-page/Login";
import Dashboard from "./pages/dashboard-page/Dashboard";
import "./App.css";

function App() {
  const role = localStorage.getItem("role");
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Login />} />
      </Routes>
      {role ? <Dashboard /> : ""}
    </div>
  );
}

function MainApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default MainApp;
