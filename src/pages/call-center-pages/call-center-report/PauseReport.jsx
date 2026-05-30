import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { PictureAsPdf, TableChart } from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { baseURL } from "../../../config";
import {
  formatActivityLabel,
  formatPauseDuration,
  formatExceededTime,
} from "../../../utils/pauseActivities";
import "./pauseReport.css";
import WcfLoader from "../../../components/shared/WcfLoader";
import ReportDateRangePicker from "../../../components/shared/ReportDateRangePicker";
import ReportTablePagination from "../../../components/shared/ReportTablePagination";
import useReportTablePagination from "../../../hooks/useReportTablePagination";
import { isValidReportDateRange } from "../../../utils/reportDateUtils";

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};

const EXPORT_COLUMNS = [
  { key: "agent", label: "Agent" },
  { key: "extension", label: "Extension" },
  { key: "activity", label: "Activity" },
  { key: "started", label: "Started" },
  { key: "ended", label: "Ended" },
  { key: "allowed", label: "Allowed" },
  { key: "duration", label: "Duration" },
  { key: "exceeded", label: "Exceeded" },
];

const mapSessionToRow = (row) => ({
  agent: row.full_name,
  extension: row.extension ?? "—",
  activity: `${formatActivityLabel(row.pause_activity)}${row.is_active ? " (Active)" : ""}`,
  started: formatDateTime(row.started_at),
  ended: row.is_active ? "—" : formatDateTime(row.ended_at),
  allowed: formatPauseDuration(row.allowed_seconds),
  duration: formatPauseDuration(row.duration_seconds),
  exceeded:
    row.exceeded_seconds > 0
      ? formatExceededTime(row.exceeded_seconds)
      : "—",
});

export default function PauseReport({ embedded = false }) {
  const role = localStorage.getItem("role");
  const canFilterAgent = ["supervisor", "admin", "super-admin"].includes(
    role || ""
  );

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");
  const [agents, setAgents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const fetchAgents = useCallback(async () => {
    if (!canFilterAgent) return;
    try {
      const res = await fetch(`${baseURL}/users/agents`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (e) {
      console.error("Failed to load agents", e);
    }
  }, [canFilterAgent]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (canFilterAgent && agentFilter !== "all") {
        params.set("userId", agentFilter);
      }

      const res = await fetch(
        `${baseURL}/users/pause-report?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to load pause report");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e) {
      setError(e.message || "Failed to load report");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, agentFilter, canFilterAgent]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    if (!isValidReportDateRange(startDate, endDate)) {
      setSessions([]);
      return;
    }
    fetchReport();
  }, [startDate, endDate, agentFilter, fetchReport]);

  const { paginatedItems: paginatedSessions, paginationProps, resetPage } =
    useReportTablePagination(sessions);

  useEffect(() => {
    resetPage();
  }, [sessions.length, startDate, endDate, agentFilter, resetPage]);

  const getExportRows = () => sessions.map(mapSessionToRow);

  const handleExportCSV = () => {
    if (sessions.length === 0) {
      showSnackbar("No data to export", "warning");
      return;
    }
    const rows = getExportRows().map((row) => {
      const out = {};
      EXPORT_COLUMNS.forEach((col) => {
        out[col.label] = row[col.key];
      });
      return out;
    });
    const filename = `pause_report_${startDate || "all"}_${endDate || "all"}.csv`;
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pause Report");
    XLSX.writeFile(wb, filename);
    showSnackbar("CSV exported successfully!");
  };

  const handleExportPDF = () => {
    if (sessions.length === 0) {
      showSnackbar("No data to export", "warning");
      return;
    }
    const rows = getExportRows();
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Pause Report", 14, 16);
    doc.setFontSize(10);
    doc.text(`Period: ${startDate || "—"} to ${endDate || "—"}`, 14, 24);

    autoTable(doc, {
      startY: 30,
      head: [EXPORT_COLUMNS.map((c) => c.label)],
      body: rows.map((row) => EXPORT_COLUMNS.map((c) => row[c.key])),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    const filename = `pause_report_${startDate || "all"}_${endDate || "all"}.pdf`;
    doc.save(filename);
    showSnackbar("PDF exported successfully!");
  };

  return (
    <Box className={embedded ? "pause-report-embedded" : "pause-report-page"}>
      {!embedded && (
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Pause Report
        </Typography>
      )}

      <Paper className="pause-report-filters report-filters-row" elevation={embedded ? 0 : 1}>
        <ReportDateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          startLabel="Start date"
          endLabel="End date"
          disabled={loading}
        />
        {canFilterAgent && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Agent</InputLabel>
            <Select
              label="Agent"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
            >
              <MenuItem value="all">All agents</MenuItem>
              {agents.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.full_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <div className="pause-report-actions">
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={handleExportPDF}
            disabled={loading || sessions.length === 0}
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<TableChart />}
            onClick={handleExportCSV}
            disabled={loading || sessions.length === 0}
          >
            Export CSV
          </Button>
        </div>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="wcf-loading-container">
          <WcfLoader size="md" message="Loading pause report..." label="Loading pause report" />
        </div>
      ) : !isValidReportDateRange(startDate, endDate) ? (
        <p className="sla-report-empty-hint">
          Select start and end dates to view pause sessions.
        </p>
      ) : (
        <TableContainer component={Paper} className="pause-report-table-wrap">
          <Table size="small" className="pause-report-table">
            <TableHead>
              <TableRow>
                <TableCell>Agent</TableCell>
                <TableCell>Extension</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Ended</TableCell>
                <TableCell>Allowed</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Exceeded</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No pause sessions in this period
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSessions.map((row) => (
                  <TableRow
                    key={row.id}
                    className={
                      row.exceeded_seconds > 0 ? "pause-report-row-exceeded" : ""
                    }
                  >
                    <TableCell>{row.full_name}</TableCell>
                    <TableCell>{row.extension ?? "—"}</TableCell>
                    <TableCell>
                      {formatActivityLabel(row.pause_activity)}
                      {row.is_active && (
                        <Chip
                          label="Active"
                          size="small"
                          color="warning"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{formatDateTime(row.started_at)}</TableCell>
                    <TableCell>
                      {row.is_active ? "—" : formatDateTime(row.ended_at)}
                    </TableCell>
                    <TableCell>
                      {formatPauseDuration(row.allowed_seconds)}
                    </TableCell>
                    <TableCell>
                      {formatPauseDuration(row.duration_seconds)}
                    </TableCell>
                    <TableCell>
                      {row.exceeded_seconds > 0 ? (
                        <strong className="pause-report-exceeded-cell">
                          {formatExceededTime(row.exceeded_seconds)}
                        </strong>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <ReportTablePagination {...paginationProps} />
        </TableContainer>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
