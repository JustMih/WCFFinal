import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { baseURL } from "../../../config";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import ReportDateRangePicker from "../../../components/shared/ReportDateRangePicker";
import WcfLoader from "../../../components/shared/WcfLoader";
import "./VoiceNotesReport.css";

export default function RecordedSounds() {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [playedStatus, setPlayedStatus] = useState({});
  const [currentAudio, setCurrentAudio] = useState(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);

  // filters
  const [search, setSearch] = useState("");
  const [extensionFilter, setExtensionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const notesPerPage = 10;

  /* ===============================
     FETCH DATA
  =============================== */
  useEffect(() => {
    const fetchVoiceNotes = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${baseURL}/voice-notes`, {
          withCredentials: true,
        });

        const notes = res.data.voiceNotes || [];
        setVoiceNotes(notes);

        const fromDb = {};
        notes.forEach((n) => {
          if (n.is_played) fromDb[n.id] = true;
        });
        setPlayedStatus(fromDb);
      } catch (e) {
        setError("Failed to load voice notes");
      } finally {
        setLoading(false);
      }
    };

    fetchVoiceNotes();
  }, []);

  /* ===============================
     PLAY / PAUSE
  =============================== */
  const isPlayed = (note) => Boolean(playedStatus[note.id] || note.is_played);

  const markAsPlayedInDb = async (id) => {
    const token = localStorage.getItem("authToken");
    await axios.put(
      `${baseURL}/voice-notes/${id}/mark-played`,
      {},
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      }
    );

    setPlayedStatus((prev) => ({ ...prev, [id]: true }));
    setVoiceNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_played: 1 } : n))
    );
  };

  const handlePlayVoice = async (id) => {
    const url = `${baseURL}/voice-notes/${id}/audio`;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const audio = new Audio(url);

    try {
      await audio.play();
      setCurrentAudio(audio);
      setCurrentlyPlayingId(id);
      audio.onended = () => {
        setCurrentlyPlayingId(null);
        setCurrentAudio(null);
      };
    } catch (playErr) {
      console.error("Audio play failed:", playErr);
    }

    try {
      await markAsPlayedInDb(id);
    } catch (markErr) {
      console.error("Mark played failed:", markErr);
      setError("Could not save played status to database. Please log in and try again.");
    }
  };

  const handlePauseVoice = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentlyPlayingId(null);
    }
  };

  /* ===============================
     FILTER LOGIC
  =============================== */
      const filteredNotes = useMemo(() => {
        return voiceNotes.filter((n) => {
          const createdAt = new Date(n.created_at);

          const matchSearch =
            n.clid?.toLowerCase().includes(search.toLowerCase()) ||
            String(n.id).includes(search);

          const matchExt = extensionFilter
            ? String(n.assigned_extension) === extensionFilter
            : true;

          const matchStatus =
            statusFilter === ""
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
        playedStatus,
      ]);


  /* ===============================
     PAGINATION
  =============================== */
  const totalPages = Math.ceil(filteredNotes.length / notesPerPage);
  const pageData = filteredNotes.slice(
    (currentPage - 1) * notesPerPage,
    currentPage * notesPerPage
  );

  /* ===============================
     EXPORTS
  =============================== */
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
    doc.text("Recorded Voice Notes", 14, 15);

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
      <h2 className="voice-title">Recorded Voice Notes</h2>

      {/* ================= FILTERS ================= */}
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

        <div className="voice-buttons">
          <button className="btn btn-excel" onClick={exportExcel}>
            Export Excel
          </button>
          <button className="btn btn-pdf" onClick={exportPDF}>
            Export PDF
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="voice-table-wrapper">
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
                <tr key={note.id}>
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
                      className="btn btn-play"
                      onClick={() => handlePlayVoice(note.id)}
                    >
                      Play
                    </button>
                    {isPlaying && (
                      <button
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
      </div>

      {/* ================= PAGINATION ================= */}
      <div className="voice-pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          ‹ Prev
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
