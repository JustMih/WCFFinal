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
            width: { xs: "90%", sm: 600 },
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
              <Typography
                id="ticket-details-title"
                variant="h5"
                sx={{ fontWeight: "bold", color: "#1976d2" }}
              >
                Ticket Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2} id="ticket-details-description">
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Name:</strong>{" "}
                    {`${selectedTicket.first_name || "N/A"} ${
                      selectedTicket.middle_name || " "
                    } ${selectedTicket.last_name || "N/A"}`}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Phone:</strong>{" "}
                    {selectedTicket.phone_number || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>NIDA:</strong> {selectedTicket.nida_number || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Institution:</strong>{" "}
                    {selectedTicket.institution || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Region:</strong> {selectedTicket.region || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>District:</strong>{" "}
                    {selectedTicket.district || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Subject:</strong> {selectedTicket.subject || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Sub-category:</strong>{" "}
                    {selectedTicket.sub_category || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Channel:</strong> {selectedTicket.channel || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Complaint Type:</strong>{" "}
                    {selectedTicket.complaint_type || "Unrated"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Rated:</strong>{" "}
                    <span
                      style={{
                        color:
                          selectedTicket.complaint_type === "Major"
                            ? "red"
                            : selectedTicket.complaint_type === "Minor"
                            ? "orange"
                            : "inherit",
                      }}
                    >
                      {selectedTicket.complaint_type || "N/A"}
                    </span>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        color:
                          selectedTicket.status === "Open"
                            ? "green"
                            : selectedTicket.status === "Closed"
                            ? "gray"
                            : "blue",
                      }}
                    >
                      {selectedTicket.status || "N/A"}
                    </span>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Created By:</strong>{" "}
                    {selectedTicket.createdBy?.name || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Assigned To:</strong>{" "}
                    {selectedTicket.assigned_to_id || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Assigned Role:</strong>{" "}
                    {selectedTicket.assigned_to_role || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Created At:</strong>{" "}
                    {selectedTicket.created_at
                      ? new Date(selectedTicket.created_at).toLocaleString(
                          "en-US",
                          {
                            month: "numeric",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          }
                        )
                      : "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography>
                    <strong>Description:</strong>{" "}
                    {selectedTicket.description || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography>
                    <strong>Comments:</strong>
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={comments}
                    onChange={handleCommentsChange}
                    placeholder="Add comments or notes..."
                    sx={{ mt: 1 }}
                  />
                  <Box sx={{ mt: 2, textAlign: "right" }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleCommentsSubmit}
                      sx={{ mr: 1 }}
                    >
                      Save Comments
                    </Button>
                    <Button variant="outlined" onClick={closeModal}>
                      Close
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </>
          )}
        </Box>
      </Modal>

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