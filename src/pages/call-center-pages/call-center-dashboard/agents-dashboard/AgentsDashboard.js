import React, { useState, useEffect } from "react";
import { MdOutlineLocalPhone, MdPauseCircleOutline, MdLocalPhone } from "react-icons/md";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { IoKeypadOutline } from "react-icons/io5";
import { BsFillMicMuteFill } from "react-icons/bs";
import { TextField, Button } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import "./agentsDashboard.css";

export default function AgentsDashboard() {
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneStatus, setPhoneStatus] = useState("Idle");
  const [websocket, setWebSocket] = useState(null);
  const [channelId, setChannelId] = useState(null); // Track active channelId for hangup

  // ARI Configuration Constants
  const ariUser = "admin";
  const ariPassword = "@Ttcl123";
  const stasisApp = "myapp";

  const togglePhonePopup = () => {
    setShowPhonePopup(!showPhonePopup);
  };

  const handleDial = async () => {
    if (phoneNumber) {
      const originateUrl = `/ari/channels`;

      try {
        console.log("Dialing:", phoneNumber);
        const response = await fetch(originateUrl, {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(`${ariUser}:${ariPassword}`),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: `PJSIP/${phoneNumber}`,
            app: stasisApp,
            callerId: "1002"
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Call originated:", data);
          setPhoneStatus("Dialing");
          setChannelId(data.id); // Save channelId for hangup
        } else {
          const text = await response.text();
          console.error("Failed to originate call:", text);
        }
      } catch (error) {
        console.error("Error originating call:", error);
      }
    }
  };

  const handleEndCall = async () => {
    if (!channelId) {
      console.warn("No active call to hang up.");
      return;
    }

    const hangupUrl = `/ari/channels/${channelId}`;

    try {
      const response = await fetch(hangupUrl, {
        method: "DELETE",
        headers: {
          Authorization: "Basic " + btoa(`${ariUser}:${ariPassword}`)
        }
      });

      if (response.ok) {
        console.log("Call ended successfully");
        setPhoneStatus("Idle");
        setChannelId(null); // Reset after hangup
      } else {
        const text = await response.text();
        console.error("Failed to end call:", text);
      }
    } catch (error) {
      console.error("Error ending call:", error);
    }
  };

  useEffect(() => {
    const wsUrl = `ws://10.52.0.19:8088/ari/events?app=${stasisApp}&api_key=${ariUser}:${ariPassword}`;
    const ws = new WebSocket(wsUrl);
    setWebSocket(ws);

    ws.onopen = () => {
      console.log("Connected to ARI WebSocket");
    };

    ws.onmessage = (message) => {
      const event = JSON.parse(message.data);
      console.log("ARI Event:", event);

      if (event.type === "StasisStart") {
        setPhoneStatus("In Call");
        if (event.channel && event.channel.id) {
          setChannelId(event.channel.id);
        }
      } else if (event.type === "StasisEnd" || event.type === "ChannelDestroyed") {
        setPhoneStatus("Idle");
        setChannelId(null);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    ws.onclose = () => {
      console.log("ARI WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, []);

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
            <span>Calls</span>
            <button onClick={togglePhonePopup} className="close-popup-btn">X</button>
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
                  <HiMiniSpeakerWave fontSize={15} style={iconStyle("grey")} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Pause Phone">
                <IconButton>
                  <MdPauseCircleOutline fontSize={15} style={iconStyle("#3c8aba")} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Keypad">
                <IconButton>
                  <IoKeypadOutline fontSize={15} style={iconStyle("#939488")} />
                </IconButton>
              </Tooltip>
              <Tooltip title="End Call">
                <IconButton onClick={handleEndCall}>
                  <MdLocalPhone fontSize={15} style={iconStyle("red")} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Mute Speaker">
                <IconButton>
                  <BsFillMicMuteFill fontSize={15} style={iconStyle("grey")} />
                </IconButton>
              </Tooltip>
            </div>
            <div className="work-number">Work number: +1 714-628-XXXX</div>
            <Button variant="contained" color="primary" onClick={handleDial} disabled={phoneStatus === "Dialing"}>
              Dial
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const iconStyle = (bgColor) => ({
  backgroundColor: bgColor,
  padding: 10,
  borderRadius: "50%",
  color: "white",
});
