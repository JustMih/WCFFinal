import React, { useState, useEffect } from "react";
import "./crm.css";
import { baseURL } from "../../config";
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

export default function Crm() {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phoneNumber: "",
    institution: "",
    title: "",
    description: "",
    priority: "Medium",
    status: "Open",
  });

  const [ticketStats, setTicketStats] = useState({
    todaysTickets: 0,
    closedTickets: 0,
    statusCounts: {
      open: 0,
      assigned: 0,
      closed: 0,
      carriedForward: 0,
      total: 0,
    },
  });

  const [agentTickets, setAgentTickets] = useState([]);
  const [agentTicketsError, setAgentTicketsError] = useState(null);
  const [userId, setUserId] = useState("");

  // ✅ Define modal state variables
  const [isModalOpen, setIsModalOpen] = useState(false); // Fix for "isModalOpen is not defined"
  const [selectedTicket, setSelectedTicket] = useState(null); // Stores the clicked ticket

  const [modal, setModal] = useState({
    isOpen: false,
    type: "",
    message: "",
  });

  // Set userId from localStorage when component mounts (matching Navbar)
  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, []);

  // Fetch data when userId is available
  useEffect(() => {
    if (userId) {
      // console.log('userId from state:', userId);
      // console.log('Full URL:', `${baseURL}/api/ticket/list/${userId}`);
      fetchAgentTickets();
    } else {
      // fetchAllTickets();
      console.log("Full URL:", `${baseURL}/api/ticket/all`);
    }
  }, [userId]);

  const fetchAgentTickets = async () => {
    try {
      if (!userId) {
        setAgentTicketsError("User not authenticated. Please log in.");
        return;
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("❌ Missing authentication token.");
        setAgentTicketsError("Authentication error. Please log in again.");
        return;
      }

      const url = `${baseURL}/ticket/list/${userId}`;
      console.log("🔗 Fetching tickets from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Response Status:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          setAgentTickets([]);
          setAgentTicketsError("No tickets found for this agent.");
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 API Response:", data);

      if (data && Array.isArray(data.tickets)) {
        setAgentTickets(data.tickets);
        setAgentTicketsError(null);
      } else {
        setAgentTickets([]);
        setAgentTicketsError("No tickets found for this agent.");
      }
    } catch (error) {
      console.error("❌ Error fetching agent tickets:", error);
      setAgentTicketsError(error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${baseURL}/ticket/create-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: "Ticket submitted successfully!",
        });
        setFormData({
          firstName: "",
          middleName: "",
          lastName: "",
          phoneNumber: "",
          institution: "",
          title: "",
          description: "",
          priority: "Medium",
          status: "Open",
        });
        // fetchTicketStats();
        fetchAgentTickets();
      } else {
        setModal({
          isOpen: true,
          type: "error",
          message: result.message || "Failed to submit ticket",
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        message: "Error submitting ticket: " + error.message,
      });
    }
  };

  // Function to open modal with selected ticket details
  const openModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };

  return (
    <div>
      <h2 className="title">CRM</h2>
      <div className="crm-container">
        <div className="ticket-form-section">
          <h2>Create New Ticket</h2>
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
                <label htmlFor="middleName">Middle Name:</label>
                <input
                  type="text"
                  id="middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  placeholder="Enter middle name"
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
                <label htmlFor="institution">Institution:</label>
                <input
                  type="text"
                  id="institution"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  required
                  placeholder="Enter institution name"
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
                placeholder="Enter ticket title"
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
                placeholder="Describe the issue"
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="priority">Priority:</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
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
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <button type="submit" className="submit-button">
              Submit Ticket
            </button>
          </form>
        </div>

        <div className="ticket-stats-section">
          <h2>Ticket Statistics</h2>
          <div className="stats-summary">
            <div className="stat-box">
              <h3>Today's Tickets</h3>
              <p>{ticketStats.todaysTickets}</p>
            </div>
            <div className="stat-box">
              <h3>Closed Tickets</h3>
              <p>{ticketStats.closedTickets}</p>
            </div>
          </div>

          <div className="stats-table">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Open Tickets</td>
                  <td>{ticketStats.statusCounts.open}</td>
                </tr>
                <tr>
                  <td>Assigned Tickets</td>
                  <td>{ticketStats.statusCounts.assigned}</td>
                </tr>
                <tr>
                  <td>Closed Tickets</td>
                  <td>{ticketStats.statusCounts.closed}</td>
                </tr>
                <tr>
                  <td>Carried Forward</td>
                  <td>{ticketStats.statusCounts.carriedForward}</td>
                </tr>
                <tr>
                  <td>Total Tickets</td>
                  <td>{ticketStats.statusCounts.total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="ticket-list-section">
        <h2>My Created Tickets</h2>
        <div className="ticket-table">
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Name</th>
                <th>phoneNumber</th>
                <th>Tittle</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {agentTickets.length > 0 ? (
                agentTickets.map((ticket, index) => (
                  <tr key={ticket.id}>
                    <td>{index + 1}</td>
                    <td>
                      {ticket.firstName} {ticket.middleName} {ticket.lastName}
                    </td>
                    <td>{ticket.phoneNumber}</td>
                    <td>{ticket.title}</td>
                    <td>{ticket.status}</td>

                    <td>
                        <Tooltip title="Ticket Details">
                          <button
                            className="view-ticket-details-btn"
                            onClick={() => openModal(ticket)}
                          >
                            <FaEye />
                          </button>
                        </Tooltip>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", color: "red" }}>
                    {agentTicketsError || "No tickets found for this agent."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
            width: { xs: "90%", sm: 500 }, // Responsive width
            maxHeight: "80vh", // Limit height to fit screen
            overflowY: "auto", // Scroll if content overflows
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 3, // Padding
          }}
        >
          {selectedTicket && (
            <>
              {/* Header */}
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

              {/* Content Grid */}
              <Grid container spacing={2} id="ticket-details-description">
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Name:</strong>{" "}
                    {`${selectedTicket.firstName} ${
                      selectedTicket.middleName || ""
                    } ${selectedTicket.lastName}`}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Phone:</strong> {selectedTicket.phoneNumber}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Institution:</strong> {selectedTicket.institution}
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
                    <strong>Priority:</strong>{" "}
                    <span
                      style={{
                        color:
                          selectedTicket.priority === "Urgent"
                            ? "red"
                            : selectedTicket.priority === "High"
                            ? "orange"
                            : "inherit",
                      }}
                    >
                      {selectedTicket.priority}
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
                            : "blue",
                      }}
                    >
                      {selectedTicket.status}
                    </span>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Created By:</strong>{" "}
                    {selectedTicket.createdBy || "N/A"}
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

              {/* Footer */}
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

      {modal.isOpen && (
        <div className="modal-overlay">
          <div className={`modal-content ${modal.type}`}>
            <h3>{modal.type === "success" ? "Success" : "Error"}</h3>
            <p>{modal.message}</p>
            <button onClick={closeModal} className="modal-close-button">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
