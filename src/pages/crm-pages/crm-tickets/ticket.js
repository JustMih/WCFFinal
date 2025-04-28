import React, { useState, useEffect } from "react";
import "./ticket.css";
import { baseURL } from "../../../config";
import { FaEye, FaPlus } from "react-icons/fa";
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
  const [search, setSearch] = useState(""); // Added search state
  const [currentPage, setCurrentPage] = useState(1); // Added pagination state
  const [ticketsPerPage] = useState(7); // Number of tickets per page
  

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [modal, setModal] = useState({
    isOpen: false,
    type: "",
    message: "",
  });

useEffect(() => {
  const userId = localStorage.getItem("userId");
  if (userId) {
    setUserId(userId);
    console.log("user id is:", userId);
  } else {
    console.log("userId not found in localStorage");
  }
}, []);

  

  useEffect(() => {
    if (userId) {
      fetchAgentTickets();
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
        setAgentTicketsError("Authentication error. Please log in again.");
        return;
      }

      const url = `${baseURL}/ticket/open/${userId}`; // Fixed to use dynamic userId
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setAgentTickets([]);
          setAgentTicketsError("No tickets found for this agent.");
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.tickets)) {
        setAgentTickets(data.tickets);
        setAgentTicketsError(null);
      } else {
        setAgentTickets([]);
        setAgentTicketsError("No tickets found for this agent.");
      }
    } catch (error) {
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

  const openModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    setModal({ isOpen: false, type: "", message: "" });
  };

  // Filter tickets based on search
  const filteredTickets = agentTickets.filter((ticket) =>
    `${ticket.firstName || ""} ${ticket.middleName || ""} ${
      ticket.lastName || ""
    }`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Pagination logic
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredTickets.slice(
    indexOfFirstTicket,
    indexOfLastTicket
  );

  return (
    <div className="ticket-table-container">
      <h2 className="table-title">Tickets List</h2>
      <div className="controls">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        {/* <button className="add-ticket-button">
          <FaPlus /> Add Ticket
        </button> */}
      </div>
      <div className="ticket-table-wrapper">
        <table className="ticket-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Name</th>
              <th>Phone Number</th>
              <th>Title</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentTickets.length > 0 ? (
              currentTickets.map((ticket, index) => (
                <tr key={ticket.id || index}>
                  <td>{indexOfFirstTicket + index + 1}</td>
                  <td>
                    {ticket.firstName || ""} {ticket.middleName || ""}{" "}
                    {ticket.lastName || ""}
                  </td>
                  <td>{ticket.phoneNumber || "N/A"}</td>
                  <td>{ticket.title || "N/A"}</td>
                  <td>{ticket.status || "N/A"}</td>
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
                <td colSpan="6" style={{ textAlign: "center", color: "red" }}>
                  {agentTicketsError || "No tickets found for this agent."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        {Array.from(
          { length: Math.ceil(filteredTickets.length / ticketsPerPage) },
          (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={currentPage === i + 1 ? "active" : ""}
            >
              {i + 1}
            </button>
          )
        )}
        
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
                    <strong>Institution:</strong>{" "}
                    {selectedTicket.institution || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Title:</strong> {selectedTicket.title || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1">
                    <strong>Description:</strong>{" "}
                    {selectedTicket.description || "N/A"}
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
                            : "blue",
                      }}
                    >
                      {selectedTicket.status || "N/A"}
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