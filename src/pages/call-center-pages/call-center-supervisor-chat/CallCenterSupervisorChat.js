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

// Get socket URL from baseURL
const getSocketUrl = () => {
  try {
    // baseURL is like "http://127.0.0.1:5070/api" or "http://192.168.21.70/api"
    const url = new URL(baseURL);
    return `${url.protocol}//${url.host}`;
  } catch (e) {
    // Fallback if URL parsing fails
    const cleanUrl = baseURL.replace(/\/api$/, "").replace(/^https?:\/\//, "");
    return `http://${cleanUrl}`;
  }
};
const socket = io(getSocketUrl(), {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

// Add connection logging
socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ Socket disconnected");
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket connection error:", error);
});

const CallCenterSupervisorChat = () => {
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingAgent, setTypingAgent] = useState(null);
  const [onlineAgents, setOnlineAgents] = useState(new Set());
  const supervisorId = localStorage.getItem("userId");
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchAgents();
    socket.emit("register", supervisorId);

    // Listen for user online/offline status
    socket.on("user_online", (userId) => {
      console.log("User came online:", userId);
      setOnlineAgents((prev) => new Set([...prev, userId]));
    });

    socket.on("user_offline", (userId) => {
      console.log("User went offline:", userId);
      setOnlineAgents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // Receive list of online users when connecting
    socket.on("online_users_list", (userIds) => {
      console.log("Online users list:", userIds);
      setOnlineAgents(new Set(userIds));
    });

    socket.on("private_message", (data) => {
      console.log("📨 Supervisor received private_message:", data);
      console.log(
        "Supervisor ID:",
        supervisorId,
        "Selected Agent:",
        selectedAgent
      );
      console.log(
        "Message senderId:",
        data.senderId,
        "receiverId:",
        data.receiverId
      );

      if (data.receiverId === supervisorId || data.senderId === supervisorId) {
        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(
            (msg) =>
              msg.id === data.id ||
              (msg.id && msg.id.toString() === data.id?.toString()) ||
              (msg.senderId === data.senderId &&
                msg.receiverId === data.receiverId &&
                msg.message === data.message &&
                Math.abs(
                  new Date(msg.timestamp || msg.createdAt) -
                    new Date(data.timestamp || data.createdAt)
                ) < 1000)
          );
          if (exists) {
            console.log("Message already exists, skipping");
            return prev;
          }

          // Replace temporary message if exists
          const hasTemp = prev.some((msg) =>
            msg.id?.toString().startsWith("temp-")
          );
          if (hasTemp && data.senderId === supervisorId) {
            // Remove temp message and add real one
            return prev
              .filter((msg) => !msg.id?.toString().startsWith("temp-"))
              .concat([data]);
          }

          console.log("Adding new message to supervisor chat");
          return [...prev, data];
        });

        // Update unread counts for messages from other agents
        if (data.senderId !== supervisorId) {
          if (data.senderId === selectedAgent) {
            // If message is from currently selected agent, mark as read immediately
            socket.emit("messagesRead", {
              senderId: data.senderId,
              receiverId: supervisorId,
            });
            // Don't increment unread count for selected agent
          } else {
            // If message is from another agent, increment unread count
            setUnreadCounts((prev) => ({
              ...prev,
              [data.senderId]: (prev[data.senderId] || 0) + 1,
            }));
          }
        }
      } else {
        console.log("Message not for this supervisor, ignoring");
      }
    });

    // Listen for message status updates (delivered, read)
    socket.on("message_status_update", (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? {
                ...msg,
                status: data.status,
                readAt: data.status === "read" ? new Date() : msg.readAt,
              }
            : msg
        )
      );
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
      socket.off("message_status_update");
      socket.off("user_online");
      socket.off("user_offline");
      socket.off("online_users_list");
    };
  }, [supervisorId]);

  useEffect(() => {
    if (supervisorId && selectedAgent) {
      fetchMessages();
    }
  }, [supervisorId, selectedAgent]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Periodically refresh online status from database
  useEffect(() => {
    const interval = setInterval(() => {
      if (agents.length > 0) {
        agents.forEach((agent) => {
          if (agent.status === "online") {
            setOnlineAgents((prev) => new Set([...prev, agent.id]));
          } else {
            setOnlineAgents((prev) => {
              const newSet = new Set(prev);
              newSet.delete(agent.id);
              return newSet;
            });
          }
        });
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [agents]);

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

      // Mark messages as delivered if not already
      data.forEach((msg) => {
        if (msg.receiverId === supervisorId && msg.status === "sent") {
          socket.emit("message_delivered", msg.id);
        }
      });

      // Mark all unread messages as read
      const unreadMessages = data.filter(
        (msg) =>
          msg.senderId === selectedAgent &&
          msg.receiverId === supervisorId &&
          !msg.isRead
      );
      if (unreadMessages.length > 0) {
        // Mark via socket
        socket.emit("messagesRead", {
          senderId: selectedAgent,
          receiverId: supervisorId,
        });

        // Also update via API
        try {
          await fetch(
            `${baseURL}/users/update-read-message/${selectedAgent}/${supervisorId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
            }
          );

          // Update messages in state to show read status
          setMessages((prev) =>
            prev.map((msg) =>
              unreadMessages.some((um) => um.id === msg.id)
                ? { ...msg, isRead: true, status: "read", readAt: new Date() }
                : msg
            )
          );

          // Clear unread count
          setUnreadCounts((prev) => {
            const updated = { ...prev };
            delete updated[selectedAgent];
            return updated;
          });
        } catch (error) {
          console.error("Error marking messages as read:", error);
        }
      }
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
      const agentsList = Array.isArray(data.agents) ? data.agents : [];
      setAgents(agentsList);

      // Update online status from database (status field from User table)
      agentsList.forEach((agent) => {
        if (agent.status === "online") {
          setOnlineAgents((prev) => new Set([...prev, agent.id]));
        }
      });

      fetchUnreadCounts(agentsList);
    } catch (error) {
      console.error("Error fetching agents:", error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async (agents) => {
    // Fetch unread counts for each agent
    // Unread count = messages from agent (senderId) to supervisor (receiverId) that are unread
    const counts = {};
    for (const agent of agents) {
      try {
        const response = await fetch(
          `${baseURL}/users/unread-messages-count/${agent.id}/${supervisorId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          // receiverUnreadCount = messages from agent (senderId) to supervisor (receiverId) that are unread
          counts[agent.id] = data.receiverUnreadCount || 0;
        } else {
          counts[agent.id] = 0;
        }
      } catch (error) {
        console.error(
          `Error fetching unread count for agent ${agent.id}:`,
          error
        );
        counts[agent.id] = 0;
      }
    }
    setUnreadCounts(counts);
  };

  const sendReply = () => {
    if (reply.trim() && selectedAgent) {
      console.log(
        "Sending message from supervisor:",
        supervisorId,
        "to agent:",
        selectedAgent
      );
      const messageToSend = {
        senderId: supervisorId,
        receiverId: selectedAgent,
        message: reply.trim(),
      };

      console.log("Emitting private_message:", messageToSend);
      socket.emit("private_message", messageToSend);

      // Optimistic update - message will be replaced when server confirms
      const tempMessage = {
        id: `temp-${Date.now()}`,
        senderId: supervisorId,
        receiverId: selectedAgent,
        message: reply.trim(),
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: "sent",
        isRead: false,
      };

      setMessages((prev) => [...prev, tempMessage]);
      setReply("");
    }
  };

  const handleSelectAgent = async (id) => {
    setSelectedAgent(id);
    setDrawerOpen(false);

    // Clear unread count for this agent
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    // Fetch messages for this agent
    try {
      const response = await fetch(
        `${baseURL}/users/messages/${supervisorId}/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data);

        // Mark all unread messages as read
        const unreadMessages = data.filter(
          (msg) =>
            msg.senderId === id &&
            msg.receiverId === supervisorId &&
            !msg.isRead
        );

        if (unreadMessages.length > 0) {
          // Mark messages as read via socket
          socket.emit("messagesRead", {
            senderId: id,
            receiverId: supervisorId,
          });

          // Also update via API
          try {
            await fetch(
              `${baseURL}/users/update-read-message/${id}/${supervisorId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
              }
            );
          } catch (error) {
            console.error("Error marking messages as read:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
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

  // Helper function to format date for separators
  const formatDateSeparator = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDate = new Date(date);
    const isToday = messageDate.toDateString() === today.toDateString();
    const isYesterday = messageDate.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return messageDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year:
        messageDate.getFullYear() !== today.getFullYear()
          ? "numeric"
          : undefined,
    });
  };

  // Helper function to check if we need a date separator
  const shouldShowDateSeparator = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    const currentDate = new Date(
      currentMsg.timestamp || currentMsg.createdAt
    ).toDateString();
    const previousDate = new Date(
      previousMsg.timestamp || previousMsg.createdAt
    ).toDateString();
    return currentDate !== previousDate;
  };

  // Helper function to get message status icon
  const getStatusIcon = (status, isRead) => {
    if (status === "read" || isRead) {
      return "✓✓"; // Blue double check (read)
    } else if (status === "delivered") {
      return "✓✓"; // Gray double check (delivered)
    } else {
      return "✓"; // Single check (sent)
    }
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
                  <div
                    className={`avatar ${
                      onlineAgents.has(agent.id) || agent.status === "online"
                        ? "online"
                        : "offline"
                    }`}
                  >
                    {agent.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="agent-name-wrapper">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>{agent.full_name}</span>
                      {(onlineAgents.has(agent.id) ||
                        agent.status === "online") && (
                        <span className="online-indicator" title="Online">
                          ●
                        </span>
                      )}
                      {unreadCounts[agent.id] > 0 && (
                        <span
                          className="unread-badge"
                          title={`${unreadCounts[agent.id]} unread message${
                            unreadCounts[agent.id] > 1 ? "s" : ""
                          }`}
                        >
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  className={`avatar-small ${
                    onlineAgents.has(selectedAgent) ||
                    agents.find((a) => a.id === selectedAgent)?.status ===
                      "online"
                      ? "online"
                      : "offline"
                  }`}
                >
                  {agents
                    .find((a) => a.id === selectedAgent)
                    ?.full_name?.charAt(0)
                    .toUpperCase()}
                </div>
                <span>
                  Chatting with{" "}
                  {agents.find((a) => a.id === selectedAgent)?.full_name}
                </span>
                {(onlineAgents.has(selectedAgent) ||
                  agents.find((a) => a.id === selectedAgent)?.status ===
                    "online") && (
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#4caf50",
                      fontWeight: 500,
                    }}
                  >
                    ● Online
                  </span>
                )}
              </div>
              {typingAgent === selectedAgent && (
                <span className="typing-indicator"> is typing...</span>
              )}
            </div>
          )}
          <div className="chat-window">
            {!selectedAgent ? (
              <div
                style={{ textAlign: "center", padding: "20px", color: "#999" }}
              >
                Select an agent to start chatting
              </div>
            ) : (
              messages
                .filter(
                  (msg) =>
                    (msg.senderId === selectedAgent &&
                      msg.receiverId === supervisorId) ||
                    (msg.senderId === supervisorId &&
                      msg.receiverId === selectedAgent)
                )
                .sort((a, b) => {
                  const timeA = new Date(
                    a.timestamp || a.createdAt || 0
                  ).getTime();
                  const timeB = new Date(
                    b.timestamp || b.createdAt || 0
                  ).getTime();
                  return timeA - timeB;
                })
                .map((msg, index, filteredMessages) => {
                  const isSupervisor = msg.senderId === supervisorId;
                  const previousMsg =
                    index > 0 ? filteredMessages[index - 1] : null;
                  const showDateSeparator = shouldShowDateSeparator(
                    msg,
                    previousMsg
                  );
                  const messageStatus = msg.status || "sent";
                  const statusIcon = getStatusIcon(messageStatus, msg.isRead);

                  return (
                    <React.Fragment key={msg.id || index}>
                      {showDateSeparator && (
                        <div className="date-separator">
                          <span
                            style={{
                              background: "rgba(225, 245, 254, 0.92)",
                              padding: "5px 12px",
                              borderRadius: "7.5px",
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
                              position: "relative",
                              zIndex: 1,
                            }}
                          >
                            {formatDateSeparator(
                              msg.timestamp || msg.createdAt
                            )}
                          </span>
                        </div>
                      )}
                      <div
                        className={`chat-bubble ${
                          isSupervisor ? "supervisor" : "agent"
                        }`}
                      >
                        <div className="message-text">{msg.message}</div>
                        <div className="message-footer">
                          <span className="chat-timestamp">
                            {new Date(
                              msg.timestamp || msg.createdAt
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isSupervisor && (
                            <span
                              className={`message-status ${
                                messageStatus === "read"
                                  ? "read"
                                  : messageStatus === "delivered"
                                  ? "delivered"
                                  : "sent"
                              }`}
                            >
                              {statusIcon}
                            </span>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
            )}
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
