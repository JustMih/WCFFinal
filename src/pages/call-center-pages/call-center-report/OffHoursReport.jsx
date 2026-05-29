import React, { useEffect, useState } from "react";
import { FiPhoneCall } from "react-icons/fi";
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
  Box,
  Chip,
  Tooltip,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  buildHolidaySet,
  filterOffHoursRecords,
  buildSummary,
} from "../../../utils/offHoursHelper";
import { playVoiceNoteAudio } from "../../../utils/voiceNoteAudio";
import { markVoiceNotePlayed } from "../../../utils/voiceNotePlayed";
import {
  enrichRecordClient,
  buildEmergencyMap,
} from "../../../utils/offHoursReportClient";
import {
  isPendingCallback,
  getCallbackPhone,
  markMissedCallCalledBack,
  normalizeCallbackStatus,
  callbackStatusLabel,
  formatOutboundNumber,
} from "../../../utils/missedCallActions";
import { useSipPhone } from "../call-center-dashboard/agents-dashboard/useSipPhone";
import "./OffHoursReport.css";
import WcfLoader from "../../../components/shared/WcfLoader";

const SIP_DOMAIN = "192.168.21.69";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
});

async function fetchOffHoursFallback(startDate, endDate, source) {
  const holidaysRes = await fetch(`${baseURL}/holidays`, {
    headers: authHeaders(),
  });
  const holidays = holidaysRes.ok ? await holidaysRes.json() : [];

  let rawRecords = [];
  let timestampField = "created_at";

  if (source === "missed-calls") {
    timestampField = "time";
    const [dataRes, emergencyRes, cdrRes] = await Promise.all([
      fetch(
        `${baseURL}/missed-calls?startDate=${startDate}&endDate=${endDate}`,
        { headers: authHeaders() }
      ),
      fetch(`${baseURL}/emergency`, { headers: authHeaders() }),
      fetch(
        `${baseURL}/reports/cdr-report/${startDate}/${endDate}/all`,
        { headers: authHeaders() }
      ),
    ]);
    if (!dataRes.ok) throw new Error("Failed to load missed calls");
    rawRecords = await dataRes.json();
    const emergencyList = emergencyRes.ok ? await emergencyRes.json() : [];
    const cdrLegs = cdrRes.ok ? await cdrRes.json() : [];
    const holidayDates = buildHolidaySet(holidays);
    const filtered = filterOffHoursRecords(
      rawRecords,
      timestampField,
      holidayDates
    );
    const emergencyByPhone = buildEmergencyMap(emergencyList);
    const records = filtered.map((r) => {
      const caller = r.caller || r.caller_display;
      const enriched = enrichRecordClient(
        { ...r, clid: caller, src: caller, cdrstarttime: r.time },
        emergencyByPhone,
        "cdr"
      );
      return {
        ...r,
        caller_display: caller,
        call_source: caller,
        callback_status: r.status,
        callback_agent_name: r.agent_name,
        callback_time: r.called_back_at,
        callback_agent_extension: r.called_back_by,
        call_destination:
          enriched.routed_to || cdrLegs.find((c) => c.dst)?.dst || "—",
        destination: enriched.routed_to || "—",
        emergency_number: enriched.routed_to || "—",
        emergency_number_label: enriched.routed_to_label,
        routed_to: enriched.routed_to,
        routed_to_label: enriched.routed_to_label,
      };
    });
    return { summary: buildSummary(records), records };
  } else {
    const [emergencyRes, dataRes] = await Promise.all([
      fetch(`${baseURL}/emergency`, { headers: authHeaders() }),
      fetch(
        source === "cdr"
          ? `${baseURL}/reports/cdr-report/${startDate}/${endDate}/all`
          : `${baseURL}/reports/voice-note-report/${startDate}/${endDate}`,
        { headers: authHeaders() }
      ),
    ]);
    const emergencyList = emergencyRes.ok ? await emergencyRes.json() : [];
    if (dataRes.ok) {
      rawRecords = await dataRes.json();
    } else if (dataRes.status !== 404) {
      throw new Error("Failed to load report data");
    }
    timestampField = source === "cdr" ? "cdrstarttime" : "created_at";
    const holidayDates = buildHolidaySet(holidays);
    const filtered = filterOffHoursRecords(
      rawRecords,
      timestampField,
      holidayDates
    );
    const emergencyByPhone = buildEmergencyMap(emergencyList);
    const records = filtered.map((r) =>
      enrichRecordClient(r, emergencyByPhone, source)
    );
    return { summary: buildSummary(records), records };
  }

  const holidayDates = buildHolidaySet(holidays);
  const filtered = filterOffHoursRecords(
    rawRecords,
    timestampField,
    holidayDates
  );
  const records = filtered.map((r) => ({
    ...r,
    caller_display: r.caller,
    callback_status: r.status,
    callback_agent_name: r.agent_name,
    callback_time: r.called_back_at,
    callback_agent_extension: r.called_back_by,
  }));

  return { summary: buildSummary(records), records };
}

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "public_holiday", label: "Public Holiday" },
  { value: "sunday", label: "Sunday" },
  { value: "saturday_outside_hours", label: "Saturday (Outside Hours)" },
  { value: "weekday_after_hours", label: "Weekday After Hours" },
];

