import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { baseURL } from "../../../config";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import ReportDateRangePicker from "../../../components/shared/ReportDateRangePicker";
import WcfLoader from "../../../components/shared/WcfLoader";
import { playVoiceNoteAudio } from "../../../utils/voiceNoteAudio";
import {
  buildVoiceNotesQuery,
  isVoiceNotePlayed,
  markVoiceNotePlayed,
  VOICE_NOTE_PLAYED_EVENT,
} from "../../../utils/voiceNotePlayed";
import "./VoiceNotesReport.css";

/**
 * @param {"inbox"|"report"} variant
 *   inbox — agent notifications: unplayed only; row removed when played (full history in report page)
 *   report — all voice notes; played notes stay visible
 */
export default function VoiceNotesReport({ variant = "report", agentId: agentIdProp }) {
  const navigate = useNavigate();
  const isInbox = variant === "inbox";
  const agentId =
    agentIdProp || localStorage.getItem("userId") || undefined;

  const [voiceNotes, setVoiceNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [playedStatus, setPlayedStatus] = useState({});
  const [currentAudio, setCurrentAudio] = useState(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);

  const [search, setSearch] = useState("");
  const [extensionFilter, setExtensionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(isInbox ? "unplayed" : "");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const notesPerPage = 10;

  const loadVoiceNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query = buildVoiceNotesQuery({
        agentId: isInbox ? agentId : undefined,
        unplayedOnly: isInbox,
      });
      const res = await axios.get(`${baseURL}/voice-notes${query}`, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      const notes = res.data.voiceNotes || [];
      setVoiceNotes(notes);

      const fromDb = {};
      notes.forEach((n) => {
        if (isVoiceNotePlayed(n)) fromDb[n.id] = true;
      });
      setPlayedStatus(fromDb);
      setCurrentPage(1);
    } catch (e) {
      setError("Failed to load voice notes");
    } finally {
      setLoading(false);
    }
  }, [isInbox, agentId]);

  useEffect(() => {
    loadVoiceNotes();
  }, [loadVoiceNotes]);

  useEffect(() => {
    if (!isInbox) return undefined;
    const onPlayed = (e) => {
      const id = e.detail?.id;
      if (id != null) {
        setVoiceNotes((prev) => prev.filter((n) => n.id !== id));
        setPlayedStatus((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    };
    window.addEventListener(VOICE_NOTE_PLAYED_EVENT, onPlayed);
    return () => window.removeEventListener(VOICE_NOTE_PLAYED_EVENT, onPlayed);
  }, [isInbox]);

  // const isPlayed = (note) =>
  //   Boolean(playedStatus[note.id] || isVoiceNotePlayed(note));
  const isPlayed = useCallback(
  (note) => Boolean(playedStatus[note.id] || isVoiceNotePlayed(note)),
  [playedStatus]
);

  const markAsPlayed = async (note, durationSeconds = null) => {
    await markVoiceNotePlayed(note.id, durationSeconds);

    if (isInbox) {
      setVoiceNotes((prev) => prev.filter((n) => n.id !== note.id));
    } else {
      setPlayedStatus((prev) => ({ ...prev, [note.id]: true }));
      setVoiceNotes((prev) =>
        prev.map((n) =>
          n.id === note.id
            ? {
                ...n,
                is_played: 1,
                duration_seconds:
                  n.duration_seconds || Math.round(durationSeconds || 0),
              }
            : n
        )
      );
    }
  };

  const handlePlayVoice = async (note) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    try {
      const { audio } = await playVoiceNoteAudio(note);
      setCurrentAudio(audio);
      setCurrentlyPlayingId(note.id);

      const savePlayed = (dur) => {
        markAsPlayed(note, dur).catch((err) => {
          console.error("mark-played failed:", err);
          setError("Played audio but could not save status. Try again.");
        });
      };

      if (audio.duration && !Number.isNaN(audio.duration)) {
        savePlayed(audio.duration);
      } else {
        audio.onloadedmetadata = () => savePlayed(audio.duration);
      }

      audio.onended = () => {
        setCurrentlyPlayingId(null);
        setCurrentAudio(null);
      };
    } catch (playErr) {
      console.error("Audio play failed:", playErr);
      setError("Could not play audio. Please try again.");
    }
  };

  const handlePauseVoice = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentlyPlayingId(null);
    }
  };

  const getRowColor = (note) => {
    if (isPlayed(note)) return "#d4edda";
    const createdAt = new Date(note.created_at);
    const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursAgo >= 24 ? "#f8d7da" : "#fff3cd";
  };

  const filteredNotes = useMemo(() => {
    return voiceNotes.filter((n) => {
      const createdAt = new Date(n.created_at);

      const matchSearch =
        n.clid?.toLowerCase().includes(search.toLowerCase()) ||
        String(n.id).includes(search);

      const matchExt = extensionFilter
        ? String(n.assigned_extension) === extensionFilter
        : true;

      const matchStatus = isInbox
        ? !isPlayed(n)
        : statusFilter === ""
        ? true
        : statusFilter === "played"
        ? isPlayed(n)
        : !isPlayed(n);

      const matchFromDate = fromDate
        ? createdAt >= new Date(fromDate)
        : true;

      const matchToDate = toDate
        ? createdAt <= new Date(toDate + "T23:59:59")
        : true;

      return (
        matchSearch &&
        matchExt &&
        matchStatus &&
        matchFromDate &&
        matchToDate
      );
    });
  }, [
    voiceNotes,
    search,
    extensionFilter,
    statusFilter,
    fromDate,
    toDate,
    // playedStatus,
    isInbox,
    isPlayed
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / notesPerPage));
  const pageData = filteredNotes.slice(
    (currentPage - 1) * notesPerPage,
    currentPage * notesPerPage
  );

  const exportExcel = () => {
    const data = filteredNotes.map((n) => ({
      ID: n.id,
      Caller: n.clid,
      Extension: n.assigned_extension,
      Agent: n.assigned_agent_name || "",
      Status: isPlayed(n) ? "Played" : "Not Played",
      Date: new Date(n.created_at).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Voice Notes");
    XLSX.writeFile(wb, "voice_notes.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(
      isInbox ? "Unplayed Voice Notes" : "Recorded Voice Notes",
      14,
      15
    );

    doc.autoTable({
      startY: 20,
      head: [["ID", "Caller", "Extension", "Agent", "Status", "Date"]],
      body: filteredNotes.map((n) => [
        n.id,
        n.clid,
        n.assigned_extension,
        n.assigned_agent_name || "-",
        isPlayed(n) ? "Played" : "Not Played",
        new Date(n.created_at).toLocaleString(),
      ]),
    });

    doc.save("voice_notes.pdf");
  };

  if (loading) {
    return (
      <div className="wcf-loading-container">
        <WcfLoader size="md" message="Loading voice notes..." label="Loading voice notes" />
      </div>
    );
  }
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="voice-container">
      <h2 className="voice-title">
        {isInbox ? "New Voice Notes" : "Recorded Voice Notes"}
      </h2>
      {isInbox && (
        <p className="voice-inbox-hint">
          Only unplayed messages appear here. After you play one, it moves to{" "}
          <button
            type="button"
            className="voice-report-link"
            onClick={() => navigate("/voice-notes")}
          >
            Voice Notes Report
          </button>
          .
        </p>
      )}

      <div className="voice-controls report-filters-row">
        <input
          className="voice-search"
          placeholder="Search Caller / ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ReportDateRangePicker
          className="date-filters"
          startDate={fromDate}
          endDate={toDate}
          onStartDateChange={setFromDate}
          onEndDateChange={setToDate}
          startLabel="From"
          endLabel="To"
        />

        {!isInbox && (
          <>
            <select
              value={extensionFilter}
              onChange={(e) => setExtensionFilter(e.target.value)}
            >
              <option value="">All Extensions</option>
              {[...new Set(voiceNotes.map((n) => n.assigned_extension))]
                .filter(Boolean)
                .map((ext) => (
                  <option key={ext} value={ext}>
                    Ext {ext}
                  </option>
                ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="played">Played</option>
              <option value="unplayed">Not Played</option>
            </select>
          </>
        )}

        <div className="voice-buttons">
          {!isInbox && (
            <>
              <button type="button" className="btn btn-excel" onClick={exportExcel}>
                Export Excel
              </button>
              <button type="button" className="btn btn-pdf" onClick={exportPDF}>
                Export PDF
              </button>
            </>
          )}
          {isInbox && (
            <button
              type="button"
              className="btn btn-report-nav"
              onClick={() => navigate("/voice-notes")}
            >
              Open Voice Notes Report
            </button>
          )}
        </div>
      </div>

      <div className="voice-table-wrapper">
        {filteredNotes.length === 0 ? (
          <p className="voice-empty">
            {isInbox
              ? "No new voice notes. Played messages are in Voice Notes Report."
              : "No records found."}
          </p>
        ) : (
          <table className="voice-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Caller</th>
                <th>Created</th>
                <th>Assigned Extension</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((note) => {
                const isPlaying = currentlyPlayingId === note.id;

                const extensionText = note.assigned_extension
                  ? `Ext ${note.assigned_extension}${
                      note.assigned_agent_name
                        ? ` (${note.assigned_agent_name})`
                        : ""
                    }`
                  : "—";

                return (
                  <tr
                    key={note.id}
                    style={{ backgroundColor: getRowColor(note) }}
                  >
                    <td>{note.id}</td>
                    <td>{note.clid}</td>
                    <td>{new Date(note.created_at).toLocaleString()}</td>
                    <td>{extensionText}</td>
                    <td>
                      <span
                        className={`voice-status ${
                          isPlayed(note) ? "played" : "unplayed"
                        }`}
                      >
                        {isPlayed(note) ? "Played" : "Not Played"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-play"
                        onClick={() => handlePlayVoice(note)}
                      >
                        Play
                      </button>
                      {isPlaying && (
                        <button
                          type="button"
                          className="btn btn-pause"
                          onClick={handlePauseVoice}
                          style={{ marginLeft: 6 }}
                        >
                          Pause
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {filteredNotes.length > 0 && (
        <div className="voice-pagination">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            ‹ Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
