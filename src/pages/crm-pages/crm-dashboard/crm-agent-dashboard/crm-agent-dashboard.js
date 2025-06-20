import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Typography,
  Autocomplete,
  CircularProgress
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ColumnSelector from "../../../../components/colums-select/ColumnSelector";
import { baseURL } from "../../../../config";
import "./crm-agent-dashboard.css";
import TicketActions from "../../../../components/ticket/TicketActions";
import TicketFilters from "../../../../components/ticket/TicketFilters";
import TicketDetailsModal from "../../../../components/ticket/TicketDetailsModal";
import axios from "axios";

// Add styled components for better typeahead styling
const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
  "& .MuiInputBase-root": {
    padding: "2px 4px",
    backgroundColor: "#fff",
    borderRadius: "4px",
    "&:hover": {
      borderColor: theme.palette.primary.main
    }
  },
  "& .MuiAutocomplete-listbox": {
    "& li": {
      padding: "8px 16px",
      "&:hover": {
        backgroundColor: "#f5f5f5"
      }
    }
  },
  "& .MuiAutocomplete-loading": {
    padding: "10px",
    textAlign: "center"
  }
}));

const SuggestionItem = styled("div")({
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  "& .suggestion-name": {
    fontWeight: 600,
    color: "#2c3e50"
  },
  "& .suggestion-details": {
    fontSize: "0.85rem",
    color: "#7f8c8d"
  },
  "& .highlight": {
    backgroundColor: "#fff3cd",
    padding: "0 2px",
    borderRadius: "2px"
  }
});

