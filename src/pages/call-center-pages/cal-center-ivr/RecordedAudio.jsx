import React, { useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";
import "./RecordedAudio.css";
import { baseURL } from "../../../config";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const RecordedAudio = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentRec, setCurrentRec] = useState(null);
  const [playedStatus, setPlayedStatus] = useState({});
  const audioRef = useRef(null);

  /* 🔍 FILTERS */
  const [search, setSearch] = useState("");
  const [callerFilter, setCallerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* PAGINATION */
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${baseURL}/recorded-audio`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });

        setRecordings(res.data || []);
        setPlayedStatus(
          JSON.parse(localStorage.getItem("playedRecordings")) || {}
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dt) =>
    dt ? new Date(dt.replace(" ", "T")).toLocaleString() : "N/A";

  /* 🎨 ROW COLOR LOGIC (UNCHANGED) */
  const getRowColor = (rec) => {
    if (playedStatus[rec.filename]) return "#d4edda";

    const start = new Date(rec.cdrstarttime.replace(" ", "T"));
    const hours = (Date.now() - start.getTime()) / 36e5;

    if (hours >= 24) return "#f8d7da";
    return "#fff3cd";
  };

  const handlePlay = (rec) => {
    setCurrentRec(rec);

    const updated = { ...playedStatus, [rec.filename]: true };
    setPlayedStatus(updated);
    localStorage.setItem("playedRecordings", JSON.stringify(updated));
  };

  /* 🔊 AUTO PLAY */
  useEffect(() => {
    if (currentRec && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  }, [currentRec]);

  /* 🔍 FILTER LOGIC (ADDITIVE ONLY) */
  const filteredRecordings = useMemo(() => {
    return recordings.filter((rec) => {
      const createdAt = new Date(rec.cdrstarttime.replace(" ", "T"));

      const matchSearch =
        search === "" ||
        Object.values({
          filename: rec.filename,
          caller: rec.caller,
          callTime: rec.cdrstarttime,
          status: playedStatus[rec.filename] ? "played" : "not played",
        })
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchCaller = callerFilter
        ? rec.caller?.toLowerCase().includes(callerFilter.toLowerCase())
        : true;

      const matchStatus =
        statusFilter === ""
          ? true
          : statusFilter === "played"
          ? playedStatus[rec.filename]
          : !playedStatus[rec.filename];

      const matchFromDate = fromDate
        ? createdAt >= new Date(fromDate)
        : true;

      const matchToDate = toDate
        ? createdAt <= new Date(toDate + "T23:59:59")
        : true;

      return (
        matchSearch &&
        matchCaller &&
        matchStatus &&
        matchFromDate &&
        matchToDate
      );
    });
  }, [
    recordings,
    search,
    callerFilter,
    statusFilter,
    fromDate,
    toDate,
    playedStatus,
  ]);

  /* PAGINATION */
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredRecordings.slice(
    indexOfFirst,
    indexOfLast
  );
  const totalPages = Math.ceil(filteredRecordings.length / rowsPerPage);

  /* 📄 EXPORT CSV */
  const exportCSV = () => {
    const headers = ["#", "Filename", "Caller", "Call Time", "Status"];
    const rows = filteredRecordings.map((r, i) => [
      i + 1,
      r.filename,
      r.caller,
      formatDate(r.cdrstarttime),
      playedStatus[r.filename] ? "Played" : "Not Played",
    ]);

    let csv = headers.join(",") + "\n";
    rows.forEach((r) => {
      csv += r.map((v) => `"${v}"`).join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "recorded_calls.csv";
    a.click();
  };

  /* 📄 EXPORT PDF */
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Recorded Calls Report", 14, 14);

    autoTable(doc, {
      startY: 22,
      head: [["#", "Filename", "Caller", "Call Time", "Status"]],
      body: filteredRecordings.map((r, i) => [
        i + 1,
        r.filename,
        r.caller,
        formatDate(r.cdrstarttime),
        playedStatus[r.filename] ? "Played" : "Not Played",
      ]),
    });

    doc.save("recorded_calls.pdf");
  };

  if (loading) return <div>Loading recordings...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="recording-container">
      <h2 className="recording-title">Recorded Calls</h2>

      {/* 🔍 FILTERS */}
      <div className="recording-controls">
        <input
          type="text"
          placeholder="Global search…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="recording-search"
        />

        <input
          type="text"
          placeholder="Caller"
          value={callerFilter}
          onChange={(e) => {
            setCallerFilter(e.target.value);
            setCurrentPage(1);
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="played">Played</option>
          <option value="unplayed">Not Played</option>
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setCurrentPage(1);
          }}
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setCurrentPage(1);
          }}
        />

        <div className="recording-export">
          <button onClick={exportCSV} className="btn btn-export">
            ⬇ CSV
          </button>
          <button onClick={exportPDF} className="btn btn-export">
            ⬇ PDF
          </button>
        </div>
      </div>

      {/* 🎧 AUDIO PLAYER */}
      {currentRec && (
        <div className="audio-player">
          <strong>Now Playing:</strong> {currentRec.filename}
          <audio ref={audioRef} controls style={{ width: "100%" }}>
            <source src={`${baseURL}${currentRec.url}`} type="audio/wav" />
          </audio>
        </div>
      )}

      {/* TABLE */}
      <table className="recording-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Filename</th>
            <th>Caller</th>
            <th>Call Time</th>
            <th>Status</th>
            <th>Actions</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {currentRows.map((rec, i) => (
            <tr key={rec.id} style={{ backgroundColor: getRowColor(rec) }}>
              <td>{indexOfFirst + i + 1}</td>
              <td>{rec.filename}</td>
              <td>{rec.caller}</td>
              <td>{formatDate(rec.cdrstarttime)}</td>
              <td>
                {playedStatus[rec.filename] ? "Played" : "Not Played"}
              </td>
              <td>
                <button
                  className="btn btn-play"
                  onClick={() => handlePlay(rec)}
                >
                  ▶ Play
                </button>
              </td>
              <td>
                <a
                  href={`${baseURL}${rec.url}?download=true`}
                  className="btn btn-download"
                >
                  ⬇ Download
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINATION */}
      <div className="recording-pagination">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          ◀ Prev
        </button>

        <span>
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() =>
            setCurrentPage((p) => Math.min(p + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
};

export default RecordedAudio;
