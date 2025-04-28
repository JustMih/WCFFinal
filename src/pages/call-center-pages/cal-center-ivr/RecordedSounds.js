import React, { useEffect, useState } from "react";
import axios from "axios";
 
//import { baseURL } from "../../../config";
export default function RecordedSounds() {
  const [voiceNotes, setVoiceNotes] = useState([]);

 useEffect(() => {
  axios.get("http://10.52.0.19:5070/api/voice-notes")
    .then(response => {
      console.log("Fetched voice notes:", response.data);  // Add this
      setVoiceNotes(response.data.voiceNotes || []);
    })
    .catch(error => {
      console.error("Error fetching voice notes:", error);
    });
}, []);

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
          {voiceNotes.map(note => (
            <tr key={note.id}>
              <td>{note.id}</td>
              <td>{note.recording_path}</td>
              <td>{note.clid}</td>
              <td>{new Date(note.created_at).toLocaleString()}</td>
              <td>
                <audio controls>
                  <source src={`http://10.52.0.19:5070${note.recording_path}`} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
