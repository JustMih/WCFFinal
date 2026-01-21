import React, { useState, useEffect } from "react";
import { MdPhoneInTalk, MdAccessTime } from "react-icons/md";
import { baseURL } from "../../config";
import "./ActiveCalls.css";

export default function ActiveCalls({ 
  liveCalls = null, 
  refreshInterval = 2000,
  showTitle = true 
}) {
  const [activeCalls, setActiveCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatDuration = (startTime) => {
    if (!startTime) return "00:00";
    const diff = Math.floor((new Date() - new Date(startTime)) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const extractAgentFromChannel = (channel) => {
    if (!channel) return "Unassigned";
    const match = channel.match(/\/(\d+)/);
    return match ? match[1] : channel;
  };

  const extractPhoneFromClid = (clid) => {
    if (!clid) return "Unknown";
    const match = clid.match(/<(\d+)>/) || clid.match(/(\d+)/);
    return match ? match[1] : clid;
  };

  useEffect(() => {
    const fetchActiveCalls = async () => {
      try {
        let calls = [];
        
        if (liveCalls) {
          // Use provided liveCalls prop
          calls = Array.isArray(liveCalls) 
            ? liveCalls.filter((call) => call.status === "active")
            : [];
        } else {
          // Fetch from API
          const response = await fetch(`${baseURL}/livestream/live-calls`);
          if (response.ok) {
            const data = await response.json();
            calls = Array.isArray(data) 
              ? data.filter((call) => call.status === "active")
              : [];
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

    // Set up interval if refreshInterval is provided and no liveCalls prop
    let intervalId = null;
    if (!liveCalls && refreshInterval > 0) {
      intervalId = setInterval(fetchActiveCalls, refreshInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [liveCalls, refreshInterval]);

  // Update activeCalls when liveCalls prop changes
  useEffect(() => {
    if (liveCalls) {
      const calls = Array.isArray(liveCalls) 
        ? liveCalls.filter((call) => call.status === "active")
        : [];
      setActiveCalls(calls);
    }
  }, [liveCalls]);

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
                <div className="call-status-badge active">ACTIVE</div>
                <div className="call-duration">
                  <MdAccessTime /> {formatDuration(call.call_answered || call.call_start)}
                </div>
              </div>
              <div className="call-details">
                <div className="call-info-row">
                  <span className="call-label">Caller:</span>
                  <span className="call-value">{extractPhoneFromClid(call.caller) || "Unknown"}</span>
                </div>
                <div className="call-info-row">
                  <span className="call-label">Receiver:</span>
                  <span className="call-value">{call.callee || call.cid_dnid || extractAgentFromChannel(call.channel) || "Unknown"}</span>
                </div>
                {call.agent && (
                  <div className="call-info-row">
                    <span className="call-label">Agent:</span>
                    <span className="call-value">{call.agent}</span>
                  </div>
                )}
                {call.call_answered && (
                  <div className="call-info-row">
                    <span className="call-label">Started:</span>
                    <span className="call-value">{new Date(call.call_answered).toLocaleTimeString()}</span>
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

