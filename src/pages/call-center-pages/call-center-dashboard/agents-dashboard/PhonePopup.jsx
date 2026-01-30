import {
  MdOutlineLocalPhone,
  MdPauseCircleOutline,
  MdLocalPhone,
  MdOutlineFollowTheSigns,
} from "react-icons/md";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { IoKeypadOutline } from "react-icons/io5";
import { BsFillMicMuteFill } from "react-icons/bs";
import { FiPhoneOff, FiPhoneCall } from "react-icons/fi";
import { useState } from "react";
import { TextField, Button } from "@mui/material";

export default function PhonePopup({
  showPhonePopup,
  phoneStatus,
  incomingCall,
  lastIncomingNumber,
  callDuration,
  phoneNumber,
  setPhoneNumber,
  showKeypad,
  setShowKeypad,
  isMuted,
  isSpeakerOn,
  isOnHold,
  manualTransferExt,
  setManualTransferExt,
  remoteAudioRef,
  formatDuration,
  isConsulting,
  onClose,
  onAccept,
  onReject,
  onEnd,
  onDial,
  onToggleMute,
  onToggleSpeaker,
  onToggleHold,
  onBlindTransfer,
  onStartConsult,
  onCompleteConsultTransfer,
  onCancelConsult,
  onSwapToTicket,
}) {
  return (
    <>
      {/* hidden remote audio for WebRTC (needed esp. on iOS/Safari) */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ opacity: 0, width: 1, height: 1 }}
      />

      {showPhonePopup && (
        <div className="phone-popup-overlay">
          <div className="phone-popup-container">
            {/* Header */}
            <div className="phone-popup-header">
              <div className="phone-popup-title">
                <MdOutlineLocalPhone className="phone-icon" />
                <span>
                  {phoneStatus === "In Call"
                    ? "Active Call"
                    : phoneStatus === "Ringing"
                      ? "Incoming Call"
                      : phoneStatus === "Dialing"
                        ? "Dialing..."
                        : phoneStatus === "Consulting"
                          ? "Consulting"
                          : "Phone"}
                </span>
              </div>
              <button
                onClick={onClose}
                className="phone-popup-close"
                aria-label="Close"
              >
                <span>&times;</span>
              </button>
            </div>

            {/* Call Status Bar */}
            {phoneStatus === "In Call" && (
              <div className="call-status-bar">
                <div className="call-status-indicator">
                  <div className="call-status-dot active"></div>
                  <span>Call in Progress</span>
                </div>
                <div className="call-duration">
                  <span className="duration-label">Duration:</span>
                  <span className="duration-time">
                    {formatDuration(callDuration)}
                  </span>
                </div>
                {/* Swap to Ticket Modal Button */}
                {onSwapToTicket && (
                  <button
                    className="swap-to-ticket-btn"
                    onClick={onSwapToTicket}
                    title="Switch to Ticket Form"
                  >
                    📝 Ticket
                  </button>
                )}
              </div>
            )}

            {/* Main Content */}
            <div className="phone-popup-content">
              {/* Incoming Call Display */}
              {incomingCall && phoneStatus === "Ringing" && (
                <div className="incoming-call-section">
                  <div className="caller-info">
                    <div className="caller-avatar">
                      <span>
                        {lastIncomingNumber
                          ? lastIncomingNumber.charAt(0)
                          : "?"}
                      </span>
                    </div>
                    <div className="caller-details">
                      <div className="caller-number">
                        {lastIncomingNumber || "Unknown"}
                      </div>
                      <div className="caller-label">Incoming Call</div>
                    </div>
                  </div>
                  <div className="call-actions">
                    <button
                      className="call-btn accept-btn"
                      onClick={onAccept}
                    >
                      <FiPhoneCall />
                      <span>Answer</span>
                    </button>
                    <button
                      className="call-btn reject-btn"
                      onClick={onReject}
                    >
                      <FiPhoneOff />
                      <span>Decline</span>
                    </button>
                  </div>
                  {/* Note: Ticket modal opens automatically when answering call */}
                  <div className="call-instruction">
                    <small style={{ color: "#6c757d", fontStyle: "italic" }}>
                      💡 Ticket form will open automatically when you answer the
                      call
                    </small>
                  </div>
                </div>
              )}

              {/* Dialing Display */}
              {phoneStatus === "Dialing" && (
                <div className="incoming-call-section">
                  <div className="caller-info">
                    <div className="caller-avatar">
                      <span>
                        {phoneNumber
                          ? phoneNumber.charAt(0)
                          : "?"}
                      </span>
                    </div>
                    <div className="caller-details">
                      <div className="caller-number">
                        {phoneNumber || "Unknown"}
                      </div>
                      <div className="caller-label">Dialing...</div>
                    </div>
                  </div>
                  <div style={{ 
                    textAlign: "center", 
                    padding: "20px",
                    color: "#6c757d"
                  }}>
                    <div style={{ 
                      display: "inline-block",
                      animation: "pulse 1.5s ease-in-out infinite"
                    }}>
                      <MdLocalPhone size={32} />
                    </div>
                    <p style={{ marginTop: "10px", fontSize: "14px" }}>
                      Connecting...
                    </p>
                  </div>
                </div>
              )}

              {/* Dial Pad Section */}
              {phoneStatus !== "In Call" && phoneStatus !== "Ringing" && phoneStatus !== "Dialing" && (
                <div className="dial-pad-section">
                  <div className="phone-number-display">
                    <input
                      type="text"
                      className="phone-number-input"
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>

                  {showKeypad && (
                    <div className="keypad-grid">
                      {[
                        "1",
                        "2",
                        "3",
                        "4",
                        "5",
                        "6",
                        "7",
                        "8",
                        "9",
                        "*",
                        "0",
                        "#",
                      ].map((digit) => (
                        <button
                          key={digit}
                          className="keypad-btn"
                          onClick={() => setPhoneNumber((prev) => prev + digit)}
                        >
                          {digit}
                        </button>
                      ))}
                      <button
                        className="keypad-btn backspace-btn"
                        onClick={() =>
                          setPhoneNumber((prev) => prev.slice(0, -1))
                        }
                        style={{ gridColumn: "span 3" }}
                      >
                        <span>⌫</span>
                        <span>Backspace</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Transfer Section (when in call) */}
              {phoneStatus === "In Call" && !isConsulting && (
                <div className="transfer-section">
                  <div className="transfer-header">
                    <MdOutlineFollowTheSigns className="transfer-icon" />
                    <span>Transfer Call</span>
                  </div>

                  <div className="transfer-input-inline">
                    <TextField
                      label="Enter Extension"
                      size="small"
                      fullWidth
                      autoFocus
                      value={manualTransferExt}
                      onChange={(e) =>
                        setManualTransferExt(e.target.value.replace(/\D/g, ""))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && manualTransferExt) {
                          // Default to direct transfer on Enter
                          onBlindTransfer(manualTransferExt);
                        }
                      }}
                      placeholder="e.g. 1021"
                      inputProps={{ maxLength: 15 }}
                    />

                    <div className="transfer-actions">
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => onBlindTransfer(manualTransferExt)}
                        disabled={!manualTransferExt}
                        style={{ marginBottom: "8px" }}
                      >
                        Direct Transfer
                      </Button>

                      <Button
                        variant="contained"
                        color="warning"
                        fullWidth
                        onClick={() => onStartConsult(manualTransferExt)}
                        disabled={!manualTransferExt}
                        style={{ marginBottom: "8px" }}
                      >
                        Consult & Transfer
                      </Button>

                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setManualTransferExt("")}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Consult State (when consulting) */}
              {isConsulting && phoneStatus === "Consulting" && (
                <div className="transfer-section">
                  <div className="transfer-header">
                    <MdOutlineFollowTheSigns className="transfer-icon" />
                    <span>Consulting with {manualTransferExt}</span>
                  </div>

                  <div style={{ 
                    padding: "16px", 
                    backgroundColor: "#fff3cd", 
                    borderRadius: "8px",
                    marginBottom: "12px",
                    border: "1px solid #ffc107"
                  }}>
                    <p style={{ margin: 0, fontSize: "14px", color: "#856404" }}>
                      💬 You are now consulting with extension {manualTransferExt}.
                      <br />
                      Speak with them, then complete or cancel the transfer.
                    </p>
                  </div>

                  <div className="transfer-actions">
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      onClick={onCompleteConsultTransfer}
                    >
                      Complete Transfer
                    </Button>

                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={() => {
                        onCancelConsult();
                        setManualTransferExt("");
                      }}
                      style={{ marginTop: "8px" }}
                    >
                      Cancel Consult
                    </Button>
                  </div>
                </div>
              )}

              {/* Control Buttons */}
              <div className="phone-controls">
                <div className="control-row">
                  <button
                    className={`control-btn ${isMuted ? "active" : ""}`}
                    onClick={onToggleMute}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    <BsFillMicMuteFill />
                    <span>{isMuted ? "Unmute" : "Mute"}</span>
                  </button>

                  <button
                    className={`control-btn ${isSpeakerOn ? "active" : ""}`}
                    onClick={onToggleSpeaker}
                    title={isSpeakerOn ? "Speaker On" : "Speaker Off"}
                  >
                    <HiMiniSpeakerWave />
                    <span>Speaker</span>
                  </button>

                  <button
                    className={`control-btn ${isOnHold ? "active" : ""}`}
                    onClick={onToggleHold}
                    title={isOnHold ? "Resume" : "Hold"}
                  >
                    <MdPauseCircleOutline />
                    <span>{isOnHold ? "Resume" : "Hold"}</span>
                  </button>
                </div>

                <div className="control-row">
                  <button
                    className="control-btn keypad-toggle"
                    onClick={() => setShowKeypad((p) => !p)}
                    title={showKeypad ? "Hide Keypad" : "Show Keypad"}
                  >
                    <IoKeypadOutline />
                    <span>Keypad</span>
                  </button>

                  {phoneStatus !== "In Call" && phoneStatus !== "Ringing" && (
                    <button
                      className="control-btn dial-btn"
                      onClick={onDial}
                      disabled={
                        phoneStatus === "Dialing" || phoneStatus === "Ringing"
                      }
                    >
                      <MdLocalPhone />
                      <span>Dial</span>
                    </button>
                  )}

                  <button
                    className="control-btn end-call-btn"
                    onClick={onEnd}
                    title="End Call"
                  >
                    <FiPhoneOff />
                    <span>End</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
