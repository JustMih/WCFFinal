import React from "react";
import { Button } from "@mui/material";
import { SIP_DOMAIN_CONFIG } from "../../config";
import "./SupervisorSipBar.css";

/**
 * Shows supervisor SIP status + answer/stop controls (phone lives in parent LiveCallsCard).
 */
export default function SupervisorSipBar({
  extension,
  phoneStatus,
  acceptCall,
  rejectCall,
  endCall,
}) {
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
  const inListen =
    phoneStatus === "In Call" || phoneStatus === "Connecting listen…";

  return (
    <div
      className={`supervisor-sip-bar ${
        isRinging
          ? "supervisor-sip-bar--ringing"
          : registered || inListen
          ? "supervisor-sip-bar--ok"
          : "supervisor-sip-bar--warn"
      }`}
    >
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
          — Registering to <code>{SIP_DOMAIN_CONFIG}</code> (WSS :8089). Wait for{" "}
          <strong>Idle</strong> before using Listen.
        </span>
      )}
      {registered && !isRinging && !inListen && (
        <span className="supervisor-sip-hint">
          {" "}
          — Ready. Use Listen only on a row with status <strong>active</strong> and
          an agent name.
        </span>
      )}
    </div>
  );
}
