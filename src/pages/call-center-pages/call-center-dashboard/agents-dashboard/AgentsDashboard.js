import React, { useState, useEffect, useRef } from "react";
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
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import { MdOutlineFreeBreakfast } from "react-icons/md";
import { MdOutlineLunchDining } from "react-icons/md";
import { GiExplosiveMeeting } from "react-icons/gi";
import { MdWifiCalling2 } from "react-icons/md";
import { TbEmergencyBed } from "react-icons/tb";
import { MdOutlineFollowTheSigns } from "react-icons/md";
import { GiTrafficLightsReadyToGo } from "react-icons/gi";
import { FiPhoneOff } from "react-icons/fi";
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

import { FiPhoneIncoming } from "react-icons/fi";
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

export default function AgentsDashboard() {
  const [showPhonePopup, setShowPhonePopup] = useState(false);
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
  const [statusTimer, setStatusTimer] = useState(0); // Timer for the current status
  const [timeRemaining, setTimeRemaining] = useState(0); // Time left for the current status
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("warning"); // could be "success", "error", "info", "warning"
  // const [loginTime, setLoginTime] = useState("");
  

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

  const sipConfig = {
    uri: UserAgent.makeURI("sip:webrtc_user@10.52.0.19"),
    transportOptions: {
      server: "ws://10.52.0.19:8088/ws",
    },
    authorizationUsername: "webrtc_user",
    authorizationPassword: "sip12345",
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

    // navigator.mediaDevices
    //   .getUserMedia({ audio: true })
    //   .then(() => console.log("🎤 Microphone access granted"))
    //   .catch((error) => console.error("❌ Microphone access denied:", error));

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
        setIncomingCall(invitation);
        setPhonePopupVisible(true);
        setPhoneStatus("Ringing");
        // Extract phone number and search tickets
        const incomingNumber = invitation.remoteIdentity.uri.user;
        searchCustomerTickets(incomingNumber);
        ringAudio
          .play()
          .catch((err) => console.error("🔇 Ringtone error:", err));
      },
    };

    return () => {
      registerer.unregister().catch(console.error);
      ua.stop();
      stopRingtone();
      stopTimer();
    };
  }, []);

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

  const handleAcceptCall = () => {
    if (!incomingCall) return;

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
      });
  };

  const handleRejectCall = () => {
    if (!incomingCall) return;
    incomingCall.reject().catch(console.error);
    setIncomingCall(null);
    setPhoneStatus("Idle");
    stopRingtone();
  };

  const handleEndCall = () => {
    if (session) {
      session.bye().catch(console.error);
      setSession(null);
      setPhoneStatus("Idle");
      remoteAudio.srcObject = null;
      stopRingtone();
      stopTimer();
    } else if (incomingCall) {
      incomingCall.reject().catch(console.error);
      setIncomingCall(null);
      setPhoneStatus("Idle");
      stopRingtone();
    }
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
        const response = await fetch(`${baseURL}/users/agents-online`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        const data = await response.json();
        const count = data.agentCount;

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

    // Update local status
    setAgentStatus(activity);

    // Start or stop timer
    if (activity.toLowerCase() !== "ready") {
      startStatusTimer(activity);
    } else {
      stopStatusTimer();
    }

    // Update backend status
    try {
      await fetch(`${baseURL}/users/status/${localStorage.getItem("userId")}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          status: activity === "ready" ? "online" : activity,
        }),
      });
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

  // Function to search tickets by phone or NIDA
  const searchCustomerTickets = async (phoneOrNida) => {
    try {
      const response = await fetch(`${baseURL}/ticket/search-by-phone/${phoneOrNida}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (data.found) {
        setCustomerTickets(data.tickets);
        setShowTicketHistoryModal(true);
      } else {
        setShowCreateTicketModal(true);
      }
    } catch (error) {
      setSnackbarMessage("Error searching customer tickets");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  return (
    <div className="p-6">
      <div className="agent-body">
        <h3>Agent</h3>
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
        <div className="dashboard-single-agent-row_two">
          <div className="login-summary">
            <div className="login-summary-title">
              <IoMdLogIn />
              <h4>Login Summary</h4>
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <CiNoWaitingSign fontSize={20} color="red" />
                Idle Time
              </div>
              00:03:34
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <MdOutlinePhoneInTalk fontSize={20} color="green" />
                Talk Time
              </div>
              00:03:34
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <FaHandHolding fontSize={20} color="black" />
                Hold Time
              </div>
              00:03:34
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <IoMdCloseCircleOutline fontSize={20} color="red" />
                Break Time
              </div>
              00:03:34
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <FaPersonWalkingArrowRight fontSize={20} color="green" />
                Last Login Time
              </div>
              {/* {loginTime || "Loading..."} */}
            </div>
          </div>
          <div className="chat">
            {/* simple chat here */}
            <CallChart />
          </div>
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
              <p>Call Duration: {formatDuration(callDuration)}</p>
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
        </div>
      )}

      {renderKeypad()}
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
      <Dialog open={showTicketHistoryModal} onClose={() => setShowTicketHistoryModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Customer Ticket History</DialogTitle>
        <DialogContent>
          {customerTickets.length > 0 ? customerTickets.map(ticket => (
            <div key={ticket.id} style={{ border: '1px solid #eee', margin: 8, padding: 8, borderRadius: 4 }}>
              <div>Ticket ID: {ticket.ticket_id}</div>
              <div>Status: {ticket.status}</div>
              <div>Created: {new Date(ticket.created_at).toLocaleString()}</div>
              <Button onClick={() => setSelectedTicket(ticket)}>View Details</Button>
            </div>
          )) : <div>No tickets found.</div>}
          {/* Ticket Details Modal (nested) */}
          <Dialog open={!!selectedTicket} onClose={() => setSelectedTicket(null)} maxWidth="sm" fullWidth>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogContent>
              {selectedTicket && (
                <div>
                  <div><strong>Ticket ID:</strong> {selectedTicket.ticket_id}</div>
                  <div><strong>Status:</strong> {selectedTicket.status}</div>
                  <div><strong>Phone:</strong> {selectedTicket.phone_number}</div>
                  <div><strong>NIDA:</strong> {selectedTicket.nida_number}</div>
                  <div><strong>Category:</strong> {selectedTicket.category}</div>
                  <div><strong>Description:</strong> {selectedTicket.description}</div>
                  <div><strong>Created:</strong> {new Date(selectedTicket.created_at).toLocaleString()}</div>
                  {/* Add more fields as needed */}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>

      {/* Create Ticket Modal */}
      <Dialog open={showCreateTicketModal} onClose={() => setShowCreateTicketModal(false)}>
        <DialogTitle>No Tickets Found</DialogTitle>
        <DialogContent>
          <div>No tickets found for this number. Would you like to create a new ticket?</div>
          <Button onClick={() => {
            setShowCreateTicketModal(false);
            // Open your ticket creation form/modal here, pre-fill phone number
          }}>Create Ticket</Button>
          <Button onClick={() => setShowCreateTicketModal(false)}>Cancel</Button>
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
