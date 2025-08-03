import React from "react";
import { Box, Typography } from "@mui/material";

export default function AssignmentStepper({ assignmentHistory, selectedTicket }) {
  // Helper function to calculate aging
  const calculateAging = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    
    if (diffDays > 1) return `(${diffDays} days ago)`;
    if (diffHours > 1) return `(${diffHours} hours ago)`;
    if (diffMinutes > 1) return `(${diffMinutes} minutes ago)`;
    return "(Just now)";
  };

  // Helper function to format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        month: "numeric",
        day: "numeric", 
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });
    } catch (error) {
      return "";
    }
  };

  const steps = [
    {
      assigned_to_name: selectedTicket.created_by ||
        (selectedTicket.creator && selectedTicket.creator.name) ||
        `${selectedTicket.first_name || ""} ${selectedTicket.last_name || ""}`.trim() ||
        "N/A",
      assigned_to_role: "Creator",
      action: "Created",
      created_at: selectedTicket.created_at,
      assigned_to_id: "creator"
    }
  ];
  
  if (Array.isArray(assignmentHistory) && assignmentHistory.length > 0) {
    steps.push(...assignmentHistory);
  } else if (
    selectedTicket.assigned_to_id &&
    selectedTicket.assigned_to_id !== "creator"
  ) {
    steps.push({
      assigned_to_name: selectedTicket.assigned_to_name || selectedTicket.assigned_to_id || "Unknown",
      assigned_to_role: selectedTicket.assigned_to_role || "Unknown",
      action: selectedTicket.status === "Assigned" ? "Assigned" : "Open",
      created_at: selectedTicket.assigned_at || selectedTicket.updated_at || selectedTicket.created_at,
      assigned_to_id: selectedTicket.assigned_to_id
    });
  }
  
  let currentAssigneeIdx = 0;
  
  // Debug the ticket status and assigned_to_id
  console.log("Ticket Debug:", {
    status: selectedTicket.status,
    assigned_to_id: selectedTicket.assigned_to_id,
    stepsLength: steps.length
  });
  
  if (
    selectedTicket.status === "Open" &&
    (!selectedTicket.assigned_to_id || steps.length === 1)
  ) {
    currentAssigneeIdx = 0;
  } else {
    // Find the current step based on assigned_to_id or the last step
    const idx = steps.findIndex(
      a => a.assigned_to_id === selectedTicket.assigned_to_id
    );
    if (idx !== -1) {
      currentAssigneeIdx = idx;
    } else {
      // If no exact match, find the last non-escalated step or the last step
      const lastNonEscalatedIdx = steps.findLastIndex(
        a => a.action !== "Escalated" && a.assigned_to_role !== "Escalated"
      );
      currentAssigneeIdx = lastNonEscalatedIdx !== -1 ? lastNonEscalatedIdx : steps.length - 1;
    }
  }
  
  console.log("Current Assignee Index:", currentAssigneeIdx);
  
  return (
    <Box>
      {steps.map((a, idx) => {
        const formattedDate = formatDateTime(a.created_at);
        const aging = calculateAging(a.created_at);
        
        // Determine color based on action and status
        let color;
        
        // Check if next step is escalated
        const nextStep = steps[idx + 1];
        const isNextEscalated = nextStep && (nextStep.action === "Escalated" || nextStep.assigned_to_role === "Escalated");
        
        // Check if current step is assigned but ticket is still open
        const isAssignedButOpen = a.action === "Assigned" && selectedTicket.status === "Open";
        
        // Check if this is the last step and ticket is still open
        const isLastStep = idx === steps.length - 1;
        const isLastStepAndOpen = isLastStep && selectedTicket.status === "Open";
        
        // Debug logging
        console.log(`Step ${idx + 1}:`, {
          action: a.action,
          assigned_to_role: a.assigned_to_role,
          ticketStatus: selectedTicket.status,
          isAssignedButOpen,
          isNextEscalated,
          currentAssigneeIdx,
          isLastStepAndOpen
        });
        
        // Priority order: Closed > Escalated > Previous to Escalated > Assigned > Current > Completed > Pending
        if (selectedTicket.status === "Closed" || selectedTicket.status === "Resolved") {
          color = "green"; // Green for all steps when ticket is closed
        } else if (a.action === "Escalated" || a.assigned_to_role === "Escalated") {
          // Check if this escalated step was followed by an assignment
          const nextStep = steps[idx + 1];
          if (nextStep && nextStep.action === "Assigned") {
            color = "green"; // Green if escalated but then assigned to next user
          } else if (nextStep && (nextStep.action === "Escalated" || nextStep.assigned_to_role === "Escalated")) {
            color = "red"; // Red if escalated again to another user
          } else {
            color = "gray"; // Gray for escalated (pending/not handled)
          }
        } else if (isNextEscalated) {
          color = "red"; // Red for previous step when next is escalated
        } else if (a.action === "Assigned" && nextStep && nextStep.action !== "Escalated") {
          color = "green"; // Green for assigned step that was forwarded to another user
        } else if (a.action === "Assigned") {
          color = "gray"; // Gray for assigned but still open
        } else if (a.action === "Currently with" || a.assigned_to_role === "Coordinator") {
          color = "gray"; // Gray for currently with and coordinator
        } else if (idx === currentAssigneeIdx) {
          color = "#1976d2"; // Blue for current active step
        } else if (idx < currentAssigneeIdx) {
          color = "green"; // Green for completed steps
        } else {
          color = "gray"; // Gray for pending or last step when open
        }
        
        return (
          <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                bgcolor: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold"
              }}
            >
              {idx + 1}
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                {a.assigned_to_name} ({a.assigned_to_role})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {a.action} - {formattedDate} {aging}
              </Typography>
              {a.attachment_path ? (
                <Typography
                  variant="body2"
                  sx={{ color: '#28a745', fontStyle: 'italic', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => handleDownloadAttachment(a.attachment_path)}
                >
                  Download attachment
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ color: '#28a745', fontStyle: 'italic' }}>
                  No attachment
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
} 