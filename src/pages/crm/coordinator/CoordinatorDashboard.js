import React, { useState, useEffect } from "react";
import "./coordinator-dashboard.css";
import { MdOutlineSupportAgent } from "react-icons/md";
import { TbSettingsCheck } from "react-icons/tb";
import { FiSettings } from "react-icons/fi";
import IconButton from "@mui/material/IconButton";
import { baseURL } from "../../../config";
import { FaEye } from "react-icons/fa";
import {
  Snackbar,
  Alert,
  Modal,
  Box,
  Button,
  Typography,
  Divider,
  Grid,
  Card,
  CardContent
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";

export default function CoordinatorDashboard() {
  const [ticketStats, setTicketStats] = useState({
    totalComplaints: 0,
    pendingRating: 0,
    ratedMajor: 0,
    ratedMinor: 0
  });
  const [coordinatorTickets, setCoordinatorTickets] = useState([]);
  const [ticketsError, setTicketsError] = useState(null);
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [convertCategory, setConvertCategory] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });

  const categories = ["Complaint", "Congrats", "Suggestion"];

  const exportableColumns = [
    { key: "id", label: "Id" },
    { key: "firstName", label: "First Name" },
    { key: "middleName", label: "Middle Name" },
    { key: "lastName", label: "Last Name" },
    { key: "phone_number", label: "Phone" },
    { key: "nida_number", label: "NIDA" },
    { key: "subject", label: "Subject" },
    { key: "category", label: "Category" },
    { key: "description", label: "Description" },
    { key: "assigned_to_role", label: "Assigned Role" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created At" },
    { key: "createdBy.name", label: "Created By" }
  ];

  const [selectedColumns, setSelectedColumns] = useState([
    "id",
    "firstName", // Assuming "Name" comes from this
    "phone_number",
    "status",
    "complaint_type" // Assuming "Rating" is stored here
  ]);

  const toggleSelectAll = () => {
    if (selectedColumns.length === exportableColumns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(exportableColumns.map((col) => col.key));
    }
  };

  useEffect(() => {
    const id = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");
    setUserId(id);
    if (!token) setTicketsError("Please log in to access tickets.");
  }, []);

  useEffect(() => {
    if (userId) fetchCoordinatorTickets();
  }, [userId]);

  const fetchCoordinatorTickets = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/coordinator/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data.complaints)) {
        setCoordinatorTickets(data.complaints);
        setTicketsError(null);
        updateTicketStats(data.complaints);
      } else {
        setCoordinatorTickets([]);
        setTicketsError("No complaints found.");
      }
    } catch (error) {
      setTicketsError(error.message);
    }
  };

  const updateTicketStats = (tickets) => {
    setTicketStats({
      totalComplaints: tickets.length,
      pendingRating: tickets.filter((t) => !t.complaintType).length,
      ratedMajor: tickets.filter((t) => t.complaintType === "Major").length,
      ratedMinor: tickets.filter((t) => t.complaintType === "Minor").length
    });
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
        body: JSON.stringify({ complaintType: rating, userId: userId }) // "Minor" or "Major"
      });

      if (!response.ok) {
        throw new Error("Failed to rate ticket.");
      }

      setSnackbar({
        open: true,
        message: `Rated as ${rating}`,
        severity: "success"
      });

      fetchCoordinatorTickets(); // Refresh the data
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  const [forwardUnit, setForwardUnit] = useState({});

  const handleConvertOrForward = async (ticketId) => {
    const category = convertCategory[ticketId];
    const unitId = forwardUnit[ticketId]; // assuming you have this in state

    if (!category && !unitId) {
      return setSnackbar({
        open: true,
        message: "Select either category or unit to forward",
        severity: "warning"
      });
    }

    try {
      const token = localStorage.getItem("authToken");
      const payload = { ticketId };

      if (category) payload.category = category;
      if (unitId) payload.responsible_unit_id = unitId;

      await fetch(
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

      setSnackbar({
        open: true,
        message: `Ticket updated successfully`,
        severity: "success"
      });

      fetchCoordinatorTickets();
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
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

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const filteredTickets = coordinatorTickets.filter((t) => {
    const s = search.trim();
    return (
      (!s || t.phone_number?.includes(s) || t.nida_number?.includes(s)) &&
      (!filterStatus || t.status === filterStatus)
    );
  });

  const exportToCSV = () => {
    const csvData = coordinatorTickets.map((ticket, index) => {
      const row = {};
      selectedColumns.forEach((col) => {
        let value;
        if (col === "createdBy.name") {
          value = ticket.createdBy?.name || "N/A";
        } else if (col === "id") {
          value = index + 1; // show row number instead of UUID
        } else {
          value = ticket[col] || "N/A";
        }

        // Prevent Excel from auto-formatting long numbers
        if (["nida_number", "phone_number"].includes(col)) {
          value = `="${value}"`;
        }

        row[exportableColumns.find((c) => c.key === col)?.label] = value;
      });
      return row;
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "tickets-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const isLandscape = selectedColumns.length > 5;
    const doc = new jsPDF({
      orientation: isLandscape ? "landscape" : "portrait",
      unit: "pt",
      format: "A4"
    });

    doc.text("Tickets Report", 40, 30);

    const headers = [
      selectedColumns.map(
        (col) => exportableColumns.find((c) => c.key === col)?.label
      )
    ];

    const data = coordinatorTickets.map((ticket, index) =>
      selectedColumns.map((col) => {
        if (col === "createdBy.name") {
          return ticket.createdBy?.name || "N/A";
        } else if (col === "id") {
          return index + 1;
        }
        const val = ticket[col];
        if (typeof val === "number" && val.toString().length >= 10) {
          return `'${val}`;
        }
        return val || "N/A";
      })
    );

    autoTable(doc, {
      startY: 40,
      head: headers,
      body: data,
      styles: {
        fontSize: 8,
        overflow: "linebreak"
      },
      headStyles: {
        fillColor: [22, 160, 133]
      }
    });

    doc.save("tickets-report.pdf");
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  return (
    <div className="coordinator-dashboard-container">
      <h2 className="title">Coordinator Dashboard</h2>

      <div className="stats-grid">
        {/* Agent Card */}
        {/* <div
    className="stats-card clickable"
    
  >
    <div className="stats-icon">
      <MdOutlineSupportAgent size={40} color="#1976d2" />
    </div>
    <p className="stats-value">10</p>
    <h4 className="stats-label">Total Agents</h4>
  </div> */}

        {/* Ticket Stats Cards */}
        {/* {[
    "Total Complaints",
    "Pending Rating",
    "Rated Major",
    "Rated Minor"
  ].map((label, i) => (
    <div key={i} className="stats-card">
      <p className="stats-label">{label}</p>
      <p
        className="stats-value"
        style={{
          color: Object.values(ticketStats)[i] > 0 ? "#1976d2" : "gray"
        }}
      >
        {Object.values(ticketStats)[i]}
      </p>
    </div> */}
        {/* ))} */}
      </div>

      <div className="admin-summary">
        <div className="admin-card">
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">10</p>
            </div>
            <h4>Total Agents</h4>
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">10</p>
            </div>
            <h4>Total Admin</h4>
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">10</p>
            </div>
            <h4>Total Supervisor</h4>
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">10</p>
            </div>
            <h4>Total Manager</h4>
          </div>
        </div>
      </div>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setIsExportModalOpen(true)}
      >
        Export Settings
      </Button>

      <Modal
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        aria-labelledby="export-settings-title"
        aria-describedby="export-settings-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 600 },
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 3
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Export Column Settings
          </Typography>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "16px",
              justifyContent: "center"
            }}
          >
            {exportableColumns.map((col) => {
              const isSelected = selectedColumns.includes(col.key);
              return (
                <div
                  key={col.key}
                  onClick={() =>
                    setSelectedColumns((prev) =>
                      prev.includes(col.key)
                        ? prev.filter((k) => k !== col.key)
                        : [...prev, col.key]
                    )
                  }
                  style={{
                    cursor: "pointer",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    backgroundColor: isSelected ? "#1976d2" : "#e0e0e0",
                    color: isSelected ? "#fff" : "#333",
                    fontWeight: 500,
                    fontSize: "13px",
                    minWidth: "100px",
                    textAlign: "center",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    transition: "0.3s"
                  }}
                >
                  {col.label}
                </div>
              );
            })}
          </div>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Button size="small" variant="outlined" onClick={toggleSelectAll}>
              {selectedColumns.length === exportableColumns.length
                ? "Deselect All"
                : "Select All"}
            </Button>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => {
                  exportToPDF();
                  setIsExportModalOpen(false);
                }}
              >
                Export PDF
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={() => {
                  exportToCSV();
                  setIsExportModalOpen(false);
                }}
              >
                Export CSV
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* modal in checkbox selection */}
      {/* <Modal
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        aria-labelledby="export-settings-title"
        aria-describedby="export-settings-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: 300, sm: 500 },
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 4
          }}
        >
          <Typography id="export-settings-title" variant="h6" sx={{ mb: 2 }}>
            Select Columns to Export
          </Typography>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "16px"
            }}
          >
            {exportableColumns.map((col) => (
              <label key={col.key} style={{ fontSize: "14px" }}>
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(col.key)}
                  onChange={() => {
                    setSelectedColumns((prev) =>
                      prev.includes(col.key)
                        ? prev.filter((k) => k !== col.key)
                        : [...prev, col.key]
                    );
                  }}
                />{" "}
                {col.label}
              </label>
            ))}
          </div>

          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button size="small" variant="outlined" onClick={toggleSelectAll}>
              {selectedColumns.length === exportableColumns.length
                ? "Deselect All"
                : "Select All"}
            </Button>
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => {
                exportToPDF();
                setIsExportModalOpen(false);
              }}
            >
              Export PDF
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => {
                exportToCSV();
                setIsExportModalOpen(false);
              }}
            >
              Export CSV
            </Button>
          </Box>
        </Box>
      </Modal> */}

      {/* <div style={{ marginBottom: "16px" }}>
        <strong>Select Columns to Export:</strong>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "8px"
          }}
        >
          {exportableColumns.map((col) => (
            <label key={col.key} style={{ fontSize: "14px" }}>
              <input
                type="checkbox"
                checked={selectedColumns.includes(col.key)}
                onChange={() => {
                  setSelectedColumns((prev) =>
                    prev.includes(col.key)
                      ? prev.filter((k) => k !== col.key)
                      : [...prev, col.key]
                  );
                }}
              />{" "}
              {col.label}
            </label>
          ))}
        </div>
        <div
          style={{
            marginTop: "8px",
            display: "flex",
            gap: "10px",
            alignItems: "center"
          }}
        >
          <Button size="small" variant="outlined" onClick={toggleSelectAll}>
            {selectedColumns.length === exportableColumns.length
              ? "Deselect All"
              : "Select All"}
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={exportToPDF}
          >
            Export PDF
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={exportToCSV}
          >
            Export CSV
          </Button>
        </div>
      </div> */}

      <div
        className="filters-section"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "16px"
        }}
      >
        {/* Left: Records per page */}
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
                value === "All" ? coordinatorTickets.length : parseInt(value)
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

        {/* Right: Search and Status */}
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

      {/* Table */}
      <div className="coordinator-list-section">
      <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between", // pushes h2 left and icon right
    marginBottom: "10px"
  }}
