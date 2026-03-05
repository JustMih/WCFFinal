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

const CallCenterAgentChat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlineSupervisors, setOnlineSupervisors] = useState(new Set());
  const agentId = localStorage.getItem("userId");
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchSupervisors();
    socket.emit("register", agentId);

    // Listen for user online/offline status
    socket.on("user_online", (userId) => {
      console.log("User came online:", userId);
      setOnlineSupervisors((prev) => new Set([...prev, userId]));
    });

    socket.on("user_offline", (userId) => {
      console.log("User went offline:", userId);
      setOnlineSupervisors((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // Receive list of online users when connecting
    socket.on("online_users_list", (userIds) => {
      console.log("Online users list:", userIds);
      setOnlineSupervisors(new Set(userIds));
    });

    socket.on("private_message", (data) => {
      console.log("📨 Agent received private_message:", data);
      console.log(
        "Agent ID:",
        agentId,
        "Selected Supervisor:",
        selectedSupervisor
      );
      console.log(
        "Message senderId:",
        data.senderId,
        "receiverId:",
        data.receiverId
      );

      if (data.receiverId === agentId || data.senderId === agentId) {
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
          if (hasTemp && data.senderId === agentId) {
            // Remove temp message and add real one
            return prev
              .filter((msg) => !msg.id?.toString().startsWith("temp-"))
              .concat([data]);
          }

          console.log("Adding new message to agent chat");
          return [...prev, data];
        });

        // Update unread counts for messages from other supervisors
        if (data.senderId !== agentId) {
          if (data.senderId === selectedSupervisor) {
            // If message is from currently selected supervisor, mark as read immediately
            socket.emit("messagesRead", {
              senderId: data.senderId,
              receiverId: agentId,
            });
          }
        }
      } else {
        console.log("Message not for this agent, ignoring");
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

    return () => {
      socket.off("private_message");
      socket.off("message_status_update");
      socket.off("user_online");
      socket.off("user_offline");
      socket.off("online_users_list");
    };
  }, [agentId]);

  useEffect(() => {
    if (agentId && selectedSupervisor) {
      fetchMessages();
    }
  }, [agentId, selectedSupervisor]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Periodically refresh online status from database
  useEffect(() => {
    const interval = setInterval(() => {
      if (supervisors.length > 0) {
        supervisors.forEach((supervisor) => {
          if (supervisor.status === "online") {
            setOnlineSupervisors((prev) => new Set([...prev, supervisor.id]));
          } else {
            setOnlineSupervisors((prev) => {
              const newSet = new Set(prev);
              newSet.delete(supervisor.id);
              return newSet;
            });
          }
        });
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [supervisors]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!selectedSupervisor) return;

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

      // Mark messages as delivered if not already
      data.forEach((msg) => {
        if (msg.receiverId === agentId && msg.status === "sent") {
          socket.emit("message_delivered", msg.id);
        }
      });

      // Mark all unread messages as read
      const unreadMessages = data.filter(
        (msg) =>
          msg.senderId === selectedSupervisor &&
          msg.receiverId === agentId &&
          !msg.isRead
      );

      if (unreadMessages.length > 0) {
        // Mark via socket
        socket.emit("messagesRead", {
          senderId: selectedSupervisor,
          receiverId: agentId,
        });

        // Also update via API
        try {
          await fetch(
            `${baseURL}/users/update-read-message/${selectedSupervisor}/${agentId}`,
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
      const supervisorsList = Array.isArray(data.supervisors)
        ? data.supervisors
        : [];
      setSupervisors(supervisorsList);

      // Update online status from database (status field from User table)
      supervisorsList.forEach((supervisor) => {
        if (supervisor.status === "online") {
          setOnlineSupervisors((prev) => new Set([...prev, supervisor.id]));
        }
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
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

  const sendMessage = () => {
    if (!selectedSupervisor) {
      alert("Please select a supervisor.");
      return;
    }
    if (message.trim()) {
      console.log(
        "Sending message from agent:",
        agentId,
        "to supervisor:",
        selectedSupervisor
      );
      const messageToSend = {
        senderId: agentId,
        receiverId: selectedSupervisor,
        message: message.trim(),
      };

      console.log("Emitting private_message:", messageToSend);
      socket.emit("private_message", messageToSend);

      // Optimistic update - message will be replaced when server confirms
      const tempMessage = {
        id: `temp-${Date.now()}`,
        senderId: agentId,
        receiverId: selectedSupervisor,
        message: message.trim(),
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: "sent",
        isRead: false,
      };

      setMessages((prev) => [...prev, tempMessage]);
      setMessage("");
    }
  };

  return (
    <Card className="chat-card">
      <CardHeader title="Chat with Supervisor" className="chat-header" />
      <CardContent className="chat-body">
        {/* Left: Supervisor List */}
        <div className="supervisor-pane">
          <h4 className="supervisor-title">Supervisors</h4>
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <div className="supervisor-scroll">
              {supervisors.map((supervisor) => {
                // Get unread count for this supervisor
                const unreadCount = messages.filter(
                  (msg) =>
                    msg.senderId === supervisor.id &&
                    msg.receiverId === agentId &&
                    !msg.isRead
                ).length;

                return (
                  <div
                    key={supervisor.id}
                    onClick={() => {
                      setSelectedSupervisor(supervisor.id);
                      // Clear unread count when selecting
                      if (unreadCount > 0) {
                        // Messages will be marked as read in fetchMessages
                        fetchMessages();
                      }
                    }}
                    className={`supervisor-item ${
                      selectedSupervisor === supervisor.id ? "selected" : ""
                    }`}
                  >
                    <div
                      className={`avatar ${
                        onlineSupervisors.has(supervisor.id) ||
                        supervisor.status === "online"
                          ? "online"
                          : "offline"
                      }`}
                    >
                      {supervisor.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="supervisor-name-wrapper">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span className="supervisor-name">
                          {supervisor.full_name}
                        </span>
                        {(onlineSupervisors.has(supervisor.id) ||
                          supervisor.status === "online") && (
                          <span className="online-indicator" title="Online">
                            ●
                          </span>
                        )}
                        {unreadCount > 0 && (
                          <span
                            className="unread-badge"
                            title={`${unreadCount} unread message${
                              unreadCount > 1 ? "s" : ""
                            }`}
                          >
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                    onlineSupervisors.has(selectedSupervisor) ||
                    supervisors.find((s) => s.id === selectedSupervisor)
                      ?.status === "online"
                      ? "online"
                      : "offline"
                  }`}
                >
                  {supervisors
                    .find((s) => s.id === selectedSupervisor)
                    ?.full_name?.charAt(0)
                    .toUpperCase()}
                </div>
                <span>
                  Chatting with{" "}
                  {
                    supervisors.find((s) => s.id === selectedSupervisor)
                      ?.full_name
                  }
                </span>
                {(onlineSupervisors.has(selectedSupervisor) ||
                  supervisors.find((s) => s.id === selectedSupervisor)
                    ?.status === "online") && (
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
            </div>
          )}

          {/* Chat Messages */}
          <div className="chat-window">
            {!selectedSupervisor ? (
              <div
                style={{ textAlign: "center", padding: "20px", color: "#999" }}
              >
                Select a supervisor to start chatting
              </div>
            ) : (
              messages
                .filter(
                  (msg) =>
                    (msg.senderId === selectedSupervisor &&
                      msg.receiverId === agentId) ||
                    (msg.senderId === agentId &&
                      msg.receiverId === selectedSupervisor)
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
                  const isAgent = msg.senderId === agentId;
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
                        className={`chat-message ${
                          isAgent ? "agent" : "supervisor"
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
                          {isAgent && (
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
