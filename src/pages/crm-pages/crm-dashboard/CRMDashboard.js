import React from 'react'
import AgentDashboard from "../crm-dashboard/crm-agent-dashboard/crm-agent-dashboard"
import ReviewerDashboard from "../crm-dashboard/crm-reviewer-dashboard/crm-reviewer-dashboard"
import DGdashboard from "../../call-center-pages/call-center-dashboard/dgDashboard/DGdashboard"
export default function CRMDashboard() {
  const role = localStorage.getItem("role");
  
  if (!role) {
    return <div>No role assigned. Please log in.</div>; // Kama role haipo kabisa
  }
   return (
     <>
       {role === "reviewer" && <DGdashboard />}
       {(role === "agent") && (<AgentDashboard /> )}
       {role === "attendee" && <AgentDashboard />}
       {role === "focal-person" && <AgentDashboard />}
       {role === "claim-focal-person" && <AgentDashboard />}
       {role === "compliance-focal-person" && <AgentDashboard />}
       {role === "head-of-unit" && <AgentDashboard />}
       {role === "director" && <DGdashboard />}
       {role === "director-general" && <DGdashboard />}
       {role === "manager" && <DGdashboard />}
       {/* {role === "reviewer" && <DGdashboard />} */}
       {role === "supervisor" && <AgentDashboard />}
       {role === "super-admin" && <AgentDashboard />}
       {/* {role === "super-admin" && <HeadsDashboard />} */}
     </>
   );
}
