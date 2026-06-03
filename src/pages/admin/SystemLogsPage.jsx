import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import { fetchAuditLogs, fetchAuditLogsExport, fetchHttpLogs } from "../../api/logsApi";
import {
  buildLabelKeyedExportRows,
  chunkArray,
  delay,
  exportRowsToCsv,
  exportRowsToExcel,
  exportRowsToPdf,
} from "../../utils/reportExportHelpers";
import "./SystemLogsPage.css";

const AUDIT_EXPORT_ROWS_PER_FILE = 500;
const AUDIT_EXPORT_MAX_PAGES = 20;
const EXPORT_DOWNLOAD_GAP_MS = 400;
const LOG_PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 200, 500, 1000];

const AUDIT_EXPORT_COLUMNS = [
  { key: "time", label: "Time" },
  { key: "action", label: "Action" },
  { key: "category", label: "Category" },
  { key: "entityType", label: "Entity Type" },
  { key: "entityId", label: "Entity ID" },
  { key: "status", label: "Status" },
  { key: "actor", label: "Actor" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "method", label: "Method" },
  { key: "path", label: "Path" },
  { key: "requestId", label: "Request ID" },
  { key: "message", label: "Message" },
];

const LOG_TYPES = {
  AUDIT: "audit",
  HTTP: "http",
};
const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];
const STATUS_PRESETS = ["2xx", "3xx", "4xx", "5xx"];
const AUDIT_CATEGORIES = [
  "authentication",
  "workflow",
  "configuration",
  "reporting",
  "api",
];
const AUDIT_STATUSES = ["success", "failure"];

const createHttpFilters = () => ({
  method: "",
  statusCode: "",
  role: "",
  userId: "",
  path: "",
  startDate: "",
  endDate: "",
});

const createAuditFilters = () => ({
  category: "",
  action: "",
  status: "",
  method: "",
  role: "",
  userId: "",
  entityType: "",
  entityId: "",
  path: "",
  requestId: "",
  search: "",
  startDate: "",
  endDate: "",
});

