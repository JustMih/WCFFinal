import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pie, Doughnut } from "react-chartjs-2";
import { baseURL, SIP_DOMAIN_CONFIG } from "../../../../config";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from "chart.js";

import {
  MdOutlineLocalPhone,
  MdOutlineFreeBreakfast,
  MdWifiCalling2,
  MdOutlineFollowTheSigns,
  MdOutlineLunchDining,
  MdPhone,
  MdPhoneDisabled,
  MdCallEnd,
} from "react-icons/md";
import { GiExplosiveMeeting, GiTrafficLightsReadyToGo } from "react-icons/gi";
import { TbEmergencyBed } from "react-icons/tb";
import { FiPhoneOff } from "react-icons/fi";
import {
  Tooltip,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
} from "@mui/material";

import "./supervisorDashboard.css";
import "../agents-dashboard/agentsDashboard.css";
import OnlineAgentsTable from "../../../../components/agent-dashboard/OnlineAgentsTable";
import OnlineSupervisorsTable from "../../../../components/agent-dashboard/OnlineSupervisorsTable";
import { useSipPhone } from "../agents-dashboard/useSipPhone";
import PhonePopup from "../agents-dashboard/PhonePopup";
import {
  getTimeIntervalsSeconds,
  getRemainingSecondsFromStart,
  formatRemainingTime,
  formatExceededTime,
  formatPauseDuration,
  PAUSE_MENU_ITEMS,
} from "../../../../utils/pauseActivities";

const PAUSE_MENU_ICONS = {
  ready: <GiTrafficLightsReadyToGo fontSize="large" />,
  breakfast: <MdOutlineFreeBreakfast fontSize="large" />,
  lunch: <MdOutlineLunchDining fontSize="large" />,
  "attending meeting": <GiExplosiveMeeting fontSize="large" />,
  "short call": <MdWifiCalling2 fontSize="large" />,
  emergency: <TbEmergencyBed fontSize="large" />,
  "follow-up of customer inquiries": (
    <MdOutlineFollowTheSigns fontSize="large" />
  ),
};

function SupervisorStatCard({
  period,
  variant,
  icon: Icon,
  count,
  percent,
  title,
  sublabel,
}) {
  return (
    <div className={`supervisor-stat-card ${variant}`}>
      <div className="supervisor-stat-card__icon-wrap">
        <Icon />
      </div>
      <div className="supervisor-stat-card__body">
        <span className="supervisor-stat-card__period">{period}</span>
        <span className="supervisor-stat-card__count">{count}</span>
        <div className="supervisor-stat-card__summary">
          <div className="supervisor-stat-card__desc">
            <div className="supervisor-stat-card__label">{title}</div>
            <div className="supervisor-stat-card__sublabel">{sublabel}</div>
          </div>
          <span className="supervisor-stat-card__percent">{percent}%</span>
        </div>
      </div>
    </div>
  );
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  ChartTooltip,
  Legend,
  ArcElement
);

