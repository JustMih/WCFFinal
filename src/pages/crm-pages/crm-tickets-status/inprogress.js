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
  Avatar,
  Paper,
} from "@mui/material";
import { baseURL } from "../../../config";
import "./ticket.css";
import ChatIcon from '@mui/icons-material/Chat';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import TicketDetailsModal from '../../../components/TicketDetailsModal';
import Pagination from '../../../components/Pagination';
import TableControls from "../../../components/TableControls";
import TicketFilters from '../../../components/ticket/TicketFilters';
import { useWcfTicketList } from "../../../api/wcfTicketQueries";

export default function Crm() {
  const [agentTickets, setAgentTickets] = useState([]);
  const [agentTicketsError, setAgentTicketsError] = useState(null);
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState("");
  const [modal, setModal] = useState({ isOpen: false, type: "", message: "" });
  const [activeColumns, setActiveColumns] = useState([
    "ticket_id",
    "createdAt",
    "employee",
    "employer",
    "phone_number",
    "region",
    "status"
  ]);
  const [authError, setAuthError] = useState(null);
  const {
    data: assignments = [],
    isLoading: loading,
    error: assignmentsErrorObj,
    refetch: refetchInProgressAssignments,
  } = useWcfTicketList(
    { type: "in-progress-assignments", enabled: Boolean(userId) },
    { enabled: Boolean(userId) }
  );
  const assignmentsError = authError || assignmentsErrorObj?.message || null;
  const [filters, setFilters] = useState({
    search: '',
    nidaSearch: '',
    status: '',
    priority: '',
    category: '',
    region: '',
    district: '',
    ticketId: '',
    startDate: null,
    endDate: null,
  });
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  // NOTE: assignments now come from TanStack Query (useWcfTicketList)

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setUserId(userId);
      console.log("user id is:", userId);
    } else {
      setAuthError("User not authenticated. Please log in.");
    }
    
    // Check for ticketId in URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const ticketIdFromUrl = urlParams.get('ticketId');
    if (ticketIdFromUrl) {
      setFilters(prev => ({ ...prev, ticketId: ticketIdFromUrl }));
      // Store ticketId to open modal after assignments are loaded
      localStorage.setItem('openTicketId', ticketIdFromUrl);
    }
  }, []);
  // NOTE: list fetching moved to TanStack Query (useWcfTicketList)
  
  // Open ticket modal if ticketId was in URL
  useEffect(() => {
    // Check both localStorage and URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const ticketIdFromUrl = urlParams.get('ticketId');
    const openTicketId = ticketIdFromUrl || localStorage.getItem('openTicketId');
    
    console.log("useEffect triggered - openTicketId:", openTicketId, "loading:", loading, "assignments.length:", assignments.length);
    
    if (openTicketId && !loading) {
      // First, try to find in current assignments
      const assignmentToOpen = assignments.find(a => {
        const ticket = a.ticket || {};
        const ticketIdMatch = ticket.ticket_id && ticket.ticket_id.toLowerCase() === openTicketId.toLowerCase();
        const idMatch = ticket.id && (ticket.id === openTicketId || ticket.id.toLowerCase() === openTicketId.toLowerCase());
        return ticketIdMatch || idMatch;
      });
      
      if (assignmentToOpen && assignmentToOpen.ticket) {
        console.log("Found ticket in assignments, opening modal");
        setSelectedTicket(assignmentToOpen.ticket);
        // Fetch assignment history before opening modal
        const fetchHistory = async () => {
          try {
            const token = localStorage.getItem("authToken");
            const res = await fetch(`${baseURL}/ticket/${assignmentToOpen.ticket.id}/assignments`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setAssignmentHistory(data);
          } catch (e) {
            setAssignmentHistory([]);
          }
        };
        fetchHistory();
        setIsModalOpen(true);
        // Clear the stored ticketId
        localStorage.removeItem('openTicketId');
        // Clear URL parameter
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }
      
      // If not found in assignments, try to fetch it
      if (!loading) {
        console.log("Ticket not found in assignments, fetching from API");
        // If ticket not found in current assignments and loading is complete, 
        // try to fetch it using the in-progress endpoint (which includes all relationships)
        const fetchAndOpenTicket = async () => {
          try {
            const token = localStorage.getItem("authToken");
            const userId = localStorage.getItem("userId");
            
            // First try to get it from in-progress tickets endpoint (has all relationships)
            const inProgressResponse = await fetch(`${baseURL}/ticket/in-progress/${userId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (inProgressResponse.ok) {
              const inProgressData = await inProgressResponse.json();
              const tickets = inProgressData.tickets || inProgressData.data || inProgressData;
              const foundTicket = Array.isArray(tickets) ? tickets.find(t => {
                const ticketIdMatch = t.ticket_id && t.ticket_id.toLowerCase() === openTicketId.toLowerCase();
                const idMatch = t.id && (t.id === openTicketId || t.id.toLowerCase() === openTicketId.toLowerCase());
                return ticketIdMatch || idMatch;
              }) : null;
              
              if (foundTicket) {
                console.log("Found ticket in in-progress endpoint, opening modal");
                setSelectedTicket(foundTicket);
                // Fetch assignment history before opening modal
                const fetchHistory = async () => {
                  try {
                    const token = localStorage.getItem("authToken");
                    const res = await fetch(`${baseURL}/ticket/${foundTicket.id}/assignments`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();
                    setAssignmentHistory(data);
                  } catch (e) {
                    setAssignmentHistory([]);
                  }
                };
                fetchHistory();
                setIsModalOpen(true);
                localStorage.removeItem('openTicketId');
                window.history.replaceState({}, '', window.location.pathname);
                return;
              }
            }
            
            // Fallback: try single ticket endpoint
            const response = await fetch(`${baseURL}/ticket/${openTicketId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
              const data = await response.json();
              const ticket = data.ticket || data;
              if (ticket) {
                console.log("Found ticket via single ticket endpoint, opening modal");
                setSelectedTicket(ticket);
                // Fetch assignment history before opening modal
                const fetchHistory = async () => {
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
                fetchHistory();
                setIsModalOpen(true);
                localStorage.removeItem('openTicketId');
                window.history.replaceState({}, '', window.location.pathname);
              }
            }
          } catch (err) {
            console.error("Error fetching ticket:", err);
            localStorage.removeItem('openTicketId');
          }
        };
        fetchAndOpenTicket();
      }
    }
  }, [assignments, loading]);

  // NOTE: fetching moved to TanStack Query (useWcfTicketList)

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
        refetchInProgressAssignments();
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

  const openModal = async (assignment) => {
    if (!assignment?.ticket?.id) {
      console.error("Invalid assignment or ticket ID for modal");
      return;
    }

    const ticketId = assignment.ticket.id;
    
    // Set initial data so modal opens immediately
    setSelectedTicket(assignment.ticket);
    setIsModalOpen(true);
    setAssignmentHistory([]);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        // Handle no token case
        return;
      }
      
      // Fetch full ticket details and assignment history
      const [ticketResponse, historyResponse] = await Promise.all([
        fetch(`${baseURL}/ticket/${ticketId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseURL}/ticket/${ticketId}/assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      // Process ticket details
      if (ticketResponse.ok) {
        const ticketData = await ticketResponse.json();
        // Assuming the response for a single ticket is { success: true, ticket: {...} }
        if (ticketData.success && ticketData.ticket) {
          setSelectedTicket(ticketData.ticket);
        } else {
          console.warn("Ticket details response not successful or missing ticket data.", ticketData);
        }
      } else {
        console.error(`Failed to fetch ticket details: ${ticketResponse.status}`);
      }
      
      // Process assignment history
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setAssignmentHistory(historyData);
      } else {
        console.error(`Failed to fetch assignment history: ${historyResponse.status}`);
      }

    } catch (error) {
      console.error("Error fetching data for modal:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    setComments("");
    setModal({ isOpen: false, type: "", message: "" });
    setAssignmentHistory([]);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const openHistoryModal = async (ticket) => {
    setSelectedTicket(ticket);
    setIsHistoryModalOpen(true);
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

  const filteredAssignments = assignments.filter((assignment) => {
    const searchValue = search.toLowerCase();
    const ticket = assignment.ticket || {};
    const phone = (ticket.phone_number || "").toLowerCase();
    const nida = (ticket.nida_number || "").toLowerCase();
    const fullName = `${ticket.first_name || ""} ${ticket.middle_name || ""} ${ticket.last_name || ""}`.toLowerCase();
    const representativeName = (ticket.representative_name || "").toLowerCase();
    
    const matchesSearch = !searchValue ||
      phone.includes(searchValue) || 
      nida.includes(searchValue) ||
      fullName.includes(searchValue) ||
      representativeName.includes(searchValue) ||
      (ticket.first_name || "").toLowerCase().includes(searchValue) ||
      (ticket.last_name || "").toLowerCase().includes(searchValue) ||
      (ticket.middle_name || "").toLowerCase().includes(searchValue) ||
      (ticket.ticket_id || "").toLowerCase().includes(searchValue) ||
      (ticket.institution || "").toLowerCase().includes(searchValue) ||
      (ticket.id || "").toLowerCase().includes(searchValue);
    
    const matchesStatus = !filters.status || ticket.status === filters.status;
    // Case-insensitive region and district comparison
    const normalizeRegion = (region) => {
      if (!region || region === "") return "";
      return String(region).toLowerCase().trim().replace(/\s+/g, "-").replace(/-+/g, "-");
    };
    const normalizeDistrict = (district) => {
      if (!district || district === "") return "";
      return String(district).toLowerCase().trim().replace(/\s+/g, "-").replace(/-+/g, "-");
    };
    const matchesRegion = !filters.region || normalizeRegion(ticket.region) === normalizeRegion(filters.region);
    const matchesDistrict = !filters.district || normalizeDistrict(ticket.district) === normalizeDistrict(filters.district);
    const matchesTicketId = !filters.ticketId || 
      (ticket.ticket_id && ticket.ticket_id.toLowerCase().includes(filters.ticketId.toLowerCase())) ||
      (ticket.id && ticket.id.toLowerCase().includes(filters.ticketId.toLowerCase()));

    return matchesSearch && matchesStatus && matchesRegion && matchesDistrict && matchesTicketId;
  });

  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredAssignments.length);
  const totalItems = filteredAssignments.length;
  
  const paginatedAssignments = filteredAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderTableHeader = () => (
    <tr>
      {activeColumns.includes("ticket_id") && <th>Ticket ID</th>}
      {activeColumns.includes("createdAt") && <th>Created At</th>}
      {activeColumns.includes("employee") && <th>Employee</th>}
      {activeColumns.includes("employer") && <th>Employer</th>}
      {activeColumns.includes("phone_number") && <th>Phone</th>}
      {activeColumns.includes("region") && <th>Region</th>}
      {activeColumns.includes("status") && <th>Status</th>}
      {activeColumns.includes("subject") && <th>Subject</th>}
      {activeColumns.includes("category") && <th>Category</th>}
      {activeColumns.includes("assigned_to_role") && <th>Assigned Role</th>}
      <th>Actions</th>
    </tr>
  );

  const renderTableRow = (assignment, index) => {
    const ticket = assignment.ticket || {};
    return (
      <tr key={assignment.id || index}>
        {activeColumns.includes("ticket_id") && (
          <td>{ticket.ticket_id || ticket.id}</td>
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
        {activeColumns.includes("employee") && (
          <td>
            {ticket.first_name && ticket.first_name.trim() !== ""
              ? `${ticket.first_name} ${ticket.middle_name || ""} ${ticket.last_name || ""}`.trim()
              : ticket.representative_name && ticket.representative_name.trim() !== ""
                ? ticket.representative_name
                : "N/A"}
          </td>
        )}
        {activeColumns.includes("employer") && (
          <td>
            {typeof ticket.institution === "string"
              ? ticket.institution
              : ticket.institution && typeof ticket.institution === "object" && typeof ticket.institution.name === "string"
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
                    : ticket.status === "Assigned"
                    ? "orange"
                    : ticket.status === "Forwarded"
                    ? "purple"
                    : ticket.status === "Reversed"
                    ? "red"
                    : "blue",
                fontWeight: "500"
              }}
            >
              {ticket.status || "Escalated" || "N/A"}
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
        <td>
          <Tooltip title="Ticket Details">
            <button
              className="view-ticket-details-btn"
              onClick={() => openModal(assignment)}
            >
              <FaEye />
            </button>
          </Tooltip>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <h3 className="title">Loading...</h3>
      </div>
    );
  }

  return (
    <div className="user-table-container">
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "1rem"
      }}>
        <h3 className="title">In Progress Tickets List</h3>
        
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
              value === "All" ? filteredAssignments.length : parseInt(value)
            );
            setCurrentPage(1);
          }}
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          filterStatus={filters.status}
          onFilterStatusChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          filterRegion={filters.region}
          onFilterRegionChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value, district: "" }))}
          filterDistrict={filters.district}
          onFilterDistrictChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
          activeColumns={activeColumns}
          onColumnsChange={setActiveColumns}
          tableData={filteredAssignments}
          tableTitle="In Progress Tickets"
        />

        <table className="user-table">
          <thead>{renderTableHeader()}</thead>
          <tbody>
            {paginatedAssignments.length > 0 ? (
              paginatedAssignments.map((assignment, i) => renderTableRow(assignment, i))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: "center", color: "red", padding: "20px" }}
                >
                  {assignmentsError || "No ticket found"}
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
      {/* Details Modal */}
      <TicketDetailsModal
        open={isModalOpen}
        onClose={closeModal}
        selectedTicket={selectedTicket}
        assignmentHistory={assignmentHistory}
      />
      {/* Column Selector */}
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