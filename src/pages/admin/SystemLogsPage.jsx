import React, { useEffect, useMemo, useState } from "react";
import { fetchAuditLogs, fetchHttpLogs } from "../../api/logsApi";
import "./SystemLogsPage.css";

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
  const [error, setError] = useState("");
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [httpFilters, setHttpFilters] = useState(createHttpFilters);
  const [auditFilters, setAuditFilters] = useState(createAuditFilters);

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
              {[10, 20, 50, 100].map((size) => (
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

            <div className="audit-log-json-block">
              <strong>Metadata</strong>
              <pre>{JSON.stringify(selectedAuditLog.metadata || {}, null, 2)}</pre>
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
    </div>
  );
}

