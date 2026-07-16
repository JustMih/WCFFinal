import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  MdOutlineLocalPhone,
  MdOutlineVoicemail,
  MdOutlineFreeBreakfast,
  MdWifiCalling2,
  MdOutlineFollowTheSigns,
  MdOutlineLunchDining,
} from "react-icons/md";
import { GiExplosiveMeeting, GiTrafficLightsReadyToGo } from "react-icons/gi";
import { TbEmergencyBed } from "react-icons/tb";
import { FiPhoneOff, FiPhoneCall } from "react-icons/fi";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import { baseURL } from "../../../../config";
import "./agentsDashboard.css";

import CallQueueCard from "../../../../components/supervisor-dashboard/CallQueueCard";
import OnlineAgentsTable from "../../../../components/agent-dashboard/OnlineAgentsTable";
import OnlineSupervisorsTable from "../../../../components/agent-dashboard/OnlineSupervisorsTable";
import VoiceNotesReport from "../../cal-center-ivr/VoiceNotesReport";
import {
  fetchVoiceNotes,
  isVoiceNoteUnplayed,
  VOICE_NOTE_PLAYED_EVENT,
  PLAYED_VOICE_NOTES_KEY,
} from "../../../../utils/voiceNotePlayed";
import TotalContactSummary from "../../../../components/agent-dashboard/TotalContactSummary";
import ContactSummaryGrid from "../../../../components/agent-dashboard/ContactSummaryGrid";
import { useAgentSipPhone } from "../../../../context/AgentSipPhoneContext";
import {
  getTimeIntervalsSeconds,
  getRemainingSecondsFromStart,
  formatRemainingTime,
  formatExceededTime,
  formatPauseDuration,
  PAUSE_MENU_ITEMS,
} from "../../../../utils/pauseActivities";

const PAUSE_MENU_ICONS = {
  ready: <GiTrafficLightsReadyToGo fontSize="large" />,
  breakfast: <MdOutlineFreeBreakfast fontSize="large" />,
  lunch: <MdOutlineLunchDining fontSize="large" />,
  "attending meeting": <GiExplosiveMeeting fontSize="large" />,
  "short call": <MdWifiCalling2 fontSize="large" />,
  emergency: <TbEmergencyBed fontSize="large" />,
  "follow-up of customer inquiries": (
    <MdOutlineFollowTheSigns fontSize="large" />
  ),
};

