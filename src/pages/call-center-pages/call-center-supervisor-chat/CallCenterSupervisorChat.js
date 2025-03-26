import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from "@mui/material";
import { baseURL } from "../../../config";

// live
const socket = io("http://10.52.0.19:5070");

// test
// const socket = io("http://127.0.0.1:5070"); // Connect to backend

const CallCenterSupervisorChat = () => {
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [agents, setAgents] = useState([]); // Store list of agents
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supervisorId = localStorage.getItem("userId");

  useEffect(() => {
    fetchAgents();
    if (supervisorId && selectedAgent) {
      fetchMessages();
    }

    socket.emit("register", supervisorId);

    socket.on("private_message", (data) => {
      if (data.receiverId === supervisorId || data.senderId === supervisorId) {
        setMessages((prev) => [...prev, data]); // Update messages in real-time
      }
    });

    return () => socket.off("private_message");
  }, [supervisorId, selectedAgent]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `${baseURL}/users/messages/${supervisorId}/${selectedAgent}`,
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

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${baseURL}/users/agents`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch agents");
      }

      const data = await response.json();
      console.log("Agents fetched:", data);

      if (Array.isArray(data.agents)) {
        setAgents(data.agents); // Ensure state is updated correctly
      } else {
        console.error("Expected an array but got:", data);
        setAgents([]); // Default to empty array
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      setAgents([]); // Prevents map() errors
    } finally {
      setLoading(false);
    }
  };

  const sendReply = () => {
    if (reply.trim() && selectedAgent) {
      socket.emit("private_message", {
        senderId: supervisorId,
        receiverId: selectedAgent,
        message: reply,
      });

      setMessages((prev) => [
        ...prev,
        { senderId: supervisorId, receiverId: selectedAgent, message: reply },
      ]);
      setReply("");
    }
  };

  return (
    <div style={styles.chatContainer}>
      <h2>Supervisor Chat</h2>
      {/* Dropdown to Select Agent */}
      <FormControl style={{ width: "100%", marginBottom: "10px" }}>
        <InputLabel>Select Agent</InputLabel>
        <Select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          displayEmpty
        >
          <MenuItem value="" disabled>
            Select an Agent
          </MenuItem>
          {Array.isArray(agents) && agents.length > 0 ? (
            agents.map((agent) => (
              <MenuItem key={agent.id} value={agent.id}>
                {agent.name || `Agent ${agent.id}`}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>No agents available</MenuItem>
          )}
        </Select>
      </FormControl>
      <div style={styles.chatMinContainer}>
        <div style={styles.chatBox}>
          {messages
            .filter(
              (msg) =>
                msg.senderId === selectedAgent ||
                msg.receiverId === selectedAgent
            )
            .map((msg, index) => (
              <p
                key={index}
                style={
                  msg.senderId === supervisorId
                    ? styles.supervisorMessage
                    : styles.agentMessage
                }
              >
                <strong>
                  {msg.senderId === supervisorId
                    ? "You"
                    : `Agent ${msg.senderId}`}
                  :
                </strong>{" "}
                {msg.message}
              </p>
            ))}
        </div>
        <div style={styles.inputBox}>
          <input
            type="text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type a reply..."
            style={styles.input}
          />

          {/* Send Button */}
          <Button
            onClick={sendReply}
            variant="contained"
            color="primary"
            style={styles.sendButton}
          >
            Send
          </Button>
        </div>
      </div>
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
    height: "500px",
    overflowY: "scroll",
    border: "1px solid #ddd",
    borderRadius: "5px",
    padding: "10px",
    backgroundColor: "#fff",
    textAlign: "left",
    width: "60%"
  },
  agentMessage: {
    textAlign: "right",
    background: "#d1e7fd",
    padding: "8px",
    borderRadius: "5px",
    margin: "5px 0",
    width: "auto"
  },
  supervisorMessage: {
    textAlign: "left",
    background: "#fdd1d1",
    padding: "8px",
    borderRadius: "5px",
    margin: "5px 0",
  },
  chatMinContainer:{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputBox: {
    width: "40%",
    display: "flex",
    flexDirection: "column",
    alignItems: "start",
    padding: "20px"
  },
  input: {
    width: "80%",
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    margin: "10px 0",
  },
  sendButton: {
    padding: "5px 10px",
    background: "#007bff",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default CallCenterSupervisorChat;
