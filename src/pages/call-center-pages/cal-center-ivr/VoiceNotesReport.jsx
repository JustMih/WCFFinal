 import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../../config";

export default function RecordedSounds() {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playedStatus, setPlayedStatus] = useState({});
  const [currentAudio, setCurrentAudio] = useState(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);

  useEffect(() => {
    const fetchVoiceNotes = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseURL}/voice-notes`, {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
        setVoiceNotes(response.data.voiceNotes || []);
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
    const audioUrl = `${baseURL}/voice-notes/${noteId}/audio`;

    // Stop currently playing audio
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
      setPlayedStatus((prev) => ({ ...prev, [noteId]: true }));

      // Reset state when audio ends
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

  if (loading) return <div>Loading voice notes...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!voiceNotes.length) return <div>No voice notes found.</div>;

  return (
    <div>
      <h2>Recorded Voice Notes</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Recording Path</th>
            <th>Caller ID</th>
            <th>Created At</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {voiceNotes.map((note) => {
            const isPlayed = playedStatus[note.id];
            const isPlaying = currentlyPlayingId === note.id;
            return (
              <tr
                key={note.id}
                style={{
                  backgroundColor: isPlayed ? "#d4edda" : "#fff3cd", // green or yellow
                }}
              >
                <td>{note.id}</td>
                <td>{note.recording_path}</td>
                <td>{note.clid}</td>
                <td>{new Date(note.created_at).toLocaleString()}</td>
                <td>{isPlayed ? "Played" : "Not Played"}</td>
                <td>
                  <button onClick={() => handlePlayVoice(note.id)}>Play</button>
                  {isPlaying && (
                    <button onClick={handlePauseVoice} style={{ marginLeft: "5px" }}>
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
  );
}
 