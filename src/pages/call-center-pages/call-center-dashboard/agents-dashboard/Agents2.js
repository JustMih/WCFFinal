import React, { useState, useEffect } from "react";
import { MdOutlineLocalPhone } from "react-icons/md";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { MdPauseCircleOutline } from "react-icons/md";
import { MdLocalPhone } from "react-icons/md";
import { IoKeypadOutline } from "react-icons/io5";
import { BsFillMicMuteFill } from "react-icons/bs";
import { TextField, Button } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import JsSIP from "jssip";
import "./agentsDashboard.css";

export default function AgentsDashboard() {
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [session, setSession] = useState(null);
  const [phoneStatus, setPhoneStatus] = useState("Idle");

  // Setup JsSIP configuration
  const socket = new JsSIP.WebSocketInterface("wss://10.52.0.19:5066/ws"); // Use your Asterisk WebSocket URL
  const configuration = {
    sockets: [socket],
    uri: "sip:1002@10.52.0.19", // Replace with your SIP extension
    password: "sip12345", // Replace with your SIP password
    trace_sip: true,
  };

  const userAgent = new JsSIP.UA(configuration);

  const togglePhonePopup = () => {
    setShowPhonePopup(!showPhonePopup);
  };

  const handleDial = () => {
    if (phoneNumber) {
      const session = userAgent.call(`sip:${phoneNumber}@10.52.0.19`, {
        mediaConstraints: { audio: true, video: false },
      });
      setSession(session);
      setPhoneStatus("Dialing");
    }
  };

  const handleEndCall = () => {
    if (session) {
      session.terminate();
      setPhoneStatus("Idle");
    }
  };

  const handleAudioToggle = () => {
    if (session) {
      session.toggleMute();
    }
  };

  useEffect(() => {
    userAgent.start();

    return () => {
      userAgent.stop();
    };
  }, []);

  return (
    <div className="p-6">
      <div className="agent-body">
        <h3>Agent</h3>
        <div className="phone-navbar">
          <MdOutlineLocalPhone
            className="phone-btn-call"
            onClick={togglePhonePopup}
          />
        </div>
      </div>

      {showPhonePopup && (
        <div className="phone-popup">
          <div className="phone-popup-header">
            <span>Calls</span>
            <button onClick={togglePhonePopup} className="close-popup-btn">
              X
            </button>
          </div>
          <div className="phone-popup-body">
            <TextField
              label="Phone Number"
              variant="outlined"
              fullWidth
              margin="normal"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <div className="phone-action-btn">
              <Tooltip title="Loud speaker">
                <IconButton>
                  <HiMiniSpeakerWave
                    fontSize={15}
                    style={{
                      backgroundColor: "grey",
                      padding: 10,
                      borderRadius: "50%",
                      color: "white",
                    }}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title="Pause Phone">
                <IconButton>
                  <MdPauseCircleOutline
                    fontSize={15}
                    style={{
                      backgroundColor: "#3c8aba",
                      padding: 10,
                      borderRadius: "50%",
                      color: "white",
                    }}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title="Keypad">
                <IconButton>
                  <IoKeypadOutline
                    fontSize={15}
                    style={{
                      backgroundColor: "#939488",
                      padding: 10,
                      borderRadius: "50%",
                      color: "white",
                    }}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title="End Call">
                <IconButton onClick={handleEndCall}>
                  <MdLocalPhone
                    fontSize={15}
                    style={{
                      backgroundColor: "red",
                      padding: 10,
                      borderRadius: "50%",
                      color: "white",
                    }}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title="Mute Speaker">
                <IconButton onClick={handleAudioToggle}>
                  <BsFillMicMuteFill
                    fontSize={15}
                    style={{
                      backgroundColor: "grey",
                      padding: 10,
                      borderRadius: "50%",
                      color: "white",
                    }}
                  />
                </IconButton>
              </Tooltip>
            </div>
            <div className="work-number">Work number: +1 714-628-XXXX</div>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDial}
              disabled={phoneStatus === "Dialing"}
            >
              Dial
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
