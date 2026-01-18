 // export default Livestream;
import React, { useEffect, useState } from "react";
import { baseURL } from "../../../config";
import "./livestream.css";
import io from "socket.io-client";
 

const Livestream = () => {
  const [calls, setCalls] = useState([]);

  useEffect(() => {
    const socket = io(baseURL, { transports: ["websocket"] });
  
    socket.on("connect", () => {
      console.log("✅ Connected to socket:", socket.id);
    });
  
    socket.on("live_call_update", (call) => {
      console.log("📥 Incoming live_call_update:", call);
  
      if (!call.call_answered && call.call_end) {
        call.status = "lost";
      }
  
      setCalls((prevCalls) => {
        const exists = prevCalls.find(c => c.linkedid === call.linkedid);
        if (exists) {
          return prevCalls.map(c => c.linkedid === call.linkedid ? call : c);
        }
        return [call, ...prevCalls];
      });
    });
  
    fetchLiveCalls();
  
    const interval = setInterval(() => {
      fetchLiveCalls(); // Fallback fetch
    }, 5000);
  
    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);
  

  const fetchLiveCalls = async () => {
    try {
      const response = await fetch(`${baseURL}/livestream/live-calls`);
      if (!response.ok) throw new Error("Failed to fetch live calls");
      const data = await response.json();

      // Normalize 'lost' status
      const updated = data.map(call => {
        if (!call.call_answered && call.call_end) {
          return { ...call, status: "lost" };
        }
        return call;
      });

      setCalls(updated);
    } catch (err) {
      console.error("Error:", err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#ffc107"; // Yellow
      case "calling":
        return "#28a745"; // Green
      case "ended":
        return "#6c757d"; // Gray
      case "dropped":
        return "#dc3545"; // Red
      case "lost":
        return "#ff6f61"; // Coral
      default:
        return "#ffffff"; // Default white
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
            <tr
              key={call.linkedid}
              style={{ backgroundColor: getStatusColor(call.status) }}
            >
              <td>{call.caller || "-"}</td>
              <td>{call.callee || "-"}</td>
              <td>{call.status}</td>
              <td>{call.call_start || "-"}</td>
              <td>{call.call_answered || "-"}</td>
              <td>{call.call_end || "-"}</td>
              <td>{call.duration_secs ? `${call.duration_secs}s` : "-"}</td>
              <td>{call.queue_entry_time || "-"}</td>
              <td>{call.estimated_wait_time ? `${call.estimated_wait_time}s` : "-"}</td>
              <td>
              {call.voicemail_path ? (
                <audio controls preload="none" style={{ width: "100px" }}>
                  <source src={`${baseURL}${call.voicemail_path}`} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
              ) : (
                "-"
              )}
            </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Livestream;
