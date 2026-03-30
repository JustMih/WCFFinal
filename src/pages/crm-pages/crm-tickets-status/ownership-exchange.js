import React, { useEffect, useMemo, useState } from "react";
import { Alert, Autocomplete, Button, Snackbar, TextField } from "@mui/material";
import { baseURL } from "../../../config";
import "./ticket.css";

const CLOSED_STATUSES = new Set(["closed", "resolved"]);

export default function OwnershipExchange() {
  const [tickets, setTickets] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
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

  const selectedTickets = useMemo(
    () =>
      tickets.filter((ticket) =>
        selectedTicketIds.includes(String(ticket.id))
      ),
    [tickets, selectedTicketIds]
  );

  const availableStaff = useMemo(() => {
    if (selectedTickets.length === 0) return staff;
    const currentOwners = new Set(
      selectedTickets
        .map((ticket) => String(ticket?.assigned_to_id || ""))
        .filter(Boolean)
    );
    return staff.filter((user) => !currentOwners.has(String(user.id)));
  }, [staff, selectedTickets]);

  const allFilteredSelected =
    filteredTickets.length > 0 &&
    filteredTickets.every((ticket) =>
      selectedTicketIds.includes(String(ticket.id))
    );

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      const filteredSet = new Set(filteredTickets.map((ticket) => String(ticket.id)));
      setSelectedTicketIds((prev) =>
        prev.filter((ticketId) => !filteredSet.has(ticketId))
      );
      return;
    }
    const merged = new Set([
      ...selectedTicketIds,
      ...filteredTickets.map((ticket) => String(ticket.id)),
    ]);
    setSelectedTicketIds(Array.from(merged));
  };

  const toggleTicketSelection = (ticketId) => {
    const normalizedId = String(ticketId);
    setSelectedTicketIds((prev) =>
      prev.includes(normalizedId)
        ? prev.filter((id) => id !== normalizedId)
        : [...prev, normalizedId]
    );
  };

  const handleSubmit = async () => {
    if (selectedTicketIds.length === 0 || !selectedStaffId) {
      showMessage("Select at least one ticket and a staff member first", "warning");
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
      const requestBody = JSON.stringify({
        assigned_to_id: targetUser.id,
        assigned_to_role: targetUser.role,
        reassignment_reason: reason.trim(),
      });
      const results = await Promise.all(
        selectedTicketIds.map(async (ticketId) => {
          const response = await fetch(`${baseURL}/ticket/${ticketId}/ownership-exchange`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: requestBody,
          });
          const payload = await response.json().catch(() => ({}));
          return {
            ticketId,
            ok: response.ok,
            message: payload?.message || (response.ok ? "Success" : "Failed"),
          };
        })
      );

      const successCount = results.filter((result) => result.ok).length;
      const failed = results.filter((result) => !result.ok);

      if (failed.length > 0) {
        const firstFailure = failed[0];
        showMessage(
          `Transferred ${successCount}/${results.length}. First failure on ticket ${firstFailure.ticketId}: ${firstFailure.message}`,
          successCount > 0 ? "warning" : "error"
        );
      } else {
        showMessage(
          `Ticket ownership exchanged successfully for ${successCount} ticket(s)`,
          "success"
        );
      }

      setSelectedTicketIds([]);
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
              <th>
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAllFiltered}
                  aria-label="Select all filtered tickets"
                />
              </th>
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
                      type="checkbox"
                      checked={selectedTicketIds.includes(String(ticket.id))}
                      onChange={() => toggleTicketSelection(ticket.id)}
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
        <Autocomplete
          options={availableStaff}
          getOptionLabel={(user) =>
            `${user.full_name || user.username || user.id} (${user.role})`
          }
          value={
            availableStaff.find((user) => String(user.id) === String(selectedStaffId)) || null
          }
          onChange={(_, selectedUser) => {
            setSelectedStaffId(selectedUser ? String(selectedUser.id) : "");
          }}
          isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
          disabled={selectedTicketIds.length === 0 || submitting}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label="Transfer ownership to"
              placeholder="Search user by name, username or ID"
            />
          )}
        />

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
          disabled={submitting || selectedTicketIds.length === 0 || !selectedStaffId || !reason.trim()}
          sx={{ width: "fit-content" }}
        >
          {submitting ? "Exchanging..." : `Exchange Ownership (${selectedTicketIds.length})`}
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
