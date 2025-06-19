import React, { useState, useEffect } from "react";
import axios from "axios";
import TicketActions from "../../../../components/coordinator/TicketActions";

// React Icons
import { FaEye, FaRegCheckCircle } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { HiOutlineUserAdd } from "react-icons/hi";
import {
  MdSwapHoriz,
  MdOutlineSupportAgent,
  MdAutoAwesomeMotion,
  MdDisabledVisible,
  MdImportExport
} from "react-icons/md";
import { TbArrowsExchange } from "react-icons/tb";
import { CiImport } from "react-icons/ci";

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
  Typography
} from "@mui/material";

// Custom Components
import Card from "../../../../components/card/card";
import ColumnSelector from "../../../../components/colums-select/ColumnSelector";
import TicketFilters from "../../../../components/ticket/TicketFilters";
import CoordinatorActionModal from "../../../../components/coordinator/CoordinatorActionModal";

// Config
import { baseURL } from "../../../../config";

// Styles
import "./crm-coordinator-dashboard.css";

export default function CoordinatorDashboard() {
  const [tickets, setTickets] = useState([]);
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [convertCategory, setConvertCategory] = useState({});
  const [forwardUnit, setForwardUnit] = useState({});
  const [activeColumns, setActiveColumns] = useState([]); // Updated by ColumnSelector
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [functionData, setFunctionData] = useState([]);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    nidaSearch: "",
    status: "",
    priority: "",
    category: "",
    startDate: null,
    endDate: null
  });
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [modalTicket, setModalTicket] = useState(null);
  const [ticketStatusTotal, setTicketStatusTotal] = useState(0);

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

  const categories = [
    "Inquiry",
    // "Suggestion",
    // "Compliment",
    // "Congrats"
  ];

  // Card data
  const ticketStats = {
    totalComplaints: tickets.length,
    pendingRating: tickets.filter((t) => !t.complaintType).length,
    ratedMajor: tickets.filter((t) => t.complaintType === "Major").length,
    ratedMinor: tickets.filter((t) => t.complaintType === "Minor").length
  };
  const [totalTickets, setTotalTickets] = useState({
    Directorate: 0,
    Units: 0
  });
  const [newTickets, setNewTickets] = useState({
    "New Tickets": 0,
    // "New Tickets": 0,
    "Escalated Tickets": 0
  });
  const [convertedTickets, setConvertedTickets] = useState({
    // Inquiries: 0,
    Complaints: 0,
    Suggestions: 0,
    Complements: 0
  });
  const [ticketStatus, setTicketStatus] = useState({
    // Open: 0,
    "On Progress": 0,
    Closed: 0,
    Minor: 0,
    Major: 0
  });

  // Fetch userId on mount
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

    setUserId(id); // Set state for other uses
    fetchTickets();
    fetchDashboardCounts(id); // pass id directly
  }, []);

  // Fetch function data for subject selection
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const fetchData = async () => {
      try {
        const res = await fetch(`${baseURL}/section/units-data`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const json = await res.json();
        setFunctionData(json.data || []);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    if (token) {
      fetchData();
    }
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/coordinator/all-tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data.complaints)) {
        setTickets(data.complaints);
      } else {
        setTickets([]);
        setSnackbar({
          open: true,
          message: "No complaints found.",
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

  const fetchDashboardCounts = async (id) => {
    setLoading(true);
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(
        `${baseURL}/coordinator/dashboard-counts/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", responseText);
        throw new Error(
          `Invalid JSON response from server: ${parseError.message}`
        );
      }

      if (result.data) {
        setNewTickets(result.data.newTickets);
        setConvertedTickets(result.data.convertedTickets);
        setTotalTickets(result.data.channeledTickets);
        setTicketStatus(result.data.ticketStatus);
        setTicketStatusTotal(result.data.ticketStatusTotal);
      } else {
        throw new Error("No data received from server");
      }
    } catch (error) {
      console.error("Dashboard counts error:", error);
      setSnackbar({
        open: true,
        message: `Error fetching dashboard counts: ${error.message}`,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (ticketId, rating) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/coordinator/${ticketId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ complaintType: rating, userId })
      });
      if (response.ok) {
        setSnackbar({
          open: true,
          message: `Rated as ${rating}`,
          severity: "success"
        });
        // Refresh both tickets and dashboard counts
        await Promise.all([fetchTickets(), fetchDashboardCounts(userId)]);
      } else {
        throw new Error("Failed to rate ticket.");
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    }
  };

  const handleConvertOrForward = async (ticketId) => {
    const category = convertCategory[ticketId];
    const unitName = forwardUnit[ticketId];
    const userId = localStorage.getItem("userId");

    console.log('Debug values:', {
      ticketId,
      category,
      unitName,
      convertCategory,
      forwardUnit
    });

    // Validate that at least one option is selected
    if (!category && !unitName) {
      setSnackbar({
        open: true,
        message: "Please select either a category to convert to, or a unit to forward to, or both",
        severity: "warning"
      });
      return;
    }

    try {
      const token = localStorage.getItem("authToken");

      // Prepare the payload to match backend expectations
      const payload = { 
        userId,
        responsible_unit_name: unitName || undefined,
        category: category || undefined
      };

      console.log('Sending payload:', payload);

      const response = await fetch(
        `${baseURL}/coordinator/${ticketId}/convert-or-forward-ticket`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: data.message || "Ticket updated successfully",
          severity: "success"
        });
        await Promise.all([fetchTickets(), fetchDashboardCounts(userId)]);
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
        throw new Error(data.message || "Failed to update ticket");
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      setSnackbar({ 
        open: true, 
        message: error.message || "Failed to update ticket", 
        severity: "error" 
      });
    }
  };

  // Update the select handlers to properly set state
  const handleCategoryChange = (ticketId, value) => {
    setConvertCategory(prev => ({
      ...prev,
      [ticketId]: value
    }));
  };

  const handleUnitChange = (ticketId, value) => {
    setForwardUnit(prev => ({
      ...prev,
      [ticketId]: value
    }));
  };

  // Add a refresh function that can be called periodically
  const refreshData = async () => {
    if (userId) {
      await Promise.all([fetchTickets(), fetchDashboardCounts(userId)]);
    }
  };

  // Add useEffect for periodic refresh
  useEffect(() => {
    if (userId) {
      // Initial fetch
      refreshData();

      // Set up periodic refresh every 30 seconds
      const refreshInterval = setInterval(refreshData, 30000);

      // Cleanup interval on component unmount
      return () => clearInterval(refreshInterval);
    }
  }, [userId]); // Only re-run if userId changes

  const openModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const filteredTickets = tickets.filter((t) => {
    const s = search.trim().toLowerCase();
    const fullName = `${t.firstName || t.first_name || ""} ${
      t.middleName || t.middle_name || ""
    } ${t.lastName || t.last_name || ""}`.toLowerCase();

    // Basic search and status filter
    let matches =
      (!s ||
        t.phone_number?.toLowerCase().includes(s) ||
        t.nida_number?.toLowerCase().includes(s) ||
        fullName.includes(s)) &&
      (!filterStatus || t.status === filterStatus);

    // Apply advanced filters
    if (filters.category && filters.category !== "") {
      matches = matches && t.category === filters.category;
    }
    if (filters.priority && filters.priority !== "") {
      matches = matches && t.priority === filters.priority;
    }
    if (filters.startDate) {
      matches =
        matches &&
        new Date(t.createdAt || t.created_at) >= new Date(filters.startDate);
    }
    if (filters.endDate) {
      matches =
        matches &&
        new Date(t.createdAt || t.created_at) <= new Date(filters.endDate);
    }

    return matches;
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
    <tr key={ticket.id}>
      {activeColumns.includes("id") && (
        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
      )}
      {activeColumns.includes("fullName") && (
        <td>{`${ticket.firstName || ""} ${ticket.middleName || ""} ${
          ticket.lastName || ""
        }`}</td>
      )}
      {activeColumns.includes("phone_number") && (
        <td>{ticket.phone_number || "N/A"}</td>
      )}
      {activeColumns.includes("status") && <td>{ticket.status || "N/A"}</td>}
      {activeColumns.includes("subject") && <td>{ticket.subject || "N/A"}</td>}
      {activeColumns.includes("category") && (
        <td>{ticket.category || "N/A"}</td>
      )}
      {activeColumns.includes("assigned_to_role") && (
        <td>{ticket.assigned_to_role || "N/A"}</td>
      )}
      {activeColumns.includes("createdAt") && (
        <td>
          {ticket.createdAt
            ? new Date(ticket.createdAt).toLocaleString("en-GB", {
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
        <button
          className="view-ticket-details-btn"
          title="View"
          onClick={() => openModal(ticket)}
        >
          <FaEye />
        </button>
        <button
          className="advanced-ticket-btn"
          title="Advanced"
          style={{ marginLeft: 8 }}
          onClick={() => handleAdvanced(ticket)}
        >
          <FiSettings />
        </button>
      </td>
    </tr>
  );

  useEffect(() => {
    const fetchUnits = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const res = await fetch(`${baseURL}/section/units-data`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const json = await res.json();
        
        if (json.data && Array.isArray(json.data)) {
          // Ensure each unit has the required fields
          const validUnits = json.data.filter(unit => unit.id && unit.name);
          setUnits(validUnits);
        } else {
          console.error("Invalid units data received:", json);
          setSnackbar({
            open: true,
            message: "Failed to load units data",
            severity: "error"
          });
        }
      } catch (err) {
        console.error("Error fetching units:", err);
        setSnackbar({
          open: true,
          message: "Failed to load units",
          severity: "error"
        });
      }
    };
    fetchUnits();
  }, []);

  const handleAdvanced = (ticket) => {
    // You can replace this with a modal or drawer for advanced actions
    alert(`Advanced actions for ticket ID: ${ticket.id}`);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleTicketUpdate = (updatedTicket) => {
    // Update the tickets list with the updated ticket
    setTickets(tickets.map(ticket => 
      ticket.id === updatedTicket.id ? updatedTicket : ticket
    ));
    
    // Refresh dashboard counts
    fetchDashboardCounts(userId);
    
    // Show success message
    setSnackbar({
      open: true,
      message: "Ticket updated successfully",
      severity: "success"
    });
  };

  // Place this above the return statement, inside the component but outside JSX:
  const details = selectedTicket ? [
    ["Name", `${selectedTicket.first_name || "N/A"} ${selectedTicket.middle_name || "N/A"} ${selectedTicket.last_name || "N/A"}`],
    ["Phone", selectedTicket.phone_number || "N/A"],
    ["NIN", selectedTicket.nida_number || "N/A"],
    ["Institution", selectedTicket.institution || "N/A"],
    ["Region", selectedTicket.region || "N/A"],
    ["District", selectedTicket.district || "N/A"],
    ["Subject", selectedTicket.subject || "N/A"],
    ["Category", selectedTicket.category || "N/A"],
    ["Channel", selectedTicket.channel || "N/A"],
    ["Rated", selectedTicket.complaint_type || "N/A"],
    ["Status", selectedTicket.status || "N/A"],
    ["Created By", selectedTicket?.createdBy?.name || "N/A"],
    ["Assigned To (User ID)", selectedTicket.assigned_to_id || "N/A"],
    ["Assigned Role", selectedTicket.assigned_to_role || "N/A"],
    ["Created At", selectedTicket.created_at
      ? new Date(selectedTicket.created_at).toLocaleString("en-US", {
          month: "numeric",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        })
      : "N/A"],
  ] : [];
  const detailPairs = [];
  for (let i = 0; i < details.length; i += 2) {
    detailPairs.push([details[i], details[i + 1]]);
  }

  return (
    <div className="coordinator-dashboard-container">
      <h2 className="title">Coordinator Dashboard</h2>

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
            title="Channeled Tickets"
            data={totalTickets}
            color="#bce8be"
            icon={<MdOutlineSupportAgent fontSize={35} />}
          />
        </div>
        <div className="crm-cards-container">
          <Card
            title="Tickets Category"
            data={convertedTickets}
            color="#b9c9ff"
            icon={<MdSwapHoriz fontSize={35} />}
          />
          <Card
            title="Ticket Status"
            data={{ ...ticketStatus, Total: ticketStatusTotal }}
            color="#ffc4dd"
            icon={<MdImportExport fontSize={35} />}
          />
        </div>
      </div>
      <TicketFilters
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />
      {/* Table */}
      <div style={{ overflowX: "auto", width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <h2>All Corrdinator Tickets</h2>
          <Tooltip title="Columns Settings and Export" arrow>
            <IconButton onClick={() => setIsColumnModalOpen(true)}>
              <FiSettings size={20} />
            </IconButton>
          </Tooltip>
        </div>
        {/* Filters */}
        <div
          className="controls"
          // style={{ display: "flex", justifyContent: "space-between", alignItems: "center"
          //  }}
        >
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
                  value === "All" ? tickets.length : parseInt(value)
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
              placeholder="Search by phone or NIDA"
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
          </div>
        </div>

        <table className="user-table">
          <thead>
            <tr>
              {activeColumns.includes("id") && <th>#</th>}
              {activeColumns.includes("fullName") && <th>Full Name</th>}
              {activeColumns.includes("phone_number") && <th>Phone</th>}
              {activeColumns.includes("status") && <th>Status</th>}
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
                    <td>{`${ticket.first_name || ""} ${
                      ticket.middle_name || ""
                    } ${ticket.last_name || ""}`}</td>
                  )}
                  {activeColumns.includes("phone_number") && (
                    <td>{ticket.phone_number || "N/A"}</td>
                  )}
                  {activeColumns.includes("status") && (
                    <td>{ticket.status || "N/A"}</td>
                  )}

                  <td>
                    <button
                      className="view-ticket-details-btn"
                      title="View"
                      onClick={() => openModal(ticket)}
                    >
                      <FaEye />
                    </button>
                    {/* <button
                      className="advanced-ticket-btn"
                      title="Advanced"
                      style={{ marginLeft: 8 }}
                      onClick={() => handleAdvanced(ticket)}
                    >
                      <FiSettings />
                    </button> */}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={activeColumns.length + 1}
                  style={{ textAlign: "center", color: "red" }}
                >
                  No complaints found.
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
<Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
  <Box
    sx={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: { xs: "90%", sm: 500 },
      maxHeight: "80vh",
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
          variant="h5"
          sx={{ fontWeight: "bold", color: "#1976d2" }}
        >
          Ticket Details
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {/* Two-Column Ticket Fields */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ flex: "1 1 45%" }}>
            <Typography><strong>Name:</strong> {`${selectedTicket.first_name || "N/A"} ${selectedTicket.middle_name || "N/A"} ${selectedTicket.last_name || "N/A"}`}</Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography><strong>Phone:</strong> {selectedTicket.phone_number || "N/A"}</Typography>
          </div>

          <div style={{ flex: "1 1 45%" }}>
            <Typography><strong>NIDA:</strong> {selectedTicket.nida_number || "N/A"}</Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography><strong>Institution:</strong> {selectedTicket.institution || "N/A"}</Typography>
          </div>

          <div style={{ flex: "1 1 45%" }}>
            <Typography><strong>Region:</strong> {selectedTicket.region || "N/A"}</Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography><strong>District:</strong> {selectedTicket.district || "N/A"}</Typography>
          </div>

          <div style={{ flex: "1 1 45%" }}>
            <Typography><strong>Subject:</strong> {selectedTicket.subject || "N/A"}</Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography><strong>Category:</strong> {selectedTicket.category || "N/A"}</Typography>
          </div>

          <div style={{ flex: "1 1 45%" }}>
            <Typography><strong>Channel:</strong> {selectedTicket.channel || "N/A"}</Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography>
              <strong>Rated:</strong>{" "}
              <span style={{
                color: selectedTicket.complaint_type === "Major" ? "red" :
                       selectedTicket.complaint_type === "Minor" ? "orange" :
                       "inherit"
              }}>
                {selectedTicket.complaint_type || "N/A"}
              </span>
            </Typography>
          </div>

          <div style={{ flex: "1 1 45%" }}>
            <Typography>
              <strong>Status:</strong>{" "}
              <span style={{
                color: selectedTicket.status === "Open" ? "green" :
                       selectedTicket.status === "Closed" ? "gray" :
                       "blue"
              }}>
                {selectedTicket.status || "N/A"}
              </span>
            </Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography><strong>Created By:</strong> {selectedTicket?.createdBy?.name || "N/A"}</Typography>
          </div>

          <div style={{ flex: "1 1 45%" }}>
            <Typography><strong>Assigned To (User ID):</strong> {selectedTicket.assigned_to_id || "N/A"}</Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography><strong>Assigned Role:</strong> {selectedTicket.assigned_to_role || "N/A"}</Typography>
          </div>

          <div style={{ flex: "1 1 45%" }}>
            <Typography><strong>Created At:</strong> {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString("en-US", {
              month: "numeric", day: "numeric", year: "numeric",
              hour: "numeric", minute: "2-digit", hour12: true
            }) : "N/A"}</Typography>
          </div>

          <div style={{ flex: "1 1 100%" }}>
            <Typography><strong>Description:</strong> {selectedTicket.description || "N/A"}</Typography>
          </div>
        </div>

        {/* Action Buttons */}
        <Box
          sx={{
            mt: 3,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center"
          }}
        >
          <TicketActions 
            ticket={selectedTicket}
            onTicketUpdate={handleTicketUpdate}
          />

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
                onChange={(e) =>
                  handleCategoryChange(selectedTicket.id, e.target.value)
                }
              >
                <option value="">Convert To</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
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
              value={forwardUnit[selectedTicket.id] || ""}
              onChange={(e) =>
                handleUnitChange(selectedTicket.id, e.target.value)
              }
            >
              <option value="">{selectedTicket.section}</option>
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
        </Box>

        {/* Close Button */}
        <Box sx={{ mt: 2, textAlign: "right" }}>
          <Button color="primary" onClick={() => setIsModalOpen(false)}>
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
        data={tickets}
        onColumnsChange={setActiveColumns}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <CoordinatorActionModal
        open={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        ticket={modalTicket}
        categories={categories}
        units={units}
        convertCategory={convertCategory}
        forwardUnit={forwardUnit}
        handleCategoryChange={handleCategoryChange}
        handleUnitChange={handleUnitChange}
        handleConvertOrForward={handleConvertOrForward}
        handleRating={handleRating}
      />
    </div>
  );
}
