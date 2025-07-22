import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FiSettings } from "react-icons/fi";
import { FaEye } from "react-icons/fa";
import {
  Box,
  Button,
  Grid,
  IconButton,
  Modal,
  Tooltip,
  Typography,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar,
  Paper
} from "@mui/material";
// import ColumnSelector from "../../../components/colums-select/ColumnSelector";
import { baseURL } from "../../../config";
import "../crm-tickets/ticket.css";
import TicketActions from "../../../components/coordinator/TicketActions";
import TicketDetailsModal from '../../../components/TicketDetailsModal';
import Pagination from '../../../components/Pagination';
import TableControls from "../../../components/TableControls";

export default function CRMCoordinatorTickets() {
  const { status } = useParams();
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const DEFAULT_COLUMNS = [
    "id",
    "fullName",
    "phone_number",
    "status",
    "subject",
    "category",
    "assigned_to_role",
    "createdAt"
  ];
  const [activeColumns, setActiveColumns] = useState(DEFAULT_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [convertCategory, setConvertCategory] = useState({});
  const [forwardUnit, setForwardUnit] = useState({});
  const [units, setUnits] = useState([]);
  const categories = ["Complaint", "Congrats", "Suggestion"];
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  useEffect(() => {
    fetchTickets();
    fetchUnits();
    // eslint-disable-next-line
  }, [status]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/coordinator/tickets?status=${status}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      const data = await response.json();
      setTickets(data.tickets || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(`${baseURL}/section/units-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setUnits(json.data || []);
    } catch (err) {
      // Optionally handle error
    }
  };

  const openModal = async (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
    // Fetch assignment history for the ticket
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${baseURL}/ticket/${ticket.id}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAssignmentHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setAssignmentHistory([]);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    setAssignmentHistory([]);
  };

  const openHistoryModal = async (ticket) => {
    setSelectedTicket(ticket);
    setIsHistoryModalOpen(true);
    // Fetch assignment history for the ticket
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${baseURL}/ticket/${ticket.id}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAssignmentHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setAssignmentHistory([]);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const searchValue = search.toLowerCase();
    const phone = (ticket.phone_number || "").toLowerCase();
    const nida = (ticket.nida_number || "").toLowerCase();
    return (
      (phone.includes(searchValue) || nida.includes(searchValue)) &&
      (!filterStatus || ticket.status === filterStatus)
    );
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
            {ticket.status || "Escalated" || "N/A"}
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
        <Tooltip title="Ticket History">
          <button
            className="view-ticket-history-btn"
            onClick={() => openHistoryModal(ticket)}
            style={{ marginLeft: "8px" }}
          >
            📋
          </button>
        </Tooltip>
      </td>
    </tr>
  );

  const handleColumnsChange = (selectedColumns) => {
    if (selectedColumns.length === 0) {
      setActiveColumns(DEFAULT_COLUMNS);
    } else {
      setActiveColumns(selectedColumns);
    }
  };

  const handleConvertOrForward = async (ticketId) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");
    const category = convertCategory[ticketId];
    const responsible_unit_name = forwardUnit[ticketId];

    // Get the current ticket to check its rating
    const currentTicket = tickets.find(t => t.id === ticketId);

    if (!category && !responsible_unit_name) {
      setSnackbar({ open: true, message: "Select either category or unit to forward", severity: "warning" });
      return;
    }

    const payload = { 
      userId,
      complaintType: currentTicket?.complaint_type || undefined
    };
    if (category) payload.category = category;
    if (responsible_unit_name) payload.responsible_unit_name = responsible_unit_name;

    try {
      const response = await fetch(`${baseURL}/coordinator/${ticketId}/convert-or-forward-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setSnackbar({ open: true, message: "Ticket updated successfully", severity: "success" });
        fetchTickets();
        setConvertCategory((prev) => ({ ...prev, [ticketId]: "" }));
        setForwardUnit((prev) => ({ ...prev, [ticketId]: "" }));
      } else {
        const errorData = await response.json();
        console.log("Backend error:", errorData);
        setSnackbar({ open: true, message: errorData.message || "Failed to update ticket.", severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    }
  };

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const handleTicketUpdate = (updatedTicket) => {
    // Update tickets list
    setTickets(tickets.map(ticket => 
      ticket.id === updatedTicket.id ? updatedTicket : ticket
    ));
    
    // Show success message
    setSnackbar({
      open: true,
      message: "Ticket updated successfully",
      severity: "success"
    });
  };

  // Add handleRating and handleForward functions
  const handleRating = async (ticketId, rating) => {
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");
    try {
      const response = await fetch(`${baseURL}/coordinator/${ticketId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId, rating })
      });
      const data = await response.json();
      if (response.ok) {
        setSnackbar({ open: true, message: "Ticket rated successfully", severity: "success" });
        fetchTickets();
      } else {
        setSnackbar({ open: true, message: data.message || "Failed to rate ticket", severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    }
  };

  const handleForward = async (ticketId, forwardData) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`${baseURL}/coordinator/${ticketId}/forward`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(forwardData)
      });
      const data = await response.json();
      if (response.ok) {
        setSnackbar({ open: true, message: "Ticket forwarded successfully", severity: "success" });
        fetchTickets();
      } else {
        setSnackbar({ open: true, message: data.message || "Failed to forward ticket", severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
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
      <div style={{ overflowX: "auto", width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2>Coordinator Tickets - {status}</h2>
          <Tooltip title="Columns Settings and Export" arrow>
            <IconButton onClick={() => setIsColumnModalOpen(true)}>
              <FiSettings size={20} />
            </IconButton>
          </Tooltip>
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
          filterStatus={filterStatus}
          onFilterStatusChange={(e) => setFilterStatus(e.target.value)}
          activeColumns={activeColumns}
          onColumnsChange={setActiveColumns}
          tableData={filteredTickets}
          tableTitle="Coordinator Tickets"
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
                  {error || "No tickets found for this status."}
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
        onClose={() => { setIsModalOpen(false); setSelectedTicket(null); setAssignmentHistory([]); }}
        selectedTicket={selectedTicket}
        assignmentHistory={assignmentHistory}
        handleConvertOrForward={handleConvertOrForward}
        handleCategoryChange={(ticketId, value) => setConvertCategory((prev) => ({ ...prev, [ticketId]: value }))}
        handleUnitChange={(ticketId, value) => setForwardUnit((prev) => ({ ...prev, [ticketId]: value }))}
        categories={categories}
        units={units}
        convertCategory={convertCategory}
        forwardUnit={forwardUnit}
        refreshTickets={fetchTickets}
        setSnackbar={setSnackbar}
        handleRating={handleRating}
        handleForward={handleForward}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
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