import React from 'react'
import AgentDashboard from "../crm-dashboard/crm-agent-dashboard/crm-agent-dashboard"
import ReviewerDashboard from "../crm-dashboard/crm-reviewer-dashboard/crm-reviewer-dashboard"
export default function CRMDashboard() {
  const role = localStorage.getItem("role");
  
  if (!role) {
    return <div>No role assigned. Please log in.</div>; // Kama role haipo kabisa
  }
   return (
     <>
       {role === "reviewer" && <ReviewerDashboard />}
       {(role === "agent") && (<AgentDashboard /> )}
       {role === "attendee" && <AgentDashboard />}
       {role === "focal-person" && <AgentDashboard />}
       {role === "claim-focal-person" && <AgentDashboard />}
       {role === "compliance-focal-person" && <AgentDashboard />}
       {role === "head-of-unit" && <AgentDashboard />}
       {role === "director" && <AgentDashboard />}
       {role === "director-general" && <AgentDashboard />}
       {role === "manager" && <AgentDashboard />}
       {role === "supervisor" && <AgentDashboard />}
       {role === "super-admin" && <AgentDashboard />}
       {/* {role === "super-admin" && <HeadsDashboard />} */}
     </>
   );
}
