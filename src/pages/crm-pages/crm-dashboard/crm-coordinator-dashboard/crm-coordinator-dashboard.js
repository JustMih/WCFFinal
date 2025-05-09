import React, { useState, useEffect } from "react";

// React Icons
import { FaEye, FaRegCheckCircle } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { HiOutlineUserAdd } from "react-icons/hi";
import { MdSwapHoriz, MdOutlineSupportAgent, MdAutoAwesomeMotion, MdDisabledVisible, MdImportExport } from "react-icons/md";
import { TbArrowsExchange } from "react-icons/tb";
import { CiImport } from "react-icons/ci";

// MUI Components
import {
  Alert,
  Box,
  Button,
  Grid,
  IconButton,
  Modal,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";

// Custom Components
import Card from "../../../../components/card/card";
import ColumnSelector from "../../../../components/colums-select/ColumnSelector";

// Config
import { baseURL } from "../../../../config";

// Styles
import "./crm-coordinator-dashboard.css";

export default function CoordinatorDashboard() {
    const [tickets, setTickets] = useState([]);
    const [userId, setUserId] = useState("");
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [convertCategory, setConvertCategory] = useState({});
    const [forwardUnit, setForwardUnit] = useState({});
    const [activeColumns, setActiveColumns] = useState([]); // Updated by ColumnSelector
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({
      open: false,
      message: "",
      severity: "info"
    });
  
    // Initialize activeColumns with default columns if empty
    useEffect(() => {
      if (activeColumns.length === 0) {
        setActiveColumns(["id", "fullName", "phone_number", "status", "subject", "category", "assigned_to_role", "createdAt"]);
      }
    }, [activeColumns]);
  
    const categories = ["Complaint", "Congrats", "Suggestion"];
  
    // Card data
    const ticketStats = {
      totalComplaints: tickets.length,
      pendingRating: tickets.filter((t) => !t.complaintType).length,
      ratedMajor: tickets.filter((t) => t.complaintType === "Major").length,
      ratedMinor: tickets.filter((t) => t.complaintType === "Minor").length
    };
    const totalTickets = { Directorate: 2, Units: 4 };
    const newTickets = {
      Complaints: 12,
      "New Tickets": 20,
      "Escalated Tickets": 20
    };
    const convertedTickets = {
      Inquiries: 0,
      Complaints: 6,
      Suggestions: 8,
      Complements: 4
    };
    const ticketStatus = {
      Open: 90,
      "On Progress": 20,
      Closed: 30,
      Minor: 0,
      Major: 3
    };
  
    // Fetch userId on mount
    useEffect(() => {
      const id = localStorage.getItem("userId");
      const token = localStorage.getItem("authToken");
      setUserId(id);
      if (!token) {
        setSnackbar({
          open: true,
          message: "Please log in to access tickets.",
          severity: "error"
        });
      } else {
        fetchTickets();
      }
    }, []);
  
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${baseURL}/coordinator/complaints`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (Array.isArray(data.complaints)) {
          setTickets(data.complaints);
        } else {
          setTickets([]);
          setSnackbar({
            open: true,
            message: "No complaints found.",
            severity: "info"
          });
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error fetching tickets: ${error.message}`,
          severity: "error"
        });
      }
    };
  
    const handleRating = async (ticketId, rating) => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${baseURL}/coordinator/${ticketId}/rate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ complaintType: rating, userId })
        });
        if (response.ok) {
          setSnackbar({
            open: true,
            message: `Rated as ${rating}`,
            severity: "success"
          });
          fetchTickets();
        } else {
          throw new Error("Failed to rate ticket.");
        }
      } catch (error) {
        setSnackbar({ open: true, message: error.message, severity: "error" });
      }
    };
  
    const handleConvertOrForward = async (ticketId) => {
      const category = convertCategory[ticketId];
      const unitId = forwardUnit[ticketId];
      if (!category && !unitId) {
        setSnackbar({
          open: true,
          message: "Select either category or unit to forward",
          severity: "warning"
        });
        return;
      }
      try {
        const token = localStorage.getItem("authToken");
        const payload = { ticketId };
        if (category) payload.category = category;
        if (unitId) payload.responsible_unit_id = unitId;
        const response = await fetch(
          `${baseURL}/coordinator/${ticketId}/convert-or-forward-ticket`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          }
        );
        if (response.ok) {
          setSnackbar({
            open: true,
            message: "Ticket updated successfully",
            severity: "success"
          });
          fetchTickets();
        } else {
          throw new Error("Failed to update ticket.");
        }
      } catch (error) {
        setSnackbar({ open: true, message: error.message, severity: "error" });
      }
    };
  
    const openModal = (ticket) => {
      setSelectedTicket(ticket);
      setIsModalOpen(true);
    };
  
    const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });
  
    const filteredTickets = tickets.filter((t) => {
      const s = search.trim().toLowerCase();
  
      const fullName = `${t.firstName || ""} ${t.middleName || ""} ${
        t.lastName || ""
      }`.toLowerCase();
  
      return (
        (!s ||
          t.phone_number?.toLowerCase().includes(s) ||
          t.nida_number?.toLowerCase().includes(s) ||
          fullName.includes(s)) &&
        (!filterStatus || t.status === filterStatus)
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
      <tr key={ticket.id}>
        {activeColumns.includes("id") && (
          <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
        )}
        {activeColumns.includes("fullName") && (
          <td>{`${ticket.firstName || ""} ${ticket.middleName || ""} ${
            ticket.lastName || ""
          }`}</td>
        )}
        {activeColumns.includes("phone_number") && (
          <td>{ticket.phone_number || "N/A"}</td>
        )}
        {activeColumns.includes("status") && <td>{ticket.status || "N/A"}</td>}
        {activeColumns.includes("subject") && <td>{ticket.subject || "N/A"}</td>}
        {activeColumns.includes("category") && (
          <td>{ticket.category || "N/A"}</td>
        )}
        {activeColumns.includes("assigned_to_role") && (
          <td>{ticket.assigned_to_role || "N/A"}</td>
        )}
        {activeColumns.includes("createdAt") && (
          <td>
            {ticket.createdAt
              ? new Date(ticket.createdAt).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true
                })
              : "N/A"}
          </td>
        )}
        <td>
          <button
            className="view-ticket-details-btn"
            title="View"
            onClick={() => openModal(ticket)}
          >
            <FaEye />
          </button>
        </td>
      </tr>
    );
  
    return (
      <div className="coordinator-dashboard-container">
        <h2 className="title">Coordinator Dashboard</h2>
  
        {/* Cards */}<div className="crm-dashboard">
  <div className="crm-cards-container">
    <Card
      title="New Tickets"
      data={newTickets}
      color="#ceedea"
      icon={<MdOutlineSupportAgent fontSize={35} />}
    />
    <Card
      title="Channeled Tickets"
      data={totalTickets}
      color="#bce8be"
      icon={<MdOutlineSupportAgent fontSize={35} />}
    />
  </div>
  <div className="crm-cards-container">
    <Card
      title="Converted Tickets"
      data={convertedTickets}
      color="#b9c9ff"
      icon={<MdSwapHoriz fontSize={35} />}
    />
    <Card
      title="Ticket Status"
      data={ticketStatus}
      color="#ffc4dd"
      icon={<MdImportExport fontSize={35} />}
    />
  </div>
</div>
  
        {/* Table */}
        <div style={{ overflowX: "auto", width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <h2>Tickets of Category Complaints</h2>
            <Tooltip title="Columns Settings and Export" arrow>
              <IconButton onClick={() => setIsColumnModalOpen(true)}>
                <FiSettings size={20} />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              onClick={() => setIsColumnModalOpen(true)}
              startIcon={<FiSettings />}
            >
              Open Column Settings
            </Button>
          </div>
          {/* Filters */}
          <div
            className="controls"
            // style={{ display: "flex", justifyContent: "space-between", alignItems: "center"
            //  }}
          >
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
                    value === "All" ? tickets.length : parseInt(value)
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
                placeholder="Search by phone or NIDA"
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
                    No complaints found.
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
  
        {/* Ticket Details Modal */}
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
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
              p: 3
            }}
          >
            {selectedTicket && (
              <>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: "bold", color: "#1976d2" }}
                >
                  Ticket Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Name:</strong>{" "}
                      {`${selectedTicket.firstName || "N/A"} ${
                        selectedTicket.middleName || "N/A"
                      } ${selectedTicket.lastName || "N/A"}`}
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
                      {selectedTicket.complaintType || "Unrated"}
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
                              : "inherit"
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
                              : "blue"
                        }}
                      >
                        {selectedTicket.status || "N/A"}
                      </span>
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Created By:</strong>{" "}
                      {selectedTicket?.createdBy?.name || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Assigned To (User ID):</strong>{" "}
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
                              hour12: true
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
                </Grid>
                <Box
                  sx={{
                    mt: 3,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    alignItems: "center"
                  }}
                >
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => handleRating(selectedTicket.id, "Minor")}
                  >
                    Minor
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => handleRating(selectedTicket.id, "Major")}
                  >
                    Major
                  </Button>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <select
                      style={{
                        padding: "4px 8px",
                        fontSize: "0.8rem",
                        height: "32px",
                        borderRadius: "4px"
                      }}
                      value={convertCategory[selectedTicket.id] || ""}
                      onChange={(e) =>
                        setConvertCategory((prev) => ({
                          ...prev,
                          [selectedTicket.id]: e.target.value
                        }))
                      }
                    >
                      <option value="">Convert To</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleConvertOrForward(selectedTicket.id)}
                    >
                      Convert
                    </Button>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <select
                      style={{
                        padding: "4px 8px",
                        fontSize: "0.8rem",
                        height: "32px",
                        borderRadius: "4px"
                      }}
                      value={forwardUnit[selectedTicket.id] || ""}
                      onChange={(e) =>
                        setForwardUnit((prev) => ({
                          ...prev,
                          [selectedTicket.id]: e.target.value
                        }))
                      }
                    >
                      <option value="">To Unit</option>
                      <option value="unit-claims">Claims Unit</option>
                      <option value="unit-registration">Registration Unit</option>
                      <option value="unit-compliance">Compliance Unit</option>
                    </select>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleConvertOrForward(selectedTicket.id)}
                    >
                      Forward
                    </Button>
                  </Box>
                </Box>
                <Box sx={{ mt: 2, textAlign: "right" }}>
                  <Button color="primary" onClick={() => setIsModalOpen(false)}>
                    Close
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Modal>
  
        {/* Column Selector */}
        <ColumnSelector
          open={isColumnModalOpen}
          onClose={() => setIsColumnModalOpen(false)}
          data={tickets}
          onColumnsChange={setActiveColumns}
        />
  
        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </div>
    );
  }
  
