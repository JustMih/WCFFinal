import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { MdOutlineSupportAgent, MdEmail, MdNotifications, MdMessage, MdChat, MdWork, MdPublic } from "react-icons/md";
import { baseURL } from "../../../config";
import "./crmSidebar.css";

// MUI Components - Individual imports for better tree shaking
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";

export default function CRMSidebar({ isSidebarOpen }) {
  const navigate = useNavigate();
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    assigned: 0,
    closed: 0,
    overdue: 0,
    carriedForward: 0,
    newTickets: {
      Complaints: 0,
      "New Tickets": 0,
      "Escalated Tickets": 0
    },
    convertedTickets: {
      Inquiries: 0,
      Complaints: 0,
      Suggestions: 0,
      Complements: 0
    },
    channeledTickets: {
      Directorate: 0,
      Units: 0
    },
    ticketStatus: {
      Open: 0,
      "On Progress": 0,
      Closed: 0,
      Minor: 0,
      Major: 0
    }
  });
  const [fetchError, setFetchError] = useState(null);
  const [notifiedCount, setNotifiedCount] = useState(0);
  const [taggedCount, setTaggedCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const role = localStorage.getItem("role");

  const getDashboardTitle = (role) => {
    if (role === "focal-person") return "Focal Person Dashboard";
    if (role === "claim-focal-person") return "Claim Focal Person Dashboard";
    if (role === "compliance-focal-person") return "Compliance Focal Person Dashboard";
    if (role === "head-of-unit") return "Head of Unit Dashboard";
    if (role === "reviewer") return "Reviewer Dashboard";
    if (role === "director-general") return "Dashboard";
    if (role === "agent" || role === "attendee") return "Agent Dashboard";
    return "Dashboard";
  };

  // Helper to fetch in-progress assignments count
  const fetchInProgressAssignmentsCount = async (userId, token) => {
    try {
      const url = `${baseURL}/ticket/assignments/in-progress?userId=${userId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) return 0;
      const data = await response.json();
      return data.count || 0;
    } catch {
      return 0;
    }
  };

  const fetchTicketCounts = async () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");
    if (!userId || !token) {
      setFetchError("Missing userId or token");
      return;
    }
    try {
      // Use different endpoints based on role
      let url;
      if (role === "reviewer") {
        url = `${baseURL}/reviewer/dashboard-counts/${userId}`;
      } else if (['focal-person', 'claim-focal-person', 'compliance-focal-person'].includes(role)) {
        // url = `${baseURL}/focal-person/dashboard-counts`;
        url = `${baseURL}/ticket/dashboard-counts/${userId}`;
      } else {
        url = `${baseURL}/ticket/dashboard-counts/${userId}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        setFetchError(`Fetch failed: ${response.status} - ${errorText}`);
        return;
      }
      const data = await response.json();
      let stats = data.ticketStats ? { ...data.ticketStats } : {};
      // Fetch in-progress assignments count and add to stats
      const inProgressAssignments = await fetchInProgressAssignmentsCount(userId, token);
      stats.inProgress = inProgressAssignments;
      setTicketStats(stats);
      setFetchError(null);
      // Debug: Log the updated ticketStats
      console.log('Updated Sidebar ticketStats:', stats);
      console.log('Updated channeledTickets:', stats.channeledTickets);
      console.log('Updated ticketStatus:', stats.ticketStatus);
      console.log('Updated newTickets:', stats.newTickets);
      console.log('New Tickets Total:', stats.newTickets?.Total);
      console.log('New Tickets Count:', stats.newTickets?.["New Tickets"]);
      console.log('Escalated Tickets Count:', stats.newTickets?.["Escalated Tickets"]);
    } catch (error) {
      setFetchError(error.message);
    }
  };


  const fetchNotificationCount = () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");
    if (userId && token) {
      // Fetch all notifications to calculate counts
      fetch(`${baseURL}/notifications/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          const contentType = res.headers.get("content-type");
          if (!res.ok || !contentType || !contentType.includes("application/json")) {
            throw new Error("Invalid response");
          }
          return res.json();
        })
        .then(data => {
          const notifications = data.notifications || [];

          // Count distinct tickets for tagged messages (unread, for current user, has "mentioned you" in message)
          const taggedTickets = new Set();
          notifications.forEach(n => {
            const messageText = (n.message || '').toLowerCase();
            const isUnread = n.status === 'unread' || n.status === ' ';
            const isForCurrentUser = String(n.recipient_id) === String(userId);
            if (messageText.includes('mentioned you') && isUnread && isForCurrentUser) {
              const ticketId = n.ticket?.id || n.ticket_id;
              if (ticketId) taggedTickets.add(ticketId);
            }
          });
          const tagged = taggedTickets.size;

          // Count distinct tickets for notified (unread, for current user, not tagged, not assigned, not reversed)
          // This matches the notifications page logic - count distinct tickets
          const notifiedTickets = new Set();
          notifications.forEach(n => {
            const isUnread = n.status === 'unread' || n.status === ' ';
            const isForCurrentUser = String(n.recipient_id) === String(userId);
            if (!isForCurrentUser || !isUnread) return;

            const messageText = (n.message || n.comment || '').toLowerCase();
            const isTagged = messageText.includes('mentioned you');

            // Check if it's reversed
            const isReversedTicket = n.ticket?.status === 'Reversed' || n.ticket?.status === 'reversed';
            const isReversedByText = messageText.includes('reversed back to you') ||
              messageText.includes('reversed to you') ||

              messageText.includes('reassigned to focal person') ||
              (messageText.includes('has been reversed') && messageText.includes('to'));
            const isReversed = isReversedTicket && isReversedByText;

            // Check if it's assigned (only by message text, not ticket status)
            const isAssignedByText = (messageText.includes('assigned to you') ||
              messageText.includes('forwarded to you') ||
              messageText.includes('reassigned to you')) && !isTagged && !isReversed;

            // Notified: not tagged, not assigned, and not reversed
            if (!isTagged && !isAssignedByText && !isReversed) {
              const ticketId = n.ticket?.id || n.ticket_id;
              if (ticketId) notifiedTickets.add(ticketId);
            }
          });
          const notified = notifiedTickets.size;

          console.log('Sidebar notification counts:', { tagged, notified });
          setTaggedCount(tagged);
          setNotifiedCount(notified);
          // Store in localStorage for cross-component sync
          localStorage.setItem('notificationCount', notified.toString());
          localStorage.setItem('taggedCount', tagged.toString());
        })
        .catch(err => {
          console.error('Error fetching sidebar notification count:', err);
          setNotifiedCount(0); // fallback
          setTaggedCount(0);
          localStorage.setItem('notificationCount', '0');
          localStorage.setItem('taggedCount', '0');
        });
    }
  };

  const fetchChatUnreadCount = () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");
    if (userId && token) {
      fetch(`${baseURL}/users/unread-messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch unread messages");
          return res.json();
        })
        .then(data => {
          const count = data.unreadCount || 0;
          setChatUnreadCount(count);
          localStorage.setItem('chatUnreadCount', count.toString());
        })
        .catch(err => {
          console.error('Error fetching chat unread count:', err);
          setChatUnreadCount(0);
          localStorage.setItem('chatUnreadCount', '0');
        });
    }
  };

  useEffect(() => {
    fetchTicketCounts();
    fetchNotificationCount();
    fetchChatUnreadCount();

    // Set up interval to refresh chat unread count every 30 seconds
    const chatInterval = setInterval(() => {
      fetchChatUnreadCount();
    }, 30000);

    // Listen for custom event when modal opens - decrease count immediately
    const handleNotificationModalOpened = () => {
      setNotifiedCount(prev => {
        const newCount = Math.max(0, prev - 1);
        localStorage.setItem('notificationCount', newCount.toString());
        return newCount;
      });
    };

    window.addEventListener('notificationModalOpened', handleNotificationModalOpened);

    // Listen for localStorage changes (for cross-tab sync)
    const handleStorageChange = (e) => {
      if (e.key === 'notificationCount') {
        setNotifiedCount(parseInt(e.newValue || '0', 10));
      }
      if (e.key === 'taggedCount') {
        setTaggedCount(parseInt(e.newValue || '0', 10));
      }
      if (e.key === 'chatUnreadCount') {
        setChatUnreadCount(parseInt(e.newValue || '0', 10));
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Listen for notification count update event
    const handleNotificationCountUpdated = () => {
      fetchNotificationCount();
    };

    // Listen for chat unread count update event
    const handleChatUnreadCountUpdated = () => {
      fetchChatUnreadCount();
    };
    window.addEventListener('notificationCountUpdated', handleNotificationCountUpdated);
    window.addEventListener('chatUnreadCountUpdated', handleChatUnreadCountUpdated);

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);

    return () => {
      clearInterval(chatInterval);
      window.removeEventListener('notificationModalOpened', handleNotificationModalOpened);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('notificationCountUpdated', handleNotificationCountUpdated);
      window.removeEventListener('chatUnreadCountUpdated', handleChatUnreadCountUpdated);
      clearInterval(interval);
    };
  }, []);

  return (
    <aside className={`crm-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
      {/* Logo moved to Navbar */}
      <ul>
        {(
          role === "agent" ||
          role === "attendee" ||
          role === "head-of-unit" ||
          role === "manager" ||
          role === "supervisor" ||
          role === "director" ||
          role === "admin" ||
          role === "super-admin" ||
          role === "focal-person" ||
          role === "claim-focal-person" ||
          role === "compliance-focal-person"
        ) && (
            <>
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    isActive ? "menu-item active-link" : "menu-item"
                  }
                >
                  <div className="menu-item">
                    <RxDashboard className="menu-icon" />
                    {isSidebarOpen && (
                      <span className="menu-text">{getDashboardTitle(role)}</span>
                    )}
                  </div>
                </NavLink>

                <NavLink
                  to="/notifications?type=notified"
                  className={({ isActive }) =>
                    isActive ? "menu-item active-link" : "menu-item"
                  }
                >
                  <div className="menu-item">
                    <MdEmail className="menu-icon" />
                    {isSidebarOpen && (
                      <span className="menu-text" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Notifications
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate('/notifications?type=notified');
                          }}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Tooltip title="Notified" arrow>
                            <Badge
                              badgeContent={notifiedCount > 0 ? notifiedCount : 0}
                              color="error"
                              max={99}
                              invisible={notifiedCount === 0}
                              sx={{
                                '& .MuiBadge-badge': {
                                  fontSize: '0.7rem',
                                  minWidth: '18px',
                                  height: '18px',
                                  padding: '0 4px',
                                  cursor: 'pointer'
                                }
                              }}
                            >
                              <MdNotifications
                                style={{ fontSize: '1rem', color: '#666', cursor: 'pointer' }}
                              />
                            </Badge>
                          </Tooltip>
                        </span>
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate('/notifications?type=tagged');
                          }}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Tooltip title="Tagged" arrow>
                            <Badge
                              badgeContent={taggedCount > 0 ? taggedCount : 0}
                              color="primary"
                              max={99}
                              invisible={taggedCount === 0}
                              sx={{
                                '& .MuiBadge-badge': {
                                  fontSize: '0.7rem',
                                  minWidth: '18px',
                                  height: '18px',
                                  padding: '0 4px',
                                  cursor: 'pointer'
                                }
                              }}
                            >
                              <MdMessage
                                style={{ fontSize: '1rem', color: '#666', cursor: 'pointer' }}
                              />
                            </Badge>
                          </Tooltip>
                        </span>
                      </span>
                    )}
                  </div>
                </NavLink>
                {/* 
              <NavLink
                to="/instagram"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <FaInstagram className="menu-icon" color="#E4405F" />
                  {isSidebarOpen && (
                    <span className="menu-text">Instagram Management</span>
                  )}
                </div>
              </NavLink> */}

                <NavLink
                  to="/crm-chat"
                  className={({ isActive }) =>
                    isActive ? "menu-item active-link" : "menu-item"
                  }
                >
                  <div className="menu-item">
                    <MdChat className="menu-icon" />
                    {isSidebarOpen && (
                      <span className="menu-text" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Chat Room
                        <Tooltip title="Unread Messages" arrow>
                          <Badge
                            badgeContent={chatUnreadCount > 0 ? chatUnreadCount : 0}
                            color="error"
                            max={99}
                            invisible={chatUnreadCount === 0}
                            sx={{ '& .MuiBadge-badge': { cursor: 'pointer' } }}
                          >
                            <MdNotifications style={{ fontSize: '1rem', color: '#666', cursor: 'pointer' }} />
                          </Badge>
                        </Tooltip>
                      </span>
                    )}
                  </div>
                </NavLink>

                {/* <NavLink
                to="/workflow"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdWork className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Workflow Dashboard</span>
                  )}
                </div>
              </NavLink> */}

                <div
                  className={`menu-item ${window.location.pathname.startsWith("/ticket")
                      ? "active-link"
                      : ""
                    }`}
                  style={{ padding: "11px 11px", textDecoration: "none" }}
                >
                  <MdOutlineSupportAgent className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">
                      Ticket Management
                    </span>
                  )}
                </div>

                {isSidebarOpen && (
                  <div className="dropdown-menu submenu">
                    <div className="menu-section">
                      <div className="section-header">
                        <span className="crm-section-title">Ticket Overview</span>
                        {/* <span className="section-count">
                        {ticketStats.total || 0}
                      </span> */}
                      </div>
                      <div className="section-items">
                        {[
                          {
                            label: "Assigned",
                            to: "/ticket/assigned",
                            value: ticketStats.assigned || 0,
                            icon: "📋"
                          },
                          {
                            label: "In Progress",
                            to: "/ticket/in-progress",
                            value: ticketStats.inProgress || 0,
                            icon: "⏳"
                          },
                          {
                            label: "Escalated",
                            to: "/ticket/escalated",
                            value: ticketStats.escalated || ticketStats.overdue || 0,
                            icon: "⚠️"
                          },
                          {
                            label: "Closed",
                            to: "/ticket/closed",
                            value: ticketStats.closedByAgent || 0,
                            icon: "🔒"
                          },
                          {
                            label: "Total Opened by Me",
                            to: "/ticket/all",
                            value: ticketStats.totalCreatedByMe || 0,
                            icon: "📊"
                          }
                        ].map((item, idx) => (
                          <NavLink
                            key={idx}
                            to={item.to}
                            className={({ isActive }) =>
                              isActive
                                ? "dropdown-item active-link"
                                : "dropdown-item"
                            }
                            style={{ padding: "12px 20px" }}
                          >
                            <div className="metric-row">
                              <span className="crm-metric-icon">{item.icon}</span>
                              <span className="metric-label">{item.label}</span>
                              <span className="metric-value-crm">{item.value}</span>
                            </div>
                          </NavLink>
                        ))}
                      </div>
                    </div>
                    {fetchError && (
                      <div className="section error-message">
                        <span style={{ color: "red", padding: "0 1rem" }}>
                          {fetchError}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </li>
            </>
          )}

        {(
          role === "director-general"
        ) && (
            <>
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    isActive ? "menu-item active-link" : "menu-item"
                  }
                >
                  <div className="menu-item">
                    <RxDashboard className="menu-icon" />
                    {isSidebarOpen && (
                      <span className="menu-text">{getDashboardTitle(role)}</span>
                    )}
                  </div>
                </NavLink>
                <NavLink
                  to="/public-dashboard"
                  className={({ isActive }) =>
                    isActive ? "menu-item active-link" : "menu-item"
                  }
                >
                  <div className="menu-item">
                    <MdPublic className="menu-icon" />
                    {isSidebarOpen && (
                      <span className="menu-text">
                        Public Dashboard
                      </span>
                    )}
                  </div>
                </NavLink>

                <NavLink
                  to="/notifications?type=notified"
                  className={({ isActive }) =>
                    isActive ? "menu-item active-link" : "menu-item"
                  }
                >
                  <div className="menu-item">
                    <MdEmail className="menu-icon" />
                    {isSidebarOpen && (
                      <span className="menu-text" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Notifications
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate('/notifications?type=notified');
                          }}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Tooltip title="Notified" arrow>
                            <Badge
                              badgeContent={notifiedCount > 0 ? notifiedCount : 0}
                              color="error"
                              max={99}
                              invisible={notifiedCount === 0}
                              sx={{
                                '& .MuiBadge-badge': {
                                  fontSize: '0.7rem',
                                  minWidth: '18px',
                                  height: '18px',
                                  padding: '0 4px',
                                  cursor: 'pointer'
                                }
                              }}
                            >
                              <MdNotifications
                                style={{ fontSize: '1rem', color: '#666', cursor: 'pointer' }}
                              />
                            </Badge>
                          </Tooltip>
                        </span>
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate('/notifications?type=tagged');
                          }}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Tooltip title="Tagged" arrow>
                            <Badge
                              badgeContent={taggedCount > 0 ? taggedCount : 0}
                              color="primary"
                              max={99}
                              invisible={taggedCount === 0}
                              sx={{
                                '& .MuiBadge-badge': {
                                  fontSize: '0.7rem',
                                  minWidth: '18px',
                                  height: '18px',
                                  padding: '0 4px',
                                  cursor: 'pointer'
                                }
                              }}
                            >
                              <MdMessage
                                style={{ fontSize: '1rem', color: '#666', cursor: 'pointer' }}
                              />
                            </Badge>
                          </Tooltip>
                        </span>
                      </span>
                    )}
                  </div>
                </NavLink>
                {/* 
              <NavLink
                to="/instagram"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <FaInstagram className="menu-icon" color="#E4405F" />
                  {isSidebarOpen && (
                    <span className="menu-text">Instagram Management</span>
                  )}
                </div>
              </NavLink> */}

                <NavLink
                  to="/crm-chat"
                  className={({ isActive }) =>
                    isActive ? "menu-item active-link" : "menu-item"
                  }
                >
                  <div className="menu-item">
                    <MdChat className="menu-icon" />
                    {isSidebarOpen && (
                      <span className="menu-text" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Chat Room
                        <Tooltip title="Unread Messages" arrow>
                          <Badge
                            badgeContent={chatUnreadCount > 0 ? chatUnreadCount : 0}
                            color="error"
                            max={99}
                            invisible={chatUnreadCount === 0}
                            sx={{ '& .MuiBadge-badge': { cursor: 'pointer' } }}
                          >
                            <MdNotifications style={{ fontSize: '1rem', color: '#666', cursor: 'pointer' }} />
                          </Badge>
                        </Tooltip>
                      </span>
                    )}
                  </div>
                </NavLink>

                {/* <NavLink
                to="/workflow"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdWork className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Workflow Dashboard</span>
                  )}
                </div>
              </NavLink> */}

                <div
                  className={`menu-item ${window.location.pathname.startsWith("/ticket")
                      ? "active-link"
                      : ""
                    }`}
                  style={{ padding: "11px 11px", textDecoration: "none" }}
                >
                  <MdOutlineSupportAgent className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">
                      Ticket Management
                    </span>
                  )}
                </div>

                {isSidebarOpen && (
                  <div className="dropdown-menu submenu">
                    <div className="menu-section">
                      <div className="section-header">
                        <span className="crm-section-title">Ticket Overview</span>
                        {/* <span className="section-count">
                        {ticketStats.total || 0}
                      </span> */}
                      </div>
                      <div className="section-items">
                        {[
                          {
                            label: "Assigned",
                            to: "/ticket/assigned",
                            value: ticketStats.assigned || 0,
                            icon: "📋"
                          },
                          {
                            label: "In Progress",
                            to: "/ticket/in-progress",
                            value: ticketStats.inProgress || 0,
                            icon: "⏳"
                          },
                          {
                            label: "Escalated",
                            to: "/ticket/escalated",
                            value: ticketStats.escalated || ticketStats.overdue || 0,
                            icon: "⚠️"
                          },
                          {
                            label: "Closed",
                            to: "/ticket/closed",
                            value: ticketStats.closedByAgent || 0,
                            icon: "🔒"
                          },
                          {
                            label: "Total Opened by Me",
                            to: "/ticket/all",
                            value: ticketStats.totalCreatedByMe || 0,
                            icon: "📊"
                          }
                        ].map((item, idx) => (
                          <NavLink
                            key={idx}
                            to={item.to}
                            className={({ isActive }) =>
                              isActive
                                ? "dropdown-item active-link"
                                : "dropdown-item"
                            }
                            style={{ padding: "12px 20px" }}
                          >
                            <div className="metric-row">
                              <span className="crm-metric-icon">{item.icon}</span>
                              <span className="metric-label">{item.label}</span>
                              <span className="metric-value-crm">{item.value}</span>
                            </div>
                          </NavLink>
                        ))}
                      </div>
                    </div>
                    {fetchError && (
                      <div className="section error-message">
                        <span style={{ color: "red", padding: "0 1rem" }}>
                          {fetchError}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </li>
            </>
          )}


        {role === "reviewer" && (
          <>
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <RxDashboard className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">{getDashboardTitle(role)}</span>
                  )}
                </div>
              </NavLink>
              <NavLink
                to="/notifications?type=notified"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdEmail className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      Notifications
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate('/notifications?type=notified');
                        }}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Tooltip title="Notified" arrow>
                          <Badge
                            badgeContent={notifiedCount > 0 ? notifiedCount : 0}
                            color="error"
                            max={99}
                            invisible={notifiedCount === 0}
                            sx={{
                              '& .MuiBadge-badge': {
                                fontSize: '0.7rem',
                                minWidth: '18px',
                                height: '18px',
                                padding: '0 4px',
                                cursor: 'pointer'
                              }
                            }}
                          >
                            <MdNotifications
                              style={{ fontSize: '1rem', color: '#666', cursor: 'pointer' }}
                            />
                          </Badge>
                        </Tooltip>
                      </span>
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate('/notifications?type=tagged');
                        }}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Tooltip title="Tagged" arrow>
                          <Badge
                            badgeContent={taggedCount > 0 ? taggedCount : 0}
                            color="primary"
                            max={99}
                            invisible={taggedCount === 0}
                            sx={{
                              '& .MuiBadge-badge': {
                                fontSize: '0.7rem',
                                minWidth: '18px',
                                height: '18px',
                                padding: '0 4px',
                                cursor: 'pointer'
                              }
                            }}
                          >
                            <MdMessage
                              style={{ fontSize: '1rem', color: '#666', cursor: 'pointer' }}
                            />
                          </Badge>
                        </Tooltip>
                      </span>
                    </span>
                  )}
                </div>
              </NavLink>
              <div
                className={`menu-item ${window.location.pathname.startsWith("/reviewer")
                    ? "active-link"
                    : ""
                  }`}
                style={{ padding: "11px 11px", textDecoration: "none" }}
              >
                <MdOutlineSupportAgent className="menu-icon" />
                {isSidebarOpen && (
                  <span className="menu-text">
                    Ticket Management
                  </span>
                )}
              </div>

              {isSidebarOpen && (
                <div className="dropdown-menu submenu reviewer-menu">
                  <div className="menu-section">
                    <div className="section-header">
                      <span className="crm-section-title">New Tickets</span>
                      <span className="section-count">
                        {ticketStats.newTickets?.Total || 0}
                      </span>
                    </div>
                    <div className="section-items">
                      {[
                        {
                          label: "New Tickets",
                          to: `/reviewer/new`,
                          value: ticketStats.newTickets?.["New Tickets"] || 0,
                          icon: "🆕"
                        },
                        {
                          label: "Escalated",
                          to: `/reviewer/escalated`,
                          value:
                            ticketStats.newTickets?.["Escalated Tickets"] ||
                            0,
                          icon: "⚠️"
                        }
                      ].map((item, idx) => (
                        <NavLink
                          key={idx}
                          to={item.to}
                          className={({ isActive }) =>
                            isActive
                              ? "dropdown-item active-link"
                              : "dropdown-item"
                          }
                          style={{ padding: "12px 20px" }}
                        >
                          <div className="metric-row">
                            <span className="crm-metric-icon">{item.icon}</span>
                            <span className="metric-label">{item.label}</span>
                            <span className="metric-value-crm">{item.value}</span>
                          </div>
                        </NavLink>
                      ))}
                    </div>
                  </div>

                  <div className="menu-section">
                    <div className="section-header">
                      <span className="crm-section-title">Tickets Category</span>
                      <span className="section-count">
                        {Object.values(
                          ticketStats.convertedTickets || {}
                        ).reduce((a, b) => a + b, 0)}
                      </span>
                    </div>
                    <div className="section-items">
                      {[
                        {
                          label: "Complaints",
                          to: "/reviewer/complaints",
                          value:
                            ticketStats.convertedTickets?.Complaints || 0,
                          icon: "📋"
                        },
                        {
                          label: "Suggestions",
                          to: "/reviewer/suggestions",
                          value:
                            ticketStats.convertedTickets?.Suggestions || 0,
                          icon: "💡"
                        },
                        {
                          label: "Compliments",
                          to: "/reviewer/complements",
                          value:
                            ticketStats.convertedTickets?.Compliments || 0,
                          icon: "⭐"
                        }
                      ].map((item, idx) => (
                        <NavLink
                          key={idx}
                          to={item.to}
                          className={({ isActive }) =>
                            isActive
                              ? "dropdown-item active-link"
                              : "dropdown-item"
                          }
                          style={{ padding: "12px 20px" }}
                        >
                          <div className="metric-row">
                            <span className="crm-metric-icon">{item.icon}</span>
                            <span className="metric-label">{item.label}</span>
                            <span className="metric-value-crm">{item.value}</span>
                          </div>
                        </NavLink>
                      ))}
                    </div>
                  </div>

                  <div className="menu-section">
                    <div className="section-header">
                      <span className="crm-section-title">Channeled Tickets</span>
                      <span className="section-count">
                        {Object.values(
                          ticketStats.channeledTickets || {}
                        ).reduce((a, b) => a + b, 0)}
                      </span>
                    </div>
                    <div className="section-items">
                      {[
                        {
                          label: "Directorate",
                          to: "/reviewer/directorate",
                          value:
                            ticketStats.channeledTickets?.Directorate || 0,
                          icon: "🏢"
                        },
                        {
                          label: "Units",
                          to: "/reviewer/units",
                          value: ticketStats.channeledTickets?.Units || 0,
                          icon: "👥"
                        }
                      ].map((item, idx) => (
                        <NavLink
                          key={idx}
                          to={item.to}
                          className={({ isActive }) =>
                            isActive
                              ? "dropdown-item active-link"
                              : "dropdown-item"
                          }
                          style={{ padding: "12px 20px" }}
                        >
                          <div className="metric-row">
                            <span className="crm-metric-icon">{item.icon}</span>
                            <span className="metric-label">{item.label}</span>
                            <span className="metric-value-crm">{item.value}</span>
                          </div>
                        </NavLink>
                      ))}
                    </div>
                  </div>

                  <div className="menu-section">
                    <div className="section-header">
                      <span className="crm-section-title">Ticket Status</span>
                      <span className="section-count">
                        {(ticketStats.ticketStatus?.["On Progress"] || 0) + (ticketStats.ticketStatus?.Closed || 0)}
                      </span>
                    </div>
                    <div className="section-items">
                      {[
                        // {
                        //   label: "On Progress",
                        //   to: "/reviewer/on-progress",
                        //   value:
                        //     ticketStats.ticketStatus?.["On Progress"] || 0,
                        //   icon: "⏳"
                        // },
                        {
                          label: "Closed",
                          to: `/reviewer/closed`,
                          value: ticketStats.ticketStatus?.Closed || 0,
                          icon: "🔒"
                        }
                      ].map((item, idx) => (
                        <NavLink
                          key={idx}
                          to={item.to}
                          className={({ isActive }) =>
                            isActive
                              ? "dropdown-item active-link"
                              : "dropdown-item"
                          }
                          style={{ padding: "12px 20px" }}
                        >
                          <div className="metric-row">
                            <span className="crm-metric-icon">{item.icon}</span>
                            <span className="metric-label">{item.label}</span>
                            <span className="metric-value-crm">{item.value}</span>
                          </div>
                        </NavLink>
                      ))}
                    </div>
                  </div>

                  {fetchError && (
                    <div className="section error-message">
                      <span style={{ color: "red", padding: "0 1rem" }}>
                        {fetchError}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </li>
          </>
        )}
      </ul>
    </aside>
  );
}
