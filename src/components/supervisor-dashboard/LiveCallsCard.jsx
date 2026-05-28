import React, { useState, useEffect } from "react";
import {
  FaHeadphones,
  FaUserShield,
  FaComments,
} from "react-icons/fa";
import { Button } from "@mui/material";
import "./LiveCallsCard.css";
import { baseURL, SIP_DOMAIN_CONFIG } from "../../config";
import SupervisorSipBar from "./SupervisorSipBar";
import { useSipPhone } from "../../pages/call-center-pages/call-center-dashboard/agents-dashboard/useSipPhone";

export default function LiveCallsCard({
  isLoading,
  searchTerm,
  onSearch,
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

  const extension = localStorage.getItem("extension");
  const sipPassword = localStorage.getItem("sipPassword");
  const sipReady = Boolean(extension && sipPassword);

  const {
    phoneStatus,
    remoteAudioRef,
    acceptCall,
    rejectCall,
    endCall,
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

  /* ================================
     SPY / WHISPER / BARGE (AMI → supervisor phone)
     ================================ */
  const spyAction = async (linkedid, mode) => {
    try {
      setActionMessage("");

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
            ? " Register extension on this page (yellow bar) until status is Idle."
            : "";
        throw new Error((data.error || "Could not start supervisor intervention") + hint);
      }

      setSpyingOn(linkedid);
      setSpyMode(mode);
      const steps = Array.isArray(data.instructions)
        ? data.instructions.join(" ")
        : `Answer your phone (extension ${data.supervisor_extension}) when it rings to hear the agent.`;
      setActionMessage(
        `Step 2: Your phone is ringing — click the orange bar above → Answer listen (within 20s on old builds; auto-answer after redeploy). Then you hear ${data.agent_name || "the agent"} (ext ${data.agent_extension || "—"}).`
      );
    } catch (err) {
      console.error("❌ Spy failed:", err);
      setActionMessage("");
      alert(err.message || "Spy failed");
    }
  };

  /* ================================
     FETCH LIVE CALLS
     ================================ */
  useEffect(() => {
    const fetchLiveCalls = async () => {
      try {
        const response = await fetch(`${baseURL}/livestream/live-calls`);
        const data = await response.json();

        setLiveCalls(data);
        setActiveCalls(data.filter((c) => c.status === "active"));
      } catch (error) {
        console.error("❌ Error fetching live calls:", error);
      }
    };

    fetchLiveCalls();
    const interval = setInterval(fetchLiveCalls, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ================================
     SEARCH FILTER
     ================================ */
  useEffect(() => {
    const term =
      typeof searchTerm === "string" ? searchTerm.toLowerCase() : "";

    const filtered = liveCalls.filter(
      (call) =>
        call.caller?.toLowerCase().includes(term) ||
        call.callee?.toLowerCase().includes(term) ||
        call.agent_name?.toLowerCase().includes(term) ||
        call.status?.toLowerCase().includes(term)
    );

    setFilteredLiveCalls(filtered);
  }, [liveCalls, searchTerm]);

  /* ================================
     CLEAR SPY STATE WHEN CALL ENDS
     ================================ */
  useEffect(() => {
    if (spyingOn) {
      const stillActive = activeCalls.some(
        (c) => c.linkedid === spyingOn
      );
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

  /* ================================
     HELPERS
     ================================ */
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

  /* ================================
     RENDER
     ================================ */
  return (
    <div className="live-calls-table-container">
      <SupervisorSipBar
        extension={extension}
        phoneStatus={phoneStatus}
        remoteAudioRef={remoteAudioRef}
        acceptCall={acceptCall}
        rejectCall={rejectCall}
        endCall={endCall}
      />

      {phoneStatus === "Ringing" && (
        <div className="listen-answer-banner">
          <strong>Listen call ringing</strong> — click{" "}
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={acceptCall}
          >
            Answer listen
          </Button>{" "}
          in the orange bar above (you have ~20 seconds).
        </div>
      )}

      <div className="live-calls-header">
        <h4>
          Live Calls{" "}
          {isLoading && (
            <span className="loading-indicator">(Loading...)</span>
          )}
        </h4>
        {actionMessage && (
          <p className="spy-action-message">{actionMessage}</p>
        )}
      </div>

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
                      {/* LISTEN */}
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
                          spyAction(call.linkedid, "listen")
                        }
                        title={
                          !sipReadyForListen
                            ? "Wait until supervisor phone shows Idle"
                            : call.agent_extension
                            ? "Listen: only when status is active"
                            : "No agent on call yet"
                        }
                      >
                        <FaHeadphones />
                      </button>

                      {/* WHISPER */}
                      <button
                        className={`action-button whisper ${
                          spyingOn === call.linkedid && spyMode === "whisper"
                            ? "active-spy"
                            : ""
                        }`}
                        disabled={call.status !== "active"}
                        onClick={() =>
                          spyAction(call.linkedid, "whisper")
                        }
                        title="Whisper"
                      >
                        <FaComments />
                      </button>

                      {/* BARGE */}
                      <button
                        className={`action-button intervene ${
                          spyingOn === call.linkedid && spyMode === "barge"
                            ? "active-spy"
                            : ""
                        }`}
                        disabled={call.status !== "active"}
                        onClick={() =>
                          spyAction(call.linkedid, "barge")
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
