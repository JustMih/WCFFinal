import React from 'react'
import AgentsDashboard from './agents-dashboard/AgentsDashboard';
import AdminAndSuperAdminDashboard from './admin-and-super-admin-dashboard/Admin&SuperAdminDashboard';
import SupervisorDashboard from './supervisor-dashboard/SupervisorDashboard';

export default function callCenterDashboard() {
  const role = localStorage.getItem("role");
  return (
    <>
      {(role === "super-admin" || role === "admin") && (
        <AdminAndSuperAdminDashboard />
      )}
      {role === "agent" && <AgentsDashboard />}
      {role === "supervisor" && (<SupervisorDashboard />)}
    </>
  );
}
