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
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function VoiceNoteReport() {
  const [activeTab, setActiveTab] = useState(0);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 10;

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [playedFilter, setPlayedFilter] = useState("all");
  const [disposition, setDisposition] = useState("all");
  const [audioUrls, setAudioUrls] = useState({});

  const safe = (v) => (v === null || v === undefined || v === "" ? "-" : v);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const endpoint =
        activeTab === 0
          ? `${baseURL}/reports/voice-note-report/${startDate}/${endDate}`
          : `${baseURL}/reports/cdr-report/${startDate}/${endDate}/${disposition}`;

      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!res.ok) throw new Error("Failed to load reports");
      setReports(await res.json());
    } catch (err) {
      setSnackbarMessage("Error loading reports");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchSearch = (r.clid || "").toLowerCase().includes(search.toLowerCase());

    if (activeTab === 0) {
      if (playedFilter === "played") return matchSearch && r.is_played;
      if (playedFilter === "not_played") return matchSearch && !r.is_played;
    }
    return matchSearch;
  });

  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const currentReports = filteredReports.slice(
    (currentPage - 1) * reportsPerPage,
    currentPage * reportsPerPage
  );

  const loadAudio = async (id) => {
    if (audioUrls[id]) return;
    try {
      const res = await fetch(`${baseURL}/voice-notes/${id}/audio`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!res.ok) throw new Error("Audio fetch failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrls((prev) => ({ ...prev, [id]: url }));
    } catch (err) {
      console.error("Audio error:", err);
      alert("Unable to play audio");
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(activeTab === 0 ? "Voice Note Report" : "CDR Report", 14, 14);

    autoTable(doc, {
      startY: 22,
      head: [
        activeTab === 0
          ? ["#", "Phone", "Date", "Played", "Agent", "Duration", "Transcription"]
          : [
              "#",
              "Caller ID",
              "Source",
              "Destination",
              "Start Time",
              "Duration",
              "Billsec",
              "Disposition",
            ],
      ],
      body: filteredReports.map((r, i) =>
        activeTab === 0
          ? [
              i + 1,
              safe(r.clid),
              r.created_at ? new Date(r.created_at).toLocaleString() : "-",
              r.is_played ? "Yes" : "No",
              r.assigned_agent_id ? `Agent #${r.assigned_agent_id}` : "-",
              safe(r.duration_seconds),
              safe(r.transcription),
            ]
          : [
              i + 1,
              safe(r.clid),
              safe(r.src),
              safe(r.dst),
              r.cdrstarttime
                ? new Date(r.cdrstarttime).toLocaleString()
                : "-",
              safe(r.duration),
              safe(r.billsec),
              safe(r.disposition),
            ]
      ),
    });

    doc.save("call_center_report.pdf");
  };

  return (
    <div className="user-table-container">
      <h2 className="table-title">Call Center Reports</h2>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
        <Tab label="Voice Note Report" />
        <Tab label="CDR Report" />
      </Tabs>

      <div className="controls" style={{ gap: 8 }}>
        <TextField type="date" label="Start Date" InputLabelProps={{ shrink: true }} size="small" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <TextField type="date" label="End Date" InputLabelProps={{ shrink: true }} size="small" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

        {activeTab === 0 ? (
          <FormControl size="small">
            <InputLabel>Played</InputLabel>
            <Select value={playedFilter} label="Played" onChange={(e) => setPlayedFilter(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="played">Played</MenuItem>
              <MenuItem value="not_played">Not Played</MenuItem>
            </Select>
          </FormControl>
        ) : (
          <FormControl size="small">
            <InputLabel>Disposition</InputLabel>
            <Select value={disposition} label="Disposition" onChange={(e) => setDisposition(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="ANSWERED">Answered</MenuItem>
              <MenuItem value="NO ANSWER">No Answer</MenuItem>
              <MenuItem value="BUSY">Busy</MenuItem>
              <MenuItem value="FAILED">Failed</MenuItem>
            </Select>
          </FormControl>
        )}

        <Button variant="contained" onClick={fetchReports} disabled={!startDate || !endDate}>
          Load
        </Button>

        <Button variant="outlined" onClick={handleExportPDF} disabled={!filteredReports.length}>
          Export PDF
        </Button>

        <input className="search-input" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <table className="user-table">
        <thead>
          {activeTab === 0 ? (
            <tr>
              <th>#</th>
              <th>Phone</th>
              <th>Date</th>
              <th>Audio</th>
              <th>Played</th>
              <th>Agent</th>
              <th>Duration</th>
              <th>Transcription</th>
            </tr>
          ) : (
            <tr>
              <th>#</th>
              <th>Caller</th>
              <th>Src</th>
              <th>Dst</th>
              <th>Start</th>
              <th>Dur</th>
              <th>Bill</th>
              <th>Status</th>
            </tr>
          )}
        </thead>

       <tbody>
  {loading ? (
    <tr><td colSpan={8}>Loading…</td></tr>
  ) : currentReports.length === 0 ? (
    <tr><td colSpan={8}>No records found</td></tr>
  ) : (
    currentReports.map((r, i) => (
      <tr key={r.id}>
        <td>{(currentPage - 1) * reportsPerPage + i + 1}</td>
        <td>{safe(r.clid)}</td>
        <td>{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</td>
        <td>
          {audioUrls[r.id] ? (
            <audio controls src={audioUrls[r.id]} style={{ width: 160 }} />
          ) : (
            <button onClick={() => loadAudio(r.id)} style={{ padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>
              ▶ Load & Play
            </button>
          )}
        </td>
        <td>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 6,
              backgroundColor: r.is_played ? "#4caf50" : "#ff9800",
              color: "#fff",
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            {r.is_played ? "Yes" : "No"}
          </span>
        </td>

       <td>
  {r.assigned_extension
    ? `Ext ${r.assigned_extension}${r.assigned_agent_name ? ` (${r.assigned_agent_name})` : ""}`
    : "-"}
</td>

        <td>{safe(r.duration_seconds)}</td>
        <td>{safe(r.transcription)}</td>
      </tr>
    ))
  )}
</tbody>

      </table>

      <div className="pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
        <span>Page {currentPage} / {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
      </div>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity={snackbarSeverity}>{snackbarMessage}</Alert>
      </Snackbar>
    </div>
  );
}
