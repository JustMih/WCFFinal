import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Login from "./auth/login-page/Login";
import Dashboard from "./pages/dashboard-page/Dashboard";
import "./App.css";

function App() {

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
      <Dashboard />
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
