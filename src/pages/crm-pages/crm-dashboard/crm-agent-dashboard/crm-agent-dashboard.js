import React, { useState, useEffect } from "react";
import {
  MdOutlineSupportAgent,
  MdAutoAwesomeMotion,
  MdDisabledVisible
} from "react-icons/md";
import { FaEye, FaPlus, FaSearch } from "react-icons/fa";
import { FaUsersLine } from "react-icons/fa6";
import { GrLineChart } from "react-icons/gr";
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
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import ColumnSelector from "../../../../components/colums-select/ColumnSelector";
import { baseURL } from "../../../../config";
import "./crm-agent-dashboard.css";
import TicketActions from "../../../../components/ticket/TicketActions";
import TicketFilters from "../../../../components/ticket/TicketFilters";
import TicketDetailsModal from "../../../../components/ticket/TicketDetailsModal";

const AgentCRM = () => {
  // State for form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    nidaNumber: "",
    requester: "",
    institution: "",
    region: "",
    district: "",
    channel: "",
    category: "",
    functionId: "",
    description: "",
    status: "Open"
  });

  // State for form errors
  const [formErrors, setFormErrors] = useState({});

  // State for modal visibility and messages
  const [modal, setModal] = useState({
    isOpen: false,
    type: "",
    message: ""
  });

  // State for ticket creation modal
  const [showModal, setShowModal] = useState(false);

  // State for ticket details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comment, setComment] = useState("");
  const [ticketComments, setTicketComments] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // State for function data and selections
  const [functionData, setFunctionData] = useState([]);
  const [selectedFunction, setSelectedFunction] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  // State for ticket stats
  const [ticketStats, setTicketStats] = useState({
    totalComplaints: 0,
    pendingRating: 0,
    ratedMajor: 0,
    ratedMinor: 0
  });

  // State for customer tickets
  const [customerTickets, setCustomerTickets] = useState([]);

  // State for filters and pagination
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [activeColumns, setActiveColumns] = useState([
    "id",
    "fullName",
    "phone_number",
    "status",
    "subject",
    "category",
    "assigned_to_role",
    "created_at"
  ]);

  // State for snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });

  // State for card dashboard
  const [agentData, setAgentData] = useState({
    agentActivity: {
      "Open Tickets": 0,
      "In Progress": 0,
      "Closed Tickets": 0,
      Overdue: 0,
      Total: 0
    },
    ticketQueue: {
      "New Tickets": 0,
      Assigned: 0,
      "In/Hour": 0,
      "Resolved/Hour": 0,
      Total: 0
    },
    ticketWait: {
      "Longest Wait": "00:00",
      "Avg Wait": "00:00",
      "Max Wait": "00:00",
      Pending: 0,
      Total: 0
    },
    unresolvedTickets: {
      "Last Hour": 0,
      "Avg Delay": "00:00",
      "Max Delay": "00:00",
      "SLA Breaches": 0,
      Total: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("authToken");

  const [ticketAttachments, setTicketAttachments] = useState({});

  const [filters, setFilters] = useState({
    search: "",
    nidaSearch: "",
    priority: "",
    category: "",
    startDate: null,
    endDate: null
  });

  // Add new state for phone search
  const [phoneSearch, setPhoneSearch] = useState("");
  const [existingTicketsModal, setExistingTicketsModal] = useState(false);
  const [newTicketConfirmationModal, setNewTicketConfirmationModal] = useState(false);
  const [foundTickets, setFoundTickets] = useState([]);

  // Add submitAction state to control ticket status
  const [submitAction, setSubmitAction] = useState("open"); // "open" or "closed"

  // Notification modal state
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");

  // Fetch function data for subject selection
  useEffect(() => {
    const fetchData = async () => {
      try {
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
  }, [token]);

  // Fetch userId, tickets, and dashboard data on mount
  useEffect(() => {
    if (!userId || !token) {
      setError("Please log in to view the dashboard.");
      setLoading(false);
      return;
    }
    fetchCustomerTickets();
    fetchDashboardData(userId, token);
  }, [userId, token]);

  const fetchCustomerTickets = async () => {
    try {
      const response = await fetch(`${baseURL}/ticket/all-customer-tickets`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const result = await response.json();
      if (response.ok && Array.isArray(result.tickets)) {
        setCustomerTickets(result.tickets);
        updateTicketStats(result.tickets);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setError("Failed to load tickets.");
    }
  };

  const fetchDashboardData = async (userId, token) => {
    try {
      const response = await fetch(`${baseURL}/ticket/count/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const stats = data.ticketStats;

      setAgentData({
        agentActivity: {
          "Open Tickets": stats.open || 0,
          "In Progress": stats.inProgress || 0,
          "Closed Tickets": stats.closed || 0,
          Overdue: stats.overdue || 0,
          Total: stats.total || 0
        },
        ticketQueue: {
          "New Tickets": stats.newTickets || 0,
          Assigned: stats.assigned || 0,
          "In/Hour": stats.inHour || 0,
          "Resolved/Hour": stats.resolvedHour || 0,
          Total: stats.total || 0
        },
        ticketWait: {
          "Longest Wait": stats.longestWait || "00:00",
          "Avg Wait": stats.avgWait || "00:00",
          "Max Wait": stats.maxWait || "00:00",
          Pending: stats.pending || 0,
          Total: stats.total || 0
        },
        unresolvedTickets: {
          "Last Hour": stats.lastHour || 0,
          "Avg Delay": stats.avgDelay || "00:00",
          "Max Delay": stats.maxDelay || "00:00",
          "SLA Breaches": stats.slaBreaches || 0,
          Total: stats.overdue || 0
        }
      });
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStats = (tickets) => {
    setTicketStats({
      totalComplaints: tickets.length,
      pendingRating: tickets.filter((t) => !t.complaintType).length,
      ratedMajor: tickets.filter((t) => t.complaintType === "Major").length,
      ratedMinor: tickets.filter((t) => t.complaintType === "Minor").length
    });
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "functionId") {
      // Find the selected functionData object
      const selectedFunctionData = functionData.find((item) => item.id === value);
      if (selectedFunctionData) {
        // Use new structure: function and function.section
        setSelectedFunction(selectedFunctionData.function?.name || "");
        setSelectedSection(selectedFunctionData.function?.section?.name || "");
      } else {
        setSelectedFunction("");
        setSelectedSection("");
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = {
      firstName: "First Name",
      lastName: "Last Name",
      phoneNumber: "Phone Number",
      nidaNumber: "NIDA Number",
      requester: "Requester",
      institution: "Institution",
      region: "Region",
      district: "District",
      channel: "Channel",
      category: "Category",
      functionId: "Subject",
      description: "Description"
    };

    const errors = {};
    const missing = [];

    Object.entries(requiredFields).forEach(([key, label]) => {
      if (!formData[key] || formData[key].toString().trim() === "") {
        errors[key] = "This field is required";
        missing.push(`• ${label}`);
      }
    });

    if (missing.length > 0) {
      setFormErrors(errors);
      setModal({
        isOpen: true,
        type: "error",
        message: `Please fill the required fields before submitting.`
      });
      return;
    }

    setFormErrors({});

    try {
      const selectedFunction = functionData.find(f => f.id === formData.functionId);
      const ticketData = {
        ...formData,
        subject: selectedFunction ? selectedFunction.name : '',
        section: selectedSection || 'Unit',  // Add section name
        sub_section: selectedFunction ? selectedFunction.function?.name : '',  // Fix to use function name
        responsible_unit_id: formData.functionId,
        responsible_unit_name: selectedSection || 'Unit',  // Changed to use section name instead of function name
        status: submitAction === "closed" ? "Closed" : "Open"
      };

      const response = await fetch(`${baseURL}/ticket/create-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(ticketData)
      });

      const data = await response.json();

      if (response.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: `Ticket created successfully`
        });
        setShowModal(false);
        setFormData({
          firstName: "",
          lastName: "",
          phoneNumber: "",
          nidaNumber: "",
          requester: "",
          institution: "",
          region: "",
          district: "",
          channel: "",
          category: "",
          functionId: "",
          description: "",
          status: "Open"
        });
        fetchCustomerTickets();
      } else {
        setModal({
          isOpen: true,
          type: "error",
          message: data.message || "Ticket creation failed."
        });
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      setModal({
        isOpen: true,
        type: "error",
        message: `Network error. Please try again later.`
      });
    }
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: "", message: "" });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const openDetailsModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowDetailsModal(true);
    fetchTicketComments(ticket.id);
    fetchTicketAttachments(ticket.id);
  };

  const getFilteredTickets = () => {
    return customerTickets.filter((ticket) => {
      // Search by phone or NIDA (from table controls)
      const s = search.trim().toLowerCase();
      const matchesSearch =
        !s ||
        ticket.phone_number?.toLowerCase().includes(s) ||
        ticket.nida_number?.toLowerCase().includes(s) ||
        ticket.firstName?.toLowerCase().includes(s) ||
        ticket.lastName?.toLowerCase().includes(s);
      // Status (from table controls)
      const matchesStatus = !filterStatus || ticket.status === filterStatus;
      // Priority (from TicketFilters)
      const matchesPriority =
        !filters.priority || ticket.priority === filters.priority;
      // Category (from TicketFilters)
      const matchesCategory =
        !filters.category || ticket.category === filters.category;
      // Date range (from TicketFilters)
      let matchesDate = true;
      if (filters.startDate) {
        const ticketDate = new Date(ticket.created_at);
        if (ticketDate < filters.startDate) matchesDate = false;
      }
      if (filters.endDate) {
        const ticketDate = new Date(ticket.created_at);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (ticketDate > endDate) matchesDate = false;
      }
      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory &&
        matchesDate
      );
    });
  };

  const filteredTickets = getFilteredTickets();
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
      {activeColumns.includes("created_at") && <th>Created At</th>}
      <th>Actions</th>
    </tr>
  );

  const renderTableRow = (ticket, index) => (
    <tr key={ticket.id}>
      {activeColumns.includes("id") && (
        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
      )}
      {activeColumns.includes("fullName") && (
        <td>{`${ticket.first_name || ""} ${ticket.middle_name || ""} ${
          ticket.last_name || ""
        }`}</td>
      )}
      {activeColumns.includes("phone_number") && <td>{ticket.phone_number}</td>}
      {activeColumns.includes("status") && <td>{ticket.status}</td>}
      {activeColumns.includes("subject") && (
        <td>{ticket.functionData?.name}</td>
      )}
      {activeColumns.includes("category") && <td>{ticket.category}</td>}
      {activeColumns.includes("assigned_to_role") && (
        <td>{ticket.assigned_to_role}</td>
      )}
      {activeColumns.includes("created_at") && (
        <td>
          {new Date(ticket.created_at).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          })}
        </td>
      )}
      <td>
        <button
          className="view-ticket-details-btn"
          title="View"
          onClick={() => handleDetailsClick(ticket)}
        >
          <FaEye />
        </button>
      </td>
    </tr>
  );

  // Card component
  const Card = ({ title, data, color, icon }) => (
    <div className="card">
      <div className="card-header">
        {icon}
        <h4>{title}</h4>
      </div>
      <div className="card-body" style={{ backgroundColor: color }}>
        <div className="card-data">
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

  // Add new function to handle status update
  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`${baseURL}/ticket/${ticketId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setSnackbar({
        open: true,
        message: "Status updated successfully",
        severity: "success"
      });

      // Refresh ticket data
      fetchCustomerTickets();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Add new function to handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const response = await fetch(
        `${baseURL}/ticket/${selectedTicket.id}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            comment: comment.trim(),
            userId: userId
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      // Add new comment to the list
      const newComment = {
        id: Date.now(), // temporary ID
        comment: comment.trim(),
        createdBy: { name: localStorage.getItem("userName") },
        createdAt: new Date().toISOString()
      };
      setTicketComments([newComment, ...ticketComments]);
      setComment("");

      setSnackbar({
        open: true,
        message: "Comment added successfully",
        severity: "success"
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error"
      });
    }
  };

  // Add function to fetch comments
  const fetchTicketComments = async (ticketId) => {
    try {
      const response = await fetch(`${baseURL}/ticket/${ticketId}/comments`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setTicketComments(data.comments || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  // Add new function to handle priority change
  const handlePriorityChange = async (ticketId, priority) => {
    try {
      const response = await fetch(`${baseURL}/ticket/${ticketId}/priority`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ priority })
      });

      if (!response.ok) {
        throw new Error("Failed to update priority");
      }

      setSnackbar({
        open: true,
        message: "Priority updated successfully",
        severity: "success"
      });

      // Update local state
      setCustomerTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, priority } : ticket
        )
      );
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error"
      });
    }
  };

  // Add new function to handle file upload
  const handleFileUpload = async (formData) => {
    try {
      const response = await fetch(`${baseURL}/ticket/attachment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();

      // Update local state
      setTicketAttachments((prev) => ({
        ...prev,
        [formData.get("ticketId")]: [
          ...(prev[formData.get("ticketId")] || []),
          data.attachment
        ]
      }));

      setSnackbar({
        open: true,
        message: "File uploaded successfully",
        severity: "success"
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error"
      });
      throw error;
    }
  };

  // Add new function to handle file deletion
  const handleFileDelete = async (ticketId, fileId) => {
    try {
      const response = await fetch(`${baseURL}/ticket/attachment/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      // Update local state
      setTicketAttachments((prev) => ({
        ...prev,
        [ticketId]: prev[ticketId].filter((file) => file.id !== fileId)
      }));

      setSnackbar({
        open: true,
        message: "File deleted successfully",
        severity: "success"
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error"
      });
    }
  };

  // Add function to fetch attachments
  const fetchTicketAttachments = async (ticketId) => {
    try {
      const response = await fetch(
        `${baseURL}/ticket/${ticketId}/attachments`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (response.ok) {
        setTicketAttachments((prev) => ({
          ...prev,
          [ticketId]: data.attachments || []
        }));
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  };

  // Add function to handle filter changes
  const handleFilterChange = (newFilters) => {
    const { status, ...rest } = newFilters;
    setFilters(rest);
    setCurrentPage(1);
  };

  // Update handlePhoneSearch to accept a selectedTicketFromTable parameter
  const handlePhoneSearch = async (searchValue, selectedTicketFromTable = null) => {
    try {
      // Try phone number search first
      let response = await fetch(`${baseURL}/ticket/search-by-phone/${searchValue}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      let data = await response.json();
      if (data.found) {
        setFoundTickets(data.tickets);
        if (selectedTicketFromTable) {
          setSelectedTicket(selectedTicketFromTable);
          setShowDetailsModal(true);
        } else {
          setExistingTicketsModal(true);
        }
        return;
      }
      // If not found, try NIDA number search (if you have such an endpoint)
      response = await fetch(`${baseURL}/ticket/search-by-nida/${searchValue}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      data = await response.json();
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
      console.error('Error searching tickets:', error);
      setSnackbar({
        open: true,
        message: "Error searching tickets",
        severity: "error"
      });
    }
  };

  // Add handler for Details button in ticket table
  const handleDetailsClick = (ticket) => {
    const searchValue = ticket.phone_number || ticket.nida_number;
    handlePhoneSearch(searchValue, ticket);
  };

  // Update: Pre-fill form with previous ticket details if available
  const handleNewTicketConfirmation = (confirmed) => {
    if (confirmed) {
      // If there are previous tickets, use the most recent one to pre-fill
      if (foundTickets && foundTickets.length > 0) {
        const prev = foundTickets[0]; // most recent ticket
        setFormData({
          firstName: prev.first_name || "",
          lastName: prev.last_name || "",
          phoneNumber: prev.phone_number || phoneSearch,
          nidaNumber: prev.nida_number || "",
          requester: prev.requester || "",
          institution: prev.institution || "",
          region: prev.region || "",
          district: prev.district || "",
          channel: prev.channel || "",
          category: prev.category || "",
          functionId: prev.function_id || "",
          description: "",
          status: "Open"
        });
      } else {
        // fallback: just pre-fill phone number
        setFormData(prev => ({
          ...prev,
          phoneNumber: phoneSearch
        }));
      }
      setShowModal(true);
    }
    setNewTicketConfirmationModal(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <h3 className="title">Loading...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h3 className="title">Error: {error}</h3>
      </div>
    );
  }

  return (
    <div className="main--content">
      <h3 className="title">CRM Dashboard</h3>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "1rem"
        }}
      >
        <button className="add-user-button" onClick={() => setShowModal(true)}>
          <FaPlus /> New Ticket
        </button>
      </div>
      {/* Full-width Phone/NIDA Search Section */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}>
        <input
          className="search-input"
          type="text"
          placeholder="Search by phone or NIDA..."
          value={phoneSearch}
          onChange={(e) => setPhoneSearch(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handlePhoneSearch(phoneSearch);
          }}
          style={{ flex: 1 }}
        />
        <button
          className="add-user-button"
          style={{ minWidth: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => handlePhoneSearch(phoneSearch)}
          aria-label="Search"
        >
          <FaSearch />
        </button>
      </div>

      {/* Existing Tickets Modal */}
      <Modal
        open={existingTicketsModal}
        onClose={() => setExistingTicketsModal(false)}
      >
        <Box sx={{
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
        }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Existing Tickets for {phoneSearch}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {foundTickets.map((ticket) => (
            <Box key={ticket.id} sx={{ mb: 2, p: 2, border: "1px solid #eee", borderRadius: 1 }}>
              <Typography variant="subtitle1">
                Ticket ID: {ticket.ticket_id}
              </Typography>
              <Typography>
                Status: {ticket.status}
              </Typography>
              <Typography>
                Created: {new Date(ticket.created_at).toLocaleDateString()}
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  setExistingTicketsModal(false);
                  openDetailsModal(ticket);
                }}
                sx={{ mt: 1 }}
              >
                View Details
              </Button>
            </Box>
          ))}
          
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setExistingTicketsModal(false);
                setNewTicketConfirmationModal(true);
              }}
            >
              Create New Ticket
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
        <Box sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 400 },
          bgcolor: "background.paper",
          boxShadow: 24,
          borderRadius: 2,
          p: 3
        }}>
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

      {/* Card Dashboard Section */}
      <div className="crm-dashboard">
        <div className="crm-cards-container">
          <Card
            title="Team Activity"
            data={agentData.agentActivity}
            color={role === "agent" ? "#BCE8BE" : "#ffe599"}
            icon={<FaUsersLine fontSize={32} />}
          />
          <Card
            title="Agent Performance"
            data={agentData.ticketQueue}
            color={role === "agent" ? "#D6E4C7" : "#97c5f0"}
            icon={<GrLineChart fontSize={32} />}
          />
        </div>
        <div className="crm-cards-container">
          <Card
            title="Overdue Metrics"
            data={agentData.ticketWait}
            color={role === "agent" ? "#C2E2E5" : "#b6d7a8"}
            icon={<MdDisabledVisible fontSize={32} />}
          />
          <Card
            title="Resolution Metrics"
            data={agentData.unresolvedTickets}
            color="#E1D5D5"
            icon={<MdAutoAwesomeMotion fontSize={32} />}
          />
        </div>
      </div>

      {/* Add TicketFilters component */}
      <TicketFilters
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />

      {/* Ticket Table Section */}
      <div className="user-table-container">
        <div className="ticket-table-container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px"
            }}
          >
            <h2>All Customer Tickets</h2>
            <Tooltip title="Columns Settings and Export" arrow>
              <IconButton onClick={() => setColumnModalOpen(true)}>
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
            </div>
          </div>

          <table className="user-table">
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
                    No complaints found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
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
      </div>

      {/* Split Ticket Details & History Modal */}
      <Modal open={showDetailsModal} onClose={() => setShowDetailsModal(false)}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            width: 900,
            maxWidth: '95vw',
            minHeight: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: 2,
            p: 0
          }}
        >
          {/* Left: Ticket Details */}
          <Box sx={{ flex: 2, p: 3, borderRight: '1px solid #eee', overflowY: 'auto', maxHeight: '80vh' }}>
            {selectedTicket && (
              <>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1976d2" }}>Ticket Details</Typography>
                <Divider sx={{ mb: 2 }} />
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                  width: '100%'
                }}>
                  {[
                    // Left Column
                    ["Ticket Number", selectedTicket.ticket_id || "N/A"],
                    ["First Name", selectedTicket.first_name || "N/A"],
                    ["Phone", selectedTicket.phone_number || "N/A"],
                    ["Requester", selectedTicket.requester || "N/A"],
                    ["Region", selectedTicket.region || "N/A"],
                    ["Channel", selectedTicket.channel || "N/A"],
                    ["Section", selectedTicket.responsible_unit_name || "Unit"],
                    ["Sub-section", selectedTicket.sub_section || "N/A"],
                    ["Subject", selectedTicket.subject || "N/A"],
                    ["Created By", selectedTicket?.creator?.name || "N/A"],
                  ].map(([label, value], index) => (
                    <div key={`left-${index}`} style={{ 
                      padding: '12px 16px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: label === "Section" || label === "Sub-section" || label === "Subject" ? '2px solid #e0e0e0' : 'none'
                    }}>
                      <strong style={{ 
                        minWidth: '120px',
                        color: label === "Section" || label === "Sub-section" || label === "Subject" ? '#1976d2' : '#555',
                        fontSize: '0.9rem'
                      }}>{label}:</strong>
                      <span style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: '0.9rem',
                        color: label === "Section" || label === "Function" || label === "Subject" ? '#1976d2' : 'inherit'
                      }}>{value}</span>
                    </div>
                  ))}

                  {/* Right Column */}
                  {[
                    ["Status", <span style={{ color: selectedTicket.status === "Open" ? "green" : selectedTicket.status === "Closed" ? "gray" : "blue" }}>{selectedTicket.status || "N/A"}</span>],
                    ["Last Name", selectedTicket.last_name || "N/A"],
                    ["NIDA", selectedTicket.nida_number || "N/A"],
                    ["Institution", selectedTicket.institution || "N/A"],
                    ["District", selectedTicket.district || "N/A"],
                    ["Category", selectedTicket.category || "N/A"],
                    ["Rated", <span style={{ color: selectedTicket.complaint_type === "Major" ? "red" : selectedTicket.complaint_type === "Minor" ? "orange" : "inherit" }}>{selectedTicket.complaint_type || "Unrated"}</span>],
                    ["Assigned To", selectedTicket.assigned_to_id || "N/A"],
                    ["Assigned Role", selectedTicket.assigned_to_role || "N/A"],
                    ["Created At", selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "N/A"]
                  ].map(([label, value], index) => (
                    <div key={`right-${index}`} style={{ 
                      padding: '12px 16px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <strong style={{ 
                        minWidth: '120px',
                        color: '#555',
                        fontSize: '0.9rem'
                      }}>{label}:</strong>
                      <span style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: '0.9rem'
                      }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Description - Full Width */}
                <div style={{ 
                  width: '100%', 
                  padding: '12px 16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  marginTop: '16px'
                }}>
                  <strong style={{ 
                    minWidth: '120px',
                    color: '#555',
                    fontSize: '0.9rem'
                  }}>Description:</strong>
                  <span style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                  }}>{selectedTicket.description || "N/A"}</span>
                </div>

                <Box sx={{ mt: 3, textAlign: "right" }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    sx={{ mr: 2 }}
                    onClick={() => setShowNotifyModal(true)}
                  >
                    Notify User
                  </Button>
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
          <Box sx={{ flex: 1, p: 3, overflowY: 'auto', maxHeight: '80vh', minWidth: 250 }}>
            <Typography variant="h6" gutterBottom>Ticket History</Typography>
            <Divider sx={{ mb: 2 }} />
            {foundTickets && foundTickets.length > 0 ? (
              foundTickets.map(ticket => (
                <Box
                  key={ticket.id}
                  sx={{
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: selectedTicket?.id === ticket.id ? '#e3f2fd' : undefined,
                    cursor: 'pointer',
                    border: selectedTicket?.id === ticket.id ? '2px solid #1976d2' : '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => openDetailsModal(ticket)}
                >
                  <div>
                    <Typography variant="subtitle2">Ticket ID: {ticket.ticket_id}</Typography>
                    <Typography variant="caption">{new Date(ticket.created_at).toLocaleDateString()}</Typography>
                  </div>
                  <div>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '8px',
                      color: 'white',
                      background: ticket.status === 'Closed' ? 'gray' : ticket.status === 'Open' ? 'green' : 'blue',
                      fontSize: '0.8em'
                    }}>
                      {ticket.status}
                    </span>
                  </div>
                </Box>
              ))
            ) : (
              <Typography>No ticket history found.</Typography>
            )}
            {/* Add Create New Ticket button */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  // Pre-fill with selected ticket or most recent
                  let prev = selectedTicket;
                  if (!prev && foundTickets && foundTickets.length > 0) prev = foundTickets[0];
                  if (prev) {
                    setFormData({
                      firstName: prev.first_name || "",
                      lastName: prev.last_name || "",
                      phoneNumber: prev.phone_number || phoneSearch,
                      nidaNumber: prev.nida_number || "",
                      requester: prev.requester || "",
                      institution: prev.institution || "",
                      region: prev.region || "",
                      district: prev.district || "",
                      channel: prev.channel || "",
                      category: prev.category || "",
                      functionId: prev.function_id || "",
                      description: "",
                      status: "Open"
                    });
                  } else {
                    setFormData(prev => ({ ...prev, phoneNumber: phoneSearch }));
                  }
                  setShowModal(true);
                  setShowDetailsModal(false);
                }}
              >
                Create New Ticket
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Notification Modal */}
      <Modal open={showNotifyModal} onClose={() => setShowNotifyModal(false)}>
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, minWidth: 350, maxWidth: 400, mx: 'auto', mt: '15vh' }}>
          <Typography variant="h6" gutterBottom>Send Notification</Typography>
          <TextField
            label="Message"
            multiline
            rows={3}
            fullWidth
            value={notifyMessage}
            onChange={e => setNotifyMessage(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={async () => {
              await fetch(`${baseURL}/notifications/notify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  ticket_id: selectedTicket.id,
                  category: selectedTicket.category, // or another user ID
                  message: notifyMessage,
                  channel: selectedTicket.channel,
                  subject: selectedTicket.functionData?.name
                })
              });
              setShowNotifyModal(false);
              setSnackbar({ open: true, message: 'Notification sent!', severity: 'success' });
            }}
            disabled={!notifyMessage.trim()}
          >
            Send
          </Button>
        </Box>
      </Modal>

      {/* Ticket Creation Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 600 },
            maxHeight: "90vh",
            overflowY: "auto",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 3,
            p: 4
          }}
        >
          <button
            onClick={() => setShowModal(false)}
            style={{
              position: "absolute",
              top: 6,
              right: 12,
              background: "transparent",
              border: "none",
              fontSize: "1.25rem",
              cursor: "pointer"
            }}
            aria-label="Close"
          >
            ×
          </button>

          <div className="modal-form-container">
            <h2 className="modal-title">New Ticket</h2>

            {/* First Row */}
            <div className="modal-form-row">
              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>First Name:</label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    border: formErrors.firstName
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                />
                {formErrors.firstName && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.firstName}
                  </span>
                )}
              </div>

              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>Last Name:</label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    border: formErrors.lastName
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                />
                {formErrors.lastName && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.lastName}
                  </span>
                )}
              </div>
            </div>

            {/* Phone & NIDA */}
            <div className="modal-form-row">
              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>Phone Number:</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    border: formErrors.phoneNumber
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                />
                {formErrors.phoneNumber && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.phoneNumber}
                  </span>
                )}
              </div>

              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>
                  National Identification Number:
                </label>
                <input
                  name="nidaNumber"
                  value={formData.nidaNumber}
                  onChange={handleChange}
                  placeholder="Enter NIN number"
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    border: formErrors.nidaNumber
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                />
                {formErrors.nidaNumber && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.nidaNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Requester & Institution */}
            <div className="modal-form-row">
              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>Requester:</label>
                <select
                  name="requester"
                  value={formData.requester}
                  onChange={handleChange}
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    width: "100%",
                    border: formErrors.requester
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                >
                  <option value="">Select..</option>
                  <option value="Employee">Employee</option>
                  <option value="Employer">Employer</option>
                  <option value="Pensioners">Pensioners</option>
                  <option value="Stakeholders">Stakeholders</option>
                </select>
                {formErrors.category && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.category}
                  </span>
                )}
              </div>

              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>Institution:</label>
                <input
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  placeholder="Enter Institution"
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    border: formErrors.institution
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                />
                {formErrors.institution && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.institution}
                  </span>
                )}
              </div>
            </div>

            {/* Region & District */}
            <div className="modal-form-row">
              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>Region:</label>
                <input
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  placeholder="Enter region"
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    border: formErrors.region
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                />
                {formErrors.region && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.region}
                  </span>
                )}
              </div>

              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>District:</label>
                <input
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="Enter district"
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    border: formErrors.district
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                />
                {formErrors.district && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.district}
                  </span>
                )}
              </div>
            </div>

            {/* Category & Channel */}
            <div className="modal-form-row">
              <div className="modal-form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: "0.875rem" }}>Category:</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    width: "100%",
                    border: formErrors.category
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                >
                  <option value="">Select Category</option>
                  <option value="Inquiry">Inquiry</option>
                  <option value="Complaint">Complaint</option>
                  <option value="Suggestion">Suggestion</option>
                  <option value="Compliment">Compliment</option>
                </select>
                {formErrors.category && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.category}
                  </span>
                )}
              </div>

              <div className="modal-form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: "0.875rem" }}>Channel:</label>
                <select
                  name="channel"
                  value={formData.channel}
                  onChange={handleChange}
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    width: "100%",
                    border: formErrors.channel
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                >
                  <option value="">Select Channel</option>
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                </select>
                {formErrors.channel && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.channel}
                  </span>
                )}
              </div>
            </div>

            {/* Subject, Sub-section, Section */}
            <div className="modal-form-row">
              <div className="modal-form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: "0.875rem" }}>Subject:</label>
                <select
                  name="functionId"
                  value={formData.functionId}
                  onChange={handleChange}
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    width: "100%",
                    border: formErrors.functionId
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                >
                  <option value="">Select Subject</option>
                  {functionData.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {formErrors.functionId && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.functionId}
                  </span>
                )}
              </div>

              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>Sub-section:</label>
                <input
                  value={selectedFunction}
                  readOnly
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    backgroundColor: "#f5f5f5"
                  }}
                />
              </div>

              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>Section:</label>
                <input
                  value={selectedSection || "Unit"}
                  readOnly
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    backgroundColor: "#f5f5f5"
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div className="modal-form-group">
              <label style={{ fontSize: "0.875rem" }}>Description:</label>
              <textarea
                rows="2"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed descriptions.."
                style={{
                  fontSize: "0.875rem",
                  padding: "8px",
                  resize: "vertical",
                  border: formErrors.description
                    ? "1px solid red"
                    : "1px solid #ccc"
                }}
              />
              {formErrors.description && (
                <span style={{ color: "red", fontSize: "0.75rem" }}>
                  {formErrors.description}
                </span>
              )}
            </div>

            {/* Submit */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "1.5rem"
              }}
            >
              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="submit-btn"
                onClick={(e) => {
                  setSubmitAction("open");
                  handleSubmit(e);
                }}
              >
                Submit to Backoffice
              </button>
              <button
                className="close-btn"
                style={{ background: "gray", color: "white" }}
                onClick={(e) => {
                  setSubmitAction("closed");
                  handleSubmit(e);
                }}
              >
                Close Ticket
              </button>
            </div>
          </div>
        </Box>
      </Modal>

      {/* Column Selector Modal */}
      <ColumnSelector
        open={columnModalOpen}
        onClose={() => setColumnModalOpen(false)}
        data={getFilteredTickets()}
        onColumnsChange={setActiveColumns}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Modal for Success/Error Messages */}
      {modal.isOpen && (
        <div className="modal-overlay">
          <div className={`modal-content ${modal.type}`}>
            <h3>{modal.type === "success" ? "Success" : "Error"}</h3>
            <p>{modal.message}</p>
            <button onClick={closeModal} className="modal-close-button">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentCRM;
