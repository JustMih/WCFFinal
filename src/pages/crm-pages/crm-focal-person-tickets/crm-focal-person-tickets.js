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
import ColumnSelector from "../../../components/colums-select/ColumnSelector";
import { baseURL } from "../../../config";
import "../crm-tickets/ticket.css";
import TicketActions from "../../../components/coordinator/TicketActions";
import TicketReassignModal from '../../../components/ticket/TicketReassignModal';
import TicketDetails from '../../../components/TicketDetails';

export default function CRMFocalPersonTickets() {
  const { status } = useParams();
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
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
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [ticketToReassign, setTicketToReassign] = useState(null);
  const token = localStorage.getItem("authToken");

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

  const openModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
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
    <tr key={ticket.id || index}>
      {activeColumns.includes("id") && (
        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
      )}
      {activeColumns.includes("fullName") && (
        <td>{`${ticket.first_name || ""} ${ticket.middle_name || ""} ${ticket.last_name || ""}`}</td>
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
        <Tooltip title="View Status">
          <button
            className="view-status-btn"
            onClick={() => openModal(ticket)}
            style={{ marginLeft: 8 }}
          >
            Status
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
          <h2>Focal Person Tickets - {status}</h2>
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
                  {error || "No tickets found for this status."}
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
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        aria-labelledby="ticket-details-title"
        aria-describedby="ticket-details-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 900 },
            maxHeight: "85vh",
            overflowY: "auto",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 3,
          }}
        >
          {selectedTicket && (
            <>
              <TicketDetails ticketId={selectedTicket.id} onClose={closeModal} />
              {/* Convert and Forward Actions */}
              <Typography variant="h6" sx={{ color: "#1976d2", mb: 1, mt: 3 }}>
                Actions
              </Typography>
              <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <select
                    style={{ 
                      padding: "8px 12px", 
                      fontSize: "0.9rem", 
                      height: "40px", 
                      borderRadius: "4px",
                      minWidth: "200px",
                      border: "1px solid #ccc"
                    }}
                    value={convertCategory[selectedTicket.id] || ""}
                    onChange={(e) =>
                      setConvertCategory((prev) => ({ ...prev, [selectedTicket.id]: e.target.value }))
                    }
                  >
                    <option value="">Convert To</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <Button 
                    variant="contained" 
                    onClick={() => handleConvertOrForward(selectedTicket.id)}
                  >
                    Convert
                  </Button>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <select
                    style={{ 
                      padding: "8px 12px", 
                      fontSize: "0.9rem", 
                      height: "40px", 
                      borderRadius: "4px",
                      minWidth: "200px",
                      border: "1px solid #ccc"
                    }}
                    value={forwardUnit[selectedTicket.id] || ""}
                    onChange={(e) =>
                      setForwardUnit((prev) => ({ ...prev, [selectedTicket.id]: e.target.value }))
                    }
                  >
                    <option value="">Forward To Unit</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                  </select>
                  <Button 
                    variant="contained" 
                    onClick={() => handleConvertOrForward(selectedTicket.id)}
                  >
                    Forward
                  </Button>
                </Box>
              </Box>
              {/* Close Modal Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  onClick={closeModal}
                >
                  Close Modal
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      <ColumnSelector
        open={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        data={tickets}
        onColumnsChange={handleColumnsChange}
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