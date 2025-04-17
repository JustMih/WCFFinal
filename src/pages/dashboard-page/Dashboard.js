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
import CallCenterAgentsLogs from "../call-center-pages/call-center-agents-logs/CallCenterAgentsLogs";
import CallCenterSupervisorChat from "../call-center-pages/call-center-supervisor-chat/CallCenterSupervisorChat";
import CallCenterAgentChat from "../call-center-pages/call-center-agents-chat/CallCenterAgentsChat";
import PrivateRoute from "../../auth/private-routes/PrivateRoutes";
import "../../themes/themes.css";
import "./dashboard.css";
import CallCenterIvr from "../call-center-pages/cal-center-ivr/CallCenterIvr";
import CallCenterIvrActions from "../call-center-pages/call-center-ivr-actions/CallCenterIvrActions";
import CallCenterWCFIvr from "../call-center-pages/call-center-wcf-ivrs/CallCenterWCFIvr";
import CallCenterIvrDTMFMapping from "../call-center-pages/cal-center-ivr/CallCenterIvrActions";





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
      if (role === "admin" || role === "super-admin" || role === "agent" || role === "supervisor") {
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
                  path="/dashboard"
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
                <Route
                  path="/agents-logs"
                  element={<PrivateRoute element={<CallCenterAgentsLogs />} />}
                />
                <Route
                  path="/supervisor-chat"
                  element={
                    <PrivateRoute element={<CallCenterSupervisorChat />} />
                  }
                />
                <Route
                  path="/ivr"
                  element={<PrivateRoute element={<CallCenterWCFIvr />} />}
                />
                <Route
                  path="/ivr-voices"
                  element={<PrivateRoute element={<CallCenterIvr />} />}
                />
                <Route
                  path="/ivr-action"
                  element={<PrivateRoute element={<CallCenterIvrActions />} />}
                />
                <Route
                  path="/agent-chat"
                  element={<PrivateRoute element={<CallCenterAgentChat />} />}
                />
              <Route
                path="/ivr-dtmf-mappings"
                element={<PrivateRoute element={<CallCenterIvrDTMFMapping />} />}
              />


              </>
            )}


            {activeSystem === "crm" && (
              <>
                <Route
                  path="/dashboard"
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
