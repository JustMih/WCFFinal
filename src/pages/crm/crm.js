import React, { useState, useEffect } from "react";
import "./crm.css";
import { baseURL } from "../../config"; // Adjust path as needed
import { FaEye } from "react-icons/fa";
import {
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert,
  Modal,
  Box,
  Button,
  Typography,
  Divider,
  Grid,
} from "@mui/material";

export default function CoordinatorDashboard() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    nidaNumber: "",
    title: "",
    description: "",
    complaintType: "", // Changed from priority to match dashboard context
    status: "Open",
  });

  const [ticketStats, setTicketStats] = useState({
    totalComplaints: 0,
    pendingRating: 0,
    ratedMajor: 0,
    ratedMinor: 0,
  });

  const [coordinatorTickets, setCoordinatorTickets] = useState([]);
  const [ticketsError, setTicketsError] = useState(null);
  const [userId, setUserId] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Fetch userId from localStorage on mount
  useEffect(() => {
    const id = localStorage.getItem("userId");
    setUserId(id);
  }, []);

  // Fetch tickets when userId is available
  useEffect(() => {
    if (userId) {
      fetchCoordinatorTickets();
    }
  }, [userId]);

  const fetchCoordinatorTickets = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setTicketsError("Authentication error. Please log in again.");
        return;
      }

      const url = `${baseURL}/api/tickets?type=complaint`; // Adjust endpoint as needed
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setCoordinatorTickets([]);
          setTicketsError("No tickets found.");
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched tickets:", data);

      if (Array.isArray(data)) {
        setCoordinatorTickets(data);
        setTicketsError(null);
        updateTicketStats(data);
      } else {
        setCoordinatorTickets([]);
        setTicketsError("No tickets found.");
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setTicketsError(error.message);
    }
  };

  const updateTicketStats = (tickets) => {
    setTicketStats({
      totalComplaints: tickets.length,
      pendingRating: tickets.filter((t) => !t.complaintType).length,
      ratedMajor: tickets.filter((t) => t.complaintType === "Major").length,
      ratedMinor: tickets.filter((t) => t.complaintType === "Minor").length,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/api/tickets`, { // Adjust endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: "Ticket created successfully!",
          severity: "success",
        });
        setFormData({
          firstName: "",
          lastName: "",
          phoneNumber: "",
          nidaNumber: "",
          title: "",
          description: "",
          complaintType: "",
          status: "Open",
        });
        fetchCoordinatorTickets(); // Refresh tickets
      } else {
        setSnackbar({
          open: true,
          message: result.message || "Failed to create ticket",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error creating ticket: " + error.message,
        severity: "error",
      });
    }
  };

  const handleRating = async (ticketId, rating) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/api/tickets/${ticketId}/rate`, { // Adjust endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ complaintType: rating }),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: `Ticket rated as ${rating}`,
          severity: "success",
        });
        fetchCoordinatorTickets(); // Refresh tickets
      } else {
        throw new Error("Failed to rate ticket");
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error rating ticket: " + error.message,
        severity: "error",
      });
    }
  };

  const handleConvert = async (ticketId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/api/tickets/${ticketId}/convert`, { // Adjust endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: "Ticket converted successfully",
          severity: "success",
        });
        fetchCoordinatorTickets(); // Refresh tickets
      } else {
        throw new Error("Failed to convert ticket");
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error converting ticket: " + error.message,
        severity: "error",
      });
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

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <div>
      <h2 className="title">Coordinator Dashboard</h2>
      <div className="crm-container">
        {/* Ticket Creation Form */}
        <div className="ticket-form-section">
          <h2>Create New Complaint</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name:</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Enter first name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name:</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number:</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label htmlFor="nidaNumber">NIDA Number:</label>
                <input
                  type="text"
                  id="nidaNumber"
                  name="nidaNumber"
                  value={formData.nidaNumber}
                  onChange={handleChange}
                  placeholder="Enter NIDA number"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="title">Title:</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter complaint title"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Describe the complaint"
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="complaintType">Complaint Type:</label>
                <select
                  id="complaintType"
                  name="complaintType"
                  value={formData.complaintType}
                  onChange={handleChange}
                >
                  <option value="">Select Type</option>
                  <option value="Minor">Minor</option>
                  <option value="Major">Major</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="status">Status:</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <button type="submit" className="submit-button">
              Submit Complaint
            </button>
          </form>
        </div>

        {/* Ticket Statistics */}
        <div className="ticket-stats-section">
          <h2>Ticket Statistics</h2>
          <div className="stats-summary">
            <div className="stat-box">
              <h3>Total Complaints</h3>
              <p>{ticketStats.totalComplaints}</p>
            </div>
            <div className="stat-box">
              <h3>Pending Rating</h3>
              <p>{ticketStats.pendingRating}</p>
            </div>
            <div className="stat-box">
              <h3>Rated Major</h3>
              <p>{ticketStats.ratedMajor}</p>
            </div>
            <div className="stat-box">
              <h3>Rated Minor</h3>
              <p>{ticketStats.ratedMinor}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="ticket-list-section">
        <h2>My Complaints</h2>
        <div className="ticket-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Title</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coordinatorTickets.length > 0 ? (
                coordinatorTickets.map((ticket, index) => (
                  <tr key={ticket.id || index}>
                    <td>{index + 1}</td>
                    <td>{`${ticket.firstName} ${ticket.lastName}`}</td>
                    <td>{ticket.phoneNumber}</td>
                    <td>{ticket.title}</td>
                    <td>{ticket.status}</td>
                    <td>{ticket.complaintType || "Unrated"}</td>
                    <td>
                      <Tooltip title="View Details">
                        <button
                          className="view-ticket-details-btn"
                          onClick={() => openModal(ticket)}
                        >
                          <FaEye />
                        </button>
                      </Tooltip>
                      <Button
                        onClick={() => handleRating(ticket.id, "Minor")}
                        size="small"
                        className="action-btn minor-btn"
                      >
                        Minor
                      </Button>
                      <Button
                        onClick={() => handleRating(ticket.id, "Major")}
                        size="small"
                        className="action-btn major-btn"
                      >
                        Major
                      </Button>
                      <Button
                        onClick={() => handleConvert(ticket.id)}
                        variant="outlined"
                        size="small"
                        className="action-btn convert-btn"
                      >
                        Convert
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: "red" }}>
                    {ticketsError || "No complaints found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Ticket Details */}
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
            width: { xs: "90%", sm: 500 },
            maxHeight: "80vh",
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
                component="h3"
                gutterBottom
                sx={{ fontWeight: "bold", color: "#1976d2" }}
              >
                Complaint Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2} id="ticket-details-description">
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Name:</strong> {`${selectedTicket.firstName} ${selectedTicket.lastName}`}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Phone:</strong> {selectedTicket.phoneNumber}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>NIDA:</strong> {selectedTicket.nidaNumber || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Title:</strong> {selectedTicket.title}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1">
                    <strong>Description:</strong> {selectedTicket.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Type:</strong> {selectedTicket.complaintType || "Unrated"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        color:
                          selectedTicket.status === "Open" ? "green" : "gray",
                      }}
                    >
                      {selectedTicket.status}
                    </span>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Date:</strong>{" "}
                    {selectedTicket.createdAt
                      ? new Date(selectedTicket.createdAt).toLocaleDateString()
                      : "N/A"}
                  </Typography>
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, textAlign: "right" }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={closeModal}
                  sx={{ minWidth: 100 }}
                >
                  Close
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}