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
  
  // Ticket form data preservation
  const [ticketFormData, setTicketFormData] = useState({});
  const [ticketType, setTicketType] = useState(null); // 'employer' or 'employee'
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

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
  
  // Test function for debugging incoming calls
  const testIncomingCall = () => {
    console.log("Testing incoming call...");
    
    // Clean up any existing states first
    if (session) {
      setSession(null);
    }
    if (incomingCall) {
      setIncomingCall(null);
    }
    setPhoneStatus("Idle");
    stopCallTimer();
    stopRingtone();
    
    setLastIncomingNumber("123456789");
    
    // Create a mock SIP invitation object for testing
    const mockInvitation = {
      test: true,
      accept: (options) => {
        console.log("Mock accept called with options:", options);
        return Promise.resolve();
      },
      reject: () => {
        console.log("Mock reject called");
        return Promise.resolve();
      },
      stateChange: {
        addListener: (callback) => {
          console.log("Mock state listener added");
          // Simulate call state changes
          setTimeout(() => callback(SessionState.Established), 1000);
        }
      }
    };
    
    setIncomingCall(mockInvitation);
    setShowPhonePopup(true);
    setPhoneStatus("Ringing");
    
    // Test ringtone
    ringAudio.loop = true;
    ringAudio.volume = 0.7;
    ringAudio.play().catch(() => {});
  };
  
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

  // Modal swap functionality
  const swapToTicketModal = () => {
    if (showTicketModal) return; // Already open
    
    console.log("=== SWAP TO TICKET MODAL ===");
    console.log("Current showTicketModal:", showTicketModal);
    console.log("Current showPhonePopup:", showPhonePopup);
    console.log("Current phoneStatus:", phoneStatus);
    
    // Don't close phone popup - keep it open in background
    setShowTicketModal(true);
    setIsTicketModalOpen(true);
    
    console.log("After setting showTicketModal to true");
    
    // Preserve current call context in ticket form data
    if (phoneStatus === "In Call" || phoneStatus === "Ringing") {
      setTicketFormData(prev => ({
        ...prev,
        phoneNumber: lastIncomingNumber || phoneNumber,
        callStatus: phoneStatus,
        callDuration: callDuration,
        timestamp: new Date().toISOString()
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
    
    setShowTicketModal(false);
    setIsTicketModalOpen(false);
    
    console.log("After setting to false - showTicketModal:", false);
    console.log("After setting to false - isTicketModalOpen:", false);
    
    // Form data is preserved in state for next time
    // Phone modal remains open in background
  };

  // Function to handle ticket modal cancellation
  const handleTicketCancel = () => {
    console.log("=== TICKET MODAL CANCELLED ===");
    forceCloseTicketModal();
  };

  // Robust function to close ticket modal
  const forceCloseTicketModal = () => {
    console.log("=== FORCE CLOSE TICKET MODAL ===");
    
    // Set both states to false
    setShowTicketModal(false);
    setIsTicketModalOpen(false);
    
    // Force a re-render by updating the key
    setTimeout(() => {
      console.log("Ticket modal should be closed now");
      
      // Additional check - if modal is still open, force close
      if (showTicketModal || isTicketModalOpen) {
        console.log("Modal still open, forcing close...");
        setShowTicketModal(false);
        setIsTicketModalOpen(false);
      }
    }, 100);
  };

  // Direct DOM-based close function as fallback
  const closeTicketModalDirectly = () => {
    console.log("=== DIRECT DOM CLOSE TICKET MODAL ===");
    
    // Try to close via state first
    setShowTicketModal(false);
    setIsTicketModalOpen(false);
    
    // Also try to close any Material-UI modals directly
    setTimeout(() => {
      const modals = document.querySelectorAll('[role="dialog"], .MuiDialog-root, .MuiModal-root');
      console.log("Found modals:", modals.length);
      
      modals.forEach((modal, index) => {
        console.log(`Modal ${index}:`, modal);
        
        // Try to hide the modal
        if (modal.style) {
          modal.style.display = 'none';
          modal.style.visibility = 'hidden';
          console.log(`Modal ${index} hidden via style`);
        }
        
        // Try to remove the modal
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
          console.log(`Modal ${index} removed from DOM`);
        }
      });
      
      // Force page refresh if modal still exists
      const remainingModals = document.querySelectorAll('[role="dialog"], .MuiDialog-root, .MuiModal-root');
      if (remainingModals.length > 0) {
        console.log("Modal still exists, forcing page refresh");
        window.location.reload();
      }
    }, 200);
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
      timestamp: new Date().toISOString()
    };
    
    setTicketFormData(initialData);
    console.log("Initial form data set for type:", type, initialData);
  };

  // Function to handle ticket submission success
  const handleTicketSubmitted = () => {
    console.log("Ticket submitted successfully - clearing preserved data");
    setTicketFormData({});
    setTicketType(null);
    forceCloseTicketModal();
    showAlert("Ticket created successfully!", "success");
  };

  // Function to clear preserved form data
  const clearTicketFormData = () => {
    console.log("Clearing preserved ticket form data");
    setTicketFormData({});
    setTicketType(null);
  };

  // Handle clicking outside modal
  const handleOutsideClick = (e) => {
    // Check if click is outside the modal content
    if (e.target.classList.contains('MuiBackdrop-root') || 
        e.target.classList.contains('modal-backdrop')) {
      console.log("Clicked outside modal - closing ticket modal, keeping phone modal open");
      
      // Close ticket modal but keep phone modal open
      forceCloseTicketModal();
      
      // Ticket form data is preserved in state
      console.log("Ticket form data preserved:", ticketFormData);
      
      // Don't close phone modal - it stays open
      // setShowPhonePopup(false); // This line is intentionally commented out
    }
  };

  // Debug ticket modal state changes
  useEffect(() => {
    console.log("=== TICKET MODAL STATE CHANGED ===");
    console.log("showTicketModal:", showTicketModal);
    console.log("isTicketModalOpen:", isTicketModalOpen);
    console.log("ticketType:", ticketType);
    
    if (showTicketModal) {
      console.log("Ticket modal should be visible now");
      // Check if the modal is actually in the DOM
      setTimeout(() => {
        const ticketModal = document.querySelector('[role="dialog"], .MuiDialog-root, .MuiModal-root');
        if (ticketModal) {
          console.log("Ticket modal found in DOM:", ticketModal);
          console.log("Ticket modal z-index:", ticketModal.style.zIndex);
          console.log("Ticket modal display:", ticketModal.style.display);
          console.log("Ticket modal visibility:", ticketModal.style.visibility);
        } else {
          console.log("No ticket modal found in DOM");
        }
      }, 200);
    }
  }, [showTicketModal, isTicketModalOpen, ticketType]);

  // Keyboard shortcut to close ticket modal (Escape key)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showTicketModal) {
        console.log("Escape key pressed - closing ticket modal");
        event.preventDefault();
        closeTicketModalDirectly();
      }
    };

    if (showTicketModal) {
      document.addEventListener('keydown', handleKeyDown);
      console.log("Escape key listener added");
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      console.log("Escape key listener removed");
    };
  }, [showTicketModal]);

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
    
    // Check if this is a test call or real SIP invitation
    if (incomingCall.test) {
      console.log("Accepting test call...");
      // Handle test call acceptance
      wasAnsweredRef.current = true;
      setSession(incomingCall);
      setIncomingCall(null);
      setPhoneStatus("In Call");
      stopRingtone();
      startCallTimer();
      
      // Set ticket phone number and open modal directly
      setTicketPhoneNumber(lastIncomingNumber || "");
      openTicketModal('employer'); // Default to employer ticket for test calls
      console.log("Ticket modal opened directly for test call:", lastIncomingNumber);
      
      // Simulate call state changes for test
      setTimeout(() => {
        console.log("Test call established");
        setPhoneStatus("In Call");
      }, 1000);
      
      return;
    }
    
    // Handle real SIP invitation
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
        
        // Set ticket phone number and open modal directly
        setTicketPhoneNumber(lastIncomingNumber || "");
        openTicketModal('employer'); // Default to employer ticket for incoming calls
        console.log("Ticket modal opened directly for incoming call:", lastIncomingNumber);

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
    
    // Check if this is a test call or real SIP invitation
    if (incomingCall.test) {
      console.log("Rejecting test call...");
      // Handle test call rejection
      addMissedCall(lastIncomingNumber);
      setIncomingCall(null);
      setShowPhonePopup(false);
      setPhoneStatus("Idle");
      stopRingtone();
      return;
    }
    
    // Handle real SIP invitation
    incomingCall.reject().catch(console.error);
    addMissedCall(lastIncomingNumber);
    setIncomingCall(null);
    setShowPhonePopup(false);
    setPhoneStatus("Idle");
    stopRingtone();
  };

  const handleEndCall = () => {
    if (session) {
      if (session.test) {
        console.log("Ending test call...");
        // Handle test call ending
        setSession(null);
        setPhoneStatus("Idle");
        stopCallTimer();
        setShowPhonePopup(false);
        setIncomingCall(null);
        setShowTicketModal(false);
      } else {
        // Handle real SIP call ending
        session.bye().catch(console.error);
        setSession(null);
        setPhoneStatus("Idle");
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
        stopRingtone();
        stopCallTimer();
        setShowPhonePopup(false);
        setIncomingCall(null);
      }
    } else if (incomingCall) {
      if (incomingCall.test) {
        console.log("Ending test incoming call...");
        // Handle test incoming call ending
        setIncomingCall(null);
        setPhoneStatus("Idle");
        stopRingtone();
        stopCallTimer();
        setShowPhonePopup(false);
      } else {
        // Handle real SIP incoming call ending
        incomingCall.reject().catch(console.error);
        setIncomingCall(null);
        setPhoneStatus("Idle");
        stopRingtone();
        stopCallTimer();
        setShowPhonePopup(false);
      }
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
          {/* Test button for debugging incoming calls */}
          {process.env.NODE_ENV === 'development' && (
            <Tooltip title="Test Incoming Call" arrow>
              <button 
                onClick={testIncomingCall}
                style={{ 
                  background: '#ff9800', 
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 12px', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Test Call
              </button>
            </Tooltip>
          )}
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
        <div className="phone-popup-overlay">
          <div className="phone-popup-container">
            {/* Header */}
            <div className="phone-popup-header">
              <div className="phone-popup-title">
                <MdOutlineLocalPhone className="phone-icon" />
                <span>{phoneStatus === "In Call" ? "Active Call" : phoneStatus === "Ringing" ? "Incoming Call" : "Phone"}</span>
                {/* Show indicator when ticket modal is open */}
                {showTicketModal && (
                  <div className="ticket-modal-indicator">
                    📝 Ticket Open
                  </div>
                )}
                {/* Show indicator when there's preserved ticket data */}
                {!showTicketModal && Object.keys(ticketFormData).length > 0 && ticketType && (
                  <div className="preserved-data-indicator">
                    💾 {ticketType.charAt(0).toUpperCase() + ticketType.slice(1)} Data Saved
                  </div>
                )}
              </div>
              <button onClick={togglePhonePopup} className="phone-popup-close" aria-label="Close">
                <span>&times;</span>
              </button>
            </div>

            {/* Call Status Bar */}
            {phoneStatus === "In Call" && (
              <div className="call-status-bar">
                <div className="call-status-indicator">
                  <div className="call-status-dot active"></div>
                  <span>Call in Progress</span>
                </div>
                <div className="call-duration">
                  <span className="duration-label">Duration:</span>
                  <span className="duration-time">{formatDuration(callDuration)}</span>
                </div>
                {/* Swap to Ticket Modal Button */}
                <button 
                  className="swap-to-ticket-btn"
                  onClick={swapToTicketModal}
                  title="Switch to Ticket Form"
                >
                  📝 Ticket
                </button>
              </div>
            )}

            {/* Quick Ticket Button for Preserved Data */}
            {!showTicketModal && Object.keys(ticketFormData).length > 0 && ticketType && (
              <div className="quick-ticket-section">
                <button 
                  className="quick-ticket-btn"
                  onClick={() => {
                    console.log("Opening ticket modal with preserved data:", ticketFormData);
                    setShowTicketModal(true);
                    setIsTicketModalOpen(true);
                  }}
                  title={`Reopen ${ticketType} ticket with your saved details`}
                >
                  💾 Reopen {ticketType.charAt(0).toUpperCase() + ticketType.slice(1)} Ticket
                </button>
              </div>
            )}

            {/* Main Content */}
            <div className="phone-popup-content">
              {/* Incoming Call Display */}
              {incomingCall && phoneStatus === "Ringing" && (
                <div className="incoming-call-section">
                  <div className="caller-info">
                    <div className="caller-avatar">
                      <span>{lastIncomingNumber ? lastIncomingNumber.charAt(0) : "?"}</span>
                    </div>
                    <div className="caller-details">
                      <div className="caller-number">{lastIncomingNumber || "Unknown"}</div>
                      <div className="caller-label">Incoming Call</div>
                    </div>
                  </div>
                  <div className="call-actions">
                    <button className="call-btn accept-btn" onClick={handleAcceptCall}>
                      <FiPhoneCall />
                      <span>Answer</span>
                    </button>
                    <button className="call-btn reject-btn" onClick={handleRejectCall}>
                      <FiPhoneOff />
                      <span>Decline</span>
                    </button>
                  </div>
                  {/* Note: Ticket modal opens automatically when answering call */}
                  <div className="call-instruction">
                    <small style={{ color: '#6c757d', fontStyle: 'italic' }}>
                      💡 Ticket form will open automatically when you answer the call
                    </small>
                  </div>
                </div>
              )}

              {/* Dial Pad Section */}
              {phoneStatus !== "In Call" && phoneStatus !== "Ringing" && (
                <div className="dial-pad-section">
                  <div className="phone-number-display">
                    <input
                      type="text"
                      className="phone-number-input"
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  
                  {showKeypad && (
                    <div className="keypad-grid">
                      {["1","2","3","4","5","6","7","8","9","*","0","#"].map((digit) => (
                        <button 
                          key={digit} 
                          className="keypad-btn" 
                          onClick={() => setPhoneNumber((prev) => prev + digit)}
                        >
                          {digit}
                        </button>
                      ))}
                      <button 
                        className="keypad-btn backspace-btn" 
                        onClick={() => setPhoneNumber((prev) => prev.slice(0, -1))}
                        style={{ gridColumn: "span 3" }}
                      >
                        <span>⌫</span>
                        <span>Backspace</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Transfer Section (when in call) */}
              {phoneStatus === "In Call" && (
                <div className="transfer-section">
                  <div className="transfer-header">
                    <MdOutlineFollowTheSigns className="transfer-icon" />
                    <span>Transfer Call</span>
                  </div>
                  <Autocomplete
                    options={onlineUsers.filter((u) => !!u.extension && (u.role === "agent" || u.role === "supervisor") && String(u.extension) !== String(extension))}
                    getOptionLabel={(u) => (u ? `${u.extension} — ${(u.name || u.username || "User")} (${u.role})` : "")}
                    isOptionEqualToValue={(a, b) => a?.extension === b?.extension}
                    onChange={(_, u) => {
                      setTransferTarget(u?.extension || "");
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Select online agent/supervisor" 
                        variant="outlined" 
                        size="small"
                        className="transfer-input"
                      />
                    )}
                    fullWidth
                  />
                  <button
                    className="transfer-btn"
                    onClick={() => handleBlindTransfer()}
                    disabled={!session || !transferTarget}
                  >
                    <MdOutlineFollowTheSigns />
                    <span>Transfer</span>
                  </button>
                </div>
              )}

              {/* Control Buttons */}
              <div className="phone-controls">
                <div className="control-row">
                  <button 
                    className={`control-btn ${isMuted ? 'active' : ''}`}
                    onClick={toggleMute}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    <BsFillMicMuteFill />
                    <span>{isMuted ? "Unmute" : "Mute"}</span>
                  </button>
                  
                  <button 
                    className={`control-btn ${isSpeakerOn ? 'active' : ''}`}
                    onClick={toggleSpeaker}
                    title={isSpeakerOn ? "Speaker On" : "Speaker Off"}
                  >
                    <HiMiniSpeakerWave />
                    <span>Speaker</span>
                  </button>
                  
                  <button 
                    className={`control-btn ${isOnHold ? 'active' : ''}`}
                    onClick={toggleHold}
                    title={isOnHold ? "Resume" : "Hold"}
                  >
                    <MdPauseCircleOutline />
                    <span>{isOnHold ? "Resume" : "Hold"}</span>
                  </button>
                </div>
                
                <div className="control-row">
                  <button 
                    className="control-btn keypad-toggle"
                    onClick={() => setShowKeypad((p) => !p)}
                    title={showKeypad ? "Hide Keypad" : "Show Keypad"}
                  >
                    <IoKeypadOutline />
                    <span>Keypad</span>
                  </button>
                  
                  {phoneStatus !== "In Call" && phoneStatus !== "Ringing" && (
                    <button 
                      className="control-btn dial-btn"
                      onClick={handleDial}
                      disabled={phoneStatus === "Dialing" || phoneStatus === "Ringing"}
                    >
                      <MdLocalPhone />
                      <span>Dial</span>
                    </button>
                  )}
                  
                  <button 
                    className="control-btn end-call-btn"
                    onClick={handleEndCall}
                    title="End Call"
                  >
                    <FiPhoneOff />
                    <span>End</span>
                  </button>
                </div>
              </div>
            </div>
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
      <Button variant="contained" color="primary" onClick={() => openTicketModal()}>
        Create Ticket
      </Button>

      {/* Create Employer Ticket Button */}
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => openTicketModal('employer')}
        style={{ marginLeft: '10px' }}
        title="Create ticket for employer"
      >
        🏢 Employer Ticket
      </Button>

      {/* Create Employee Ticket Button */}
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => openTicketModal('employee')}
        style={{ marginLeft: '10px' }}
        title="Create ticket for employee"
      >
        👤 Employee Ticket
      </Button>

      {/* Reopen Ticket Modal with Preserved Data Button */}
      {Object.keys(ticketFormData).length > 0 && ticketType && (
        <Button 
          variant="outlined" 
          color="secondary" 
          onClick={() => {
            console.log("Reopening ticket modal with preserved data:", ticketFormData);
            setShowTicketModal(true);
            setIsTicketModalOpen(true);
          }}
          style={{ marginLeft: '10px' }}
          title={`Reopen ${ticketType} ticket with your previously filled details`}
        >
          📝 Reopen {ticketType.charAt(0).toUpperCase() + ticketType.slice(1)} Ticket
        </Button>
      )}

      {/* Clear Preserved Ticket Data Button */}
      {Object.keys(ticketFormData).length > 0 && (
        <Button 
          variant="outlined" 
          color="secondary" 
          onClick={clearTicketFormData}
          style={{ marginLeft: '10px' }}
          title="Clear saved ticket form data"
        >
          Clear Saved Data
        </Button>
      )}

      {/* Manual Close Ticket Modal Button (Fallback) */}
      {showTicketModal && (
        <Button 
          variant="outlined" 
          color="error" 
          onClick={closeTicketModalDirectly}
          style={{ marginLeft: '10px' }}
          title="Force close ticket modal (fallback)"
        >
          🚫 Force Close Ticket
        </Button>
      )}

      {/* Debug Ticket Modal State Button */}
      {showTicketModal && (
        <Button 
          variant="outlined" 
          color="warning" 
          onClick={() => {
            console.log("=== DEBUG TICKET MODAL STATE ===");
            console.log("showTicketModal:", showTicketModal);
            console.log("isTicketModalOpen:", isTicketModalOpen);
            console.log("ticketType:", ticketType);
            
            // Check DOM
            const modals = document.querySelectorAll('[role="dialog"], .MuiDialog-root, .MuiModal-root');
            console.log("DOM modals found:", modals.length);
            modals.forEach((modal, index) => {
              console.log(`Modal ${index}:`, modal);
              console.log(`Modal ${index} display:`, modal.style?.display);
              console.log(`Modal ${index} visibility:`, modal.style?.visibility);
            });
            
            // Try to close
            closeTicketModalDirectly();
          }}
          style={{ marginLeft: '10px' }}
          title="Debug ticket modal state and force close"
        >
          🐛 Debug & Close
        </Button>
      )}

      {/* Ticket modal with custom wrapper for better control */}
      <div style={{ position: 'relative' }}>
        <AdvancedTicketCreateModal 
          key={`ticket-modal-${showTicketModal}-${ticketType}`}
          open={showTicketModal} 
          onClose={closeTicketModalDirectly} 
          initialPhoneNumber={ticketPhoneNumber} 
          functionData={functionData}
          // Pass preserved form data and ticket type
          preservedFormData={ticketFormData}
          ticketType={ticketType}
          onTicketTypeSelect={handleTicketTypeSelect}
          onFormDataChange={handleTicketFormDataChange}
          onTicketSubmitted={handleTicketSubmitted}
          onTicketCancel={closeTicketModalDirectly}
          // Handle outside clicks
          BackdropProps={{
            onClick: closeTicketModalDirectly
          }}
        />
        
        {/* Custom close button overlay if modal is open */}
        {showTicketModal && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10003,
            background: 'red',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }} onClick={closeTicketModalDirectly}>
            🚫 CLOSE TICKET
          </div>
        )}
      </div>

      {/* Voice notes modal */}
      <Dialog open={showVoiceNotesModal} onClose={() => setShowVoiceNotesModal(false)} fullWidth maxWidth="md">
        <DialogContent>
          <VoiceNotesReport />
        </DialogContent>
      </Dialog>
    </div>
  );
}
