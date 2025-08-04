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
  CircularProgress,
  Avatar,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { baseURL } from "../../../../config";
import { getDomainCredentials } from "../../../../utils/credentials";
import "./crm-agent-dashboard.css";
import TicketActions from "../../../../components/ticket/TicketActions";
import TicketFilters from "../../../../components/ticket/TicketFilters";
import TicketDetailsModal from "../../../../components/ticket/TicketDetailsModal";
import Pagination from "../../../../components/Pagination";
import TableControls from "../../../../components/TableControls";
import EnhancedSearchForm from "../../../../components/search/EnhancedSearchForm";
import axios from "axios";
import ChatIcon from '@mui/icons-material/Chat';

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
    middleName: "",
    lastName: "",
    phoneNumber: "",
    nidaNumber: "",
    requester: "",
    institution: "",
    employerName: "",
    region: "",
    district: "",
    category: "",
    channel: "",
    subject: "",
    subSection: "",
    section: "",
    description: "",
    representativeName: "",
    representativePhone: "",
    representativeEmail: "",
    representativeNida: "",
    // Allocated user fields from search response
    allocated_user_username: "",
    allocated_user_name: "",
    allocated_user_id: "",
    // Claim information
    claimNumber: "",
    subject: "",
    description: "",
    category: "",
    priority: "",
    employerName: "", // Add employer name field
    employerSearch: "", // Add employer search field
    // Removed inquiry_type - tickets will go directly to focal person
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [activeColumns, setActiveColumns] = useState([
    "ticket_id",
    "fullName",
    "phone_number",
    "region",
    "status"
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
      // "Open Tickets": 0,
      // "Closed Tickets": 0,
      "Total Opened by Me": 0, // <-- Added here
      "Closed by Me": 0,
      Escalated: 0,
      // Total: 0
    },
    ticketQueue: {
      // "New Tickets": 0,
      Assigned: 0,
      "In Progress": 0, // <-- Move here
      Escalated: 0,
      // "In/Hour": 0,
      "Resolved/Hour": 0,
      // Total: 0
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
    status: "",
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

  // Add state for employer search autocomplete
  const [employerSearchSuggestions, setEmployerSearchSuggestions] = useState([]);
  const [isEmployerSearching, setIsEmployerSearching] = useState(false);
  const [employerSearchOpen, setEmployerSearchOpen] = useState(false);
  const [employerSearchInputValue, setEmployerSearchInputValue] = useState("");
  const employerSearchTimeoutRef = useRef(null);

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

  // Add new state for ticket history search
  const [historySearch, setHistorySearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comments, setComments] = useState("");

  // Add new state variables for enhanced search functionality
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [employerSearchQuery, setEmployerSearchQuery] = useState("");
  const [employerSearchResults, setEmployerSearchResults] = useState([]);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [employeeSearchResults, setEmployeeSearchResults] = useState([]);
  const [isEmployeeSearching, setIsEmployeeSearching] = useState(false);
  const [searchStep, setSearchStep] = useState("employer"); // "employer" or "employee"
  const [formSearchType, setFormSearchType] = useState(""); // "employer" or "employee" - for form layout
  const [searchCompleted, setSearchCompleted] = useState(false); // Track if search is completed

  // --- Justification History State ---
  const [isJustificationModalOpen, setIsJustificationModalOpen] = useState(false);
  const [selectedTicketForJustification, setSelectedTicketForJustification] = useState(null);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  // --- End Justification History State ---

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
      console.log("tickets", response);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setError("Failed to load tickets.");
    }
  };

  const fetchDashboardData = async (userId, token) => {
    try {
      const response = await fetch(
        `${baseURL}/ticket/dashboard-counts/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const stats = data.ticketStats;

      // Use the backend value directly, just like focal person dashboard
      updateAgentDataFromStats(stats);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // After fetching dashboard counts from the backend, update agentData like this:
  const updateAgentDataFromStats = (ticketStats) => {
    setAgentData({
      agentActivity: {
        // "Open Tickets": ticketStats.open || 0,
        // "Closed Tickets": ticketStats.closed || 0,
        "Total Opened by Me": ticketStats.totalCreatedByMe || 0, // <-- Added here
        "Closed by Me": ticketStats.closedByAgent || 0,
        // Total: ticketStats.total || 0
      },
      ticketQueue: {
        // "New Tickets": ticketStats.newTickets || 0,
        Assigned: ticketStats.assigned || 0,
        "In Progress": ticketStats.inProgress || 0, // <-- Move here
        Escalated: ticketStats.Escalated || 0,
        // "In/Hour": ticketStats.inHour || 0,
        // "Resolved/Hour": ticketStats.resolvedHour || 0,
        // Total: ticketStats.total || 0
      },
      ticketWait: {
        "Longest Wait": ticketStats.longestWait || "00:00",
        "Avg Wait": ticketStats.avgWait || "00:00",
        "Max Wait": ticketStats.maxWait || "00:00",
        Pending: ticketStats.pending || 0,
        Total: ticketStats.total || 0
      },
      unresolvedTickets: {
        "Last Hour": ticketStats.lastHour || 0,
        "Avg Delay": ticketStats.avgDelay || "00:00",
        "Max Delay": ticketStats.maxDelay || "00:00",
        "SLA Breaches": ticketStats.slaBreaches || 0,
        Total: ticketStats.total || 0
      }
    });
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
      const selectedFunctionData = functionData.find(
        (item) => item.id === value
      );
      if (selectedFunctionData) {
        // Use new structure: function and function.section
        setSelectedFunction(selectedFunctionData.function?.name || "");
        setSelectedSection(selectedFunctionData.function?.section?.name || "");
      } else {
        setSelectedFunction("");
        setSelectedSection("");
      }
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
        setFormErrors((prev) => ({
          ...prev,
          phoneNumber: "Phone number must contain only numbers"
        }));
      } else {
        setFormErrors((prev) => ({ ...prev, phoneNumber: undefined }));
      }
      return;
    }
    // // Only allow numbers and dashes for nidaNumber
    // if (name === "nidaNumber") {
    //   let cleaned = value.replace(/[^\d-]/g, "");
    //   // Optionally, limit length (e.g., 20 chars)
    //   if (cleaned.length > 20) cleaned = cleaned.slice(0, 20);
    //   setFormData((prev) => ({ ...prev, [name]: cleaned }));
    //   if (!/^\d{0,20}(-\d{1,20})*$/.test(cleaned)) {
    //     setFormErrors((prev) => ({ ...prev, nidaNumber: "NIDA/TIN must contain only numbers and dashes" }));
    //   } else {
    //     setFormErrors((prev) => ({ ...prev, nidaNumber: undefined }));
    //   }
    //   return;
    // }

    if (name === "nidaNumber") {
      let cleaned = value.replace(/[^\d-]/g, "");

      // Optional: prevent consecutive dashes
      cleaned = cleaned.replace(/--+/g, "-");

      // Limit total length to 20 characters
      if (cleaned.length > 20) cleaned = cleaned.slice(0, 20);

      setFormData((prev) => ({ ...prev, [name]: cleaned }));

      const isValid = /^(\d+(-\d+)*$)/.test(cleaned); // Multiple dashes allowed, no start/end dash

      if (!isValid) {
        setFormErrors((prev) => ({
          ...prev,
          nidaNumber:
            "Only digits and dashes are allowed. No leading/trailing or repeated dashes."
        }));
      } else {
        setFormErrors((prev) => ({ ...prev, nidaNumber: undefined }));
      }

      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e, action = "create") => {
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
          selectedSubject = func.function.functionData.find(
            (fd) => fd.id === formData.functionId
          );
          if (selectedSubject) {
            parentFunction = func.function;
            parentSection = func.function.section;
            break;
          }
        }
      }

      // --- Allocated User Logic ---
      // Routing Rules:
      // 1. If searched details has a claim number → Send to checklist user shown in details
      // 2. If no claim number and it's an inquiry → Send to focal person of the selected section/unit
      // 3. Otherwise → Fallback to institution's allocated staff
      let employerAllocatedStaffUsername = "";

      if (selectedSuggestion && selectedSuggestion.allocated_user_username) {
        // Use allocated user from employee search response
        employerAllocatedStaffUsername = selectedSuggestion.allocated_user_username;
        console.log("Routing: Using allocated user from employee search:", employerAllocatedStaffUsername);
      } else {
        // No allocated user found, will be assigned by backend logic
        employerAllocatedStaffUsername = "";
        console.log("Routing: No allocated user found, will be assigned by backend");
      }

      const ticketData = {
        ...formData,
        subject: selectedSubject ? selectedSubject.name : "",
        sub_section: parentFunction ? parentFunction.name : "",
        section: parentSection ? parentSection.name : "",
        responsible_unit_id: formData.functionId,
        responsible_unit_name: parentSection ? parentSection.name : "",
        status: action === "closed" ? "Closed" : "Open",
        employerAllocatedStaffUsername,
        shouldClose: action === "closed",
        // Add claim number for routing decision
        claimId: selectedSuggestion?.claimId || null,
        // Add routing information for backend
        hasClaim: Boolean(selectedSuggestion?.claimId),
        isInquiry: formData.category === "Inquiry",
        // Add allocated user details for routing
        allocated_user_id: selectedSuggestion?.allocated_user_id || null,
        allocated_user_name: selectedSuggestion?.allocated_user || null,
        allocated_user_username: selectedSuggestion?.allocated_user_username || null,
        // Add employer information from search
        employer: formData.employer || selectedSuggestion?.employer || "",
        employerName: formData.employerName || "",
      };

      // Add employer-specific fields if requester is Employer
      if (formData.requester === "Employer") {
        ticketData.employerRegistrationNumber = formData.nidaNumber; // Using nidaNumber for employer registration as per current mapping
        ticketData.employerName = formData.institution;
        ticketData.employerTin = formData.nidaNumber; // Assuming nidaNumber holds TIN for employer
        ticketData.employerPhone = formData.phoneNumber;
        ticketData.employerEmail = formData.employerEmail || ""; // Add employerEmail to formData in frontend if available
        ticketData.employerStatus = formData.employerStatus || ""; // Add employerStatus to formData in frontend if available
        // Removed employer allocated user fields - only using employee search allocated user
      }

      // Map representative fields to backend field names if requester is Representative
      if (formData.requester === "Representative") {
        ticketData.representative_name = formData.requesterName;
        ticketData.representative_phone = formData.requesterPhoneNumber;
        ticketData.representative_email = formData.requesterEmail;
        ticketData.representative_address = formData.requesterAddress;
        ticketData.representative_relationship = formData.relationshipToEmployee;
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
          subject: "",
          description: "",
          category: "",
          priority: "",
          employer: "", // Reset employer field
          employerName: "", // Reset employer name field
          employerSearch: "", // Reset employer search field
          // Reset representative fields
          requesterName: "",
          requesterPhoneNumber: "",
          requesterEmail: "",
          requesterAddress: "",
          relationshipToEmployee: ""
        });
        
        // Reset employer search autocomplete state
        setEmployerSearchInputValue("");
        setEmployerSearchSuggestions([]);
        setEmployerSearchOpen(false);
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
    
    // Fetch ticket comments and attachments
    fetchTicketComments(ticket.id);
    fetchTicketAttachments(ticket.id);
    
    // Also trigger phone search to populate ticket history
    const searchValue = ticket.phone_number || ticket.nida_number;
    if (searchValue) {
      handlePhoneSearch(searchValue, ticket);
    }
  };

  const getFilteredTickets = () => {
    return customerTickets.filter((ticket) => {
      // Search by name, phone, NIDA, or institution (from table controls)
      const s = search.trim().toLowerCase();
      const fullName = `${ticket.first_name || ""} ${ticket.middle_name || ""} ${ticket.last_name || ""}`.trim().toLowerCase();
      const institutionName = (ticket.institution && typeof ticket.institution === 'object' ? ticket.institution.name : ticket.institution || "").toLowerCase();
      
      const matchesSearch =
        !s ||
        ticket.phone_number?.toLowerCase().includes(s) ||
        ticket.nida_number?.toLowerCase().includes(s) ||
        fullName.includes(s) ||
        institutionName.includes(s) ||
        ticket.first_name?.toLowerCase().includes(s) ||
        ticket.last_name?.toLowerCase().includes(s) ||
        ticket.middle_name?.toLowerCase().includes(s);
      
      // Status (from TicketFilters)
      const matchesStatus = !filters.status || ticket.status === filters.status;
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
      {activeColumns.includes("created_at") && <th>Created At</th>}
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
          {ticket.first_name
            ? `${ticket.first_name || ""} ${ticket.middle_name || ""} ${
                ticket.last_name || ""
              }`.trim()
            : ticket.institution || ""}
        </td>
      )}
      {activeColumns.includes("phone_number") && <td>{ticket.phone_number}</td>}
      {activeColumns.includes("region") && <td>{ticket.region || "N/A"}</td>}
      {activeColumns.includes("status") && (
        <td>{ticket.status || "Escalated"}</td>
      )}
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
          onClick={() => openDetailsModal(ticket)}
          title="View Details"
        >
          <FaEye />
        </button>
      </td>
    </tr>
  );

  // Card component
  const Card = ({ title, data, color, icon }) => (
    <div className="crm-card">
      <div className="crm-header">
        <h4>
          {" "}
          {icon}
          {title}
        </h4>
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
    setFilters(newFilters);
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
          subject: prev.subject || "",
          description: prev.description || "",
          category: prev.category || "",
          priority: prev.priority || "",
          // Reset representative fields
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
        subject: prev.subject || "",
        description: prev.description || "",
        category: prev.category || "",
        priority: prev.priority || "",
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
      console.log("debouncedSearch called with:", searchText);
      console.log("searchType:", searchType, "searchBy:", searchBy);
      
      if (!searchText || searchText.length < 1) {
        setSearchSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const payload = {
          type: searchType,
          name: searchText,
          employer_registration_number:
            searchBy === "wcf_number" ? searchText : ""
        };
        
        console.log("API payload:", payload);
        
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
        console.log("API response:", data);

        if (response.ok && data.results?.length) {
          console.log("Found results:", data.results.length);
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
              employer: result.employer || "", // Add employer field from API response
              rawData: result
            };
          });

          console.log("Processed suggestions:", suggestions);
          setSearchSuggestions(suggestions);
          setOpen(true);
        } else {
          console.log("No results found or API error");
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

    // Use employer field from API response if available, otherwise extract from display name
    let institutionName = "";
    if (searchType === "employee" && suggestion.employer) {
      // Use employer field from API response
      institutionName = suggestion.employer;
    } else {
      // Fallback: Extract institution name from display name (text between brackets)
      const institutionMatch =
        suggestion.displayName?.match(/—\s*\((.*?)\)/) ||
        suggestion.originalName?.match(/—\s*\((.*?)\)/) ||
        suggestion.name?.match(/—\s*\((.*?)\)/);
      institutionName = institutionMatch ? institutionMatch[1].trim() : "";
    }

    // Set the selected suggestion with claim information
    const selectedWithClaim = {
      ...suggestion,
      hasClaim: Boolean(rawData.claim_number),
      claimId: rawData.claim_number,
      allocated_user: rawData.allocated_user,
      allocated_user_id: rawData.allocated_user_id,
      allocated_user_username: rawData.allocated_user_username
    };
    console.log("Selected with claim:", selectedWithClaim);

    setSelectedSuggestion(selectedWithClaim);

    // Log employer information
    if (suggestion.employer) {
      console.log("Employer from API response:", suggestion.employer);
    }

    // Set the input value to the full name
    setInputValue(suggestion.cleanName || suggestion.name || "");
    setSearchQuery(suggestion.cleanName || suggestion.name || "");
    setOpen(false);

    // Update form data with essential information from rawData
    let updatedFormData = { ...formData };

    if (searchType === "employee") {
      updatedFormData = {
        ...updatedFormData,
        subject: rawData.subject || "",
        description: rawData.description || "",
        category: rawData.category || "",
        priority: rawData.priority || "",
        nidaNumber: rawData.nin || "",
        phoneNumber: rawData.phoneNumber || "",
        institution: institutionName, // Use employer field from API response
        employer: suggestion.employer || "", // Add employer field to form data
        employerName: suggestion.employer || "" // Populate employer name field
      };
    } else if (searchType === "employer") {
      updatedFormData = {
        ...updatedFormData,
        subject: "", // Clear employee-specific fields
        description: "",
        category: "",
        priority: "",
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

    // --- NEW: Update institution details based on selection ---
    let selectedInstitutionName = "";
    if (searchType === "employee") {
      // Try to get institution name from the suggestion or rawData
      selectedInstitutionName =
        rawData.institution ||
        rawData.employerName ||
        updatedFormData.institution ||
        "";
    } else if (searchType === "employer") {
      selectedInstitutionName =
        rawData.name || updatedFormData.institution || "";
    }

    if (selectedInstitutionName) {
      fetch("https://demomspapi.wcf.go.tz/api/v1/search/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          type: "employer",
          name: selectedInstitutionName,
          employer_registration_number: ""
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.results && data.results.length > 0) {
            setSelectedInstitution(data.results[0]);
          } else {
            setSelectedInstitution(null);
          }
        })
        .catch(() => setSelectedInstitution(null));
    } else {
      setSelectedInstitution(null);
    }

    setSnackbar({
      open: true,
      message: "User information loaded successfully",
      severity: "success"
    });
  };

  // Update handleInputChange for more immediate response
  const handleInputChange = (event, newValue, reason) => {
    console.log("handleInputChange called:", { newValue, reason });
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
      console.log("Calling debouncedSearch with:", newValue);
      debouncedSearch(newValue);
    }, 150); // Reduced from 300ms to 150ms for faster response
  };

  // Update the Autocomplete component
  /*
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
  */

  // Highlight matching text in suggestions
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const safeQuery = escapeRegExp(query);
    const parts = text.split(new RegExp(`(${safeQuery})`, "gi"));
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
    if (!phone) return "";
    let p = phone.trim();
    if (p.startsWith("+")) p = p.slice(1);
    if (p.startsWith("0")) p = "255" + p.slice(1);
    return p;
  }

  useEffect(() => {
    const phone = formData.phoneNumber?.trim();
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone && normalizedPhone.length >= 7) {
      // basic length check
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

  // Add debounced employer search function for autocomplete
  const debouncedEmployerSearch = useCallback(
    async (searchText) => {
      if (!searchText || searchText.length < 1) {
        setEmployerSearchSuggestions([]);
        return;
      }

      setIsEmployerSearching(true);
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
              type: "employer",
              name: searchText,
              employer_registration_number: ""
            })
          }
        );

        const data = await response.json();

        if (response.ok && data.results?.length) {
          const suggestions = data.results.map((result) => ({
            id: result.id || result.tin,
            name: result.name || "",
            tin: result.tin || "",
            phone: result.phone || "",
            email: result.email || "",
            status: result.employer_status || "",
            displayName: result.name || "",
            rawData: result
          }));

          setEmployerSearchSuggestions(suggestions);
          setEmployerSearchOpen(true);
        } else {
          setEmployerSearchSuggestions([]);
        }
      } catch (error) {
        console.error("Employer search suggestion error:", error);
        setEmployerSearchSuggestions([]);
      } finally {
        setIsEmployerSearching(false);
      }
    },
    []
  );

  // Add function to handle employer search
  const handleEmployerSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim() === "") {
      setEmployerSearchResults([]);
      return;
    }

    setIsEmployerSearching(true);
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
            name: searchQuery.trim(),
            employer_registration_number: ""
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.results?.length > 0) {
        setEmployerSearchResults(data.results);
      } else {
        setEmployerSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching for employers:", error);
      setSnackbar({
        open: true,
        message: "Error searching for employers",
        severity: "error"
      });
      setEmployerSearchResults([]);
    } finally {
      setIsEmployerSearching(false);
    }
  };

  // Add handler for employer search input changes
  const handleEmployerSearchInputChange = (event, newValue, reason) => {
    setEmployerSearchInputValue(newValue);

    if (employerSearchTimeoutRef.current) {
      clearTimeout(employerSearchTimeoutRef.current);
    }

    if (reason === "reset" || reason === "clear") {
      setEmployerSearchSuggestions([]);
      return;
    }

    // Debounced search for employer suggestions
    employerSearchTimeoutRef.current = setTimeout(() => {
      debouncedEmployerSearch(newValue);
    }, 150);
  };

  // Add handler for employer suggestion selection
  const handleEmployerSuggestionSelected = (event, suggestion) => {
    if (!suggestion) {
      setEmployerSearchInputValue("");
      return;
    }

    setEmployerSearchInputValue(suggestion.name || "");
    setEmployerSearchOpen(false);

    // Update form data with selected employer
    setFormData(prev => ({
      ...prev,
      employerName: suggestion.name || "",
      institution: suggestion.name || ""
    }));

    setSnackbar({
      open: true,
      message: `Employer selected: ${suggestion.name}`,
      severity: "success"
    });
  };

  // Enhanced search functions for two-step search process
  const handleEmployerSelection = (employer) => {
    setSelectedEmployer(employer);
    setEmployerSearchQuery(employer.name || "");
    setEmployerSearchResults([]);
    
    // Update form data with selected employer
    setFormData(prev => ({
      ...prev,
      employerName: employer.name || "",
      institution: employer.name || "",
      nidaNumber: employer.tin || "",
      phoneNumber: employer.phone || ""
    }));

    // If this is an employer search (not employee search), mark as completed
    if (formSearchType === "employer" || searchStep === "employer") {
      setFormSearchType("employer");
      setSearchCompleted(true);
      setSearchStep("employer");
    } else {
      // If this is part of employee search, move to employee search step
      setSearchStep("employee");
    }

    setSnackbar({
      open: true,
      message: (formSearchType === "employer" || searchStep === "employer")
        ? `Employer selected: ${employer.name}. Employer details filled.`
        : `Employer selected: ${employer.name}. Now search for employees.`,
      severity: "success"
    });
  };

  const handleEmployeeSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim() === "" || !selectedEmployer) {
      setEmployeeSearchResults([]);
      return;
    }

    setIsEmployeeSearching(true);
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
            type: "employee",
            employer: selectedEmployer.name || "",
            name: searchQuery.trim(),
            employer_registration_number: ""
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.results?.length > 0) {
        setEmployeeSearchResults(data.results);
      } else {
        setEmployeeSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching for employees:", error);
      setSnackbar({
        open: true,
        message: "Error searching for employees",
        severity: "error"
      });
      setEmployeeSearchResults([]);
    } finally {
      setIsEmployeeSearching(false);
    }
  };

  const handleEmployeeSelection = (employee) => {
    // Extract employee information from the API response
    const employeeData = employee.employee || employee;
    
    // Parse the name to extract first, middle, and last names
    const fullName = employeeData.name || "";
    const nameWithoutEmployer = fullName.split("—")[0].trim();
    const nameParts = nameWithoutEmployer.split(" ");
    
    const firstName = nameParts[0] || "";
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

    // Update form data with employee information including allocated user and claim
    setFormData(prev => ({
      ...prev,
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      phoneNumber: employeeData.employee_phone || "",
      nidaNumber: employeeData.nin || "",
      institution: selectedEmployer.name || "",
      employerName: selectedEmployer.name || "",
      // Store allocated user information from search response
      allocated_user_username: employeeData.allocated_user_username || "",
      allocated_user_name: employeeData.allocated_user || "",
      allocated_user_id: employeeData.allocated_user_id || "",
      // Store claim information
      claimNumber: employeeData.claim_number || ""
    }));

    // Set selected suggestion for claim button display
    setSelectedSuggestion(employeeData);

    setEmployeeSearchQuery(nameWithoutEmployer);
    setEmployeeSearchResults([]);
    setSearchStep("employer"); // Reset to employer search for next search
    setSearchCompleted(true); // Mark search as completed for employee search

    setSnackbar({
      open: true,
      message: `Employee selected: ${nameWithoutEmployer}. Employee details filled.`,
      severity: "success"
    });
  };

  const resetSearch = () => {
    setSelectedEmployer(null);
    setEmployerSearchQuery("");
    setEmployerSearchResults([]);
    setEmployeeSearchQuery("");
    setEmployeeSearchResults([]);
    setSearchStep("employer");
    setFormSearchType(""); // Reset search type
    setSearchCompleted(false); // Reset search completed status
    
    // Clear institution details panel
    setSelectedInstitution(null);
    
    // Clear all form fields
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      phoneNumber: "",
      nidaNumber: "",
      requester: "",
      institution: "",
      employerName: "",
      region: "",
      district: "",
      category: "",
      channel: "",
      subject: "",
      subSection: "",
      section: "",
      description: "",
      representativeName: "",
      representativePhone: "",
      representativeEmail: "",
      representativeNida: "",
      // Clear allocated user fields
      allocated_user_username: "",
      allocated_user_name: "",
      allocated_user_id: "",
      // Clear claim information
      claimNumber: ""
    });
    
    // Clear form errors
    setFormErrors({});
    
    // Clear selected suggestion
    setSelectedSuggestion(null);
  };

  // Handler for search type changes from EnhancedSearchForm
  const handleSearchTypeChange = (newSearchType) => {
    setFormSearchType(newSearchType);
  };

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
  // --- End Justification History Functions ---

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
    <div className="user-table-container">
       <h3 className="title">
          Contact Center Dashboard
        </h3>

      {/* Full-width Phone/NIDA Search Section */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "1rem",
          alignItems: "center"
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
        <button className="add-user-button" onClick={() => setShowModal(true)}>
          <FaPlus /> New Ticket
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
                    size="small"d
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
                    title="View Recomendation History"
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
            title="Agent Performance"
            data={agentData.ticketQueue}
            color={role === "agent" ? "#D6E4C7" : "#97c5f0"}
            icon={<GrLineChart fontSize={32} />}
          />
          <Card
            title="Escalated Metrics"
            data={agentData.ticketWait}
            color={role === "agent" ? "#C2E2E5" : "#b6d7a8"}
            icon={<MdDisabledVisible fontSize={32} />}
          />
        </div>
        <div className="crm-cards-container">
          <Card
            title="Team Activity"
            data={agentData.agentActivity}
            color={role === "agent" ? "#BCE8BE" : "#ffe599"}
            icon={<FaUsersLine fontSize={32} />}
          />
          <Card
            title="Resolution Metrics"
            data={agentData.unresolvedTickets}
            color="#E1D5D5"
            icon={<MdAutoAwesomeMotion fontSize={32} />}
          />
        </div>
      </div>

      {/* Ticket Table Section */}
      <div className="user-table-container">
        <div style={{ display: "flex", gap: "20px", width: "100%" }}>
          {/* Left: Ticket Table */}
          <div style={{ flex: 2, minWidth: 0 }}>
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
          filterStatus={filters.status || ""}
          onFilterStatusChange={(e) => {
            const newFilters = { ...filters, status: e.target.value };
            setFilters(newFilters);
            setCurrentPage(1);
          }}
          activeColumns={activeColumns}
          onColumnsChange={setActiveColumns}
          tableData={filteredTickets}
          tableTitle="Customer Tickets"
        />

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
                        No ticket found.
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
                          [
                            "Full Name",
                            selectedTicket.first_name +
                              " " +
                              selectedTicket.last_name || "N/A"
                          ]
                          // ["Last Name", selectedTicket.last_name || "N/A"]
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
                      selectedTicket?.creator?.name
                        ? `${selectedTicket.creator.name}${
                            selectedTicket.role
                              ? ` (${selectedTicket.role})`
                              : ""
                          }`
                        : "N/A"
                    ],
                    // Always show Assigned To and Assigned Role
                    ["Assigned To", selectedTicket?.assignee?.name || "N/A"],
                    ["Assigned Role", selectedTicket.assigned_to_role || "N/A"]
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
                            label === "Sub-section" ||
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
                        {selectedTicket.status || "Escalated" || "N/A"}
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
                    // ["Assigned To", selectedTicket?.assignee?.name || "N/A"],
                    // ["Assigned Role", selectedTicket.assigned_to_role || "N/A"],
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


                {/* Representative Details Section */}
                {selectedTicket.requester === "Representative" && selectedTicket.representative_name && (
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
                <Box sx={{ mt: 3, textAlign: "right" }}>
                  <Button
                    variant="contained"
                    color="success"
                    sx={{ mr: 2 }}
                    onClick={() => {
                      // Populate form with current ticket data
                      setFormData({
                        firstName: selectedTicket.first_name || "",
                        middleName: selectedTicket.middle_name || "",
                        lastName: selectedTicket.last_name || "",
                        phoneNumber: selectedTicket.phone_number || "",
                        nidaNumber: selectedTicket.nida_number || "",
                        requester: selectedTicket.requester || "",
                        institution: selectedTicket.institution || "",
                        employerName: selectedTicket.employer_name || "",
                        region: selectedTicket.region || "",
                        district: selectedTicket.district || "",
                        category: selectedTicket.category || "",
                        channel: selectedTicket.channel || "",
                        subject: selectedTicket.subject || "",
                        subSection: selectedTicket.sub_section || "",
                        section: selectedTicket.section || "",
                        description: selectedTicket.description || "",
                        representativeName: selectedTicket.representative_name || "",
                        representativePhone: selectedTicket.representative_phone || "",
                        representativeEmail: selectedTicket.representative_email || "",
                        representativeNida: selectedTicket.representative_nida || ""
                      });
                      
                      // Set search type based on requester
                      if (selectedTicket.requester === "Employer") {
                        setFormSearchType("employer");
                      } else if (selectedTicket.requester === "Employee") {
                        setFormSearchType("employee");
                      }
                      
                      // Mark search as completed to show form fields
                      setSearchCompleted(true);
                      
                      // Close details modal and open ticket creation modal
                      setShowDetailsModal(false);
                      setShowModal(true);
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
              maxHeight: "90vh"
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
                  fontSize: "0.95em"
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
                    onClick={() => openDetailsModal(ticket)}
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
                          title="View Recomendation History"
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
                          textOverflow: "ellipsis"
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
                    boxShadow: "0 4px 8px rgba(25,118,210,0.3)"
                  }
                }}
                onClick={() => {
                  let prev = selectedTicket;
                  if (!prev && foundTickets && foundTickets.length > 0)
                    prev = foundTickets[0];
                  if (prev) {
                    // Populate form with all ticket data
                    setFormData({
                      firstName: prev.first_name || "",
                      middleName: prev.middle_name || "",
                      lastName: prev.last_name || "",
                      phoneNumber: prev.phone_number || "",
                      nidaNumber: prev.nida_number || "",
                      requester: prev.requester || "",
                      institution: prev.institution || "",
                      employerName: prev.employer_name || "",
                      region: prev.region || "",
                      district: prev.district || "",
                      category: prev.category || "",
                      channel: prev.channel || "",
                      subject: prev.subject || "",
                      subSection: prev.sub_section || "",
                      section: prev.section || "",
                      description: prev.description || "",
                      representativeName: prev.representative_name || "",
                      representativePhone: prev.representative_phone || "",
                      representativeEmail: prev.representative_email || "",
                      representativeNida: prev.representative_nida || ""
                    });
                    
                    // Set search type based on requester
                    if (prev.requester === "Employer") {
                      setFormSearchType("employer");
                    } else if (prev.requester === "Employee") {
                      setFormSearchType("employee");
                    }
                    
                    // Mark search as completed to show form fields
                    setSearchCompleted(true);
                  } else {
                    // If no ticket data, just set phone number from search
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
              try {
                const res = await fetch(`${baseURL}/notifications/notify`, {
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
                const data = await res.json();
                setShowNotifyModal(false);
                if (res.ok && data.notification) {
                  setSnackbar({
                    open: true,
                    message: "Notification sent and saved!",
                    severity: "success"
                  });
                } else {
                  setSnackbar({
                    open: true,
                    message: data.message || "Failed to save notification.",
                    severity: "error"
                  });
                }
              } catch (error) {
                setShowNotifyModal(false);
                setSnackbar({
                  open: true,
                  message: "Network error: " + error.message,
                  severity: "error"
                });
              }
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

              {/* Search Section - Replaced with EnhancedSearchForm */}
              {/* The old search form has been replaced with the enhanced two-step search functionality */}

              {/* Enhanced Two-Step Search Form */}
              <EnhancedSearchForm
                onEmployerSelect={handleEmployerSelection}
                onEmployeeSelect={handleEmployeeSelection}
                onReset={resetSearch}
                selectedEmployer={selectedEmployer}
                searchStep={searchStep}
                setSearchStep={setSearchStep}
                onSearchTypeChange={handleSearchTypeChange}
              />

              {/* Update the claim status section */}
              {formSearchType === "employee" && selectedSuggestion && (
                <div
                  style={{
                    marginTop: "10px",
                    marginBottom: "12px",
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
                      {selectedSuggestion.claim_number ? (
                        <>
                          Claim Number:{" "}
                          <span style={{ color: "#1976d2" }}>
                            {selectedSuggestion.claim_number}
                          </span>
                        </>
                      ) : (
                        "No Active Claim"
                      )}
                    </Typography>
                  </div>
                  
                  {/* Claim Button */}
                  {selectedSuggestion.claim_number && (
                    <button
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#1976d2",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "bold"
                      }}
                      onClick={() => {
                        // Handle claim button click - you can add your claim logic here
                        window.open(`/claims/${selectedSuggestion.claim_number}`, '_blank');
                        // Or navigate to claim details page
                        // window.location.href = `/claims/${selectedSuggestion.claim_number}`;
                      }}
                    >
                      View Claim
                    </button>
                  )}
                </div>
              )}

              {/* Existing form fields */}
              {formSearchType !== "employer" && (
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
                      Middle Name <span style={{ fontSize: "0.75rem", color: "#666" }}>(Optional)</span>:
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
                      {formData.requester === "Employer" ? <span style={{ fontSize: "0.75rem", color: "#666" }}> (Optional)</span> : ""}:
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

              {/* Institution field - Show first for employer search, normal position for employee search */}
              <div className="modal-form-row">
                <div className="modal-form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.875rem" }}>
                    {formSearchType === "employer" ? "Institution Name:" : "Institution:"}
                  </label>
                  <input
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    placeholder={formSearchType === "employer" ? "Enter institution name" : "Enter Institution"}
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

                {/* Show employer name field only for employee search */}
                {formSearchType === "employee" && (
                  <div className="modal-form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.875rem" }}>Employer Name:</label>
                    <input
                      name="employerName"
                      value={formData.employerName}
                      onChange={handleChange}
                      placeholder="Enter employer name"
                      style={{
                        height: "32px",
                        fontSize: "0.875rem",
                        padding: "4px 8px",
                        border: "1px solid #ccc"
                      }}
                    />
                  </div>
                )}
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
              {(formData.requester === "Representative" || formData.requester === "Stakeholders") && (
                <>
                  <Box sx={{ mt: 3, mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2, boxShadow: 0, border: '1px solid #e0e0e0' }}>
                    <Typography
                      variant="h6"
                      sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2', letterSpacing: 0.5 }}
                    >
                      Representative Details
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <div>
                        <label style={{ fontSize: '0.875rem' }}>Representative Name:</label>
                        <input
                          name="requesterName"
                          value={formData.requesterName}
                          onChange={handleChange}
                          placeholder="Enter representative's name"
                          style={{
                            width: '100%',
                            height: '32px',
                            fontSize: '0.875rem',
                            padding: '4px 8px',
                            border: formErrors.requesterName ? '1px solid red' : '1px solid #ccc',
                            borderRadius: 4
                          }}
                        />
                        {formErrors.requesterName && (
                          <span style={{ color: 'red', fontSize: '0.75rem' }}>{formErrors.requesterName}</span>
                        )}
                      </div>
                      <div>
                        <label style={{ fontSize: '0.875rem' }}>Representative Phone Number:</label>
                        <input
                          type="tel"
                          name="requesterPhoneNumber"
                          value={formData.requesterPhoneNumber}
                          onChange={handleChange}
                          placeholder="Enter representative's phone number"
                          style={{
                            width: '100%',
                            height: '32px',
                            fontSize: '0.875rem',
                            padding: '4px 8px',
                            border: formErrors.requesterPhoneNumber ? '1px solid red' : '1px solid #ccc',
                            borderRadius: 4
                          }}
                        />
                        {formErrors.requesterPhoneNumber && (
                          <span style={{ color: 'red', fontSize: '0.75rem' }}>{formErrors.requesterPhoneNumber}</span>
                        )}
                      </div>
                      <div>
                        <label style={{ fontSize: '0.875rem' }}>Representative Email <span style={{ fontSize: "0.75rem", color: "#666" }}>(Optional)</span>:</label>
                        <input
                          type="email"
                          name="requesterEmail"
                          value={formData.requesterEmail}
                          onChange={handleChange}
                          placeholder="Enter representative's email"
                          style={{
                            width: '100%',
                            height: '32px',
                            fontSize: '0.875rem',
                            padding: '4px 8px',
                            border: '1px solid #ccc',
                            borderRadius: 4
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.875rem' }}>Representative Address <span style={{ fontSize: "0.75rem", color: "#666" }}>(Optional)</span>:</label>
                        <input
                          name="requesterAddress"
                          value={formData.requesterAddress}
                          onChange={handleChange}
                          placeholder="Enter representative's address"
                          style={{
                            width: '100%',
                            height: '32px',
                            fontSize: '0.875rem',
                            padding: '4px 8px',
                            border: '1px solid #ccc',
                            borderRadius: 4
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.875rem' }}>Relationship to Employee/Employee:</label>
                        <input
                          name="relationshipToEmployee"
                          value={formData.relationshipToEmployee}
                          onChange={handleChange}
                          placeholder="e.g., Parent, Spouse, Child"
                          style={{
                            width: '100%',
                            height: '32px',
                            fontSize: '0.875rem',
                            padding: '4px 8px',
                            border: formErrors.relationshipToEmployee ? '1px solid red' : '1px solid #ccc',
                            borderRadius: 4
                          }}
                        />
                        {formErrors.relationshipToEmployee && (
                          <span style={{ color: 'red', fontSize: '0.75rem' }}>{formErrors.relationshipToEmployee}</span>
                        )}
                      </div>
                    </Box>
                  </Box>
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
                    value={formData.category || ""}
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
                <button className="submit-btn" onClick={(e) => handleSubmit(e)}>
                  Submit to Backoffice
                </button>
                <button
                  className="close-btn"
                  style={{ background: "gray", color: "white" }}
                  onClick={(e) => handleSubmit(e, "closed")}
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
                {/* All details shown for reference - only name used for submission, allocated user from employee search used for assignment */}
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
                <h4
                  style={{
                    color: "#1976d2",
                    margin: "16px 0 8px 0",
                    paddingLeft: 16
                  }}
                >
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
                        bgcolor:
                          creationActiveTicketId === ticket.id
                            ? "#e3f2fd"
                            : "#fff",
                        cursor: "pointer",
                        border:
                          creationActiveTicketId === ticket.id
                            ? "2px solid #1976d2"
                            : "1px solid #e0e0e0",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        transition: "box-shadow 0.2s, border-color 0.2s",
                        "&:hover": {
                          boxShadow: "0 4px 8px rgba(25,118,210,0.1)",
                          borderColor: "#1976d2"
                        }
                      }}
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
                            title="View Recomendation History"
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
                            textOverflow: "ellipsis"
                          }}
                        >
                          Description: {ticket.description}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <div
                    style={{
                      color: "#888",
                      fontSize: "0.95em",
                      textAlign: "center",
                      padding: 16
                    }}
                  >
                    No previous tickets found for this number.
                  </div>
                )}
              </div>
            )}
          </Box>
        </Box>
      </Modal>

      {/* Column Selector Modal - Replaced with dropdown */}
      {/* <ColumnSelector
        open={columnModalOpen}
        onClose={() => setColumnModalOpen(false)}
        data={getFilteredTickets()}
        onColumnsChange={setActiveColumns}
      /> */}

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
            Justification History
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <AssignmentFlowChat
            assignmentHistory={assignmentHistory}
            selectedTicket={selectedTicketForJustification}
          />
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

    </div>
  );
};

export default AgentCRM;
