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
  Alert,
  Snackbar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { baseURL } from "../../../config";
import "./CRMChat.css";

const socket = io(baseURL);

const CRMChat = () => {
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUser, setTypingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConversations, setShowConversations] = useState(true); // Toggle between conversations and all users
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const currentUserId = localStorage.getItem("userId");
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchUsers();
    fetchConversations();
    socket.emit("register", currentUserId);
    console.log("Registered user with socket:", currentUserId);

    socket.on("private_message", (data) => {
      console.log("Received private_message:", data);
      if (data.receiverId === currentUserId || data.senderId === currentUserId) {
        // Check if message already exists to prevent duplicates
        setMessages((prev) => {
          const messageExists = prev.some(
            (msg) =>
              msg.id === data.id ||
              (msg.senderId === data.senderId &&
                msg.receiverId === data.receiverId &&
                msg.message === data.message &&
                Math.abs(new Date(msg.timestamp || msg.createdAt) - new Date(data.timestamp || data.createdAt)) < 1000)
          );
          if (messageExists) {
            console.log("Message already exists, skipping duplicate");
            return prev;
          }
          console.log("Adding new message to state");
          return [...prev, data];
        });

        if (data.senderId !== currentUserId && data.senderId !== selectedUser) {
          setUnreadCounts((prev) => ({
            ...prev,
            [data.senderId]: (prev[data.senderId] || 0) + 1,
          }));
        }
        
        // Refresh conversations when new message is received
        fetchConversations();
        // Dispatch event to update sidebar count if message is from another user
        if (data.senderId !== currentUserId) {
          window.dispatchEvent(new CustomEvent('chatUnreadCountUpdated'));
        }
        
        // If message is from current user to selected user, refresh to update read status
        if (data.senderId === currentUserId && data.receiverId === selectedUser && selectedUser) {
          setTimeout(() => {
            fetchMessages();
          }, 1000); // Refresh after 1 second to check read status
        }
      }
    });

    socket.on("typing", (userId) => {
      if (userId !== currentUserId) {
        setTypingUser(userId);
        setTimeout(() => setTypingUser(null), 2000);
      }
    });

    return () => {
      socket.off("private_message");
      socket.off("typing");
    };
  }, [currentUserId]);

  // Separate effect to fetch messages when selectedUser changes
  useEffect(() => {
    if (currentUserId && selectedUser) {
      console.log("Fetching messages for:", currentUserId, selectedUser);
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [currentUserId, selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      console.log("Fetching messages from API for:", currentUserId, "and", selectedUser);
      const response = await fetch(
        `${baseURL}/users/messages/${currentUserId}/${selectedUser}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      if (!response.ok) {
        console.error("Failed to fetch messages:", response.status, response.statusText);
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      console.log("Fetched messages from API:", data);
      // Format messages to ensure they have the right structure
      const formattedMessages = Array.isArray(data) ? data.map(msg => ({
        id: msg.id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        message: msg.message,
        isRead: msg.isRead || false,
        timestamp: msg.timestamp || msg.createdAt,
        createdAt: msg.createdAt
      })) : [];
      console.log("Formatted messages:", formattedMessages);
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]); // Set empty array on error
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${baseURL}/users/crm-users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      // Filter out current user and users without names, then sort by name
      const allUsers = Array.isArray(data.users) ? data.users : [];
      const filteredUsers = allUsers
        .filter(user => {
          // Remove current user and users without full_name
          return user.id !== currentUserId && user.full_name && user.full_name.trim().length > 0;
        })
        .sort((a, b) => {
          // Sort alphabetically by full_name
          const nameA = (a.full_name || '').toLowerCase().trim();
          const nameB = (b.full_name || '').toLowerCase().trim();
          return nameA.localeCompare(nameB);
        });
      console.log('CRM Chat - Total users fetched:', allUsers.length);
      console.log('CRM Chat - Filtered users (after removing current user and empty names):', filteredUsers.length);
      console.log('CRM Chat - Current user ID:', currentUserId);
      setUsers(filteredUsers);
      fetchUnreadCounts(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async (users) => {
    const counts = {};
    for (const user of users) {
      try {
        const response = await fetch(
          `${baseURL}/users/unread-messages-count/${currentUserId}/${user.id}`
        );
        const data = await response.json();
        counts[user.id] = data.receiverUnreadCount;
      } catch (error) {
        console.error(
          `Error fetching unread count for user ${user.id}:`,
          error
        );
      }
    }
    setUnreadCounts(counts);
  };

  const sendReply = async () => {
    // Check if receiver is selected
    if (!selectedUser) {
      setAlertMessage("Please select a receiver before sending a message");
      setAlertOpen(true);
      return;
    }

    if (!reply.trim()) {
      setAlertMessage("Please enter a message");
      setAlertOpen(true);
      return;
    }

    if (reply.trim() && selectedUser) {
      const messageText = reply.trim();
      setReply(""); // Clear input immediately
      
      try {
        // First, save message to database via API route
        const response = await fetch(`${baseURL}/users/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            senderId: currentUserId,
            receiverId: selectedUser,
            message: messageText,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const result = await response.json();
        console.log("Message saved via API:", result);

        // Also emit via socket for real-time delivery (using data from API response)
        if (result.data) {
          socket.emit("private_message", result.data);
        }

        // Add message to local state from API response
        if (result.data) {
          setMessages((prev) => {
            const messageExists = prev.some((msg) => msg.id === result.data.id);
            if (messageExists) return prev;
            return [...prev, result.data];
          });
        }
        
        // Refresh conversations after sending message
        fetchConversations();
        // Dispatch event to update sidebar count
        window.dispatchEvent(new CustomEvent('chatUnreadCountUpdated'));
        
        // Refresh messages after sending to check read status
        setTimeout(() => {
          fetchMessages();
        }, 1000); // Refresh after 1 second to check read status
      } catch (error) {
        console.error("Error sending message:", error);
        // Restore the message text if sending failed
        setReply(messageText);
        alert("Failed to send message. Please try again.");
      }
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${baseURL}/users/conversations/${currentUserId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch conversations");
      const data = await response.json();
      console.log("Fetched conversations:", data);
      setConversations(data.conversations || []);
      
      // Update unread counts from conversations
      const counts = {};
      data.conversations?.forEach(conv => {
        counts[conv.userId] = conv.unreadCount || 0;
      });
      setUnreadCounts(prev => ({ ...prev, ...counts }));
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations([]);
    }
  };

  const handleSelectUser = async (id) => {
    setSelectedUser(id);
    setDrawerOpen(false);
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    // Mark messages as read when opening chat
    try {
      await markMessageAsRead(id, currentUserId);
      // Refresh messages to update read status
      await fetchMessages();
      // Refresh conversations to update unread counts
      fetchConversations();
      // Dispatch event to update sidebar count
      window.dispatchEvent(new CustomEvent('chatUnreadCountUpdated'));
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Format date like WhatsApp (Today, Yesterday, or actual date)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const markMessageAsRead = async (senderId, receiverId) => {
    try {
      const response = await fetch(
        `${baseURL}/users/update-read-message/${senderId}/${receiverId}`,
        {
          method: "PUT",
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
    socket.emit("typing", selectedUser);
  };

  return (
    <Card className="crm-chat-card">
      <CardHeader
        title="CRM Chat Room"
        className="crm-chat-header"
        action={
          <IconButton
            className="mobile-only"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon style={{ color: "white" }} />
          </IconButton>
        }
      />
      <CardContent className="crm-chat-body">
        <div className="user-list desktop-only">
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', marginBottom: '12px', alignItems: 'center' }}>
            <h4 className="user-title" style={{ margin: 0, flex: 1 }}>Chats</h4>
            <button
              onClick={() => setShowConversations(!showConversations)}
              style={{
                padding: '4px 8px',
                fontSize: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: showConversations ? '#1976d2' : '#fff',
                color: showConversations ? '#fff' : '#333'
              }}
            >
              {showConversations ? 'All Users' : 'Conversations'}
            </button>
          </div>
          <div className="user-search-container">
            <input
              type="text"
              placeholder="Search users..."
              className="user-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <div className="user-scroll">
              {showConversations ? (
                // Show conversations (sorted by unread, then time)
                conversations
                  .map(conv => {
                    const user = users.find(u => u.id === conv.userId);
                    return user ? { ...user, conversation: conv } : null;
                  })
                  .filter(Boolean)
                  .filter(user => {
                    if (!searchQuery.trim()) return true;
                    const searchLower = searchQuery.toLowerCase();
                    const fullName = (user.full_name || '').toLowerCase();
                    const email = (user.email || '').toLowerCase();
                    return fullName.includes(searchLower) || email.includes(searchLower);
                  })
                  .map((user) => {
                    const conv = user.conversation;
                    return (
                      <div
                        key={user.id}
                        onClick={() => handleSelectUser(user.id)}
                        className={`user-item ${
                          selectedUser === user.id ? "selected" : ""
                        }`}
                        style={{
                          backgroundColor: conv.unreadCount > 0 ? '#f0f8ff' : 'transparent',
                          fontWeight: conv.unreadCount > 0 ? '600' : 'normal'
                        }}
                      >
                        <div className="avatar">
                          {user.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-name-wrapper" style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>{user.full_name}</span>
                                {user.role && (
                                  <span style={{ 
                                    fontSize: '0.7rem', 
                                    color: '#666', 
                                    fontStyle: 'italic'
                                  }}>
                                    ({user.role})
                                  </span>
                                )}
                                {conv.unreadCount > 0 && (
                                  <span className="unread-badge">
                                    {conv.unreadCount}
                                  </span>
                                )}
                              </div>
                              {conv.lastMessage && (
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  color: '#666', 
                                  marginTop: '2px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {conv.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                                  {conv.lastMessage.text}
                                </div>
                              )}
                            </div>
                            {conv.lastMessage && (
                              <div style={{ 
                                fontSize: '0.7rem', 
                                color: '#999',
                                marginLeft: '8px',
                                whiteSpace: 'nowrap'
                              }}>
                                {new Date(conv.lastMessage.time).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                // Show all users
                users
                  .filter(user => {
                    if (!searchQuery.trim()) return true;
                    const searchLower = searchQuery.toLowerCase();
                    const fullName = (user.full_name || '').toLowerCase();
                    const email = (user.email || '').toLowerCase();
                    return fullName.includes(searchLower) || email.includes(searchLower);
                  })
                  .map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUser(user.id)}
                      className={`user-item ${
                        selectedUser === user.id ? "selected" : ""
                      }`}
                    >
                      <div className="avatar">
                        {user.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-name-wrapper">
                        <div>
                          {user.full_name}{" "}
                          {user.role && (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: '#666', 
                              fontStyle: 'italic',
                              marginLeft: '4px'
                            }}>
                              ({user.role})
                            </span>
                          )}
                          {unreadCounts[user.id] > 0 && (
                            <span className="unread-badge">
                              {unreadCounts[user.id]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        <div className="crm-chat-pane">
          {selectedUser && (
            <div className="chatting-with">
              Chatting with {users.find((u) => u.id === selectedUser)?.full_name}
              {typingUser === selectedUser && (
                <span className="typing-indicator"> is typing...</span>
              )}
            </div>
          )}
          <div className="chat-window">
            {messages
              .filter(
                (msg) =>
                  msg.senderId === selectedUser ||
                  msg.receiverId === selectedUser
              )
              .map((msg, index, arr) => {
                const isCurrentUser = msg.senderId === currentUserId;
                const msgDate = new Date(msg.timestamp || msg.createdAt || Date.now());
                const prevMsg = index > 0 ? arr[index - 1] : null;
                const prevMsgDate = prevMsg ? new Date(prevMsg.timestamp || prevMsg.createdAt) : null;
                
                // Show date separator if date changed
                const showDateSeparator = !prevMsgDate || 
                  msgDate.toDateString() !== prevMsgDate.toDateString();
                
                return (
                  <React.Fragment key={msg.id || `${msg.senderId}-${msg.receiverId}-${msg.timestamp || msg.createdAt}`}>
                    {showDateSeparator && (
                      <div style={{ 
                        textAlign: 'center', 
                        margin: '10px 0',
                        fontSize: '0.75rem',
                        color: '#666'
                      }}>
                        {formatDate(msg.timestamp || msg.createdAt)}
                      </div>
                    )}
                    <div
                      className={`chat-bubble ${
                        isCurrentUser ? "current-user" : "other-user"
                      }`}
                    >
                      {msg.message}
                      <div className="chat-timestamp" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        justifyContent: isCurrentUser ? 'flex-end' : 'flex-start'
                      }}>
                        <span>
                          {msgDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isCurrentUser && (
                          <span style={{ 
                            fontSize: '1.0rem', 
                            marginLeft: '2px',
                            color: msg.isRead ? '#4caf50' : '#999'
                          }}>
                            {msg.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-wrapper">
            <input
              type="text"
              value={reply}
              onChange={handleTyping}
              placeholder="Type a message..."
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
      <Snackbar
        open={alertOpen}
        autoHideDuration={4000}
        onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setAlertOpen(false)} 
          severity="warning" 
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default CRMChat;
