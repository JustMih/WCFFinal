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
import ColumnSelector from "../../../components/colums-select/ColumnSelector";
import { baseURL } from "../../../config";
import "./ticket.css";
import TicketFilters from '../../../components/ticket/TicketFilters';
import ChatIcon from '@mui/icons-material/Chat';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import TicketDetailsModal from '../../../components/TicketDetailsModal';
import { AssignmentStepper } from '../../../components/TicketDetailsModal';

export default function Crm() {
  const [agentTickets, setAgentTickets] = useState([]);
  const [agentTicketsError, setAgentTicketsError] = useState(null);
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState("");
  const [modal, setModal] = useState({ isOpen: false, type: "", message: "" });
  const [activeColumns, setActiveColumns] = useState([
    "id",
    "fullName",
    "phone_number",
    "status",
    "subject",
    "category",
    "assigned_to_role",
    "createdAt",
  ]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    nidaSearch: '',
    priority: '',
    category: '',
    startDate: null,
    endDate: null,
  });
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [openStepperTicketId, setOpenStepperTicketId] = useState(null);
  const [rowAssignmentHistory, setRowAssignmentHistory] = useState({});

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

      const url = `${baseURL}/ticket/all/${userId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log('total', response);

      if (!response.ok) {
        if (response.status === 404) {
          setAgentTickets([]);
          setAgentTicketsError("No tickets found for this agent.");
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
        setAgentTicketsError("No tickets found for this agent.");
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
    setIsModalOpen(true);
    try {
      const token = localStorage.getItem("authToken");
      // Fetch full ticket details (with associations)
      const res = await fetch(`${baseURL}/ticket/${ticket.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedTicket(data.ticket || ticket); // Use full ticket if available
      setComments((data.ticket && data.ticket.comments) || ticket.comments || "");

      // Fetch assignment history as before
      const res2 = await fetch(`${baseURL}/ticket/${ticket.id}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data2 = await res2.json();
      setAssignmentHistory(data2);
    } catch (e) {
      setAssignmentHistory([]);
      setSelectedTicket(ticket); // fallback
      setComments(ticket.comments || "");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    setComments("");
    setModal({ isOpen: false, type: "", message: "" });
  };

  const handleFilterChange = (newFilters) => {
    const { status, ...rest } = newFilters;
    setFilters(rest);
    setCurrentPage(1);
  };

  const filteredTickets = agentTickets.filter((ticket) => {
    const searchValue = search.toLowerCase();
    const phone = (ticket.phone_number || '').toLowerCase();
    const nida = (ticket.nida_number || '').toLowerCase();
    const matchesSearch = !searchValue || phone.includes(searchValue) || nida.includes(searchValue);
    const matchesStatus = !filterStatus || ticket.status === filterStatus;
    const matchesPriority = !filters.priority || ticket.priority === filters.priority;
    const matchesCategory = !filters.category || ticket.category === filters.category;
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
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesDate;
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
    <React.Fragment key={ticket.id || index}>
      <tr>
        {activeColumns.includes("id") && (
          <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
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
              {ticket.status || "N/A"}
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
          {/* <button onClick={() => handleShowStepper(ticket)} style={{ marginLeft: 8 }}>
            {openStepperTicketId === ticket.id ? "Hide Stepper" : "Show Stepper"}
          </button> */}
        </td>
      </tr>
      {/* {openStepperTicketId === ticket.id && (
        <tr>
          <td colSpan={activeColumns.length + 1}>
            <AssignmentStepper
              assignmentHistory={rowAssignmentHistory[ticket.id] || []}
              selectedTicket={ticket}
            />
          </td>
        </tr>
      )} */}
    </React.Fragment>
  );

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

  const handleShowStepper = async (ticket) => {
    if (openStepperTicketId === ticket.id) {
      setOpenStepperTicketId(null);
      return;
    }
    setOpenStepperTicketId(ticket.id);
    // Fetch assignment history for this ticket
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${baseURL}/ticket/${ticket.id}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRowAssignmentHistory(prev => ({ ...prev, [ticket.id]: data }));
    } catch (e) {
      setRowAssignmentHistory(prev => ({ ...prev, [ticket.id]: [] }));
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h3 className="title">Loading...</h3>
      </div>
    );
  }

  return (
    <div className="coordinator-dashboard-container">
      <TicketFilters onFilterChange={handleFilterChange} initialFilters={filters} />
      <div style={{ overflowX: "auto", width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2>Tickets List</h2>
          <Tooltip title="Columns Settings and Export" arrow>
            <IconButton onClick={() => setIsColumnModalOpen(true)}>
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
              <option value="Assigned">Assigned</option>
              <option value="Closed">Closed</option>
            </select>
            {/* <button className="add-ticket-button">
              <FaPlus /> Add Ticket
            </button> */}
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
                  {agentTicketsError || "No tickets found for this agent."}
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

      {/* Details Modal */}
      <TicketDetailsModal
        open={isModalOpen}
        onClose={closeModal}
        selectedTicket={selectedTicket}
        assignmentHistory={assignmentHistory}
      />

      {/* Column Selector */}
      <ColumnSelector
        open={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        data={agentTickets}
        onColumnsChange={setActiveColumns}
      />

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