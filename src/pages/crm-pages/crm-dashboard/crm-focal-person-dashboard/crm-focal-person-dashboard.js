import React, { useState, useEffect } from "react";
import axios from "axios";

// React Icons
import { FaEye } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import {
  MdOutlineSupportAgent,
  MdImportExport
} from "react-icons/md";

// MUI Components
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
  MenuItem
} from "@mui/material";

// Custom Components
import Card from "../../../../components/card/card";
import ColumnSelector from "../../../../components/colums-select/ColumnSelector";
import TicketFilters from "../../../../components/ticket/TicketFilters";

// Config
import { baseURL } from "../../../../config";

// Styles
import "./crm-focal-person-dashboard.css";

export default function FocalPersonDashboard() {
  const [tickets, setTickets] = useState([]);
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeColumns, setActiveColumns] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    nidaSearch: "",
    status: "",
    priority: "",
    category: "",
    startDate: null,
    endDate: null
  });
  const [resolutionType, setResolutionType] = useState("");
  const [resolutionDetails, setResolutionDetails] = useState("");

  // Dashboard Stats
  const [newTickets, setNewTickets] = useState({
    "New Tickets": 0,
    "Escalated Tickets": 0
  });
  const [totalTickets, setTotalTickets] = useState({
    "Total Inquiries": 0,
    "Resolved Inquiries": 0
  });
  const [ticketCategories, setTicketCategories] = useState({
    "Open Inquiries": 0,
    "Closed Inquiries": 0
  });
  const [ticketStatus, setTicketStatus] = useState({
    "On Progress": 0,
    "Closed": 0,
    "Total": 0
  });

  // Initialize activeColumns with default columns if empty
  useEffect(() => {
    if (activeColumns.length === 0) {
      setActiveColumns([
        "id",
        "fullName",
        "phone_number",
        "status",
        "subject",
        "category",
        "assigned_to_role",
        "createdAt"
      ]);
    }
  }, [activeColumns]);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");

    if (!id || !token) {
      setSnackbar({
        open: true,
        message: "Please log in to access tickets.",
        severity: "error"
      });
      return;
    }

    setUserId(id);
    fetchTickets();
    fetchDashboardCounts(id);
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("authToken");
      console.log('Fetching tickets with token:', token);
      
      const response = await fetch(`${baseURL}/focal-person/new-tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      
      const data = await response.json();
      console.log('Raw API Response:', data);

      // Directly use the inquiries from the response
      setTickets(data.inquiries || []);
      console.log('Tickets set in state:', data.inquiries);

      if (!data.inquiries?.length) {
        console.log('No tickets found');
        setSnackbar({
          open: true,
          message: "No tickets found",
          severity: "info"
        });
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setSnackbar({
        open: true,
        message: `Error fetching tickets: ${error.message}`,
        severity: "error"
      });
    }
  };

  // Add effect to log tickets whenever they change
  useEffect(() => {
    console.log('Current tickets in state:', tickets);
  }, [tickets]);

  const fetchDashboardCounts = async (id) => {
    setLoading(true);
    const token = localStorage.getItem("authToken");

    try {
      console.log('Fetching dashboard counts for ID:', id);
      
      const response = await axios.get(
        `${baseURL}/focal-person/dashboard-counts`,
        {
          headers: { 
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Dashboard counts response:', response.data);

      const data = response.data;

      if (data && typeof data === 'object') {
        // Set the dashboard counts based on the response
        setNewTickets({
          "New Tickets": data.newInquiries || 0,
          "Escalated Tickets": data.escalatedInquiries || 0
        });

        setTotalTickets({
          "Total Inquiries": data.totalInquiries || 0,
          "Resolved Inquiries": data.resolvedInquiries || 0
        });

        setTicketCategories({
          "Open Inquiries": data.openInquiries || 0,
          "Closed Inquiries": data.closedInquiries || 0
        });

        setTicketStatus({
          "On Progress": data.inProgressInquiries || 0,
          "Closed": data.closedInquiries || 0,
          "Total": data.totalInquiries || 0
        });
      } else {
        console.error('Invalid data structure received:', data);
        throw new Error('Invalid data structure received from server');
      }
    } catch (error) {
      console.error("Dashboard counts error:", error);
      console.error("Error response:", error.response?.data);
      
      // Set default values in case of error
      setNewTickets({
        "New Tickets": 0,
        "Escalated Tickets": 0
      });
      setTotalTickets({
        "Total Inquiries": 0,
        "Resolved Inquiries": 0
      });
      setTicketCategories({
        "Open Inquiries": 0,
        "Closed Inquiries": 0
      });
      setTicketStatus({
        "On Progress": 0,
        "Closed": 0,
        "Total": 0
      });

      setSnackbar({
        open: true,
        message: `Error fetching dashboard counts: ${error.response?.data?.message || error.message}`,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!resolutionType || !resolutionDetails) {
      setSnackbar({
        open: true,
        message: "Please provide both resolution type and details",
        severity: "warning"
      });
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${baseURL}/focal-person-tickets/${selectedTicket.id}/close`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            resolution_type: resolutionType,
            resolution_details: resolutionDetails
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to close ticket");
      }

      const data = await response.json();
      setTickets(tickets.map(ticket =>
        ticket.id === data.ticket.id ? data.ticket : ticket
      ));

      setSnackbar({
        open: true,
        message: "Ticket closed successfully",
        severity: "success"
      });

      closeModal();
      fetchDashboardCounts(userId);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error"
      });
    }
  };

  // Add useEffect for periodic refresh
  useEffect(() => {
    if (userId) {
      const refreshInterval = setInterval(() => {
        fetchTickets();
        fetchDashboardCounts(userId);
      }, 30000);

      return () => clearInterval(refreshInterval);
    }
  }, [userId]);

  const openModal = (ticket) => {
    setSelectedTicket(ticket);
    setResolutionType("");
    setResolutionDetails("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    setResolutionType("");
    setResolutionDetails("");
  };

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const filteredTickets = tickets.filter((ticket) => {
    console.log('Filtering ticket:', ticket);
    const searchValue = search.toLowerCase();
    const fullName = `${ticket.first_name || ""} ${ticket.middle_name || ""} ${ticket.last_name || ""}`.toLowerCase();

    let matches = (!searchValue || 
      ticket.phone_number?.toLowerCase().includes(searchValue) ||
      ticket.nida_number?.toLowerCase().includes(searchValue) ||
      fullName.includes(searchValue)
    ) && (!filterStatus || ticket.status === filterStatus);

    // Apply advanced filters
    if (filters.category) {
      matches = matches && ticket.category === filters.category;
    }
    if (filters.startDate) {
      matches = matches && new Date(ticket.created_at) >= new Date(filters.startDate);
    }
    if (filters.endDate) {
      matches = matches && new Date(ticket.created_at) <= new Date(filters.endDate);
    }

    return matches;
  });

  console.log('Filtered tickets:', filteredTickets);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  console.log('Paginated tickets to display:', paginatedTickets);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  return (
    <div className="focal-person-dashboard-container">
      <h2 className="title">Focal Person Dashboard</h2>

      {/* Cards */}
      <div className="crm-dashboard">
        <div className="crm-cards-container">
          <Card
            title="New Tickets"
            data={newTickets}
            color="#ceedea"
            icon={<MdOutlineSupportAgent fontSize={35} />}
          />
          <Card
            title="Total Tickets"
            data={totalTickets}
            color="#bce8be"
            icon={<MdOutlineSupportAgent fontSize={35} />}
          />
        </div>
        <div className="crm-cards-container">
          <Card
            title="Ticket Categories"
            data={ticketCategories}
            color="#b9c9ff"
            icon={<MdOutlineSupportAgent fontSize={35} />}
          />
          <Card
            title="Ticket Status"
            data={ticketStatus}
            color="#ffc4dd"
            icon={<MdImportExport fontSize={35} />}
          />
        </div>
      </div>

      <TicketFilters
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />

      {/* Table Section */}
      <div style={{ overflowX: "auto", width: "100%" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px"
        }}>
          <h2>Inquiry Tickets</h2>
          <Tooltip title="Columns Settings" arrow>
            <IconButton onClick={() => setIsColumnModalOpen(true)}>
              <FiSettings size={20} />
            </IconButton>
          </Tooltip>
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
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[5, 10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              className="search-input"
              type="text"
              placeholder="Search by phone or NIDA..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        <table className="user-table">
          <thead>
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
          </thead>
          <tbody>
            {paginatedTickets.length > 0 ? (
              paginatedTickets.map((ticket, i) => (
                <tr key={ticket.id}>
                  {activeColumns.includes("id") && (
                    <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                  )}
                  {activeColumns.includes("fullName") && (
                    <td>{`${ticket.first_name || ""} ${ticket.middle_name || ""} ${ticket.last_name || ""}`}</td>
                  )}
                  {activeColumns.includes("phone_number") && (
                    <td>{ticket.phone_number || "N/A"}</td>
                  )}
                  {activeColumns.includes("status") && (
                    <td>
                      <span style={{
                        color: ticket.status === "Open" ? "green" :
                               ticket.status === "Closed" ? "gray" :
                               "blue"
                      }}>
                        {ticket.status || "N/A"}
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
                    <Tooltip title="View Details">
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
                <td colSpan={activeColumns.length + 1} style={{ textAlign: "center", color: "red" }}>
                  No tickets found.
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
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            sx={{ marginLeft: 1 }}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Ticket Details Modal */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        aria-labelledby="ticket-details-title"
      >
        <Box sx={{
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
        }}>
          {selectedTicket && (
            <>
              <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1976d2", mb: 2 }}>
                Ticket Details #{selectedTicket.ticket_id}
              </Typography>

              {/* Personal Information Section */}
              <Typography variant="h6" sx={{ color: "#1976d2", mb: 1 }}>
                Personal Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Full Name:</strong> {`${selectedTicket.first_name || ""} ${selectedTicket.middle_name || ""} ${selectedTicket.last_name || ""}`}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Phone:</strong> {selectedTicket.phone_number || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Email:</strong> {selectedTicket.email || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>NIDA:</strong> {selectedTicket.nida_number || "N/A"}
                  </Typography>
                </Grid>
              </Grid>

              {/* Ticket Information Section */}
              <Typography variant="h6" sx={{ color: "#1976d2", mb: 1 }}>
                Ticket Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Category:</strong> {selectedTicket.category || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Status:</strong>{" "}
                    <span style={{
                      color: selectedTicket.status === "Open" ? "green" :
                             selectedTicket.status === "Closed" ? "gray" :
                             "blue"
                    }}>
                      {selectedTicket.status || "N/A"}
                    </span>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Subject:</strong> {selectedTicket.subject || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Created At:</strong> {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString("en-GB") : "N/A"}
                  </Typography>
                </Grid>
              </Grid>

              {/* Description Section */}
              <Typography variant="h6" sx={{ color: "#1976d2", mb: 1 }}>
                Description
              </Typography>
              <Box sx={{ mb: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                <Typography>
                  {selectedTicket.description || "No description provided"}
                </Typography>
              </Box>

              {/* Resolution Section - Only shown if ticket is not closed */}
              {selectedTicket.status !== "Closed" && (
                <>
                  <Typography variant="h6" sx={{ color: "#1976d2", mb: 1 }}>
                    Close Ticket
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12}>
                      <TextField
                        select
                        fullWidth
                        label="Resolution Type"
                        value={resolutionType}
                        onChange={(e) => setResolutionType(e.target.value)}
                        sx={{ mb: 2 }}
                      >
                        <MenuItem value="Resolved">Resolved</MenuItem>
                        <MenuItem value="Not Applicable">Not Applicable</MenuItem>
                        <MenuItem value="Duplicate">Duplicate</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Resolution Details"
                        multiline
                        rows={4}
                        value={resolutionDetails}
                        onChange={(e) => setResolutionDetails(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCloseTicket}
                        fullWidth
                      >
                        Close Ticket
                      </Button>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Resolution Details - Only shown if ticket is closed */}
              {selectedTicket.status === "Closed" && selectedTicket.resolution && (
                <>
                  <Typography variant="h6" sx={{ color: "#1976d2", mb: 1 }}>
                    Resolution
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12}>
                      <Typography>
                        <strong>Resolution Type:</strong> {selectedTicket.resolution.type || "N/A"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                        <Typography>
                          <strong>Resolution Details:</strong> {selectedTicket.resolution.details || "N/A"}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Close Modal Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={closeModal}>
                  Close Modal
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
        onColumnsChange={(selectedColumns) => {
          if (selectedColumns.length === 0) {
            setActiveColumns([
              "id",
              "fullName",
              "phone_number",
              "status",
              "subject",
              "category",
              "assigned_to_role",
              "createdAt"
            ]);
          } else {
            setActiveColumns(selectedColumns);
          }
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
}
