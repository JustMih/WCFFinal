import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
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
import {
  FaChartLine,
  FaClock,
  FaChartBar,
  FaExclamationCircle,
} from "react-icons/fa";
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

function SlaMetricCard({ period, variant, icon: Icon, value, title, sublabel }) {
  return (
    <div className={`supervisor-stat-card ${variant}`}>
      <div className="supervisor-stat-card__icon-wrap">
        <Icon />
      </div>
      <div className="supervisor-stat-card__body">
        <span className="supervisor-stat-card__period">{period}</span>
        <span className="supervisor-stat-card__count">{value}</span>
        <div className="supervisor-stat-card__summary">
          <div className="supervisor-stat-card__desc">
            <div className="supervisor-stat-card__label">{title}</div>
            <div className="supervisor-stat-card__sublabel">{sublabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DAILY_EXPORT_COLUMNS = [
  { key: "serial", label: "Serial No" },
  { key: "date", label: "Date" },
  { key: "totalCalls", label: "Total Calls" },
  { key: "answeredCalls", label: "Answered" },
  { key: "unansweredCalls", label: "Unanswered" },
  { key: "serviceLevel", label: "Service Level %" },
  { key: "averageResponseTime", label: "Avg Response (min)" },
  { key: "averageHandleTime", label: "Avg Handle (min)" },
  { key: "abandonmentRate", label: "Abandonment %" },
];

const formatMinutesFromSeconds = (seconds) => {
  const sec = Number(seconds) || 0;
  return (sec / 60).toFixed(2);
};

const formatDateLabel = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

export default function CallCenterSlaReport({ embedded = false }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
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
      const res = await fetch(
        `${baseURL}/reports/sla-report/${startDate}/${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to load SLA report");
      }
      const data = await res.json();
      setSummary(data.summary || null);
      setDaily(Array.isArray(data.daily) ? data.daily : []);
    } catch (e) {
      setError(e.message || "Failed to load report");
      setSummary(null);
      setDaily([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (!isValidReportDateRange(startDate, endDate)) {
      setSummary(null);
      setDaily([]);
      return;
    }
    fetchReport();
  }, [startDate, endDate, fetchReport]);

  const { paginatedItems: paginatedDaily, paginationProps, resetPage } =
    useReportTablePagination(daily);

  useEffect(() => {
    resetPage();
  }, [daily.length, startDate, endDate, resetPage]);

  const getExportRows = () =>
    daily.map((row, index) => ({
      serial: index + 1,
      date: formatDateLabel(row.date),
      totalCalls: row.totalCalls ?? 0,
      answeredCalls: row.answeredCalls ?? 0,
      unansweredCalls: row.notAnsweredCalls ?? 0,
      serviceLevel: `${row.serviceLevel ?? 0}%`,
      averageResponseTime: formatMinutesFromSeconds(row.averageResponseTime),
      averageHandleTime: formatMinutesFromSeconds(row.averageHandleTime),
      abandonmentRate: `${row.abandonmentRate ?? 0}%`,
    }));

  const buildLabelRows = (rows) =>
    rows.map((row) => {
      const out = {};
      DAILY_EXPORT_COLUMNS.forEach((col) => {
        out[col.label] = row[col.key];
      });
      return out;
    });

  const exportFilenameBase = `call_center_sla_${startDate || "all"}_${endDate || "all"}`;

  const handleExportCSV = () => {
    if (daily.length === 0) {
      showSnackbar("No data to export", "warning");
      return;
    }
    exportRowsToCsv(buildLabelRows(getExportRows()), `${exportFilenameBase}.csv`);
    showSnackbar("CSV exported successfully!");
  };

  const handleExportExcel = () => {
    if (daily.length === 0) {
      showSnackbar("No data to export", "warning");
      return;
    }
    exportRowsToExcel(
      buildLabelRows(getExportRows()),
      `${exportFilenameBase}.xlsx`,
      "Call Center SLA"
    );
    showSnackbar("Excel exported successfully!");
  };

  const handleExportPDF = () => {
    if (daily.length === 0) {
      showSnackbar("No data to export", "warning");
      return;
    }
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Call Center SLA Report", 14, 16);
    doc.setFontSize(10);
    doc.text(`Period: ${startDate || "—"} to ${endDate || "—"}`, 14, 24);
    if (summary) {
      doc.text(
        `Summary — Service Level: ${summary.serviceLevel}% | Avg Response: ${formatMinutesFromSeconds(summary.averageResponseTime)} min | Avg Handle: ${formatMinutesFromSeconds(summary.averageHandleTime)} min | Abandonment: ${summary.abandonmentRate}%`,
        14,
        30
      );
    }

    const rows = getExportRows();
    autoTable(doc, {
      startY: 36,
      head: [DAILY_EXPORT_COLUMNS.map((c) => c.label)],
      body: rows.map((row) => DAILY_EXPORT_COLUMNS.map((c) => row[c.key])),
      styles: { fontSize: 8 },
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
          Call Center SLA Report
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
        <div className="sla-report-actions">
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={handleExportPDF}
            disabled={loading || daily.length === 0}
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<TableChart />}
            onClick={handleExportCSV}
            disabled={loading || daily.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<TableChart />}
            onClick={handleExportExcel}
            disabled={loading || daily.length === 0}
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
            message="Loading call center SLA report..."
            label="Loading call center SLA report"
          />
        </div>
      ) : summary ? (
        <>
          <div className="sla-report-metrics">
            <SlaMetricCard
              period="SLA"
              variant="sla-service-level"
              icon={FaChartLine}
              value={`${summary.serviceLevel}%`}
              title="Service Level"
              sublabel="Answered within 20 seconds"
            />
            <SlaMetricCard
              period="SLA"
              variant="sla-avg-response"
              icon={FaClock}
              value={`${formatMinutesFromSeconds(summary.averageResponseTime)} min`}
              title="Avg Response Time"
              sublabel="Ring time to answer"
            />
            <SlaMetricCard
              period="SLA"
              variant="sla-avg-handle"
              icon={FaChartBar}
              value={`${formatMinutesFromSeconds(summary.averageHandleTime)} min`}
              title="Avg Handle Time"
              sublabel="Talk time (billsec)"
            />
            <SlaMetricCard
              period="SLA"
              variant="sla-abandonment"
              icon={FaExclamationCircle}
              value={`${summary.abandonmentRate}%`}
              title="Abandonment Rate"
              sublabel={`${summary.totalCalls ?? 0} total calls`}
            />
          </div>

          <div className="sla-report-section">
            <h3 className="sla-report-section-title">Daily breakdown</h3>
            <TableContainer component={Paper} className="sla-report-table-wrap" elevation={0}>
            <Table size="small" className="sla-report-table">
              <TableHead>
                <TableRow>
                  <TableCell>Serial No</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Total Calls</TableCell>
                  <TableCell align="right">Answered</TableCell>
                  <TableCell align="right">Unanswered</TableCell>
                  <TableCell align="right">Service Level</TableCell>
                  <TableCell align="right">Avg Response (min)</TableCell>
                  <TableCell align="right">Avg Handle (min)</TableCell>
                  <TableCell align="right">Abandonment</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {daily.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No CDR data in this period
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDaily.map((row, index) => (
                    <TableRow key={row.date || Math.random()}>
                      <TableCell>
                        {paginationProps.page * paginationProps.rowsPerPage +
                          index +
                          1}
                      </TableCell>
                      <TableCell>{formatDateLabel(row.date)}</TableCell>
                      <TableCell align="right">{row.totalCalls ?? 0}</TableCell>
                      <TableCell align="right">{row.answeredCalls ?? 0}</TableCell>
                      <TableCell align="right">{row.notAnsweredCalls ?? 0}</TableCell>
                      <TableCell align="right">{row.serviceLevel ?? 0}%</TableCell>
                      <TableCell align="right">
                        {formatMinutesFromSeconds(row.averageResponseTime)}
                      </TableCell>
                      <TableCell align="right">
                        {formatMinutesFromSeconds(row.averageHandleTime)}
                      </TableCell>
                      <TableCell align="right">{row.abandonmentRate ?? 0}%</TableCell>
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
            Select start and end dates to view SLA metrics.
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
