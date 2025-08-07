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
  Alert
} from "@mui/material";
// import ColumnSelector from "../../../components/colums-select/ColumnSelector";
import { baseURL } from "../../../config";
import "../crm-tickets/ticket.css";
import TicketActions from "../../../components/ticket/TicketActions";
import TicketReassignModal from '../../../components/ticket/TicketReassignModal';
import TicketDetailsModal from '../../../components/ticket/TicketDetailsModal';
import Pagination from "../../../components/Pagination";
import TableControls from "../../../components/TableControls";
import TicketFilters from '../../../components/ticket/TicketFilters';

export default function CRMFocalPersonTickets() {
  const { status } = useParams();
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const DEFAULT_COLUMNS = [
    "ticket_id",
    "fullName",
    "phone_number",
    "region",
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
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [ticketToReassign, setTicketToReassign] = useState(null);
  const token = localStorage.getItem("authToken");
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    nidaSearch: '',
    status: '',
    priority: '',
    category: '',
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    fetchTickets();
    fetchUnits();
    // eslint-disable-next-line
  }, [status]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/focal-person/new-tickets?status=${status}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      const data = await response.json();
      setTickets(data.inquiries || []);
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
    // Fetch assignment history
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

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    setAssignmentHistory([]);
  };

  const handleFilterChange = (newFilters) => {
    const { status, ...rest } = newFilters;
    setFilters(rest);
    setCurrentPage(1);
  };

  const filteredTickets = tickets.filter((ticket) => {
    const searchValue = search.toLowerCase();
    const phone = (ticket.phone_number || "").toLowerCase();
    const nida = (ticket.nida_number || "").toLowerCase();
    const fullName = `${ticket.first_name || ""} ${ticket.middle_name || ""} ${ticket.last_name || ""}`.toLowerCase();
    const institutionName = (ticket.institution && typeof ticket.institution === 'object' ? ticket.institution.name : ticket.institution || "").toLowerCase();
    
    const matchesSearch = !searchValue || 
      phone.includes(searchValue) || 
      nida.includes(searchValue) ||
      fullName.includes(searchValue) ||
      institutionName.includes(searchValue) ||
      (ticket.first_name || "").toLowerCase().includes(searchValue) ||
      (ticket.last_name || "").toLowerCase().includes(searchValue) ||
      (ticket.middle_name || "").toLowerCase().includes(searchValue);
    
    const matchesStatus = !filters.status || ticket.status === filters.status;
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
        {/* Show Reassign button if ticket is assigned to an attendee */}
        {(ticket.assigned_to_role && ticket.status &&
          ticket.assigned_to_role.toLowerCase() === 'attendee' &&
          ticket.status.toLowerCase() === 'assigned') && (
          <Tooltip title="Reassign Ticket">
            <button
              className="reassign-ticket-btn"
              onClick={() => handleReassignClick(ticket)}
              style={{ marginLeft: 8 }}
            >
              Reassign
            </button>
          </Tooltip>
        )}
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
    const responsible_unit_id = forwardUnit[ticketId];

    if (!category && !responsible_unit_id) {
      setSnackbar({ open: true, message: "Select either category or unit to forward", severity: "warning" });
      return;
    }

    const payload = { userId };
    if (category) payload.category = category;
    if (responsible_unit_id) payload.responsible_unit_id = responsible_unit_id;

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

  const handleReassignClick = (ticket) => {
    setTicketToReassign(ticket);
    setShowReassignModal(true);
  };

  const handleReassignSuccess = () => {
    fetchTickets(); // refresh ticket list
  };

  // Assignment Stepper Logic (copied from ticket.js)
  const renderAssignmentStepper = (assignmentHistory, selectedTicket) => {
    const steps = [
      {
        assigned_to_name: selectedTicket.created_by ||
          (selectedTicket.creator && selectedTicket.creator.name) ||
          `${selectedTicket.first_name || ""} ${selectedTicket.last_name || ""}`.trim() ||
          "N/A",
        assigned_to_role: "Creator",
        action: "Created",
        created_at: selectedTicket.created_at,
        assigned_to_id: "creator"
      }
    ];
    if (Array.isArray(assignmentHistory) && assignmentHistory.length > 0) {
      steps.push(...assignmentHistory);
    } else if (
      selectedTicket.assigned_to_id &&
      selectedTicket.assigned_to_id !== "creator"
    ) {
      steps.push({
        assigned_to_name: selectedTicket.assigned_to_name || selectedTicket.assigned_to_id || "Unknown",
        assigned_to_role: selectedTicket.assigned_to_role || "Unknown",
        action: selectedTicket.status === "Assigned" ? "Assigned" : "Open",
        created_at: selectedTicket.assigned_at,
        assigned_to_id: selectedTicket.assigned_to_id
      });
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
    return (
      <Box>
        {steps.map((a, idx) => (
          <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                bgcolor:
                  idx < currentAssigneeIdx
                    ? "green"
                    : idx === currentAssigneeIdx
                    ? "#1976d2"
                    : "gray",
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
                {a.action} - {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
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
        <h3 className="title">Focal Person Tickets List</h3>
        
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
          activeColumns={activeColumns}
          onColumnsChange={setActiveColumns}
          tableData={filteredTickets}
          tableTitle="Focal Person Tickets"
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

      {/* Details Modal */}
      <TicketDetailsModal
        open={isModalOpen}
        onClose={closeModal}
        selectedTicket={selectedTicket}
        assignmentHistory={assignmentHistory}
        renderAssignmentStepper={renderAssignmentStepper}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <TicketReassignModal
        ticket={ticketToReassign}
        open={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        onSuccess={handleReassignSuccess}
        token={token}
      />
    </div>
  );
} 