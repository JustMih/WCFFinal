import React, { useState, useEffect } from "react";
import {
  FaTelegram,
  FaWhatsapp,
  FaInstagram,
  FaEnvelope,
  FaFacebook,
  FaLinkedin,
  FaChartBar,
  FaComments,
  FaBell,
  FaChartLine,
  FaUserFriends,
  FaClock
} from "react-icons/fa";
import "./callCenterSocialMessage.css";
import { baseURL } from "../../../config";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import CallCenterReplyModal from '../../../components/instagram/CallCenterReplyModal';

const commentStatusFilters = [
  { key: "all", label: "All Comments", color: "#667eea" },
  { key: "unread", label: "New", color: "#25D366" },
  { key: "read", label: "Read", color: "#718096" },
  { key: "replied", label: "Replied", color: "#667eea" },
];

const fetchInstagramComments = async () => {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseURL}/all-comments`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
};

const CommentsList = ({ comments, onCommentClick, onReply, onMarkAsRead, selectedComment, replyText, setReplyText, replyError }) => (
  <div className="comments-container">
    <div className="comments-header">
      <h3>Instagram Comments</h3>
      <div className="comment-stats">
        <span className="stat-item">
          <span className="stat-number">{comments.length}</span>
          <span className="stat-label">Total</span>
        </span>
        <span className="stat-item">
          <span className="stat-number">{comments.filter(c => c.unread).length}</span>
          <span className="stat-label">New</span>
        </span>
        <span className="stat-item">
          <span className="stat-number">{comments.filter(c => c.replied).length}</span>
          <span className="stat-label">Replied</span>
        </span>
      </div>
    </div>
    
    <div className="comments-list">
      {comments.map((comment) => (
        <div 
          key={comment.id} 
          className={`comment-item ${comment.unread ? 'unread' : ''} ${selectedComment?.id === comment.id ? 'selected' : ''}`}
          onClick={() => onCommentClick(comment)}
        >
          <div className="comment-header">
            <div className="comment-user">
              <div className="user-avatar">
                {comment.sender.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="username">{comment.sender}</span>
                <span className="comment-time">
                  {new Date(comment.created_at || Date.now()).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="comment-status">
              {comment.unread && <span className="status-badge new">New</span>}
              {comment.replied && <span className="status-badge replied">Replied</span>}
              {comment.read && !comment.replied && <span className="status-badge read">Read</span>}
            </div>
          </div>
          
          <div className="comment-content">
            <p>{comment.text}</p>
          </div>
          
          {comment.replied && comment.reply && (
            <div className="comment-reply">
              <div className="reply-header">
                <span className="reply-label">Your Reply:</span>
                <span className="reply-time">
                  {comment.replied_at ? new Date(comment.replied_at).toLocaleString() : ''}
                </span>
              </div>
              <p className="reply-text">{comment.reply}</p>
            </div>
          )}
          
          <div className="comment-actions">
            {!comment.replied && (
              <button 
                className="action-btn reply-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply(comment);
                }}
              >
                <FaComments className="btn-icon" />
                Reply
              </button>
            )}
            {comment.unread && (
              <button 
                className="action-btn mark-read-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(comment.id);
                }}
              >
                <FaBell className="btn-icon" />
                Mark as Read
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StatusFilters = ({ filters, activeFilter, onFilterChange }) => (
  <div className="status-filters">
    {filters.map((filter) => (
      <button
        key={filter.key}
        className={`filter-btn ${activeFilter === filter.key ? 'active' : ''}`}
        onClick={() => onFilterChange(filter.key)}
        style={{ '--filter-color': filter.color }}
      >
        {filter.label}
      </button>
    ))}
  </div>
);

const MessagesList = ({ messages, onMessageClick, onReply, onMarkAsRead, selectedMessage, replyText, setReplyText, replyError }) => (
  <div className="messages-container">
    <div className="messages-header">
      <h3>Instagram Messages</h3>
      <div className="message-stats">
        <span className="stat-item">
          <span className="stat-number">{messages.length}</span>
          <span className="stat-label">Total</span>
        </span>
        <span className="stat-item">
          <span className="stat-number">{messages.filter(m => m.unread).length}</span>
          <span className="stat-label">New</span>
        </span>
        <span className="stat-item">
          <span className="stat-number">{messages.filter(m => m.replied).length}</span>
          <span className="stat-label">Replied</span>
        </span>
      </div>
    </div>
    
    <div className="messages-list">
      {messages.map((message) => (
        <div 
          key={message.id} 
          className={`message-item ${message.unread ? 'unread' : ''} ${selectedMessage?.id === message.id ? 'selected' : ''}`}
          onClick={() => onMessageClick(message)}
        >
          <div className="message-header">
            <div className="message-user">
              <div className="user-avatar">
                {message.sender.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="username">{message.sender}</span>
                <span className="message-time">
                  {new Date(message.created_at || Date.now()).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="message-status">
              {message.unread && <span className="status-badge new">New</span>}
              {message.replied && <span className="status-badge replied">Replied</span>}
              {message.read && !message.replied && <span className="status-badge read">Read</span>}
            </div>
          </div>
          
          <div className="message-content">
            <p>{message.text}</p>
          </div>
          
          {message.replied && message.reply && (
            <div className="message-reply">
              <div className="reply-header">
                <span className="reply-label">Your Reply:</span>
                <span className="reply-time">
                  {message.replied_at ? new Date(message.replied_at).toLocaleString() : ''}
                </span>
              </div>
              <p className="reply-text">{message.reply}</p>
            </div>
          )}
          
          <div className="message-actions">
            {!message.replied && (
              <button 
                className="action-btn reply-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply(message);
                }}
              >
                <FaTelegram className="btn-icon" />
                Reply
              </button>
            )}
            {message.unread && (
              <button 
                className="action-btn mark-read-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(message.id);
                }}
              >
                <FaBell className="btn-icon" />
                Mark as Read
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DashboardStats = ({ stats }) => (
  <div className="dashboard-container">
    <div className="dashboard-header">
      <h4>Instagram Performance Dashboard</h4>
        <div className="dashboard-summary">
          <span className="summary-item">
            <span className="summary-number">{stats.totalComments || 0}</span>
            <span className="summary-label">Total Comments</span>
          </span>
          <span className="summary-item">
            <span className="summary-number">{stats.totalMessages || 0}</span>
            <span className="summary-label">Total Messages</span>
          </span>
          <span className="summary-item">
            <span className="summary-number">{stats.unreadComments || 0}</span>
            <span className="summary-label">Unread Comments</span>
          </span>
          <span className="summary-item">
            <span className="summary-number">{stats.unreadMessages || 0}</span>
            <span className="summary-label">Unread Messages</span>
          </span>
          <span className="summary-item">
            <span className="summary-number">{stats.repliedComments + stats.repliedMessages || 0}</span>
            <span className="summary-label">Total Replied</span>
          </span>
        </div>
    </div>

    <div className="dashboard-stats">
      <div className="stat-card large">
        <div className="stat-icon-wrapper">
          <FaComments className="stat-icon" style={{ color: '#E1306C' }} />
        </div>
        <div className="stat-content">
          <h3>Total Comments</h3>
          <p className="stat-number">{stats.totalComments || 0}</p>
          <span className="stat-change">+12% from last week</span>
          <div className="stat-chart">
            <div className="chart-bar" style={{ width: '85%' }}></div>
          </div>
        </div>
      </div>
      <div className="stat-card large">
        <div className="stat-icon-wrapper">
          <FaTelegram className="stat-icon" style={{ color: '#25D366' }} />
        </div>
        <div className="stat-content">
          <h3>Total Messages</h3>
          <p className="stat-number">{stats.totalMessages || 0}</p>
          <span className="stat-change">+8% from last week</span>
          <div className="stat-chart">
            <div className="chart-bar positive" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>
      <div className="stat-card large">
        <div className="stat-icon-wrapper">
          <FaBell className="stat-icon" style={{ color: '#f39c12' }} />
        </div>
        <div className="stat-content">
          <h3>Unread Items</h3>
          <p className="stat-number">{(stats.unreadComments || 0) + (stats.unreadMessages || 0)}</p>
          <span className="stat-change urgent">Requires attention</span>
          <div className="stat-chart">
            <div className="chart-bar urgent" style={{ width: `${((stats.unreadComments + stats.unreadMessages) / (stats.totalComments + stats.totalMessages)) * 100}%` }}></div>
          </div>
        </div>
      </div>
      <div className="stat-card large">
        <div className="stat-icon-wrapper">
          <FaChartLine className="stat-icon" style={{ color: '#667eea' }} />
        </div>
        <div className="stat-content">
          <h3>Response Rate</h3>
          <p className="stat-number">{((stats.repliedComments + stats.repliedMessages) / (stats.totalComments + stats.totalMessages) * 100).toFixed(1)}%</p>
          <span className="stat-change positive">Good performance</span>
          <div className="stat-chart">
            <div className="chart-bar positive" style={{ width: `${((stats.repliedComments + stats.repliedMessages) / (stats.totalComments + stats.totalMessages)) * 100}%` }}></div>
          </div>
        </div>
      </div>
    </div>

    <div className="dashboard-content-grid">
      <div className="dashboard-section">
        <h3>Performance Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <FaUserFriends className="metric-icon" />
              <span className="metric-title">Active Users</span>
            </div>
            <div className="metric-value">{stats.activeUsers || 0}</div>
            <div className="metric-trend">↗ +5%</div>
          </div>
          <div className="metric-card">
            <div className="metric-header">
              <FaClock className="metric-icon" />
              <span className="metric-title">Avg. Response Time</span>
            </div>
            <div className="metric-value">{stats.avgResponseTime || '2m'}</div>
            <div className="metric-trend">↘ -15%</div>
          </div>
          <div className="metric-card">
            <div className="metric-header">
              <FaChartBar className="metric-icon" />
              <span className="metric-title">Engagement Rate</span>
            </div>
            <div className="metric-value">87%</div>
            <div className="metric-trend">↗ +3%</div>
          </div>
          <div className="metric-card">
            <div className="metric-header">
              <FaComments className="metric-icon" />
              <span className="metric-title">Satisfaction Score</span>
            </div>
            <div className="metric-value">4.8/5</div>
            <div className="metric-trend">↗ Excellent</div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Top Performers</h3>
        <div className="performers-list">
          <div className="performer-item">
            <div className="performer-avatar">👤</div>
            <div className="performer-info">
              <div className="performer-name">Agent Sarah</div>
              <div className="performer-stats">98% response rate</div>
            </div>
            <div className="performer-score">98%</div>
          </div>
          <div className="performer-item">
            <div className="performer-avatar">👤</div>
            <div className="performer-info">
              <div className="performer-name">Agent Mike</div>
              <div className="performer-stats">95% response rate</div>
            </div>
            <div className="performer-score">95%</div>
          </div>
          <div className="performer-item">
            <div className="performer-avatar">👤</div>
            <div className="performer-info">
              <div className="performer-name">Agent Lisa</div>
              <div className="performer-stats">92% response rate</div>
            </div>
            <div className="performer-score">92%</div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn">
            <span className="action-icon">📝</span>
            <span className="action-text">Bulk Reply</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">📊</span>
            <span className="action-text">Generate Report</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">⚙️</span>
            <span className="action-text">Settings</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">🔄</span>
            <span className="action-text">Sync Data</span>
          </button>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Recent Activity</h3>
        <div className="recent-activity">
          {stats.recentActivity?.length > 0 ? (
            stats.recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon-small">
                  {activity.type === 'message' ? <FaTelegram color="#667eea" /> : <FaComments color="#667eea" />}
                </div>
                <div className="activity-details">
                  <p className="activity-text">{activity.text}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activity">
              <FaComments className="no-activity-icon" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default function Message() {
  const [searchParams] = useSearchParams();
  const [selectedPlatform, setSelectedPlatform] = useState("Dashboard");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [instagramFilter, setInstagramFilter] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState(null);
  const [replyModal, setReplyModal] = useState({ isOpen: false, item: null });
  const queryClient = useQueryClient();

  // Handle URL query parameters
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      switch (tab) {
        case 'dashboard':
          setSelectedPlatform("Dashboard");
          break;
        case 'message':
          setSelectedPlatform("Message");
          break;
        case 'comment':
          setSelectedPlatform("Comment");
          break;
        default:
          setSelectedPlatform("Dashboard");
      }
    }
  }, [searchParams]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['instagram-comments'],
    queryFn: fetchInstagramComments,
    refetchInterval: 10000,
  });

  const instagramMessages = data?.comments?.map((item) => ({
    id: item.id,
    sender: item.from_username || item.from_id || "Anonymous",
    text: item.text,
    unread: !!item.unread,
    read: !!item.read,
    replied: !!item.replied,
    reply: item.reply || "",
    replied_by: item.replied_by || "",
    replied_at: item.replied_at || null,
    type: item.parent_id ? 'comment' : 'message', // Distinguish between comments and messages
  })) || [];

  // Separate comments and messages
  const instagramComments = instagramMessages.filter(msg => msg.type === 'comment');
  const instagramDirectMessages = instagramMessages.filter(msg => msg.type === 'message');

  // Stats for comments
  const commentStats = {
    total: instagramComments.length,
    unread: instagramComments.filter(msg => msg.unread).length,
    replied: instagramComments.filter(msg => msg.replied).length,
    read: instagramComments.filter(msg => msg.read && !msg.replied).length
  };

  // Stats for messages
  const messageStats = {
    total: instagramDirectMessages.length,
    unread: instagramDirectMessages.filter(msg => msg.unread).length,
    replied: instagramDirectMessages.filter(msg => msg.replied).length,
    read: instagramDirectMessages.filter(msg => msg.read && !msg.replied).length
  };

  // Combined stats for dashboard
  const instagramStats = {
    total: instagramMessages.length,
    unread: instagramMessages.filter(msg => msg.unread).length,
    replied: instagramMessages.filter(msg => msg.replied).length,
    read: instagramMessages.filter(msg => msg.read && !msg.replied).length,
    comments: commentStats,
    messages: messageStats,
    totalComments: commentStats.total,
    totalMessages: messageStats.total,
    unreadComments: commentStats.unread,
    unreadMessages: messageStats.unread,
    repliedComments: commentStats.replied,
    repliedMessages: messageStats.replied,
    avgResponseTime: '2m',
    activeUsers: 15,
    engagementScore: 87,
    hotTopics: 3,
    satisfactionRate: 92,
    recentActivity: [
      { type: 'comment', text: 'New comment on post #123', time: '2 min ago', icon: '💬' },
      { type: 'message', text: 'Direct message from @user1', time: '5 min ago', icon: '📩' },
      { type: 'comment', text: 'Reply to comment on post #456', time: '8 min ago', icon: '💬' },
      { type: 'message', text: 'New message from @user2', time: '12 min ago', icon: '📩' },
    ]
  };

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${baseURL}/mark-comment-read/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries(['instagram-comments'])
  });

  const markAsRepliedMutation = useMutation({
    mutationFn: async ({ id, reply }) => {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${baseURL}/mark-comment-replied/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reply }),
      });
      if (!res.ok) throw new Error('Failed to reply');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries(['instagram-comments'])
  });

  const handleInstagramMessageClick = (msg) => {
    setSelectedMessage(msg);
    if (!msg.read) markAsReadMutation.mutate(msg.id);
  };

  const handleReply = (msg) => {
    setReplyError(null);
    setReplyModal({ isOpen: true, item: msg });
  };

  const handleReplySubmit = (replyText) => {
    if (replyModal.item) {
      markAsRepliedMutation.mutate(
        { id: replyModal.item.id, reply: replyText },
        {
          onError: (err) => setReplyError(err.message),
          onSuccess: () => {
            setReplyText("");
            setReplyModal({ isOpen: false, item: null });
          },
        }
      );
    }
  };

  const handleReplyClose = () => {
    setReplyModal({ isOpen: false, item: null });
    setReplyError(null);
  };

  const handleCommentClick = (comment) => {
    setSelectedMessage(comment);
    if (!comment.read) {
      markAsReadMutation.mutate(comment.id);
    }
  };

  const handleMarkAsRead = (commentId) => {
    markAsReadMutation.mutate(commentId);
  };

  const handleFilterChange = (filter) => {
    setInstagramFilter(filter);
  };

  const filteredInstagramComments = instagramComments.filter(msg => {
    if (instagramFilter === "unread") return msg.unread;
    if (instagramFilter === "read") return msg.read && !msg.replied;
    if (instagramFilter === "replied") return msg.replied;
    return true;
  });

  const filteredInstagramMessages = instagramDirectMessages.filter(msg => {
    if (instagramFilter === "unread") return msg.unread;
    if (instagramFilter === "read") return msg.read && !msg.replied;
    if (instagramFilter === "replied") return msg.replied;
    return true;
  });

  const dashboardStats = instagramStats;

  if (isLoading) return (
    <div className="call-center-agent-container">
      <div className="loading-container">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <div>Loading notifications...</div>
        </div>
      </div>
    </div>
  );
  
  if (isError) return (
    <div className="call-center-agent-container">
      <div className="error-container">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⚠️</div>
          <div>Error loading comments. Please try again.</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="call-center-agent-container">
      <h3 className="call-center-agent-title">
        {selectedPlatform === "Dashboard" ? "Instagram Dashboard" : 
         selectedPlatform === "Message" ? "Instagram Messages" : 
         selectedPlatform === "Comment" ? "Instagram Comments" : "Instagram Overview"}
      </h3>
      
      {selectedPlatform === "Dashboard" ? (
        <DashboardStats stats={dashboardStats} />
      ) : selectedPlatform === "Comment" ? (
        <div>
          <StatusFilters 
            filters={commentStatusFilters}
            activeFilter={instagramFilter}
            onFilterChange={handleFilterChange}
          />
          <CommentsList 
            comments={filteredInstagramComments}
            onCommentClick={handleCommentClick}
            onReply={handleReply}
            onMarkAsRead={handleMarkAsRead}
            selectedComment={selectedMessage}
            replyText={replyText}
            setReplyText={setReplyText}
            replyError={replyError}
          />
        </div>
      ) : selectedPlatform === "Message" ? (
        <div>
          <StatusFilters 
            filters={commentStatusFilters}
            activeFilter={instagramFilter}
            onFilterChange={handleFilterChange}
          />
          <MessagesList 
            messages={filteredInstagramMessages}
            onMessageClick={handleCommentClick}
            onReply={handleReply}
            onMarkAsRead={handleMarkAsRead}
            selectedMessage={selectedMessage}
            replyText={replyText}
            setReplyText={setReplyText}
            replyError={replyError}
          />
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: '#718096',
          fontSize: '16px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <div>Select a message to view details</div>
        </div>
      )}

      {/* Reply Modal */}
      <CallCenterReplyModal
        isOpen={replyModal.isOpen}
        onClose={handleReplyClose}
        onSubmit={handleReplySubmit}
        item={replyModal.item}
        loading={markAsRepliedMutation.isPending}
        error={replyError}
      />
    </div>
  );
}
