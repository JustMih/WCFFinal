import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../../config";
import AudioPlayer from "./AudioPlayer/AudioPlayer";
export default function RecordedSounds() {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVoiceNotes = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseURL}/voice-notes`, {
          withCredentials: true, // If using cookies/sessions
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        console.log("Full API response:", response);
        setVoiceNotes(response.data.voiceNotes || []);
      } catch (err) {
        console.error("API Error:", {
          message: err.message,
          config: err.config,
          response: err.response?.data,
        });
        setError(`Failed to load: ${err.response?.status || "Network error"}`);
      } finally {
        setLoading(false);
      }
    };

    fetchVoiceNotes();
  }, []);

  if (loading) return <div>Loading voice notes...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!voiceNotes.length) return <div>No voice notes found</div>;

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
            <th>Play</th>
          </tr>
        </thead>
        <tbody>
          {voiceNotes.map((note) => (
            <tr key={note.id}>
              <td>{note.id}</td>
              <td>{note.recording_path}</td>
              <td>{note.clid}</td>
              <td>{new Date(note.created_at).toLocaleString()}</td>
              {/* <td>
              <audio controls>
  <source 
    src={`${baseURL}/sounds/custom/${note.recording_path.split('/custom/')[1]}`} 
    type="audio/wav" 
  />
  Your browser does not support the audio element.
</audio>

              </td> */}
              <td>
                <AudioPlayer
                  src={`${baseURL}/sounds/${
                    note.playable_path ||
                    note.recording_path.replace("/var/lib/asterisk/sounds/", "")
                  }`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
