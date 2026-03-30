import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, MenuItem, Snackbar, TextField } from "@mui/material";
import { baseURL } from "../../../config";
import "./ticket.css";

const CLOSED_STATUSES = new Set(["closed", "resolved"]);

export default function OwnershipExchange() {
  const [tickets, setTickets] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, type: "info", message: "" });

  const role = localStorage.getItem("role");
  const canExchange = role === "admin" || role === "super-admin";

  const showMessage = (message, type = "info") => {
    setSnackbar({ open: true, type, message });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [ticketsRes, staffRes] = await Promise.all([
        fetch(`${baseURL}/ticket/all-customer-tickets`, { headers }),
        fetch(`${baseURL}/users/`, { headers }),
      ]);

      if (!ticketsRes.ok) {
        throw new Error("Failed to load tickets");
      }
      if (!staffRes.ok) {
        throw new Error("Failed to load staff list");
      }

      const ticketsPayload = await ticketsRes.json();
      const staffPayload = await staffRes.json();

      const allTickets = Array.isArray(ticketsPayload?.tickets) ? ticketsPayload.tickets : [];
      const eligibleTickets = allTickets.filter(
        (ticket) => !CLOSED_STATUSES.has(String(ticket?.status || "").trim().toLowerCase())
      );

      const users = Array.isArray(staffPayload) ? staffPayload : [];
      const eligibleUsers = users.filter((user) => user?.id && user?.role);

      setTickets(eligibleTickets);
      setStaff(eligibleUsers);
    } catch (error) {
      showMessage(error.message || "Failed to fetch ownership exchange data", "error");
      setTickets([]);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canExchange) return;
    fetchData();
  }, [canExchange]);

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tickets;
    return tickets.filter((ticket) => {
      const ticketId = String(ticket?.ticket_id || ticket?.id || "").toLowerCase();
      const subject = String(ticket?.subject || "").toLowerCase();
      const status = String(ticket?.status || "").toLowerCase();
      const assignedId = String(ticket?.assigned_to_id || "").toLowerCase();
      const assignedName = String(ticket?.assignee?.full_name || "").toLowerCase();
      return (
        ticketId.includes(term) ||
        subject.includes(term) ||
        status.includes(term) ||
        assignedId.includes(term) ||
        assignedName.includes(term)
      );
    });
  }, [tickets, search]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => String(ticket.id) === String(selectedTicketId)),
    [tickets, selectedTicketId]
  );

  const availableStaff = useMemo(() => {
    if (!selectedTicket?.assigned_to_id) return staff;
    return staff.filter((user) => String(user.id) !== String(selectedTicket.assigned_to_id));
  }, [staff, selectedTicket]);

  const handleSubmit = async () => {
    if (!selectedTicketId || !selectedStaffId) {
      showMessage("Select a ticket and a staff member first", "warning");
      return;
    }
    if (!reason.trim()) {
      showMessage("Ownership exchange reason is required", "warning");
      return;
    }

    const targetUser = staff.find((user) => String(user.id) === String(selectedStaffId));
    if (!targetUser) {
      showMessage("Selected staff member was not found", "error");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/ticket/${selectedTicketId}/ownership-exchange`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assigned_to_id: targetUser.id,
          assigned_to_role: targetUser.role,
          reassignment_reason: reason.trim(),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || "Ownership exchange failed");
      }

      showMessage(payload?.message || "Ticket ownership exchanged successfully", "success");
      setSelectedTicketId("");
      setSelectedStaffId("");
      setReason("");
      fetchData();
    } catch (error) {
      showMessage(error.message || "Failed to exchange ownership", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canExchange) {
    return (
      <div className="user-table-container">
        <h3 className="title">Ticket Ownership Exchange</h3>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="user-table-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h3 className="title">Ticket Ownership Exchange</h3>
        <TextField
          size="small"
          label="Search by ticket ID or assigned name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
        />
      </div>

      <div style={{ marginTop: 16, overflowX: "auto" }}>
        <table className="user-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Ticket ID</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Current Owner</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>Loading...</td></tr>
            ) : filteredTickets.length === 0 ? (
              <tr><td colSpan={5}>No eligible non-closed tickets found.</td></tr>
            ) : (
              filteredTickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <input
                      type="radio"
                      name="selectedTicket"
                      checked={String(selectedTicketId) === String(ticket.id)}
                      onChange={() => setSelectedTicketId(String(ticket.id))}
                    />
                  </td>
                  <td>{ticket.ticket_id || ticket.id}</td>
                  <td>{ticket.subject || "N/A"}</td>
                  <td>{ticket.status || "N/A"}</td>
                  <td>{ticket.assignee?.full_name || ticket.assigned_to_id || "Unassigned"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 18, display: "grid", gap: 12, maxWidth: 560 }}>
        <TextField
          select
          label="Transfer ownership to"
          value={selectedStaffId}
          onChange={(e) => setSelectedStaffId(e.target.value)}
          size="small"
          disabled={!selectedTicketId || submitting}
        >
          {availableStaff.map((user) => (
            <MenuItem key={user.id} value={String(user.id)}>
              {(user.full_name || user.username || user.id) + ` (${user.role})`}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          multiline
          minRows={3}
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={submitting}
        />

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !selectedTicketId || !selectedStaffId || !reason.trim()}
          sx={{ width: "fit-content" }}
        >
          {submitting ? "Exchanging..." : "Exchange Ownership"}
        </Button>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.type}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
