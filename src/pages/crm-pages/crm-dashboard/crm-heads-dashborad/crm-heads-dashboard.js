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
import TicketDetailsModal from "../../../../components/ticket/TicketDetailsModal";

// Config
import { baseURL } from "../../../../config";

// Styles
import "./crm-heads-dashboard.css";

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
    region: "",
    ticketId: "",
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
    "Assigned": 0,
    "Escalated": 0
  });
  const [totalTickets, setTotalTickets] = useState({
    "Total": 0,
    "Closed": 0
  });
  const [ticketCategories, setTicketCategories] = useState({
    "Open": 0,
    "In Progress": 0,
    "Carried Forward": 0
  });
  const [ticketStatus, setTicketStatus] = useState({
    "Overdue": 0,
    "Pending": 0,
    "SLA Breaches": 0
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
      const userId = localStorage.getItem("userId");
      const response = await fetch(`${baseURL}/ticket/assigned/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      const data = await response.json();
      setTickets(data.tickets || []);
      if (!data.tickets?.length) {
        setSnackbar({
          open: true,
          message: "No tickets found",
          severity: "info"
        });
      }
    } catch (error) {
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
      const response = await axios.get(
        `${baseURL}/ticket/dashboard-counts/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const stats = response.data.ticketStats;
      // Map unified fields to cards
        setNewTickets({
        "New Tickets": stats.newTickets || 0,
        "Assigned": stats.assigned || 0,
        "Escalated": stats.escalated || 0
        });
        setTotalTickets({
        "Total": stats.total || 0,
        "Closed": stats.closed || 0
        });
        setTicketCategories({
        "Open": stats.open || 0,
        "In Progress": stats.inProgress || 0,
        "Carried Forward": stats.carriedForward || 0
        });
        setTicketStatus({
        "Overdue": stats.overdue || 0,
        "Pending": stats.pending || 0,
        "SLA Breaches": stats.slaBreaches || 0
      });
    } catch (error) {
      setNewTickets({ "New Tickets": 0, "Assigned": 0, "Escalated": 0 });
      setTotalTickets({ "Total": 0, "Closed": 0 });
      setTicketCategories({ "Open": 0, "In Progress": 0, "Carried Forward": 0 });
      setTicketStatus({ "Overdue": 0, "Pending": 0, "SLA Breaches": 0 });
      setSnackbar({
        open: true,
        message: `Error fetching dashboard counts: ${error.response?.data?.message || error.message}`,
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
    const representativeName = (ticket.representative_name || "").toLowerCase();

    let matches =
      (!searchValue ||
        ticket.phone_number?.toLowerCase().includes(searchValue) ||
        ticket.nida_number?.toLowerCase().includes(searchValue) ||
        fullName.includes(searchValue) ||
        representativeName.includes(searchValue)) &&
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

  const role = localStorage.getItem("role");
  const getDashboardTitle = () => {
    if (role === "focal-person") return "Focal Person Dashboard";
    if (role === "claim-focal-person") return "Claim Focal Person Dashboard";
    if (role === "compliance-focal-person") return "Compliance Focal Person Dashboard";
    if (role === "head-of-unit") return "Head of Unit Dashboard";
    if (role === "director-general") return "Director General Dashboard";
    return "Dashboard";
  };

  return (
    <div className="focal-person-dashboard-container">
      <h2 className="title">{getDashboardTitle()}</h2>

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
                    {!["agent", "reviewer", "attendee"].includes(role) && (
                    <Tooltip title="View Details">
                      <button
                        className="view-ticket-details-btn"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setIsModalOpen(true);
                          }}
                      >
                        <FaEye />
                      </button>
                    </Tooltip>
                    )}
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
      <TicketDetailsModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedTicket={selectedTicket}
        assignmentHistory={assignmentHistory}
        setSnackbar={setSnackbar}
        refreshTickets={fetchTickets}
        refreshDashboardCounts={() => fetchDashboardCounts(userId)}
      />

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
