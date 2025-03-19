import React, { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "../../components/nav-bar/Navbar";
import CallCenterSidebar from "../../components/side-bar/side-bar-call-center/CallCenterSidebar";
import CRMSidebar from "../../components/side-bar/side-bar-crm/CRMSidebar";
import CallCenterDashboard from "../call-center-pages/call-center-dashboard/callCenterDashboard";
import CRMDashboard from "../crm-pages/crm-dashboard/CRMDashboard";
import CallCenterUsers from "../call-center-pages/call-center-users/CallCenterUsers";
import CallCenterAgents from "../call-center-pages/call-center-agents/CallCenterAgents";
import CallCenterExtensions from "../call-center-pages/call-center-extensions/CallCenterExtensions";
import PrivateRoute from "../../auth/private-routes/PrivateRoutes";
import "../../themes/themes.css";
import "./dashboard.css";

export default function Dashboard() {
  const [isDarkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeSystem, setActiveSystem] = useState("");

  const role = localStorage.getItem("role");

  useEffect(() => {
    const storedSystem = localStorage.getItem("activeSystem");
    if (storedSystem) {
      setActiveSystem(storedSystem);
    } else {
      if (role === "admin" || role === "super-admin" || role === "agent") {
        setActiveSystem("call-center");
      } else if (role === "attendee") {
        setActiveSystem("crm");
      }
    }
  }, [role]);

  const toggleTheme = () => {
    setDarkMode(!isDarkMode);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const currentTheme = isDarkMode ? "dark-mode" : "light-mode";

  return (
    <div className={`dashboard ${currentTheme}`}>
      <Navbar
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        role={role}
        setActiveSystem={setActiveSystem}
        activeSystem={activeSystem}
      />
      <div className="layout">
        {activeSystem === "call-center" && (
          <CallCenterSidebar isSidebarOpen={isSidebarOpen} role={role} />
        )}
        {activeSystem === "crm" && <CRMSidebar isSidebarOpen={isSidebarOpen} />}
        <div className="main-content">
          <Routes>
            {activeSystem === "call-center" && (
              <>
                <Route
                  path="*"
                  element={<PrivateRoute element={<CallCenterDashboard />} />}
                />
                <Route
                  path="/agents"
                  element={<PrivateRoute element={<CallCenterAgents />} />}
                />
                <Route
                  path="/extension"
                  element={<PrivateRoute element={<CallCenterExtensions />} />}
                />
                <Route
                  path="/users"
                  element={<PrivateRoute element={<CallCenterUsers />} />}
                />
              </>
            )}

            {activeSystem === "crm" && (
              <>
                <Route
                  path="*"
                  element={<PrivateRoute element={<CRMDashboard />} />}
                />
              </>
            )}
          </Routes>
        </div>
      </div>
    </div>
  );
}