const CATEGORY_COLORS = {
  public_holiday: "#e91e63",
  sunday: "#9c27b0",
  saturday_outside_hours: "#ff9800",
  weekday_after_hours: "#2196f3",
};

const SUMMARY_CARDS = [
  { key: "total", label: "Total Off-Hours", color: "#374151" },
  { key: "public_holiday", label: "Public Holiday", color: "#e91e63" },
  { key: "sunday", label: "Sunday", color: "#9c27b0" },
  { key: "saturday_outside_hours", label: "Saturday", color: "#ff9800" },
  { key: "weekday_after_hours", label: "After Work Hours", color: "#2196f3" },
];

const MISSED_CALL_SUMMARY_CARDS = [
  { key: "callbacks_pending", label: "Pending Callback", color: "#ef4444" },
  { key: "callbacks_done", label: "Called Back", color: "#22c55e" },
];

const SOURCE_LABELS = {
  cdr: "CDR",
  "voice-notes": "Voice Notes",
  "missed-calls": "Missed Calls",
};

const CALLBACK_STATUS_COLORS = {
  pending: "#ef4444",
  called_back: "#22c55e",
  ignored: "#9ca3af",
};

const missedCallSource = (r) =>
  r.call_source || r.caller_display || r.caller_phone || r.caller || "—";

const missedCallDestination = (r) =>
  r.call_destination || r.destination || r.cdr_dst || r.cdr_did || "—";

const missedCallEmergency = (r) =>
  r.emergency_number_label ||
  r.emergency_number ||
  r.routed_to_label ||
  r.routed_to ||
  "—";

