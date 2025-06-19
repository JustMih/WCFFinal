import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { MdOutlinePhoneInTalk } from "react-icons/md";
import "./QueueStatusTable.css";

// ✅ Explicitly define full WebSocket URL via Nginx proxy
const socket = io("https://10.52.0.19", {
  path: "/ami-socket/socket.io",     // ✅ must match nginx
  transports: ["websocket"],
  secure: true,
});

// Dummy data for fallback
const dummyQueues = [
  {
    queue: "Sales Queue",
    callers: 5,
    longestWait: 135, // 2:15 in seconds
    availableAgents: 3,
    busyAgents: 2
  },
  {
    queue: "Support Queue",
    callers: 3,
    longestWait: 105, // 1:45 in seconds
    availableAgents: 4,
    busyAgents: 1
  },
  {
    queue: "Technical Queue",
    callers: 2,
    longestWait: 90, // 1:30 in seconds
    availableAgents: 2,
    busyAgents: 3
  }
];

export default function QueueStatusTable() {
  const [queues, setQueues] = useState(dummyQueues);

  useEffect(() => {
    socket.on("queueStatusUpdate", (data) => {
      console.log("🎧 Received queue data:", data);
      if (data && data.length > 0) {
        setQueues(data);
      }
    });

    // ❌ WebSocket disconnected
    socket.on("disconnect", () => {
      console.warn("❌ Disconnected from WebSocket");
    });

    // 📥 Receive queue-status updates
    socket.on("queue-status", (data) => {
      console.log("📥 Received queue-status update:", data);
      setQueues(data);
    });

    // 🧼 Clean up listeners on unmount
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("queue-status");
    };
  }, []);

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
                  <span className={`status-${q.availableAgents > 0 ? 'active' : 'inactive'}`}>
                    {q.availableAgents > 0 ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
