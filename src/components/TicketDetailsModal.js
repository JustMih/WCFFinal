import React, { useState } from "react";
import { Modal, Box, Typography, Divider, IconButton, Button, Dialog, DialogTitle, DialogContent, Avatar, Paper, TextField } from "@mui/material";
import ChatIcon from '@mui/icons-material/Chat';
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

const AssignmentStepper = ({ assignmentHistory, selectedTicket, assignedUser }) => {
  if (!selectedTicket) return null;
  // Build steps array
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
  if (
    selectedTicket.status === "Open" &&
    (!selectedTicket.assigned_to_id || steps.length === 1)
  ) {
    currentAssigneeIdx = 0;
  } else {
    const idx = steps.findIndex(
      a => a.assigned_to_id === selectedTicket.assigned_to_id
    );
    currentAssigneeIdx = idx !== -1 ? idx : steps.length - 1;
  }

  return (
    <Box>
      {steps.map((a, idx) => {
        // Determine if this is the last step and ticket is closed
        const isLastStep = idx === steps.length - 1;
        const isClosed = selectedTicket.status === "Closed" && isLastStep;

        // Set color: green for completed, blue for current, gray for pending, green for closed last step
        let color;
        if (isClosed) {
          color = "green";
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
              </Typography>
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
        <Typography sx={{ color: "#3f51b5", wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
          Ticket History
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {steps.map((a, idx) => {
        let message;
        if (idx === 0) {
          message = selectedTicket.description
            ? `Created the ticket\n Description:${selectedTicket.description}`
            : 'Created the ticket';
        } else {
          const prevUser = steps[idx - 1]?.assigned_to_name || 'Previous User';
          if (selectedTicket.status === "Closed") {
            if (selectedTicket.resolution_details) {
              message = `Message from ${prevUser}: ${selectedTicket.resolution_details}`;
            } else if (a.action){
              message = `Message from ${prevUser}: ${a.reason || 'No message'}`;
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

export default function TicketDetailsModal({
  open,
  onClose,
  selectedTicket,
  assignmentHistory
}) {
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const userRole = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const [isAttendDialogOpen, setIsAttendDialogOpen] = useState(false);
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [attachment, setAttachment] = useState(null);

  const showAttendButton =
    (userRole === "agent" || userRole === "attendee") &&
    selectedTicket &&
    selectedTicket.status !== "Closed" &&
    selectedTicket.assigned_to_id &&
    selectedTicket.assigned_to_id.toString() === userId;

  const handleAttend = () => {
    setIsAttendDialogOpen(true);
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
      } else {
        // Optionally show an error message
      }
    } catch (error) {
      // Optionally show an error message
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
                        {selectedTicket.created_by ||
                          (selectedTicket.creator && selectedTicket.creator.name) ||
                          `${selectedTicket.first_name || ""} ${selectedTicket.last_name || ""}`.trim() ||
                          "N/A"}
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
                            <Typography>
                              <strong>Message:</strong> {last.reason}
                            </Typography>
                          )}
                          {selectedTicket.status === "Closed" && selectedTicket.resolution_details && (
                            <Typography sx={{ mt: 1 }}>
                              <strong>Resolution Details:</strong> {selectedTicket.resolution_details}
                            </Typography>
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
                    <strong>Subject:</strong> {selectedTicket.subject || "N/A"}
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

              {/* Action Buttons */}
              <Box sx={{ mt: 2, textAlign: "right" }}>
                {showAttendButton && (
                  <Button variant="contained" color="primary" onClick={handleAttend} sx={{ mr: 1 }}>
                    Attend
                  </Button>
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
        <DialogTitle>Ticket History</DialogTitle>
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
    </>
  );
} 