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
import { FiPhoneOff, FiPhoneCall, FiPhoneIncoming } from "react-icons/fi";
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
  Alert,
  Snackbar,
} from "@mui/material";

import { baseURL } from "../../../../config";
import "./agentsDashboard.css";

// Sub-components
import SingleAgentDashboardCard from "../../../../components/agent-dashboard/SingleAgentDashboardCard";
import CallQueueCard from "../../../../components/supervisor-dashboard/CallQueueCard";
import OnlineAgentsTable from "../../../../components/agent-dashboard/OnlineAgentsTable";
import OnlineSupervisorsTable from "../../../../components/agent-dashboard/OnlineSupervisorsTable";
import AgentPerformanceScore from "../../../../components/agent-dashboard/AgentPerformanceScore";
import AdvancedTicketCreateModal from "../../../../components/ticket/AdvancedTicketCreateModal";
import VoiceNotesReport from "../../cal-center-ivr/VoiceNotesReport";
import TotalContactSummary from "../../../../components/agent-dashboard/TotalContactSummary";
import ContactSummaryGrid from "../../../../components/agent-dashboard/ContactSummaryGrid";

// Phone components
import { useSipPhone } from "./useSipPhone";
import PhonePopup from "./PhonePopup";

export default function AgentsDashboard() {
  // --------- Phone popup state ---------
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);

  // --------- Config ---------
  const extension = localStorage.getItem("extension");
  const sipPassword = localStorage.getItem("sipPassword");
  const SIP_DOMAIN = "192.168.21.69";


  // --------- Status / break menu ---------
  const [anchorEl, setAnchorEl] = useState(null);
  const openStatus = Boolean(anchorEl);
  const [agentStatus, setAgentStatus] = useState("ready");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [userDefinedTimes, setUserDefinedTimes] = useState({
    attendingMeeting: 0,
    emergency: 0,
  });

  // --------- Timers (separate refs!) ---------
  const statusTimerRef = useRef(null);

  // --------- Missed calls ---------
  const [missedCalls, setMissedCalls] = useState([]);
  const [missedOpen, setMissedOpen] = useState(false);
  const [callingBackId, setCallingBackId] = useState(null);


  // --------- Tickets / MAC lookup ---------
  const [userData, setUserData] = useState(null);
  const [showUserForm, setShowUserForm] = useState(true);
  const [functionData, setFunctionData] = useState([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketPhoneNumber, setTicketPhoneNumber] = useState("");

  // Ticket form data preservation
  const [ticketFormData, setTicketFormData] = useState({});
  const [ticketType, setTicketType] = useState(null); // 'employer' or 'employee'
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // --------- Voice notes ---------
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [unplayedVoiceNotes, setUnplayedVoiceNotes] = useState(0);
  const [showVoiceNotesModal, setShowVoiceNotesModal] = useState(false);

  // --------- Snackbars ---------
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("warning");

  // --------- Helper functions for hook callbacks ---------
  const showAlert = useCallback((message, severity = "warning") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const fetchUserByPhoneNumber = useCallback(async (phone) => {
    try {
      const response = await fetch(
        `${baseURL}/mac-system/search-by-phone-number?phone_number=${encodeURIComponent(
          phone
        )}`
      );
      if (!response.ok) {
        setUserData(null);
        setShowUserForm(false);
        return;
      }
      const data = await response.json();
      setUserData(data);
      setShowUserForm(true);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setUserData(null);
      setShowUserForm(false);
    }
  }, []);

  const addMissedCall = useCallback((raw) => {
    const agentId = localStorage.getItem("extension");
    if (!raw || raw.trim() === "") return;
    let formattedCaller = raw.startsWith("+255") ? `0${raw.substring(4)}` : raw;
    const time = new Date();
    const newCall = { caller: formattedCaller, time };
    setMissedCalls((prev) => [newCall, ...prev]);

    showAlert(`Missed Call from ${formattedCaller}`, "warning");

    fetch(`${baseURL}/missed-calls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({
        caller: formattedCaller,
        time: time.toISOString(),
        agentId,
      }),
    }).catch((err) => console.error("Failed to post missed call:", err));
  }, [showAlert]);

  // --------- Use SIP Phone Hook ---------
  const {
    phoneStatus,
    incomingCall,
    lastIncomingNumber,
    callDuration,
    isMuted,
    isSpeakerOn,
    isOnHold,
    phoneNumber,
    setPhoneNumber,
    manualTransferExt,
    setManualTransferExt,
    remoteAudioRef,
    session,
    consultSession,
    isConsulting,
    formatDuration,
    acceptCall,
    rejectCall,
    endCall,
    dial,
    redial,
    blindTransfer,
    startConsult,
    completeConsultTransfer,
    cancelConsult,
    toggleMute,
    toggleSpeaker,
    toggleHold,
  } = useSipPhone({
    extension,
    sipPassword,
    SIP_DOMAIN,
    onIncomingCall: useCallback((number) => {
      setShowPhonePopup(true);
      if (number) fetchUserByPhoneNumber(number);
    }, [fetchUserByPhoneNumber]),
    onMissedCall: addMissedCall,
    onCallAccepted: useCallback((number) => {
      setTicketPhoneNumber(number || "");
      setShowTicketModal(true);
      setIsTicketModalOpen(true);
      setShowPhonePopup(false);
    }, []),
    onCallEnded: useCallback(() => {
      setShowUserForm(false);
      setUserData(null);
    }, []),
    showAlert,
    allowIncomingRinging: agentStatus === "ready",
  });

  const formatRemainingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(mins)}:${pad(secs)}`;
  };
  const mapActivityToTimerKey = (activity) => {
    switch ((activity || "").toLowerCase()) {
      case "breakfast":
        return "breakfast";
      case "lunch":
        return "lunch";
      case "short call":
        return "shortCall";
      case "follow-up of customer inquiries":
        return "followUp";
      case "attending meeting":
        return "attendingMeeting";
      case "emergency":
        return "emergency";
      default:
        return null; // covers "ready" and unknowns
    }
  };
  const timeIntervals = {
    breakfast: 15 * 60,
    lunch: 45 * 60,
    shortCall: 10 * 60,
    followUp: 15 * 60,
    attendingMeeting: (userDefinedTimes.attendingMeeting || 30) * 60,
    emergency: (userDefinedTimes.emergency || 20) * 60,
  };


  const startStatusTimer = (activity) => {
    const key = mapActivityToTimerKey(activity);
    if (!key) return;
    const limit = timeIntervals[key] || 0;
    stopStatusTimer();
    setTimeRemaining(limit);
    statusTimerRef.current = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          alert(`You have exceeded your ${activity} time limit.`);
          stopStatusTimer();
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
  };

  useEffect(() => {
    return () => {
      stopStatusTimer();
    };
  }, []);
useEffect(() => {
  // initial load
  fetchMissedCallsFromBackend();

  // auto refresh every 10 seconds
  const interval = setInterval(() => {
    fetchMissedCallsFromBackend();
  }, 10000);

  return () => clearInterval(interval);
}, []);


  // ---------- Fetch function data (ticket modal) ----------
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${baseURL}/section/functions-data`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setFunctionData(json.data || []);
      } catch (err) {
        console.error("Fetch functionData error:", err);
      }
    })();
  }, []);

  // ---------- Voice notes ----------
  useEffect(() => {
    const fetchVoiceNotes = async () => {
      try {
        const agentId = localStorage.getItem("userId");
        const response = await fetch(
          `${baseURL}/voice-notes?agentId=${agentId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch voice notes");
        const data = await response.json();
        const notes = data.voiceNotes || [];
        const storedPlayed =
          JSON.parse(localStorage.getItem("playedVoiceNotes")) || {};
        const unplayedCount = notes.filter(
          (note) => !storedPlayed[note.id]
        ).length;
        setVoiceNotes(notes);
        setUnplayedVoiceNotes(unplayedCount);
      } catch (error) {
        setVoiceNotes([]);
        setUnplayedVoiceNotes(0);
      }
    };
    fetchVoiceNotes();
    const handleStorage = (e) => {
      if (e.key === "playedVoiceNotes") fetchVoiceNotes();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);
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

    // Refresh badge immediately
    await fetchMissedCallsFromBackend();
  } catch (err) {
    console.error("Failed to update missed call status:", err);
  }
};

  // ---------- Missed calls ----------
  useEffect(() => {
    fetchMissedCallsFromBackend();
  }, []);
 const fetchMissedCallsFromBackend = async () => {
  // ❗ DO NOT refresh while calling back
  if (callingBackId) return;

  const ext = localStorage.getItem("extension");

  const response = await fetch(
    `${baseURL}/missed-calls?agentId=${ext}&status=pending`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    }
  );

  const data = await response.json();

  setMissedCalls(
    (data || []).map(call => ({
      ...call,
      time: new Date(call.time),
    }))
  );
};



  // ---------- Phone controls ----------
  const togglePhonePopup = () => setShowPhonePopup((v) => !v);

  const handleDial = () => {
    dial(phoneNumber);
  };

  const handleAcceptCall = () => {
    acceptCall();
  };

  const handleRejectCall = () => {
    rejectCall();
  };

  const handleEndCall = () => {
    endCall();
  };

  const handleBlindTransfer = (targetExt) => {
    blindTransfer(targetExt);
  };

  const handleStartConsult = (targetExt) => {
    startConsult(targetExt);
  };

  const handleCompleteConsultTransfer = () => {
    completeConsultTransfer();
  };

  const handleCancelConsult = () => {
    cancelConsult();
  };

  // Modal swap functionality
  const swapToTicketModal = () => {
    if (showTicketModal) return; // Already open

    console.log("=== SWAP TO TICKET MODAL ===");
    console.log("Current showTicketModal:", showTicketModal);
    console.log("Current showPhonePopup:", showPhonePopup);
    console.log("Current phoneStatus:", phoneStatus);

    // Close phone popup and open ticket modal
    setShowPhonePopup(false);
    setShowTicketModal(true);
    setIsTicketModalOpen(true);

    console.log(
      "After setting showTicketModal to true and closing phone popup"
    );

    // Preserve current call context in ticket form data
    if (phoneStatus === "In Call" || phoneStatus === "Ringing") {
      setTicketFormData((prev) => ({
        ...prev,
        phoneNumber: lastIncomingNumber || phoneNumber,
        callStatus: phoneStatus,
        callDuration: callDuration,
        timestamp: new Date().toISOString(),
      }));
      console.log("Call context preserved in ticket form data");
    }
  };

  const swapToPhoneModal = () => {
    if (showPhonePopup) return; // Already open

    console.log("Swapping to phone modal, closing ticket modal");
    setShowTicketModal(false);
    setIsTicketModalOpen(false);
    // Phone modal is already open, so no need to setShowPhonePopup(true)
  };

  const closeTicketModal = () => {
    console.log("=== CLOSE TICKET MODAL CALLED ===");
    console.log("Current showTicketModal:", showTicketModal);
    console.log("Current isTicketModalOpen:", isTicketModalOpen);
    console.log("Current phoneStatus:", phoneStatus);

    setShowTicketModal(false);
    setIsTicketModalOpen(false);

    console.log("After setting to false - showTicketModal:", false);
    console.log("After setting to false - isTicketModalOpen:", false);

    // Form data is preserved in state for next time
    // If there's an active call, the call status banner will show
    // Phone modal remains open in background if call is active
  };

  // Function to handle ticket modal cancellation
  const handleTicketCancel = () => {
    console.log("=== TICKET MODAL CANCELLED ===");
    closeTicketModal();
  };

  // Function to restore ticket form data when reopening
  const restoreTicketFormData = () => {
    if (Object.keys(ticketFormData).length > 0) {
      console.log("Restoring preserved ticket form data:", ticketFormData);
      // The AdvancedTicketCreateModal will receive this data via props
    }
  };

  // Function to capture form data changes from ticket modal
  const handleTicketFormDataChange = (formData) => {
    console.log("Ticket form data changed:", formData);
    setTicketFormData(formData);
  };

  // Function to handle opening ticket modal
  const openTicketModal = (type = null) => {
    console.log("Opening ticket modal with type:", type);

    // If type is provided, set it
    if (type) {
      handleTicketTypeSelect(type);
    }

    // If we have preserved data and type, use that
    if (Object.keys(ticketFormData).length > 0 && ticketType && !type) {
      console.log("Using preserved ticket type:", ticketType);
    }

    setShowTicketModal(true);
    setIsTicketModalOpen(true);
  };

  // Function to handle ticket type selection
  const handleTicketTypeSelect = (type) => {
    console.log("Ticket type selected:", type);
    setTicketType(type);

    // Clear previous form data when switching types
    if (ticketType && ticketType !== type) {
      console.log("Switching ticket type - clearing previous form data");
      setTicketFormData({});
    }

    // Set initial form data based on type
    const initialData = {
      ticketType: type,
      phoneNumber: lastIncomingNumber || phoneNumber,
      callStatus: phoneStatus,
      callDuration: callDuration,
      timestamp: new Date().toISOString(),
    };

    setTicketFormData(initialData);
    console.log("Initial form data set for type:", type, initialData);
  };

  // Function to handle ticket submission success
  const handleTicketSubmitted = () => {
    console.log("Ticket submitted successfully - clearing preserved data");
    setTicketFormData({});
    setTicketType(null);
    closeTicketModal();
    showAlert("Ticket created successfully!", "success");
  };

  // Keyboard shortcut to close ticket modal (Escape key)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && showTicketModal) {
        console.log("Escape key pressed - closing ticket modal");
        event.preventDefault();
        closeTicketModal();
      }
    };

    if (showTicketModal) {
      document.addEventListener("keydown", handleKeyDown);
      console.log("Escape key listener added");
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      console.log("Escape key listener removed");
    };
  }, [showTicketModal]);

  const handleRedial = (number, missedCallId = null) => {
    redial(number, missedCallId);
  };

  // ---------- Status menu ----------
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
        const onlineCount = data.agentCount ?? 0;
        if (onlineCount <= 1) {
          showAlert(
            "You cannot go on break. At least 2 agents must be online (including you).",
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

    setAgentStatus(activity);

    if (!isReady) startStatusTimer(activity);
    else stopStatusTimer();

    const statusToUpdate = isReady ? "online" : "pause";
    try {
      await fetch(`${baseURL}/users/status/${localStorage.getItem("userId")}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ status: statusToUpdate }),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Determine if there's an active call
  const hasActiveCall = phoneStatus === "In Call" && session !== null;
useEffect(() => {
  localStorage.setItem("missedCalls", JSON.stringify(missedCalls));
}, [missedCalls]);

  return (
    <div className="p-6">

      {/* Call Status Banner - Shows when on a call even if ticket modal is closed */}
      {hasActiveCall && !showTicketModal && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
            backgroundColor: "#4caf50",
            color: "white",
            padding: "12px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            marginBottom: "16px",
            borderRadius: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <FiPhoneCall style={{ fontSize: "20px" }} />
            <div>
              <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                Call in Progress
              </div>
              <div style={{ fontSize: "14px", opacity: 0.9 }}>
                {ticketPhoneNumber ||
                  lastIncomingNumber ||
                  phoneNumber ||
                  "Unknown"}{" "}
                • Duration: {formatDuration(callDuration)}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                setShowTicketModal(true);
                setIsTicketModalOpen(true);
              }}
              sx={{
                backgroundColor: "white",
                color: "#4caf50",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              📝 Return to Ticket
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleEndCall}
              sx={{
                backgroundColor: "#f44336",
                color: "white",
                "&:hover": {
                  backgroundColor: "#d32f2f",
                },
              }}
            >
              End Call
            </Button>
          </div>
        </div>
      )}

      <div className="agent-body">
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <h3>Agent</h3>
          <Tooltip title="View Missed Calls" arrow>
            <div
              style={{ position: "relative", cursor: "pointer" }}
              onClick={() => setMissedOpen(true)}
            >
              <FiPhoneIncoming size={20} />
              {missedCalls.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    background: "red",
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
                  {missedCalls.length}
                </span>
              )}
            </div>
          </Tooltip>
          <Tooltip title="Voice Notes" arrow>
            <div
              style={{ position: "relative", cursor: "pointer" }}
              onClick={() => setShowVoiceNotesModal(true)}
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
                <span style={{ color: "black", marginLeft: "10px" }}>
                  Time Remaining: {formatRemainingTime(timeRemaining)}
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
        {/* Total Contact Summary */}
        <div className="dashboard-single-agent">
          <TotalContactSummary />
          {/* Contact Summary Grid - 4 Equal Boxes */}
          <ContactSummaryGrid />
        </div>
        {/* <div className="dashboard-single-agent">
          <SingleAgentDashboardCard />
        </div> */}

        <div className="dashboard-single-agent-row_two">
          <OnlineAgentsTable />
          <OnlineSupervisorsTable />
        </div>

        {/* <div className="dashboard-single-agent-row_four">
          <AgentPerformanceScore />
        </div> */}
      </div>

      {/* Status menu */}
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
        <MenuItem onClick={() => handleAgentEmergency("ready")}>
          <ListItemIcon>
            <GiTrafficLightsReadyToGo fontSize="large" />
          </ListItemIcon>
          Ready
        </MenuItem>
        <MenuItem onClick={() => handleAgentEmergency("breakfast")}>
          <ListItemIcon>
            <MdOutlineFreeBreakfast fontSize="large" />
          </ListItemIcon>
          Breakfast
        </MenuItem>
        <MenuItem onClick={() => handleAgentEmergency("lunch")}>
          <ListItemIcon>
            <MdOutlineLunchDining fontSize="large" />
          </ListItemIcon>
          Lunch
        </MenuItem>
        <MenuItem onClick={() => handleAgentEmergency("attending meeting")}>
          <ListItemIcon>
            <GiExplosiveMeeting fontSize="large" />
          </ListItemIcon>
          Attending Meeting
        </MenuItem>
        <MenuItem onClick={() => handleAgentEmergency("short call")}>
          <ListItemIcon>
            <MdWifiCalling2 fontSize="large" />
          </ListItemIcon>
          Short Call
        </MenuItem>
        <MenuItem onClick={() => handleAgentEmergency("emergency")}>
          <ListItemIcon>
            <TbEmergencyBed fontSize="large" />
          </ListItemIcon>
          Emergency
        </MenuItem>
        <MenuItem
          onClick={() =>
            handleAgentEmergency("follow-up of customer inquiries")
          }
        >
          <ListItemIcon>
            <MdOutlineFollowTheSigns fontSize="large" />
          </ListItemIcon>
          Follow-up of customer inquiries
        </MenuItem>
      </Menu>

      {/* Phone popup */}
      <PhonePopup
        showPhonePopup={showPhonePopup}
        phoneStatus={phoneStatus}
        incomingCall={incomingCall}
        lastIncomingNumber={lastIncomingNumber}
        callDuration={callDuration}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        showKeypad={showKeypad}
        setShowKeypad={setShowKeypad}
        isMuted={isMuted}
        isSpeakerOn={isSpeakerOn}
        isOnHold={isOnHold}
        manualTransferExt={manualTransferExt}
        setManualTransferExt={setManualTransferExt}
        remoteAudioRef={remoteAudioRef}
        formatDuration={formatDuration}
        isConsulting={isConsulting}
        onClose={togglePhonePopup}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        onEnd={handleEndCall}
        onDial={handleDial}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
        onToggleHold={toggleHold}
        onBlindTransfer={handleBlindTransfer}
        onStartConsult={handleStartConsult}
        onCompleteConsultTransfer={handleCompleteConsultTransfer}
        onCancelConsult={handleCancelConsult}
        onSwapToTicket={swapToTicketModal}
      />

      {/* Missed calls dialog */}
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
                    // 🔴 VISUAL STATE FIRST
                    setCallingBackId(call.id);

                    // 🔴 REMOVE FROM UI
                    setMissedCalls(prev =>
                      prev.filter(c => c.id !== call.id)
                    );

                    // 🔴 BACKEND UPDATE
                    markMissedCallAsCalledBack(call.id);

                    // 🔴 PHONE FLOW
                    setMissedOpen(false);
                    setShowPhonePopup(true);
                    setPhoneNumber(call.caller);
                    handleRedial(call.caller, call.id);
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

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Create Ticket quick button */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => openTicketModal()}
      >
        Create Ticket
      </Button>

      {/* Create Employer Ticket Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => openTicketModal("employer")}
        style={{ marginLeft: "10px" }}
        title="Create ticket for employer"
      >
        🏢 Employer Ticket
      </Button>

      {/* Create Employee Ticket Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => openTicketModal("employee")}
        style={{ marginLeft: "10px" }}
        title="Create ticket for employee"
      >
        👤 Employee Ticket
      </Button>

      {/* Ticket modal with custom wrapper for better control */}
      <div style={{ position: "relative" }}>
        <AdvancedTicketCreateModal
          open={showTicketModal}
          onClose={closeTicketModal}
          onOpen={openTicketModal}
          initialPhoneNumber={ticketPhoneNumber}
          functionData={functionData}
        />
      </div>

      {/* Voice notes modal */}
      <Dialog
        open={showVoiceNotesModal}
        onClose={() => setShowVoiceNotesModal(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogContent>
          <VoiceNotesReport />
        </DialogContent>
      </Dialog>
    </div>
  );
}
