import React, { useState, useEffect } from "react";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/nav-bar/Navbar";
import CallCenterSidebar from "../../components/side-bar/side-bar-call-center/CallCenterSidebar";
import CRMSidebar from "../../components/side-bar/side-bar-crm/CRMSidebar";
import CallCenterDashboard from "../call-center-pages/call-center-dashboard/callCenterDashboard";
import Dashboard2 from "../call-center-pages/call-center-dashboard/Dashboard2";
import RTDashboard from "../call-center-pages/call-center-dashboard/RTDashboard";
import CRMDashboard from "../crm-pages/crm-dashboard/CRMDashboard";
import CRMNotificationTickets from "../crm-pages/crm-notifications/notifications";
import CRMAssignedTickets from "../crm-pages/crm-tickets-status/assigned";
import CRMOpenedTickets from "../crm-pages/crm-tickets-status/ticket";
import CRMInProgressTickets from "../crm-pages/crm-tickets-status/inprogress";
import CRMOverdueTickets from "../crm-pages/crm-tickets-status/overdue";
import CRMClosedTickets from "../crm-pages/crm-tickets-status/closed";
import CRMTotalTickets from "../crm-pages/crm-tickets-status/total";
import CRMReviewerTickets from "../crm-pages/crm-reviewer-tickets/crm-reviewer-tickets";
import CRMChat from "../crm-pages/crm-chat/CRMChat";
import WorkflowDashboard from "../../components/workflow/WorkflowDashboard";
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
import RecordedSounds from "../call-center-pages/cal-center-ivr/RecordedSounds";
import HolidayManager from "../call-center-pages/cal-center-ivr/HolidayManager";
import EmegencyManager from "../call-center-pages/cal-center-ivr/EmergencyManager";
import VoiceNotesReport from "../call-center-pages/cal-center-ivr/VoiceNotesReport";
import CDRReports from "../call-center-pages/cal-center-ivr/CDRReports";
import IVRInteractions from "../call-center-pages/cal-center-ivr/IVRInteractions";
import Livestream from "../call-center-pages/cal-center-ivr/Livestream";
import RecordedAudio from "../call-center-pages/cal-center-ivr/RecordedAudio";
import Message from "../call-center-pages/call-center-social-message/CallCenterSocialMessage";
import IvrCardsPage from "../call-center-pages/cal-center-ivr/IvrCardsPage";
import DTMFStats from "../call-center-pages/cal-center-ivr/DTMFStats";
import VoiceNoteReport from "../call-center-pages/call-center-report/voice-note-report";
import ComprehensiveReports from "../call-center-pages/call-center-report/ComprehensiveReports";
import InstagramPage from "../instagram/InstagramPage";
import LookupTablesManagement from "../super-admin/LookupTablesManagement";
import MappingManagement from "../super-admin/MappingManagement";
import PublicDashboard from "../public-dashboard/PublicDashboard";

