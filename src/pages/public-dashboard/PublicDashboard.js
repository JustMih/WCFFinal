import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Close as CloseIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";
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
} from "react-icons/md";
import { ArrowBack } from "@mui/icons-material";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { baseURL } from "../../config";
import io from "socket.io-client";
import ActiveCalls from "../../components/active-calls/ActiveCalls";
import ReactApexChart from "react-apexcharts";
import "./PublicDashboard.css";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PublicDashboard() {
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

  // Area Chart Data for Call Summary Statistics
  // Prepare categories for the area chart
  const areaChartCategories = [
    "Daily",
    "Monthly",
    "Yearly",
  ];

  const areaChartSeries = [
    {
      name: "Total Calls",
      data: [dailyTotal, monthlyTotal, yearlyTotal],
    },
    {
      name: "Answered",
      data: [dailyAnswered, monthlyAnswered, yearlyAnswered],
    },
    {
      name: "No Answer",
      data: [dailyNoAnswer, monthlyNoAnswer, yearlyNoAnswer],
    },
    {
      name: "Busy",
      data: [dailyBusy, monthlyBusy, yearlyBusy],
    },
  ];

  const areaChartOptions = {
    chart: {
      type: "area",
      height: 350,
      toolbar: {
        show: true,
      },
      zoom: {
        enabled: false,
      },
      stacked: false,
      width: "100%",
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100],
      },
    },
    colors: ["#667eea", "#4caf50", "#ff9800", "#f44336"],
    xaxis: {
      categories: areaChartCategories,
      labels: {
        style: {
          fontSize: "12px",
          fontWeight: 500,
        },
      },
    },
    yaxis: {
      title: {
        text: "Number of Calls",
        style: {
          fontSize: "12px",
          fontWeight: 600,
        },
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " calls";
        },
      },
    },
    legend: {
      show: true,
      position: "top",
      fontSize: "12px",
      fontWeight: 500,
    },
  };

  // Pie Chart Data for Call Statistics Distribution
  const pieChartSeries = [dailyAnswered, dailyNoAnswer, dailyBusy];
  const pieChartOptions = {
    chart: {
      type: "pie",
      height: 350,
    },
    labels: ["Answered", "No Answer", "Busy"],
    colors: ["#4caf50", "#ff9800", "#f44336"],
    legend: {
      position: "bottom",
      fontSize: "14px",
      fontWeight: 500,
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val.toFixed(1) + "%";
      },
      style: {
        fontSize: "12px",
        fontWeight: 600,
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " calls";
        },
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 300,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

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

  // Format time for watch display
  const formatWatchTime = (date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    return { hours, minutes, seconds, day, month, weekday };
  };

  const watchTime = formatWatchTime(currentTime);

  return (
    <div className="public-dashboard">
      {/* Floating Watch Display */}
      <Box
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 100,
        }}
        className="floating-watch"
      >
        <Card
          sx={{
            borderRadius: "50%",
            width: 120,
            height: 120,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            border: "4px solid rgba(255, 255, 255, 0.3)",
            position: "relative",
            overflow: "visible",
          }}
        >
          <CardContent sx={{ p: 0, textAlign: "center", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            {/* Time Display */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "white",
                fontSize: "1.1rem",
                lineHeight: 1.2,
                fontFamily: "monospace",
                letterSpacing: "1px",
              }}
            >
              {watchTime.hours}:{watchTime.minutes}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "0.65rem",
                fontWeight: 600,
                mt: 0.2,
                fontFamily: "monospace",
              }}
            >
              {watchTime.seconds}
            </Typography>
            {/* Date Display */}
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255, 255, 255, 0.85)",
                fontSize: "0.6rem",
                mt: 0.3,
                fontWeight: 500,
              }}
            >
              {watchTime.weekday} {watchTime.day}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255, 255, 255, 0.85)",
                fontSize: "0.55rem",
                fontWeight: 500,
              }}
            >
              {watchTime.month}
            </Typography>
          </CardContent>
          {/* Watch Crown/Button */}
          <Box
            sx={{
              position: "absolute",
              top: -8,
              left: "50%",
              transform: "translateX(-50%)",
              width: 20,
              height: 8,
              borderRadius: "4px 4px 0 0",
              background: "rgba(255, 255, 255, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.6)",
            }}
          />
        </Card>
        {/* Back Arrow Button */}
            <IconButton
          onClick={() => window.history.back()}
          sx={{
            position: "absolute",
            top: 140,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(102, 126, 234, 0.9)",
            color: "white",
            width: 40,
            height: 40,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            "&:hover": {
              backgroundColor: "rgba(102, 126, 234, 1)",
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)",
            },
            transition: "all 0.3s ease",
          }}
              aria-label="go back"
            >
          <ArrowBackIcon />
            </IconButton>
      </Box>

      {/* Stats Grid - Two Combined Cards */}
      <Box sx={{ position: "relative", pt: { xs: 10, sm: 0 }, pl: { xs: 0, sm: 0, md: 20 } }}>
        <Grid container spacing={0} sx={{ mb: 3, width: "100%", display: "flex" }}>
          {/* Card 1: Online Agents, Active Calls, In Queue */}
          <Grid item xs={12} md={6} sx={{ flex: "1 1 50%", maxWidth: "50%", pr: { xs: 0, md: 0.75 }, pb: { xs: 1.5, md: 0 } }}>
            <Card sx={{ height: "100%", boxShadow: 3, width: "100%" }}>
              <CardContent sx={{ width: "100%", p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <MdPeople size={24} style={{ color: "#1976d2" }} />
                  Call Center Status
                </Typography>
                <Grid container spacing={0} sx={{ width: "100%" }}>
                  <Grid item xs={4} sx={{ flex: "1 1 33.333%", maxWidth: "33.333%" }}>
                    <Box textAlign="center" sx={{ width: "100%", px: 0.5 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#1976d2", mb: 0.5 }}>
                        {dashboardData.agentStatus.onlineCount}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.875rem" }}>
                        Online Agents
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.75rem" }}>
              {totalAgents > 0 ? `${Math.round((dashboardData.agentStatus.onlineCount / totalAgents) * 100)}% Available` : "No Agents"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4} sx={{ flex: "1 1 33.333%", maxWidth: "33.333%" }}>
                    <Box textAlign="center" sx={{ width: "100%", px: 0.5 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#4caf50", mb: 0.5 }}>
                        {activeCalls.length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.875rem" }}>
                        Active Calls
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.75rem" }}>
                        In progress
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4} sx={{ flex: "1 1 33.333%", maxWidth: "33.333%" }}>
                    <Box textAlign="center" sx={{ width: "100%", px: 0.5 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#ff9800", mb: 0.5 }}>
                        {dashboardData.callStatusSummary?.inQueue || inQueueCallsCount || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.875rem" }}>
                        In Queue
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.75rem" }}>
                        Waiting
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 2: Total Calls, Answered Today, Lost Today */}
          <Grid item xs={12} md={6} sx={{ flex: "1 1 50%", maxWidth: "50%", pl: { xs: 0, md: 0.75 } }}>
            <Card sx={{ height: "100%", boxShadow: 3, width: "100%" }}>
              <CardContent sx={{ width: "100%", p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <MdTrendingUp size={24} style={{ color: "#667eea" }} />
                  Call Statistics
                </Typography>
                <Grid container spacing={0} sx={{ width: "100%" }}>
                  <Grid item xs={4} sx={{ flex: "1 1 33.333%", maxWidth: "33.333%" }}>
                    <Box textAlign="center" sx={{ width: "100%", px: 0.5 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#667eea", mb: 0.5 }}>
                        {dashboardData.callStats.totalRows || yearlyTotal || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.875rem" }}>
                        Total Calls
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.75rem" }}>
                        All time
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4} sx={{ flex: "1 1 33.333%", maxWidth: "33.333%" }}>
                    <Box textAlign="center" sx={{ width: "100%", px: 0.5 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#4caf50", mb: 0.5 }}>
                        {answeredCalls?.count || dailyAnswered || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.875rem" }}>
                        Answered Today
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.75rem" }}>
                        Daily calls
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4} sx={{ flex: "1 1 33.333%", maxWidth: "33.333%" }}>
                    <Box textAlign="center" sx={{ width: "100%", px: 0.5 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#f44336", mb: 0.5 }}>
                        {lostCallsCount}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.875rem" }}>
                        Lost Today
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<MdVisibility />}
                        onClick={handleShowLostCalls}
                        sx={{ mt: 0.5, fontSize: "0.7rem" }}
                      >
                View Details
              </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Active Calls */}
      <div className="dashboard-section">
        <ActiveCalls liveCalls={dashboardData.liveCalls} refreshInterval={2000} showTitle={true} />
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