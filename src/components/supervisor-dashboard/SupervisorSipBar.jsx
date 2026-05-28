import React from "react";
import { Button } from "@mui/material";
import { SIP_DOMAIN_CONFIG } from "../../config";
import { useSipPhone } from "../../pages/call-center-pages/call-center-dashboard/agents-dashboard/useSipPhone";
import "./SupervisorSipBar.css";

/**
 * Registers the supervisor extension on this page so Listen (AMI ChanSpy)
 * rings here — no Agent Dashboard required.
 */
export default function SupervisorSipBar() {
  const extension = localStorage.getItem("extension");
  const sipPassword = localStorage.getItem("sipPassword");
  const sipReady = Boolean(extension && sipPassword);

  const { phoneStatus, remoteAudioRef, acceptCall, rejectCall, endCall } =
    useSipPhone({
      extension: sipReady ? extension : null,
      sipPassword: sipReady ? sipPassword : null,
      SIP_DOMAIN: SIP_DOMAIN_CONFIG,
      allowIncomingRinging: true,
      autoAnswerSpyCalls: true,
    });

  if (!extension) {
    return (
      <div className="supervisor-sip-bar supervisor-sip-bar--warn">
        No extension on your user profile. Admin must set extension (e.g. 3001)
        in Edit User, then log in again.
      </div>
    );
  }

  const registered =
    phoneStatus === "Idle" ||
    phoneStatus === "Ready" ||
    phoneStatus?.includes("Registered");

  const isRinging = phoneStatus === "Ringing";
  const inListen = phoneStatus === "In Call" || phoneStatus === "Connecting listen…";

  return (
    <div
      className={`supervisor-sip-bar ${
        registered || inListen
          ? "supervisor-sip-bar--ok"
          : "supervisor-sip-bar--warn"
      }`}
    >
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />
      <strong>Supervisor phone (ext {extension}):</strong>{" "}
      <span>{phoneStatus || "Connecting…"}</span>
      {isRinging && (
        <span className="supervisor-sip-actions">
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={acceptCall}
            sx={{ ml: 1 }}
          >
            Answer listen
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={rejectCall}
            sx={{ ml: 1 }}
          >
            Decline
          </Button>
        </span>
      )}
      {inListen && (
        <Button
          size="small"
          variant="outlined"
          color="error"
          onClick={endCall}
          sx={{ ml: 1 }}
        >
          Stop listening
        </Button>
      )}
      {!registered && !isRinging && !inListen && (
        <span className="supervisor-sip-hint">
          {" "}
          — Registering to <code>{SIP_DOMAIN_CONFIG}</code> (WSS :8089). When
          status is <strong>Idle</strong>, click Listen on an active call below.
        </span>
      )}
      {registered && !isRinging && !inListen && (
        <span className="supervisor-sip-hint">
          {" "}
          — Ready. Click Listen on an active call; audio plays here automatically.
        </span>
      )}
    </div>
  );
}