export default function SupervisorDashboard() {
  // ===== Analytics state =====
  const [totalCounts, setTotalCounts] = useState([]);
  const [monthlyCounts, setMonthlyCounts] = useState([]);
  const [weeklyCounts, setWeeklyCounts] = useState([]);
  const [dailyCounts, setDailyCounts] = useState([]);
  const [totalRows, setTotalRows] = useState(0);

  // ===== Phone popup =====
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);

  const extension = localStorage.getItem("extension");
  const sipPassword = localStorage.getItem("sipPassword");
  const SIP_DOMAIN = SIP_DOMAIN_CONFIG;

  // ===== Status / break menu =====
  const [anchorEl, setAnchorEl] = useState(null);
  const openStatus = Boolean(anchorEl);
  const [agentStatus, setAgentStatus] = useState("ready");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [pauseExceeded, setPauseExceeded] = useState(false);
  const [exceededSeconds, setExceededSeconds] = useState(0);
  const [userDefinedTimes, setUserDefinedTimes] = useState({
    attendingMeeting: 0,
    emergency: 0,
  });

  const statusTimerRef = useRef(null);
  const exceededMarkedRef = useRef(false);

  // Snackbars
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("warning");
  const showAlert = useCallback((msg, sev = "warning") => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(sev);
    setSnackbarOpen(true);
  }, []);

  const {
    phoneStatus,
    incomingCall,
    lastIncomingNumber,
    callDuration,
    isMuted,
    isSpeakerOn,
    isOnHold,
    phoneNumber,
    setPhoneNumber,
    manualTransferExt,
    setManualTransferExt,
    remoteAudioRef,
    formatDuration,
    isConsulting,
    acceptCall,
    rejectCall,
    endCall,
    dial,
    blindTransfer,
    startConsult,
    completeConsultTransfer,
    cancelConsult,
    toggleMute,
    toggleSpeaker,
    toggleHold,
  } = useSipPhone({
    extension,
    sipPassword,
    SIP_DOMAIN,
    onIncomingCall: useCallback(() => {
      setShowPhonePopup(true);
    }, []),
    showAlert,
    allowIncomingRinging: agentStatus === "ready",
  });

  const timeIntervals = getTimeIntervalsSeconds(userDefinedTimes);

  const pauseMenuItems = PAUSE_MENU_ITEMS.map((item) => ({
    ...item,
    icon: PAUSE_MENU_ICONS[item.activity],
  }));

  const markExceededOnServer = async () => {
    if (exceededMarkedRef.current) return;
    exceededMarkedRef.current = true;
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");
    if (!userId || !token) return;
    try {
      await fetch(`${baseURL}/users/pause-session/${userId}/mark-exceeded`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Failed to mark pause exceeded:", err);
    }
  };

  const startExceededTimer = (activity, initialExceeded = 0, showNotice = true) => {
    if (statusTimerRef.current) clearInterval(statusTimerRef.current);
    setPauseExceeded(true);
    setTimeRemaining(0);
    setExceededSeconds(initialExceeded);
    statusTimerRef.current = setInterval(() => {
      setExceededSeconds((s) => s + 1);
    }, 1000);
    markExceededOnServer();
    if (showNotice) {
      showAlert(`Pause limit exceeded for ${activity}.`, "warning");
    }
  };

  const startStatusTimer = (activity, initialSeconds, allowedOverride) => {
    let limit = initialSeconds;
    if (typeof limit !== "number") {
      const intervals = getTimeIntervalsSeconds(userDefinedTimes);
      const item = PAUSE_MENU_ITEMS.find((p) => p.activity === activity);
      limit = item?.timerKey ? intervals[item.timerKey] : 0;
    }
    if (!limit) return;

    if (limit <= 0) {
      startExceededTimer(activity, 0);
      return;
    }

    if (statusTimerRef.current) clearInterval(statusTimerRef.current);
    setPauseExceeded(false);
    setExceededSeconds(0);
    exceededMarkedRef.current = false;
    setTimeRemaining(limit);
    statusTimerRef.current = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          startExceededTimer(activity, 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const stopStatusTimer = () => {
    if (statusTimerRef.current) clearInterval(statusTimerRef.current);
    statusTimerRef.current = null;
    setTimeRemaining(0);
    setPauseExceeded(false);
    setExceededSeconds(0);
    exceededMarkedRef.current = false;
  };

  useEffect(() => {
    return () => {
      stopStatusTimer();
    };
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");
    if (!userId || !token) return;

    const restorePauseState = async () => {
      try {
        const response = await fetch(
          `${baseURL}/users/agent-status/${userId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) return;
        const data = await response.json();

        if (data.status === "pause" && data.pause_activity) {
          setAgentStatus(data.pause_activity);
          const allowed = data.pause_allowed_seconds;
          if (data.is_exceeded) {
            exceededMarkedRef.current = true;
            startExceededTimer(
              data.pause_activity,
              data.exceeded_seconds || 0,
              false
            );
          } else {
            const remaining = getRemainingSecondsFromStart(
              data.pause_activity,
              data.pause_started_at,
              userDefinedTimes,
              allowed
            );
            startStatusTimer(data.pause_activity, remaining, allowed);
          }
        } else if (data.status === "online") {
          setAgentStatus("ready");
          stopStatusTimer();
        }
      } catch (err) {
        console.error("Failed to restore supervisor pause state:", err);
      }
    };

    restorePauseState();
  }, []);

  const togglePhonePopup = () => setShowPhonePopup((v) => !v);

  const handleDial = () => dial(phoneNumber);
  const handleAcceptCall = () => acceptCall();
  const handleRejectCall = () => rejectCall();
  const handleEndCall = () => endCall();
  const handleBlindTransfer = (targetExt) => blindTransfer(targetExt);
  const handleStartConsult = (targetExt) => startConsult(targetExt);
  const handleCompleteConsultTransfer = () => completeConsultTransfer();
  const handleCancelConsult = () => cancelConsult();

  const handleClick = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleAgentEmergency = async (activity) => {
    const isReady = (activity || "").toLowerCase() === "ready";
    const statusToUpdate = isReady ? "online" : "pause";
    const pauseStartedAt = new Date().toISOString();
    const body = isReady
      ? { status: statusToUpdate }
      : {
          status: statusToUpdate,
          pause_activity: activity,
          pause_started_at: pauseStartedAt,
        };

    try {
      const response = await fetch(
        `${baseURL}/users/status/${localStorage.getItem("userId")}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) {
        showAlert("Failed to update status. Try again.", "error");
        return;
      }

      setAgentStatus(isReady ? "ready" : activity);
      if (!isReady) startStatusTimer(activity);
      else stopStatusTimer();
    } catch (err) {
      console.error("Failed to update status:", err);
      showAlert("Failed to update status. Try again.", "error");
    }
  };

  // ===== Analytics fetch =====
  const fetchData = async () => {
    try {
      const response = await fetch(`${baseURL}/calls/calls-count`);
      const data = await response.json();
      setTotalCounts(data.totalCounts);
      setMonthlyCounts(data.monthlyCounts);
      setWeeklyCounts(data.weeklyCounts);
      setDailyCounts(data.dailyCounts);
      setTotalRows(data.totalRows);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 10000);
    return () => clearInterval(i);
  }, []);

  // ===== Percentage calculation helpers =====
  const calculatePercentage = (count, total) => {
    if (!total || total === 0) return 0;
    return ((count / total) * 100).toFixed(1);
  };

  // Calculate totals for each period
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

  // Get counts for each disposition
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

  const pieData = {
    labels: ["Answered", "Busy", "No Answer"],
    datasets: [
      {
        label: "Call Distribution",
        data: [
          totalCounts.find((i) => i.disposition === "ANSWERED")?.count || 0,
          totalCounts.find((i) => i.disposition === "BUSY")?.count || 0,
          totalCounts.find((i) => i.disposition === "NO ANSWER")?.count || 0,
        ],
        backgroundColor: ["#36A2EB", "#FF6384", "#FFCD56"],
        borderWidth: 1,
      },
    ],
  };

  const yearlyDonutData = {
    labels: ["Answered", "No Answer", "Busy"],
    datasets: [
      {
        label: "Yearly Call Distribution",
        data: [
          totalCounts.find((i) => i.disposition === "ANSWERED")?.count || 0,
          totalCounts.find((i) => i.disposition === "NO ANSWER")?.count || 0,
          totalCounts.find((i) => i.disposition === "BUSY")?.count || 0,
        ],
        backgroundColor: ["#36A2EB", "#FFCD56", "#FF6384"],
        borderWidth: 1,
      },
    ],
  };

  const monthlyDonutData = {
    labels: ["Answered", "No Answer", "Busy"],
    datasets: [
      {
        label: "Monthly Call Distribution",
        data: [
          monthlyCounts.find((i) => i.disposition === "ANSWERED")?.count || 0,
          monthlyCounts.find((i) => i.disposition === "NO ANSWER")?.count || 0,
          monthlyCounts.find((i) => i.disposition === "BUSY")?.count || 0,
        ],
        backgroundColor: ["#36A2EB", "#FFCD56", "#FF6384"],
        borderWidth: 1,
      },
    ],
  };

  const dailyDonutData = {
    labels: ["Answered", "No Answer", "Busy"],
    datasets: [
      {
        label: "Daily Call Distribution",
        data: [
          dailyCounts.find((i) => i.disposition === "ANSWERED")?.count || 0,
          dailyCounts.find((i) => i.disposition === "NO ANSWER")?.count || 0,
          dailyCounts.find((i) => i.disposition === "BUSY")?.count || 0,
        ],
        backgroundColor: ["#36A2EB", "#FFCD56", "#FF6384"],
        borderWidth: 1,
      },
    ],
  };

  const donutChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          label(context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const statSections = [
    {
      period: "Yearly",
      sublabel: "of total calls",
      cards: [
        {
          variant: "answered-calls",
          icon: MdPhone,
          count: yearlyAnswered,
          percent: yearlyAnsweredPercent,
          title: "Answered Calls",
        },
        {
          variant: "no-answer-calls",
          icon: MdPhoneDisabled,
          count: yearlyNoAnswer,
          percent: yearlyNoAnswerPercent,
          title: "No Answer Calls",
        },
        {
          variant: "busy-calls",
          icon: MdCallEnd,
          count: yearlyBusy,
          percent: yearlyBusyPercent,
          title: "Busy Calls",
        },
      ],
    },
    {
      period: "Monthly",
      sublabel: "of monthly calls",
      cards: [
        {
          variant: "answered-calls",
          icon: MdPhone,
          count: monthlyAnswered,
          percent: monthlyAnsweredPercent,
          title: "Answered Calls",
        },
        {
          variant: "no-answer-calls",
          icon: MdPhoneDisabled,
          count: monthlyNoAnswer,
          percent: monthlyNoAnswerPercent,
          title: "No Answer Calls",
        },
        {
          variant: "busy-calls",
          icon: MdCallEnd,
          count: monthlyBusy,
          percent: monthlyBusyPercent,
          title: "Busy Calls",
        },
      ],
    },
    {
      period: "Daily",
      sublabel: "of daily calls",
      cards: [
        {
          variant: "answered-calls",
          icon: MdPhone,
          count: dailyAnswered,
          percent: dailyAnsweredPercent,
          title: "Answered Calls",
        },
        {
          variant: "no-answer-calls",
          icon: MdPhoneDisabled,
          count: dailyNoAnswer,
          percent: dailyNoAnswerPercent,
          title: "No Answer Calls",
        },
        {
          variant: "busy-calls",
          icon: MdCallEnd,
          count: dailyBusy,
          percent: dailyBusyPercent,
          title: "Busy Calls",
        },
      ],
    },
  ];

  return (
    <div className="supervisor-dashboard-root call-center-agent-container">
      <h3 className="call-center-agent-title">Supervisor Dashboard</h3>

      <div className="phone-navbar">
        {agentStatus === "ready" ? (
          <>
            <MdOutlineLocalPhone
              className="phone-btn-call"
              onClick={togglePhonePopup}
            />
            <h4
              style={{
                backgroundColor: "green",
                color: "white",
                padding: "7px",
                borderRadius: "15px",
              }}
            >
              {agentStatus.toUpperCase()}
            </h4>
          </>
        ) : (
          <>
            <FiPhoneOff className="out-phone-btn-call" />
            <div>
              <h4
                style={{
                  backgroundColor: "red",
                  color: "white",
                  padding: "7px",
                  borderRadius: "15px",
                }}
              >
                {agentStatus.toUpperCase()}
              </h4>
              <span
                style={{
                  color: pauseExceeded ? "#c62828" : "black",
                  marginLeft: "10px",
                  fontWeight: pauseExceeded ? 600 : 400,
                }}
              >
                {pauseExceeded
                  ? `Exceeded: ${formatExceededTime(exceededSeconds)}`
                  : `Time Remaining: ${formatRemainingTime(timeRemaining)}`}
              </span>
            </div>
          </>
        )}
        <Tooltip title="Supervisor Pause">
          <IconButton
            onClick={handleClick}
            size="medium"
            sx={{ ml: 2 }}
            aria-controls={openStatus ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={openStatus ? "true" : undefined}
          >
            <Avatar
              sx={{
                width: 48,
                height: 40,
                bgcolor: "primary.main",
                color: "white",
                fontSize: 10,
                fontWeight: "bold",
              }}
            >
              PAUSE
            </Avatar>
          </IconButton>
        </Tooltip>
      </div>

      {/* Status menu */}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={openStatus}
        onClose={handleClose}
        onClick={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
              mt: 1.5,
              "& .MuiAvatar-root": { width: 32, height: 32, ml: -0.5, mr: 1 },
              "&::before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: "background.paper",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {pauseMenuItems.map(({ activity, label, icon, timerKey }) => {
          const seconds = timerKey ? timeIntervals[timerKey] : null;
          const timeRange = seconds ? formatPauseDuration(seconds) : null;
          return (
            <MenuItem
              key={activity}
              onClick={() => handleAgentEmergency(activity)}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText
                primary={label}
                secondary={timeRange ? `Allowed: ${timeRange}` : null}
                secondaryTypographyProps={{
                  sx: { fontSize: "0.75rem", color: "text.secondary" },
                }}
              />
            </MenuItem>
          );
        })}
      </Menu>

      <div className="dashboard-single-agent-row_two">
          <OnlineAgentsTable />
          <OnlineSupervisorsTable />
        </div>
      {statSections.map((section) => (
        <div key={section.period} className="call-center-agent-summary">
          {section.cards.map((card) => (
            <SupervisorStatCard
              key={`${section.period}-${card.variant}`}
              period={section.period}
              variant={card.variant}
              icon={card.icon}
              count={card.count}
              percent={card.percent}
              title={card.title}
              sublabel={section.sublabel}
            />
          ))}
        </div>
      ))}

      <div className="donut-charts-container">
        <div className="chart-card">
          <h4>Yearly Call Distribution</h4>
          <Doughnut data={yearlyDonutData} options={donutChartOptions} />
        </div>
        <div className="chart-card">
          <h4>Monthly Call Distribution</h4>
          <Doughnut data={monthlyDonutData} options={donutChartOptions} />
        </div>
        <div className="chart-card">
          <h4>Daily Call Distribution</h4>
          <Doughnut data={dailyDonutData} options={donutChartOptions} />
        </div>
        <div className="chart-card">
          <h4>Call Distribution</h4>
          <Pie data={pieData} options={{ responsive: true }} />
        </div>
      </div>

      <PhonePopup
        showPhonePopup={showPhonePopup}
        extension={extension}
        phoneStatus={phoneStatus}
        incomingCall={incomingCall}
        lastIncomingNumber={lastIncomingNumber}
        callDuration={callDuration}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        showKeypad={showKeypad}
        setShowKeypad={setShowKeypad}
        isMuted={isMuted}
        isSpeakerOn={isSpeakerOn}
        isOnHold={isOnHold}
        manualTransferExt={manualTransferExt}
        setManualTransferExt={setManualTransferExt}
        remoteAudioRef={remoteAudioRef}
        formatDuration={formatDuration}
        isConsulting={isConsulting}
        onClose={togglePhonePopup}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        onEnd={handleEndCall}
        onDial={handleDial}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
        onToggleHold={toggleHold}
        onBlindTransfer={handleBlindTransfer}
        onStartConsult={handleStartConsult}
        onCompleteConsultTransfer={handleCompleteConsultTransfer}
        onCancelConsult={handleCancelConsult}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
