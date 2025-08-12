import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MdOutlineLocalPhone,
  MdPauseCircleOutline,
  MdLocalPhone,
  MdOutlineVoicemail,
  MdOutlineFreeBreakfast,
  MdWifiCalling2,
  MdOutlineFollowTheSigns,
  MdOutlineLunchDining,
} from "react-icons/md";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { IoKeypadOutline } from "react-icons/io5";
import { BsFillMicMuteFill } from "react-icons/bs";
import { GiExplosiveMeeting, GiTrafficLightsReadyToGo } from "react-icons/gi";
import { TbEmergencyBed } from "react-icons/tb";
import { FiPhoneOff, FiPhoneCall, FiPhoneIncoming } from "react-icons/fi";
import {
  UserAgent,
  Inviter,
  Registerer,
  SessionState,
} from "sip.js";
import {
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Autocomplete,
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

export default function AgentsDashboard() {
  // --------- Core phone state ---------
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState("Idle");
  const [userAgent, setUserAgent] = useState(null);
  const [session, setSession] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [lastIncomingNumber, setLastIncomingNumber] = useState("");

  const [ringAudio] = useState(() => new Audio("/ringtone.mp3"));
  const remoteAudioRef = useRef(null);

  // --------- Call control ---------
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isOnHold, setIsOnHold] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [transferTarget, setTransferTarget] = useState("");

  // --------- Status / break menu ---------
  const [anchorEl, setAnchorEl] = useState(null);
  const openStatus = Boolean(anchorEl);
  const [agentStatus, setAgentStatus] = useState("ready");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [userDefinedTimes, setUserDefinedTimes] = useState({ attendingMeeting: 0, emergency: 0 });

  // --------- Timers (separate refs!) ---------
  const callTimerRef = useRef(null);
  const statusTimerRef = useRef(null);
  const autoRejectTimerRef = useRef(null);
  const wasAnsweredRef = useRef(false);

  // --------- Missed calls ---------
  const [missedCalls, setMissedCalls] = useState([]);
  const [missedOpen, setMissedOpen] = useState(false);

  // --------- Tickets / MAC lookup ---------
  const [userData, setUserData] = useState(null);
  const [showUserForm, setShowUserForm] = useState(true);
  const [functionData, setFunctionData] = useState([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketPhoneNumber, setTicketPhoneNumber] = useState("");

  // --------- Online users (for transfer) ---------
  const [onlineUsers, setOnlineUsers] = useState([]);

  // --------- Voice notes ---------
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [unplayedVoiceNotes, setUnplayedVoiceNotes] = useState(0);
  const [showVoiceNotesModal, setShowVoiceNotesModal] = useState(false);

  // --------- Snackbars ---------
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("warning");

  // --------- Config ---------
  const extension = localStorage.getItem("extension");
  const sipPassword = localStorage.getItem("sipPassword");
  const SIP_DOMAIN = "192.168.21.70"; // unify here (adjust if needed)

  const sipConfig = useMemo(() => {
    if (!extension || !sipPassword) return null;
    return {
      uri: UserAgent.makeURI(`sip:${extension}@${SIP_DOMAIN}`),
      transportOptions: { server: `wss://${SIP_DOMAIN}:8089/ws` },
      authorizationUsername: extension,
      authorizationPassword: sipPassword,
      sessionDescriptionHandlerFactoryOptions: {
        constraints: { audio: true, video: false },
        // Use TURN for external callers behind NATs/firewalls
        peerConnectionConfiguration: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // TODO: replace with your TURN server details
            // { urls: ['turn:turn.example.com:3478','turns:turn.example.com:5349'], username: 'user', credential: 'pass' },
          ],
        },
      },
    };
  }, [extension, sipPassword]);

  // ---------- Helpers ----------
  const iconStyle = (bgColor) => ({ backgroundColor: bgColor, padding: 10, borderRadius: "50%", color: "white" });
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    const pad = (n) => String(n).padStart(2, "0");
    return hrs > 0 ? `${pad(hrs)}:${pad(mins % 60)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };
  const formatRemainingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(mins)}:${pad(secs)}`;
  };
  const mapActivityToTimerKey = (activity) => {
    switch ((activity || "").toLowerCase()) {
      case "breakfast": return "breakfast";
      case "lunch": return "lunch";
      case "short call": return "shortCall";
      case "follow-up of customer inquiries": return "followUp";
      case "attending meeting": return "attendingMeeting";
      case "emergency": return "emergency";
      default: return null; // covers "ready" and unknowns
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

  const showAlert = (message, severity = "warning") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // ---------- Ringtone ----------
  const stopRingtone = () => { ringAudio.pause(); ringAudio.currentTime = 0; };

  // ---------- Timers ----------
  const startCallTimer = () => {
    stopCallTimer();
    callTimerRef.current = setInterval(() => setCallDuration((p) => p + 1), 1000);
  };
  const stopCallTimer = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = null;
    setCallDuration(0);
  };

  const startStatusTimer = (activity) => {
    const key = mapActivityToTimerKey(activity);
    if (!key) return;
    const limit = timeIntervals[key] || 0;
    stopStatusTimer();
    setTimeRemaining(limit);
    statusTimerRef.current = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) { alert(`You have exceeded your ${activity} time limit.`); stopStatusTimer(); return 0; }
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
    return () => { stopCallTimer(); stopStatusTimer(); };
  }, []);

  // ---------- SIP: incoming ----------
  const handleIncomingInvite = (invitation) => {
    wasAnsweredRef.current = false;

    const number = invitation?.remoteIdentity?.uri?.user || "";
    setLastIncomingNumber(number);
    setIncomingCall(invitation);
    setShowPhonePopup(true);
    setPhoneStatus("Ringing");

    // Pre-fetch user info by phone
    if (number) fetchUserByPhoneNumber(number);

    ringAudio.loop = true; ringAudio.volume = 0.7;
    ringAudio.play().catch(() => {});

    invitation.stateChange.addListener((state) => {
      if (state === SessionState.Terminated) {
        stopRingtone();
        clearTimeout(autoRejectTimerRef.current);
        setIncomingCall(null);
        setShowPhonePopup(false);
        setPhoneStatus("Idle");
        setShowUserForm(false);
        setUserData(null);
        if (!wasAnsweredRef.current) addMissedCall(number);
      }
    });

    autoRejectTimerRef.current = setTimeout(() => {
      invitation.reject().catch(console.error);
      setShowPhonePopup(false);
      setPhoneStatus("Idle");
      stopRingtone();
      setIncomingCall(null);
      setShowUserForm(false);
      setUserData(null);
      if (!wasAnsweredRef.current) addMissedCall(number);
    }, 20000);
  };

  // ---------- SIP: UA startup ----------
  useEffect(() => {
    if (!sipConfig) {
      setPhoneStatus("Not configured");
      return;
    }
    const ua = new UserAgent(sipConfig);
    const registerer = new Registerer(ua);

    // set delegate BEFORE start to handle early INVITEs
    ua.delegate = { onInvite: handleIncomingInvite };

    setUserAgent(ua);

    ua
      .start()
      .then(() => { registerer.register(); setPhoneStatus("Idle"); })
      .catch((error) => { console.error("UA failed to start:", error); setPhoneStatus("Connection Failed"); });

    return () => {
      registerer.unregister().catch(console.error);
      ua.stop();
      stopRingtone();
      stopCallTimer();
    };
  }, [sipConfig]);

  // ---------- Fetch function data (ticket modal) ----------
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${baseURL}/section/functions-data`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        setFunctionData(json.data || []);
      } catch (err) { console.error("Fetch functionData error:", err); }
    })();
  }, []);

  // ---------- Online users (for transfer options) ----------
  useEffect(() => { if (showPhonePopup) fetchOnlineUsers(); }, [showPhonePopup]);
  const fetchOnlineUsers = async () => {
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      };

      // Fetch agents and supervisors from their own endpoints
      const [agentsRes, supervisorsRes] = await Promise.all([
        fetch(`${baseURL}/users/agents-online`, { method: "GET", headers }),
        fetch(`${baseURL}/users/supervisors-online`, { method: "GET", headers }),
      ]);

      if (!agentsRes.ok && !supervisorsRes.ok) throw new Error("Failed to fetch online users");

      const [agentsPayload, supervisorsPayload] = await Promise.all([
        agentsRes.ok ? agentsRes.json() : Promise.resolve([]),
        supervisorsRes.ok ? supervisorsRes.json() : Promise.resolve([]),
      ]);

      const extractUsers = (payload) => {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload.agents)) return payload.agents;
        if (Array.isArray(payload.supervisors)) return payload.supervisors;
        if (Array.isArray(payload.data)) return payload.data;
        if (Array.isArray(payload.items)) return payload.items;
        return [];
      };

      const agents = extractUsers(agentsPayload).map((u) => ({ ...u, role: u.role || "agent" }));
      const supervisors = extractUsers(supervisorsPayload).map((u) => ({ ...u, role: u.role || "supervisor" }));

      // Only keep entries that have an extension or username (for display/transfer)
      const selfExt = String(localStorage.getItem("extension") || "");
      const selfUserId = String(localStorage.getItem("userId") || "");
      const selfUsername = String(localStorage.getItem("username") || "");
      const combined = [...agents, ...supervisors]
        .filter((u) => u && (u.extension || u.username))
        .filter((u) => {
          const uExt = String(u.extension || "");
          const uId = String((u.id ?? u.userId ?? u._id) || "");
          const uName = String(u.username || u.name || "");
          return uExt !== selfExt && uId !== selfUserId && uName !== selfUsername;
        });
      setOnlineUsers(combined);
      return combined;
    } catch (err) {
      setOnlineUsers([]);
      return [];
    }
  };

  // ---------- Voice notes ----------
  useEffect(() => {
    const fetchVoiceNotes = async () => {
      try {
        const agentId = localStorage.getItem("userId");
        const response = await fetch(`${baseURL}/voice-notes?agentId=${agentId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        });
        if (!response.ok) throw new Error("Failed to fetch voice notes");
        const data = await response.json();
        const notes = data.voiceNotes || [];
        const storedPlayed = JSON.parse(localStorage.getItem("playedVoiceNotes")) || {};
        const unplayedCount = notes.filter((note) => !storedPlayed[note.id]).length;
        setVoiceNotes(notes);
        setUnplayedVoiceNotes(unplayedCount);
      } catch (error) {
        setVoiceNotes([]);
        setUnplayedVoiceNotes(0);
      }
    };
    fetchVoiceNotes();
    const handleStorage = (e) => { if (e.key === "playedVoiceNotes") fetchVoiceNotes(); };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // ---------- Missed calls ----------
  useEffect(() => { fetchMissedCallsFromBackend(); }, []);
  const addMissedCall = (raw) => {
    const agentId = localStorage.getItem("extension");
    if (!raw || raw.trim() === "") return;
    let formattedCaller = raw.startsWith("+255") ? `0${raw.substring(4)}` : raw;
    const time = new Date();
    const newCall = { caller: formattedCaller, time };
    setMissedCalls((prev) => [...prev, newCall]);
    showAlert(`Missed Call from ${formattedCaller}`, "warning");

    fetch(`${baseURL}/missed-calls`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      body: JSON.stringify({ caller: formattedCaller, time: time.toISOString(), agentId }),
    }).catch((err) => console.error("Failed to post missed call:", err));
  };
  const fetchMissedCallsFromBackend = async () => {
    try {
      const ext = localStorage.getItem("extension");
      const response = await fetch(`${baseURL}/missed-calls?agentId=${ext}&status=pending`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      if (!response.ok) throw new Error("Failed to fetch missed calls");
      const data = await response.json();
      const formatted = (data || []).map((call) => ({ ...call, time: new Date(call.time) }));
      setMissedCalls(formatted);
      localStorage.setItem("missedCalls", JSON.stringify(formatted));
    } catch (error) {
      console.error("Error fetching missed calls:", error);
    }
  };

  // ---------- MAC: fetch user by phone ----------
  const fetchUserByPhoneNumber = async (phone) => {
    try {
      const response = await fetch(`${baseURL}/mac-system/search-by-phone-number?phone_number=${encodeURIComponent(phone)}`);
      if (!response.ok) { setUserData(null); setShowUserForm(false); return; }
      const data = await response.json();
      setUserData(data);
      setShowUserForm(true);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setUserData(null);
      setShowUserForm(false);
    }
  };

  // ---------- Phone controls ----------
  const togglePhonePopup = () => setShowPhonePopup((v) => !v);

  const toggleMute = () => {
    if (!session) return;
    const pc = session.sessionDescriptionHandler.peerConnection;
    pc.getSenders().forEach((sender) => {
      if (sender.track && sender.track.kind === "audio") {
        sender.track.enabled = !sender.track.enabled;
        setIsMuted(!sender.track.enabled);
      }
    });
  };
  const toggleSpeaker = () => {
    const el = remoteAudioRef.current;
    if (el && el.setSinkId) {
      const deviceId = isSpeakerOn ? 'communications' : 'default';
      el.setSinkId(deviceId).then(() => setIsSpeakerOn(!isSpeakerOn)).catch(() => {});
    }
  };
  const toggleHold = () => {
    if (!session) return;
    const pc = session.sessionDescriptionHandler.peerConnection;
    const senders = pc.getSenders();
    if (isOnHold) senders.forEach((s) => { if (s.track && s.track.kind === "audio") s.track.enabled = true; });
    else senders.forEach((s) => { if (s.track && s.track.kind === "audio") s.track.enabled = false; });
    setIsOnHold(!isOnHold);
  };
  const sendDTMF = (digit) => {
    if (!session?.sessionDescriptionHandler) return;
    const sender = session.sessionDescriptionHandler.peerConnection.getSenders().find((s) => s.dtmf);
    if (sender?.dtmf) sender.dtmf.insertDTMF(digit);
  };

  const attachMediaStream = (sipSession) => {
    const pc = sipSession.sessionDescriptionHandler.peerConnection;

    // Attach any already-present remote tracks
    const existing = new MediaStream();
    pc.getReceivers().forEach((r) => { if (r.track) existing.addTrack(r.track); });
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = existing;
      // remoteAudioRef.current.play().catch(() => {});
    }

    // React to future tracks (common for external/PSTN calls)
    pc.ontrack = (event) => {
      const stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        // remoteAudioRef.current.play().catch(() => {});
      }
    };
  };

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
        setTicketPhoneNumber(lastIncomingNumber || "");
        setShowTicketModal(true);

        incomingCall.stateChange.addListener((state) => {
          if (state === SessionState.Established) attachMediaStream(incomingCall);
          if (state === SessionState.Terminated) {
            setPhoneStatus("Idle");
            setSession(null);
            if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
            stopCallTimer();
          }
        });
      })
      .catch((error) => { console.error("Failed to accept call:", error); setPhoneStatus("Idle"); setShowPhonePopup(false); });
  };

  const handleRejectCall = () => {
    if (!incomingCall) return;
    clearTimeout(autoRejectTimerRef.current);
    incomingCall.reject().catch(console.error);
    addMissedCall(lastIncomingNumber);
    setIncomingCall(null);
    setShowPhonePopup(false);
    setPhoneStatus("Idle");
    stopRingtone();
  };

  const handleEndCall = () => {
    if (session) {
      session.bye().catch(console.error);
      setSession(null);
      setPhoneStatus("Idle");
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
      stopRingtone();
      stopCallTimer();
      setShowPhonePopup(false);
      setIncomingCall(null);
    } else if (incomingCall) {
      incomingCall.reject().catch(console.error);
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
          if (state === SessionState.Established) { attachMediaStream(inviter); setPhoneStatus("In Call"); startCallTimer(); }
          if (state === SessionState.Terminated) { setPhoneStatus("Idle"); setSession(null); if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null; stopCallTimer(); }
        });
      })
      .catch((error) => { console.error("Call failed:", error); setPhoneStatus("Call Failed"); });
  };

  const handleRedial = (number, missedCallId = null) => {
    if (!userAgent || !number) return;
    const formatted = number.startsWith("+255") ? `0${number.substring(4)}` : number;
    const targetURI = UserAgent.makeURI(`sip:${formatted}@${SIP_DOMAIN}`);
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
            if (missedCallId) {
              fetch(`${baseURL}/missed-calls/${missedCallId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
                body: JSON.stringify({ status: "called_back" }),
              })
                .then((res) => { if (!res.ok) throw new Error("Failed to update status"); return res.json(); })
                .then(() => setMissedCalls((prev) => prev.filter((c) => c.id !== missedCallId)))
                .catch((err) => console.error("Failed to update missed call status:", err));
            }
          }
          if (state === SessionState.Terminated) { setPhoneStatus("Idle"); setSession(null); if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null; stopCallTimer(); }
        });
      })
      .catch((error) => { console.error("Redial invite failed:", error); setPhoneStatus("Call Failed"); });
  };

  // ---------- BLIND TRANSFER ONLY ----------
  const handleBlindTransfer = async (targetExt) => {
    const target = String(targetExt ?? transferTarget ?? "").trim();
    if (!session || !target) {
      showAlert("Select an online agent/supervisor to transfer", "warning");
      return;
    }
    // Enforce ONLINE only (agents or supervisors)
    const isAllowed = onlineUsers.some(
      (u) => (u.role === "agent" || u.role === "supervisor") && String(u.extension) === target
    );
    if (!isAllowed) {
      showAlert("Target is not currently online", "error");
      return;
    }
    try {
      const targetURI = UserAgent.makeURI(`sip:${target}@${SIP_DOMAIN}`);
      if (!targetURI) { showAlert("Invalid transfer target", "error"); return; }

      await session.refer(targetURI);
      showAlert(`Call transferred to ${target}`, "success");
      handleEndCall(); // end the agent leg after blind transfer
    } catch (err) {
      console.error("Transfer failed:", err);
      showAlert("Transfer failed", "error");
    }
  };

  // ---------- Status menu ----------
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleAgentEmergency = async (activity) => {
    // Update local UI state
    setAgentStatus(activity);

    // Start/stop status timer
    if ((activity || "").toLowerCase() !== "ready") startStatusTimer(activity);
    else stopStatusTimer();

    // Translate to backend online/offline
    const statusToUpdate = (activity || "").toLowerCase() === "ready" ? "online" : "offline";
    try {
      await fetch(`${baseURL}/users/status/${localStorage.getItem("userId")}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        body: JSON.stringify({ status: statusToUpdate }),
      });
    } catch (err) { console.error("Failed to update status:", err); }
  };

  return (
    <div className="p-6">
      {/* hidden remote audio for WebRTC (needed esp. on iOS/Safari) */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
      <div className="agent-body">
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <h3>Agent</h3>
          <Tooltip title="View Missed Calls" arrow>
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setMissedOpen(true)}>
              <FiPhoneIncoming size={20} />
              {missedCalls.length > 0 && (
                <span style={{ position: "absolute", top: -5, right: -5, background: "red", color: "white", fontSize: "12px", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {missedCalls.length}
                </span>
              )}
            </div>
          </Tooltip>
          <Tooltip title="Voice Notes" arrow>
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setShowVoiceNotesModal(true)}>
              <MdOutlineVoicemail size={22} />
              {unplayedVoiceNotes > 0 && (
                <span style={{ position: "absolute", top: -5, right: -5, background: "orange", color: "white", fontSize: "12px", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {unplayedVoiceNotes}
                </span>
              )}
            </div>
          </Tooltip>
        </div>

        <div className="phone-navbar">
          {agentStatus === "ready" ? (
            <>
              <MdOutlineLocalPhone className="phone-btn-call" onClick={togglePhonePopup} />
              <h4 style={{ backgroundColor: "green", color: "white", padding: "7px", borderRadius: "15px" }}>{agentStatus.toUpperCase()}</h4>
            </>
          ) : (
            <>
              <FiPhoneOff className="out-phone-btn-call" />
              <div>
                <h4 style={{ backgroundColor: "red", color: "white", padding: "7px", borderRadius: "15px" }}>{agentStatus.toUpperCase()}</h4>
                <span style={{ color: "black", marginLeft: "10px" }}>Time Remaining: {formatRemainingTime(timeRemaining)}</span>
              </div>
            </>
          )}
          <Tooltip title="Agent Emergency">
            <IconButton onClick={handleClick} size="small" sx={{ ml: 2 }} aria-controls={openStatus ? "account-menu" : undefined} aria-haspopup="true" aria-expanded={openStatus ? "true" : undefined}>
              <Avatar sx={{ width: 32, height: 32 }}>E</Avatar>
            </IconButton>
          </Tooltip>
        </div>

        <div className="dashboard-single-agent-row_two">
          <CallQueueCard />
        </div>

        <div className="dashboard-single-agent">
          <SingleAgentDashboardCard />
        </div>

        <div className="dashboard-single-agent-row_two">
          <OnlineAgentsTable />
          <OnlineSupervisorsTable />
        </div>

        <div className="dashboard-single-agent-row_four">
          <AgentPerformanceScore />
        </div>
      </div>

      {/* Status menu */}
      <Menu anchorEl={anchorEl} id="account-menu" open={openStatus} onClose={handleClose} onClick={handleClose}
        slotProps={{ paper: { elevation: 0, sx: { overflow: "visible", filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))", mt: 1.5, "& .MuiAvatar-root": { width: 32, height: 32, ml: -0.5, mr: 1 }, "&::before": { content: '""', display: "block", position: "absolute", top: 0, right: 14, width: 10, height: 10, bgcolor: "background.paper", transform: "translateY(-50%) rotate(45deg)", zIndex: 0 } } } }}
        transformOrigin={{ horizontal: "right", vertical: "top" }} anchorOrigin={{ horizontal: "right", vertical: "bottom" }}>
        <MenuItem onClick={() => handleAgentEmergency("ready")}><ListItemIcon><GiTrafficLightsReadyToGo fontSize="large" /></ListItemIcon>Ready</MenuItem>
        <MenuItem onClick={() => handleAgentEmergency("breakfast")}><ListItemIcon><MdOutlineFreeBreakfast fontSize="large" /></ListItemIcon>Breakfast</MenuItem>
        <MenuItem onClick={() => handleAgentEmergency("lunch")}><ListItemIcon><MdOutlineLunchDining fontSize="large" /></ListItemIcon>Lunch</MenuItem>
        <MenuItem onClick={() => handleAgentEmergency("attending meeting")}><ListItemIcon><GiExplosiveMeeting fontSize="large" /></ListItemIcon>Attending Meeting</MenuItem>
        <MenuItem onClick={() => handleAgentEmergency("short call")}><ListItemIcon><MdWifiCalling2 fontSize="large" /></ListItemIcon>Short Call</MenuItem>
        <MenuItem onClick={() => handleAgentEmergency("emergency")}><ListItemIcon><TbEmergencyBed fontSize="large" /></ListItemIcon>Emergency</MenuItem>
        <MenuItem onClick={() => handleAgentEmergency("follow-up of customer inquiries")}><ListItemIcon><MdOutlineFollowTheSigns fontSize="large" /></ListItemIcon>Follow-up of customer inquiries</MenuItem>
      </Menu>

      {/* Phone popup */}
      {showPhonePopup && (
        <div className="modern-phone-popup">
          <div className="modern-phone-header">
            <span>{phoneStatus === "In Call" ? "Call in Progress" : "Phone"}</span>
            <button onClick={togglePhonePopup} className="modern-close-btn" aria-label="Close">&times;</button>
          </div>

          <div className="modern-phone-body">
            {phoneStatus === "In Call" && (
              <>
                <div className="modern-phone-status">
                  <span className="modern-status-badge">In Call</span>
                  <span className="modern-call-duration">{formatDuration(callDuration)}</span>
                </div>

                {/* BLIND TRANSFER UI (online only) */}
                <Autocomplete
                  options={onlineUsers.filter((u) => !!u.extension && (u.role === "agent" || u.role === "supervisor") && String(u.extension) !== String(extension))}
                  getOptionLabel={(u) => (u ? `${u.extension} — ${(u.name || u.username || "User")} (${u.role})` : "")}
                  isOptionEqualToValue={(a, b) => a?.extension === b?.extension}
                  onChange={(_, u) => {
                    setTransferTarget(u?.extension || "");
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Transfer to online (agent/supervisor)" variant="outlined" margin="normal" fullWidth />
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
                <TextField label="Phone Number" variant="outlined" fullWidth margin="normal" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                {showKeypad && (
                  <div className="modern-keypad" style={{ marginBottom: 10 }}>
                    {["1","2","3","4","5","6","7","8","9","*","0","#"].map((digit) => (
                      <button key={digit} className="modern-keypad-btn" onClick={() => setPhoneNumber((prev) => prev + digit)}>{digit}</button>
                    ))}
                    <button className="modern-keypad-btn" onClick={() => setPhoneNumber((prev) => prev.slice(0, -1))} style={{ gridColumn: "span 3", background: "#ffeaea", color: "#e53935", fontSize: "1.3rem" }} aria-label="Backspace">DEL</button>
                  </div>
                )}
              </>
            )}

            <div className="modern-phone-actions">
              <Tooltip title="Toggle Speaker"><IconButton onClick={toggleSpeaker}><HiMiniSpeakerWave fontSize={20} style={iconStyle(isSpeakerOn ? "green" : "grey")} /></IconButton></Tooltip>
              <Tooltip title={isOnHold ? "Resume Call" : "Hold Call"}><IconButton onClick={toggleHold}><MdPauseCircleOutline fontSize={20} style={iconStyle(isOnHold ? "orange" : "#3c8aba")} /></IconButton></Tooltip>
              <Tooltip title="Keypad"><IconButton onClick={() => setShowKeypad((p) => !p)}><IoKeypadOutline fontSize={20} style={iconStyle(showKeypad ? "#1976d2" : "#939488")} /></IconButton></Tooltip>
              <Tooltip title="End Call"><IconButton onClick={handleEndCall}><MdLocalPhone fontSize={20} style={iconStyle("red")} /></IconButton></Tooltip>
              <Tooltip title={isMuted ? "Unmute Mic" : "Mute Mic"}><IconButton onClick={toggleMute}><BsFillMicMuteFill fontSize={20} style={iconStyle(isMuted ? "orange" : "grey")} /></IconButton></Tooltip>
            </div>

            {phoneStatus !== "In Call" && (
              <Button variant="contained" color="primary" onClick={handleDial} disabled={phoneStatus === "Dialing" || phoneStatus === "Ringing"} className="modern-action-btn" style={{ marginTop: 10 }}>
                Dial
              </Button>
            )}

            {incomingCall && phoneStatus !== "In Call" && (
              <>
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontWeight: 500 }}>From: </span>{lastIncomingNumber || "Unknown"}
                </div>
                <div className="modern-phone-actions">
                  <Button variant="contained" color="primary" onClick={handleAcceptCall} className="modern-action-btn">Accept</Button>
                  <Button variant="contained" color="secondary" onClick={handleRejectCall} className="modern-action-btn">Reject</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Missed calls dialog */}
      <Dialog open={missedOpen} onClose={() => setMissedOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Missed Calls</DialogTitle>
        <DialogContent dividers>
          {missedCalls.length === 0 ? (
            <p>No missed calls!</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {[...missedCalls].reverse().map((call, index) => (
                <li key={index} style={{ marginBottom: 15, borderBottom: "1px solid #ccc", paddingBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{call.caller}</strong>
                    <br />
                    <small>{new Date(call.time).toLocaleTimeString()}</small>
                  </div>
                  <Button variant="contained" color="primary" size="small" onClick={() => { setMissedOpen(false); setShowPhonePopup(true); setPhoneNumber(call.caller); handleRedial(call.caller, call.id); }} startIcon={<FiPhoneCall />}>Call Back</Button>
                </li>
              ))}
            </ul>
          )}
          <Button onClick={() => { setMissedCalls([]); localStorage.removeItem("missedCalls"); }} fullWidth variant="outlined" color="error" style={{ marginTop: 10 }}>Clear Missed Calls</Button>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>{snackbarMessage}</Alert>
      </Snackbar>

      {/* Create Ticket quick button */}
      <Button variant="contained" color="primary" onClick={() => { setTicketPhoneNumber(phoneNumber || ""); setShowTicketModal(true); }}>
        Create Ticket
      </Button>

      {/* Ticket modal */}
      <AdvancedTicketCreateModal open={showTicketModal} onClose={() => setShowTicketModal(false)} initialPhoneNumber={ticketPhoneNumber} functionData={functionData} />

      {/* Voice notes modal */}
      <Dialog open={showVoiceNotesModal} onClose={() => setShowVoiceNotesModal(false)} fullWidth maxWidth="md">
        <DialogContent>
          <VoiceNotesReport />
        </DialogContent>
      </Dialog>
    </div>
  );
}
