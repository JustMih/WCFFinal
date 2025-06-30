import React, { useState, useEffect } from "react";
import axios from "axios";
import Autocomplete from "@mui/material/Autocomplete";
import { FormControl, InputLabel, Select } from '@mui/material';
import { Avatar, Paper } from "@mui/material";

// React Icons
import { FaEye } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { MdOutlineSupportAgent, MdImportExport } from "react-icons/md";

// MUI Components
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
  MenuItem
} from "@mui/material";

// Custom Components
import ColumnSelector from "../../../../components/colums-select/ColumnSelector";
import TicketFilters from "../../../../components/ticket/TicketFilters";

// Config
import { baseURL } from "../../../../config";

// Styles
import "./crm-focal-person-dashboard.css";

function AssignmentFlowChat({ assignmentHistory }) {
  return (
    <Box sx={{ maxWidth: 400, ml: "auto" }}>
      <Typography variant="h6" sx={{ color: "#3f51b5", mb: 2 }}>
        Assignment Flow
      </Typography>
      {assignmentHistory.map((a, idx) => (
        <Box key={idx} sx={{ display: "flex", mb: 2, alignItems: "flex-start" }}>
          <Avatar sx={{ bgcolor: "#1976d2", mr: 2 }}>
            {a.assigned_to_name ? a.assigned_to_name[0] : "?"}
          </Avatar>
          <Paper elevation={2} sx={{ p: 2, bgcolor: "#f5f5f5", flex: 1 }}>
            <Typography sx={{ fontWeight: "bold" }}>
              {a.assigned_to_name || "Unknown"}{" "}
              <span style={{ color: "#888", fontWeight: "normal" }}>
                ({a.assigned_to_role || "N/A"})
              </span>
            </Typography>
            <Typography variant="body2" sx={{ color: "#1976d2" }}>
              {a.reason || <span style={{ color: "#888" }}>No reason provided</span>}
            </Typography>
            <Typography variant="caption" sx={{ color: "#888" }}>
              {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
            </Typography>
          </Paper>
        </Box>
      ))}
    </Box>
  );
}

const Card = ({ title, data, color, icon }) => (
  <div className="crm-card">
    <div className="crm-header">
      <h4> {icon}{title}</h4>
    </div>
    <div className="crm-card-body" style={{ backgroundColor: color }}>
      <div className="crm-card-data">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="data-item">
            <h4>{key}</h4>
            <p>{value}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function FocalPersonDashboard() {
  const [tickets, setTickets] = useState([]);
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeColumns, setActiveColumns] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    nidaSearch: "",
    status: "",
    priority: "",
    category: "",
    startDate: null,
    endDate: null
  });
  const [resolutionType, setResolutionType] = useState("");
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [attendees, setAttendees] = useState([]);
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const [assignReason, setAssignReason] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");
  const [assignmentHistory, setAssignmentHistory] = useState([]);

  // Dashboard Stats
  const [newTickets, setNewTickets] = useState({
    "New Tickets": 0,
    "Escalated Tickets": 0
  });
  const [totalTickets, setTotalTickets] = useState({
    "Total Inquiries": 0,
    "Resolved Inquiries": 0
  });
  const [ticketCategories, setTicketCategories] = useState({
    "Open Inquiries": 0,
    "Closed Inquiries": 0
  });
  const [ticketStatus, setTicketStatus] = useState({
    "On Progress": 0,
    Closed: 0,
    Total: 0
  });

  // Initialize activeColumns with default columns if empty
  useEffect(() => {
    if (activeColumns.length === 0) {
      setActiveColumns([
        "id",
        "fullName",
        "phone_number",
        "status",
        "subject",
        "category",
        "assigned_to_role",
        "createdAt"
      ]);
    }
  }, [activeColumns]);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");

    if (!id || !token) {
      setSnackbar({
        open: true,
        message: "Please log in to access tickets.",
        severity: "error"
      });
      return;
    }

    setUserId(id);
    fetchTickets();
    fetchDashboardCounts(id);
    fetchAttendees();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("authToken");
      console.log("Fetching tickets with token:", token);

      const response = await fetch(`${baseURL}/focal-person/new-tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }

      const data = await response.json();
      console.log("Raw API Response:", data);

      // Directly use the inquiries from the response
      setTickets(data.inquiries || []);
      console.log("Tickets set in state:", data.inquiries);

      if (!data.inquiries?.length) {
        console.log("No tickets found");
        setSnackbar({
          open: true,
          message: "No tickets found",
          severity: "info"
        });
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setSnackbar({
        open: true,
        message: `Error fetching tickets: ${error.message}`,
        severity: "error"
      });
    }
  };

  // Add effect to log tickets whenever they change
  useEffect(() => {
    console.log("Current tickets in state:", tickets);
  }, [tickets]);

  const fetchDashboardCounts = async (id) => {
    setLoading(true);
    const token = localStorage.getItem("authToken");

    try {
      console.log("Fetching dashboard counts for ID:", id);

      const response = await axios.get(
        `${baseURL}/ticket/dashboard-counts/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("Dashboard counts response:", response.data);

      const data = response.data.ticketStats;

      if (data && typeof data === "object") {
        // Set the dashboard counts based on the response
        setNewTickets({
          "New Tickets": data.newInquiries || 0,
          "Escalated Tickets": data.escalatedInquiries || 0
        });

        setTotalTickets({
          "Total Inquiries": data.totalInquiries || 0,
          "Resolved Inquiries": data.resolvedInquiries || 0
        });

        setTicketCategories({
          "Open Inquiries": data.openInquiries || 0,
          "Closed Inquiries": data.closedInquiries || 0
        });

        setTicketStatus({
          "On Progress": data.inProgressInquiries || 0,
          Closed: data.closedInquiries || 0,
          Total: data.totalInquiries || 0
        });
      } else {
        console.error("Invalid data structure received:", data);
        throw new Error("Invalid data structure received from server");
      }
    } catch (error) {
      console.error("Dashboard counts error:", error);
      console.error("Error response:", error.response?.data);

      // Set default values in case of error
      setNewTickets({
        "New Tickets": 0,
        "Escalated Tickets": 0
      });
      setTotalTickets({
        "Total Inquiries": 0,
        "Resolved Inquiries": 0
      });
      setTicketCategories({
        "Open Inquiries": 0,
        "Closed Inquiries": 0
      });
      setTicketStatus({
        "On Progress": 0,
        Closed: 0,
        Total: 0
      });

      setSnackbar({
        open: true,
        message: `Error fetching dashboard counts: ${
          error.response?.data?.message || error.message
        }`,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleCloseTicket = async () => {
    if (!resolutionType || !resolutionDetails) {
      setSnackbar({
        open: true,
        message: "Please provide both resolution type and details",
        severity: "warning"
      });
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${baseURL}/ticket/${selectedTicket.id}/close`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            resolution_type: resolutionType,
            resolution_details: resolutionDetails
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to close ticket");
      }

      const data = await response.json();
      setTickets(
        tickets.map((ticket) =>
          ticket.id === data.ticket.id ? data.ticket : ticket
        )
      );

      setSnackbar({
        open: true,
        message: "Ticket closed successfully",
        severity: "success"
      });

      closeModal();
      fetchDashboardCounts(userId);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error"
      });
    }
  };

  // Add useEffect for periodic refresh
  useEffect(() => {
    if (userId) {
      const refreshInterval = setInterval(() => {
        fetchTickets();
        fetchDashboardCounts(userId);
      }, 30000);

      return () => clearInterval(refreshInterval);
    }
  }, [userId]);

  const openModal = async (ticket) => {
    setSelectedTicket(ticket);
    setResolutionType("");
    setResolutionDetails("");
    setIsModalOpen(true);

    // Fetch assignment history
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
    setResolutionType("");
    setResolutionDetails("");
    setSelectedAction("");
  };

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const filteredTickets = tickets.filter((ticket) => {
    console.log("Filtering ticket:", ticket);
    const searchValue = search.toLowerCase();
    const fullName = `${ticket.first_name || ""} ${ticket.middle_name || ""} ${
      ticket.last_name || ""
    }`.toLowerCase();

    let matches =
      (!searchValue ||
        ticket.phone_number?.toLowerCase().includes(searchValue) ||
        ticket.nida_number?.toLowerCase().includes(searchValue) ||
        fullName.includes(searchValue)) &&
      (!filterStatus || ticket.status === filterStatus);

    // Apply advanced filters
    if (filters.category) {
      matches = matches && ticket.category === filters.category;
    }
    if (filters.startDate) {
      matches =
        matches && new Date(ticket.created_at) >= new Date(filters.startDate);
    }
    if (filters.endDate) {
      matches =
        matches && new Date(ticket.created_at) <= new Date(filters.endDate);
    }

    return matches;
  });

  console.log("Filtered tickets:", filteredTickets);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  console.log("Paginated tickets to display:", paginatedTickets);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Assignment handler
  const handleAssignTicket = async () => {
    if (!selectedAttendee) {
      setSnackbar({
        open: true,
        message: "Please select an attendee",
        severity: "warning"
      });
      return;
    }
    setAssignLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");
      const res = await fetch(`${baseURL}/ticket/${selectedTicket.id}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          assignedToUsername: selectedAttendee.username,
          assignedById: userId,
          reason: assignReason
        })
      });
      if (!res.ok) throw new Error("Failed to assign ticket");
      setSnackbar({
        open: true,
        message: "Ticket assigned successfully",
        severity: "success"
      });
      setTickets(
        tickets.map((t) =>
          t.id === selectedTicket.id
            ? { ...t, status: "Assigned", assigned_to: selectedAttendee.id }
            : t
        )
      );
      setSelectedAttendee(null);
      setAssignReason("");
      closeModal();
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: "error" });
    } finally {
      setAssignLoading(false);
    }
  };

  // Get current user info from localStorage
  const currentUserUnitSection = (localStorage.getItem("unit_section") || "").trim().toLowerCase();
  const allowedRoles = ["attendee", "agent"];

  // DEBUGGING: Log the unit section from localStorage
  console.log("Current User Unit Section (from localStorage):", currentUserUnitSection);
  console.log("All available attendees (before filtering):", attendees);

  const filteredAttendees = attendees.filter((a) => {
    const attendeeUnit = (a.unit_section || "").trim().toLowerCase();
    const attendeeRole = (a.role || "").toLowerCase();
    
    const matches = allowedRoles.includes(attendeeRole) &&
                    attendeeUnit &&
                    attendeeUnit === currentUserUnitSection;

    // DEBUGGING: Log each attendee and the comparison result
    console.log(
      `Comparing: Attendee Unit: "${attendeeUnit}" | Current User Unit: "${currentUserUnitSection}" | Attendee Role: "${attendeeRole}" | Matches: ${matches}`
    );

    return matches;
  });

  // DEBUGGING: Log the final filtered list
  console.log("Filtered Attendees (after filtering):", filteredAttendees);

  // Build workflow steps: always start with creator, then all assignment history
  const workflowSteps = [
    {
      name: selectedTicket?.creator_name || selectedTicket?.created_by_name || "Unknown",
      role: "Creator",
      date: selectedTicket?.created_at,
      status: assignmentHistory.length === 0 ? "current" : "completed"
    },
    ...assignmentHistory.map((a, idx) => ({
      name: a.assigned_to_name || a.assigned_to_id || "Unknown",
      role: a.assigned_to_role || "",
      date: a.created_at,
      action: a.action,
      status: idx === assignmentHistory.length - 1 ? "current" : "completed"
    }))
  ];

  return (
    <div className="focal-person-dashboard-container">
      <h2 className="title">Focal Person Dashboard</h2>

      {/* Cards */}
      <div className="crm-dashboard">
        <div className="crm-cards-container">
          <Card
            title="New Tickets"
            data={newTickets}
            color="#ceedea"
            icon={<MdOutlineSupportAgent fontSize={35} />}
          />
          <Card
            title="Total Tickets"
            data={totalTickets}
            color="#bce8be"
            icon={<MdOutlineSupportAgent fontSize={35} />}
          />
        </div>
        <div className="crm-cards-container">
          <Card
            title="Ticket Categories"
            data={ticketCategories}
            color="#b9c9ff"
            icon={<MdOutlineSupportAgent fontSize={35} />}
          />
          <Card
            title="Ticket Status"
            data={ticketStatus}
            color="#ffc4dd"
            icon={<MdImportExport fontSize={35} />}
          />
        </div>
      </div>

      <TicketFilters
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />

      {/* Table Section */}
      <div style={{ overflowX: "auto", width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px"
          }}
        >
          <h2>Inquiry Tickets</h2>
          <Tooltip title="Columns Settings" arrow>
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
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[5, 10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              className="search-input"
              type="text"
              placeholder="Search by phone or NIDA..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        <table className="user-table">
          <thead>
            <tr>
              {activeColumns.includes("id") && <th>#</th>}
              {activeColumns.includes("fullName") && <th>Full Name</th>}
              {activeColumns.includes("phone_number") && <th>Phone</th>}
              {activeColumns.includes("status") && <th>Status</th>}
              {activeColumns.includes("subject") && <th>Subject</th>}
              {activeColumns.includes("category") && <th>Category</th>}
              {activeColumns.includes("assigned_to_role") && (
                <th>Assigned Role</th>
              )}
              {activeColumns.includes("createdAt") && <th>Created At</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTickets.length > 0 ? (
              paginatedTickets.map((ticket, i) => (
                <tr key={ticket.id}>
                  {activeColumns.includes("id") && (
                    <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
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
                  {activeColumns.includes("subject") && (
                    <td>{ticket.subject || "N/A"}</td>
                  )}
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
                    <Tooltip title="View Details">
                      <button
                        className="view-ticket-details-btn"
                        onClick={() => openModal(ticket)}
                      >
                        <FaEye />
                      </button>
                    </Tooltip>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={activeColumns.length + 1}
                  style={{ textAlign: "center", color: "red" }}
                >
                  No tickets found.
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

      {/* Ticket Details Modal */}
      <Modal
  open={isModalOpen}
  onClose={closeModal}
  aria-labelledby="ticket-details-title"
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
        {/* Title */}
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", color: "#1976d2", mb: 2 }}
        >
          Ticket Details #{selectedTicket.ticket_id}
        </Typography>

        {/* Personal Information */}
        <Typography variant="h6" sx={{ color: "#1976d2", mb: 1 }}>
          Personal Information
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography>
              <strong>Full Name:</strong>{" "}
              {`${selectedTicket.first_name || ""} ${
                selectedTicket.middle_name || ""
              } ${selectedTicket.last_name || ""}`}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <strong>Phone:</strong> {selectedTicket.phone_number || "N/A"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <strong>Email:</strong> {selectedTicket.email || "N/A"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <strong>NIDA:</strong> {selectedTicket.nida_number || "N/A"}
            </Typography>
          </Grid>
        </Grid>

        {/* Ticket Info */}
        <Typography variant="h6" sx={{ color: "#1976d2", mb: 1 }}>
          Ticket Information
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography>
              <strong>Category:</strong> {selectedTicket.category || "N/A"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <strong>Status:</strong>{" "}
              <span
                style={{
                  color:
                    selectedTicket.status === "Open"
                      ? "green"
                      : selectedTicket.status === "Closed"
                      ? "gray"
                      : "blue",
                }}
              >
                {selectedTicket.status || "N/A"}
              </span>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <strong>Subject:</strong> {selectedTicket.subject || "N/A"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <strong>Created At:</strong>{" "}
              {selectedTicket.created_at
                ? new Date(selectedTicket.created_at).toLocaleString("en-GB")
                : "N/A"}
            </Typography>
          </Grid>
        </Grid>

        {/* Ticket Workflow Stepper */}
        <Typography variant="h6" sx={{ color: "#1976d2", mb: 1 }}>
          Ticket Workflow
        </Typography>
        <Box sx={{ mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
          {selectedTicket.assigned_to_name || selectedTicket.assigned_to ? (
            <Typography>
              <strong>Assigned To:</strong> {selectedTicket.assigned_to_name || selectedTicket.assigned_to}
            </Typography>
          ) : (
            <Typography color="text.secondary">
              Not assigned yet
            </Typography>
          )}
        </Box>

        {/* Assignment History Section */}
        <Typography variant="h6" sx={{ color: "#1976d2", mb: 1 }}>
          Assignment History
        </Typography>
        <Box sx={{ mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
          {assignmentHistory.length > 0 ? (
            assignmentHistory.map((a, idx) => (
              <Grid container spacing={2} key={idx} sx={{ mb: 1, pb: 1, borderBottom: idx < assignmentHistory.length - 1 ? '1px solid #eee' : 'none' }}>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Assigned To:</strong> {a.assigned_to_name || a.assigned_to_id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Role:</strong> {a.assigned_to_role}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Action:</strong> {a.action}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Date:</strong> {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                  </Typography>
                </Grid>
                {a.reason && (
                  <Grid item xs={12}>
                    <Typography>
                      <strong>Reason:</strong> {a.reason}
                    </Typography>
                  </Grid>
                )}
                {a.assigned_by_name && (
                  <Grid item xs={12}>
                    <Typography>
                      <strong>Assigned By:</strong> {a.assigned_by_name}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            ))
          ) : (
            <Typography color="text.secondary">No assignment history.</Typography>
          )}
        </Box>

        {/* Description */}
        <Typography variant="h6" sx={{ color: "#1976d2", mb: 1 }}>
          Description
        </Typography>
        <Box sx={{ mb: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
          <Typography>
            {selectedTicket.description || "No description provided"}
          </Typography>
        </Box>

        {/* Action Section (Only if ticket is not closed) */}
        {selectedTicket.status !== "Closed" && (
          <>
            <Typography color="primary" variant="body2" sx={{ mb: 1 }}>
              Ticket Section: {currentUserUnitSection || "N/A"}
            </Typography>

            {/* Action Selection */}
            {/* <Typography variant="subtitle1" sx={{ color: "#1976d2", mb: 1 }}>
              Select Action
            </Typography> */}
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Choose Action"
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="Please select what you want to do with this ticket"
                  sx={{
                    minWidth: 250,
                    "& .MuiInputBase-input": { fontSize: "0.95rem" },
                    "& .MuiSelect-select": {
                      minHeight: "2.4em",
                      display: "flex",
                      alignItems: "center",
                    },
                  }}
                >
                  <MenuItem value="">Select an action...</MenuItem>
                  <MenuItem value="assign">Assign to Attendee</MenuItem>
                  <MenuItem value="close">Close Ticket</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* Assign Section */}
            {selectedAction === "assign" && (
              <>
                <Typography
                  variant="subtitle1"
                  sx={{ color: "#1976d2", mb: 1 }}
                >
                  Assign to Attendee
                </Typography>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      size="small"
                      options={filteredAttendees}
                      getOptionLabel={(opt) =>
                        opt?.name
                          ? `${opt.name} (${opt.username})`
                          : opt.username
                      }
                      value={selectedAttendee}
                      onChange={(_, v) => setSelectedAttendee(v)}
                      isOptionEqualToValue={(opt, v) =>
                        opt.username === v.username
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Attendee"
                          fullWidth
                          size="small"
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            "& .MuiInputBase-input": {
                              fontSize: "0.95rem",
                              height: "1.4em",
                            },
                            "& .MuiAutocomplete-inputRoot": {
                              padding: "2px 8px",
                              minHeight: "40px",
                            },
                          }}
                        />
                      )}
                    />
                    {filteredAttendees.length === 0 &&
                      attendees.length > 0 && (
                        <Typography
                          color="error"
                          variant="body2"
                          sx={{ mt: 0.5 }}
                        >
                          No attendees found for this unit/section.
                        </Typography>
                      )}
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Reason for Assignment"
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                      value={assignReason}
                      onChange={(e) => setAssignReason(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        "& .MuiInputBase-input": { fontSize: "0.95rem" },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAssignTicket}
                      disabled={assignLoading}
                      fullWidth
                      size="small"
                    >
                      {assignLoading ? "Assigning..." : "Assign Ticket"}
                    </Button>
                  </Grid>
                </Grid>
              </>
            )}

            {/* Close Section */}
            {selectedAction === "close" && (
              <>
                <Typography variant="subtitle1" sx={{ color: "#1976d2", mb: 1 }}>
                  Close Ticket
                </Typography>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small" sx={{ minWidth: 250 }}>
                      <InputLabel id="resolution-type-label">Resolution Type</InputLabel>
                      <Select
                        labelId="resolution-type-label"
                        value={resolutionType}
                        label="Resolution Type"
                        onChange={(e) => setResolutionType(e.target.value)}
                        sx={{
                          '& .MuiSelect-select': {
                            minHeight: '2.6em',
                            display: 'flex',
                            alignItems: 'center',
                          },
                        }}
                      >
                        <MenuItem value="Resolved">Resolved</MenuItem>
                        <MenuItem value="Not Applicable">Not Applicable</MenuItem>
                        <MenuItem value="Duplicate">Duplicate</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Resolution Details"
                      multiline
                      rows={3}
                      value={resolutionDetails}
                      onChange={(e) => setResolutionDetails(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleCloseTicket}
                      fullWidth
                      size="small"
                    >
                      Close Ticket
                    </Button>
                  </Grid>
                </Grid>
              </>
            )}
          </>
        )}

        {/* Resolution Info (if already closed) */}
        {selectedTicket.status === "Closed" &&
          selectedTicket.resolution && (
            <>
              <Typography variant="h6" sx={{ color: "#1976d2", mb: 1 }}>
                Resolution
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Typography>
                    <strong>Resolution Type:</strong>{" "}
                    {selectedTicket.resolution.type || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box
                    sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}
                  >
                    <Typography>
                      <strong>Resolution Details:</strong>{" "}
                      {selectedTicket.resolution.details || "N/A"}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </>
          )}

        {/* Sticky Footer Close Button */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mt: 3,
            pt: 2,
            borderTop: "1px solid #e0e0e0",
            background: "white",
            position: "sticky",
            bottom: 0,
            zIndex: 1,
          }}
        >
          <Button variant="outlined" onClick={closeModal}>
            Close Modal
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
        data={tickets}
        onColumnsChange={(selectedColumns) => {
          if (selectedColumns.length === 0) {
            setActiveColumns([
              "id",
              "fullName",
              "phone_number",
              "status",
              "subject",
              "category",
              "assigned_to_role",
              "createdAt"
            ]);
          } else {
            setActiveColumns(selectedColumns);
          }
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
}
