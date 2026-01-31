import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import { baseURL } from "../../../../config";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Phone bar + softphone imports
import {
  MdOutlineLocalPhone,
  MdPauseCircleOutline,
  MdLocalPhone,
  MdOutlineFreeBreakfast,
  MdWifiCalling2,
  MdOutlineFollowTheSigns,
  MdOutlineLunchDining,
  MdPhone,
  MdPhoneDisabled,
  MdCallEnd,
  MdTrendingUp,
} from "react-icons/md";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { IoKeypadOutline } from "react-icons/io5";
import { BsFillMicMuteFill } from "react-icons/bs";
import { GiExplosiveMeeting, GiTrafficLightsReadyToGo } from "react-icons/gi";
import { TbEmergencyBed } from "react-icons/tb";
import { FiPhoneOff } from "react-icons/fi";
import { UserAgent, Inviter, Registerer, SessionState } from "sip.js";
import {
  TextField,
  Autocomplete,
  Button,
  Tooltip,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Snackbar,
  Alert,
} from "@mui/material";

import "./supervisorDashboard.css";
import OnlineAgentsTable from "../../../../components/agent-dashboard/OnlineAgentsTable";
import OnlineSupervisorsTable from "../../../../components/agent-dashboard/OnlineSupervisorsTable";

// Register chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  ChartTooltip,
  Legend,
  ArcElement
);

