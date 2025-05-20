import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://10.52.0.19/ami-socket", {
  path: "/ami-socket/socket.io",
  transports: ["websocket"],
  secure: true
});

export default function QueueStatusTable() {
  const [queues, setQueues] = useState([]);

  useEffect(() => {
    socket.on("queueStatusUpdate", (data) => {
      console.log("🎧 Received queue data:", data);
      setQueues(data);
    });

    return () => socket.off("queueStatusUpdate");
  }, []);

  return (
    <div className="queue-status-table">
      <h3>📞 Queue Monitoring</h3>
      <table>
        <thead>
          <tr>
            <th>Queue</th>
            <th>Callers</th>
            <th>Hold Time (sec)</th>
            <th>Longest Wait</th>
            <th>Available Agents</th>
            <th>Busy Agents</th>
          </tr>
        </thead>
        <tbody>
          {queues.map((q, index) => (
            <tr key={index}>
              <td>{q.queue}</td>
              <td>{q.callers}</td>
              <td>{q.holdTime}</td>
              <td>{q.longestWait}</td>
              <td>{q.availableAgents}</td>
              <td>{q.busyAgents}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
