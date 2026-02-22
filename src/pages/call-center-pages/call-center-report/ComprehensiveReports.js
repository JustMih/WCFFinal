import React, { useEffect, useState } from "react";
import { baseURL } from "../../../config";
import {
  Snackbar,
  Alert,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Box,
  Chip,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  PictureAsPdf,
  TableChart,
  Refresh,
  Search,
  ViewColumn,
} from "@mui/icons-material";
import "./comprehensiveReports.css";

const REPORT_TYPES = {
  VOICE_NOTE: 0,
  CDR: 1,
  TICKET_CRM: 2,
  AGENT_PERFORMANCE: 3,
  CALL_SUMMARY: 4,
  IVR_INTERACTIONS: 5,
  TICKET_ASSIGNMENTS: 6,
  MISSED_CALL: 7,
  ESCALLATION: 8,
  NOTIFICATIONS: 9,
  CHATS: 10,
};

export default function ComprehensiveReports() {
  const [activeTab, setActiveTab] = useState(0);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(10);
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
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [missedCallStatusFilter, setMissedCallStatusFilter] = useState("all");

  // Column selection
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState({});

  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    answered: 0,
    noAnswer: 0,
    busy: 0,
    totalDuration: 0,
    avgDuration: 0,
  });

  const fetchReports = async () => {
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
          if (!startDate || !endDate) {
            throw new Error("Please select start and end dates");
          }
          endpoint = `${baseURL}/reports/ivr-interactions/${startDate}/${endDate}`;
          break;
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
        case REPORT_TYPES.ESCALLATION: {
          const userId = localStorage.getItem("userId");
          if (!userId) {
            throw new Error("User not authenticated. Please log in.");
          }
          
          // Fetch escalated/overdue tickets
          const escalationRes = await fetch(`${baseURL}/ticket/overdue/${userId}`, { headers });
          if (!escalationRes.ok) {
            const errorData = await escalationRes.json().catch(() => ({}));
            // If 404 with "No escalated tickets found" or "User not found", return empty array
            if (escalationRes.status === 404) {
              const errorMessage = errorData.message || "";
              if (errorMessage.includes("No escalated tickets") || errorMessage.includes("User not found")) {
                setReports([]);
                setLoading(false);
                return;
              }
              // If it's a different 404 (route not found), show error
              throw new Error(errorData.message || "Escalation endpoint not found. Please ensure the server is running.");
            }
            throw new Error(errorData.message || "Failed to fetch escalated tickets");
          }
          const escalationData = await escalationRes.json();
          
          // Handle different response structures
          let list = [];
          if (escalationData.assignments && Array.isArray(escalationData.assignments)) {
            // Response structure: { assignments: [...] }
            list = escalationData.assignments.map(item => {
              const ticket = item.ticket || {};
              return {
                ...ticket,
                assignment_id: item.id,
                escalated_at: ticket.created_at || ticket.updated_at || item.created_at,
                // Flatten assignment data
                assigned_to_name: ticket.assignee?.full_name || ticket.assigned_to_name,
                assigned_to_id: ticket.assignee?.id || ticket.assigned_to_id,
              };
            });
          } else if (escalationData.tickets && Array.isArray(escalationData.tickets)) {
            // Response structure: { tickets: [...] }
            list = escalationData.tickets;
          } else if (Array.isArray(escalationData)) {
            // Response is directly an array
            list = escalationData;
          } else if (escalationData.escalatedFrom && Array.isArray(escalationData.escalatedFrom)) {
            // Alternative response structure
            list = escalationData.escalatedFrom.map(item => ({
              ...item.ticket,
              escalated_at: item.created_at,
            }));
          }
          
          // Filter by date range if provided
          if (startDate || endDate) {
            list = list.filter((item) => {
              const itemDate = item.created_at || item.escalated_at;
              if (!itemDate) return false;
              const dateStr = new Date(itemDate).toISOString().split("T")[0];
              if (startDate && dateStr < startDate) return false;
              if (endDate && dateStr > endDate) return false;
              return true;
            });
          }
          
          list.sort((a, b) => {
            const dateA = new Date(a.created_at || a.escalated_at || 0).getTime();
            const dateB = new Date(b.created_at || b.escalated_at || 0).getTime();
            return dateB - dateA;
          });
          
          setReports(list);
          setLoading(false);
          return;
        }
        case REPORT_TYPES.NOTIFICATIONS: {
          const userId = localStorage.getItem("userId");
          if (!userId) {
            throw new Error("User not authenticated. Please log in.");
          }
          
          // Try the all endpoint first (returns all notifications - read and unread)
          let notificationsRes;
          let notificationsData;
          let list = [];
          
          try {
            // Build query parameters for date filtering
            const params = new URLSearchParams();
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);
            const queryString = params.toString() ? `?${params.toString()}` : "";
            
            // Try the /all endpoint first
            notificationsRes = await fetch(`${baseURL}/notifications/user/${userId}`, { headers });
            
            if (notificationsRes.ok) {
              notificationsData = await notificationsRes.json();
              // Handle response structure - could be { notifications: [...] } or just [...]
              if (notificationsData.notifications && Array.isArray(notificationsData.notifications)) {
                list = notificationsData.notifications;
              } else if (Array.isArray(notificationsData)) {
                list = notificationsData;
              }
            } else {
              // If /all endpoint doesn't exist (404), fallback to /user endpoint and fetch all
              console.warn("All notifications endpoint not found, fetching from user endpoint...");
              const userRes = await fetch(`${baseURL}/notifications/user/${userId}`, { headers });
              if (!userRes.ok) {
                const errorData = await userRes.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to fetch notifications");
              }
              const userData = await userRes.json();
              if (userData.notifications && Array.isArray(userData.notifications)) {
                list = userData.notifications;
              } else if (Array.isArray(userData)) {
                list = userData;
              }
            }
          } catch (error) {
            console.error("Error fetching notifications:", error);
            throw new Error(error.message || "Failed to fetch notifications");
          }
          
          // Filter by date range if provided (in case backend didn't filter)
          if (startDate || endDate) {
            list = list.filter((notification) => {
              if (!notification.created_at) return false;
              const notificationDate = new Date(notification.created_at).toISOString().split("T")[0];
              if (startDate && notificationDate < startDate) return false;
              if (endDate && notificationDate > endDate) return false;
              return true;
            });
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
        }
        case REPORT_TYPES.CHATS: {
          const userId = localStorage.getItem("userId");
          if (!userId) {
            throw new Error("User not authenticated. Please log in.");
          }
          // Fetch all conversations first
          const conversationsRes = await fetch(`${baseURL}/users/conversations/${userId}`, { headers });
          if (!conversationsRes.ok) {
            throw new Error("Failed to fetch conversations");
          }
          const conversationsData = await conversationsRes.json();
          // Handle response structure - could be { conversations: [...] } or just [...]
          let conversations = [];
          if (conversationsData.conversations && Array.isArray(conversationsData.conversations)) {
            conversations = conversationsData.conversations;
          } else if (Array.isArray(conversationsData)) {
            conversations = conversationsData;
          }
          
          // Fetch messages for each conversation
          const allMessages = [];
          for (const conv of conversations) {
            const otherUserId = conv.userId === userId ? conv.otherUserId : conv.userId;
            if (!otherUserId) continue; // Skip if no other user ID
            
            try {
              const messagesRes = await fetch(`${baseURL}/users/messages/${userId}/${otherUserId}`, { headers });
              if (messagesRes.ok) {
                const messagesData = await messagesRes.json();
                const messages = Array.isArray(messagesData) ? messagesData : [];
                // Add all messages (read and unread) to the list
                allMessages.push(...messages.map(msg => ({
                  ...msg,
                  otherUserId: otherUserId,
                  otherUserName: conv.name || conv.full_name || otherUserId,
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
        throw new Error(errorData.message || `Failed to fetch report`);
      }

      const data = await response.json();
      setReports(Array.isArray(data) ? data : []);

      // Calculate summary stats for call reports
      if (
        activeTab === REPORT_TYPES.CDR ||
        activeTab === REPORT_TYPES.CALL_SUMMARY
      ) {
        calculateCallStats(data);
      }
    } catch (error) {
      setSnackbarMessage(error.message || "Error loading reports.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

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
      stats = {
        total: data.length,
        answered: data.filter((r) => r.disposition === "ANSWERED").length,
        noAnswer: data.filter((r) => r.disposition === "NO ANSWER").length,
        busy: data.filter((r) => r.disposition === "BUSY").length,
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

  // Column definitions for each report type
  const getColumnDefinitions = () => {
    switch (activeTab) {
      case REPORT_TYPES.VOICE_NOTE:
        return [
          { key: "serial", label: "Serial No", default: true },
          { key: "phone", label: "Phone", default: true },
          { key: "date", label: "Date", default: true },
          { key: "played", label: "Played", default: true },
          { key: "agent", label: "Assigned Agent", default: true },
          { key: "duration", label: "Duration (s)", default: true },
          { key: "transcription", label: "Transcription", default: false },
        ];
      case REPORT_TYPES.CDR:
        return [
          { key: "serial", label: "Serial No", default: true },
          { key: "callerId", label: "Caller ID", default: true },
          { key: "source", label: "Source", default: true },
          { key: "destination", label: "Destination", default: true },
          { key: "startTime", label: "Start Time", default: true },
          { key: "duration", label: "Duration (s)", default: true },
          { key: "billed", label: "Billed (s)", default: true },
          { key: "disposition", label: "Disposition", default: true },
          { key: "recording", label: "Recording File", default: false },
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
          { key: "workflowPath", label: "Workflow Path", default: false },
          {
            key: "currentWorkflowStep",
            label: "Current Workflow Step",
            default: false,
          },
          {
            key: "workflowCompleted",
            label: "Workflow Completed",
            default: false,
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
        ];
      case REPORT_TYPES.AGENT_PERFORMANCE:
        return [
          { key: "serial", label: "Serial No", default: true },
          { key: "agent", label: "Agent Name", default: true },
          { key: "totalCalls", label: "Total Calls", default: true },
          { key: "answeredCalls", label: "Answered Calls", default: true },
          { key: "missedCalls", label: "Missed Calls", default: true },
          { key: "avgDuration", label: "Avg Duration (s)", default: true },
          { key: "totalTalkTime", label: "Total Talk Time (s)", default: true },
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
          { key: "totalDuration", label: "Total Duration (s)", default: true },
          { key: "avgDuration", label: "Avg Duration (s)", default: true },
        ];
      case REPORT_TYPES.IVR_INTERACTIONS:
        return [
          { key: "serial", label: "Serial No", default: true },
          { key: "callerId", label: "Caller ID", default: true },
          { key: "digitPressed", label: "Digit Pressed", default: true },
          { key: "menuContext", label: "Menu Context", default: true },
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
      const current = prev[activeTab];
      if (current && current.length > 0) {
        // Keep existing selection if it exists
        return prev;
      }
      // Initialize with defaults if no selection exists
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
        const matchesPlayedFilter =
          playedFilter === "all" ||
          (playedFilter === "played" && report.is_played) ||
          (playedFilter === "not_played" && !report.is_played);
        return (
          (report.clid || "").toLowerCase().includes(searchLower) &&
          matchesPlayedFilter
        );
      case REPORT_TYPES.CDR:
        return (
          (report.clid || "").toLowerCase().includes(searchLower) ||
          (report.dst || "").toLowerCase().includes(searchLower) ||
          (report.src || "").toLowerCase().includes(searchLower)
        );
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
          agentFilter === "all" || report.agent_id === agentFilter;
        return (
          (report.agent_name || "").toLowerCase().includes(searchLower) &&
          matchesAgent
        );
      case REPORT_TYPES.MISSED_CALL:
        return (
          (report.caller || "").toLowerCase().includes(searchLower) ||
          (report.agentId || "").toLowerCase().includes(searchLower) ||
          (report.agent_name || "").toLowerCase().includes(searchLower)
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
          (report.senderId || "").toLowerCase().includes(searchLower) ||
          (report.receiverId || "").toLowerCase().includes(searchLower) ||
          (report.otherUserId || "").toLowerCase().includes(searchLower) ||
          (report.otherUserName || "").toLowerCase().includes(searchLower) ||
          (report.message || "").toLowerCase().includes(searchLower) ||
          (report.status || "").toLowerCase().includes(searchLower)
        );
      default:
        return true;
    }
  });

  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(
    indexOfFirstReport,
    indexOfLastReport
  );

  // Helper function to get column value from report
  const getColumnValue = (columnKey, report, index) => {
    switch (activeTab) {
      case REPORT_TYPES.VOICE_NOTE:
        switch (columnKey) {
          case "serial":
            return index + 1;
          case "phone":
            return report.clid || "-";
          case "date":
            return report.created_at
              ? new Date(report.created_at).toLocaleString()
              : "-";
          case "played":
            return report.is_played ? "Yes" : "No";
          case "agent":
            return report.assigned_agent_id || "-";
          case "duration":
            return report.duration_seconds || "-";
          case "transcription":
            return report.transcription || "-";
          default:
            return "-";
        }
      case REPORT_TYPES.CDR:
        switch (columnKey) {
          case "serial":
            return index + 1;
          case "callerId":
            return report.clid || "-";
          case "source":
            return report.src || "-";
          case "destination":
            return report.dst || "-";
          case "startTime":
            return report.cdrstarttime
              ? new Date(report.cdrstarttime).toLocaleString()
              : "-";
          case "duration":
            return report.duration || "-";
          case "billed":
            return report.billsec || "-";
          case "disposition":
            return report.disposition || "-";
          case "recording":
            return report.recordingfile || "-";
          default:
            return "-";
        }
      case REPORT_TYPES.TICKET_CRM:
        switch (columnKey) {
          case "serial":
            return index + 1;
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
            return report.current_workflow_role || "-";
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
          default:
            return report[columnKey] || "-";
        }
      case REPORT_TYPES.AGENT_PERFORMANCE:
        switch (columnKey) {
          case "serial":
            return index + 1;
          case "agent":
            return report.agent_name || "-";
          case "totalCalls":
            return report.total_calls || 0;
          case "answeredCalls":
            return report.answered_calls || 0;
          case "missedCalls":
            return report.missed_calls || 0;
          case "avgDuration":
            return report.avg_duration || 0;
          case "totalTalkTime":
            return report.total_talk_time || 0;
          case "fcrRate":
            return report.fcr_rate || "0%";
          default:
            return "-";
        }
      case REPORT_TYPES.CALL_SUMMARY:
        switch (columnKey) {
          case "serial":
            return index + 1;
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
            return report.total_duration || 0;
          case "avgDuration":
            return report.avg_duration || 0;
          default:
            return "-";
        }
      case REPORT_TYPES.IVR_INTERACTIONS:
        switch (columnKey) {
          case "serial":
            return index + 1;
          case "callerId":
            return report.caller_id || "-";
          case "digitPressed":
            return report.digit_pressed || "-";
          case "menuContext":
            return report.menu_context || "-";
          case "language":
            return report.language || "-";
          case "timestamp":
            return report.timestamp
              ? new Date(report.timestamp).toLocaleString()
              : "-";
          default:
            return "-";
        }
      case REPORT_TYPES.TICKET_ASSIGNMENTS:
        switch (columnKey) {
          case "serial":
            return index + 1;
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
            return index + 1;
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
      case REPORT_TYPES.ESCALLATION:
        switch (columnKey) {
          case "serial":
            return index + 1;
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
            return index + 1;
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
            return index + 1;
          case "sender":
            return report.senderId || "-";
          case "receiver":
            return report.receiverId || report.otherUserId || "-";
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

  // CSV Export Function
  const handleExportCSV = () => {
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

    const csvData = filteredReports.map((report, idx) => {
      const row = {};
      selectedColumnsDef.forEach((col) => {
        row[col.label] = getColumnValue(col.key, report, idx);
      });
      return row;
    });

    const filename = `${getReportTitle().toLowerCase().replace(/\s+/g, "_")}_${
      startDate || "all"
    }_${endDate || "all"}.csv`;

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, filename);

    setSnackbarMessage("CSV exported successfully!");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  // PDF Export Function
  const handleExportPDF = () => {
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

    // Determine if we need landscape and smaller fonts based on column count
    const columnCount = selectedColumnsDef.length;
    const useLandscape = columnCount > 8;

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
          };
          return shortLabels[col.label] || col.label.substring(0, 12);
        }
        return col.label;
      }),
    ];
    const tableData = filteredReports.map((report, idx) =>
      selectedColumnsDef.map((col) => {
        const value = getColumnValue(col.key, report, idx);
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
      if (columnCount > 8) {
        // Calculate smart widths based on column type and content
        if (col.key === "serial" || col.key === "id") {
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
        fontSize: fontSize,
        cellPadding: cellPadding,
        halign: col.key === "serial" || col.key === "id" ? "center" : "left",
        valign: "top", // Top align for better readability with wrapped text
        overflow: "linebreak",
        lineWidth: 0.1,
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

  const getReportTitle = () => {
    const titles = {
      [REPORT_TYPES.VOICE_NOTE]: "Voice Note Report",
      [REPORT_TYPES.CDR]: "CDR Report",
      [REPORT_TYPES.TICKET_CRM]: "Ticket CRM Report",
      [REPORT_TYPES.AGENT_PERFORMANCE]: "Agent Performance Report",
      [REPORT_TYPES.CALL_SUMMARY]: "Call Summary Report",
      [REPORT_TYPES.IVR_INTERACTIONS]: "IVR Interactions Report",
      [REPORT_TYPES.TICKET_ASSIGNMENTS]: "Ticket Assignments Report",
      [REPORT_TYPES.MISSED_CALL]: "Missed Call Report",
      [REPORT_TYPES.ESCALLATION]: "Escallation Report",
      [REPORT_TYPES.NOTIFICATIONS]: "Notification Report",
      [REPORT_TYPES.CHATS]: "Chats Report",
    };
    return titles[activeTab] || "Report";
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setReports([]);
    setCurrentPage(1);
    setSearch("");
    setSummaryStats({
      total: 0,
      answered: 0,
      noAnswer: 0,
      busy: 0,
      totalDuration: 0,
      avgDuration: 0,
    });
  };

  const renderSummaryCards = () => {
    if (
      activeTab !== REPORT_TYPES.CDR &&
      activeTab !== REPORT_TYPES.CALL_SUMMARY
    ) {
      return null;
    }

    return (
      <div className="summary-cards-container">
        <Card className="summary-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Calls
            </Typography>
            <Typography variant="h4">{summaryStats.total}</Typography>
          </CardContent>
        </Card>
        <Card className="summary-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Answered
            </Typography>
            <Typography variant="h4" style={{ color: "#4caf50" }}>
              {summaryStats.answered}
            </Typography>
          </CardContent>
        </Card>
        <Card className="summary-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              No Answer
            </Typography>
            <Typography variant="h4" style={{ color: "#ff9800" }}>
              {summaryStats.noAnswer}
            </Typography>
          </CardContent>
        </Card>
        <Card className="summary-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Busy
            </Typography>
            <Typography variant="h4" style={{ color: "#f44336" }}>
              {summaryStats.busy}
            </Typography>
          </CardContent>
        </Card>
        <Card className="summary-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Avg Duration (s)
            </Typography>
            <Typography variant="h4">{summaryStats.avgDuration}</Typography>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <CircularProgress />
          <Typography style={{ marginTop: 16 }}>Loading reports...</Typography>
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
            {!startDate || !endDate
              ? "Please select date range and click 'Load Report'"
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
        return renderIVRTable();
      case REPORT_TYPES.TICKET_ASSIGNMENTS:
        return renderTicketAssignmentsTable();
      case REPORT_TYPES.MISSED_CALL:
        return renderMissedCallTable();
      case REPORT_TYPES.ESCALLATION:
        return renderEscallationTable();
      case REPORT_TYPES.NOTIFICATIONS:
        return renderNotificationsTable();
      case REPORT_TYPES.CHATS:
        return renderChatsTable();
      default:
        return null;
    }
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
            <td>{indexOfFirstReport + index + 1}</td>
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

  const renderVoiceNoteTable = () => (
    <table className="report-table">
      <thead>
        <tr>
          <th>Sn</th>
          <th>Phone</th>
          <th>Date</th>
          <th>Played</th>
          <th>Assigned Agent</th>
          <th>Duration (s)</th>
          <th>Transcription</th>
        </tr>
      </thead>
      <tbody>
        {currentReports.map((report, index) => (
          <tr key={report.id || index}>
            <td>{indexOfFirstReport + index + 1}</td>
            <td>{report.clid}</td>
            <td>
              {report.created_at
                ? new Date(report.created_at).toLocaleString()
                : "-"}
            </td>
            <td>
              <Chip
                label={report.is_played ? "Yes" : "No"}
                size="small"
                color={report.is_played ? "success" : "warning"}
              />
            </td>
            <td>
          {report.assigned_extension
            ? `Ext ${report.assigned_extension}${
                report.assigned_agent_name
                  ? ` (${report.assigned_agent_name})`
                  : ""
              }`
            : "-"}
        </td>

            <td>{report.duration_seconds || "-"}</td>
            <td className="transcription-cell">
              {report.transcription || "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderCDRTable = () => (
    <table className="report-table">
      <thead>
        <tr>
          <th>Sn</th>
          <th>Caller ID</th>
          <th>Source</th>
          <th>Destination</th>
          <th>Start Time</th>
          <th>Duration (s)</th>
          <th>Billed (s)</th>
          <th>Disposition</th>
          <th>Recording</th>
        </tr>
      </thead>
      <tbody>
        {currentReports.map((report, index) => (
          <tr key={report.id || index}>
            <td>{indexOfFirstReport + index + 1}</td>
            <td>{report.clid || "-"}</td>
            <td>{report.src || "-"}</td>
            <td>{report.dst || "-"}</td>
            <td>
              {report.cdrstarttime
                ? new Date(report.cdrstarttime).toLocaleString()
                : "-"}
            </td>
            <td>{report.duration || "-"}</td>
            <td>{report.billsec || "-"}</td>
            <td>
              <Chip
                label={report.disposition || "-"}
                size="small"
                color={
                  report.disposition === "ANSWERED"
                    ? "success"
                    : report.disposition === "NO ANSWER"
                    ? "warning"
                    : report.disposition === "BUSY"
                    ? "error"
                    : "default"
                }
              />
            </td>
            <td>{report.recordingfile || "-"}</td>
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
                if (col.key === "subject") {
                  return (
                    <td key={col.key} className="subject-cell">
                      {value}
                    </td>
                  );
                }
                if (
                  col.key === "description" ||
                  col.key === "resolutionDetails" ||
                  col.key === "workflowNotes" ||
                  col.key === "reviewNotes" ||
                  col.key === "approvalNotes"
                ) {
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

  const renderAgentPerformanceTable = () => (
    <table className="report-table">
      <thead>
        <tr>
          <th>Sn</th>
          <th>Agent Name</th>
          <th>Total Calls</th>
          <th>Answered Calls</th>
          <th>Missed Calls</th>
          <th>Avg Duration (s)</th>
          <th>Total Talk Time (s)</th>
          <th>FCR Rate</th>
        </tr>
      </thead>
      <tbody>
        {currentReports.map((report, index) => (
          <tr key={report.id || index}>
            <td>{indexOfFirstReport + index + 1}</td>
            <td>{report.agent_name || "-"}</td>
            <td>{report.total_calls || 0}</td>
            <td>{report.answered_calls || 0}</td>
            <td>{report.missed_calls || 0}</td>
            <td>{report.avg_duration || 0}</td>
            <td>{report.total_talk_time || 0}</td>
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
          <th>Total Duration (s)</th>
          <th>Avg Duration (s)</th>
        </tr>
      </thead>
      <tbody>
        {currentReports.map((report, index) => (
          <tr key={report.id || index}>
            <td>{indexOfFirstReport + index + 1}</td>
            <td>
              {report.date ? new Date(report.date).toLocaleDateString() : "-"}
            </td>
            <td>{report.total_calls || 0}</td>
            <td>{report.answered || 0}</td>
            <td>{report.no_answer || 0}</td>
            <td>{report.busy || 0}</td>
            <td>{report.total_duration || 0}</td>
            <td>{report.avg_duration || 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderIVRTable = () => (
    <table className="report-table">
      <thead>
        <tr>
          <th>Sn</th>
          <th>Caller ID</th>
          <th>Digit Pressed</th>
          <th>Menu Context</th>
          <th>Language</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {currentReports.map((report, index) => (
          <tr key={report.id || index}>
            <td>{indexOfFirstReport + index + 1}</td>
            <td>{report.caller_id || "-"}</td>
            <td>{report.digit_pressed || "-"}</td>
            <td>{report.menu_context || "-"}</td>
            <td>
              <Chip
                label={report.language || "-"}
                size="small"
                color={report.language === "english" ? "primary" : "secondary"}
              />
            </td>
            <td>
              {report.timestamp
                ? new Date(report.timestamp).toLocaleString()
                : "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

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
      <div className="reports-header">
        <Typography variant="h4" className="reports-title">
          Call Center Reports
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Comprehensive reporting and analytics for your call center
        </Typography>
      </div>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Voice Note Report" />
          <Tab label="CDR Report" />
          <Tab label="Ticket CRM Report" />
          <Tab label="Agent Performance" />
          <Tab label="Call Summary" />
          <Tab label="IVR Interactions" />
          <Tab label="Ticket Assignments" />
          <Tab label="Missed Call Report" />
          <Tab label="Escallation" />
          <Tab label="Notifications" />
          <Tab label="Chats" />
        </Tabs>
      </Box>

      {/* Summary Cards for Call Reports */}
      {renderSummaryCards()}

      {/* Filters and Controls */}
      <Card className="filters-card">
        <CardContent>
          <div className="filters-container">
            <div className="date-filters">
              <TextField
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
                style={{ marginRight: 8 }}
              />
              <TextField
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="small"
                style={{ marginRight: 8 }}
              />
            </div>

            <div className="additional-filters">
              {activeTab === REPORT_TYPES.VOICE_NOTE && (
                <FormControl
                  size="small"
                  style={{ minWidth: 150, marginRight: 8 }}
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

              {activeTab === REPORT_TYPES.CDR && (
                <FormControl
                  size="small"
                  style={{ minWidth: 150, marginRight: 8 }}
                >
                  <InputLabel>Disposition</InputLabel>
                  <Select
                    value={disposition}
                    label="Disposition"
                    onChange={(e) => setDisposition(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="ANSWERED">Answered</MenuItem>
                    <MenuItem value="NO ANSWER">No Answer</MenuItem>
                    <MenuItem value="BUSY">Busy</MenuItem>
                    <MenuItem value="FAILED">Failed</MenuItem>
                  </Select>
                </FormControl>
              )}

              {activeTab === REPORT_TYPES.TICKET_CRM && (
                <>
                  <FormControl
                    size="small"
                    style={{ minWidth: 150, marginRight: 8 }}
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
                    style={{ minWidth: 150, marginRight: 8 }}
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
                    style={{ minWidth: 150, marginRight: 8 }}
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
                  style={{ minWidth: 150, marginRight: 8 }}
                >
                  <InputLabel>Agent</InputLabel>
                  <Select
                    value={agentFilter}
                    label="Agent"
                    onChange={(e) => setAgentFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Agents</MenuItem>
                    {/* Add agent options dynamically */}
                  </Select>
                </FormControl>
              )}

              {activeTab === REPORT_TYPES.MISSED_CALL && (
                <FormControl
                  size="small"
                  style={{ minWidth: 150, marginRight: 8 }}
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
            </div>

            <div className="action-buttons">
              <Button
                variant="contained"
                color="primary"
                startIcon={<Refresh />}
                onClick={fetchReports}
                disabled={
                  loading ||
                  (activeTab !== REPORT_TYPES.IVR_INTERACTIONS &&
                    activeTab !== REPORT_TYPES.MISSED_CALL &&
                    activeTab !== REPORT_TYPES.ESCALLATION &&
                    activeTab !== REPORT_TYPES.NOTIFICATIONS &&
                    activeTab !== REPORT_TYPES.CHATS &&
                    (!startDate || !endDate))
                }
              >
                Load Report
              </Button>
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
                disabled={filteredReports.length === 0}
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                color="success"
                startIcon={<TableChart />}
                onClick={handleExportCSV}
                disabled={filteredReports.length === 0}
              >
                Export CSV
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
                  : activeTab === REPORT_TYPES.ESCALLATION
                  ? "Search by ticket number, subject, status, or category..."
                  : activeTab === REPORT_TYPES.NOTIFICATIONS
                  ? "Search by ticket number, subject, message, or comment..."
                  : activeTab === REPORT_TYPES.CHATS
                  ? "Search by sender, receiver, or message..."
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
        <div className="pagination-container">
          <Button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            variant="outlined"
            size="small"
          >
            ← Previous
          </Button>
          <Typography variant="body2" className="pagination-info">
            Page {currentPage} of{" "}
            {Math.ceil(filteredReports.length / reportsPerPage)}
          </Typography>
          <Button
            onClick={() =>
              setCurrentPage(
                Math.min(
                  Math.ceil(filteredReports.length / reportsPerPage),
                  currentPage + 1
                )
              )
            }
            disabled={
              currentPage === Math.ceil(filteredReports.length / reportsPerPage)
            }
            variant="outlined"
            size="small"
          >
            Next →
          </Button>
        </div>
      )}

      {/* Column Selection Dialog */}
      <Dialog
        open={columnDialogOpen}
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
                style={{ marginRight: 8 }}
              >
                Select All
              </Button>
              <Button
                size="small"
                onClick={handleDeselectAllColumns}
                style={{ marginRight: 8 }}
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
