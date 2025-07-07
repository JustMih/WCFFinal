import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaHeadphones,
  FaUserShield,
  FaComments,
  FaPlay,
} from "react-icons/fa";
import "./LiveCallsCard.css";
import { amiURL, baseURL } from "../../config";

export default function LiveCallsCard({
  isLoading,
  searchTerm,
  onSearch,
  currentPage,
  totalPages,
  onPageChange,
}) {
  const [liveCalls, setLiveCalls] = useState([]);
  const [filteredLiveCalls, setFilteredLiveCalls] = useState([]);
  const [active, setActive] = useState([]); // State for "active" status calls

  // Define the functions to handle actions
  const handleListen = async (callId) => {
    console.log(`Listening to call ${callId}`);
    try {
      const response = await fetch(`${amiURL}/api/calls/${callId}/listen`, {
        method: "POST",
      });
      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error(`Error listening to call ${callId}:`, error);
    }

  };

  const handleIntervene = async (callId) => {
    console.log(`Intervening in call ${callId}`);
    try {
      const response = await fetch(`${amiURL}/api/calls/${callId}/intervene`, {
        method: "POST",
      });
      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error(`Error intervening in call ${callId}:`, error);
    }
  };

  const handleWhisper = async (callId) => {
    console.log(`Whispering to call ${callId}`);
    try {
      const response = await fetch(`${amiURL}/api/calls/${callId}/whisper`, {
        method: "POST",
      });
      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error(`Error whispering to call ${callId}:`, error);
    }
  };

  const handlePlayRecording = async (call) => {
    console.log(`Playing recording for call ${call.id}`);
    try {
      const response = await fetch(`${amiURL}/api/calls/${call.id}/recording`);
      const data = await response.json();
      console.log("Recording URL:", data.recordingUrl);
      // You can add functionality to play the recording using the URL
    } catch (error) {
      console.error(`Error playing recording for call ${call.id}:`, error);
    }
  };

  // Calculate duration from call_answered time
  const calculateDuration = (callAnsweredTime) => {
    const callAnsweredDate = new Date(callAnsweredTime); // Convert to Date object
    const currentDate = new Date(); // Current time

    const durationInMillis = currentDate - callAnsweredDate; // Calculate the difference in milliseconds

    // Calculate hours, minutes, seconds
    const seconds = Math.floor((durationInMillis / 1000) % 60);
    const minutes = Math.floor((durationInMillis / (1000 * 60)) % 60);
    const hours = Math.floor((durationInMillis / (1000 * 60 * 60)) % 24);

    // Return the duration as HH:mm:ss
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Determine if the call is inbound or outbound based on caller number
  const getCallType = (caller) => {
    if (caller.startsWith("1")) {
      return "outbound";
    } else if (caller.startsWith("+") || caller.startsWith("0")) {
      return "inbound";
    }
    return "unknown";
  };

  // Fetch live calls data from the API
  useEffect(() => {
    const fetchLiveCalls = async () => {
      try {
        const response = await fetch(`${baseURL}/livestream/live-calls`);
        const data = await response.json();
        console.log(data);

        // Set live calls data
        setLiveCalls(data);

        // Separate calls based on status (calling or active)
        const activeCalls = data.filter((call) => call.status === "active");

        console.log("Active Calls:", activeCalls);

        // Update calling and active state
        setActive(activeCalls);
      } catch (error) {
        console.error("Error fetching live calls data:", error);
      }
    };

    fetchLiveCalls();

    // Set up interval for auto-refresh
    const intervalId = setInterval(fetchLiveCalls, 5000); // 10 seconds

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Filter live calls based on search term
  useEffect(() => {
    const safeSearchTerm =
      typeof searchTerm === "string" ? searchTerm.toLowerCase() : "";
    const filtered = liveCalls.filter(
      (call) =>
        call.id?.toLowerCase?.().includes(safeSearchTerm) ||
        call.agent?.toLowerCase?.().includes(safeSearchTerm) ||
        call.customer?.toLowerCase?.().includes(safeSearchTerm) ||
        call.callType?.toLowerCase?.().includes(safeSearchTerm)
    );
    setFilteredLiveCalls(filtered);
  }, [liveCalls, searchTerm]);

  // Ensure filtered data is used in pagination
  const data = filteredLiveCalls.length > 0 ? filteredLiveCalls : liveCalls;

  // Define the getDurationColorClass function
  const getDurationColorClass = (duration) => {
    if (!duration) return ""; // If duration is undefined or null, return empty string or handle accordingly

    // Ensure that the duration is a string before calling split
    const durationStr = String(duration);

    // Check if duration is in the correct format (e.g., "mm:ss")
    const [minutes, seconds] = durationStr.split(":").map(Number);

    const totalMinutes = minutes + seconds / 60;

    if (totalMinutes < 2) {
      return "duration-green";
    } else if (totalMinutes < 5) {
      return "duration-yellow";
    } else {
      return "duration-red";
    }
  };

  return (
    <div className="live-calls-table-container">
      <div className="live-calls-header">
        <h4>
          Live Calls{" "}
          {isLoading && <span className="loading-indicator">(Loading...)</span>}
        </h4>
        <div className="live-calls-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search calls..."
              value={searchTerm}
              onChange={onSearch}
              className="search-input"
            />
          </div>
        </div>
      </div>
      <div className="table-responsive">
        <table className="live-calls-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Call Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {active.length > 0 ? (
              active.map((call) => (
                <tr key={call.id}>
                  <td className="agent-name">{call.caller}</td>
                  <td className="customer-number">{call.callee}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        call.status ? call.status.toLowerCase() : ""
                      }`}
                    >
                      {call.status || "N/A"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`duration-badge ${getDurationColorClass(
                        calculateDuration(call.call_answered)
                      )}`}
                    >
                      {calculateDuration(call.call_answered)}
                    </span>
                  </td>
                  <td className="call-type">{getCallType(call.caller)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-button listen"
                        onClick={() => handleListen(call.id)}
                        disabled={call.status === "COMPLETED"}
                        title="Listen"
                      >
                        <FaHeadphones />
                      </button>
                      <button
                        className="action-button intervene"
                        onClick={() => handleIntervene(call.id)}
                        disabled={call.status === "COMPLETED"}
                        title="Intervene"
                      >
                        <FaUserShield />
                      </button>
                      <button
                        className="action-button whisper"
                        onClick={() => handleWhisper(call.id)}
                        disabled={call.status === "COMPLETED"}
                        title="Whisper"
                      >
                        <FaComments />
                      </button>
                      {call.status === "COMPLETED" && (
                        <button
                          className="action-button play"
                          onClick={() => handlePlayRecording(call)}
                          title="Play Recording"
                        >
                          <FaPlay />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data">
                  No live calls available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
