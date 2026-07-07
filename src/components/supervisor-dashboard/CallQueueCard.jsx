import React, { useEffect, useState, useCallback } from "react";
import io from "socket.io-client";
import "./CallQueueCard.css";
import { baseURL } from "../../config";
import { formatElapsedMmSs } from "../../utils/dateTimeFormat";

<<<<<<< HEAD
/** Live queue card only — MM:SS from elapsed seconds (does not use report formatSecondsToMinutes). */
const formatWaitMmSs = (totalSeconds) => {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
};

/** Use the newest start time so an old AMI/CEL stamp cannot show 180:52 for a ~3 min call. */
const pickLiveStartTime = (call) => {
  if (call.status === "active" && call.call_answered) {
    return call.call_answered;
  }
  const candidates = [call.queue_entry_time, call.call_start].filter(Boolean);
  let best = null;
  let bestMs = -Infinity;
  for (const value of candidates) {
    const ms = new Date(value).getTime();
    if (!Number.isFinite(ms)) continue;
    if (ms > bestMs) {
      bestMs = ms;
      best = value;
    }
  }
  return best;
};

const getWaitSeconds = (call) => {
  const start = pickLiveStartTime(call);
  if (!start) return 0;
  const startMs = new Date(start).getTime();
  if (!Number.isFinite(startMs)) return 0;
  return Math.max(0, Math.floor((Date.now() - startMs) / 1000));
=======
const getDurationStart = (call) => {
  if (call.status === "active") {
    return call.call_answered || call.queue_entry_time || call.call_start;
  }
  return call.queue_entry_time || call.call_start;
>>>>>>> d180d767e03631b51d2db1702daf6b235a658a8c
};

const getWaitTimeClass = (waitTime) => {
  const [minutes, seconds] = String(waitTime).split(":").map(Number);
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
  !call.call_end &&
  (call.status === "calling" || call.status === "active");

const sortQueueCalls = (rows) =>
  [...rows].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return 1;
    if (b.status === "active" && a.status !== "active") return -1;
    return (
      new Date(a.queue_entry_time || a.call_start || 0) -
      new Date(b.queue_entry_time || b.call_start || 0)
    );
  });

const CallQueueCard = () => {
  const [liveCalls, setLiveCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [, setTick] = useState(0);

  const applyLiveRows = useCallback((rows) => {
    const list = Array.isArray(rows) ? rows.filter(isLiveQueueCall) : [];
    setLiveCalls(sortQueueCalls(list));
  }, []);

  const fetchQueueData = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(
        `${baseURL}/livestream/live-calls?_=${Date.now()}`
      );
      if (!response.ok) throw new Error("Failed to fetch queue data");
      const data = await response.json();
      applyLiveRows(data);
    } catch (err) {
      setError("Failed to load queue data");
      setLiveCalls([]);
    } finally {
      setLoading(false);
    }
  }, [applyLiveRows]);

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 2000);
    return () => clearInterval(interval);
  }, [fetchQueueData]);

  useEffect(() => {
    const socketUrl = baseURL.replace(/\/api$/, "") || window.location.origin;
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    socket.on("live_call_update", () => fetchQueueData());
    return () => socket.disconnect();
  }, [fetchQueueData]);

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
                const duration = formatElapsedMmSs(getDurationStart(call));
                const statusClass =
                  call.status === "active"
                    ? "active"
                    : call.status === "ringing"
                      ? "ringing"
                      : "calling";
                return (
                  <tr key={call.linkedid || call.id}>
                    <td className="queue-id">{call.caller || "Unknown"}</td>
                    <td className="customer-number">
                      {call.callee || call.agent_name || "—"}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          call.status === "active" ? "active" : "calling"
                        }`}
                      >
                        {getStatusLabel(call)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`wait-time-badge ${getWaitTimeClass(
                          waitMmSs
                        )}`}
                      >
                        {waitMmSs}
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
