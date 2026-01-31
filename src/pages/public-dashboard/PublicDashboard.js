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
  MdPhoneDisabled,
  MdArrowBack,
} from "react-icons/md";
import { ArrowBack } from "@mui/icons-material";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { baseURL } from "../../config";
import io from "socket.io-client";
import ActiveCalls from "../../components/active-calls/ActiveCalls";
import "./PublicDashboard.css";

ChartJS.register(ArcElement, Tooltip, Legend);

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
  // Queue data from same source as Call Queue Monitoring (livestream/live-calls)
  const [waitingQueueCalls, setWaitingQueueCalls] = useState([]);

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
            callStats: data.callStats || {
              totalCounts: [],
              monthlyCounts: [],
              dailyCounts: [],
              totalRows: 0,
            },
            queueStatus: Array.isArray(data.queueStatus)
              ? data.queueStatus
              : [],
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
        liveCalls: Array.isArray(data.liveCalls)
          ? data.liveCalls
          : prev.liveCalls,
        callStats: {
          ...prev.callStats,
          totalCounts:
            data.callStats?.totalCounts || prev.callStats.totalCounts,
          monthlyCounts:
            data.callStats?.monthlyCounts || prev.callStats.monthlyCounts,
          dailyCounts:
            data.callStats?.dailyCounts || prev.callStats.dailyCounts,
        },
        queueStatus: Array.isArray(data.queueStatus)
          ? data.queueStatus
          : prev.queueStatus,
        callStatusSummary: data.callStatusSummary || prev.callStatusSummary,
      }));
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from dashboard socket");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Fetch queue (waiting) calls from same API as Call Queue Monitoring (agent dashboard)
    const fetchWaitingQueue = async () => {
      try {
        const response = await fetch(`${baseURL}/livestream/live-calls`);
        if (!response.ok) return;
        const data = await response.json();
        // Handle both array response and object with data/calls/waitingCalls (same source as CallQueueCard)
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.calls)
              ? data.calls
              : Array.isArray(data?.waitingCalls)
                ? data.waitingCalls
                : [];
        const waiting = list.filter((c) => c && (c.status === "calling" || c.status === "Calling"));
        setWaitingQueueCalls(waiting);
      } catch (error) {
        console.error("Error fetching waiting queue:", error);
      }
    };
    fetchWaitingQueue();

    // Periodic fetch for live calls and full dashboard data every 2 seconds
    const liveCallsInterval = setInterval(async () => {
      try {
        // Fetch full dashboard data
        const dashboardResponse = await fetch(`${baseURL}/public/dashboard`);
        if (dashboardResponse.ok) {
          const data = await dashboardResponse.json();
          setDashboardData({
            agentStatus: data.agentStatus || {
              onlineCount: 0,
              offlineCount: 0,
            },
            liveCalls: Array.isArray(data.liveCalls) ? data.liveCalls : [],
            callStats: data.callStats || {
              totalCounts: [],
              monthlyCounts: [],
              dailyCounts: [],
              totalRows: 0,
            },
            queueStatus: Array.isArray(data.queueStatus)
              ? data.queueStatus
              : [],
            callStatusSummary: data.callStatusSummary || {
              active: 0,
              inQueue: 0,
              answered: 0,
              dropped: 0,
              lost: 0,
            },
          });
        }
        // Same source as Call Queue Monitoring: livestream/live-calls
        const queueResponse = await fetch(`${baseURL}/livestream/live-calls`);
        if (queueResponse.ok) {
          const queueData = await queueResponse.json();
          const list = Array.isArray(queueData)
            ? queueData
            : Array.isArray(queueData?.data)
              ? queueData.data
              : Array.isArray(queueData?.calls)
                ? queueData.calls
                : Array.isArray(queueData?.waitingCalls)
                  ? queueData.waitingCalls
                  : [];
          const waiting = list.filter((c) => c && (c.status === "calling" || c.status === "Calling"));
          setWaitingQueueCalls(waiting);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    }, 2000); // Fetch every 2 seconds

    // Fallback: periodic fetch every 10 seconds if socket fails
    const fallbackInterval = setInterval(() => {
      if (!socket.connected) {
        fetchDashboardData();
      }
    }, 10000);

return () => {
  socket.disconnect();
  clearInterval(liveCallsInterval);
  clearInterval(fallbackInterval);
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

  // Wait time so far for calls still in queue (calling) — same idea as agent Call Queue Monitoring
  const getWaitDisplay = (call) => {
    if (call.estimated_wait_time != null) return `${call.estimated_wait_time}s`;
    if (call.queue_entry_time) return formatDuration(call.queue_entry_time);
    return "—";
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
  
  // In Queue: use same source as Call Queue Monitoring (livestream/live-calls, status === "calling")
  const inQueueCallsCount = waitingQueueCalls.length;

  // Helper function to calculate percentage
  const calculatePercentage = (count, total) => {
    if (total === 0) return "0.0";
    return ((count / total) * 100).toFixed(1);
  };

  // Helper function to get call type color
  const getCallTypeColor = (disposition) => {
    switch (disposition) {
      case "ANSWERED":
        return "#4caf50"; // Green
      case "NO ANSWER":
        return "#ff9800"; // Orange
      case "BUSY":
        return "#f44336"; // Red
      default:
        return "#666";
    }
  };

  // Calculate totals for each period
  const totalCounts = dashboardData.callStats.totalCounts || [];
  const monthlyCounts = dashboardData.callStats.monthlyCounts || [];
  const dailyCounts = dashboardData.callStats.dailyCounts || [];

  const yearlyTotal = totalCounts.reduce(
    (sum, item) => sum + (item.count || 0),
    0
  );
  const monthlyTotal = monthlyCounts.reduce(
    (sum, item) => sum + (item.count || 0),
    0
  );
  const dailyTotal = dailyCounts.reduce(
    (sum, item) => sum + (item.count || 0),
    0
  );

  // Extract counts for each disposition
  const getCount = (counts, disposition) =>
    counts.find((i) => i.disposition === disposition)?.count || 0;

  // Yearly counts
  const yearlyAnswered = getCount(totalCounts, "ANSWERED");
  const yearlyNoAnswer = getCount(totalCounts, "NO ANSWER");
  const yearlyBusy = getCount(totalCounts, "BUSY");

  // Monthly counts
  const monthlyAnswered = getCount(monthlyCounts, "ANSWERED");
  const monthlyNoAnswer = getCount(monthlyCounts, "NO ANSWER");
  const monthlyBusy = getCount(monthlyCounts, "BUSY");

  // Daily counts
  const dailyAnswered = getCount(dailyCounts, "ANSWERED");
  const dailyNoAnswer = getCount(dailyCounts, "NO ANSWER");
  const dailyBusy = getCount(dailyCounts, "BUSY");

  // Calculate percentages
  const yearlyAnsweredPercent = calculatePercentage(
    yearlyAnswered,
    yearlyTotal
  );
  const yearlyNoAnswerPercent = calculatePercentage(
    yearlyNoAnswer,
    yearlyTotal
  );
  const yearlyBusyPercent = calculatePercentage(yearlyBusy, yearlyTotal);

  const monthlyAnsweredPercent = calculatePercentage(
    monthlyAnswered,
    monthlyTotal
  );
  const monthlyNoAnswerPercent = calculatePercentage(
    monthlyNoAnswer,
    monthlyTotal
  );
  const monthlyBusyPercent = calculatePercentage(monthlyBusy, monthlyTotal);

  const dailyAnsweredPercent = calculatePercentage(dailyAnswered, dailyTotal);
  const dailyNoAnswerPercent = calculatePercentage(dailyNoAnswer, dailyTotal);
  const dailyBusyPercent = calculatePercentage(dailyBusy, dailyTotal);

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
          <div className="header-top">
            <IconButton
              className="back-button"
              onClick={() => navigate(-1)}
              aria-label="go back"
            >
              <ArrowBack />
            </IconButton>
            <h1 className="dashboard-title">WCF Call Center Dashboard</h1>
          </div>
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

      {/* Calls Waiting for Agents (same data as Call Queue Monitoring) */}
      <div className="dashboard-section">
        <h2 className="section-title"><MdQueue className="section-icon" /> Calls Waiting for Agents</h2>
        <div className="queue-table-wrap">
          <table className="queue-waiting-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Duration / Wait</th>
                <th>Call Type</th>
              </tr>
            </thead>
            <tbody>
              {waitingQueueCalls.length > 0 ? (
                waitingQueueCalls.map((call) => (
                  <tr key={call.linkedid || call.caller + (call.call_start || "")}>
                    <td>{call.caller || "—"}</td>
                    <td>{call.callee || call.cid_dnid || "—"}</td>
                    <td><span className="queue-status-badge calling">{call.status || "calling"}</span></td>
                    <td>{getWaitDisplay(call)}</td>
                    <td>{call.caller && (String(call.caller).startsWith("1") ? "outbound" : "inbound")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="queue-empty">No waiting calls in the queue.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Calls */}
      <div className="dashboard-section">
        <ActiveCalls liveCalls={dashboardData.liveCalls} refreshInterval={2000} showTitle={true} />
      </div>

      {/* Call Summary Statistics – Three radial (doughnut) charts: Daily, Monthly, Yearly */}
      <div className="dashboard-section">
        <h2 className="section-title">
          <MdTrendingUp className="section-icon" />
          Call Summary Statistics
        </h2>

        <div className="call-summary-pie-row">
          {[
            { period: "Daily", answered: dailyAnswered, noAnswer: dailyNoAnswer, busy: dailyBusy, total: dailyTotal },
            { period: "Monthly", answered: monthlyAnswered, noAnswer: monthlyNoAnswer, busy: monthlyBusy, total: monthlyTotal },
            { period: "Yearly", answered: yearlyAnswered, noAnswer: yearlyNoAnswer, busy: yearlyBusy, total: yearlyTotal },
          ].map(({ period, answered, noAnswer, busy, total }) => {
            const radialData = {
              labels: ["Answered", "No Answer", "Busy"],
              datasets: [
                {
                  data: [answered, noAnswer, busy],
                  backgroundColor: [
                    getCallTypeColor("ANSWERED"),
                    getCallTypeColor("NO ANSWER"),
                    getCallTypeColor("BUSY"),
                  ],
                  borderColor: ["#fff", "#fff", "#fff"],
                  borderWidth: 2,
                  hoverOffset: 6,
                },
              ],
            };
            const radialOptions = {
              responsive: true,
              maintainAspectRatio: false,
              cutout: "55%",
              spacing: 2,
              plugins: {
                legend: { position: "bottom", labels: { padding: 12, usePointStyle: true, font: { size: 11 } } },
                tooltip: {
                  callbacks: {
                    label: (ctx) => {
                      const value = ctx.raw || 0;
                      const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                      return `${ctx.label}: ${value} (${pct}%)`;
                    },
                  },
                },
              },
            };
            return (
              <div key={period} className="call-summary-pie-cell">
                <h3 className="call-summary-pie-title">{period}</h3>
                {total === 0 ? (
                  <div className="call-summary-pie-empty">No data</div>
                ) : (
                  <div className="call-summary-pie-container">
                    <Doughnut data={radialData} options={radialOptions} />
                  </div>
                )}
                <div className="call-summary-pie-total">
                  Total: <strong>{total}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Queue Status Section
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
      )} */}

      {/* Lost Calls Modal */}
      <Dialog
        open={showLostCallsModal}
        onClose={() => setShowLostCallsModal(false)}
        maxWidth="md"
        fullWidth
      >
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
                    {call.status === "called_back" ? "CALLED BACK" : "NO ANSWER"}

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