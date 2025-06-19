import React from 'react'
import AgentDashboard from "../crm-dashboard/crm-agent-dashboard/crm-agent-dashboard"
import CoordinatorDashboard from "../crm-dashboard/crm-coordinator-dashboard/crm-coordinator-dashboard"
import FocalPersonDashboard from "./crm-focal-person-dashboard/crm-focal-person-dashboard"

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
       {role === "focal-person" && (<FocalPersonDashboard />)}
     </>
   );
}
