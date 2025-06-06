 import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './RecordedAudio.css'; // Make sure to create and import this CSS
import { baseURL } from "../../../config";
const RecordedAudio = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentAudio, setCurrentAudio] = useState(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);
  const [playedStatus, setPlayedStatus] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const recordingsPerPage = 10;
 
  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const response = await axios.get(`${baseURL}/recorded-audio`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        });
        
        setRecordings(response.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
        console.error('API Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecordings();
  }, []);

  const handlePlay = async (recording) => {
    const audioUrl = `${baseURL}${recording.url}`;


    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    try {
      const audio = new Audio(audioUrl);
      audio.play();
      setCurrentAudio(audio);
      setCurrentlyPlayingId(recording.filename);
      setPlayedStatus((prev) => ({ ...prev, [recording.filename]: true }));

      audio.onended = () => {
        setCurrentlyPlayingId(null);
        setCurrentAudio(null);
      };
    } catch (err) {
      console.error("Failed to play audio:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const handlePause = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentlyPlayingId(null);
    }
  };

  // Pagination logic
  const indexOfLast = currentPage * recordingsPerPage;
  const indexOfFirst = indexOfLast - recordingsPerPage;
  const currentRecordings = recordings.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(recordings.length / recordingsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
  };

  if (loading) return <div>Loading recordings...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="recording-container">
      <h2 className="recording-title">Recorded Calls</h2>
      <div className="recording-table-wrapper">
        <table className="recording-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Filename</th>
              <th>Caller</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRecordings.map((rec, index) => {
              const isPlaying = currentlyPlayingId === rec.filename;
              const isPlayed = playedStatus[rec.filename];
              return (
                <tr
                  key={rec.filename}
                  style={{ backgroundColor: isPlayed ? '#d4edda' : '#fff3cd' }}
                >
                  <td>{indexOfFirst + index + 1}</td>
                  <td>{rec.filename}</td>
                  <td>{rec.caller}</td>
                  <td>{new Date(rec.cdrstarttime).toLocaleString()}</td>
                  <td>{isPlayed ? 'Played' : 'Not Played'}</td>
                  <td>
                    <button className="btn btn-play" onClick={() => handlePlay(rec)}>Play</button>
                    {isPlaying && (
                      <button className="btn btn-pause" onClick={handlePause} style={{ marginLeft: '5px' }}>
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
      <div className="recording-pagination">
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          &lt; Prev
        </button>
        <span style={{ margin: '0 1rem' }}>
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Next &gt;
        </button>
      </div>
    </div>
  );
};

export default RecordedAudio;
