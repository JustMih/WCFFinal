import React, { useCallback, useEffect, useState, useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { FiPhoneCall } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { baseURL } from "../../../config";
import PauseReport from "./PauseReport";
import OffHoursReport from "./OffHoursReport";
import Livestream from "../cal-center-ivr/Livestream";
import "../cal-center-ivr/livestream.css";
import CallCenterSlaReport from "./CallCenterSlaReport";
import TicketSlaReport from "./TicketSlaReport";
import TicketWorkflowTatReport from "./TicketWorkflowTatReport";
import WcfLoader from "../../../components/shared/WcfLoader";
import ReportDateRangePicker from "../../../components/shared/ReportDateRangePicker";
import ReportTablePagination from "../../../components/shared/ReportTablePagination";
import useReportTablePagination from "../../../hooks/useReportTablePagination";
import { isValidReportDateRange, todayApiDate } from "../../../utils/reportDateUtils";
import TicketWorkflowExpandPanel from "../../../components/workflow/TicketWorkflowExpandPanel";
import {
  enrichTicketWithWorkflow,
  runWithConcurrency,
  buildWorkflowSteps,
  formatWorkflowTrailForExport,
  computeTotalTicketDuration,
} from "../../../utils/workflowTrailExport";
import {
  REPORT_TYPES,
  REPORTS,
  getReportBySlug,
  getReportLabel,
} from "./reportConfig";
import {
  buildHolidaySet,
  filterOffHoursRecords,
  buildSummary,
} from "../../../utils/offHoursHelper";
import { playVoiceNoteAudio } from "../../../utils/voiceNoteAudio";
import {
  markVoiceNotePlayed,
  isVoiceNotePlayed,
  getPlayedVoiceNotesMap,
} from "../../../utils/voiceNotePlayed";
import {
  enrichRecordClient,
  buildEmergencyMap,
} from "../../../utils/offHoursReportClient";
import {
  getOffHoursTimestamp,
  isOffHoursNotePlayed,
  getOffHoursRowColor,
  OffHoursCallbackStatusChip,
} from "../../../utils/offHoursReportShared";
import {
  formatSecondsToMinutes,
  formatVoiceNoteDuration,
} from "../../../utils/callDurationFormat";
import { computeCdrTalkTimeSec } from "../../../utils/cdrReportHelpers";
import { formatDbDateTimeLocal } from "../../../utils/dateTimeFormat";
import {
  exportRowsToCsv,
  exportRowsToExcel,
} from "../../../utils/reportExportHelpers";
import {
  isPendingCallback,
  getCallbackPhone,
  markMissedCallCalledBack,
  formatOutboundNumber,
} from "../../../utils/missedCallActions";
import { useSipPhone } from "../call-center-dashboard/agents-dashboard/useSipPhone";
import { useAgentSipPhoneOptional } from "../../../context/AgentSipPhoneContext";
import {
  Snackbar,
  Alert,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Chip,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  IconButton,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  PictureAsPdf,
  TableChart,
  Search,
  ViewColumn,
  Phone,
  PhoneCallback,
  PhoneDisabled,
  PhoneMissed,
  AccessTime,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import Tooltip from "@mui/material/Tooltip";
import { getDtmfActionLabel, DTMF_DIGIT_LABELS } from "../../../utils/dtmfReportConstants";
import "./comprehensiveReports.css";
import "./OffHoursReport.css";

const SIP_DOMAIN = "192.168.21.70";

const EXCLUDED_CDR_DESTINATIONS = new Set(["S", "I", "T"]);
const isExcludedCdrDestination = (value) =>
  value != null &&
  EXCLUDED_CDR_DESTINATIONS.has(String(value).trim().toUpperCase());

const formatCallStatus = (value) => {
  if (value == null || value === "" || value === "-") return "-";
  const str = String(value).trim();
  if (!str) return "-";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const OFF_HOURS_CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "public_holiday", label: "Public Holiday" },
  { value: "sunday", label: "Sunday" },
  { value: "saturday_outside_hours", label: "Saturday (Outside Hours)" },
  { value: "weekday_after_hours", label: "Weekday After Hours" },
];

const missedCallSource = (r) =>
  r.call_source || r.caller_display || r.caller_phone || r.caller || "—";

const missedCallDestination = (r) =>
  r.call_destination || r.destination || r.cdr_dst || r.cdr_did || "—";

const missedCallEmergency = (r) =>
  r.emergency_number_label ||
  r.emergency_number ||
  r.routed_to_label ||
  r.routed_to ||
  "—";

const OFF_HOURS_CATEGORY_COLORS = {
  public_holiday: "#e91e63",
  sunday: "#9c27b0",
  saturday_outside_hours: "#ff9800",
  weekday_after_hours: "#2196f3",
};

const DTMF_CHART_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#a855f7",
];

const OFF_HOURS_SUMMARY_CARDS = [
  { key: "total", label: "Total Off-Hours", color: "#374151" },
  { key: "public_holiday", label: "Public Holiday", color: "#e91e63" },
  { key: "sunday", label: "Sunday", color: "#9c27b0" },
  { key: "saturday_outside_hours", label: "Saturday", color: "#ff9800" },
  { key: "weekday_after_hours", label: "After Work Hours", color: "#2196f3" },
];

const OFF_HOURS_MISSED_SUMMARY_CARDS = [
  { key: "callbacks_pending", label: "Pending Callback", color: "#ef4444" },
  { key: "callbacks_done", label: "Called Back", color: "#22c55e" },
];

const OFF_HOURS_SOURCE_LABELS = {
  cdr: "CDR",
  "voice-notes": "Voice Notes",
  "missed-calls": "Missed Calls",
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
});

async function fetchOffHoursFallback(startDate, endDate, source) {
  const holidaysRes = await fetch(`${baseURL}/holidays`, {
    headers: authHeaders(),
  });
  const holidays = holidaysRes.ok ? await holidaysRes.json() : [];

  let rawRecords = [];
  let timestampField = "created_at";

  if (source === "missed-calls") {
    timestampField = "time";
    const dataRes = await fetch(
      `${baseURL}/missed-calls?startDate=${startDate}&endDate=${endDate}`,
      { headers: authHeaders() }
    );
    if (!dataRes.ok) throw new Error("Failed to load missed calls");
    rawRecords = await dataRes.json();
  } else {
    const [emergencyRes, dataRes] = await Promise.all([
      fetch(`${baseURL}/emergency`, { headers: authHeaders() }),
      fetch(
        source === "cdr"
          ? `${baseURL}/reports/cdr-report/${startDate}/${endDate}/all`
          : `${baseURL}/reports/voice-note-report/${startDate}/${endDate}`,
        { headers: authHeaders() }
      ),
    ]);
    const emergencyList = emergencyRes.ok ? await emergencyRes.json() : [];
    if (dataRes.ok) {
      rawRecords = await dataRes.json();
      if (source === "cdr" && Array.isArray(rawRecords)) {
        rawRecords = rawRecords.filter(
          (row) => !isExcludedCdrDestination(row.dst ?? row.called)
        );
      }
    } else if (dataRes.status !== 404) {
      throw new Error("Failed to load report data");
    }
    timestampField = source === "cdr" ? "cdrstarttime" : "created_at";
    const holidayDates = buildHolidaySet(holidays);
    const filtered = filterOffHoursRecords(
      rawRecords,
      timestampField,
      holidayDates
    );
    const emergencyByPhone = buildEmergencyMap(emergencyList);
    const records = filtered.map((r) =>
      enrichRecordClient(r, emergencyByPhone, source)
    );
    return { summary: buildSummary(records), records };
  }

  const holidayDates = buildHolidaySet(holidays);
  const filtered = filterOffHoursRecords(
    rawRecords,
    timestampField,
    holidayDates
  );
  const records = filtered.map((r) => ({
    ...r,
    caller_display: r.caller,
    callback_status: r.status,
    callback_agent_name: r.agent_name,
    callback_time: r.called_back_at,
    callback_agent_extension: r.called_back_by,
  }));

  return { summary: buildSummary(records), records };
}

const normalizeChatUserId = (id) =>
  id == null ? "" : String(id).trim().toLowerCase();

const buildChatUserNameMap = (users) => {
  const map = {};
  (users || []).forEach((user) => {
    const key = normalizeChatUserId(user.id);
    if (!key) return;
    map[key] = user.full_name || user.username || String(user.id);
  });
  return map;
};

const resolveChatUserName = (userId, nameMap) => {
  const key = normalizeChatUserId(userId);
  if (!key) return "-";
  return nameMap[key] || String(userId);
};

const OPTIONAL_DATE_TABS = new Set([
  REPORT_TYPES.IVR_INTERACTIONS,
  REPORT_TYPES.DTMF_USAGE,
  REPORT_TYPES.MISSED_CALL,
  REPORT_TYPES.CHATS,
]);

const SKIP_AUTO_FETCH_TABS = new Set([
  REPORT_TYPES.PAUSE,
  REPORT_TYPES.LIVESTREAM,
  REPORT_TYPES.OFF_HOURS,
  REPORT_TYPES.SLA_CALL_CENTER,
  REPORT_TYPES.SLA_TICKET,
  REPORT_TYPES.TICKET_WORKFLOW_TAT,
]);

