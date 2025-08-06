import React, { useState, useEffect } from "react";

// MUI Components - Individual imports for better tree shaking
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Avatar from "@mui/material/Avatar";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";

import ChatIcon from '@mui/icons-material/Chat';
import Download from '@mui/icons-material/Download';
import AttachFile from '@mui/icons-material/AttachFile';
import { baseURL } from "../config";

const getCreatorName = (selectedTicket) =>
  selectedTicket.created_by ||
  (selectedTicket.creator && selectedTicket.creator.name) ||
  `${selectedTicket.first_name || ""} ${selectedTicket.last_name || ""}`.trim() ||
  "N/A";

// Utility function to format time difference in human-readable format
const formatTimeDifference = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}min`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else {
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks}w`;
    } else {
      const diffInMonths = Math.floor(diffInDays / 30);
      return `${diffInMonths}mon`;
    }
  }
};

// Utility function to get aging color based on time difference
const getAgingColor = (dateString) => {
  if (!dateString) return '#6c757d';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 5) {
    return '#28a745'; // Green for very recent
  } else if (diffInMinutes < 60) {
    return '#17a2b8'; // Blue for recent
  } else if (diffInHours < 24) {
    return '#ffc107'; // Yellow for hours
  } else if (diffInDays < 7) {
    return '#fd7e14'; // Orange for days
  } else {
    return '#dc3545'; // Red for older
  }
};

const renderWorkflowStep = (stepNumber, title, details, status) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
    <Box
      sx={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        bgcolor:
          status === "Closed"
            ? "green"
            : status === "current"
            ? "#1976d2"
            : "gray",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "bold"
      }}
    >
      {stepNumber}
    </Box>
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {details}
      </Typography>
    </Box>
  </Box>
);

const getStepStatus = (stepIndex, currentStepIndex) => {
  if (stepIndex < currentStepIndex) return "completed";
  if (stepIndex === currentStepIndex) return "current";
  return "pending";
};