export default function AgentsDashboard() {
  const {
    agentStatus,
    setAgentStatus,
    togglePhonePopup,
    openTicketModal,
    openPhoneAndRedial,
    setPhoneNumber,
    showAlert,
    missedCallTick,
  } = useAgentSipPhone();

  const [anchorEl, setAnchorEl] = useState(null);
  const openStatus = Boolean(anchorEl);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [pauseExceeded, setPauseExceeded] = useState(false);
  const [exceededSeconds, setExceededSeconds] = useState(0);
  const [userDefinedTimes, setUserDefinedTimes] = useState({
    attendingMeeting: 0,
    emergency: 0,
  });

  const statusTimerRef = useRef(null);
  const exceededMarkedRef = useRef(false);

  const [missedCalls, setMissedCalls] = useState([]);
  const [missedOpen, setMissedOpen] = useState(false);
  const [callingBackId, setCallingBackId] = useState(null);

  const [unplayedVoiceNotes, setUnplayedVoiceNotes] = useState(0);
  const [showVoiceNotesModal, setShowVoiceNotesModal] = useState(false);

  const timeIntervals = getTimeIntervalsSeconds(userDefinedTimes);

  const pauseMenuItems = PAUSE_MENU_ITEMS.map((item) => ({
    ...item,
    icon: PAUSE_MENU_ICONS[item.activity],
  }));

  const markExceededOnServer = async () => {
    if (exceededMarkedRef.current) return;
    exceededMarkedRef.current = true;
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");
    if (!userId || !token) return;
    try {
      await fetch(`${baseURL}/users/pause-session/${userId}/mark-exceeded`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Failed to mark pause exceeded:", err);
    }
  };

  const startExceededTimer = (activity, initialExceeded = 0, showNotice = true) => {
    if (statusTimerRef.current) clearInterval(statusTimerRef.current);
    setPauseExceeded(true);
    setTimeRemaining(0);
    setExceededSeconds(initialExceeded);
    statusTimerRef.current = setInterval(() => {
      setExceededSeconds((s) => s + 1);
    }, 1000);
    markExceededOnServer();
    if (showNotice) {
      showAlert(`Pause limit exceeded for ${activity}.`, "warning");
    }
  };

  const startStatusTimer = (activity, initialSeconds, allowedOverride) => {
    let limit = initialSeconds;
    if (typeof limit !== "number") {
      const intervals = getTimeIntervalsSeconds(userDefinedTimes);
      const item = PAUSE_MENU_ITEMS.find((p) => p.activity === activity);
      limit = item?.timerKey ? intervals[item.timerKey] : 0;
    }
    if (!limit) return;

    if (limit <= 0) {
      startExceededTimer(activity, 0);
      return;
    }

    if (statusTimerRef.current) clearInterval(statusTimerRef.current);
    setPauseExceeded(false);
    setExceededSeconds(0);
    exceededMarkedRef.current = false;
    setTimeRemaining(limit);
    statusTimerRef.current = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          startExceededTimer(activity, 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const stopStatusTimer = () => {
    if (statusTimerRef.current) clearInterval(statusTimerRef.current);
    statusTimerRef.current = null;
    setTimeRemaining(0);
    setPauseExceeded(false);
    setExceededSeconds(0);
    exceededMarkedRef.current = false;
  };

  useEffect(() => {
    return () => {
      stopStatusTimer();
    };
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");
    if (!userId || !token) return;

    const restorePauseState = async () => {
      try {
        const response = await fetch(
          `${baseURL}/users/agent-status/${userId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) return;
        const data = await response.json();

        if (data.status === "pause" && data.pause_activity) {
          setAgentStatus(data.pause_activity);
          const allowed = data.pause_allowed_seconds;
          if (data.is_exceeded) {
            exceededMarkedRef.current = true;
            startExceededTimer(
              data.pause_activity,
              data.exceeded_seconds || 0,
              false
            );
          } else {
            const remaining = getRemainingSecondsFromStart(
              data.pause_activity,
              data.pause_started_at,
              userDefinedTimes,
              allowed
            );
            startStatusTimer(data.pause_activity, remaining, allowed);
          }
        } else if (data.status === "online") {
          setAgentStatus("ready");
          stopStatusTimer();
        }
      } catch (err) {
        console.error("Failed to restore agent pause state:", err);
      }
    };

    restorePauseState();
  }, [setAgentStatus]);

  const fetchMissedCallsFromBackend = useCallback(async () => {
    if (callingBackId) return;

    const ext = localStorage.getItem("extension");
    const token = localStorage.getItem("authToken");
    if (!ext || !token) return;

    try {
      const response = await fetch(
        `${baseURL}/missed-calls?agentId=${encodeURIComponent(ext)}&status=pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        console.error("Missed calls fetch failed:", response.status);
        return;
      }
      const data = await response.json();
      setMissedCalls(
        (Array.isArray(data) ? data : []).map((call) => ({
          ...call,
          time: new Date(call.time),
        }))
      );
    } catch (err) {
      console.error("Failed to fetch missed calls:", err);
    }
  }, [callingBackId]);

  useEffect(() => {
    fetchMissedCallsFromBackend();
    const interval = setInterval(() => {
      fetchMissedCallsFromBackend();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchMissedCallsFromBackend]);

  useEffect(() => {
    if (missedCallTick > 0) {
      fetchMissedCallsFromBackend();
    }
  }, [missedCallTick, fetchMissedCallsFromBackend]);

  const refreshVoiceNoteBadge = useCallback(async () => {
    try {
      const notes = await fetchVoiceNotes({ unplayedOnly: true });
      const unplayed = notes.filter(isVoiceNoteUnplayed);
      setUnplayedVoiceNotes(unplayed.length);
    } catch (error) {
      setUnplayedVoiceNotes(0);
    }
  }, []);

  useEffect(() => {
    refreshVoiceNoteBadge();
    const interval = setInterval(refreshVoiceNoteBadge, 60000);
    const handleStorage = (e) => {
      if (e.key === PLAYED_VOICE_NOTES_KEY) refreshVoiceNoteBadge();
    };
    const handlePlayed = () => refreshVoiceNoteBadge();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(VOICE_NOTE_PLAYED_EVENT, handlePlayed);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(VOICE_NOTE_PLAYED_EVENT, handlePlayed);
    };
  }, [refreshVoiceNoteBadge]);

  const markMissedCallAsCalledBack = async (missedCallId) => {
    if (!missedCallId) return;

    try {
      await fetch(`${baseURL}/missed-calls/${missedCallId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ status: "called_back" }),
      });
      await fetchMissedCallsFromBackend();
    } catch (err) {
      console.error("Failed to update missed call status:", err);
    }
  };

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleAgentEmergency = async (activity) => {
    const isReady = (activity || "").toLowerCase() === "ready";

    if (!isReady) {
      try {
        const response = await fetch(`${baseURL}/users/agents-online`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        const data = await response.json();
        if (data.canPause === false) {
          showAlert(
            data.message ||
              "Cannot pause: at least 50% of logged-in agents must stay available. Wait for another agent to return online.",
            "warning"
          );
          return;
        }
      } catch (err) {
        console.error("Failed to check online agents:", err);
        showAlert("Could not verify online agents. Try again.", "error");
        return;
      }
    }

    const statusToUpdate = isReady ? "online" : "pause";
    const pauseStartedAt = new Date().toISOString();
    const body = isReady
      ? { status: statusToUpdate }
      : {
          status: statusToUpdate,
          pause_activity: activity,
          pause_started_at: pauseStartedAt,
        };

    try {
      const response = await fetch(
        `${baseURL}/users/status/${localStorage.getItem("userId")}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) {
        let message = "Failed to update status. Try again.";
        try {
          const errData = await response.json();
          if (errData?.message) message = errData.message;
        } catch (_) {
          /* ignore */
        }
        showAlert(message, response.status === 403 ? "warning" : "error");
        return;
      }

      setAgentStatus(isReady ? "ready" : activity);
      if (!isReady) startStatusTimer(activity);
      else stopStatusTimer();
    } catch (err) {
      console.error("Failed to update status:", err);
      showAlert("Failed to update status. Try again.", "error");
    }
  };

  useEffect(() => {
    localStorage.setItem("missedCalls", JSON.stringify(missedCalls));
  }, [missedCalls]);

  return (
    <div className="agents-dashboard-root">
      <div className="agent-body">
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <h3>Agent</h3>
          <Tooltip title="Voice Notes" arrow>
            <div
              style={{ position: "relative", cursor: "pointer" }}
              onClick={() => {
                refreshVoiceNoteBadge();
                setShowVoiceNotesModal(true);
              }}
            >
              <MdOutlineVoicemail size={22} />
              {unplayedVoiceNotes > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    background: "orange",
                    color: "white",
                    fontSize: "12px",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {unplayedVoiceNotes}
                </span>
              )}
            </div>
          </Tooltip>
        </div>

        <div className="phone-navbar">
          {agentStatus === "ready" ? (
            <>
              <MdOutlineLocalPhone
                className="phone-btn-call"
                onClick={togglePhonePopup}
              />
              <h4
                style={{
                  backgroundColor: "green",
                  color: "white",
                  padding: "7px",
                  borderRadius: "15px",
                }}
              >
                {agentStatus.toUpperCase()}
              </h4>
            </>
          ) : (
            <>
              <FiPhoneOff className="out-phone-btn-call" />
              <div>
                <h4
                  style={{
                    backgroundColor: "red",
                    color: "white",
                    padding: "7px",
                    borderRadius: "15px",
                  }}
                >
                  {agentStatus.toUpperCase()}
                </h4>
                <span
                  style={{
                    color: pauseExceeded ? "#c62828" : "black",
                    marginLeft: "10px",
                    fontWeight: pauseExceeded ? 600 : 400,
                  }}
                >
                  {pauseExceeded
                    ? `Exceeded: ${formatExceededTime(exceededSeconds)}`
                    : `Time Remaining: ${formatRemainingTime(timeRemaining)}`}
                </span>
              </div>
            </>
          )}
          <Tooltip title="Agent Emergency">
            <IconButton
              onClick={handleClick}
              size="medium"
              sx={{ ml: 2 }}
              aria-controls={openStatus ? "account-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={openStatus ? "true" : undefined}
            >
              <Avatar
                sx={{
                  width: 48,
                  height: 40,
                  bgcolor: "primary.main",
                  color: "white",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              >
                PAUSE
              </Avatar>
            </IconButton>
          </Tooltip>
        </div>

        <div className="dashboard-single-agent">
          <CallQueueCard />
        </div>
        <div className="dashboard-single-agent">
          <TotalContactSummary />
          <ContactSummaryGrid />
        </div>

        <div className="dashboard-single-agent-row_two">
          <OnlineAgentsTable />
          <OnlineSupervisorsTable />
        </div>
      </div>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={openStatus}
        onClose={handleClose}
        onClick={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
              mt: 1.5,
              "& .MuiAvatar-root": { width: 32, height: 32, ml: -0.5, mr: 1 },
              "&::before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: "background.paper",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {pauseMenuItems.map(({ activity, label, icon, timerKey }) => {
          const seconds = timerKey ? timeIntervals[timerKey] : null;
          const timeRange = seconds ? formatPauseDuration(seconds) : null;
          return (
            <MenuItem
              key={activity}
              onClick={() => handleAgentEmergency(activity)}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText
                primary={label}
                secondary={timeRange ? `Allowed: ${timeRange}` : null}
                secondaryTypographyProps={{
                  sx: { fontSize: "0.75rem", color: "text.secondary" },
                }}
              />
            </MenuItem>
          );
        })}
      </Menu>

      <Dialog
        open={missedOpen}
        onClose={() => setMissedOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Missed Calls</DialogTitle>
        <DialogContent dividers>
          {missedCalls.length === 0 ? (
            <p>No missed calls!</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {missedCalls.map((call) => (
                <li
                  key={call.id}
                  style={{
                    marginBottom: 15,
                    borderBottom: "1px solid #ccc",
                    paddingBottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>{call.caller}</strong>
                    <br />
                    <small>{new Date(call.time).toLocaleTimeString()}</small>
                  </div>

                  <Button
                    variant="contained"
                    size="small"
                    color={callingBackId === call.id ? "success" : "primary"}
                    disabled={callingBackId === call.id}
                    startIcon={<FiPhoneCall />}
                    onClick={() => {
                      setCallingBackId(call.id);
                      setMissedCalls((prev) =>
                        prev.filter((c) => c.id !== call.id)
                      );
                      markMissedCallAsCalledBack(call.id);
                      setMissedOpen(false);
                      setPhoneNumber(call.caller);
                      openPhoneAndRedial(call.caller, call.id);
                    }}
                  >
                    {callingBackId === call.id ? "Calling..." : "Call Back"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Button
            onClick={() => {
              setMissedCalls([]);
              localStorage.removeItem("missedCalls");
            }}
            fullWidth
            variant="outlined"
            color="error"
            style={{ marginTop: 10 }}
          >
            Clear Missed Calls
          </Button>
        </DialogContent>
      </Dialog>

      <Button
        variant="contained"
        color="primary"
        onClick={() => openTicketModal()}
      >
        Create Ticket
      </Button>

      <Button
        variant="contained"
        color="primary"
        onClick={() => openTicketModal("employer")}
        style={{ marginLeft: "10px" }}
        title="Create ticket for employer"
      >
        Employer Ticket
      </Button>

      <Button
        variant="contained"
        color="primary"
        onClick={() => openTicketModal("employee")}
        style={{ marginLeft: "10px" }}
        title="Create ticket for employee"
      >
        Employee Ticket
      </Button>

      <Dialog
        open={showVoiceNotesModal}
        onClose={() => {
          setShowVoiceNotesModal(false);
          refreshVoiceNoteBadge();
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogContent>
          <VoiceNotesReport variant="inbox" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
