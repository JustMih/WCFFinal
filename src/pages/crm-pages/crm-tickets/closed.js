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
// import ColumnSelector from "../../../components/colums-select/ColumnSelector";
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

const renderAssignmentStepper = (assignmentHistory, selectedTicket) => {
  if (!selectedTicket) return null;
  const creatorName = selectedTicket.created_by ||
    (selectedTicket.creator && selectedTicket.creator.name) ||
    `${selectedTicket.first_name || ""} ${selectedTicket.last_name || ""}`.trim() ||
    "N/A";
  let steps = [
    {
      assigned_to_name: creatorName,
      assigned_to_role: "Creator",
      action: "Created",
      created_at: selectedTicket.created_at,
      assigned_to_id: "creator"
    }
  ];
  
  if (Array.isArray(assignmentHistory) && assignmentHistory.length > 0) {
    // Process assignment history to consolidate steps
    const processedHistory = [];
    
    for (let i = 0; i < assignmentHistory.length; i++) {
      const current = assignmentHistory[i];
      const next = assignmentHistory[i + 1];
      
      // Check if current step is "Assigned" and next step is "Closed" by the same person
      if (current.action === "Assigned" && 
          next && 
          next.action === "Closed" && 
          current.assigned_to_id === next.assigned_to_id) {
        // Consolidate into one step showing closure time
        processedHistory.push({
          ...current,
          action: "Closed",
          closed_at: next.created_at,
          isConsolidated: true
        });
        i++; // Skip the next step since we consolidated it
      } else {
        processedHistory.push(current);
      }
    }
    
    const firstAssignee = processedHistory[0];
    if (firstAssignee && firstAssignee.assigned_to_name === creatorName) {
      steps[0].assigned_to_role = "Creator & " + (firstAssignee.assigned_to_role || "Agent");
      steps = steps.concat(processedHistory.slice(1));
    } else {
      steps = steps.concat(processedHistory);
    }
  }
  
  let currentAssigneeIdx = 0;
  if (
    selectedTicket.status === "Open" &&
    (!selectedTicket.assigned_to_id || steps.length === 1)
  ) {
    currentAssigneeIdx = 0;
  } else {
    const idx = steps.findIndex(
      a => a.assigned_to_id === selectedTicket.assigned_to_id
    );
    currentAssigneeIdx = idx !== -1 ? idx : steps.length - 1;
  }

  // Helper function to calculate time with person
  const calculateTimeWithPerson = (currentStep, nextStep, selectedTicket, stepIndex, totalSteps) => {
    if (!currentStep.created_at) return "";
    
    const startTime = new Date(currentStep.created_at);
    let endTime;
    
    // Determine the end time based on what happened next
    if (currentStep.isConsolidated && currentStep.action === "Closed") {
      // For consolidated closed steps, show time from assignment to closure
      endTime = new Date(currentStep.closed_at);
    } else if (selectedTicket.status === "Closed" && selectedTicket.date_of_resolution) {
      // If ticket is closed, use the resolution date
      endTime = new Date(selectedTicket.date_of_resolution);
    } else if (nextStep && nextStep.created_at) {
      // If there's a next step, use that time (ticket was passed to next person)
      endTime = new Date(nextStep.created_at);
    } else if (stepIndex === totalSteps - 1) {
      // If this is the last step and ticket is still open, use current time
      endTime = new Date();
    } else {
      // Fallback to current time
      endTime = new Date();
    }
    
    const durationMs = endTime - startTime;
    const diffDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(durationMs / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(durationMs / (1000 * 60));
    
    // Format the duration text
    if (currentStep.isConsolidated && currentStep.action === "Closed") {
      // For consolidated closed steps, show closure time
      if (diffMinutes < 1) {
        return "(Closed instantly)";
      } else if (diffMinutes < 60) {
        return `(Closed with ${diffMinutes}min since assigned)`;
      } else if (diffHours < 24) {
        return `(Closed with ${diffHours}h since assigned)`;
      } else if (diffDays < 7) {
        return `(Closed with ${diffDays}d since assigned)`;
      } else {
        const weeksToClose = Math.floor(diffDays / 7);
        if (weeksToClose < 4) {
          return `(Closed with ${weeksToClose}w since assigned)`;
        } else {
          const monthsToClose = Math.floor(diffDays / 30);
          return `(Closed with ${monthsToClose}mon since assigned)`;
        }
      }
    } else {
      // For regular steps, show time held
      if (diffDays > 1) return `(${diffDays}d)`;
      if (diffHours > 1) return `(${diffHours}h)`;
      if (diffMinutes > 1) return `(${diffMinutes}min)`;
      return "(Just now)";
    }
  };
  
  return (
    <Box>
      {steps.map((a, idx) => {
        // Determine color based on action and status
        let color;
        
        // Check if next step is escalated
        const nextStep = steps[idx + 1];
        const isNextEscalated = nextStep && (nextStep.action === "Escalated" || nextStep.assigned_to_role === "Escalated");
        
        // Check if current step is escalated
        const isCurrentEscalated = a.action === "Escalated" || a.assigned_to_role === "Escalated";
        
        // Check if this step was assigned and then forwarded to someone else (not escalated)
        const wasAssignedAndForwarded = a.action === "Assigned" && nextStep && nextStep.action !== "Escalated";
        
        // Check if ticket is closed
        const isTicketClosed = selectedTicket.status === "Closed" || selectedTicket.status === "Resolved";
        
        // Priority order: Closed > Escalated > Previous to Escalated > Assigned > Current > Completed > Pending
        if (selectedTicket.status === "Closed" || selectedTicket.status === "Resolved" || a.isConsolidated) {
          color = "green"; // Green for all steps when ticket is closed or consolidated closed steps
        } else if (isCurrentEscalated) {
          // Check if this escalated step was followed by an assignment
          const nextStep = steps[idx + 1];
          if (nextStep && nextStep.action === "Assigned") {
            color = "green"; // Green if escalated but then assigned to next user
          } else if (nextStep && (nextStep.action === "Escalated" || nextStep.assigned_to_role === "Escalated")) {
            color = "red"; // Red if escalated again to another user
          } else {
            color = "gray"; // Gray for escalated (pending/not handled)
          }
        } else if (isNextEscalated) {
          color = "red"; // Red for previous step when next is escalated
        } else if (wasAssignedAndForwarded) {
          color = "green"; // Green for assigned step that was forwarded to another user
        } else if (a.action === "Assigned") {
          color = "gray"; // Gray for assigned but still open
            } else if (a.action === "Currently with" || a.assigned_to_role === "Reviewer") {
      color = "gray"; // Gray for currently with and reviewer
        } else if (idx === currentAssigneeIdx && selectedTicket.status !== "Closed") {
          color = "gray"; // Gray for current active step
        } else if (idx < currentAssigneeIdx || selectedTicket.status === "Closed") {
          color = "green"; // Green for completed steps or when ticket is closed
        } else {
          color = "gray"; // Gray for pending or last step when open
        }
        
        // Calculate time with person
        const timeWithPerson = calculateTimeWithPerson(a, nextStep, selectedTicket, idx, steps.length);
        
        return (
          <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                bgcolor: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold"
              }}
            >
              {idx + 1}
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                {a.assigned_to_name} ({a.assigned_to_role})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {a.action} - {a.created_at ? new Date(a.created_at).toLocaleString() : ''} {timeWithPerson}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

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
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setUserId(userId);
      console.log("user id is:", userId);
    } else {
      setAgentTicketsError("User not authenticated. Please log in.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchAgentTickets();
    }
  }, [userId]);

  
  const fetchAgentTickets = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication error. Please log in again.");
      }

      const url = `${baseURL}/ticket/closed/${userId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setAgentTickets([]);
          setAgentTicketsError("No ticket found");
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched tickets:", data);
      if (data && Array.isArray(data.tickets)) {
        setAgentTickets(data.tickets);
        setAgentTicketsError(null);
      } else {
        setAgentTickets([]);
        setAgentTicketsError("No ticket found");
      }
    } catch (error) {
      setAgentTicketsError(error.message);
    } finally {
      setLoading(false);
    }
  };

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
        fetchAgentTickets();
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

  const openModal = async (ticket) => {
    setSelectedTicket(ticket);
    setComments(ticket.comments || "");
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
    setIsModalOpen(true);
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

  const filteredTickets = agentTickets.filter((ticket) => {
    const searchValue = search.toLowerCase();
    const phone = (ticket.phone_number || "").toLowerCase();
    const nida = (ticket.nida_number || "").toLowerCase();
    const fullName = (ticket.first_name || "") + " " + (ticket.middle_name || "") + " " + (ticket.last_name || "");
    const representativeName = (ticket.representative_name || "").toLowerCase();

    const matchesSearch = !searchValue ||
      ticket.phone_number?.toLowerCase().includes(searchValue) ||
      ticket.nida_number?.toLowerCase().includes(searchValue) ||
      fullName.includes(searchValue) ||
      representativeName.includes(searchValue) ||
      (ticket.first_name || "").toLowerCase().includes(searchValue) ||
      (ticket.last_name || "").toLowerCase().includes(searchValue) ||
      (ticket.middle_name || "").toLowerCase().includes(searchValue) ||
      (ticket.ticket_id || "").toLowerCase().includes(searchValue) ||
      (ticket.institution || "").toLowerCase().includes(searchValue) ||
      (ticket.id || "").toLowerCase().includes(searchValue);
    
    const matchesStatus = !filters.status || ticket.status === filters.status;
    const matchesRegion = !filters.region || ticket.region === filters.region;
    const matchesDistrict = !filters.district || ticket.district === filters.district;
    const matchesTicketId = !filters.ticketId || 
      (ticket.ticket_id && ticket.ticket_id.toLowerCase().includes(filters.ticketId.toLowerCase())) ||
      (ticket.id && ticket.id.toLowerCase().includes(filters.ticketId.toLowerCase()));

    return matchesSearch && matchesStatus && matchesRegion && matchesDistrict && matchesTicketId;
  });

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

  const renderTableRow = (ticket, index) => (
    <tr key={ticket.id || index}>
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
                  : "blue",
            }}
          >
             {ticket.status || "Escalated" || "N/A" }
          </span>
        </td>
      )}
      {activeColumns.includes("subject") && <td>{ticket.subject || "N/A"}</td>}
      {activeColumns.includes("category") && <td>{ticket.category || "N/A"}</td>}
      {activeColumns.includes("assigned_to_role") && (
        <td>{ticket.assigned_to_role || "N/A"}</td>
      )}
      
      <td>
        <Tooltip title="Ticket Details">
          <button
            className="view-ticket-details-btn"
            onClick={() => openModal(ticket)}
          >
            <FaEye />
          </button>
        </Tooltip>
      </td>
    </tr>
  );

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
        <h3 className="title">Closed Tickets List</h3>
        
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
          onFilterRegionChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value, district: "" }))}
          filterDistrict={filters.district}
          onFilterDistrictChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
          activeColumns={activeColumns}
          onColumnsChange={setActiveColumns}
          tableData={filteredTickets}
          tableTitle="Closed Tickets"
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
                  {agentTicketsError || "No ticket found"}
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

      <TicketDetailsModal
        open={isModalOpen}
        onClose={closeModal}
        selectedTicket={selectedTicket}
        assignmentHistory={assignmentHistory}
        renderAssignmentStepper={renderAssignmentStepper}
      />

      {/* Column Selector */}
      {/* Removed ColumnSelectorDropdown */}

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

      {/* Assignment Flow Chat */}
      <Dialog open={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Ticket History</DialogTitle>
        <DialogContent>
          <AssignmentFlowChat assignmentHistory={assignmentHistory} selectedTicket={selectedTicket} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssignmentFlowChat({ assignmentHistory, selectedTicket }) {
  const creatorStep = selectedTicket
    ? {
        assigned_to_name: selectedTicket.created_by ||
          (selectedTicket.creator && selectedTicket.creator.name) ||
          `${selectedTicket.first_name || ''} ${selectedTicket.last_name || ''}`.trim() ||
          'N/A',
        assigned_to_role: 'Creator',
        reason: 'Created the ticket',
        created_at: selectedTicket.created_at,
      }
    : null;
  const steps = creatorStep ? [creatorStep, ...assignmentHistory] : assignmentHistory;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Box sx={{ maxWidth: 400, ml: 'auto', mr: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ color: "#3f51b5" }}>
            Ticket History
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {steps.map((a, idx) => {
          let message;
          if (idx === 0) {
            message = 'Created the ticket';
          } else {
            const prevUser = steps[idx - 1]?.assigned_to_name || 'Previous User';
            message = `Message from ${prevUser}: ${a.reason || 'No message'}`;
          }
          return (
            <Box key={idx} sx={{ display: "flex", mb: 2, alignItems: "flex-start" }}>
              <Avatar sx={{ bgcolor: idx === 0 ? "#43a047" : "#1976d2", mr: 2 }}>
                {a.assigned_to_name ? a.assigned_to_name[0] : "?"}
              </Avatar>
              <Paper elevation={2} sx={{ p: 2, bgcolor: idx === 0 ? "#e8f5e9" : "#f5f5f5", flex: 1 }}>
                <Typography sx={{ fontWeight: "bold" }}>
                  {a.assigned_to_name || "Unknown"}{" "}
                  <span style={{ color: "#888", fontWeight: "normal" }}>
                    ({a.assigned_to_role || "N/A"})
                  </span>
                </Typography>
                <Typography variant="body2" sx={{ color: idx === 0 ? "#43a047" : "#1976d2" }}>
                  {message}
                </Typography>
                <Typography variant="caption" sx={{ color: "#888" }}>
                  {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                </Typography>
              </Paper>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}