>
  <h2 style={{ margin: 0 }}>Tickets of Category Complaints</h2>
  <IconButton onClick={() => setIsExportModalOpen(true)} Tooltip="Export Settings">
    <FiSettings size={20} />
  </IconButton>
</div>

<table className="coordinator-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length > 0 ? (
              paginatedTickets.map((ticket, i) => (
                <tr key={ticket.id}>
                  <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>

                  <td>{`${ticket.firstName} ${ticket.lastName}`}</td>
                  <td>{ticket.phone_number}</td>
                  <td>{ticket.status}</td>
                  <td>{ticket.complaintType || "Unrated"}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-ticket-details-btn"
                        title="View"
                        onClick={() => openModal(ticket)}
                      >
                        <FaEye />
                      </button>
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

                      <select
                        className="btn select"
                        value={convertCategory[ticket.id] || ""}
                        onChange={(e) =>
                          setConvertCategory((prev) => ({
                            ...prev,
                            [ticket.id]: e.target.value
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
                      <button
                        className="btn convert"
                        onClick={() => handleConvertOrForward(ticket.id)}
                      >
                        Convert
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "red" }}>
                  {ticketsError || "No complaints found."}
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

      {/* Modal for Viewing Ticket Details */}

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
            p: 3
          }}
        >
          {selectedTicket && (
            <>
              {/* Ticket details here */}
              <Typography
                id="ticket-details-title"
                variant="h5"
                sx={{ fontWeight: "bold", color: "#1976d2" }}
              >
                Ticket Details
              </Typography>

              <Grid container spacing={2} id="ticket-details-description">
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Name:</strong>{" "}
                    {`${selectedTicket.firstName || "N/A"} ${
                      selectedTicket.middleName || "N/A"
                    } ${selectedTicket.lastName || "N/A"}`}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Phone:</strong>{" "}
                    {selectedTicket.phoneNumber || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>NIDA:</strong> {selectedTicket.nidaNumber || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Institution:</strong>{" "}
                    {selectedTicket.institution || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Region:</strong> {selectedTicket.region || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>District:</strong>{" "}
                    {selectedTicket.district || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Subject:</strong> {selectedTicket.subject || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Sub-category:</strong>{" "}
                    {selectedTicket.sub_category || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Channel:</strong> {selectedTicket.channel || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Complaint Type:</strong>{" "}
                    {selectedTicket.complaintType || "Unrated"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Priority:</strong>{" "}
                    <span
                      style={{
                        color:
                          selectedTicket.priority === "Urgent"
                            ? "red"
                            : selectedTicket.priority === "High"
                            ? "orange"
                            : "inherit"
                      }}
                    >
                      {selectedTicket.priority || "N/A"}
                    </span>
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
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
                  <Typography variant="body1">
                    <strong>Created By:</strong>{" "}
                    {selectedTicket?.createdBy?.name || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Assigned To (User ID):</strong>{" "}
                    {selectedTicket.assigned_to_id || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Assigned Role:</strong>{" "}
                    {selectedTicket.assigned_to_role || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Created At:</strong>{" "}
                    {selectedTicket.createdAt
                      ? new Date(selectedTicket.createdAt).toLocaleString()
                      : "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body1">
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
                  alignItems: "center",
                  justifyContent: "flex-end"
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

                {/* Convert Section */}
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

                {/* Forward Section */}
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
                <Button color="primary" onClick={closeModal}>
                  Close
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

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
