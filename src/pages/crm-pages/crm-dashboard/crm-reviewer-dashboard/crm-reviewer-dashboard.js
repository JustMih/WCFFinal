import React, { useState, useEffect } from "react";
import axios from "axios";
import Autocomplete from "@mui/material/Autocomplete";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Avatar from "@mui/material/Avatar";
import Paper from "@mui/material/Paper";

// React Icons
import { FaEye, FaSearch, FaPlus } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { MdOutlineSupportAgent, MdImportExport, MdSwapHoriz } from "react-icons/md";
import ChatIcon from '@mui/icons-material/Chat';

// MUI Components - Individual imports for better tree shaking
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Snackbar from "@mui/material/Snackbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

// Custom Components
// import ColumnSelector from "../../../../components/colums-select/ColumnSelector";
import TicketFilters from "../../../../components/ticket/TicketFilters";
import TicketDetailsModal from "../../../../components/TicketDetailsModal";
import Pagination from "../../../../components/Pagination";
import TableControls from "../../../../components/TableControls";
import AdvancedTicketCreateModal from "../../../../components/ticket/AdvancedTicketCreateModal";
import PhoneSearchSection from "../../../../components/shared/PhoneSearchSection";
import TicketUpdates from "../../../../components/ticket/TicketUpdates";

// Config
import { baseURL } from "../../../../config";

// Styles
import "./crm-reviewer-dashboard.css";

// Card component
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

