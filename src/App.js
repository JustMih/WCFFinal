import React, { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import Navbar from "./components/navbar/navbar";
import Sidebar from "./components/sidebar/sidebar";
import Login from "./auth/login/login";
import Dashboard from "./pages/dashboard/dashboard";
import Users from "./pages/users/users";
import Did from "./pages/did/did";
import Extension from "./pages/extension/extension";
import Agents from "./pages/agents/agents";
import Crm from "./pages/crm/crm";
import Message from "./pages/Message/message";
import CallComponent from "./pages/test-call";
import PrivateRoute from "./auth/private-route/privateRoute"; // Import the PrivateRoute
import "./themes/themes.css";

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setDarkMode] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const toggleTheme = () => {
    setDarkMode(!isDarkMode);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    window.location.href = "/login"; // Redirect to login page
  };

  const currentTheme = isDarkMode ? "dark-mode" : "light-mode";

  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className={`app ${currentTheme}`}>
      {!isLoginPage && (
        <>
          <Navbar
            toggleSidebar={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
            toggleTheme={toggleTheme}
            isDarkMode={isDarkMode}
            handleLogout={handleLogout}
          />
          <div className="layout">
            <Sidebar isSidebarOpen={isSidebarOpen} />
            <div className="main-content">
              <Routes>
                <Route
                  path="/"
                  element={<PrivateRoute element={<Dashboard />} />}
                />
                <Route
                  path="/users"
                  element={<PrivateRoute element={<Users />} />}
                />
                <Route
                  path="/did"
                  element={<PrivateRoute element={<Did />} />}
                />
                <Route
                  path="/extension"
                  element={<PrivateRoute element={<Extension />} />}
                />
                <Route
                  path="/agents"
                  element={<PrivateRoute element={<Agents />} />}
                />
                <Route
                  path="/message"
                  element={<PrivateRoute element={<Message />} />}
                />
                <Route
                  path="/call"
                  element={<CallComponent />}
                />
                <Route
                  path="/crm"
                  element={<PrivateRoute element={<Crm />} />}
                />
              </Routes>
            </div>
          </div>
        </>
      )}

      {isLoginPage && (
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      )}
    </div>
  );
}

export default App;
