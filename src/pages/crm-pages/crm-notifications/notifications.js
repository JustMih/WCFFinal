import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FaEye, FaPlus, FaBell } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Modal,
  Snackbar,
  Tooltip,
  Typography,
  TextField,
  Avatar,
  Paper,
  Badge,
} from "@mui/material";
// import ColumnSelector from "../../../components/colums-select/ColumnSelector";
import { baseURL } from "../../../config";
import "./notifications.css";
import ChatIcon from '@mui/icons-material/Chat';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import TicketDetailsModal from '../../../components/TicketDetailsModal';
import Pagination from '../../../components/Pagination';
import { useQueryClient } from "@tanstack/react-query";
import TableControls from "../../../components/TableControls";
import TicketFilters from '../../../components/ticket/TicketFilters';
import {
  useCrmNotificationFeed,
  useCrmTicketNotificationHistory,
  useCrmUserNotifications,
  useMarkNotificationRead,
  useMarkManyNotificationsRead,
} from "../../../api/wcfNotificationQueries";

export default function Crm() {
  const [searchParams, setSearchParams] = useSearchParams();
  const notificationType = searchParams.get('type') || 'notified'; // Default to 'notified'
  
  // Set default type parameter if missing
  useEffect(() => {
    if (!searchParams.get('type')) {
      setSearchParams({ type: 'notified' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  
  const [agentTickets, setAgentTickets] = useState([]);
  const [agentTicketsError, setAgentTicketsError] = useState(null);
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isTicketDetailsModalOpen, setIsTicketDetailsModalOpen] = useState(false);
  const [wasTicketModalOpen, setWasTicketModalOpen] = useState(false); // Track if ticket modal was open before notification modal
  const [originalTicket, setOriginalTicket] = useState(null); // Store original ticket when opening notification modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [comments, setComments] = useState("");
  const [modal, setModal] = useState({ isOpen: false, type: "", message: "" });
  const [activeColumns, setActiveColumns] = useState([
    "ticket_id",
    "createdAt",
    "employee",
    "employer",
    "phone_number",
    "region",
    "status"
  ]);
  const [loading, setLoading] = useState(true);
  const [notifiedCount, setNotifiedCount] = useState(0);
  const [taggedCount, setTaggedCount] = useState(0);
  const [showType, setShowType] = useState('manual'); // 'manual' or 'system'
  const [filters, setFilters] = useState({
    search: '',
    nidaSearch: '',
    status: '',
    priority: '',
    category: '',
    startDate: null,
    endDate: null,
  });

  const queryClient = useQueryClient();

  // TanStack: CRM notifications feed (list view) + counts (badges) + per-ticket history
  const {
    data: feedNotifications = [],
    isLoading: isLoadingFeed,
    error: feedError,
    refetch: refetchFeed,
  } = useCrmNotificationFeed(userId, { enabled: Boolean(userId) });

  const { data: allUserNotifications = [] } = useCrmUserNotifications(userId, {
    enabled: Boolean(userId),
  });

  const ticketIdForHistory =
    selectedTicket?.ticket?.id || selectedTicket?.ticket_id || selectedTicket?.id;

  const { data: notificationHistory, isLoading: isLoadingHistory } =
    useCrmTicketNotificationHistory(
      { ticketId: ticketIdForHistory, userId },
      { enabled: Boolean(ticketIdForHistory) && Boolean(userId) }
    );

  const markReadMutation = useMarkNotificationRead(userId);
  const markManyReadMutation = useMarkManyNotificationsRead(userId);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setUserId(userId);
      console.log("user id is:", userId);
      
      // Listen for localStorage changes (for cross-tab sync)
      const handleStorageChange = (e) => {
        if (e.key === 'notificationCount') {
          setNotifiedCount(parseInt(e.newValue || '0', 10));
        }
        if (e.key === 'taggedCount') {
          setTaggedCount(parseInt(e.newValue || '0', 10));
        }
      };
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    } else {
      setAgentTicketsError("User not authenticated. Please log in.");
      setLoading(false);
    }
  }, []);

  // Counts are now derived from TanStack Query (auto-updated), but we still write to localStorage
  // so CRM sidebar / other widgets that rely on localStorage keep working.
  useEffect(() => {
    if (!userId) return;

    const notifications = Array.isArray(allUserNotifications) ? allUserNotifications : [];

    const tagged = notifications.filter((n) => {
      const msgText = (n.message || "").toLowerCase();
      const isUnread = n.status === "unread" || n.status === " ";
      const isForCurrentUser = String(n.recipient_id) === String(userId);
      return msgText.includes("mentioned you") && isUnread && isForCurrentUser;
    }).length;

    const notified = notifications.filter((n) => {
      const isUnread = n.status === "unread" || n.status === " ";
      const isForCurrentUser = String(n.recipient_id) === String(userId);
      if (!isForCurrentUser || !isUnread) return false;

      const messageText = (n.message || n.comment || "").toLowerCase();
      const isTagged = messageText.includes("mentioned you");
      const isReversedTicket = n.ticket?.status === "Reversed" || n.ticket?.status === "reversed";
      const isReversedByText =
        messageText.includes("reversed back to you") ||
        messageText.includes("reversed to you") ||
        (messageText.includes("has been reversed") && messageText.includes("to"));
      const isReversed = isReversedTicket && isReversedByText;
      const isAssignedByText =
        (messageText.includes("assigned to you") ||
          messageText.includes("forwarded to you") ||
          messageText.includes("reassigned to you")) &&
        !isTagged &&
        !isReversed;

      return !isTagged && !isAssignedByText && !isReversed;
    }).length;

    setNotifiedCount(notified);
    setTaggedCount(tagged);
    localStorage.setItem("notificationCount", String(notified));
    localStorage.setItem("taggedCount", String(tagged));
  }, [allUserNotifications, userId]);

  // Keep legacy local state in sync with TanStack query results (minimal churn)
  useEffect(() => {
    if (!userId) return;
    if (feedError) {
      setAgentTicketsError(feedError.message || "Failed to load notifications");
      setLoading(false);
      return;
    }
    if (!isLoadingFeed) {
      setAgentTickets(feedNotifications);
      setAgentTicketsError(null);
      setLoading(false);
    }
  }, [userId, feedNotifications, isLoadingFeed, feedError]);

  // Debug: Log modal state changes
  useEffect(() => {
    if (isTicketDetailsModalOpen) {
      console.log('TicketDetailsModal should be open:', { isTicketDetailsModalOpen, hasTicket: !!selectedTicket });
    }
  }, [isTicketDetailsModalOpen, selectedTicket]);

  // NOTE: fetching moved to TanStack Query (useCrmNotificationFeed)

  const handleCommentsChange = (e) => {
    setComments(e.target.value);
  };

  const handleCommentsSubmit = async () => {
    if (!selectedTicket) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${baseURL}/ticket/update/${selectedTicket.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ comments })
        }
      );

      if (response.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: "Comments updated successfully."
        });
        refetchFeed();
      } else {
        const data = await response.json();
        setModal({
          isOpen: true,
          type: "error",
          message: data.message || "Failed to update comments."
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        message: `Network error: ${error.message}`
      });
    }
  };

  const openModal = async (ticket) => {
    // Note: 'ticket' here is actually a notification object with a 'ticket' property
    console.log('openModal called with:', ticket);
    
    // Check if this is a tagged message - check both notification and ticket level
    // Also check if we're in the tagged view (notificationType === 'tagged')
    const messageText = (ticket.message || ticket.comment || ticket.ticket?.message || '').toLowerCase();
    const commentText = (ticket.comment || ticket.ticket?.comment || '').toLowerCase();
    const isTaggedByContent = messageText.includes('mentioned you') || commentText.includes('@');
    const isTagged = isTaggedByContent || notificationType === 'tagged';
    
    console.log('Tagged check:', { messageText, commentText, isTaggedByContent, notificationType, isTagged });
    
    // Mark the notification as read if it's unread
    const notificationId = ticket.id; // This is the notification ID
    const notificationStatus = ticket.status;
    
    if (notificationId && notificationStatus === 'unread') {
      try {
        await markReadMutation.mutateAsync(notificationId);
          // Update notification status locally
          ticket.status = 'read';
          
          // Check if this is a tagged message to update tagged count
          const messageText = (ticket.message || ticket.comment || '').toLowerCase();
          const isTaggedMsg = messageText.includes('mentioned you');
          
          // Decrease notification count (for notified messages)
          if (!isTaggedMsg && notifiedCount > 0) {
            const newCount = Math.max(0, notifiedCount - 1);
            setNotifiedCount(newCount);
            localStorage.setItem('notificationCount', newCount.toString());
          }
          
          // Dispatch custom event to update sidebar (this will refresh all counts)
          window.dispatchEvent(new CustomEvent('notificationModalOpened'));
          
          // Update the ticket in agentTickets array
          setAgentTickets(prevTickets => 
            prevTickets.map(t => 
              t.id === notificationId ? { ...t, status: 'read' } : t
            )
          );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // If it's a tagged message, open ticket details modal (for attending)
    // Otherwise, open notification modal
    if (isTagged) {
      // For tagged messages, fetch full ticket details and assignment history
      // The ticket object structure: notification has ticket_id, but ticket object might be nested
      const ticketId = ticket.ticket?.id || ticket.ticket_id || ticket.id;
      
      console.log('Opening tagged message modal:', { ticketId, ticket, hasTicketProperty: !!ticket.ticket });
      
      try {
        const token = localStorage.getItem("authToken");
        
        // Always fetch the full ticket details to ensure we have complete data
        let fullTicket = null;
        const ticketResponse = await fetch(`${baseURL}/ticket/${ticketId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (ticketResponse.ok) {
          const ticketData = await ticketResponse.json();
          fullTicket = ticketData.ticket || ticketData;
          console.log('Fetched full ticket:', fullTicket);
        } else {
          console.error('Failed to fetch ticket:', ticketResponse.status);
          // Fallback to using ticket from notification if available
          fullTicket = ticket.ticket || ticket;
        }
        
        if (!fullTicket) {
          console.error('No ticket data available');
          return;
        }
        
        // Fetch assignment history
        const historyResponse = await fetch(`${baseURL}/ticket/${ticketId}/assignments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        let assignmentHistoryData = [];
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          // Backend returns assignments array directly (like assigned.js uses data directly)
          // Check if it's an array or an object with assignments property
          if (Array.isArray(historyData)) {
            assignmentHistoryData = historyData;
          } else if (historyData.assignments && Array.isArray(historyData.assignments)) {
            assignmentHistoryData = historyData.assignments;
          } else {
            assignmentHistoryData = [];
          }
          
          console.log('Assignment history fetched:', assignmentHistoryData);
          
          // Ensure each assignment has resolved user names (backend should already provide this, but ensure it)
          assignmentHistoryData = assignmentHistoryData.map(assignment => ({
            ...assignment,
            // Use assigned_to_name if available (backend provides this), otherwise try to resolve from assignedTo object
            assigned_to_name: assignment.assigned_to_name || assignment.assignedTo?.full_name || 'Unknown User',
            assigned_to_role: assignment.assigned_to_role || assignment.assignedTo?.role || 'N/A'
          }));
          
          console.log('Assignment history after mapping:', assignmentHistoryData);
        }
        
        // Set the ticket (use the full ticket object)
        console.log('Setting ticket and opening modal:', { fullTicket, ticketId, assignmentHistoryData });
        
        // Set all state first
        setAssignmentHistory(assignmentHistoryData);
        setSelectedTicket(fullTicket);
        
        // Close other modals first
        setIsModalOpen(false);
        setIsNotificationModalOpen(false);
        
        // Then open the ticket details modal
        console.log('State being set - isTicketDetailsModalOpen: true');
        setIsTicketDetailsModalOpen(true);
        console.log('Modal state set');
      } catch (error) {
        console.error('Error fetching ticket details:', error);
        // Fallback: still open the modal with available data
        const fallbackTicket = ticket.ticket || ticket;
        console.log('Using fallback - fallbackTicket:', fallbackTicket);
        if (fallbackTicket) {
          setSelectedTicket(fallbackTicket);
          setAssignmentHistory([]);
          setIsTicketDetailsModalOpen(true);
          setIsModalOpen(false);
          setIsNotificationModalOpen(false);
        } else {
          console.error('No ticket data available for fallback');
        }
      }
    } else {
      // For non-tagged notifications, open notification history modal
      setSelectedTicket(ticket);
      setIsNotificationModalOpen(true);
      setIsModalOpen(false);
      setIsTicketDetailsModalOpen(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    setComments("");
    setModal({ isOpen: false, type: "", message: "" });
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleNotificationClick = async (notification) => {
    // Track if ticket modal was open before opening notification modal
    if (isModalOpen) {
      setWasTicketModalOpen(true);
      setOriginalTicket(selectedTicket); // Store the original ticket
      setIsModalOpen(false); // Close ticket modal temporarily
    } else {
      setWasTicketModalOpen(false);
      setOriginalTicket(null);
    }
    
    // Mark notification as read if it's unread (before opening modal)
    const notificationId = notification.id; // This is the notification ID
    const notificationStatus = notification.status;
    
    if (notificationId && notificationStatus === 'unread') {
      try {
        await markReadMutation.mutateAsync(notificationId);

        // Update notification status locally
        notification.status = 'read';

        // Decrease notification count
        if (notifiedCount > 0) {
          const newCount = Math.max(0, notifiedCount - 1);
          setNotifiedCount(newCount);
          localStorage.setItem('notificationCount', newCount.toString());

          // Dispatch custom event to update sidebar
          window.dispatchEvent(new CustomEvent('notificationModalOpened'));
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Open the notification modal (this shows notification history for the ticket)
    setSelectedTicket(notification);
    setIsNotificationModalOpen(true);
  };

  const handleNotificationModalClose = () => {
    setIsNotificationModalOpen(false);
    
    // Return to previous modal (ticket modal) if it was open
    if (wasTicketModalOpen && originalTicket) {
      setSelectedTicket(originalTicket); // Restore the original ticket
      setIsModalOpen(true);
      setWasTicketModalOpen(false);
      setOriginalTicket(null);
    } else {
      setSelectedTicket(null);
      setOriginalTicket(null);
    }
  };

  // Mark all notifications as read for the current ticket
  const handleMarkAllAsRead = async () => {
    if (!selectedTicket || !notificationHistory?.notifications) {
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) return;

    // Get all unread notifications for this ticket
    const unreadNotifications = notificationHistory.notifications.filter(
      (notif) => notif.status === 'unread'
    );

    if (unreadNotifications.length === 0) {
      return; // No unread notifications
    }

    try {
      const ids = unreadNotifications.map((n) => n.id);
      const result = await markManyReadMutation.mutateAsync(ids);
      const successCount = result.okCount || 0;

      if (successCount > 0) {
        // Update the React Query cache
        const ticketId = selectedTicket?.ticket?.id || selectedTicket?.ticket_id || selectedTicket?.id;
        if (ticketId && userId) {
          queryClient.setQueryData(
            ["ticketNotifications", ticketId, userId],
            (oldData) => {
              if (!oldData?.notifications) return oldData;
              return {
                ...oldData,
                notifications: oldData.notifications.map((notif) =>
                  unreadNotifications.some(n => n.id === notif.id)
                    ? { ...notif, status: 'read' }
                    : notif
                )
              };
            }
          );
        }

        // Update count
        const newCount = Math.max(0, notifiedCount - successCount);
        setNotifiedCount(newCount);
        localStorage.setItem('notificationCount', newCount.toString());

        // Dispatch custom event to update sidebar
        window.dispatchEvent(new CustomEvent('notificationModalOpened'));

        // Update agentTickets array
        setAgentTickets(prevTickets =>
          prevTickets.map(t => {
            if (unreadNotifications.some(n => n.id === t.id)) {
              return { ...t, status: 'read' };
            }
            return t;
          })
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const renderNotificationHistory = () => {
    if (isLoadingHistory) {
      return <div className="loading-message">Loading notifications...</div>;
    }

    if (!notificationHistory?.notifications?.length) {
      return <div className="no-notifications">No notifications found</div>;
    }

    // Get ticket created date from selectedTicket
    const ticketCreatedAt = selectedTicket?.ticket?.created_at || 
                            selectedTicket?.created_at || 
                            null;
    
    // Debug: Log ticket data
    console.log('🔍 Notification History Debug:', {
      selectedTicket: selectedTicket,
      ticketCreatedAt: ticketCreatedAt,
      hasTicket: !!selectedTicket?.ticket,
      hasCreatedAt: !!ticketCreatedAt
    });

    // Use MUI Box and Typography for consistent style
    return (
      <div className="notification-list" style={{ padding: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        {notificationHistory.notifications.map((notification, index) => {
          const dateStr = notification.created_at
            ? new Date(notification.created_at).toLocaleDateString("en-US")
            : "—";
          return (
            <Box
              key={index}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                mb: 1.5,
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: '#fff',
                border: notification.status === 'unread' ? '1.5px solid #1976d2' : '1px solid #e0e0e0',
                boxShadow: notification.status === 'unread' 
                  ? '0 1px 4px rgba(25,118,210,0.12)' 
                  : '0 1px 2px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: notification.status === 'unread'
                    ? '0 2px 8px rgba(25,118,210,0.18)'
                    : '0 2px 4px rgba(0,0,0,0.1)',
                  borderColor: notification.status === 'unread' ? '#1565c0' : '#bdbdbd'
                }
              }}
            >
              {/* Header: Ticket ID and Status */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                pb: 0.75,
                borderBottom: '1px solid #e0e0e0'
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1976d2',
                    fontSize: '0.8rem',
                    letterSpacing: '0.2px',
                    wordBreak: 'break-word',
                    flex: 1,
                    mr: 1
                  }}
                >
                  {notification.ticket?.ticket_id || 'N/A'}
                </Typography>
                <Typography
                  sx={{
                    px: 0.75,
                    py: 0.15,
                    borderRadius: '12px',
                    color: 'white',
                    background: notification.status === 'unread' 
                      ? '#1976d2' 
                      : notification.ticket?.status === 'Closed'
                      ? '#757575'
                      : '#4caf50',
                    fontSize: '0.25rem',
                    fontWeight: 600,
                    minWidth: 40,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1px',
                    flexShrink: 0
                  }}
                >
                  {notification.status === 'unread' 
                    ? 'Unread' 
                    : notification.ticket?.status || 'Read'}
                </Typography>
              </Box>

              {/* Ticket Details */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 0.75 
              }}>
                {/* Ticket Created Date */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography variant="caption" sx={{ color: '#999', fontWeight: 600, minWidth: 55, fontSize: '0.7rem' }}>
                    Created:
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                    {ticketCreatedAt
                      ? new Date(ticketCreatedAt).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true
                        })
                      : notification.ticket?.created_at
                      ? new Date(notification.ticket.created_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true
                        })
                      : notification.created_at
                      ? new Date(notification.created_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true
                        })
                      : "N/A"}
                  </Typography>
                </Box>

                {/* Subject */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                  <Typography variant="caption" sx={{ color: '#999', fontWeight: 600, minWidth: 55, pt: 0.15, fontSize: '0.7rem' }}>
                    Subject:
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 500, 
                      color: '#333', 
                      fontSize: '0.75rem',
                      flex: 1,
                      wordBreak: 'break-word'
                    }}
                  >
                    {notification.ticket?.subject || 'N/A'}
                  </Typography>
                </Box>

                {/* Description */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                  <Typography variant="caption" sx={{ color: '#999', fontWeight: 600, minWidth: 55, pt: 0.15, fontSize: '0.7rem' }}>
                    Description:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#666',
                      fontSize: '0.7rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                      lineHeight: 1.4,
                      wordBreak: 'break-word'
                    }}
                  >
                    {notification.ticket?.description || 'N/A'}
                  </Typography>
                </Box>

                {/* Message */}
                {notification.comment && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: 0.75,
                    mt: 0.25,
                    p: 1,
                    bgcolor: '#f5f5f5',
                    borderRadius: 1,
                    borderLeft: '2px solid #1976d2'
                  }}>
                    <Typography variant="caption" sx={{ color: '#999', fontWeight: 600, minWidth: 55, pt: 0.15, fontSize: '0.7rem' }}>
                      Message:
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#555',
                        fontSize: '0.7rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                        lineHeight: 1.4,
                        fontStyle: 'italic',
                        wordBreak: 'break-word'
                      }}
                    >
                      {notification.comment}
                    </Typography>
                  </Box>
                )}

                {/* Resolution Details and Closed By - Show only when ticket is closed */}
                {notification.ticket?.status === "Closed" && (
                  <>
                    {notification.ticket?.resolution_details && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 0.75,
                        mt: 0.25,
                        p: 1,
                        bgcolor: '#e8f5e9',
                        borderRadius: 1,
                        borderLeft: '2px solid #4caf50'
                      }}>
                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, minWidth: 55, pt: 0.15, fontSize: '0.7rem' }}>
                          Resolution:
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#2e7d32',
                            fontSize: '0.7rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1,
                            lineHeight: 1.4,
                            wordBreak: 'break-word'
                          }}
                        >
                          {notification.ticket.resolution_details}
                        </Typography>
                      </Box>
                    )}
                    {(notification.ticket?.attendedBy?.full_name || notification.ticket?.attended_by_name) && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                        <Typography variant="caption" sx={{ color: '#999', fontWeight: 600, minWidth: 55, fontSize: '0.7rem' }}>
                          Closed By:
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem', wordBreak: 'break-word' }}>
                          {notification.ticket?.attendedBy?.full_name || notification.ticket?.attended_by_name}
                          {(notification.ticket?.attendedBy?.role || notification.ticket?.attended_by_role) && (
                            <span style={{ color: '#999', marginLeft: '4px' }}>
                              ({(notification.ticket?.attendedBy?.role || notification.ticket?.attended_by_role)})
                            </span>
                          )}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Box>
          );
        })}
      </div>
    );
  };

  // Group notifications by ticket ID and keep only the latest notification per ticket
  // For "notified" type, we'll include all notifications and filter later based on Navbar logic
  const uniqueTickets = [];
  const seenTicketIds = new Set();
  console.log('Processing agentTickets for uniqueTickets:', agentTickets.length, 'notificationType:', notificationType, 'userId:', userId);
  if (agentTickets.length === 0) {
    console.warn('No agentTickets to process!');
  }
  agentTickets.forEach((notif) => {
    const ticketId = notif.ticket?.id || notif.ticket_id || notif.id;
    
    if (!ticketId) {
      console.warn('Notification without ticketId:', notif);
      return;
    }
    
    // For "notified" type, include all notifications (filtering happens later)
    // For other types, use the existing logic
    if (notificationType === 'notified') {
      // Include all notifications for "notified" type - filtering will happen in typeFilteredTickets
      // Include both read and unread - only count reduces, items stay in list
      const isForCurrentUser = String(notif.recipient_id) === String(userId) || notif.recipient_id === userId;
      
      if (isForCurrentUser && !seenTicketIds.has(ticketId)) {
        uniqueTickets.push(notif);
        seenTicketIds.add(ticketId);
        console.log('Added to uniqueTickets (notified):', {
          ticketId,
          status: notif.status,
          recipient_id: notif.recipient_id,
          userId,
          message: notif.message?.substring(0, 50)
        });
      } else {
        console.log('Skipped notification:', {
          ticketId,
          isForCurrentUser,
          alreadySeen: seenTicketIds.has(ticketId)
        });
      }
    } else {
      // For other types (tagged, etc.), use existing logic
      // For tagged type, include all tagged notifications (read or unread)
      // For other types, use the existing logic
      if (notificationType === 'tagged') {
        const messageText = (notif.message || notif.comment || '').toLowerCase();
        const commentText = (notif.comment || '').toLowerCase();
        const isTagged = messageText.includes('mentioned you') || commentText.includes('@');
        
        // Include all tagged notifications (read or unread) for tagged type
        if (isTagged && !seenTicketIds.has(ticketId)) {
          uniqueTickets.push(notif);
          seenTicketIds.add(ticketId);
          console.log('Added to uniqueTickets (tagged):', {
            ticketId,
            status: notif.status,
            message: notif.message?.substring(0, 50)
          });
        }
      } else {
        // For other types (default, etc.), use existing logic
        const messageText = (notif.message || notif.comment || '').toLowerCase();
        const commentText = (notif.comment || '').toLowerCase();
        const isTagged = messageText.includes('mentioned you') || commentText.includes('@');
        const hasComment = notif.comment && notif.comment !== null && String(notif.comment).trim() !== '';
        
        // Include notifications that are tagged or have comments
        const shouldInclude = isTagged || (hasComment && !isTagged);
        
        if (!seenTicketIds.has(ticketId) && shouldInclude) {
          uniqueTickets.push(notif);
          seenTicketIds.add(ticketId);
        }
      }
    }
  });
  console.log('Total uniqueTickets after processing:', uniqueTickets.length);

  // Debug: Log all notifications when filtering for tagged
  if (notificationType === 'tagged') {
    console.log('Filtering for tagged messages. Total uniqueTickets:', uniqueTickets.length);
    uniqueTickets.forEach((notif, idx) => {
      const messageText = (notif.message || notif.comment || '').toLowerCase();
      const commentText = (notif.comment || '').toLowerCase();
      const isTagged = messageText.includes('mentioned you') || commentText.includes('@');
      console.log(`Notification ${idx + 1}:`, {
        ticketId: notif.ticket?.id || notif.ticket_id || notif.id,
        message: notif.message,
        comment: notif.comment,
        isTagged,
        messageText,
        commentText
      });
    });
  }

  // Debug: Log all notifications when filtering for notified
  if (notificationType === 'notified') {
    console.log('Filtering for notified messages. Total uniqueTickets:', uniqueTickets.length);
    uniqueTickets.forEach((notif, idx) => {
      const hasComment = notif.comment && notif.comment !== null && String(notif.comment).trim() !== '';
      const messageText = (notif.message || notif.comment || '').toLowerCase();
      const commentText = (notif.comment || '').toLowerCase();
      const isTagged = messageText.includes('mentioned you') || commentText.includes('@');
      const isAssignedMessage = messageText.includes('assigned to you') && !isTagged;
      console.log(`Notification ${idx + 1}:`, {
        ticketId: notif.ticket?.id || notif.ticket_id || notif.id,
        message: notif.message,
        comment: notif.comment,
        hasComment,
        isTagged,
        isAssignedMessage,
        shouldInclude: hasComment && !isTagged && !isAssignedMessage
      });
    });
  }

  // Filter based on notification type from query parameter
  let typeFilteredTickets = uniqueTickets;
  if (notificationType === 'notified') {
    // Show "notified" notifications: not tagged, not assigned, not reversed
    // Show both read and unread - only count reduces, items stay in list
    typeFilteredTickets = uniqueTickets.filter(notif => {
      // Handle both string and number types for comparison
      const isForCurrentUser = String(notif.recipient_id) === String(userId) || notif.recipient_id === userId;
      
      if (!isForCurrentUser) {
        return false;
      }
      
      const messageText = (notif.message || notif.comment || '').toLowerCase();
      const commentText = (notif.comment || '').toLowerCase();
      
      // Check if it's tagged
      const isTagged = messageText.includes('mentioned you') || commentText.includes('@');
      
      // Check if it's reversed
      const isReversedTicket = notif.ticket?.status === 'Reversed' || notif.ticket?.status === 'reversed';
      const isReversedByText = messageText.includes('reversed back to you') ||
                              messageText.includes('reversed to you') ||
                              (messageText.includes('has been reversed') && messageText.includes('to'));
      const isReversed = isReversedTicket && isReversedByText;
      
      // Check if it's assigned (only by message text, not ticket status)
      const isAssignedByText = (messageText.includes('assigned to you') || 
                               messageText.includes('forwarded to you') ||
                               messageText.includes('reassigned to you')) && !isTagged && !isReversed;
      
      // Notified: not tagged, not assigned, and not reversed (show both read and unread)
      const shouldInclude = !isTagged && !isAssignedByText && !isReversed;
      
      return shouldInclude;
    });
    console.log('Notified messages filtered:', typeFilteredTickets.length, 'from', uniqueTickets.length, 'unique tickets');
  } else if (notificationType === 'tagged') {
    // Show only "tagged" notifications: has "mentioned you" in message or "@" in comment
    typeFilteredTickets = uniqueTickets.filter(notif => {
      const messageText = (notif.message || notif.comment || '').toLowerCase();
      const commentText = (notif.comment || '').toLowerCase();
      return messageText.includes('mentioned you') || commentText.includes('@');
    });
    console.log('Tagged messages filtered:', typeFilteredTickets.length);
  }
  // If no type specified, show all notifications (current behavior)

  // When a specific notification type is selected, use that directly
  // Otherwise, use manual/system filter
  let filteredTickets;
  if (notificationType === 'tagged' || notificationType === 'notified') {
    // For tagged or notified, use the typeFilteredTickets directly
    filteredTickets = typeFilteredTickets;
  } else {
    // For default view, use manual/system filter
    const manualNotifications = typeFilteredTickets.filter(
      notif => notif.comment && notif.comment !== null && String(notif.comment).trim() !== ''
    );

    const systemNotifications = typeFilteredTickets.filter(
      notif => !notif.comment || notif.comment === null || String(notif.comment).trim() === ''
    );

    filteredTickets = showType === 'manual' ? manualNotifications : systemNotifications;
  }

  // Debug: Log filtered tickets before search filter
  if (notificationType === 'notified') {
    console.log('Filtered tickets before search filter:', filteredTickets.length);
    filteredTickets.forEach((ticket, idx) => {
      const ticketData = ticket.ticket || ticket;
      console.log(`Filtered ticket ${idx + 1}:`, {
        ticketId: ticketData.id || ticketData.ticket_id,
        comment: ticket.comment,
        message: ticket.message
      });
    });
  }

  // Apply search and other filters
  filteredTickets = filteredTickets.filter((ticket) => {
    const searchValue = search.toLowerCase();
    const ticketData = ticket.ticket || ticket;
    const phone = (ticketData.phone_number || "").toLowerCase();
    const nida = (ticketData.nida_number || "").toLowerCase();
    const fullName = `${ticketData.first_name || ""} ${ticketData.middle_name || ""} ${ticketData.last_name || ""}`.toLowerCase();
    const institutionName = (ticketData.institution && typeof ticketData.institution === 'object' ? ticketData.institution.name : ticketData.institution || "").toLowerCase();
    
    const matchesSearch = !searchValue || 
      phone.includes(searchValue) || 
      nida.includes(searchValue) ||
      fullName.includes(searchValue) ||
      institutionName.includes(searchValue) ||
      (ticketData.first_name || "").toLowerCase().includes(searchValue) ||
      (ticketData.last_name || "").toLowerCase().includes(searchValue) ||
      (ticketData.middle_name || "").toLowerCase().includes(searchValue) ||
      (ticketData.institution || "").toLowerCase().includes(searchValue);
    
    const matchesStatus = !filters.status || ticketData.status === filters.status;
    const matchesPriority = !filters.priority || ticketData.priority === filters.priority;
    const matchesCategory = !filters.category || ticketData.category === filters.category;
    let matchesDate = true;
    if (filters.startDate) {
      const ticketDate = new Date(ticketData.created_at);
      if (ticketDate < filters.startDate) matchesDate = false;
    }
    if (filters.endDate) {
      const ticketDate = new Date(ticketData.created_at);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (ticketDate > endDate) matchesDate = false;
    }
    const shouldInclude = matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesDate;
    if (notificationType === 'notified' && !shouldInclude) {
      console.log('Ticket filtered out:', {
        ticketId: ticketData.id || ticketData.ticket_id,
        matchesSearch,
        matchesStatus,
        matchesPriority,
        matchesCategory,
        matchesDate,
        searchValue,
        filters
      });
    }
    return shouldInclude;
  });

  if (notificationType === 'notified') {
    console.log('Final filtered tickets count:', filteredTickets.length);
  }

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredTickets.length);
  const totalItems = filteredTickets.length;
  
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderTableHeader = () => (
    <tr>
      {activeColumns.includes("ticket_id") && <th>Ticket ID</th>}
      {activeColumns.includes("createdAt") && <th>Created At</th>}
      {activeColumns.includes("employee") && <th>Employee</th>}
      {activeColumns.includes("employer") && <th>Employer</th>}
      {activeColumns.includes("phone_number") && <th>Phone</th>}
      {activeColumns.includes("region") && <th>Region</th>}
      {activeColumns.includes("status") && <th>Status</th>}
      {activeColumns.includes("subject") && <th>Subject</th>}
      {activeColumns.includes("category") && <th>Category</th>}
      {activeColumns.includes("assigned_to_role") && <th>Assigned Role</th>}
      <th style={{ textAlign: "center" }}>Actions</th>
    </tr>
  );

  // Function to count unread notifications with messages for a specific ticket
  // Filter based on notificationType: 'tagged' counts only tagged, 'notified' counts only notified
  const getUnreadCountForTicket = (ticketId) => {
    if (!ticketId || !agentTickets || agentTickets.length === 0) return 0;
    
    return agentTickets.filter(notif => {
      const notifTicketId = notif.ticket?.id || notif.ticket_id || notif.id;
      if (notifTicketId !== ticketId) return false;
      
      const isUnread = notif.status === 'unread' || notif.status === ' ';
      if (!isUnread) return false;
      
      const messageText = (notif.message || notif.comment || '').toLowerCase();
      const commentText = (notif.comment || '').toLowerCase();
      const isTagged = messageText.includes('mentioned you') || commentText.includes('@');
      
      // Filter based on notificationType
      if (notificationType === 'tagged') {
        // For tagged: only count tagged notifications
        return isTagged;
      } else if (notificationType === 'notified') {
        // For notified: count notifications that are not tagged, not assigned, not reversed
        const isReversedTicket = notif.ticket?.status === 'Reversed' || notif.ticket?.status === 'reversed';
        const isReversedByText = messageText.includes('reversed back to you') ||
                                messageText.includes('reversed to you') ||
                                (messageText.includes('has been reversed') && messageText.includes('to'));
        const isReversed = isReversedTicket && isReversedByText;
        const isAssignedByText = (messageText.includes('assigned to you') || 
                                 messageText.includes('forwarded to you') ||
                                 messageText.includes('reassigned to you')) && !isTagged && !isReversed;
        
        return !isTagged && !isAssignedByText && !isReversed;
      } else {
        // For other types: count all notifications with comments or tagged
        const hasComment = notif.comment && notif.comment !== null && String(notif.comment).trim() !== '';
        return hasComment || isTagged;
      }
    }).length;
  };

  const renderTableRow = (ticket, index) => {
    const ticketId = ticket.ticket?.id || ticket.ticket_id || ticket.id;
    const unreadCount = getUnreadCountForTicket(ticketId);
    
    return (
    <tr key={ticket.id || index}>
      {activeColumns.includes("ticket_id") && (
        <td>{ticket.ticket?.ticket_id || ticket.ticket_id || ticket.id}</td>
      )}
      {activeColumns.includes("createdAt") && (
        <td>
          {ticket.ticket?.created_at
            ? new Date(ticket.ticket?.created_at).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
              })
            : "N/A"}
        </td>
      )}
      {activeColumns.includes("employee") && (
        <td>
          {ticket.ticket?.first_name && ticket.ticket?.first_name.trim() !== ""
            ? `${ticket.ticket?.first_name} ${ticket.ticket?.middle_name || ""} ${ticket.ticket?.last_name || ""}`.trim()
            : ticket.ticket?.representative_name && ticket.ticket?.representative_name.trim() !== ""
              ? ticket.ticket?.representative_name
              : "N/A"}
        </td>
      )}
      {activeColumns.includes("employer") && (
        <td>
          {typeof ticket.ticket?.institution === "string"
            ? ticket.ticket?.institution
            : ticket.ticket?.institution && typeof ticket.ticket?.institution === "object" && typeof ticket.ticket?.institution.name === "string"
              ? ticket.ticket?.institution.name
              : ticket.ticket?.employer && typeof ticket.ticket?.employer === "object" && typeof ticket.ticket?.employer.name === "string"
                ? ticket.ticket?.employer.name
                : "N/A"}
        </td>
      )}
      {activeColumns.includes("phone_number") && (
        <td>{ticket.ticket?.phone_number || "N/A"}</td>
      )}
      {activeColumns.includes("region") && (
        <td>{ticket.ticket?.region || "N/A"}</td>
      )}
      {activeColumns.includes("status") && (
        <td>
          <span
            style={{
              color:
                ticket.ticket?.status === "Open"
                  ? "green"
                  : ticket.ticket?.status === "Closed"
                  ? "gray"
                  : "blue"
            }}
          >
            {ticket.ticket?.status || "N/A"}
          </span>
        </td>
      )}
      {activeColumns.includes("subject") && (
        <td>{ticket.ticket?.subject || "N/A"}</td>
      )}
      {activeColumns.includes("category") && (
        <td>{ticket.ticket?.category || "N/A"}</td>
      )}
      {activeColumns.includes("assigned_to_role") && (
        <td>{ticket.ticket?.assigned_to_role || "N/A"}</td>
      )}
      <td>
        <div className="action-buttons">
          <Tooltip title="View Notifications">
            <Badge 
              badgeContent={unreadCount > 0 ? unreadCount : 0} 
              color="error"
              max={99}
              invisible={unreadCount === 0}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.65rem',
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 4px',
                  top: '0px',
                  right: '8px',
                  transform: 'translate(50%, -50%)',
                  backgroundColor: '#ff0000 !important',
                  color: 'white !important',
                  fontWeight: 'bold',
                  border: '1px solid white',
                  pointerEvents: 'none' // Don't block clicks on the badge
                }
              }}
            >
              <button
                className="view-ticket-details-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Bell button clicked for ticket:', ticket);
                  openModal(ticket).catch(err => {
                    console.error('Error in openModal:', err);
                  });
                }}
                style={{ position: 'relative', cursor: 'pointer', zIndex: 1 }}
              >
                <FaBell />
              </button>
            </Badge>
          </Tooltip>
        </div>
      </td>
    </tr>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <h3 className="title">Loading...</h3>
      </div>
    );
  }

  return (
    <div className="user-table-container">
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "26px" }}>
          <h3 className="title" style={{ margin: 0 }}>Notifications List</h3>
          {notificationType === 'tagged' && (
            <Badge 
              badgeContent="Tagged" 
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.7rem',
                  padding: '4px 8px',
                  borderRadius: '12px'
                }
              }}
            />
          )}
          {notificationType === 'notified' && (
            <Badge 
              badgeContent="Notified" 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.7rem',
                  padding: '4px 8px',
                  borderRadius: '12px'
                }
              }}
            />
          )}
        </div>
        
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "10px"
        }}>
          <TicketFilters
            onFilterChange={handleFilterChange}
            initialFilters={filters}
            compact={true}
          />
        </div>
      </div>
      <div style={{ overflowX: "auto", width: "100%" }}>

        <TableControls
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(e) => {
            const value = e.target.value;
            setItemsPerPage(
              value === "All" ? filteredTickets.length : parseInt(value)
            );
            setCurrentPage(1);
          }}
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          filterStatus={filters.status}
          onFilterStatusChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          activeColumns={activeColumns}
          onColumnsChange={setActiveColumns}
          tableData={filteredTickets}
          tableTitle="Notifications"
        />

        <table className="user-table">
          <thead>{renderTableHeader()}</thead>
          <tbody>
            {paginatedTickets.length > 0 ? (
              paginatedTickets.map((ticket, i) => renderTableRow(ticket, i))
            ) : (
              <tr>
                <td
                  colSpan={activeColumns.length + 1}
                  style={{ textAlign: "center", color: "red" }}
                >
                  {agentTicketsError || "No tickets found for this agent."}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Details Modal */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        aria-labelledby="ticket-details-title"
        aria-describedby="ticket-details-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "98vw", sm: 1050 },
            minHeight: 500,
            maxHeight: "90vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 0,
            display: "flex",
            flexDirection: "row"
          }}
        >
          {/* Left: Ticket Details */}
          <Box
            sx={{
              flex: 2,
              p: 4,
              borderRight: "1px solid #eee",
              overflowY: "auto",
              minWidth: 0,
              maxHeight: "90vh"
            }}
          >
            {selectedTicket && (
              <>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: "bold", color: "#1976d2" }}
                >
                  Ticket Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "16px",
                    width: "100%"
                  }}
                >
                  {[
                    // If no first_name, show Institution only; else show First Name and Last Name
                    ...(!selectedTicket.ticket?.first_name
                      ? [
                          [
                            "Institution",
                            selectedTicket.ticket?.institution || "N/A"
                          ]
                        ]
                      : [
                          [
                            "Full Name",
                            `${selectedTicket.ticket?.first_name || ""} ${
                              selectedTicket.ticket?.last_name || ""
                            }`.trim() || "N/A"
                          ]
                        ]),
                    [
                      "Ticket Number",
                      selectedTicket.ticket?.ticket_id || "N/A"
                    ],
                    ["Phone", selectedTicket.ticket?.phone_number || "N/A"],
                    ["Requester", selectedTicket.ticket?.requester || "N/A"],
                    ["Region", selectedTicket.ticket?.region || "N/A"],
                    ["Channel", selectedTicket.ticket?.channel || "N/A"],
                    [
                      "Section",
                      selectedTicket.ticket?.responsible_unit_name || "Unit"
                    ],
                    [
                      "Sub-section",
                      selectedTicket.ticket?.sub_section || "N/A"
                    ],
                    ["Subject", selectedTicket.ticket?.subject || "N/A"],
                    [
                      "Created By",
                      selectedTicket.ticket?.creator?.name || "N/A"
                    ],
                    // Always show Assigned To and Assigned Role
                    [
                      "Assigned To",
                      selectedTicket.ticket?.assignee?.name || "N/A"
                    ],
                    [
                      "Assigned Role",
                      selectedTicket.ticket?.assigned_to_role || "N/A"
                    ]
                  ].map(([label, value], index) => (
                    <div
                      key={`left-${index}`}
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        border:
                          label === "Section" ||
                          label === "Sub-section" ||
                          label === "Subject"
                            ? "2px solid #e0e0e0"
                            : "none"
                      }}
                    >
                      <strong
                        style={{
                          minWidth: "120px",
                          color:
                            label === "Section" ||
                            label === "Sub-section" ||
                            label === "Subject"
                              ? "#1976d2"
                              : "#555",
                          fontSize: "0.9rem"
                        }}
                      >
                        {label}:
                      </strong>
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontSize: "0.9rem",
                          color:
                            label === "Section" ||
                            label === "Sub-section" ||
                            label === "Subject"
                              ? "#1976d2"
                              : "inherit"
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}

                  {/* Right Column */}
                  {[
                    [
                      "Status",
                      <span
                        style={{
                          color:
                            selectedTicket.ticket?.status === "Open"
                              ? "green"
                              : selectedTicket.ticket?.status === "Closed"
                              ? "gray"
                              : "blue"
                        }}
                      >
                        {selectedTicket.ticket?.status || "N/A"}
                      </span>
                    ],
                    ["NIDA", selectedTicket.ticket?.nida_number || "N/A"],
                    [
                      "Institution",
                      selectedTicket.ticket?.institution || "N/A"
                    ],
                    ["District", selectedTicket.ticket?.district || "N/A"],
                    ["Category", selectedTicket.ticket?.category || "N/A"],
                    [
                      "Rated",
                      <span
                        style={{
                          color:
                            selectedTicket.ticket?.complaint_type === "Major"
                              ? "red"
                              : selectedTicket.ticket?.complaint_type ===
                                "Minor"
                              ? "orange"
                              : "inherit"
                        }}
                      >
                        {selectedTicket.ticket?.complaint_type || "Unrated"}
                      </span>
                    ],
                    // Always show Assigned To and Assigned Role in right column as well
                    [
                      "Assigned To",
                      selectedTicket.ticket?.assignee?.name || "N/A"
                    ],
                    [
                      "Assigned Role",
                      selectedTicket.ticket?.assigned_to_role || "N/A"
                    ],
                    [
                      "Created At",
                      selectedTicket.ticket?.created_at
                        ? new Date(
                            selectedTicket.ticket?.created_at
                          ).toLocaleString("en-US", {
                            month: "numeric",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true
                          })
                        : "N/A"
                    ]
                  ].map(([label, value], index) => (
                    <div
                      key={`right-${index}`}
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                      }}
                    >
                      <strong
                        style={{
                          minWidth: "120px",
                          color: "#555",
                          fontSize: "0.9rem"
                        }}
                      >
                        {label}:
                      </strong>
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontSize: "0.9rem"
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Description - Full Width */}
                <div
                  style={{
                    width: "94%",
                    padding: "12px 16px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "flex-start",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    marginTop: "16px"
                  }}
                >
                  <strong
                    style={{
                      minWidth: "120px",
                      color: "#555",
                      fontSize: "0.9rem"
                    }}
                  >
                    Description:
                  </strong>
                  <span
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontSize: "0.9rem",
                      lineHeight: "1.5"
                    }}
                  >
                    {selectedTicket.ticket?.description || "N/A"}
                  </span>
                </div>

                <Box sx={{ mt: 3, textAlign: "right" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={closeModal}
                  >
                    Close
                  </Button>
                </Box>
              </>
            )}
          </Box>
          {/* Right: Notification History */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              minWidth: 280,
              maxWidth: 320,
              overflowY: "auto",
              overflowX: "hidden",
              boxSizing: 'border-box'
            }}
          >
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ fontWeight: 600, color: "#1976d2", fontSize: '0.95rem' }}
            >
              Notification History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {renderNotificationHistory()}
          </Box>
        </Box>
      </Modal>

      {/* Notification Modal */}
      <Modal
        open={isNotificationModalOpen}
        onClose={handleNotificationModalClose}
        aria-labelledby="notification-modal-title"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 600 },
            maxHeight: "85vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 3,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          <Typography
            id="notification-modal-title"
            variant="h6"
            sx={{ fontWeight: 600, color: "#1976d2", mb: 2, fontSize: '1.1rem' }}
          >
            Notification History
          </Typography>
          {selectedTicket && (
            <Typography
              variant="subtitle2"
              color="textSecondary"
              sx={{ mb: 2 }}
            >
              Ticket #{selectedTicket.ticket?.ticket_id || selectedTicket.ticket_id || "N/A"}
            </Typography>
          )}
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ 
            flex: 1, 
            overflowY: "auto", 
            overflowX: "hidden",
            minHeight: 0,
            mb: 2,
            pr: 0.5,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555',
            }
          }}>
            {renderNotificationHistory()}
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexShrink: 0 }}>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={handleMarkAllAsRead}
              disabled={!notificationHistory?.notifications || notificationHistory.notifications.filter(n => n.status === 'unread').length === 0}
            >
              Mark All as Read
            </Button>
            <Button variant="contained" onClick={handleNotificationModalClose}>
              Close
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Ticket Details Modal for Tagged Messages */}
      <TicketDetailsModal
        open={isTicketDetailsModalOpen}
        onClose={() => {
          console.log('Closing TicketDetailsModal');
          setIsTicketDetailsModalOpen(false);
          setSelectedTicket(null);
          setAssignmentHistory([]);
        }}
        selectedTicket={selectedTicket}
        assignmentHistory={assignmentHistory}
        refreshTickets={refetchFeed}
        refreshDashboardCounts={() => {}}
      />

      {/* Column Selector */}
      {/* Removed ColumnSelectorDropdown */}

      {/* Snackbar for notifications */}
      <Snackbar
        open={modal.isOpen}
        autoHideDuration={3000}
        onClose={() => setModal({ isOpen: false, type: "", message: "" })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setModal({ isOpen: false, type: "", message: "" })}
          severity={modal.type}
        >
          {modal.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
