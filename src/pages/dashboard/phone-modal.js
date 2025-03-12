import React, { useState } from "react";
import { baseURL } from "../../config";

const Modal = ({ closeModal, position }) => {
  const [channel, setChannel] = useState(""); // State for originating extension
  const [number, setNumber] = useState(""); // State for destination number

  // Handle the call initiation
  const handleMakeCall = async () => {
    try {
      if (!channel || !number) {
        alert("Please provide both channel and number.");
        return;
      }

      // Send a POST request to initiate the call using fetch
      const response = await fetch(`${baseURL}/ami/call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ channel, number }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message); // Show success message
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`); // Show error message
      }
    } catch (error) {
      alert(`Error: ${error.message}`); // Handle any unexpected errors
    }
  };

  return (
    <div className="phone-modal-overlay" onClick={closeModal}>
      <div
        className="phone-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ top: `${position.top}px`, left: `${position.left}px` }} // Apply position dynamically
      >
        <h2>Best Virtual Dialer & Phone System</h2>
        <p>Here you can make calls, transfer calls, and perform other tasks.</p>

        <div className="phone-phone-actions">
          <button onClick={closeModal}>Mute</button>
          <button onClick={closeModal}>Hold</button>
          <button onClick={closeModal}>Start Recording</button>
        </div>

        {/* Input fields for channel and number */}
        <div className="phone-call-inputs">
          <label>Channel (Extension):</label>
          <input
            type="text"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="Enter channel (e.g., 1001)"
          />

          <label>Number:</label>
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Enter number to call"
          />
        </div>

        {/* Call and Close buttons */}
        <div className="phone-call-buttons">
          <button onClick={handleMakeCall}>Make Call</button>
          <button onClick={closeModal}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