export default function SystemLogsPage() {
  const [activeTab, setActiveTab] = useState(LOG_TYPES.AUDIT);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [httpFilters, setHttpFilters] = useState(createHttpFilters);
  const [auditFilters, setAuditFilters] = useState(createAuditFilters);
  const exportAbortRef = useRef(null);
  const exportHintShownRef = useRef(false);

  const currentFilters = useMemo(
    () => (activeTab === LOG_TYPES.HTTP ? httpFilters : auditFilters),
    [activeTab, auditFilters, httpFilters]
  );

  const setCurrentFilters = (updater) => {
    if (activeTab === LOG_TYPES.HTTP) {
      setHttpFilters(updater);
      return;
    }

    setAuditFilters(updater);
  };

  const loadLogs = async (
    logType = activeTab,
    pageOverride = 1,
    filtersOverride = currentFilters
  ) => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page: pageOverride,
        pageSize,
      };

      Object.entries(filtersOverride).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      const data =
        logType === LOG_TYPES.HTTP
          ? await fetchHttpLogs(params)
          : await fetchAuditLogs(params);

      setLogs(data.data || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
    } catch (err) {
      console.error("Failed to load logs", err);
      setError("Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedAuditLog(null);
    loadLogs(activeTab, 1, activeTab === LOG_TYPES.HTTP ? httpFilters : auditFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pageSize]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setCurrentFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    loadLogs(activeTab, 1, currentFilters);
  };

  const handleResetFilters = () => {
    const nextFilters =
      activeTab === LOG_TYPES.HTTP ? createHttpFilters() : createAuditFilters();
    if (activeTab === LOG_TYPES.HTTP) {
      setHttpFilters(nextFilters);
    } else {
      setAuditFilters(nextFilters);
    }
    setPage(1);
    loadLogs(activeTab, 1, nextFilters);
  };

  const handlePageSizeChange = (e) => {
    setPage(1);
    setPageSize(Number(e.target.value) || 10);
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const buildAuditExportParams = () => {
    const params = {};
    Object.entries(auditFilters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    return params;
  };

  const mapAuditLogToExportRow = (log) => ({
    time: log.createdAt ? new Date(log.createdAt).toLocaleString() : "-",
    action: log.action || "-",
    category: log.category || "-",
    entityType: log.entityType || "-",
    entityId: log.entityId || "-",
    status: log.status || "-",
    actor: log.actorName || log.userId || "-",
    email: log.actorEmail || "-",
    role: log.role || "-",
    method: log.method || "-",
    path: log.path || "-",
    requestId: log.requestId || "-",
    message: log.message || "-",
  });

  const getAuditExportFilenameBase = () => {
    const { startDate, endDate } = auditFilters;
    return `audit_logs_${startDate || "all"}_${endDate || "all"}`;
  };

  const fetchAuditExportPage = async (exportPage, signal) => {
    const result = await fetchAuditLogsExport(
      {
        ...buildAuditExportParams(),
        exportPage,
        exportPageSize: AUDIT_EXPORT_ROWS_PER_FILE,
      },
      signal
    );
    return {
      rows: (result.data || []).map(mapAuditLogToExportRow),
      hasMore: Boolean(result.hasMore),
    };
  };

  const fetchAllAuditExportPages = async () => {
    exportAbortRef.current?.abort();
    const controller = new AbortController();
    exportAbortRef.current = controller;

    const pages = [];
    let exportPage = 1;

    while (exportPage <= AUDIT_EXPORT_MAX_PAGES) {
      const { rows, hasMore } = await fetchAuditExportPage(
        exportPage,
        controller.signal
      );
      if (rows.length === 0) {
        break;
      }
      pages.push(rows);
      if (!hasMore) {
        break;
      }
      exportPage += 1;
    }

    return pages;
  };

  const maybeShowExportDateHint = () => {
    const { startDate, endDate } = auditFilters;
    if (!startDate && !endDate && logs.length > 0 && !exportHintShownRef.current) {
      exportHintShownRef.current = true;
      showSnackbar(
        "Tip: set a start and end date for faster full export.",
        "info"
      );
    }
  };

  const shouldFallbackToPageExport = (err) => {
    if (activeTab !== LOG_TYPES.AUDIT || logs.length === 0) {
      return false;
    }
    return (
      err.isExportTimeout ||
      err.name === "CanceledError" ||
      err.code === "ERR_CANCELED" ||
      !err.response ||
      err.response?.status === 404 ||
      err.response?.status === 502 ||
      err.response?.status === 503
    );
  };

  const buildExportPartSuffix = (partIndex, totalParts) => {
    if (totalParts <= 1) {
      return "";
    }
    return `_part${String(partIndex).padStart(2, "0")}_of_${String(totalParts).padStart(2, "0")}`;
  };

  const exportAuditRowsToFile = (
    format,
    rows,
    { partIndex = 1, totalParts = 1, partial = false } = {}
  ) => {
    const filenameBase = getAuditExportFilenameBase();
    const partSuffix = buildExportPartSuffix(partIndex, totalParts);
    const labelRows = buildLabelKeyedExportRows(AUDIT_EXPORT_COLUMNS, rows);
    const { startDate, endDate } = auditFilters;
    const dateSubtitle = `Period: ${startDate || "all"} to ${endDate || "all"}${
      totalParts > 1 ? ` — Part ${partIndex} of ${totalParts}` : ""
    }${partial ? " (current page only)" : ""}`;

    if (format === "csv") {
      exportRowsToCsv(labelRows, `${filenameBase}${partSuffix}.csv`);
    } else if (format === "excel") {
      exportRowsToExcel(
        labelRows,
        `${filenameBase}${partSuffix}.xlsx`,
        totalParts > 1 ? `Audit Logs ${partIndex}` : "Audit Logs"
      );
    } else if (format === "pdf") {
      exportRowsToPdf({
        title: "Audit Logs",
        subtitle: dateSubtitle,
        columns: AUDIT_EXPORT_COLUMNS,
        rows,
        filename: `${filenameBase}${partSuffix}.pdf`,
        landscape: true,
      });
    }
  };

  const exportAuditRowChunks = async (format, rowChunks, { partial = false } = {}) => {
    const totalParts = rowChunks.length;
    if (totalParts === 0) {
      showSnackbar("No audit logs to export for the current filters", "warning");
      return { fileCount: 0, rowCount: 0 };
    }

    let rowCount = 0;
    for (let i = 0; i < rowChunks.length; i += 1) {
      const chunk = rowChunks[i];
      rowCount += chunk.length;
      exportAuditRowsToFile(format, chunk, {
        partIndex: i + 1,
        totalParts,
        partial,
      });
      if (i < rowChunks.length - 1) {
        await delay(EXPORT_DOWNLOAD_GAP_MS);
      }
    }

    return { fileCount: totalParts, rowCount };
  };

  const handleExportAuditLogs = async (format) => {
    if (format === "pdf" && logs.length > 0) {
      setExporting(true);
      try {
        const rowChunks = chunkArray(
          logs.map(mapAuditLogToExportRow),
          AUDIT_EXPORT_ROWS_PER_FILE
        );
        const { fileCount, rowCount } = await exportAuditRowChunks(format, rowChunks, {
          partial: true,
        });
        if (fileCount > 0) {
          const filesNote =
            fileCount > 1 ? ` in ${fileCount} file(s)` : "";
          showSnackbar(
            `Exported ${rowCount} audit log(s) to PDF${filesNote} (current page only)`
          );
        }
      } finally {
        setExporting(false);
      }
      return;
    }

    try {
      setExporting(true);
      maybeShowExportDateHint();
      const pages = await fetchAllAuditExportPages();
      const { fileCount, rowCount } = await exportAuditRowChunks(format, pages);

      if (fileCount === 0) {
        showSnackbar("No audit logs to export for the current filters", "warning");
        return;
      }

      const filesNote = fileCount > 1 ? ` in ${fileCount} file(s)` : "";
      const formatLabel =
        format === "csv" ? "CSV" : format === "excel" ? "Excel" : "PDF";
      showSnackbar(
        `Exported ${rowCount} audit log(s) to ${formatLabel}${filesNote} (max ${AUDIT_EXPORT_ROWS_PER_FILE} rows per file)`
      );
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        return;
      }

      console.error("Failed to export audit logs", err);

      if (shouldFallbackToPageExport(err)) {
        const rowChunks = chunkArray(
          logs.map(mapAuditLogToExportRow),
          AUDIT_EXPORT_ROWS_PER_FILE
        );
        const { fileCount, rowCount } = await exportAuditRowChunks(format, rowChunks, {
          partial: true,
        });
        if (fileCount > 0) {
          const filesNote = fileCount > 1 ? ` in ${fileCount} file(s)` : "";
          const timeoutNote = err.isExportTimeout ? ` ${err.message}` : "";
          showSnackbar(
            `Exported ${rowCount} audit log(s)${filesNote} (current page only).${timeoutNote}`,
            err.isExportTimeout ? "warning" : "success"
          );
        }
        return;
      }

      const status = err.response?.status;
      const apiMessage =
        err.message ||
        err.response?.data?.message ||
        (status === 403
          ? "You do not have permission to export audit logs"
          : null);
      showSnackbar(apiMessage || "Failed to export audit logs", "error");
    } finally {
      setExporting(false);
    }
  };

  useEffect(
    () => () => {
      exportAbortRef.current?.abort();
    },
    []
  );

  const renderAuditExportActions = () => (
    <div className="system-logs-export-toolbar">
      <span className="system-logs-export-label">Export audit logs</span>
      <button
        type="button"
        className="system-logs-export-btn"
        onClick={() => handleExportAuditLogs("pdf")}
        disabled={exporting}
      >
        Export PDF
      </button>
      {exporting && (
        <span className="system-logs-export-status">Preparing export…</span>
      )}
    </div>
  );

  const canPrev = page > 1;
  const canNext = page < totalPages;
  const isHttpTab = activeTab === LOG_TYPES.HTTP;
  const activeTabLabel = isHttpTab ? "HTTP Logs" : "Audit Logs";
  const activeDescription = isHttpTab
    ? "Technical request and response logs for backend traffic."
    : "User activity, authentication events, and tracked system actions.";
  const resultSummary =
    logs.length === 1 ? "1 record loaded" : `${logs.length} records loaded`;

  const renderHttpFilters = () => (
    <>
      <div className="filter-row">
        <div className="filter-item">
          <label>Method</label>
          <select
            name="method"
            value={httpFilters.method}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-item">
          <label>Status</label>
          <select
            name="statusCode"
            value={httpFilters.statusCode}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            {STATUS_PRESETS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value="200">200</option>
            <option value="400">400</option>
            <option value="401">401</option>
            <option value="403">403</option>
            <option value="404">404</option>
            <option value="500">500</option>
          </select>
        </div>
        <div className="filter-item">
          <label>Role</label>
          <input
            type="text"
            name="role"
            value={httpFilters.role}
            onChange={handleFilterChange}
            placeholder="agent, supervisor..."
          />
        </div>
        <div className="filter-item">
          <label>User ID</label>
          <input
            type="text"
            name="userId"
            value={httpFilters.userId}
            onChange={handleFilterChange}
            placeholder="UUID"
          />
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-item long">
          <label>Path contains</label>
          <input
            type="text"
            name="path"
            value={httpFilters.path}
            onChange={handleFilterChange}
            placeholder="/calls, /ticket, /auth..."
          />
        </div>
      </div>
    </>
  );

  const renderAuditFilters = () => (
    <>
      <div className="filter-row">
        <div className="filter-item">
          <label>Category</label>
          <select
            name="category"
            value={auditFilters.category}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            {AUDIT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-item">
          <label>Status</label>
          <select
            name="status"
            value={auditFilters.status}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            {AUDIT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-item">
          <label>Method</label>
          <select
            name="method"
            value={auditFilters.method}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-item">
          <label>Role</label>
          <input
            type="text"
            name="role"
            value={auditFilters.role}
            onChange={handleFilterChange}
            placeholder="admin, agent..."
          />
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-item">
          <label>Action</label>
          <input
            type="text"
            name="action"
            value={auditFilters.action}
            onChange={handleFilterChange}
            placeholder="login, assign, update..."
          />
        </div>
        <div className="filter-item">
          <label>User ID</label>
          <input
            type="text"
            name="userId"
            value={auditFilters.userId}
            onChange={handleFilterChange}
            placeholder="UUID"
          />
        </div>
        <div className="filter-item">
          <label>Entity Type</label>
          <input
            type="text"
            name="entityType"
            value={auditFilters.entityType}
            onChange={handleFilterChange}
            placeholder="ticket, user..."
          />
        </div>
        <div className="filter-item">
          <label>Entity ID</label>
          <input
            type="text"
            name="entityId"
            value={auditFilters.entityId}
            onChange={handleFilterChange}
            placeholder="Entity identifier"
          />
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-item long">
          <label>Search</label>
          <input
            type="text"
            name="search"
            value={auditFilters.search}
            onChange={handleFilterChange}
            placeholder="Search actor, action, message, request ID..."
          />
        </div>
        <div className="filter-item">
          <label>Request ID</label>
          <input
            type="text"
            name="requestId"
            value={auditFilters.requestId}
            onChange={handleFilterChange}
            placeholder="Correlation ID"
          />
        </div>
        <div className="filter-item">
          <label>Path contains</label>
          <input
            type="text"
            name="path"
            value={auditFilters.path}
            onChange={handleFilterChange}
            placeholder="/api/ticket/..."
          />
        </div>
      </div>
    </>
  );

  const renderHttpTable = () => (
    <table className="system-logs-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Method</th>
          <th>Path</th>
          <th>Status</th>
          <th>Duration (ms)</th>
          <th>User</th>
          <th>Role</th>
          <th>Request ID</th>
          <th>IP</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id}>
            <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}</td>
            <td>{log.method}</td>
            <td className="system-logs-path">{log.path}</td>
            <td>{log.statusCode}</td>
            <td>{log.durationMs ?? "-"}</td>
            <td>{log.userId ?? "-"}</td>
            <td>{log.role ?? "-"}</td>
            <td className="system-logs-request-id">{log.requestId ?? "-"}</td>
            <td>{log.ip ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderAuditTable = () => (
    <table className="system-logs-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Action</th>
          <th>Category</th>
          <th>Entity</th>
          <th>Status</th>
          <th>Actor</th>
          <th>Role</th>
          <th>Path</th>
          <th>Request ID</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id}>
            <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}</td>
            <td>
              <div className="system-logs-primary">{log.action || "-"}</div>
              <div className="system-logs-secondary">{log.message || "-"}</div>
            </td>
            <td>{log.category || "-"}</td>
            <td>
              {log.entityType || "-"}
              {log.entityId ? `: ${log.entityId}` : ""}
            </td>
            <td>
              <span
                className={`status-pill ${
                  log.status === "success"
                    ? "status-pill-success"
                    : "status-pill-failure"
                }`}
              >
                {log.status || "-"}
              </span>
            </td>
            <td>
              <div className="system-logs-primary">{log.actorName || log.userId || "-"}</div>
              <div className="system-logs-secondary">{log.actorEmail || "-"}</div>
            </td>
            <td>{log.role || "-"}</td>
            <td className="system-logs-path">{log.path || "-"}</td>
            <td className="system-logs-request-id">{log.requestId || "-"}</td>
            <td>
              <button
                className="details-button"
                onClick={() => setSelectedAuditLog(log)}
              >
                View
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="system-logs-page">
      <div className="system-logs-hero">
        <div className="system-logs-header">
          <span className="system-logs-eyebrow">Monitoring</span>
          <h2>System Logs</h2>
          <p>
            Review backend HTTP traffic and system audit events with correlation
            IDs, filters, and event details.
          </p>
        </div>
      </div>

      <div className="system-logs-tabs">
        <button
          className={activeTab === LOG_TYPES.AUDIT ? "active" : ""}
          onClick={() => setActiveTab(LOG_TYPES.AUDIT)}
        >
          Audit Logs
        </button>
        <button
          className={activeTab === LOG_TYPES.HTTP ? "active" : ""}
          onClick={() => setActiveTab(LOG_TYPES.HTTP)}
        >
          HTTP Logs
        </button>
      </div>

      <div className="system-logs-panel system-logs-filters">
        <div className="system-logs-panel-header">
          <div>
            <h3>Filters</h3>
            <p>Refine the current log view by time, actor, action, or endpoint.</p>
          </div>
        </div>
        {isHttpTab ? renderHttpFilters() : renderAuditFilters()}

        <div className="filter-row">
          <div className="filter-item">
            <label>Start date</label>
            <input
              type="date"
              name="startDate"
              value={currentFilters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-item">
            <label>End date</label>
            <input
              type="date"
              name="endDate"
              value={currentFilters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-actions">
            <button onClick={handleApplyFilters} disabled={loading}>
              Apply
            </button>
            <button onClick={handleResetFilters} disabled={loading}>
              Reset
            </button>
          </div>
        </div>

        {activeTab === LOG_TYPES.AUDIT && (
          <div className="system-logs-export-panel">{renderAuditExportActions()}</div>
        )}
      </div>

      <div className="system-logs-panel system-logs-table-panel">
        <div className="system-logs-panel-header">
          <div>
            <h3>{activeTabLabel}</h3>
            <p>{activeDescription}</p>
          </div>
          <span className="system-logs-summary-pill">{resultSummary}</span>
        </div>

        <div className="system-logs-table-wrapper">
        {loading ? (
          <div className="system-logs-loading">Loading logs...</div>
        ) : error ? (
          <div className="system-logs-error">{error}</div>
        ) : logs.length === 0 ? (
          <div className="system-logs-empty">
            <strong>No logs found</strong>
            <span>
              Try widening the date range or clearing some filters for{" "}
              {activeTabLabel.toLowerCase()}.
            </span>
          </div>
        ) : (
          isHttpTab ? renderHttpTable() : renderAuditTable()
        )}
        </div>

        <div className="system-logs-pagination">
          <div className="system-logs-page-size">
            <label htmlFor="system-logs-page-size">Rows per page</label>
            <select
              id="system-logs-page-size"
              value={pageSize}
              onChange={handlePageSizeChange}
              disabled={loading}
            >
              {LOG_PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => loadLogs(activeTab, page - 1, currentFilters)}
            disabled={!canPrev || loading}
          >
            ← Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => loadLogs(activeTab, page + 1, currentFilters)}
            disabled={!canNext || loading}
          >
            Next →
          </button>
        </div>
      </div>

      {selectedAuditLog && (
        <div
          className="audit-log-modal-backdrop"
          onClick={() => setSelectedAuditLog(null)}
        >
          <div
            className="audit-log-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="audit-log-modal-header">
              <div>
                <h3>Audit Event Details</h3>
                <p>{selectedAuditLog.action || "-"}</p>
              </div>
              <button onClick={() => setSelectedAuditLog(null)}>Close</button>
            </div>

            <div className="audit-log-detail-grid">
              <div>
                <strong>Actor</strong>
                <span>{selectedAuditLog.actorName || selectedAuditLog.userId || "-"}</span>
              </div>
              <div>
                <strong>Role</strong>
                <span>{selectedAuditLog.role || "-"}</span>
              </div>
              <div>
                <strong>Category</strong>
                <span>{selectedAuditLog.category || "-"}</span>
              </div>
              <div>
                <strong>Status</strong>
                <span>{selectedAuditLog.status || "-"}</span>
              </div>
              <div>
                <strong>Entity</strong>
                <span>
                  {selectedAuditLog.entityType || "-"}
                  {selectedAuditLog.entityId ? `: ${selectedAuditLog.entityId}` : ""}
                </span>
              </div>
              <div>
                <strong>Request ID</strong>
                <span>{selectedAuditLog.requestId || "-"}</span>
              </div>
            </div>

            <div className="audit-log-json-block">
              <strong>Message</strong>
              <pre>{selectedAuditLog.message || "-"}</pre>
            </div>

            <div className="audit-log-json-row">
              <div className="audit-log-json-block">
                <strong>Before State</strong>
                <pre>{JSON.stringify(selectedAuditLog.beforeState || {}, null, 2)}</pre>
              </div>
              <div className="audit-log-json-block">
                <strong>After State</strong>
                <pre>{JSON.stringify(selectedAuditLog.afterState || {}, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  );
}

