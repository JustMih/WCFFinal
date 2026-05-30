import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import * as XLSX from "xlsx";
import { baseURL } from "../../../config";
import WcfLoader from "../../../components/shared/WcfLoader";
import ReportDateRangePicker from "../../../components/shared/ReportDateRangePicker";
import ReportTablePagination from "../../../components/shared/ReportTablePagination";
import useReportTablePagination from "../../../hooks/useReportTablePagination";
import { isValidReportDateRange } from "../../../utils/reportDateUtils";
import {
  TAT_TEMPLATE_COLUMNS,
  UI_ONLY_COLUMNS,
  EXCEL_EXPORT_COLUMNS,
  dateToExcelSerial,
  formatDisplayDate,
  formatTatDays,
} from "./tatTemplateConfig";
import "./slaReport.css";
import "./ticketWorkflowTatReport.css";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "Closed", label: "Closed" },
  { value: "Assigned", label: "Assigned" },
  { value: "Open", label: "Open" },
  { value: "In Progress", label: "In Progress" },
  { value: "Escalated", label: "Escalated" },
  { value: "Pending Review", label: "Pending Review" },
  { value: "Pending Approval", label: "Pending Approval" },
];

const TABLE_COLUMNS = [
  ...UI_ONLY_COLUMNS,
  ...TAT_TEMPLATE_COLUMNS.map((col) => ({
    key: col.key,
    label: col.header,
    type: col.type,
  })),
];

export default function TicketWorkflowTatReport({ embedded = false }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
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
      const url = `${baseURL}/reports/ticket-workflow-tat/${startDate}/${endDate}/${encodeURIComponent(statusFilter)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to load ticket workflow TAT report");
      }
      const data = await res.json();
      setSummary(data.summary || null);
      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch (e) {
      setError(e.message || "Failed to load report");
      setSummary(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, statusFilter]);

  useEffect(() => {
    if (!isValidReportDateRange(startDate, endDate)) {
      setSummary(null);
      setRows([]);
      return;
    }
    fetchReport();
  }, [startDate, endDate, statusFilter, fetchReport]);

  const displayRows = useMemo(
    () =>
      rows.map((row) => {
        const out = { ...row };
        for (const col of TAT_TEMPLATE_COLUMNS) {
          if (col.type === "date") {
            out[col.key] = formatDisplayDate(row[col.key]);
          } else if (col.type === "tat") {
            out[col.key] = formatTatDays(row[col.key]);
          } else if (col.type === "fin_year") {
            out[col.key] = row[col.key] ?? "—";
          }
        }
        return out;
      }),
    [rows]
  );

  const { paginatedItems: paginatedRows, paginationProps, resetPage } =
    useReportTablePagination(displayRows);

  useEffect(() => {
    resetPage();
  }, [displayRows.length, statusFilter, startDate, endDate, resetPage]);

  const handleExportExcel = () => {
    if (rows.length === 0) {
      showSnackbar("No data to export", "warning");
      return;
    }

    const headers = EXCEL_EXPORT_COLUMNS.map((col) => col.header);
    const dataRows = rows.map((row) =>
      EXCEL_EXPORT_COLUMNS.map((col) => {
        const value = row[col.key];
        if (col.type === "date") {
          return value ? dateToExcelSerial(value) : "";
        }
        if (col.type === "tat") {
          return value === null || value === undefined || value === "" ? "" : value;
        }
        return value ?? "";
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ticket Workflow TAT");
    XLSX.writeFile(
      wb,
      `ticket_workflow_tat_${startDate || "all"}_${endDate || "all"}.xlsx`
    );
    showSnackbar("Excel exported successfully!");
  };

  const handleExportPDF = () => {
    if (displayRows.length === 0) {
      showSnackbar("No data to export", "warning");
      return;
    }
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Ticket Workflow TAT Report", 14, 16);
    doc.setFontSize(10);
    doc.text(`Period: ${startDate || "—"} to ${endDate || "—"}`, 14, 24);
    if (summary) {
      doc.text(
        `Summary — Total: ${summary.total} | Resolved: ${summary.resolved} | Avg TAT (days): ${summary.avgTotalTatDays ?? 0}`,
        14,
        30
      );
    }

    autoTable(doc, {
      startY: 36,
      head: [TABLE_COLUMNS.map((c) => c.label)],
      body: displayRows.map((row) =>
        TABLE_COLUMNS.map((c) => String(row[c.key] ?? "—"))
      ),
      styles: { fontSize: 5 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save(
      `ticket_workflow_tat_${startDate || "all"}_${endDate || "all"}.pdf`
    );
    showSnackbar("PDF exported successfully!");
  };

  return (
    <Box
      className={`sla-report-root tat-report-root ${embedded ? "sla-report-embedded" : "sla-report-page"}`}
    >
      {!embedded && (
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Ticket Workflow TAT Report
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
        <FormControl size="small" className="tat-status-filter">
          <InputLabel id="tat-status-filter-label" shrink>
            Ticket Status
          </InputLabel>
          <Select
            labelId="tat-status-filter-label"
            id="tat-status-filter"
            label="Ticket Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            disabled={loading}
            notched
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
            disabled={loading || rows.length === 0}
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<TableChart />}
            onClick={handleExportExcel}
            disabled={loading || rows.length === 0}
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
            message="Loading ticket workflow TAT report..."
            label="Loading ticket workflow TAT report"
          />
        </div>
      ) : summary ? (
        <>
          <div className="sla-report-summary-chips">
            <div className="sla-summary-chip">
              <strong>{summary.total ?? 0}</strong>
              <span>Total Tickets</span>
            </div>
            <div className="sla-summary-chip sla-summary-chip--ontime">
              <strong>{summary.resolved ?? 0}</strong>
              <span>Resolved</span>
            </div>
            <div className="sla-summary-chip">
              <strong>{summary.avgTotalTatDays ?? 0}</strong>
              <span>Avg TAT (days)</span>
            </div>
          </div>

          <div className="sla-report-section">
            <h3 className="sla-report-section-title">
              Ticket workflow turnaround (created → resolved)
            </h3>
            <TableContainer
              component={Paper}
              className="sla-report-table-wrap tat-report-table-wrap"
              elevation={0}
            >
              <Table size="small" className="sla-report-table tat-report-table">
                <TableHead>
                  <TableRow>
                    {TABLE_COLUMNS.map((col) => (
                      <TableCell
                        key={col.key}
                        className={
                          col.type === "date"
                            ? "tat-date-header"
                            : col.type === "tat"
                              ? "tat-days-header"
                              : "tat-fixed-header"
                        }
                      >
                        {col.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={TABLE_COLUMNS.length} align="center">
                        No tickets with assignment history match this filter
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRows.map((row) => (
                      <TableRow key={row.id || row.ticket_id || row.serial}>
                        {TABLE_COLUMNS.map((col) => (
                          <TableCell key={col.key}>
                            {row[col.key] ?? "—"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <ReportTablePagination
                {...paginationProps}
                className="tat-report-pagination"
              />
            </TableContainer>
          </div>
        </>
      ) : (
        !error && (
          <p className="sla-report-empty-hint">
            Select start and end dates to view ticket workflow TAT.
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