export default function SupervisorDashboard() {
  // ===== Analytics state =====
  const [totalCounts, setTotalCounts] = useState([]);
  const [monthlyCounts, setMonthlyCounts] = useState([]);
  const [weeklyCounts, setWeeklyCounts] = useState([]);
  const [dailyCounts, setDailyCounts] = useState([]);
  const [totalRows, setTotalRows] = useState(0);

  // ===== Phone bar / status =====
  const [agentStatus, setAgentStatus] = useState("ready");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const openStatus = Boolean(anchorEl);
  const statusTimerRef = useRef(null);

  // ===== Softphone state =====
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState("Idle");
  const [userAgent, setUserAgent] = useState(null);
  const [session, setSession] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [lastIncomingNumber, setLastIncomingNumber] = useState("");
  const [ringAudio] = useState(() => new Audio("/ringtone.mp3"));
  const remoteAudioRef = useRef(null);

  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isOnHold, setIsOnHold] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [transferTarget, setTransferTarget] = useState("");
  const callTimerRef = useRef(null);
  const autoRejectTimerRef = useRef(null);
  const wasAnsweredRef = useRef(false);

  const [onlineUsers, setOnlineUsers] = useState([]);

  // Snackbars
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("warning");
  const showAlert = (msg, sev = "warning") => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(sev);
    setSnackbarOpen(true);
  };

  // ===== Config / SIP =====
  // --------- Config ---------
  const extension = localStorage.getItem("extension");
  const sipPassword = localStorage.getItem("sipPassword");
  const SIP_DOMAIN = "192.168.21.70"; // unify here (adjust if needed)

  const sipConfig = useMemo(() => {
    if (!extension || !sipPassword) return null;
    return {
      uri: UserAgent.makeURI(`sip:${extension}@${SIP_DOMAIN}`),
      transportOptions: {
        server: `wss://${SIP_DOMAIN}:8089/ws`,
        keepAliveInterval: 30, // Keep WebSocket alive
        connectionTimeout: 10000, // Prevent timeout issues
      },
      authorizationUsername: extension,
      authorizationPassword: sipPassword,
      traceSip: true, // Enable SIP.js logging
      sessionDescriptionHandlerFactoryOptions: {
        constraints: { audio: true, video: false },
        codecs: ["PCMU", "opus"], // Match Asterisk: PCMU prioritized
        peerConnectionConfiguration: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            {
              urls: "turn:openrelay.metered.ca:80",
              username: "openrelayproject",
              credential: "openrelayproject",
            },
          ],
          iceTransportPolicy: "all", // Allow host candidates
          rtcpMuxPolicy: "require", // Required for Asterisk WebRTC
          bundlePolicy: "balanced", // Improve compatibility
          iceGatheringTimeout: 500, // Increased for reliable STUN response
          // iceCandidateFilter: (candidate) => candidate.type === 'host' || candidate.type === 'srflx', // Prefer UDP candidates
        },
      },
      hackIpInContact: true, // Force private IP in Contact header
      register: true, // Ensure registration with Asterisk
      log: {
        level: "debug", // Detailed logging
        builtinEnabled: true,
      },
      // Additional WebRTC tweaks
      allowLegacyNotifications: true, // For PJSIP compatibility
      hackViaReceived: true, // Ensure correct IP in Via header
    };
  }, [extension, sipPassword]);

  // ===== Helpers =====
  const iconStyle = (bgColor) => ({
    backgroundColor: bgColor,
    padding: 10,
    borderRadius: "50%",
    color: "white",
  });
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    const pad = (n) => String(n).padStart(2, "0");
    return hrs > 0
      ? `${pad(hrs)}:${pad(mins % 60)}:${pad(secs)}`
      : `${pad(mins)}:${pad(secs)}`;
  };
  const formatRemainingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(mins)}:${pad(secs)}`;
  };

  const userDefinedTimes = { attendingMeeting: 30, emergency: 20 };
  const timeIntervals = {
    breakfast: 15 * 60,
    lunch: 45 * 60,
    shortCall: 10 * 60,
    followUp: 15 * 60,
    attendingMeeting: (userDefinedTimes.attendingMeeting || 30) * 60,
    emergency: (userDefinedTimes.emergency || 20) * 60,
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
        return null;
    }
  };
  const startStatusTimer = (activity) => {
    const key = mapActivityToTimerKey(activity);
    if (!key) return;
    const limit = timeIntervals[key] || 0;
    stopStatusTimer();
    setTimeRemaining(limit);
    statusTimerRef.current = setInterval(() => {
      setTimeRemaining((t) =>
        t <= 1 ? (clearInterval(statusTimerRef.current), 0) : t - 1
      );
    }, 1000);
  };
  const stopStatusTimer = () => {
    if (statusTimerRef.current) clearInterval(statusTimerRef.current);
    statusTimerRef.current = null;
    setTimeRemaining(0);
  };
  const handleClick = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleAgentEmergency = (activity) => {
    setAgentStatus(activity);
    if ((activity || "").toLowerCase() !== "ready") startStatusTimer(activity);
    else stopStatusTimer();
  };

  // ===== Analytics fetch =====
  const fetchData = async () => {
    try {
      const response = await fetch(`${baseURL}/calls/calls-count`);
      const data = await response.json();
      setTotalCounts(data.totalCounts);
      setMonthlyCounts(data.monthlyCounts);
      setWeeklyCounts(data.weeklyCounts);
      setDailyCounts(data.dailyCounts);
      setTotalRows(data.totalRows);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 10000);
    return () => {
      clearInterval(i);
      stopStatusTimer();
    };
  }, []);

  // ===== Percentage calculation helpers =====
  const calculatePercentage = (count, total) => {
    if (!total || total === 0) return 0;
    return ((count / total) * 100).toFixed(1);
  };

  // Calculate totals for each period
  const yearlyTotal = totalCounts.reduce(
    (sum, item) => sum + (item.count || 0),
    0
  );
  const monthlyTotal = monthlyCounts.reduce(
    (sum, item) => sum + (item.count || 0),
    0
  );
  const dailyTotal = dailyCounts.reduce(
    (sum, item) => sum + (item.count || 0),
    0
  );

  // Get counts for each disposition
  const getCount = (counts, disposition) =>
    counts.find((i) => i.disposition === disposition)?.count || 0;

  // Yearly counts
  const yearlyAnswered = getCount(totalCounts, "ANSWERED");
  const yearlyNoAnswer = getCount(totalCounts, "NO ANSWER");
  const yearlyBusy = getCount(totalCounts, "BUSY");

  // Monthly counts
  const monthlyAnswered = getCount(monthlyCounts, "ANSWERED");
  const monthlyNoAnswer = getCount(monthlyCounts, "NO ANSWER");
  const monthlyBusy = getCount(monthlyCounts, "BUSY");

  // Daily counts
  const dailyAnswered = getCount(dailyCounts, "ANSWERED");
  const dailyNoAnswer = getCount(dailyCounts, "NO ANSWER");
  const dailyBusy = getCount(dailyCounts, "BUSY");

  // Calculate percentages
  const yearlyAnsweredPercent = calculatePercentage(
    yearlyAnswered,
    yearlyTotal
  );
  const yearlyNoAnswerPercent = calculatePercentage(
    yearlyNoAnswer,
    yearlyTotal
  );
  const yearlyBusyPercent = calculatePercentage(yearlyBusy, yearlyTotal);

  const monthlyAnsweredPercent = calculatePercentage(
    monthlyAnswered,
    monthlyTotal
  );
  const monthlyNoAnswerPercent = calculatePercentage(
    monthlyNoAnswer,
    monthlyTotal
  );
  const monthlyBusyPercent = calculatePercentage(monthlyBusy, monthlyTotal);

  const dailyAnsweredPercent = calculatePercentage(dailyAnswered, dailyTotal);
  const dailyNoAnswerPercent = calculatePercentage(dailyNoAnswer, dailyTotal);
  const dailyBusyPercent = calculatePercentage(dailyBusy, dailyTotal);

  // ===== Online users for transfer =====
  useEffect(() => {
    if (showPhonePopup) fetchOnlineUsers();
  }, [showPhonePopup]);
  const fetchOnlineUsers = async () => {
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      };
      const [agentsRes, supervisorsRes] = await Promise.all([
        fetch(`${baseURL}/users/agents-online`, { headers }),
        fetch(`${baseURL}/users/supervisors-online`, { headers }),
      ]);
      const [agentsJson, supervisorsJson] = await Promise.all([
        agentsRes.ok ? agentsRes.json() : [],
        supervisorsRes.ok ? supervisorsRes.json() : [],
      ]);
      const extract = (p) =>
        Array.isArray(p)
          ? p
          : Array.isArray(p?.agents)
          ? p.agents
          : Array.isArray(p?.supervisors)
          ? p.supervisors
          : Array.isArray(p?.data)
          ? p.data
          : Array.isArray(p?.items)
          ? p.items
          : [];
      const agents = extract(agentsJson).map((u) => ({
        ...u,
        role: u.role || "agent",
      }));
      const supervisors = extract(supervisorsJson).map((u) => ({
        ...u,
        role: u.role || "supervisor",
      }));
      const selfExt = String(localStorage.getItem("extension") || "");
      const selfUserId = String(localStorage.getItem("userId") || "");
      const selfUsername = String(localStorage.getItem("username") || "");
      const combined = [...agents, ...supervisors]
        .filter((u) => u && (u.extension || u.username))
        .filter((u) => {
          const uExt = String(u.extension || "");
          const uId = String((u.id ?? u.userId ?? u._id) || "");
          const uName = String(u.username || u.name || "");
          return (
            uExt !== selfExt && uId !== selfUserId && uName !== selfUsername
          );
        });
      setOnlineUsers(combined);
    } catch (e) {
      setOnlineUsers([]);
    }
  };

  // ===== Softphone: SIP wiring =====
  const stopRingtone = () => {
    ringAudio.pause();
    ringAudio.currentTime = 0;
  };
  const startCallTimer = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(
      () => setCallDuration((p) => p + 1),
      1000
    );
  };
  const stopCallTimer = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = null;
    setCallDuration(0);
  };

  const handleIncomingInvite = (invitation) => {
    wasAnsweredRef.current = false;
    const number = invitation?.remoteIdentity?.uri?.user || "";
    setLastIncomingNumber(number);
    setIncomingCall(invitation);
    setShowPhonePopup(true);
    setPhoneStatus("Ringing");
    ringAudio.loop = true;
    ringAudio.volume = 0.7;
    ringAudio.play().catch(() => {});

    invitation.stateChange.addListener((state) => {
      if (state === SessionState.Terminated) {
        stopRingtone();
        clearTimeout(autoRejectTimerRef.current);
        setIncomingCall(null);
        setShowPhonePopup(false);
        setPhoneStatus("Idle");
        if (!wasAnsweredRef.current) {
          // optional: record missed call
        }
      }
    });

    autoRejectTimerRef.current = setTimeout(() => {
      invitation.reject().catch(() => {});
      setShowPhonePopup(false);
      setPhoneStatus("Idle");
      stopRingtone();
      setIncomingCall(null);
    }, 20000);
  };

  useEffect(() => {
    if (!sipConfig) {
      setPhoneStatus("Not configured");
      return;
    }
    const ua = new UserAgent(sipConfig);
    const registerer = new Registerer(ua);
    ua.delegate = { onInvite: handleIncomingInvite };
    setUserAgent(ua);

    ua.start()
      .then(() => {
        registerer.register();
        setPhoneStatus("Idle");
      })
      .catch(() => setPhoneStatus("Connection Failed"));
    return () => {
      registerer.unregister().catch(() => {});
      ua.stop();
      stopRingtone();
      stopCallTimer();
    };
  }, [sipConfig]);

  const attachMediaStream = (sipSession) => {
    const pc = sipSession.sessionDescriptionHandler.peerConnection;
    const existing = new MediaStream();
    pc.getReceivers().forEach((r) => {
      if (r.track) existing.addTrack(r.track);
    });
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = existing;
    pc.ontrack = (event) => {
      const stream =
        event.streams && event.streams[0]
          ? event.streams[0]
          : new MediaStream([event.track]);
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
    };
  };

  const togglePhonePopup = () => setShowPhonePopup((v) => !v);
  const handleAcceptCall = () => {
    if (!incomingCall) return;
    clearTimeout(autoRejectTimerRef.current);
    incomingCall
      .accept({
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
        },
      })
      .then(() => {
        wasAnsweredRef.current = true;
        setSession(incomingCall);
        setIncomingCall(null);
        setPhoneStatus("In Call");
        stopRingtone();
        startCallTimer();
        incomingCall.stateChange.addListener((state) => {
          if (state === SessionState.Established)
            attachMediaStream(incomingCall);
          if (state === SessionState.Terminated) {
            setPhoneStatus("Idle");
            setSession(null);
            if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
            stopCallTimer();
          }
        });
      })
      .catch(() => {
        setPhoneStatus("Idle");
        setShowPhonePopup(false);
      });
  };
  const handleRejectCall = () => {
    if (!incomingCall) return;
    clearTimeout(autoRejectTimerRef.current);
    incomingCall.reject().catch(() => {});
    setIncomingCall(null);
    setShowPhonePopup(false);
    setPhoneStatus("Idle");
    stopRingtone();
  };
  const handleEndCall = () => {
    if (session) {
      session.bye().catch(() => {});
      setSession(null);
      setPhoneStatus("Idle");
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
      stopRingtone();
      stopCallTimer();
      setShowPhonePopup(false);
      setIncomingCall(null);
    } else if (incomingCall) {
      incomingCall.reject().catch(() => {});
      setIncomingCall(null);
      setPhoneStatus("Idle");
      stopRingtone();
      stopCallTimer();
      setShowPhonePopup(false);
    }
  };
  const handleDial = () => {
    if (!userAgent || !phoneNumber) return;
    const targetURI = UserAgent.makeURI(`sip:${phoneNumber}@${SIP_DOMAIN}`);
    if (!targetURI) return;
    const inviter = new Inviter(userAgent, targetURI, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
    });
    setSession(inviter);
    inviter
      .invite()
      .then(() => {
        setPhoneStatus("Dialing");
        inviter.stateChange.addListener((state) => {
          if (state === SessionState.Established) {
            attachMediaStream(inviter);
            setPhoneStatus("In Call");
            startCallTimer();
          }
          if (state === SessionState.Terminated) {
            setPhoneStatus("Idle");
            setSession(null);
            if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
            stopCallTimer();
          }
        });
      })
      .catch(() => setPhoneStatus("Call Failed"));
  };

  const toggleMute = () => {
    if (!session) return;
    const pc = session.sessionDescriptionHandler.peerConnection;
    pc.getSenders().forEach((s) => {
      if (s.track && s.track.kind === "audio") {
        s.track.enabled = !s.track.enabled;
        setIsMuted(!s.track.enabled);
      }
    });
  };
  const toggleSpeaker = () => {
    const el = remoteAudioRef.current;
    if (el && el.setSinkId) {
      const deviceId = isSpeakerOn ? "communications" : "default";
      el.setSinkId(deviceId)
        .then(() => setIsSpeakerOn(!isSpeakerOn))
        .catch(() => {});
    }
  };
  const toggleHold = () => {
    if (!session) return;
    const pc = session.sessionDescriptionHandler.peerConnection;
    const senders = pc.getSenders();
    if (isOnHold)
      senders.forEach((s) => {
        if (s.track && s.track.kind === "audio") s.track.enabled = true;
      });
    else
      senders.forEach((s) => {
        if (s.track && s.track.kind === "audio") s.track.enabled = false;
      });
    setIsOnHold(!isOnHold);
  };

  const handleBlindTransfer = async (targetExt) => {
    const target = String(targetExt ?? transferTarget ?? "").trim();
    if (!session || !target) {
      showAlert("Select an online agent/supervisor to transfer", "warning");
      return;
    }
    const isAllowed = onlineUsers.some(
      (u) =>
        (u.role === "agent" || u.role === "supervisor") &&
        String(u.extension) === target
    );
    if (!isAllowed) {
      showAlert("Target is not currently online", "error");
      return;
    }
    try {
      const targetURI = UserAgent.makeURI(`sip:${target}@${SIP_DOMAIN}`);
      if (!targetURI) {
        showAlert("Invalid transfer target", "error");
        return;
      }
      await session.refer(targetURI);
      showAlert(`Call transferred to ${target}`, "success");
      handleEndCall();
    } catch {
      showAlert("Transfer failed", "error");
    }
  };

  // ===== Charts =====
  const barData = {
    labels: ["Answered", "Busy", "No Answer"],
    datasets: [
      {
        label: "Call Counts",
        data: [
          totalCounts.find((i) => i.disposition === "ANSWERED")?.count || 0,
          totalCounts.find((i) => i.disposition === "BUSY")?.count || 0,
          totalCounts.find((i) => i.disposition === "NO ANSWER")?.count || 0,
        ],
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };
  const pieData = {
    labels: ["Answered", "Busy", "No Answer"],
    datasets: [
      {
        label: "Call Distribution",
        data: [
          totalCounts.find((i) => i.disposition === "ANSWERED")?.count || 0,
          totalCounts.find((i) => i.disposition === "BUSY")?.count || 0,
          totalCounts.find((i) => i.disposition === "NO ANSWER")?.count || 0,
        ],
        backgroundColor: ["#36A2EB", "#FF6384", "#FFCD56"],
        borderWidth: 1,
      },
    ],
  };

  // Donut charts for card summaries
  const yearlyDonutData = {
    labels: ["Answered", "No Answer", "Busy"],
    datasets: [
      {
        label: "Yearly Call Distribution",
        data: [
          totalCounts.find((i) => i.disposition === "ANSWERED")?.count || 0,
          totalCounts.find((i) => i.disposition === "NO ANSWER")?.count || 0,
          totalCounts.find((i) => i.disposition === "BUSY")?.count || 0,
        ],
        backgroundColor: ["#36A2EB", "#FFCD56", "#FF6384"],
        borderWidth: 1,
      },
    ],
  };

  const monthlyDonutData = {
    labels: ["Answered", "No Answer", "Busy"],
    datasets: [
      {
        label: "Monthly Call Distribution",
        data: [
          monthlyCounts.find((i) => i.disposition === "ANSWERED")?.count || 0,
          monthlyCounts.find((i) => i.disposition === "NO ANSWER")?.count || 0,
          monthlyCounts.find((i) => i.disposition === "BUSY")?.count || 0,
        ],
        backgroundColor: ["#36A2EB", "#FFCD56", "#FF6384"],
        borderWidth: 1,
      },
    ],
  };

  const dailyDonutData = {
    labels: ["Answered", "No Answer", "Busy"],
    datasets: [
      {
        label: "Daily Call Distribution",
        data: [
          dailyCounts.find((i) => i.disposition === "ANSWERED")?.count || 0,
          dailyCounts.find((i) => i.disposition === "NO ANSWER")?.count || 0,
          dailyCounts.find((i) => i.disposition === "BUSY")?.count || 0,
        ],
        backgroundColor: ["#36A2EB", "#FFCD56", "#FF6384"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="call-center-agent-container">
      {/* hidden audio for WebRTC */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
      />

      <h3 className="call-center-agent-title">Supervisor Dashboard</h3>

      {/* Phone bar */}
      <div className="phone-navbar" style={{ marginBottom: 16 }}>
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
        <Tooltip title="Status Menu">
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={openStatus ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={openStatus ? "true" : undefined}
          >
            <Avatar sx={{ width: 32, height: 32 }}>E</Avatar>
          </IconButton>
        </Tooltip>
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

      <div className="dashboard-single-agent-row_two">
          <OnlineAgentsTable />
          <OnlineSupervisorsTable />
        </div>
      {/* Summary cards */}
      {/* Yearly Row */}
      <div className="call-center-agent-summary">
        <div className="call-center-agent-card answered-calls">
          <div className="stat-icon">
            <MdPhone style={{ color: "#4caf50" }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              <span className="stat-percentage" style={{ color: "#4caf50" }}>
                ({yearlyAnsweredPercent}%)
              </span>{" "}
              {yearlyAnswered}
            </div>
            <div className="stat-label">Yearly Answered Calls</div>
            <div className="stat-sublabel">of total calls</div>
          </div>
        </div>
        <div className="call-center-agent-card no-answer-calls">
          <div className="stat-icon">
            <MdPhoneDisabled style={{ color: "#ff9800" }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              <span className="stat-percentage" style={{ color: "#ff9800" }}>
                ({yearlyNoAnswerPercent}%)
              </span>{" "}
              {yearlyNoAnswer}
            </div>
            <div className="stat-label">Yearly No Answer Calls</div>
            <div className="stat-sublabel">of total calls</div>
          </div>
        </div>
        <div className="call-center-agent-card busy-calls">
          <div className="stat-icon">
            <MdCallEnd style={{ color: "#f44336" }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              <span className="stat-percentage" style={{ color: "#f44336" }}>
                ({yearlyBusyPercent}%)
              </span>{" "}
              {yearlyBusy}
            </div>
            <div className="stat-label">Yearly Busy Calls</div>
            <div className="stat-sublabel">of total calls</div>
          </div>
        </div>
      </div>

      {/* Monthly Row */}
      <div className="call-center-agent-summary">
        <div className="call-center-agent-card answered-calls">
          <div className="stat-icon">
            <MdPhone style={{ color: "#4caf50" }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              <span className="stat-percentage" style={{ color: "#4caf50" }}>
                ({monthlyAnsweredPercent}%)
              </span>{" "}
              {monthlyAnswered}
            </div>
            <div className="stat-label">Monthly Answered Calls</div>
            <div className="stat-sublabel">of monthly calls</div>
          </div>
        </div>
        <div className="call-center-agent-card no-answer-calls">
          <div className="stat-icon">
            <MdPhoneDisabled style={{ color: "#ff9800" }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              <span className="stat-percentage" style={{ color: "#ff9800" }}>
                ({monthlyNoAnswerPercent}%)
              </span>{" "}
              {monthlyNoAnswer}
            </div>
            <div className="stat-label">Monthly No Answer Calls</div>
            <div className="stat-sublabel">of monthly calls</div>
          </div>
        </div>
        <div className="call-center-agent-card busy-calls">
          <div className="stat-icon">
            <MdCallEnd style={{ color: "#f44336" }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              <span className="stat-percentage" style={{ color: "#f44336" }}>
                ({monthlyBusyPercent}%)
              </span>{" "}
              {monthlyBusy}
            </div>
            <div className="stat-label">Monthly Busy Calls</div>
            <div className="stat-sublabel">of monthly calls</div>
          </div>
        </div>
      </div>

      {/* Daily Row */}
      <div className="call-center-agent-summary">
        <div className="call-center-agent-card answered-calls">
          <div className="stat-icon">
            <MdPhone style={{ color: "#4caf50" }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              <span className="stat-percentage" style={{ color: "#4caf50" }}>
                ({dailyAnsweredPercent}%)
              </span>{" "}
              {dailyAnswered}
            </div>
            <div className="stat-label">Daily Answered Calls</div>
            <div className="stat-sublabel">of daily calls</div>
          </div>
        </div>
        <div className="call-center-agent-card no-answer-calls">
          <div className="stat-icon">
            <MdPhoneDisabled style={{ color: "#ff9800" }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              <span className="stat-percentage" style={{ color: "#ff9800" }}>
                ({dailyNoAnswerPercent}%)
              </span>{" "}
              {dailyNoAnswer}
            </div>
            <div className="stat-label">Daily No Answer Calls</div>
            <div className="stat-sublabel">of daily calls</div>
          </div>
        </div>
        <div className="call-center-agent-card busy-calls">
          <div className="stat-icon">
            <MdCallEnd style={{ color: "#f44336" }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              <span className="stat-percentage" style={{ color: "#f44336" }}>
                ({dailyBusyPercent}%)
              </span>{" "}
              {dailyBusy}
            </div>
            <div className="stat-label">Daily Busy Calls</div>
            <div className="stat-sublabel">of daily calls</div>
          </div>
        </div>
      </div>

      {/* Donut Charts for Card Summaries */}
      <div className="donut-charts-container" style={{ marginTop: "20px" }}>
        <div className="chart-card">
          <h4>Yearly Call Distribution</h4>
          <Doughnut
            data={yearlyDonutData}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: "bottom",
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const label = context.label || "";
                      const value = context.parsed || 0;
                      const total = context.dataset.data.reduce(
                        (a, b) => a + b,
                        0
                      );
                      const percentage =
                        total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                      return `${label}: ${value} (${percentage}%)`;
                    },
                  },
                },
              },
            }}
          />
        </div>
        <div className="chart-card">
          <h4>Monthly Call Distribution</h4>
          <Doughnut
            data={monthlyDonutData}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: "bottom",
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const label = context.label || "";
                      const value = context.parsed || 0;
                      const total = context.dataset.data.reduce(
                        (a, b) => a + b,
                        0
                      );
                      const percentage =
                        total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                      return `${label}: ${value} (${percentage}%)`;
                    },
                  },
                },
              },
            }}
          />
        </div>
        <div className="chart-card">
          <h4>Daily Call Distribution</h4>
          <Doughnut
            data={dailyDonutData}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: "bottom",
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const label = context.label || "";
                      const value = context.parsed || 0;
                      const total = context.dataset.data.reduce(
                        (a, b) => a + b,
                        0
                      );
                      const percentage =
                        total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                      return `${label}: ${value} (${percentage}%)`;
                    },
                  },
                },
              },
            }}
          />
        </div>
        <div className="chart-card">
          <h4>Call Distribution</h4>
          <Pie data={pieData} options={{ responsive: true }} />
        </div>
      </div>

      {/* <div className="charts-container">
        <div className="chart-card-bar">
          <h4>Call Counts by Disposition</h4>
          <Bar data={barData} options={{ responsive: true }} />
        </div>
      </div> */}

      {/* Softphone popup */}
      {showPhonePopup && (
        <div className="modern-phone-popup">
          <div className="modern-phone-header">
            <span>
              {phoneStatus === "In Call" ? "Call in Progress" : "Phone"}
            </span>
            <button
              onClick={togglePhonePopup}
              className="modern-close-btn"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          <div className="modern-phone-body">
            {phoneStatus === "In Call" && (
              <>
                <div className="modern-phone-status">
                  <span className="modern-status-badge">In Call</span>
                  <span className="modern-call-duration">
                    {formatDuration(callDuration)}
                  </span>
                </div>
                {/* Blind transfer (online only) */}
                <Autocomplete
                  options={onlineUsers.filter(
                    (u) =>
                      !!u.extension &&
                      (u.role === "agent" || u.role === "supervisor") &&
                      String(u.extension) !== String(extension)
                  )}
                  getOptionLabel={(u) =>
                    u
                      ? `${u.extension} — ${u.name || u.username || "User"} (${
                          u.role
                        })`
                      : ""
                  }
                  isOptionEqualToValue={(a, b) => a?.extension === b?.extension}
                  onChange={(_, u) => setTransferTarget(u?.extension || "")}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Transfer to online (agent/supervisor)"
                      variant="outlined"
                      margin="normal"
                      fullWidth
                    />
                  )}
                  fullWidth
                />
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => handleBlindTransfer()}
                  disabled={!session || !transferTarget}
                  fullWidth
                  className="modern-action-btn"
                  style={{ marginTop: 10 }}
                >
                  Transfer
                </Button>
              </>
            )}

            {phoneStatus !== "In Call" && (
              <>
                <TextField
                  label="Phone Number"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                {showKeypad && (
                  <div className="modern-keypad" style={{ marginBottom: 10 }}>
                    {[
                      "1",
                      "2",
                      "3",
                      "4",
                      "5",
                      "6",
                      "7",
                      "8",
                      "9",
                      "*",
                      "0",
                      "#",
                    ].map((d) => (
                      <button
                        key={d}
                        className="modern-keypad-btn"
                        onClick={() => setPhoneNumber((p) => p + d)}
                      >
                        {d}
                      </button>
                    ))}
                    <button
                      className="modern-keypad-btn"
                      onClick={() => setPhoneNumber((p) => p.slice(0, -1))}
                      style={{
                        gridColumn: "span 3",
                        background: "#ffeaea",
                        color: "#e53935",
                        fontSize: "1.3rem",
                      }}
                      aria-label="Backspace"
                    >
                      DEL
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="modern-phone-actions">
              <Tooltip title="Toggle Speaker">
                <IconButton onClick={toggleSpeaker}>
                  <HiMiniSpeakerWave
                    fontSize={20}
                    style={iconStyle(isSpeakerOn ? "green" : "grey")}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title={isOnHold ? "Resume Call" : "Hold Call"}>
                <IconButton onClick={toggleHold}>
                  <MdPauseCircleOutline
                    fontSize={20}
                    style={iconStyle(isOnHold ? "orange" : "#3c8aba")}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title="Keypad">
                <IconButton onClick={() => setShowKeypad((p) => !p)}>
                  <IoKeypadOutline
                    fontSize={20}
                    style={iconStyle(showKeypad ? "#1976d2" : "#939488")}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title="End Call">
                <IconButton onClick={handleEndCall}>
                  <MdLocalPhone fontSize={20} style={iconStyle("red")} />
                </IconButton>
              </Tooltip>
              <Tooltip title={isMuted ? "Unmute Mic" : "Mute Mic"}>
                <IconButton onClick={toggleMute}>
                  <BsFillMicMuteFill
                    fontSize={20}
                    style={iconStyle(isMuted ? "orange" : "grey")}
                  />
                </IconButton>
              </Tooltip>
            </div>

            {phoneStatus !== "In Call" && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleDial}
                disabled={
                  phoneStatus === "Dialing" || phoneStatus === "Ringing"
                }
                className="modern-action-btn"
                style={{ marginTop: 10 }}
              >
                Dial
              </Button>
            )}

            {incomingCall && phoneStatus !== "In Call" && (
              <>
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontWeight: 500 }}>From: </span>
                  {lastIncomingNumber || "Unknown"}
                </div>
                <div className="modern-phone-actions">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAcceptCall}
                    className="modern-action-btn"
                  >
                    Accept
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleRejectCall}
                    className="modern-action-btn"
                  >
                    Reject
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
    </div>
  );
}
