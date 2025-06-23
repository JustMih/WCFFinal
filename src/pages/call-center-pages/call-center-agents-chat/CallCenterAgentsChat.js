import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { baseURL } from "../../../config";
import {
  CircularProgress,
  Button,
  Card,
  CardContent,
  CardHeader,
} from "@mui/material";
import "./CallCenterAgentsChat.css";

const socket = io("http://10.52.0.19:5070");

const CallCenterAgentChat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const agentId = localStorage.getItem("userId");
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchSupervisors();
    if (agentId && selectedSupervisor) {
      fetchMessages();
    }

    socket.emit("register", agentId);
    socket.on("private_message", (data) => {
      if (data.receiverId === agentId || data.senderId === agentId) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => socket.off("private_message");
  }, [agentId, selectedSupervisor]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `${baseURL}/users/messages/${agentId}/${selectedSupervisor}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch messages");

      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await fetch(`${baseURL}/users/supervisor`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch supervisors");

      const data = await response.json();
      setSupervisors(data.supervisors);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!selectedSupervisor) {
      alert("Please select a supervisor.");
      return;
    }
    if (message.trim()) {
      const msgData = {
        senderId: agentId,
        receiverId: selectedSupervisor,
        message,
        timestamp: new Date().toISOString(),
      };

      socket.emit("private_message", msgData);
      setMessages((prev) => [...prev, msgData]);
      setMessage("");
    }
  };

  return (
    <Card className="chat-card">
      <CardHeader
        title="Chat with Supervisor"
        className="chat-header"
      />
      <CardContent className="chat-body">
        {/* Left: Supervisor List */}
        <div className="supervisor-pane">
          <h4 className="supervisor-title">Supervisors</h4>
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <div className="supervisor-scroll">
              {supervisors.map((supervisor) => (
                <div
                  key={supervisor.id}
                  onClick={() => setSelectedSupervisor(supervisor.id)}
                  className={`supervisor-item ${selectedSupervisor === supervisor.id ? "selected" : ""
                    }`}
                >
                  <div className="avatar">
                    {supervisor.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="supervisor-name">{supervisor.name}</div>
                </div>
              ))}
              {!supervisors.length && (
                <div className="no-supervisors">No supervisors found.</div>
              )}
            </div>
          )}
        </div>

        {/* Right: Chat Area */}
        <div className="chat-pane">
          {/* Chat Header */}
          {selectedSupervisor && (
            <div className="chatting-with">
              Chatting with {supervisors.find(s => s.id === selectedSupervisor)?.name}
            </div>
          )}

          {/* Chat Messages */}
          <div className="chat-window">
            {messages.map((msg, index) => {
              const isAgent = msg.senderId === agentId;
              return (
                <div
                  key={index}
                  className={`chat-message ${isAgent ? "agent" : "supervisor"}`}
                >
                  {msg.message}
                  <div className="chat-timestamp">
                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input Field */}
          <div className="chat-input-wrapper">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="chat-input"
            />
            <Button
              variant="contained"
              onClick={sendMessage}
              className="send-button"
            >
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

  );
};

export default CallCenterAgentChat;
