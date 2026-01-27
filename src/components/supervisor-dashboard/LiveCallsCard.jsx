import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaHeadphones,
  FaUserShield,
  FaComments,
} from "react-icons/fa";
import "./LiveCallsCard.css";
import { baseURL } from "../../config";
import { initSupervisorSIP, sipCall } from "../../sip/supervisorSip";

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
  const [active, setActive] = useState([]);

  /* ================================
     SPY ACTION HANDLER (NEW)
     ================================ */
  // const spyAction = async (spyCallId, action) => {
  //   console.log(`[SPY] ${action} on`, spyCallId);

  //   if (!spyCallId) {
  //     console.error("[SPY] Missing spyCallId");
  //     return;
  //   }

  //   try {
  //     const response = await fetch(`${baseURL}/spy/call-control`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         callId: spyCallId,
  //         action,
  //       }),
  //     });

  //     const data = await response.json();
  //     console.log("[SPY] Dial string:", data.dial);

      // TODO: Trigger SIP.js call here
      // sipCall(data.dial);

  //   } catch (error) {
  //     console.error("[SPY] Error:", error);
  //   }
  // };
const spyAction = async (spyCallId, action) => {
  if (!spyCallId) return;

  try {
    const response = await fetch(`${baseURL}/spy/call-control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId: spyCallId, action })
    });

    const data = await response.json();

    // ✅ THIS IS IT
    if (data?.dial) {
      sipCall(data.dial);
    }

  } catch (error) {
    console.error("[SPY] Error:", error);
  }
};

  const handleListen = (spyCallId) => spyAction(spyCallId, "listen");
  const handleWhisper = (spyCallId) => spyAction(spyCallId, "whisper");
  const handleIntervene = (spyCallId) => spyAction(spyCallId, "barge");

  /* ================================
     HELPERS
     ================================ */
  const calculateDuration = (callAnsweredTime) => {
    if (!callAnsweredTime) return "00:00:00";

    const callAnsweredDate = new Date(callAnsweredTime);
    const currentDate = new Date();
    const durationInMillis = currentDate - callAnsweredDate;
    const seconds = Math.floor((durationInMillis / 1000) % 60);
    const minutes = Math.floor((durationInMillis / (1000 * 60)) % 60);
    const hours = Math.floor((durationInMillis / (1000 * 60 * 60)) % 24);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const getCallType = (caller) => {
    if (!caller) return "unknown";
    if (caller.startsWith("1")) return "outbound";
    if (caller.startsWith("+") || caller.startsWith("0")) return "inbound";
    return "unknown";
  };

  const getDurationColorClass = (duration) => {
    if (!duration) return "";
    const [, minutes, seconds] = duration.split(":").map(Number);
    const totalMinutes = minutes + seconds / 60;
    if (totalMinutes < 2) return "duration-green";
    if (totalMinutes < 5) return "duration-yellow";
    return "duration-red";
  };
useEffect(() => {
  initSupervisorSIP();
}, []);

  /* ================================
     FETCH LIVE CALLS
     ================================ */
  useEffect(() => {
    const fetchLiveCalls = async () => {
      try {
        const response = await fetch(`${baseURL}/livestream/live-calls`);
        const data = await response.json();
        setLiveCalls(data);
        setActive(data.filter((call) => call.status === "active"));
      } catch (error) {
        console.error("Error fetching live calls:", error);
      }
    };

    fetchLiveCalls();
    const intervalId = setInterval(fetchLiveCalls, 5000);
    return () => clearInterval(intervalId);
  }, []);

  /* ================================
     SEARCH FILTER
     ================================ */
  useEffect(() => {
    const safeSearchTerm =
      typeof searchTerm === "string" ? searchTerm.toLowerCase() : "";
    const filtered = liveCalls.filter(
      (call) =>
        call.caller?.toLowerCase().includes(safeSearchTerm) ||
        call.callee?.toLowerCase().includes(safeSearchTerm) ||
        call.status?.toLowerCase().includes(safeSearchTerm)
    );
    setFilteredLiveCalls(filtered);
  }, [liveCalls, searchTerm]);

  const data = filteredLiveCalls.length > 0 ? filteredLiveCalls : liveCalls;

  /* ================================
     RENDER
     ================================ */
  return (
    <div className="live-calls-table-container">
      <div className="live-calls-header">
        <h4>
          Live Calls{" "}
          {isLoading && <span className="loading-indicator">(Loading...)</span>}
        </h4>
        
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
              <th>Call Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {active.length > 0 ? (
              active.map((call) => (
                <tr key={call.spyCallId || call.id}>
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
                    <span className={`status-badge ${call.status?.toLowerCase()}`}>
                      {call.status}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`duration-badge ${getDurationColorClass(
                        calculateDuration(call.call_answered)
                      )}`}
                    >
                      {calculateDuration(call.call_answered)}
                    </span>
                  </td>
                  <td className="call-type">{getCallType(call.caller)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-button listen"
                        // onClick={() => handleListen(call.spyCallId)}
                        onClick={() => handleListen(call.spyCallId || call.channel)}
                        // disabled={!call.spyCallId}
                        disabled={!call.spyCallId && !call.channel}

                        title="Listen"
                      >
                        <FaHeadphones />
                      </button>
                      <button
                        className="action-button intervene"
                        // onClick={() => handleIntervene(call.spyCallId)}
                        onClick={() => handleListen(call.spyCallId || call.channel)}
                        // disabled={!call.spyCallId}
                        disabled={!call.spyCallId && !call.channel}

                        title="Intervene"
                      >
                        <FaUserShield />
                      </button>
                      <button
                        className="action-button whisper"
                        // onClick={() => handleWhisper(call.spyCallId)}
                        onClick={() => handleListen(call.spyCallId || call.channel)}

                        // disabled={!call.spyCallId}
                        disabled={!call.spyCallId && !call.channel}

                        title="Whisper"
                      >
                        <FaComments />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">
                  No live calls available.
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
          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>
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
