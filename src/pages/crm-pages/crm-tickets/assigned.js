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
    "fullName",
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

      const url = `${baseURL}/ticket/assigned/${userId}`;
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
      setIsModalOpen(true);
    } catch (e) {
      setAssignmentHistory([]);
      setIsModalOpen(true);
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

  const filteredTickets = agentTickets.filter((ticket) => {
    const searchValue = search.toLowerCase();
    const phone = (ticket.phone_number || "").toLowerCase();
    const nida = (ticket.nida_number || "").toLowerCase();
    const fullName = (ticket.first_name || "") + " " + (ticket.middle_name || "") + " " + (ticket.last_name || "");

    const matchesSearch = !searchValue ||
      ticket.phone_number?.toLowerCase().includes(searchValue) ||
      ticket.nida_number?.toLowerCase().includes(searchValue) ||
      fullName.includes(searchValue) ||
      (ticket.first_name || "").toLowerCase().includes(searchValue) ||
      (ticket.last_name || "").toLowerCase().includes(searchValue) ||
      (ticket.middle_name || "").toLowerCase().includes(searchValue);
    
    const matchesStatus = !filters.status || ticket.status === filters.status;

    return matchesSearch && matchesStatus;
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
    <tr key={ticket.id || index}>
      {activeColumns.includes("ticket_id") && (
        <td>{ticket.ticket_id || ticket.id}</td>
      )}
      {activeColumns.includes("fullName") && (
     <td>
     {ticket.first_name && ticket.first_name.trim() !== ""
       ? `${ticket.first_name} ${ticket.middle_name || ""} ${ticket.last_name || ""}`.trim()
       : (typeof ticket.institution === "string"
           ? ticket.institution
           : ticket.institution && typeof ticket.institution === "object" && typeof ticket.institution.name === "string"
             ? ticket.institution.name
             : "N/A")}
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
        <h3 className="title">Assigned Tickets List</h3>
        
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
          activeColumns={activeColumns}
          onColumnsChange={setActiveColumns}
          tableData={filteredTickets}
          tableTitle="Assigned Tickets"
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

      {/* Details Modal */}
      <TicketDetailsModal
        open={isModalOpen}
        onClose={closeModal}
        selectedTicket={selectedTicket}
        assignmentHistory={assignmentHistory}
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

      {/* Ticket History Modal */}
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