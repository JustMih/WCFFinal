import React from 'react'
import AgentsDashboard from '../crm-dashboard/agent-dashboard/agent-dashboard';

export default function CRMDashboard() {
  const role = localStorage.getItem("role");
   return (
     <>
       {/* {(role === "super-admin" || role === "admin") && (
         <AdminAndSuperAdminDashboard />
       )} */}
       {role === "agent" && <AgentsDashboard />}
       {/* {role === "supervisor" && (<SupervisorDashboard />)} */}
     </>
   );
}
