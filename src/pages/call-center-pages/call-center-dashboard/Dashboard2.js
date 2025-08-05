import React from 'react'
import AgentsDashboard from './agents-dashboard/AgentsDashboard2';
import AdminAndSuperAdminDashboard from './admin-and-super-admin-dashboard/Admin&SuperAdminDashboard';
import SupervisorDashboard from './supervisor-dashboard/SupervisorDashboard2';

export default function Dashboard2() {
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