const AssignmentStepper = ({ assignmentHistory, selectedTicket, assignedUser, usersList = [] }) => {
  if (!selectedTicket) return null;
  
  // Use creator_name from assignmentHistory[0] if available
  let creatorName = assignmentHistory && assignmentHistory[0] && assignmentHistory[0].creator_name;
  if (!creatorName) {
    // Try to get the creator's name from usersList if available
    if (selectedTicket.created_by && Array.isArray(usersList) && usersList.length > 0) {
      const creatorUser = usersList.find(u => u.id === selectedTicket.created_by || u.user_id === selectedTicket.created_by);
      if (creatorUser) {
        creatorName = creatorUser.name || `${creatorUser.first_name || ''} ${creatorUser.last_name || ''}`.trim();
      }
    }
    if (!creatorName) {
      creatorName = selectedTicket.created_by ||
        (selectedTicket.creator && selectedTicket.creator.name) ||
        `${selectedTicket.first_name || ""} ${selectedTicket.last_name || ""}`.trim() ||
        "N/A";
    }
  }

  // Build steps array
  const steps = [
    {
      assigned_to_name: creatorName,
      assigned_to_role: "Creator",
      action: "Created",
      created_at: selectedTicket.created_at,
      assigned_to_id: "creator"
    }
  ];

  // Check if ticket should be with coordinator
  const isWithCoordinator = selectedTicket.status === "Open" && 
    ["Complaint", "Compliment", "Suggestion"].includes(selectedTicket.category);

  if (isWithCoordinator) {
    // Add coordinator step for open complaints/compliments/suggestions
    steps.push({
      assigned_to_name: "Coordinator",
      assigned_to_role: "Coordinator",
      action: "Currently with",
      created_at: selectedTicket.created_at,
      assigned_to_id: "coordinator"
    });
  } else if (Array.isArray(assignmentHistory) && assignmentHistory.length > 0) {
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
    
    // Use assignmentHistory as-is, do not override assigned_to_role unless missing
    steps.push(...processedHistory.map(a => ({
      ...a,
      assigned_to_role: a.assigned_to_role ? a.assigned_to_role : "Unknown"
    })));
  } else if (
    selectedTicket.assigned_to_id &&
    selectedTicket.assigned_to_id !== "creator"
  ) {
    steps.push({
      assigned_to_name: (assignedUser && assignedUser.name) ||
        (selectedTicket.assignee && selectedTicket.assignee.name) ||
        selectedTicket.assigned_to_name ||
        selectedTicket.assigned_to_id || "Unknown",
      assigned_to_role: (assignedUser && assignedUser.role) ||
        (selectedTicket.assignee && selectedTicket.assignee.role) ||
        selectedTicket.assigned_to_role || "Unknown",
      action: selectedTicket.status === "Assigned" ? "Assigned" : "Open",
      created_at: selectedTicket.assigned_at,
      assigned_to_id: selectedTicket.assigned_to_id
    });
  }

  // Determine current step index
  let currentAssigneeIdx = 0;
  if (isWithCoordinator) {
    // If ticket is with coordinator, the coordinator step is current
    currentAssigneeIdx = 1; // Index 1 is the coordinator step
  } else if (
    selectedTicket.status === "Open" &&
    (!selectedTicket.assigned_to_id || steps.length === 1)
  ) {
    currentAssigneeIdx = 0;
  } else {
    const idx = steps.findIndex(
      a => a.assigned_to_id && selectedTicket.assigned_to_id && a.assigned_to_id === selectedTicket.assigned_to_id
    );
    currentAssigneeIdx = idx !== -1 ? idx : steps.length - 1;
  }

  return (
    <Box>
      {steps.map((a, idx) => {
        // Determine if this is the last step and ticket is closed
        const isLastStep = idx === steps.length - 1;
        const isClosed = selectedTicket.status === "Closed" && isLastStep;
        const isCurrentWithCoordinator = isWithCoordinator && idx === 1; // Coordinator step

        // Set color: green for completed, blue for current, gray for pending, green for closed last step
        let color;
        
        // Check if next step is escalated
        const nextStep = steps[idx + 1];
        const isNextEscalated = nextStep && (nextStep.action === "Escalated" || nextStep.assigned_to_role === "Escalated");
        
        // Check if current step is escalated
        const isCurrentEscalated = a.action === "Escalated" || a.assigned_to_role === "Escalated";
        
        // Check if this step was assigned and then forwarded to someone else (not escalated)
        const wasAssignedAndForwarded = a.action === "Assigned" && nextStep && nextStep.action !== "Escalated";
        
        // Check if ticket is closed
        const isTicketClosed = selectedTicket.status === "Closed" || selectedTicket.status === "Resolved";
        
        // Priority order: Closed > Escalated > Previous to Escalated > Assigned > Current > Completed > Pending
        if (selectedTicket.status === "Closed" || selectedTicket.status === "Resolved" || a.isConsolidated) {
          color = "green"; // Green for all steps when ticket is closed or consolidated closed steps
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

        // Set action label
        let actionLabel = a.action;
        if (isClosed) {
          actionLabel = "Closed";
        } else if (isCurrentWithCoordinator) {
          actionLabel = "Currently with";
        }

        // Set who closed
        let closedBy = "";
        if (isClosed) {
          closedBy = a.assigned_to_name || "N/A";
        }

        return (
          <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
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
                fontWeight: "bold",
                mt: 0.5
              }}
            >
              {idx + 1}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  {a.assigned_to_name} ({a.assigned_to_role})
                </Typography>
                {/* Show aging for all assignments except creator, calculating active time for each */}
                {a.created_at && (
                  (() => {
                    // Calculate the end time for this assignment
                    let endTime;
                    if (a.isConsolidated && a.action === "Closed") {
                      // For consolidated closed steps, use the closure time
                      endTime = new Date(a.closed_at);
                    } else if (selectedTicket.status === "Closed" && selectedTicket.date_of_resolution) {
                      // If ticket is closed, use the resolution date as end time
                      endTime = new Date(selectedTicket.date_of_resolution);
                    } else if (idx === steps.length - 1) {
                      // Last assignment - use current time
                      endTime = new Date();
                    } else {
                      // Find the next assignment time
                      const nextAssignment = steps[idx + 1];
                      if (nextAssignment && nextAssignment.created_at) {
                        endTime = new Date(nextAssignment.created_at);
                      } else {
                        endTime = new Date();
                      }
                    }
                    
                    // Calculate the duration this person was actively assigned
                    const startTime = new Date(a.created_at);
                    const durationMs = endTime - startTime;
                    const durationMinutes = Math.floor(durationMs / (1000 * 60));
                    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
                    const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
                    
                    // Format the duration
                    let durationText;
                    if (a.isConsolidated && a.action === "Closed") {
                      // For consolidated closed steps, show closure time
                      if (durationMinutes < 1) {
                        durationText = 'Closed instantly';
                      } else if (durationMinutes < 60) {
                        durationText = `Closed with ${durationMinutes}min since assigned`;
                      } else if (durationHours < 24) {
                        durationText = `Closed with ${durationHours}h since assigned`;
                      } else if (durationDays < 7) {
                        durationText = `Closed with ${durationDays}d since assigned`;
                      } else {
                        const weeksToClose = Math.floor(durationDays / 7);
                        if (weeksToClose < 4) {
                          durationText = `Closed with ${weeksToClose}w since assigned`;
                        } else {
                          const monthsToClose = Math.floor(durationDays / 30);
                          durationText = `Closed with ${monthsToClose}mon since assigned`;
                        }
                      }
                    } else if (a.action === "Closed") {
                      // For closed tickets, show how long it took from assignment to closure
                      if (durationMinutes < 1) {
                        durationText = 'Closed instantly';
                      } else if (durationMinutes < 60) {
                        durationText = `Closed with ${durationMinutes}min since assigned`;
                      } else if (durationHours < 24) {
                        durationText = `Closed with ${durationHours}h since assigned`;
                      } else if (durationDays < 7) {
                        durationText = `Closed with ${durationDays}d since assigned`;
                      } else {
                        const weeksToClose = Math.floor(durationDays / 7);
                        if (weeksToClose < 4) {
                          durationText = `Closed with ${weeksToClose}w since assigned`;
                        } else {
                          const monthsToClose = Math.floor(durationDays / 30);
                          durationText = `Closed with ${monthsToClose}mon since assigned`;
                        }
                      }
                    } else {
                      // For all other statuses (Assigned, Forwarded, Escalated, etc.), show time with person
                      if (durationMinutes < 1) {
                        durationText = 'Just now';
                      } else if (durationMinutes < 60) {
                        durationText = `${durationMinutes}min`;
                      } else if (durationHours < 24) {
                        durationText = `${durationHours}h`;
                      } else if (durationDays < 7) {
                        durationText = `${durationDays}d`;
                      } else {
                        const durationWeeks = Math.floor(durationDays / 7);
                        if (durationWeeks < 4) {
                          durationText = `${durationWeeks}w`;
                        } else {
                          const durationMonths = Math.floor(durationDays / 30);
                          durationText = `${durationMonths}mon`;
                        }
                      }
                    }
                    
                    // Get color based on duration
                    let durationColor;
                    if (a.action === "Closed" || a.isConsolidated) {
                      durationColor = '#28a745'; // Green for closed tickets
                    } else if (durationMinutes < 5) {
                      durationColor = '#28a745'; // Green for very recent
                    } else if (durationMinutes < 60) {
                      durationColor = '#17a2b8'; // Blue for recent
                    } else if (durationHours < 24) {
                      durationColor = '#ffc107'; // Yellow for hours
                    } else if (durationDays < 7) {
                      durationColor = '#fd7e14'; // Orange for days
                    } else {
                      durationColor = '#dc3545'; // Red for older
                    }
                    
                    return (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5,
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        px: 1.5,
                        py: 0.5,
                        border: `2px solid ${durationColor}`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                        }
                      }}>
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          backgroundColor: durationColor,
                          animation: 'pulse 2s infinite',
                          '@keyframes pulse': {
                            '0%': {
                              boxShadow: `0 0 0 0 ${durationColor}40`
                            },
                            '70%': {
                              boxShadow: `0 0 0 6px ${durationColor}00`
                            },
                            '100%': {
                              boxShadow: `0 0 0 0 ${durationColor}00`
                            }
                          }
                        }} />
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: durationColor,
                            fontWeight: '700',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            letterSpacing: '0.5px'
                          }}
                        >
                          {durationText}
                        </Typography>
                      </Box>
                    );
                  })()
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {actionLabel} - {a.created_at ? new Date(a.created_at).toLocaleString("en-US", {
                  month: "numeric",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true
                }) : (selectedTicket.updated_at ? new Date(selectedTicket.updated_at).toLocaleString("en-US", {
                  month: "numeric",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true
                }) : "Date not available")}
                {isClosed && (
                  <span style={{ color: "green", marginLeft: 8 }}>
                    (Closed by: {closedBy})
                  </span>
                )}
                {isCurrentWithCoordinator && (
                  <span style={{ color: "#1976d2", marginLeft: 8, fontWeight: "bold" }}>
                    (Current)
                  </span>
                )}
              </Typography>
              {/* Attachment/Evidence link if present, else show 'No attachment' */}
              {a.attachment_path ? (
                <Typography
                  variant="body2"
                  sx={{ color: '#28a745', fontStyle: 'italic', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => handleDownloadAttachment(a.attachment_path)}
                >
                  Download attachment
                </Typography>
              ) : a.evidence_url ? (
                <Typography variant="body2" color="primary">
                  <a href={a.evidence_url} target="_blank" rel="noopener noreferrer">
                    View Evidence
                  </a>
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'gray', fontStyle: 'italic' }}>
                  No attachment
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export { AssignmentStepper };

function AssignmentFlowChat({ assignmentHistory = [], selectedTicket }) {
  const creatorStep = selectedTicket
    ? {
        assigned_to_name: getCreatorName(selectedTicket),
        assigned_to_role: 'Creator',
        reason: selectedTicket.description,
        created_at: selectedTicket.created_at,
      }
    : null;
  // Always add all assignments as steps, even if assignee is same as creator
  const steps = creatorStep ? [creatorStep, ...assignmentHistory] : assignmentHistory;
  
  // Helper function to get aging status color
  const getAgingStatusColor = (status) => {
    switch (status) {
      case 'On Time':
        return '#4caf50'; // Green
      case 'Warning':
        return '#ff9800'; // Orange
      case 'Overdue':
        return '#f44336'; // Red
      case 'Critical':
        return '#d32f2f'; // Dark Red
      default:
        return '#757575'; // Gray
    }
  };

  return (
    <Box sx={{ maxWidth: 400, ml: 'auto', mr: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
        {/* <Typography sx={{ color: "#3f51b5", wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
          Ticket History
        </Typography> */}
      </Box>
      <Divider sx={{ mb: 2 }} />
      {steps.map((a, idx) => {
        let message;
        if (idx === 0) {
          message = selectedTicket.description
            ? `Created the ticket\nDescription: ${selectedTicket.description}`
            : 'Created the ticket';
        } else {
          const prevUser = steps[idx - 1]?.assigned_to_name || 'Previous User';
          if (selectedTicket.status === "Closed" && idx === steps.length - 1) {
            if (a.reason && selectedTicket.resolution_details) {
              message = `Message from ${prevUser}: ${a.reason}\nResolution: ${selectedTicket.resolution_details}`;
            } else if (a.reason) {
              message = `Message from ${prevUser}: ${a.reason}`;
            } else if (selectedTicket.resolution_details) {
              message = `Resolution: ${selectedTicket.resolution_details}`;
            } else {
              message = `Message from ${prevUser}: No message`;
            }
          } else {
            // Build message with workflow details
            let baseMessage = `Message from ${prevUser}: ${a.reason || 'No message'}`;
            
            // Add workflow-specific details
            if (a.workflow_step) {
              baseMessage += `\n\nWorkflow Step: ${a.workflow_step}`;
            }
            
            if (a.coordinator_notes) {
              baseMessage += `\n\nReviewer Notes: ${a.coordinator_notes}`;
            }
            
            if (a.dg_notes) {
              baseMessage += `\n\nDG Notes: ${a.dg_notes}`;
            }
            
            // Show current resolution details from the ticket
            if (selectedTicket.resolution_details) {
              baseMessage += `\n\nResolution Details: ${selectedTicket.resolution_details}`;
            }
            
            message = baseMessage;
          }
        }
        
        // Display aging information for non-creator steps
        const showAging = idx > 0 && a.aging_formatted;
        
        return (
          <Box key={idx} sx={{ display: "flex", mb: 2, alignItems: "flex-start" }}>
            <Avatar sx={{ bgcolor: idx === 0 ? "#43a047" : "#1976d2", mr: 2 }}>
              {a.assigned_to_name ? a.assigned_to_name[0] : "?"}
            </Avatar>
            <Paper elevation={2} sx={{ p: 2, bgcolor: idx === 0 ? "#e8f5e9" : "#f5f5f5", flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography sx={{ fontWeight: "bold" }}>
                  {a.assigned_to_name || a.assigned_to_id || 'Unknown'} {" "}
                  <span style={{ color: "#888", fontWeight: "normal" }}>
                    ({a.assigned_to_role || "N/A"})
                  </span>
                </Typography>
                {showAging && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ml: 1 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: getAgingStatusColor(a.aging_status),
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }}
                    >
                      {a.aging_status}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#666',
                        fontSize: '0.7rem'
                      }}
                    >
                      {a.aging_formatted}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography variant="body2" sx={{ color: idx === 0 ? "#43a047" : "#1976d2", wordBreak: 'break-word', whiteSpace: 'pre-line', overflowWrap: 'break-word' }}>
                {message}
              </Typography>
              <Typography variant="caption" sx={{ color: "#888" }}>
                {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                {a.created_at && (
                  <span style={{ color: "#666", marginLeft: 8 }}>
                    ({formatTimeDifference(a.created_at)} ago)
                  </span>
                )}
              </Typography>
            </Paper>
          </Box>
        );
      })}
    </Box>
  );
}

function getFullCreatorName(selectedTicket, assignmentHistory = [], usersList = []) {
  // 1. Try assignmentHistory[0].creator_name
  if (assignmentHistory && assignmentHistory[0] && assignmentHistory[0].creator_name) {
    return assignmentHistory[0].creator_name;
  }
  // 2. Try to find in usersList by id or user_id
  if (selectedTicket.created_by && Array.isArray(usersList) && usersList.length > 0) {
    const creatorUser = usersList.find(
      u => u.id === selectedTicket.created_by || u.user_id === selectedTicket.created_by
    );
    if (creatorUser) {
      return creatorUser.name || `${creatorUser.first_name || ''} ${creatorUser.last_name || ''}`.trim();
    }
  }
  // 3. Fallbacks
  return (
    (selectedTicket.creator && selectedTicket.creator.name) ||
    `${selectedTicket.first_name || ""} ${selectedTicket.last_name || ""}`.trim() ||
    selectedTicket.created_by ||
    "N/A"
  );
}

const getFileNameFromPath = (filePath) => {
  if (!filePath) return '';
  return filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
};

const handleDownloadAttachment = (attachmentPath) => {
  if (!attachmentPath) return;
  
  const filename = getFileNameFromPath(attachmentPath);
  const downloadUrl = `${baseURL}/ticket/attachment/${filename}`;
  
  // Open in new tab
  window.open(downloadUrl, '_blank');
};

export default function TicketDetailsModal({
  open,
  onClose,
  selectedTicket,
  assignmentHistory,
  handleCategoryChange,
  handleUnitChange,
  categories = [],
  units = [],
  convertCategory = {},
  forwardUnit = {},
  refreshTickets = () => {},
  setSnackbar = () => {},
  setConvertCategory = () => {},
  setForwardUnit = () => {},
}) {
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const userRole = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const [isAttendDialogOpen, setIsAttendDialogOpen] = useState(false);
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [attachment, setAttachment] = useState(null);
  
  // Reviewer-specific states
  const [resolutionType, setResolutionType] = useState("");
  const [isCoordinatorCloseDialogOpen, setIsCoordinatorCloseDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState("");

  // Reverse modal state
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [reverseReason, setReverseReason] = useState("");
  const [isReversing, setIsReversing] = useState(false);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const [assignReason, setAssignReason] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [attendees, setAttendees] = useState([]);

  // Major complaint workflow states
  const [isMajorComplaintClosureDialogOpen, setIsMajorComplaintClosureDialogOpen] = useState(false);
  const [isForwardToDGDialogOpen, setIsForwardToDGDialogOpen] = useState(false);
  const [isDGApprovalDialogOpen, setIsDGApprovalDialogOpen] = useState(false);
  const [coordinatorNotes, setCoordinatorNotes] = useState("");
  const [editedResolution, setEditedResolution] = useState("");
  const [dgNotes, setDgNotes] = useState("");
  const [dgApproved, setDgApproved] = useState(true);

  // Initialize selectedRating when modal opens
  useEffect(() => {
    if (selectedTicket) {
      setSelectedRating(selectedTicket.complaint_type || "");
    }
  }, [selectedTicket]);

  const showAttendButton =
    // (userRole === "agent" || userRole === "attendee") &&
    selectedTicket &&
    selectedTicket.status !== "Closed" &&
    selectedTicket.assigned_to_id &&
    userRole !== "coordinator" &&
    String(selectedTicket.assigned_to_id) === String(userId);

  // Reviewer-specific conditions
  const showCoordinatorActions = 
    userRole === "coordinator" && 
    selectedTicket && 
    selectedTicket.assigned_to_id &&
    String(selectedTicket.assigned_to_id) === String(userId) &&
    selectedTicket.status !== "Closed";

  const handleAttend = async () => {
    try {
      const response = await fetch(`${baseURL}/workflow/${selectedTicket.id}/attend-and-recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add Authorization header if your backend requires it
          ...(localStorage.getItem("authToken") ? { 'Authorization': `Bearer ${localStorage.getItem("authToken")}` } : {})
        },
        body: JSON.stringify({
          recommendation: resolutionDetails,
          evidence_url: attachment ? `${baseURL}/ticket/attachment/${attachment.name}` : null // if you have file upload, otherwise omit
        })
      });
      if (!response.ok) {
        const error = await response.json();
        alert(error.message || 'Failed to submit recommendation');
        return;
      }
      alert('Recommendation submitted! The Head of Unit will review it next.');
      // Optionally close modal, refresh ticket list, etc.
      if (onClose) onClose();
      refreshTickets();
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  };

  // Forward to Director General handler
  const handleForwardToDG = () => {
    // Initialize edited resolution with current resolution details
    setEditedResolution(selectedTicket?.resolution_details || "");
    setIsForwardToDGDialogOpen(true);
  };

  // Director General approval handler
  const handleDGApproval = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${baseURL}/ticket/${selectedTicket.id}/approve-major-complaint`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            userId,
            approved: dgApproved,
            dg_notes: dgNotes
          })
        }
      );

      if (response.ok) {
        setIsDGApprovalDialogOpen(false);
        onClose();
        refreshTickets();
        const action = dgApproved ? 'approved' : 'reversed';
        setSnackbar({open: true, message: `Major complaint ${action} by Director General`, severity: 'success'});
      } else {
        const data = await response.json();
        setSnackbar({open: true, message: data.message || 'Failed to process DG approval', severity: 'error'});
      }
    } catch (error) {
      console.error("Error in DG approval:", error);
      setSnackbar({open: true, message: 'Error processing DG approval', severity: 'error'});
    }
  };

  const handleAttendSubmit = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("status", "Closed");
      formData.append("resolution_details", resolutionDetails);
      formData.append("date_of_resolution", new Date().toISOString());
      if (attachment) {
        formData.append("attachment", attachment);
      }
      const response = await fetch(
        `${baseURL}/ticket/${selectedTicket.id}/close`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
            // Do NOT set Content-Type; browser will set it for FormData
          },
          body: formData
        }
      );
      if (response.ok) {
        setIsAttendDialogOpen(false);
        onClose();
        refreshTickets();
        setSnackbar({open: true, message: 'Ticket closed successfully', severity: 'success'});
      } else {
        // Optionally show an error message
      }
    } catch (error) {
      // Optionally show an error message
    }
  };

  const handleCoordinatorClose = () => {
    setIsCoordinatorCloseDialogOpen(true);
  };

  const handleCoordinatorCloseSubmit = async () => {
    if (!resolutionType || !resolutionDetails) {
      alert("Please provide both resolution type and details");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("status", "Closed");
      formData.append("resolution_type", resolutionType);
      formData.append("resolution_details", resolutionDetails);
      formData.append("date_of_resolution", new Date().toISOString());
      formData.append("userId", userId);
      
      if (attachment) {
        formData.append("attachment", attachment);
      }

      // Use different endpoints based on user role
      const endpoint = userRole === "coordinator" 
        ? `${baseURL}/coordinator/${selectedTicket.id}/close`
        : `${baseURL}/ticket/${selectedTicket.id}/close`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setIsCoordinatorCloseDialogOpen(false);
        onClose();
        refreshTickets();
        const roleText = userRole === "coordinator" ? "Coordinator" : 
                        userRole === "claim-focal-person" ? "Claim Focal Person" : "Focal Person";
        setSnackbar({open: true, message: `Ticket closed successfully by ${roleText}`, severity: 'success'});
      } else {
        throw new Error("Failed to close ticket");
      }
    } catch (error) {
      console.error("Error closing ticket:", error);
      setSnackbar({open: true, message: 'Error closing ticket', severity: 'error'});
    }
  };

  // Reverse handler
  const handleReverse = async () => {
    setIsReversing(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/ticket/${selectedTicket.id}/reverse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId, reason: reverseReason })
      });
      const data = await response.json();
      if (response.ok) {
        setSnackbar({ open: true, message: data.message, severity: "success" });
        refreshTickets();
        setIsReverseModalOpen(false);
        onClose();
      } else {
        setSnackbar({ open: true, message: data.message, severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    } finally {
      setIsReversing(false);
      setReverseReason("");
    }
  };

  // Fetch attendees when modal opens
  useEffect(() => {
    if (isAssignModalOpen) {
      const fetchAttendees = async () => {
        try {
          const token = localStorage.getItem("authToken");
          const res = await fetch(`${baseURL}/ticket/admin/attendee`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (Array.isArray(data.attendees)) {
            setAttendees(data.attendees);
          } else if (Array.isArray(data.data)) {
            setAttendees(data.data);
          } else {
            setAttendees([]);
          }
        } catch (e) {
          setAttendees([]);
        }
      };
      fetchAttendees();
    }
  }, [isAssignModalOpen]);

  const handleAssignTicket = async () => {
    if (!selectedAttendee || !selectedAttendee.username) {
      setSnackbar && setSnackbar({ open: true, message: 'Please select an attendee', severity: 'warning' });
      return;
    }
    if (!selectedTicket || !selectedTicket.id) {
      setSnackbar && setSnackbar({ open: true, message: 'No ticket selected or ticket ID missing', severity: 'error' });
      console.error('Assign error: selectedTicket or selectedTicket.id missing', selectedTicket);
      return;
    }
    const assignedToUsername = selectedAttendee.username;
    const assignedById = localStorage.getItem("userId");
    const reason = assignReason;
    if (!assignedToUsername || !assignedById) {
      setSnackbar && setSnackbar({ open: true, message: 'Missing required fields for assignment', severity: 'error' });
      console.error('Assign error: missing assignedToUsername or assignedById', { assignedToUsername, assignedById });
      return;
    }
    setAssignLoading(true);
    try {
      console.log('Assigning ticket:', selectedTicket);
      console.log('Assigning to username:', assignedToUsername, 'by user:', assignedById, 'reason:', reason);
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${baseURL}/ticket/${selectedTicket.id}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          assignedToUsername,
          assignedById,
          reason
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setSnackbar && setSnackbar({ open: true, message: `Failed to assign ticket: ${res.status} ${data.message || ''}`, severity: 'error' });
        console.error('Assign fetch error:', res.status, data);
        return;
      }
      setSnackbar && setSnackbar({
        open: true,
        message: data.message || "Ticket assigned successfully",
        severity: "success"
      });
      setAssignReason("");
      setSelectedAttendee(null);
      setIsAssignModalOpen(false);
      refreshTickets && refreshTickets();
    } catch (e) {
      setSnackbar && setSnackbar({ open: true, message: `Assign error: ${e.message}`, severity: "error" });
      console.error('Assign exception:', e);
    } finally {
      setAssignLoading(false);
    }
  };

  useEffect(() => {
    console.log("MODAL selectedTicket", selectedTicket);
  }, [selectedTicket]);

  const handleForwardToDGSubmit = async () => {
    if (!coordinatorNotes.trim()) {
      alert("Please add coordinator notes before forwarding to Director General");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/tickets/${selectedTicket.id}/forward-to-dg`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          coordinator_notes: coordinatorNotes,
          resolution_details: editedResolution // Include the edited resolution
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert("Major complaint forwarded to Director General successfully!");
        setIsForwardToDGDialogOpen(false);
        setCoordinatorNotes("");
        setEditedResolution("");
        onClose();
        refreshTickets();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to forward to Director General'}`);
      }
    } catch (error) {
      console.error("Error forwarding to Director General:", error);
      alert("Failed to forward to Director General. Please try again.");
    }
  };

  const handleRating = async (ticketId, rating) => {
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");
    try {
      const response = await fetch(`${baseURL}/coordinator/${ticketId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ complaintType: rating, userId })
      });
      const data = await response.json();
      if (response.ok) {
        setSnackbar({ open: true, message: `Rated as ${rating}`, severity: "success" });
        // Don't refresh tickets here - only refresh after forwarding
      } else {
        setSnackbar({ open: true, message: data.message || "Failed to rate ticket", severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    }
  };

  const handleConvertOrForward = async (ticketId) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");
    const category = convertCategory[ticketId];
    const unitName = forwardUnit[ticketId];

    // Get the current ticket to check its section and rating
    const currentTicket = selectedTicket;

    // Validate that at least one option is selected
    // If unitName is empty but ticket has a section, use the ticket's section
    const effectiveUnitName = unitName || currentTicket?.section || currentTicket?.responsible_unit_name;
    
    if (!category && !effectiveUnitName) {
      setSnackbar({
        open: true,
        message: "Please select either a category to convert to, or a unit to forward to, or both",
        severity: "warning"
      });
      return;
    }

    // Check if trying to forward without rating
    if (effectiveUnitName && !currentTicket?.complaint_type) {
      setSnackbar({
        open: true,
        message: "Ticket must be rated (Minor or Major) before it can be forwarded",
        severity: "warning"
      });
      return;
    }

    try {
      // Prepare the payload to match backend expectations
      const payload = { 
        userId,
        responsible_unit_name: effectiveUnitName || undefined,
        category: category || undefined,
        complaintType: currentTicket?.complaint_type || undefined
      };

      const response = await fetch(`${baseURL}/coordinator/${ticketId}/convert-or-forward-ticket`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        setSnackbar({ open: true, message: data.message || "Ticket updated successfully", severity: "success" });
        refreshTickets();
        // Clear both states after successful update
        setConvertCategory((prev) => {
          const newState = { ...prev };
          delete newState[ticketId];
          return newState;
        });
        setForwardUnit((prev) => {
          const newState = { ...prev };
          delete newState[ticketId];
          return newState;
        });
      } else {
        setSnackbar({ open: true, message: data.message || "Failed to update ticket", severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="ticket-details-modal"
        aria-describedby="ticket-details-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 600 },
            maxHeight: "85vh",
            overflowY: "auto",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 3
          }}
        >
          {selectedTicket && (
            <>
              <Typography
                id="ticket-details-title"
                variant="h5"
                sx={{ fontWeight: "bold", color: "#1976d2", mb: 2 }}
              >
                Ticket Details {selectedTicket.ticket_id ? `#${selectedTicket.ticket_id}` : ""}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {/* Workflow Status Section */}
              <Box sx={{ mb: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ color: "#3f51b5", flexGrow: 1 }}>
                    Ticket History
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', flex: 1 }}>
                    <IconButton size="small" onClick={() => setIsFlowModalOpen(true)} title="Show Assignment Flow Chart">
                      <ChatIcon color="primary" />
                    </IconButton>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <AssignmentStepper assignmentHistory={assignmentHistory} selectedTicket={selectedTicket} />

                {/* Current Status */}
                <Box sx={{ mt: 2, p: 2, bgcolor: "white", borderRadius: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    Current Status
                  </Typography>
                  <Typography>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        color:
                          selectedTicket.status === "Open"
                            ? "green"
                            : selectedTicket.status === "Closed"
                            ? "green"
                            : selectedTicket.status === "In Progress"
                            ? "blue"
                            : selectedTicket.status === "Assigned"
                            ? "orange"
                            : selectedTicket.status === "Returned"
                            ? "purple"
                            : "inherit"
                      }}
                    >
                      {selectedTicket.status || "N/A"}
                    </span>
                  </Typography>

                  {/* Show creator if open */}
                  {selectedTicket.status === "Open" && (
                    <>
                      <Typography>
                        <strong>Created By:</strong>{" "}
                        {getFullCreatorName(selectedTicket, assignmentHistory, attendees)}
                      </Typography>
                      {selectedTicket.description && (
                        <Typography sx={{ mt: 1 }}>
                          <strong>Description:</strong> {selectedTicket.description}
                        </Typography>
                      )}
                    </>
                  )}

                  {/* Show last assignment if assigned/in progress/closed */}
                  {(selectedTicket.status === "Assigned" ||
                    selectedTicket.status === "In Progress" ||
                    selectedTicket.status === "Closed") && (
                    (() => {
                      const last =
                        assignmentHistory && assignmentHistory.length > 0
                          ? assignmentHistory[assignmentHistory.length - 1]
                          : null;
                      if (!last) return null;
                      return (
                        <>
                          <Typography>
                            <strong>
                              {selectedTicket.status === "Closed"
                                ? "Closed By:"
                                : "Assigned To:"}
                            </strong>{" "}
                            {last.assigned_to_name || last.assigned_to_id || "N/A"}{" "}
                            <span style={{ color: "#888" }}>
                              ({last.assigned_to_role || "N/A"})
                            </span>
                          </Typography>
                          <Typography>
                            <strong>Date:</strong>{" "}
                            {last.created_at
                              ? new Date(last.created_at).toLocaleString()
                              : "N/A"}
                          </Typography>
                          {last.reason && (
                            <Typography sx={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                              <strong>Message:</strong> {last.reason}
                            </Typography>
                          )}
                          {selectedTicket.status === "Closed" && selectedTicket.resolution_details && (
                              <Typography sx={{ wordBreak: 'break-word', whiteSpace: 'pre-line', mt: 1 }}>
                              <strong>Resolution Details:</strong> {selectedTicket.resolution_details}
                            </Typography>
                          )}
                          {selectedTicket.status === "Closed" && selectedTicket.resolution_type && (
                            <Typography sx={{ mt: 1 }}>
                              <strong>Resolution Type:</strong>{" "}
                              <Chip 
                                label={selectedTicket.resolution_type} 
                                size="small" 
                                color="primary" 
                                sx={{ ml: 1 }}
                              />
                            </Typography>
                          )}
                          {selectedTicket.status === "Closed" && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: '#fff', borderRadius: 1, border: '1px solid #ced4da' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
                                <AttachFile sx={{ mr: 1, fontSize: 16 }} />
                                Resolution Attachment
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {selectedTicket.attachment_path ? (
                                  <Typography
                                    variant="body2"
                                    sx={{ flex: 1, color: '#28a745', fontStyle: 'italic', cursor: 'pointer', textDecoration: 'underline' }}
                                    onClick={() => handleDownloadAttachment(selectedTicket.attachment_path)}
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
                          )}
                        </>
                      );
                    })()
                  )}
                </Box>

                {/* {selectedTicket.status === 'Closed' && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                    <Typography>
                      <strong>Closure Details:</strong> {selectedTicket.closureDetails}
                    </Typography>
                  </Box>
                )} */}
              </Box>

              {/* Two-Column Ticket Fields */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ flex: "1 1 45%" }}>
                  <Typography>
                    <strong>Name:</strong>{" "}
                    {selectedTicket.first_name
                      ? `${selectedTicket.first_name} ${
                          selectedTicket.middle_name || ""
                        } ${selectedTicket.last_name || ""}`.trim()
                      : selectedTicket.institution}
                  </Typography>
                </div>
                <div style={{ flex: "1 1 45%" }}>
                  <Typography>
                    <strong>Phone:</strong>{" "}
                    {selectedTicket.phone_number || "N/A"}
                  </Typography>
                </div>

                <div style={{ flex: "1 1 45%" }}>
                  <Typography>
                    <strong>NIDA:</strong> {selectedTicket.nida_number || "N/A"}
                  </Typography>
                </div>
                <div style={{ flex: "1 1 45%" }}>
                  <Typography>
                    <strong>Institution:</strong>{" "}
                    {selectedTicket.institution || "N/A"}
                  </Typography>
                </div>

                <div style={{ flex: "1 1 45%" }}>
                  <Typography>
                    <strong>Region:</strong> {selectedTicket.region || "N/A"}
                  </Typography>
                </div>
                <div style={{ flex: "1 1 45%" }}>
                  <Typography>
                    <strong>District:</strong>{" "}
                    {selectedTicket.district || "N/A"}
                  </Typography>
                </div>
                <div style={{ flex: "1 1 45%" }}>
                  <Typography>
                    <strong>Rated:</strong>{" "}
                    {selectedTicket.complaint_type || "N/A"}
                  </Typography>
                </div>

                <div style={{ flex: "1 1 45%" }}>
                  <Typography>
                    <strong>Subject:</strong> {selectedTicket.subject || "N/A"}
                  </Typography>
                </div>
                <div style={{ flex: "1 1 45%" }}>
                  <Typography>
                    <strong>Sub-section:</strong> {selectedTicket.sub_section || "N/A"}
                  </Typography>
                </div>
                <div style={{ flex: "1 1 45%" }}>
                  <Typography>
                    <strong>Section:</strong> {selectedTicket.section || "N/A"}
                  </Typography>
                </div>
                <div style={{ flex: "1 1 45%" }}>
                  <Typography>
                    <strong>Category:</strong>{" "}
                    {selectedTicket.category || "N/A"}
                  </Typography>
                </div>

                <div style={{ flex: "1 1 45%" }}>
                  <Typography>
                    <strong>Channel:</strong> {selectedTicket.channel || "N/A"}
                  </Typography>
                </div>

                <div style={{ flex: "1 1 100%" }}>
                  <Typography sx={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                    <strong>Description:</strong>{" "}
                    {selectedTicket.description || "N/A"}
                  </Typography>
                </div>

              </div>

              {/* Representative Details Section */}
              {selectedTicket.requester === "Representative" && selectedTicket.representative_name && (
                <Box sx={{ mt: 3, mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
                    Representative Details
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <div>
                      <Typography variant="body2"><strong>Name:</strong> {selectedTicket.representative_name || 'N/A'}</Typography>
                    </div>
                    <div>
                      <Typography variant="body2"><strong>Phone:</strong> {selectedTicket.representative_phone || 'N/A'}</Typography>
                    </div>
                    <div>
                      <Typography variant="body2"><strong>Email:</strong> {selectedTicket.representative_email || 'N/A'}</Typography>
                    </div>
                    <div>
                      <Typography variant="body2"><strong>Address:</strong> {selectedTicket.representative_address || 'N/A'}</Typography>
                    </div>
                    <div>
                      <Typography variant="body2"><strong>Relationship to Employee:</strong> {selectedTicket.representative_relationship || 'N/A'}</Typography>
                    </div>
                  </Box>
                </Box>
              )}

              {/* Action Buttons */}
              <Box sx={{ mt: 2, textAlign: "right" }}>
                {showAttendButton && (
                  <Button variant="contained" color="primary" onClick={() => setIsCoordinatorCloseDialogOpen(true)} sx={{ mr: 1 }}>
                    Attend
                  </Button>
                )}
                
                {/* Reviewer Actions */}
                {showCoordinatorActions && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2, justifyContent: "flex-end" }}>
                    {/* Show rating selection only if not a major complaint that's been returned */}
                    {!(selectedTicket.category === "Complaint" && 
                       selectedTicket.complaint_type === "Major" && 
                       selectedTicket.status === "Returned") && (
                      <>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: "bold", fontSize: "0.8rem" }}>
                            Complaint Category:
                          </Typography>
                          <select
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.8rem",
                              height: "32px",
                              borderRadius: "4px",
                              border: "1px solid #ccc"
                            }}
                            value={selectedRating}
                            onChange={(e) => {
                              setSelectedRating(e.target.value);
                              if (e.target.value) {
                                handleRating(selectedTicket.id, e.target.value);
                              }
                            }}
                          >
                            <option value="">Select Category</option>
                            <option value="Minor">Minor</option>
                            <option value="Major">Major</option>
                          </select>
                        </Box>
                      </>
                    )}

                    {/* Show Forward to DG button only for Major complaints that have been reversed from head of unit */}
                    {selectedTicket.category === "Complaint" && 
                     selectedTicket.complaint_type === "Major" && 
                     selectedTicket.status === "Returned" && (
                      <>
                        <Button
                          variant="contained"
                          color="warning"
                          onClick={handleForwardToDG}
                        >
                          Forward to Director General
                        </Button>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={handleCoordinatorClose}
                        >
                          Close
                        </Button>
                      </>
                    )}

                    {/* Show regular assign/forward options for non-Major complaints or Major complaints that haven't been returned */}
                    {!(selectedTicket.category === "Complaint" && 
                       selectedTicket.complaint_type === "Major" && 
                       selectedTicket.status === "Returned") && (
                      <>
                        {selectedTicket.category === "Complaint" && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <select
                              style={{
                                padding: "4px 8px",
                                fontSize: "0.8rem",
                                height: "32px",
                                borderRadius: "4px"
                              }}
                              value={convertCategory[selectedTicket.id] || ""}
                              onChange={(e) => handleCategoryChange(selectedTicket.id, e.target.value)}
                            >
                              <option value="">Convert To</option>
                              <option value="Inquiry">Inquiry</option>
                            </select>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleConvertOrForward(selectedTicket.id)}
                            >
                              Convert
                            </Button>
                          </Box>
                        )}

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <select
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.8rem",
                              height: "32px",
                              borderRadius: "4px"
                            }}
                            value={forwardUnit[selectedTicket.id] || selectedTicket.section || selectedTicket.responsible_unit_name || ""}
                            onChange={(e) => handleUnitChange(selectedTicket.id, e.target.value)}
                          >
                            <option value="">Forward To</option>
                            {units.map((unit) => (
                              <option key={unit.name} value={unit.name}>{unit.name}</option>
                            ))}
                          </select>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleConvertOrForward(selectedTicket.id)}
                          >
                            Forward
                          </Button>
                        </Box>

                        {/* Close ticket button - only show if not a major complaint that's been returned */}
                        <Button
                          variant="contained"
                          color="success"
                          onClick={handleCoordinatorClose}
                        >
                          Close ticket
                        </Button>
                      </>
                    )}
                  </Box>
                )}

                {/* Director General Actions for Major Complaints */}
                {userRole === "director-general" && 
                 selectedTicket.category === "Complaint" && 
                 selectedTicket.complaint_type === "Major" && 
                 selectedTicket.status === "Assigned" && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2, justifyContent: "flex-end" }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => setIsDGApprovalDialogOpen(true)}
                    >
                      Review & Approve
                    </Button>
                  </Box>
                )}

                {/* Reverse and Assign buttons for roles other than agent, coordinator, attendee */}
                {!["agent", "coordinator", "attendee"].includes(localStorage.getItem("role")) && 
                 selectedTicket?.assigned_to_id === localStorage.getItem("userId") && (
                  <>
                    <Button
                      variant="contained"
                      color="warning"
                      sx={{ mr: 1 }}
                      onClick={() => setIsReverseModalOpen(true)}
                      disabled={isReversing}
                    >
                      Reverse
                    </Button>
                    <Button
                      variant="contained"
                      color="info"
                      sx={{ mr: 1 }}
                      onClick={() => setIsAssignModalOpen(true)}
                    >
                      Assign
                    </Button>
                  </>
                )}
                <Button variant="outlined" onClick={onClose}>
                  Close
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>
      {/* Assignment Flow Chart Dialog */}
      <Dialog open={isFlowModalOpen} onClose={() => setIsFlowModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Justification History</DialogTitle>
        <DialogContent>
          <AssignmentFlowChat assignmentHistory={assignmentHistory} selectedTicket={selectedTicket} />
        </DialogContent>
      </Dialog>
      {/* Attend/Resolve Dialog */}
      <Dialog open={isAttendDialogOpen} onClose={() => setIsAttendDialogOpen(false)}>
        <DialogTitle>Enter Resolution Details</DialogTitle>
        <DialogContent>
          <TextField
            label="Resolution Details"
            multiline
            rows={4}
            value={resolutionDetails}
            onChange={e => setResolutionDetails(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <input
            type="file"
            accept="*"
            onChange={e => setAttachment(e.target.files[0])}
            style={{ marginTop: 16 }}
          />
          <Box sx={{ mt: 2, textAlign: "right" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAttend}
              disabled={!resolutionDetails.trim()}
            >
              Submit
            </Button>
            <Button
              variant="outlined"
              onClick={() => setIsAttendDialogOpen(false)}
              sx={{ ml: 1 }}
            >
              Cancel
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Reviewer Close Dialog */}
      <Dialog open={isCoordinatorCloseDialogOpen} onClose={() => setIsCoordinatorCloseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Close Ticket - Resolution Details</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Resolution Type:
              </Typography>
              <select
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.9rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc"
                }}
                value={resolutionType}
                onChange={(e) => setResolutionType(e.target.value)}
              >
                <option value="">Select Resolution Type</option>
                <option value="Resolved">Resolved</option>
                <option value="Not Applicable">Not Applicable</option>
                <option value="Duplicate">Duplicate</option>
                {/* <option value="Referred">Referred</option> */}
              </select>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Resolution Details:
              </Typography>
              <TextField
                multiline
                rows={4}
                value={resolutionDetails}
                onChange={(e) => setResolutionDetails(e.target.value)}
                fullWidth
                placeholder="Enter resolution details..."
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Attachment (Optional):
              </Typography>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={(e) => setAttachment(e.target.files[0])}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.9rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc"
                }}
              />
              {attachment && (
                <Typography variant="caption" sx={{ color: "green", mt: 1, display: "block" }}>
                  File selected: {attachment.name}
                </Typography>
              )}
            </Box>

            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Button
                variant="contained"
                color="success"
                onClick={handleCoordinatorCloseSubmit}
                disabled={!resolutionType || !resolutionDetails.trim()}
              >
                Close Ticket
              </Button>
              <Button
                variant="outlined"
                onClick={() => setIsCoordinatorCloseDialogOpen(false)}
                sx={{ ml: 1 }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Reverse Modal */}
      <Dialog open={isReverseModalOpen} onClose={() => setIsReverseModalOpen(false)}>
        <DialogTitle>Reverse Ticket to Previous User</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason for Reversal"
            multiline
            rows={3}
            value={reverseReason}
            onChange={e => setReverseReason(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <Box sx={{ mt: 2, textAlign: "right" }}>
            <Button
              variant="contained"
              color="warning"
              onClick={handleReverse}
              disabled={isReversing || !reverseReason.trim()}
            >
              {isReversing ? "Reversing..." : "Confirm Reverse"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setIsReverseModalOpen(false)}
              sx={{ ml: 1 }}
              disabled={isReversing}
            >
              Cancel
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Assign Ticket Modal */}
      <Modal
        open={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        aria-labelledby="assign-ticket-modal-title"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 4,
            display: "flex",
            flexDirection: "column",
            gap: 3
          }}
        >
          <Typography id="assign-ticket-modal-title" variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Assign Ticket
          </Typography>
          <Select
            value={selectedAttendee ? selectedAttendee.id : ""}
            onChange={e => {
              const attendee = attendees.find(a => a.id === e.target.value);
              setSelectedAttendee(attendee);
            }}
            displayEmpty
            fullWidth
            sx={{ mb: 2 }}
          >
            <MenuItem value="" disabled>Select attendee</MenuItem>
            {attendees.map(a => (
              <MenuItem key={a.id} value={a.id}>{a.name} ({a.username})</MenuItem>
            ))}
          </Select>
          <TextField
            label="Assignment Reason (optional)"
            value={assignReason}
            onChange={e => setAssignReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button onClick={() => setIsAssignModalOpen(false)} disabled={assignLoading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAssignTicket}
              disabled={assignLoading}
            >
              {assignLoading ? "Assigning..." : "Confirm Assignment"}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Major Complaint Closure Dialog */}
      <Dialog open={isMajorComplaintClosureDialogOpen} onClose={() => setIsMajorComplaintClosureDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Major Complaint</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Resolution Type:
              </Typography>
              <select
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.9rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc"
                }}
                value={resolutionType}
                onChange={(e) => setResolutionType(e.target.value)}
              >
                <option value="">Select Resolution Type</option>
                <option value="Resolved">Resolved</option>
                <option value="Not Applicable">Not Applicable</option>
                <option value="Duplicate">Duplicate</option>
                {/* <option value="Referred">Referred</option> */}
              </select>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Resolution Details:
              </Typography>
              <TextField
                multiline
                rows={4}
                value={resolutionDetails}
                onChange={(e) => setResolutionDetails(e.target.value)}
                fullWidth
                placeholder="Enter resolution details..."
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Attachment (Optional):
              </Typography>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={(e) => setAttachment(e.target.files[0])}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.9rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc"
                }}
              />
              {attachment && (
                <Typography variant="caption" sx={{ color: "green", mt: 1, display: "block" }}>
                  File selected: {attachment.name}
                </Typography>
              )}
            </Box>

            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Button
                variant="contained"
                color="success"
                onClick={handleAttend}
                disabled={!resolutionType || !resolutionDetails.trim()}
              >
                Resolve Major Complaint
              </Button>
              <Button
                variant="outlined"
                onClick={() => setIsMajorComplaintClosureDialogOpen(false)}
                sx={{ ml: 1 }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Forward to DG Dialog */}
      <Dialog open={isForwardToDGDialogOpen} onClose={() => setIsForwardToDGDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Forward Major Complaint to Director General</DialogTitle>
        <DialogContent>
          {/* Display the original description from agent/attendee */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
              Original Description from Agent/Attendee:
            </Typography>
            <TextField
              multiline
              rows={4}
              value={selectedTicket?.description || ""}
              fullWidth
              disabled
              sx={{ 
                backgroundColor: '#f5f5f5',
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: '#000',
                  color: '#000'
                }
              }}
            />
          </Box>

          {/* Editable resolution details */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
              Resolution Details (Editable):
            </Typography>
            <TextField
              multiline
              rows={4}
              value={editedResolution}
              onChange={e => setEditedResolution(e.target.value)}
              fullWidth
              placeholder="Edit the resolution details from attendee..."
              sx={{ mt: 1 }}
            />
          </Box>

          <TextField
            label="Reviewer Notes (required)"
            multiline
            rows={3}
            value={coordinatorNotes}
            onChange={e => setCoordinatorNotes(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            placeholder="Add your notes about this major complaint..."
          />

          <Box sx={{ mt: 2, textAlign: "right" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleForwardToDGSubmit}
              disabled={!coordinatorNotes.trim()}
            >
              Forward to Director General
            </Button>
            <Button
              variant="outlined"
              onClick={() => setIsForwardToDGDialogOpen(false)}
              sx={{ ml: 1 }}
            >
              Cancel
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* DG Approval Dialog */}
      <Dialog open={isDGApprovalDialogOpen} onClose={() => setIsDGApprovalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Director General Approval</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
            DG Notes (optional):
          </Typography>
          <TextField
            multiline
            rows={3}
            value={dgNotes}
            onChange={e => setDgNotes(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <Typography variant="body2" sx={{ mt: 2, fontWeight: "bold" }}>
            DG Approval:
          </Typography>
          <Select
            value={dgApproved ? "Approved" : "Reversed"}
            onChange={e => setDgApproved(e.target.value === "Approved")}
            fullWidth
            sx={{ mb: 2 }}
          >
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Reversed">Reversed</MenuItem>
          </Select>
          <Box sx={{ mt: 2, textAlign: "right" }}>
            <Button
              variant="contained"
              color="success"
              onClick={handleDGApproval}
              disabled={dgApproved === null}
            >
              {dgApproved ? "Approve" : "Reject"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setIsDGApprovalDialogOpen(false)}
              sx={{ ml: 1 }}
            >
              Cancel
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
} 