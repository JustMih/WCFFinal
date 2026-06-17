import React, { useEffect, useState } from "react";
import "./CallQueueCard.css";
import { baseURL } from "../../config";

const formatDuration = (startTime) => {
  if (!startTime) return "00:00";
  const diff = Math.max(
    0,
    Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
  );
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const getWaitTimeClass = (waitTime) => {
  const [minutes, seconds] = waitTime.split(":").map(Number);
  const totalMinutes = minutes + (seconds || 0) / 60;
  if (totalMinutes < 2) return "wait-time-normal";
  if (totalMinutes < 4) return "wait-time-warning";
  return "wait-time-critical";
};

const getCallType = (caller) => {
  const value = String(caller || "");
  if (value.startsWith("1")) return "outbound";
  if (value.startsWith("+") || value.startsWith("0")) return "inbound";
  return "unknown";
};

const getStatusLabel = (call) => {
  if (call.status === "active") return "Active";
  if (call.status === "calling") return "In Queue";
  return call.status || "Unknown";
};

const isLiveQueueCall = (call) =>
  !call.call_end && (call.status === "calling" || call.status === "active");

const CallQueueCard = () => {
  const [liveCalls, setLiveCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [, setTick] = useState(0);

  const fetchQueueData = async () => {
    setError(null);
    try {
      const response = await fetch(
        `${baseURL}/livestream/live-calls?_=${Date.now()}`
      );
      if (!response.ok) throw new Error("Failed to fetch queue data");
      const data = await response.json();
      const rows = Array.isArray(data)
        ? data.filter(isLiveQueueCall)
        : [];
      setLiveCalls(rows);
    } catch (err) {
      setError("Failed to load queue data");
      setLiveCalls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (liveCalls.length === 0) return undefined;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [liveCalls.length]);

  if (loading) {
    return (
      <div className="queue-monitoring-section">
        <h4>Call Queue Monitoring</h4>
        <div>Loading queue data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="queue-monitoring-section">
        <h4>Call Queue Monitoring</h4>
        <div style={{ color: "red" }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="queue-monitoring-section">
      <h4>Call Queue Monitoring</h4>
      <div className="table-responsive">
        <table className="waiting-calls-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Call Type</th>
            </tr>
          </thead>
          <tbody>
            {liveCalls.length > 0 ? (
              liveCalls.map((call) => {
                const durationStart =
                  call.call_answered ||
                  call.queue_entry_time ||
                  call.call_start;
                const duration = formatDuration(durationStart);
                return (
                  <tr key={call.linkedid || call.id}>
                    <td className="queue-id">{call.caller || "Unknown"}</td>
                    <td className="customer-number">
                      {call.callee || call.agent_name || "—"}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${call.status === "active" ? "active" : "calling"}`}
                      >
                        {getStatusLabel(call)}
                      </span>
                    </td>
                    <td>
                      <span className={`wait-time-badge ${getWaitTimeClass(duration)}`}>
                        {duration}
                      </span>
                    </td>
                    <td className="call-type">{getCallType(call.caller)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No waiting calls in the queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CallQueueCard;
