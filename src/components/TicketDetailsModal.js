import React, { useState, useEffect, useRef } from "react";

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
import Alert from "@mui/material/Alert";
import CloseIcon from '@mui/icons-material/Close';
import Autocomplete from "@mui/material/Autocomplete";
import Badge from "@mui/material/Badge";
import Popper from "@mui/material/Popper";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import DialogActions from "@mui/material/DialogActions";
import InputAdornment from "@mui/material/InputAdornment";

import ChatIcon from '@mui/icons-material/Chat';
import BarChartIcon from '@mui/icons-material/BarChart';
import Download from '@mui/icons-material/Download';
import AttachFile from '@mui/icons-material/AttachFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { baseURL } from "../config";
import { PermissionManager } from "../utils/permissions";
import TicketUpdates from './ticket/TicketUpdates';
import ActionMessageModal from "./ticket/ActionMessageModal";

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
    return '';
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

// Utility function to get aging color based on time difference and action type
const getAgingColor = (dateString, action = null) => {
  // If it's a "Forwarded" action, always return green
  if (action === "Forwarded") {
    return '#28a745'; // Green for forwarded actions
  }
  
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
  // Get current user ID to check if they are the one who uploaded the attachment
  const currentUserId = localStorage.getItem("userId");
  const normalizedCategory = String(selectedTicket.category || "").toLowerCase();
  const isComplaintCategory = normalizedCategory === "complaint";
  const isReviewerManagedCategory = ["complaint", "compliment", "complement", "suggestion"].includes(normalizedCategory);
  
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

  // Check if ticket should be with reviewer
  const isWithReviewer = selectedTicket.status === "Open" && isReviewerManagedCategory;

  // Build steps array - always include "Created" step
  const steps = [
    {
      assigned_to_name: creatorName,
      assigned_to_role: "Creator",
      action: "Created",
      created_at: selectedTicket.created_at,
      assigned_to_id: "creator",
      reason: selectedTicket.description || undefined
    }
  ];

  // Always include assignment history if available (preserve ALL fields including reason)
  if (Array.isArray(assignmentHistory) && assignmentHistory.length > 0) {
    // Process assignment history to attribute reasons to the actor who performed the action (previous step)
    const processedHistory = [];
    
    for (let i = 0; i < assignmentHistory.length; i++) {
      const current = assignmentHistory[i];
      const next = assignmentHistory[i + 1];

      // Move current.reason to the previous step (actor)
      // BUT: Don't move attachment_path - keep it with the action that actually has it
      if (current.reason) {
        // Determine the previous step record to attach the reason to
        if (processedHistory.length > 0) {
          const prev = processedHistory[processedHistory.length - 1];
          prev.reason = prev.reason ? prev.reason : current.reason;
        } else {
          // First assignment: attach to creator step (if it exists)
          // For tickets closed on creation, steps array is empty, so skip this
          if (steps.length > 0 && steps[0] && !steps[0].reason) {
            steps[0].reason = current.reason;
          }
        }
      }
      
      // IMPORTANT: Don't move attachment_path to previous step - keep it with the action that has it
      // This ensures attachment stays with the user who actually uploaded it
      
      // Escalation handling is covered by generic shift above. Keep the step but without duplicating the reason
      // IMPORTANT: Keep attachment_path with the action that has it - don't copy it from other actions
      const currentWithoutReason = { ...current };
      delete currentWithoutReason.reason;
      // Ensure attachment_path stays with the action that actually has it
      // Don't copy attachment_path from previous or next actions

      // Skip "Rated" actions - ignore them completely, only show "Assigned"
      if (current.action === "Rated") {
        // Skip this step entirely - don't add it to processedHistory
        continue;
      }

      // Skip duplicate "Closed" actions (especially for tickets closed on creation)
      if (current.action === "Closed") {
        if (processedHistory.length > 0) {
          const prevStep = processedHistory[processedHistory.length - 1];
          // If previous step is also "Closed" by the same person, skip this duplicate
          if (prevStep.action === "Closed" && prevStep.assigned_to_id === current.assigned_to_id) {
            continue; // Skip duplicate "Closed" action
          }
          // If previous step is "Assigned" by the same person, consolidate
          if (prevStep.assigned_to_id === current.assigned_to_id && prevStep.action === "Assigned") {
            // Consolidate: update previous step to "Closed"
            prevStep.action = "Closed";
            prevStep.closed_at = current.created_at;
            prevStep.isConsolidated = true;
            if (current.reason) {
              prevStep.reason = current.reason;
            }
            continue; // Skip adding this Closed action separately
          }
        }
      }

      // Consolidate Assigned+Closed by same person
      if (current.action === "Assigned" && 
          next && 
          next.action === "Closed" && 
          current.assigned_to_id === next.assigned_to_id) {
        processedHistory.push({
          ...currentWithoutReason,
          action: "Closed",
          closed_at: next.created_at,
          isConsolidated: true,
          // ONLY use attachment from current (Assigned) action - don't copy from next (Closed) action
          // This ensures attachment stays with the user who actually uploaded it during Assigned action
          attachment_path: current.attachment_path, // Only use current, don't fallback to next
          reason: next.reason || current.reason || currentWithoutReason.reason
        });
        i++; // Skip the next step since consolidated
      } else {
        // For all other cases, keep attachment_path with the action that has it
        processedHistory.push(currentWithoutReason);
      }
    }

    // Use processedHistory directly (reasons already shifted to previous actors)
    steps.push(...processedHistory);
  }

  // Check if assignment history already has a reviewer assignment
  const hasReviewerInHistory = Array.isArray(assignmentHistory) && assignmentHistory.length > 0 &&
    assignmentHistory.some(a => a.assigned_to_role === "Reviewer" || a.assigned_to_role === "reviewer");

  // Add reviewer step only if applicable and not already in assignment history
  if (isWithReviewer && !hasReviewerInHistory) {
    // Add reviewer step for open complaints/compliments/suggestions only if not in history
    steps.push({
      assigned_to_name: "Reviewer",
      assigned_to_role: "Reviewer",
      action: "Currently with",
      created_at: selectedTicket.created_at,
      assigned_to_id: "reviewer"
    });
  } else if ((!assignmentHistory || assignmentHistory.length === 0) &&
             selectedTicket.assigned_to_id &&
             selectedTicket.assigned_to_id !== "creator") {
    // Fallback when no assignment history exists: show current assignee
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

  // Determine current step index for descending order
  // Current step should be the most recent assignment/reassignment (first in reversed array, index 0)
  let currentAssigneeIdx = 0;
  if (isWithReviewer && !hasReviewerInHistory) {
    // If ticket is with reviewer and not in history, the reviewer step is current (will be index 0 in reversed array)
    currentAssigneeIdx = 0;
  } else if (
    selectedTicket.status === "Open" &&
    (!selectedTicket.assigned_to_id || steps.length === 1)
  ) {
    currentAssigneeIdx = steps.length - 1; // Last step in original array (first in reversed)
  } else {
    // Find the most recent assignment, reassignment, reversed, or forwarded action
    // The most recent step (last in original array, first in reversed) should be current
    // Check if the last step (which will be first in reversed) is an assignment/reassignment/reversed/forwarded
    const lastStep = steps[steps.length - 1];
    if (lastStep && (lastStep.action === "Assigned" || lastStep.action === "Reassigned" || lastStep.action === "Reversed" || lastStep.action === "Forwarded")) {
      currentAssigneeIdx = 0; // First in reversed array (most recent)
    } else {
      // Fallback: find by assigned_to_id
      const idx = steps.findIndex(
        a => a.assigned_to_id && selectedTicket.assigned_to_id && a.assigned_to_id === selectedTicket.assigned_to_id
      );
      currentAssigneeIdx = idx !== -1 ? (steps.length - 1 - idx) : 0; // Convert to reversed index
    }
  }

  // Create reversed steps array for display
  const reversedSteps = [...steps].reverse();
  
  // (debug removed)

  return (
    <Box>
      {reversedSteps.map((a, idx) => {
        // For Closed action: show only "Closed at" and "Closed by", status shown in previous step
        const isClosedStep = a.action === "Closed" || (selectedTicket.status === "Closed" && idx === 0 && a.action === "Closed");
        
        // Determine if this is the first step (most recent) and ticket is closed
        const isFirstStep = idx === 0;
        const isClosed = selectedTicket.status === "Closed" && isFirstStep;
        // Check if this is the reviewer step that was added (not from history)
        const isCurrentWithReviewer = isWithReviewer && !hasReviewerInHistory && idx === 0 && a.action === "Currently with";

        // Set color: green for completed, blue for current, gray for pending, green for closed first step
        let color;
        
        // Check if previous step (in reversed order) is escalated
        const previousStep = reversedSteps[idx - 1];
        const isPreviousEscalated = previousStep && (previousStep.action === "Escalated" || previousStep.assigned_to_role === "Escalated");
        
        // Check if current step is escalated
        const isCurrentEscalated = a.action === "Escalated" || a.assigned_to_role === "Escalated";
        
        // Check if this step was assigned and then forwarded to someone else (not escalated)
        const wasAssignedAndForwarded = a.action === "Assigned" && previousStep && previousStep.action !== "Escalated";
        
        // Check if ticket is closed
        const isTicketClosed = selectedTicket.status === "Closed" || selectedTicket.status === "Resolved";
        
        // Priority order: Closed > Current > Forwarded > Escalated > Previous to Escalated > Assigned > Completed > Pending
        if (selectedTicket.status === "Closed" || selectedTicket.status === "Resolved" || a.isConsolidated) {
          color = "green"; // Green for all steps when ticket is closed or consolidated closed steps
        } else if (idx === currentAssigneeIdx && selectedTicket.status !== "Closed") {
          // Current step should be grey (in progress, not done yet)
          color = "gray";
        } else if (a.action === "Forwarded") {
          color = "green"; // Green for forwarded actions (completed)
        } else if (isCurrentEscalated) {
          // Check if this escalated step was followed by an assignment
          const previousStep = reversedSteps[idx - 1];
          if (previousStep && previousStep.action === "Assigned") {
            color = "green"; // Green if escalated but then assigned to next user
          } else if (previousStep && (previousStep.action === "Escalated" || previousStep.assigned_to_role === "Escalated")) {
            color = "red"; // Red if escalated again to another user
          } else {
            color = "gray"; // Gray for escalated (pending/not handled)
          }
        } else if (isPreviousEscalated) {
          color = "red"; // Red for next step when previous is escalated
        } else if (wasAssignedAndForwarded) {
          color = "green"; // Green for assigned step that was forwarded to another user
        } else if (a.action === "Assigned" && (a.assigned_to_role === "Reviewer" || a.assigned_to_role === "reviewer")) {
          // If assigned to reviewer and ticket is still open, it's gray (in progress)
          color = "gray"; // Gray for assigned to reviewer (in progress)
        } else if (a.action === "Assigned") {
          // Check if this is the current step
          if (idx === currentAssigneeIdx && selectedTicket.status !== "Closed") {
            color = "gray"; // Gray for current active step (in progress, not done yet)
          } else {
            color = "gray"; // Gray for assigned but still open
          }
        } else if (a.action === "Currently with" || (a.assigned_to_role === "Reviewer" && a.action !== "Assigned")) {
          color = "gray"; // Gray for currently with and reviewer (only if not assigned)
        } else if (idx === currentAssigneeIdx && selectedTicket.status !== "Closed") {
          color = "gray"; // Gray for current active step (in progress, not done yet)
        } else if (idx > currentAssigneeIdx || selectedTicket.status === "Closed") {
          color = "green"; // Green for completed steps or when ticket is closed
        } else {
          color = "gray"; // Gray for pending or future steps
        }

        // Set action label
        let actionLabel = a.action;
        if (isClosed) {
          actionLabel = "Closed";
        } else if (isCurrentWithReviewer) {
          actionLabel = "Currently with";
        }

        // Set who closed
        let closedBy = "";
        if (isClosedStep) {
          closedBy = a.assigned_to_name || a.assignedTo?.full_name || a.user?.full_name || a.assigned_to_id || "N/A";
        }

        // For Closed step: show "Closed at" and "Closed by" as it was originally with green styling
        if (isClosedStep) {
          const closedAt = a.created_at || a.closed_at || selectedTicket.date_of_resolution || selectedTicket.updated_at;
          return (
            <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  bgcolor: "green",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  mt: 0.5
                }}
              >
                {reversedSteps.length - idx}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "green" }}>
                  {a.assigned_to_name || a.assignedTo?.full_name || a.user?.full_name || a.assigned_to_id || "Unknown"} ({a.assigned_to_role || a.assignedTo?.role || a.user?.role || "N/A"})
                </Typography>
                <Typography variant="body2" sx={{ color: "green" }}>
                  Closed - {closedAt ? new Date(closedAt).toLocaleString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true
                  }) : "Date not available"} (Closed by: {closedBy})
                </Typography>
                {a.reason && (
                  <Box sx={{ mt: 1, p: 1.25, bgcolor: '#d4edda', borderRadius: 1, border: '1px solid #c3e6cb' }}>
                    <Typography variant="body2" sx={{ color: '#155724', fontStyle: 'italic' }}>
                      <strong>Description:</strong> {a.reason}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          );
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
              {reversedSteps.length - idx}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  {/* Show assigned_by_name (mtu aliyetuma) kama attachment ipo, si assigned_to_name (mtu aliyepokea) */}
                  {a.attachment_path && a.assigned_by_name 
                    ? `${a.assigned_by_name} (${a.assigned_by_role || "N/A"})`
                    : a.assigned_to_name || a.assignedTo?.full_name || a.user?.full_name || a.assigned_to_id || "Unknown"} ({a.attachment_path && a.assigned_by_role ? a.assigned_by_role : (a.assigned_to_role || a.assignedTo?.role || a.user?.role || "N/A")})
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
                    } else if (idx === 0) {
                      // First step (most recent) - use current time
                      endTime = new Date();
                    } else {
                      // Find the previous assignment time (in reversed order)
                      const previousAssignment = reversedSteps[idx - 1];
                      if (previousAssignment && previousAssignment.created_at) {
                        endTime = new Date(previousAssignment.created_at);
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
                        durationText = '';
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
                {idx === currentAssigneeIdx && selectedTicket.status !== "Closed" && (
                  <span style={{ color: "#1976d2", marginLeft: 8, fontWeight: "bold" }}>
                    (Current)
                  </span>
                )}
              </Typography>
              
              {/* Show description for all steps except current (unless Reversed) */}
              {a.reason && (
                !(idx === currentAssigneeIdx && selectedTicket.status !== "Closed" && a.action !== "Reversed")
              ) && (
                <Box sx={{ mt: 1, p: 1.25, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
                  <Typography variant="body2" sx={{ color: '#444', fontStyle: 'italic' }}>
                    <strong>Description:</strong> {a.reason}
                  </Typography>
                </Box>
              )}
              
              {/* Additional workflow details if available */}
              {(a.workflow_step || a.coordinator_notes || a.dg_notes) && (
                <Box sx={{ mt: 1, p: 1.5, bgcolor: '#fff3cd', borderRadius: 1, border: '1px solid #ffeaa7' }}>
                  {a.workflow_step && (
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold', color: '#856404' }}>
                      Workflow Step: {a.workflow_step}
                    </Typography>
                  )}
                  {a.coordinator_notes && (
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#856404' }}>
                      <strong>Reviewer Notes:</strong> {a.coordinator_notes}
                    </Typography>
                  )}
                  {a.dg_notes && (
                    <Typography variant="body2" sx={{ color: '#856404' }}>
                      <strong>DG Notes:</strong> {a.dg_notes}
                    </Typography>
                  )}
                </Box>
              )}
              
              {/* Attachment/Evidence link if present, else show 'No attachment' */}
              {/* Show attachment kwenye entry ya mtu ambaye alituma (assigned_by_id), si kwenye entry ya mtu ambaye alipokea (assigned_to_id) */}
              {/* IMPORTANT: Entry inaonyesha mtu ambaye alipokea (assigned_to_id), lakini attachment ina-save kwa mtu ambaye alituma (assigned_by_id) */}
              {/* Kwa hiyo, attachment inapaswa kuonekana kwenye entry ambayo assigned_by_id ya entry ni sawa na assigned_by_id ya attachment */}
              {(() => {
                // Check if this entry has attachment_path
                if (!a.attachment_path && !a.evidence_url) {
                  return (
                    <Typography variant="body2" sx={{ color: 'gray', fontStyle: 'italic' }}>
                      No attachment
                    </Typography>
                  );
                }
                
                // IMPORTANT: Entry inaonyesha mtu ambaye alipokea (assigned_to_id)
                // Lakini attachment ina-save kwa mtu ambaye alituma (assigned_by_id)
                // Kwa hiyo, attachment inapaswa kuonekana kwenye entry ambayo:
                // - Entry ina attachment_path (ya mtu aliyetuma)
                // - Entry ina assigned_by_id (mtu aliyetuma attachment)
                // Si kwenye entry ambayo assigned_to_id ni sawa na assigned_by_id ya attachment
                
                // Check: Kama entry ina attachment_path, basi attachment inaonekana kwenye entry hii
                // (kwa sababu attachment ina-save kwa assigned_by_id ya entry hii)
                // Entry inaonyesha mtu ambaye alipokea (assigned_to_id), lakini attachment ina-save kwa mtu ambaye alituma (assigned_by_id)
                // Kwa hiyo, attachment inaonekana kwenye entry hii kwa sababu entry hii ina attachment_path
                // (attachment ina-save kwa assigned_by_id ya entry hii, si assigned_to_id)
                if (a.attachment_path) {
                  // Get the name of the user who sent the attachment
                  // Strategy: Use previous step's assigned_to_name (same as other steps do for "Message from Previous")
                  // IMPORTANT: reversedSteps is reversed, so previous step in chronological order is next step (idx + 1) in reversed array
                  // For all steps, use next step's assigned_to_name (which is previous step in chronological order)
                  const nextStep = reversedSteps[idx + 1];
                  
                  // Use next step's assigned_to_name (previous step in chronological order)
                  // If no next step, use "Previous" as fallback
                  const senderName = nextStep?.assigned_to_name || 'Previous';
                  
                  return (
                    <Typography
                      variant="body2"
                      sx={{ color: '#28a745', fontStyle: 'italic', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => handleDownloadAttachment(a.attachment_path)}
                    >
                      Download attachment - Sent by {senderName}
                    </Typography>
                  );
                } else if (a.evidence_url) {
                  return (
                    <Typography variant="body2" color="primary">
                      <a href={a.evidence_url} target="_blank" rel="noopener noreferrer">
                        View Evidence
                      </a>
                    </Typography>
                  );
                } else {
                  return (
                    <Typography variant="body2" sx={{ color: 'gray', fontStyle: 'italic' }}>
                      No attachment
                    </Typography>
                  );
                }
              })()}
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
  setSnackbar = null,
  setConvertCategory = () => {},
  setForwardUnit = () => {},
  userUnitSection = null, // Add this prop for permission checking
  refreshDashboardCounts = () => {}, // Add this prop to refresh dashboard counts
}) {
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const userRole = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  
  // Initialize PermissionManager for permission checking
  const permissionManager = new PermissionManager(userRole, userUnitSection);
  
  // State for all sections (directorates and units) from mapping
  const [allSectionsList, setAllSectionsList] = useState([]);
  
  const [isAttendDialogOpen, setIsAttendDialogOpen] = useState(false);
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [fileError, setFileError] = useState("");

  // Helper function to handle file selection with size validation
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    if (file) {
      // Check file size (10MB = 10 * 1024 * 1024 bytes)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`File size exceeds the maximum limit of 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please select a smaller file.`);
        e.target.value = ''; // Clear the input
        setAttachment(null);
        return;
      }
      setFileError(''); // Clear any previous errors
      setAttachment(file);
    } else {
      setAttachment(null);
      setFileError('');
    }
  };
  
  // Reviewer-specific states
  const [resolutionType, setResolutionType] = useState("");
  const [isReviewerCloseDialogOpen, setIsReviewerCloseDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState("");
  const [ratingComment, setRatingComment] = useState("");

  // Reverse modal state
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [reverseReason, setReverseReason] = useState("");
  const [reverseResolutionType, setReverseResolutionType] = useState("");
  const [isReversing, setIsReversing] = useState(false);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const [assignReason, setAssignReason] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [attendees, setAttendees] = useState([]);

  // Reassign modal state
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedReassignAttendee, setSelectedReassignAttendee] = useState(null);
  const [reassignReason, setReassignReason] = useState("");
  const [reassignLoading, setReassignLoading] = useState(false);

  // Agent reverse inquiry modal state
  const [isAgentReverseModalOpen, setIsAgentReverseModalOpen] = useState(false);
  const [agentRecommendation, setAgentRecommendation] = useState("");
  const [complaintSeverity, setComplaintSeverity] = useState(""); // Empty to match "Select Resolution Type" option
  const [agentReverseLoading, setAgentReverseLoading] = useState(false);

  // Manager Send to Director modal state
  const [isSendToDirectorModalOpen, setIsSendToDirectorModalOpen] = useState(false);
  const [directorRecommendation, setDirectorRecommendation] = useState("");
  const [sendToDirectorLoading, setSendToDirectorLoading] = useState(false);

  // Additional loading states for other handlers
  const [attendLoading, setAttendLoading] = useState(false);
  const [dgApprovalLoading, setDgApprovalLoading] = useState(false);
  const [attendSubmitLoading, setAttendSubmitLoading] = useState(false);
  const [reviewerCloseLoading, setReviewerCloseLoading] = useState(false);
  const [forwardToDGLoading, setForwardToDGLoading] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [convertOrForwardLoading, setConvertOrForwardLoading] = useState(false);

  // Major complaint workflow states
  const [isMajorComplaintClosureDialogOpen, setIsMajorComplaintClosureDialogOpen] = useState(false);
  const [isForwardToDGDialogOpen, setIsForwardToDGDialogOpen] = useState(false);
  const [isDGApprovalDialogOpen, setIsDGApprovalDialogOpen] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [editedResolution, setEditedResolution] = useState("");
  const [dgNotes, setDgNotes] = useState("");
  const [previousAssignerDescription, setPreviousAssignerDescription] = useState("");
  const [previousAssignerAttachment, setPreviousAssignerAttachment] = useState(null);
  const [ownDescription, setOwnDescription] = useState(""); // Director/Head-of-unit's own description
  const [lastAttendeeAgentDescription, setLastAttendeeAgentDescription] = useState(""); // Last attendee/agent description (for director only)

  // Ticket Updates toggle state
  const [showTicketUpdates, setShowTicketUpdates] = useState(false);
  const [unreadUpdatesCount, setUnreadUpdatesCount] = useState(0);
  
  // Ticket Charts (Messages) state
  const [showTicketCharts, setShowTicketCharts] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // @ Mention states for Ticket Charts
  const [mentionUsers, setMentionUsers] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionAnchorEl, setMentionAnchorEl] = useState(null);
  const messageTextFieldRef = useRef(null);
  
  // Reversed ticket editing states
  const [isEditReversedTicketDialogOpen, setIsEditReversedTicketDialogOpen] = useState(false);
  const [editReversedTicketLoading, setEditReversedTicketLoading] = useState(false);
  const [editReversedTicketData, setEditReversedTicketData] = useState({
    subject: "",
    section: "",
    sub_section: "",
    responsible_unit_id: "",
    responsible_unit_name: ""
  });
  const [functionData, setFunctionData] = useState([]);
  const [directoratesAndUnits, setDirectoratesAndUnits] = useState([]); // For Directorate/Unit dropdown
  const [selectedDirectorateUnit, setSelectedDirectorateUnit] = useState(""); // Selected Directorate/Unit
  const [availableSections, setAvailableSections] = useState([]); // Sections within selected Directorate/Unit
  const [selectedSection, setSelectedSection] = useState(""); // Selected Section
  const [availableSubjects, setAvailableSubjects] = useState([]); // Subjects within selected Section
  
  // Action feedback modal (same style as create-ticket popup)
  const [actionModal, setActionModal] = useState({ isOpen: false, type: "info", message: "" });
  const actionModalAfterCloseRef = useRef(null);

  // Keep the old function name so we can swap implementations with minimal edits
  const showSnackbar = (message, severity = "info", afterClose = null) => {
    actionModalAfterCloseRef.current = typeof afterClose === "function" ? afterClose : null;
    setActionModal({ isOpen: true, type: severity, message });
  };

  const closeSnackbar = () => {
    setActionModal((prev) => ({ ...prev, isOpen: false }));
    const afterClose = actionModalAfterCloseRef.current;
    actionModalAfterCloseRef.current = null;
    if (afterClose) afterClose();
  };

  // Function to check if current user was previously assigned to this ticket
  const wasPreviouslyAssigned = () => {
    if (!assignmentHistory || !Array.isArray(assignmentHistory) || assignmentHistory.length === 0) {
      return false;
    }
    
    // Check if current user appears in assignment history as assigned_to_id or assigned_by_id
    // but is not currently assigned to the ticket
    return assignmentHistory.some(assignment => 
      (assignment.assigned_to_id === userId || assignment.assigned_by_id === userId) && 
      selectedTicket?.assigned_to_id !== userId
    );
  };

  // Function to check if user has reassign permission (focal-person, manager, or head-of-unit role)
  const hasReassignPermission = () => {
    const userRole = localStorage.getItem("role");
    return userRole === "focal-person" || userRole === "manager" || userRole === "head-of-unit";
  };

  // Function to check if ticket came from a manager (most recent assignment was to a manager)
  const cameFromManager = () => {
    if (!assignmentHistory || !Array.isArray(assignmentHistory) || assignmentHistory.length === 0) {
      return false;
    }
    
    // Get the most recent assignment (last in array)
    const mostRecentAssignment = assignmentHistory[assignmentHistory.length - 1];
    
    // Check if the most recent assignment was to a manager
    return mostRecentAssignment?.assigned_to_role === "manager" || 
           mostRecentAssignment?.assigned_to_role === "Manager";
  };

  // Initialize selectedRating when modal opens
  useEffect(() => {
    if (selectedTicket) {
      setSelectedRating(selectedTicket.complaint_type || "");
      
      // Initialize forwardUnit with section (if directorate) or sub_section (if unit)
      if (selectedTicket.id && setForwardUnit && !forwardUnit[selectedTicket.id]) {
        // Check if it's a directorate based on section name
        const isDirectorate = selectedTicket.section && (
          selectedTicket.section.includes('Directorate') || 
          selectedTicket.section.includes('directorate')
        );
        
        // Determine the value to use: section for directorate, sub_section for unit
        let initialValue = null;
        if (isDirectorate && selectedTicket.section) {
          initialValue = selectedTicket.section;
        } else if (!isDirectorate && selectedTicket.sub_section) {
          initialValue = selectedTicket.sub_section;
        } else if (selectedTicket.responsible_unit_name) {
          initialValue = selectedTicket.responsible_unit_name;
        } else if (selectedTicket.section && !selectedTicket.section.toLowerCase().includes('unit')) {
          initialValue = selectedTicket.section;
        }
        
        // Set the initial value if we have one
        if (initialValue) {
          setForwardUnit((prev) => ({
            ...prev,
            [selectedTicket.id]: initialValue
          }));
        }
      }
    }
  }, [selectedTicket, allSectionsList, forwardUnit, setForwardUnit]);

  // Fetch all sections (directorates and units) from units-data and functions
  useEffect(() => {
    const fetchAllSections = async () => {
      try {
        const token = localStorage.getItem("authToken");
        
        // Fetch from units-data endpoint (now includes units from functions)
        const sectionsResponse = await fetch(`${baseURL}/section/units-data`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (sectionsResponse.ok) {
          const sectionsData = await sectionsResponse.json();
          // Get sections from units-data (includes directorates and units from functions)
          const allSections = sectionsData.data || [];
          console.log("DEBUG: Sections from units-data:", allSections.length, allSections.map(s => s.name));
          
          setAllSectionsList(allSections);
        } else {
          console.error("Failed to fetch sections from units-data");
        }
      } catch (error) {
        console.error("Error fetching sections from mapping:", error);
      }
    };
    
    // Fetch sections when modal opens (for reviewer role)
    if (open && userRole === "reviewer") {
      fetchAllSections();
    }
  }, [open, userRole]);

  // Fetch unread updates count when ticket opens
  useEffect(() => {
    const fetchUnreadUpdatesCount = async () => {
      if (!selectedTicket?.id || !open) {
        setUnreadUpdatesCount(0);
        return;
      }

      try {
        const token = localStorage.getItem('authToken');
        // Use the new unread count endpoint
        const response = await fetch(`${baseURL}/ticket-updates/ticket/${selectedTicket.id}/unread-count`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const unreadCount = data.data?.unreadCount || 0;
          
          console.log('DEBUG: Unread updates count:', unreadCount);
          setUnreadUpdatesCount(unreadCount);
        } else {
          console.error('Failed to fetch unread count:', response.status);
          setUnreadUpdatesCount(0);
        }
      } catch (error) {
        console.error('Error fetching unread updates count:', error);
        setUnreadUpdatesCount(0);
      }
    };

    fetchUnreadUpdatesCount();
    fetchUnreadMessagesCount();
    
    // Set up interval to refresh unread messages count every 30 seconds
    const intervalId = setInterval(() => {
      if (open && selectedTicket?.id) {
        fetchUnreadMessagesCount();
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [selectedTicket?.id, open]);

  // Auto-refresh messages when modal is open
  useEffect(() => {
    if (!showTicketCharts || !selectedTicket?.id) return;

    // Fetch messages immediately when modal opens
    fetchTicketMessages();

    // Set up interval to refresh messages every 5 seconds when modal is open
    const messagesIntervalId = setInterval(() => {
      fetchTicketMessages();
    }, 5000);

    return () => clearInterval(messagesIntervalId);
  }, [showTicketCharts, selectedTicket?.id]);

  // Mark updates as read when updates dialog is opened
  const handleOpenTicketUpdates = () => {
    setIsFlowModalOpen(true);
    // Mark all updates as read when dialog opens
    if (selectedTicket?.id && unreadUpdatesCount > 0) {
      markUpdatesAsRead();
    }
  };

  // Handle opening Ticket Charts modal
  const handleOpenTicketCharts = () => {
    setShowTicketCharts(true);
    // Fetch messages when opening
    fetchTicketMessages();
    // Fetch mention users
    if (selectedTicket?.id) {
      fetchMentionUsers();
    }
    // Mark all messages as read when dialog opens
    if (selectedTicket?.id && unreadMessagesCount > 0) {
      markMessagesAsRead();
    }
  };

  // Fetch mention users for Ticket Charts
  const fetchMentionUsers = async () => {
    if (!selectedTicket?.id) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${baseURL}/ticket/${selectedTicket.id}/mention-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMentionUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching mention users:', error);
    }
  };

  // Handle @ mention detection for messages
  const handleMessageTextChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setNewMessage(value);
    
    // Check for @ mention
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if there's a newline, punctuation, or another @ (meaning mention is complete)
      if (textAfterAt.includes('\n') || textAfterAt.match(/^[,.!?@]/)) {
        setShowMentions(false);
        return;
      }
      
      // Get query after @ (allow spaces for full names)
      const query = textAfterAt.toLowerCase().trim();
      setMentionQuery(query);
      
      // Show mentions dropdown
      if (messageTextFieldRef.current) {
        setMentionAnchorEl(messageTextFieldRef.current);
      }
      setShowMentions(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  // Filter mention users based on query
  const filteredMentionUsers = mentionUsers.filter(user => {
    if (!mentionQuery) return true;
    const query = mentionQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  // Handle mention selection for messages
  const handleMentionSelect = (user) => {
    const currentText = newMessage;
    const cursorPosition = messageTextFieldRef.current?.selectionStart || 0;
    const textBeforeCursor = currentText.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textBeforeAt = currentText.substring(0, lastAtIndex);
      const textAfterCursor = currentText.substring(cursorPosition);
      const mentionText = `@${user.name} `;
      const newText = textBeforeAt + mentionText + textAfterCursor;
      
      setNewMessage(newText);
      setShowMentions(false);
      setMentionQuery('');
      
      // Set cursor position after mention
      setTimeout(() => {
        if (messageTextFieldRef.current) {
          const newCursorPos = lastAtIndex + mentionText.length;
          messageTextFieldRef.current.setSelectionRange(newCursorPos, newCursorPos);
          messageTextFieldRef.current.focus();
        }
      }, 0);
    }
  };

  // Handle keyboard navigation in mentions for messages
  const handleMentionKeyDown = (e) => {
    if (!showMentions || filteredMentionUsers.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIndex(prev => 
        prev < filteredMentionUsers.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIndex(prev => 
        prev > 0 ? prev - 1 : filteredMentionUsers.length - 1
      );
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        // Don't prevent default if it's Enter without shift (will send message)
        return;
      }
      e.preventDefault();
      if (filteredMentionUsers[selectedMentionIndex]) {
        handleMentionSelect(filteredMentionUsers[selectedMentionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  // Parse text and highlight mentions for messages
  const parseMentions = (text) => {
    if (!text) return null;
    
    // Regex to match @mentions - exactly two words after @
    const mentionRegex = /@(\S+\s+\S+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }
      
      parts.push({
        type: 'mention',
        content: match[0],
        username: match[1]
      });
      
      lastIndex = mentionRegex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }
    
    if (parts.length === 0) {
      return [{ type: 'text', content: text }];
    }
    
    return parts;
  };

  // Render text with mentions highlighted for messages
  const renderMessageWithMentions = (text) => {
    const parts = parseMentions(text);
    
    if (!parts || parts.length === 0) {
      return <span>{text}</span>;
    }
    
    return (
      <>
        {parts.map((part, index) => {
          if (part.type === 'mention') {
            return (
              <Box
                key={index}
                component="span"
                sx={{
                  color: '#1976d2',
                  fontWeight: 600,
                  backgroundColor: '#e3f2fd',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  margin: '0 2px'
                }}
              >
                {part.content}
              </Box>
            );
          }
          return <span key={index}>{part.content}</span>;
        })}
      </>
    );
  };

  // Fetch ticket messages
  const fetchTicketMessages = async () => {
    if (!selectedTicket?.id) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${baseURL}/ticket-charts/ticket/${selectedTicket.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const messages = data.data || data.messages || [];
        setTicketMessages(messages);
        // Auto-scroll to bottom after messages are loaded
        setTimeout(() => {
          const container = document.getElementById('messages-container');
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }, 100);
      } else {
        console.error('Failed to fetch messages:', response.status);
        setTicketMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setTicketMessages([]);
    }
  };

  // Send new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket?.id || sendingMessage) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${baseURL}/ticket-charts/ticket/${selectedTicket.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: newMessage.trim(),
          user_id: userId
        })
      });

      if (response.ok) {
        setNewMessage("");
        // Refresh messages
        await fetchTicketMessages();
        // Refresh unread count
        await fetchUnreadMessagesCount();
        // Auto-scroll to bottom after sending
        setTimeout(() => {
          const container = document.getElementById('messages-container');
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }, 100);
      } else {
        const error = await response.json();
        showSnackbar(error.message || 'Failed to send message', 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showSnackbar('Error sending message', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async () => {
    if (!selectedTicket?.id) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${baseURL}/ticket-charts/ticket/${selectedTicket.id}/mark-all-as-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setUnreadMessagesCount(0);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Fetch unread messages count
  const fetchUnreadMessagesCount = async () => {
    if (!selectedTicket?.id || !open) {
      setUnreadMessagesCount(0);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${baseURL}/ticket-charts/ticket/${selectedTicket.id}/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const unreadCount = data.data?.unreadCount || data.unreadCount || 0;
        setUnreadMessagesCount(unreadCount);
      } else {
        setUnreadMessagesCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread messages count:', error);
      setUnreadMessagesCount(0);
    }
  };

  // Function to mark all updates as read
  const markUpdatesAsRead = async () => {
    if (!selectedTicket?.id) return;

    try {
      const token = localStorage.getItem('authToken');
      // Use the new mark all as read endpoint
      const response = await fetch(`${baseURL}/ticket-updates/ticket/${selectedTicket.id}/mark-all-as-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Marked', data.data?.count || 0, 'updates as read');
        // Reset unread count
        setUnreadUpdatesCount(0);
      } else {
        console.error('Failed to mark updates as read:', response.status);
      }
    } catch (error) {
      console.error('Error marking updates as read:', error);
    }
  };

  // Check if ticket came from head of unit (for attendee to see buttons)
  const hasAssignmentHistory = assignmentHistory && assignmentHistory.length > 0;
  const cameFromHeadOfUnit = hasAssignmentHistory && 
    assignmentHistory.some(assignment => 
      assignment.assigned_by_role === "head-of-unit" || 
      assignment.assigned_to_role === "head-of-unit"
    );
  const isFromHeadOfUnit = cameFromHeadOfUnit || 
    (selectedTicket?.responsible_unit_name && 
     !selectedTicket.responsible_unit_name.toLowerCase().includes("directorate"));

  const showAttendButton =
    selectedTicket &&
    selectedTicket.status !== "Closed" &&
    selectedTicket.assigned_to_id &&
    String(selectedTicket.assigned_to_id) === String(userId) &&
    // Allow these roles to attend tickets
    (userRole === "agent" || 
     userRole === "attendee" || 
     userRole === "focal-person" || 
     userRole === "claim-focal-person" || 
     userRole === "compliance-focal-person" || 
     userRole === "head-of-unit" || 
     userRole === "supervisor" || 
     userRole === "manager" ||
     userRole === "director" ||
     userRole === "reviewer") &&
    // Exclude these roles
    userRole !== "director-general" &&
    // Hide attend button for attendee/agent if complaint_type is Minor or Major
    !((userRole === "attendee" || userRole === "agent") && 
      (selectedTicket.complaint_type === "Minor" || selectedTicket.complaint_type === "Major")) &&
    (
      // For director: show attend button for Minor status
      (userRole === "director" && selectedTicket.complaint_type === "Minor") ||
      // For attendee: show attend button for normal tickets (Inquiry/other non-complaint categories)
      (userRole === "attendee" && selectedTicket.category !== "Complaint") ||
      // For agent: show attend button for normal tickets (Inquiry/other non-complaint categories)
      (userRole === "agent" && selectedTicket.category !== "Complaint") ||
      // For head-of-unit: show attend button only for Minor complaints
      (userRole === "head-of-unit" && selectedTicket.complaint_type === "Minor") ||
      // For non-directors, non-attendees, non-agents, and non-head-of-unit: existing logic
      (userRole !== "director" && userRole !== "attendee" && userRole !== "agent" && userRole !== "head-of-unit" && (
        // For non-managers, only allow if ticket is not rated
        (userRole === "manager" || !selectedTicket.complaint_type) &&
        // For managers, hide attend button if priority is "Major" or "Minor"
        !(userRole === "manager" && (selectedTicket.complaint_type === "Major" || selectedTicket.complaint_type === "Minor"))
      ))
    );

  // Reviewer-specific conditions
    const showReviewerActions =
    userRole === "reviewer" && 
    selectedTicket && 
    selectedTicket.assigned_to_id &&
    String(selectedTicket.assigned_to_id) === String(userId) &&
    selectedTicket.status !== "Closed";

  // Debug close permission for reviewers (only for specific categories)
  const reviewerDebugCategories = ["Complaint", "Compliment", "Suggestion"];
  if (
    userRole === "reviewer" &&
    selectedTicket &&
    reviewerDebugCategories.includes(String(selectedTicket.category || "").toLowerCase())
  ) {
    permissionManager.debugClosePermission(selectedTicket);
  }

  const handleAttend = async () => {
    // Don't submit if there's a file error
    if (fileError) {
      showSnackbar('File size exceeds the maximum limit of 10MB. Your file is 362.28MB. Please fix the file error before submitting', 'error');
      return;
    }

    // Check file size before submitting (10MB = 10 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (attachment && attachment.size > MAX_FILE_SIZE) {
      const errorMsg = `Ticket cannot be submitted because file is too large. Maximum file size is 10MB. Your file is ${(attachment.size / (1024 * 1024)).toFixed(2)}MB. Please select a smaller file.`;
      setFileError(errorMsg);
      showSnackbar(errorMsg, 'error');
      return;
    }
    
    setAttendLoading(true);
    try {
      console.log('DEBUG handleAttend:', {
        userRole,
        complaintType: selectedTicket?.complaint_type,
        isManager: userRole === "manager",
        isMajor: selectedTicket?.complaint_type === "Major",  
        shouldUseManagerAPI: userRole === "manager" && selectedTicket?.complaint_type === "Major",
        selectedTicketId: selectedTicket?.id,
        selectedTicketStatus: selectedTicket?.status,
        selectedTicketCategory: selectedTicket?.category
      });

      // Special handling for managers - always use manager route
      if (userRole === "manager") {
        console.log('DEBUG: Using manager attend API for manager role');
        // For managers, always use the manager attend route
        const response = await fetch(`${baseURL}/ticket/${selectedTicket.id}/manager-attend-major`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("authToken")}`
          },
          body: JSON.stringify({
            userId: userId,
            recommendation: resolutionDetails,
            evidence_url: attachment ? `${baseURL}/ticket/attachment/${attachment.name}` : null,
            responsible_unit_name: selectedTicket.responsible_unit_name || userUnitSection
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          showSnackbar(error.message || 'Failed to submit recommendation', 'error');
          return;
        }
        
        showSnackbar('Recommendation submitted! Ticket sent to Head of Unit for review.', 'success');
        setIsAttendDialogOpen(false); // Close the attend dialog
        refreshTickets(); // Refresh to update ticket state
        // Don't close the main modal - let user see the updated state
        return;
      }
      
      console.log('DEBUG: Using default workflow API - not a manager');
      console.log('DEBUG: userRole value:', userRole);
      console.log('DEBUG: complaint_type value:', selectedTicket.complaint_type);
      console.log('DEBUG: ticket category:', selectedTicket.category);
      
      // For Inquiry tickets, use close endpoint directly
      if (selectedTicket.category === 'Inquiry') {
        console.log('DEBUG: Inquiry ticket - using close endpoint');
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
              "Authorization": `Bearer ${token}`
              // Do NOT set Content-Type; browser will set it for FormData
            },
            body: formData
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          showSnackbar(errorData.message || 'Failed to close ticket', 'error');
          return;
        }
        
        showSnackbar('Inquiry ticket closed successfully', 'success');
        setIsAttendDialogOpen(false); // Close the attend dialog
        refreshTickets(); // Refresh to update ticket state
        onClose(); // Close the modal to refresh the list
        return;
      }
      
      // Default workflow for other roles (Complaint tickets)
      const response = await fetch(`${baseURL}/workflow/${selectedTicket.id}/attend-and-recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify({
          recommendation: resolutionDetails,
          evidence_url: attachment ? `${baseURL}/ticket/attachment/${attachment.name}` : null
        })
      });
      if (!response.ok) {
        const error = await response.json();
        showSnackbar(error.message || 'Failed to submit recommendation', 'error');
        return;
      }
      showSnackbar('Recommendation submitted! The Head of Unit will review it next.', 'success');
      setIsAttendDialogOpen(false); // Close the attend dialog
      refreshTickets(); // Refresh to update ticket state
      // Don't close the main modal - let user see the updated state
    } catch (err) {
      showSnackbar('Network error: ' + err.message, 'error');
    } finally {
      setAttendLoading(false);
    }
  };

  // Forward to Director General handler
  const handleForwardToDG = () => {
    // Get previous assigner's description/resolution details from assignment history
    let previousAssignerDescription = "";
    let previousAssignerAttachment = null;
    
    if (assignmentHistory && Array.isArray(assignmentHistory) && assignmentHistory.length > 0) {
      // For director: find manager's description (previous assigner)
      // For head-of-unit: find attendee's description (previous assigner)
      const currentUserRole = userRole;
      
      // Find the most recent assignment where the current user was assigned
      // Then find the previous assignment (the one that assigned to current user)
      for (let i = assignmentHistory.length - 1; i >= 0; i--) {
        const assignment = assignmentHistory[i];
        
        // Check if this assignment was to the current user
        if (assignment.assigned_to_id && String(assignment.assigned_to_id) === String(userId)) {
          // Find the previous assignment (the one that assigned to current user)
          if (i > 0) {
            const previousAssignment = assignmentHistory[i - 1];
            // Get description from previous assigner's reason or resolution_details
            previousAssignerDescription = previousAssignment.reason || previousAssignment.resolution_details || "";
            previousAssignerAttachment = previousAssignment.attachment_path || null;
          }
          break;
        }
      }
      
      // If not found above, try to find by role
      // For director: look for manager assignment
      // For head-of-unit: look for attendee assignment
      if (!previousAssignerDescription) {
        for (let i = assignmentHistory.length - 1; i >= 0; i--) {
          const assignment = assignmentHistory[i];
          
          if (currentUserRole === "director" && assignment.assigned_by_role === "manager") {
            previousAssignerDescription = assignment.reason || "";
            previousAssignerAttachment = assignment.attachment_path || null;
            break;
          } else if (currentUserRole === "head-of-unit" && assignment.assigned_by_role === "attendee") {
            previousAssignerDescription = assignment.reason || "";
            previousAssignerAttachment = assignment.attachment_path || null;
            break;
          }
        }
      }
    }
    
    // Initialize edited resolution with creator's description (ticket's original description)
    let initialResolution = selectedTicket?.description || selectedTicket?.resolution_details || "";
    
    // Store creator's description and attachment for display in modal
    setPreviousAssignerDescription(selectedTicket?.description || "");
    setPreviousAssignerAttachment(selectedTicket?.attachment_path || null);
    
    // Initialize edited creator's description (editable)
    setEditedResolution(initialResolution);
    
    // Initialize director/head-of-unit's own description (separate field)
    // IMPORTANT: Director's own description should be NEW - do NOT take previous director-general description
    // Always start with empty - director will write their own new description
    // Do not pre-fill with any previous assignment, especially not director-general's
    setOwnDescription("");
    
    // For director and head-of-unit: find last attendee/agent description
    // For director: find attendee's description that was sent to the manager (who assigned to director)
    // For head-of-unit: find attendee's description that was sent to head-of-unit
    let lastAttendeeAgentDesc = "";
    if ((userRole === "director" || userRole === "head-of-unit") && assignmentHistory && Array.isArray(assignmentHistory) && assignmentHistory.length > 0) {
      if (userRole === "director") {
        // Find the manager who assigned to the director
        let managerId = null;
        for (let i = assignmentHistory.length - 1; i >= 0; i--) {
          const assignment = assignmentHistory[i];
          if (assignment.assigned_to_id && String(assignment.assigned_to_id) === String(userId) && assignment.assigned_by_role === "manager") {
            managerId = assignment.assigned_by_id;
            break;
          }
        }
        
        // Now find the attendee/agent assignment that was sent to this manager
        // Look for assignments where attendee/agent assigned TO the manager
        if (managerId) {
          for (let i = assignmentHistory.length - 1; i >= 0; i--) {
            const assignment = assignmentHistory[i];
            if ((assignment.assigned_by_role === "attendee" || assignment.assigned_by_role === "agent") && 
                assignment.assigned_to_id && String(assignment.assigned_to_id) === String(managerId)) {
              lastAttendeeAgentDesc = assignment.reason || "";
              break;
            }
          }
        }
      } else if (userRole === "head-of-unit") {
        // For head-of-unit: find attendee's description that was sent to head-of-unit
        // Look for assignments where attendee/agent assigned TO the head-of-unit
        for (let i = assignmentHistory.length - 1; i >= 0; i--) {
          const assignment = assignmentHistory[i];
          if ((assignment.assigned_by_role === "attendee" || assignment.assigned_by_role === "agent") &&
              assignment.assigned_to_id && String(assignment.assigned_to_id) === String(userId)) {
            lastAttendeeAgentDesc = assignment.reason || "";
            break;
          }
        }
      }
    }
    setLastAttendeeAgentDescription(lastAttendeeAgentDesc || "");
    
    setIsForwardToDGDialogOpen(true);
  };

  // Director General approval dialog handler
  const handleDGApprovalDialog = () => {
    setDgNotes("");
    setAttachment(null);
    setIsDGApprovalDialogOpen(true);
  };

  // Director General close ticket handler
  const handleDGCloseTicket = async () => {
    if (!dgNotes || !dgNotes.trim()) {
      showSnackbar('Please provide justification before closing the ticket', 'warning');
      return;
    }

    // Don't submit if there's a file error
    if (fileError) {
      showSnackbar('File size exceeds the maximum limit of 10MB. Your file is 362.28MB. Please fix the file error before submitting', 'error');
      return;
    }

    // Check file size before submitting (10MB = 10 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (attachment && attachment.size > MAX_FILE_SIZE) {
      const errorMsg = `Ticket cannot be submitted because file is too large. Maximum file size is 10MB. Your file is ${(attachment.size / (1024 * 1024)).toFixed(2)}MB. Please select a smaller file.`;
      setFileError(errorMsg);
      showSnackbar(errorMsg, 'error');
      return;
    }

    setDgApprovalLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("status", "Closed");
      formData.append("resolution_details", dgNotes.trim());
      formData.append("date_of_resolution", new Date().toISOString());
      formData.append("userId", userId);
      
      if (attachment) {
        formData.append("attachment", attachment);
      }
      
      const response = await fetch(
        `${baseURL}/ticket/${selectedTicket.id}/close`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
            // Do NOT set Content-Type; browser will set it for FormData
          },
          body: formData
        }
      );

      if (response.ok) {
        setIsDGApprovalDialogOpen(false);
        setAttachment(null);
        showSnackbar('Ticket closed successfully by Director General', 'success', () => {
          refreshTickets();
          onClose();
        });
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.message || 'Failed to close ticket', 'error');
      }
    } catch (error) {
      console.error("Error closing ticket:", error);
      showSnackbar('Error closing ticket: ' + error.message, 'error');
    } finally {
      setDgApprovalLoading(false);
    }
  };

  const handleAttendSubmit = async () => {
    // Don't submit if there's a file error
    if (fileError) {
      showSnackbar('File size exceeds the maximum limit of 10MB. Your file is 362.28MB. Please fix the file error before submitting', 'error');
      return;
    }

    // Check file size before submitting (10MB = 10 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (attachment && attachment.size > MAX_FILE_SIZE) {
      const errorMsg = `Ticket cannot be submitted because file is too large. Maximum file size is 10MB. Your file is ${(attachment.size / (1024 * 1024)).toFixed(2)}MB. Please select a smaller file.`;
      setFileError(errorMsg);
      showSnackbar(errorMsg, 'error');
      return;
    }

    setAttendSubmitLoading(true);
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
            "Authorization": `Bearer ${token}`
            // Do NOT set Content-Type; browser will set it for FormData
          },
          body: formData
        }
      );
      if (response.ok) {
        setIsAttendDialogOpen(false);
        showSnackbar('Ticket closed successfully', 'success', () => {
          refreshTickets();
          onClose();
        });
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.message || 'Failed to close ticket', 'error');
      }
    } catch (error) {
      showSnackbar('Error closing ticket: ' + error.message, 'error');
    } finally {
      setAttendSubmitLoading(false);
    }
  };

  const handleReviewerClose = () => {
    setIsReviewerCloseDialogOpen(true);
  };

  const handleReviewerCloseSubmit = async () => {
    if (!resolutionType || !resolutionDetails) {
      alert("Please provide both resolution type and details");
      return;
    }

    // Don't submit if there's a file error
    if (fileError) {
      showSnackbar('File size exceeds the maximum limit of 10MB. Your file is 362.28MB. Please fix the file error before submitting', 'error');
      return;
    }

    // Check file size before submitting (10MB = 10 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (attachment && attachment.size > MAX_FILE_SIZE) {
      const errorMsg = `Ticket cannot be submitted because file is too large. Maximum file size is 10MB. Your file is ${(attachment.size / (1024 * 1024)).toFixed(2)}MB. Please select a smaller file.`;
      setFileError(errorMsg);
      showSnackbar(errorMsg, 'error');
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      showSnackbar('Authentication token not found. Please log in again.', 'error');
      return;
    }

    setReviewerCloseLoading(true);
    try {
      // Use the same close endpoint for both attend and close actions
      const formData = new FormData();
      formData.append("status", "Closed");
      formData.append("resolution_type", resolutionType);
      formData.append("resolution_details", resolutionDetails);
      formData.append("date_of_resolution", new Date().toISOString());
      formData.append("userId", userId);
      
      if (attachment) {
        formData.append("attachment", attachment);
      }

      // Use the close endpoint for all roles (same as reviewer close)
      const endpoint = `${baseURL}/ticket/${selectedTicket.id}/close`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setIsReviewerCloseDialogOpen(false);
        const actionMessage = userRole === "reviewer" ? 'Ticket closed successfully by Reviewer' : 'Ticket attended successfully';
        showSnackbar(actionMessage, 'success', () => {
          refreshTickets();
          onClose();
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to process ticket' }));
        throw new Error(errorData.message || errorData.error || "Failed to process ticket");
      }
    } catch (error) {
      console.error("Error processing action:", error);
      showSnackbar('Error processing action: ' + error.message, 'error');
    } finally {
      setReviewerCloseLoading(false);
    }
  };

  // Reverse handler
  const handleReverse = async () => {
    // Don't submit if there's a file error
    if (fileError) {
      showSnackbar('File size exceeds the maximum limit of 10MB. Your file is 362.28MB. Please fix the file error before submitting', 'error');
      return;
    }

    // Check file size before submitting (10MB = 10 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (attachment && attachment.size > MAX_FILE_SIZE) {
      const errorMsg = `Ticket cannot be submitted because file is too large. Maximum file size is 10MB. Your file is ${(attachment.size / (1024 * 1024)).toFixed(2)}MB. Please select a smaller file.`;
      setFileError(errorMsg);
      showSnackbar(errorMsg, 'error');
      return;
    }

    setIsReversing(true);
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("userId", userId);
      
      // Use resolution details as reason, with resolution type prefix
      const fullReason = reverseResolutionType ? 
        `[${reverseResolutionType}] ${reverseReason}` : 
        reverseReason;
      formData.append("reason", fullReason);
      // Also send description field for backend to use
      formData.append("description", reverseReason);
      formData.append("status", "reversing");
      
      if (attachment) {
        formData.append("attachment", attachment);
      }

      const response = await fetch(`${baseURL}/ticket/${selectedTicket.id}/reverse`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
          // Do NOT set Content-Type; browser will set it for FormData
        },
        body: formData
      });
      
      const data = await response.json();
      if (response.ok) {
        showSnackbar(data.message, "success", () => {
          refreshTickets();
          onClose();
        });
        setIsReverseModalOpen(false);
        setReverseReason("");
        setReverseResolutionType("");
        setAttachment(null);
      } else {
        showSnackbar(data.message, "error");
      }
    } catch (error) {
      showSnackbar(error.message, "error");
    } finally {
      setIsReversing(false);
    }
  };

  // Handle opening the edit reversed ticket dialog
  const handleEditReversedTicket = () => {
    // Initialize form data with current ticket values
    const currentSection = selectedTicket.section || "";
    const currentSubSection = selectedTicket.sub_section || "";
    const currentResponsibleUnit = selectedTicket.responsible_unit_name || "";
    
    setEditReversedTicketData({
      subject: selectedTicket.subject || "",
      section: currentSection,
      sub_section: currentSubSection,
      responsible_unit_id: selectedTicket.responsible_unit_id || "",
      responsible_unit_name: currentResponsibleUnit
    });
    
    // Initialize selected directorate/unit and section based on current ticket
    setSelectedDirectorateUnit(currentResponsibleUnit || currentSection || "");
    setSelectedSection(currentSubSection || "");
    
    setIsEditReversedTicketDialogOpen(true);
  };

  // Handle Directorate/Unit selection
  const handleDirectorateUnitChange = (value) => {
    setSelectedDirectorateUnit(value);
    setSelectedSection("");
    setEditReversedTicketData(prev => ({
      ...prev,
      section: value,
      sub_section: "",
      responsible_unit_id: "",
      responsible_unit_name: value
    }));
    
    // Find the selected directorate/unit object to check if it's a section or function
    const selectedItem = directoratesAndUnits.find(item => item.name === value);
    const isFunction = selectedItem && selectedItem.section_id; // If it has section_id, it's a function (unit)
    
    // Filter sections (functions) for the selected directorate/unit
    if (value && functionData.length > 0) {
      let sectionsForDirectorate = [];
      
      if (isFunction) {
        // If selected is a unit (function), show functions with same name or id
        sectionsForDirectorate = functionData
          .filter(item => {
            const functionId = item.function?.id;
            const functionName = item.function?.name || "";
            return functionId === selectedItem.id || functionName === value;
          })
          .map(item => ({
            id: item.function?.id,
            name: item.function?.name || "",
            section: item.function?.section?.name || ""
          }))
          .filter((item, index, self) => 
            item.name && index === self.findIndex(t => t.name === item.name)
          );
      } else {
        // If selected is a directorate (section), show all functions within that section
        sectionsForDirectorate = functionData
          .filter(item => {
            const sectionName = item.function?.section?.name || "";
            return sectionName === value;
          })
          .map(item => ({
            id: item.function?.id,
            name: item.function?.name || "",
            section: item.function?.section?.name || ""
          }))
          .filter((item, index, self) => 
            item.name && index === self.findIndex(t => t.name === item.name)
          );
      }
      
      setAvailableSections(sectionsForDirectorate);
      console.log('🔍 Available sections for', value, ':', sectionsForDirectorate);
    } else {
      setAvailableSections([]);
    }
    setAvailableSubjects([]);
  };

  // Handle Section selection
  const handleSectionChange = (value) => {
    setSelectedSection(value);
    
    // Find the selected section object
    const selectedSectionObj = availableSections.find(s => s.name === value);
    
    setEditReversedTicketData(prev => ({
      ...prev,
      sub_section: value,
      responsible_unit_id: selectedSectionObj?.id || "",
      responsible_unit_name: selectedDirectorateUnit || prev.responsible_unit_name
    }));
    
    // Filter subjects (function data) for the selected section
    if (value && functionData.length > 0) {
      const subjectsForSection = functionData
        .filter(item => {
          const functionName = item.function?.name || "";
          return functionName === value;
        })
        .map(item => ({
          id: item.id,
          name: item.name || "",
          functionId: item.function?.id
        }));
      
      setAvailableSubjects(subjectsForSection);
      console.log('🔍 Available subjects for section', value, ':', subjectsForSection);
    } else {
      setAvailableSubjects([]);
    }
  };

  // Handle Subject selection - Auto-fill Sub-section and Section like in ticket creation
  const handleSubjectChange = (value) => {
    if (value && functionData.length > 0) {
      // Find the selected function data by ID or name
      const selectedFunctionData = functionData.find((item) => 
        item.id === value || item.name === value
      );
      
      if (selectedFunctionData) {
        // Extract function name (sub-section) and section name like in AdvancedTicketCreateModal
        const functionName = selectedFunctionData.function?.name || 
                           selectedFunctionData.name || 
                           selectedFunctionData.function_name || 
                           "";
        const sectionName = selectedFunctionData.function?.section?.name || 
                          selectedFunctionData.section?.name || 
                          selectedFunctionData.section_name || 
                          selectedFunctionData.section || 
                          "";
        
        // Get the directorate/unit name (responsible unit)
        const responsibleUnitName = sectionName || functionName || "";
        
        // Update form data
        setEditReversedTicketData(prev => ({
          ...prev,
          subject: selectedFunctionData.name || value,
          section: sectionName,
          sub_section: functionName,
          responsible_unit_id: selectedFunctionData.function?.id || "",
          responsible_unit_name: responsibleUnitName
        }));
        
        // Also update selected directorate/unit and section for UI consistency
        if (sectionName) {
          setSelectedDirectorateUnit(sectionName);
          // Find and set available sections
          const sectionsForDirectorate = functionData
            .filter(item => {
              const itemSectionName = item.function?.section?.name || "";
              return itemSectionName === sectionName;
            })
            .map(item => ({
              id: item.function?.id,
              name: item.function?.name || "",
              section: item.function?.section?.name || ""
            }))
            .filter((item, index, self) => 
              item.name && index === self.findIndex(t => t.name === item.name)
            );
          setAvailableSections(sectionsForDirectorate);
        }
        
        if (functionName) {
          setSelectedSection(functionName);
          // Find and set available subjects for this section
          const subjectsForSection = functionData
            .filter(item => {
              const itemFunctionName = item.function?.name || "";
              return itemFunctionName === functionName;
            })
            .map(item => ({
              id: item.id,
              name: item.name || "",
              functionId: item.function?.id
            }));
          setAvailableSubjects(subjectsForSection);
        }
        
        console.log('🔍 Selected function data:', selectedFunctionData);
        console.log('🔍 Function name (sub-section):', functionName);
        console.log('🔍 Section name:', sectionName);
      } else {
        // If not found by ID/name, just set the subject
        setEditReversedTicketData(prev => ({
          ...prev,
          subject: value
        }));
      }
    } else {
      // If no function data or no value, just set the subject
      setEditReversedTicketData(prev => ({
        ...prev,
        subject: value
      }));
    }
  };

  // Handle form data changes for reversed ticket editing (legacy support)
  const handleEditReversedTicketChange = (field, value) => {
    setEditReversedTicketData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle submitting the reversed ticket edit
  const handleEditReversedTicketSubmit = async () => {
    setEditReversedTicketLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const requestBody = {
        userId: userId,
        ...editReversedTicketData
      };
      console.log('🔍 ===== FRONTEND: Sending update request =====');
      console.log('🔍 API Endpoint:', `${baseURL}/ticket/${selectedTicket.id}/update-reversed-details`);
      console.log('🔍 Request Body:', JSON.stringify(requestBody, null, 2));
      console.log('🔍 responsible_unit_name being sent:', requestBody.responsible_unit_name);
      console.log('🔍 section being sent:', requestBody.section);
      console.log('🔍 sub_section being sent:', requestBody.sub_section);
      console.log('🔍 ===== END FRONTEND REQUEST =====');
      
      const response = await fetch(`${baseURL}/ticket/${selectedTicket.id}/update-reversed-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (response.ok) {
        let successMessage = data.message;
        if (data.focal_person) {
          successMessage += ` - Assigned to: ${data.focal_person.full_name} (${data.focal_person.role})`;
        }
        showSnackbar(successMessage, "success");
        setIsEditReversedTicketDialogOpen(false);
        refreshTickets();
        onClose();
      } else {
        showSnackbar(data.message, "error");
      }
    } catch (error) {
      console.error("Error updating reversed ticket details:", error);
      showSnackbar("Error updating ticket details", "error");
    } finally {
      setEditReversedTicketLoading(false);
    }
  };

  // Fetch directorates/units and function data when modal opens
  useEffect(() => {
    console.log('🔍 useEffect triggered, isEditReversedTicketDialogOpen:', isEditReversedTicketDialogOpen);
    if (isEditReversedTicketDialogOpen) {
      console.log('🔍 Modal is open, starting to fetch data...');
      
      const fetchData = async () => {
        try {
          const token = localStorage.getItem("authToken");
          
          // Fetch directorates and units
          const unitsResponse = await fetch(`${baseURL}/section/units-data`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (unitsResponse.ok) {
            const unitsData = await unitsResponse.json();
            if (unitsData.data) {
              setDirectoratesAndUnits(unitsData.data);
              console.log('✅ Directorates and Units loaded:', unitsData.data);
            }
          }
          
          // Fetch function data (for sections and subjects)
          const functionDataResponse = await fetch(`${baseURL}/section/functions-data`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (functionDataResponse.ok) {
            const functionDataResult = await functionDataResponse.json();
            if (functionDataResult.data) {
              setFunctionData(functionDataResult.data);
              console.log('✅ Function data loaded:', functionDataResult.data);
            }
          } else {
            console.error('❌ Failed to load function data');
          }
        } catch (error) {
          console.error("❌ Error fetching data:", error);
        }
      };
      
      fetchData();
    } else {
      // Reset when modal closes
      setSelectedDirectorateUnit("");
      setSelectedSection("");
      setAvailableSections([]);
      setAvailableSubjects([]);
      console.log('🔍 Modal is not open, resetting form');
    }
  }, [isEditReversedTicketDialogOpen]);

  // Fetch attendees when modal opens
  useEffect(() => {
    if (isAssignModalOpen || isReassignModalOpen) {
      const fetchAttendees = async () => {
        try {
          const token = localStorage.getItem("authToken");
          // Include ticketId in query params if available (for focal person filtering by sub_section)
          const ticketIdParam = selectedTicket?.id ? `?ticketId=${selectedTicket.id}` : '';
          const res = await fetch(`${baseURL}/ticket/admin/attendee${ticketIdParam}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const data = await res.json();
          const raw = Array.isArray(data.attendees)
            ? data.attendees
            : Array.isArray(data.data)
            ? data.data
            : [];

          // Filter attendees based on user role
          const currentUserRole = localStorage.getItem("role") || "";
          const currentUnit = (localStorage.getItem("unit_section") || "").toString().toLowerCase();
          const currentReportTo = (localStorage.getItem("report_to") || "").toString().toLowerCase();
          
          const filtered = raw.filter(a => {
            // For focal persons, backend filters by ticket sub_section (if ticketId provided) or report_to
            // For head-of-unit, manager, and director, backend already filters by report_to/designation
            if (currentUserRole === "focal-person" || currentUserRole === "head-of-unit" || currentUserRole === "manager" || currentUserRole === "director") {
              return true;
            }
            
            // For other roles, filter by unit_section
            const attendeeUnit = (a.unit_section || a.unitSection || "").toString().toLowerCase();
            return currentUnit && attendeeUnit && attendeeUnit === currentUnit;
          });

          setAttendees(filtered);
        } catch (e) {
          setAttendees([]);
        }
      };
      fetchAttendees();
    }
  }, [isAssignModalOpen, isReassignModalOpen, selectedTicket?.id]);

  // Clear reassign form when reassign modal opens
  useEffect(() => {
    if (isReassignModalOpen) {
      setSelectedReassignAttendee(null);
      setReassignReason("");
    }
  }, [isReassignModalOpen]);

  const handleAssignTicket = async () => {
    if (!selectedAttendee || !selectedAttendee.username) {
      showSnackbar('Please select an attendee', 'warning');
      return;
    }
    if (!assignReason || !assignReason.trim()) {
      showSnackbar('Assignment reason is required', 'warning');
      return;
    }
    if (!selectedTicket || !selectedTicket.id) {
      showSnackbar('No ticket selected or ticket ID missing', 'error');
      console.error('Assign error: selectedTicket or selectedTicket.id missing', selectedTicket);
      return;
    }
    const assignedToUsername = selectedAttendee.username;
    const reason = assignReason;
    
    console.log('DEBUG: selectedAttendee:', selectedAttendee);
    console.log('DEBUG: assignedToUsername:', assignedToUsername);
    console.log('DEBUG: reason:', reason);
    
    if (!assignedToUsername) {
      showSnackbar('Missing required fields for assignment', 'error');
      console.error('Assign error: missing assignedToUsername', { assignedToUsername });
      return;
    }
    setAssignLoading(true);
    try {
      console.log('Assigning ticket:', selectedTicket);
      console.log('Assigning to username:', assignedToUsername, 'reason:', reason);
      const token = localStorage.getItem("authToken");
      const requestBody = {
        assignedToUsername,
        reason
      };
      console.log('DEBUG: Request body:', requestBody);
      console.log('DEBUG: Token exists:', !!token);
      console.log('DEBUG: Token length:', token ? token.length : 0);
      
      const url = `${baseURL}/ticket/${selectedTicket.id}/assign`;
      console.log('DEBUG: Calling URL:', url);
      console.log('DEBUG: selectedTicket.id:', selectedTicket.id);
      console.log('DEBUG: baseURL:', baseURL);
      
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      const data = await res.json();
      if (!res.ok) {
        showSnackbar(`Failed to assign ticket: ${res.status} ${data.message || ''}`, 'error');
        console.error('Assign fetch error:', res.status, data);
        return;
      }
      showSnackbar(data.message || "Ticket assigned successfully", "success", () => {
        refreshTickets && refreshTickets();
        refreshDashboardCounts && refreshDashboardCounts();
        onClose && onClose();
      });
      setAssignReason("");
      setSelectedAttendee(null);
      setIsAssignModalOpen(false);
    } catch (e) {
      showSnackbar(`Assign error: ${e.message}`, "error");
      console.error('Assign exception:', e);
    } finally {
      setAssignLoading(false);
    }
  };

  useEffect(() => {
    console.log("MODAL selectedTicket", selectedTicket);
  }, [selectedTicket]);

  // Automatically set resolution type to "Reverse" when reverse modal opens
  useEffect(() => {
    if (isReverseModalOpen) {
      setReverseResolutionType("Reverse");
    }
  }, [isReverseModalOpen]);

  const handleForwardToDGSubmit = async () => {
    if (!ownDescription.trim()) {
      showSnackbar("Please provide your description before forwarding to Director General", "warning");
      return;
    }

    // Don't submit if there's a file error
    if (fileError) {
      showSnackbar('File size exceeds the maximum limit of 10MB. Your file is 362.28MB. Please fix the file error before submitting', 'error');
      return;
    }

    // Check file size before submitting (10MB = 10 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (attachment && attachment.size > MAX_FILE_SIZE) {
      const errorMsg = `Ticket cannot be submitted because file is too large. Maximum file size is 10MB. Your file is ${(attachment.size / (1024 * 1024)).toFixed(2)}MB. Please select a smaller file.`;
      setFileError(errorMsg);
      showSnackbar(errorMsg, 'error');
      return;
    }

    setForwardToDGLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      
      // For director: use current description (not edited) since director can't edit
      // For manager/head-of-unit: use edited resolution if provided, otherwise current description
      let resolutionDetails = editedResolution.trim();
      if (userRole === "director" || !resolutionDetails) {
        // Director can't edit, so use current description
        // Or if manager/head-of-unit didn't edit, use current description
        resolutionDetails = selectedTicket?.description || "";
      }
      
      // Use FormData to support file upload
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("resolution_details", resolutionDetails);
      formData.append("own_description", ownDescription.trim());
      formData.append("last_attendee_agent_description", "");
      formData.append("assignmentId", selectedTicket.id);
      
      if (attachment) {
        formData.append("attachment", attachment);
      }
      
      const response = await fetch(`${baseURL}/ticket/${selectedTicket.id}/forward-to-dg`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Do NOT set Content-Type; browser will set it for FormData
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        showSnackbar(result.message || "Ticket forwarded to Director General successfully!", "success", () => {
          refreshTickets();
          onClose();
        });
        setIsForwardToDGDialogOpen(false);
        setEditedResolution("");
        setOwnDescription("");
        setLastAttendeeAgentDescription("");
        setAttachment(null);
      } else {
        const errorData = await response.json();
        showSnackbar(`Error: ${errorData.message || 'Failed to forward to Director General'}`, "error");
      }
    } catch (error) {
      console.error("Error forwarding to Director General:", error);
      showSnackbar("Failed to forward to Director General. Please try again.", "error");
    } finally {
      setForwardToDGLoading(false);
    }
  };

  const handleRating = async (ticketId, rating) => {
    setRatingLoading(true);
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");
    try {
      const response = await fetch(`${baseURL}/reviewer/${ticketId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ complaintType: rating, userId })
      });
      
      // Get the raw response text first
      const responseText = await response.text();
      
      if (response.ok) {
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('🔍 JSON parse error:', parseError);
          console.error('🔍 Response text that failed to parse:', responseText);
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
        }
        
        showSnackbar(`Rated as ${rating}`, "success");
        // Don't refresh tickets here - only refresh after forwarding
      } else {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('🔍 Error response JSON parse error:', parseError);
          console.error('🔍 Error response text:', responseText);
          throw new Error(`Server error (${response.status}): ${responseText.substring(0, 200)}`);
        }
        
        showSnackbar(errorData.message || "Failed to rate ticket", "error");
      }
    } catch (error) {
      console.error('🔍 Error caught:', error);
      showSnackbar(error.message, "error");
    } finally {
      setRatingLoading(false);
    }
  };

  const handleConvertOrForward = async (ticketId, mode = "convert") => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");
    const category = convertCategory[ticketId];
    const unitName = forwardUnit[ticketId];
    
    console.log('🔍 handleConvertOrForward called:', {
      ticketId,
      mode,
      forwardUnitState: forwardUnit,
      unitNameFromState: unitName,
      convertCategoryState: convertCategory,
      categoryFromState: category
    });

    // Get the current ticket to check its section and rating
    const currentTicket = selectedTicket;
    const isComplaintCategory = String(currentTicket?.category || "").toLowerCase() === "complaint";

    // Rating rules:
    // - Complaint + forward => rating required (Minor/Major) before forwarding
    // - Non-Complaint or convert => no rating required
    const isProvidingRating = selectedRating && ["Minor", "Major"].includes(selectedRating);
    const isAlreadyRated = currentTicket?.complaint_type;
    
    // Validate that at least one option is selected
    // Priority: selected unit from dropdown > ticket sub_section (specific unit) > responsible unit name > section (avoid generic section names like "Units")
    // Only use section as fallback if it's not a generic name like "Units"
    let effectiveUnitName = unitName;
    
    // If no unit selected from dropdown, try fallbacks
    if (!effectiveUnitName) {
      // Prefer sub_section (specific unit name) over section (which might be generic like "Units")
      effectiveUnitName = currentTicket?.sub_section || currentTicket?.responsible_unit_name;
      
      // Only use section as last resort if it's not a generic name
      if (!effectiveUnitName && currentTicket?.section) {
        const sectionName = currentTicket.section.trim().toLowerCase();
        // Avoid generic section names like "units", "unit", etc.
        if (sectionName !== "units" && sectionName !== "unit" && sectionName.length > 3) {
          effectiveUnitName = currentTicket.section;
        }
      }
    }
    
    console.log('Debug - Forward validation:', {
      unitNameFromDropdown: unitName,
      forwardUnitState: forwardUnit[ticketId],
      currentTicketSection: currentTicket?.section,
      currentTicketSubSection: currentTicket?.sub_section,
      currentTicketResponsibleUnit: currentTicket?.responsible_unit_name,
      effectiveUnitName,
      isProvidingRating,
      selectedRating,
      isAlreadyRated,
      currentTicketComplaintType: currentTicket?.complaint_type
    });
    
    if (!category && !effectiveUnitName) {
      showSnackbar("Please select either a category to convert to, or a unit to forward to, or both", "warning");
      return;
    }
    
    if (mode === "forward" && isComplaintCategory && effectiveUnitName && !isAlreadyRated && !isProvidingRating) {
      // Check if the rating dropdown is visible to the user
      const isRatingDropdownVisible = !(currentTicket.status === "Returned" || currentTicket.complaint_type);
      
      if (isRatingDropdownVisible) {
        showSnackbar("Please select a rating (Minor or Major) from the 'Complaint Category' dropdown above before forwarding.", "warning");
      } else {
        showSnackbar("This ticket needs to be rated before forwarding. Please contact an administrator.", "warning");
      }
      return;
    }

    // Validate comment/description is required when rating and forwarding
    if (mode === "forward" && isComplaintCategory && effectiveUnitName && (isProvidingRating || isAlreadyRated) && !ratingComment.trim()) {
      showSnackbar("Please provide a comment/description before forwarding the ticket.", "warning");
      return;
    }

    setConvertOrForwardLoading(true);
    try {
      // Prepare the payload to match backend expectations
      // Use selectedRating if available, otherwise use existing complaint_type
      const payload = { 
        userId,
        responsible_unit_name: effectiveUnitName || undefined,
        // Only send category when explicitly converting; for pure forward ignore convertCategory value
        category: mode === "convert" ? (category || undefined) : undefined,
      };
      if (isComplaintCategory) {
        payload.complaintType = selectedRating || currentTicket?.complaint_type || undefined;
        // only meaningful for complaints
        payload.ratingComment = ratingComment.trim() || undefined;
      }

      const response = await fetch(`${baseURL}/reviewer/${ticketId}/convert-or-forward-ticket`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        showSnackbar(data.message || "Ticket updated successfully", "success", () => {
          refreshTickets();
          onClose && onClose();
        });
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
        // Clear selected rating and comment after successful update
        setSelectedRating("");
        setRatingComment("");
        // Hide modal after successful forward/convert
        // (main modal closes after user closes the action popup)
      } else {
        showSnackbar(data.message || "Failed to update ticket", "error");
      }
    } catch (error) {
      showSnackbar(error.message, "error");
    } finally {
      setConvertOrForwardLoading(false);
    }
  };

  const handleReassignTicket = async () => {
    if (!selectedReassignAttendee || !selectedReassignAttendee.username) {
      showSnackbar('Please select an attendee', 'warning');
      return;
    }
    if (!reassignReason || !reassignReason.trim()) {
      showSnackbar('Reassignment reason is required', 'warning');
      return;
    }
    if (!selectedTicket || !selectedTicket.id) {
      showSnackbar('No ticket selected or ticket ID missing', 'error');
      console.error('Reassign error: selectedTicket or selectedTicket.id missing', selectedTicket);
      return;
    }
    const assignedToUsername = selectedReassignAttendee.username;
    const reason = reassignReason;
    
    console.log('DEBUG: selectedReassignAttendee:', selectedReassignAttendee);
    console.log('DEBUG: assignedToUsername:', assignedToUsername);
    console.log('DEBUG: reason:', reason);
    
    if (!assignedToUsername) {
      showSnackbar('Missing required fields for reassignment', 'error');
      console.error('Reassign error: missing assignedToUsername', { assignedToUsername });
      return;
    }
    setReassignLoading(true);
    try {
      console.log('Reassigning ticket:', selectedTicket);
      console.log('Reassigning to username:', assignedToUsername, 'reason:', reason);
      const token = localStorage.getItem("authToken");
      const requestBody = {
        assigned_to_id: selectedReassignAttendee.id,
        assigned_to_role: selectedReassignAttendee.role || 'attendee',
        reassignment_reason: reason,
        notes: `Reassigned by ${localStorage.getItem("name") || "Focal Person"}`
      };
      console.log('DEBUG: Request body:', requestBody);
      console.log('DEBUG: Token exists:', !!token);
      console.log('DEBUG: Token length:', token ? token.length : 0);
      
      const url = `${baseURL}/ticket/${selectedTicket.id}/reassign`;
      console.log('DEBUG: Calling URL:', url);
      console.log('DEBUG: selectedTicket.id:', selectedTicket.id);
      console.log('DEBUG: baseURL:', baseURL);
      
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      const data = await res.json();
      if (!res.ok) {
        showSnackbar(`Failed to reassign ticket: ${res.status} ${data.message || ''}`, 'error');
        console.error('Reassign fetch error:', res.status, data);
        return;
      }
      showSnackbar(data.message || "Ticket reassigned successfully", "success", () => {
        refreshTickets && refreshTickets();
        refreshDashboardCounts && refreshDashboardCounts();
        onClose && onClose();
      });
      setReassignReason("");
      setSelectedReassignAttendee(null);
      setIsReassignModalOpen(false);
    } catch (e) {
      showSnackbar(`Reassign error: ${e.message}`, "error");
      console.error('Reassign exception:', e);
    } finally {
      setReassignLoading(false);
    }
  };

  useEffect(() => {
    console.log("MODAL selectedTicket", selectedTicket);
  }, [selectedTicket]);

  const handleAgentReverse = async () => {
    if (!agentRecommendation.trim()) {
      showSnackbar('Please provide a recommendation', 'warning');
      return;
    }
    if (!selectedTicket || !selectedTicket.id) {
      showSnackbar('No ticket selected or ticket ID missing', 'error');
      return;
    }

    // Don't submit if there's a file error
    if (fileError) {
      showSnackbar('File size exceeds the maximum limit of 10MB. Your file is 362.28MB. Please fix the file error before submitting', 'error');
      return;
    }

    // Check file size before submitting (10MB = 10 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (attachment && attachment.size > MAX_FILE_SIZE) {
      const errorMsg = `Ticket cannot be submitted because file is too large. Maximum file size is 10MB. Your file is ${(attachment.size / (1024 * 1024)).toFixed(2)}MB. Please select a smaller file.`;
      setFileError(errorMsg);
      showSnackbar(errorMsg, 'error');
      return;
    }

    setAgentReverseLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("userId", localStorage.getItem("userId"));
      
      // Use resolution details as reason, with resolution type prefix (same as handleReverse)
      const fullReason = complaintSeverity ? 
        `[${complaintSeverity}] ${agentRecommendation}` : 
        agentRecommendation;
      formData.append("reason", fullReason);
      // Also send description field for backend to use
      formData.append("description", agentRecommendation);
      formData.append("status", "reversing");
      
      if (attachment) {
        formData.append("attachment", attachment);
      }

      // Use the same reverse endpoint as other reverse actions
      // Backend now handles reassignment logic (returns to reassigned_by if reassigned)
      const res = await fetch(`${baseURL}/ticket/${selectedTicket.id}/reverse`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
          // Do NOT set Content-Type; browser will set it for FormData
        },
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) {
        showSnackbar(data.message || `Failed to reverse complaint: ${res.status}`, "error");
        return;
      }
      
      // Show success message (same as handleReverse)
      showSnackbar(data.message || "Complaint reversed with recommendation successfully", "success", () => {
        refreshTickets && refreshTickets();
        onClose && onClose();
      });
      
      // Clear form and close modal with a small delay to prevent ResizeObserver error
      setAgentRecommendation("");
      setComplaintSeverity(""); // Reset to empty (matches "Select Resolution Type")
      setAttachment(null);
      setIsAgentReverseModalOpen(false);
      
    } catch (error) {
      showSnackbar(`Reverse error: ${error.message}`, "error");
      console.error('Agent reverse exception:', error);
    } finally {
      setAgentReverseLoading(false);
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
            width: { xs: "90%", sm: 800 },
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
              {/* Modal Header with Close Button */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                position: 'relative'
              }}>
                <Typography
                  id="ticket-details-title"
                  variant="h5"
                  sx={{ fontWeight: "bold", color: "#1976d2" }}
                >
                  Ticket Details {selectedTicket.ticket_id ? `#${selectedTicket.ticket_id}` : ""}
                </Typography>
                <Tooltip title="Close modal">
                <IconButton
                  onClick={onClose}
                  sx={{
                    position: 'absolute',
                    right: -8,
                    top: -8,
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.08)',
                    },
                  }}
                  aria-label="close"
                >
                  <CloseIcon />
                </IconButton>
                </Tooltip>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {/* Workflow Status Section */}
              <Box sx={{ mb: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ color: "#3f51b5", flexGrow: 1 }}>
                    Ticket History
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', flex: 1, gap: 1 }}>
                    {/* Ticket Charts Button */}
                    <Badge 
                      badgeContent={unreadMessagesCount > 0 ? unreadMessagesCount : 0} 
                      color="error"
                      invisible={unreadMessagesCount === 0}
                      sx={{
                        '& .MuiBadge-badge': {
                          right: -3,
                          top: -3,
                          minWidth: '18px',
                          height: '18px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          padding: '0 4px'
                        }
                      }}
                    >
                      <Tooltip title="View ticket charts">
                      <Button 
                        size="small" 
                        onClick={handleOpenTicketCharts} 
                        variant={unreadMessagesCount > 0 ? "contained" : "outlined"}
                        startIcon={<BarChartIcon />}
                        style={unreadMessagesCount > 0 ? {
                          backgroundColor: '#4caf50',
                          color: 'white',
                          borderColor: '#4caf50'
                        } : {}}
                        sx={{ 
                          textTransform: 'none', 
                          fontSize: '0.875rem',
                          ...(unreadMessagesCount > 0 ? {
                            backgroundColor: '#4caf50',
                            color: 'white',
                            borderColor: '#4caf50',
                            '&:hover': {
                              backgroundColor: '#45a049',
                              borderColor: '#45a049',
                              color: 'white'
                            },
                            '&.MuiButton-contained': {
                              backgroundColor: '#4caf50',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: '#45a049'
                              }
                            }
                          } : {
                            backgroundColor: 'transparent',
                            color: 'inherit',
                            borderColor: 'inherit'
                          })
                        }}
                      >
                        Ticket Charts {unreadMessagesCount > 0 ? `(${unreadMessagesCount})` : ''}
                      </Button>
                      </Tooltip>
                    </Badge>
                    {/* Ticket Updates Button */}
                    <Badge 
                      badgeContent={unreadUpdatesCount > 0 ? unreadUpdatesCount : 0} 
                      color="error"
                      invisible={unreadUpdatesCount === 0}
                      sx={{
                        '& .MuiBadge-badge': {
                          right: -3,
                          top: -3,
                          minWidth: '18px',
                          height: '18px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          padding: '0 4px'
                        }
                      }}
                    >
                      <Tooltip title="View ticket updates and messages">
                      <Button 
                        size="small" 
                        onClick={handleOpenTicketUpdates} 
                        variant={unreadUpdatesCount > 0 ? "contained" : "outlined"}
                        startIcon={<ChatIcon />}
                        style={unreadUpdatesCount > 0 ? {
                          backgroundColor: '#4caf50',
                          color: 'white',
                          borderColor: '#4caf50'
                        } : {}}
                        sx={{ 
                          textTransform: 'none', 
                          fontSize: '0.875rem',
                          ...(unreadUpdatesCount > 0 ? {
                            backgroundColor: '#4caf50',
                            color: 'white',
                            borderColor: '#4caf50',
                            '&:hover': {
                              backgroundColor: '#45a049',
                              borderColor: '#45a049',
                              color: 'white'
                            },
                            '&.MuiButton-contained': {
                              backgroundColor: '#4caf50',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: '#45a049'
                              }
                            }
                          } : {
                            backgroundColor: 'transparent',
                            color: 'inherit',
                            borderColor: 'inherit'
                          })
                        }}
                      >
                        Ticket Updates {unreadUpdatesCount > 0 ? `(${unreadUpdatesCount})` : ''}
                      </Button>
                      </Tooltip>
                    </Badge>
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


              {/* Representative Details Section */}
              {(["Representative", "Employer"].includes(selectedTicket.requester)) && selectedTicket.representative_name && (
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
                    <strong>Requester:</strong>{" "}
                    {selectedTicket.requester || "N/A"}
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
                    <strong>Request Category:</strong>{" "}
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

                {/* Resolution Details and Closed By - Show only when ticket is closed */}
                {selectedTicket.status === "Closed" && (
                  <>
                    {selectedTicket.resolution_details && (
                      <div style={{ flex: "1 1 100%", marginTop: "16px" }}>
                        <Typography sx={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                          <strong>Resolution Details:</strong>{" "}
                          {selectedTicket.resolution_details}
                        </Typography>
              </div>
                    )}
                    {(() => {
                      // Get closed by information from assignment history (same logic as history section)
                      const last = assignmentHistory && assignmentHistory.length > 0
                        ? assignmentHistory[assignmentHistory.length - 1]
                        : null;
                      
                      const closedByName = last?.assigned_to_name || 
                                        last?.assignedTo?.full_name || 
                                        last?.user?.full_name || 
                                        selectedTicket.attended_by_name ||
                                        "N/A";
                      
                      const closedByRole = last?.assigned_to_role || "N/A";
                      
                      return (
                        <div style={{ flex: "1 1 100%", marginTop: "16px" }}>
                          <Typography>
                            <strong>Closed By:</strong>{" "}
                            {closedByName}{" "}
                            <span style={{ color: "#888" }}>
                              ({closedByRole})
                            </span>
                          </Typography>
                        </div>
                      );
                    })()}
                  </>
                )}

              </div>


              {/* Action Buttons */}
              <Box sx={{ mt: 2, textAlign: "right" }}>
                {showAttendButton && userRole !== "reviewer" && (
                  <Tooltip title="Attend to this ticket and provide resolution details">
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => {
                      // For attendee with Minor/Major complaints from head of unit, open attend dialog
                      if (userRole === "attendee" && 
                          selectedTicket.category === "Complaint" && 
                          (selectedTicket.complaint_type === "Minor" || selectedTicket.complaint_type === "Major") &&
                          isFromHeadOfUnit) {
                        setIsAttendDialogOpen(true);
                      } else {
                        // For others, use existing logic
                        handleReviewerClose();
                      }
                    }}
                    sx={{ mr: 1 }}
                    disabled={attendLoading}
                  >
                    {attendLoading ? "Attending..." : "Attend"}
                  </Button>
                  </Tooltip>
                )}

                {/* Edit Subject & Section button for reversed tickets - only for ticket creator (initiator) */}
                {(() => {
                  const currentUserId = userId || localStorage.getItem("userId");
                  const status = (selectedTicket?.status || "").toString().trim().toLowerCase();
                  if (status !== "reversed") return false;

                  const creatorIdCandidates = [
                    selectedTicket?.creator?.id,
                    selectedTicket?.creator?.user_id,
                    selectedTicket?.created_by_id,
                    selectedTicket?.created_by, // sometimes uuid, sometimes name depending on endpoint
                    selectedTicket?.userId,
                  ].filter(v => v !== null && v !== undefined && String(v).trim() !== "");

                  return creatorIdCandidates.some(v => String(v) === String(currentUserId));
                })() && (
                  <Tooltip title="Edit ticket subject and section">
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleEditReversedTicket}
                    sx={{ mr: 1 }}
                  >
                    Edit Subject & Section
                  </Button>
                  </Tooltip>
                )}
                
                {/* Reviewer Actions */}
                {showReviewerActions && (
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      border: '1px solid #e0e0e0',
                      borderRadius: 1.5,
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        mb: 1.5, 
                        fontWeight: 600, 
                        color: '#424242',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        fontSize: '0.95rem'
                      }}
                    >
                      <CheckCircleIcon sx={{ color: '#667eea', fontSize: 20 }} />
                      Reviewer Actions
                    </Typography>
                    
                    {/* Show rating selection only if ticket is not returned and not already rated */}
                    {(selectedTicket.assigned_to_role === 'reviewer') && selectedTicket.assigned_to && String(selectedTicket.assigned_to) === String(userId) && (
                      <Box sx={{ mb: 2 }}>
                        {/* Complaint-only Rating Row (non-Complaint behaves like Inquiry: no rating required/visible) */}
                        {String(selectedTicket.category || "").toLowerCase() === "complaint" && (
                          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
                            <Box sx={{ minWidth: { xs: "100%", sm: "180px" }, flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75, color: '#424242', fontSize: '0.85rem' }}>
                                Complaint Category:
                              </Typography>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={selectedRating}
                                  onChange={(e) => setSelectedRating(e.target.value)}
                                  disabled={ratingLoading}
                                  sx={{
                                    fontSize: '0.8rem',
                                    height: '32px',
                                    textAlign: 'left',
                                    '& .MuiSelect-select': {
                                      padding: '6px 14px',
                                      fontSize: '0.8rem',
                                      textAlign: 'left'
                                    }
                                  }}
                                >
                                  <MenuItem value="" sx={{ fontSize: '0.8rem', py: 0.5 }}>Select Category</MenuItem>
                                  <MenuItem value="Minor" sx={{ fontSize: '0.8rem', py: 0.5 }}>Minor</MenuItem>
                                  <MenuItem value="Major" sx={{ fontSize: '0.8rem', py: 0.5 }}>Major</MenuItem>
                                </Select>
                              </FormControl>
                            </Box>
                          
                          {/* Convert To Section */}
                          {String(selectedTicket.category || "").toLowerCase() === "complaint" && (
                            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, minWidth: { xs: "100%", sm: "auto" }, flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel sx={{ fontSize: '0.8rem' }}>Convert To</InputLabel>
                                <Select
                                  value={convertCategory[selectedTicket.id] || ""}
                                  onChange={(e) => handleCategoryChange(selectedTicket.id, e.target.value)}
                                  label="Convert To"
                                  sx={{
                                    fontSize: '0.8rem',
                                    height: '32px',
                                    textAlign: 'left',
                                    '& .MuiSelect-select': {
                                      padding: '6px 14px',
                                      fontSize: '0.8rem',
                                      textAlign: 'left'
                                    }
                                  }}
                                >
                                  <MenuItem value="" sx={{ fontSize: '0.8rem', py: 0.5 }}>Convert To</MenuItem>
                                  <MenuItem value="Inquiry" sx={{ fontSize: '0.8rem', py: 0.5 }}>Inquiry</MenuItem>
                                </Select>
                              </FormControl>
                              <Tooltip title="Convert this complaint to an inquiry">
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleConvertOrForward(selectedTicket.id, "convert")}
                                  disabled={convertOrForwardLoading}
                                  sx={{
                                    textTransform: 'none',
                                    px: 1.5,
                                    py: 0.5,
                                    fontSize: '0.75rem',
                                    minHeight: '32px'
                                  }}
                                >
                                  {convertOrForwardLoading ? "Converting..." : "Convert"}
                                </Button>
                              </Tooltip>
                            </Box>
                          )}
                          </Box>
                        )}

                          {/* Comment/Description field - required when rating and forwarding (Complaint only) */}
                          {String(selectedTicket.category || "").toLowerCase() === "complaint" && selectedRating && ["Minor", "Major"].includes(selectedRating) && (
                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75, color: '#424242', fontSize: '0.85rem' }}>
                                Comment/Description <span style={{ color: "red" }}>*</span>:
                              </Typography>
                              <TextField
                                multiline
                                rows={2}
                                fullWidth
                                value={ratingComment}
                                onChange={(e) => setRatingComment(e.target.value)}
                                placeholder="Please provide a comment/description before forwarding..."
                                size="small"
                                required
                                error={!ratingComment.trim() && selectedRating && forwardUnit[selectedTicket.id]}
                                helperText={!ratingComment.trim() && selectedRating && forwardUnit[selectedTicket.id] ? "Comment is required before forwarding" : ""}
                                sx={{
                                  '& .MuiInputBase-root': {
                                    fontSize: '0.8rem'
                                  },
                                  '& .MuiInputBase-input': {
                                    fontSize: '0.8rem',
                                    padding: '8px 14px'
                                  },
                                  '& .MuiFormHelperText-root': {
                                    fontSize: '0.65rem'
                                  }
                                }}
                              />
                            </Box>
                          )}

                        {/* Forward Section */}
                        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1.5, flexWrap: "wrap" }}>
                          <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 auto" }, minWidth: { xs: "100%", sm: "220px" } }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75, color: '#424242', fontSize: '0.85rem' }}>
                              Forward To:
                            </Typography>
                            <FormControl fullWidth size="small">
                              <Select
                                value={forwardUnit[selectedTicket.id] || ""}
                                onChange={(e) => {
                                  console.log('🔍 Unit dropdown changed:', {
                                    ticketId: selectedTicket.id,
                                    selectedValue: e.target.value,
                                    previousValue: forwardUnit[selectedTicket.id]
                                  });
                                  handleUnitChange(selectedTicket.id, e.target.value);
                                }}
                                sx={{
                                  fontSize: '0.8rem',
                                  height: '32px',
                                  textAlign: 'left',
                                  '& .MuiSelect-select': {
                                    padding: '6px 14px',
                                    fontSize: '0.8rem',
                                    textAlign: 'left'
                                  }
                                }}
                              >
                                <MenuItem value="" sx={{ fontSize: '0.8rem', py: 0.5 }}>Forward To</MenuItem>
                                {/* Show sub-section for units, section for directorates */}
                                {(() => {
                                  const isDirectorate = selectedTicket.section && (
                                    selectedTicket.section.includes('Directorate') || 
                                    selectedTicket.section.includes('directorate') ||
                                    (allSectionsList && allSectionsList.some(s => s.name === selectedTicket.section && !s.section_id))
                                  );
                                  if (isDirectorate && selectedTicket.section) {
                                    return (
                                      <MenuItem value={selectedTicket.section} sx={{ fontSize: '0.8rem', py: 0.5 }}>
                                        {selectedTicket.section} 
                                      </MenuItem>
                                    );
                                  } else if (!isDirectorate && selectedTicket.sub_section) {
                                    return (
                                      <MenuItem value={selectedTicket.sub_section} sx={{ fontSize: '0.8rem', py: 0.5 }}>
                                        {selectedTicket.sub_section} 
                                      </MenuItem>
                                    );
                                  } else if (selectedTicket.section) {
                                    return (
                                      <MenuItem value={selectedTicket.section} sx={{ fontSize: '0.8rem', py: 0.5 }}>
                                        {selectedTicket.section} 
                                      </MenuItem>
                                    );
                                  }
                                  return null;
                                })()}
                                {allSectionsList && allSectionsList.length > 0 ? (
                                  allSectionsList.map((section) => (
                                    <MenuItem key={section.id} value={section.name} sx={{ fontSize: '0.8rem', py: 0.5 }}>{section.name}</MenuItem>
                                  ))
                                ) : (
                                  units && units.length > 0 ? (
                                    // Use the actual unit/function name, not the section name
                                    // For units, use function.name (e.g., "Internal Audit Unit"), for directorates use section name
                                    // Remove duplicates and prioritize function names over section names
                                    (() => {
                                      const unitMap = new Map();
                                      units.forEach((item) => {
                                        const functionName = item.function?.name || "";
                                        const sectionName = item.function?.section?.name || "";
                                        const itemName = item.name || "";
                                        
                                        // Priority: function.name > item.name > section.name
                                        const displayName = functionName || itemName || sectionName;
                                        const valueToUse = functionName || itemName || sectionName;
                                        
                                        if (displayName && !unitMap.has(valueToUse)) {
                                          unitMap.set(valueToUse, {
                                            key: item.id || item.function?.id || valueToUse,
                                            value: valueToUse,
                                            label: displayName
                                          });
                                        }
                                      });
                                      
                                      return Array.from(unitMap.values()).map((unit) => (
                                        <MenuItem key={unit.key} value={unit.value} sx={{ fontSize: '0.8rem', py: 0.5 }}>
                                          {unit.label}
                                        </MenuItem>
                                      ));
                                    })()
                                  ) : null
                                )}
                              </Select>
                            </FormControl>
                        </Box>
                          
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                            <Tooltip title={String(selectedTicket.category || "").toLowerCase() === "complaint"
                              ? (!selectedRating || !["Minor", "Major"].includes(selectedRating)
                                ? "Please select a rating (Minor or Major) from the 'Complaint Category' dropdown above"
                                : !ratingComment.trim()
                                  ? "Please provide a comment/description before forwarding"
                                  : "Forward ticket to selected unit/section")
                              : "Forward ticket to selected unit/section"}>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleConvertOrForward(selectedTicket.id, "forward")}
                                disabled={String(selectedTicket.category || "").toLowerCase() === "complaint"
                                  ? (!selectedRating || !["Minor", "Major"].includes(selectedRating) || !ratingComment.trim() || convertOrForwardLoading)
                                  : convertOrForwardLoading}
                                sx={{
                                  textTransform: 'none',
                                  px: 1.5,
                                  py: 0.5,
                                  fontSize: '0.75rem',
                                  minHeight: '32px'
                                }}
                              >
                                {convertOrForwardLoading ? "Processing..." : "Forward"}
                              </Button>
                            </Tooltip>
                            
                            {/* Status Messages */}
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, minWidth: { xs: "100%", sm: "auto" } }}>
                              {String(selectedTicket.category || "").toLowerCase() === "complaint" && (!selectedRating || !["Minor", "Major"].includes(selectedRating)) && (
                                <Typography variant="caption" sx={{ color: '#ff9800', fontSize: "0.7rem", fontWeight: 500 }}>
                                  Rating required
                                </Typography>
                              )}
                              {String(selectedTicket.category || "").toLowerCase() === "complaint" && selectedRating && ["Minor", "Major"].includes(selectedRating) && !ratingComment.trim() && (
                                <Typography variant="caption" sx={{ color: '#d32f2f', fontSize: "0.7rem", fontWeight: 500 }}>
                                  Comment required
                                </Typography>
                              )}
                              {(() => {
                                const isDirectorate = selectedTicket.section && (
                                  selectedTicket.section.includes('Directorate') || 
                                  selectedTicket.section.includes('directorate') ||
                                  (allSectionsList && allSectionsList.some(s => s.name === selectedTicket.section && !s.section_id))
                                );
                                const displayValue = isDirectorate ? selectedTicket.section : (selectedTicket.sub_section || selectedTicket.section);
                                return displayValue && !forwardUnit[selectedTicket.id] && (
                                  String(selectedTicket.category || "").toLowerCase() === "complaint"
                                    ? (selectedRating && ["Minor", "Major"].includes(selectedRating) && ratingComment.trim())
                                    : true
                                ) && (
                                  <Typography variant="caption" sx={{ color: '#1976d2', fontSize: "0.7rem", fontWeight: 500 }}>
                                    Will forward to: {displayValue}
                                  </Typography>
                                );
                              })()}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    )}

                    {/* Show Forward to DG button for Major complaints:
                        1. Head of Unit with Reversed status (from Manager) - ORIGINAL
                        2. Director with Attended and Recommended/Reversed status (from Manager in Directorate) - NEW
                    */}
                    {(() => {
                      const isComplaint = selectedTicket.category === "Complaint";
                      const isMajor = selectedTicket.complaint_type === "Major";
                      const isReversed = selectedTicket.status === "Reversed";
                      const isHeadOfUnit = selectedTicket.assigned_to_role === "head-of-unit";
                      const isAssignedToUser = selectedTicket.assigned_to_id && String(selectedTicket.assigned_to_id) === String(userId);
                      const hasAssignmentHistory = assignmentHistory && assignmentHistory.length > 0;
                      const previousWasManager = hasAssignmentHistory && assignmentHistory[assignmentHistory.length - 1]?.assigned_by_role === "manager";
                      
                      // ORIGINAL CONDITION - Keep this as is
                      const originalCondition = isComplaint && isMajor && isReversed && isHeadOfUnit && isAssignedToUser && previousWasManager;
                      
                      // NEW CONDITIONS FOR DIRECTOR - Add these without removing original
                      const isDirectorate = selectedTicket.responsible_unit_name?.toLowerCase().includes("directorate");
                      const isAttendedAndRecommended = selectedTicket.status === "Attended and Recommended";
                      const isDirector = selectedTicket.assigned_to_role === "director" && userRole === "director";
                      
                      // Check assignment history for Director case
                      let cameFromManager = false;
                      if (hasAssignmentHistory) {
                        const mostRecent = assignmentHistory[assignmentHistory.length - 1];
                        cameFromManager = mostRecent?.assigned_by_role === "manager";
                        
                        // Also check if any assignment in history was from manager to director
                        if (!cameFromManager) {
                          cameFromManager = assignmentHistory.some(assignment => 
                            assignment.assigned_by_role === "manager" && 
                            assignment.assigned_to_role === "director"
                          );
                        }
                      }
                      
                      // NEW: Director case with Attended and Recommended or Reversed status
                      const directorCondition1 = isComplaint && isMajor && isDirectorate &&
                                                (isAttendedAndRecommended || isReversed) &&
                                                isDirector &&
                                                isAssignedToUser &&
                                                cameFromManager;
                      
                      // NEW: Director case with Attended and Recommended (more flexible - no manager check)
                      const directorCondition2 = isComplaint && isMajor && isDirectorate &&
                                                isAttendedAndRecommended &&
                                                isDirector &&
                                                isAssignedToUser;
                      
                      // NEW: Director case - even simpler check (just Director + Major + Directorate + status)
                      const directorCondition3 = isComplaint && isMajor && isDirectorate &&
                                                (isAttendedAndRecommended || isReversed) &&
                                                userRole === "director" &&
                                                selectedTicket.assigned_to_role === "director" &&
                                                isAssignedToUser;
                      
                      console.log('DEBUG Forward to DG button conditions:', {
                        isComplaint,
                        isMajor,
                        isReversed,
                        isHeadOfUnit,
                        isAssignedToUser,
                        hasAssignmentHistory,
                        previousWasManager,
                        isDirectorate,
                        isAttendedAndRecommended,
                        isDirector,
                        cameFromManager,
                        originalCondition,
                        directorCondition1,
                        directorCondition2,
                        assignmentHistory: assignmentHistory?.map(h => ({ 
                          assigned_by_role: h.assigned_by_role, 
                          assigned_to_role: h.assigned_to_role,
                          action: h.action 
                        })),
                        selectedTicket: {
                          category: selectedTicket.category,
                          complaint_type: selectedTicket.complaint_type,
                          status: selectedTicket.status,
                          assigned_to_role: selectedTicket.assigned_to_role,
                          assigned_to_id: selectedTicket.assigned_to_id,
                          userId: userId
                        }
                      });
                      
                      // Return original condition OR new director conditions
                      return originalCondition || directorCondition1 || directorCondition2 || directorCondition3;
                    })() ? (
                      <>
                        <Tooltip title="Forward ticket to Director General for final approval">
                        <Button
                          variant="contained"
                          color="warning"
                          onClick={handleForwardToDG}
                          disabled={forwardToDGLoading}
                        >
                          {forwardToDGLoading ? "Forwarding..." : "Forward to Director General"}
                        </Button>
                        </Tooltip>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="Close and resolve this ticket">
                          <Button
                            variant="contained"
                            color="success"
                            onClick={handleReviewerClose}
                          >
                            Close ticket
                          </Button>
                          </Tooltip>
                          <Tooltip title="Cancel and close this dialog">
                          <Button
                            variant="outlined"
                            onClick={onClose}
                          >
                            Cancel
                          </Button>
                          </Tooltip>
                        </Box>
                      </>
                    ) : null}

                    {/* Action Buttons Section */}
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 2, pt: 1.5, borderTop: '1px solid #e0e0e0' }}>
                        {/* Close ticket button - only show if not returned and not already rated */}
                      {!(selectedTicket.status === "Returned" || selectedTicket.complaint_type) && 
                       (permissionManager.canCloseAtCurrentStep(selectedTicket) || 
                          (userRole === 'reviewer' && 
                           (selectedTicket.assigned_to_id === userId || 
                            selectedTicket.responsible_unit_name === "Public Relation Unit" ||
                            forwardUnit[selectedTicket.id]))) && (
                        <>
                          <Tooltip title="Close and resolve this ticket">
                            <Button
                              variant="contained"
                              color="success"
                              onClick={handleReviewerClose}
                              sx={{
                                borderRadius: 1.5,
                                textTransform: 'none',
                                px: 2.5,
                                py: 0.75,
                                minWidth: 110,
                                fontSize: '0.875rem'
                              }}
                            >
                              Close ticket
                            </Button>
                          </Tooltip>
                          <Tooltip title="Cancel and close this dialog">
                            <Button
                              variant="outlined"
                              onClick={onClose}
                              sx={{
                                borderRadius: 1.5,
                                textTransform: 'none',
                                px: 2.5,
                                py: 0.75,
                                minWidth: 90,
                                fontSize: '0.875rem'
                              }}
                            >
                              Cancel
                            </Button>
                          </Tooltip>
                      </>
                    )}

                    {/* Show only Close button if ticket is returned or already rated */}
                    {(selectedTicket.status === "Returned" || selectedTicket.complaint_type) && 
                     !(selectedTicket.category === "Complaint" && 
                       selectedTicket.complaint_type === "Major" && 
                       selectedTicket.status === "Returned") && 
                     (permissionManager.canCloseAtCurrentStep(selectedTicket) ||
                      (userRole === 'reviewer' && 
                       (selectedTicket.assigned_to_id === userId || 
                        forwardUnit[selectedTicket.id]))) && (
                        <>
                          <Tooltip title="Close and resolve this ticket">
                        <Button
                          variant="contained"
                          color="success"
                          onClick={handleReviewerClose}
                              sx={{
                                borderRadius: 1.5,
                                textTransform: 'none',
                                px: 2.5,
                                py: 0.75,
                                minWidth: 110,
                                fontSize: '0.875rem'
                              }}
                        >
                          Close ticket
                        </Button>
                          </Tooltip>
                          <Tooltip title="Cancel and close this dialog">
                        <Button
                          variant="outlined"
                          onClick={onClose}
                              sx={{
                                borderRadius: 1.5,
                                textTransform: 'none',
                                px: 2.5,
                                py: 0.75,
                                minWidth: 90,
                                fontSize: '0.875rem'
                              }}
                        >
                          Cancel
                        </Button>
                          </Tooltip>
                        </>
                    )}
                  </Box>
                  </Paper>
                )}


                {/* Director General Actions for Assigned Tickets */}
                {/* Only show Close and Reverse buttons if ticket is assigned to current user (DG) and status allows */}
                {userRole === "director-general" && (() => {
                  // Strictly check if ticket is assigned to current user (DG)
                  // Ensure both assigned_to_id and userId exist and match exactly
                  const ticketAssignedToId = selectedTicket?.assigned_to_id;
                  const currentUserId = userId;
                  
                  const isAssignedToDG = ticketAssignedToId != null && 
                                         currentUserId != null && 
                                         String(ticketAssignedToId) === String(currentUserId);
                  
                  const ticketStatus = selectedTicket?.status;
                  
                  // Hide Close and Reverse buttons if status is "Attended and Recommended" or "Closed"
                  const shouldHideButtons = ticketStatus === "Attended and Recommended" || ticketStatus === "Closed";
                  
                  // Show buttons ONLY if:
                  // 1. Ticket is assigned to current DG (isAssignedToDG === true)
                  // 2. Status is NOT "Attended and Recommended" or "Closed"
                  const shouldShowButtons = isAssignedToDG && !shouldHideButtons;
                  
                  if (!shouldShowButtons) {
                    // Ticket not assigned to current DG OR status doesn't allow buttons - show only Cancel button
                    return (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2, justifyContent: "flex-end" }}>
                        <Tooltip title="Cancel and close this dialog">
                          <Button
                            variant="outlined"
                            onClick={onClose}
                          >
                            Cancel
                          </Button>
                        </Tooltip>
                      </Box>
                    );
                  }
                  
                  // Ticket assigned to current DG and status allows - show Close, Reverse, and Cancel buttons
                  // Buttons show for: In Progress, Forwarded, Assigned, Open, etc.
                  // Buttons do NOT show for: Attended and Recommended, Closed
                  return (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2, justifyContent: "flex-end" }}>
                      {/* Close Ticket */}
                      <Tooltip title="Close and approve this ticket">
                        <Button
                          variant="contained"
                          color="success"
                          onClick={handleDGApprovalDialog}
                        >
                          Close ticket
                        </Button>
                      </Tooltip>
                      
                      {/* Reverse (Assign) to Reviewer */}
                      <Tooltip title="Reverse ticket back to reviewer for clarification">
                        <Button
                          variant="contained"
                          color="warning"
                          onClick={() => setIsReverseModalOpen(true)}
                          disabled={isReversing}
                        >
                          Reverse
                        </Button>
                      </Tooltip>
                      
                      {/* Close Modal */}
                      <Tooltip title="Cancel and close this dialog">
                        <Button
                          variant="outlined"
                          onClick={onClose}
                        >
                          Cancel
                        </Button>
                      </Tooltip>
                    </Box>
                  );
                })()}

                {/* Reverse, Assign, and Reassign buttons for focal persons and other roles */}
                {((["focal-person", "head-of-unit", "manager", "director"].includes(localStorage.getItem("role")) || 
                  !["agent", "reviewer", "attendee", "director-general"].includes(localStorage.getItem("role"))) && 
                 selectedTicket?.assigned_to_id === localStorage.getItem("userId") && selectedTicket.status !== "Closed") && (
                  <>
                    {/* Show Forward to DG button for Director or Head-of-unit with Major Complaint */}
                    {((userRole === "director" && 
                       selectedTicket?.category === "Complaint" && 
                       selectedTicket?.complaint_type === "Major" &&
                       selectedTicket?.responsible_unit_name?.toLowerCase().includes("directorate") &&
                       (selectedTicket?.status === "Attended and Recommended" || selectedTicket?.status === "Reversed")) ||
                      (userRole === "head-of-unit" && 
                       selectedTicket?.category === "Complaint" && 
                       selectedTicket?.complaint_type === "Major" &&
                       selectedTicket?.assigned_to_id === userId)) && (
                      <Tooltip title="Forward ticket to Director General for final approval">
                      <Button
                        variant="contained"
                        color="warning"
                        sx={{ mr: 1 }}
                        onClick={handleForwardToDG}
                        disabled={forwardToDGLoading}
                      >
                        {forwardToDGLoading ? "Forwarding..." : "Forward to Director General"}
                      </Button>
                      </Tooltip>
                    )}
                    
                    <Tooltip title={userRole === "focal-person" && selectedTicket?.category === "Complaint" 
                      ? "Reverse this ticket with a recommendation" 
                      : "Reverse this ticket back to the previous assignee"}>
                    <Button
                      variant="contained"
                      color="warning"
                      sx={{ mr: 1 }}
                      onClick={() => setIsReverseModalOpen(true)}
                      disabled={isReversing}
                    >
                      {userRole === "focal-person" && selectedTicket?.category === "Complaint" 
                        ? "Reverse with Recommendation" 
                        : "Reverse"}
                    </Button>
                    </Tooltip>
                    {/* Hide Assign button for manager and head-of-unit when category is Compliment or Suggestion */}
                    {/* Hide Assign button for focal-person when category is Complaint */}
                    {!((userRole === "manager" || userRole === "head-of-unit") && 
                        (selectedTicket?.category === "Compliment" || selectedTicket?.category === "Suggestion")) &&
                     !(userRole === "focal-person" && selectedTicket?.category === "Complaint") && (
                      <Tooltip title="Assign this ticket to an attendee">
                      <Button
                        variant="contained"
                        color="info"
                        sx={{ mr: 1 }}
                        onClick={() => setIsAssignModalOpen(true)}
                      >
                        Assign
                      </Button>
                      </Tooltip>
                    )}
                  </>
                )}

                {/* Reassign button for previously assigned focal-person or manager who is not currently assigned */}
                {hasReassignPermission() && 
                 wasPreviouslyAssigned() && 
                 selectedTicket?.assigned_to_id !== localStorage.getItem("userId") && 
                 selectedTicket.status !== "Closed" && (
                  <Tooltip title="Reassign this ticket to a different attendee">
                  <Button
                    variant="contained"
                    color="secondary"
                    sx={{ mr: 1 }}
                    onClick={() => setIsReassignModalOpen(true)}
                  >
                    Reassign
                  </Button>
                  </Tooltip>
                )}

                {/* Agent Reverse button for rated tickets */}
                {(userRole === "agent" || userRole === "attendee") && 
                 selectedTicket?.assigned_to_id === localStorage.getItem("userId") &&
                 selectedTicket?.complaint_type && 
                 ["Major", "Minor"].includes(selectedTicket.complaint_type) && (
                  <Tooltip title="Reverse this ticket with a recommendation">
                  <Button
                    variant="contained"
                    color="warning"
                    sx={{ mr: 1 }}
                    onClick={() => setIsAgentReverseModalOpen(true)}
                    disabled={agentReverseLoading}
                  >
                    Reverse with Recommendation
                  </Button>
                  </Tooltip>
                )}

                {/* Manager Send to Director button - visible for all complaints (Major and Minor) */}
                {userRole === "manager" && 
                 selectedTicket?.assigned_to_id === localStorage.getItem("userId") &&
                 selectedTicket?.status !== "Closed" && (
                  <Tooltip title="Send this ticket to Director for review">
                  <Button
                    variant="contained"
                    color="success"
                    sx={{ mr: 1 }}
                    onClick={() => {
                      // Initialize edited resolution with current ticket description
                      setEditedResolution(selectedTicket?.description || "");
                      setIsSendToDirectorModalOpen(true);
                    }}
                    disabled={sendToDirectorLoading}
                  >
                    Send to Director
                  </Button>
                  </Tooltip>
                )}
                      {/* General Cancel button: show for everyone except DG, but avoid duplicate Cancel for reviewers */}
      {userRole !== "director-general" &&
        !(
          userRole === "reviewer" &&
          selectedTicket &&
          (
            // When reviewer already sees action buttons that include Cancel, hide this one to avoid duplicates
            permissionManager.canCloseAtCurrentStep(selectedTicket) ||
            String(selectedTicket.assigned_to_id) === String(userId) ||
            selectedTicket.responsible_unit_name === "Public Relation Unit" ||
            Boolean(forwardUnit?.[selectedTicket.id])
          )
        ) && (
                  <Tooltip title="Cancel and close this dialog">
                  <Button variant="outlined" onClick={onClose}>
                    Cancel
                  </Button>
                  </Tooltip>
                )}
              </Box>
            </>
          )}
        </Box>
      </Modal>
      {/* Assignment Flow Chart Dialog */}
      <Dialog 
        open={isFlowModalOpen} 
        onClose={() => setIsFlowModalOpen(false)} 
        PaperProps={{
          sx: {
            width: { xs: '90%', sm: 600 },
            maxWidth: 600
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ mb: -2, color: '#1976d2', fontWeight: 'bold' }}>
                Ticket Updates & Progress
              </Typography>
            <IconButton onClick={() => setIsFlowModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ minHeight: '50vh', maxHeight: '70vh', overflow: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 1 }}>
            
            {/* Divider */}
            <Divider sx={{ my: 1 }} />
            
            {/* Ticket Updates */}
            <Box>
              <TicketUpdates 
                ticketId={selectedTicket?.id}
                currentUserId={localStorage.getItem('userId')}
                canAddUpdates={selectedTicket?.status !== 'Closed' && selectedTicket?.status !== 'Attended and Recommended'}
                isAssigned={selectedTicket?.assigned_to_id === localStorage.getItem('userId')}
                ticketStatus={selectedTicket?.status}
              />
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
      {/* Attend/Resolve Dialog */}
      <Dialog open={isAttendDialogOpen} onClose={() => setIsAttendDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {userRole === "manager" && selectedTicket?.complaint_type === "Major" 
            ? "Attend - Submit Recommendation" 
            : "Enter Resolution Details"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                {userRole === "manager" && selectedTicket?.complaint_type === "Major" 
                  ? "Recommendation Details:" 
                  : "Resolution Details:"}
              </Typography>
              <TextField
                multiline
                rows={4}
                value={resolutionDetails}
                onChange={e => setResolutionDetails(e.target.value)}
                fullWidth
                placeholder={
                  userRole === "manager" && selectedTicket?.complaint_type === "Major"
                    ? "Enter recommendation details..."
                    : "Enter resolution details..."
                }
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Attachment (Optional):
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  "& input[type='file']": {
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                    display: "block"
                  }
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box"
                  }}
                />
              </Box>
              {fileError && (
                <Typography variant="caption" sx={{ color: "red", mt: 1, display: "block" }}>
                  {fileError}
                </Typography>
              )}
              {attachment && !fileError && (
                <Typography variant="caption" sx={{ color: "green", mt: 1, display: "block" }}>
                  File selected: {attachment.name} ({(attachment.size / (1024 * 1024)).toFixed(2)}MB)
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: "gray", mt: 0.5, display: "block", fontSize: "0.75rem" }}>
                Maximum file size: 10MB
              </Typography>
            </Box>

            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Tooltip title={userRole === "manager" && selectedTicket?.complaint_type === "Major" ? "Submit your recommendation for this ticket" : "Submit your resolution for this ticket"}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAttend}
                disabled={!resolutionDetails.trim() || attendLoading}
              >
                {attendLoading 
                  ? "Submitting..." 
                  : (userRole === "manager" && selectedTicket?.complaint_type === "Major" 
                    ? "Submit Recommendation" 
                    : "Submit")
                }
              </Button>
              </Tooltip>
              <Tooltip title="Cancel and close this dialog">
              <Button
                variant="outlined"
                onClick={() => setIsAttendDialogOpen(false)}
                sx={{ ml: 1 }}
              >
                Cancel
              </Button>
              </Tooltip>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Manager Send to Director Dialog */}
      <Dialog open={isSendToDirectorModalOpen} onClose={() => {
        setIsSendToDirectorModalOpen(false);
        setDirectorRecommendation("");
        setEditedResolution("");
        setAttachment(null);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Send to Director - Recommendation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            {/* Creator's Description (Editable) - For Manager */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Creator's Description (Editable):
              </Typography>
              <TextField
                multiline
                rows={4}
                value={editedResolution}
                onChange={e => setEditedResolution(e.target.value)}
                fullWidth
                placeholder="Edit creator's description..."
              />
              <Typography variant="caption" sx={{ color: "#666", mt: 0.5, display: "block" }}>
                Edit the creator's description. This will update the ticket's description.
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Recommendation Details:
              </Typography>
              <TextField
                multiline
                rows={4}
                value={directorRecommendation}
                onChange={e => setDirectorRecommendation(e.target.value)}
                fullWidth
                placeholder="Enter recommendation details for Director..."
                required
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Attachment (Optional):
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  "& input[type='file']": {
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                    display: "block"
                  }
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box"
                  }}
                />
              </Box>
              {fileError && (
                <Typography variant="caption" sx={{ color: "red", mt: 1, display: "block" }}>
                  {fileError}
                </Typography>
              )}
              {attachment && !fileError && (
                <Typography variant="caption" sx={{ color: "green", mt: 1, display: "block" }}>
                  File selected: {attachment.name} ({(attachment.size / (1024 * 1024)).toFixed(2)}MB)
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: "gray", mt: 0.5, display: "block", fontSize: "0.75rem" }}>
                Maximum file size: 10MB
              </Typography>
            </Box>

            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Button
                variant="contained"
                color="success"
                onClick={async () => {
                  // Don't submit if there's a file error
                  if (fileError) {
                    showSnackbar('File size exceeds the maximum limit of 10MB. Your file is 362.28MB. Please fix the file error before submitting', 'error');
                    return;
                  }

                  // Check file size before submitting (10MB = 10 * 1024 * 1024 bytes)
                  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
                  if (attachment && attachment.size > MAX_FILE_SIZE) {
                    const errorMsg = `Ticket cannot be submitted because file is too large. Maximum file size is 10MB. Your file is ${(attachment.size / (1024 * 1024)).toFixed(2)}MB. Please select a smaller file.`;
                    setFileError(errorMsg);
                    showSnackbar(errorMsg, 'error');
                    return;
                  }

                  setSendToDirectorLoading(true);
                  try {
                    const token = localStorage.getItem("authToken");
                    const formData = new FormData();
                    formData.append("userId", localStorage.getItem("userId"));
                    formData.append("recommendation", directorRecommendation);
                    // Send edited creator's description if provided, otherwise send current description
                    const resolutionDetails = editedResolution.trim() || selectedTicket?.description || "";
                    formData.append("resolution_details", resolutionDetails);
                    
                    if (attachment) {
                      formData.append("attachment", attachment);
                    }

                    const response = await fetch(`${baseURL}/ticket/${selectedTicket.id}/manager-send-to-director`, {
                      method: "POST",
                      headers: {
                        "Authorization": `Bearer ${token}`
                      },
                      body: formData
                    });

                    const data = await response.json();
                    if (!response.ok) {
                      showSnackbar(data.message || "Failed to send to Director", "error");
                      return;
                    }

                    showSnackbar(data.message || "Ticket sent to Director successfully", "success", () => {
                      refreshTickets && refreshTickets();
                      onClose && onClose();
                    });
                    setDirectorRecommendation("");
                    setEditedResolution("");
                    setAttachment(null);
                    setIsSendToDirectorModalOpen(false);
                  } catch (error) {
                    showSnackbar(`Error: ${error.message}`, "error");
                  } finally {
                    setSendToDirectorLoading(false);
                  }
                }}
                disabled={!directorRecommendation.trim() || sendToDirectorLoading}
              >
                {sendToDirectorLoading ? "Sending..." : "Send to Director"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setIsSendToDirectorModalOpen(false)}
                sx={{ ml: 1 }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Reviewer Close Dialog */}
      <Dialog 
        open={isReviewerCloseDialogOpen} 
        onClose={() => setIsReviewerCloseDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {userRole === "reviewer" ? "Close Ticket - Resolution Details" : "Attend Ticket - Resolution Details"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Resolution Type *
              </Typography>
              <select
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.9rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  backgroundColor: "white",
                  color: "#000"
                }}
                value={resolutionType}
                onChange={(e) => setResolutionType(e.target.value)}
              >
                <option value="">Select Resolution Type</option>
                <option value="Resolved">Resolved</option>
                <option value="Duplicate">Duplicate</option>
              </select>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Resolution Details *
              </Typography>
              <TextField
                multiline
                rows={4}
                value={resolutionDetails}
                onChange={(e) => setResolutionDetails(e.target.value)}
                fullWidth
                placeholder="Please provide detailed resolution information..."
              />
              {!resolutionDetails.trim() && (
                <Typography variant="caption" sx={{ color: "red", mt: 0.5, display: "block" }}>
                  Comment required
                </Typography>
              )}
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Attachment (Optional):
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  "& input[type='file']": {
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                    display: "block"
                  }
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box"
                  }}
                />
              </Box>
              {fileError && (
                <Typography variant="caption" sx={{ color: "red", mt: 1, display: "block" }}>
                  {fileError}
                </Typography>
              )}
              {attachment && !fileError && (
                <Typography variant="caption" sx={{ color: "green", mt: 1, display: "block" }}>
                  File selected: {attachment.name} ({(attachment.size / (1024 * 1024)).toFixed(2)}MB)
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: "gray", mt: 0.5, display: "block", fontSize: "0.75rem" }}>
                Maximum file size: 10MB
              </Typography>
            </Box>

            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Button
                variant="contained"
                color="success"
                onClick={handleReviewerCloseSubmit}
                disabled={!resolutionType || !resolutionDetails.trim() || reviewerCloseLoading}
              >
                {reviewerCloseLoading 
                  ? (userRole === "reviewer" ? "Closing..." : "Submitting...") 
                  : (userRole === "reviewer" ? "Close Ticket" : "Submit Recommendation")
                }
              </Button>
              <Button
                variant="outlined"
                onClick={() => setIsReviewerCloseDialogOpen(false)}
                sx={{ ml: 1 }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Reverse Modal */}
      <Dialog 
        open={isReverseModalOpen} 
        onClose={() => {
          setIsReverseModalOpen(false);
          setReverseReason("");
          setReverseResolutionType("");
          setAttachment(null);
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Reverse Ticket - Resolution Details</DialogTitle>
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
                  border: "1px solid #ccc",
                  backgroundColor: "#f5f5f5",
                  color: "#000",
                  cursor: "not-allowed"
                }}
                value="Reverse"
                disabled={true}
              >
                <option value="Reverse">Reverse</option>
              </select>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Resolution Details:
              </Typography>
              <TextField
                multiline
                rows={4}
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                fullWidth
                placeholder="Enter resolution details..."
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Attachment (Optional):
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  "& input[type='file']": {
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                    display: "block"
                  }
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box"
                  }}
                />
              </Box>
              {fileError && (
                <Typography variant="caption" sx={{ color: "red", mt: 1, display: "block" }}>
                  {fileError}
                </Typography>
              )}
              {attachment && !fileError && (
                <Typography variant="caption" sx={{ color: "green", mt: 1, display: "block" }}>
                  File selected: {attachment.name} ({(attachment.size / (1024 * 1024)).toFixed(2)}MB)
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: "gray", mt: 0.5, display: "block", fontSize: "0.75rem" }}>
                Maximum file size: 10MB
              </Typography>
            </Box>

            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Tooltip title="Reverse this ticket back to the previous assignee">
              <Button
                variant="contained"
                color="warning"
                onClick={handleReverse}
                disabled={isReversing || !reverseReason.trim()}
              >
                {isReversing ? "Reversing..." : "Reverse Ticket"}
              </Button>
              </Tooltip>
              <Tooltip title="Cancel and close this dialog">
              <Button
                variant="outlined"
                onClick={() => {
                  setIsReverseModalOpen(false);
                  setReverseReason("");
                  setReverseResolutionType("");
                  setAttachment(null);
                }}
                sx={{ ml: 1 }}
                disabled={isReversing}
              >
                Cancel
              </Button>
              </Tooltip>
            </Box>
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
            width: 450,
            maxWidth: "90vw",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 3,
            maxHeight: "80vh",
            overflow: "auto"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography id="assign-ticket-modal-title" variant="h6" sx={{ fontWeight: 600, color: "#1976d2" }}>
              Assign Ticket
            </Typography>
            <IconButton
              onClick={() => setIsAssignModalOpen(false)}
              size="small"
              sx={{ color: "#666" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold", color: "#333" }}>
                Select Attendee:
              </Typography>
              <Autocomplete
                value={selectedAttendee || null}
                onChange={(e, val) => setSelectedAttendee(val)}
                options={attendees}
                getOptionLabel={(o) => o?.full_name || o?.name || o?.username || ""}
                renderInput={(params) => (
                  <TextField {...params} size="small" placeholder="Type to search attendee..." />
                )}
                renderOption={(props, a) => (
                  <li {...props} key={a.id}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                        {a.full_name || a.name} - {a.role}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#666" }}>
                        @{a.username}
                      </Typography>
                    </Box>
                  </li>
                )}
                isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                fullWidth
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold", color: "#333" }}>
                Assignment Reason (required):
              </Typography>
              <TextField
                value={assignReason}
                onChange={e => setAssignReason(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                size="small"
                placeholder="Enter reason for assignment..."
                required
                inputProps={{
                  maxLength: 500
                }}
                helperText={`${assignReason.length}/500 characters`}
                sx={{
                  "& .MuiInputBase-root": {
                    fontSize: "0.9rem"
                  }
                }}
              />
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
            <Tooltip title="Cancel and close this dialog">
            <Button 
              onClick={() => setIsAssignModalOpen(false)} 
              disabled={assignLoading}
              variant="outlined"
              size="small"
              sx={{ 
                px: 2,
                textTransform: "none",
                borderColor: "#ccc",
                color: "#666"
              }}
            >
              Cancel
            </Button>
            </Tooltip>
            <Tooltip title="Assign this ticket to the selected attendee">
            <Button
              variant="contained"
              color="primary"
              onClick={handleAssignTicket}
              disabled={assignLoading || !selectedAttendee || !assignReason.trim()}
              size="small"
              sx={{ 
                px: 2,
                textTransform: "none",
                fontWeight: "medium"
              }}
            >
              {assignLoading ? "Assigning..." : "Assign Ticket"}
            </Button>
            </Tooltip>
          </Box>
        </Box>
      </Modal>

      {/* Reassign Ticket Modal */}
      <Modal
        open={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        aria-labelledby="reassign-ticket-modal-title"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 450,
            maxWidth: "90vw",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 3,
            maxHeight: "80vh",
            overflow: "auto"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography id="reassign-ticket-modal-title" variant="h6" sx={{ fontWeight: 600, color: "#1976d2" }}>
              Reassign Ticket
            </Typography>
            <IconButton
              onClick={() => setIsReassignModalOpen(false)}
              size="small"
              sx={{ color: "#666" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold", color: "#333" }}>
                Select Attendee:
              </Typography>
              <Autocomplete
                value={selectedReassignAttendee || null}
                onChange={(e, val) => setSelectedReassignAttendee(val)}
                options={attendees}
                getOptionLabel={(o) => o?.full_name || o?.name || o?.username || ""}
                renderInput={(params) => (
                  <TextField {...params} size="small" placeholder="Type to search attendee..." />
                )}
                renderOption={(props, a) => (
                  <li {...props} key={a.id}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                        {a.full_name || a.name} - {a.role}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#666" }}>
                        @{a.username}
                      </Typography>
                    </Box>
                  </li>
                )}
                isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                fullWidth
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold", color: "#333" }}>
                Reassignment Reason (required):
              </Typography>
              <TextField
                value={reassignReason}
                onChange={e => setReassignReason(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                size="small"
                placeholder="Enter reason for reassignment..."
                required
                inputProps={{
                  maxLength: 500
                }}
                helperText={`${reassignReason.length}/500 characters`}
                sx={{
                  "& .MuiInputBase-root": {
                    fontSize: "0.9rem"
                  }
                }}
              />
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
            <Button 
              onClick={() => setIsReassignModalOpen(false)} 
              disabled={reassignLoading}
              variant="outlined"
              size="small"
              sx={{ 
                px: 2,
                textTransform: "none",
                borderColor: "#ccc",
                color: "#666"
              }}
            >
              Cancel
            </Button>
            <Tooltip title="Reassign this ticket to a different attendee">
            <Button
              variant="contained"
              color="secondary"
              onClick={handleReassignTicket}
              disabled={reassignLoading || !selectedReassignAttendee || !reassignReason.trim()}
              size="small"
              sx={{ 
                px: 2,
                textTransform: "none",
                fontWeight: "medium"
              }}
            >
              {reassignLoading ? "Reassigning..." : "Reassign Ticket"}
            </Button>
            </Tooltip>
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
                <option value="Duplicate">Duplicate</option>
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
              <Box
                sx={{
                  width: "100%",
                  "& input[type='file']": {
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                    display: "block"
                  }
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box"
                  }}
                />
              </Box>
              {fileError && (
                <Typography variant="caption" sx={{ color: "red", mt: 1, display: "block" }}>
                  {fileError}
                </Typography>
              )}
              {attachment && !fileError && (
                <Typography variant="caption" sx={{ color: "green", mt: 1, display: "block" }}>
                  File selected: {attachment.name} ({(attachment.size / (1024 * 1024)).toFixed(2)}MB)
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: "gray", mt: 0.5, display: "block", fontSize: "0.75rem" }}>
                Maximum file size: 10MB
              </Typography>
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
        <DialogTitle>Forward to Director General</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            {/* Creator's Description (Editable) - Only show for manager and head-of-unit, NOT for director */}
            {(userRole === "manager" || userRole === "head-of-unit") && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                  Creator's Description (Editable):
                </Typography>
                <TextField
                  multiline
                  rows={4}
                  value={editedResolution}
                  onChange={e => setEditedResolution(e.target.value)}
                  fullWidth
                  placeholder="Edit creator's description..."
                />
                <Typography variant="caption" sx={{ color: "#666", mt: 0.5, display: "block" }}>
                  Edit the creator's description. This will update the ticket's description.
                </Typography>
              </Box>
            )}

            {/* Director/Head-of-unit's own description */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                {userRole === "director" ? "Director's Description:" : userRole === "head-of-unit" ? "Head of Unit's Description:" : "Your Description:"}
              </Typography>
              <TextField
                multiline
                rows={4}
                value={ownDescription}
                onChange={e => setOwnDescription(e.target.value)}
                fullWidth
                placeholder={userRole === "director" ? "Enter your (Director's) description..." : userRole === "head-of-unit" ? "Enter your (Head of Unit's) description..." : "Enter your description..."}
              />
              <Typography variant="caption" sx={{ color: "#666", mt: 0.5, display: "block" }}>
                {userRole === "director" 
                  ? "This is your (Director's) own description. This will be saved in your assignment record." 
                  : userRole === "head-of-unit" 
                  ? "This is your (Head of Unit's) own description. This will be saved in your assignment record."
                  : "This is your own description."}
              </Typography>
            </Box>

            {/* Show existing previous assigner's attachment if any */}
            {(previousAssignerAttachment || selectedTicket?.attachment_path) && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                  {userRole === "director" ? "Manager's Attachment:" : userRole === "head-of-unit" ? "Attendee's Attachment:" : "Attendee's Attachment:"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ 
                    color: '#28a745', 
                    fontStyle: 'italic', 
                    cursor: 'pointer', 
                    textDecoration: 'underline',
                    p: 1,
                    bgcolor: '#f8f9fa',
                    borderRadius: 1,
                    border: '1px solid #dee2e6'
                  }}
                  onClick={() => handleDownloadAttachment(previousAssignerAttachment || selectedTicket.attachment_path)}
                >
                  📎 View {userRole === "director" ? "Manager's" : userRole === "head-of-unit" ? "Attendee's" : "Attendee's"} Attachment: {getFileNameFromPath(previousAssignerAttachment || selectedTicket.attachment_path)}
                </Typography>
              </Box>
            )}

            {/* Attachment Input for Head of Unit, Manager, and Director */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Attachment (Optional):
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  "& input[type='file']": {
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                    display: "block"
                  }
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box"
                  }}
                />
              </Box>
              {fileError && (
                <Typography variant="caption" sx={{ color: "red", mt: 1, display: "block" }}>
                  {fileError}
                </Typography>
              )}
              {attachment && !fileError && (
                <Typography variant="caption" sx={{ color: "green", mt: 1, display: "block" }}>
                  File selected: {attachment.name} ({(attachment.size / (1024 * 1024)).toFixed(2)}MB)
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: "gray", mt: 0.5, display: "block", fontSize: "0.75rem" }}>
                Maximum file size: 10MB
              </Typography>
            </Box>

            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleForwardToDGSubmit}
                disabled={!ownDescription.trim()}
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
          </Box>
        </DialogContent>
      </Dialog>

      {/* DG Close Ticket Dialog */}
      <Dialog open={isDGApprovalDialogOpen} onClose={() => setIsDGApprovalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Close Ticket - Director General
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Justification (required):
              </Typography>
              <TextField
                multiline
                rows={4}
                value={dgNotes}
                onChange={e => setDgNotes(e.target.value)}
                fullWidth
                placeholder="Provide justification for closing this ticket..."
                required
              />
            </Box>

            {/* Attachment Input for Director General */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Attachment (Optional):
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  "& input[type='file']": {
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                    display: "block"
                  }
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box"
                  }}
                />
              </Box>
              {fileError && (
                <Typography variant="caption" sx={{ color: "red", mt: 1, display: "block" }}>
                  {fileError}
                </Typography>
              )}
              {attachment && !fileError && (
                <Typography variant="caption" sx={{ color: "green", mt: 1, display: "block" }}>
                  File selected: {attachment.name} ({(attachment.size / (1024 * 1024)).toFixed(2)}MB)
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: "gray", mt: 0.5, display: "block", fontSize: "0.75rem" }}>
                Maximum file size: 10MB
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 2, textAlign: "right" }}>
            <Button
              variant="contained"
              color="success"
              onClick={handleDGCloseTicket}
              disabled={dgApprovalLoading || !dgNotes || !dgNotes.trim()}
            >
              {dgApprovalLoading ? "Closing..." : "Close Ticket"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setIsDGApprovalDialogOpen(false);
                setAttachment(null);
              }}
              sx={{ ml: 1 }}
              disabled={dgApprovalLoading}
            >
              Cancel
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Agent Reverse Complaint Dialog */}
      <Dialog open={isAgentReverseModalOpen} onClose={() => setIsAgentReverseModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reverse Complaint - Resolution Details</DialogTitle>
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
                value={complaintSeverity}
                onChange={(e) => setComplaintSeverity(e.target.value)}
              >
                <option value="">Select Resolution Type</option>
                <option value="Resolved">Resolved</option>
                <option value="Duplicate">Duplicate</option>
              </select>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Resolution Details:
              </Typography>
              <TextField
                multiline
                rows={4}
                value={agentRecommendation}
                onChange={e => setAgentRecommendation(e.target.value)}
                fullWidth
                placeholder="Enter resolution details..."
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Attachment (Optional):
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  "& input[type='file']": {
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                    display: "block"
                  }
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box"
                  }}
                />
              </Box>
              {fileError && (
                <Typography variant="caption" sx={{ color: "red", mt: 1, display: "block" }}>
                  {fileError}
                </Typography>
              )}
              {attachment && !fileError && (
                <Typography variant="caption" sx={{ color: "green", mt: 1, display: "block" }}>
                  File selected: {attachment.name} ({(attachment.size / (1024 * 1024)).toFixed(2)}MB)
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: "gray", mt: 0.5, display: "block", fontSize: "0.75rem" }}>
                Maximum file size: 10MB
              </Typography>
            </Box>

            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Button
                variant="contained"
                color="warning"
                onClick={handleAgentReverse}
                disabled={!complaintSeverity || !agentRecommendation.trim() || agentReverseLoading}
              >
                {agentReverseLoading ? "Submitting..." : "Reverse Complaint"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setIsAgentReverseModalOpen(false);
                  setAgentRecommendation("");
                  setComplaintSeverity("");
                  setAttachment(null);
                }}
                sx={{ ml: 1 }}
                disabled={agentReverseLoading}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Edit Reversed Ticket Dialog */}
      <Dialog open={isEditReversedTicketDialogOpen} onClose={() => setIsEditReversedTicketDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Reversed Ticket Details
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            {/* Subject Field - Auto-fills Sub-section and Section when selected (like ticket creation) */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Subject: <span style={{ color: "red" }}>*</span>
              </Typography>
              {functionData && functionData.length > 0 ? (
                <select
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc"
                  }}
                  value={functionData.find(item => item.name === editReversedTicketData.subject)?.id || ""}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                >
                  <option value="">Select Subject</option>
                  {functionData.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              ) : (
                <TextField
                  fullWidth
                  value={editReversedTicketData.subject}
                  onChange={(e) => handleEditReversedTicketChange("subject", e.target.value)}
                  placeholder="Enter ticket subject..."
                  size="small"
                  required
                />
              )}
              {functionData && functionData.length === 0 && (
                <span style={{ color: "orange", fontSize: "0.75rem", display: "block", marginTop: "4px" }}>
                  No function data loaded. Please check if subjects are configured.
                </span>
              )}
            </Box>

            {/* Sub-section Field - Auto-filled when Subject is selected */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Sub-section:
              </Typography>
              <TextField
                fullWidth
                value={editReversedTicketData.sub_section}
                InputProps={{
                  readOnly: true,
                  style: {
                    backgroundColor: "#f5f5f5",
                    fontSize: "0.875rem"
                  }
                }}
                placeholder="Auto-filled when subject is selected..."
                size="small"
              />
            </Box>

            {/* Section Field - Auto-filled when Subject is selected */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Section:
              </Typography>
              <TextField
                fullWidth
                value={editReversedTicketData.section || "Unit"}
                InputProps={{
                  readOnly: true,
                  style: {
                    backgroundColor: "#f5f5f5",
                    fontSize: "0.875rem"
                  }
                }}
                placeholder="Auto-filled when subject is selected..."
                size="small"
              />
            </Box>


            {/* Display Fields (Read-only) */}
            <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Summary:
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Subject:</strong> {editReversedTicketData.subject || "N/A"}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Sub-section:</strong> {editReversedTicketData.sub_section || "N/A"}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Section:</strong> {editReversedTicketData.section || "N/A"}
              </Typography>
            </Box>

            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleEditReversedTicketSubmit}
                disabled={!editReversedTicketData.subject.trim() || editReversedTicketLoading}
              >
                {editReversedTicketLoading ? "Updating..." : "Update Ticket Details"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setIsEditReversedTicketDialogOpen(false)}
                sx={{ ml: 1 }}
                disabled={editReversedTicketLoading}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <ActionMessageModal
        open={actionModal.isOpen}
        type={actionModal.type}
        message={actionModal.message}
        onClose={closeSnackbar}
      />

      {/* Ticket Charts Modal */}
      <Dialog 
        open={showTicketCharts} 
        onClose={() => {
          setShowTicketCharts(false);
          setNewMessage("");
        }} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid #e0e0e0',
          flexShrink: 0
        }}>
          <Typography variant="h6">Ticket Charts - Messages</Typography>
          <IconButton onClick={() => {
            setShowTicketCharts(false);
            setNewMessage("");
          }} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          p: 0, 
          flex: 1, 
          overflow: 'hidden',
          minHeight: 0
        }}>
          {/* Messages List */}
          <Box 
            sx={{ 
              flex: 1, 
              overflowY: 'auto', 
              p: 2, 
              minHeight: 0
            }}
            id="messages-container"
          >
            {ticketMessages.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>No messages yet. Start the conversation!</Alert>
            ) : (
              ticketMessages.map((message, index) => {
                const currentUserId = localStorage.getItem('userId');
                const isOwnMessage = message.user_id === currentUserId;
                return (
                  <Box
                    key={message.id || index}
                    sx={{
                      mb: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1.5,
                        maxWidth: '70%',
                        backgroundColor: isOwnMessage ? '#e3f2fd' : '#f5f5f5',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
                        {message.user_name || message.full_name || 'Unknown User'}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {renderMessageWithMentions(message.message)}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                        {new Date(message.created_at).toLocaleString()}
                      </Typography>
                    </Paper>
                  </Box>
                );
              })
            )}
          </Box>
          
          {/* Message Input - Always visible at bottom */}
          <Box sx={{ 
            p: 2, 
            borderTop: '1px solid #e0e0e0', 
            backgroundColor: '#fafafa',
            flexShrink: 0
          }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <Box sx={{ position: 'relative', flex: 1 }}>
                <TextField
                  inputRef={messageTextFieldRef}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Type your message... Type @ to mention users"
                  value={newMessage}
                  onChange={handleMessageTextChange}
                  onKeyDown={handleMentionKeyDown}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !showMentions) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  size="small"
                  disabled={sendingMessage}
                />
                {showMentions && filteredMentionUsers.length > 0 && (
                  <ClickAwayListener onClickAway={() => setShowMentions(false)}>
                    <Popper
                      open={showMentions}
                      anchorEl={mentionAnchorEl}
                      placement="top-start"
                      style={{ zIndex: 1300, width: mentionAnchorEl?.offsetWidth || 300 }}
                    >
                      <Paper
                        elevation={4}
                        sx={{
                          maxHeight: 200,
                          overflow: 'auto',
                          mt: 1,
                          border: '1px solid #e0e0e0'
                        }}
                      >
                        <List dense>
                          {filteredMentionUsers.map((user, index) => (
                            <ListItem
                              key={user.id}
                              button
                              selected={index === selectedMentionIndex}
                              onClick={() => handleMentionSelect(user)}
                              sx={{
                                '&:hover': { backgroundColor: '#f5f5f5' },
                                '&.Mui-selected': { backgroundColor: '#e3f2fd' }
                              }}
                            >
                              <ListItemAvatar>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                                  {user.name.charAt(0).toUpperCase()}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={user.name}
                                secondary={`${user.role}${user.unit_section ? ` • ${user.unit_section}` : ''}`}
                                primaryTypographyProps={{ fontSize: '0.875rem' }}
                                secondaryTypographyProps={{ fontSize: '0.75rem' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Popper>
                  </ClickAwayListener>
                )}
              </Box>
              <Button
                variant="contained"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                sx={{ 
                  alignSelf: 'flex-end',
                  minWidth: '80px'
                }}
              >
                {sendingMessage ? 'Sending...' : 'Send'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
} 

