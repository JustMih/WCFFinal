import React, { useState, useEffect } from "react";
import {
  MdOutlineSupportAgent,
  MdAutoAwesomeMotion,
  MdDisabledVisible,
} from "react-icons/md";
import { FaEye, FaPlus } from "react-icons/fa";
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
  Typography,
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
    status: "Open",
  });

  // State for form errors
  const [formErrors, setFormErrors] = useState({});

  // State for modal visibility and messages
  const [modal, setModal] = useState({
    isOpen: false,
    type: "",
    message: "",
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
    ratedMinor: 0,
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
    "created_at",
  ]);

  // State for snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // State for card dashboard
  const [agentData, setAgentData] = useState({
    agentActivity: {
      "Open Tickets": 0,
      "In Progress": 0,
      "Closed Tickets": 0,
      "Overdue": 0,
      "Total": 0,
    },
    ticketQueue: {
      "New Tickets": 0,
      "Assigned": 0,
      "In/Hour": 0,
      "Resolved/Hour": 0,
      "Total": 0,
    },
    ticketWait: {
      "Longest Wait": "00:00",
      "Avg Wait": "00:00",
      "Max Wait": "00:00",
      "Pending": 0,
      "Total": 0,
    },
    unresolvedTickets: {
      "Last Hour": 0,
      "Avg Delay": "00:00",
      "Max Delay": "00:00",
      "SLA Breaches": 0,
      "Total": 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("authToken");

  const [ticketAttachments, setTicketAttachments] = useState({});

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    category: "",
    startDate: null,
    endDate: null,
  });

  // Fetch function data for subject selection
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${baseURL}/section/functions-data`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
          "Content-Type": "application/json",
        },
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
          "Content-Type": "application/json",
        },
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
          "Overdue": stats.overdue || 0,
          "Total": stats.total || 0,
        },
        ticketQueue: {
          "New Tickets": stats.newTickets || 0,
          "Assigned": stats.assigned || 0,
          "In/Hour": stats.inHour || 0,
          "Resolved/Hour": stats.resolvedHour || 0,
          "Total": stats.total || 0,
        },
        ticketWait: {
          "Longest Wait": stats.longestWait || "00:00",
          "Avg Wait": stats.avgWait || "00:00",
          "Max Wait": stats.maxWait || "00:00",
          "Pending": stats.pending || 0,
          "Total": stats.total || 0,
        },
        unresolvedTickets: {
          "Last Hour": stats.lastHour || 0,
          "Avg Delay": stats.avgDelay || "00:00",
          "Max Delay": stats.maxDelay || "00:00",
          "SLA Breaches": stats.slaBreaches || 0,
          "Total": stats.overdue || 0,
        },
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
      ratedMinor: tickets.filter((t) => t.complaintType === "Minor").length,
    });
  };

  // Handle form input changes
  const handleChange = async (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "functionId") {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(
          `${baseURL}/section/functions-data/${value}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const result = await response.json();
          setSelectedFunction(result.data.function || "");
          setSelectedSection(result.data.section || "");
        } else {
          setSelectedFunction("");
          setSelectedSection("");
        }
      } catch (err) {
        console.error("Fetch error:", err);
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
      description: "Description",
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
        message: `Please fill the required fields before submitting.`,
      });
      return;
    }

    setFormErrors({});

    try {
      const response = await fetch(`${baseURL}/ticket/create-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: `Ticket created successfully`,
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
          status: "Open",
        });
        fetchCustomerTickets();
      } else {
        setModal({
          isOpen: true,
          type: "error",
          message: data.message || "Ticket creation failed.",
        });
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      setModal({
        isOpen: true,
        type: "error",
        message: `Network error. Please try again later.`,
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

  const filteredTickets = customerTickets.filter((t) => {
    const s = search.trim().toLowerCase();
    return (
      (!s ||
        t.phone_number?.toLowerCase().includes(s) ||
        t.nida_number?.toLowerCase().includes(s) ||
        t.firstName?.toLowerCase().includes(s) ||
        t.lastName?.toLowerCase().includes(s)) &&
      (!filterStatus || t.status === filterStatus)
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
      {activeColumns.includes("subject") && <td>{ticket.functionData?.name}</td>}
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
            hour12: true,
          })}
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setSnackbar({
        open: true,
        message: "Status updated successfully",
        severity: "success",
      });

      // Refresh ticket data
      fetchCustomerTickets();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
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
      const response = await fetch(`${baseURL}/ticket/${selectedTicket.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          comment: comment.trim(),
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      // Add new comment to the list
      const newComment = {
        id: Date.now(), // temporary ID
        comment: comment.trim(),
        createdBy: { name: localStorage.getItem("userName") },
        createdAt: new Date().toISOString(),
      };
      setTicketComments([newComment, ...ticketComments]);
      setComment("");

      setSnackbar({
        open: true,
        message: "Comment added successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      });
    }
  };

  // Add function to fetch comments
  const fetchTicketComments = async (ticketId) => {
    try {
      const response = await fetch(`${baseURL}/ticket/${ticketId}/comments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priority }),
      });

      if (!response.ok) {
        throw new Error("Failed to update priority");
      }

      setSnackbar({
        open: true,
        message: "Priority updated successfully",
        severity: "success",
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
        severity: "error",
      });
    }
  };

  // Add new function to handle file upload
  const handleFileUpload = async (formData) => {
    try {
      const response = await fetch(`${baseURL}/ticket/attachment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
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
          data.attachment,
        ],
      }));

      setSnackbar({
        open: true,
        message: "File uploaded successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
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
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      // Update local state
      setTicketAttachments((prev) => ({
        ...prev,
        [ticketId]: prev[ticketId].filter((file) => file.id !== fileId),
      }));

      setSnackbar({
        open: true,
        message: "File deleted successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      });
    }
  };

  // Add function to fetch attachments
  const fetchTicketAttachments = async (ticketId) => {
    try {
      const response = await fetch(`${baseURL}/ticket/${ticketId}/attachments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setTicketAttachments((prev) => ({
          ...prev,
          [ticketId]: data.attachments || [],
        }));
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  };

  // Add function to handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Add function to filter tickets
  const getFilteredTickets = () => {
    return customerTickets.filter((ticket) => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableFields = [
          ticket.title,
          ticket.description,
          ticket.customerName,
          ticket.phoneNumber,
          ticket.nidaNumber,
        ];
        if (!searchableFields.some((field) => 
          field && field.toLowerCase().includes(searchTerm)
        )) {
          return false;
        }
      }

      // Status filter
      if (filters.status && ticket.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority && ticket.priority !== filters.priority) {
        return false;
      }

      // Category filter
      if (filters.category && ticket.category !== filters.category) {
        return false;
      }

      // Date range filter
      if (filters.startDate) {
        const ticketDate = new Date(ticket.created_at);
        if (ticketDate < filters.startDate) {
          return false;
        }
      }

      if (filters.endDate) {
        const ticketDate = new Date(ticket.created_at);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (ticketDate > endDate) {
          return false;
        }
      }

      return true;
    });
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
    <div className="p-6">
      <h3 className="title">CRM Dashboard</h3>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button
          className="add-user-button"
          onClick={() => setShowModal(true)}
        >
          <FaPlus /> New Ticket
        </button>
      </div>
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
              marginBottom: "16px",
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
              {getFilteredTickets().length > 0 ? (
                getFilteredTickets().map((ticket, i) => renderTableRow(ticket, i))
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

      {/* Ticket Creation Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "95%", sm: 500 },
            maxHeight: "90vh",
            overflowY: "auto",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 3,
            p: 3,
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
              cursor: "pointer",
            }}
            aria-label="Close"
          >
            ×
          </button>

          <Typography variant="h6" align="center" sx={{ fontWeight: 700, mb: 2 }}>
            New Ticket
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* First Row: Name Fields */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                />
              </Grid>

              {/* Phone & NIDA */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  error={!!formErrors.phoneNumber}
                  helperText={formErrors.phoneNumber}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="National Identification Number"
                  name="nidaNumber"
                  value={formData.nidaNumber}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  error={!!formErrors.nidaNumber}
                  helperText={formErrors.nidaNumber}
                />
              </Grid>

              {/* Requester & Institution */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Requester"
                  name="requester"
                  value={formData.requester}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  error={!!formErrors.requester}
                  helperText={formErrors.requester}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Institution"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  error={!!formErrors.institution}
                  helperText={formErrors.institution}
                />
              </Grid>

              {/* Region & District */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Region"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  error={!!formErrors.region}
                  helperText={formErrors.region}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="District"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  error={!!formErrors.district}
                  helperText={formErrors.district}
                />
              </Grid>

              {/* Category & Channel */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  size="small"
                  error={!!formErrors.category}
                  helperText={formErrors.category}
                  sx={{ width: '150px' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Channel"
                  name="channel"
                  value={formData.channel}
                  onChange={handleChange}
                  size="small"
                  error={!!formErrors.channel}
                  helperText={formErrors.channel}
                  sx={{ width: '150px' }}
                />
              </Grid>

              {/* Subject, Sub-section, Section */}
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Subject"
                  name="functionId"
                  value={formData.functionId}
                  onChange={handleChange}
                  size="small"
                  error={!!formErrors.functionId}
                  helperText={formErrors.functionId}
                  sx={{ width: '150px' }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Sub-section"
                  value={selectedFunction}
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{ width: '150px' }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Section"
                  value={selectedSection}
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{ width: '150px' }}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  minRows={2}
                  size="small"
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
              <Button variant="outlined" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="contained" type="submit">
                Submit Ticket
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>

      <TicketDetailsModal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        ticket={selectedTicket}
      />

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