import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

// ✅ Explicitly define full WebSocket URL via Nginx proxy
const socket = io("https://10.52.0.19", {
  path: "/ami-socket/socket.io",     // ✅ must match nginx
  transports: ["websocket"],
  secure: true,
});


const QueueStatusTable = () => {
  const [queueStatus, setQueueStatus] = useState([]);

  useEffect(() => {
    // ✅ WebSocket connected
    socket.on("connect", () => {
      console.log("✅ Connected to WebSocket:", socket.id);
    });

    // ❌ WebSocket disconnected
    socket.on("disconnect", () => {
      console.warn("❌ Disconnected from WebSocket");
    });

    // 📥 Receive queue-status updates
    socket.on("queue-status", (data) => {
      console.log("📥 Received queue-status update:", data);
      setQueueStatus(data);
    });

    // 🧼 Clean up listeners on unmount
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("queue-status");
    };
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-xl font-semibold mb-4">📞 Queue Status</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Position</th>
              <th className="px-4 py-2 border">Caller ID</th>
              <th className="px-4 py-2 border">Queue</th>
              <th className="px-4 py-2 border">Wait Time (s)</th>
            </tr>
          </thead>
          <tbody>
            {queueStatus.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  No callers in queue.
                </td>
              </tr>
            ) : (
              queueStatus.map((entry, idx) => (
                <tr key={idx} className="text-center hover:bg-gray-50">
                  <td className="border px-4 py-2">{entry.position ?? "N/A"}</td>
                  <td className="border px-4 py-2">{entry.callerID ?? "Unknown"}</td>
                  <td className="border px-4 py-2">{entry.queue ?? "N/A"}</td>
                  <td className="border px-4 py-2">{entry.waitTime ?? "0"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QueueStatusTable;
