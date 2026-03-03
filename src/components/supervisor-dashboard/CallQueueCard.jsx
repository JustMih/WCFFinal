import React, { useEffect, useState } from "react";
import { FaUsers, FaClock, FaExclamationTriangle } from "react-icons/fa";
import "./CallQueueCard.css";
import { amiURL, baseURL } from "../../config";

// Helper function for wait time color coding
const getWaitTimeClass = (waitTime) => {
  const [minutes, seconds] = waitTime.split(":").map(Number);
  const totalMinutes = minutes + seconds / 60;
  if (totalMinutes < 2) return "wait-time-normal";
  if (totalMinutes < 4) return "wait-time-warning";
  return "wait-time-critical";
};

// Helper function for queue call status
const getQueueCallStatus = (call) => {
  const [min, sec] = call.waitTime.split(":").map(Number);
  const totalSeconds = min * 60 + sec;
  if (totalSeconds < 60) return "Active";
  if (totalSeconds < 120) return "Dropped";
  return "Lost";
};

const CallQueueCard = () => {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calling, setCalling] = useState([]); // State for "calling" status calls

  const fetchQueueData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseURL}/livestream/live-calls`);
      if (!response.ok) throw new Error("Failed to fetch queue data");
      const data = await response.json();
      setQueueData(data);

      const callingCalls = data.filter((call) => call.status === "calling");
      console.log("Calling Calls:", callingCalls);
      setCalling(callingCalls);

    } catch (err) {
      setError("Failed to load queue data");
      setQueueData(null);
    } finally {
      setLoading(false);
    }
  };

  const getCallType = (caller) => {
    if (caller.startsWith("1")) {
      return "outbound";
    } else if (caller.startsWith("+") || caller.startsWith("0")) {
      return "inbound";
    }
    return "unknown";
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 5000);
    return () => clearInterval(interval);
  }, []);

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
        <div style={{ color: 'red' }}>{error}</div>
      </div>
    );
  }

  const waitingCalls = Array.isArray(queueData?.waitingCalls) ? queueData.waitingCalls : [];

  return (
    <div className="queue-monitoring-section">
      <h4>Call Queue Monitoring</h4>
      {/* <div className="queue-stats">
        <div className="queue-stat-card">
          <div className="queue-stat-icon">
            <FaUsers />
          </div>
          <div className="queue-stat-info">
            <span className="queue-stat-value">{queueData.totalInQueue}</span>
            <span className="queue-stat-label">Calls in Queue</span>
          </div>
        </div>
        <div className="queue-stat-card">
          <div className="queue-stat-icon">
            <FaClock />
          </div>
          <div className="queue-stat-info">
            <span className="queue-stat-value">
              {queueData.averageWaitTime}
            </span>
            <span className="queue-stat-label">Avg Wait Time</span>
          </div>
        </div>
        <div className="queue-stat-card">
          <div className="queue-stat-icon">
            <FaExclamationTriangle />
          </div>
          <div className="queue-stat-info">
            <span className="queue-stat-value">1</span>
            <span className="queue-stat-label">Priority Calls</span>
          </div>
        </div>
      </div> */}
      <div className="table-responsive">
        <table className="waiting-calls-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Call Type</th>
              {/* <th>Action</th> */}
            </tr>
          </thead>
          <tbody>
            {calling.length > 0 ? (
              calling.map((call) => (
                <tr
                  key={call.id}
                  className={
                    call.priority === "High" ? "priority-row-high" : ""
                  }
                >
                  <td className="queue-id">{call.caller}</td>
                  <td className="customer-number">{call.callee}</td>
                  <td>
                    <span
                      className={`wait-time-badge ${getWaitTimeClass(
                        call.status
                      )}`}
                    >
                      {call.status}
                    </span>
                  </td>
                  <td>
                    <span
                      // className={`priority-badge ${call.priority.toLowerCase()}`}
                    >
                      {call.estimated_wait_time}
                    </span>
                  </td>
                  <td className="call-type">{getCallType(call.caller)}</td>
                  {/* <td>
                    <span
                      className={`status-badge ${getQueueCallStatus(
                        call
                      ).toLowerCase()}`}
                    >
                      {getQueueCallStatus(call)}
                    </span>
                  </td> */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
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