import React from "react";
import { SIP_DOMAIN_CONFIG } from "../../config";
import { useSipPhone } from "../../pages/call-center-pages/call-center-dashboard/agents-dashboard/useSipPhone";
import "./SupervisorSipBar.css";

/**
 * Supervisors do not use the Agent Dashboard, so they need this bar to
 * register extension 3001 on Asterisk (required before Listen / spy works).
 */
export default function SupervisorSipBar() {
  const extension = localStorage.getItem("extension");
  const sipPassword = localStorage.getItem("sipPassword");
  const sipReady = Boolean(extension && sipPassword);

  const { phoneStatus, remoteAudioRef } = useSipPhone({
    extension: sipReady ? extension : null,
    sipPassword: sipReady ? sipPassword : null,
    SIP_DOMAIN: SIP_DOMAIN_CONFIG,
    allowIncomingRinging: true,
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

  return (
    <div
      className={`supervisor-sip-bar ${
        registered ? "supervisor-sip-bar--ok" : "supervisor-sip-bar--warn"
      }`}
    >
      <audio ref={remoteAudioRef} autoPlay style={{ display: "none" }} />
      <strong>Supervisor phone (ext {extension}):</strong>{" "}
      <span>{phoneStatus || "Connecting…"}</span>
      {!registered && (
        <span className="supervisor-sip-hint">
          {" "}
          — Registering to <code>{SIP_DOMAIN_CONFIG}</code> (WSS :8089). Keep
          this page open. When status is Idle/Ready, Listen will ring this
          extension. Password is set at login (same as agents).
        </span>
      )}
      {registered && (
        <span className="supervisor-sip-hint">
          {" "}
          — Registered. Click Listen on an active call; answer when ext{" "}
          {extension} rings.
        </span>
      )}
    </div>
  );
}
