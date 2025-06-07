// import React, { useEffect, useState } from "react";
// import io from "socket.io-client";

// const Livestream = () => {
//   const [rtpData, setRtpData] = useState([]);
  
//   useEffect(() => {
//     // Connect to the WebSocket server
//     const socket = io("http://10.52.0.19:5070");

//     // Listen for RTP packet updates
//     socket.on("rtp_update", (data) => {
//       console.log("Received RTP Data:", data);
//       setRtpData((prevData) => [...prevData, data]); // Update state with new RTP packet
//     });

//     return () => {
//       socket.disconnect(); // Clean up on unmount
//     };
//   }, []);

//   return (
//     <div className="livestream">
//       <h2>Live RTP Streaming</h2>
//       <div className="rtp-data">
//         <table>
//           <thead>
//             <tr>
//               <th>Timestamp</th>
//               <th>Sequence Number</th>
//               <th>Packet Length</th>
//               <th>Source IP</th>
//               <th>Source Port</th>
//             </tr>
//           </thead>
//           <tbody>
//             {rtpData.map((packet, index) => (
//               <tr key={index}>
//                 <td>{packet.timestamp}</td>
//                 <td>{packet.seq}</td>
//                 <td>{packet.len}</td>
//                 <td>{packet.source_ip}</td>
//                 <td>{packet.source_port}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default Livestream;
import React, { useEffect, useState } from "react";
import { baseURL } from "../../../config";
import "./livestream.css";
import io from "socket.io-client";
const Livestream = () => {
  const [calls, setCalls] = useState([]);

  useEffect(() => {
    fetchLiveCalls();
  
    // const socket = io(`${baseURL.replace("http", "ws")}`); // WebSocket URL
    const socket = io("https://10.52.0.19", {
  transports: ["websocket"],
  secure: true,
});

    socket.on("live_call_update", (call) => {
      setCalls((prev) => [call, ...prev]); // New call on top
    });
  
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
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => (
            <tr key={call.id} style={{ backgroundColor: getStatusColor(call.status) }}>
              <td>{call.caller || "-"}</td>
              <td>{call.callee || "-"}</td>
              <td>{call.status}</td>
              <td>{call.call_start}</td>
              <td>{call.call_answered || "-"}</td>
              <td>{call.call_end || "-"}</td>
              <td>{call.duration_secs ? `${call.duration_secs} sec` : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Livestream;
