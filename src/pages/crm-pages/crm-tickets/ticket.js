import React, { useState, useEffect } from "react";
import { FaEye, FaPlus } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Modal,
  Snackbar,
  Tooltip,
  Typography,
  TextField,
  Avatar,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent
} from "@mui/material";
import ColumnSelector from "../../../components/colums-select/ColumnSelector";
import { baseURL } from "../../../config";
import "./ticket.css";
import ChatIcon from '@mui/icons-material/Chat';
import TicketDetailsModal from '../../../components/TicketDetailsModal';

export default function Crm() {
  const [agentTickets, setAgentTickets] = useState([]);
  const [agentTicketsError, setAgentTicketsError] = useState(null);
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState("");
  const [modal, setModal] = useState({ isOpen: false, type: "", message: "" });
  const [activeColumns, setActiveColumns] = useState([
    "id",
    "fullName",
    "phone_number",
    "status",
    "subject",
    "category",
    "assigned_to_role",
    "createdAt"
  ]);
  const [loading, setLoading] = useState(true);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [assignedUser, setAssignedUser] = useState(null);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setUserId(userId);
      console.log("user id is:", userId);
    } else {
      setAgentTicketsError("User not authenticated. Please log in.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchAgentTickets();
    }
  }, [userId]);

  useEffect(() => {
    if (
      !assignmentHistory.length &&
      selectedTicket &&
      selectedTicket.assigned_to_id &&
      !selectedTicket.assigned_to_name &&
      !(selectedTicket.assignee && selectedTicket.assignee.name)
    ) {
      // Fetch user info
      const fetchUser = async () => {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${baseURL}/users/${selectedTicket.assigned_to_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        try {
          const data = await res.json();
          setAssignedUser(data.user || data);
        } catch (e) {
          setAssignedUser({ name: "Unknown", role: "Unknown" });
        }
      };
      fetchUser();
    }
  }, [selectedTicket, assignmentHistory]);

  const fetchAgentTickets = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication error. Please log in again.");
      }

      const url = `${baseURL}/ticket/open/${userId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          setAgentTickets([]);
          setAgentTicketsError("No tickets found for this agent.");
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched tickets:", data);
      if (data && Array.isArray(data.tickets)) {
        setAgentTickets(data.tickets);
        setAgentTicketsError(null);
      } else {
        setAgentTickets([]);
        setAgentTicketsError("No tickets found for this agent.");
      }
    } catch (error) {
      setAgentTicketsError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentsChange = (e) => {
    setComments(e.target.value);
  };

  const handleCommentsSubmit = async () => {
    if (!selectedTicket) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${baseURL}/ticket/update/${selectedTicket.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ comments })
        }
      );

      if (response.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: "Comments updated successfully."
        });
        fetchAgentTickets();
      } else {
        const data = await response.json();
        setModal({
          isOpen: true,
          type: "error",
          message: data.message || "Failed to update comments."
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        message: `Network error: ${error.message}`
      });
    }
  };

  const openModal = async (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${baseURL}/ticket/${ticket.id}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAssignmentHistory(data);
    } catch (e) {
      setAssignmentHistory([]);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    setComments("");
    setModal({ isOpen: false, type: "", message: "" });
  };

  // Helper function to render workflow steps
  const renderWorkflowStep = (stepNumber, title, details, status) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          bgcolor:
            status === "completed"
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

  // Helper to get step status
  const getStepStatus = (stepIndex, currentStepIndex) => {
    if (stepIndex < currentStepIndex) return "completed";
    if (stepIndex === currentStepIndex) return "current";
    return "pending";
  };

  // Function to render dynamic workflow based on category
  const renderDynamicWorkflow = (ticket) => {
    if (!ticket) return null;

    // Example for Complaint workflow (customize for your flows)
    if (ticket.category === "Complaint") {
      // Define the steps
      const steps = [
        {
          title: "Created by Agent",
          details: `${ticket.created_by} - ${ticket.created_at ? new Date(ticket.created_at).toLocaleString() : "N/A"}`
        },
        {
          title: "Coordinator Review",
          details: ticket.assigned_to_role === "Coordinator"
            ? `${ticket.assigned_to_role} - ${ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : "N/A"}`
            : "Pending Coordinator Review"
        },
        {
          title: "Attendee Review",
          details: ticket.assigned_to_role === "attendee"
            ? `${ticket.assigned_to_role} - ${ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : "N/A"}`
            : "Pending Attendee Review"
        },
        {
          title: "Attendee Review",
          details: ticket.assigned_to_role === "focal-person"
            ? `${ticket.assigned_to_role} - ${ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : "N/A"}`
            : "Pending Attendee Review"
        },
        // Add more steps as needed...
      ];

      // Determine current step index
      let currentStepIndex = 0;
      if (ticket.assigned_to_role === "Coordinator") currentStepIndex = 1;
      // Add more logic for further steps if needed

        return (
          <Box>
          {steps.map((step, idx) =>
            renderWorkflowStep(idx + 1, step.title, step.details, getStepStatus(idx, currentStepIndex))
          )}
          </Box>
        );
    }

    // ... handle other categories similarly ...

    // Default fallback
        return (
      <Typography>
        No specific workflow defined for this category.
                </Typography>
    );
  };

  const renderAssignmentStepper = (assignmentHistory, selectedTicket) => {
    // Always start with the creator step
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

    // If assignmentHistory is not empty, use it
    if (Array.isArray(assignmentHistory) && assignmentHistory.length > 0) {
      steps.push(...assignmentHistory);
    } else if (
      selectedTicket.assigned_to_id &&
      selectedTicket.assigned_to_id !== "creator"
    ) {
      // Add a synthetic step for the assigned user from the ticket table
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
      currentAssigneeIdx = 0; // Still with creator
    } else {
      const idx = steps.findIndex(
        a => a.assigned_to_id === selectedTicket.assigned_to_id
      );
      currentAssigneeIdx = idx !== -1 ? idx : steps.length - 1;
    }

        return (
          <Box>
        {steps.map((a, idx) =>
          renderWorkflowStep(
            idx + 1,
            `${a.assigned_to_name} (${a.assigned_to_role})`,
            `${a.action} - ${a.created_at ? new Date(a.created_at).toLocaleString() : ''}`,
            getStepStatus(idx, currentAssigneeIdx)
          )
        )}
          </Box>
        );
  };

  const filteredTickets = agentTickets.filter((ticket) => {
    const searchValue = search.toLowerCase();
    const phone = (ticket.phone_number || "").toLowerCase();
    const nida = (ticket.nida_number || "").toLowerCase();
    const fullName = `${ticket.first_name || ""} ${ticket.middle_name || ""} ${
      ticket.last_name || ""
    }`.toLowerCase();
    return (
      (phone.includes(searchValue) ||
        nida.includes(searchValue) ||
        fullName.includes(searchValue)) &&
      (!filterStatus || ticket.status === filterStatus)
    );
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderTableHeader = () => (
    <tr>
      {activeColumns.includes("id") && <th>#</th>}
      {activeColumns.includes("fullName") && <th>Full Name</th>}
      {activeColumns.includes("phone_number") && <th>Phone</th>}
      {activeColumns.includes("status") && <th>Status</th>}
      {activeColumns.includes("subject") && <th>Subject</th>}
      {activeColumns.includes("category") && <th>Category</th>}
      {activeColumns.includes("assigned_to_role") && <th>Assigned Role</th>}
      {activeColumns.includes("createdAt") && <th>Created At</th>}
      <th>Actions</th>
    </tr>
  );

  const renderTableRow = (ticket, index) => (
    <tr key={ticket.id || index}>
      {activeColumns.includes("id") && (
        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
      )}
      {activeColumns.includes("fullName") && (
        <td>
          {ticket.first_name && ticket.first_name.trim() !== ""
            ? `${ticket.first_name} ${ticket.middle_name || ""} ${
                ticket.last_name || ""
              }`.trim()
            : typeof ticket.institution === "string"
            ? ticket.institution
            : ticket.institution &&
              typeof ticket.institution === "object" &&
              typeof ticket.institution.name === "string"
            ? ticket.institution.name
            : "N/A"}
        </td>
      )}
      {activeColumns.includes("phone_number") && (
        <td>{ticket.phone_number || "N/A"}</td>
      )}
      {activeColumns.includes("status") && (
        <td>
          <span
            style={{
              color:
                ticket.status === "Open"
                  ? "green"
                  : ticket.status === "Closed"
                  ? "gray"
                  : "blue"
            }}
          >
            {ticket.status || "N/A"}
          </span>
        </td>
      )}
      {activeColumns.includes("subject") && <td>{ticket.subject || "N/A"}</td>}
      {activeColumns.includes("category") && (
        <td>{ticket.category || "N/A"}</td>
      )}
      {activeColumns.includes("assigned_to_role") && (
        <td>{ticket.assigned_to_role || "N/A"}</td>
      )}
      {activeColumns.includes("createdAt") && (
        <td>
          {ticket.created_at
            ? new Date(ticket.created_at).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
              })
            : "N/A"}
        </td>
      )}
      <td>
        <Tooltip title="Ticket Details">
          <button
            className="view-ticket-details-btn"
            onClick={() => openModal(ticket)}
          >
            <FaEye />
          </button>
        </Tooltip>
      </td>
    </tr>
  );

  // Add handler functions for coordinator actions
  const handleRating = async (ticketId, rating) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/ticket/rate/${ticketId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          complaint_type: rating,
          // If Major, assign to DG; if Minor, assign to Focal Person
          assigned_to_role: rating === "Major" ? "DG" : "Focal Person"
        })
      });

      if (response.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: `Ticket rated as ${rating} successfully.`
        });
        fetchAgentTickets();
      } else {
        const data = await response.json();
        setModal({
          isOpen: true,
          type: "error",
          message: data.message || "Failed to rate ticket."
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        message: `Network error: ${error.message}`
      });
    }
  };

  const handleForward = async (ticketId) => {
    // You might want to show a dialog to select the unit
    const unit = prompt("Enter the unit to forward to:");
    if (!unit) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/ticket/forward/${ticketId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          forwarded_to: unit,
          status: "Forwarded"
        })
      });

      if (response.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: `Ticket forwarded to ${unit} successfully.`
        });
        fetchAgentTickets();
      } else {
        const data = await response.json();
        setModal({
          isOpen: true,
          type: "error",
          message: data.message || "Failed to forward ticket."
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        message: `Network error: ${error.message}`
      });
    }
  };

  const handleClose = async (ticketId) => {
    const resolution = prompt("Enter resolution details:");
    if (!resolution) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/ticket/close/${ticketId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "Closed",
          resolution_details: resolution,
          date_of_resolution: new Date().toISOString()
        })
      });

      if (response.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: "Ticket closed successfully."
        });
        fetchAgentTickets();
      } else {
        const data = await response.json();
        setModal({
          isOpen: true,
          type: "error",
          message: data.message || "Failed to close ticket."
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        message: `Network error: ${error.message}`
      });
    }
  };

  const handleChangeToInquiry = async (ticketId) => {
    const confirmation = window.confirm(
      "Are you sure you want to change this Complaint to an Inquiry?"
    );
    if (!confirmation) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${baseURL}/ticket/change-to-inquiry/${ticketId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            category: "Other Inquiry", // Or a more specific inquiry category if available
            status: "Open", // Reset status to open for inquiry workflow
            assigned_to_role: "Focal Person" // Auto-assign as per inquiry workflow 5.1.v and vi
          })
        }
      );

      if (response.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: "Complaint successfully changed to Inquiry."
        });
        fetchAgentTickets();
      } else {
        const data = await response.json();
        setModal({
          isOpen: true,
          type: "error",
          message: data.message || "Failed to change complaint to inquiry."
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        message: `Network error: ${error.message}`
      });
    }
  };

  function AssignmentFlowChat({ assignmentHistory, selectedTicket }) {
    // Build the creator bubble
    const creatorStep = selectedTicket
      ? {
          assigned_to_name: selectedTicket.created_by ||
            (selectedTicket.creator && selectedTicket.creator.name) ||
            `${selectedTicket.first_name || ''} ${selectedTicket.last_name || ''}`.trim() ||
            'N/A',
          assigned_to_role: 'Creator',
          reason: 'Created the ticket',
          created_at: selectedTicket.created_at,
        }
      : null;
    // Combine creator and assignment history
    const steps = creatorStep ? [creatorStep, ...assignmentHistory] : assignmentHistory;
    return (
      <Box sx={{ maxWidth: 400, ml: "auto" }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ color: "#3f51b5" }}>
            Ticket History
          </Typography>
          {/* <IconButton size="small" onClick={() => setIsFlowModalOpen(true)} title="Show Assignment Flow Chart">
            <ChatIcon color="primary" />
          </IconButton> */}
        </Box>
        <Divider sx={{ mb: 2 }} />
        {steps.map((a, idx) => {
          // For the creator bubble, show a default message
          let message;
          if (idx === 0) {
            message = 'Created the ticket';
          } else {
            const prevUser = steps[idx - 1]?.assigned_to_name || 'Previous User';
            message = `Message from ${prevUser}: ${a.reason || 'No message'}`;
          }
          return (
            <Box key={idx} sx={{ display: "flex", mb: 2, alignItems: "flex-start" }}>
              <Avatar sx={{ bgcolor: idx === 0 ? "#43a047" : "#1976d2", mr: 2 }}>
                {a.assigned_to_name ? a.assigned_to_name[0] : "?"}
              </Avatar>
              <Paper elevation={2} sx={{ p: 2, bgcolor: idx === 0 ? "#e8f5e9" : "#f5f5f5", flex: 1 }}>
                <Typography sx={{ fontWeight: "bold" }}>
                  {a.assigned_to_name || "Unknown"}{" "}
                  <span style={{ color: "#888", fontWeight: "normal" }}>
                    ({a.assigned_to_role || "N/A"})
                  </span>
                </Typography>
                <Typography variant="body2" sx={{ color: idx === 0 ? "#43a047" : "#1976d2" }}>
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

  if (loading) {
    return (
      <div className="p-6">
        <h3 className="title">Loading...</h3>
      </div>
    );
  }

  return (
    <div className="coordinator-dashboard-container">
      <div style={{ overflowX: "auto", width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px"
          }}
        >
          <h2>Opened Tickets List </h2>
          <Tooltip title="Columns Settings and Export" arrow>
            <IconButton onClick={() => setIsColumnModalOpen(true)}>
              <FiSettings size={20} />
            </IconButton>
          </Tooltip>
        </div>

        <div className="controls">
          <div>
            <label style={{ marginRight: "8px" }}>
              <strong>Show:</strong>
            </label>
            <select
              className="filter-select"
              value={itemsPerPage}
              onChange={(e) => {
                const value = e.target.value;
                setItemsPerPage(
                  value === "All" ? filteredTickets.length : parseInt(value)
                );
                setCurrentPage(1);
              }}
            >
              {[5, 10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value="All">All</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              className="search-input"
              type="text"
              placeholder="Search by phone or NIDA..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="Open">Open</option>
              <option value="Assigned">Assigned</option>
              <option value="Closed">Closed</option>
            </select>
            {/* <button className="add-ticket-button">
              <FaPlus /> Add Ticket
            </button> */}
          </div>
        </div>

        <table className="ticket-table">
          <thead>{renderTableHeader()}</thead>
          <tbody>
            {paginatedTickets.length > 0 ? (
              paginatedTickets.map((ticket, i) => renderTableRow(ticket, i))
            ) : (
              <tr>
                <td
                  colSpan={activeColumns.length + 1}
                  style={{ textAlign: "center", color: "red" }}
                >
                  {agentTicketsError || "No tickets found for this agent."}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <Button
            variant="outlined"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            sx={{ marginRight: 1 }}
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outlined"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            sx={{ marginLeft: 1 }}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Details Modal */}
      <TicketDetailsModal
        open={isModalOpen}
        onClose={closeModal}
        selectedTicket={selectedTicket}
        assignmentHistory={assignmentHistory}
      />

      {/* Assignment Flow Modal */}
      <Dialog open={isFlowModalOpen} onClose={() => setIsFlowModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assignment Flow</DialogTitle>
        <DialogContent>
          <AssignmentFlowChat assignmentHistory={assignmentHistory} selectedTicket={selectedTicket} />
        </DialogContent>
      </Dialog>

      {/* Column Selector */}
      <ColumnSelector
        open={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        data={agentTickets}
        onColumnsChange={setActiveColumns}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={modal.isOpen}
        autoHideDuration={3000}
        onClose={() => setModal({ isOpen: false, type: "", message: "" })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setModal({ isOpen: false, type: "", message: "" })}
          severity={modal.type}
        >
          {modal.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