export default function ComprehensiveReports() {
  const navigate = useNavigate();
  const { reportSlug } = useParams();
  const normalizedReportSlug = reportSlug
    ? String(reportSlug).toLowerCase()
    : "";
  const currentReport = getReportBySlug(normalizedReportSlug);
  /** Always derived from URL — avoids stale tab state showing the wrong embedded view */
  const activeTab = currentReport.type;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [playedFilter, setPlayedFilter] = useState("all");
  const [disposition, setDisposition] = useState("all");
  const [ticketStatus, setTicketStatus] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [agentOptions, setAgentOptions] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [missedCallStatusFilter, setMissedCallStatusFilter] = useState("all");

  // Off-hours report
  const [offHoursSource, setOffHoursSource] = useState("voice-notes");
  const [offHoursCategoryFilter, setOffHoursCategoryFilter] = useState("all");
  const [offHoursSummary, setOffHoursSummary] = useState(null);
  const [offHoursPlayedStatus, setOffHoursPlayedStatus] = useState({});
  const [offHoursCurrentAudio, setOffHoursCurrentAudio] = useState(null);
  const [offHoursPlayingId, setOffHoursPlayingId] = useState(null);
  const [offHoursCallingBackId, setOffHoursCallingBackId] = useState(null);

  const extension = localStorage.getItem("extension");
  const sipPassword = localStorage.getItem("sipPassword");
  const agentSip = useAgentSipPhoneOptional();
  const useSharedAgentSip = Boolean(agentSip);
  const localSipReady = Boolean(extension && sipPassword) && !useSharedAgentSip;

  const localSip = useSipPhone({
    extension: localSipReady ? extension : null,
    sipPassword: localSipReady ? sipPassword : null,
    SIP_DOMAIN,
    allowIncomingRinging: false,
  });

  const phoneStatus = useSharedAgentSip
    ? agentSip.phoneStatus
    : localSip.phoneStatus;
  const remoteAudioRef = useSharedAgentSip
    ? agentSip.remoteAudioRef
    : localSip.remoteAudioRef;
  const redial = useSharedAgentSip ? agentSip.redial : localSip.redial;
  const endCall = useSharedAgentSip ? agentSip.endCall : localSip.endCall;
  const sipReady = useSharedAgentSip
    ? agentSip.sipReady
    : Boolean(extension && sipPassword);

  useEffect(() => {
    if (phoneStatus === "Idle" || phoneStatus === "Call Failed") {
      setOffHoursCallingBackId(null);
    }
  }, [phoneStatus]);

  useEffect(() => {
    if (OPTIONAL_DATE_TABS.has(activeTab) || SKIP_AUTO_FETCH_TABS.has(activeTab)) {
      return;
    }
    const today = todayApiDate();
    setStartDate(today);
    setEndDate(today);
  }, [activeTab]);

  const handleStartDateChange = useCallback((value) => {
    setStartDate(value);
    if (value) {
      setEndDate((prev) => {
        if (!prev || value > prev) return value;
        return prev;
      });
    }
  }, []);

  const handleEndDateChange = useCallback((value) => {
    setEndDate(value);
    if (value) {
      setStartDate((prev) => {
        if (!prev || value < prev) return value;
        return prev;
      });
    }
  }, []);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const res = await fetch(`${baseURL}/users/agents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.agents || [];
        setAgentOptions(list);
      } catch {
        /* optional dropdown */
      }
    };
    loadAgents();
  }, []);

  // Column selection
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState({});

  // Ticket CRM workflow expand
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [assignmentCache, setAssignmentCache] = useState({});
  const [assignmentLoading, setAssignmentLoading] = useState({});
  const [assignmentErrors, setAssignmentErrors] = useState({});
  const [exportingWorkflow, setExportingWorkflow] = useState(false);

  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    answered: 0,
    noAnswer: 0,
    busy: 0,
    totalDuration: 0,
    avgDuration: 0,
  });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = "";
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      };

      switch (activeTab) {
        case REPORT_TYPES.VOICE_NOTE:
          if (!startDate || !endDate) {
            throw new Error("Please select start and end dates");
          }
          endpoint = `${baseURL}/reports/voice-note-report/${startDate}/${endDate}`;
          break;
        case REPORT_TYPES.CDR:
          if (!startDate || !endDate) {
            throw new Error("Please select start and end dates");
          }
          endpoint = `${baseURL}/reports/cdr-report/${startDate}/${endDate}/${disposition}`;
          break;
        case REPORT_TYPES.TICKET_CRM:
          if (!startDate || !endDate) {
            throw new Error("Please select start and end dates");
          }
          endpoint = `${baseURL}/reports/ticket-report/${startDate}/${endDate}/${ticketStatus}`;
          break;
        case REPORT_TYPES.AGENT_PERFORMANCE:
          if (!startDate || !endDate) {
            throw new Error("Please select start and end dates");
          }
          endpoint = `${baseURL}/reports/agent-performance/${startDate}/${endDate}/${agentFilter}`;
          break;
        case REPORT_TYPES.CALL_SUMMARY:
          if (!startDate || !endDate) {
            throw new Error("Please select start and end dates");
          }
          endpoint = `${baseURL}/reports/call-summary/${startDate}/${endDate}`;
          break;
        case REPORT_TYPES.IVR_INTERACTIONS:
          endpoint =
            startDate && endDate
              ? `${baseURL}/reports/ivr-interactions/${startDate}/${endDate}`
              : `${baseURL}/reports/ivr-interactions`;
          break;
        case REPORT_TYPES.DTMF_USAGE: {
          const q = new URLSearchParams();
          if (startDate) q.set("startDate", startDate);
          if (endDate) q.set("endDate", endDate);
          endpoint = `${baseURL}/dtmf-stats${q.toString() ? `?${q.toString()}` : ""}`;
          break;
        }
        case REPORT_TYPES.TICKET_ASSIGNMENTS:
          if (!startDate || !endDate) {
            throw new Error("Please select start and end dates");
          }
          endpoint = `${baseURL}/reports/ticket-assignments/${startDate}/${endDate}`;
          break;
        case REPORT_TYPES.MISSED_CALL: {
          const params = new URLSearchParams();
          if (startDate) params.set("startDate", startDate);
          if (endDate) params.set("endDate", endDate);
          if (missedCallStatusFilter !== "all") params.set("status", missedCallStatusFilter);
          const url = `${baseURL}/missed-calls${params.toString() ? `?${params.toString()}` : ""}`;
          const res = await fetch(url, { headers });
          if (!res.ok) throw new Error("Failed to fetch missed calls");
          const data = await res.json();
          const list = Array.isArray(data) ? data : [];
          list.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
          setReports(list);
          setLoading(false);
          return;
        }
        case REPORT_TYPES.DROPPED_CALL: {
          if (!startDate || !endDate) {
            throw new Error("Please select start and end dates");
          }
          const q = new URLSearchParams();
          if (disposition !== "all") q.set("disposition", disposition);
          const droppedUrl = `${baseURL}/reports/dropped-calls-report/${startDate}/${endDate}${
            q.toString() ? `?${q.toString()}` : ""
          }`;
          const droppedRes = await fetch(droppedUrl, { headers });
          if (!droppedRes.ok) {
            const errBody = await droppedRes.json().catch(() => ({}));
            throw new Error(
              errBody.message || errBody.error || "Failed to fetch dropped calls report"
            );
          }
          const droppedData = await droppedRes.json();
          const list = Array.isArray(droppedData)
            ? droppedData
            : droppedData.records || [];
          setReports(list);
          setLoading(false);
          return;
        }
        case REPORT_TYPES.LOST_CALL: {
          if (!startDate || !endDate) {
            throw new Error("Please select start and end dates");
          }
          const qLost = new URLSearchParams();
          if (disposition !== "all") qLost.set("disposition", disposition);
          const lostUrl = `${baseURL}/reports/lost-calls-report/${startDate}/${endDate}${
            qLost.toString() ? `?${qLost.toString()}` : ""
          }`;
          const lostRes = await fetch(lostUrl, { headers });
          if (!lostRes.ok) {
            const errBody = await lostRes.json().catch(() => ({}));
            throw new Error(
              errBody.message || errBody.error || "Failed to fetch lost calls report"
            );
          }
          const lostData = await lostRes.json();
          const lostList = Array.isArray(lostData)
            ? lostData
            : lostData.records || [];
          setReports(lostList);
          setLoading(false);
          return;
        }
        case REPORT_TYPES.ESCALLATION: {
          // Fetch escalation report from reports endpoint (similar to other reports)
          try {
            if (!startDate || !endDate) {
              throw new Error("Start date and end date are required for escalation report");
            }
            
            // Use the reports endpoint for escalation report
            const escalationRes = await fetch(
              `${baseURL}/reports/escalation-report/${startDate}/${endDate}`,
              { headers }
            );
            
            if (!escalationRes.ok) {
              const errorData = await escalationRes.json().catch(() => ({}));
              // If 404 with "No escalated tickets found", return empty array
              if (escalationRes.status === 404) {
                const errorMessage = errorData.message || "";
                if (errorMessage.includes("No escalated tickets")) {
                  setReports([]);
                  setLoading(false);
                  return;
                }
              }
              throw new Error(errorData.message || errorData.error || "Failed to fetch escalation report");
            }
            
            const escalationData = await escalationRes.json();
            
            // Handle response structure - backend returns array of escalated tickets
            let list = [];
            if (Array.isArray(escalationData)) {
              list = escalationData;
            } else if (escalationData.escalations && Array.isArray(escalationData.escalations)) {
              list = escalationData.escalations;
            }
            
            // Sort by escalated_at or created_at descending
            list.sort((a, b) => {
              const dateA = new Date(a.escalated_at || a.created_at || 0).getTime();
              const dateB = new Date(b.escalated_at || b.created_at || 0).getTime();
              return dateB - dateA;
            });
            
            setReports(list);
            setLoading(false);
            return;
          } catch (error) {
            console.error("Error fetching escalation report:", error);
            throw new Error(error.message || "Failed to fetch escalation report");
          }
        }
        case REPORT_TYPES.NOTIFICATIONS: {
          const userId = localStorage.getItem("userId");
          if (!userId) {
            throw new Error("User not authenticated. Please log in.");
          }
          
          // Fetch notifications report from reports endpoint (similar to other reports)
          try {
            if (!startDate || !endDate) {
              throw new Error("Start date and end date are required for notifications report");
            }
            
            // Use the reports endpoint for notifications report
            const notificationsRes = await fetch(
              `${baseURL}/reports/notification-report/${startDate}/${endDate}`,
              { headers }
            );
            
            if (!notificationsRes.ok) {
              const errorData = await notificationsRes.json().catch(() => ({}));
              throw new Error(errorData.message || errorData.error || "Failed to fetch notifications report");
            }
            
            const notificationsData = await notificationsRes.json();
            
            // Handle response structure - backend returns array of notifications
            let list = [];
            if (Array.isArray(notificationsData)) {
              list = notificationsData;
            } else if (notificationsData.notifications && Array.isArray(notificationsData.notifications)) {
              list = notificationsData.notifications;
            }
            
            // Sort by created_at descending (already sorted by backend, but ensure it)
            list.sort((a, b) => {
              const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return dateB - dateA;
            });
            
            setReports(list);
            setLoading(false);
            return;
          } catch (error) {
            console.error("Error fetching notifications report:", error);
            throw new Error(error.message || "Failed to fetch notifications report");
          }
        }
        case REPORT_TYPES.OFF_HOURS: {
          if (!startDate || !endDate) {
            throw new Error("Please select start and end dates");
          }
          const endpoint = `${baseURL}/reports/off-hours-report/${startDate}/${endDate}?source=${offHoursSource}`;
          const response = await fetch(endpoint, {
            method: "GET",
            headers,
          });

          let data;
          if (response.status === 404) {
            data = await fetchOffHoursFallback(
              startDate,
              endDate,
              offHoursSource
            );
          } else if (!response.ok) {
            throw new Error("Failed to fetch off-hours report");
          } else {
            data = await response.json();
          }

          const loadedRecords = data.records || [];
          setReports(loadedRecords);
          setOffHoursSummary(data.summary || null);

          if (offHoursSource === "voice-notes") {
            const storedPlayed =
              JSON.parse(localStorage.getItem("playedVoiceNotes")) || {};
            const validPlayed = {};
            loadedRecords.forEach((note) => {
              if (storedPlayed[note.id] || note.is_played) {
                validPlayed[note.id] = true;
              }
            });
            setOffHoursPlayedStatus(validPlayed);
          }
          setLoading(false);
          return;
        }
        case REPORT_TYPES.CHATS: {
          const userId = localStorage.getItem("userId");
          if (!userId) {
            throw new Error("User not authenticated. Please log in.");
          }

          let chatUserNameMap = {};
          try {
            const usersRes = await fetch(`${baseURL}/users/`, { headers });
            if (usersRes.ok) {
              const usersData = await usersRes.json();
              const usersList = Array.isArray(usersData)
                ? usersData
                : usersData.users || usersData.data || [];
              chatUserNameMap = buildChatUserNameMap(usersList);
            }
          } catch (err) {
            console.error("Failed to load users for chat name resolution:", err);
          }

          const conversationsRes = await fetch(`${baseURL}/users/conversations/${userId}`, { headers });
          if (!conversationsRes.ok) {
            throw new Error("Failed to fetch conversations");
          }
          const conversationsData = await conversationsRes.json();
          let conversations = [];
          if (conversationsData.conversations && Array.isArray(conversationsData.conversations)) {
            conversations = conversationsData.conversations;
          } else if (Array.isArray(conversationsData)) {
            conversations = conversationsData;
          }
          
          const allMessages = [];
          for (const conv of conversations) {
            const otherUserId = conv.userId || conv.otherUserId;
            if (!otherUserId) continue;
            
            try {
              const messagesRes = await fetch(`${baseURL}/users/messages/${userId}/${otherUserId}`, { headers });
              if (messagesRes.ok) {
                const messagesData = await messagesRes.json();
                const messages = Array.isArray(messagesData) ? messagesData : [];
                allMessages.push(...messages.map(msg => ({
                  ...msg,
                  otherUserId,
                  otherUserName: resolveChatUserName(otherUserId, chatUserNameMap),
                  senderName: resolveChatUserName(msg.senderId, chatUserNameMap),
                  receiverName: resolveChatUserName(msg.receiverId, chatUserNameMap),
                })));
              }
            } catch (err) {
              console.error(`Error fetching messages for conversation with ${otherUserId}:`, err);
            }
          }
          
          // Filter by date range if provided
          let filteredMessages = allMessages;
          if (startDate || endDate) {
            filteredMessages = allMessages.filter((msg) => {
              if (!msg.createdAt && !msg.timestamp) return false;
              const msgDate = new Date(msg.createdAt || msg.timestamp).toISOString().split("T")[0];
              if (startDate && msgDate < startDate) return false;
              if (endDate && msgDate > endDate) return false;
              return true;
            });
          }
          
          filteredMessages.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.timestamp || 0).getTime();
            const dateB = new Date(b.createdAt || b.timestamp || 0).getTime();
            return dateB - dateA;
          });
          
          setReports(filteredMessages);
          setLoading(false);
          return;
        }
        default:
          throw new Error("Invalid report type");
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (
          response.status === 404 &&
          activeTab === REPORT_TYPES.AGENT_PERFORMANCE
        ) {
          setReports([]);
          setLoading(false);
          return;
        }
        throw new Error(errorData.message || `Failed to fetch report`);
      }

      const data = await response.json();
      let list = Array.isArray(data) ? data : [];
      if (activeTab === REPORT_TYPES.DTMF_USAGE) {
        list = list.filter((row) => DTMF_DIGIT_LABELS[row.digit_pressed]);
      }
      if (activeTab === REPORT_TYPES.CDR) {
        list = list.filter(
          (row) => !isExcludedCdrDestination(row.dst ?? row.called)
        );
      }
      if (activeTab === REPORT_TYPES.VOICE_NOTE) {
        const playedMap = getPlayedVoiceNotesMap();
        list.forEach((note) => {
          if (playedMap[note.id] && Number(note.is_played) !== 1) {
            markVoiceNotePlayed(note.id).catch(() => {});
          }
        });
        list = list.map((note) => ({
          ...note,
          is_played: isVoiceNotePlayed(note) ? 1 : 0,
        }));
      }
      setReports(list);

      // Calculate summary stats for call reports
      if (
        activeTab === REPORT_TYPES.CDR ||
        activeTab === REPORT_TYPES.CALL_SUMMARY
      ) {
        calculateCallStats(
          activeTab === REPORT_TYPES.CDR ? list : data
        );
      }
    } catch (error) {
      setSnackbarMessage(error.message || "Error loading reports.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    startDate,
    endDate,
    disposition,
    ticketStatus,
    agentFilter,
    missedCallStatusFilter,
    offHoursSource,
  ]);

  useEffect(() => {
    if (SKIP_AUTO_FETCH_TABS.has(activeTab)) return;
    if (OPTIONAL_DATE_TABS.has(activeTab)) {
      fetchReports();
      return;
    }
    if (!isValidReportDateRange(startDate, endDate)) {
      setReports([]);
      return;
    }
    fetchReports();
  }, [
    activeTab,
    startDate,
    endDate,
    disposition,
    ticketStatus,
    agentFilter,
    missedCallStatusFilter,
    offHoursSource,
    fetchReports,
  ]);

  const calculateCallStats = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      setSummaryStats({
        total: 0,
        answered: 0,
        noAnswer: 0,
        busy: 0,
        totalDuration: 0,
        avgDuration: 0,
      });
      return;
    }

    // Check if this is Call Summary data (has total_calls, answered, no_answer, busy fields)
    // vs CDR data (has disposition field)
    const isCallSummary = data.length > 0 && data[0].total_calls !== undefined;

    let stats;
    if (isCallSummary) {
      // For Call Summary: sum up all daily totals
      stats = {
        total: data.reduce((sum, r) => sum + (parseInt(r.total_calls) || 0), 0),
        answered: data.reduce((sum, r) => sum + (parseInt(r.answered) || 0), 0),
        noAnswer: data.reduce(
          (sum, r) => sum + (parseInt(r.no_answer) || 0),
          0
        ),
        busy: data.reduce((sum, r) => sum + (parseInt(r.busy) || 0), 0),
        totalDuration: data.reduce(
          (sum, r) => sum + (parseInt(r.total_duration) || 0),
          0
        ),
        avgDuration: 0,
      };
      // Calculate average duration from total duration and total calls
      stats.avgDuration =
        stats.total > 0 ? Math.round(stats.totalDuration / stats.total) : 0;
    } else {
      // For CDR: count individual records by disposition
      const dispositionOf = (r) => String(r.disposition || "").toLowerCase();
      stats = {
        total: data.length,
        answered: data.filter((r) => dispositionOf(r) === "answered").length,
        noAnswer: data.filter((r) => dispositionOf(r) === "lost").length,
        busy: data.filter((r) => dispositionOf(r) === "dropped").length,
        totalDuration: data.reduce(
          (sum, r) => sum + (parseInt(r.duration) || 0),
          0
        ),
        avgDuration: 0,
      };
      stats.avgDuration =
        stats.total > 0 ? Math.round(stats.totalDuration / stats.total) : 0;
    }

    setSummaryStats(stats);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleOffHoursCallBack = async (record) => {
    const phone = getCallbackPhone(record);
    if (!phone) {
      setSnackbarMessage("No phone number for this missed call.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    if (!sipReady) {
      setSnackbarMessage(
        "SIP phone not ready. Ensure you are logged in with your extension."
      );
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    setOffHoursCallingBackId(record.id);
    try {
      await markMissedCallCalledBack(record.id, extension);
      setReports((prev) =>
        prev.map((r) =>
          r.id === record.id
            ? {
                ...r,
                status: "called_back",
                callback_status: "called_back",
                callback_agent_extension: extension,
                callback_time: new Date().toISOString(),
              }
            : r
        )
      );
      if (useSharedAgentSip && agentSip.openPhoneAndRedial) {
        agentSip.openPhoneAndRedial(formatOutboundNumber(phone) || phone);
      } else {
        redial(formatOutboundNumber(phone) || phone);
      }
      setSnackbarMessage(`Calling back ${phone}...`);
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
    } catch (err) {
      setOffHoursCallingBackId(null);
      setSnackbarMessage(err.message || "Could not start callback.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleOffHoursPlayVoice = async (record) => {
    if (offHoursCurrentAudio) {
      offHoursCurrentAudio.pause();
      offHoursCurrentAudio.currentTime = 0;
    }

    try {
      const { audio } = await playVoiceNoteAudio(record);
      setOffHoursCurrentAudio(audio);
      setOffHoursPlayingId(record.id);

      try {
        await markVoiceNotePlayed(record.id, audio.duration);
        setReports((prev) =>
          prev.map((r) =>
            r.id === record.id
              ? {
                  ...r,
                  is_played: 1,
                  duration_seconds:
                    r.duration_seconds || Math.round(audio.duration || 0),
                }
              : r
          )
        );
      } catch (markErr) {
        console.warn("Could not save played status:", markErr);
      }

      const updatedStatus = { ...offHoursPlayedStatus, [record.id]: true };
      setOffHoursPlayedStatus(updatedStatus);

      audio.onended = () => {
        setOffHoursPlayingId(null);
        setOffHoursCurrentAudio(null);
      };
    } catch (playError) {
      console.error("Error playing audio:", playError);
      setSnackbarMessage(
        "Audio is on the server — not available from local API. Try static URL or use live config."
      );
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
    }
  };

  const handleOffHoursPauseVoice = () => {
    if (offHoursCurrentAudio) {
      offHoursCurrentAudio.pause();
      setOffHoursPlayingId(null);
    }
  };

  const exportOffHoursPDF = () => {
    const doc = new jsPDF();
    doc.text("Off-Hours Calls Report", 14, 14);
    doc.setFontSize(10);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 22);
    doc.text(
      `Source: ${OFF_HOURS_SOURCE_LABELS[offHoursSource] || offHoursSource}`,
      14,
      28
    );
    if (offHoursCategoryFilter !== "all") {
      doc.text(
        `Category: ${
          OFF_HOURS_CATEGORY_OPTIONS.find(
            (c) => c.value === offHoursCategoryFilter
          )?.label
        }`,
        14,
        34
      );
    }

    const startY = offHoursCategoryFilter !== "all" ? 40 : 34;

    if (offHoursSource === "cdr") {
      autoTable(doc, {
        startY,
        head: [
          [
            "Sn",
            "Source",
            "Routed To",
            "Date/Time",
            "Category",
            "Disposition",
            "Duration (min)",
          ],
        ],
        body: filteredReports.map((r, idx) => [
          idx + 1,
          r.caller_display || r.clid || "-",
          r.routed_to_label || r.routed_to || "-",
          getOffHoursTimestamp(r)
            ? new Date(getOffHoursTimestamp(r)).toLocaleString()
            : "-",
          r.off_hours_label || "-",
          r.disposition || "-",
          formatSecondsToMinutes(r.duration, false),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [245, 158, 66] },
      });
    } else if (offHoursSource === "missed-calls") {
      autoTable(doc, {
        startY,
        head: [
          [
            "Sn",
            "Source",
            "Destination",
            "Emergency Number",
            "Date/Time",
            "Category",
            "Callback Status",
            "Called Back By",
            "Callback Time",
          ],
        ],
        body: filteredReports.map((r, idx) => [
          idx + 1,
          missedCallSource(r),
          missedCallDestination(r),
          missedCallEmergency(r),
          getOffHoursTimestamp(r)
            ? new Date(getOffHoursTimestamp(r)).toLocaleString()
            : "-",
          r.off_hours_label || "-",
          r.callback_status || r.status || "-",
          r.callback_agent_name || r.callback_agent_extension || "-",
          r.callback_time
            ? new Date(r.callback_time).toLocaleString()
            : "-",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [245, 158, 66] },
      });
    } else {
      autoTable(doc, {
        startY,
        head: [
          [
            "Sn",
            "Phone",
            "Routed To",
            "Date/Time",
            "Category",
            "Played",
            "Duration (s)",
          ],
        ],
        body: filteredReports.map((r, idx) => [
          idx + 1,
          r.caller_display || r.clid || "-",
          r.routed_to_label || r.routed_to || "-",
          getOffHoursTimestamp(r)
            ? new Date(getOffHoursTimestamp(r)).toLocaleString()
            : "-",
          r.off_hours_label || "-",
          isOffHoursNotePlayed(r, offHoursPlayedStatus) ? "Yes" : "No",
          r.duration_seconds || "-",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [245, 158, 66] },
      });
    }

    doc.save(`off_hours_report_${startDate}_to_${endDate}.pdf`);
    setSnackbarMessage("PDF exported successfully!");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const exportOffHoursCSV = () => {
    let rows = [];
    if (offHoursSource === "cdr") {
      rows = filteredReports.map((r, idx) => ({
        Sn: idx + 1,
        Source: r.caller_display || r.clid || "-",
        "Routed To": r.routed_to_label || r.routed_to || "-",
        "Date/Time": getOffHoursTimestamp(r)
          ? new Date(getOffHoursTimestamp(r)).toLocaleString()
          : "-",
        Category: r.off_hours_label || "-",
        Disposition: r.disposition || "-",
        "Duration (min)": formatSecondsToMinutes(r.duration, false),
      }));
    } else if (offHoursSource === "missed-calls") {
      rows = filteredReports.map((r, idx) => ({
        Sn: idx + 1,
        Source: missedCallSource(r),
        Destination: missedCallDestination(r),
        "Emergency Number": missedCallEmergency(r),
        "Date/Time": getOffHoursTimestamp(r)
          ? new Date(getOffHoursTimestamp(r)).toLocaleString()
          : "-",
        Category: r.off_hours_label || "-",
        "Callback Status": r.callback_status || r.status || "-",
        "Called Back By":
          r.callback_agent_name || r.callback_agent_extension || "-",
        "Callback Time": r.callback_time
          ? new Date(r.callback_time).toLocaleString()
          : "-",
      }));
    } else {
      rows = filteredReports.map((r, idx) => ({
        Sn: idx + 1,
        Phone: r.caller_display || r.clid || "-",
        "Routed To": r.routed_to_label || r.routed_to || "-",
        "Date/Time": getOffHoursTimestamp(r)
          ? new Date(getOffHoursTimestamp(r)).toLocaleString()
          : "-",
        Category: r.off_hours_label || "-",
        Played: isOffHoursNotePlayed(r, offHoursPlayedStatus) ? "Yes" : "No",
        "Duration (s)": r.duration_seconds || "-",
      }));
    }

    exportRowsToCsv(rows, `off_hours_report_${startDate}_to_${endDate}.csv`);
    setSnackbarMessage("CSV exported successfully!");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const getAuthToken = () =>
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("token");

  const fetchTicketAssignments = async (ticketId) => {
    if (assignmentCache[ticketId]) return assignmentCache[ticketId];

    const token = getAuthToken();
    if (!token) {
      setAssignmentErrors((prev) => ({
        ...prev,
        [ticketId]: "Authentication required to load workflow history.",
      }));
      return null;
    }

    setAssignmentLoading((prev) => ({ ...prev, [ticketId]: true }));
    setAssignmentErrors((prev) => ({ ...prev, [ticketId]: null }));

    try {
      const res = await fetch(`${baseURL}/ticket/${ticketId}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to load assignment history");
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.assignments || [];
      setAssignmentCache((prev) => ({ ...prev, [ticketId]: list }));
      return list;
    } catch (err) {
      setAssignmentErrors((prev) => ({
        ...prev,
        [ticketId]: err.message || "Failed to load workflow history",
      }));
      return null;
    } finally {
      setAssignmentLoading((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  const toggleTicketExpand = async (report) => {
    const ticketId = report.id;
    if (!ticketId) return;

    if (expandedTicketId === ticketId) {
      setExpandedTicketId(null);
      return;
    }

    setExpandedTicketId(ticketId);
    if (!assignmentCache[ticketId]) {
      await fetchTicketAssignments(ticketId);
    }
  };

  const fetchAssignmentsForExport = async (ticketId, cache) => {
    if (cache[ticketId] !== undefined) {
      return { assignments: cache[ticketId], unavailable: false };
    }

    const token = getAuthToken();
    if (!token) {
      return { assignments: [], unavailable: true };
    }

    try {
      const res = await fetch(`${baseURL}/ticket/${ticketId}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        return { assignments: [], unavailable: true };
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.assignments || [];
      cache[ticketId] = list;
      return { assignments: list, unavailable: false };
    } catch {
      return { assignments: [], unavailable: true };
    }
  };

  const enrichReportsWithWorkflow = async (reports) => {
    const cache = { ...assignmentCache };

    const enriched = await runWithConcurrency(reports, 5, async (report) => {
      if (!report.id) {
        return enrichTicketWithWorkflow(report, [], false);
      }

      const { assignments, unavailable } = await fetchAssignmentsForExport(
        report.id,
        cache
      );
      return enrichTicketWithWorkflow(report, assignments, unavailable);
    });

    setAssignmentCache((prev) => ({ ...prev, ...cache }));
    return enriched;
  };

  const confirmExportIfLarge = () => {
    if (filteredReports.length <= 150) return true;
    return window.confirm(
      `Export will load workflow history for ${filteredReports.length} tickets. This may take a while. Continue?`
    );
  };

  const getWorkflowTrailForReport = (report) => {
    if (report._workflowTrail) return report._workflowTrail;
    if (report.id && assignmentCache[report.id]) {
      return formatWorkflowTrailForExport(
        buildWorkflowSteps(report, assignmentCache[report.id])
      );
    }
    return "-";
  };

  const getWorkflowTotalDurationForReport = (report) => {
    if (report._workflowTotalDuration) return report._workflowTotalDuration;
    if (report.id && assignmentCache[report.id]) {
      return computeTotalTicketDuration(
        report,
        buildWorkflowSteps(report, assignmentCache[report.id])
      );
    }
    return "-";
  };

  // Column definitions for each report type
  const getColumnDefinitions = () => {
    switch (activeTab) {
      case REPORT_TYPES.VOICE_NOTE:
        return [
          { key: "serial", label: "Serial No", default: true },
          { key: "phone", label: "Phone", default: true },
          { key: "date", label: "Date", default: true },
          { key: "played", label: "Played", default: true },
          {
            key: "voiceDuration",
            label: "Duration of Voice (sec)",
            default: true,
          },
          {
            key: "assignedExtension",
            label: "Assigned Extension",
            default: true,
          },
          { key: "agentName", label: "Agent Name", default: true },
        ];
      case REPORT_TYPES.CDR:
        return [
          { key: "serial", label: "Serial No", default: true },
          { key: "callerId", label: "Caller ID", default: true },
          { key: "source", label: "Source", default: true },
          { key: "destination", label: "Destination", default: true },
          { key: "direction", label: "Direction", default: true },
          { key: "agent", label: "Agent", default: true },
          { key: "startTime", label: "Start Time", default: true },
          {
            key: "agentWait",
            label: "Agent Response Wait from IVR (min)",
            default: true,
          },
          { key: "billed", label: "Talk Time (min)", default: true },
          { key: "disposition", label: "Disposition", default: true },
          { key: "duration", label: "Total Call Duration (min)", default: true },
        ];
      case REPORT_TYPES.TICKET_CRM:
        return [
          { key: "serial", label: "Serial No", default: true },
          { key: "ticketNumber", label: "Ticket #", default: true },
          { key: "id", label: "ID", default: false },
          { key: "subject", label: "Subject", default: true },
          { key: "status", label: "Status", default: true },
          { key: "category", label: "Category", default: true },
          { key: "complaintType", label: "Complaint Type", default: true },
          { key: "inquiryType", label: "Inquiry Type", default: false },
          { key: "requester", label: "Requester", default: true },
          { key: "fullName", label: "Full Name", default: false },
          { key: "firstName", label: "First Name", default: false },
          { key: "middleName", label: "Middle Name", default: false },
          { key: "lastName", label: "Last Name", default: false },
          { key: "phoneNumber", label: "Phone Number", default: false },
          { key: "nidaNumber", label: "NIDA Number", default: false },
          { key: "institution", label: "Institution", default: false },
          { key: "region", label: "Region", default: false },
          { key: "district", label: "District", default: false },
          { key: "description", label: "Description", default: false },
          { key: "channel", label: "Channel", default: false },
          { key: "section", label: "Section", default: false },
          { key: "subSection", label: "Sub Section", default: false },
          { key: "assignedTo", label: "Assigned To", default: true },
          { key: "assignedToName", label: "Assigned To Name", default: false },
          {
            key: "assignedToEmail",
            label: "Assigned To Email",
            default: false,
          },
          { key: "assignedBy", label: "Assigned By", default: false },
          { key: "assignedByName", label: "Assigned By Name", default: false },
          { key: "attendedBy", label: "Attended By", default: false },
          { key: "attendedByName", label: "Attended By Name", default: false },
          { key: "ratedBy", label: "Rated By", default: false },
          { key: "ratedByName", label: "Rated By Name", default: false },
          { key: "convertedBy", label: "Converted By", default: false },
          {
            key: "convertedByName",
            label: "Converted By Name",
            default: false,
          },
          { key: "forwardedBy", label: "Forwarded By", default: false },
          {
            key: "forwardedByName",
            label: "Forwarded By Name",
            default: false,
          },
          { key: "creatorName", label: "Creator Name", default: false },
          { key: "creatorEmail", label: "Creator Email", default: false },
          {
            key: "responsibleUnitId",
            label: "Responsible Unit ID",
            default: false,
          },
          {
            key: "responsibleUnitName",
            label: "Responsible Unit Name",
            default: false,
          },
          { key: "assignedToRole", label: "Assigned To Role", default: false },
          { key: "convertedTo", label: "Converted To", default: false },
          {
            key: "resolutionDetails",
            label: "Resolution Details",
            default: false,
          },
          { key: "resolutionType", label: "Resolution Type", default: false },
          { key: "attachmentPath", label: "Attachment Path", default: false },
          { key: "evidenceUrl", label: "Evidence URL", default: false },
          { key: "agingDays", label: "Aging Days", default: false },
          { key: "isEscalated", label: "Is Escalated", default: false },
          { key: "workflowPath", label: "Workflow Path", default: true },
          {
            key: "currentWorkflowStep",
            label: "Current Workflow Step",
            default: true,
          },
          {
            key: "workflowCompleted",
            label: "Workflow Completed",
            default: true,
          },
          {
            key: "currentWorkflowRole",
            label: "Current Workflow Role",
            default: false,
          },
          { key: "workflowNotes", label: "Workflow Notes", default: false },
          { key: "reviewNotes", label: "Review Notes", default: false },
          { key: "approvalNotes", label: "Approval Notes", default: false },
          {
            key: "representativeName",
            label: "Representative Name",
            default: false,
          },
          {
            key: "representativePhone",
            label: "Representative Phone",
            default: false,
          },
          {
            key: "representativeEmail",
            label: "Representative Email",
            default: false,
          },
          {
            key: "representativeAddress",
            label: "Representative Address",
            default: false,
          },
          {
            key: "representativeRelationship",
            label: "Representative Relationship",
            default: false,
          },
          { key: "dependents", label: "Dependents", default: false },
          { key: "employerId", label: "Employer ID", default: false },
          { key: "createdDate", label: "Created Date", default: true },
          { key: "updatedDate", label: "Updated Date", default: false },
          {
            key: "requestRegisteredDate",
            label: "Request Registered Date",
            default: false,
          },
          { key: "resolvedDate", label: "Resolved Date", default: false },
          { key: "dateOfFeedback", label: "Date of Feedback", default: false },
          {
            key: "dateOfReviewResolution",
            label: "Date of Review Resolution",
            default: false,
          },
          { key: "convertedAt", label: "Converted At", default: false },
          { key: "forwardedAt", label: "Forwarded At", default: false },
          { key: "assignedAt", label: "Assigned At", default: false },
          {
            key: "workflowStartedAt",
            label: "Workflow Started At",
            default: false,
          },
          {
            key: "workflowCompletedAt",
            label: "Workflow Completed At",
            default: false,
          },
          { key: "workflowTrail", label: "Workflow Trail", default: true },
          { key: "workflowTotalDuration", label: "Total Duration", default: true },
        ];
      case REPORT_TYPES.AGENT_PERFORMANCE:
        return [
          { key: "serial", label: "Serial No", default: true },
          { key: "agent", label: "Agent Name", default: true },
          { key: "totalCalls", label: "Total Calls", default: true },
          { key: "answeredCalls", label: "Answered Calls", default: true },
          { key: "missedCalls", label: "Missed Calls", default: true },
          { key: "avgDuration", label: "Avg Duration (min)", default: true },
          { key: "totalTalkTime", label: "Total Talk Time (min)", default: true },
          { key: "fcrRate", label: "FCR Rate", default: true },
        ];
      case REPORT_TYPES.CALL_SUMMARY:
        return [
          { key: "serial", label: "Serial No", default: true },
          { key: "date", label: "Date", default: true },
          { key: "totalCalls", label: "Total Calls", default: true },
          { key: "answered", label: "Answered", default: true },
          { key: "noAnswer", label: "No Answer", default: true },
          { key: "busy", label: "Busy", default: true },
          { key: "totalDuration", label: "Total Duration (min)", default: true },
          { key: "avgDuration", label: "Avg Duration (min)", default: true },
        ];
      case REPORT_TYPES.IVR_INTERACTIONS:
        return [
          { key: "serial", label: "Serial No", default: true },
          { key: "dtmfDigit", label: "DTMF Digit", default: true },
          { key: "actionName", label: "Action Name", default: true },
          { key: "parameter", label: "Parameter", default: true },
          { key: "ivrVoice", label: "IVR Voice", default: true },
          { key: "language", label: "Language", default: true },
          { key: "menuContext", label: "Menu Context", default: true },
          { key: "createdAt", label: "Created At", default: true },
        ];
      case REPORT_TYPES.DTMF_USAGE:
        return [
          { key: "serial", label: "Serial No", default: true },
          { key: "digitPressed", label: "Digit", default: true },
          { key: "dtmfAction", label: "DTMF Action", default: true },
          { key: "callerId", label: "Caller ID", default: true },
          { key: "language", label: "Language", default: true },
          { key: "timestamp", label: "Timestamp", default: true },
        ];
      case REPORT_TYPES.TICKET_ASSIGNMENTS:
        return [
          { key: "serial", label: "Serial No", default: true },
          { key: "ticketNumber", label: "Ticket #", default: true },
          { key: "ticketSubject", label: "Ticket Subject", default: true },
          { key: "ticketStatus", label: "Ticket Status", default: true },
          { key: "ticketCategory", label: "Ticket Category", default: true },
          { key: "action", label: "Action", default: true },
          { key: "assignedToRole", label: "Assigned To Role", default: true },
          { key: "assignedByName", label: "Assigned By", default: true },
          { key: "assignedToName", label: "Assigned To", default: true },
          {
            key: "assignedByEmail",
            label: "Assigned By Email",
            default: false,
          },
          {
            key: "assignedToEmail",
            label: "Assigned To Email",
            default: false,
          },
          { key: "reason", label: "Reason", default: false },
          { key: "attachmentPath", label: "Attachment Path", default: false },
          { key: "evidenceUrl", label: "Evidence URL", default: false },
          { key: "workflowPath", label: "Workflow Path", default: false },
          { key: "workflowStep", label: "Workflow Step", default: false },
          { key: "workflowCurrentRole", label: "Current Role", default: false },
          { key: "workflowNextRole", label: "Next Role", default: false },
          { key: "workflowTotalSteps", label: "Total Steps", default: false },
          { key: "slaTotalDays", label: "SLA Total Days", default: false },
          {
            key: "slaCurrentStepDays",
            label: "SLA Current Step Days",
            default: false,
          },
          {
            key: "slaRemainingDays",
            label: "SLA Remaining Days",
            default: false,
          },
          { key: "backupType", label: "Backup Type", default: false },
          { key: "actionDetails", label: "Action Details", default: false },
          { key: "createdDate", label: "Created Date", default: true },
        ];
      case REPORT_TYPES.MISSED_CALL:
        return [
          { key: "serial", label: "Serial No", default: true },
          { key: "caller", label: "Caller", default: true },
          { key: "time", label: "Time", default: true },
          { key: "agentId", label: "Assigned Agent", default: true },
          { key: "status", label: "Status", default: true },
        ];
      case REPORT_TYPES.DROPPED_CALL:
      case REPORT_TYPES.LOST_CALL:
        return [
          { key: "serial", label: "Serial No", default: true },
          { key: "status", label: "Status", default: true },
          { key: "caller", label: "Caller", default: true },
          { key: "destination", label: "Destination", default: true },
          { key: "agentExtension", label: "Agent Extension", default: true },
          { key: "agentName", label: "Agent Name", default: true },
          { key: "callTime", label: "Call Time", default: true },
          { key: "durationMinutes", label: "Queue Wait (min)", default: true },
          { key: "disposition", label: "Disposition", default: true },
        ];
      case REPORT_TYPES.ESCALLATION:
        return [
          { key: "serial", label: "Serial No", default: true },
          { key: "ticketNumber", label: "Ticket #", default: true },
          { key: "subject", label: "Subject", default: true },
          { key: "status", label: "Status", default: true },
          { key: "category", label: "Category", default: true },
          { key: "assignedTo", label: "Assigned To", default: true },
          { key: "escalatedAt", label: "Escalated At", default: true },
          { key: "createdAt", label: "Created At", default: false },
          { key: "description", label: "Description", default: false },
        ];
      case REPORT_TYPES.NOTIFICATIONS:
        return [
          { key: "serial", label: "Serial No", default: true },
          { key: "ticketNumber", label: "Ticket #", default: true },
          { key: "ticketSubject", label: "Ticket Subject", default: true },
          { key: "message", label: "Message", default: true },
          { key: "comment", label: "Comment", default: true },
          { key: "channel", label: "Channel", default: true },
          { key: "status", label: "Status", default: true },
          { key: "category", label: "Category", default: false },
          { key: "ticketStatus", label: "Ticket Status", default: false },
          { key: "ticketCategory", label: "Ticket Category", default: false },
          { key: "createdAt", label: "Created At", default: true },
          { key: "updatedAt", label: "Updated At", default: false },
        ];
      case REPORT_TYPES.CHATS:
        return [
          { key: "serial", label: "Serial No", default: true },
          { key: "sender", label: "Sender", default: true },
          { key: "receiver", label: "Receiver", default: true },
          { key: "message", label: "Message", default: true },
          { key: "status", label: "Status", default: true },
          { key: "isRead", label: "Read", default: true },
          { key: "timestamp", label: "Timestamp", default: true },
          { key: "deliveredAt", label: "Delivered At", default: false },
          { key: "readAt", label: "Read At", default: false },
        ];
      default:
        return [];
    }
  };

  // Initialize selected columns when tab changes or data loads
  useEffect(() => {
    const columns = getColumnDefinitions();
    const defaultSelected = columns
      .filter((col) => col.default)
      .map((col) => col.key);

    setSelectedColumns((prev) => {
      const validKeys = new Set(columns.map((col) => col.key));
      const current = prev[activeTab];
      if (current && current.length > 0) {
        const pruned = current.filter((key) => validKeys.has(key));
        if (pruned.length !== current.length) {
          return {
            ...prev,
            [activeTab]: pruned.length > 0 ? pruned : defaultSelected,
          };
        }
        return prev;
      }
      return { ...prev, [activeTab]: defaultSelected };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleColumnToggle = (columnKey) => {
    setSelectedColumns((prev) => {
      const current = prev[activeTab] || [];
      const isSelected = current.includes(columnKey);
      const updated = isSelected
        ? current.filter((key) => key !== columnKey)
        : [...current, columnKey];
      return { ...prev, [activeTab]: updated };
    });
  };

  const handleSelectAllColumns = () => {
    const columns = getColumnDefinitions();
    const allKeys = columns.map((col) => col.key);
    setSelectedColumns((prev) => ({ ...prev, [activeTab]: allKeys }));
  };

  const handleDeselectAllColumns = () => {
    setSelectedColumns((prev) => ({ ...prev, [activeTab]: [] }));
  };

  const handleResetColumns = () => {
    const columns = getColumnDefinitions();
    const defaultSelected = columns
      .filter((col) => col.default)
      .map((col) => col.key);
    setSelectedColumns((prev) => ({ ...prev, [activeTab]: defaultSelected }));
  };

  const filteredReports = reports.filter((report) => {
    const searchLower = search.toLowerCase();

    switch (activeTab) {
      case REPORT_TYPES.VOICE_NOTE:
        const played = isVoiceNotePlayed(report);
        const matchesPlayedFilter =
          playedFilter === "all" ||
          (playedFilter === "played" && played) ||
          (playedFilter === "not_played" && !played);
        return (
          (report.clid || "").toLowerCase().includes(searchLower) &&
          matchesPlayedFilter
        );
      case REPORT_TYPES.CDR: {
        const matchesDisposition =
          disposition === "all" ||
          String(report.disposition || "").toLowerCase() === disposition;
        return (
          matchesDisposition &&
          !isExcludedCdrDestination(report.dst ?? report.called) &&
          ((report.clid || "").toLowerCase().includes(searchLower) ||
            (report.dst || "").toLowerCase().includes(searchLower) ||
            (report.src || "").toLowerCase().includes(searchLower) ||
            (report.agent_name || "").toLowerCase().includes(searchLower) ||
            (report.direction || "").toLowerCase().includes(searchLower))
        );
      }
      case REPORT_TYPES.TICKET_CRM:
        const matchesStatus =
          ticketStatus === "all" || report.status === ticketStatus;
        const matchesPriority =
          priorityFilter === "all" ||
          report.priority === priorityFilter ||
          report.complaint_type === priorityFilter;
        const matchesCategory =
          categoryFilter === "all" || report.category === categoryFilter;
        return (
          ((report.ticket_number || "").toLowerCase().includes(searchLower) ||
            (report.subject || "").toLowerCase().includes(searchLower) ||
            (report.requester_name || "")
              .toLowerCase()
              .includes(searchLower)) &&
          matchesStatus &&
          matchesPriority &&
          matchesCategory
        );
      case REPORT_TYPES.AGENT_PERFORMANCE:
        const matchesAgent =
          agentFilter === "all" ||
          String(report.agent_id) === String(agentFilter);
        const matchesAgentSearch =
          !searchLower ||
          (report.agent_name || "").toLowerCase().includes(searchLower);
        return matchesAgentSearch && matchesAgent;
      case REPORT_TYPES.MISSED_CALL:
        return (
          (report.caller || "").toLowerCase().includes(searchLower) ||
          (report.agentId || "").toLowerCase().includes(searchLower) ||
          (report.agent_name || "").toLowerCase().includes(searchLower)
        );
      case REPORT_TYPES.DROPPED_CALL:
      case REPORT_TYPES.LOST_CALL:
        return (
          (report.caller || "").toLowerCase().includes(searchLower) ||
          (report.destination || "").toLowerCase().includes(searchLower) ||
          (report.agent_extension || "").toLowerCase().includes(searchLower) ||
          (report.agent_name || "").toLowerCase().includes(searchLower) ||
          (report.status || "").toLowerCase().includes(searchLower) ||
          (report.disposition || "").toLowerCase().includes(searchLower)
        );
      case REPORT_TYPES.ESCALLATION:
        return (
          (report.ticket_id || "").toLowerCase().includes(searchLower) ||
          (report.ticket_number || "").toLowerCase().includes(searchLower) ||
          (report.subject || "").toLowerCase().includes(searchLower) ||
          (report.status || "").toLowerCase().includes(searchLower) ||
          (report.category || "").toLowerCase().includes(searchLower) ||
          (report.assignee?.full_name || "").toLowerCase().includes(searchLower) ||
          (report.assigned_to_name || "").toLowerCase().includes(searchLower)
        );
      case REPORT_TYPES.NOTIFICATIONS:
        return (
          (report.ticket?.ticket_id || "").toLowerCase().includes(searchLower) ||
          (report.ticket_id || "").toLowerCase().includes(searchLower) ||
          (report.ticket?.subject || "").toLowerCase().includes(searchLower) ||
          (report.message || "").toLowerCase().includes(searchLower) ||
          (report.comment || "").toLowerCase().includes(searchLower) ||
          (report.channel || "").toLowerCase().includes(searchLower) ||
          (report.status || "").toLowerCase().includes(searchLower)
        );
      case REPORT_TYPES.CHATS:
        return (
          (report.senderName || "").toLowerCase().includes(searchLower) ||
          (report.receiverName || "").toLowerCase().includes(searchLower) ||
          (report.senderId || "").toLowerCase().includes(searchLower) ||
          (report.receiverId || "").toLowerCase().includes(searchLower) ||
          (report.otherUserId || "").toLowerCase().includes(searchLower) ||
          (report.otherUserName || "").toLowerCase().includes(searchLower) ||
          (report.message || "").toLowerCase().includes(searchLower) ||
          (report.status || "").toLowerCase().includes(searchLower)
        );
      case REPORT_TYPES.IVR_INTERACTIONS:
        return (
          String(report.dtmf_digit || "").includes(searchLower) ||
          (report.action?.name || "").toLowerCase().includes(searchLower) ||
          (report.parameter || "").toLowerCase().includes(searchLower) ||
          (report.voice?.file_name || "").toLowerCase().includes(searchLower) ||
          (report.menu_context || "").toLowerCase().includes(searchLower) ||
          (report.language || "").toLowerCase().includes(searchLower)
        );
      case REPORT_TYPES.DTMF_USAGE:
        if (!DTMF_DIGIT_LABELS[report.digit_pressed]) return false;
        return (
          String(report.digit_pressed || "").includes(searchLower) ||
          getDtmfActionLabel(report.digit_pressed)
            .toLowerCase()
            .includes(searchLower) ||
          (report.caller_id || "").toLowerCase().includes(searchLower) ||
          (report.language || "").toLowerCase().includes(searchLower)
        );
      case REPORT_TYPES.OFF_HOURS: {
        const phone = (
          report.caller_display ||
          report.caller_phone ||
          report.clid ||
          report.caller ||
          report.src ||
          ""
        ).toLowerCase();
        const routed = (report.routed_to_label || report.routed_to || "").toLowerCase();
        const matchesSearch =
          phone.includes(searchLower) || routed.includes(searchLower);
        const matchesCategory =
          offHoursCategoryFilter === "all" ||
          report.off_hours_category === offHoursCategoryFilter;
        return matchesSearch && matchesCategory;
      }
      default:
        return true;
    }
  });

  const { paginatedItems: currentReports, paginationProps, resetPage, page, rowsPerPage } =
    useReportTablePagination(filteredReports);

  useEffect(() => {
    resetPage();
  }, [
    filteredReports.length,
    activeTab,
    startDate,
    endDate,
    search,
    disposition,
    ticketStatus,
    agentFilter,
    missedCallStatusFilter,
    offHoursCategoryFilter,
    playedFilter,
    priorityFilter,
    categoryFilter,
    resetPage,
  ]);

  useEffect(() => {
    setExpandedTicketId(null);
  }, [page, activeTab]);

  const getAssignedAgentDisplay = (report) => {
    if (report.assigned_extension) {
      return `Ext ${report.assigned_extension}${
        report.assigned_agent_name ? ` (${report.assigned_agent_name})` : ""
      }`;
    }

    if (report.assigned_agent_name) {
      return report.assigned_agent_name;
    }

    return "-";
  };

  const getAssignedExtensionDisplay = (report) =>
    report.assigned_extension ? `Ext ${report.assigned_extension}` : "-";

  const getAssignedAgentNameDisplay = (report) =>
    report.assigned_agent_name || "-";

  // Helper function to get column value from report
  const getColumnValue = (columnKey, report, index) => {
    switch (activeTab) {
      case REPORT_TYPES.VOICE_NOTE:
        switch (columnKey) {
          case "serial":
            return page * rowsPerPage + index + 1;
          case "phone":
            return report.clid || "-";
          case "date":
            return report.created_at
              ? new Date(report.created_at).toLocaleString()
              : "-";
          case "played":
            return isVoiceNotePlayed(report) ? "Yes" : "No";
          case "voiceDuration":
            return formatVoiceNoteDuration(report.duration_seconds);
          case "assignedExtension":
            return getAssignedExtensionDisplay(report);
          case "agentName":
            return getAssignedAgentNameDisplay(report);
          default:
            return "-";
        }
      case REPORT_TYPES.CDR:
        switch (columnKey) {
          case "serial":
            return page * rowsPerPage + index + 1;
          case "callerId":
            return report.clid || "-";
          case "source":
            return report.src || "-";
          case "destination":
            return report.dst || "-";
          case "direction":
            return report.direction
              ? String(report.direction).toUpperCase()
              : "-";
          case "agent":
            return report.agent_name || "-";
          case "startTime":
            return report.cdrstarttime
              ? new Date(report.cdrstarttime).toLocaleString()
              : "-";
          case "agentWait":
            return report.agent_wait_sec != null
              ? formatSecondsToMinutes(report.agent_wait_sec, false)
              : "-";
          case "duration":
            return formatSecondsToMinutes(report.duration, false);
          case "billed":
            return formatSecondsToMinutes(computeCdrTalkTimeSec(report), false);
          case "disposition":
            return formatCallStatus(report.disposition);
          default:
            return "-";
        }
      case REPORT_TYPES.TICKET_CRM:
        switch (columnKey) {
          case "serial":
            return page * rowsPerPage + index + 1;
          case "ticketNumber":
            return report.ticket_number || report.ticket_id || "-";
          case "id":
            return report.id || "-";
          case "subject":
            return report.subject || "-";
          case "status":
            return report.status || "-";
          case "category":
            return report.category || "-";
          case "complaintType":
            return report.complaint_type || "-";
          case "inquiryType":
            return report.inquiry_type || "-";
          case "requester":
            return report.requester_name || report.requester || "-";
          case "fullName":
            // Try computed full_name first, then build from components, then requester
            if (report.full_name) return report.full_name;
            if (report.first_name && report.last_name) {
              return `${report.first_name} ${
                report.middle_name ? report.middle_name + " " : ""
              }${report.last_name}`.trim();
            }
            return report.requester || "-";
          case "firstName":
            return report.first_name !== null &&
              report.first_name !== undefined &&
              report.first_name !== ""
              ? report.first_name
              : "-";
          case "middleName":
            return report.middle_name !== null &&
              report.middle_name !== undefined &&
              report.middle_name !== ""
              ? report.middle_name
              : "-";
          case "lastName":
            return report.last_name !== null &&
              report.last_name !== undefined &&
              report.last_name !== ""
              ? report.last_name
              : "-";
          case "phoneNumber":
            return report.phone_number || "-";
          case "nidaNumber":
            return report.nida_number || "-";
          case "institution":
            return report.institution || "-";
          case "region":
            return report.region || "-";
          case "district":
            return report.district || "-";
          case "description":
            return report.description || "-";
          case "channel":
            return report.channel || "-";
          case "section":
            return report.section || "-";
          case "subSection":
            return report.sub_section || "-";
          case "assignedTo":
            return report.assigned_to_name || report.assigned_to_id || "-";
          case "assignedToName":
            return report.assigned_to_name || "-";
          case "assignedToEmail":
            return report.assigned_to_email || "-";
          case "assignedBy":
            return report.assigned_by || "-";
          case "assignedByName":
            return report.assigned_by_name || "-";
          case "attendedBy":
            return report.attended_by_id || "-";
          case "attendedByName":
            return report.attended_by_name || "-";
          case "ratedBy":
            return report.rated_by_id || "-";
          case "ratedByName":
            return report.rated_by_name || "-";
          case "convertedBy":
            return report.converted_by_id || "-";
          case "convertedByName":
            return report.converted_by_name || "-";
          case "forwardedBy":
            return report.forwarded_by_id || "-";
          case "forwardedByName":
            return report.forwarded_by_name || "-";
          case "creatorName":
            return report.creator_name || "-";
          case "creatorEmail":
            return report.creator_email || "-";
          case "responsibleUnitId":
            return report.responsible_unit_id || "-";
          case "responsibleUnitName":
            return report.responsible_unit_name || "-";
          case "assignedToRole":
            return report.assigned_to_role || "-";
          case "convertedTo":
            return report.converted_to || "-";
          case "resolutionDetails":
            return report.resolution_details || "-";
          case "resolutionType":
            return report.resolution_type || "-";
          case "attachmentPath":
            return report.attachment_path || "-";
          case "evidenceUrl":
            return report.evidence_url || "-";
          case "agingDays":
            return report.aging_days || 0;
          case "isEscalated":
            return report.is_escalated ? "Yes" : "No";
          case "workflowPath":
            return report.workflow_path || "-";
          case "currentWorkflowStep":
            return report.current_workflow_step || "-";
          case "workflowCompleted":
            return report.workflow_completed ? "Yes" : "No";
          case "currentWorkflowRole":
            return (
              report.current_workflow_role ||
              report.workflow_current_role ||
              "-"
            );
          case "workflowNotes":
            return report.workflow_notes || "-";
          case "reviewNotes":
            return report.review_notes || "-";
          case "approvalNotes":
            return report.approval_notes || "-";
          case "representativeName":
            return report.representative_name || "-";
          case "representativePhone":
            return report.representative_phone || "-";
          case "representativeEmail":
            return report.representative_email || "-";
          case "representativeAddress":
            return report.representative_address || "-";
          case "representativeRelationship":
            return report.representative_relationship || "-";
          case "dependents":
            return report.dependents || "-";
          case "employerId":
            return report.employerId || report.employer_id || "-";
          case "createdDate":
            return report.created_at
              ? new Date(report.created_at).toLocaleString()
              : "-";
          case "updatedDate":
            return report.updated_at
              ? new Date(report.updated_at).toLocaleString()
              : "-";
          case "requestRegisteredDate":
            return report.request_registered_date
              ? new Date(report.request_registered_date).toLocaleString()
              : "-";
          case "resolvedDate":
            return report.resolved_at || report.date_of_resolution
              ? new Date(
                  report.resolved_at || report.date_of_resolution
                ).toLocaleString()
              : "-";
          case "dateOfFeedback":
            return report.date_of_feedback
              ? new Date(report.date_of_feedback).toLocaleString()
              : "-";
          case "dateOfReviewResolution":
            return report.date_of_review_resolution
              ? new Date(report.date_of_review_resolution).toLocaleString()
              : "-";
          case "convertedAt":
            return report.converted_at
              ? new Date(report.converted_at).toLocaleString()
              : "-";
          case "forwardedAt":
            return report.forwarded_at
              ? new Date(report.forwarded_at).toLocaleString()
              : "-";
          case "assignedAt":
            return report.assigned_at
              ? new Date(report.assigned_at).toLocaleString()
              : "-";
          case "workflowStartedAt":
            return report.workflow_started_at
              ? new Date(report.workflow_started_at).toLocaleString()
              : "-";
          case "workflowCompletedAt":
            return report.workflow_completed_at
              ? new Date(report.workflow_completed_at).toLocaleString()
              : "-";
          case "workflowTrail":
            return getWorkflowTrailForReport(report);
          case "workflowTotalDuration":
            return getWorkflowTotalDurationForReport(report);
          default:
            return report[columnKey] || "-";
        }
      case REPORT_TYPES.AGENT_PERFORMANCE:
        switch (columnKey) {
          case "serial":
            return page * rowsPerPage + index + 1;
          case "agent":
            return report.agent_name || "-";
          case "totalCalls":
            return report.total_calls || 0;
          case "answeredCalls":
            return report.answered_calls || 0;
          case "missedCalls":
            return report.missed_calls || 0;
          case "avgDuration":
            return formatSecondsToMinutes(report.avg_duration, false);
          case "totalTalkTime":
            return formatSecondsToMinutes(report.total_talk_time, false);
          case "fcrRate":
            return report.fcr_rate || "0%";
          default:
            return "-";
        }
      case REPORT_TYPES.CALL_SUMMARY:
        switch (columnKey) {
          case "serial":
            return page * rowsPerPage + index + 1;
          case "date":
            return report.date
              ? new Date(report.date).toLocaleDateString()
              : "-";
          case "totalCalls":
            return report.total_calls || 0;
          case "answered":
            return report.answered || 0;
          case "noAnswer":
            return report.no_answer || 0;
          case "busy":
            return report.busy || 0;
          case "totalDuration":
            return formatSecondsToMinutes(report.total_duration, false);
          case "avgDuration":
            return formatSecondsToMinutes(report.avg_duration, false);
          default:
            return "-";
        }
      case REPORT_TYPES.IVR_INTERACTIONS:
        switch (columnKey) {
          case "serial":
            return page * rowsPerPage + index + 1;
          case "dtmfDigit":
            return report.dtmf_digit ?? "-";
          case "actionName":
            return report.action?.name || "-";
          case "parameter":
            return report.parameter || "-";
          case "ivrVoice":
            return report.voice?.file_name || "-";
          case "language":
            return report.language || "-";
          case "menuContext":
            return report.menu_context || "-";
          case "createdAt":
            return report.createdAt
              ? new Date(report.createdAt).toLocaleString()
              : "-";
          default:
            return "-";
        }
      case REPORT_TYPES.DTMF_USAGE:
        switch (columnKey) {
          case "serial":
            return page * rowsPerPage + index + 1;
          case "digitPressed":
            return report.digit_pressed ?? "-";
          case "dtmfAction":
            return getDtmfActionLabel(report.digit_pressed);
          case "callerId":
            return report.caller_id || "-";
          case "language":
            return report.language || "-";
          case "timestamp":
            return report.timestamp
              ? new Date(String(report.timestamp).replace(" ", "T")).toLocaleString()
              : "-";
          default:
            return "-";
        }
      case REPORT_TYPES.TICKET_ASSIGNMENTS:
        switch (columnKey) {
          case "serial":
            return page * rowsPerPage + index + 1;
          case "ticketNumber":
            return report.ticket_number || "-";
          case "ticketSubject":
            return report.ticket_subject || "-";
          case "ticketStatus":
            return report.ticket_status || "-";
          case "ticketCategory":
            return report.ticket_category || "-";
          case "action":
            return report.action || "-";
          case "assignedToRole":
            return report.assigned_to_role || "-";
          case "assignedByName":
            return report.assigned_by_name || "-";
          case "assignedToName":
            return report.assigned_to_name || "-";
          case "assignedByEmail":
            return report.assigned_by_email || "-";
          case "assignedToEmail":
            return report.assigned_to_email || "-";
          case "reason":
            return report.reason || "-";
          case "attachmentPath":
            return report.attachment_path || "-";
          case "evidenceUrl":
            return report.evidence_url || "-";
          case "workflowPath":
            return report.workflow_path || "-";
          case "workflowStep":
            return report.workflow_step || "-";
          case "workflowCurrentRole":
            return report.workflow_current_role || "-";
          case "workflowNextRole":
            return report.workflow_next_role || "-";
          case "workflowTotalSteps":
            return report.workflow_total_steps || "-";
          case "slaTotalDays":
            return report.sla_total_days || "-";
          case "slaCurrentStepDays":
            return report.sla_current_step_days || "-";
          case "slaRemainingDays":
            return report.sla_remaining_days || "-";
          case "backupType":
            return report.backup_type || "-";
          case "actionDetails":
            return report.action_details || "-";
          case "createdDate":
            return report.created_at
              ? new Date(report.created_at).toLocaleString()
              : "-";
          default:
            return report[columnKey] || "-";
        }
      case REPORT_TYPES.MISSED_CALL:
        switch (columnKey) {
          case "serial":
            return page * rowsPerPage + index + 1;
          case "caller":
            return report.caller || "-";
          case "time":
            return report.time
              ? new Date(report.time).toLocaleString()
              : "-";
          case "agentId":
            if (report.agentId) {
              const name = report.agent_name ? ` (${report.agent_name})` : "";
              return `Ext ${report.agentId}${name}`;
            }
            return "-";
          case "status":
            return report.status || "-";
          default:
            return report[columnKey] || "-";
        }
      case REPORT_TYPES.DROPPED_CALL:
      case REPORT_TYPES.LOST_CALL:
        switch (columnKey) {
          case "serial":
            return page * rowsPerPage + index + 1;
          case "status":
            return (
              report.status ||
              (activeTab === REPORT_TYPES.LOST_CALL ? "LOST" : "DROPPED")
            );
          case "caller":
            return report.caller || "-";
          case "destination":
            return report.destination || "-";
          case "agentExtension":
            return report.agent_extension ? `Ext ${report.agent_extension}` : "-";
          case "agentName":
            return report.agent_name || "-";
          case "callTime":
            return formatDbDateTimeLocal(report.call_time, {
              fallback: "-",
            });
          case "durationMinutes":
            return report.duration_minutes != null
              ? String(report.duration_minutes)
              : formatSecondsToMinutes(report.wait_seconds, false);
          case "disposition":
            return report.disposition || "-";
          default:
            return report[columnKey] || "-";
        }
      case REPORT_TYPES.ESCALLATION:
        switch (columnKey) {
          case "serial":
            return page * rowsPerPage + index + 1;
          case "ticketNumber":
            return report.ticket_id || report.ticket_number || "-";
          case "subject":
            return report.subject || "-";
          case "status":
            return report.status || "-";
          case "category":
            return report.category || "-";
          case "assignedTo":
            return report.assignee?.full_name || report.assigned_to_name || "-";
          case "escalatedAt":
            return report.escalated_at || report.updated_at
              ? new Date(report.escalated_at || report.updated_at).toLocaleString()
              : "-";
          case "createdAt":
            return report.created_at
              ? new Date(report.created_at).toLocaleString()
              : "-";
          case "description":
            return report.description || "-";
          default:
            return report[columnKey] || "-";
        }
      case REPORT_TYPES.NOTIFICATIONS:
        switch (columnKey) {
          case "serial":
            return page * rowsPerPage + index + 1;
          case "ticketNumber":
            return report.ticket?.ticket_id || report.ticket_id || "-";
          case "ticketSubject":
            return report.ticket?.subject || "-";
          case "message":
            return report.message || "-";
          case "comment":
            return report.comment || "-";
          case "channel":
            return report.channel || "-";
          case "status":
            return report.status || "-";
          case "category":
            return report.category || "-";
          case "ticketStatus":
            return report.ticket?.status || "-";
          case "ticketCategory":
            return report.ticket?.category || "-";
          case "createdAt":
            return report.created_at
              ? new Date(report.created_at).toLocaleString()
              : "-";
          case "updatedAt":
            return report.updated_at
              ? new Date(report.updated_at).toLocaleString()
              : "-";
          default:
            return report[columnKey] || "-";
        }
      case REPORT_TYPES.CHATS:
        switch (columnKey) {
          case "serial":
            return page * rowsPerPage + index + 1;
          case "sender":
            return report.senderName || report.senderId || "-";
          case "receiver":
            return (
              report.receiverName ||
              report.receiverId ||
              report.otherUserId ||
              "-"
            );
          case "message":
            return report.message || "-";
          case "status":
            return report.status || "sent";
          case "isRead":
            return report.isRead ? "Yes" : "No";
          case "timestamp":
            return report.createdAt || report.timestamp
              ? new Date(report.createdAt || report.timestamp).toLocaleString()
              : "-";
          case "deliveredAt":
            return report.deliveredAt
              ? new Date(report.deliveredAt).toLocaleString()
              : "-";
          case "readAt":
            return report.readAt
              ? new Date(report.readAt).toLocaleString()
              : "-";
          default:
            return report[columnKey] || "-";
        }
      default:
        return "-";
    }
  };

  // Shared export row builder for tabular reports
  const prepareTabularExportRows = async () => {
    if (filteredReports.length === 0) {
      setSnackbarMessage("No data to export");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return null;
    }

    const columns = getColumnDefinitions();
    const selected = selectedColumns[activeTab] || [];
    const selectedColumnsDef = columns.filter((col) =>
      selected.includes(col.key)
    );

    if (selectedColumnsDef.length === 0) {
      setSnackbarMessage("Please select at least one column to export");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return null;
    }

    let dataSource = filteredReports;
    if (activeTab === REPORT_TYPES.TICKET_CRM) {
      if (!confirmExportIfLarge()) return null;
      setExportingWorkflow(true);
      try {
        dataSource = await enrichReportsWithWorkflow(filteredReports);
      } catch {
        setSnackbarMessage("Failed to load workflow data for export");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return null;
      } finally {
        setExportingWorkflow(false);
      }
    }

    const rows = dataSource.map((report, idx) => {
      const row = {};
      selectedColumnsDef.forEach((col) => {
        row[col.label] = getColumnValue(col.key, report, idx);
      });
      return row;
    });

    const filenameBase = `${getReportTitle().toLowerCase().replace(/\s+/g, "_")}_${
      startDate || "all"
    }_${endDate || "all"}`;

    return { rows, filenameBase };
  };

  // CSV Export Function
  const handleExportCSV = async () => {
    if (activeTab === REPORT_TYPES.OFF_HOURS) {
      if (filteredReports.length === 0) {
        setSnackbarMessage("No data to export");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
        return;
      }
      exportOffHoursCSV();
      return;
    }

    const prepared = await prepareTabularExportRows();
    if (!prepared) return;

    exportRowsToCsv(prepared.rows, `${prepared.filenameBase}.csv`);

    setSnackbarMessage("CSV exported successfully!");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  // Excel Export Function
  const handleExportExcel = async () => {
    if (activeTab === REPORT_TYPES.OFF_HOURS) {
      setSnackbarMessage("Use Off-Hours report export buttons");
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
      return;
    }

    const prepared = await prepareTabularExportRows();
    if (!prepared) return;

    exportRowsToExcel(prepared.rows, `${prepared.filenameBase}.xlsx`, "Report");

    setSnackbarMessage("Excel exported successfully!");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  // PDF Export Function
  const handleExportPDF = async () => {
    if (activeTab === REPORT_TYPES.OFF_HOURS) {
      if (filteredReports.length === 0) {
        setSnackbarMessage("No data to export");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
        return;
      }
      exportOffHoursPDF();
      return;
    }

    if (filteredReports.length === 0) {
      setSnackbarMessage("No data to export");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    const columns = getColumnDefinitions();
    const selected = selectedColumns[activeTab] || [];
    const selectedColumnsDef = columns.filter((col) =>
      selected.includes(col.key)
    );

    if (selectedColumnsDef.length === 0) {
      setSnackbarMessage("Please select at least one column to export");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    let dataSource = filteredReports;
    if (activeTab === REPORT_TYPES.TICKET_CRM) {
      if (!confirmExportIfLarge()) return;
      setExportingWorkflow(true);
      try {
        dataSource = await enrichReportsWithWorkflow(filteredReports);
      } catch {
        setSnackbarMessage("Failed to load workflow data for export");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      } finally {
        setExportingWorkflow(false);
      }
    }

    const hasWorkflowExportCols = selectedColumnsDef.some(
      (col) =>
        col.key === "workflowTrail" || col.key === "workflowTotalDuration"
    );

    // Determine if we need landscape and smaller fonts based on column count
    const columnCount = selectedColumnsDef.length;
    const useLandscape =
      columnCount > 8 ||
      (activeTab === REPORT_TYPES.TICKET_CRM && hasWorkflowExportCols);

    // Use landscape orientation for wide tables
    const doc = new jsPDF(useLandscape ? "landscape" : "portrait", "mm", "a4");
    const reportTitle = getReportTitle();

    doc.setFontSize(16);
    doc.text(reportTitle, 14, 14);

    if (startDate && endDate) {
      doc.setFontSize(10);
      doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 20);
    }

    // Shorten header labels for better fit when there are many columns
    const headers = [
      selectedColumnsDef.map((col) => {
        if (columnCount > 10) {
          // Use shorter labels for many columns
          const shortLabels = {
            "Serial No": "SN",
            "Ticket #": "Ticket",
            "First Name": "First",
            "Middle Name": "Middle",
            "Last Name": "Last",
            "Phone Number": "Phone",
            "NIDA Number": "NIDA",
            "Created Date": "Created",
            "Updated Date": "Updated",
            "Resolved Date": "Resolved",
            "Assigned To": "Assigned",
            "Assigned To Name": "Assigned To",
            "Assigned To Email": "Assigned Email",
            "Complaint Type": "Type",
            "Inquiry Type": "Inquiry",
            "Resolution Type": "Resolution",
            "Attachment Path": "Attachment",
            "Evidence URL": "Evidence",
            "Aging Days": "Aging",
            "Is Escalated": "Escalated",
            "Workflow Path": "Workflow",
            "Current Workflow Step": "Step",
            "Workflow Completed": "Completed",
            "Current Workflow Role": "Role",
            "Workflow Notes": "Wf Notes",
            "Review Notes": "Review",
            "Approval Notes": "Approval",
            "Representative Name": "Rep Name",
            "Representative Phone": "Rep Phone",
            "Representative Email": "Rep Email",
            "Representative Address": "Rep Address",
            "Representative Relationship": "Rep Rel",
            "Request Registered Date": "Registered",
            "Date of Feedback": "Feedback",
            "Date of Review Resolution": "Review Res",
            "Workflow Started At": "Wf Start",
            "Workflow Completed At": "Wf End",
            "Workflow Trail": "Trail",
            "Total Duration": "Duration",
          };
          return shortLabels[col.label] || col.label.substring(0, 12);
        }
        return col.label;
      }),
    ];
    const tableData = dataSource.map((report, idx) =>
      selectedColumnsDef.map((col) => {
        const value = getColumnValue(col.key, report, idx);
        if (col.key === "workflowTrail") {
          return typeof value === "string" ? value : String(value);
        }
        // Truncate long text for PDF based on column count
        const maxLength = columnCount > 10 ? 25 : columnCount > 6 ? 35 : 45;
        if (typeof value === "string" && value.length > maxLength) {
          return value.substring(0, maxLength) + "...";
        }
        return value;
      })
    );

    // Calculate column widths dynamically
    const pageWidth = useLandscape ? 297 : 210; // A4 width in mm
    const margin = 14;
    const availableWidth = pageWidth - margin * 2;

    // Adjust font size and padding based on column count
    const fontSize =
      columnCount > 12 ? 5 : columnCount > 8 ? 6 : columnCount > 6 ? 7 : 8;
    const cellPadding = columnCount > 10 ? 1.5 : columnCount > 6 ? 2 : 3;

    // Build column styles with dynamic widths
    const columnStyles = {};
    selectedColumnsDef.forEach((col, index) => {
      let width = "auto";

      // For many columns, use smart width distribution
      if (columnCount > 8 || col.key === "workflowTrail") {
        if (col.key === "workflowTrail") {
          width = availableWidth * 0.45;
        } else if (col.key === "serial" || col.key === "id") {
          width = availableWidth * 0.025; // 2.5% for serial/ID
        } else if (
          col.key === "description" ||
          col.key === "resolutionDetails" ||
          col.key === "workflowNotes" ||
          col.key === "reviewNotes" ||
          col.key === "approvalNotes"
        ) {
          width = availableWidth * 0.1; // 10% for long text fields
        } else if (col.key === "subject") {
          width = availableWidth * 0.08; // 8% for subject
        } else if (col.key.includes("Date") || col.key.includes("At")) {
          width = availableWidth * 0.07; // 7% for dates
        } else if (col.key === "phoneNumber" || col.key === "nidaNumber") {
          width = availableWidth * 0.06; // 6% for phone/NIDA
        } else if (col.key === "ticketNumber") {
          width = availableWidth * 0.06; // 6% for ticket number
        } else {
          // Default width for other columns - distribute remaining space
          const usedWidth = Object.values(columnStyles).reduce(
            (sum, style) =>
              sum + (typeof style.cellWidth === "number" ? style.cellWidth : 0),
            0
          );
          const remainingWidth = availableWidth - usedWidth;
          const remainingColumns = columnCount - index;
          width = Math.max(
            availableWidth * 0.05,
            remainingWidth / remainingColumns
          ); // At least 5% or distribute remaining
        }
      }

      columnStyles[index] = {
        cellWidth: width,
        fontSize: col.key === "workflowTrail" ? Math.max(5, fontSize - 1) : fontSize,
        cellPadding: cellPadding,
        halign: col.key === "serial" || col.key === "id" ? "center" : "left",
        valign: "top",
        overflow: "linebreak",
        lineWidth: 0.1,
        ...(col.key === "workflowTrail"
          ? { minCellHeight: 24, cellWidth: width || availableWidth * 0.45 }
          : {}),
      };
    });

    autoTable(doc, {
      startY: startDate && endDate ? 26 : 20,
      head: headers,
      body: tableData,
      styles: {
        fontSize: fontSize,
        cellPadding: cellPadding,
        overflow: "linebreak",
        cellWidth: "wrap",
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
      },
      headStyles: {
        fillColor: [22, 160, 133],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
        fontSize: fontSize + (columnCount > 10 ? 0 : 1),
        cellPadding: cellPadding + 1,
        minCellHeight: columnCount > 10 ? 12 : 8, // Taller header cells for many columns
      },
      // Rotate headers when there are many columns
      didParseCell: function (data) {
        if (data.section === "head" && columnCount > 10) {
          // Increase header cell height to accommodate rotated text
          data.cell.styles.minCellHeight = 20;
        }
      },
      // Custom drawing for rotated headers
      didDrawCell: function (data) {
        if (data.section === "head" && columnCount > 10) {
          const cell = data.cell;
          const text = cell.text[0] || "";

          // Draw background
          doc.setFillColor(22, 160, 133);
          doc.rect(cell.x, cell.y, cell.width, cell.height, "F");

          // Calculate rotation center
          const centerX = cell.x + cell.width / 2;
          const centerY = cell.y + cell.height / 2;

          // Draw rotated text
          doc.saveGraphicsState();
          doc.setFontSize(fontSize);
          doc.setTextColor(255, 255, 255);
          doc.setFont(undefined, "bold");

          // Rotate and draw text at 45 degrees
          doc.text(text, centerX, centerY - 2, {
            angle: 45,
            align: "center",
            baseline: "middle",
          });

          doc.restoreGraphicsState();
          return false; // Prevent default text rendering
        }
      },
      columnStyles: columnStyles,
      margin: {
        top: startDate && endDate ? 26 : 20,
        left: margin,
        right: margin,
      },
      tableWidth: "auto",
      showHead: "everyPage",
      theme: "striped",
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    const filename = `${reportTitle.toLowerCase().replace(/\s+/g, "_")}_${
      startDate || "all"
    }_${endDate || "all"}.pdf`;
    doc.save(filename);

    setSnackbarMessage("PDF exported successfully!");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const getReportTitle = () => getReportLabel(activeTab);

  useEffect(() => {
    const valid = REPORTS.some((r) => r.slug === reportSlug);
    if (!valid) {
      navigate("/reports/voice-note", { replace: true });
      return;
    }
    setReports([]);
    setSearch("");
    setOffHoursSummary(null);
    setOffHoursPlayingId(null);
    if (offHoursCurrentAudio) {
      offHoursCurrentAudio.pause();
      setOffHoursCurrentAudio(null);
    }
    setSummaryStats({
      total: 0,
      answered: 0,
      noAnswer: 0,
      busy: 0,
      totalDuration: 0,
      avgDuration: 0,
    });
  }, [reportSlug, navigate]);

  const handleReportSelect = (event) => {
    const slug = event.target.value;
    if (slug !== reportSlug) {
      navigate(`/reports/${slug}`);
    }
  };

  const renderOffHoursSummaryCards = () => {
    if (activeTab !== REPORT_TYPES.OFF_HOURS || !offHoursSummary) {
      return null;
    }

    const cards = [
      ...OFF_HOURS_SUMMARY_CARDS,
      ...(offHoursSource === "missed-calls"
        ? OFF_HOURS_MISSED_SUMMARY_CARDS
        : []),
    ];

    return (
      <div className="off-hours-summary">
        {cards.map((card) => (
          <div
            key={card.key}
            className="off-hours-summary-card"
            style={{ borderTopColor: card.color }}
          >
            <div className="off-hours-summary-value">
              {offHoursSummary[card.key] ?? 0}
            </div>
            <div className="off-hours-summary-label">{card.label}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderSummaryCards = () => {
    if (activeTab === REPORT_TYPES.OFF_HOURS) {
      return renderOffHoursSummaryCards();
    }

    if (
      activeTab !== REPORT_TYPES.CDR &&
      activeTab !== REPORT_TYPES.CALL_SUMMARY
    ) {
      return null;
    }

    const totalCalls = summaryStats.total || 0;
    const answeredPercentage = totalCalls > 0 ? Math.round((summaryStats.answered / totalCalls) * 100) : 0;
    const noAnswerPercentage = totalCalls > 0 ? Math.round((summaryStats.noAnswer / totalCalls) * 100) : 0;
    const busyPercentage = totalCalls > 0 ? Math.round((summaryStats.busy / totalCalls) * 100) : 0;

    const formatDuration = (seconds) => formatSecondsToMinutes(seconds);

    const noAnswerLabel =
      activeTab === REPORT_TYPES.CDR ? "Lost" : "No Answer";
    const busyLabel =
      activeTab === REPORT_TYPES.CDR ? "Dropped" : "Busy";

    return (
      <div className="summary-cards-container">
        <Card className="summary-card summary-card-total">
          <CardContent className="summary-card-content">
            <div className="summary-card-icon">
              <Phone />
            </div>
            <div className="summary-card-info">
              <Typography className="summary-card-label">Total Calls</Typography>
              <Typography className="summary-card-value">{summaryStats.total.toLocaleString()}</Typography>
            </div>
          </CardContent>
        </Card>

        <Card className="summary-card summary-card-answered">
          <CardContent className="summary-card-content">
            <div className="summary-card-icon">
              <PhoneCallback />
            </div>
            <div className="summary-card-info">
              <Typography className="summary-card-label">Answered</Typography>
              <Typography className="summary-card-value">{summaryStats.answered.toLocaleString()}</Typography>
              <Typography className="summary-card-percentage">{answeredPercentage}%</Typography>
            </div>
          </CardContent>
        </Card>

        <Card className="summary-card summary-card-no-answer">
          <CardContent className="summary-card-content">
            <div className="summary-card-icon">
              <PhoneMissed />
            </div>
            <div className="summary-card-info">
              <Typography className="summary-card-label">{noAnswerLabel}</Typography>
              <Typography className="summary-card-value">{summaryStats.noAnswer.toLocaleString()}</Typography>
              <Typography className="summary-card-percentage">{noAnswerPercentage}%</Typography>
            </div>
          </CardContent>
        </Card>

        <Card className="summary-card summary-card-busy">
          <CardContent className="summary-card-content">
            <div className="summary-card-icon">
              <PhoneDisabled />
            </div>
            <div className="summary-card-info">
              <Typography className="summary-card-label">{busyLabel}</Typography>
              <Typography className="summary-card-value">{summaryStats.busy.toLocaleString()}</Typography>
              <Typography className="summary-card-percentage">{busyPercentage}%</Typography>
            </div>
          </CardContent>
        </Card>

        <Card className="summary-card summary-card-duration">
          <CardContent className="summary-card-content">
            <div className="summary-card-icon">
              <AccessTime />
            </div>
            <div className="summary-card-info">
              <Typography className="summary-card-label">Avg Duration</Typography>
              <Typography className="summary-card-value">{formatDuration(summaryStats.avgDuration)}</Typography>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="wcf-loading-container">
          <WcfLoader size="lg" message="Loading reports..." label="Loading reports" />
        </div>
      );
    }

    if (currentReports.length === 0) {
      return (
        <div className="no-data-container">
          <Typography variant="h6" color="textSecondary">
            No records found.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {!OPTIONAL_DATE_TABS.has(activeTab) && (!startDate || !endDate)
              ? "Select start and end dates to view this report."
              : "Try adjusting your filters or date range"}
          </Typography>
        </div>
      );
    }

    switch (activeTab) {
      case REPORT_TYPES.VOICE_NOTE:
        return renderVoiceNoteTable();
      case REPORT_TYPES.CDR:
        return renderCDRTable();
      case REPORT_TYPES.TICKET_CRM:
        return renderTicketTable();
      case REPORT_TYPES.AGENT_PERFORMANCE:
        return renderAgentPerformanceTable();
      case REPORT_TYPES.CALL_SUMMARY:
        return renderCallSummaryTable();
      case REPORT_TYPES.IVR_INTERACTIONS:
        return renderIvrInteractionsTable();
      case REPORT_TYPES.DTMF_USAGE:
        return renderDtmfUsageTable();
      case REPORT_TYPES.TICKET_ASSIGNMENTS:
        return renderTicketAssignmentsTable();
      case REPORT_TYPES.MISSED_CALL:
        return renderMissedCallTable();
      case REPORT_TYPES.DROPPED_CALL:
      case REPORT_TYPES.LOST_CALL:
        return renderDroppedCallTable();
      case REPORT_TYPES.ESCALLATION:
        return renderEscallationTable();
      case REPORT_TYPES.NOTIFICATIONS:
        return renderNotificationsTable();
      case REPORT_TYPES.CHATS:
        return renderChatsTable();
      case REPORT_TYPES.OFF_HOURS:
        return renderOffHoursTable();
      default:
        return null;
    }
  };

  const renderOffHoursTable = () => {
    if (offHoursSource === "missed-calls") {
      return (
        <>
          {phoneStatus !== "Idle" && (
            <div className="off-hours-phone-status">
              <span>Phone: {phoneStatus}</span>
              <Button size="small" variant="outlined" onClick={() => endCall()}>
                Hang up
              </Button>
            </div>
          )}
          {!useSharedAgentSip && (
            <audio ref={remoteAudioRef} autoPlay style={{ display: "none" }} />
          )}
          <table className="off-hours-table report-table">
            <thead>
              <tr>
                <th>Sn</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Emergency Number</th>
                <th>Date/Time</th>
                <th>Category</th>
                <th>Callback Status</th>
                <th>Called Back By</th>
                <th>Callback Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentReports.map((record, index) => {
                const phone = getCallbackPhone(record);
                const pending = isPendingCallback(record);
                const isCalling = offHoursCallingBackId === record.id;

                return (
                  <tr
                    key={record.id || index}
                    style={{
                      backgroundColor: pending ? "#fff3cd" : "#d4edda",
                    }}
                  >
                    <td>{page * rowsPerPage + index + 1}</td>
                    <td>{missedCallSource(record)}</td>
                    <td>{missedCallDestination(record)}</td>
                    <td title={record.emergency_number_label || ""}>
                      {missedCallEmergency(record)}
                    </td>
                    <td>
                      {getOffHoursTimestamp(record)
                        ? new Date(
                            getOffHoursTimestamp(record)
                          ).toLocaleString()
                        : "-"}
                    </td>
                    <td>
                      <Chip
                        label={record.off_hours_label}
                        size="small"
                        sx={{
                          backgroundColor:
                            OFF_HOURS_CATEGORY_COLORS[
                              record.off_hours_category
                            ] || "#666",
                          color: "#fff",
                          fontWeight: "bold",
                        }}
                      />
                    </td>
                    <td>
                      <OffHoursCallbackStatusChip record={record} />
                    </td>
                    <td>
                      {record.callback_agent_name ||
                        record.callback_agent_extension ||
                        "—"}
                    </td>
                    <td>
                      {record.callback_time
                        ? new Date(record.callback_time).toLocaleString()
                        : "—"}
                    </td>
                    <td className="off-hours-actions-cell">
                      {pending && phone ? (
                        <Tooltip
                          title={
                            sipReady
                              ? "Call back via your agent phone (same as Agent Dashboard)"
                              : "Log in on Agent Dashboard with SIP extension first"
                          }
                        >
                          <span>
                            <Button
                              variant="contained"
                              size="small"
                              color={isCalling ? "success" : "primary"}
                              disabled={!sipReady || isCalling}
                              startIcon={<FiPhoneCall />}
                              onClick={() => handleOffHoursCallBack(record)}
                            >
                              {isCalling ? "Calling..." : "Call Back"}
                            </Button>
                          </span>
                        </Tooltip>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      );
    }

    if (offHoursSource === "cdr") {
      return (
        <table className="off-hours-table report-table">
          <thead>
            <tr>
              <th>Sn</th>
              <th>Source</th>
              <th>Routed To</th>
              <th>Date/Time</th>
              <th>Category</th>
              <th>Disposition</th>
              <th>Duration (min)</th>
            </tr>
          </thead>
          <tbody>
            {currentReports.map((record, index) => (
              <tr key={record.id || index}>
                <td>{page * rowsPerPage + index + 1}</td>
                <td>{record.caller_display || record.clid || "-"}</td>
                <td>
                  {record.routed_to_label || record.routed_to || "—"}
                  {record.is_emergency_route && (
                    <span className="off-hours-emergency-tag"> Emergency</span>
                  )}
                </td>
                <td>
                  {getOffHoursTimestamp(record)
                    ? new Date(getOffHoursTimestamp(record)).toLocaleString()
                    : "-"}
                </td>
                <td>
                  <Chip
                    label={record.off_hours_label}
                    size="small"
                    sx={{
                      backgroundColor:
                        OFF_HOURS_CATEGORY_COLORS[record.off_hours_category] ||
                        "#666",
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  />
                </td>
                <td>{record.disposition || "-"}</td>
                <td>{formatSecondsToMinutes(record.duration, false)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <>
        {!useSharedAgentSip && (
          <audio ref={remoteAudioRef} autoPlay style={{ display: "none" }} />
        )}
        <table className="off-hours-table report-table">
          <thead>
            <tr>
              <th>Sn</th>
              <th>ID</th>
              <th>Caller ID</th>
              <th>Routed To</th>
              <th>Created At</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
              <th>Duration (s)</th>
              <th>Transcription</th>
            </tr>
          </thead>
          <tbody>
            {currentReports.map((record, index) => {
              const isPlayed = isOffHoursNotePlayed(
                record,
                offHoursPlayedStatus
              );
              const isPlaying = offHoursPlayingId === record.id;

              return (
                <tr
                  key={record.id || index}
                  style={{
                    backgroundColor: getOffHoursRowColor(
                      record,
                      offHoursPlayedStatus
                    ),
                  }}
                >
                  <td>{page * rowsPerPage + index + 1}</td>
                  <td>{record.id}</td>
                  <td>{record.caller_display || record.clid || "-"}</td>
                  <td>
                    {record.routed_to_label || record.routed_to || "—"}
                    {record.is_emergency_route && (
                      <span className="off-hours-emergency-tag"> Emergency</span>
                    )}
                  </td>
                  <td>
                    {getOffHoursTimestamp(record)
                      ? new Date(getOffHoursTimestamp(record)).toLocaleString()
                      : "-"}
                  </td>
                  <td>
                    <Chip
                      label={record.off_hours_label}
                      size="small"
                      sx={{
                        backgroundColor:
                          OFF_HOURS_CATEGORY_COLORS[
                            record.off_hours_category
                          ] || "#666",
                        color: "#fff",
                        fontWeight: "bold",
                      }}
                    />
                  </td>
                  <td>{isPlayed ? "Played" : "Not Played"}</td>
                  <td>
                    {record.id ? (
                      <>
                        <button
                          type="button"
                          className="off-hours-btn off-hours-btn-play"
                          onClick={() => handleOffHoursPlayVoice(record)}
                        >
                          Play
                        </button>
                        {isPlaying && (
                          <button
                            type="button"
                            className="off-hours-btn off-hours-btn-pause"
                            onClick={handleOffHoursPauseVoice}
                          >
                            Pause
                          </button>
                        )}
                      </>
                    ) : (
                      "No file"
                    )}
                  </td>
                  <td>{record.duration_seconds || "-"}</td>
                  <td className="off-hours-transcription">
                    {record.transcription || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </>
    );
  };

  const renderMissedCallTable = () => (
    <table className="report-table">
      <thead>
        <tr>
          <th>Sn</th>
          <th>Caller</th>
          <th>Time</th>
          <th>Assigned Agent</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {currentReports.map((report, index) => (
          <tr key={report.id || index}>
            <td>{page * rowsPerPage + index + 1}</td>
            <td>{report.caller || "-"}</td>
            <td>
              {report.time
                ? new Date(report.time).toLocaleString()
                : "-"}
            </td>
            <td>
              {report.agentId
                ? `Ext ${report.agentId}${report.agent_name ? ` (${report.agent_name})` : ""}`
                : "-"}
            </td>
            <td>
              <Chip
                label={report.status || "-"}
                size="small"
                color={
                  report.status === "called_back"
                    ? "success"
                    : report.status === "pending"
                    ? "warning"
                    : "default"
                }
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderDroppedCallTable = () => {
    const columns = getColumnDefinitions();
    const selected = selectedColumns[activeTab] || [];
    const selectedColumnsDef = columns.filter((col) =>
      selected.includes(col.key)
    );

    return (
      <table className="report-table">
        <thead>
          <tr>
            {selectedColumnsDef.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentReports.map((report, index) => (
            <tr key={report.id || report.session_id || index}>
              {selectedColumnsDef.map((col) => (
                <td key={col.key}>
                  {col.key === "status" ? (
                    <Chip
                      label={getColumnValue(col.key, report, index)}
                      size="small"
                      color={
                        activeTab === REPORT_TYPES.LOST_CALL ? "error" : "warning"
                      }
                    />
                  ) : col.key === "disposition" ? (
                    <Chip
                      label={report.disposition || "-"}
                      size="small"
                      color={
                        report.disposition === "NO ANSWER"
                          ? "warning"
                          : report.disposition === "BUSY"
                          ? "error"
                          : "default"
                      }
                    />
                  ) : (
                    getColumnValue(col.key, report, index)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderEscallationTable = () => {
    const columns = getColumnDefinitions();
    const selected = selectedColumns[activeTab] || [];
    const selectedColumnsDef = columns.filter((col) =>
      selected.includes(col.key)
    );

    return (
      <table className="report-table">
        <thead>
          <tr>
            {selectedColumnsDef.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentReports.map((report, index) => (
            <tr key={report.id || index}>
              {selectedColumnsDef.map((col) => {
                const value = getColumnValue(col.key, report, index);
                if (col.key === "status") {
                  return (
                    <td key={col.key}>
                      <Chip
                        label={value}
                        size="small"
                        color={
                          value === "Escalated"
                            ? "error"
                            : value === "Closed"
                            ? "success"
                            : "warning"
                        }
                      />
                    </td>
                  );
                }
                if (col.key === "category") {
                  return (
                    <td key={col.key}>
                      <Chip
                        label={value}
                        size="small"
                        color={
                          value === "Complaint"
                            ? "error"
                            : value === "Inquiry"
                            ? "info"
                            : "default"
                        }
                      />
                    </td>
                  );
                }
                if (col.key === "subject") {
                  return (
                    <td key={col.key} className="subject-cell">
                      {value}
                    </td>
                  );
                }
                if (col.key === "description") {
                  return (
                    <td
                      key={col.key}
                      style={{ maxWidth: "300px", wordWrap: "break-word" }}
                    >
                      {value}
                    </td>
                  );
                }
                return <td key={col.key}>{value}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderNotificationsTable = () => {
    const columns = getColumnDefinitions();
    const selected = selectedColumns[activeTab] || [];
    const selectedColumnsDef = columns.filter((col) =>
      selected.includes(col.key)
    );

    return (
      <table className="report-table">
        <thead>
          <tr>
            {selectedColumnsDef.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentReports.map((report, index) => (
            <tr key={report.id || index}>
              {selectedColumnsDef.map((col) => {
                const value = getColumnValue(col.key, report, index);
                if (col.key === "status") {
                  return (
                    <td key={col.key}>
                      <Chip
                        label={value}
                        size="small"
                        color={
                          value === "read"
                            ? "default"
                            : value === "unread"
                            ? "warning"
                            : "info"
                        }
                      />
                    </td>
                  );
                }
                if (col.key === "channel") {
                  return (
                    <td key={col.key}>
                      <Chip
                        label={value}
                        size="small"
                        color={
                          value === "email"
                            ? "primary"
                            : value === "sms"
                            ? "secondary"
                            : "default"
                        }
                      />
                    </td>
                  );
                }
                if (col.key === "ticketStatus") {
                  return (
                    <td key={col.key}>
                      <Chip
                        label={value}
                        size="small"
                        color={
                          value === "Closed"
                            ? "success"
                            : value === "Open"
                            ? "error"
                            : "warning"
                        }
                      />
                    </td>
                  );
                }
                if (col.key === "ticketCategory") {
                  return (
                    <td key={col.key}>
                      <Chip
                        label={value}
                        size="small"
                        color={
                          value === "Complaint"
                            ? "error"
                            : value === "Inquiry"
                            ? "info"
                            : "default"
                        }
                      />
                    </td>
                  );
                }
                if (col.key === "ticketSubject") {
                  return (
                    <td key={col.key} className="subject-cell">
                      {value}
                    </td>
                  );
                }
                if (col.key === "message" || col.key === "comment") {
                  return (
                    <td
                      key={col.key}
                      style={{ maxWidth: "300px", wordWrap: "break-word" }}
                    >
                      {value}
                    </td>
                  );
                }
                return <td key={col.key}>{value}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderChatsTable = () => {
    const columns = getColumnDefinitions();
    const selected = selectedColumns[activeTab] || [];
    const selectedColumnsDef = columns.filter((col) =>
      selected.includes(col.key)
    );

    return (
      <table className="report-table">
        <thead>
          <tr>
            {selectedColumnsDef.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentReports.map((report, index) => (
            <tr key={report.id || index}>
              {selectedColumnsDef.map((col) => {
                const value = getColumnValue(col.key, report, index);
                if (col.key === "status") {
                  return (
                    <td key={col.key}>
                      <Chip
                        label={value}
                        size="small"
                        color={
                          value === "delivered"
                            ? "success"
                            : value === "sent"
                            ? "info"
                            : "default"
                        }
                      />
                    </td>
                  );
                }
                if (col.key === "isRead") {
                  return (
                    <td key={col.key}>
                      <Chip
                        label={value}
                        size="small"
                        color={value === "Yes" ? "success" : "warning"}
                      />
                    </td>
                  );
                }
                if (col.key === "message") {
                  return (
                    <td
                      key={col.key}
                      style={{ maxWidth: "300px", wordWrap: "break-word" }}
                    >
                      {value}
                    </td>
                  );
                }
                return <td key={col.key}>{value}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderVoiceNoteTable = () => {
    const columns = getColumnDefinitions();
    const selected = selectedColumns[activeTab] || [];
    const selectedColumnsDef = columns.filter((col) =>
      selected.includes(col.key)
    );

    return (
      <table className="report-table">
        <thead>
          <tr>
            {selectedColumnsDef.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentReports.map((report, index) => (
            <tr key={report.id || index}>
              {selectedColumnsDef.map((col) => {
                if (col.key === "serial") {
                  return (
                    <td key={col.key}>{page * rowsPerPage + index + 1}</td>
                  );
                }
                const value = getColumnValue(col.key, report, index);
                if (col.key === "played") {
                  return (
                    <td key={col.key}>
                      <Chip
                        label={value}
                        size="small"
                        color={value === "Yes" ? "success" : "warning"}
                      />
                    </td>
                  );
                }
                return <td key={col.key}>{value}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderCDRTable = () => (
    <table className="report-table">
      <thead>
        <tr>
          <th>Sn</th>
          <th>Caller ID</th>
          <th>Source</th>
          <th>Destination</th>
          <th>Direction</th>
          <th>Agent</th>
          <th>Start Time</th>
          <th>Agent Response Wait from IVR (min)</th>
          <th>Talk Time (min)</th>
          <th>Total Call Duration (min)</th>
          <th>Disposition</th>
        </tr>
      </thead>
      <tbody>
        {currentReports.map((report, index) => (
          <tr key={report.id || index}>
            <td>{page * rowsPerPage + index + 1}</td>
            <td>{report.clid || "-"}</td>
            <td>{report.src || "-"}</td>
            <td>{report.dst || "-"}</td>
            <td>
              {report.direction
                ? String(report.direction).toUpperCase()
                : "-"}
            </td>
            <td>{report.agent_name || "-"}</td>
            <td>
              {report.cdrstarttime
                ? new Date(report.cdrstarttime).toLocaleString()
                : "-"}
            </td>
            <td>
              {report.agent_wait_sec != null
                ? formatSecondsToMinutes(report.agent_wait_sec, false)
                : "-"}
            </td>
            <td>
              {formatSecondsToMinutes(computeCdrTalkTimeSec(report), false)}
            </td>
            <td>{formatSecondsToMinutes(report.duration, false)}</td>
            <td>
              <Chip
                label={formatCallStatus(report.disposition)}
                size="small"
                color={
                  String(report.disposition || "").toLowerCase() === "answered"
                    ? "success"
                    : String(report.disposition || "").toLowerCase() === "lost"
                    ? "warning"
                    : String(report.disposition || "").toLowerCase() === "dropped"
                    ? "error"
                    : "default"
                }
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderTicketTable = () => {
    const columns = getColumnDefinitions();
    const selected = selectedColumns[activeTab] || [];
    const selectedColumnsDef = columns.filter((col) =>
      selected.includes(col.key)
    );
    const colSpan = selectedColumnsDef.length + 1;

    return (
      <table className="report-table report-table--ticket-crm">
        <thead>
          <tr>
            <th className="report-table-expand-col" aria-label="Expand workflow" />
            {selectedColumnsDef.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentReports.map((report, index) => {
            const ticketId = report.id;
            const isExpanded = expandedTicketId === ticketId;

            return (
              <React.Fragment key={ticketId || index}>
                <tr
                  className={
                    isExpanded ? "report-table-row-expanded" : undefined
                  }
                >
                  <td className="report-table-expand-col">
                    {ticketId ? (
                      <IconButton
                        size="small"
                        aria-label={
                          isExpanded
                            ? "Collapse workflow timeline"
                            : "Expand workflow timeline"
                        }
                        aria-expanded={isExpanded}
                        onClick={() => toggleTicketExpand(report)}
                      >
                        {isExpanded ? (
                          <ExpandLess fontSize="small" />
                        ) : (
                          <ExpandMore fontSize="small" />
                        )}
                      </IconButton>
                    ) : null}
                  </td>
                  {selectedColumnsDef.map((col) => {
                    const value = getColumnValue(col.key, report, index);
                    if (col.key === "status") {
                      return (
                        <td key={col.key}>
                          <Chip
                            label={value}
                            size="small"
                            color={
                              value === "Closed"
                                ? "success"
                                : value === "Open"
                                ? "error"
                                : "warning"
                            }
                          />
                        </td>
                      );
                    }
                    if (col.key === "category") {
                      return (
                        <td key={col.key}>
                          <Chip
                            label={value}
                            size="small"
                            color={
                              value === "Complaint"
                                ? "error"
                                : value === "Inquiry"
                                ? "info"
                                : "default"
                            }
                          />
                        </td>
                      );
                    }
                    if (col.key === "complaintType") {
                      return (
                        <td key={col.key}>
                          <Chip
                            label={value}
                            size="small"
                            color={
                              value === "Major"
                                ? "error"
                                : value === "Minor"
                                ? "warning"
                                : "default"
                            }
                          />
                        </td>
                      );
                    }
                    if (col.key === "isEscalated") {
                      return (
                        <td key={col.key}>
                          <Chip
                            label={value}
                            size="small"
                            color={value === "Yes" ? "error" : "default"}
                          />
                        </td>
                      );
                    }
                    if (col.key === "workflowCompleted") {
                      return (
                        <td key={col.key}>
                          <Chip
                            label={value}
                            size="small"
                            color={value === "Yes" ? "success" : "default"}
                          />
                        </td>
                      );
                    }
                    if (col.key === "workflowPath" && value && value !== "-") {
                      return (
                        <td key={col.key}>
                          <Chip
                            label={value.replace(/_/g, " ")}
                            size="small"
                            variant="outlined"
                          />
                        </td>
                      );
                    }
                    if (
                      col.key === "workflowTrail" ||
                      col.key === "description" ||
                      col.key === "resolutionDetails" ||
                      col.key === "workflowNotes" ||
                      col.key === "reviewNotes" ||
                      col.key === "approvalNotes"
                    ) {
                      return (
                        <td
                          key={col.key}
                          className={
                            col.key === "workflowTrail"
                              ? "report-table-workflow-trail-cell"
                              : "report-table-wrap-cell"
                          }
                        >
                          {value}
                        </td>
                      );
                    }
                    if (col.key === "subject") {
                      return (
                        <td key={col.key} className="subject-cell">
                          {value}
                        </td>
                      );
                    }
                    return <td key={col.key}>{value}</td>;
                  })}
                </tr>
                {isExpanded && ticketId && (
                  <tr className="report-row-expand">
                    <td colSpan={colSpan}>
                      <TicketWorkflowExpandPanel
                        ticket={report}
                        assignments={assignmentCache[ticketId] || []}
                        loading={!!assignmentLoading[ticketId]}
                        error={assignmentErrors[ticketId]}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    );
  };

  const renderAgentPerformanceTable = () => (
    <table className="report-table">
      <thead>
        <tr>
          <th>Sn</th>
          <th>Agent Name</th>
          <th>Total Calls</th>
          <th>Answered Calls</th>
          <th>Missed Calls</th>
          <th>Avg Duration (min)</th>
          <th>Total Talk Time (min)</th>
          <th>FCR Rate</th>
        </tr>
      </thead>
      <tbody>
        {currentReports.map((report, index) => (
          <tr key={report.id || index}>
            <td>{page * rowsPerPage + index + 1}</td>
            <td>{report.agent_name || "-"}</td>
            <td>{report.total_calls || 0}</td>
            <td>{report.answered_calls || 0}</td>
            <td>{report.missed_calls || 0}</td>
            <td>{formatSecondsToMinutes(report.avg_duration, false)}</td>
            <td>{formatSecondsToMinutes(report.total_talk_time, false)}</td>
            <td>{report.fcr_rate || "0%"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderCallSummaryTable = () => (
    <table className="report-table">
      <thead>
        <tr>
          <th>Sn</th>
          <th>Date</th>
          <th>Total Calls</th>
          <th>Answered</th>
          <th>No Answer</th>
          <th>Busy</th>
          <th>Total Duration (min)</th>
          <th>Avg Duration (min)</th>
        </tr>
      </thead>
      <tbody>
        {currentReports.map((report, index) => (
          <tr key={report.id || index}>
            <td>{page * rowsPerPage + index + 1}</td>
            <td>
              {report.date ? new Date(report.date).toLocaleDateString() : "-"}
            </td>
            <td>{report.total_calls || 0}</td>
            <td>{report.answered || 0}</td>
            <td>{report.no_answer || 0}</td>
            <td>{report.busy || 0}</td>
            <td>{formatSecondsToMinutes(report.total_duration, false)}</td>
            <td>{formatSecondsToMinutes(report.avg_duration, false)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderIvrInteractionsTable = () => {
    const columns = getColumnDefinitions();
    const selected = selectedColumns[activeTab] || [];
    const selectedColumnsDef = columns.filter((col) =>
      selected.includes(col.key)
    );

    return (
      <table className="report-table">
        <thead>
          <tr>
            {selectedColumnsDef.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentReports.map((report, index) => (
            <tr key={report.id || index}>
              {selectedColumnsDef.map((col) => (
                <td key={col.key}>
                  {col.key === "language" ? (
                    <Chip
                      label={getColumnValue(col.key, report, index)}
                      size="small"
                      color={
                        report.language === "english" ? "primary" : "secondary"
                      }
                    />
                  ) : (
                    getColumnValue(col.key, report, index)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const dtmfChartData = useMemo(() => {
    if (activeTab !== REPORT_TYPES.DTMF_USAGE) {
      return { digits: [], digitNames: [], digitCounts: [], maxValue: 1, total: 0 };
    }
    const countMap = {};
    filteredReports.forEach((row) => {
      const digit = row.digit_pressed;
      if (!DTMF_DIGIT_LABELS[digit]) return;
      countMap[digit] = (countMap[digit] || 0) + 1;
    });
    const digits = Object.keys(countMap).sort();
    const digitNames = digits.map((d) => DTMF_DIGIT_LABELS[d]);
    const digitCounts = digits.map((d) => countMap[d]);
    const maxValue = Math.max(...digitCounts, 1);
    const total = digitCounts.reduce((sum, n) => sum + n, 0);
    return { digits, digitNames, digitCounts, maxValue, total };
  }, [activeTab, filteredReports]);

  const renderDtmfUsageCharts = () => {
    const { digits, digitNames, digitCounts, maxValue, total } = dtmfChartData;
    if (digits.length === 0) return null;

    const radialOptions = {
      chart: { type: "radialBar", height: 420 },
      plotOptions: {
        radialBar: {
          hollow: { size: "55%" },
          dataLabels: {
            total: {
              show: true,
              label: "Total",
              formatter: () => total,
            },
          },
        },
      },
      labels: digitNames,
      colors: digits.map((_, i) => DTMF_CHART_COLORS[i % DTMF_CHART_COLORS.length]),
    };

    const barOptions = {
      chart: { type: "bar", height: 420 },
      plotOptions: {
        bar: { horizontal: true, distributed: true, borderRadius: 6 },
      },
      xaxis: { categories: digitNames, max: maxValue + 2 },
      colors: digits.map((_, i) => DTMF_CHART_COLORS[i % DTMF_CHART_COLORS.length]),
      legend: { show: true, position: "bottom" },
    };

    return (
      <Card className="dtmf-charts-card">
        <CardContent>
          <Typography variant="h6" className="dtmf-charts-heading" align="center">
            IVR DTMF Usage Report
          </Typography>
          <div className="dtmf-charts-grid">
            <div className="dtmf-chart-panel">
              <Typography variant="subtitle1" align="center" gutterBottom>
                Radial Chart
              </Typography>
              <ReactApexChart
                options={radialOptions}
                series={digitCounts}
                type="radialBar"
                height={420}
              />
            </div>
            <div className="dtmf-chart-panel">
              <Typography variant="subtitle1" align="center" gutterBottom>
                Bar Chart
              </Typography>
              <ReactApexChart
                options={barOptions}
                series={[{ data: digitCounts }]}
                type="bar"
                height={420}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDtmfUsageTable = () => {
    const columns = getColumnDefinitions();
    const selected = selectedColumns[activeTab] || [];
    const selectedColumnsDef = columns.filter((col) =>
      selected.includes(col.key)
    );

    return (
      <table className="report-table">
        <thead>
          <tr>
            {selectedColumnsDef.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentReports.map((report, index) => (
            <tr key={`${report.caller_id}-${report.timestamp}-${index}`}>
              {selectedColumnsDef.map((col) => (
                <td key={col.key}>
                  {col.key === "language" ? (
                    <Chip
                      label={getColumnValue(col.key, report, index)}
                      size="small"
                      color={
                        report.language === "english" ? "primary" : "secondary"
                      }
                    />
                  ) : (
                    getColumnValue(col.key, report, index)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderTicketAssignmentsTable = () => {
    const columns = getColumnDefinitions();
    const selected = selectedColumns[activeTab] || [];
    const selectedColumnsDef = columns.filter((col) =>
      selected.includes(col.key)
    );

    return (
      <table className="report-table">
        <thead>
          <tr>
            {selectedColumnsDef.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentReports.map((report, index) => (
            <tr key={report.id || index}>
              {selectedColumnsDef.map((col) => {
                const value = getColumnValue(col.key, report, index);
                // Special rendering for certain columns
                if (col.key === "ticketStatus") {
                  return (
                    <td key={col.key}>
                      <Chip
                        label={value}
                        size="small"
                        color={
                          value === "Closed"
                            ? "success"
                            : value === "Open"
                            ? "error"
                            : "warning"
                        }
                      />
                    </td>
                  );
                }
                if (col.key === "ticketCategory") {
                  return (
                    <td key={col.key}>
                      <Chip
                        label={value}
                        size="small"
                        color={
                          value === "Complaint"
                            ? "error"
                            : value === "Inquiry"
                            ? "info"
                            : "default"
                        }
                      />
                    </td>
                  );
                }
                if (col.key === "action") {
                  return (
                    <td key={col.key}>
                      <Chip
                        label={value}
                        size="small"
                        color={
                          value === "Assigned"
                            ? "primary"
                            : value === "Reassigned"
                            ? "warning"
                            : "default"
                        }
                      />
                    </td>
                  );
                }
                if (col.key === "reason" || col.key === "actionDetails") {
                  return (
                    <td
                      key={col.key}
                      style={{ maxWidth: "300px", wordWrap: "break-word" }}
                    >
                      {value}
                    </td>
                  );
                }
                if (col.key === "ticketSubject") {
                  return (
                    <td key={col.key} className="subject-cell">
                      {value}
                    </td>
                  );
                }
                return <td key={col.key}>{value}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="comprehensive-reports-container">
      <div className="report-page-toolbar">
        <div className="reports-header">
          <Typography variant="h5" className="reports-title">
            {currentReport.label}
          </Typography>
          <Typography variant="body2" className="reports-subtitle">
            Call center analytics and operational reporting
          </Typography>
        </div>
        <FormControl size="small" className="report-type-select">
          <InputLabel id="report-type-label">Report</InputLabel>
          <Select
            labelId="report-type-label"
            label="Report"
            value={currentReport.slug}
            onChange={handleReportSelect}
            renderValue={(selected) =>
              REPORTS.find((r) => r.slug === selected)?.label || selected
            }
          >
            {REPORTS.map((r) => (
              <MenuItem key={r.slug} value={r.slug}>
                {r.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      {normalizedReportSlug === "pause" ? (
        <PauseReport embedded />
      ) : normalizedReportSlug === "livestream" ? (
        <Livestream />
      ) : normalizedReportSlug === "off-hours" ? (
        <OffHoursReport />
      ) : normalizedReportSlug === "call-center-sla" ? (
        <CallCenterSlaReport embedded />
      ) : normalizedReportSlug === "ticket-sla" ? (
        <TicketSlaReport embedded />
      ) : normalizedReportSlug === "ticket-workflow-tat" ? (
        <TicketWorkflowTatReport embedded />
      ) : normalizedReportSlug === "dtmf-usage" ||
        normalizedReportSlug === "dtmf-stats" ? (
        <>
      {renderDtmfUsageCharts()}
      <Card className="filters-card">
        <CardContent>
          <div className="filters-container">
            <div className="report-filters-row">
              <ReportDateRangePicker
                className="report-filter-dates"
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                disabled={loading}
              />
            </div>
            <div className="action-buttons">
              {filteredReports.length > 0 && (
                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<ViewColumn />}
                  onClick={() => setColumnDialogOpen(true)}
                >
                  Select Columns
                </Button>
              )}
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<PictureAsPdf />}
                onClick={handleExportPDF}
                disabled={filteredReports.length === 0 || exportingWorkflow}
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                color="success"
                startIcon={<TableChart />}
                onClick={handleExportCSV}
                disabled={filteredReports.length === 0 || exportingWorkflow}
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<TableChart />}
                onClick={handleExportExcel}
                disabled={filteredReports.length === 0 || exportingWorkflow}
              >
                Export Excel
              </Button>
            </div>
          </div>
          <div className="search-container">
            <TextField
              fullWidth
              placeholder="Search digit, action, caller, language..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <Search style={{ marginRight: 8, color: "#999" }} />
                ),
              }}
              style={{ marginTop: 16 }}
            />
          </div>
        </CardContent>
      </Card>
      <Card className="table-card">
        <CardContent>
          {exportingWorkflow && (
            <div className="export-workflow-overlay">
              <WcfLoader
                size="md"
                message="Preparing workflow data for export…"
                label="Preparing export"
              />
            </div>
          )}
          <div className="table-header">
            <Typography variant="h6">{getReportTitle()}</Typography>
            <Typography variant="body2" color="textSecondary">
              Showing {currentReports.length} of {filteredReports.length}{" "}
              records
            </Typography>
          </div>
          <div className="table-container">{renderDtmfUsageTable()}</div>
        </CardContent>
      </Card>
      {filteredReports.length > 0 && (
        <ReportTablePagination
          {...paginationProps}
          className="pagination-container"
        />
      )}
        </>
      ) : (
        <>
      {activeTab === REPORT_TYPES.OFF_HOURS && (
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ mb: 2, maxWidth: 900 }}
        >
          Weekend, public holiday, and after-work activity (Mon–Fri before
          08:00 or after 20:00, Sat before 09:00 or after 13:00, all day Sunday
          and holidays). Use Missed Calls source to callback pending callers.
        </Typography>
      )}
      {/* Summary Cards for Call Reports */}
      {renderSummaryCards()}

      {/* Filters and Controls */}
      <Card className="filters-card">
        <CardContent>
          <div className="filters-container">
            <div className="report-filters-row">
            <ReportDateRangePicker
              className="report-filter-dates"
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
              disabled={loading}
            />

              {activeTab === REPORT_TYPES.VOICE_NOTE && (
                <FormControl
                  size="small"
                  className="filter-field"
                >
                  <InputLabel>Played Status</InputLabel>
                  <Select
                    value={playedFilter}
                    label="Played Status"
                    onChange={(e) => setPlayedFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="played">Played</MenuItem>
                    <MenuItem value="not_played">Not Played</MenuItem>
                  </Select>
                </FormControl>
              )}

              {(activeTab === REPORT_TYPES.CDR ||
                activeTab === REPORT_TYPES.DROPPED_CALL ||
                activeTab === REPORT_TYPES.LOST_CALL) && (
                <FormControl
                  size="small"
                  className="filter-field"
                >
                  <InputLabel>Disposition</InputLabel>
                  <Select
                    value={disposition}
                    label="Disposition"
                    onChange={(e) => setDisposition(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="answered">Answered</MenuItem>
                    <MenuItem value="lost">Lost</MenuItem>
                    <MenuItem value="dropped">Dropped</MenuItem>
                  </Select>
                </FormControl>
              )}

              {activeTab === REPORT_TYPES.TICKET_CRM && (
                <>
                  <FormControl
                    size="small"
                    className="filter-field"
                  >
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={ticketStatus}
                      label="Status"
                      onChange={(e) => setTicketStatus(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="Open">Open</MenuItem>
                      <MenuItem value="Assigned">Assigned</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="Closed">Closed</MenuItem>
                      <MenuItem value="Carried Forward">
                        Carried Forward
                      </MenuItem>
                      <MenuItem value="Returned">Returned</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl
                    size="small"
                    className="filter-field"
                  >
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={categoryFilter}
                      label="Category"
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="Inquiry">Inquiry</MenuItem>
                      <MenuItem value="Complaint">Complaint</MenuItem>
                      <MenuItem value="Suggestion">Suggestion</MenuItem>
                      <MenuItem value="Compliment">Compliment</MenuItem>
                      <MenuItem value="Congrats">Congrats</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl
                    size="small"
                    className="filter-field"
                  >
                    <InputLabel>Complaint Type</InputLabel>
                    <Select
                      value={priorityFilter}
                      label="Complaint Type"
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="Minor">Minor</MenuItem>
                      <MenuItem value="Major">Major</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}

              {activeTab === REPORT_TYPES.AGENT_PERFORMANCE && (
                <FormControl
                  size="small"
                  className="filter-field"
                >
                  <InputLabel>Agent</InputLabel>
                  <Select
                    value={agentFilter}
                    label="Agent"
                    onChange={(e) => setAgentFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Agents</MenuItem>
                    {agentOptions.map((agent) => (
                      <MenuItem key={agent.id} value={String(agent.id)}>
                        {agent.full_name || agent.username || `Agent ${agent.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {activeTab === REPORT_TYPES.MISSED_CALL && (
                <FormControl
                  size="small"
                  className="filter-field"
                >
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={missedCallStatusFilter}
                    label="Status"
                    onChange={(e) => setMissedCallStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="called_back">Called Back</MenuItem>
                  </Select>
                </FormControl>
              )}

              {activeTab === REPORT_TYPES.OFF_HOURS && (
                <>
                  <FormControl
                    size="small"
                    style={{ minWidth: 140, marginRight: 8 }}
                  >
                    <InputLabel>Source</InputLabel>
                    <Select
                      value={offHoursSource}
                      label="Source"
                      onChange={(e) => {
                        setOffHoursSource(e.target.value);
                        setReports([]);
                        setOffHoursSummary(null);
                      }}
                    >
                      <MenuItem value="voice-notes">Voice Notes</MenuItem>
                      <MenuItem value="cdr">CDR</MenuItem>
                      <MenuItem value="missed-calls">Missed Calls</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl
                    size="small"
                    style={{ minWidth: 180, marginRight: 8 }}
                  >
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={offHoursCategoryFilter}
                      label="Category"
                      onChange={(e) => {
                        setOffHoursCategoryFilter(e.target.value);
                      }}
                    >
                      {OFF_HOURS_CATEGORY_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}
            </div>

            <div className="action-buttons">
              {filteredReports.length > 0 &&
                activeTab !== REPORT_TYPES.OFF_HOURS && (
                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<ViewColumn />}
                  onClick={() => setColumnDialogOpen(true)}
                >
                  Select Columns
                </Button>
              )}
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<PictureAsPdf />}
                onClick={handleExportPDF}
                disabled={filteredReports.length === 0 || exportingWorkflow}
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                color="success"
                startIcon={<TableChart />}
                onClick={handleExportCSV}
                disabled={filteredReports.length === 0 || exportingWorkflow}
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<TableChart />}
                onClick={handleExportExcel}
                disabled={filteredReports.length === 0 || exportingWorkflow}
              >
                Export Excel
              </Button>
            </div>
          </div>

          <div className="search-container">
            <TextField
              fullWidth
              placeholder={
                activeTab === REPORT_TYPES.VOICE_NOTE
                  ? "Search by phone..."
                  : activeTab === REPORT_TYPES.CDR
                  ? "Search by caller ID, source, or destination..."
                  : activeTab === REPORT_TYPES.TICKET_CRM
                  ? "Search by ticket number, subject, or requester..."
                  : activeTab === REPORT_TYPES.AGENT_PERFORMANCE
                  ? "Search by agent name..."
                  : activeTab === REPORT_TYPES.MISSED_CALL
                  ? "Search by caller or agent ID..."
                  : activeTab === REPORT_TYPES.DROPPED_CALL ||
                    activeTab === REPORT_TYPES.LOST_CALL
                  ? "Search by caller, destination, agent, or status..."
                  : activeTab === REPORT_TYPES.ESCALLATION
                  ? "Search by ticket number, subject, status, or category..."
                  : activeTab === REPORT_TYPES.NOTIFICATIONS
                  ? "Search by ticket number, subject, message, or comment..."
                  : activeTab === REPORT_TYPES.CHATS
                  ? "Search by sender, receiver, or message..."
                  : activeTab === REPORT_TYPES.OFF_HOURS
                  ? "Search by phone or routed destination..."
                  : activeTab === REPORT_TYPES.IVR_INTERACTIONS
                  ? "Search DTMF, action, parameter, voice..."
                  : activeTab === REPORT_TYPES.DTMF_USAGE
                  ? "Search digit, action, caller, language..."
                  : "Search..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <Search style={{ marginRight: 8, color: "#999" }} />
                ),
              }}
              style={{ marginTop: 16 }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card className="table-card">
        <CardContent>
          {exportingWorkflow && (
            <div className="export-workflow-overlay">
              <WcfLoader
                size="md"
                message="Preparing workflow data for export…"
                label="Preparing export"
              />
            </div>
          )}
          <div className="table-header">
            <Typography variant="h6">{getReportTitle()}</Typography>
            <Typography variant="body2" color="textSecondary">
              Showing {currentReports.length} of {filteredReports.length}{" "}
              records
            </Typography>
          </div>
          <div className="table-container">{renderTable()}</div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {filteredReports.length > 0 && (
        <ReportTablePagination {...paginationProps} className="pagination-container" />
      )}
        </>
      )}

      {/* Column Selection Dialog */}
      <Dialog
        open={
          columnDialogOpen &&
          activeTab !== REPORT_TYPES.PAUSE &&
          activeTab !== REPORT_TYPES.LIVESTREAM &&
          activeTab !== REPORT_TYPES.SLA_CALL_CENTER &&
          activeTab !== REPORT_TYPES.SLA_TICKET &&
          activeTab !== REPORT_TYPES.TICKET_WORKFLOW_TAT
        }
        onClose={() => setColumnDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Select Columns to Export</Typography>
            <Box>
              <Button
                size="small"
                onClick={handleSelectAllColumns}
                className="filter-field"
              >
                Select All
              </Button>
              <Button
                size="small"
                onClick={handleDeselectAllColumns}
                className="filter-field"
              >
                Deselect All
              </Button>
              <Button size="small" onClick={handleResetColumns}>
                Reset
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <FormGroup>
            {getColumnDefinitions().map((column) => {
              const isSelected = (selectedColumns[activeTab] || []).includes(
                column.key
              );
              return (
                <FormControlLabel
                  key={column.key}
                  control={
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleColumnToggle(column.key)}
                      color="primary"
                    />
                  }
                  label={column.label}
                />
              );
            })}
          </FormGroup>
          <Divider style={{ marginTop: 16, marginBottom: 16 }} />
          <Typography variant="body2" color="textSecondary">
            Selected: {(selectedColumns[activeTab] || []).length} of{" "}
            {getColumnDefinitions().length} columns
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setColumnDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if ((selectedColumns[activeTab] || []).length === 0) {
                setSnackbarMessage("Please select at least one column");
                setSnackbarSeverity("warning");
                setSnackbarOpen(true);
                return;
              }
              setColumnDialogOpen(false);
              setSnackbarMessage("Column selection saved");
              setSnackbarSeverity("success");
              setSnackbarOpen(true);
            }}
            variant="contained"
            color="primary"
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
