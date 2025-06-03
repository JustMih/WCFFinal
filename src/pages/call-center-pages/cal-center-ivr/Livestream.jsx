import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const Livestream = () => {
  const [rtpData, setRtpData] = useState([]);
  
  useEffect(() => {
    // Connect to the WebSocket server
    const socket = io("http://10.52.0.19:5070");

    // Listen for RTP packet updates
    socket.on("rtp_update", (data) => {
      console.log("Received RTP Data:", data);
      setRtpData((prevData) => [...prevData, data]); // Update state with new RTP packet
    });

    return () => {
      socket.disconnect(); // Clean up on unmount
    };
  }, []);

  return (
    <div className="livestream">
      <h2>Live RTP Streaming</h2>
      <div className="rtp-data">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Sequence Number</th>
              <th>Packet Length</th>
              <th>Source IP</th>
              <th>Source Port</th>
            </tr>
          </thead>
          <tbody>
            {rtpData.map((packet, index) => (
              <tr key={index}>
                <td>{packet.timestamp}</td>
                <td>{packet.seq}</td>
                <td>{packet.len}</td>
                <td>{packet.source_ip}</td>
                <td>{packet.source_port}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Livestream;
