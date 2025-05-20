import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RecordedSounds.css";

const RecordedSounds = () => {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVoiceNotes = async () => {
      try {
        const token = localStorage.getItem("token"); // Assuming JWT token is stored
        const response = await axios.get("http://localhost:3000/api/voice-notes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setVoiceNotes(response.data.voiceNotes);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch voice notes");
        setLoading(false);
      }
    };

    fetchVoiceNotes();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="recorded-sounds">
      <h2>Recorded Sounds</h2>
      <table className="voice-notes-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>CLID</th>
            <th>Recording</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {voiceNotes.map((note) => (
            <tr key={note.id}>
              <td>{note.id}</td>
              <td>{note.clid}</td>
              <td>
                <audio controls>
                  <source src={`http://localhost:3000/${note.playable_path}`} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
              </td>
              <td>{new Date(note.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecordedSounds;