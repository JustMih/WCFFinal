import React, { useState, useEffect } from "react";
import { FaEye, FaPlus, FaBell } from "react-icons/fa";
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
  TextField
} from "@mui/material";
import ColumnSelector from "../../../components/colums-select/ColumnSelector";
import { baseURL } from "../../../config";
import "./notifications.css";
import { useQuery } from "@tanstack/react-query";

export default function Crm() {
  const [agentTickets, setAgentTickets] = useState([]);
  const [agentTicketsError, setAgentTicketsError] = useState(null);
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState("");
  const [modal, setModal] = useState({ isOpen: false, type: "", message: "" });
  const [activeColumns, setActiveColumns] = useState([
    "id",
    "fullName",
    "phone_number",
    "status",
    "subject",
    "category",
    "assigned_to_role",
    "createdAt"
  ]);
  const [loading, setLoading] = useState(true);
  const [notifiedCount, setNotifiedCount] = useState(0);
  const [showType, setShowType] = useState('manual'); // 'manual' or 'system'

  // Fetch notifications for the selected ticket and user
  const { data: notificationHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: [
      "ticketNotifications",
      selectedTicket?.ticket?.id ||
        selectedTicket?.ticket_id ||
        selectedTicket?.id,
      userId
    ],
    queryFn: async () => {
      const ticketId =
        selectedTicket?.ticket?.id ||
        selectedTicket?.ticket_id ||
        selectedTicket?.id;
      if (!ticketId || !userId) return { notifications: [] };
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${baseURL}/notifications/ticket/${ticketId}/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const data = await response.json();
      // Defensive: ensure notifications is an array and sort
      const notifications = Array.isArray(data.notifications)
        ? data.notifications.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          )
        : [];
      return { notifications };
    },
    enabled: !!(
      (selectedTicket?.ticket?.id ||
        selectedTicket?.ticket_id ||
        selectedTicket?.id) && userId
    )
  });

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setUserId(userId);
      console.log("user id is:", userId);
      // Fetch notified tickets count
      const token = localStorage.getItem("authToken");
      if (token) {
        fetch(`${baseURL}/notifications/notified-tickets-count/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then((res) => {
            const contentType = res.headers.get("content-type");
            if (
              !res.ok ||
              !contentType ||
              !contentType.includes("application/json")
            ) {
              throw new Error("Invalid response");
            }
            return res.json();
          })
          .then((data) => setNotifiedCount(data.notifiedTicketCount || 0))
          .catch((err) => {
            setNotifiedCount(0); // fallback
            // Optionally log or show error
          });
      }
    } else {
      setAgentTicketsError("User not authenticated. Please log in.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchAgentTickets();
    }
  }, [userId]);

  const fetchAgentTickets = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication error. Please log in again.");
      }

      const url = `${baseURL}/ticket/assigned-notified/${userId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
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
      console.log("Fetched tickets (full API response):", data);
      if (data.notifications && Array.isArray(data.notifications)) {
        data.notifications.forEach((notif, idx) => {
          console.log(`Notification #${idx + 1}:`, notif);
          if (notif.ticket) {
            console.log(`Ticket for notification #${idx + 1}:`, notif.ticket);
          }
        });
      }
      if (data && Array.isArray(data.tickets)) {
        setAgentTickets(data.tickets);
        setAgentTicketsError(null);
      } else if (data && Array.isArray(data.Tickets)) {
        setAgentTickets(data.Tickets);
        setAgentTicketsError(null);
      } else if (data && Array.isArray(data.notifications)) {
        setAgentTickets(data.notifications);
        setAgentTicketsError(null);
      } else {
        setAgentTickets([]);
        setAgentTicketsError("No tickets found for this agent.");
      }
    } catch (error) {
      setAgentTicketsError(error.message);
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
      const response = await fetch(
        `${baseURL}/ticket/update/${selectedTicket.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ comments })
        }
      );

      if (response.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: "Comments updated successfully."
        });
        fetchAgentTickets();
      } else {
        const data = await response.json();
        setModal({
          isOpen: true,
          type: "error",
          message: data.message || "Failed to update comments."
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        message: `Network error: ${error.message}`
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

  const handleNotificationClick = (ticket) => {
    setSelectedTicket(ticket);
    setIsNotificationModalOpen(true);
  };

  const handleNotificationModalClose = () => {
    setIsNotificationModalOpen(false);
    setSelectedTicket(null);
  };

  const renderNotificationHistory = () => {
    if (isLoadingHistory) {
      return <div className="loading-message">Loading notifications...</div>;
    }

    if (!notificationHistory?.notifications?.length) {
      return <div className="no-notifications">No notifications found</div>;
    }

    // Use MUI Box and Typography for consistent style
    return (
      <div className="notification-list" style={{ padding: 0 }}>
        {notificationHistory.notifications.map((notification, index) => {
          const dateStr = notification.created_at
            ? new Date(notification.created_at).toLocaleDateString("en-US")
            : "—";
          return (
            <Box
              key={index}
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: '#fff',
                border: '2px solid #1976d2',
                boxShadow: '0 2px 4px rgba(25,118,210,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                maxWidth: 420,
                minWidth: 260,
                margin: '0 auto',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(25,118,210,0.13)',
                  borderColor: '#1565c0'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                  {notification.ticket?.ticket_id || 'N/A'}
                </Typography>
                <Typography
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '12px',
                    color: 'white',
                    background: notification.status === 'Closed' ? '#757575' : '#1976d2',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    minWidth: 70,
                    textAlign: 'center'
                  }}
                >
                  {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                </Typography>
              </Box>
              <Box sx={{ mt: 1, background: '#f3f7fa', borderRadius: 2, p: 1.5 }}>
                <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                  <strong>Created:</strong>{' '}
                  {notification.created_at
                    ? new Date(notification.created_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      })
                    : "N/A"}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: '#333', mb: 1 }}>
                  <strong>Subject:</strong> {notification.ticket?.subject || 'N/A'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    mb: 1
                  }}
                >
                  <strong>Description:</strong> {notification.ticket?.description || 'N/A'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <strong>Message:</strong> {notification.comment || 'N/A'}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </div>
    );
  };

  // Group notifications by ticket ID and keep only the latest manual notification per ticket (with comment)
  const uniqueTickets = [];
  const seenTicketIds = new Set();
  agentTickets.forEach((notif) => {
    const ticketId = notif.ticket?.id || notif.ticket_id || notif.id;
    if (notif.comment && notif.comment.trim() !== '' && !seenTicketIds.has(ticketId)) {
      uniqueTickets.push(notif);
      seenTicketIds.add(ticketId);
    }
  });

  const manualNotifications = uniqueTickets.filter(
    notif => notif.comment && notif.comment.trim() !== ''
  );

  const systemNotifications = uniqueTickets.filter(
    notif => notif.comment || notif.comment.trim() === ''
  );

  // Use filtered list based on toggle
  const filteredTickets = (showType === 'manual' ? manualNotifications : systemNotifications).filter((ticket) => {
    const searchValue = search.toLowerCase();
    const phone = (ticket.phone_number || "").toLowerCase();
    const nida = (ticket.nida_number || "").toLowerCase();
    const fullName = `${ticket.first_name || ""} ${ticket.middle_name || ""} ${ticket.last_name || ""}`.toLowerCase();
    return (
      (phone.includes(searchValue) ||
        nida.includes(searchValue) ||
        fullName.includes(searchValue)) &&
      (!filterStatus || ticket.status === filterStatus)
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
      <th style={{ textAlign: "center" }}>Actions</th>
    </tr>
  );

  const renderTableRow = (ticket, index) => (
    <tr key={ticket.id || index}>
      {activeColumns.includes("id") && (
        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
      )}
      {activeColumns.includes("fullName") && (
        <td>
          {ticket.ticket?.first_name
            ? `${ticket.ticket?.first_name || ""} ${
                ticket.ticket?.middle_name || ""
              } ${ticket.ticket?.last_name || ""}`.trim()
            : ticket.ticket?.institution || "N/A"}
        </td>
      )}
      {activeColumns.includes("phone_number") && (
        <td>{ticket.ticket?.phone_number || "N/A"}</td>
      )}
      {activeColumns.includes("status") && (
        <td>
          <span
            style={{
              color:
                ticket.ticket?.status === "Open"
                  ? "green"
                  : ticket.ticket?.status === "Closed"
                  ? "gray"
                  : "blue"
            }}
          >
            {ticket.ticket?.status || "N/A"}
          </span>
        </td>
      )}
      {activeColumns.includes("subject") && (
        <td>{ticket.ticket?.subject || "N/A"}</td>
      )}
      {activeColumns.includes("category") && (
        <td>{ticket.ticket?.category || "N/A"}</td>
      )}
      {activeColumns.includes("assigned_to_role") && (
        <td>{ticket.ticket?.assigned_to_role || "N/A"}</td>
      )}
      {activeColumns.includes("createdAt") && (
        <td>
          {ticket.ticket?.created_at
            ? new Date(ticket.ticket?.created_at).toLocaleString("en-GB", {
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
        <div className="action-buttons">
          <Tooltip title="View Notifications">
            <button
              className="view-ticket-details-btn"
              onClick={() => openModal(ticket)}
            >
              <FaBell />
            </button>
          </Tooltip>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="p-6">
        <h3 className="title">Loading...</h3>
      </div>
    );
  }

  return (
    <div className="coordinator-dashboard-container">
      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <span
          style={{
            background: "red",
            color: "white",
            borderRadius: "12px",
            padding: "4px 12px",
            fontWeight: "bold",
            fontSize: "1rem"
          }}
        >
          Total Notified Tickets: {notifiedCount}
        </span>
      </div>
      {/* Toggle Tabs for Manual/System Notifications */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setShowType('manual')}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            border: showType === 'manual' ? '2px solid #1976d2' : '1px solid #ccc',
            background: showType === 'manual' ? '#e3f0fd' : '#fff',
            color: showType === 'manual' ? '#1976d2' : '#333',
            fontWeight: showType === 'manual' ? 700 : 400,
            cursor: 'pointer',
            outline: 'none',
            boxShadow: showType === 'manual' ? '0 2px 8px rgba(25,118,210,0.08)' : 'none'
          }}
        >
          Manual Notifications
        </button>
        <button
          onClick={() => setShowType('system')}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            border: showType === 'system' ? '2px solid #1976d2' : '1px solid #ccc',
            background: showType === 'system' ? '#e3f0fd' : '#fff',
            color: showType === 'system' ? '#1976d2' : '#333',
            fontWeight: showType === 'system' ? 700 : 400,
            cursor: 'pointer',
            outline: 'none',
            boxShadow: showType === 'system' ? '0 2px 8px rgba(25,118,210,0.08)' : 'none'
          }}
        >
          System/Email Notifications
        </button>
      </div>
      <div style={{ overflowX: "auto", width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px"
          }}
        >
          <h2>Notification Tickets List </h2>
          <Tooltip title="Columns Settings and Export" arrow>
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
                const value = e.target.value;
                setItemsPerPage(
                  value === "All" ? filteredTickets.length : parseInt(value)
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
              placeholder="Search by phone or NIDA..."
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
            {/* <button className="add-ticket-button">
              <FaPlus /> Add Ticket
            </button> */}
          </div>
        </div>

        <table className="ticket-table">
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
                  {agentTicketsError || "No tickets found for this agent."}
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
            width: { xs: "98vw", sm: 1050 },
            minHeight: 500,
            maxHeight: "90vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 0,
            display: "flex",
            flexDirection: "row"
          }}
        >
          {/* Left: Ticket Details */}
          <Box
            sx={{
              flex: 2,
              p: 4,
              borderRight: "1px solid #eee",
              overflowY: "auto",
              minWidth: 0,
              maxHeight: "90vh"
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
                <Divider sx={{ mb: 2 }} />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "16px",
                    width: "100%"
                  }}
                >
                  {[
                    // If no first_name, show Institution only; else show First Name and Last Name
                    ...(!selectedTicket.ticket?.first_name
                      ? [
                          [
                            "Institution",
                            selectedTicket.ticket?.institution || "N/A"
                          ]
                        ]
                      : [
                          [
                            "Full Name",
                            `${selectedTicket.ticket?.first_name || ""} ${
                              selectedTicket.ticket?.last_name || ""
                            }`.trim() || "N/A"
                          ]
                        ]),
                    [
                      "Ticket Number",
                      selectedTicket.ticket?.ticket_id || "N/A"
                    ],
                    ["Phone", selectedTicket.ticket?.phone_number || "N/A"],
                    ["Requester", selectedTicket.ticket?.requester || "N/A"],
                    ["Region", selectedTicket.ticket?.region || "N/A"],
                    ["Channel", selectedTicket.ticket?.channel || "N/A"],
                    [
                      "Section",
                      selectedTicket.ticket?.responsible_unit_name || "Unit"
                    ],
                    [
                      "Sub-section",
                      selectedTicket.ticket?.sub_section || "N/A"
                    ],
                    ["Subject", selectedTicket.ticket?.subject || "N/A"],
                    [
                      "Created By",
                      selectedTicket.ticket?.creator?.name || "N/A"
                    ],
                    // Always show Assigned To and Assigned Role
                    [
                      "Assigned To",
                      selectedTicket.ticket?.assignee?.name || "N/A"
                    ],
                    [
                      "Assigned Role",
                      selectedTicket.ticket?.assigned_to_role || "N/A"
                    ]
                  ].map(([label, value], index) => (
                    <div
                      key={`left-${index}`}
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        border:
                          label === "Section" ||
                          label === "Sub-section" ||
                          label === "Subject"
                            ? "2px solid #e0e0e0"
                            : "none"
                      }}
                    >
                      <strong
                        style={{
                          minWidth: "120px",
                          color:
                            label === "Section" ||
                            label === "Sub-section" ||
                            label === "Subject"
                              ? "#1976d2"
                              : "#555",
                          fontSize: "0.9rem"
                        }}
                      >
                        {label}:
                      </strong>
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontSize: "0.9rem",
                          color:
                            label === "Section" ||
                            label === "Sub-section" ||
                            label === "Subject"
                              ? "#1976d2"
                              : "inherit"
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}

                  {/* Right Column */}
                  {[
                    [
                      "Status",
                      <span
                        style={{
                          color:
                            selectedTicket.ticket?.status === "Open"
                              ? "green"
                              : selectedTicket.ticket?.status === "Closed"
                              ? "gray"
                              : "blue"
                        }}
                      >
                        {selectedTicket.ticket?.status || "N/A"}
                      </span>
                    ],
                    ["NIDA", selectedTicket.ticket?.nida_number || "N/A"],
                    [
                      "Institution",
                      selectedTicket.ticket?.institution || "N/A"
                    ],
                    ["District", selectedTicket.ticket?.district || "N/A"],
                    ["Category", selectedTicket.ticket?.category || "N/A"],
                    [
                      "Rated",
                      <span
                        style={{
                          color:
                            selectedTicket.ticket?.complaint_type === "Major"
                              ? "red"
                              : selectedTicket.ticket?.complaint_type ===
                                "Minor"
                              ? "orange"
                              : "inherit"
                        }}
                      >
                        {selectedTicket.ticket?.complaint_type || "Unrated"}
                      </span>
                    ],
                    // Always show Assigned To and Assigned Role in right column as well
                    [
                      "Assigned To",
                      selectedTicket.ticket?.assignee?.name || "N/A"
                    ],
                    [
                      "Assigned Role",
                      selectedTicket.ticket?.assigned_to_role || "N/A"
                    ],
                    [
                      "Created At",
                      selectedTicket.ticket?.created_at
                        ? new Date(
                            selectedTicket.ticket?.created_at
                          ).toLocaleString("en-US", {
                            month: "numeric",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true
                          })
                        : "N/A"
                    ]
                  ].map(([label, value], index) => (
                    <div
                      key={`right-${index}`}
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                      }}
                    >
                      <strong
                        style={{
                          minWidth: "120px",
                          color: "#555",
                          fontSize: "0.9rem"
                        }}
                      >
                        {label}:
                      </strong>
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontSize: "0.9rem"
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Description - Full Width */}
                <div
                  style={{
                    width: "94%",
                    padding: "12px 16px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "flex-start",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    marginTop: "16px"
                  }}
                >
                  <strong
                    style={{
                      minWidth: "120px",
                      color: "#555",
                      fontSize: "0.9rem"
                    }}
                  >
                    Description:
                  </strong>
                  <span
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontSize: "0.9rem",
                      lineHeight: "1.5"
                    }}
                  >
                    {selectedTicket.ticket?.description || "N/A"}
                  </span>
                </div>

                <Box sx={{ mt: 3, textAlign: "right" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={closeModal}
                  >
                    Close
                  </Button>
                </Box>
              </>
            )}
          </Box>
          {/* Right: Notification History */}
          <Box
            sx={{
              flex: 1,
              p: 3,
              minWidth: 300,
              maxWidth: 350,
              overflowY: "auto"
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, color: "#1976d2" }}
            >
              Notification History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {renderNotificationHistory()}
          </Box>
        </Box>
      </Modal>

      {/* Notification Modal */}
      <Modal
        open={isNotificationModalOpen}
        onClose={handleNotificationModalClose}
        aria-labelledby="notification-modal-title"
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
          <Typography
            id="notification-modal-title"
            variant="h5"
            sx={{ fontWeight: "bold", color: "#1976d2", mb: 2 }}
          >
            Notification History
          </Typography>
          {selectedTicket && (
            <Typography
              variant="subtitle2"
              color="textSecondary"
              sx={{ mb: 2 }}
            >
              Ticket #{selectedTicket.ticket_id || "N/A"}
            </Typography>
          )}
          <Divider sx={{ mb: 2 }} />
          {renderNotificationHistory()}
          <Box sx={{ mt: 2, textAlign: "right" }}>
            <Button variant="contained" onClick={handleNotificationModalClose}>
              Close
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Column Selector */}
      <ColumnSelector
        open={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        data={agentTickets}
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
