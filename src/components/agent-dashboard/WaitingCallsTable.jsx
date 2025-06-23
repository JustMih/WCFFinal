import React, { useEffect, useState, useRef } from "react";
import { MdOutlinePhoneInTalk } from "react-icons/md";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import PropTypes from "prop-types";
import "./WaitingCallsTable.css";
import * as XLSX from "xlsx";

// WaitingCallsTable.jsx
// Card component to display waiting calls from the call center queue.
// Fetches data from http://10.52.0.19:5075/api/queue-call-stats and displays caller, position, queue, wait time, and timestamp.
// Uses Material UI components for layout and styling.

const API_URL = "http://10.52.0.19:5075/api/queue-call-stats";

export default function WaitingCallsTable() {
  const [waitingCalls, setWaitingCalls] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const allRowsRef = useRef([]);

  // Fetch waiting calls
  const fetchCalls = () => {
    setLoading(true);
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch waiting calls");
        return res.json();
      })
      .then((data) => {
        const inQueue = Array.isArray(data.inQueue) ? data.inQueue : [];
        const dropped = Array.isArray(data.dropped) ? data.dropped.map(call => ({...call, status: "Dropped"})) : [];
        const lost = Array.isArray(data.lost) ? data.lost.map(call => ({...call, status: "Lost"})) : [];
        // Sort by leftAt descending (most recent first)
        let combined = [...dropped, ...lost];
        combined.sort((a, b) => new Date(b.leftAt) - new Date(a.leftAt));
        const recent = combined.slice(0, 3);
        setWaitingCalls(inQueue);
        setRecentCalls(recent);
        // Prepare all rows for export
        const allRows = [
          ...inQueue.map(call => ({
            status: "Active",
            caller: call.caller,
            queue: call.queue,
            waitSeconds: call.waitSeconds,
            time: call.joinedAt || call.timestamp || ""
          })),
          ...recent.map(call => ({
            status: call.status,
            caller: call.caller,
            queue: call.queue,
            waitSeconds: call.waitSeconds,
            time: call.leftAt || call.joinedAt || call.timestamp || ""
          }))
        ];
        allRowsRef.current = allRows;
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCalls();
    const interval = setInterval(fetchCalls, 10000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Format time as HH:mm:ss
  const formatTime = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  // Export to Excel
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      allRowsRef.current.map(row => ({
        Status: row.status,
        Caller: row.caller,
        Queue: row.queue,
        "Wait Time (s)": row.waitSeconds,
        Time: formatTime(row.time)
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "WaitingCalls");
    XLSX.writeFile(wb, "waiting_calls.xlsx");
  };

  return (
    <div className="waiting-calls-table-card">
      <div className="waiting-calls-header-row">
        <div className="waiting-calls-title">
          <MdOutlinePhoneInTalk />
          <h4>Waiting Calls</h4>
        </div>
        <button className="export-btn" onClick={handleExportExcel}>Export to Excel</button>
      </div>
      <div className="waiting-calls-table-wrapper">
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <div className="waiting-calls-error">{error}</div>
        ) : waitingCalls.length > 0 ? (
          <table className="waiting-calls-table">
            <thead>
              <tr>
                <th>Caller</th>
                <th>Queue</th>
                <th>Wait Time (s)</th>
                <th>Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {waitingCalls.map((call, idx) => (
                <tr key={call.joinedAt || idx} className={idx % 2 === 0 ? "even-row" : "odd-row"}>
                  <td>
                    <span className="caller-badge">{call.caller}</span>
                  </td>
                  <td>{call.queue}</td>
                  <td>{call.waitSeconds != null ? call.waitSeconds.toFixed(1) : "-"}</td>
                  <td>{formatTime(call.joinedAt)}</td>
                  <td>
                    <span className="caller-badge active-status">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : recentCalls.length > 0 ? (
          <table className="waiting-calls-table">
            <thead>
              <tr>
                <th>Caller</th>
                <th>Queue</th>
                <th>Wait Time (s)</th>
                <th>Left At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentCalls.map((call, idx) => (
                <tr key={call.leftAt || idx} className={idx % 2 === 0 ? "even-row" : "odd-row"}>
                  <td>
                    <span className="caller-badge">{call.caller}</span>
                  </td>
                  <td>{call.queue}</td>
                  <td>{call.waitSeconds != null ? call.waitSeconds.toFixed(1) : "-"}</td>
                  <td>{formatTime(call.leftAt)}</td>
                  <td>
                    <span className={`caller-badge ${call.status === "Dropped" ? "top-position" : ""}${call.status === "Lost" ? " lost-status" : ""}`}>{call.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="waiting-calls-empty">No waiting or recent calls.</div>
        )}
      </div>
    </div>
  );
}

export function WaitingCallsTableCard() {
  return <WaitingCallsTable />;
}

WaitingCallsTable.propTypes = {};
WaitingCallsTableCard.propTypes = {}; 