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
} from "@mui/material";
import ColumnSelector from "../../../components/colums-select/ColumnSelector";
import { baseURL } from "../../../config";
import "./ticket.css";
import AdvancedFilterButton from '../../../components/AdvancedFilterButton';
import TicketDetailsModal from '../../../components/TicketDetailsModal';

export default function Crm() {
  const [assignments, setAssignments] = useState([]);
  const [assignmentsError, setAssignmentsError] = useState(null);
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
    "full_name",
    "phone_number",
    "status",
    "actions"
  ]);
  const [loading, setLoading] = useState(true);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);

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
    // eslint-disable-next-line
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
          setAssignmentsError("No assignments found for this agent.");
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
        setAssignmentsError("No assignments found for this agent.");
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

  const openModal = (ticket) => {
    setSelectedTicket(ticket);
    setComments(ticket.comments || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    setComments("");
    setModal({ isOpen: false, type: "", message: "" });
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const searchValue = search.toLowerCase();
    return (
      assignment.ticket_id?.toLowerCase().includes(searchValue) ||
      assignment.assigned_by_id?.toLowerCase().includes(searchValue) ||
      assignment.assigned_to_id?.toLowerCase().includes(searchValue) ||
      assignment.assigned_to_role?.toLowerCase().includes(searchValue) ||
      assignment.reason?.toLowerCase().includes(searchValue)
    );
  });

  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const paginatedAssignments = filteredAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderTableHeader = () => (
    <tr>
      <th>#</th>
      <th>Full Name</th>
      <th>Phone</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  );

  const renderTableRow = (assignment, index) => {
    const ticket = assignment.ticket || {};
    let fullName = "N/A";
    if (ticket.first_name || ticket.middle_name || ticket.last_name) {
      fullName = `${ticket.first_name || ""} ${ticket.last_name || ""}`.trim();
    }
    return (
      <tr key={assignment.id || index}>
         <td>{(currentPage - 1) * itemsPerPage + index + 1}</td> {/* This is the row number */}
        <td>{fullName}</td>
        <td>{ticket.phone_number || "N/A"}</td>
        <td>{ticket.status || "N/A"}</td>
        <td>
          <button onClick={() => openModal(assignment)} style={{ marginRight: 8 }}>
            View
          </button>
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
          <h2>In-progress Assignments List</h2>
          <AdvancedFilterButton onClick={() => setIsColumnModalOpen(true)} />
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
                  value === "All" ? filteredAssignments.length : parseInt(value)
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
              placeholder="Search by ticket ID, assigned by, assigned to, role, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <table className="user-table">
          <thead>{renderTableHeader()}</thead>
          <tbody>
            {paginatedAssignments.length > 0 ? (
              paginatedAssignments.map((assignment, i) => renderTableRow(assignment, i))
            ) : (
              <tr>
                <td
                  colSpan={activeColumns.length}
                  style={{ textAlign: "center", color: "red" }}
                >
                  {assignmentsError || "No assignments found for this agent."}
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
        renderAssignmentStepper={renderAssignmentStepper}
        setIsFlowModalOpen={setIsFlowModalOpen}
      />

      {/* Column Selector */}
      <ColumnSelector
        open={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        data={assignments}
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
    </div>
  );
}