import React, { useEffect, useMemo, useState } from "react";
import { baseURL } from "../../config";
import {
  Autocomplete,
  Alert,
  Box,
  Button,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  confirmRevokeHandover,
  confirmStartHandover,
} from "../../utils/handoverAlerts";
import {
  buildHandoverBlockState,
  formatHandoverUserLabel,
  getActorHandoverBlockMessage,
} from "../../utils/handoverBlockedUsers";

export default function HandoverPage() {
  const loggedInUserId = localStorage.getItem("userId") || "";

  const [users, setUsers] = useState([]);
  const [activeHandovers, setActiveHandovers] = useState([]);
  const [handoverParticipants, setHandoverParticipants] = useState([]);
  const [form, setForm] = useState({
    from_user_id: loggedInUserId,
    to_user_id: "",
    return_at: "",
    reason: "",
  });
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
  };

  const { blockedUserIds, reasonByUserId } = useMemo(
    () => buildHandoverBlockState(handoverParticipants),
    [handoverParticipants]
  );

  const actorBlockMessage = useMemo(
    () => getActorHandoverBlockMessage(handoverParticipants, loggedInUserId),
    [handoverParticipants, loggedInUserId]
  );

  const selectableUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          String(user.id) !== String(loggedInUserId) &&
          !blockedUserIds.has(String(user.id))
      ),
    [users, loggedInUserId, blockedUserIds]
  );

  const showToast = (message, severity = "success") =>
    setToast({ open: true, message, severity });

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${baseURL}/users/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      });
      if (!response.ok) return;
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast("Failed to fetch users.", "error");
    }
  };

  const fetchActiveHandovers = async () => {
    try {
      const response = await fetch(`${baseURL}/users/handover/active`, {
        method: "GET",
        headers: authHeaders,
      });
      if (!response.ok) return;
      const data = await response.json();
      setActiveHandovers(data.handovers || []);
    } catch (error) {
      showToast("Failed to fetch active handovers.", "error");
    }
  };

  const fetchBlockedParticipants = async () => {
    try {
      const response = await fetch(
        `${baseURL}/users/handover/blocked-participants`,
        {
          method: "GET",
          headers: authHeaders,
        }
      );
      if (!response.ok) return;
      const data = await response.json();
      setHandoverParticipants(data.participants || []);
    } catch (error) {
      showToast("Failed to load handover availability.", "error");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchActiveHandovers();
    fetchBlockedParticipants();
  }, []);

  const handleStartHandover = async () => {
    if (actorBlockMessage) {
      showToast(actorBlockMessage, "error");
      return;
    }

    const normalizedReturnAt = form.return_at
      ? `${form.return_at}T23:59:59`
      : "";

    const payload = {
      from_user_id: loggedInUserId,
      to_user_id: form.to_user_id,
      return_at: normalizedReturnAt,
      reason: form.reason,
    };

    if (!payload.from_user_id || !payload.to_user_id || !payload.return_at) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    const selectedUser = users.find((u) => u.id === form.to_user_id);
    const confirmed = await confirmStartHandover({
      delegateName: selectedUser?.full_name || "selected user",
      returnDate: normalizedReturnAt,
      reason: form.reason?.trim() || "",
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`${baseURL}/users/handover/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to start handover");
      }

      showToast("Handover started successfully.");
      setForm({
        from_user_id: loggedInUserId,
        to_user_id: "",
        return_at: "",
        reason: "",
      });
      fetchActiveHandovers();
      fetchBlockedParticipants();
    } catch (error) {
      showToast(error.message || "Failed to start handover.", "error");
    }
  };

  const handleRevokeHandover = async (handoverId, handoverRow) => {
    const confirmed = await confirmRevokeHandover({
      delegateName:
        handoverRow?.toUser?.full_name || handoverRow?.to_user_id || "",
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`${baseURL}/users/handover/${handoverId}/revoke`, {
        method: "POST",
        headers: authHeaders,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to revoke handover");
      }
      showToast("Handover revoked successfully.");
      fetchActiveHandovers();
      fetchBlockedParticipants();
    } catch (error) {
      showToast(error.message || "Failed to revoke handover.", "error");
    }
  };

  return (
    <div className="user-table-container">
      <Typography variant="h5" sx={{ mb: 2 }}>
        Ticket Handover
      </Typography>

      <Box component={Paper} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Start Handover
        </Typography>

        {actorBlockMessage ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {actorBlockMessage}
          </Alert>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
            gap: 2,
          }}
        >
          <Autocomplete
            fullWidth
            disabled={Boolean(actorBlockMessage)}
            options={selectableUsers}
            value={users.find((u) => u.id === form.to_user_id) || null}
            onChange={(_, selectedUser) =>
              setForm((prev) => ({
                ...prev,
                to_user_id: selectedUser?.id || "",
              }))
            }
            getOptionLabel={(option) => formatHandoverUserLabel(option, reasonByUserId)}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="normal"
                size="small"
                label="To User"
                placeholder="Search user..."
              />
            )}
          />

          <TextField
            fullWidth
            margin="normal"
            size="small"
            type="date"
            label="Return Date"
            InputLabelProps={{ shrink: true }}
            value={form.return_at}
            disabled={Boolean(actorBlockMessage)}
            onChange={(e) => setForm((prev) => ({ ...prev, return_at: e.target.value }))}
          />
        </Box>

        <TextField
          fullWidth
          margin="normal"
          size="small"
          label="Reason (optional)"
          multiline
          minRows={2}
          value={form.reason}
          disabled={Boolean(actorBlockMessage)}
          onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
          <Button
            variant="contained"
            onClick={handleStartHandover}
            disabled={Boolean(actorBlockMessage)}
          >
            Start Handover
          </Button>
        </Box>
      </Box>

      <Typography variant="h6" sx={{ mb: 1 }}>
        Active Handovers
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>From User</TableCell>
              <TableCell>To User</TableCell>
              <TableCell>Return At</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeHandovers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No active handovers
                </TableCell>
              </TableRow>
            ) : (
              activeHandovers.map((handover) => (
                <TableRow key={handover.id}>
                  <TableCell>{handover.fromUser?.full_name || handover.from_user_id}</TableCell>
                  <TableCell>{handover.toUser?.full_name || handover.to_user_id}</TableCell>
                  <TableCell>
                    {handover.return_at
                      ? new Date(handover.return_at).toLocaleString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>{handover.from_user_role || "N/A"}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleRevokeHandover(handover.id, handover)}
                      disabled={String(handover.from_user_id) !== String(loggedInUserId)}
                    >
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
