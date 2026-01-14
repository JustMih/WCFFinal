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
  IconButton,
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
  FileDownload,
  PictureAsPdf,
  TableChart,
  Refresh,
  Search,
  FilterList,
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
};

export default function ComprehensiveReports() {
  const [activeTab, setActiveTab] = useState(0);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
    setError(null);
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
          endpoint = `${baseURL}/reports/ivr-interactions`;
          break;
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
      setError(error.message);
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

    const stats = {
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
          { key: "subject", label: "Subject", default: true },
          { key: "status", label: "Status", default: true },
          { key: "category", label: "Category", default: true },
          { key: "complaintType", label: "Complaint Type", default: true },
          { key: "requester", label: "Requester", default: true },
          { key: "assignedTo", label: "Assigned To", default: true },
          { key: "createdDate", label: "Created Date", default: true },
          { key: "resolvedDate", label: "Resolved Date", default: false },
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
          { key: "dtmfInput", label: "DTMF Input", default: true },
          { key: "action", label: "Action", default: true },
          { key: "voiceFile", label: "Voice File", default: true },
          { key: "date", label: "Date", default: true },
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
          case "serial": return index + 1;
          case "phone": return report.clid || "-";
          case "date": return report.created_at ? new Date(report.created_at).toLocaleString() : "-";
          case "played": return report.is_played ? "Yes" : "No";
          case "agent": return report.assigned_agent_id || "-";
          case "duration": return report.duration_seconds || "-";
          case "transcription": return report.transcription || "-";
          default: return "-";
        }
      case REPORT_TYPES.CDR:
        switch (columnKey) {
          case "serial": return index + 1;
          case "callerId": return report.clid || "-";
          case "source": return report.src || "-";
          case "destination": return report.dst || "-";
          case "startTime": return report.cdrstarttime ? new Date(report.cdrstarttime).toLocaleString() : "-";
          case "duration": return report.duration || "-";
          case "billed": return report.billsec || "-";
          case "disposition": return report.disposition || "-";
          case "recording": return report.recordingfile || "-";
          default: return "-";
        }
      case REPORT_TYPES.TICKET_CRM:
        switch (columnKey) {
          case "serial": return index + 1;
          case "ticketNumber": return report.ticket_number || "-";
          case "subject": return report.subject || "-";
          case "status": return report.status || "-";
          case "category": return report.category || "-";
          case "complaintType": return report.complaint_type || "-";
          case "requester": return report.requester_name || "-";
          case "assignedTo": return report.assigned_to_name || "-";
          case "createdDate": return report.created_at ? new Date(report.created_at).toLocaleString() : "-";
          case "resolvedDate": return report.resolved_at ? new Date(report.resolved_at).toLocaleString() : "-";
          default: return "-";
        }
      case REPORT_TYPES.AGENT_PERFORMANCE:
        switch (columnKey) {
          case "serial": return index + 1;
          case "agent": return report.agent_name || "-";
          case "totalCalls": return report.total_calls || 0;
          case "answeredCalls": return report.answered_calls || 0;
          case "missedCalls": return report.missed_calls || 0;
          case "avgDuration": return report.avg_duration || 0;
          case "totalTalkTime": return report.total_talk_time || 0;
          case "fcrRate": return report.fcr_rate || "0%";
          default: return "-";
        }
      case REPORT_TYPES.CALL_SUMMARY:
        switch (columnKey) {
          case "serial": return index + 1;
          case "date": return report.date ? new Date(report.date).toLocaleDateString() : "-";
          case "totalCalls": return report.total_calls || 0;
          case "answered": return report.answered || 0;
          case "noAnswer": return report.no_answer || 0;
          case "busy": return report.busy || 0;
          case "totalDuration": return report.total_duration || 0;
          case "avgDuration": return report.avg_duration || 0;
          default: return "-";
        }
      case REPORT_TYPES.IVR_INTERACTIONS:
        switch (columnKey) {
          case "serial": return index + 1;
          case "dtmfInput": return report.dtmf_input || "-";
          case "action": return report.action?.name || "-";
          case "voiceFile": return report.voice?.file_name || "-";
          case "date": return report.created_at ? new Date(report.created_at).toLocaleString() : "-";
          default: return "-";
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
    const selectedColumnsDef = columns.filter((col) => selected.includes(col.key));

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
    const selectedColumnsDef = columns.filter((col) => selected.includes(col.key));

    if (selectedColumnsDef.length === 0) {
      setSnackbarMessage("Please select at least one column to export");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    const doc = new jsPDF();
    const reportTitle = getReportTitle();
    doc.setFontSize(16);
    doc.text(reportTitle, 14, 14);

    if (startDate && endDate) {
      doc.setFontSize(10);
      doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 20);
    }

    const headers = [selectedColumnsDef.map((col) => col.label)];
    const tableData = filteredReports.map((report, idx) =>
      selectedColumnsDef.map((col) => {
        const value = getColumnValue(col.key, report, idx);
        // Truncate long text for PDF
        if (typeof value === "string" && value.length > 50) {
          return value.substring(0, 50) + "...";
        }
        return value;
      })
    );

    autoTable(doc, {
      startY: startDate && endDate ? 26 : 20,
      head: headers,
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] },
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
      default:
        return null;
    }
  };

  const renderVoiceNoteTable = () => (
    <table className="report-table">
      <thead>
        <tr>
          <th>Sn</th>
          <th>Phone</th>
          <th>Date</th>
          <th>Audio</th>
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
              {report.recording_path ? (
                <audio
                  controls
                  src={`${baseURL}${report.recording_path}`}
                  style={{ maxWidth: 120 }}
                />
              ) : (
                "No file"
              )}
            </td>
            <td>
              <Chip
                label={report.is_played ? "Yes" : "No"}
                size="small"
                color={report.is_played ? "success" : "warning"}
              />
            </td>
            <td>{report.assigned_agent_id || "-"}</td>
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

  const renderTicketTable = () => (
    <table className="report-table">
      <thead>
        <tr>
          <th>Sn</th>
          <th>Ticket #</th>
          <th>Subject</th>
          <th>Status</th>
          <th>Category</th>
          <th>Complaint Type</th>
          <th>Requester</th>
          <th>Assigned To</th>
          <th>Created Date</th>
          <th>Resolved Date</th>
        </tr>
      </thead>
      <tbody>
        {currentReports.map((report, index) => (
          <tr key={report.id || index}>
            <td>{indexOfFirstReport + index + 1}</td>
            <td>{report.ticket_number || "-"}</td>
            <td className="subject-cell">{report.subject || "-"}</td>
            <td>
              <Chip
                label={report.status || "-"}
                size="small"
                color={
                  report.status === "Closed"
                    ? "success"
                    : report.status === "Open"
                    ? "error"
                    : "warning"
                }
              />
            </td>
            <td>
              <Chip
                label={report.category || "-"}
                size="small"
                color={
                  report.category === "Complaint"
                    ? "error"
                    : report.category === "Inquiry"
                    ? "info"
                    : "default"
                }
              />
            </td>
            <td>
              <Chip
                label={report.complaint_type || "-"}
                size="small"
                color={
                  report.complaint_type === "Major"
                    ? "error"
                    : report.complaint_type === "Minor"
                    ? "warning"
                    : "default"
                }
              />
            </td>
            <td>{report.requester_name || "-"}</td>
            <td>{report.assigned_to_name || "-"}</td>
            <td>
              {report.created_at
                ? new Date(report.created_at).toLocaleString()
                : "-"}
            </td>
            <td>
              {report.resolved_at
                ? new Date(report.resolved_at).toLocaleString()
                : "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

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
          <th>DTMF Input</th>
          <th>Action</th>
          <th>Voice File</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {currentReports.map((report, index) => (
          <tr key={report.id || index}>
            <td>{indexOfFirstReport + index + 1}</td>
            <td>{report.dtmf_input || "-"}</td>
            <td>{report.action?.name || "-"}</td>
            <td>{report.voice?.file_name || "-"}</td>
            <td>
              {report.created_at
                ? new Date(report.created_at).toLocaleString()
                : "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

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
          <Box display="flex" justifyContent="space-between" alignItems="center">
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
