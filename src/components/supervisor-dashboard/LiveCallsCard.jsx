import React from "react";
import { FaSearch, FaFileExport, FaHeadphones, FaUserShield, FaComments, FaPlay } from "react-icons/fa";
import "./LiveCallsCard.css";

export default function LiveCallsCard({
  isLoading,
  searchTerm,
  onSearch,
  onExport,
  paginatedData,
  getDurationColorClass,
  handleListen,
  handleIntervene,
  handleWhisper,
  handlePlayRecording,
  currentPage,
  totalPages,
  onPageChange
}) {
  return (
    <div className="live-calls-table-container">
      <div className="live-calls-header">
        <h4>Live Calls {isLoading && <span className="loading-indicator">(Loading...)</span>}</h4>
        <div className="live-calls-actions">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search calls..."
              value={searchTerm}
              onChange={onSearch}
              className="search-input"
            />
          </div>
          <button className="export-btn" onClick={onExport}>
            <FaFileExport /> Export
          </button>
        </div>
      </div>
      <div className="table-responsive">
        <table className="live-calls-table">
          <thead>
            <tr>
              <th>Call ID</th>
              <th>Agent</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Queue Time</th>
              <th>Call Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((call) => (
              <tr key={call.id}>
                <td className="call-id">{call.id}</td>
                <td className="agent-name">{call.agent}</td>
                <td className="customer-number">{call.customer}</td>
                <td>
                  <span className={`status-badge ${call.status.toLowerCase()}`}>
                    {call.status}
                  </span>
                </td>
                <td>
                  <span className={`duration-badge ${getDurationColorClass(call.duration)}`}>
                    {call.duration}
                  </span>
                </td>
                <td className="queue-time">{call.queueTime}</td>
                <td className="call-type">{call.callType}</td>
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
            ))}
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