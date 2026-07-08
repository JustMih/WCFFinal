import React, { useState, useEffect } from "react";
import { MdPhoneInTalk, MdAccessTime } from "react-icons/md";
import { baseURL } from "../../config";
import { formatDbTimeLocal, formatElapsedMmSs } from "../../utils/dateTimeFormat";
import "./ActiveCalls.css";

const getDurationStart = (call) => {
  if (call.status === "active") {
    return call.call_answered || call.queue_entry_time || call.call_start;
  }
  return call.queue_entry_time || call.call_start;
};

export default function ActiveCalls({
  liveCalls = null,
  refreshInterval = 2000,
  showTitle = true,
}) {
  const [activeCalls, setActiveCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  const extractPhoneFromClid = (clid) => {
    if (!clid) return "Unknown";
    const match = clid.match(/<(\d+)>/) || clid.match(/(\d+)/);
    return match ? match[1] : clid;
  };

  useEffect(() => {
    const fetchActiveCalls = async () => {
      try {
        let calls = [];

        const isOnDashboard = (call) =>
          !call.call_end &&
          (call.status === "active" || call.status === "calling");

        if (liveCalls) {
          calls = Array.isArray(liveCalls)
            ? liveCalls.filter(isOnDashboard)
            : [];
        } else {
          const response = await fetch(`${baseURL}/livestream/live-calls`);
          if (response.ok) {
            const data = await response.json();
            calls = Array.isArray(data) ? data.filter(isOnDashboard) : [];
          }
        }

        setActiveCalls(calls);
      } catch (error) {
        console.error("Error fetching active calls:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveCalls();

    let intervalId = null;
    if (!liveCalls && refreshInterval > 0) {
      intervalId = setInterval(fetchActiveCalls, refreshInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [liveCalls, refreshInterval]);

  useEffect(() => {
    if (liveCalls) {
      const calls = Array.isArray(liveCalls)
        ? liveCalls.filter(
            (call) =>
              !call.call_end &&
              (call.status === "active" || call.status === "calling")
          )
        : [];
      setActiveCalls(calls);
    }
  }, [liveCalls]);

  useEffect(() => {
    if (activeCalls.length === 0) return undefined;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [activeCalls.length]);

  if (loading && activeCalls.length === 0) {
    return (
      <div className="active-calls-container">
        {showTitle && (
          <h2 className="section-title">
            <MdPhoneInTalk className="section-icon" /> Active Calls
          </h2>
        )}
        <div className="no-calls">Loading active calls...</div>
      </div>
    );
  }

  return (
    <div className="active-calls-container">
      {showTitle && (
        <h2 className="section-title">
          <MdPhoneInTalk className="section-icon" /> Active Calls
        </h2>
      )}
      <div className="active-calls-grid">
        {activeCalls.length > 0 ? (
          activeCalls.map((call, i) => (
            <div key={call.linkedid || call.id || i} className="call-card">
              <div className="call-header">
                <div
                  className={`call-status-badge ${
                    call.status === "calling" ? "queued" : "active"
                  }`}
                >
                  {call.status === "calling" ? "IN QUEUE" : "ACTIVE"}
                </div>
                <div className="call-duration">
                  <MdAccessTime /> {formatElapsedMmSs(getDurationStart(call))}
                </div>
              </div>
              <div className="call-details">
                <div className="call-info-row">
                  <span className="call-label">Caller:</span>
                  <span className="call-value">
                    {extractPhoneFromClid(call.caller) || "Unknown"}
                  </span>
                </div>

                <div className="call-info-row">
                  <span className="call-label">Queue:</span>
                  <span className="call-value">{call.callee || "Unknown"}</span>
                </div>

                <div className="call-info-row">
                  <span className="call-label">Agent:</span>
                  <span className="call-value">
                    {call.agent_name && call.agent_name !== "Unknown Agent"
                      ? call.agent_name +
                        (call.agent_extension
                          ? ` (${call.agent_extension})`
                          : "")
                      : "Waiting for agent"}
                  </span>
                </div>

                {call.call_answered && (
                  <div className="call-info-row">
                    <span className="call-label">Started:</span>
                    <span className="call-value">
                      {formatDbTimeLocal(call.call_answered)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-calls">No active calls at the moment</div>
        )}
      </div>
    </div>
  );
}
