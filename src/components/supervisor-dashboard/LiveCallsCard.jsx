import React, { useState, useEffect } from "react";
import {
  FaHeadphones,
  FaUserShield,
  FaComments,
} from "react-icons/fa";
import "./LiveCallsCard.css";
import { baseURL } from "../../config";

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

  /* ================================
     SPY ACTION (BACKEND CONTROLLED)
     ================================ */
  const spyAction = async (linkedid, mode) => {
    try {
      const response = await fetch(`${baseURL}/livestream/spy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ linkedid, mode }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();
      console.log("✅ Spy started:", data);

      setSpyingOn(linkedid);
    } catch (err) {
      console.error("❌ Spy failed:", err);
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
      }
    }
  }, [activeCalls, spyingOn]);

  const data =
    filteredLiveCalls.length > 0 ? filteredLiveCalls : activeCalls;

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
      <div className="live-calls-header">
        <h4>
          Live Calls{" "}
          {isLoading && (
            <span className="loading-indicator">(Loading...)</span>
          )}
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
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((call) => (
                <tr key={call.linkedid}>
                  <td>{call.caller}</td>
                  <td>{call.callee}</td>

                  <td>
                    {call.agent_extension ? (
                      <strong style={{ color: "#1976d2" }}>
                        {call.agent_name} ({call.agent_extension})
                      </strong>
                    ) : (
                      <em style={{ color: "#999" }}>Unassigned</em>
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
                          spyingOn === call.linkedid ? "active-spy" : ""
                        }`}
                        disabled={call.status !== "active"}
                        onClick={() =>
                          spyAction(call.linkedid, "listen")
                        }
                        title="Listen"
                      >
                        <FaHeadphones />
                      </button>

                      {/* WHISPER */}
                      <button
                        className="action-button whisper"
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
                        className="action-button intervene"
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
