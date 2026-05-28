import React, { useState, useEffect, useCallback } from "react";
import {
  FaHeadphones,
  FaUserShield,
  FaComments,
  FaPhone,
} from "react-icons/fa";
import { Button, IconButton, Tooltip } from "@mui/material";
import "./LiveCallsCard.css";
import { baseURL, SIP_DOMAIN_CONFIG } from "../../config";
import WcfLoader from "../shared/WcfLoader";
import SupervisorSipBar from "./SupervisorSipBar";
import PhonePopup from "../../pages/call-center-pages/call-center-dashboard/agents-dashboard/PhonePopup";
import "../../pages/call-center-pages/call-center-dashboard/agents-dashboard/agentsDashboard.css";
import { useSipPhone } from "../../pages/call-center-pages/call-center-dashboard/agents-dashboard/useSipPhone";

export default function LiveCallsCard({
  isLoading,
  searchTerm,
  currentPage,
  totalPages,
  onPageChange,
}) {
  const [liveCalls, setLiveCalls] = useState([]);
  const [filteredLiveCalls, setFilteredLiveCalls] = useState([]);
  const [activeCalls, setActiveCalls] = useState([]);
  const [spyingOn, setSpyingOn] = useState(null);
  const [spyMode, setSpyMode] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [listenDisplayName, setListenDisplayName] = useState("Supervisor listen");

  const extension = localStorage.getItem("extension");
  const sipPassword = localStorage.getItem("sipPassword");
  const sipReady = Boolean(extension && sipPassword);

  const {
    phoneStatus,
    incomingCall,
    lastIncomingNumber,
    callDuration,
    phoneNumber,
    setPhoneNumber,
    isMuted,
    isSpeakerOn,
    isOnHold,
    manualTransferExt,
    setManualTransferExt,
    remoteAudioRef,
    formatDuration,
    isConsulting,
    acceptCall,
    rejectCall,
    endCall,
    dial,
    toggleMute,
    toggleSpeaker,
    toggleHold,
    blindTransfer,
    startConsult,
    completeConsultTransfer,
    cancelConsult,
  } = useSipPhone({
    extension: sipReady ? extension : null,
    sipPassword: sipReady ? sipPassword : null,
    SIP_DOMAIN: SIP_DOMAIN_CONFIG,
    allowIncomingRinging: true,
    autoAnswerSpyCalls: true,
  });

  const sipReadyForListen =
    phoneStatus === "Idle" ||
    phoneStatus === "Ready" ||
    phoneStatus?.includes("Registered");

  const modeLabels = {
    listen: "Listening (spy)",
    whisper: "Whispering to agent",
    barge: "Barged into call",
  };

  useEffect(() => {
    if (
      phoneStatus === "Ringing" ||
      phoneStatus === "In Call" ||
      phoneStatus === "Connecting listen…"
    ) {
      setShowPhonePopup(true);
    }
  }, [phoneStatus]);

  const togglePhonePopup = () => setShowPhonePopup((v) => !v);

  const handleAcceptListen = useCallback(() => {
    acceptCall();
  }, [acceptCall]);

  const handleEndListen = useCallback(() => {
    endCall();
    setSpyingOn(null);
    setSpyMode(null);
    setActionMessage("");
  }, [endCall]);

  const spyAction = async (linkedid, mode, agentName, agentExt) => {
    try {
      setActionMessage("");
      setListenDisplayName(
        agentName
          ? `Listen: ${agentName} (ext ${agentExt || "—"})`
          : "Supervisor listen"
      );

      const response = await fetch(`${baseURL}/livestream/spy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ linkedid, mode }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const hint =
          data.asterisk_state === "Unavailable"
            ? " Wait until the phone bar shows Idle, then try again."
            : "";
        throw new Error(
          (data.error || "Could not start supervisor intervention") + hint
        );
      }

      setShowPhonePopup(true);
      setSpyingOn(linkedid);
      setSpyMode(mode);
      setActionMessage(
        `Listen started on ${data.agent_name || agentName || "agent"} (ext ${
          data.agent_extension || agentExt || "—"
        }). When the phone popup rings, click Answer.`
      );
    } catch (err) {
      console.error("❌ Spy failed:", err);
      setActionMessage("");
      alert(err.message || "Spy failed");
    }
  };

  useEffect(() => {
    const fetchLiveCalls = async () => {
      try {
        const response = await fetch(`${baseURL}/livestream/live-calls`);
        const data = await response.json();

        const calls = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];

        setLiveCalls(calls);
        setActiveCalls(calls.filter((c) => c.status === "active"));
      } catch (error) {
        console.error("❌ Error fetching live calls:", error);
      }
    };

    fetchLiveCalls();
    const interval = setInterval(fetchLiveCalls, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const term =
      typeof searchTerm === "string" ? searchTerm.toLowerCase() : "";

    const sourceCalls = Array.isArray(liveCalls) ? liveCalls : [];
    const filtered = sourceCalls.filter(
      (call) =>
        call.caller?.toLowerCase().includes(term) ||
        call.callee?.toLowerCase().includes(term) ||
        call.agent_name?.toLowerCase().includes(term) ||
        call.status?.toLowerCase().includes(term)
    );

    setFilteredLiveCalls(filtered);
  }, [liveCalls, searchTerm]);

  useEffect(() => {
    if (spyingOn) {
      const stillActive = activeCalls.some((c) => c.linkedid === spyingOn);
      if (!stillActive) {
        setSpyingOn(null);
        setSpyMode(null);
        setActionMessage("");
      }
    }
  }, [activeCalls, spyingOn]);

  const supervisorExt = extension ? String(extension) : "";

  const data = (
    filteredLiveCalls.length > 0 ? filteredLiveCalls : activeCalls
  ).filter((call) => {
    if (call.status === "active") return true;
    if (
      supervisorExt &&
      String(call.agent_extension) === supervisorExt &&
      (call.status === "lost" ||
        call.status === "dropped" ||
        call.status === "ended" ||
        call.callee === "s")
    ) {
      return false;
    }
    return call.status === "active" || call.status === "calling";
  });

  const calculateDuration = (answeredAt) => {
    if (!answeredAt) return "00:00:00";

    const start = new Date(answeredAt);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000);

    const h = String(Math.floor(diff / 3600)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
    const s = String(diff % 60).padStart(2, "0");

    return `${h}:${m}:${s}`;
  };

  const getCallType = (caller) => {
    if (!caller) return "unknown";
    if (caller.startsWith("1")) return "outbound";
    if (caller.startsWith("+") || caller.startsWith("0")) return "inbound";
    return "unknown";
  };

  const displayIncomingNumber =
    phoneStatus === "Ringing" || phoneStatus === "In Call"
      ? listenDisplayName
      : lastIncomingNumber;

  return (
    <div className="live-calls-table-container">
      <SupervisorSipBar
        extension={extension}
        phoneStatus={phoneStatus}
        acceptCall={handleAcceptListen}
        rejectCall={rejectCall}
        endCall={handleEndListen}
      />

      <div className="live-calls-header">
        <h4>
          Live Calls{" "}
          {isLoading && (
            <span
              className="loading-indicator"
              style={{
                display: "inline-flex",
                marginLeft: 8,
                verticalAlign: "middle",
              }}
            >
              <WcfLoader size="sm" label="Loading live calls" />
            </span>
          )}
        </h4>
        <div className="live-calls-actions">
          <Tooltip title="Supervisor phone (answer Listen here)">
            <IconButton
              color="primary"
              onClick={togglePhonePopup}
              aria-label="Open supervisor phone"
            >
              <FaPhone />
            </IconButton>
          </Tooltip>
        </div>
        {actionMessage && (
          <p className="spy-action-message">{actionMessage}</p>
        )}
      </div>

      <PhonePopup
        showPhonePopup={showPhonePopup}
        extension={extension}
        phoneStatus={phoneStatus}
        incomingCall={incomingCall}
        lastIncomingNumber={displayIncomingNumber}
        callDuration={callDuration}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        showKeypad={showKeypad}
        setShowKeypad={setShowKeypad}
        isMuted={isMuted}
        isSpeakerOn={isSpeakerOn}
        isOnHold={isOnHold}
        manualTransferExt={manualTransferExt}
        setManualTransferExt={setManualTransferExt}
        remoteAudioRef={remoteAudioRef}
        formatDuration={formatDuration}
        isConsulting={isConsulting}
        onClose={() => setShowPhonePopup(false)}
        onAccept={handleAcceptListen}
        onReject={rejectCall}
        onEnd={handleEndListen}
        onDial={dial}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
        onToggleHold={toggleHold}
        onBlindTransfer={blindTransfer}
        onStartConsult={startConsult}
        onCompleteConsultTransfer={completeConsultTransfer}
        onCancelConsult={cancelConsult}
        incomingLabel="Listen to agent call"
        incomingHint="Click Answer to hear the agent. The customer cannot hear you."
        showDialPad={false}
      />

      <div className="table-responsive">
        <table className="live-calls-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Destination</th>
              <th>Agent</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((call) => (
                <tr key={call.linkedid}>
                  <td className="agent-name">{call.caller}</td>
                  <td className="customer-number">{call.callee}</td>

                  <td className="agent-name">
                    {call.agent_name ? (
                      <span style={{ fontWeight: 600, color: "#1976d2" }}>
                        {call.agent_name}
                        {call.agent_extension && (
                          <span style={{ color: "#555", marginLeft: 6 }}>
                            ({call.agent_extension})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span style={{ color: "#999", fontStyle: "italic" }}>
                        Unassigned
                      </span>
                    )}
                  </td>

                  <td>
                    <span
                      className={`status-badge ${call.status?.toLowerCase()}`}
                    >
                      {call.status}
                    </span>
                  </td>

                  <td>
                    <span className="duration-badge">
                      {calculateDuration(call.call_answered)}
                    </span>
                  </td>

                  <td>{getCallType(call.caller)}</td>

                  <td>
                    <div className="action-buttons">
                      <button
                        className={`action-button listen ${
                          spyingOn === call.linkedid && spyMode === "listen"
                            ? "active-spy"
                            : ""
                        }`}
                        disabled={
                          call.status !== "active" ||
                          !call.agent_extension ||
                          !sipReadyForListen
                        }
                        onClick={() =>
                          spyAction(
                            call.linkedid,
                            "listen",
                            call.agent_name,
                            call.agent_extension
                          )
                        }
                        title={
                          !sipReadyForListen
                            ? "Wait until supervisor phone shows Idle"
                            : call.agent_extension
                              ? "Listen on active call"
                              : "No agent on call yet"
                        }
                      >
                        <FaHeadphones />
                      </button>

                      <button
                        className={`action-button whisper ${
                          spyingOn === call.linkedid && spyMode === "whisper"
                            ? "active-spy"
                            : ""
                        }`}
                        disabled={call.status !== "active"}
                        onClick={() =>
                          spyAction(
                            call.linkedid,
                            "whisper",
                            call.agent_name,
                            call.agent_extension
                          )
                        }
                        title="Whisper"
                      >
                        <FaComments />
                      </button>

                      <button
                        className={`action-button intervene ${
                          spyingOn === call.linkedid && spyMode === "barge"
                            ? "active-spy"
                            : ""
                        }`}
                        disabled={call.status !== "active"}
                        onClick={() =>
                          spyAction(
                            call.linkedid,
                            "barge",
                            call.agent_name,
                            call.agent_extension
                          )
                        }
                        title="Barge"
                      >
                        <FaUserShield />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
                  No active calls
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
