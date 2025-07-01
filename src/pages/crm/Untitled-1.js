import React, { useState, useEffect } from "react";
import "./coordinator-dashboard.css";
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
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const categories = ["Complaint", "Congrats", "Suggestion"];

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
      await fetch(`${baseURL}/api/tickets/${ticketId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ complaintType: rating })
      });
      setSnackbar({ open: true, message: `Rated as ${rating}`, severity: "success" });
      fetchCoordinatorTickets();
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  const handleConvert = async (ticketId) => {
    const category = convertCategory[ticketId];
    if (!category) return setSnackbar({ open: true, message: "Select category first", severity: "warning" });
    try {
      const token = localStorage.getItem("authToken");
      await fetch(`${baseURL}/api/coordinator/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ticketId, category })
      });
      setSnackbar({ open: true, message: `Converted to ${category}`, severity: "success" });
      fetchCoordinatorTickets();
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  const openModal = (ticket) => setIsModalOpen(true) || setSelectedTicket(ticket);
  const closeModal = () => setIsModalOpen(false) || setSelectedTicket(null);
  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const filteredTickets = coordinatorTickets.filter((t) => {
    const s = search.trim();
    return (!s || t.phone_number?.includes(s) || t.nida_number?.includes(s)) && (!filterStatus || t.status === filterStatus);
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Tickets Report", 14, 16);
    const headers = [["ID", "Name", "Phone", "Status", "Rating"]];
    const data = filteredTickets.map((ticket, i) => [
      i + 1,
      `${ticket.firstName} ${ticket.lastName}`,
      ticket.phone_number,
      ticket.status,
      ticket.complaintType || "Unrated"
    ]);
    autoTable(doc, { startY: 20, head: headers, body: data });
    doc.save("tickets-report.pdf");
  };

  

  const exportToCSV = () => {
    const csvData = filteredTickets.map((ticket) => ({
      Id: ticket.id,
      Name: `${ticket.firstName} ${ticket.middleName || ""} ${ticket.lastName}`,
      Phone: ticket.phone_number,
      NIDA: ticket.nida_number,
      Subject: ticket.subject || "N/A",
      Category: ticket.category || "N/A",
      Description: ticket.description || "N/A",
      AssignedRole: ticket.assigned_to_role || "N/A",
      Status: ticket.status || "N/A",
      CreatedAt: ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "N/A",
      CreatedBy: ticket.createdBy?.name || "N/A"
    }));
  
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
  


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  return (
    <div className="coordinator-dashboard-container">
      <h2 className="title">Coordinator Dashboard</h2>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {["Total Complaints", "Pending Rating", "Rated Major", "Rated Minor"].map((label, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1">{label}</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: Object.values(ticketStats)[i] > 0 ? "#1976d2" : "gray" }}>
                  {Object.values(ticketStats)[i]}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <div className="filters-section">
        <input className="search-input" type="text" placeholder="Search by phone or NIDA" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      <div style={{ marginBottom: "16px", display: "flex", gap: "12px" }}>
        <Button variant="contained" color="primary" onClick={exportToPDF}>Export PDF</Button>
        <Button variant="outlined" color="primary" onClick={exportToCSV}>Export CSV</Button>
      </div>

      
            {/* Table */}
            <div className="coordinator-list-section">
              <h2>Tickets of Category Complaints</h2>
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
                            <button
                              className="btn minor"
                              onClick={() => handleRating(ticket.id, "Minor")}
                            >
                              Minor
                            </button>
                            <button
                              className="btn major"
                              onClick={() => handleRating(ticket.id, "Major")}
                            >
                              Major
                            </button>
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
                              onClick={() => handleConvert(ticket.id)}
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
  <span>Page {currentPage} of {totalPages}</span>
  <Button
    variant="outlined"
    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
                    <Typography
                      id="ticket-details-title"
                      variant="h5"
                      component="h3"
                      gutterBottom
                      sx={{ fontWeight: "bold", color: "#1976d2" }}
                    >
                      Ticket Details
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2} id="ticket-details-description">
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <strong>Name:</strong>{" "}
                          {`${selectedTicket.firstName || ""} ${
                            selectedTicket.middleName || ""
                          } ${selectedTicket.lastName || ""}`}
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
                    <Box sx={{ mt: 3, textAlign: "right" }}>
                      <Button
                        // variant="contained"
                        color="primary"
                        onClick={closeModal}
                      >
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
