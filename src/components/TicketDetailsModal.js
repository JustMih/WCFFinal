import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Divider, IconButton, Button, Dialog, DialogTitle, DialogContent, Avatar, Paper, TextField, Tooltip, Select, MenuItem, Chip } from "@mui/material";
import ChatIcon from '@mui/icons-material/Chat';
import { Download, AttachFile } from '@mui/icons-material';
import { baseURL } from "../config";

const getCreatorName = (selectedTicket) =>
  selectedTicket.created_by ||
  (selectedTicket.creator && selectedTicket.creator.name) ||
  `${selectedTicket.first_name || ""} ${selectedTicket.last_name || ""}`.trim() ||
  "N/A";

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
    // Use assignmentHistory as-is, do not override assigned_to_role unless missing
    steps.push(...assignmentHistory.map(a => ({
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
        if (isClosed) {
          color = "green";
        } else if (isCurrentWithCoordinator) {
          color = "#1976d2"; // Blue for current coordinator step
        } else if (idx < currentAssigneeIdx) {
          color = "green";
        } else if (idx === currentAssigneeIdx) {
          color = "#1976d2";
        } else {
          color = "gray";
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
                {actionLabel} - {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
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
            message = `Message from ${prevUser}: ${a.reason || 'No message'}`;
          }
        }
        return (
          <Box key={idx} sx={{ display: "flex", mb: 2, alignItems: "flex-start" }}>
            <Avatar sx={{ bgcolor: idx === 0 ? "#43a047" : "#1976d2", mr: 2 }}>
              {a.assigned_to_name ? a.assigned_to_name[0] : "?"}
            </Avatar>
            <Paper elevation={2} sx={{ p: 2, bgcolor: idx === 0 ? "#e8f5e9" : "#f5f5f5", flex: 1 }}>
              <Typography sx={{ fontWeight: "bold" }}>
                {a.assigned_to_name || a.assigned_to_id || 'Unknown'} {" "}
                <span style={{ color: "#888", fontWeight: "normal" }}>
                  ({a.assigned_to_role || "N/A"})
                </span>
              </Typography>
              <Typography variant="body2" sx={{ color: idx === 0 ? "#43a047" : "#1976d2", wordBreak: 'break-word', whiteSpace: 'pre-line', overflowWrap: 'break-word' }}>
                {message}
              </Typography>
              <Typography variant="caption" sx={{ color: "#888" }}>
                {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
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
  handleRating,
  handleConvertOrForward,
  handleCategoryChange,
  handleUnitChange,
  categories = [],
  units = [],
  convertCategory = {},
  forwardUnit = {},
  refreshTickets = () => {},
  setSnackbar = () => {},
}) {
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const userRole = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const [isAttendDialogOpen, setIsAttendDialogOpen] = useState(false);
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [attachment, setAttachment] = useState(null);
  
  // Coordinator-specific states
  const [resolutionType, setResolutionType] = useState("");
  const [isCoordinatorCloseDialogOpen, setIsCoordinatorCloseDialogOpen] = useState(false);

  // Reverse modal state
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [reverseReason, setReverseReason] = useState("");
  const [isReversing, setIsReversing] = useState(false);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const [assignReason, setAssignReason] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [attendees, setAttendees] = useState([]);

  const showAttendButton =
    // (userRole === "agent" || userRole === "attendee") &&
    selectedTicket &&
    selectedTicket.status !== "Closed" &&
    selectedTicket.assigned_to_id &&
    userRole !== "coordinator" &&
    String(selectedTicket.assigned_to_id) === String(userId);

  // Coordinator-specific conditions
  const showCoordinatorActions = 
    userRole === "coordinator" && 
    selectedTicket && 
    selectedTicket.assigned_to_id &&
    String(selectedTicket.assigned_to_id) === String(userId) &&
    selectedTicket.status !== "Closed";

  const handleAttend = () => {
    // setIsAttendDialogOpen(true);

    setIsCoordinatorCloseDialogOpen(true);
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

      const response = await fetch(
        `${baseURL}/coordinator/${selectedTicket.id}/close`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        setIsCoordinatorCloseDialogOpen(false);
        onClose();
        refreshTickets();
        setSnackbar({open: true, message: 'Ticket closed successfully', severity: 'success'});
      } else {
        throw new Error("Failed to close ticket");
      }
    } catch (error) {
      console.error("Error closing ticket:", error);
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
                  <Button variant="contained" color="primary" onClick={handleAttend} sx={{ mr: 1 }}>
                    Attend
                  </Button>
                )}
                
                {/* Coordinator Actions */}
                {showCoordinatorActions && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2, justifyContent: "flex-end" }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => handleRating(selectedTicket.id, "Minor")}
                    >
                      Minor
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => handleRating(selectedTicket.id, "Major")}
                    >
                      Major
                    </Button>

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

                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleCoordinatorClose}
                    >
                      Close ticket
                    </Button>
                  </Box>
                )}

                {/* Reverse and Assign buttons for roles other than agent, coordinator, attendee */}
                {!["agent", "coordinator", "attendee"].includes(localStorage.getItem("role")) && (
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
              onClick={handleAttendSubmit}
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

      {/* Coordinator Close Dialog */}
      <Dialog open={isCoordinatorCloseDialogOpen} onClose={() => setIsCoordinatorCloseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Close Ticket</DialogTitle>
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
    </>
  );
} 