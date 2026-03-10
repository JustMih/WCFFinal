import React, { useEffect, useState } from "react";
import { fetchHttpLogs } from "../../api/logsApi";
import "./SystemLogsPage.css";

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];
const STATUS_PRESETS = ["2xx", "3xx", "4xx", "5xx"];

export default function SystemLogsPage() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    method: "",
    statusCode: "",
    role: "",
    userId: "",
    path: "",
    startDate: "",
    endDate: "",
  });

  const loadLogs = async (pageOverride) => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page: pageOverride || page,
        pageSize,
      };
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const data = await fetchHttpLogs(params);
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
    loadLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    loadLogs(1);
  };

  const handleResetFilters = () => {
    setFilters({
      method: "",
      statusCode: "",
      role: "",
      userId: "",
      path: "",
      startDate: "",
      endDate: "",
    });
    setPage(1);
    loadLogs(1);
  };

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="system-logs-page">
      <div className="system-logs-header">
        <h2>System HTTP Logs</h2>
        <p>View and filter backend HTTP request logs (admin only).</p>
      </div>

      <div className="system-logs-filters">
        <div className="filter-row">
          <div className="filter-item">
            <label>Method</label>
            <select
              name="method"
              value={filters.method}
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
              value={filters.statusCode}
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
              value={filters.role}
              onChange={handleFilterChange}
              placeholder="agent, supervisor..."
            />
          </div>
          <div className="filter-item">
            <label>User ID</label>
            <input
              type="text"
              name="userId"
              value={filters.userId}
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
              value={filters.path}
              onChange={handleFilterChange}
              placeholder="/calls, /ticket, /auth..."
            />
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-item">
            <label>Start date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-item">
            <label>End date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
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

      <div className="system-logs-table-wrapper">
        {loading ? (
          <div className="system-logs-loading">Loading logs...</div>
        ) : error ? (
          <div className="system-logs-error">{error}</div>
        ) : logs.length === 0 ? (
          <div className="system-logs-empty">No logs found.</div>
        ) : (
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
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    {log.createdAt
                      ? new Date(log.createdAt).toLocaleString()
                      : "-"}
                  </td>
                  <td>{log.method}</td>
                  <td className="system-logs-path">{log.path}</td>
                  <td>{log.statusCode}</td>
                  <td>{log.durationMs ?? "-"}</td>
                  <td>{log.userId ?? "-"}</td>
                  <td>{log.role ?? "-"}</td>
                  <td>{log.ip ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="system-logs-pagination">
        <button
          onClick={() => loadLogs(page - 1)}
          disabled={!canPrev || loading}
        >
          ← Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => loadLogs(page + 1)}
          disabled={!canNext || loading}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

