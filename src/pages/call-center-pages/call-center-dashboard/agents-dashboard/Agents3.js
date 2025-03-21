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
import "./agentsDashboard.css";

export default function AgentsDashboard() {
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callStatus, setCallStatus] = useState("Idle");
  const [channelId, setChannelId] = useState(null); // Store channel ID for hangup/mute
  const [ws, setWs] = useState(null);

  const stasisApp = "myapp";

  // WebSocket for real-time events
  useEffect(() => {
    const websocket = new WebSocket(
      `ws://10.52.0.19:8088/ari/events?app=${stasisApp}&api_key=admin:@Ttcl123`
    );
    setWs(websocket);

    websocket.onopen = () => {
      console.log("Connected to ARI WebSocket");
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("ARI Event:", data);
      if (data.type === "StasisStart") {
        setCallStatus("Dialing");
        setChannelId(data.channel.id); // Store the channel ID
      } else if (data.type === "ChannelHangupRequest") {
        setCallStatus("Idle");
        setChannelId(null);
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    websocket.onclose = (event) => {
      console.log("WebSocket Closed:", event.code, event.reason);
    };

    return () => {
      if (websocket) websocket.close();
    };
  }, [stasisApp]);

  const togglePhonePopup = () => {
    setShowPhonePopup(!showPhonePopup);
  };

  const handleDial = async () => {
    if (!phoneNumber) return;

    try {
      const response = await fetch(
        `/ari/channels?endpoint=SIP/${phoneNumber}&app=${stasisApp}&callerId=1002&timeout=30`,
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const channelData = await response.json();
      setChannelId(channelData.id); // Store the channel ID
      setCallStatus("Dialing");
    } catch (err) {
      console.error("Error originating call:", err);
      setCallStatus("Idle");
    }
  };

  const handleEndCall = async () => {
    if (!channelId) return;

    try {
      const response = await fetch(`/ari/channels/${channelId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      setCallStatus("Idle");
      setChannelId(null);
    } catch (err) {
      console.error("Error ending call:", err);
    }
  };

  const handleAudioToggle = async () => {
    if (!channelId) return;

    try {
      const action = callStatus === "Muted" ? "unmute" : "mute";
      const response = await fetch(`/ari/channels/${channelId}/${action}`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      setCallStatus(action === "mute" ? "Muted" : "Connected");
    } catch (err) {
      console.error("Error toggling mute:", err);
    }
  };

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
              disabled={callStatus === "Dialing"}
            >
              Dial
            </Button>
            <div>Status: {callStatus}</div>
          </div>
        </div>
      )}
    </div>
  );
}