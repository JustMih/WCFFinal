/* eslint-disable no-undef */
import React from "react";
import { Box, Typography } from "@mui/material";
import { baseURL } from '../config';


const getFileNameFromPath = (filePath) => {
  if (!filePath) return '';
  return filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
};

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

  // Helper function to calculate how long ticket stayed with each person
  const calculateTimeWithPerson = (currentStep, nextStep, selectedTicket, stepIndex, totalSteps) => {
    if (!currentStep.created_at) return "";
    
    const startTime = new Date(currentStep.created_at);
    let endTime;
    
    // Determine the end time based on what happened next
    if (currentStep.isConsolidated && currentStep.action === "Closed") {
      // For consolidated closed steps, show time from assignment to closure
      endTime = new Date(currentStep.closed_at);
    } else if (selectedTicket.status === "Closed" && selectedTicket.date_of_resolution) {
      // If ticket is closed, use the resolution date
      endTime = new Date(selectedTicket.date_of_resolution);
    } else if (nextStep && nextStep.created_at) {
      // If there's a next step, use that time (ticket was passed to next person)
      endTime = new Date(nextStep.created_at);
    } else if (stepIndex === totalSteps - 1) {
      // If this is the last step and ticket is still open, use current time
      endTime = new Date();
    } else {
      // Fallback to current time
      endTime = new Date();
    }
    
    const durationMs = endTime - startTime;
    const diffDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(durationMs / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(durationMs / (1000 * 60));
    
    // Format the duration text
    if (currentStep.isConsolidated && currentStep.action === "Closed") {
      // For consolidated closed steps, show closure time
      if (diffMinutes < 1) {
        return "(Closed instantly)";
      } else if (diffMinutes < 60) {
        return `(Closed with ${diffMinutes}min since assigned)`;
      } else if (diffHours < 24) {
        return `(Closed with ${diffHours}h since assigned)`;
      } else if (diffDays < 7) {
        return `(Closed with ${diffDays}d since assigned)`;
      } else {
        const weeksToClose = Math.floor(diffDays / 7);
        if (weeksToClose < 4) {
          return `(Closed with ${weeksToClose}w since assigned)`;
        } else {
          const monthsToClose = Math.floor(diffDays / 30);
          return `(Closed with ${monthsToClose}mon since assigned)`;
        }
      }
    } else {
      // For regular steps, show time held
      if (diffDays > 1) return `(${diffDays}d)`;
      if (diffHours > 1) return `(${diffHours}h)`;
      if (diffMinutes > 1) return `(${diffMinutes}min)`;
      return "";
    }
  };

  // Helper function to calculate closure time for closed tickets
  const calculateClosureTime = (createdAt, selectedTicket) => {
    if (selectedTicket.status !== "Closed" && selectedTicket.status !== "Resolved") {
      return calculateAging(createdAt);
    }
    
    // For closed tickets, show how long it took from assignment to closure
    const assignmentStartTime = new Date(createdAt);
    const closureTime = selectedTicket.date_of_resolution ? new Date(selectedTicket.date_of_resolution) : new Date();
    const timeToClose = closureTime - assignmentStartTime;
    const minutesToClose = Math.floor(timeToClose / (1000 * 60));
    const hoursToClose = Math.floor(timeToClose / (1000 * 60 * 60));
    const daysToClose = Math.floor(timeToClose / (1000 * 60 * 60 * 24));
    
    if (minutesToClose < 1) {
      return "(Closed instantly)";
    } else if (minutesToClose < 60) {
      return `(Closed with ${minutesToClose}min since assigned)`;
    } else if (hoursToClose < 24) {
      return `(Closed with ${hoursToClose}h since assigned)`;
    } else if (daysToClose < 7) {
      return `(Closed with ${daysToClose}d since assigned)`;
    } else {
      const weeksToClose = Math.floor(daysToClose / 7);
      if (weeksToClose < 4) {
        return `(Closed with ${weeksToClose}w since assigned)`;
      } else {
        const monthsToClose = Math.floor(daysToClose / 30);
        return `(Closed with ${monthsToClose}mon since assigned)`;
      }
    }
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

  // Local function to handle attachment download
  const openAttachmentFile = (attachmentPath) => {
    if (!attachmentPath) return;
    
    const filename = getFileNameFromPath(attachmentPath);
    const downloadUrl = `${baseURL}/ticket/attachment/${filename}`;
    
    // Open in new tab
    window.open(downloadUrl, '_blank');
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
    // Process assignment history to consolidate steps
    const processedHistory = [];
    
    for (let i = 0; i < assignmentHistory.length; i++) {
      const current = assignmentHistory[i];
      const next = assignmentHistory[i + 1];
      
      // Check if current step is "Assigned" and next step is "Closed" by the same person
      if (current.action === "Assigned" && 
          next && 
          next.action === "Closed" && 
          current.assigned_to_id === next.assigned_to_id) {
        // Consolidate into one step showing closure time
        processedHistory.push({
          ...current,
          action: "Closed",
          closed_at: next.created_at,
          isConsolidated: true
        });
        i++; // Skip the next step since we consolidated it
      } else {
        processedHistory.push(current);
      }
    }
    
    steps.push(...processedHistory);
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
        const nextStep = steps[idx + 1];
        const aging = calculateTimeWithPerson(a, nextStep, selectedTicket, idx, steps.length);
        
        // Determine color based on action and status
        let color;
        
        // Check if next step is escalated
        const isNextEscalated = nextStep && (nextStep.action === "Escalated" || nextStep.assigned_to_role === "Escalated");
        
        // Check if current step is escalated
        const isCurrentEscalated = a.action === "Escalated" || a.assigned_to_role === "Escalated";
        
        // Check if this step was assigned and then forwarded to someone else (not escalated)
        const wasAssignedAndForwarded = a.action === "Assigned" && nextStep && nextStep.action !== "Escalated";
        
        // Check if ticket is closed
        const isTicketClosed = selectedTicket.status === "Closed" || selectedTicket.status === "Resolved";
        
        // Priority order: Closed > Forwarded > Escalated > Previous to Escalated > Assigned > Current > Completed > Pending
        if (selectedTicket.status === "Closed" || selectedTicket.status === "Resolved" || a.isConsolidated) {
          color = "green"; // Green for all steps when ticket is closed or consolidated closed steps
        } else if (a.action === "Forwarded") {
          color = "green"; // Green for forwarded actions
        } else if (isCurrentEscalated) {
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
        } else if (wasAssignedAndForwarded) {
          color = "green"; // Green for assigned step that was forwarded to another user
        } else if (a.action === "Assigned") {
          color = "gray"; // Gray for assigned but still open
        } else if (a.action === "Currently with" || a.assigned_to_role === "Coordinator") {
          color = "gray"; // Gray for currently with and coordinator
        } else if (idx === currentAssigneeIdx && selectedTicket.status !== "Closed") {
          color = "gray"; // Gray for current active step
        } else if (idx < currentAssigneeIdx || selectedTicket.status === "Closed") {
          color = "green"; // Green for completed steps or when ticket is closed
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
                  onClick={() => openAttachmentFile(a.attachment_path)}
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