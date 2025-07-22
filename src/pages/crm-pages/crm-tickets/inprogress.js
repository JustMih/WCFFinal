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
    "ticket_id",
    "fullName",
    "phone_number",
    "region",
    "status"
  ]);
  const [loading, setLoading] = useState(true);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsError, setAssignmentsError] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setUserId(userId);
    } else {
      setAssignmentsError("User not authenticated. Please log in.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchInProgressAssignments();
    }
  }, [userId]);

  const fetchInProgressAssignments = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication error. Please log in again.");
      }
      const url = `${baseURL}/ticket/assignments/in-progress`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 404) {
          setAssignments([]);
          setAssignmentsError("No ticket found.");
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (data && Array.isArray(data.assignments)) {
        setAssignments(data.assignments);
        setAssignmentsError(null);
      } else {
        setAssignments([]);
        setAssignmentsError("No ticket found");
      }
    } catch (error) {
      setAssignmentsError(error.message);
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
        fetchInProgressAssignments();
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
    return (
      (phone.includes(searchValue) || nida.includes(searchValue))
    );
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

  const renderTableRow = (assignment, index) => {
    const ticket = assignment.ticket || {};
    let fullName = "N/A";
    if (ticket.first_name && ticket.first_name.trim() !== "") {
      fullName = `${ticket.first_name} ${ticket.middle_name || ""} ${ticket.last_name || ""}`.trim();
    } else if (typeof ticket.institution === "string") {
      fullName = ticket.institution;
    } else if (ticket.institution && typeof ticket.institution === "object" && typeof ticket.institution.name === "string") {
      fullName = ticket.institution.name;
    }
    return (
      <tr key={assignment.id || index}>
        {activeColumns.includes("ticket_id") && (
          <td>{ticket.ticket_id || ticket.id}</td>
        )}
        {activeColumns.includes("fullName") && (
          <td>{fullName}</td>
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
        {activeColumns.includes("subject") && (
          <td>{ticket.subject || "N/A"}</td>
        )}
        {activeColumns.includes("category") && (
          <td>{ticket.category || "N/A"}</td>
        )}
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
              onClick={() => openModal(assignment)}
            >
              <FaEye />
            </button>
          </Tooltip>
        </td>
      </tr>
    );
  };

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
      <h3 className="title">In Progress Tickets List</h3>
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
          filterStatus={filterStatus}
          onFilterStatusChange={(e) => setFilterStatus(e.target.value)}
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
                  style={{ textAlign: "center", color: "red" }}
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
        renderAssignmentStepper={renderAssignmentStepper}
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