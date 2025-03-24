import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { baseURL } from "../../../config";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Button,
} from "@mui/material";

// live
// const socket = io("http://10.57.0.16:5070"); // Connect to backend

// test
const socket = io("http://127.0.0.1:5070"); // Connect to backend

const CallCenterAgentChat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const agentId = localStorage.getItem("userId");

  useEffect(() => {
    fetchSupervisors();
    if (agentId && selectedSupervisor) {
      fetchMessages();
    }

    socket.emit("register", agentId);

    socket.on("private_message", (data) => {
      if (data.receiverId === agentId || data.senderId === agentId) {
        setMessages((prev) => [...prev, data]); // Update messages in real-time
      }
    });

    return () => socket.off("private_message");
  }, [agentId, selectedSupervisor]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `${baseURL}/messages/${agentId}/${selectedSupervisor}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      setMessages(data); // Load previous messages
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await fetch(`${baseURL}/users/supervisor`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch supervisors");
      }

      const data = await response.json();
      console.log("Supervisors fetched:", data);
      setSupervisors(data.supervisors);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!selectedSupervisor) {
      alert("Please select a supervisor before sending a message.");
      return;
    }

    if (message.trim()) {
      socket.emit("private_message", {
        senderId: agentId,
        receiverId: selectedSupervisor,
        message,
      });

      setMessages((prev) => [...prev, { senderId: agentId, message }]);
      setMessage("");
    }
  };

  return (
    <div style={styles.chatContainer}>
      <h2>Chat with Supervisor</h2>

      {/* Supervisor Selection Dropdown */}
      <FormControl style={{ width: "100%", marginBottom: "10px" }}>
        <InputLabel>Select Supervisor</InputLabel>
        {loading ? (
          <CircularProgress size={24} />
        ) : (
          <Select
            value={selectedSupervisor}
            onChange={(e) => setSelectedSupervisor(e.target.value)}
            displayEmpty
          >
            <MenuItem value="" disabled>
              Select a Supervisor
            </MenuItem>
            {supervisors.map((supervisor) => (
              <MenuItem key={supervisor.id} value={supervisor.id}>
                {supervisor.name}
              </MenuItem>
            ))}
          </Select>
        )}
      </FormControl>

      {/* Chat Messages Box */}
      <div style={styles.chatBox}>
        {messages.map((msg, index) => (
          <p
            key={index}
            style={
              msg.senderId === agentId
                ? styles.agentMessage
                : styles.supervisorMessage
            }
          >
            <strong>{msg.senderId === agentId ? "You" : "Supervisor"}:</strong>{" "}
            {msg.message}
          </p>
        ))}
      </div>

      {/* Message Input */}
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        style={styles.input}
      />

      {/* Send Button */}
      <Button
        onClick={sendMessage}
        variant="contained"
        color="primary"
        style={styles.sendButton}
      >
        Send
      </Button>
    </div>
  );
};

const styles = {
  chatContainer: {
    width: "100%",
    padding: "15px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    textAlign: "center",
    backgroundColor: "#f9f9f9",
  },
  chatBox: {
    height: "250px",
    overflowY: "scroll",
    border: "1px solid #ddd",
    borderRadius: "5px",
    padding: "10px",
    backgroundColor: "#fff",
    textAlign: "left",
  },
  agentMessage: {
    textAlign: "right",
    background: "#d1e7fd",
    padding: "8px",
    borderRadius: "5px",
    margin: "5px 0",
  },
  supervisorMessage: {
    textAlign: "left",
    background: "#fdd1d1",
    padding: "8px",
    borderRadius: "5px",
    margin: "5px 0",
  },
  input: {
    width: "80%",
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    margin: "10px 0",
  },
  sendButton: {
    padding: "8px 15px",
    background: "#007bff",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default CallCenterAgentChat;
