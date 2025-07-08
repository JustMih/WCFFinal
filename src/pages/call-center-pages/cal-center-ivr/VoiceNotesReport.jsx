 import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../../config";
import './VoiceNotesReport.css';

export default function RecordedSounds() {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playedStatus, setPlayedStatus] = useState({});
  const [currentAudio, setCurrentAudio] = useState(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const notesPerPage = 10;

  useEffect(() => {
    const fetchVoiceNotes = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://10.52.0.19:5070/api/voice-notes`, {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        const notes = response.data.voiceNotes || [];
        setVoiceNotes(notes);

        // Load played status from localStorage
        const storedPlayed = JSON.parse(localStorage.getItem("playedVoiceNotes")) || {};
        const validPlayed = {};
        notes.forEach(note => {
          if (storedPlayed[note.id]) validPlayed[note.id] = true;
        });
        setPlayedStatus(validPlayed);
      } catch (err) {
        console.error("API Error:", err);
        setError(`Failed to load: ${err.response?.status || "Network error"}`);
      } finally {
        setLoading(false);
      }
    };

    fetchVoiceNotes();
  }, []);

  const handlePlayVoice = async (noteId) => {
    const audioUrl = `http://10.52.0.19:5070/api/voice-notes/${noteId}/audio`;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    try {
      const response = await fetch(audioUrl, { method: "HEAD" });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const audio = new Audio(audioUrl);
      audio.play();
      setCurrentAudio(audio);
      setCurrentlyPlayingId(noteId);

      const updatedStatus = { ...playedStatus, [noteId]: true };
      setPlayedStatus(updatedStatus);

      // Save to localStorage for persistence
      localStorage.setItem("playedVoiceNotes", JSON.stringify(updatedStatus));

      audio.onended = () => {
        setCurrentlyPlayingId(null);
        setCurrentAudio(null);
      };
    } catch (error) {
      console.error("Error playing audio:", error);
      alert(`Failed to play audio. Error: ${error.message}`);
    }
  };

  const handlePauseVoice = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentlyPlayingId(null);
    }
  };

  const getRowColor = (note) => {
    if (playedStatus[note.id]) return "#d4edda"; // green
    const createdAt = new Date(note.created_at);
    const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursAgo >= 24 ? "#f8d7da" : "#fff3cd"; // red or yellow
  };

  // Pagination Logic
  const indexOfLastNote = currentPage * notesPerPage;
  const indexOfFirstNote = indexOfLastNote - notesPerPage;
  const currentNotes = voiceNotes.slice(indexOfFirstNote, indexOfLastNote);
  const totalPages = Math.ceil(voiceNotes.length / notesPerPage);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
  };

  if (loading) return <div>Loading voice notes...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!voiceNotes.length) return <div className="no-results">No voice notes found.</div>;

  return (
    <div className="voice-container">
      <h2 className="voice-title">Recorded Voice Notes</h2>

      <div className="voice-table-wrapper">
        <table className="voice-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Caller ID</th>
              <th>Created At</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentNotes.map((note) => {
              const isPlayed = playedStatus[note.id];
              const isPlaying = currentlyPlayingId === note.id;

              return (
                <tr key={note.id} style={{ backgroundColor: getRowColor(note) }}>
                  <td>{note.id}</td>
                  <td>{note.clid}</td>
                  <td>{new Date(note.created_at).toLocaleString()}</td>
                  <td>{isPlayed ? "Played" : "Not Played"}</td>
                  <td>
                    <button className="btn btn-play" onClick={() => handlePlayVoice(note.id)}>Play</button>
                    {isPlaying && (
                      <button className="btn btn-pause" onClick={handlePauseVoice} style={{ marginLeft: "5px" }}>
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

      {/* Pagination */}
      <div className="voice-pagination">
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          &lt; Prev
        </button>
        <span style={{ margin: "0 1rem" }}>
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Next &gt;
        </button>
      </div>
    </div>
  );
}
