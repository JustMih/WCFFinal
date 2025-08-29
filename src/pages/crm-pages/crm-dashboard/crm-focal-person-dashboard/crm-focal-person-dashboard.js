import React, { useState, useEffect } from "react";
import axios from "axios";
import Autocomplete from "@mui/material/Autocomplete";
import { FormControl, InputLabel, Select } from '@mui/material';
import { Avatar, Paper } from "@mui/material";

// React Icons
import { FaEye, FaPlus } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { MdOutlineSupportAgent, MdImportExport } from "react-icons/md";
import { FaSearch } from "react-icons/fa";

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
  MenuItem,
  CircularProgress
} from "@mui/material";
import ChatIcon from '@mui/icons-material/Chat';

// Custom Components
// import ColumnSelector from "../../../../components/colums-select/ColumnSelector";
import TicketFilters from "../../../../components/ticket/TicketFilters";
import TicketDetailsModal from "../../../../components/ticket/TicketDetailsModal";
import AdvancedTicketCreateModal from "../../../../components/ticket/AdvancedTicketCreateModal";
import Pagination from "../../../../components/Pagination";
import TableControls from "../../../../components/TableControls";

// Config
import { baseURL } from "../../../../config";

// Styles
import "./crm-focal-person-dashboard.css";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeColumns, setActiveColumns] = useState([
    "ticket_id",
    "fullName",
    "phone_number",
    "region",
    "status"
  ]);
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
    district: "",
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
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // State for AdvancedTicketCreateModal
  const [showAdvancedTicketModal, setShowAdvancedTicketModal] = useState(false);
  const [ticketPhoneNumber, setTicketPhoneNumber] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [existingTicketsModal, setExistingTicketsModal] = useState(false);
  const [newTicketConfirmationModal, setNewTicketConfirmationModal] = useState(false);
  const [foundTickets, setFoundTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
        "ticket_id",
        "fullName",
        "phone_number",
        "region",
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
      console.log('Fetch response:', response);
      let data;
      try {
        data = await response.json();
      } catch (e) {
        const text = await response.text();
        console.error('Failed to parse JSON. Raw response:', text);
        throw e;
      }
      if (!response.ok) {
        console.error('Fetch failed:', response.status, data);
        throw new Error(data.message || `HTTP error! Status: ${response.status}`);
      }
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
    
    // Also trigger phone search to populate ticket history (like in agent dashboard)
    const searchValue = ticket.phone_number || ticket.nida_number;
    if (searchValue) {
      handlePhoneSearch(searchValue, ticket);
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
        fullName.includes(searchValue) ||
        (ticket.ticket_id || "").toLowerCase().includes(searchValue) ||
        (ticket.id || "").toLowerCase().includes(searchValue)) &&
      (!filters.status || ticket.status === filters.status);

    // Apply advanced filters
    if (filters.category) {
      matches = matches && ticket.category === filters.category;
    }
    if (filters.region) {
      matches = matches && ticket.region === filters.region;
    }
    if (filters.district) {
      matches = matches && ticket.district === filters.district;
    }
    if (filters.ticketId) {
      matches = matches && (
        (ticket.ticket_id && ticket.ticket_id.toLowerCase().includes(filters.ticketId.toLowerCase())) ||
        (ticket.id && ticket.id.toLowerCase().includes(filters.ticketId.toLowerCase()))
      );
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
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredTickets.length);
  const totalItems = filteredTickets.length;
  
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
  // const getDashboardTitle = () => {
  //   if (role === "focal-person") return "Focal Person Dashboard";
  //   if (role === "claim-focal-person") return "Claim Focal Person Dashboard";
  //   if (role === "compliance-focal-person") return "Compliance Focal Person Dashboard";
  //   if (role === "head-of-unit") return "Head of Unit Dashboard";
  //   if (role === "director-general") return "Director General Dashboard";
  //   return "Dashboard";
  // };

  const getDashboardTitle = () => {
    if (role === "focal-person") return "CC Dashboard";
    if (role === "claim-focal-person") return "CC Dashboard";
    if (role === "compliance-focal-person") return "CC Dashboard";
    if (role === "head-of-unit") return "CC Dashboard";
    if (role === "director-general") return "CC Dashboard";
    return "Dashboard";
  };


  const handlePhoneSearch = async (searchValue, selectedTicketFromTable = null) => {
    try {
      setIsLoading(true);
      // Search by phone number (this endpoint also searches by NIDA number)
      const response = await fetch(
        `${baseURL}/ticket/search-by-phone/${searchValue}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );
      const data = await response.json();
      
      if (data.found) {
        setFoundTickets(data.tickets);
        if (selectedTicketFromTable) {
          setSelectedTicket(selectedTicketFromTable);
          setShowDetailsModal(true);
        } else {
          setExistingTicketsModal(true);
        }
      } else {
        setNewTicketConfirmationModal(true);
      }
    } catch (error) {
      console.error("Error searching tickets:", error);
      setSnackbar({
        open: true,
        message: "Error searching tickets",
        severity: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewTicketConfirmation = (confirmed) => {
    if (confirmed) {
      // Set the phone number for the AdvancedTicketCreateModal
      setTicketPhoneNumber(phoneSearch);
      setShowAdvancedTicketModal(true);
    }
    setNewTicketConfirmationModal(false);
  };

  return (
    <div className="focal-person-dashboard-container">
      <h2 className="title">{getDashboardTitle()}</h2>

      {/* Full-width Phone/NIDA Search Section */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "1rem",
          alignItems: "center",
        }}
      >
        <input
          className="crm-search-input"
          type="text"
          placeholder="Search by phone or NIDA..."
          value={phoneSearch}
          onChange={(e) => setPhoneSearch(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") handlePhoneSearch(phoneSearch);
          }}
          style={{ flex: 1 }}
        />
        <button
          className="search-btn"
          onClick={() => handlePhoneSearch(phoneSearch)}
          aria-label="Search"
        >
          <FaSearch />
        </button>
        <button className="add-user-button" onClick={() => setShowAdvancedTicketModal(true)}>
          <FaPlus /> New Ticket
        </button>
      </div>

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

      {/* Table Section */}
      <div className="user-table-container">
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "1rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <h3 className="title">Focal Person Tickets List</h3>
            {/* The New Ticket button is now in the search section */}
          </div>
          
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "10px"
          }}>
            <TicketFilters
              onFilterChange={handleFilterChange}
              initialFilters={filters}
              compact={true}
            />
          </div>
        </div>
        
        <div style={{ overflowX: "auto", width: "100%" }}>

          <TableControls
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(e) => {
              const value = e.target.value;
              setItemsPerPage(
                value === "All" ? filteredTickets.length : parseInt(value)
              );
              setCurrentPage(1);
            }}
            search={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            filterStatus={filters.status}
            onFilterStatusChange={(e) => setFilters({ ...filters, status: e.target.value })}
            filterRegion={filters.region}
            onFilterRegionChange={(e) => setFilters({ ...filters, region: e.target.value })}
            filterDistrict={filters.district}
            onFilterDistrictChange={(e) => setFilters({ ...filters, district: e.target.value })}
            activeColumns={activeColumns}
            onColumnsChange={setActiveColumns}
            tableData={filteredTickets}
            tableTitle="Focal Person Tickets"
          />

          <table className="user-table">
          <thead>
            <tr>
              {activeColumns.includes("ticket_id") && <th>Ticket ID</th>}
              {activeColumns.includes("fullName") && <th>Full Name</th>}
              {activeColumns.includes("phone_number") && <th>Phone</th>}
              {activeColumns.includes("region") && <th>Region</th>}
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
                  {activeColumns.includes("ticket_id") && (
                    <td>{ticket.ticket_id || ticket.id}</td>
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
                  {activeColumns.includes("region") && (
                    <td>{ticket.region || "N/A"}</td>
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>

      {/* Ticket Details Modal */}
      <TicketDetailsModal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        selectedTicket={selectedTicket}
        assignmentHistory={assignmentHistory}
        setSnackbar={setSnackbar}
        refreshTickets={fetchTickets}
        refreshDashboardCounts={() => fetchDashboardCounts(userId)}
      />

      {/* Column Selector */}
      {/* This block is now redundant as ColumnSelectorDropdown is moved */}
      {/* <ColumnSelectorDropdown
        selectedColumns={activeColumns}
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
        size="small"
      /> */}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert 
          severity={snackbar.severity}
          onClose={handleSnackbarClose}
          sx={{ 
            minWidth: '300px',
            fontSize: '14px',
            fontWeight: snackbar.severity === 'success' ? 'bold' : 'normal'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Advanced Ticket Create Modal */}
      <AdvancedTicketCreateModal
        open={showAdvancedTicketModal}
        onClose={() => setShowAdvancedTicketModal(false)}
        initialPhoneNumber={ticketPhoneNumber}
        functionData={[]}
      />

      {/* Existing Tickets Modal */}
      <Modal
        open={existingTicketsModal}
        onClose={() => setExistingTicketsModal(false)}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 600 },
            maxHeight: "80vh",
            overflowY: "auto",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 3,
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            Existing Tickets for {phoneSearch}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {foundTickets.map((ticket) => (
            <Box
              key={ticket.id}
              sx={{ mb: 2, p: 2, border: "1px solid #eee", borderRadius: 1 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">
                  Ticket ID: {ticket.ticket_id}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '12px',
                      color: 'white',
                      background:
                        ticket.status === 'Closed'
                          ? '#757575'
                          : ticket.status === 'Open'
                          ? '#2e7d32'
                          : '#1976d2',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                  >
                    {ticket.status || "Escalated"}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      // handleOpenJustificationHistory(ticket);
                    }}
                    sx={{
                      color: '#1976d2',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.1)'
                      }
                    }}
                     title="View Ticket Updates"
                  >
                    <ChatIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Typography>
                Created: {new Date(ticket.created_at).toLocaleDateString()}
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  setExistingTicketsModal(false);
                  openModal(ticket);
                }}
                sx={{ mt: 1 }}
              >
                View Details
              </Button>
            </Box>
          ))}

          <Box
            sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setExistingTicketsModal(false);
                setNewTicketConfirmationModal(true);
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Create Ticket"
              )}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setExistingTicketsModal(false)}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* New Ticket Confirmation Modal */}
      <Modal
        open={newTicketConfirmationModal}
        onClose={() => setNewTicketConfirmationModal(false)}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 400 },
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 3,
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            No Existing Tickets Found
          </Typography>
          <Typography sx={{ mb: 2 }}>
            Would you like to create a new ticket for {phoneSearch}?
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleNewTicketConfirmation(true)}
            >
              Yes, Create Ticket
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleNewTicketConfirmation(false)}
            >
              No, Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

    </div>
  );
}