const AgentCRM = () => {
  // State for form data
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "", // Add middle name
    lastName: "",
    phoneNumber: "",
    nidaNumber: "",
    requester: "",
    institution: "",
    region: "",
    district: "",
    channel: "",
    category: "",
    inquiry_type: "", // <-- Add this line
    functionId: "",
    description: "",
    status: "Open",
    // New fields for representative
    requesterName: "",
    requesterPhoneNumber: "",
    requesterEmail: "",
    requesterAddress: "",
    relationshipToEmployee: ""
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
  const [selectedSection, setSelectedSection] = useState("Unit");

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
  const [newTicketConfirmationModal, setNewTicketConfirmationModal] =
    useState(false);
  const [foundTickets, setFoundTickets] = useState([]);

  // Add submitAction state to control ticket status
  const [submitAction, setSubmitAction] = useState("open"); // "open" or "closed"

  // Notification modal state
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");

  // Add new state for search
  const [searchType, setSearchType] = useState("employee"); // 'employee' or 'employer'
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState("name"); // 'name' or 'wcf_number'

  // Add new state for search suggestions
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  const searchTimeoutRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);

  // Add state for employer details
  const [employerDetails, setEmployerDetails] = useState(null);

  // Add state for institution search
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [institutionSuggestions, setInstitutionSuggestions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);

  // Add state for institution details modal
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);

  // Add state for ticket history in ticket creation modal
  const [creationTicketsLoading, setCreationTicketsLoading] = useState(false);
  const [creationFoundTickets, setCreationFoundTickets] = useState([]);

  // Add state for active ticket in creation modal
  const [creationActiveTicketId, setCreationActiveTicketId] = useState(null);

  // Handler to search institutions
  const handleInstitutionSearch = async (query) => {
    if (!query) {
      setInstitutionSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        "https://demomspapi.wcf.go.tz/api/v1/search/details",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            type: "employer",
            name: query,
            employer_registration_number: ""
          })
        }
      );
      const data = await response.json();
      setInstitutionSuggestions(data.results || []);
    } catch (err) {
      setInstitutionSuggestions([]);
    }
  };

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
      const selected = functionData.find((item) => item.id === value);
      // Sub-section: show parent name if available, else empty
      setSelectedFunction(selected && selected.parent ? selected.parent.name : "");
      // Section: show type if available, else empty
      setSelectedSection(selected ? (selected.type ? selected.type.charAt(0).toUpperCase() + selected.type.slice(1) : "") : "");
    }
    // Only allow numbers (and optional leading +) for phoneNumber
    if (name === "phoneNumber") {
      let cleaned = value.replace(/[^\d+]/g, "");
      if (cleaned.startsWith("+") && cleaned.slice(1).includes("+")) {
        cleaned = cleaned.replace(/\+/g, "");
        cleaned = "+" + cleaned;
      }
      if (cleaned.length > 14) cleaned = cleaned.slice(0, 14);
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
      if (!/^\+?\d{0,13}$/.test(cleaned)) {
        setFormErrors((prev) => ({ ...prev, phoneNumber: "Phone number must contain only numbers" }));
      } else {
        setFormErrors((prev) => ({ ...prev, phoneNumber: undefined }));
      }
      return;
    }
    // Only allow numbers and dashes for nidaNumber
    if (name === "nidaNumber") {
      let cleaned = value.replace(/[^\d-]/g, "");
      // Optionally, limit length (e.g., 20 chars)
      if (cleaned.length > 20) cleaned = cleaned.slice(0, 20);
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
      if (!/^\d{0,20}(-\d{1,20})*$/.test(cleaned)) {
        setFormErrors((prev) => ({ ...prev, nidaNumber: "NIDA/TIN must contain only numbers and dashes" }));
      } else {
        setFormErrors((prev) => ({ ...prev, nidaNumber: undefined }));
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = {
      phoneNumber: "Phone Number",
      nidaNumber: "NIDA Number",
      requester: "Requester",
      institution: "Institution",
      region: "Region",
      district: "District",
      channel: "Channel",
      category: "Category",
      ...(formData.category === "Inquiry" && { inquiry_type: "Inquiry Type" }),
      functionId: "Subject",
      description: "Description"
    };

    // Conditionally add representative fields to required fields
    if (formData.requester === "Representative") {
      requiredFields.requesterName = "Representative Name";
      requiredFields.requesterPhoneNumber = "Representative Phone Number";
      requiredFields.relationshipToEmployee = "Relationship to Employee";
    }

    // Conditionally add employer-specific fields to required fields
    if (formData.requester === "Employer") {
      requiredFields.nidaNumber = "Employer Registration Number / TIN";
      requiredFields.institution = "Employer Name";
      requiredFields.phoneNumber = "Employer Phone";
    }

    const errors = {};
    const missing = [];

    Object.entries(requiredFields).forEach(([key, label]) => {
      if (!formData[key] || formData[key].toString().trim() === "") {
        errors[key] = "This field is required";
        missing.push(`• ${label}`);
      }
    });

    if (missing.length > 0) {
      console.log("Validation errors:", errors, formData); // Debug log for validation
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
      // Find the selected subject (FunctionData), parent function, and parent section
      let selectedSubject, parentFunction, parentSection;
      for (const func of functionData) {
        if (func.function && func.function.functionData) {
          selectedSubject = func.function.functionData.find(fd => fd.id === formData.functionId);
          if (selectedSubject) {
            parentFunction = func.function;
            parentSection = func.function.section;
            break;
          }
        }
      }

      const ticketData = {
        ...formData,
        subject: selectedSubject ? selectedSubject.name : "",
        sub_section: parentFunction ? parentFunction.name : "",
        section: parentSection ? parentSection.name : "",
        responsible_unit_id: formData.functionId,
        responsible_unit_name: parentSection ? parentSection.name : "",
        status: submitAction === "closed" ? "Closed" : "Open",
        employerAllocatedStaffUsername:
          selectedInstitution?.allocated_staff_username ||
          formData.employerAllocatedStaffUsername ||
          ""
      };

      // Add employer-specific fields if requester is Employer
      if (formData.requester === "Employer") {
        ticketData.employerRegistrationNumber = formData.nidaNumber; // Using nidaNumber for employer registration as per current mapping
        ticketData.employerName = formData.institution;
        ticketData.employerTin = formData.nidaNumber; // Assuming nidaNumber holds TIN for employer
        ticketData.employerPhone = formData.phoneNumber;
        ticketData.employerEmail = formData.employerEmail || ""; // Add employerEmail to formData in frontend if available
        ticketData.employerStatus = formData.employerStatus || ""; // Add employerStatus to formData in frontend if available
        ticketData.employerAllocatedStaffId =
          formData.employerAllocatedStaffId || ""; // Add allocatedStaffId to formData in frontend if available
        ticketData.employerAllocatedStaffName =
          formData.employerAllocatedStaffName || ""; // Add allocatedStaffName to formData in frontend if available
        ticketData.employerAllocatedStaffUsername =
          formData.employerAllocatedStaffUsername || ""; // Add allocatedStaffUsername to formData in frontend if available
      }

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
          message: data.message || "Ticket created successfully"
        });
        setShowModal(false);
        setFormData({
          firstName: "",
          middleName: "", // Reset middle name
          lastName: "",
          phoneNumber: "",
          nidaNumber: "",
          requester: "",
          institution: "",
          region: "",
          district: "",
          channel: "",
          category: "",
          inquiry_type: "", // Reset inquiry_type
          functionId: "",
          description: "",
          status: "Open",
          // Reset representative fields
          requesterName: "",
          requesterPhoneNumber: "",
          requesterEmail: "",
          requesterAddress: "",
          relationshipToEmployee: ""
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
        <td>{
          ticket.first_name
            ? `${ticket.first_name || ""} ${ticket.middle_name || ""} ${ticket.last_name || ""}`.trim()
            : ticket.institution || ""
        }</td>
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
  const handlePhoneSearch = async (
    searchValue,
    selectedTicketFromTable = null
  ) => {
    try {
      // Try phone number search first
      let response = await fetch(
        `${baseURL}/ticket/search-by-phone/${searchValue}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
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
      response = await fetch(
        `${baseURL}/ticket/search-by-nida/${searchValue}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
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
      console.error("Error searching tickets:", error);
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
          middleName: prev.middle_name || "", // Add middle name
          lastName: prev.last_name || "",
          phoneNumber: prev.phone_number || phoneSearch,
          nidaNumber: prev.nida_number || "",
          requester: prev.requester || "",
          institution: prev.institution || "",
          region: prev.region || "",
          district: prev.district || "",
          channel: prev.channel || "",
          category: prev.category || "",
          inquiry_type: prev.inquiry_type || "", // Add inquiry_type
          functionId: prev.function_id || "",
          description: "",
          status: "Open",
          // New fields for representative
          requesterName: prev.requesterName || "",
          requesterPhoneNumber: prev.requesterPhoneNumber || "",
          requesterEmail: prev.requesterEmail || "",
          requesterAddress: prev.requesterAddress || "",
          relationshipToEmployee: prev.relationshipToEmployee || ""
        });
      } else {
        // fallback: just pre-fill phone number
        setFormData((prev) => ({
          ...prev,
          phoneNumber: phoneSearch
        }));
      }
      setShowModal(true);
    }
    setNewTicketConfirmationModal(false);
  };

  // Add the search function
  const handleMemberSearch = async () => {
    if (!searchQuery) {
      setSnackbar({
        open: true,
        message: "Please enter either a name or WCF number",
        severity: "warning"
      });
      return;
    }

    const payload = {
      type: searchType,
      name: searchBy === "name" ? searchQuery : "",
      employer_registration_number: searchBy === "wcf_number" ? searchQuery : ""
    };

    try {
      const response = await fetch(
        "https://demomspapi.wcf.go.tz/api/v1/search/details",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          mode: "cors",
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok || data.error || !data.results?.length) {
        setSnackbar({
          open: true,
          message: data.message || "No matching record found.",
          severity: "error"
        });
        return;
      }

      const memberInfo = data.results[0];
      let rawName = memberInfo.name || "";
      let cleanName = "";
      let employerName = "";

      // Extract clean name and employer
      try {
        rawName = rawName.replace(/^\d+\.\s*/, ""); // Remove number prefix like "14."
        const [namePart] = rawName.split("—"); // Split before the em dash
        cleanName = namePart.trim();

        const employerMatch = rawName.match(/\(([^)]+)\)/);
        employerName = employerMatch ? employerMatch[1] : "";
      } catch (err) {
        console.warn("Name parsing error:", err);
      }

      const [firstName, ...rest] = cleanName.split(" ");
      const lastName = rest.join(" ");

      // Fill form data
      setFormData((prev) => ({
        ...prev,
        firstName: firstName || "",
        middleName: rest.length > 2 ? rest.slice(1, -1).join(" ") : "", // Extract middle name
        lastName: lastName || "",
        memberNo: memberInfo.memberno?.toString() || "",
        requester: searchType === "employee" ? "Employee" : "Employer",
        institution: employerName || prev.institution,
        phoneNumber: prev.phoneNumber,
        nidaNumber: prev.nidaNumber,
        region: prev.region,
        district: prev.district,
        channel: prev.channel,
        category: prev.category,
        inquiry_type: prev.inquiry_type || "", // Add inquiry_type
        functionId: prev.functionId,
        description: prev.description,
        status: prev.status,
        // New fields for representative
        requesterName: prev.requesterName || "",
        requesterPhoneNumber: prev.requesterPhoneNumber || "",
        requesterEmail: prev.requesterEmail || "",
        requesterAddress: prev.requesterAddress || "",
        relationshipToEmployee: prev.relationshipToEmployee || ""
      }));

      setSnackbar({
        open: true,
        message: "Member found and form auto-filled.",
        severity: "success"
      });
    } catch (error) {
      console.error("Search error:", error);
      setSnackbar({
        open: true,
        message: "Failed to connect to the search service. Please try again.",
        severity: "error"
      });
    }
  };

  // Update the debouncedSearch function to handle phone numbers
  const debouncedSearch = useCallback(
    async (searchText) => {
      if (!searchText || searchText.length < 1) {
        setSearchSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          "https://demomspapi.wcf.go.tz/api/v1/search/details",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json"
            },
            mode: "cors",
            body: JSON.stringify({
              type: searchType,
              name: searchText,
              employer_registration_number:
                searchBy === "wcf_number" ? searchText : ""
            })
          }
        );

        const data = await response.json();

        if (response.ok && data.results?.length) {
          const suggestions = data.results.map((result) => {
            const originalName = result.name || "";
            // Parse the original name into components
            const numberMatch = originalName.match(/^(\d+\.)\s*/);
            const numberPrefix = numberMatch ? numberMatch[1] : "";
            const nameWithoutNumber = originalName.replace(/^\d+\.\s*/, "");
            const [namePart, ...rest] = nameWithoutNumber.split("—");
            const employerPart = rest.join("—").trim();
            const cleanName = namePart.trim();

            // Extract employer name and phone from parentheses if present
            const employerMatch = employerPart.match(/\(([^)]+)\)/);
            let employerName = "";
            let phoneNumber = "";

            if (employerMatch) {
              const employerInfo = employerMatch[1].trim();
              // Check if the employer info contains a phone number
              const phoneMatch = employerInfo.match(/(\d{10,})/); // Match 10 or more digits
              if (phoneMatch) {
                phoneNumber = phoneMatch[0];
                // Remove the phone number from employer name
                employerName = employerInfo.replace(phoneMatch[0], "").trim();
              } else {
                employerName = employerInfo;
              }
            }

            // Also check if phone number is directly available in the result
            if (!phoneNumber && result.phone) {
              phoneNumber = result.phone;
            }

            return {
              id: result.memberno,
              numberPrefix,
              originalName,
              displayName: `${numberPrefix} ${cleanName}${
                employerName
                  ? ` — (${employerName}${
                      phoneNumber ? ` - ${phoneNumber}` : ""
                    })`
                  : ""
              }`,
              cleanName,
              employerName,
              phoneNumber,
              memberNo: result.memberno,
              type: result.type,
              status: result.status,
              rawData: result
            };
          });

          setSearchSuggestions(suggestions);
          setOpen(true);
        } else {
          setSearchSuggestions([]);
        }
      } catch (error) {
        console.error("Search suggestion error:", error);
        setSearchSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    },
    [searchType, searchBy]
  );

  // Update handleSuggestionSelected to handle phone numbers
  const handleSuggestionSelected = (event, suggestion) => {
    console.log("Selected Suggestion:", suggestion);

    if (!suggestion) {
      setSelectedSuggestion(null);
      setInputValue("");
      return;
    }

    // Get the raw data which contains the claim number and user details
    const rawData = suggestion.rawData || suggestion;
    console.log("Raw Data:", rawData);

    // Extract institution name from display name (text between brackets)
    const institutionMatch =
      suggestion.displayName?.match(/—\s*\((.*?)\)/) ||
      suggestion.originalName?.match(/—\s*\((.*?)\)/) ||
      suggestion.name?.match(/—\s*\((.*?)\)/);
    const institutionName = institutionMatch ? institutionMatch[1].trim() : "";

    // Set the selected suggestion with claim information
    const selectedWithClaim = {
      ...suggestion,
      hasClaim: Boolean(rawData.claim_number),
      claimId: rawData.claim_number
    };
    console.log("Selected with claim:", selectedWithClaim);

    setSelectedSuggestion(selectedWithClaim);

    // Set the input value to the full name
    setInputValue(suggestion.cleanName || suggestion.name || "");
    setSearchQuery(suggestion.cleanName || suggestion.name || "");
    setOpen(false);

    // Update form data with essential information from rawData
    let updatedFormData = { ...formData };

    if (searchType === "employee") {
      updatedFormData = {
        ...updatedFormData,
        firstName: rawData.firstname || "",
        middleName: rawData.middlename || "",
        lastName: rawData.lastname || "",
        nidaNumber: rawData.nin || "",
        phoneNumber: rawData.phoneNumber || "",
        institution: institutionName // Set the extracted institution name
      };
    } else if (searchType === "employer") {
      updatedFormData = {
        ...updatedFormData,
        firstName: "", // Clear employee-specific fields
        middleName: "",
        lastName: "",
        nidaNumber: rawData.tin || "", // Use TIN for employer's NIDA/identifier
        phoneNumber: rawData.phone || "",
        institution: rawData.name || "" // Employer's name goes to institution
      };
    }

    // Keep existing values for other fields not covered by search results
    updatedFormData = {
      ...updatedFormData,
      requester: updatedFormData.requester || formData.requester,
      region: updatedFormData.region || formData.region,
      district: updatedFormData.district || formData.district,
      channel: updatedFormData.channel || formData.channel,
      category: updatedFormData.category || formData.category,
      inquiry_type: updatedFormData.inquiry_type || formData.inquiry_type || "",
      functionId: updatedFormData.functionId || formData.functionId,
      description: updatedFormData.description || formData.description,
      status: updatedFormData.status || formData.status,
      // New fields for representative (if applicable, keep existing or clear if no relevant data in rawData)
      requesterName:
        updatedFormData.requesterName || rawData.requesterName || "",
      requesterPhoneNumber:
        updatedFormData.requesterPhoneNumber ||
        rawData.requesterPhoneNumber ||
        "",
      requesterEmail:
        updatedFormData.requesterEmail || rawData.requesterEmail || "",
      requesterAddress:
        updatedFormData.requesterAddress || rawData.requesterAddress || "",
      relationshipToEmployee:
        updatedFormData.relationshipToEmployee ||
        rawData.relationshipToEmployee ||
        ""
    };
    console.log("Updated Form Data:", updatedFormData);

    setFormData(updatedFormData);

    setSnackbar({
      open: true,
      message: "User information loaded successfully",
      severity: "success"
    });
  };

  // Update handleInputChange for more immediate response
  const handleInputChange = (event, newValue, reason) => {
    setInputValue(newValue);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (reason === "reset" || reason === "clear") {
      setSearchSuggestions([]);
      return;
    }

    // Reduced timeout for more immediate response
    searchTimeoutRef.current = setTimeout(() => {
      debouncedSearch(newValue);
    }, 150); // Reduced from 300ms to 150ms for faster response
  };

  // Update the Autocomplete component
  <StyledAutocomplete
    value={selectedSuggestion}
    onChange={(event, newValue) => handleSuggestionSelected(event, newValue)}
    inputValue={inputValue}
    onInputChange={handleInputChange}
    options={searchSuggestions}
    getOptionLabel={(option) => option.displayName || ""}
    open={open}
    onOpen={() => setOpen(true)}
    onClose={() => setOpen(false)}
    loading={isSearching}
    loadingText={
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px"
        }}
      >
        <CircularProgress size={20} />
        <span>Searching...</span>
      </div>
    }
    noOptionsText={
      inputValue.length < 1
        ? "Start typing to search"
        : "No matching records found"
    }
    renderOption={(props, option) => (
      <li {...props}>
        <SuggestionItem>
          <div className="suggestion-name">
            <span style={{ color: "#666" }}>{option.numberPrefix}</span>{" "}
            {highlightMatch(option.cleanName, inputValue)}
            {option.employerName && (
              <>
                {" — ("}
                <span style={{ color: "#666" }}>
                  {highlightMatch(option.employerName, inputValue)}
                </span>
                {")"}
              </>
            )}
          </div>
          <div className="suggestion-details">
            Member No: {option.memberNo}
            {option.type && ` • Type: ${option.type}`}
            {option.status && ` • Status: ${option.status}`}
          </div>
        </SuggestionItem>
      </li>
    )}
    renderInput={(params) => (
      <TextField
        {...params}
        placeholder={
          searchBy === "name" ? "Start typing name..." : "Enter WCF number..."
        }
        InputProps={{
          ...params.InputProps,
          endAdornment: (
            <>
              {isSearching && <CircularProgress color="inherit" size={20} />}
              {params.InputProps.endAdornment}
            </>
          )
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "#e0e0e0"
            },
            "&:hover fieldset": {
              borderColor: "#1976d2"
            },
            "&.Mui-focused fieldset": {
              borderColor: "#1976d2"
            }
          }
        }}
      />
    )}
    filterOptions={(x) => x}
    freeSolo={false}
    autoComplete
    includeInputInList
    blurOnSelect
    clearOnBlur={false}
    selectOnFocus
    handleHomeEndKeys
    style={{ width: "100%" }}
  />;

  // Highlight matching text in suggestions
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="highlight">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Update search input when query changes
  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery, debouncedSearch]);

  // Fetch employer details when institution name changes (after employee selection)
  useEffect(() => {
    if (
      formData.requester === "Employee" &&
      formData.institution &&
      formData.institution.trim() !== ""
    ) {
      // Call the external API with institution name (trimmed)
      fetch("https://demomspapi.wcf.go.tz/api/v1/search/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          type: "employer",
          name: formData.institution.trim(),
          employer_registration_number: ""
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.results && data.results.length > 0) {
            console.log("Employer API result:", data.results[0]); // Debug log
            setEmployerDetails(data.results[0]);
          } else {
            setEmployerDetails(null);
          }
        })
        .catch(() => setEmployerDetails(null));
    } else {
      setEmployerDetails(null);
    }
  }, [formData.requester, formData.institution]);

  // Auto-select institution in autocomplete after employee search
  useEffect(() => {
    if (
      formData.institution &&
      formData.institution.trim() !== "" &&
      !selectedInstitution
    ) {
      fetch("https://demomspapi.wcf.go.tz/api/v1/search/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          type: "employer",
          name: formData.institution.trim(),
          employer_registration_number: ""
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.results && data.results.length > 0) {
            setSelectedInstitution(data.results[0]);
          }
        });
    }
    // Only run when institution changes and selectedInstitution is not set
  }, [formData.institution]);

  // Add phone normalization helper
  function normalizePhone(phone) {
    if (!phone) return '';
    let p = phone.trim();
    if (p.startsWith('+')) p = p.slice(1);
    if (p.startsWith('0')) p = '255' + p.slice(1);
    return p;
  }

  useEffect(() => {
    const phone = formData.phoneNumber?.trim();
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone && normalizedPhone.length >= 7) { // basic length check
      setCreationTicketsLoading(true);
      fetch(`${baseURL}/ticket/search-by-phone/${normalizedPhone}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.found && Array.isArray(data.tickets)) {
            setCreationFoundTickets(data.tickets);
          } else {
            setCreationFoundTickets([]);
          }
        })
        .catch(() => setCreationFoundTickets([]))
        .finally(() => setCreationTicketsLoading(false));
    } else {
      setCreationFoundTickets([]);
    }
  }, [formData.phoneNumber, token, baseURL]);

  // When ticket history loads, preselect the most recent ticket as active
  useEffect(() => {
    if (creationFoundTickets.length > 0) {
      setCreationActiveTicketId(creationFoundTickets[0].id);
    } else {
      setCreationActiveTicketId(null);
    }
  }, [creationFoundTickets]);

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
            if (e.key === "Enter") handlePhoneSearch(phoneSearch);
          }}
          style={{ flex: 1 }}
        />
        <button
          className="add-user-button"
          style={{
            minWidth: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
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
            Existing Tickets for {phoneSearch}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {foundTickets.map((ticket) => (
            <Box
              key={ticket.id}
              sx={{ mb: 2, p: 2, border: "1px solid #eee", borderRadius: 1 }}
            >
              <Typography variant="subtitle1">
                Ticket ID: {ticket.ticket_id}
              </Typography>
              <Typography>Status: {ticket.status}</Typography>
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
            p: 3
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
            display: "flex",
            flexDirection: "row",
            width: 1050,
            maxWidth: "98vw",
            minHeight: 500,
            maxHeight: "90vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 0
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
              maxHeight: "90vh"
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
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "16px",
                    width: "100%"
                  }}
                >
                  {[
                    // If no first_name, show Institution only; else show First Name and Last Name
                    ...(!selectedTicket.first_name
                      ? [["Institution", selectedTicket.institution || "N/A"]]
                      : [
                          ["First Name", selectedTicket.first_name || "N/A"],
                          ["Last Name", selectedTicket.last_name || "N/A"]
                        ]),
                    ["Ticket Number", selectedTicket.ticket_id || "N/A"],
                    ["Phone", selectedTicket.phone_number || "N/A"],
                    ["Requester", selectedTicket.requester || "N/A"],
                    ["Region", selectedTicket.region || "N/A"],
                    ["Channel", selectedTicket.channel || "N/A"],
                    ["Section", selectedTicket.responsible_unit_name || "Unit"],
                    ["Sub-section", selectedTicket.sub_section || "N/A"],
                    ["Subject", selectedTicket.subject || "N/A"],
                    ["Created By", selectedTicket?.creator?.name || "N/A"]
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
                            : "none"
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
                          fontSize: "0.9rem"
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
                            label === "Function" ||
                            label === "Subject"
                              ? "#1976d2"
                              : "inherit"
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
                              : "blue"
                        }}
                      >
                        {selectedTicket.status || "N/A"}
                      </span>
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
                              : "inherit"
                        }}
                      >
                        {selectedTicket.complaint_type || "Unrated"}
                      </span>
                    ],
                    ["Assigned To", selectedTicket.assigned_to_id || "N/A"],
                    ["Assigned Role", selectedTicket.assigned_to_role || "N/A"],
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
                              hour12: true
                            }
                          )
                        : "N/A"
                    ]
                  ].map(([label, value], index) => (
                    <div
                      key={`right-${index}`}
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                      }}
                    >
                      <strong
                        style={{
                          minWidth: "120px",
                          color: "#555",
                          fontSize: "0.9rem"
                        }}
                      >
                        {label}:
                      </strong>
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontSize: "0.9rem"
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
                    marginTop: "16px"
                  }}
                >
                  <strong
                    style={{
                      minWidth: "120px",
                      color: "#555",
                      fontSize: "0.9rem"
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
                      lineHeight: "1.5"
                    }}
                  >
                    {selectedTicket.description || "N/A"}
                  </span>
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
          <Box
            sx={{
              flex: 1,
              p: 4,
              overflowY: "auto",
              minWidth: 350,
              maxWidth: 420,
              maxHeight: "90vh"
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, color: "#1976d2" }}
            >
              Ticket History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {foundTickets && foundTickets.length > 0 ? (
              foundTickets.map((ticket) => (
                <Box
                  key={ticket.id}
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
                      borderColor: "#1976d2"
                    }
                  }}
                  onClick={() => openDetailsModal(ticket)}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, color: "#1976d2" }}
                    >
                      {ticket.ticket_id}
                    </Typography>
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
                  </Box>

                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ color: "#666", mb: 0.5 }}>
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
                        textOverflow: "ellipsis"
                      }}
                    >
                      Description:
                      {ticket.description}
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
                    boxShadow: "0 4px 8px rgba(25,118,210,0.3)"
                  }
                }}
                onClick={() => {
                  let prev = selectedTicket;
                  if (!prev && foundTickets && foundTickets.length > 0)
                    prev = foundTickets[0];
                  if (prev) {
                    setFormData({
                      firstName: prev.first_name || "",
                      middleName: prev.middle_name || "", // Add middle name
                      lastName: prev.last_name || "",
                      phoneNumber: prev.phone_number || phoneSearch,
                      nidaNumber: prev.nida_number || "",
                      requester: prev.requester || "",
                      institution: prev.institution || "",
                      region: prev.region || "",
                      district: prev.district || "",
                      channel: prev.channel || "",
                      category: prev.category || "",
                      inquiry_type: prev.inquiry_type || "", // Add inquiry_type
                      functionId: prev.function_id || "",
                      description: "",
                      status: "Open",
                      // New fields for representative
                      requesterName: prev.requesterName || "",
                      requesterPhoneNumber: prev.requesterPhoneNumber || "",
                      requesterEmail: prev.requesterEmail || "",
                      requesterAddress: prev.requesterAddress || "",
                      relationshipToEmployee: prev.relationshipToEmployee || ""
                    });
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      phoneNumber: phoneSearch
                    }));
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
        <Box
          sx={{
            p: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
            minWidth: 350,
            maxWidth: 400,
            mx: "auto",
            mt: "15vh"
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
              await fetch(`${baseURL}/notifications/notify`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
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
              setSnackbar({
                open: true,
                message: "Notification sent!",
                severity: "success"
              });
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
            display: "flex",
            flexDirection: "row",
            width: 1050,
            maxWidth: "98vw",
            minHeight: 500,
            maxHeight: "90vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 0
          }}
        >
        <Box
          sx={{
            flex: 2,
            p: 4,
            borderRight: "1px solid #eee",
            overflowY: "auto",
            minWidth: 0,
            maxHeight: "90vh"
          }}
        >
          <div className="modal-form-container">
            <h2 className="modal-title">New Ticket</h2>

            {/* Search Section */}
            <div
              className="search-section"
              style={{
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px"
              }}
            >
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold"
                  }}
                >
                  Search Type:
                </label>
                <select
                  value={searchType}
                  onChange={(e) => {
                    setSearchType(e.target.value);
                    setSearchSuggestions([]);
                    setSelectedSuggestion(null);
                    setSearchQuery("");
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd"
                  }}
                >
                  <option value="employee">Employee</option>
                  <option value="employer">Employer</option>
                </select>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold"
                  }}
                >
                  Search By:
                </label>
                <select
                  value={searchBy}
                  onChange={(e) => {
                    setSearchBy(e.target.value);
                    setSearchSuggestions([]);
                    setSelectedSuggestion(null);
                    setSearchQuery("");
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd"
                  }}
                >
                  <option value="name">Name</option>
                  <option value="wcf_number">WCF Number</option>
                </select>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold"
                  }}
                >
                  {searchBy === "name" ? "Enter Name" : "Enter WCF Number"}:
                </label>
                <StyledAutocomplete
                  value={selectedSuggestion}
                  onChange={(event, newValue) =>
                    handleSuggestionSelected(event, newValue)
                  }
                  inputValue={inputValue}
                  onInputChange={handleInputChange}
                  options={searchSuggestions}
                  getOptionLabel={(option) => option.displayName || ""}
                  open={open}
                  onOpen={() => setOpen(true)}
                  onClose={() => setOpen(false)}
                  loading={isSearching}
                  loadingText={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px"
                      }}
                    >
                      <CircularProgress size={20} />
                      <span>Searching...</span>
                    </div>
                  }
                  noOptionsText={
                    inputValue.length < 1
                      ? "Start typing to search"
                      : "No matching records found"
                  }
                  renderOption={(props, option) => (
                    <li {...props}>
                      <SuggestionItem>
                        <div className="suggestion-name">
                          <span style={{ color: "#666" }}>
                            {option.numberPrefix}
                          </span>{" "}
                          {highlightMatch(option.cleanName, inputValue)}
                          {option.employerName && (
                            <>
                              {" — ("}
                              <span style={{ color: "#666" }}>
                                {highlightMatch(
                                  option.employerName,
                                  inputValue
                                )}
                              </span>
                              {")"}
                            </>
                          )}
                        </div>
                        <div className="suggestion-details">
                          Member No: {option.memberNo}
                          {option.type && ` • Type: ${option.type}`}
                          {option.status && ` • Status: ${option.status}`}
                        </div>
                      </SuggestionItem>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={
                        searchBy === "name"
                          ? "Start typing name..."
                          : "Enter WCF number..."
                      }
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isSearching && (
                              <CircularProgress color="inherit" size={20} />
                            )}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: "#e0e0e0"
                          },
                          "&:hover fieldset": {
                            borderColor: "#1976d2"
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#1976d2"
                          }
                        }
                      }}
                    />
                  )}
                  filterOptions={(x) => x}
                  freeSolo={false}
                  autoComplete
                  includeInputInList
                  blurOnSelect
                  clearOnBlur={false}
                  selectOnFocus
                  handleHomeEndKeys
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* Update the claim status section */}
            {searchType === "employee" && selectedSuggestion && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <Typography
                    variant="subtitle2"
                    style={{ fontWeight: "bold" }}
                  >
                    {selectedSuggestion.claimId ? (
                      <>
                        Claim Number:{" "}
                        <span style={{ color: "#1976d2" }}>
                          {selectedSuggestion.claimId}
                        </span>
                      </>
                    ) : (
                      "No Active Claim"
                    )}
                  </Typography>
                </div>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!selectedSuggestion?.claimId}
                  onClick={async () => {
                    console.log("Clicked claim:", selectedSuggestion.claimId);

                    const response = await fetch(
                      "http://127.0.0.1:8000/magic-login",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Accept: "application/json"
                        }, // important for Laravel session to persist
                        body: JSON.stringify({
                          username: "rehema.said",
                          password: "TTCL@2026"
                        }),
                        credentials: "include" // important for Laravel session to persist
                      }
                    );

                    const data = await response.json();

                    if (data?.redirect) {
                      window.open(data.redirect, "_blank");
                    } else {
                      console.error(data?.error || "Login failed");
                    }
                  }}
                >
                  View Claim
                </Button>
              </div>
            )}

            {/* Existing form fields */}
            {searchType !== "employer" && (
              <div className="modal-form-row">
                <div className="modal-form-group" style={{ flex: 1 }}>
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

                <div className="modal-form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.875rem" }}>
                    Middle Name (Optional):
                  </label>
                  <input
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    placeholder="Enter middle name"
                    style={{
                      height: "32px",
                      fontSize: "0.875rem",
                      padding: "4px 8px",
                      border: "1px solid #ccc"
                    }}
                  />
                </div>

                <div className="modal-form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.875rem" }}>
                    Last Name
                    {formData.requester === "Employer" ? " (Optional)" : ""}:
                  </label>
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    style={{
                      height: "32px",
                      fontSize: "0.875rem",
                      padding: "4px 8px",
                      border:
                        formErrors.lastName &&
                        formData.requester !== "Employer"
                          ? "1px solid red"
                          : "1px solid #ccc"
                    }}
                  />
                  {formErrors.lastName &&
                    formData.requester !== "Employer" && (
                      <span style={{ color: "red", fontSize: "0.75rem" }}>
                        {formErrors.lastName}
                      </span>
                    )}
                </div>
              </div>
            )}

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
                  {formData.requester === "Employer"
                    ? "TIN:"
                    : "National Identification Number:"}
                </label>
                <input
                  name="nidaNumber"
                  value={formData.nidaNumber}
                  onChange={handleChange}
                  placeholder={
                    formData.requester === "Employer"
                      ? "Enter TIN number"
                      : "Enter NIN number"
                  }
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
                  <option value="Representative">Representative</option>
                </select>
                {formErrors.requester && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.requester}
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

            {/* New fields for Representative if selected */}
            {formData.requester === "Representative" && (
              <>
                <Typography
                  variant="h6"
                  sx={{ mt: 3, mb: 1, fontWeight: "bold" }}
                >
                  Representative Details
                </Typography>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label style={{ fontSize: "0.875rem" }}>
                      Representative Name:
                    </label>
                    <input
                      name="requesterName"
                      value={formData.requesterName}
                      onChange={handleChange}
                      placeholder="Enter representative's name"
                      style={{
                        height: "32px",
                        fontSize: "0.875rem",
                        padding: "4px 8px",
                        border: formErrors.requesterName
                          ? "1px solid red"
                          : "1px solid #ccc"
                      }}
                    />
                    {formErrors.requesterName && (
                      <span style={{ color: "red", fontSize: "0.75rem" }}>
                        {formErrors.requesterName}
                      </span>
                    )}
                  </div>
                  <div className="modal-form-group">
                    <label style={{ fontSize: "0.875rem" }}>
                      Representative Phone Number:
                    </label>
                    <input
                      type="tel"
                      name="requesterPhoneNumber"
                      value={formData.requesterPhoneNumber}
                      onChange={handleChange}
                      placeholder="Enter representative's phone number"
                      style={{
                        height: "32px",
                        fontSize: "0.875rem",
                        padding: "4px 8px",
                        border: formErrors.requesterPhoneNumber
                          ? "1px solid red"
                          : "1px solid #ccc"
                      }}
                    />
                    {formErrors.requesterPhoneNumber && (
                      <span style={{ color: "red", fontSize: "0.75rem" }}>
                        {formErrors.requesterPhoneNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label style={{ fontSize: "0.875rem" }}>
                      Representative Email (Optional):
                    </label>
                    <input
                      type="email"
                      name="requesterEmail"
                      value={formData.requesterEmail}
                      onChange={handleChange}
                      placeholder="Enter representative's email"
                      style={{
                        height: "32px",
                        fontSize: "0.875rem",
                        padding: "4px 8px",
                        border: "1px solid #ccc"
                      }}
                    />
                  </div>
                  <div className="modal-form-group">
                    <label style={{ fontSize: "0.875rem" }}>
                      Representative Address (Optional):
                    </label>
                    <input
                      name="requesterAddress"
                      value={formData.requesterAddress}
                      onChange={handleChange}
                      placeholder="Enter representative's address"
                      style={{
                        height: "32px",
                        fontSize: "0.875rem",
                        padding: "4px 8px",
                        border: "1px solid #ccc"
                      }}
                    />
                  </div>
                </div>

                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label style={{ fontSize: "0.875rem" }}>
                      Relationship to Employee/Employee:
                    </label>
                    <input
                      name="relationshipToEmployee"
                      value={formData.relationshipToEmployee}
                      onChange={handleChange}
                      placeholder="e.g., Parent, Spouse, Child"
                      style={{
                        height: "32px",
                        fontSize: "0.875rem",
                        padding: "4px 8px",
                        border: formErrors.relationshipToEmployee
                          ? "1px solid red"
                          : "1px solid #ccc"
                      }}
                    />
                    {formErrors.relationshipToEmployee && (
                      <span style={{ color: "red", fontSize: "0.75rem" }}>
                        {formErrors.relationshipToEmployee}
                      </span>
                    )}
                  </div>
                  <div className="modal-form-group"></div>{" "}
                  {/* Empty for alignment */}
                </div>
              </>
            )}

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

            {/* Inquiry Type */}
            {formData.category === "Inquiry" && (
              <div className="modal-form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: "0.875rem" }}>Inquiry Type:</label>
                <select
                  name="inquiry_type"
                  value={formData.inquiry_type || ""}
                  onChange={handleChange}
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    width: "100%",
                    border: formErrors.inquiry_type
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                >
                  <option value="">Select Inquiry Type</option>
                  <option value="Claims">Claims</option>
                  <option value="Compliance">Compliance</option>
                </select>
                {formErrors.inquiry_type && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.inquiry_type}
                  </span>
                )}
              </div>
            )}

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
          <Box
            sx={{
              flex: 1,
              p: 4,
              overflowY: "auto",
              minWidth: 350,
              maxWidth: 420,
              maxHeight: "90vh"
            }}
          >
            {/* Employer/Institution Details */}
            {selectedInstitution && (
              <div
                style={{
                  flex: 1,
                  background: "#e3f2fd",
                  borderRadius: "8px",
                  padding: "16px",
                  minWidth: 0,
                  marginBottom: 16
                }}
              >
                <h4 style={{ color: "#1976d2", marginBottom: 12 }}>
                  Institution Details
                </h4>
                <div>
                  <strong>Name:</strong> {selectedInstitution.name}
                </div>
                <div>
                  <strong>TIN:</strong> {selectedInstitution.tin}
                </div>
                <div>
                  <strong>Phone:</strong> {selectedInstitution.phone}
                </div>
                <div>
                  <strong>Email:</strong> {selectedInstitution.email}
                </div>
                <div>
                  <strong>Status:</strong> {selectedInstitution.employer_status}
                </div>
                <div>
                  <strong>Allocated User Name:</strong>{" "}
                  {selectedInstitution.allocated_staff_name}
                </div>
                <div>
                  <strong>Allocated Username:</strong>{" "}
                  {selectedInstitution.allocated_staff_username}
                </div>
              </div>
            )}
            {/* Ticket history for entered phone number */}
            {formData.phoneNumber && (
              <div
                style={{
                  marginTop: 8,
                  background: "#f8f9fa",
                  borderRadius: 8,
                  padding: 0,
                  minHeight: 60
                }}
              >
                <h4 style={{ color: "#1976d2", margin: '16px 0 8px 0', paddingLeft: 16 }}>
                  Ticket History for {formData.phoneNumber}
                </h4>
                {creationTicketsLoading ? (
                  <div style={{ textAlign: "center", padding: 12 }}>
                    <CircularProgress size={22} />
                  </div>
                ) : creationFoundTickets.length > 0 ? (
                  creationFoundTickets.map((ticket) => (
                    <Box
                      key={ticket.id}
                      onClick={() => setCreationActiveTicketId(ticket.id)}
                      sx={{
                        mb: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: creationActiveTicketId === ticket.id ? "#e3f2fd" : "#fff",
                        cursor: "pointer",
                        border: creationActiveTicketId === ticket.id ? "2px solid #1976d2" : "1px solid #e0e0e0",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        transition: 'box-shadow 0.2s, border-color 0.2s',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(25,118,210,0.1)',
                          borderColor: '#1976d2'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                          {ticket.ticket_id}
                        </Typography>
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
                          {ticket.status}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                          Created: {new Date(ticket.created_at).toLocaleDateString()}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500, color: '#333', mb: 1 }}>
                          Subject: {ticket.subject}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#666',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          Description: {ticket.description}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <div style={{ color: '#888', fontSize: '0.95em', textAlign: 'center', padding: 16 }}>
                    No previous tickets found for this number.
                  </div>
                )}
              </div>
            )}
          </Box>
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

      {/* In the modal JSX, just below the Institution input field */}
      {formData.requester === "Employee" && employerDetails && (
        <div
          style={{
            margin: "10px 0",
            padding: "10px",
            background: "#e3f2fd",
            borderRadius: "6px"
          }}
        >
          <div>
            <strong>Allocated User Name:</strong>{" "}
            {employerDetails.allocated_staff_name
              ? employerDetails.allocated_staff_name
              : JSON.stringify(employerDetails)}
          </div>
          <div>
            <strong>Allocated Username:</strong>{" "}
            {employerDetails.allocated_staff_username
              ? employerDetails.allocated_staff_username
              : JSON.stringify(employerDetails)}
          </div>
        </div>
      )}

      {/* In the modal JSX, above the Institution input field */}
      {/* <Autocomplete
        value={selectedInstitution}
        onChange={(event, newValue) => {
          setSelectedInstitution(newValue);
          if (newValue) {
            setFormData((prev) => ({
              ...prev,
              institution: newValue.name || "",
              employerTin: newValue.tin || "",
              phoneNumber: newValue.phone || "",
              employerEmail: newValue.email || "",
              employerAllocatedStaffName: newValue.allocated_staff_name || "",
              employerAllocatedStaffUsername:
                newValue.allocated_staff_username || ""
            }));
          }
        }}
        inputValue={institutionSearch}
        onInputChange={(event, newInputValue) => {
          setInstitutionSearch(newInputValue);
          handleInstitutionSearch(newInputValue);
        }}
        options={institutionSuggestions}
        getOptionLabel={(option) => option.name || ""}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search Institution"
            placeholder="Type institution name..."
          />
        )}
        style={{ marginBottom: 16 }}
      />

      {selectedInstitution && (
        <div
          style={{
            margin: "10px 0",
            padding: "10px",
            background: "#e3f2fd",
            borderRadius: "6px"
          }}
        >
          <div>
            <strong>Allocated User Name:</strong>{" "}
            {selectedInstitution.allocated_staff_name || "N/A"}
          </div>
          <div>
            <strong>Allocated Username:</strong>{" "}
            {selectedInstitution.allocated_staff_username || "N/A"}
          </div>
          <div>
            <strong>TIN:</strong> {selectedInstitution.tin || "N/A"}
          </div>
          <div>
            <strong>Phone:</strong> {selectedInstitution.phone || "N/A"}
          </div>
          <div>
            <strong>Email:</strong> {selectedInstitution.email || "N/A"}
          </div>
        </div>
      )}

      {selectedInstitution && (
        <Button
          variant="outlined"
          style={{ marginBottom: 8 }}
          onClick={() => setShowInstitutionModal(true)}
        >
          View Institution Details
        </Button>
      )} */}

      {/* Add the side modal for institution details */}
      {/* <Modal
        open={showInstitutionModal}
        onClose={() => setShowInstitutionModal(false)}
      >
        <Box
          sx={{
            position: "fixed",
            right: 0,
            top: 0,
            height: "100vh",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            overflowY: "auto"
          }}
        >
          <Typography variant="h6" gutterBottom>
            Institution Details
          </Typography>
          {selectedInstitution && (
            <>
              <div>
                <strong>Name:</strong> {selectedInstitution.name}
              </div>
              <div>
                <strong>TIN:</strong> {selectedInstitution.tin}
              </div>
              <div>
                <strong>Phone:</strong> {selectedInstitution.phone}
              </div>
              <div>
                <strong>Email:</strong> {selectedInstitution.email}
              </div>
              <div>
                <strong>Status:</strong> {selectedInstitution.employer_status}
              </div>
              <div>
                <strong>Allocated User Name:</strong>{" "}
                {selectedInstitution.allocated_staff_name}
              </div>
              <div>
                <strong>Allocated Username:</strong>{" "}
                {selectedInstitution.allocated_staff_username}
              </div>
            </>
          )}
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => setShowInstitutionModal(false)}
          >
            Close
          </Button>
        </Box>
      </Modal> */}

    </div>
  );
};

export default AgentCRM;
