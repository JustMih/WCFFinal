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
  const [channelId, setChannelId] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [ringAudio] = useState(new Audio("/ringtone.mp3")); // Local ringtone file

  const ariUser = "admin";
  const ariPassword = "@Ttcl123";
  const stasisApp = "myapp";

  const togglePhonePopup = () => {
    setShowPhonePopup(!showPhonePopup);
  };

  const handleDial = async () => {
    if (phoneNumber) {
      const originateUrl = "/ari/channels";

      try {
        const response = await fetch(originateUrl, {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(`${ariUser}:${ariPassword}`),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: `PJSIP/${phoneNumber}`,
            app: stasisApp,
            callerId: "Aisha",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Call originated:", data);
          setPhoneStatus("Dialing");
          setChannelId(data.id);
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
          Authorization: "Basic " + btoa(`${ariUser}:${ariPassword}`),
        },
      });

      if (response.ok) {
        console.log("Call ended successfully");
        setPhoneStatus("Idle");
        setChannelId(null);
        stopRingtone();
      } else {
        const text = await response.text();
        console.error("Failed to end call:", text);
      }
    } catch (error) {
      console.error("Error ending call:", error);
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    const answerUrl = `/ari/channels/${incomingCall.id}/answer`;

    try {
      const response = await fetch(answerUrl, {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${ariUser}:${ariPassword}`),
        },
      });

      if (response.ok) {
        console.log("Call answered");
        setPhoneStatus("In Call");
        setChannelId(incomingCall.id);
        setIncomingCall(null);
        stopRingtone();
      } else {
        const text = await response.text();
        console.error("Failed to answer call:", text);
      }
    } catch (error) {
      console.error("Error answering call:", error);
    }
  };

  const handleRejectCall = async () => {
    if (!incomingCall) return;
    const hangupUrl = `/ari/channels/${incomingCall.id}`;

    try {
      const response = await fetch(hangupUrl, {
        method: "DELETE",
        headers: {
          Authorization: "Basic " + btoa(`${ariUser}:${ariPassword}`),
        },
      });

      if (response.ok) {
        console.log("Call rejected");
        setIncomingCall(null);
        stopRingtone();
      } else {
        const text = await response.text();
        console.error("Failed to reject call:", text);
      }
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  };

  const stopRingtone = () => {
    ringAudio.pause();
    ringAudio.currentTime = 0;
  };

  useEffect(() => {
    ringAudio.loop = true;
    ringAudio.volume = 0.7;

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
        const channel = event.channel;
        console.log("Channel Direction:", channel.direction);

        // Always trigger popup for debug purposes
        console.log("📞 Incoming or Outgoing Call from:", channel.caller.number);
        setIncomingCall(channel);

        ringAudio.play()
          .then(() => console.log("🔔 Ringtone playing"))
          .catch(err => console.error("🔇 Ringtone failed:", err));

        setPhoneStatus("Ringing");
        setChannelId(channel.id);

      } else if (event.type === "StasisEnd" || event.type === "ChannelDestroyed") {
        setPhoneStatus("Idle");
        setChannelId(null);
        setIncomingCall(null);
        stopRingtone();
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
      stopRingtone();
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

      {incomingCall && (
        <div className="incoming-call-popup">
          <h4>Incoming Call</h4>
          <p>From: {incomingCall.caller.number}</p>
          <Button variant="contained" color="primary" onClick={handleAcceptCall} style={{ marginRight: "10px" }}>
            Accept
          </Button>
          <Button variant="contained" color="secondary" onClick={handleRejectCall}>
            Reject
          </Button>
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
