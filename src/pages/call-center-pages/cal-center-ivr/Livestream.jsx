 
import React, { useEffect, useState } from "react";
import { baseURL } from "../../../config";
import "./livestream.css";
import io from "socket.io-client";
const Livestream = () => {
  const [calls, setCalls] = useState([]);

  useEffect(() => {
    const socket = io("http://10.52.0.19:5070", {
      transports: ["websocket"],
    });
  
    socket.on("connect", () => {
      console.log("✅ Connected to socket:", socket.id);
    });
  
    socket.on("live_call_update", (call) => {
      console.log("📥 Received call update:", call);
      setCalls((prev) => [call, ...prev]);
    });
  
    // ⬅️ Fetch live calls initially
    fetchLiveCalls();
  
    return () => socket.disconnect();
  }, []);
  
  
  const fetchLiveCalls = async () => {
    try {
      const response = await fetch(`${baseURL}/livestream/live-calls`);
      if (!response.ok) throw new Error("Failed to fetch live calls");
      const data = await response.json();
      setCalls(data);
    } catch (err) {
      console.error("Error:", err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#28a745"; // Green
      case "calling":
        return "#ffc107"; // Yellow
      case "dropped":
        return "#dc3545"; // Red
      case "ended":
        return "#6c757d"; // Gray
      default:
        return "#ffffff";
    }
  };

  return (
    <div className="livestream">
      <h2>📞 Live Call Status Dashboard</h2>
      <table className="call-table">
        <thead>
          <tr>
            <th>Caller</th>
            <th>Callee</th>
            <th>Status</th>
            <th>Start</th>
            <th>Answered</th>
            <th>End</th>
            <th>Duration</th>
            <th>Queue Entry</th>
            <th>ETA</th>
            <th>Voicemail</th>

          </tr>
        </thead>
        <tbody>
          {calls.map((call) => (
            // <tr key={call.id} style={{ backgroundColor: getStatusColor(call.status) }}>
            //   <td>{call.caller || "-"}</td>
            //   <td>{call.cid_dnid|| "-"}</td>
            //   <td>{call.status}</td>
            //   <td>{call.call_start}</td>
            //   <td>{call.call_answered || "-"}</td>
            //   <td>{call.call_end || "-"}</td>
            //   <td>{call.duration_secs ? `${call.duration_secs} sec` : "-"}</td>
            //   <td>{call.queue_entry_time || "-"}</td>
            //   <td>{call.estimated_wait_time ? `${call.estimated_wait_time}s` : "-"}</td>
            //   <td>{call.voicemail_path ? "Saved" : "-"}</td>

            // </tr>
            <tr key={call.linkedid} style={{ backgroundColor: getStatusColor(call.status) }}>
            <td>{call.caller || "-"}</td>
            <td>{call.callee || "-"}</td>
            <td>{call.status}</td>
            <td>{call.call_start || "-"}</td>
            <td>{call.call_answered || "-"}</td>
            <td>{call.call_end || "-"}</td>
            <td>{call.duration_secs ? `${call.duration_secs}s` : "-"}</td>
            <td>{call.queue_entry_time || "-"}</td>
            <td>{call.estimated_wait_time ? `${call.estimated_wait_time}s` : "-"}</td>
            <td>{call.voicemail_path ? "Saved" : "-"}</td>
          </tr>

          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Livestream;
