import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  MdOutlineLocalPhone,
  MdPauseCircleOutline,
  MdLocalPhone,
  MdOutlineEmail,
  MdOutlinePhoneInTalk,
} from "react-icons/md";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { IoKeypadOutline } from "react-icons/io5";
import { BsFillMicMuteFill } from "react-icons/bs";
import {
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import {
  MdOutlineFreeBreakfast,
  MdWifiCalling2,
  MdOutlineFollowTheSigns,
  MdOutlineLunchDining,
} from "react-icons/md";
import { GiExplosiveMeeting, GiTrafficLightsReadyToGo } from "react-icons/gi";
import { TbEmergencyBed } from "react-icons/tb";
import { FiPhoneOff, FiPhoneCall, FiPhoneIncoming } from "react-icons/fi";
import { CiNoWaitingSign } from "react-icons/ci";
import { FaPersonWalkingArrowRight } from "react-icons/fa6";
import {
  UserAgent,
  Inviter,
  Invitation,
  Registerer,
  SessionState,
  URI,
} from "sip.js";
import { Alert, Snackbar } from "@mui/material";
import { baseURL } from "../../../../config";
import "./agentsDashboard.css";
import { TbPhoneCheck, TbPhoneX } from "react-icons/tb";
import { HiPhoneOutgoing, HiOutlineMailOpen } from "react-icons/hi";
import { BsCollection } from "react-icons/bs";
import { RiMailUnreadLine } from "react-icons/ri";
import {
  IoLogoWhatsapp,
  IoMdLogIn,
  IoMdCloseCircleOutline,
} from "react-icons/io";
import { FaHandHolding } from "react-icons/fa";
import CallChart from "../../../../components/agent-chat/AgentChat";
import QueueStatusTable from "../../../../components/agent-dashboard/QueueStatusTable";
import AgentPerformanceScore from "../../../../components/agent-dashboard/AgentPerformanceScore";

export default function AgentsDashboard() {
  const [customerType, setCustomerType] = useState("");
  const [searchName, setSearchName] = useState(""); // typed input
  const [nameSuggestions, setNameSuggestions] = useState([]); // results from API
  const [registrationNumber, setRegistrationNumber] = useState(""); // optional
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  
  useEffect(() => {
    const fetchEmployers = async () => {
      if (!customerType || inputValue.length < 3) {
        setOptions([]);
        return;
      }  

      setLoading(true);
      try {
        const response = await fetch(
          "https://demomspapi.wcf.go.tz/api/v1/search/details",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: customerType,
              name: inputValue,
              employer_registration_number: "",
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const data = result?.results || [];
        console.log("mac data", data);
        setOptions(data);
      } catch (error) {
        console.error("Error fetching employers:", error);
        setOptions([]);
      }
      setLoading(false);
    };

    const timeout = setTimeout(fetchEmployers, 500); // debounce
    return () => clearTimeout(timeout);
  }, [inputValue]);

  const handleSearch = async () => {
    setSearchLoading(true);
    const cleanedSearchName = searchName.split(" — ")[0].trim();

    console.log("Cleaned Search Name:", cleanedSearchName);

    const payload = {
      type: customerType,
      name: cleanedSearchName, // Use cleaned search name
      employer_registration_number: registrationNumber,
    };

    try {
      const response = await fetch(
        "https://demomspapi.wcf.go.tz/api/v1/search/details",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const employeeData = result?.results[0];
      console.log("Employee Data:", employeeData);

      const isClaimed = employeeData.claim_number;
      setClaimed(isClaimed); // Set the claimed state

      if (employeeData) {
        setFormValues({
          firstName: employeeData.firstname,
          middleName: employeeData.middlename,
          lastName: employeeData.lastname,
          phoneNumber: "",
          nidaNumber: employeeData.nin,
          requester: "",
          institution: "",
          region: "",
          district: "",
          channel: "",
          category: "",
          functionId: "",
          description: "",
          status: "Open",
        });
      }
    } catch (error) {
      console.error("Failed to fetch search results:", error);
    }
    setSearchLoading(false);
  };

  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [consultSession, setConsultSession] = useState(null); // The target agent session
  const [isTransferring, setIsTransferring] = useState(false);
  const [callerId, setCallerId] = useState("");
  const autoRejectTimerRef = useRef(null);
  const [missedCalls, setMissedCalls] = useState([]);
  const [missedOpen, setMissedOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneStatus, setPhoneStatus] = useState("Idle");
  const [userAgent, setUserAgent] = useState(null);
  const [session, setSession] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [ringAudio] = useState(new Audio("/ringtone.mp3"));
  const [remoteAudio] = useState(new Audio());
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isOnHold, setIsOnHold] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const openStatus = Boolean(anchorEl);
  const [agentStatus, setAgentStatus] = useState("");
  const [userDefinedTimes, setUserDefinedTimes] = useState({
    attendingMeeting: 0, // default value
    emergency: 0, // default value
  });
  const wasAnsweredRef = useRef(false);

  const [statusTimer, setStatusTimer] = useState(0); // Timer for the current status
  const [timeRemaining, setTimeRemaining] = useState(0); // Time left for the current status
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("warning"); // could be "success", "error", "info", "warning"
  // const [loginTime, setLoginTime] = useState("");
  // const socket = io(baseURL.replace("/api", ""));

  // user ticket from mac system
  const [userData, setUserData] = useState(null);
  const [showUserForm, setShowUserForm] = useState(true);
  const [formValues, setFormValues] = useState({
    firstName: "",
    middleName: "", // Add middle name
    lastName: "",
    phoneNumber: "",
    nidaNumber: "",
    requester: "",
    institution: "",
    region: "",
    district: "",
    channel: "",
    category: "",
    functionId: "",
    description: "",
    status: "Open",
  });
  const [loadingUserData, setLoadingUserData] = useState(false);

  const fetchUserByPhoneNumber = async (phone) => {
    setLoadingUserData(true);
    try {
      const response = await fetch(
        `${baseURL}/mac-system/search-by-phone-number?phone_number=${encodeURIComponent(
          phone
        )}`
      );
      if (!response.ok) {
        setUserData(null);
        setShowUserForm(false);
        setLoadingUserData(false);
        return;
      }
      const data = await response.json();
      setUserData(data);
      setFormValues({
        first_name: data.first_name || "",
        middle_name: data.middle_name || "",
        last_name: data.last_name || "",
        phone_number: data.phone_number || phone,
        nida_number: data.nida_number || "",
        institution: data.institution || "",
        region: data.region || "",
        district: data.district || "",
      });
      setShowUserForm(true);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setUserData(null);
      setShowUserForm(false);
    }
    setLoadingUserData(false);
  };

  const timerRef = useRef(null);

  // Add state for ticket search and modals
  const [customerTickets, setCustomerTickets] = useState([]);
  const [showTicketHistoryModal, setShowTicketHistoryModal] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const showAlert = (message, severity = "warning") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const timeIntervals = {
    breakfast: 15 * 60, // 15 minutes in seconds
    lunch: 45 * 60, // 45 minutes in seconds
    shortCall: 10 * 60, // 10 minutes in seconds
    followUp: 15 * 60, // 15 minutes in seconds
    attendingMeeting: userDefinedTimes.attendingMeeting * 60 || 30 * 60, // default 30 minutes if not set
    emergency: userDefinedTimes.emergency * 60 || 20 * 60, // default 20 minutes if not set
  };

  const extension = localStorage.getItem("extension");
  const sipPassword = localStorage.getItem("sipPassword");

  const sipConfig = {
    uri: UserAgent.makeURI(`sip:${extension}@10.52.0.19`),
    transportOptions: {
      server: "wss://10.52.0.19:8089/ws",
    },
    authorizationUsername: extension,
    authorizationPassword: sipPassword,
    sessionDescriptionHandlerFactoryOptions: {
      constraints: { audio: true, video: false },
      peerConnectionOptions: {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      },
    },
  };

  const togglePhonePopup = () => {
    setShowPhonePopup(!showPhonePopup);
  };

  useEffect(() => {
    const savedStatus = localStorage.getItem("agentStatus");
    if (savedStatus) {
      setAgentStatus(savedStatus);
    }

    ringAudio.loop = true;
    ringAudio.volume = 0.7;
    remoteAudio.autoplay = true;

    const ua = new UserAgent(sipConfig);
    const registerer = new Registerer(ua);
    setUserAgent(ua);

    ua.start()
      .then(() => {
        registerer.register();
        console.log("✅ SIP UA Registered");
        setPhoneStatus("Idle");
      })
      .catch((error) => {
        console.error("❌ UA failed to start:", error);
        setPhoneStatus("Connection Failed");
      });

    ua.delegate = {
      onInvite: (invitation) => {
        console.log("📞 Incoming call");

        wasAnsweredRef.current = false;

        const incomingCaller =
          invitation.remoteIdentity.displayName ||
          invitation.remoteIdentity.uri.user ||
          "Unknown Caller";

        setCallerId(incomingCaller);
        setIncomingCall(invitation);
        setShowPhonePopup(true);
        setPhoneStatus("Ringing");
        // Extract phone number and search tickets
        const incomingNumber = invitation.remoteIdentity.uri.user;
        ringAudio
          .play()
          .catch((err) => console.error("🔇 Ringtone error:", err));

        invitation.stateChange.addListener((state) => {
          if (state === SessionState.Terminated) {
            stopRingtone();
            clearTimeout(autoRejectTimerRef.current);
            setIncomingCall(null);
            setShowPhonePopup(false);
            setPhoneStatus("Idle");
            setShowUserForm(false);
            setUserData(null);

            if (!wasAnsweredRef.current) {
              addMissedCall(incomingCaller);
            }
          }
        });

        autoRejectTimerRef.current = setTimeout(() => {
          if (incomingCall) {
            incomingCall.reject().catch(console.error);
            setShowPhonePopup(false);
            setPhoneStatus("Idle");
            stopRingtone();
            setIncomingCall(null);
            setShowUserForm(false);
            setUserData(null);

            if (!wasAnsweredRef.current) {
              addMissedCall(incomingCaller);
            }
          }
        }, 20000);
      },
    };

    return () => {
      registerer.unregister().catch(console.error);
      ua.stop();
      stopRingtone();
      stopTimer();
    };
  }, []);

  // 2️⃣ Missed Calls restore useEffect
  useEffect(() => {
    const savedMissedCalls = localStorage.getItem("missedCalls");
    if (savedMissedCalls) {
      setMissedCalls(JSON.parse(savedMissedCalls));
    }
  }, []);

  // 3️⃣ Audio Unlock useEffect
  useEffect(() => {
    const unlockAudio = () => {
      ringAudio
        .play()
        .then(() => {
          console.log("🔓 Audio unlocked");
          ringAudio.pause();
          ringAudio.currentTime = 0;
          window.removeEventListener("click", unlockAudio);
        })
        .catch((err) => {
          console.warn("⚠️ Failed to unlock audio on first click:", err);
        });
    };

    window.addEventListener("click", unlockAudio);

    return () => {
      window.removeEventListener("click", unlockAudio);
    };
  }, []);

  // useEffect(() => {
  //   const savedMissedCalls = localStorage.getItem("missedCalls");
  //   if (savedMissedCalls) {
  //     const parsed = JSON.parse(savedMissedCalls).map((call) => ({
  //       ...call,
  //       time: new Date(call.time), // ⬅️ Convert string back to Date object
  //     }));
  //     setMissedCalls(parsed);
  //   }
  // }, []);

  // ✅ Load missed calls from backend on component mount
  useEffect(() => {
    fetchMissedCallsFromBackend();
  }, []);

  // Debug missed calls count
  useEffect(() => {
    console.log("🔢 Current missed calls count:", missedCalls.length);
    console.log("📋 Current missed calls:", missedCalls);
  }, [missedCalls]);

  const setPhonePopupVisible = (visible) => {
    setShowPhonePopup(visible);
  };

  const stopRingtone = () => {
    ringAudio.pause();
    ringAudio.currentTime = 0;
  };

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
    if (remoteAudio.setSinkId) {
      const deviceId = isSpeakerOn ? "communications" : "default";
      remoteAudio
        .setSinkId(deviceId)
        .then(() => {
          setIsSpeakerOn(!isSpeakerOn);
        })
        .catch((err) =>
          console.warn("🔇 Failed to change output device:", err)
        );
    } else {
      console.warn("Audio output device selection not supported.");
    }
  };

  const toggleHold = () => {
    if (!session) return;
    const pc = session.sessionDescriptionHandler.peerConnection;
    const senders = pc.getSenders();

    if (isOnHold) {
      senders.forEach((sender) => {
        if (sender.track && sender.track.kind === "audio") {
          sender.track.enabled = true;
        }
      });
    } else {
      senders.forEach((sender) => {
        if (sender.track && sender.track.kind === "audio") {
          sender.track.enabled = false;
        }
      });
    }
    setIsOnHold(!isOnHold);
  };

  const sendDTMF = (digit) => {
    if (session && session.sessionDescriptionHandler) {
      const dtmfSender = session.sessionDescriptionHandler.peerConnection
        .getSenders()
        .find((sender) => sender.dtmf);

      if (dtmfSender && dtmfSender.dtmf) {
        dtmfSender.dtmf.insertDTMF(digit);
        console.log("📲 Sent DTMF digit:", digit);
      }
    }
  };

  const addMissedCall = (caller) => {
    if (!caller || caller.trim() === "") {
      console.warn("🚫 Skipping missed call: no caller ID provided");
      return;
    }

    // Format the caller number: replace +255 with 0
    let formattedCaller = caller;
    if (caller.startsWith('+255')) {
      formattedCaller = '0' + caller.substring(4); // Remove +255 and add 0
      console.log(`📞 Formatted caller: ${caller} → ${formattedCaller}`);
    }
  
    const time = new Date();
    const agentId = localStorage.getItem("extension");

    // Update UI immediately
    const newCall = { caller: formattedCaller, time };
    setMissedCalls((prev) => [...prev, newCall]);
  
    setSnackbarMessage(`📞 Missed Call from ${formattedCaller}`);
    setSnackbarSeverity("warning");
    setSnackbarOpen(true);

    // 🔁 POST to backend
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
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to log missed call");
        return res.json();
      })
      .then((data) => {
        console.log("✅ Missed call logged to DB:", data);
      })
      .catch((err) => {
        console.error("❌ Failed to post missed call:", err);
      });
  };
  
  const fetchMissedCallsFromBackend = async () => {
    try {
      console.log("🔍 Fetching missed calls for agent:", extension);
      const response = await fetch(`${baseURL}/missed-calls?agentId=${extension}&status=pending`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
  
      if (!response.ok) throw new Error("Failed to fetch missed calls");
  
      const data = await response.json();
      console.log("📥 Received missed calls from backend:", data);
      console.log("📊 Total pending missed calls:", data.length);
  
      const formatted = data.map(call => ({
        ...call,
        time: new Date(call.time),
      }));
  
      setMissedCalls(formatted);
      console.log("✅ Updated missedCalls state with", formatted.length, "calls");
    } catch (error) {
      console.error("❌ Error fetching missed calls:", error);
    }
  };
  
  const handleAttendedTransferDial = () => {
    if (!userAgent || !transferTarget) return;

    const targetURI = UserAgent.makeURI(`sip:${transferTarget}@10.52.0.19`);
    if (!targetURI) {
      console.error("Invalid transfer target URI");
      return;
    }

    const inviter = new Inviter(userAgent, targetURI, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
    });

    setConsultSession(inviter);
    setIsTransferring(true);
    setPhoneStatus("Consulting");

    // Put original call on hold
    toggleHold();

    inviter
      .invite()
      .then(() => {
        inviter.stateChange.addListener((state) => {
          if (state === SessionState.Terminated) {
            console.log("🛑 Consult call ended");
            setConsultSession(null);
            setIsTransferring(false);
            setPhoneStatus("In Call");
            toggleHold(); // Resume original call
          }
        });
      })
      .catch((err) => {
        console.error("❌ Consult call failed:", err);
        setIsTransferring(false);
        setConsultSession(null);
        setPhoneStatus("In Call");
        toggleHold();
      });
  };

  const completeAttendedTransfer = () => {
    if (!session || !consultSession) return;

    session
      .refer(consultSession.remoteIdentity.uri)
      .then(() => {
        console.log("🔁 Attended transfer completed");
        setSnackbarMessage(`🔁 Call transferred to ${transferTarget}`);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        handleEndCall(); // Hang up original call
      })
      .catch((err) => {
        console.error("❌ Transfer failed:", err);
        setSnackbarMessage("❌ Transfer failed");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      });

    setIsTransferring(false);
    setConsultSession(null);
  };

  const cancelAttendedTransfer = () => {
    if (consultSession) {
      consultSession.bye().catch(console.error);
      setConsultSession(null);
    }
    setIsTransferring(false);
    setPhoneStatus("In Call");
    toggleHold(); // Resume the original call
  };

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    clearTimeout(autoRejectTimerRef.current);

    incomingCall
      .accept({
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
          peerConnectionOptions: {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          },
        },
      })
      .then(() => {
        wasAnsweredRef.current = true;
        setSession(incomingCall);
        setIncomingCall(null);
        setPhoneStatus("In Call");
        stopRingtone();
        startTimer();

        incomingCall.stateChange.addListener((state) => {
          if (state === SessionState.Established) {
            console.log("📞 Call accepted and media flowing");
            attachMediaStream(incomingCall);
          } else if (state === SessionState.Terminated) {
            console.log("📴 Call ended after accept");
            setPhoneStatus("Idle");
            setSession(null);
            setIncomingCall(null);
            remoteAudio.srcObject = null;
            stopTimer();
          }
        });
      })
      .catch((error) => {
        console.error("❌ Failed to accept call:", error);
        setPhoneStatus("Idle");
        setShowPhonePopup(false);
      });
  };

  const handleRejectCall = () => {
    if (!incomingCall) return;
    clearTimeout(autoRejectTimerRef.current);
    incomingCall.reject().catch(console.error);
    addMissedCall(callerId);
    setIncomingCall(null);
    setShowPhonePopup(false); // ✅ Close Modal
    setPhoneStatus("Idle");
    stopRingtone();
  };

  const handleEndCall = () => {
    const agentId = localStorage.getItem("userId");

    if (session) {
      session.bye().catch(console.error);
      setSession(null);
      setPhoneStatus("Idle");
      remoteAudio.srcObject = null;
      stopRingtone();
      stopTimer();
      setShowPhonePopup(false);
      setIncomingCall(null);
    } else if (incomingCall) {
      incomingCall.reject().catch(console.error);
      setIncomingCall(null);
      setPhoneStatus("Idle");
      stopRingtone();
      stopTimer();
      setShowPhonePopup(false);
    }
  };

  const handleRedial = (number, missedCallId = null) => {
    if (!userAgent) {
      console.error("❌ SIP User Agent not initialized.");
      return;
    }
  
    if (!number) {
      console.error("❌ No number provided for redial.");
      return;
    }

    // Format the number: replace +255 with 0
    let formattedNumber = number;
    if (number.startsWith('+255')) {
      formattedNumber = '0' + number.substring(4); // Remove +255 and add 0
      console.log(`📞 Formatted number: ${number} → ${formattedNumber}`);
    }
  
    const target = `sip:${formattedNumber}@10.52.0.19`;
    const targetURI = UserAgent.makeURI(target);
  
    if (!targetURI) {
      console.error("❌ Invalid SIP URI:", target);
      return;
    }
  
    console.log("📞 Redialing SIP URI:", targetURI.toString());
  
    const inviter = new Inviter(userAgent, targetURI, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
        peerConnectionOptions: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        },
      },
    });
  
    setSession(inviter);
  
    inviter.invite()
      .then(() => {
        setPhoneStatus("Dialing");
  
        inviter.stateChange.addListener((state) => {
          console.log("🔄 Redial call state:", state);
          if (state === SessionState.Established) {
            attachMediaStream(inviter);
            setPhoneStatus("In Call");
            startTimer();
  
            // ✅ Mark the missed call as called back
            if (missedCallId) {
              console.log("➡️ Sending PUT to mark call as called_back for ID:", missedCallId);
              console.log("➡️ PUT URL:", `${baseURL}/missed-calls/${missedCallId}/status`);
              fetch(`${baseURL}/missed-calls/${missedCallId}/status`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({ status: "called_back" }),
              })
                .then((res) => {
                  if (!res.ok) throw new Error("Failed to update call status");
                  return res.json();
                })
                .then(() => {
                  console.log("✅ Missed call marked as called_back");
                  // Remove this call from the UI
                  setMissedCalls((prev) =>
                    prev.filter((call) => call.id !== missedCallId)
                  );
                })
                .catch((err) =>
                  console.error("❌ Failed to update missed call status:", err)
                );
            }
          }
  
          if (state === SessionState.Terminated) {
            setPhoneStatus("Idle");
            setSession(null);
            remoteAudio.srcObject = null;
            stopTimer();
          }
        });
      })
      .catch((error) => {
        console.error("❌ Redial invite failed:", error.message, error);
        setPhoneStatus("Call Failed");
      });
  };
  
  const handleDial = () => {
    if (!userAgent || !phoneNumber) return;

    const target = `sip:${phoneNumber}@10.52.0.19`;
    const targetURI = UserAgent.makeURI(target);
    if (!targetURI) return;

    const inviter = new Inviter(userAgent, targetURI, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
        peerConnectionOptions: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        },
      },
    });

    setSession(inviter);

    inviter
      .invite()
      .then(() => {
        setPhoneStatus("Dialing");

        inviter.stateChange.addListener((state) => {
          if (state === SessionState.Established) {
            console.log("📞 Outgoing call established");
            setPhoneStatus("In Call");
            attachMediaStream(inviter);
            startTimer();
          } else if (state === SessionState.Terminated) {
            console.log("📴 Call ended");
            setPhoneStatus("Idle");
            setSession(null);
            remoteAudio.srcObject = null;
            stopTimer();
          }
        });
      })
      .catch((error) => {
        console.error("❌ Call failed:", error);
        setPhoneStatus("Call Failed");
      });
  };

  const handleBlindTransfer = async () => {
    if (!session || !transferTarget) return;
  
    try {
      // Step 1: Fetch the list of online users (agents and supervisors)
      const response = await fetch(`${baseURL}/online-users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch online users");
      }
  
      const onlineUsers = await response.json();
  
      // Step 2: Check if the transfer target is an online agent or supervisor
      const isValidTransferTarget = onlineUsers.some(
        (user) => user.username === transferTarget && (user.role === "agent" || user.role === "supervisor")
      );
  
      if (!isValidTransferTarget) {
        setSnackbarMessage("❌ No online agent or supervisor available for transfer.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }
  
      // Step 3: Proceed with the transfer if the target is valid
      const targetURI = UserAgent.makeURI(`sip:${transferTarget}@10.52.0.19`);
      if (!targetURI) {
        console.error("Invalid transfer target URI");
        return;
      }
  
      await session.refer(targetURI);
      console.log(`🔁 Call transferred to ${transferTarget}`);
      setSnackbarMessage(`🔁 Call transferred to ${transferTarget}`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      handleEndCall(); // Optionally end the session on agent's side
    } catch (err) {
      console.error("❌ Call transfer failed:", err);
      setSnackbarMessage("❌ Transfer failed");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };
  

  const attachMediaStream = (sipSession) => {
    const remoteStream = new MediaStream();
    sipSession.sessionDescriptionHandler.peerConnection
      .getReceivers()
      .forEach((receiver) => {
        if (receiver.track) remoteStream.addTrack(receiver.track);
      });
    remoteAudio.srcObject = remoteStream;
    remoteAudio
      .play()
      .catch((err) => console.error("🔇 Audio playback failed:", err));
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallDuration(0);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    const pad = (n) => String(n).padStart(2, "0");
    return hrs > 0
      ? `${pad(hrs)}:${pad(mins % 60)}:${pad(secs)}`
      : `${pad(mins)}:${pad(secs)}`;
  };

  const iconStyle = (bgColor) => ({
    backgroundColor: bgColor,
    padding: 10,
    borderRadius: "50%",
    color: "white",
  });

  const renderKeypad = () => (
    <Dialog open={showKeypad} onClose={() => setShowKeypad(false)}>
      <DialogTitle>Dialpad</DialogTitle>
      <DialogContent>
        <div className="keypad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(
            (digit) => (
              <Button
                key={digit}
                variant="outlined"
                onClick={() => sendDTMF(digit)}
                style={{ margin: 5, width: 50, height: 50 }}
              >
                {digit}
              </Button>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  // Timer logic
  const startStatusTimer = (activity) => {
    const statusKey = mapActivityToTimerKey(activity);
    if (!statusKey) return; // skip if status doesn't map to timer (like "ready")

    let timeLimit = timeIntervals[statusKey] || 0;
    stopStatusTimer();
    setTimeRemaining(timeLimit);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          alert(`You have exceeded your ${activity} time limit.`);
          stopStatusTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  const stopStatusTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeRemaining(0);
  };

  useEffect(() => {
    localStorage.setItem("agentStatus", agentStatus);
  }, [agentStatus]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAgentEmergency = async (activity) => {
    if (activity.toLowerCase() !== "ready") {
      try {
        // Check if enough agents are available
        const response = await fetch(`${baseURL}/users/agents-online`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        const data = await response.json();
        const count = data.agentCount;

        // Ensure there are at least 3 agents available for non-"ready" status
        if (count < 3) {
          showAlert("⚠️ Not enough agents available. Minimum 3 required.");
          return;
        }
      } catch (error) {
        console.error("Failed to check active agents:", error);
        showAlert("Something went wrong. Try again.", "error");
        return;
      }
    }

    // Update local status (displayed in the UI)
    setAgentStatus(activity);

    // Start or stop timer based on the activity
    if (activity.toLowerCase() !== "ready") {
      startStatusTimer(activity);
    } else {
      stopStatusTimer();
    }

    // Set the backend status based on the selected activity
    const statusToUpdate =
      activity.toLowerCase() === "ready" ? "online" : "offline";

    // Update backend status (offline for non-"ready", online for "ready")
    try {
      const updateResponse = await fetch(
        `${baseURL}/users/status/${localStorage.getItem("userId")}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            status: statusToUpdate, // online for "ready", offline otherwise
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error("Failed to update status");
      }

      console.log(`User status updated to ${statusToUpdate}`);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };
  const formatRemainingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(mins)}:${pad(secs)}`;
  };

  const mapActivityToTimerKey = (activity) => {
    switch (activity.toLowerCase()) {
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

  return (
    <div className="p-6">
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
        <div className="dashboard-single-agent">
          <div className="single-agent-card">
            <div className="single-agent-head">
              <FiPhoneIncoming fontSize={15} />
              In-Bound Calls
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <FiPhoneIncoming fontSize={15} color="green" />
                Calls
              </div>
              20
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <TbPhoneCheck fontSize={15} />
                Answered
              </div>
              10
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <TbPhoneX fontSize={15} color="red" />
                Dropped
              </div>
              20
            </div>
          </div>
          <div className="single-agent-card">
            <div className="single-agent-head">
              <HiPhoneOutgoing fontSize={15} />
              Out-Bound Calls
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <FiPhoneIncoming fontSize={15} color="green" />
                Calls
              </div>
              20
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <TbPhoneCheck fontSize={15} />
                Answered
              </div>
              10
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <TbPhoneX fontSize={15} color="red" />
                Dropped
              </div>
              20
            </div>
          </div>
          <div className="single-agent-card">
            <div className="single-agent-head">
              <MdOutlineEmail fontSize={15} />
              Emails
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <BsCollection fontSize={15} color="green" />
                Total
              </div>
              20
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <HiOutlineMailOpen fontSize={15} />
                Opened
              </div>
              10
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <RiMailUnreadLine fontSize={15} color="red" />
                Closed
              </div>
              20
            </div>
          </div>
          <div className="single-agent-card">
            <div className="single-agent-head">
              <IoLogoWhatsapp fontSize={15} color="green" />
              Whatsapp
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <BsCollection fontSize={15} color="green" />
                Total
              </div>
              20
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <HiOutlineMailOpen fontSize={15} />
                Opened
              </div>
              10
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <RiMailUnreadLine fontSize={15} color="red" />
                Closed
              </div>
              20
            </div>
          </div>
        </div>
        <div className="dashboard-single-agent-row_three">
          <QueueStatusTable />
        </div>
        <div className="dashboard-single-agent-row_four">
          <AgentPerformanceScore />
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
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
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

      {showPhonePopup && (
        <div className="phone-popup">
          <div className="phone-popup-header">
            <span>
              {phoneStatus === "In Call" ? "Call in Progress" : "Phone"}
            </span>
            <button onClick={togglePhonePopup} className="close-popup-btn">
              X
            </button>
          </div>
          <div className="phone-popup-body">
            {phoneStatus === "In Call" && (
              <>
                <p>Call Duration: {formatDuration(callDuration)}</p>
                <TextField
                  label="Transfer To (Extension)"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleBlindTransfer}
                  disabled={!session || !transferTarget}
                  fullWidth
                  style={{ marginTop: "10px" }}
                >
                  Transfer Call
                </Button>
              </>
            )}

            {phoneStatus !== "In Call" && (
              <TextField
                label="Phone Number"
                variant="outlined"
                fullWidth
                margin="normal"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            )}

            <div className="phone-action-btn">
              <Tooltip title="Toggle Speaker">
                <IconButton onClick={toggleSpeaker}>
                  <HiMiniSpeakerWave
                    fontSize={15}
                    style={iconStyle(isSpeakerOn ? "green" : "grey")}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title={isOnHold ? "Resume Call" : "Hold Call"}>
                <IconButton onClick={toggleHold}>
                  <MdPauseCircleOutline
                    fontSize={15}
                    style={iconStyle(isOnHold ? "orange" : "#3c8aba")}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title="Keypad">
                <IconButton onClick={() => setShowKeypad(true)}>
                  <IoKeypadOutline fontSize={15} style={iconStyle("#939488")} />
                </IconButton>
              </Tooltip>
              <Tooltip title="End Call">
                <IconButton onClick={handleEndCall}>
                  <MdLocalPhone fontSize={15} style={iconStyle("red")} />
                </IconButton>
              </Tooltip>
              <Tooltip title={isMuted ? "Unmute Mic" : "Mute Mic"}>
                <IconButton onClick={toggleMute}>
                  <BsFillMicMuteFill
                    fontSize={15}
                    style={iconStyle(isMuted ? "orange" : "grey")}
                  />
                </IconButton>
              </Tooltip>
            </div>

            {phoneStatus !== "In Call" && (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleDial}
                  disabled={
                    phoneStatus === "Dialing" || phoneStatus === "Ringing"
                  }
                >
                  Dial
                </Button>
              </>
            )}

            {incomingCall && phoneStatus !== "In Call" && (
              <>
                <p>
                  From:{" "}
                  {incomingCall.remoteIdentity.displayName ||
                    incomingCall.remoteIdentity.uri.user}
                </p>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAcceptCall}
                  style={{ marginRight: "10px" }}
                >
                  Accept
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleRejectCall}
                >
                  Reject
                </Button>
              </>
            )}
          </div>
          {/* This another div here for ticket creation */}
          {showUserForm && (
            <div
              className="ticket-creation-form"
              style={{
                marginTop: 10,
                padding: 10,
                border: "0px solid #ccc",
                borderRadius: 12,
                maxWidth: 900,
                backgroundColor: "whitesmoke",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                marginLeft: "auto",
                marginRight: "auto",
                scroll: "auto",
                overflowY: "auto",
              }}
            >
              <div className="inputRow">
                <TextField
                  select
                  // label="Customer Type"
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                  fullWidth
                  SelectProps={{ native: true }}
                >
                  <option value="">Customer Type</option>
                  <option value="employer">Employer</option>
                  <option value="employee">Employee</option>
                </TextField>

                <Autocomplete
                  options={options}
                  fullWidth
                  getOptionLabel={(option) => option.name || ""}
                  loading={loading}
                  onInputChange={(event, newInputValue) => {
                    if (customerType) {
                      setInputValue(newInputValue);
                      setSearchName(newInputValue);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Employer"
                      variant="outlined"
                      disabled={!customerType} // Disable if no customerType selected
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loading ? <CircularProgress size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />

                {/* <TextField
                  label="Registration Number"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  fullWidth
                  disabled={!customerType} // Disable if no customerType selected
                /> */}
                {searchLoading ? (
                  <>
                    <CircularProgress size={24} style={{ marginLeft: 10, backgroundColor: "blue", borderRadius: "10%", color: "white" }}/>
                  </>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      // startIcon={<SearchIcon />}
                      onClick={handleSearch}
                    >
                      Search
                    </Button>
                  </>
                )}
                {claimed && claimed !== "null" && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      // Add logic for what should happen when the claim button is clicked
                      console.log("Claimed button clicked");
                    }}
                  >
                    Claimed
                  </Button>
                )}
              </div>
              <div>
                <div className="inputRow">
                  <TextField
                    label="First Name"
                    value={formValues.firstName}
                    fullWidth
                    margin="normal"
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        first_name: e.target.value,
                      })
                    }
                  />
                  <TextField
                    label="Middle Name"
                    value={formValues.middleName}
                    fullWidth
                    margin="normal"
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        middle_name: e.target.value,
                      })
                    }
                  />
                  <TextField
                    label="Last Name"
                    value={formValues.lastName}
                    fullWidth
                    margin="normal"
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        last_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="inputRow">
                  <TextField
                    select
                    // label="Customer Type"
                    // value={customerType}
                    // onChange={(e) => setCustomerType(e.target.value)}
                    fullWidth
                    SelectProps={{ native: true }}
                  >
                    <option value="">Requester</option>
                    <option value="employer">Employer</option>
                    <option value="employee">Employee</option>
                  </TextField>
                  <TextField
                    label="Phone Number"
                    value={formValues.requester}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="NIDA Number"
                    value={formValues.nidaNumber}
                    fullWidth
                    margin="normal"
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        nida_number: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="inputRow">
                  <TextField
                    label="Institution"
                    value={formValues.institution}
                    fullWidth
                    margin="normal"
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        institution: e.target.value,
                      })
                    }
                  />
                  <TextField
                    label="Region"
                    value={formValues.region}
                    fullWidth
                    margin="normal"
                    onChange={(e) =>
                      setFormValues({ ...formValues, region: e.target.value })
                    }
                  />
                  <TextField
                    label="District"
                    value={formValues.district}
                    fullWidth
                    margin="normal"
                    onChange={(e) =>
                      setFormValues({ ...formValues, district: e.target.value })
                    }
                  />
                </div>
                <div className="inputRow">
                  <TextField
                    select
                    // label="Customer Type"
                    value={formValues.category}
                    onChange={(e) =>
                      setFormValues({ ...formValues, district: e.target.value })
                    }
                    fullWidth
                    SelectProps={{ native: true }}
                  >
                    <option value="">Category</option>
                    <option value="employer">Employer</option>
                    <option value="employee">Employee</option>
                  </TextField>
                  <TextField
                    select
                    // label="Customer Type"
                    value={formValues.channel}
                    onChange={(e) =>
                      setFormValues({ ...formValues, district: e.target.value })
                    }
                    fullWidth
                    SelectProps={{ native: true }}
                  >
                    <option value="">Channel</option>
                    <option value="employer">Employer</option>
                    <option value="employee">Employee</option>
                  </TextField>
                  <TextField
                    select
                    // label="Customer Type"
                    value={formValues.subject}
                    onChange={(e) =>
                      setFormValues({ ...formValues, district: e.target.value })
                    }
                    fullWidth
                    SelectProps={{ native: true }}
                  >
                    <option value="">Subject</option>
                    <option value="employer">Employer</option>
                    <option value="employee">Employee</option>
                  </TextField>
                </div>
                <TextField
                  label="Description"
                  multiline
                  rows={2}
                  fullWidth
                  margin="normal"
                  value={formValues.description}
                  onChange={(e) =>
                    setFormValues({ ...formValues, district: e.target.value })
                  }
                />
              </div>

              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  // TODO: Submit form logic here
                  console.log("Submitting ticket with data:", formValues);
                  showAlert("Ticket submitted successfully", "success");
                  setShowUserForm(false);
                }}
                disabled={loadingUserData}
                style={{ marginTop: 15 }}
                fullWidth
              >
                {loadingUserData ? "Loading..." : "Submit Ticket"}
              </Button>
            </div>
          )}
        </div>
      )}

      {renderKeypad()}

      <Dialog
        open={missedOpen}
        onClose={() => setMissedOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>📞 Missed Calls</DialogTitle>
        <DialogContent dividers>
          {missedCalls.length === 0 ? (
            <p>No missed calls! 🎉</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {[...missedCalls].reverse().map((call, index) => (
                <li
                  key={index}
                  style={{
                    marginBottom: "15px",
                    borderBottom: "1px solid #ccc",
                    paddingBottom: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>{call.caller}</strong>
                    <br />
                    <small>{call.time.toLocaleTimeString()}</small>
                  </div>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => {
                      console.log("🔁 Calling back ID:", call.id); // 👈 Add this
                      handleRedial(call.caller, call.id);
                    }}
                    startIcon={<FiPhoneCall />}
                  >
                    Call Back
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Button
            onClick={() => setMissedCalls([])}
            fullWidth
            variant="outlined"
            color="error"
            style={{ marginTop: "10px" }}
          >
            Clear Missed Calls
          </Button>
        </DialogContent>
      </Dialog>

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

      {/* Ticket History Modal */}
      <Dialog
        open={showTicketHistoryModal}
        onClose={() => setShowTicketHistoryModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Customer Ticket History</DialogTitle>
        <DialogContent>
          {customerTickets.length > 0 ? (
            customerTickets.map((ticket) => (
              <div
                key={ticket.id}
                style={{
                  border: "1px solid #eee",
                  margin: 8,
                  padding: 8,
                  borderRadius: 4,
                }}
              >
                <div>Ticket ID: {ticket.ticket_id}</div>
                <div>Status: {ticket.status}</div>
                <div>
                  Created: {new Date(ticket.created_at).toLocaleString()}
                </div>
                <Button onClick={() => setSelectedTicket(ticket)}>
                  View Details
                </Button>
              </div>
            ))
          ) : (
            <div>No tickets found.</div>
          )}
          {/* Ticket Details Modal (nested) */}
          <Dialog
            open={!!selectedTicket}
            onClose={() => setSelectedTicket(null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogContent>
              {selectedTicket && (
                <div>
                  <div>
                    <strong>Ticket ID:</strong> {selectedTicket.ticket_id}
                  </div>
                  <div>
                    <strong>Status:</strong> {selectedTicket.status}
                  </div>
                  <div>
                    <strong>Phone:</strong> {selectedTicket.phone_number}
                  </div>
                  <div>
                    <strong>NIDA:</strong> {selectedTicket.nida_number}
                  </div>
                  <div>
                    <strong>Category:</strong> {selectedTicket.category}
                  </div>
                  <div>
                    <strong>Description:</strong> {selectedTicket.description}
                  </div>
                  <div>
                    <strong>Created:</strong>{" "}
                    {new Date(selectedTicket.created_at).toLocaleString()}
                  </div>
                  {/* Add more fields as needed */}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>

      {/* Create Ticket Modal */}
      <Dialog
        open={showCreateTicketModal}
        onClose={() => setShowCreateTicketModal(false)}
      >
        <DialogTitle>No Tickets Found</DialogTitle>
        <DialogContent>
          <div>
            No tickets found for this number. Would you like to create a new
            ticket?
          </div>
          <Button
            onClick={() => {
              setShowCreateTicketModal(false);
              // Open your ticket creation form/modal here, pre-fill phone number
            }}
          >
            Create Ticket
          </Button>
          <Button onClick={() => setShowCreateTicketModal(false)}>
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const iconStyle = (bgColor) => ({
  backgroundColor: bgColor,
  padding: 10,
  borderRadius: "50%",
  color: "white",
});
