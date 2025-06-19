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
} from "@mui/material";
import ColumnSelector from "../../../components/colums-select/ColumnSelector";
import { baseURL } from "../../../config";
import "./ticket.css";

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
    "createdAt",
  ]);
  const [loading, setLoading] = useState(true);

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
          "Content-Type": "application/json",
        },
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
      const response = await fetch(`${baseURL}/ticket/update/${selectedTicket.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comments }),
      });

      if (response.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: "Comments updated successfully.",
        });
        fetchAgentTickets();
      } else {
        const data = await response.json();
        setModal({
          isOpen: true,
          type: "error",
          message: data.message || "Failed to update comments.",
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        message: `Network error: ${error.message}`,
      });
    }
  };

  const openModal = (ticket) => {
    setSelectedTicket(ticket);
    setComments(ticket.comments || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    setComments("");
    setModal({ isOpen: false, type: "", message: "" });
  };

  // Helper function to render workflow steps
  const renderWorkflowStep = (stepNumber, title, details, isActive) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ 
        width: 30, 
        height: 30, 
        borderRadius: '50%', 
        bgcolor: isActive ? 'green' : 'gray', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold'
      }}>
        {stepNumber}
      </Box>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {details}
        </Typography>
      </Box>
    </Box>
  );

  // Function to render dynamic workflow based on category
  const renderDynamicWorkflow = (ticket) => {
    if (!ticket) return null;

    switch (ticket.category) {
      case 'Claims':
      case 'Compliance':
        return (
          <Box>
            {renderWorkflowStep(1, "Created by Agent", 
              `${ticket.created_by} - ${ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'N/A'}`, true)}
            {renderWorkflowStep(2, "Attended and Closed by Attendee",
              `${ticket.attended_by ? ticket.attended_by : 'Pending Attendee'} - ${ticket.date_of_resolution ? new Date(ticket.date_of_resolution).toLocaleString() : 'N/A'}`, 
              ticket.status === 'Closed' && ticket.attended_by)}
            {/* Add Attendee action buttons here if current user is Attendee */}
          </Box>
        );
      case 'Un-assigned Claims':
      case 'Un-assigned Employer':
      case 'Un-registered Employee/Employer':
      case 'Other Inquiry': // For inquiry out of Claims and Compliance
        return (
          <Box>
            {renderWorkflowStep(1, "Created by Agent", 
              `${ticket.created_by} - ${ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'N/A'}`, true)}
            {renderWorkflowStep(2, "Focal Person Review",
              `${ticket.assigned_to_role === 'Focal Person' ? ticket.assigned_to_role : 'Pending Focal Person'} - ${ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : 'N/A'}`, 
              ticket.assigned_to_role === 'Focal Person')}
            {/* Add Focal Person action buttons here (assign, re-assign, attend and close) */}
            {renderWorkflowStep(3, "Attended and Closed by Attendee",
              `${ticket.attended_by ? ticket.attended_by : 'Pending Attendee'} - ${ticket.date_of_resolution ? new Date(ticket.date_of_resolution).toLocaleString() : 'N/A'}`, 
              ticket.status === 'Closed' && ticket.attended_by)}
            {/* Add Attendee action buttons here (reverse or attend and close) */}
          </Box>
        );
      case 'Complaint':
        return (
          <Box>
            {renderWorkflowStep(1, "Created by Agent", 
              `${ticket.created_by} - ${ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'N/A'}`, true)}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 30, 
                height: 30, 
                borderRadius: '50%', 
                bgcolor: ticket.assigned_to_role === 'Coordinator' ? 'green' : 'gray', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold'
              }}>
                2
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Coordinator Review
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {ticket.assigned_to_role === 'Coordinator' ? 
                    `${ticket.assigned_to_role} - ${ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : 'N/A'}` : 
                    'Pending Coordinator Review'}
                </Typography>
                
                {/* Coordinator Action Buttons */}
                {ticket.assigned_to_role === 'Coordinator' && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color={ticket.complaint_type === 'Major' ? 'error' : 'primary'}
                      onClick={() => handleRating(ticket.id, 'Major')}
                    >
                      Rate as Major
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color={ticket.complaint_type === 'Minor' ? 'warning' : 'primary'}
                      onClick={() => handleRating(ticket.id, 'Minor')}
                    >
                      Rate as Minor
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => handleForward(ticket.id)}
                    >
                      Forward to Unit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={() => handleClose(ticket.id)}
                    >
                      Close Ticket
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="info"
                      onClick={() => handleChangeToInquiry(ticket.id)}
                    >
                      Change to Inquiry
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
            {/* Conditional rendering for Complaint workflows */}
            {ticket.complaint_type === 'Minor' && (
              <Box>
                {/* Minor Complaint - Unit Path */}
                {/* Agent -> Coordinator -> HeadofUnit -> Attendee -> HeadofUnit */}
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Minor Complaint Workflow (Unit)</Typography>
                {renderWorkflowStep(3, "Head of Unit Review",
                  `${ticket.assigned_to_role === 'HeadofUnit' ? ticket.assigned_to_role : 'Pending Head of Unit'} - ${ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : 'N/A'}`,
                  ticket.assigned_to_role === 'HeadofUnit'
                )}
                {/* Add Head of Unit actions: assign, reverse, attend and close */}
                {renderWorkflowStep(4, "Attendee Action & Recommendation",
                  `${ticket.attended_by ? ticket.attended_by : 'Pending Attendee'} - ${ticket.attended_at ? new Date(ticket.attended_at).toLocaleString() : 'N/A'}`,
                  ticket.attended_by
                )}
                {/* Add Attendee actions: attend and recommend */}
                {renderWorkflowStep(5, "Head of Unit Review & Close",
                  `${ticket.status === 'Closed' && ticket.assigned_to_role === 'HeadofUnit' ? 'Closed' : 'Pending Closure'}`,
                  ticket.status === 'Closed' && ticket.assigned_to_role === 'HeadofUnit'
                )}
                {/* Add Head of Unit actions: reverse, close */}
              </Box>
            )}
            {/* Minor Complaint - Directorate Path (Placeholder) */}
            {/* Agent -> Coordinator -> Director -> Manager -> Attendee -> Manager */}
            {ticket.complaint_type === 'Minor' && selectedTicket.assigned_to_role === 'Director' && (
              <Box>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Minor Complaint Workflow (Directorate)</Typography>
                {/* Steps for Director, Manager, Attendee, Manager */}
                {renderWorkflowStep(3, "Director Review",
                  `${ticket.assigned_to_role === 'Director' ? ticket.assigned_to_role : 'Pending Director'} - ${ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : 'N/A'}`,
                  ticket.assigned_to_role === 'Director'
                )}
                {/* Add Director actions: assign, reverse */}
                {renderWorkflowStep(4, "Manager Action & Review",
                  `${ticket.assigned_to_role === 'Manager' ? ticket.assigned_to_role : 'Pending Manager'} - ${ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : 'N/A'}`,
                  ticket.assigned_to_role === 'Manager'
                )}
                {/* Add Manager actions: assign, attend and close */}
                {renderWorkflowStep(5, "Attendee Action & Recommendation",
                  `${ticket.attended_by ? ticket.attended_by : 'Pending Attendee'} - ${ticket.attended_at ? new Date(ticket.attended_at).toLocaleString() : 'N/A'}`,
                  ticket.attended_by
                )}
                {/* Add Attendee actions: attend and recommend */}
                {renderWorkflowStep(6, "Manager Review & Close",
                  `${ticket.status === 'Closed' && ticket.assigned_to_role === 'Manager' ? 'Closed' : 'Pending Closure'}`,
                  ticket.status === 'Closed' && ticket.assigned_to_role === 'Manager'
                )}
                {/* Add Manager actions: reverse, close */}
              </Box>
            )}
            {/* Major Complaint - Unit Path (Placeholder) */}
            {/* Agent -> Coordinator -> HeadofUnit -> Attendee -> HeadofUnit -> DG */}
            {ticket.complaint_type === 'Major' && selectedTicket.assigned_to_role === 'HeadofUnit' && (
              <Box>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Major Complaint Workflow (Unit)</Typography>
                {/* Steps for HeadofUnit, Attendee, HeadofUnit, DG */}
                {renderWorkflowStep(3, "Head of Unit Action & Review",
                  `${ticket.assigned_to_role === 'HeadofUnit' ? ticket.assigned_to_role : 'Pending Head of Unit'} - ${ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : 'N/A'}`,
                  ticket.assigned_to_role === 'HeadofUnit'
                )}
                {/* Add Head of Unit actions: assign, reverse, attend, upload evidence and recommend */}
                {renderWorkflowStep(4, "Attendee Action & Recommendation (Evidence)",
                  `${ticket.attended_by ? ticket.attended_by : 'Pending Attendee'} - ${ticket.attended_at ? new Date(ticket.attended_at).toLocaleString() : 'N/A'}`,
                  ticket.attended_by
                )}
                {/* Add Attendee actions: attend, upload evidence and recommend */}
                {renderWorkflowStep(5, "Head of Unit Review & Recommendation",
                  `${ticket.assigned_to_role === 'HeadofUnit' ? ticket.assigned_to_role : 'Pending Head of Unit'} - ${ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : 'N/A'}`,
                  ticket.assigned_to_role === 'HeadofUnit' && ticket.status !== 'Closed'
                )}
                {/* Add Head of Unit actions: review, recommend, reverse */}
                {renderWorkflowStep(6, "DG Approval & Close",
                  `${ticket.assigned_to_role === 'DG' ? ticket.assigned_to_role : 'Pending DG Approval'} - ${ticket.date_of_resolution ? new Date(ticket.date_of_resolution).toLocaleString() : 'N/A'}`,
                  ticket.assigned_to_role === 'DG' || ticket.status === 'Closed'
                )}
                {/* Add DG actions: approve and close, reverse */}
              </Box>
            )}
            {/* Major Complaint - Directorate Path (Placeholder) */}
            {/* Agent -> Coordinator -> Director -> Manager -> Attendee -> Manager -> Director -> DG */}
            {ticket.complaint_type === 'Major' && selectedTicket.assigned_to_role === 'Director' && (
              <Box>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Major Complaint Workflow (Directorate)</Typography>
                {/* Steps for Director, Manager, Attendee, Manager, Director, DG */}
                {renderWorkflowStep(3, "Director Review",
                  `${ticket.assigned_to_role === 'Director' ? ticket.assigned_to_role : 'Pending Director'} - ${ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : 'N/A'}`,
                  ticket.assigned_to_role === 'Director'
                )}
                {/* Add Director actions: assign, reverse */}
                {renderWorkflowStep(4, "Manager Action & Review (Evidence)",
                  `${ticket.assigned_to_role === 'Manager' ? ticket.assigned_to_role : 'Pending Manager'} - ${ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : 'N/A'}`,
                  ticket.assigned_to_role === 'Manager'
                )}
                {/* Add Manager actions: assign, reverse, attend, upload evidence and recommend */}
                {renderWorkflowStep(5, "Attendee Action & Recommendation (Evidence)",
                  `${ticket.attended_by ? ticket.attended_by : 'Pending Attendee'} - ${ticket.attended_at ? new Date(ticket.attended_at).toLocaleString() : 'N/A'}`,
                  ticket.attended_by
                )}
                {/* Add Attendee actions: attend, upload evidence and recommend */}
                {renderWorkflowStep(6, "Manager Review & Recommendation",
                  `${ticket.assigned_to_role === 'Manager' ? ticket.assigned_to_role : 'Pending Manager'} - ${ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : 'N/A'}`,
                  ticket.assigned_to_role === 'Manager' && ticket.status !== 'Closed'
                )}
                {/* Add Manager actions: review, recommend, reverse */}
                {renderWorkflowStep(7, "Director Review & Recommendation",
                  `${ticket.assigned_to_role === 'Director' ? ticket.assigned_to_role : 'Pending Director'} - ${ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : 'N/A'}`,
                  ticket.assigned_to_role === 'Director' && ticket.status !== 'Closed'
                )}
                {/* Add Director actions: review, recommend, reverse */}
                {renderWorkflowStep(8, "DG Approval & Close",
                  `${ticket.assigned_to_role === 'DG' ? ticket.assigned_to_role : 'Pending DG Approval'} - ${ticket.date_of_resolution ? new Date(ticket.date_of_resolution).toLocaleString() : 'N/A'}`,
                  ticket.assigned_to_role === 'DG' || ticket.status === 'Closed'
                )}
                {/* Add DG actions: approve and close, reverse */}
              </Box>
            )}
          </Box>
        );
      case 'Suggestion':
      case 'Compliment':
        return (
          <Box>
            {renderWorkflowStep(1, "Created by Agent", 
              `${ticket.created_by} - ${ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'N/A'}`, true)}
            {renderWorkflowStep(2, "Coordinator Review and Assignment",
              `${ticket.assigned_to_role === 'Coordinator' ? ticket.assigned_to_role : 'Pending Coordinator'} - ${ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : 'N/A'}`, 
              ticket.assigned_to_role === 'Coordinator')}
            {/* Add Coordinator action to assign to Directorate/Unit here */}
            {renderWorkflowStep(3, 
              ticket.assigned_to_role === 'Director' ? 'Director Review' : 'Head of Unit Review',
              `${ticket.assigned_to_role || 'Pending Review'} - ${ticket.attended_by ? ticket.attended_by : 'N/A'}`,
              ticket.assigned_to_role === 'Director' || ticket.assigned_to_role === 'Head of Unit'
            )}
            {renderWorkflowStep(4, "Note and Close",
              `${ticket.status === 'Closed' ? 'Closed' : 'In Progress'} - ${ticket.date_of_resolution ? new Date(ticket.date_of_resolution).toLocaleString() : 'N/A'}`,
              ticket.status === 'Closed'
            )}
            {/* Add Note and Close action buttons here */}
          </Box>
        );
      default:
        return <Typography>No specific workflow defined for this category.</Typography>;
    }
  };

  const filteredTickets = agentTickets.filter((ticket) => {
    const searchValue = search.toLowerCase();
    const phone = (ticket.phone_number || "").toLowerCase();
    const nida = (ticket.nida_number || "").toLowerCase();
    const fullName = `${ticket.first_name || ""} ${ticket.middle_name || ""} ${
      ticket.last_name || ""
    }`.toLowerCase();
    return (
      (phone.includes(searchValue) || nida.includes(searchValue) || fullName.includes(searchValue)) &&
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
        <td>{`${ticket.first_name || ""} ${ticket.middle_name || ""} ${
          ticket.last_name || ""
        }`}</td>
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
                  : "blue",
            }}
          >
            {ticket.status || "N/A"}
          </span>
        </td>
      )}
      {activeColumns.includes("subject") && <td>{ticket.subject || "N/A"}</td>}
      {activeColumns.includes("category") && <td>{ticket.category || "N/A"}</td>}
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
                hour12: true,
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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          complaint_type: rating,
          // If Major, assign to DG; if Minor, assign to Focal Person
          assigned_to_role: rating === 'Major' ? 'DG' : 'Focal Person'
        }),
      });

      if (response.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: `Ticket rated as ${rating} successfully.`,
        });
        fetchAgentTickets();
      } else {
        const data = await response.json();
        setModal({
          isOpen: true,
          type: "error",
          message: data.message || "Failed to rate ticket.",
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        message: `Network error: ${error.message}`,
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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          forwarded_to: unit,
          status: 'Forwarded'
        }),
      });

      if (response.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: `Ticket forwarded to ${unit} successfully.`,
        });
        fetchAgentTickets();
      } else {
        const data = await response.json();
        setModal({
          isOpen: true,
          type: "error",
          message: data.message || "Failed to forward ticket.",
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        message: `Network error: ${error.message}`,
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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          status: 'Closed',
          resolution_details: resolution,
          date_of_resolution: new Date().toISOString()
        }),
      });

      if (response.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: "Ticket closed successfully.",
        });
        fetchAgentTickets();
      } else {
        const data = await response.json();
        setModal({
          isOpen: true,
          type: "error",
          message: data.message || "Failed to close ticket.",
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        message: `Network error: ${error.message}`,
      });
    }
  };

  const handleChangeToInquiry = async (ticketId) => {
    const confirmation = window.confirm("Are you sure you want to change this Complaint to an Inquiry?");
    if (!confirmation) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/ticket/change-to-inquiry/${ticketId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          category: 'Other Inquiry', // Or a more specific inquiry category if available
          status: 'Open', // Reset status to open for inquiry workflow
          assigned_to_role: 'Focal Person' // Auto-assign as per inquiry workflow 5.1.v and vi
        }),
      });

      if (response.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: "Complaint successfully changed to Inquiry.",
        });
        fetchAgentTickets();
      } else {
        const data = await response.json();
        setModal({
          isOpen: true,
          type: "error",
          message: data.message || "Failed to change complaint to inquiry.",
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        message: `Network error: ${error.message}`,
      });
    }
  };

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
            marginBottom: "16px",
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
      <Modal
        open={isModalOpen}
        onClose={closeModal}
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
            p: 3,
          }}
        >
          {selectedTicket && (
            <>
              <Typography
                id="ticket-details-title"
                variant="h5"
                sx={{ fontWeight: "bold", color: "#1976d2", mb: 2 }}
              >
                Complaint Details
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {/* Workflow Status Section */}
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="h6" sx={{ color: "#3f51b5", mb: 1 }}>
                  Ticket Workflow
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {renderDynamicWorkflow(selectedTicket)}
                
                {/* Current Status */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
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
                            ? "gray"
                            : selectedTicket.status === "In Progress"
                            ? "blue"
                            : selectedTicket.status === "Assigned"
                            ? "orange"
                            : "inherit",
                      }}
                    >
                      {selectedTicket.status || "N/A"}
                    </span>
                  </Typography>
                  {selectedTicket.resolution_details && (
                    <Typography sx={{ mt: 1 }}>
                      <strong>Resolution Details:</strong> {selectedTicket.resolution_details}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Two-Column Ticket Fields */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ flex: "1 1 45%" }}>
                  <Typography>
                    <strong>Name:</strong>{" "}
                    {`${selectedTicket.first_name || "N/A"} ${
                      selectedTicket.middle_name || " "
                    } ${selectedTicket.last_name || "N/A"}`}
                  </Typography>
                </div>
                <div style={{ flex: "1 1 45%" }}>
                  <Typography>
                    <strong>Phone:</strong> {selectedTicket.phone_number || "N/A"}
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
                    <strong>Category:</strong> {selectedTicket.category || "N/A"}
                  </Typography>
                </div>

                <div style={{ flex: "1 1 45%" }}>
                  <Typography>
                    <strong>Channel:</strong> {selectedTicket.channel || "N/A"}
                  </Typography>
                </div>

                <div style={{ flex: "1 1 100%" }}>
                  <Typography>
                    <strong>Description:</strong>{" "}
                    {selectedTicket.description || "N/A"}
                  </Typography>
                </div>
              </div>

              {/* Action Buttons */}
                  <Box sx={{ mt: 2, textAlign: "right" }}>
                    <Button variant="outlined" onClick={closeModal}>
                      Close
                    </Button>
                  </Box>
            </>
          )}
        </Box>
      </Modal>

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