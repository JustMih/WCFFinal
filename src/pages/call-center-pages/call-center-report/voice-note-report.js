import React, { useRef, useState } from "react";
import { baseURL } from "../../../config";
import ReportDateRangePicker from "../../../components/shared/ReportDateRangePicker";
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
import WcfLoader from "../../../components/shared/WcfLoader";
import { markVoiceNotePlayed } from "../../../utils/voiceNotePlayed";
import { getVoiceNoteAudioUrls } from "../../../utils/voiceNoteAudio";
import { formatSecondsToMinutes } from "../../../utils/callDurationFormat";

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
  const markedPlayedRef = useRef(new Set());

  const safe = (v) => (v === null || v === undefined || v === "" ? "-" : v);
  const isPlayedNote = (r) => Number(r.is_played) === 1;

  const updateReportRow = (id, patch) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  const persistPlayed = async (record, audioEl) => {
    if (!record?.id || markedPlayedRef.current.has(record.id)) return;

    const durationSec =
      audioEl?.duration && !Number.isNaN(audioEl.duration)
        ? Math.round(audioEl.duration)
        : null;

    if (!localStorage.getItem("authToken")) {
      setSnackbarMessage("Log in to save played status to the database.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    try {
      await markVoiceNotePlayed(record.id, durationSec);
      markedPlayedRef.current.add(record.id);
      updateReportRow(record.id, {
        is_played: 1,
        duration_seconds: record.duration_seconds || durationSec || null,
      });
      setSnackbarMessage("Marked as played.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage(err.message || "Could not save played status.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

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
      if (playedFilter === "played") return matchSearch && isPlayedNote(r);
      if (playedFilter === "not_played") return matchSearch && !isPlayedNote(r);
    }
    return matchSearch;
  });

  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const currentReports = filteredReports.slice(
    (currentPage - 1) * reportsPerPage,
    currentPage * reportsPerPage
  );

  const loadAudio = async (record) => {
    const id = record.id;
    if (audioUrls[id]) return;

    const token = localStorage.getItem("authToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const urls = getVoiceNoteAudioUrls(record);

    for (const audioUrl of urls) {
      try {
        const res = await fetch(audioUrl, { headers });
        if (!res.ok) continue;
        const blob = await res.blob();
        if (!blob.size) continue;
        setAudioUrls((prev) => ({ ...prev, [id]: URL.createObjectURL(blob) }));
        return;
      } catch {
        /* try next URL */
      }
    }

    setSnackbarMessage(
      "Audio not found. If using local API, set serverURL in config.js to the server that hosts voice files (e.g. 192.168.21.69:5070)."
    );
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(activeTab === 0 ? "Voice Note Report" : "CDR Report", 14, 14);

    autoTable(doc, {
      startY: 22,
      head: [
        activeTab === 0
          ? ["#", "Phone", "Date", "Played", "Agent"]
          : [
              "#",
              "Caller ID",
              "Source",
              "Destination",
              "Agent",
              "Start Time",
              "Duration (min)",
              "Billed (min)",
              "Disposition",
            ],
      ],
      body: filteredReports.map((r, i) =>
        activeTab === 0
          ? [
              i + 1,
              safe(r.clid),
              r.created_at ? new Date(r.created_at).toLocaleString() : "-",
              isPlayedNote(r) ? "Yes" : "No",
              r.assigned_agent_id ? `Agent #${r.assigned_agent_id}` : "-",
            ]
          : [
              i + 1,
              safe(r.clid),
              safe(r.src),
              safe(r.dst),
              r.agent_name || "-",
              r.cdrstarttime
                ? new Date(r.cdrstarttime).toLocaleString()
                : "-",
              formatSecondsToMinutes(r.duration, false),
              formatSecondsToMinutes(r.billsec, false),
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

      <div className="controls report-filters-row" style={{ gap: 8 }}>
        <ReportDateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          disabled={loading}
        />

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

        <Button variant="contained" onClick={fetchReports} disabled={loading || !startDate || !endDate}>
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
    <tr>
      <td colSpan={activeTab === 0 ? 6 : 8}>
        <div className="wcf-loading-container">
          <WcfLoader
            size="md"
            message={activeTab === 0 ? "Loading voice note report..." : "Loading CDR report..."}
            label={activeTab === 0 ? "Loading voice note report" : "Loading CDR report"}
          />
        </div>
      </td>
    </tr>
  ) : currentReports.length === 0 ? (
    <tr><td colSpan={activeTab === 0 ? 6 : 8}>No records found</td></tr>
  ) : (
    currentReports.map((r, i) => (
      <tr key={r.id}>
        <td>{(currentPage - 1) * reportsPerPage + i + 1}</td>
        <td>{safe(r.clid)}</td>
        <td>{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</td>
        <td>
          {audioUrls[r.id] ? (
            <audio
              controls
              src={audioUrls[r.id]}
              style={{ width: 160 }}
              onLoadedMetadata={(e) => {
                const dur = Math.round(e.currentTarget.duration || 0);
                if (dur > 0 && !r.duration_seconds) {
                  updateReportRow(r.id, { duration_seconds: dur });
                }
              }}
              onPlay={(e) => persistPlayed(r, e.currentTarget)}
            />
          ) : (
            <button onClick={() => loadAudio(r)} style={{ padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>
              ▶ Load & Play
            </button>
          )}
        </td>
        <td>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 6,
              backgroundColor: isPlayedNote(r) ? "#4caf50" : "#ff9800",
              color: "#fff",
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            {isPlayedNote(r) ? "Yes" : "No"}
          </span>
        </td>

       <td>
  {r.assigned_extension
    ? `Ext ${r.assigned_extension}${r.assigned_agent_name ? ` (${r.assigned_agent_name})` : ""}`
    : "-"}
</td>
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
