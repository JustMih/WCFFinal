import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './RecordedAudio.css';
import { baseURL } from "../../../config";

const RecordedAudio = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentRec, setCurrentRec] = useState(null);
  const [playedStatus, setPlayedStatus] = useState({});
  const audioRef = useRef(null);

  /* PAGINATION */
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${baseURL}/recorded-audio`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        });

        setRecordings(res.data || []);
        setPlayedStatus(JSON.parse(localStorage.getItem("playedRecordings")) || {});
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dt) =>
    dt ? new Date(dt.replace(' ', 'T')).toLocaleString() : 'N/A';

  /* 🎨 ROW COLOR LOGIC */
  const getRowColor = (rec) => {
    if (playedStatus[rec.filename]) return '#d4edda'; // green

    const start = new Date(rec.cdrstarttime.replace(' ', 'T'));
    const hours = (Date.now() - start.getTime()) / 36e5;

    if (hours >= 24) return '#f8d7da'; // red
    return '#fff3cd'; // yellow
  };

  const handlePlay = (rec) => {
    setCurrentRec(rec);

    const updated = { ...playedStatus, [rec.filename]: true };
    setPlayedStatus(updated);
    localStorage.setItem("playedRecordings", JSON.stringify(updated));
  };

  /* 🔊 Play AFTER src is set */
  useEffect(() => {
    if (currentRec && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  }, [currentRec]);

  /* PAGINATION LOGIC */
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = recordings.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(recordings.length / rowsPerPage);

  if (loading) return <div>Loading recordings...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="recording-container">
      <h2 className="recording-title">Recorded Calls</h2>

      {/* 🎧 GLOBAL AUDIO PLAYER */}
      {currentRec && (
        <div className="audio-player">
          <strong>Now Playing:</strong> {currentRec.filename}
          <audio ref={audioRef} controls style={{ width: '100%' }}>
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
              <td>{playedStatus[rec.filename] ? 'Played' : 'Not Played'}</td>

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
                  title="Download recording"
                >
                  ⬇ Download
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINATION CONTROLS */}
      <div className="recording-pagination">
        <button
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          ◀ Prev
        </button>

        <span style={{ margin: '0 1rem' }}>
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
};

export default RecordedAudio;
