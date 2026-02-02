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
import { baseURL } from "../../config";
import io from "socket.io-client";
import ActiveCalls from "../../components/active-calls/ActiveCalls";
import ReactApexChart from "react-apexcharts";
import "./PublicDashboard.css";

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

    const socketUrl = baseURL.replace(/\/api$/, "") || "https://192.168.21.69";
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
  
  // Calculate inQueue dynamically from live calls (calls in queue but not answered)
  const inQueueCallsCount = dashboardData.liveCalls.filter(
    (call) => call.queue_entry_time && !call.call_answered && !call.call_end
  ).length;

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

  // Calculate dropped calls (daily): Daily Total calls - (Daily Answered Calls + Daily Lost Calls)
  const dailyTotalCalls = dailyTotal || 0;
  const answeredCallsCount = answeredCalls?.count || dailyAnswered || 0;
  const droppedCallsCount = Math.max(0, dailyTotalCalls - (answeredCallsCount + lostCallsCount));

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
                  <Grid item xs={3} sx={{ flex: "1 1 25%", maxWidth: "25%" }}>
                    <Box textAlign="center" sx={{ width: "100%", px: 0.5 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#667eea", mb: 0.5 }}>
                        {dailyTotalCalls}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.875rem" }}>
                        Total Calls
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.75rem" }}>
                        Daily
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3} sx={{ flex: "1 1 25%", maxWidth: "25%" }}>
                    <Box textAlign="center" sx={{ width: "100%", px: 0.5 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#4caf50", mb: 0.5 }}>
                        {answeredCallsCount}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.875rem" }}>
                        Answered Calls
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.75rem" }}>
                        Answered
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3} sx={{ flex: "1 1 25%", maxWidth: "25%" }}>
                    <Box textAlign="center" sx={{ width: "100%", px: 0.5 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#f44336", mb: 0.5 }}>
                        {lostCallsCount}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.875rem" }}>
                        Lost Calls
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
                  <Grid item xs={3} sx={{ flex: "1 1 25%", maxWidth: "25%" }}>
                    <Box textAlign="center" sx={{ width: "100%", px: 0.5 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#ff9800", mb: 0.5 }}>
                        {droppedCallsCount}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.875rem" }}>
                        Dropped Calls
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.75rem" }}>
                        Dropped
                      </Typography>
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



      <div className="dashboard-section" style={{ width: "100%", overflow: "hidden", boxSizing: "border-box" }}>
        {/* Charts Section - Area Chart and Pie Chart Side by Side */}
        <Box sx={{ mb: 4, mt: 2, width: "100%", position: "relative", zIndex: 1 }}>
          <Grid container spacing={3} sx={{ width: "100%", display: "flex", flexWrap: { xs: "wrap", md: "nowrap" } }}>
            {/* Area Chart - Call Summary Statistics */}
            <Grid item xs={12} md={8} sx={{ flex: { md: "0 0 66.67%" }, maxWidth: { md: "66.67%" }, minWidth: 0, pr: { md: 1.5 } }}>
              <Card sx={{ boxShadow: 3, p: 2, height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <MdTrendingUp size={24} style={{ color: "#667eea" }} />
                  Call Summary Trend
                </Typography>
                <Box sx={{ flex: 1, width: "100%", minWidth: 0 }}>
                  <ReactApexChart
                    options={areaChartOptions}
                    series={areaChartSeries}
                    type="area"
                    height={350}
                    width="100%"
                  />
                </Box>
              </Card>
            </Grid>

            {/* Pie Chart - Call Statistics Distribution */}
            <Grid item xs={12} md={4} sx={{ flex: { md: "0 0 33.33%" }, maxWidth: { md: "33.33%" }, minWidth: 0, pl: { md: 1.5 } }}>
              <Card sx={{ boxShadow: 3, p: 2, height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <MdTrendingUp size={24} style={{ color: "#667eea" }} />
                  Call Statistics Distribution
                </Typography>
                <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
                  <ReactApexChart
                    options={pieChartOptions}
                    series={pieChartSeries}
                    type="pie"
                    height={350}
                    width="100%"
                  />
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </div>

      {/* Call Summary Statistics Section */}
      <div className="dashboard-section" style={{ width: "100%", overflow: "hidden", boxSizing: "border-box" }}>
        <h2 className="section-title">
          <MdTrendingUp className="section-icon" />
          Call Summary Statistics
        </h2>

        <Grid container spacing={3} sx={{ mt: 2, width: "100%", margin: 0, display: "flex", flexWrap: { xs: "wrap", md: "nowrap" } }}>
          {/* Daily Call Summary Table */}
          <Grid item xs={12} md={4} sx={{ flex: { md: "1 1 33.33%" }, minWidth: 0, display: "flex" }}>
            <Card sx={{ boxShadow: 3, width: "100%", display: "flex", flexDirection: "column" }}>
              <CardContent sx={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <MdAccessTime size={20} style={{ color: "#667eea" }} />
                  Daily Call Summary
                </Typography>
                <TableContainer component={Paper} sx={{ boxShadow: "none", width: "100%", flex: 1 }}>
                  <Table size="small" sx={{ width: "100%" }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Count</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <MdPhone size={18} style={{ color: getCallTypeColor("ANSWERED") }} />
                            Answered
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{dailyAnswered}</TableCell>
                        <TableCell align="right" sx={{ color: getCallTypeColor("ANSWERED"), fontWeight: 600 }}>{dailyAnsweredPercent}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <MdPhoneDisabled size={18} style={{ color: getCallTypeColor("NO ANSWER") }} />
                            No Answer
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{dailyNoAnswer}</TableCell>
                        <TableCell align="right" sx={{ color: getCallTypeColor("NO ANSWER"), fontWeight: 600 }}>{dailyNoAnswerPercent}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <MdCallEnd size={18} style={{ color: getCallTypeColor("BUSY") }} />
                            Busy
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{dailyBusy}</TableCell>
                        <TableCell align="right" sx={{ color: getCallTypeColor("BUSY"), fontWeight: 600 }}>{dailyBusyPercent}%</TableCell>
                      </TableRow>
                      <TableRow sx={{ backgroundColor: "#f9f9f9", borderTop: "2px solid #ddd" }}>
                        <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{dailyTotal}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Monthly Call Summary Table */}
          <Grid item xs={12} md={4} sx={{ flex: { md: "1 1 33.33%" }, minWidth: 0, display: "flex" }}>
            <Card sx={{ boxShadow: 3, width: "100%", display: "flex", flexDirection: "column" }}>
              <CardContent sx={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <MdTrendingUp size={20} style={{ color: "#667eea" }} />
                  Monthly Call Summary
                </Typography>
                <TableContainer component={Paper} sx={{ boxShadow: "none", width: "100%", flex: 1 }}>
                  <Table size="small" sx={{ width: "100%" }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Count</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <MdPhone size={18} style={{ color: getCallTypeColor("ANSWERED") }} />
                            Answered
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{monthlyAnswered}</TableCell>
                        <TableCell align="right" sx={{ color: getCallTypeColor("ANSWERED"), fontWeight: 600 }}>{monthlyAnsweredPercent}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <MdPhoneDisabled size={18} style={{ color: getCallTypeColor("NO ANSWER") }} />
                            No Answer
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{monthlyNoAnswer}</TableCell>
                        <TableCell align="right" sx={{ color: getCallTypeColor("NO ANSWER"), fontWeight: 600 }}>{monthlyNoAnswerPercent}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <MdCallEnd size={18} style={{ color: getCallTypeColor("BUSY") }} />
                            Busy
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{monthlyBusy}</TableCell>
                        <TableCell align="right" sx={{ color: getCallTypeColor("BUSY"), fontWeight: 600 }}>{monthlyBusyPercent}%</TableCell>
                      </TableRow>
                      <TableRow sx={{ backgroundColor: "#f9f9f9", borderTop: "2px solid #ddd" }}>
                        <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{monthlyTotal}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Yearly Call Summary Table */}
          <Grid item xs={12} md={4} sx={{ flex: { md: "1 1 33.33%" }, minWidth: 0, display: "flex" }}>
            <Card sx={{ boxShadow: 3, width: "100%", display: "flex", flexDirection: "column" }}>
              <CardContent sx={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <MdTrendingUp size={20} style={{ color: "#667eea" }} />
                  Yearly Call Summary
                </Typography>
                <TableContainer component={Paper} sx={{ boxShadow: "none", width: "100%", flex: 1 }}>
                  <Table size="small" sx={{ width: "100%" }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Count</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <MdPhone size={18} style={{ color: getCallTypeColor("ANSWERED") }} />
                            Answered
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{yearlyAnswered}</TableCell>
                        <TableCell align="right" sx={{ color: getCallTypeColor("ANSWERED"), fontWeight: 600 }}>{yearlyAnsweredPercent}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <MdPhoneDisabled size={18} style={{ color: getCallTypeColor("NO ANSWER") }} />
                            No Answer
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{yearlyNoAnswer}</TableCell>
                        <TableCell align="right" sx={{ color: getCallTypeColor("NO ANSWER"), fontWeight: 600 }}>{yearlyNoAnswerPercent}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <MdCallEnd size={18} style={{ color: getCallTypeColor("BUSY") }} />
                            Busy
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{yearlyBusy}</TableCell>
                        <TableCell align="right" sx={{ color: getCallTypeColor("BUSY"), fontWeight: 600 }}>{yearlyBusyPercent}%</TableCell>
                      </TableRow>
                      <TableRow sx={{ backgroundColor: "#f9f9f9", borderTop: "2px solid #ddd" }}>
                        <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{yearlyTotal}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        </div>

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