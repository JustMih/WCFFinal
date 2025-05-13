import React, { useState, useEffect, useRef } from "react";
// import IncomingCallModal from "../../../../components/IncomingCallModal";
import AttendedTransferControls from "../../../../components/AttendedTransferControls";

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
import { FiPhoneCall } from "react-icons/fi";

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
  const [statusTimer, setStatusTimer] = useState(0); // Timer for the current status
  const [timeRemaining, setTimeRemaining] = useState(0); // Time left for the current status
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("warning"); // could be "success", "error", "info", "warning"
  // const [loginTime, setLoginTime] = useState("");


  const timerRef = useRef(null);

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
        setIncomingCall(invitation);
        setCallerId(
          invitation.remoteIdentity.displayName ||
          invitation.remoteIdentity.uri.user ||
          "Unknown Caller"
        );
        setShowPhonePopup(true);
        setPhoneStatus("Ringing");
        ringAudio.play().catch((err) => console.error("🔇 Ringtone error:", err));

        // 🔥 Listen for caller hangup
        invitation.stateChange.addListener((state) => {
          console.log("📈 Call state changed:", state);

          if (state === SessionState.Terminated) {
            console.log("📴 Call terminated detected by listener.");
            stopRingtone();
            clearTimeout(autoRejectTimerRef.current); // ✅ VERY IMPORTANT
            setIncomingCall(null);
            setShowPhonePopup(false); // ✅ Close Modal if caller hangs up
            setPhoneStatus("Idle");

            // Optionally if missed
            if (phoneStatus === "Ringing") {
              addMissedCall(callerId);
            }
          }
        });



        // 🔥 Start auto-reject timer (20 seconds)
        autoRejectTimerRef.current = setTimeout(() => {
          if (incomingCall) {
            console.log("⏰ No answer within 20 seconds, auto-rejecting...");
            incomingCall.reject().catch(console.error);
            addMissedCall(callerId);
            setShowPhonePopup(false);
            setPhoneStatus("Idle");
            stopRingtone();
            setIncomingCall(null);
          }
        }, 20000); // 20,000 milliseconds = 20 seconds
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
    const savedMissedCalls = localStorage.getItem('missedCalls');
    if (savedMissedCalls) {
      setMissedCalls(JSON.parse(savedMissedCalls));
    }
  }, []);

  // 3️⃣ Audio Unlock useEffect
  useEffect(() => {
    const unlockAudio = () => {
      ringAudio.play()
        .then(() => {
          console.log("🔓 Audio unlocked");
          ringAudio.pause();
          ringAudio.currentTime = 0;
          window.removeEventListener('click', unlockAudio);
        })
        .catch(err => {
          console.warn("⚠️ Failed to unlock audio on first click:", err);
        });
    };

    window.addEventListener('click', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
    };
  }, []);

  useEffect(() => {
    const savedMissedCalls = localStorage.getItem("missedCalls");
    if (savedMissedCalls) {
      const parsed = JSON.parse(savedMissedCalls).map((call) => ({
        ...call,
        time: new Date(call.time), // ⬅️ Convert string back to Date object
      }));
      setMissedCalls(parsed);
    }
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

  const addMissedCall = (caller) => {
    const newCall = { caller, time: new Date() };
    setMissedCalls((prev) => {
      const updated = [...prev, newCall];
      localStorage.setItem("missedCalls", JSON.stringify(updated));
      return updated;
    });

    setSnackbarMessage(`📞 Missed Call from ${caller}`);
    setSnackbarSeverity("warning");
    setSnackbarOpen(true);
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
        setSession(incomingCall);
        setIncomingCall(null);
        // setShowPhonePopup(false); // ✅ Close Modal
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
        setShowPhonePopup(false); // ✅ Even if failed, close modal
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
    if (session) {
      session.bye().catch(console.error);
      setSession(null);
      setPhoneStatus("Idle");
      remoteAudio.srcObject = null;
      stopRingtone();
      stopTimer();
      setShowPhonePopup(false);  // ✅ Close the modal properly
      setIncomingCall(null);        // ✅ Clear any call info
    } else if (incomingCall) {
      incomingCall.reject().catch(console.error);
      setIncomingCall(null);
      setPhoneStatus("Idle");
      stopRingtone();
      stopTimer();
      setShowPhonePopup(false); // ✅ Close the modal even if rejected
    }
  };

  const handleRedial = (number) => {
    if (!userAgent) {
      console.error("User Agent not ready yet.");
      return;
    }
    console.log(`📲 Redialing missed caller: ${number}`);

    const target = `sip:${number}@10.52.0.19`;
    const targetURI = UserAgent.makeURI(target);

    if (!targetURI) {
      console.error("Invalid target URI");
      return;
    }

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
        setShowPhonePopup(false); // Close any existing incoming modal
        inviter.stateChange.addListener((state) => {
          if (state === SessionState.Established) {
            console.log("📞 Callback call established");
            setPhoneStatus("In Call");
            attachMediaStream(inviter);
            startTimer();
          } else if (state === SessionState.Terminated) {
            console.log("📴 Callback call ended");
            setPhoneStatus("Idle");
            setSession(null);
            remoteAudio.srcObject = null;
            stopTimer();
          }
        });
      })
      .catch((error) => {
        console.error("❌ Callback failed:", error);
        setPhoneStatus("Call Failed");
      });

    setSnackbarMessage(`📲 Dialing back ${number}`);
    setSnackbarSeverity("info");
    setSnackbarOpen(true);

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

  const handleBlindTransfer = () => {
    if (!session || !transferTarget) return;

    const targetURI = UserAgent.makeURI(`sip:${transferTarget}@10.52.0.19`);
    if (!targetURI) {
      console.error("Invalid transfer target URI");
      return;
    }

    session
      .refer(targetURI)
      .then(() => {
        console.log(`🔁 Call transferred to ${transferTarget}`);
        setSnackbarMessage(`🔁 Call transferred to ${transferTarget}`);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        handleEndCall(); // Optionally end the session on agent's side
      })
      .catch((err) => {
        console.error("❌ Call transfer failed:", err);
        setSnackbarMessage("❌ Transfer failed");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
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

  return (
    <div className="p-6">
      <div className="agent-body">
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <h3>Agent</h3>
          <Tooltip title="View Missed Calls" arrow>
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setMissedOpen(true)}>
              <FiPhoneIncoming size={20} />
              {missedCalls.length > 0 && (
                <span style={{
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
                  justifyContent: "center"
                }}>
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
              <AttendedTransferControls
                isTransferring={isTransferring}
                transferTarget={transferTarget}
                setTransferTarget={setTransferTarget}
                handleAttendedTransferDial={handleAttendedTransferDial}
                completeAttendedTransfer={completeAttendedTransfer}
                cancelAttendedTransfer={cancelAttendedTransfer}
                session={session}
                callDuration={callDuration}
              />
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

      <Dialog open={missedOpen} onClose={() => setMissedOpen(false)} fullWidth maxWidth="xs">
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
                    alignItems: "center"
                  }}
                >
                  <div>
                    <strong>{call.caller}</strong><br />
                    <small>{call.time.toLocaleTimeString()}</small>
                  </div>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => handleRedial(call.caller)}
                    startIcon={<FiPhoneCall />}
                  >
                    Call Back
                  </Button>

                </li>
              ))}
            </ul>


          )}
          <Button onClick={() => setMissedCalls([])} fullWidth variant="outlined" color="error" style={{ marginTop: "10px" }}>
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



    </div>
  );
}

const iconStyle = (bgColor) => ({
  backgroundColor: bgColor,
  padding: 10,
  borderRadius: "50%",
  color: "white",
});
