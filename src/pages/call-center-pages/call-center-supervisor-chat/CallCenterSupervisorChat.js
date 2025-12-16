import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import {
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  Card,
  CardContent,
  CardHeader,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { baseURL } from "../../../config";
import "./CallCenterSupervisorChat.css";

const socket = io("https://10.52.0.19");

const CallCenterSupervisorChat = () => {
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingAgent, setTypingAgent] = useState(null);
  const supervisorId = localStorage.getItem("userId");
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchAgents();
    if (supervisorId && selectedAgent) fetchMessages();

    socket.emit("register", supervisorId);

    socket.on("private_message", (data) => {
      if (data.receiverId === supervisorId || data.senderId === supervisorId) {
        setMessages((prev) => [...prev, data]);

        if (data.senderId !== supervisorId && data.senderId !== selectedAgent) {
          setUnreadCounts((prev) => ({
            ...prev,
            [data.senderId]: (prev[data.senderId] || 0) + 1,
          }));
        }
      }
    });

    socket.on("typing", (agentId) => {
      if (agentId !== supervisorId) {
        setTypingAgent(agentId);
        setTimeout(() => setTypingAgent(null), 2000);
      }
    });

    return () => {
      socket.off("private_message");
      socket.off("typing");
    };
  }, [supervisorId, selectedAgent]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `${baseURL}/users/messages/${supervisorId}/${selectedAgent}`,
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

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${baseURL}/users/agents`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch agents");
      const data = await response.json();
      setAgents(Array.isArray(data.agents) ? data.agents : []);
      fetchUnreadCounts(data.agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async (agents) => {
    // Fetch unread counts for each agent
    const counts = {};
    for (const agent of agents) {
      try {
        const response = await fetch(
          `${baseURL}/users/unread-messages-count/${supervisorId}/${agent.id}`
        );
        const data = await response.json();
        counts[agent.id] = data.receiverUnreadCount; // Unread count for supervisor's side
      } catch (error) {
        console.error(
          `Error fetching unread count for agent ${agent.id}:`,
          error
        );
      }
    }
    setUnreadCounts(counts);
  };

  const sendReply = () => {
    if (reply.trim() && selectedAgent) {
      const newMessage = {
        senderId: supervisorId,
        receiverId: selectedAgent,
        message: reply,
        timestamp: new Date().toISOString(),
      };

      socket.emit("private_message", newMessage);
      setMessages((prev) => [...prev, newMessage]);
      setReply("");
    }
  };

  const handleSelectAgent = (id) => {
    setSelectedAgent(id);
    setDrawerOpen(false);
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    // Mark all messages as read when supervisor opens the chat with the agent
    const unreadMessages = messages.filter(
      (msg) => msg.senderId === id && !msg.isRead
    );

    unreadMessages.forEach(async (message) => {
      await markMessageAsRead(message.senderId, message.receiverId); // Mark as read
    });
  };

  const markMessageAsRead = async (senderId, receiverId) => {
    try {
      const response = await fetch(
        `http://localhost:5070/api/users/update-read-message/${senderId}/${receiverId}`, // Ensure the full URL matches
        {
          method: "PUT", // Use PUT to update the status
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.ok) {
        console.log("Messages marked as read successfully");
      } else {
        console.error("Failed to mark messages as read", response.status);
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };
  

  const handleTyping = (e) => {
    setReply(e.target.value);
    socket.emit("typing", selectedAgent);
  };

  return (
    <Card className="supervisor-chat-card">
      <CardHeader
        title="Supervisor Chat"
        className="supervisor-chat-header"
        action={
          <IconButton
            className="mobile-only"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon style={{ color: "white" }} />
          </IconButton>
        }
      />
      <CardContent className="supervisor-chat-body">
        <div className="agent-list desktop-only">
          <h4 className="agent-title">Agents</h4>
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <div className="agent-scroll">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent.id)}
                  className={`agent-item ${
                    selectedAgent === agent.id ? "selected" : ""
                  }`}
                >
                  <div className="avatar">
                    {agent.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="agent-name-wrapper">
                    <div>
                      {agent.full_name}{" "}
                      {unreadCounts[agent.id] > 0 && (
                        <span className="unread-badge">
                          {unreadCounts[agent.id]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="supervisor-chat-pane">
          {selectedAgent && (
            <div className="chatting-with">
              Chatting with {agents.find((a) => a.id === selectedAgent)?.full_name}
              {typingAgent === selectedAgent && (
                <span className="typing-indicator"> is typing...</span>
              )}
            </div>
          )}
          <div className="chat-window">
            {messages
              .filter(
                (msg) =>
                  msg.senderId === selectedAgent ||
                  msg.receiverId === selectedAgent
              )
              .map((msg, index) => {
                const isSupervisor = msg.senderId === supervisorId;
                return (
                  <div
                    key={index}
                    className={`chat-bubble ${
                      isSupervisor ? "supervisor" : "agent"
                    }`}
                  >
                    {msg.message}
                    <div className="chat-timestamp">
                      {new Date(msg.timestamp || Date.now()).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                  </div>
                );
              })}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-wrapper">
            <input
              type="text"
              value={reply}
              onChange={handleTyping}
              placeholder="Type a reply..."
              className="chat-input"
              onKeyDown={(e) => e.key === "Enter" && sendReply()}
            />
            <Button
              variant="contained"
              onClick={sendReply}
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

export default CallCenterSupervisorChat;
