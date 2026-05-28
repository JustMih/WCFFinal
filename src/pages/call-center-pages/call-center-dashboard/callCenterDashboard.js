import React from 'react'
import AgentsDashboard from './agents-dashboard/AgentsDashboard';
import AdminAndSuperAdminDashboard from './admin-and-super-admin-dashboard/Admin&SuperAdminDashboard';
import SupervisorDashboard2 from './supervisor-dashboard/SupervisorDashboard2';
import DGdashboard from './dgDashboard/DGdashboard';

export default function callCenterDashboard() {
  const role = localStorage.getItem("role");
  return (
    <>
      {(role === "super-admin" || role === "admin") && (
        <AdminAndSuperAdminDashboard />
      )}
      {role === "agent" && <AgentsDashboard />}
      {role === "supervisor" && (<SupervisorDashboard2 />)}
      {role === "director-general" && (<DGdashboard />)}
    </>
  );
}
