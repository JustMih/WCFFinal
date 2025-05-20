import React, { useEffect, useState } from 'react';
import axios from 'axios';

const VoiceRecordingsPage = () => {
  const [recordings, setRecordings] = useState([]);

  useEffect(() => {
    axios.get('/api/reports/voice-recordings')
      .then(response => setRecordings(response.data))
      .catch(error => console.error('Error fetching voice recordings:', error));
  }, []);

  return (
    <div>
      <h2>Voice Recordings</h2>
      <table>
        <thead>
          <tr>
            <th>Caller ID</th>
            <th>Destination</th>
            <th>Duration</th>
            <th>Recording File</th>
            <th>Start Time</th>
          </tr>
        </thead>
        <tbody>
          {recordings.map(recording => (
            <tr key={recording.id}>
              <td>{recording.clid}</td>
              <td>{recording.dst}</td>
              <td>{recording.duration}</td>
              <td>{recording.recordingfile}</td>
              <td>{new Date(recording.cdrstarttime).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VoiceRecordingsPage;
