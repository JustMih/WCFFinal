import React, { useState, useEffect } from "react";
import { RiMenuFoldLine, RiMenuFold2Line } from "react-icons/ri";
import { LuSunMoon } from "react-icons/lu";
import { MdPerson, MdDarkMode } from "react-icons/md";
import { FaSignOutAlt, FaCog } from "react-icons/fa";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { TfiLayoutMediaCenterAlt } from "react-icons/tfi";
import { BsFillTicketDetailedFill } from "react-icons/bs";
import { baseURL } from "../../config";
import "./navbar.css";
import { IoMdNotificationsOutline } from "react-icons/io";
import { Badge } from "@mui/material";
import ReviewerActionModal from "../reviewer/ReviewerActionModal";
import Rating from '@mui/material/Rating';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clearDomainCredentials } from "../../utils/credentials";
import logo from "../../asserts/images/logo.png";

export default function Navbar({
  toggleTheme,
  isDarkMode,
  toggleSidebar,
  isSidebarOpen,
  role,
  setActiveSystem,
  activeSystem
}) {
  const [username, setUserName] = useState("");
  const [assignedCount, setAssignedCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [modalTicket, setModalTicket] = useState(null);
  const [convertCategory, setConvertCategory] = useState({});
  const [forwardUnit, setForwardUnit] = useState({});
  const [units, setUnits] = useState([]);
  const categories = ["Inquiry"]; // Add more if needed
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("authToken");
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [currentRating, setCurrentRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [currentTicketId, setCurrentTicketId] = useState(null);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [ticketNotifications, setTicketNotifications] = useState([]);
  const [ticketDetails, setTicketDetails] = useState(null);
  const queryClient = useQueryClient();

  // Fetch unread count
  const { data: unreadCountData } = useQuery({
    queryKey: ['unreadCount', userId],
    queryFn: async () => {
      const response = await fetch(
        `${baseURL}/notifications/unread-count/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!response.ok) throw new Error('Failed to fetch unread count');
      return response.json();
    },
    enabled: !!userId && !!token,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Fetch notifications
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const response = await fetch(
        `${baseURL}/notifications/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    enabled: !!userId && !!token,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      const response = await fetch(`${baseURL}/notifications/read/${notificationId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['unreadCount', userId]);
      queryClient.invalidateQueries(['notifications', userId]);
    }
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // Get all unread notifications and mark them as read
      const unreadNotifications = notificationsData?.notifications?.filter(n => n.status === 'unread') || [];
      
      if (unreadNotifications.length === 0) {
        return { success: true, count: 0 };
      }
      
      // Mark each unread notification as read using the existing endpoint
      const promises = unreadNotifications.map(notif => 
        fetch(`${baseURL}/notifications/read/${notif.id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` }
        }).then(async (response) => {
          if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Failed to mark notification as read' }));
            throw new Error(error.message || `Failed to mark notification ${notif.id} as read`);
          }
          return response.json();
        })
      );
      
      try {
        await Promise.all(promises);
        return { success: true, count: unreadNotifications.length };
      } catch (error) {
        console.error("Error marking notifications as read:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log(`Successfully marked ${data.count} notification(s) as read`);
      // Invalidate and refetch all notification-related queries
      queryClient.invalidateQueries(['unreadCount', userId]);
      queryClient.invalidateQueries(['notifications', userId]);
      // Update local state immediately for better UX
      if (notificationsData?.notifications) {
        const updatedNotifications = notificationsData.notifications.map(notif => 
          notif.status === 'unread' ? { ...notif, status: 'read' } : notif
        );
        // Update the query cache directly for instant UI update
        queryClient.setQueryData(['notifications', userId], { notifications: updatedNotifications });
      }
      // Also update the local notifications state
      if (userId && token) {
        fetch(`${baseURL}/notifications/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            setNotifications(data.notifications || []);
            // Update unread count - count individual notifications with messages
            const unreadCount = (data.notifications || []).filter(n => 
              (n.status === 'unread' || n.status === ' ') && 
              n.comment && 
              n.comment.trim() !== ''
            ).length;
            queryClient.setQueryData(['unreadCount', userId], { unreadCount });
          })
          .catch(err => console.error("Error refetching notifications:", err));
      }
    },
    onError: (error) => {
      console.error("Failed to mark all notifications as read:", error);
      alert(`Error: ${error.message || 'Failed to mark all notifications as read'}`);
    }
  });

  // Fetch ticket notifications
  const { data: ticketNotificationsData } = useQuery({
    queryKey: ['ticketNotifications', selectedNotification?.ticket_id],
    queryFn: async () => {
      if (!selectedNotification?.ticket_id) return { notifications: [] };
      const response = await fetch(
        `${baseURL}/notifications/ticket/${selectedNotification.ticket_id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!response.ok) throw new Error('Failed to fetch ticket notifications');
      return response.json();
    },
    enabled: !!selectedNotification?.ticket_id && !!token,
  });

  // Fetch ticket details
  const { data: ticketDetailsData } = useQuery({
    queryKey: ['ticketDetails', selectedNotification?.ticket_id],
    queryFn: async () => {
      if (!selectedNotification?.ticket_id) return null;
      const response = await fetch(
        `${baseURL}/ticket/${selectedNotification.ticket_id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!response.ok) throw new Error('Failed to fetch ticket details');
      return response.json();
    },
    enabled: !!selectedNotification?.ticket_id && !!token,
  });

  useEffect(() => {
    setUserName(localStorage.getItem("username"));
  }, []);

  useEffect(() => {
    // Fetch assigned ticket count - different logic for reviewers vs other users
    async function fetchAssignedCount() {
      const userRole = localStorage.getItem('role');
      
      try {
        if (userRole === 'reviewer') {
          // For reviewers: fetch assigned tickets count (not notifications)
          const response = await fetch(
            `${baseURL}/ticket/count/assigned/${userId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          if (response.ok) {
            const data = await response.json();
            setAssignedCount(data.count || 0);
          }
        } else {
          // For other users: fetch notification count (unread notifications)
          const response = await fetch(
            `${baseURL}/notifications/unread-count/${userId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          if (response.ok) {
            const data = await response.json();
            setAssignedCount(data.unreadCount || 0);
          }
        }
      } catch (err) {
        console.error("Error fetching assigned count:", err);
        setAssignedCount(0);
      }
    }
    if (userId && token) fetchAssignedCount();
  }, [userId, token]);

  useEffect(() => {
    // Fetch notifications for the user (for dropdown only)
    async function fetchNotifications() {
      try {
        const response = await fetch(
          `${baseURL}/notifications/user/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setNotifications([]);
      }
    }
    if (userId && token) fetchNotifications();
  }, [userId, token]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const fetchUnits = async () => {
      try {
        const res = await fetch(`${baseURL}/section/units-data`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        setUnits(json.data || []);
      } catch (err) {
        console.error("Error fetching units:", err);
      }
    };
    if (token) fetchUnits();
  }, []);

  const handleCategoryChange = (ticketId, value) => {
    setConvertCategory(prev => ({
      ...prev,
      [ticketId]: value
    }));
  };

  const handleUnitChange = (ticketId, value) => {
    setForwardUnit(prev => ({
      ...prev,
      [ticketId]: value
    }));
  };

  const handleConvertOrForward = (ticketId) => {
    alert("Convert/Forward not implemented in Navbar. Please use the dashboard.");
  };

  const handleRating = async (ticketId, rating) => {
    setCurrentTicketId(ticketId);
    setCurrentRating(rating);
    setRatingDialogOpen(true);
  };

  const handleRatingSubmit = async () => {
    try {
      const response = await fetch(`${baseURL}/ticket/${currentTicketId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: currentRating,
          comment: ratingComment
        })
      });

      if (response.ok) {
        alert('Rating submitted successfully!');
        setRatingDialogOpen(false);
        setCurrentRating(0);
        setRatingComment('');
        setCurrentTicketId(null);
      } else {
        throw new Error('Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    }
  };

  const handleRatingDialogClose = () => {
    setRatingDialogOpen(false);
    setCurrentRating(0);
    setRatingComment('');
    setCurrentTicketId(null);
  };

  const refreshNotifications = async () => {
    try {
      const response = await fetch(
        `${baseURL}/notifications/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Error refreshing notifications:", err);
    }
  };

  const fetchTicketNotifications = async (ticketId) => {
    try {
      console.log("Fetching notifications for ticket:", ticketId);
      const response = await fetch(
        `${baseURL}/notifications/ticket/${ticketId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Raw ticket notifications data:", data);
        
        // Check if we have notifications in the response
        if (!data.notifications || !Array.isArray(data.notifications)) {
          console.error("No notifications array in response:", data);
          setTicketNotifications([]);
          return;
        }

        // Sort notifications by date, newest first
        const sortedNotifications = data.notifications.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        console.log("Sorted notifications:", sortedNotifications);
        setTicketNotifications(sortedNotifications);
      } else {
        console.error("Failed to fetch ticket notifications:", response.status);
        setTicketNotifications([]);
      }
    } catch (err) {
      console.error("Error fetching ticket notifications:", err);
      setTicketNotifications([]);
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    try {
      console.log("Fetching ticket details for ID:", ticketId);
      const response = await fetch(
        `${baseURL}/ticket/${ticketId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Ticket details received:", data);
        setTicketDetails(data.ticket || data);
      } else {
        console.error("Failed to fetch ticket details:", response.status);
      }
    } catch (err) {
      console.error("Error fetching ticket details:", err);
    }
  };

  /**
   * Handle notification click
   * 
   * Modals used:
   * 1. "Notified" notifications -> Notification Details Dialog (notificationDialogOpen)
   * 2. "Assigned" notifications -> Navigate to /ticket/assigned -> TicketDetailsModal (from assigned.js)
   * 3. "Tagged Message" notifications -> Navigate to ticket page -> TicketDetailsModal
   * 4. Fallback (no ticket ID) -> Notification Details Dialog (notificationDialogOpen)
   */
  const handleNotificationClick = async (notif) => {
    console.log("Notification clicked:", notif);
    try {
      // Mark notification as read first
      if (notif.status === 'unread') {
        await markAsReadMutation.mutateAsync(notif.id);
      }
      
      // Close the dropdown
      setNotifDropdownOpen(false);
      
      // Determine notification type
      const hasComment = notif.comment !== null && notif.comment !== undefined && String(notif.comment).trim() !== '';
      const messageText = (notif.message || '').toLowerCase();
      const isUnread = notif.status === 'unread' || notif.status === ' ';
      const isTaggedMessage = hasComment || messageText.includes('mentioned you');
      // Use status, recipient_id, and ticket status instead of just text matching
      const isForCurrentUser = notif.recipient_id === userId;
      // Simple check: if ticket is reversed, count it as reversed (case-insensitive, no need to check message text)
      const ticketStatus = notif.ticket?.status || '';
      const isReversedTicket = ticketStatus.toLowerCase() === 'reversed';
      
      // Count as reversed if ticket is reversed (simple check like backend)
      const isReversed = isForCurrentUser && isUnread && isReversedTicket && !isTaggedMessage;
      
      // Check message text for assignment (excluding reversed messages)
      // Only check message text - don't use ticket status as it's too broad
      const isAssignedByText = (messageText.includes('assigned to you') || 
                               messageText.includes('forwarded to you') ||
                               messageText.includes('reassigned to you')) && !isTaggedMessage && !isReversed;
      
      // Assigned ONLY if: (1) for current user AND (2) unread AND (3) message explicitly indicates assignment AND (4) not reversed
      // Don't use ticket status as it's too broad - many "Notified" notifications have tickets with "Assigned" status
      const isAssigned = isForCurrentUser && isUnread && isAssignedByText && !isReversed;
      const isNotified = !isTaggedMessage && !isAssigned && !isReversed;
      
      // Get ticket ID first - try multiple sources
      let ticketId = null;
      
      // First, try ticket_id from notification
      if (notif.ticket_id) {
        // If it's a UUID, we need to get the actual ticket number
        if (notif.ticket?.ticket_id) {
          ticketId = notif.ticket.ticket_id;
        } else {
          // If we have ticket_id but no ticket object, fetch it or use the UUID
          ticketId = notif.ticket_id;
        }
      }
      
      // If no ticket_id, try to extract from message
      if (!ticketId && notif.message) {
        const idPatterns = [
          /ID:\s*([A-Z0-9-]+)/i,
          /\(ID:\s*([A-Z0-9-]+)\)/i,
          /\(([A-Z0-9-]+)\)/,
          /(WCF-[A-Z0-9-]+)/i
        ];
        
        for (const pattern of idPatterns) {
          const match = notif.message.match(pattern);
          if (match) {
            const extractedId = match[1] || match[0];
            if (extractedId.match(/^WCF-[A-Z0-9-]+$/i) || extractedId.match(/^[A-Z]{2,4}-[A-Z]{2}-[A-Z0-9-]+$/i)) {
              ticketId = extractedId;
              break;
            }
          }
        }
      }
      
      // If we have a ticket ID, check if it's assigned to the current user
      // This is important for "assigned to reviewer" notifications that might be classified as "Notified"
      if (ticketId) {
        let actualTicketId = ticketId;
        
        // If ticketId is a UUID, try to get the actual ticket_id
        if (ticketId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          try {
            const response = await fetch(`${baseURL}/ticket/${ticketId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
              const ticketData = await response.json();
              const fetchedTicketId = ticketData.ticket?.ticket_id || ticketData.ticket_id;
              if (fetchedTicketId) {
                actualTicketId = fetchedTicketId;
              }
            }
          } catch (err) {
            console.error("Error fetching ticket:", err);
          }
        }
        
        // Check if ticket is assigned to current user (even if notification is classified as "Notified")
        // This ensures "assigned to reviewer" notifications open TicketDetailsModal with forward functions
        let isTicketAssignedToUser = false;
        try {
          const assignedResponse = await fetch(`${baseURL}/ticket/assigned/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (assignedResponse.ok) {
            const assignedData = await assignedResponse.json();
            const tickets = assignedData.tickets || assignedData.data || assignedData;
            if (Array.isArray(tickets)) {
              const foundTicket = tickets.find(t => {
                const ticketIdMatch = t.ticket_id && t.ticket_id.toLowerCase() === actualTicketId.toLowerCase();
                const idMatch = t.id && (t.id === actualTicketId || t.id.toLowerCase() === actualTicketId.toLowerCase());
                // Also check if the ticket_id from notification matches
                const notifTicketIdMatch = notif.ticket?.ticket_id && notif.ticket.ticket_id.toLowerCase() === actualTicketId.toLowerCase();
                return ticketIdMatch || idMatch || notifTicketIdMatch;
              });
              if (foundTicket) {
                isTicketAssignedToUser = true;
              }
            }
          }
        } catch (err) {
          console.error("Error checking assigned tickets:", err);
        }
        
        // If ticket is assigned to user, navigate to assigned page (which has TicketDetailsModal with forward functions)
        if (isTicketAssignedToUser) {
          console.log('Ticket is assigned to user - navigating to assigned page with TicketDetailsModal');
          window.location.href = `/ticket/assigned?ticketId=${encodeURIComponent(actualTicketId)}`;
          return;
        }
      }
      
      // If it's a "Notified" type and ticket is not assigned, open the notification dialog
      // Uses: Notification Details Dialog (notificationDialogOpen)
      if (isNotified) {
        setSelectedNotification(notif);
        setNotificationDialogOpen(true);
        return;
      }
      
      // For "Tagged Message" and "Assigned", navigate to ticket page
      // When navigating to /ticket/assigned, it uses: TicketDetailsModal (from assigned.js page)
      // Navigate to ticket page if we have a ticket ID
      if (ticketId) {
        let actualTicketId = ticketId;
        
        // If ticketId is a UUID, try to get the actual ticket_id (if not already done above)
        if (ticketId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          try {
            const response = await fetch(`${baseURL}/ticket/${ticketId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
              const ticketData = await response.json();
              const fetchedTicketId = ticketData.ticket?.ticket_id || ticketData.ticket_id;
              if (fetchedTicketId) {
                actualTicketId = fetchedTicketId;
              }
            }
          } catch (err) {
            console.error("Error fetching ticket:", err);
          }
        }
        
        // Search in assigned tickets first (for tagged/assigned notifications that weren't caught earlier)
        let foundInAssigned = false;
        try {
          const assignedResponse = await fetch(`${baseURL}/ticket/assigned/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (assignedResponse.ok) {
            const assignedData = await assignedResponse.json();
            const tickets = assignedData.tickets || assignedData.data || assignedData;
            if (Array.isArray(tickets)) {
              const foundTicket = tickets.find(t => {
                const ticketIdMatch = t.ticket_id && t.ticket_id.toLowerCase() === actualTicketId.toLowerCase();
                const idMatch = t.id && (t.id === actualTicketId || t.id.toLowerCase() === actualTicketId.toLowerCase());
                return ticketIdMatch || idMatch;
              });
              if (foundTicket) {
                foundInAssigned = true;
                // Navigate to assigned page - will use TicketDetailsModal (from assigned.js)
                console.log('Navigating to assigned page - will open TicketDetailsModal');
                window.location.href = `/ticket/assigned?ticketId=${encodeURIComponent(actualTicketId)}`;
                return;
              }
            }
          }
        } catch (err) {
          console.error("Error checking assigned tickets:", err);
        }
        
        // If not found in assigned, search in in-progress tickets
        if (!foundInAssigned) {
          try {
            const inProgressResponse = await fetch(`${baseURL}/ticket/in-progress/${userId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (inProgressResponse.ok) {
              const inProgressData = await inProgressResponse.json();
              const tickets = inProgressData.tickets || inProgressData.data || inProgressData;
              if (Array.isArray(tickets)) {
                const foundTicket = tickets.find(t => {
                  const ticketIdMatch = t.ticket_id && t.ticket_id.toLowerCase() === actualTicketId.toLowerCase();
                  const idMatch = t.id && (t.id === actualTicketId || t.id.toLowerCase() === actualTicketId.toLowerCase());
                  return ticketIdMatch || idMatch;
                });
                if (foundTicket) {
                  // Navigate to in-progress page - will use TicketDetailsModal (from in-progress.js)
                  console.log('Navigating to in-progress page - will open TicketDetailsModal');
                  window.location.href = `/ticket/in-progress?ticketId=${encodeURIComponent(actualTicketId)}`;
                  return;
                }
              }
            }
          } catch (err) {
            console.error("Error checking in-progress tickets:", err);
          }
        }
        
        // If not found in either, default to assigned page
        // Will use TicketDetailsModal (from assigned.js)
        console.log('Navigating to assigned page (default) - will open TicketDetailsModal');
        window.location.href = `/ticket/assigned?ticketId=${encodeURIComponent(actualTicketId)}`;
      } else {
        // If no ticket ID found, open the modal as fallback
        // Uses: Notification Details Dialog (notificationDialogOpen)
        console.log('No ticket ID found - opening Notification Details Dialog');
        setSelectedNotification(notif);
        setNotificationDialogOpen(true);
      }
    } catch (err) {
      console.error("Error in handleNotificationClick:", err, notif);
      // Fallback: open modal if navigation fails
      setNotifDropdownOpen(false);
      setSelectedNotification(notif);
      setNotificationDialogOpen(true);
    }
  };

  const handleNotificationDialogClose = () => {
    setNotificationDialogOpen(false);
    setSelectedNotification(null);
  };

  const handleLogout = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.error("User ID is not available.");
        localStorage.removeItem("authToken");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
        localStorage.removeItem("tokenExpiration");
        localStorage.removeItem("agentStatus");
        localStorage.removeItem("activeSystem");
        clearDomainCredentials(); // Clear domain credentials
        window.location.href = "/";
        return;
      }
      const response = await fetch(`${baseURL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error("Failed to log out");
      }
      localStorage.removeItem("authToken");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      localStorage.removeItem("tokenExpiration");
      localStorage.removeItem("activeSystem");
      localStorage.removeItem("agentStatus");
      clearDomainCredentials(); // Clear domain credentials
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
      // Even if logout fails, clear local data
      localStorage.removeItem("authToken");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      localStorage.removeItem("tokenExpiration");
      localStorage.removeItem("activeSystem");
      localStorage.removeItem("agentStatus");
      clearDomainCredentials(); // Clear domain credentials
      window.location.href = "/";
    }
  };

  const canAccessCallCenter =
    role === "admin" ||
    role === "super-admin" ||
    role === "agent" ||
    role === "supervisor";
  const canAccessCRM =
    role === "admin" ||
    role === "super-admin" ||
    role === "agent" ||
    role === "attendee" ||
            role === "reviewer" ||
    role === "supervisor";

  const handleSystemSwitch = (system) => {
    localStorage.setItem("activeSystem", system); // Save active system to localStorage
    setActiveSystem(system);
  };

  const getActiveButtonClass = (system) => {
    return activeSystem === system ? "active-button" : "";
  };

  return (
    <nav className="navbar">
      <div className={`navbar-sidebar-brand ${isSidebarOpen ? "open" : "closed"}`}>
        <img src={logo} alt="Logo" className="navbar-logo" />
      </div>
      <div className={`navbar-left ${isSidebarOpen ? "open" : "closed"}`}>
        {isSidebarOpen ? (
          <RiMenuFoldLine className="menu-icon" onClick={toggleSidebar} />
        ) : (
          <RiMenuFold2Line className="menu-icon" onClick={toggleSidebar} />
        )}
        {canAccessCallCenter && (
          <Tooltip title="Call Center">
            <IconButton
              onClick={() => handleSystemSwitch("call-center")}
              className={getActiveButtonClass("call-center")}
            >
              <TfiLayoutMediaCenterAlt className="navbar-system-icons" />
            </IconButton>
          </Tooltip>
        )}
        {canAccessCRM && (
          <Tooltip title="Back Office">
            <IconButton
              onClick={() => handleSystemSwitch("crm")}
              className={getActiveButtonClass("crm")}
            >
              <BsFillTicketDetailedFill className="navbar-system-icons" />
            </IconButton>
          </Tooltip>
        )}
      </div>
      <div className="navbar-right">
        <button className="theme-button" onClick={toggleTheme}>
          {isDarkMode ? <LuSunMoon /> : <MdDarkMode />}
        </button>
        {/* Notification Bell with Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: "1rem", position: 'relative' }}>
          {/* Notification Bell */}
          <div
            className="navbar-notification-container"
            style={{
              cursor: "pointer",
              position: "relative"
            }}
            onClick={() => setNotifDropdownOpen((open) => !open)}
          >
            <Badge
              badgeContent={(() => {
                // Count individual notifications with messages (not unique tickets)
                let count = 0;
                
                if (notificationsData?.notifications && Array.isArray(notificationsData.notifications)) {
                  // Count all unread notifications (both assigned and with messages)
                  count = notificationsData.notifications.filter(n => {
                    return n.status === 'unread' || n.status === ' ';
                  }).length;
                  console.log('Navbar - notificationsData:', {
                    total: notificationsData.notifications.length,
                    unread: count
                  });
                }
                
                if (count === 0 && unreadCountData?.unreadCount) {
                  count = unreadCountData.unreadCount;
                  console.log('Navbar - Using unreadCountData fallback:', count);
                }
                
                console.log('Navbar - Final badge count:', count);
                return count;
              })()}
              color="error"
              invisible={(() => {
                let count = 0;
                if (notificationsData?.notifications && Array.isArray(notificationsData.notifications)) {
                  // Count all unread notifications (both assigned and with messages)
                  count = notificationsData.notifications.filter(n => {
                    return n.status === 'unread' || n.status === ' ';
                  }).length;
                }
                if (count === 0 && unreadCountData?.unreadCount) {
                  count = unreadCountData.unreadCount;
                }
                const shouldHide = count === 0;
                console.log('Navbar - Badge invisible:', shouldHide, 'count:', count);
                return shouldHide;
              })()}
              sx={{
                "& .MuiBadge-badge": {
                  backgroundColor: "#ff0000 !important",
                  color: "white !important",
                  fontWeight: "bold",
                  fontSize: "0.65rem",
                  minWidth: "18px",
                  height: "18px",
                  borderRadius: "9px",
                  top: "0px",
                  right: "16px",
                  zIndex: 10,
                  display: "flex !important",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid white",
                  transform: "translate(50%, -50%)"
                }
              }}
            >
              <IoMdNotificationsOutline 
                size={24} 
                className="navbar-icon" 
                style={{ color: 'var(--active-color, #7b2cbf)', display: 'block' }}
              />
            </Badge>
          </div>
          {notifDropdownOpen && (
            <div className="navbar-notification-dropdown">
              {/* Notification Type Counts Header */}
              {(() => {
                const taggedCount = notificationsData?.notifications?.filter(n => {
                  // Tagged Message: unread, for current user, message contains "mentioned you" or "@" in comment
                  // Navbar counts ALL notifications (not distinct tickets)
                  // Works for all users including reviewers
                  const isUnread = n.status === 'unread' || n.status === ' ';
                  const isForCurrentUser = String(n.recipient_id) === String(userId);
                  if (!isForCurrentUser || !isUnread) return false;
                  
                  // Check message and comment for tagged indicators
                  const messageText = (n.message || '').toLowerCase();
                  const commentText = (n.comment || '').toLowerCase();
                  
                  // Check for "mentioned you" in message or "@" in comment
                  // Message format: "John Doe mentioned you in a ticket update for Ticket WCF-CC-..."
                  const hasMentionedYou = messageText.includes('mentioned you');
                  const hasAtSymbol = commentText.includes('@');
                  
                  return hasMentionedYou || hasAtSymbol;
                }).length || 0;
                
                const notifiedCount = notificationsData?.notifications?.filter(n => {
                  // Notified: unread, for current user, not tagged, not assigned, and not reversed
                  // Navbar counts ALL notifications (not distinct tickets)
                  const isUnread = n.status === 'unread' || n.status === ' ';
                  // Use String conversion for type-safe comparison (consistent with listing logic)
                  const isForCurrentUser = String(n.recipient_id) === String(userId);
                  if (!isForCurrentUser || !isUnread) return false;
                  
                  const messageText = (n.message || n.comment || '').toLowerCase();
                  const commentText = (n.comment || '').toLowerCase();
                  
                  // Check if it's tagged
                  const isTagged = messageText.includes('mentioned you') || commentText.includes('@');
                  
                  // Check if it's reversed (ticket status indicates reversal)
                  // Use same logic as listing: simple check if ticket is reversed (consistent with listing logic)
                  const ticketStatus = n.ticket?.status || '';
                  const isReversedTicket = ticketStatus.toLowerCase() === 'reversed';
                  // For notified count, exclude reversed tickets (same as listing logic)
                  const isReversed = isReversedTicket && !isTagged;
                  
                  // Check if it's assigned (only by message text, not ticket status)
                  const isAssignedByText = (messageText.includes('assigned to you') || 
                                           messageText.includes('forwarded to you') ||
                                           messageText.includes('reassigned to you')) && !isTagged && !isReversed;
                  
                  // Notified: not tagged, not assigned, and not reversed
                  return !isTagged && !isAssignedByText && !isReversed;
                }).length || 0;
                
                // Separate reversed and assigned counts
                const reversedCountLocal = notificationsData?.notifications?.filter(n => {
                  const isUnread = n.status === 'unread' || n.status === ' ';
                  // Use String conversion for type-safe comparison (consistent with listing logic)
                  const isForCurrentUser = String(n.recipient_id) === String(userId);
                  if (!isForCurrentUser || !isUnread) return false;
                  
                  // Simple check: if ticket is reversed, count it (case-insensitive, no need to check message text)
                  const ticketStatus = n.ticket?.status || '';
                  const isReversedTicket = ticketStatus.toLowerCase() === 'reversed';
                  
                  return isReversedTicket;
                }).length || 0;
                
                // For reviewers: use assignedCount state (tickets count)
                // For other users: count assignment notifications
                const userRole = localStorage.getItem('role');
                let assignedCountLocal = 0;
                
                if (userRole === 'reviewer') {
                  // For reviewers: use assignedCount state variable (fetched from assigned tickets endpoint)
                  assignedCountLocal = assignedCount || 0;
                } else {
                  // For other users: count assignment notifications
                  assignedCountLocal = notificationsData?.notifications?.filter(n => {
                    // Use status and recipient_id instead of text matching for better reliability
                    const isUnread = n.status === 'unread' || n.status === ' ';
                    // Use String conversion for type-safe comparison (consistent with listing logic)
                    const isForCurrentUser = String(n.recipient_id) === String(userId);
                    
                    // Check if notification is for current user and unread
                    if (!isForCurrentUser || !isUnread) return false;
                    
                    // Check message text for assignment indicators (excluding reversed)
                    const messageText = (n.message || '').toLowerCase();
                    const isReversedByText = messageText.includes('reversed back to you') ||
                                            messageText.includes('reversed to you') ||
                                            messageText.includes('Ticket details updated') ||
                                            (messageText.includes('has been reversed') && messageText.includes('to'));
                    
                    // Exclude reversed notifications from assigned count
                    if (isReversedByText) return false;
                    
                    // Check message text for assignment indicators
                    const isAssignedByText = messageText.includes('assigned to you') || 
                                           messageText.includes('forwarded to you') ||
                                           messageText.includes('reassigned to you');
                    
                    // Also check category for assignment-related categories
                    // Categories like "Assigned", "Forwarded", "Converted" indicate assignment
                    const assignmentCategories = ['Assigned', 'Forwarded', 'Converted'];
                    const isAssignedByCategory = assignmentCategories.includes(n.category);
                    
                    // Assigned if message text indicates assignment OR category indicates assignment
                    // Many "Notified" notifications have tickets with "Assigned" status, so we check both message and category
                    return isAssignedByText || isAssignedByCategory;
                  }).length || 0;
                }
                
                console.log('Notification counts:', { taggedCount, notifiedCount, assignedCount: assignedCountLocal, reversedCount: reversedCountLocal, total: notificationsData?.notifications?.length });
                
                return (
                  <div style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: '#f5f5f5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                      {/* Always show Tagged badge, even if count is 0 */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '4px 8px',
                        backgroundColor: '#e8f5e9',
                        borderRadius: '4px',
                        opacity: taggedCount > 0 ? 1 : 0.6
                      }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#4caf50' }}>
                          Tagged: {taggedCount}
                        </span>
                      </div>
                      {/* Always show Notified badge, even if count is 0 */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '4px 8px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '4px',
                        opacity: notifiedCount > 0 ? 1 : 0.6
                      }}>
                        <IoMdNotificationsOutline style={{ fontSize: '16px', color: '#2196f3' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#2196f3' }}>
                          Notified: {notifiedCount}
                        </span>
                      </div>
                      {/* Always show Reversed badge, even if count is 0 */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '4px 8px',
                        backgroundColor: '#ffebee',
                        borderRadius: '4px',
                        opacity: reversedCountLocal > 0 ? 1 : 0.6
                      }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#f44336' }}>
                          Reversed: {reversedCountLocal}
                        </span>
                      </div>
                      {/* Always show Assigned badge, even if count is 0 */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '4px 8px',
                        backgroundColor: '#fff3e0',
                        borderRadius: '4px',
                        opacity: assignedCountLocal > 0 ? 1 : 0.6
                      }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#ff9800' }}>
                          Assigned: {assignedCountLocal}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
              {/* Mark All as Read Button */}
              {notificationsData?.notifications?.some(n => n.status === 'unread') && (
                <div style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #e0e0e0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  backgroundColor: '#f5f5f5'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsReadMutation.mutate();
                    }}
                    disabled={markAllAsReadMutation.isLoading}
                    style={{
                      background: 'transparent',
                      border: '1px solid #1976d2',
                      color: '#1976d2',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      cursor: markAllAsReadMutation.isLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      opacity: markAllAsReadMutation.isLoading ? 0.6 : 1
                    }}
                  >
                    {markAllAsReadMutation.isLoading ? 'Marking...' : 'Mark all as read'}
                  </button>
                </div>
              )}
              {!notificationsData?.notifications?.length ? (
                <div className="notification-empty">No notifications</div>
              ) : (
                notificationsData.notifications.map((notif) => {
                  // Extract ticket ID from message if available, or use ticket_id from notification
                  // Try multiple patterns: "ID: WCF-CC-708934", "(WCF-CC-708934)", or direct ticket_id
                  let ticketId = 'N/A';
                  let cleanedMessage = notif.message || '';
                  let subjectFromMessage = '';
                  
                  if (notif.ticket_id) {
                    // If ticket_id is a UUID, try to get the actual ticket number from ticket object
                    ticketId = notif.ticket?.ticket_id || notif.ticket_id;
                  }
                  
                  // Extract subject from message (part after colon)
                  // Example: "New Inquiry ticket assigned to you: Pension Payment" -> "Pension Payment"
                  if (notif.message) {
                    const colonIndex = notif.message.indexOf(':');
                    if (colonIndex !== -1 && colonIndex < notif.message.length - 1) {
                      subjectFromMessage = notif.message.substring(colonIndex + 1).trim();
                      // Remove ticket ID patterns from subject if present
                      if (ticketId !== 'N/A') {
                        const escapedTicketId = ticketId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        subjectFromMessage = subjectFromMessage
                          .replace(new RegExp(`\\b${escapedTicketId}\\b`, 'gi'), '')
                          .replace(/\(ID:\s*[A-Z0-9-]+\)/gi, '')
                          .replace(/\([A-Z0-9-]+\)/g, '')
                          .trim();
                      }
                      // Also remove the subject from cleanedMessage so it doesn't appear in the message row
                      if (subjectFromMessage) {
                        cleanedMessage = cleanedMessage.replace(new RegExp(`:\\s*${subjectFromMessage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi'), '').trim();
                      }
                    }
                  }
                  
                  // Always try to extract ticket ID from message and clean it
                  if (notif.message) {
                    // Try to extract from message - check multiple patterns
                    const idPatterns = [
                      /ID:\s*([A-Z0-9-]+)/i,
                      /\(ID:\s*([A-Z0-9-]+)\)/i,
                      /\(([A-Z0-9-]+)\)/,
                      /(WCF-[A-Z0-9-]+)/i
                    ];
                    
                    let extractedId = null;
                    for (const pattern of idPatterns) {
                      const match = notif.message.match(pattern);
                      if (match) {
                        extractedId = match[1] || match[0];
                        // Check if it looks like a ticket ID (WCF- pattern or similar)
                        if (extractedId.match(/^WCF-[A-Z0-9-]+$/i) || extractedId.match(/^[A-Z]{2,4}-[A-Z]{2}-[0-9]+$/i)) {
                          ticketId = extractedId;
                          break;
                        }
                      }
                    }
                    
                    // Clean message - remove ticket ID patterns more aggressively
                    cleanedMessage = notif.message;
                    
                    if (ticketId !== 'N/A' && ticketId !== null && ticketId !== undefined) {
                      // Escape special regex characters in ticket ID
                      const escapedTicketId = ticketId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                      
                      // Remove patterns with ticket ID
                      cleanedMessage = cleanedMessage
                        // Remove (ID: WCF-CC-708934) pattern
                        .replace(/\(ID:\s*[A-Z0-9-]+\)/gi, '')
                        // Remove (WCF-CC-708934) pattern - be more specific
                        .replace(new RegExp(`\\(${escapedTicketId}\\)`, 'gi'), '')
                        // Remove ID: WCF-CC-708934 pattern (with or without parentheses)
                        .replace(new RegExp(`ID:\\s*${escapedTicketId}`, 'gi'), '')
                        // Remove standalone ticket ID (word boundary)
                        .replace(new RegExp(`\\b${escapedTicketId}\\b`, 'gi'), '')
                        // Remove any remaining (WCF-CC-XXXXX) patterns
                        .replace(/\(WCF-[A-Z0-9-]+\)/gi, '')
                        // Remove any WCF- pattern at end of line or before punctuation
                        .replace(/WCF-[A-Z0-9-]+(?=\s|$|\)|,|\.)/gi, '')
                        // Clean up extra spaces and colons
                        .replace(/\s+/g, ' ')
                        .replace(/\s*:\s*/g, ': ')
                        .replace(/\s*\(\s*/g, '')
                        .replace(/\s*\)\s*/g, '')
                        .replace(/\s*,\s*/g, '')
                        .trim();
                    }
                  }
                  
                  // Format notification date - try multiple date fields
                  const dateValue = notif.created_at || notif.createdAt || notif.date;
                  const notificationDate = dateValue 
                    ? new Date(dateValue).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      })
                    : 'N/A';
                  
                  // Format assignment date - try multiple fields
                  // Use notification created_at as fallback since notifications are created when tickets are assigned
                  const assignmentDateValue = notif.ticket?.assigned_at || 
                                            notif.ticket?.updated_at ||
                                            notif.assigned_at ||
                                            notif.assignment_date ||
                                            notif.created_at ||  // Fallback to notification creation date
                                            notif.createdAt;     // Alternative field name
                  const assignmentDate = assignmentDateValue 
                    ? new Date(assignmentDateValue).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      })
                    : null;
                  
                  // Format ticket created date - try multiple sources
                  const ticketCreatedDateValue = notif.ticket?.created_at || 
                                                notif.ticket?.createdAt ||
                                                notif.ticket?.date_created ||
                                                notif.ticket?.createdAt ||
                                                notif.created_at ||  // Fallback to notification created_at if ticket not available
                                                notif.createdAt;
                  const ticketCreatedDate = ticketCreatedDateValue 
                    ? new Date(ticketCreatedDateValue).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      })
                    : null;
                  
                  // Determine notification type based on fields:
                  // 1. Tagged Message: message contains "mentioned you"
                  // 2. Assigned: message contains "assigned to you" (and not tagged)
                  // 3. Notified: has comment (not null), status unread, not tagged, and not assigned
                  const hasComment = notif.comment !== null && notif.comment !== undefined && String(notif.comment).trim() !== '';
                  const messageText = (notif.message || '').toLowerCase();
                  const commentText = (notif.comment || '').toLowerCase();
                  const isUnread = notif.status === 'unread' || notif.status === ' ';
                  
                  // Tagged Message: message says "mentioned you" OR comment contains "@"
                  // Check both message and comment for tagged indicators (consistent with count logic)
                  const isTaggedMessage = messageText.includes('mentioned you') || commentText.includes('@');
                  
                  // Assigned: Use status, recipient_id, and ticket status instead of just text matching
                  // Check if notification is for current user and unread
                  // Use String conversion for type-safe comparison (consistent with count logic)
                  const isForCurrentUser = String(notif.recipient_id) === String(userId);
                  
                  // Simple check: if ticket is reversed, count it as reversed (case-insensitive, no need to check message text)
                  const ticketStatus = notif.ticket?.status || '';
                  const isReversedTicket = ticketStatus.toLowerCase() === 'reversed';
                  
                  // Count as reversed if ticket is reversed (simple check like backend)
                  const isReversed = isForCurrentUser && isUnread && isReversedTicket && !isTaggedMessage;
                  
                  // Check message text for assignment (excluding reversed messages)
                  // Only check message text - don't use ticket status as it's too broad (many tickets have "Assigned" status)
                  const isAssignedByText = (messageText.includes('assigned to you') || 
                                           messageText.includes('forwarded to you') ||
                                           messageText.includes('reassigned to you')) && !isTaggedMessage && !isReversed;
                  
                  // Assigned ONLY if: (1) for current user AND (2) unread AND (3) message explicitly indicates assignment AND (4) not reversed
                  // Don't use ticket status as it's too broad - many "Notified" notifications have tickets with "Assigned" status
                  const isAssigned = isForCurrentUser && isUnread && isAssignedByText && !isReversed;
                  
                  // Notified: unread, for current user, not tagged, not assigned, and not reversed (with or without comment)
                  // This matches the count logic - any notification that doesn't fit other categories becomes "Notified"
                  const isNotified = isForCurrentUser && isUnread && !isTaggedMessage && !isAssigned && !isReversed;
                  
                  let notificationType;
                  let badgeColor;
                  
                  if (isTaggedMessage) {
                    notificationType = 'Tagged Message';
                    badgeColor = '#4caf50'; // Green
                  } else if (isReversed) {
                    notificationType = 'Reversed';
                    badgeColor = '#f44336'; // Red
                  } else if (isAssigned) {
                    notificationType = 'Assigned';
                    badgeColor = '#ff9800'; // Orange
                  } else if (isNotified) {
                    // Notified: unread, for current user, not tagged, not assigned, and not reversed (with or without comment)
                    notificationType = 'Notified';
                    badgeColor = '#2196f3'; // Blue
                  } else {
                    // Default/Other: no specific type - also show as Notified
                    notificationType = 'Notified';
                    badgeColor = '#2196f3'; // Blue
                  }
                  
                  return (
                    <div
                      key={notif.id}
                      className={`notification-item ${notif.status === "unread" ? "unread" : " "}`}
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      {/* Notification Type Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: badgeColor,
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.65rem',
                        fontWeight: '600',
                        zIndex: 1
                      }}>
                        {notificationType}
                      </div>
                      
                      {/* Row 1: Assigned at and Date of Assignment */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginTop: '8px', // Small gap below badge
                        marginBottom: '4px',
                        fontSize: '0.7rem',
                        color: '#666',
                        width: '100%'
                      }}>
                        <span style={{ 
                          fontSize: '0.7rem',
                          color: '#666',
                          fontWeight: '500',
                          minWidth: '80px'
                        }}>
                          Assigned at:
                        </span>
                        <span style={{ 
                          fontSize: '0.7rem',
                          color: '#666',
                          whiteSpace: 'nowrap',
                          textAlign: 'right'
                        }}>
                          {assignmentDate || notificationDate}
                        </span>
                      </div>
                      
                      {/* Row 2: Created at (Ticket Creation Date) */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '4px',
                        fontSize: '0.7rem',
                        color: '#666',
                        width: '100%',
                        paddingRight: '80px' // Add padding to prevent badge from covering dates
                      }}>
                        <span style={{ 
                          fontSize: '0.7rem',
                          color: '#666',
                          fontWeight: '500',
                          minWidth: '80px'
                        }}>
                          Created at:
                        </span>
                        <span style={{ 
                          fontSize: '0.7rem',
                          color: '#666',
                          whiteSpace: 'nowrap',
                          textAlign: 'right'
                        }}>
                          {ticketCreatedDate || notificationDate || 'N/A'}
                        </span>
                      </div>
                      
                      {/* Row 3: Ticket Number */}
                      {ticketId !== 'N/A' && (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                          fontSize: '0.7rem',
                          color: '#666',
                          width: '100%'
                        }}>
                          <span style={{ 
                            fontSize: '0.7rem',
                            color: '#666',
                            fontWeight: '500',
                            minWidth: '80px'
                          }}>
                            Ticket Number:
                          </span>
                          <span style={{ 
                            backgroundColor: '#e3f2fd',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            color: '#1976d2',
                            fontWeight: '600',
                            fontSize: '0.7rem',
                            whiteSpace: 'nowrap',
                            textAlign: 'right'
                          }}>
                            {ticketId}
                          </span>
                        </div>
                      )}
                      
                      {/* Row 4: Subject (from message) - Aligned right like dates */}
                      {(subjectFromMessage || notif.ticket?.subject || notif.subject) && (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                          fontSize: '0.7rem',
                          color: '#666',
                          width: '100%'
                        }}>
                          <span style={{ 
                            fontSize: '0.7rem',
                            color: '#666',
                            fontWeight: '500',
                            minWidth: '80px'
                          }}>
                            Subject:
                          </span>
                          <span style={{ 
                            fontSize: '0.7rem',
                            color: '#333',
                            fontWeight: '500',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textAlign: 'right',
                            maxWidth: '60%'
                          }}>
                            {subjectFromMessage || notif.ticket?.subject || notif.subject}
                          </span>
                        </div>
                      )}
                      {/* Row 5: Category */}
                      {(notif.category || notif.ticket?.category || notif.type) && (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                          fontSize: '0.7rem',
                          color: '#666',
                          width: '100%'
                        }}>
                          <span style={{ 
                            fontSize: '0.7rem',
                            color: '#666',
                            fontWeight: '500',
                            minWidth: '80px'
                          }}>
                            Category:
                          </span>
                          <span style={{ 
                            fontSize: '0.7rem',
                            color: '#1976d2',
                            fontWeight: '500',
                            backgroundColor: '#e3f2fd',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                            textAlign: 'right'
                          }}>
                            {notif.category || notif.ticket?.category || notif.type}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
        <div className="navbar-profile-container">
          <span className="navbar-profile">
            <MdPerson className="navbar-profile-icon" />
            {username}, {role}
          </span>
          <div className="navbar-dropdown-menu">
            <button
              className="navbar-service-button active"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="menu-icon" /> Logout
            </button>
            <button
              className="navbar-service-button"
              onClick={() => {
                console.log("Settings");
              }}
            >
              <FaCog className="menu-icon" /> Settings
            </button>
          </div>
        </div>
      </div>
      <ReviewerActionModal
        open={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        ticket={modalTicket}
        categories={categories}
        units={units}
        convertCategory={convertCategory}
        forwardUnit={forwardUnit}
        handleCategoryChange={handleCategoryChange}
        handleUnitChange={handleUnitChange}
        handleConvertOrForward={handleConvertOrForward}
        handleRating={handleRating}
      />
      {console.log("Modal open:", isActionModalOpen, "Ticket:", modalTicket)}
      <Dialog open={ratingDialogOpen} onClose={handleRatingDialogClose}>
        <DialogTitle>Rate Ticket</DialogTitle>
        <DialogContent>
          <Rating
            value={currentRating}
            onChange={(event, newValue) => {
              setCurrentRating(newValue);
            }}
            precision={0.5}
            size="large"
            style={{ marginBottom: '20px' }}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            label="Comments (optional)"
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRatingDialogClose}>Cancel</Button>
          <Button onClick={handleRatingSubmit} variant="contained" color="primary">
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>
      {/* Update Notification Message Dialog */}
      <Dialog 
        open={notificationDialogOpen} 
        onClose={handleNotificationDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: '12px',
            padding: '8px'
          }
        }}
      >
        <DialogTitle style={{ 
          padding: '20px 24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600',
            color: '#1976d2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Notification Details</span>
            {selectedNotification && (
              <span style={{ 
                fontSize: '0.75rem',
                backgroundColor: '#1976d2',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '16px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Selected Notification
              </span>
            )}
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span style={{ 
              backgroundColor: '#e3f2fd',
              padding: '4px 8px',
              borderRadius: '4px',
              color: '#1976d2',
              fontWeight: '500'
            }}>
              {selectedNotification?.category || selectedNotification?.type}
            </span>
            <span style={{ color: '#666' }}>
              {selectedNotification?.created_at && new Date(selectedNotification.created_at)
                .toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true
                })}
            </span>
            {/* {selectedNotification?.id && (
              <span style={{ 
                fontSize: '0.7rem',
                color: '#999',
                fontFamily: 'monospace'
              }}>
                ID: {selectedNotification.id.substring(0, 8)}...
              </span>
            )} */}
          </div>
          {selectedNotification?.message && (
            <div style={{ 
              marginTop: '8px',
              padding: '12px',
              backgroundColor: '#f5f5f5',
              borderRadius: '6px',
              border: '1px solid #e0e0e0',
              textAlign: 'left'
            }}>
              <div style={{ 
                fontSize: '0.75rem',
                color: '#666',
                marginBottom: '4px',
                fontWeight: '500',
                textAlign: 'left'
              }}>
                Notification Message:
              </div>
              <div style={{ 
                fontSize: '0.875rem',
                color: '#333',
                lineHeight: '1.5',
                textAlign: 'left'
              }}>
                {selectedNotification.message}
              </div>
            </div>
          )}
        </DialogTitle>
        <DialogContent style={{ padding: '24px' }}>
          {/* Ticket Details Section */}
          {ticketDetailsData?.ticket && (
            <div style={{ 
              padding: '16px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              marginBottom: '16px'
            }}>
              <div style={{ 
                fontWeight: '600',
                color: '#1976d2',
                marginBottom: '12px',
                fontSize: '0.875rem'
              }}>
                Ticket Information
              </div>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '8px',
                fontSize: '0.875rem'
              }}>
                <span style={{ color: '#666' }}>Phone Number:</span>
                <span style={{ color: '#333', fontWeight: '500' }}>
                  {ticketDetailsData.ticket.phone_number || 'N/A'}
                </span>
                <span style={{ color: '#666' }}>NIDA Number:</span>
                <span style={{ color: '#333', fontWeight: '500' }}>
                  {ticketDetailsData.ticket.nida_number || 'N/A'}
                </span>
                <span style={{ color: '#666' }}>Ticket ID:</span>
                <span style={{ color: '#333', fontWeight: '500' }}>
                  {ticketDetailsData.ticket.ticket_id || 'N/A'}
                </span>
                <span style={{ color: '#666' }}>Reporter Name:</span>
                <span style={{ color: '#333', fontWeight: '500' }}>
                  {(() => {
                    const t = ticketDetailsData.ticket || {};
                    const fullName = `${t.first_name || ''} ${t.middle_name || ''} ${t.last_name || ''}`.trim();
                    return fullName || t.institution || t.requester || 'N/A';
                  })()}
                </span>
                <span style={{ color: '#666' }}>Ticket Category:</span>
                <span style={{ color: '#333', fontWeight: '500' }}>
                  {ticketDetailsData.ticket.category || 'N/A'}
                </span>
                <span style={{ color: '#666' }}>Ticket Description:</span>
                <span style={{ color: '#333', fontWeight: '500' }}>
                  {ticketDetailsData.ticket.description || 'N/A'}
                </span>
                <span style={{ color: '#666' }}>Date Created:</span>
                <span style={{ color: '#333', fontWeight: '500' }}>
                  {ticketDetailsData.ticket.created_at 
                    ? new Date(ticketDetailsData.ticket.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })
                    : 'N/A'}
                </span>
                
                {/* Link to open assigned ticket page */}
                <div style={{ 
                  marginTop: '12px',
                  padding: '8px 12px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '6px',
                  border: '1px solid #bbdefb'
                }}>
                  <a
                    href={`/ticket/assigned`}
                    style={{
                      color: '#1976d2',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  >
                    📋 Open Assigned Tickets Page
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* All Notifications Section */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ 
              fontWeight: '600',
              color: '#1976d2',
              marginBottom: '12px',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>All Notifications</span>
              <span style={{ 
                fontSize: '0.75rem',
                backgroundColor: '#e3f2fd',
                padding: '2px 8px',
                borderRadius: '12px',
                color: '#1976d2'
              }}>
                {ticketNotificationsData?.notifications?.length || 0} notifications
              </span>
            </div>
            {!ticketNotificationsData?.notifications?.length ? (
              <div style={{ 
                padding: '16px',
                textAlign: 'center',
                color: '#666',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                No notifications found for this ticket
              </div>
            ) : (
              <div style={{ 
                maxHeight: '400px',
                overflowY: 'auto',
                border: '1px solid #e0e0e0',
                borderRadius: '8px'
              }}>
                {ticketNotificationsData.notifications.map((notif, index) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: '16px',
                      borderBottom: index < ticketNotificationsData.notifications.length - 1 ? '1px solid #e0e0e0' : 'none',
                      backgroundColor: notif.id === selectedNotification?.id ? '#e3f2fd' : '#fff',
                      borderLeft: notif.id === selectedNotification?.id ? '4px solid #1976d2' : '4px solid transparent',
                      position: 'relative'
                    }}
                  >
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontSize: '0.75rem',
                          color: '#666'
                        }}>
                          {notif.created_at && new Date(notif.created_at)
                            .toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true
                            })}
                        </span>
                        {notif.id === selectedNotification?.id && (
                          <span style={{ 
                            fontSize: '0.7rem',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Currently Selected
                          </span>
                        )}
                      </div>
                      <span style={{ 
                        fontSize: '0.75rem',
                        color: notif.status === 'unread' ? '#1976d2' : '#666',
                        fontWeight: notif.status === 'unread' ? '500' : 'normal'
                      }}>
                        {notif.status === 'unread' ? 'Unread' : 'Read'}
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem',
                      color: '#333',
                      marginBottom: '8px',
                      lineHeight: '1.5'
                    }}>
                      {notif.message}
                    </div>
                    {notif.comment && (
                      <div style={{ 
                        fontSize: '0.75rem',
                        color: '#666',
                        fontStyle: 'italic',
                        padding: '8px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        marginTop: '8px'
                      }}>
                        {notif.comment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions style={{ 
          padding: '16px 24px',
          borderTop: '1px solid #e0e0e0'
        }}>
          <Button 
            onClick={handleNotificationDialogClose}
            variant="contained"
            color="primary"
            style={{
              textTransform: 'none',
              borderRadius: '8px',
              padding: '8px 24px'
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </nav>
  );
}