export default function OffHoursReport() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(10);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [source, setSource] = useState("voice-notes");
  const [playedStatus, setPlayedStatus] = useState({});
  const [currentAudio, setCurrentAudio] = useState(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);
  const [callingBackId, setCallingBackId] = useState(null);

  const extension = localStorage.getItem("extension");
  const sipPassword = localStorage.getItem("sipPassword");
  const sipReady = Boolean(extension && sipPassword);

  const { phoneStatus, remoteAudioRef, redial, endCall } = useSipPhone({
    extension: sipReady ? extension : null,
    sipPassword: sipReady ? sipPassword : null,
    SIP_DOMAIN,
    allowIncomingRinging: false,
  });

  useEffect(() => {
    if (phoneStatus === "Idle" || phoneStatus === "Call Failed") {
      setCallingBackId(null);
    }
  }, [phoneStatus]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = `${baseURL}/reports/off-hours-report/${startDate}/${endDate}?source=${source}`;
      const response = await fetch(endpoint, {
        method: "GET",
        headers: authHeaders(),
      });

      let data;
      if (response.status === 404) {
        data = await fetchOffHoursFallback(startDate, endDate, source);
      } else if (!response.ok) {
        throw new Error("Failed to fetch off-hours report");
      } else {
        data = await response.json();
      }

      const loadedRecords = data.records || [];
      setRecords(loadedRecords);
      setSummary(data.summary || null);

      if (source === "voice-notes") {
        const storedPlayed =
          JSON.parse(localStorage.getItem("playedVoiceNotes")) || {};
        const validPlayed = {};
        loadedRecords.forEach((note) => {
          if (storedPlayed[note.id] || note.is_played) {
            validPlayed[note.id] = true;
          }
        });
        setPlayedStatus(validPlayed);
      }
    } catch (err) {
      setError(err.message);
      setSnackbarMessage("Error loading off-hours report.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter((record) => {
    const phone = (
      record.caller_display ||
      record.caller_phone ||
      record.clid ||
      record.src ||
      ""
    ).toLowerCase();
    const routed = (record.routed_to_label || record.routed_to || "").toLowerCase();
    const dest = missedCallDestination(record).toLowerCase();
    const emergency = missedCallEmergency(record).toLowerCase();
    const term = search.toLowerCase();
    const matchesSearch =
      phone.includes(term) ||
      routed.includes(term) ||
      dest.includes(term) ||
      emergency.includes(term);
    const matchesCategory =
      categoryFilter === "all" || record.off_hours_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const indexOfLast = currentPage * reportsPerPage;
  const indexOfFirst = indexOfLast - reportsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / reportsPerPage)
  );

  const getTimestamp = (record) =>
    record.time || record.created_at || record.cdrstarttime;

  const handleCallBack = async (record) => {
    const phone = getCallbackPhone(record);
    if (!phone) {
      setSnackbarMessage("No phone number for this missed call.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    if (!sipReady) {
      setSnackbarMessage(
        "SIP phone not ready. Open the Agent Dashboard and log in with your extension first."
      );
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    setCallingBackId(record.id);
    try {
      await markMissedCallCalledBack(record.id, extension);
      setRecords((prev) =>
        prev.map((r) =>
          r.id === record.id
            ? {
                ...r,
                status: "called_back",
                callback_status: "called_back",
                callback_agent_extension: extension,
                callback_time: new Date().toISOString(),
              }
            : r
        )
      );
      redial(formatOutboundNumber(phone) || phone);
      setSnackbarMessage(`Calling back ${phone}...`);
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
    } catch (err) {
      setCallingBackId(null);
      setSnackbarMessage(err.message || "Could not start callback.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const renderCallbackStatus = (record) => {
    const status = normalizeCallbackStatus(record);
    return (
      <Chip
        label={callbackStatusLabel(status)}
        size="small"
        sx={{
          backgroundColor: CALLBACK_STATUS_COLORS[status] || "#666",
          color: "#fff",
          fontWeight: "bold",
        }}
      />
    );
  };

  const isNotePlayed = (note) =>
    playedStatus[note.id] || note.is_played;

  const handlePlayVoice = async (record) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    try {
      const { audio } = await playVoiceNoteAudio(record);
      setCurrentAudio(audio);
      setCurrentlyPlayingId(record.id);

      try {
        await markVoiceNotePlayed(record.id, audio.duration);
        setRecords((prev) =>
          prev.map((r) =>
            r.id === record.id
              ? {
                  ...r,
                  is_played: 1,
                  duration_seconds:
                    r.duration_seconds || Math.round(audio.duration || 0),
                }
              : r
          )
        );
      } catch (markErr) {
        console.warn("Could not save played status:", markErr);
      }

      const updatedStatus = { ...playedStatus, [record.id]: true };
      setPlayedStatus(updatedStatus);
      localStorage.setItem("playedVoiceNotes", JSON.stringify(updatedStatus));

      audio.onended = () => {
        setCurrentlyPlayingId(null);
        setCurrentAudio(null);
      };
    } catch (playError) {
      console.error("Error playing audio:", playError);
      setSnackbarMessage(
        "Audio is on the server — not available from local API. Try static URL or use live config."
      );
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
    }
  };

  const handlePauseVoice = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentlyPlayingId(null);
    }
  };

  const getRowColor = (note) => {
    if (isNotePlayed(note)) return "#d4edda";
    const createdAt = new Date(note.created_at);
    const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursAgo >= 24 ? "#f8d7da" : "#fff3cd";
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Off-Hours Calls Report", 14, 14);
    doc.setFontSize(10);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 22);
    doc.text(`Source: ${SOURCE_LABELS[source] || source}`, 14, 28);
    if (categoryFilter !== "all") {
      doc.text(
        `Category: ${CATEGORY_OPTIONS.find((c) => c.value === categoryFilter)?.label}`,
        14,
        34
      );
    }

    if (source === "cdr") {
      autoTable(doc, {
        startY: 40,
        head: [
          [
            "Sn",
            "Source",
            "Routed To",
            "Date/Time",
            "Category",
            "Disposition",
            "Duration (s)",
          ],
        ],
        body: filteredRecords.map((r, idx) => [
          idx + 1,
          r.caller_display || r.clid || "-",
          r.routed_to_label || r.routed_to || "-",
          getTimestamp(r) ? new Date(getTimestamp(r)).toLocaleString() : "-",
          r.off_hours_label || "-",
          r.disposition || "-",
          r.duration || "-",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [245, 158, 66] },
      });
    } else if (source === "missed-calls") {
      autoTable(doc, {
        startY: 40,
        head: [
          [
            "Sn",
            "Source",
            "Destination",
            "Emergency Number",
            "Date/Time",
            "Category",
            "Callback Status",
            "Called Back By",
            "Callback Time",
          ],
        ],
        body: filteredRecords.map((r, idx) => [
          idx + 1,
          missedCallSource(r),
          missedCallDestination(r),
          missedCallEmergency(r),
          getTimestamp(r) ? new Date(getTimestamp(r)).toLocaleString() : "-",
          r.off_hours_label || "-",
          r.callback_status || r.status || "-",
          r.callback_agent_name ||
            r.callback_agent_extension ||
            "-",
          r.callback_time
            ? new Date(r.callback_time).toLocaleString()
            : "-",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [245, 158, 66] },
      });
    } else {
      autoTable(doc, {
        startY: 40,
        head: [["Sn", "Phone", "Date/Time", "Category", "Played", "Duration (s)"]],
        body: filteredRecords.map((r, idx) => [
          idx + 1,
          r.caller_display || r.clid || "-",
          r.routed_to_label || r.routed_to || "-",
          getTimestamp(r) ? new Date(getTimestamp(r)).toLocaleString() : "-",
          r.off_hours_label || "-",
          isNotePlayed(r) ? "Yes" : "No",
          r.duration_seconds || "-",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [245, 158, 66] },
      });
    }

    doc.save(`off_hours_report_${startDate}_to_${endDate}.pdf`);
  };

  return (
    <div className="off-hours-container">
      <h2 className="off-hours-title">Off-Hours Calls Report</h2>
      <p className="off-hours-subtitle">
        Weekend, public holiday, and after-work activity (Mon–Fri before 08:00 or
        after 20:00, Sat before 09:00 or after 13:00, all day Sunday &amp;
        holidays). Use <strong>Missed Calls</strong> to see callers who need a
        callback and mark when returned.
      </p>

      {summary && (
        <div className="off-hours-summary">
          {[
            ...SUMMARY_CARDS,
            ...(source === "missed-calls" ? MISSED_CALL_SUMMARY_CARDS : []),
          ].map((card) => (
            <div
              key={card.key}
              className="off-hours-summary-card"
              style={{ borderTopColor: card.color }}
            >
              <div className="off-hours-summary-value">
                {summary[card.key] ?? 0}
              </div>
              <div className="off-hours-summary-label">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="off-hours-controls">
        <TextField
          type="date"
          label="Start Date"
          InputLabelProps={{ shrink: true }}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          size="small"
        />
        <TextField
          type="date"
          label="End Date"
          InputLabelProps={{ shrink: true }}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          size="small"
        />
        <FormControl size="small" style={{ minWidth: 140 }}>
          <InputLabel>Source</InputLabel>
          <Select
            value={source}
            label="Source"
            onChange={(e) => setSource(e.target.value)}
          >
            <MenuItem value="voice-notes">Voice Notes</MenuItem>
            <MenuItem value="cdr">CDR</MenuItem>
            <MenuItem value="missed-calls">Missed Calls</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" style={{ minWidth: 180 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            if (!startDate || !endDate) {
              setSnackbarMessage("Please select both start and end dates.");
              setSnackbarSeverity("warning");
              setSnackbarOpen(true);
              return;
            }
            setCurrentPage(1);
            fetchReport();
          }}
          disabled={!startDate || !endDate}
        >
          Load Report
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleExportPDF}
          disabled={filteredRecords.length === 0}
        >
          Export PDF
        </Button>
        <input
          type="text"
          placeholder="Search by phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="off-hours-search"
        />
      </div>

      {error && <div className="off-hours-error">{error}</div>}

      {source === "missed-calls" && phoneStatus !== "Idle" && (
        <div className="off-hours-phone-status">
          <span>Phone: {phoneStatus}</span>
          <Button size="small" variant="outlined" onClick={() => endCall()}>
            Hang up
          </Button>
        </div>
      )}

      <audio ref={remoteAudioRef} autoPlay style={{ display: "none" }} />

      <div className="off-hours-table-wrapper">
        {loading && (
          <div className="wcf-loading-container">
            <WcfLoader size="lg" message="Loading report..." label="Loading report" />
          </div>
        )}
        {source === "missed-calls" ? (
          <table className="off-hours-table">
            <thead>
              <tr>
                <th>Sn</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Emergency Number</th>
                <th>Date/Time</th>
                <th>Category</th>
                <th>Callback Status</th>
                <th>Called Back By</th>
                <th>Callback Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan={10}>No off-hours missed calls found.</td>
                </tr>
              ) : (
                currentRecords.map((record, index) => {
                  const phone = getCallbackPhone(record);
                  const pending = isPendingCallback(record);
                  const isCalling = callingBackId === record.id;

                  return (
                    <tr
                      key={record.id || index}
                      style={{
                        backgroundColor: pending ? "#fff3cd" : "#d4edda",
                      }}
                    >
                      <td>{indexOfFirst + index + 1}</td>
                      <td>{missedCallSource(record)}</td>
                      <td>{missedCallDestination(record)}</td>
                      <td title={record.emergency_number_label || ""}>
                        {missedCallEmergency(record)}
                      </td>
                      <td>
                        {getTimestamp(record)
                          ? new Date(getTimestamp(record)).toLocaleString()
                          : "-"}
                      </td>
                      <td>
                        <Chip
                          label={record.off_hours_label}
                          size="small"
                          sx={{
                            backgroundColor:
                              CATEGORY_COLORS[record.off_hours_category] ||
                              "#666",
                            color: "#fff",
                            fontWeight: "bold",
                          }}
                        />
                      </td>
                      <td>{renderCallbackStatus(record)}</td>
                      <td>
                        {record.callback_agent_name ||
                          record.callback_agent_extension ||
                          "—"}
                      </td>
                      <td>
                        {record.callback_time
                          ? new Date(record.callback_time).toLocaleString()
                          : "—"}
                      </td>
                      <td className="off-hours-actions-cell">
                        {pending && phone ? (
                          <Tooltip
                            title={
                              sipReady
                                ? "Call back via your agent phone (same as Agent Dashboard)"
                                : "Log in on Agent Dashboard with SIP extension first"
                            }
                          >
                            <span>
                              <Button
                                variant="contained"
                                size="small"
                                color={isCalling ? "success" : "primary"}
                                disabled={!sipReady || isCalling}
                                startIcon={<FiPhoneCall />}
                                onClick={() => handleCallBack(record)}
                              >
                                {isCalling ? "Calling..." : "Call Back"}
                              </Button>
                            </span>
                          </Tooltip>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : source === "cdr" ? (
          <table className="off-hours-table">
            <thead>
              <tr>
                <th>Sn</th>
                <th>Source</th>
                <th>Routed To</th>
                <th>Date/Time</th>
                <th>Category</th>
                <th>Disposition</th>
                <th>Duration (s)</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan={7}>No off-hours records found.</td>
                </tr>
              ) : (
                currentRecords.map((record, index) => (
                  <tr key={record.id || index}>
                    <td>{indexOfFirst + index + 1}</td>
                    <td>{record.caller_display || record.clid || "-"}</td>
                    <td>
                      {record.routed_to_label || record.routed_to || "—"}
                      {record.is_emergency_route && (
                        <span className="off-hours-emergency-tag"> Emergency</span>
                      )}
                    </td>
                    <td>
                      {getTimestamp(record)
                        ? new Date(getTimestamp(record)).toLocaleString()
                        : "-"}
                    </td>
                    <td>
                      <Chip
                        label={record.off_hours_label}
                        size="small"
                        sx={{
                          backgroundColor:
                            CATEGORY_COLORS[record.off_hours_category] ||
                            "#666",
                          color: "#fff",
                          fontWeight: "bold",
                        }}
                      />
                    </td>
                    <td>{record.disposition || "-"}</td>
                    <td>{record.duration || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="off-hours-table">
            <thead>
              <tr>
                <th>Sn</th>
                <th>ID</th>
                <th>Caller ID</th>
                <th>Routed To</th>
                <th>Created At</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
                <th>Duration (s)</th>
                <th>Transcription</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan={10}>No off-hours records found.</td>
                </tr>
              ) : (
                currentRecords.map((record, index) => {
                  const isPlayed = isNotePlayed(record);
                  const isPlaying = currentlyPlayingId === record.id;

                  return (
                    <tr
                      key={record.id || index}
                      style={{ backgroundColor: getRowColor(record) }}
                    >
                      <td>{indexOfFirst + index + 1}</td>
                      <td>{record.id}</td>
                      <td>{record.caller_display || record.clid || "-"}</td>
                      <td>
                        {record.routed_to_label || record.routed_to || "—"}
                        {record.is_emergency_route && (
                          <span className="off-hours-emergency-tag"> Emergency</span>
                        )}
                      </td>
                      <td>
                        {getTimestamp(record)
                          ? new Date(getTimestamp(record)).toLocaleString()
                          : "-"}
                      </td>
                      <td>
                        <Chip
                          label={record.off_hours_label}
                          size="small"
                          sx={{
                            backgroundColor:
                              CATEGORY_COLORS[record.off_hours_category] ||
                              "#666",
                            color: "#fff",
                            fontWeight: "bold",
                          }}
                        />
                      </td>
                      <td>{isPlayed ? "Played" : "Not Played"}</td>
                      <td>
                        {record.id ? (
                          <>
                            <button
                              type="button"
                              className="off-hours-btn off-hours-btn-play"
                              onClick={() => handlePlayVoice(record)}
                            >
                              Play
                            </button>
                            {isPlaying && (
                              <button
                                type="button"
                                className="off-hours-btn off-hours-btn-pause"
                                onClick={handlePauseVoice}
                              >
                                Pause
                              </button>
                            )}
                          </>
                        ) : (
                          "No file"
                        )}
                      </td>
                      <td>{record.duration_seconds || "-"}</td>
                      <td className="off-hours-transcription">
                        {record.transcription || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <Box className="off-hours-pagination">
        <Button
          variant="outlined"
          size="small"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outlined"
          size="small"
          onClick={() =>
            setCurrentPage(Math.min(totalPages, currentPage + 1))
          }
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
