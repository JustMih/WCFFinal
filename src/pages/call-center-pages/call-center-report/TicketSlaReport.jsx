import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Typography,
} from "@mui/material";
import { PictureAsPdf, TableChart } from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { baseURL } from "../../../config";
import WcfLoader from "../../../components/shared/WcfLoader";
import ReportDateRangePicker from "../../../components/shared/ReportDateRangePicker";
import ReportTablePagination from "../../../components/shared/ReportTablePagination";
import useReportTablePagination from "../../../hooks/useReportTablePagination";
import { isValidReportDateRange } from "../../../utils/reportDateUtils";
import {
  exportRowsToCsv,
  exportRowsToExcel,
} from "../../../utils/reportExportHelpers";
import "./slaReport.css";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "approaching", label: "Approaching" },
  { value: "on-time", label: "On Time" },
  { value: "no-sla", label: "No SLA" },
];

const EXPORT_COLUMNS = [
  { key: "serial", label: "Serial No" },
  { key: "ticket_id", label: "Ticket ID" },
  { key: "subject", label: "Subject" },
  { key: "status", label: "Status" },
  { key: "workflow_current_role", label: "Current Role" },
  { key: "assigned_to_name", label: "Assigned To" },
  { key: "sla_status", label: "SLA Status" },
  { key: "sla_details", label: "Details" },
  { key: "created_at", label: "Created" },
];

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};

const rowClassForSeverity = (severity, status) => {
  if (severity === "high" || status === "Overdue") return "sla-row-overdue";
  if (severity === "medium" || status === "Approaching Deadline") {
    return "sla-row-approaching";
  }
  return "";
};

const statusChipColor = (status) => {
  switch (status) {
    case "Overdue":
      return "error";
    case "Approaching Deadline":
      return "warning";
    case "On Time":
      return "success";
    default:
      return "default";
  }
};

