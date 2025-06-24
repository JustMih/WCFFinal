import React, { useState } from "react";
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

const socialMediaPlatforms = [
  { name: "Dashboard", icon: <FaChartBar color="purple" /> },
  { name: "Message", icon: <FaTelegram color="blue" /> },
  { name: "Comment", icon: <FaWhatsapp color="green" /> },
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

const DashboardStats = ({ stats }) => (
  <div className="dashboard-container">
    <div className="dashboard-stats">
      <div className="stat-card">
        <FaBell className="stat-icon" style={{ color: '#E1306C' }} />
        <div className="stat-content">
          <h3>Total Notifications</h3>
          <p>{stats.total}</p>
        </div>
      </div>
      <div className="stat-card">
        <FaComments className="stat-icon" style={{ color: '#1877F3' }} />
        <div className="stat-content">
          <h3>Unread Messages</h3>
          <p>{stats.unread}</p>
        </div>
      </div>
      <div className="stat-card">
        <FaComments className="stat-icon" style={{ color: '#25D366' }} />
        <div className="stat-content">
          <h3>Replied Messages</h3>
          <p>{stats.replied}</p>
        </div>
      </div>
    </div>

    <div className="dashboard-section">
      <h2>Activity Overview</h2>
      <div className="activity-cards">
        <div className="activity-card">
          <FaChartLine className="activity-icon" />
          <div className="activity-content">
            <h3>Response Rate</h3>
            <p>{((stats.replied / stats.total) * 100).toFixed(1)}%</p>
          </div>
        </div>
        <div className="activity-card">
          <FaUserFriends className="activity-icon" />
          <div className="activity-content">
            <h3>Active Users</h3>
            <p>{stats.activeUsers || 0}</p>
          </div>
        </div>
        <div className="activity-card">
          <FaClock className="activity-icon" />
          <div className="activity-content">
            <h3>Avg. Response Time</h3>
            <p>{stats.avgResponseTime || '0m'}</p>
          </div>
        </div>
      </div>
    </div>

    <div className="dashboard-section">
      <h2>Recent Activity</h2>
      <div className="recent-activity">
        {stats.recentActivity?.map((activity, index) => (
          <div key={index} className="activity-item">
            <div className="activity-icon-small">
              {activity.type === 'message' ? <FaTelegram /> : <FaWhatsapp />}
            </div>
            <div className="activity-details">
              <p className="activity-text">{activity.text}</p>
              <span className="activity-time">{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function Message() {
  const [selectedPlatform, setSelectedPlatform] = useState("Dashboard");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [instagramFilter, setInstagramFilter] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState(null);
  const queryClient = useQueryClient();

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
  })) || [];

  const instagramStats = {
    total: instagramMessages.length,
    unread: instagramMessages.filter(msg => msg.unread).length,
    replied: instagramMessages.filter(msg => msg.replied).length,
    read: instagramMessages.filter(msg => msg.read && !msg.replied).length
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
    markAsRepliedMutation.mutate(
      { id: msg.id, reply: replyText },
      {
        onError: (err) => setReplyError(err.message),
        onSuccess: () => setReplyText(""),
      }
    );
  };

  const filteredInstagramMessages = instagramMessages.filter(msg => {
    if (instagramFilter === "unread") return msg.unread;
    if (instagramFilter === "read") return msg.read && !msg.replied;
    if (instagramFilter === "replied") return msg.replied;
    return true;
  });

  const dashboardStats = instagramStats;

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading comments.</div>;

  return (
    <div className="message-ground">
      <div className="column">
        <h3 className="column-header">WCF Notifications</h3>
        <ul>
          {socialMediaPlatforms.map(({ name, icon }) => (
            <li
              key={name}
              className={`column-link ${selectedPlatform === name ? "message-active-link" : ""}`}
              onClick={() => {
                setSelectedPlatform(name);
                setSelectedMessage(null);
                if (name === "Instagram") setInstagramFilter("all");
              }}
            >
              <span className="icon">{icon}</span> {name}
              {name === "Comment" && (
                <span className="sidebar-badge-group">
                  <span className="sidebar-badge unread" onClick={e => { e.stopPropagation(); setInstagramFilter("unread"); setSelectedPlatform("Comment"); setSelectedMessage(null); }}>{instagramStats.unread}</span>
                  <span className="sidebar-badge read" onClick={e => { e.stopPropagation(); setInstagramFilter("read"); setSelectedPlatform("Comment"); setSelectedMessage(null); }}>{instagramStats.read}</span>
                  <span className="sidebar-badge replied" onClick={e => { e.stopPropagation(); setInstagramFilter("replied"); setSelectedPlatform("Comment"); setSelectedMessage(null); }}>{instagramStats.replied}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="column">
        <h3 className="column-header">{selectedPlatform === "Dashboard" ? "Overview" : "Messages"}</h3>
        {selectedPlatform === "Dashboard" ? (
          <DashboardStats stats={dashboardStats} />
        ) : selectedPlatform === "Instagram" || selectedPlatform === "Comment" ? (
          <ul>
            {filteredInstagramMessages.map((msg) => (
              <li
                key={msg.id}
                className={`column-link ${selectedMessage?.id === msg.id ? "message-active-link" : ""}`}
                onClick={() => handleInstagramMessageClick(msg)}
              >
                <span className={msg.unread ? "font-bold" : ""}>
                  {msg.sender}: {msg.text.length > 20 ? msg.text.slice(0, 20) + "..." : msg.text}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Select a message to view details</p>
        )}
      </div>

      <div className="column">
        <h3 className="column-header">Details</h3>
        {selectedMessage ? (
          <div className="message-details">
            <p className="mb-2"><strong>{selectedMessage.sender}:</strong> {selectedMessage.text}</p>
            <textarea
              className="message-text-area"
              rows="4"
              placeholder="Type a reply..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              disabled={selectedMessage.replied}
            ></textarea>
            <button
              className="send-btn"
              disabled={selectedMessage.replied || !replyText.trim()}
              onClick={() => handleReply(selectedMessage)}
            >
              Reply
            </button>
            {replyError && <p className="error-message">{replyError}</p>}
            {selectedMessage.replied && selectedMessage.reply && (
              <div className="reply-status">
                <strong>Your reply:</strong> {selectedMessage.reply}
                {selectedMessage.replied_by && (
                  <div><strong>Replied by:</strong> {selectedMessage.replied_by}</div>
                )}
                {selectedMessage.replied_at && (
                  <div><strong>Replied at:</strong> {new Date(selectedMessage.replied_at).toLocaleString()}</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p>Select a message to view details</p>
        )}
      </div>
    </div>
  );
}
