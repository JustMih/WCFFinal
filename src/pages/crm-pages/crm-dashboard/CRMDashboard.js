import React from 'react'
import AgentDashboard from "../crm-dashboard/crm-agent-dashboard/crm-agent-dashboard"
import ReviewerDashboard from "../crm-dashboard/crm-reviewer-dashboard/crm-reviewer-dashboard"
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
       {role === "reviewer" && <ReviewerDashboard />}
       {role === "attendee" && <AgentDashboard />}
       {role === "focal-person" && <FocalPersonDashboard />}
       {role === "claim-focal-person" && <HeadsDashboard />}
       {role === "compliance-focal-person" && <HeadsDashboard />}
       {role === "head-of-unit" && <HeadsDashboard />}
       {role === "director-general" && <HeadsDashboard />}
       {role === "manager" && <HeadsDashboard />}
       {role === "supervisor" && <HeadsDashboard />}
       {role === "super-admin" && <HeadsDashboard />}
     </>
   );
}
