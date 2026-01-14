import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import {
  MdPhone,
  MdPhoneInTalk,
  MdPeople,
  MdCallEnd,
  MdTrendingUp,
  MdAccessTime,
  MdQueue,
  MdVisibility,
} from "react-icons/md";
import { baseURL } from "../../config";
import io from "socket.io-client";
import "./PublicDashboard.css";

export default function PublicDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    agentStatus: { onlineCount: 0, offlineCount: 0 },
    liveCalls: [],
    callStats: { dailyCounts: [], totalRows: 0 },
    queueStatus: [],
    callStatusSummary: { active: 0, inQueue: 0, answered: 0, dropped: 0, lost: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lostCalls, setLostCalls] = useState([]);
  const [showLostCallsModal, setShowLostCallsModal] = useState(false);
  const [lostCallsLoading, setLostCallsLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${baseURL}/public/dashboard`);
        if (response.ok) {
          const data = await response.json();
          setDashboardData({
            agentStatus: data.agentStatus || { onlineCount: 0, offlineCount: 0 },
            liveCalls: Array.isArray(data.liveCalls) ? data.liveCalls : [],
            callStats: data.callStats || { dailyCounts: [], totalRows: 0 },
            queueStatus: Array.isArray(data.queueStatus) ? data.queueStatus : [],
            callStatusSummary: data.callStatusSummary || {
              active: 0,
              inQueue: 0,
              answered: 0,
              dropped: 0,
              lost: 0,
            },
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    const socketUrl = baseURL.replace(/\/api$/, "") || "https://192.168.21.70";
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => console.log("Connected to dashboard socket"));
    socket.on("public_dashboard_update", (data) => {
      setDashboardData((prev) => ({
        ...prev,
        agentStatus: data.agentStatus || prev.agentStatus,
        liveCalls: Array.isArray(data.liveCalls) ? data.liveCalls : prev.liveCalls,
        callStats: { ...prev.callStats, dailyCounts: data.callStats?.dailyCounts || prev.callStats.dailyCounts },
        queueStatus: Array.isArray(data.queueStatus) ? data.queueStatus : prev.queueStatus,
        callStatusSummary: data.callStatusSummary || prev.callStatusSummary,
      }));
    });
    socket.on("disconnect", () => console.log("Disconnected from socket"));
    socket.on("connect_error", (err) => console.error("Socket error:", err));

    const interval = setInterval(fetchDashboardData, 2000);
    const fallback = setInterval(() => !socket.connected && fetchDashboardData(), 10000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
      clearInterval(fallback);
    };
  }, []);

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (startTime) => {
    if (!startTime) return "00:00";
    const diff = Math.floor((new Date() - new Date(startTime)) / 1000);
    return formatTime(diff);
  };

  const extractAgentFromChannel = (channel) => {
    if (!channel) return "Unassigned";
    const match = channel.match(/\/(\d+)/);
    return match ? match[1] : channel;
  };

  const extractPhoneFromClid = (clid) => {
    if (!clid) return "Unknown";
    const match = clid.match(/<(\d+)>/) || clid.match(/(\d+)/);
    return match ? match[1] : clid;
  };

  const activeCalls = dashboardData.liveCalls.filter((call) => call.status === "active");
  const totalAgents = dashboardData.agentStatus.onlineCount + dashboardData.agentStatus.offlineCount;
  const answeredCalls = dashboardData.callStats.dailyCounts.find((c) => c.disposition === "ANSWERED");
  const lostCallsCount = dashboardData.callStatusSummary?.lost || 0;
  const inQueueCallsCount = dashboardData.callStatusSummary?.inQueue || 0;

  const fetchLostCalls = async () => {
    setLostCallsLoading(true);
    try {
      const response = await fetch(`${baseURL}/calls/lost-calls-today`);
      if (response.ok) {
        const data = await response.json();
        setLostCalls(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch lost calls:", response.status);
      }
    } catch (error) {
      console.error("Error fetching lost calls:", error);
    } finally {
      setLostCallsLoading(false);
    }
  };

  const handleShowLostCalls = () => {
    setShowLostCallsModal(true);
    if (lostCalls.length === 0) fetchLostCalls();
  };

  if (loading) {
    return (
      <div className="public-dashboard">
        <div className="dashboard-loading">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="public-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">WCF Call Center Dashboard</h1>
          <div className="current-time">
            {currentTime.toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card online-agents">
          <div className="stat-icon"><MdPeople /></div>
          <div className="stat-content">
            <div className="stat-value">{dashboardData.agentStatus.onlineCount}</div>
            <div className="stat-label">Online Agents</div>
            <div className="stat-sublabel">
              {totalAgents > 0 ? `${Math.round((dashboardData.agentStatus.onlineCount / totalAgents) * 100)}% Available` : "No Agents"}
            </div>
          </div>
        </div>

        <div className="stat-card active-calls">
          <div className="stat-icon"><MdPhoneInTalk /></div>
          <div className="stat-content">
            <div className="stat-value">{activeCalls.length}</div>
            <div className="stat-label">Active Calls</div>
            <div className="stat-sublabel">Currently in progress</div>
          </div>
        </div>

        <div className="stat-card answered-calls">
          <div className="stat-icon"><MdPhone /></div>
          <div className="stat-content">
            <div className="stat-value">{answeredCalls?.count || 0}</div>
            <div className="stat-label">Answered Today</div>
            <div className="stat-sublabel">Daily answered calls</div>
          </div>
        </div>

        <div className="stat-card missed-calls">
          <div className="stat-icon"><MdCallEnd /></div>
          <div className="stat-content">
            <div className="stat-value">{lostCallsCount}</div>
            <div className="stat-label">Lost Today</div>
            <div className="stat-sublabel">
              <Button size="small" variant="outlined" startIcon={<MdVisibility />} onClick={handleShowLostCalls}>
                View Details
              </Button>
            </div>
          </div>
        </div>

        <div className="stat-card total-calls">
          <div className="stat-icon"><MdTrendingUp /></div>
          <div className="stat-content">
            <div className="stat-value">{dashboardData.callStats.totalRows || 0}</div>
            <div className="stat-label">Total Calls</div>
            <div className="stat-sublabel">All time records</div>
          </div>
        </div>

        <div className="stat-card queue-status">
          <div className="stat-icon"><MdQueue /></div>
          <div className="stat-content">
            <div className="stat-value">{inQueueCallsCount}</div>
            <div className="stat-label">In Queue</div>
            <div className="stat-sublabel">Waiting for agents</div>
          </div>
        </div>
      </div>

      {/* Active Calls */}
      <div className="dashboard-section">
        <h2 className="section-title"><MdPhoneInTalk className="section-icon" /> Active Calls</h2>
        <div className="active-calls-grid">
          {activeCalls.length > 0 ? (
            activeCalls.map((call, i) => (
              <div key={call.linkedid || i} className="call-card">
                <div className="call-header">
                  <div className="call-status-badge active">ACTIVE</div>
                  <div className="call-duration">
                    <MdAccessTime /> {formatDuration(call.call_answered || call.call_start)}
                  </div>
                </div>
                <div className="call-details">
                  <div className="call-info-row">
                    <span className="call-label">From:</span>
                    <span className="call-value">{extractPhoneFromClid(call.caller)}</span>
                  </div>
                  <div className="call-info-row">
                    <span className="call-label">Agent:</span>
                    <span className="call-value">{extractAgentFromChannel(call.channel)}</span>
                  </div>
                  {call.call_answered && (
                    <div className="call-info-row">
                      <span className="call-label">Started:</span>
                      <span className="call-value">{new Date(call.call_answered).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-calls">No active calls at the moment</div>
          )}
        </div>
      </div>

      {/* Queue Status */}
      {dashboardData.queueStatus.length > 0 && (
        <div className="dashboard-section">
          <h2 className="section-title"><MdQueue className="section-icon" /> Queue Status</h2>
          <div className="queue-grid">
            {dashboardData.queueStatus.map((q, i) => (
              <div key={q.queue || i} className="queue-card">
                <div className="queue-name">{q.queue || "Unknown"}</div>
                <div className="queue-stats">
                  <div className="queue-stat"><span className="queue-stat-label">Calls:</span> <span>{q.calls || 0}</span></div>
                  <div className="queue-stat"><span className="queue-stat-label">Agents:</span> <span>{q.agents || 0}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Statistics */}
      <div className="dashboard-section">
        <h2 className="section-title"><MdTrendingUp className="section-icon" /> Today's Call Statistics</h2>
        <div className="stats-table">
          <div className="stats-table-header">
            <div className="stats-table-cell">Status</div>
            <div className="stats-table-cell">Count</div>
          </div>
          {dashboardData.callStats.dailyCounts.length > 0 ? (
            dashboardData.callStats.dailyCounts.map((s, i) => (
              <div key={i} className="stats-table-row">
                <div className="stats-table-cell">{s.disposition || "Unknown"}</div>
                <div className="stats-table-cell">{s.count || 0}</div>
              </div>
            ))
          ) : (
            <div className="stats-table-row">
              <div className="stats-table-cell">No data available</div>
              <div className="stats-table-cell">-</div>
            </div>
          )}
        </div>
      </div>

      {/* Lost Calls Modal - Fully Enhanced */}
      <Dialog open={showLostCallsModal} onClose={() => setShowLostCallsModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Lost Calls Today - Callback Details</span>
            <IconButton onClick={() => setShowLostCallsModal(false)}><CloseIcon /></IconButton>
          </div>
        </DialogTitle>
        <DialogContent>
          {lostCallsLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>Loading lost calls...</div>
          ) : lostCalls.length > 0 ? (
            <div className="lost-calls-list enhanced">
              <div className="lost-call-item header">
                <div>Phone Number</div>
                <div>Missed At</div>
                <div>Status</div>
                <div>Callback Agent</div>
                <div>Callback Time</div>
                <div>Talk Duration</div>
              </div>

              {lostCalls.map((call, i) => (
                <div
                  key={i}
                  className={`lost-call-item ${call.status === "called_back" ? "called-back" : ""}`}
                >
                  <div className="lost-call-phone">
                    {extractPhoneFromClid(call.caller)}
                  </div>
                  <div className="lost-call-time">
                    {call.call_time
                      ? new Date(call.call_time).toLocaleString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "-"}
                  </div>
                  <div className="lost-call-status">
                    <span className={`status-badge ${call.status === "called_back" ? "called-back" : "no-answer"}`}>
                      {call.disposition || (call.status === "called_back" ? "CALLED BACK" : "NO ANSWER")}
                    </span>
                  </div>
                  <div className="lost-call-callback">
                    {call.callback_agent_name || (call.callback_agent_extension ? `Agent ${call.callback_agent_extension}` : "-")}
                  </div>
                  <div className="lost-call-callback-time">
                    {call.callback_time
                      ? new Date(call.callback_time).toLocaleString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "-"}
                  </div>
                  <div className="lost-call-duration">
                    {call.callback_duration > 0 ? formatTime(call.callback_duration) : "-"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              No lost calls recorded today
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLostCallsModal(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}