export default function Dashboard() {
  const [isDarkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeSystem, setActiveSystem] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const role = localStorage.getItem("role");

  useEffect(() => {
    const storedSystem = localStorage.getItem("activeSystem");
    if (storedSystem) {
      setActiveSystem(storedSystem);
    } else {
      if (
        role === "admin" ||
        role === "super-admin" ||
        role === "agent" ||
        role === "supervisor"
      ) {
        setActiveSystem("call-center");
      } else if (
        role === "attendee" ||
        role === "reviewer" ||
        role === "head-of-unit" ||
        role === "manager" ||
        // role === "supervisor" ||
        role === "director-general" ||
        role === "director" ||
        // role === "admin" ||
        role === "super-admin" ||
        role === "focal-person" ||
        role === "claim-focal-person" ||
        role === "compliance-focal-person"
      ) {
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
        {/* where side bar seen according to role */}
        {activeSystem === "crm" && (
          <CRMSidebar isSidebarOpen={isSidebarOpen} role={role} />
        )}
        <div className="main-content">
          <Routes>
            {activeSystem === "call-center" && (
              <>
                <Route
                  path="/dashboard"
                  element={<PrivateRoute element={<CallCenterDashboard />} />}
                />
                <Route
                  path="/public-dashboard"
                  element={<PrivateRoute element={<PublicDashboard />} />}
                />
                <Route
                  path="/dashboard2"
                  element={<PrivateRoute element={<Dashboard2 />} />}
                />
                <Route
                  path="/rtdashboard"
                  element={<PrivateRoute element={<RTDashboard />} />}
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
                  element={
                    <PrivateRoute element={<CallCenterIvrDTMFMapping />} />
                  }
                />
                <Route path="/recorded-sounds" element={<RecordedSounds />} />
                <Route
                  path="/ivr-dtmf-mappings"
                  element={
                    <PrivateRoute element={<CallCenterIvrDTMFMapping />} />
                  }
                />
                <Route
                  path="/voice-notes-report"
                  element={<ComprehensiveReports />}
                />
                <Route
                  path="/voice-note-report"
                  element={<ComprehensiveReports />}
                />
                <Route
                  path="/recorded-sounds"
                  element={<PrivateRoute element={<RecordedSounds />} />}
                />

                <Route path="/ivr-holidays" element={<HolidayManager />} />
                <Route path="/ivr-emegency" element={<EmegencyManager />} />

                <Route path="/voice-notes" element={<VoiceNotesReport />} />
                <Route path="/cdr-reports" element={<VoiceNoteReport />} />
                <Route path="/ivr-interactions" element={<IVRInteractions />} />
                <Route path="/livestream" element={<Livestream />} />
                <Route path="/recorded-audio" element={<RecordedAudio />} />
                <Route path="/dtmf-stats" element={<DTMFStats />} />
                <Route path="/ivr-cards" element={<IvrCardsPage />} />
                <Route
                  path="/social-message"
                  element={<PrivateRoute element={<Message />} />}
                />
                <Route
                  path="/instagram"
                  element={<PrivateRoute element={<InstagramPage />} />}
                />
                {/* Lookup Tables Management - Super Admin Only */}
                {(role === "admin" || role === "super-admin") && (
                  <Route
                    path="/lookup-tables"
                    element={
                      <PrivateRoute element={<LookupTablesManagement />} />
                    }
                  />
                )}
                {/* Mapping Management - Super Admin Only */}
                {role === "super-admin" && (
                  <Route
                    path="/mapping"
                    element={
                      <PrivateRoute element={<MappingManagement />} />
                    }
                  />
                )}
              </>
            )}

            {activeSystem === "crm" && (
              <>
                <Route
                  path="/dashboard"
                  element={<PrivateRoute element={<CRMDashboard />} />}
                />
                <Route
                  path="/notifications"
                  element={
                    <PrivateRoute element={<CRMNotificationTickets />} />
                  }
                />
                <Route
                  path="/ticket/opened"
                  element={<PrivateRoute element={<CRMOpenedTickets />} />}
                />
                <Route
                  path="/ticket/assigned"
                  element={<PrivateRoute element={<CRMAssignedTickets />} />}
                />
                <Route
                  path="/ticket/in-progress"
                  element={<PrivateRoute element={<CRMInProgressTickets />} />}
                />
                <Route
                  path="/ticket/closed"
                  element={<PrivateRoute element={<CRMClosedTickets />} />}
                />
                <Route
                  path="/ticket/escalated"
                  element={<PrivateRoute element={<CRMOverdueTickets />} />}
                />
                <Route
                  path="/ticket/all"
                  element={<PrivateRoute element={<CRMTotalTickets />} />}
                />
                <Route
                  path="/reviewer/:status"
                  element={<PrivateRoute element={<CRMReviewerTickets />} />}
                />
                <Route
                  path="/crm-chat"
                  element={<PrivateRoute element={<CRMChat />} />}
                />
                <Route
                  path="/workflow"
                  element={<PrivateRoute element={<WorkflowDashboard userRole={role} />} />}
                />
                <Route
                  path="/instagram"
                  element={<PrivateRoute element={<InstagramPage />} />}
                />
              </>
            )}
          </Routes>
        </div>
      </div>
    </div>
  );
}
