import React from 'react'
import AgentDashboard from "../crm-dashboard/crm-agent-dashboard/crm-agent-dashboard"
import CoordinatorDashboard from "../crm-dashboard/crm-coordinator-dashboard/crm-coordinator-dashboard"
import FocalPersonDashboard from "./crm-focal-person-dashboard/crm-focal-person-dashboard"
import HeadsDashboard from "./crm-heads-dashboard/crm-heads-dashboard"

export default function CRMDashboard() {
  const role = localStorage.getItem("role");
  
  if (!role) {
    return <div>No role assigned. Please log in.</div>; // Kama role haipo kabisa
  }
   return (
     <>
       {(role === "agent") && (<AgentDashboard /> )}
       {role === "coordinator" && <CoordinatorDashboard />}
       {role === "attendee" && <AgentDashboard />}
       {role === "focal-person" && <FocalPersonDashboard />}
       {role === "claim-focal-person" && <HeadsDashboard />}
       {role === "compliance-focal-person" && <HeadsDashboard />}
       {role === "head-of-unit" && <HeadsDashboard />}
       {role === "director-general" && <HeadsDashboard />}
     </>
   );
}
