import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { MdOutlinePhoneInTalk } from "react-icons/md";
import "./QueueStatusTable.css";
import { baseURL } from "../../config";

// Connect to Socket.IO backend
const socket = io("https://10.52.0.19", {
  path: "/ami-socket/socket.io",
  transports: ["websocket"],
  secure: true
});

export default function QueueStatusTable() {
  const [queues, setQueues] = useState([]);

  useEffect(() => {
    // ✅ GET initial saved queue status on page load
    fetch(`${baseURL}/queue-status`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          console.log("📥 Loaded saved queue data:", data);
          setQueues(data);
        }
      })
      .catch((err) => {
        console.error("❌ Failed to load saved queue data:", err);
      });

    // ✅ Listen for real-time updates
    socket.on("connect", () => {
      console.log("🔌 Connected to AMI Socket");
    });

    socket.on("queueStatusUpdate", (data) => {
      console.log("🎧 Received queue data:", data);
      if (Array.isArray(data)) {
        setQueues(data);
      }
    });

    socket.on("disconnect", () => {
      console.warn("❌ Disconnected from AMI Socket");
    });

    return () => {
      socket.off("queueStatusUpdate");
      socket.disconnect();
    };
  }, []);

  // ✅ Emit and post data to backend
  const emitAndPostQueueStatus = (queueData) => {
    socket.emit("queueStatusUpdate", queueData);

    fetch(`${baseURL}/queue-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queueData)
    })
      .then((res) => res.json())
      .then((result) => {
        console.log("✅ Queue status posted:", result);
      })
      .catch((err) => {
        console.error("❌ Failed to POST queue status:", err);
      });
  };

  // 🧪 Trigger test data
  const handleTestUpdate = () => {
    const testData = [
      {
        queue: "Support Queue",
        callers: Math.floor(Math.random() * 10),
        longestWait: Math.floor(Math.random() * 300),
        availableAgents: Math.floor(Math.random() * 5),
        busyAgents: Math.floor(Math.random() * 5)
      }
    ];
    emitAndPostQueueStatus(testData);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    const pad = (n) => String(n).padStart(2, "0");
    return hrs > 0
      ? `${pad(hrs)}:${pad(mins % 60)}:${pad(secs)}`
      : `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div className="queue-monitoring">
      <div className="queue-monitoring-title">
        <MdOutlinePhoneInTalk />
        <h4>Queue Monitoring</h4>
      </div>

      <div className="queue-monitoring-table">
        {queues.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Queue Name</th>
                <th>Waiting Calls</th>
                <th>Longest Wait</th>
                <th>Agents Available</th>
                <th>Agents Busy</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {queues.map((q, index) => (
                <tr key={index}>
                  <td>{q.queue}</td>
                  <td>{q.callers}</td>
                  <td>{formatTime(q.longestWait)}</td>
                  <td>{q.availableAgents}</td>
                  <td>{q.busyAgents}</td>
                  <td>
                    <span
                      className={`status-${q.availableAgents > 0 ? "active" : "inactive"}`}
                    >
                      {q.availableAgents > 0 ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No queue data available.</p>
        )}
      </div>

      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        <button onClick={handleTestUpdate} className="test-button">
          Send Test Queue Status
        </button>
      </div>
    </div>
  );
}
