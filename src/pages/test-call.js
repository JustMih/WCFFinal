import React, { useState } from "react";
import { baseURL } from "../config";

const CallComponent = () => {
  const [channel, setChannel] = useState("");
  const [number, setNumber] = useState("");

  const handleMakeCall = async () => {
    try {
      const response = await fetch(`${baseURL}/ami/makeCall`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel, number }),
      });

      if (!response.ok) {
        throw new Error("Error initiating call");
      }

      const data = await response.json();
      alert(data.message);
    } catch (error) {
      alert("Error initiating call");
    }
  };

  return (
    <div>
      <h1>Make Call</h1>
      <div>
        <label>Channel:</label>
        <input
          type="text"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        />
      </div>
      <div>
        <label>Number:</label>
        <input
          type="text"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />
      </div>
      <button onClick={handleMakeCall}>Call</button>
    </div>
  );
};

export default CallComponent;