export default function TicketSlaReport({ embedded = false }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [summary, setSummary] = useState(null);
  const [tickets, setTickets] = useState([]);
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

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const qs = params.toString();
      const url = `${baseURL}/reports/ticket-sla-report/${startDate}/${endDate}${
        qs ? `?${qs}` : ""
      }`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to load ticket SLA report");
      }
      const data = await res.json();
      setSummary(data.summary || null);
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
    } catch (e) {
      setError(e.message || "Failed to load report");
      setSummary(null);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, statusFilter]);

  useEffect(() => {
    if (!isValidReportDateRange(startDate, endDate)) {
      setSummary(null);
      setTickets([]);
      return;
    }
    fetchReport();
  }, [startDate, endDate, statusFilter, fetchReport]);

  const { paginatedItems: paginatedTickets, paginationProps, resetPage } =
    useReportTablePagination(tickets);

  useEffect(() => {
    resetPage();
  }, [tickets.length, startDate, endDate, statusFilter, resetPage]);

  const exportRows = useMemo(
    () =>
      tickets.map((t, index) => ({
        serial: index + 1,
        ticket_id: t.ticket_id || t.id || "—",
        subject: t.subject || "—",
        status: t.status || "—",
        workflow_current_role: t.workflow_current_role || "—",
        assigned_to_name: t.assigned_to_name || "—",
        sla_status: t.sla_status || "—",
        sla_details: t.sla_details || "—",
        created_at: formatDateTime(t.created_at),
      })),
    [tickets]
  );

  const buildLabelRows = () =>
    exportRows.map((row) => {
      const out = {};
      EXPORT_COLUMNS.forEach((col) => {
        out[col.label] = row[col.key];
      });
      return out;
    });

  const exportFilenameBase = `ticket_sla_${startDate || "all"}_${endDate || "all"}`;

  const handleExportCSV = () => {
    if (exportRows.length === 0) {
      showSnackbar("No data to export", "warning");
      return;
    }
    exportRowsToCsv(buildLabelRows(), `${exportFilenameBase}.csv`);
    showSnackbar("CSV exported successfully!");
  };

  const handleExportExcel = () => {
    if (exportRows.length === 0) {
      showSnackbar("No data to export", "warning");
      return;
    }
    exportRowsToExcel(buildLabelRows(), `${exportFilenameBase}.xlsx`, "Ticket SLA");
    showSnackbar("Excel exported successfully!");
  };

  const handleExportPDF = () => {
    if (exportRows.length === 0) {
      showSnackbar("No data to export", "warning");
      return;
    }
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Ticket SLA Report", 14, 16);
    doc.setFontSize(10);
    doc.text(`Period: ${startDate || "—"} to ${endDate || "—"}`, 14, 24);
    if (summary) {
      doc.text(
        `Summary — Overdue: ${summary.overdue} | Approaching: ${summary.approaching} | On Time: ${summary.onTime} | Total: ${summary.total}`,
        14,
        30
      );
    }

    autoTable(doc, {
      startY: 36,
      head: [EXPORT_COLUMNS.map((c) => c.label)],
      body: exportRows.map((row) => EXPORT_COLUMNS.map((c) => row[c.key])),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save(`${exportFilenameBase}.pdf`);
    showSnackbar("PDF exported successfully!");
  };

  return (
    <Box
      className={`sla-report-root ${embedded ? "sla-report-embedded" : "sla-report-page"}`}
    >
      {!embedded && (
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Ticket SLA Report
        </Typography>
      )}

      <Paper className="sla-report-filters report-filters-row" elevation={0}>
        <ReportDateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          startLabel="Start date"
          endLabel="End date"
          disabled={loading}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>SLA Status</InputLabel>
          <Select
            label="SLA Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            disabled={loading}
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <div className="sla-report-actions">
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={handleExportPDF}
            disabled={loading || tickets.length === 0}
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<TableChart />}
            onClick={handleExportCSV}
            disabled={loading || tickets.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<TableChart />}
            onClick={handleExportExcel}
            disabled={loading || tickets.length === 0}
          >
            Export Excel
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
          <WcfLoader
            size="md"
            message="Loading ticket SLA report..."
            label="Loading ticket SLA report"
          />
        </div>
      ) : summary ? (
        <>
          <div className="sla-report-summary-chips">
            <div className="sla-summary-chip">
              <strong>{summary.total ?? 0}</strong>
              <span>Total</span>
            </div>
            <div className="sla-summary-chip sla-summary-chip--ontime">
              <strong>{summary.onTime ?? 0}</strong>
              <span>On Time</span>
            </div>
            <div className="sla-summary-chip sla-summary-chip--approaching">
              <strong>{summary.approaching ?? 0}</strong>
              <span>Approaching</span>
            </div>
            <div className="sla-summary-chip sla-summary-chip--overdue">
              <strong>{summary.overdue ?? 0}</strong>
              <span>Overdue</span>
            </div>
            <div className="sla-summary-chip">
              <strong>{summary.noSla ?? 0}</strong>
              <span>No SLA</span>
            </div>
            <div className="sla-summary-chip">
              <strong>{summary.unknown ?? 0}</strong>
              <span>Unknown</span>
            </div>
          </div>

          <div className="sla-report-section">
            <h3 className="sla-report-section-title">Tickets by SLA status</h3>
            <TableContainer component={Paper} className="sla-report-table-wrap" elevation={0}>
            <Table size="small" className="sla-report-table">
              <TableHead>
                <TableRow>
                  <TableCell>Serial No</TableCell>
                  <TableCell>Ticket ID</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Current Role</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>SLA Status</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No tickets match this filter
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTickets.map((ticket, index) => (
                    <TableRow
                      key={ticket.id}
                      className={rowClassForSeverity(
                        ticket.sla_severity,
                        ticket.sla_status
                      )}
                    >
                      <TableCell>
                        {paginationProps.page * paginationProps.rowsPerPage +
                          index +
                          1}
                      </TableCell>
                      <TableCell>{ticket.ticket_id || ticket.id}</TableCell>
                      <TableCell>{ticket.subject || "—"}</TableCell>
                      <TableCell>{ticket.status || "—"}</TableCell>
                      <TableCell>{ticket.workflow_current_role || "—"}</TableCell>
                      <TableCell>{ticket.assigned_to_name || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          label={ticket.sla_status || "Unknown"}
                          size="small"
                          color={statusChipColor(ticket.sla_status)}
                        />
                      </TableCell>
                      <TableCell>{ticket.sla_details || "—"}</TableCell>
                      <TableCell>{formatDateTime(ticket.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <ReportTablePagination {...paginationProps} className="tat-report-pagination" />
          </TableContainer>
          </div>
        </>
      ) : (
        !error && (
          <p className="sla-report-empty-hint">
            Select start and end dates to view ticket SLA compliance.
          </p>
        )
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
