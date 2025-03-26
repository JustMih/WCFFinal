import React, { useState, useEffect, useRef } from "react";
import {
  MdOutlineLocalPhone,
  MdPauseCircleOutline,
  MdLocalPhone,
} from "react-icons/md";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { IoKeypadOutline } from "react-icons/io5";
import { BsFillMicMuteFill } from "react-icons/bs";
import { TextField, Button, Dialog, DialogTitle, DialogContent } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import {
  UserAgent,
  Inviter,
  Invitation,
  Registerer,
  SessionState,
  URI,
} from "sip.js";
import "./agentsDashboard.css";

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
  const timerRef = useRef(null);

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
    ringAudio.loop = true;
    ringAudio.volume = 0.7;
    remoteAudio.autoplay = true;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => console.log("🎤 Microphone access granted"))
      .catch((error) => console.error("❌ Microphone access denied:", error));

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
        ringAudio.play().catch((err) => console.error("🔇 Ringtone error:", err));
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
        .catch((err) => console.warn("🔇 Failed to change output device:", err));
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

    inviter.invite()
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
    remoteAudio.play().catch((err) => console.error("🔇 Audio playback failed:", err));
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
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((digit) => (
            <Button
              key={digit}
              variant="outlined"
              onClick={() => sendDTMF(digit)}
              style={{ margin: 5, width: 50, height: 50 }}
            >
              {digit}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="p-6">
      <div className="agent-body">
        <h3>Agent</h3>
        <div className="phone-navbar">
          <MdOutlineLocalPhone className="phone-btn-call" onClick={togglePhonePopup} />
        </div>
      </div>

      {showPhonePopup && (
        <div className="phone-popup">
          <div className="phone-popup-header">
            <span>{phoneStatus === "In Call" ? "Call in Progress" : "Phone"}</span>
            <button onClick={togglePhonePopup} className="close-popup-btn">X</button>
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
                  <HiMiniSpeakerWave fontSize={15} style={iconStyle(isSpeakerOn ? "green" : "grey")} />
                </IconButton>
              </Tooltip>
              <Tooltip title={isOnHold ? "Resume Call" : "Hold Call"}>
                <IconButton onClick={toggleHold}>
                  <MdPauseCircleOutline fontSize={15} style={iconStyle(isOnHold ? "orange" : "#3c8aba")} />
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
                  <BsFillMicMuteFill fontSize={15} style={iconStyle(isMuted ? "orange" : "grey")} />
                </IconButton>
              </Tooltip>
            </div>

            {phoneStatus !== "In Call" && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleDial}
                disabled={phoneStatus === "Dialing" || phoneStatus === "Ringing"}
              >
                Dial
              </Button>
            )}

            {incomingCall && phoneStatus !== "In Call" && (
              <>
                <p>
                  From: {incomingCall.remoteIdentity.displayName || incomingCall.remoteIdentity.uri.user}
                </p>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAcceptCall}
                  style={{ marginRight: "10px" }}
                >
                  Accept
                </Button>
                <Button variant="contained" color="secondary" onClick={handleRejectCall}>
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {renderKeypad()}
    </div>
  );
}

const iconStyle = (bgColor) => ({
  backgroundColor: bgColor,
  padding: 10,
  borderRadius: "50%",
  color: "white",
});
