import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { MdOutlinePhoneInTalk } from "react-icons/md";
import "./QueueStatusTable.css";

// Connect to Socket.IO backend
const socket = io("https://10.52.0.19", {
  path: "/ami-socket/socket.io",
  transports: ["websocket"],
  secure: true
});

// Dummy data for fallback display before real-time kicks in
const dummyQueues = [
  {
    queue: "Sales Queue",
    callers: 0,
    longestWait: 0,
    availableAgents: 0,
    busyAgents: 0
  },
  {
    queue: "Support Queue",
    callers: 0,
    longestWait: 0,
    availableAgents: 0,
    busyAgents: 0
  },
  {
    queue: "Technical Queue",
    callers: 0,
    longestWait: 0,
    availableAgents: 0,
    busyAgents: 0
  }
];

export default function QueueStatusTable() {
  const [queues, setQueues] = useState(dummyQueues);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("🔌 Connected to AMI Socket");
    });

    socket.on("queueStatusUpdate", (data) => {
      console.log("🎧 Received queue data:", data);
      if (data && Array.isArray(data)) {
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
                  <span className={`status-${q.availableAgents > 0 ? "active" : "inactive"}`}>
                    {q.availableAgents > 0 ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
