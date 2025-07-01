import React, { useState, useRef, useEffect } from "react";
import Card from "../../../components/card/card";
import { FiSettings } from "react-icons/fi";
import IconButton from "@mui/material/IconButton";
import { MdOutlineSupportAgent, MdOutlineRateReview } from "react-icons/md";
import { RiExchangeDollarLine } from "react-icons/ri";
import { FaRegCheckCircle } from "react-icons/fa";
import { TbArrowsExchange } from "react-icons/tb";
import { CiImport } from "react-icons/ci";
import { HiOutlineUserAdd } from "react-icons/hi";
import Tooltip from "@mui/material/Tooltip";

import { FaEye } from "react-icons/fa";
import {
  Snackbar,
  Alert,
  Modal,
  Box,
  Button,
  Grid,
  Typography
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { VscRefresh } from "react-icons/vsc";
import { CiNoWaitingSign } from "react-icons/ci";
import { TiTickOutline } from "react-icons/ti";
import { FiPhoneIncoming } from "react-icons/fi";
import { TbPhoneCheck, TbPhoneX } from "react-icons/tb";
import { HiPhoneOutgoing, HiOutlineMailOpen } from "react-icons/hi";
import { BsCollection } from "react-icons/bs";
import { UserAgent } from "sip.js"; // Correct SIP.js import
import { RiMailUnreadLine } from "react-icons/ri";
import { baseURL } from "../../../config";
import { FaEraser } from "react-icons/fa";
import {
  IoLogoWhatsapp,
  IoMdLogIn,
  IoMdCloseCircleOutline
} from "react-icons/io";
import { CgUnavailable } from "react-icons/cg";
import { FaHandHolding } from "react-icons/fa";
import { FaPersonWalkingArrowRight } from "react-icons/fa6";
import CallChart from "../../../components/call-chart/call-chart";
import "./coordinator-dashboard.css";

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
    { key: "id", label: "ID" },
    { key: "fullName", label: "Full Name" }, // <--- Virtual key
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

  const [selectedColumns, setSelectedColumns] = useState(
    exportableColumns.map((col) => col.key)
  );

  const toggleSelectAll = () => {
    if (selectedColumns.length === exportableColumns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(exportableColumns.map((col) => col.key));
    }
  };

  const defaultColumns = ["id", "name", "phone number", "status", "actions"];

  const getActiveColumns = () => {
    if (selectedColumns.length === 0) {
      return defaultColumns;
    }

    // Merge defaults and selected ones that are NOT already in defaults
    const combined = [...defaultColumns];

    selectedColumns.forEach((col) => {
      if (!combined.includes(col)) {
        combined.push(col);
      }
    });

    return combined;
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

  const totalTickets = {
    Directorate: 2,
    Units: 4
  };

  const newTickets = {
    Complaints: 12,
    "New Tickets": 20,
    "Escalated Tickets": 20
  };
  const convertedTickets = {
    Inqueries: 0,
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
  return (
    <div className="user-table-container">
      <h2 className="table-title">Users Management</h2>

      <div className="Controls">
        <h2>Tickets of Category Complaints</h2>

        <div
          style={{
            display: "flex",
            justifyContent: "right",
            marginBottom: "10px"
          }}
        >
          <Tooltip title="Colums Settings and Export" arrow>
            <IconButton onClick={() => setIsExportModalOpen(true)}>
              <FiSettings size={20} />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <table className="user-table">
        <thead>
          <tr>
            {/* <th>ID</th>
              <th>Ticket Id</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Rating</th> */}
            {getActiveColumns().includes("id") && <th>ID</th>}
            {getActiveColumns().includes("fullName") && <th>Full Name</th>}
            {getActiveColumns().includes("phone_number") && <th>Phone</th>}
            {getActiveColumns().includes("status") && <th>Status</th>}
            {/* {getActiveColumns().includes("nida_number") && <th>NIDA</th>} */}
            {getActiveColumns().includes("subject") && <th>Subject</th>}
            {getActiveColumns().includes("category") && <th>Category</th>}
            {/* {getActiveColumns().includes("description") && <th>Description</th>} */}
            {getActiveColumns().includes("assigned_to_role") && (
              <th>Assigned Role</th>
            )}
            {getActiveColumns().includes("createdAt") && <th>Created At</th>}
            {/* {getActiveColumns().includes("createdBy.name") && (
              <th>Created By</th>
            )} */}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTickets.length > 0 ? (
            paginatedTickets.map((ticket, i) => (
              <tr key={ticket.id}>
                {getActiveColumns().includes("id") && (
                  <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                )}
                {getActiveColumns().includes("fullName") && (
                  <td>{`${ticket.firstName || ""} ${ticket.middleName || ""} ${
                    ticket.lastName || ""
                  }`}</td>
                )}
                {getActiveColumns().includes("phone_number") && (
                  <td>{ticket.phone_number}</td>
                )}
                {getActiveColumns().includes("status") && (
                  <td>{ticket.status}</td>
                )}
                {/* {getActiveColumns().includes("nida_number") && (
                  <td>{ticket.nida_number}</td>
                )} */}
                {getActiveColumns().includes("subject") && (
                  <td>{ticket.subject}</td>
                )}
                {getActiveColumns().includes("category") && (
                  <td>{ticket.category}</td>
                )}
                {/* {getActiveColumns().includes("description") && (
                  <td>{ticket.description}</td>
                )} */}
                {getActiveColumns().includes("assigned_to_role") && (
                  <td>{ticket.assigned_to_role}</td>
                )}
                {getActiveColumns().includes("createdAt") && (
                  <td>
                    {new Date(ticket.createdAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true
                    })}
                  </td>
                )}

                {/* {getActiveColumns().includes("createdBy.name") && (
                  <td>{ticket.createdBy?.name}</td>
                )} */}
                <td>
                  <div className="action-buttons">
                    <button
                      className="view-ticket-details-btn"
                      title="View"
                      onClick={() => openModal(ticket)}
                    >
                      <FaEye />
                    </button>
                    {/* <Button
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
                                </Button> */}
                    {/* 
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
                                </button> */}
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

      {/* modal for colums selection on table */}
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
            {exportableColumns
              .filter((col) => !defaultColumns.includes(col.key)) // exclude defaults
              .map((col) => {
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
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                const optionalKeys = exportableColumns
                  .map((col) => col.key)
                  .filter((key) => !defaultColumns.includes(key));

                if (selectedColumns.length === optionalKeys.length) {
                  setSelectedColumns([]);
                } else {
                  setSelectedColumns(optionalKeys);
                }
              }}
            >
              {selectedColumns.length ===
              exportableColumns.filter(
                (col) => !defaultColumns.includes(col.key)
              ).length
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

      {/* Snackbar for notifications */}
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