export default function ReviewerDashboard() {
  const [tickets, setTickets] = useState([]);
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [convertCategory, setConvertCategory] = useState({});
  const [forwardUnit, setForwardUnit] = useState({});
  const [activeColumns, setActiveColumns] = useState([
    "ticket_id",
    "fullName",
    "phone_number",
    "region",
    "status",
    "dateCreatedAt",
    "categoryType"
  ]);
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
    region: "",
    district: "",
    ticketId: "",
    startDate: null,
    endDate: null
  });
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [modalTicket, setModalTicket] = useState(null);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [showAdvancedTicketModal, setShowAdvancedTicketModal] = useState(false);
  const [ticketPhoneNumber, setTicketPhoneNumber] = useState("");
  const [ticketStatusTotal, setTicketStatusTotal] = useState(0);
  const [resolutionType, setResolutionType] = useState("");
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsModalTicket, setDetailsModalTicket] = useState(null);
  const [detailsModalAssignmentHistory, setDetailsModalAssignmentHistory] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [foundTickets, setFoundTickets] = useState([]);
  const [comment, setComment] = useState("");
  const [ticketComments, setTicketComments] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [ticketAttachments, setTicketAttachments] = useState({});
  const [historySearch, setHistorySearch] = useState("");
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [isJustificationModalOpen, setIsJustificationModalOpen] = useState(false);
  const [selectedTicketForJustification, setSelectedTicketForJustification] = useState(null);
  const [assignmentHistory, setAssignmentHistory] = useState([]);

  // Initialize activeColumns with default columns if empty
  useEffect(() => {
    if (activeColumns.length === 0) {
      setActiveColumns([
        "ticket_id",
        "fullName",
        "phone_number",
        "region",
        "status",
        "dateCreatedAt",
        "categoryType"
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
    pendingRating: tickets.filter((t) => !t.complaint_type && !t.complaintType).length,
    ratedMajor: tickets.filter((t) => (t.complaint_type === "Major" || t.complaintType === "Major")).length,
    ratedMinor: tickets.filter((t) => (t.complaint_type === "Minor" || t.complaintType === "Minor")).length
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
        // const res = await fetch(`${baseURL}/section/units-data`, {
        const res = await fetch(`${baseURL}/section/functions-data`, {
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
      const response = await fetch(`${baseURL}/reviewer/all-tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data.tickets)) {
        setTickets(data.tickets);
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
        `${baseURL}/reviewer/dashboard-counts/${id}`,
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

      if (result.ticketStats) {
        setNewTickets(result.ticketStats.newTickets);
        setConvertedTickets(result.ticketStats.convertedTickets);
        setTotalTickets(result.ticketStats.channeledTickets);
        setTicketStatus(result.ticketStats.ticketStatus);
        setTicketStatusTotal(result.ticketStats.ticketStatusTotal);
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
      const response = await fetch(`${baseURL}/reviewer/${ticketId}/rate`, {
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
        // Close the details modal on success
        setIsDetailsModalOpen(false);
      } else {
        throw new Error("Failed to rate ticket.");
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
      // Close the details modal on failure too
      setIsDetailsModalOpen(false);
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

    // Get the current ticket to check its section
    const currentTicket = tickets.find(t => t.id === ticketId);
    const ticketSection = currentTicket?.section || currentTicket?.responsible_unit_name;

    // Validate that at least one option is selected
    // If unitName is empty but ticket has a section, use the ticket's section
    const effectiveUnitName = unitName || ticketSection;
    
    if (!category && !effectiveUnitName) {
      setSnackbar({
        open: true,
        message: "Please select either a category to convert to, or a unit to forward to, or both",
        severity: "warning"
      });
      return;
    }

    // Check if trying to forward without rating
    if (effectiveUnitName && !currentTicket?.complaint_type && !currentTicket?.complaintType) {
      console.log('Debug - Ticket rating check:', {
        ticketId,
        complaint_type: currentTicket?.complaint_type,
        complaintType: currentTicket?.complaintType,
        effectiveUnitName
      });
      setSnackbar({
        open: true,
        message: "Please rate the ticket first: Select 'Minor' or 'Major' from the 'Complaint Category' dropdown, then try forwarding again.",
        severity: "warning"
      });
      return;
    }

    try {
      const token = localStorage.getItem("authToken");

      // Prepare the payload to match backend expectations
      const payload = { 
        userId,
        responsible_unit_name: effectiveUnitName || undefined,
        category: category || undefined,
        complaintType: currentTicket?.complaint_type || currentTicket?.complaintType || undefined
      };

      console.log('Sending payload:', payload);

      const response = await fetch(
        `${baseURL}/reviewer/${ticketId}/convert-or-forward-ticket`,
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
        // Close the details modal on success
        setIsDetailsModalOpen(false);
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
      // Close the details modal on failure too
      setIsDetailsModalOpen(false);
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
    // If value is empty, don't set it in state (will use ticket's current section)
    if (value) {
      setForwardUnit(prev => ({
        ...prev,
        [ticketId]: value
      }));
    } else {
      // Remove from state if empty, so it will use ticket's current section
      setForwardUnit(prev => {
        const newState = { ...prev };
        delete newState[ticketId];
        return newState;
      });
    }
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

  // --- Justification History Functions ---
  const handleOpenJustificationHistory = async (ticket) => {
    console.log("Opening justification history for ticket:", ticket);
    try {
      const token = localStorage.getItem("authToken");
      console.log("Token:", token ? "Present" : "Missing");
      console.log("API URL:", `${baseURL}/ticket/${ticket.id}/assignments`);
      
      const response = await fetch(`${baseURL}/ticket/${ticket.id}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Response status:", response.status);
      
      if (response.ok) {
        const history = await response.json();
        console.log("Assignment history:", history);
        console.log("History length:", history.length);
        console.log("History structure:", JSON.stringify(history, null, 2));
        
        setAssignmentHistory(history);
        setSelectedTicketForJustification(ticket);
        setIsJustificationModalOpen(true);
        console.log("Modal should be open now");
      } else {
        console.error("Failed to fetch assignment history");
        const errorText = await response.text();
        console.error("Error response:", errorText);
        // Even if API fails, still open modal with empty history
        setAssignmentHistory([]);
        setSelectedTicketForJustification(ticket);
        setIsJustificationModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching assignment history:", error);
      // Even if there's an error, still open modal with empty history
      setAssignmentHistory([]);
      setSelectedTicketForJustification(ticket);
      setIsJustificationModalOpen(true);
    }
  };

  const handleCloseJustificationModal = () => {
    setIsJustificationModalOpen(false);
    setSelectedTicketForJustification(null);
    setAssignmentHistory([]);
  };

  // Add helper functions for justification history
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
        return `${diffInMonths}m`;
      }
    }
  };

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
      <Box sx={{ maxWidth: 500 }}>
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





  const filteredTickets = tickets.filter((t) => {
    const s = search.trim().toLowerCase();
    const fullName = `${t.firstName || t.first_name || ""} ${
      t.middleName || t.middle_name || ""
    } ${t.lastName || t.last_name || ""}`.trim().toLowerCase();
    const institutionName = (t.institution && typeof t.institution === 'object' ? t.institution.name : t.institution || "").toLowerCase();

    // Debug logging for search
    if (s && (t.phone_number?.toLowerCase().includes(s) || t.nida_number?.toLowerCase().includes(s))) {
      console.log("🔍 Found match:", {
        ticketId: t.id,
        phone: t.phone_number,
        nida: t.nida_number,
        searchTerm: s
      });
    }

    // Basic search and status filter
    let matches =
      (!s ||
        t.phone_number?.toLowerCase().includes(s) ||
        t.nida_number?.toLowerCase().includes(s) ||
        fullName.includes(s) ||
        institutionName.includes(s) ||
        (t.firstName || t.first_name || "").toLowerCase().includes(s) ||
        (t.lastName || t.last_name || "").toLowerCase().includes(s) ||
        (t.middleName || t.middle_name || "").toLowerCase().includes(s) ||
        (t.ticket_id || "").toLowerCase().includes(s) ||
        (t.id || "").toLowerCase().includes(s)) &&
      (!filters.status || t.status === filters.status);

    // Apply advanced filters
    if (filters.category && filters.category !== "") {
      matches = matches && t.category === filters.category;
    }
    if (filters.priority && filters.priority !== "") {
      matches = matches && t.priority === filters.priority;
    }
    if (filters.region && filters.region !== "") {
      matches = matches && t.region === filters.region;
    }
    if (filters.district && filters.district !== "") {
      matches = matches && t.district === filters.district;
    }
    if (filters.ticketId && filters.ticketId !== "") {
      matches = matches && (
        (t.ticket_id && t.ticket_id.toLowerCase().includes(filters.ticketId.toLowerCase())) ||
        (t.id && t.id.toLowerCase().includes(filters.ticketId.toLowerCase()))
      );
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

  // Debug: Log filtered results
  if (search.trim()) {
    console.log("🔍 Search results:", {
      searchTerm: search,
      totalTickets: tickets.length,
      filteredTickets: filteredTickets.length,
      results: filteredTickets.map(t => ({ id: t.id, phone: t.phone_number, nida: t.nida_number }))
    });
  }

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredTickets.length);
  const totalItems = filteredTickets.length;
  
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderTableHeader = () => (
    <tr>
      {activeColumns.includes("ticket_id") && <th>Ticket ID</th>}
      {activeColumns.includes("fullName") && <th>Full Name</th>}
      {activeColumns.includes("phone_number") && <th>Phone</th>}
      {activeColumns.includes("region") && <th>Region</th>}
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
      {activeColumns.includes("ticket_id") && (
        <td>{ticket.ticket_id || ticket.id}</td>
      )}
      {activeColumns.includes("fullName") && (
        <td>
          {!ticket.first_name
            ? (ticket.institution || "N/A")
            : `${ticket.first_name || ""} ${ticket.middle_name || ""} ${ticket.last_name || ""}`.trim() || "N/A"}
        </td>
      )}
      {activeColumns.includes("phone_number") && (
        <td>{ticket.phone_number || "N/A"}</td>
      )}
      {activeColumns.includes("region") && (
        <td>{ticket.region || "N/A"}</td>
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
          onClick={() => openDetailsModal(ticket)}
        >
          <FaEye />
        </button>
      </td>
    </tr>
  );

  useEffect(() => {
    const fetchUnits = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const res = await fetch(`${baseURL}/section/functions-data`, {
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

  const handleCloseTicket = async () => {
    if (!resolutionDetails) {
      setSnackbar({
        open: true,
        message: "Please provide resolution details",
        severity: "warning"
      });
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const url = `${baseURL}/ticket/${selectedTicket.id}/close`;
      console.log('Closing ticket with URL:', url);
      console.log('Ticket ID:', selectedTicket.id);
      console.log('Resolution details:', resolutionDetails);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          resolution_details: resolutionDetails,
          userId: userId
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error data:', errorData);
        throw new Error(errorData.message || "Failed to close ticket");
      }

      const data = await response.json();
      console.log('Success data:', data);
      
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

      setIsCloseModalOpen(false);
      setIsDetailsModalOpen(false); // Close the main ticket details modal
      setResolutionType("");
      setResolutionDetails("");
      setAttachment(null);
      fetchDashboardCounts(userId);
    } catch (error) {
      console.error('Error in handleCloseTicket:', error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error"
      });
    }
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

  const openDetailsModal = async (ticket) => {
    console.log('🔍 ===== openDetailsModal FUNCTION CALLED =====');
    console.log('🔍 Ticket ID:', ticket.id);
    console.log('🔍 Ticket object:', ticket);
    
    // Set the ticket first, then open the modal
    setDetailsModalTicket(ticket);
    console.log('🔍 Set detailsModalTicket to:', ticket);
    
    // Add a small delay to ensure state is updated
    setTimeout(() => {
      setIsDetailsModalOpen(true);
      console.log('🔍 Set isDetailsModalOpen to true');
    }, 100);
    // Fetch assignment history for the ticket
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${baseURL}/ticket/${ticket.id}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('🔍 API Response for assignments:', data);
      console.log('🔍 Data type:', typeof data);
      console.log('🔍 Is array:', Array.isArray(data));
      console.log('🔍 Data length:', data.length);
      setDetailsModalAssignmentHistory(Array.isArray(data) ? data : []);
      console.log('🔍 Set detailsModalAssignmentHistory to:', Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('🔍 Error fetching assignments:', err);
      setDetailsModalAssignmentHistory([]);
    }
  };

  return (
    <div className="user-table-container">
      <h2 className="title">CC Dashboard</h2>

      {/* Shared Phone Search Section */}
      <PhoneSearchSection
        onSearch={(searchValue, foundTickets) => {
          setFoundTickets(foundTickets);
          // The PhoneSearchSection component handles the modal internally
        }}
        onNewTicket={(searchValue) => {
          setTicketPhoneNumber(searchValue);
          setShowAdvancedTicketModal(true);
        }}
        onViewTicketDetails={(ticket) => {
          setSelectedTicket(ticket);
          setShowDetailsModal(true);
        }}
        onShowAdvancedModal={setShowAdvancedTicketModal}
        phoneSearch={phoneSearch}
        setPhoneSearch={setPhoneSearch}
        snackbar={snackbar}
        setSnackbar={setSnackbar}
      />

      {/* Cards */}
      <div className="crm-cards">
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

      {/* Table */}
      <div className="user-table-container">
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "1rem"
        }}>
          <h3 className="title">Reviewer Tickets List</h3>
          
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
            onFilterStatusChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            filterRegion={filters.region}
            onFilterRegionChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
            filterDistrict={filters.district}
            onFilterDistrictChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
            activeColumns={activeColumns}
            onColumnsChange={setActiveColumns}
            tableData={filteredTickets}
            tableTitle="Reviewer Tickets"
          />

          <table className="user-table">
          <thead>
            <tr>
              {activeColumns.includes("ticket_id") && <th>Ticket ID</th>}
              {activeColumns.includes("fullName") && <th>Full Name</th>}
              {activeColumns.includes("phone_number") && <th>Phone</th>}
              {activeColumns.includes("region") && <th>Region</th>}
              {activeColumns.includes("status") && <th>Status</th>}
              {activeColumns.includes("dateCreatedAt") && <th>Date Created At</th>}
              {activeColumns.includes("categoryType") && <th>Category Type (Major/Minor)</th>}
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
                      {!ticket.first_name
                        ? (ticket.institution || "N/A")
                        : `${ticket.first_name || ""} ${ticket.middle_name || ""} ${ticket.last_name || ""}`.trim() || "N/A"}
                    </td>
                  )}
                  {activeColumns.includes("phone_number") && (
                    <td>{ticket.phone_number || "N/A"}</td>
                  )}
                  {activeColumns.includes("region") && (
                    <td>{ticket.region || "N/A"}</td>
                  )}
                  {activeColumns.includes("status") && (
                    <td>{ticket.status || "N/A"}</td>
                  )}
                  {activeColumns.includes("dateCreatedAt") && (
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
                  {activeColumns.includes("categoryType") && (
                    <td>
                      {ticket.complaint_type ? ticket.complaint_type : "Not Rated"}
                    </td>
                  )}
                  <td>
                    <button
                      className="view-ticket-details-btn"
                      title="View"
                      onClick={() => {
                        openDetailsModal(ticket);
                      }}
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
      
      {/* Split Ticket Details & History Modal */}
      <Modal open={showDetailsModal} onClose={() => setShowDetailsModal(false)}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            width: 1050,
            maxWidth: "98vw",
            minHeight: 500,
            maxHeight: "90vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 0,
          }}
        >

          {/* Left: Ticket Details */}
          <Box
            sx={{
              flex: 2,
              p: 4,
              borderRight: "1px solid #eee",
              overflowY: "auto",
              minWidth: 0,
              maxHeight: "90vh",
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
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "16px",
                    width: "100%",
                  }}
                >
                  {[
                    // If no first_name, show Institution only; else show First Name and Last Name
                    ...(!selectedTicket.first_name
                      ? [["Institution", selectedTicket.institution || "N/A"]]
                      : [
                          [
                            "Full Name",
                            selectedTicket.first_name +
                              " " +
                              selectedTicket.last_name || "N/A",
                          ],
                        ]),
                    ["Ticket Number", selectedTicket.ticket_id || "N/A"],
                    ["Phone", selectedTicket.phone_number || "N/A"],
                    ["Requester", selectedTicket.requester || "N/A"],
                    ["Region", selectedTicket.region || "N/A"],
                    ["Channel", selectedTicket.channel || "N/A"],
                    ["Section", selectedTicket.responsible_unit_name || "Unit"],
                    ["Sub-section", selectedTicket.sub_section || "N/A"],
                    ["Subject", selectedTicket.subject || "N/A"],
                    [
                      "Created By",
                      selectedTicket?.creator?.full_name
                        ? `${selectedTicket.creator.full_name}${
                            selectedTicket.role
                              ? ` (${selectedTicket.role})`
                              : ""
                          }`
                        : "N/A",
                    ],
                    // Always show Assigned To and Assigned Role
                    ["Assigned To", selectedTicket?.assignee?.full_name || "N/A"],
                    ["Assigned Role", selectedTicket.assigned_to_role || "N/A"],
                  ].map(([label, value], index) => (
                    <div
                      key={`left-${index}`}
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        border:
                          label === "Section" ||
                          label === "Sub-section" ||
                          label === "Subject"
                            ? "2px solid #e0e0e0"
                            : "none",
                      }}
                    >
                      <strong
                        style={{
                          minWidth: "120px",
                          color:
                            label === "Section" ||
                            label === "Sub-section" ||
                            label === "Subject"
                              ? "#1976d2"
                              : "#555",
                          fontSize: "0.9rem",
                        }}
                      >
                        {label}:
                      </strong>
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontSize: "0.9rem",
                          color:
                            label === "Section" ||
                            label === "Sub-section" ||
                            label === "Subject"
                              ? "#1976d2"
                              : "inherit",
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}

                  {/* Right Column */}
                  {[
                    [
                      "Status",
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
                        {selectedTicket.status || "Escalated" || "N/A"}
                      </span>,
                    ],
                    ["NIDA", selectedTicket.nida_number || "N/A"],
                    ["Institution", selectedTicket.institution || "N/A"],
                    ["District", selectedTicket.district || "N/A"],
                    ["Category", selectedTicket.category || "N/A"],
                    [
                      "Rated",
                      <span
                        style={{
                          color:
                            selectedTicket.complaint_type === "Major"
                              ? "red"
                              : selectedTicket.complaint_type === "Minor"
                              ? "orange"
                              : "inherit",
                        }}
                      >
                        {selectedTicket.complaint_type || "Unrated"}
                      </span>,
                    ],
                    [
                      "Created At",
                      selectedTicket.created_at
                        ? new Date(selectedTicket.created_at).toLocaleString(
                            "en-US",
                            {
                              month: "numeric",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )
                        : "N/A",
                    ],
                  ].map(([label, value], index) => (
                    <div
                      key={`right-${index}`}
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}
                    >
                      <strong
                        style={{
                          minWidth: "120px",
                          color: "#555",
                          fontSize: "0.9rem",
                        }}
                      >
                        {label}:
                      </strong>
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontSize: "0.9rem",
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Description - Full Width */}
                <div
                  style={{
                    width: "94%",
                    padding: "12px 16px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "flex-start",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    marginTop: "16px",
                  }}
                >
                  <strong
                    style={{
                      minWidth: "120px",
                      color: "#555",
                      fontSize: "0.9rem",
                    }}
                  >
                    Description:
                  </strong>
                  <span
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontSize: "0.9rem",
                      lineHeight: "1.5",
                    }}
                  >
                    {selectedTicket.description || "N/A"}
                  </span>
                </div>

                {/* Dependents Section */}
                {selectedTicket.dependents && selectedTicket.dependents.trim() !== "" && (
                  <Box sx={{ mt: 3, mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span style={{ fontSize: '1.2rem' }}>👥</span>
                      Dependents
                    </Typography>
                    
                    {/* Parse comma-separated dependents string to array */}
                    {(() => {
                      const dependentsArray = selectedTicket.dependents.split(',').map(dep => dep.trim()).filter(dep => dep);
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {dependentsArray.map((dependent, index) => (
                            <div
                              key={index}
                              style={{
                                padding: "12px",
                                backgroundColor: "#ffffff",
                                borderRadius: "6px",
                                border: "1px solid #dee2e6",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px"
                              }}
                            >
                              <div
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "50%",
                                  backgroundColor: "#e3f2fd",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#1976d2",
                                  fontWeight: "bold",
                                  fontSize: "0.875rem"
                                }}
                              >
                                {index + 1}
                              </div>
                              <div style={{ flex: 1 }}>
                                <Typography
                                  variant="subtitle2"
                                  style={{ fontWeight: "600", color: "#2c3e50" }}
                                >
                                  {dependent}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  style={{ color: "#6c757d" }}
                                >
                                  Dependent #{index + 1}
                                </Typography>
                              </div>
                              <div
                                style={{
                                  padding: "4px 8px",
                                  backgroundColor: "#e8f5e9",
                                  borderRadius: "12px",
                                  border: "1px solid #c8e6c9"
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  style={{ color: "#2e7d32", fontWeight: "500" }}
                                >
                                  Active
                                </Typography>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </Box>
                )}

                <Box sx={{ mt: 3, textAlign: "right" }}>
                  <Button
                    variant="contained"
                    color="success"
                    sx={{ mr: 2 }}
                    onClick={() => {
                      setTicketPhoneNumber(selectedTicket.phone_number || "");
                      setShowAdvancedTicketModal(true);
                      setShowDetailsModal(false);
                    }}
                  >
                    New Ticket
                  </Button>
                  {selectedTicket.status !== "Closed" && (
                    <Button
                      variant="contained"
                      color="secondary"
                      sx={{ mr: 2 }}
                      onClick={() => setShowNotifyModal(true)}
                    >
                      Notify User
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Close
                  </Button>
                </Box>
              </>
            )}
          </Box>
          {/* Right: Ticket History */}
          <Box
            sx={{
              flex: 1,
              p: 4,
              overflowY: "auto",
              minWidth: 350,
              maxWidth: 420,
              maxHeight: "90vh",
            }}
          >
            {/* Add search input for ticket history */}
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Search ticket history..."
                value={historySearch || ""}
                onChange={(e) => setHistorySearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  fontSize: "0.95em",
                }}
              />
            </div>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, color: "#1976d2" }}
            >
              Ticket History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {/* Filter ticket history by search */}
            {(foundTickets && foundTickets.length > 0
              ? foundTickets.filter((ticket) => {
                  const s = (historySearch || "").toLowerCase();
                  return (
                    ticket.subject?.toLowerCase().includes(s) ||
                    ticket.ticket_id?.toLowerCase().includes(s) ||
                    ticket.description?.toLowerCase().includes(s)
                  );
                })
              : []
            ).length > 0 ? (
              foundTickets
                .filter((ticket) => {
                  const s = (historySearch || "").toLowerCase();
                  return (
                    ticket.subject?.toLowerCase().includes(s) ||
                    ticket.ticket_id?.toLowerCase().includes(s) ||
                    ticket.description?.toLowerCase().includes(s)
                  );
                })
                .map((ticket) => (
                  <Box
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowDetailsModal(true);
                    }}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor:
                        selectedTicket?.id === ticket.id ? "#e3f2fd" : "#fff",
                      cursor: "pointer",
                      border:
                        selectedTicket?.id === ticket.id
                          ? "2px solid #1976d2"
                          : "1px solid #e0e0e0",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      "&:hover": {
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        borderColor: "#1976d2",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: "#1976d2" }}
                      >
                        {ticket.ticket_id}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: "12px",
                            color: "white",
                            background:
                              ticket.status === "Closed"
                                ? "#757575"
                                : ticket.status === "Open"
                                ? "#2e7d32"
                                : "#1976d2",
                            fontSize: "0.75rem",
                            fontWeight: 500
                          }}
                        >
                          {ticket.status}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenJustificationHistory(ticket);
                          }}
                          sx={{
                            color: '#1976d2',
                            '&:hover': {
                              backgroundColor: 'rgba(25, 118, 210, 0.1)'
                            }
                          }}
                          title="View Recommendation History"
                        >
                          <ChatIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: "#666", mb: 0.5 }}
                      >
                        Created:{" "}
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 500, color: "#333", mb: 1 }}
                      >
                        Subject: {ticket.subject}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        Description: {ticket.description}
                      </Typography>
                    </Box>
                  </Box>
                ))
            ) : (
              <Typography sx={{ textAlign: "center", color: "#666", mt: 3 }}>
                No ticket history found.
              </Typography>
            )}
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Button
                variant="contained"
                color="primary"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 500,
                  boxShadow: "0 2px 4px rgba(25,118,210,0.2)",
                  "&:hover": {
                    boxShadow: "0 4px 8px rgba(25,118,210,0.3)",
                  },
                }}
                onClick={() => {
                  setTicketPhoneNumber(phoneSearch);
                  setShowAdvancedTicketModal(true);
                  setShowDetailsModal(false);
                }}
              >
                Create New Ticket
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Close Ticket Modal */}
      <Modal open={isCloseModalOpen} onClose={() => setIsCloseModalOpen(false)}>
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
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1976d2", mb: 2 }}>
            Close Ticket
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Resolution Details:
              </Typography>
              <textarea
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.9rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  minHeight: "100px",
                  resize: "vertical"
                }}
                value={resolutionDetails}
                onChange={(e) => setResolutionDetails(e.target.value)}
                placeholder="Enter resolution details..."
              />
            </Box>

            <Box sx={{ mt: 2, display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setIsCloseModalOpen(false);
                  setResolutionDetails("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleCloseTicket}
                disabled={!resolutionDetails.trim()}
              >
                Close Ticket
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Notification Modal */}
      <Modal open={showNotifyModal} onClose={() => setShowNotifyModal(false)}>
        <Box
          sx={{
            p: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
            minWidth: 350,
            maxWidth: 400,
            mx: "auto",
            mt: "15vh",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Send Notification
          </Typography>
          <TextField
            label="Message"
            multiline
            rows={3}
            fullWidth
            value={notifyMessage}
            onChange={(e) => setNotifyMessage(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={async () => {
              try {
                const res = await fetch(`${baseURL}/notifications/notify`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                  },
                  body: JSON.stringify({
                    ticket_id: selectedTicket.id,
                    category: selectedTicket.category,
                    message: notifyMessage,
                    channel: selectedTicket.channel,
                    subject: selectedTicket.functionData?.name,
                  }),
                });
                const data = await res.json();
                setShowNotifyModal(false);
                if (res.ok && data.notification) {
                  setSnackbar({
                    open: true,
                    message: "Notification sent and saved!",
                    severity: "success",
                  });
                } else {
                  setSnackbar({
                    open: true,
                    message: data.message || "Failed to save notification.",
                    severity: "error",
                  });
                }
              } catch (error) {
                setShowNotifyModal(false);
                setSnackbar({
                  open: true,
                  message: "Network error: " + error.message,
                  severity: "error",
                });
              }
            }}
            disabled={!notifyMessage.trim()}
          >
            Send
          </Button>
        </Box>
      </Modal>

      {/* Justification History Modal */}
      <Modal
        open={isJustificationModalOpen}
        onClose={handleCloseJustificationModal}
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
            p: 3
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            View Updates
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box>
            <TicketUpdates 
              ticketId={selectedTicketForJustification?.id}
              currentUserId={localStorage.getItem('userId')}
              canAddUpdates={selectedTicketForJustification?.status !== 'Closed' && selectedTicketForJustification?.status !== 'Attended and Recommended'}
              isAssigned={selectedTicketForJustification?.assigned_to_id === localStorage.getItem('userId')}
            />
          </Box>
          <Box
            sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleCloseJustificationModal}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
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

      {/* AdvancedTicketCreateModal */}
      <AdvancedTicketCreateModal
        open={showAdvancedTicketModal}
        onClose={() => setShowAdvancedTicketModal(false)}
        onOpen={() => setShowAdvancedTicketModal(true)}
        functionData={functionData}
        initialPhoneNumber={phoneSearch}
      />

      {/* TicketDetailsModal */}
      <TicketDetailsModal
        open={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        selectedTicket={detailsModalTicket}
        assignmentHistory={detailsModalAssignmentHistory}
        refreshTickets={fetchTickets}
        refreshDashboardCounts={() => {}} // This page doesn't have dashboard counts, so pass empty function
      />

      {/* ReviewerActionModal */}
      {/* This modal is no longer needed as TicketDetailsModal handles actions */}
      {/* <ReviewerActionModal
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
      /> */}
    </div>
  );
}
