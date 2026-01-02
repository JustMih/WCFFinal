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
import {
  Autocomplete,
  TextField,
  Dialog,
  DialogContent,
} from "@mui/material";

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
  onlineUsers,
  extension,
  transferTarget,
  setTransferTarget,
  remoteAudioRef,
  formatDuration,
  onClose,
  onAccept,
  onReject,
  onEnd,
  onDial,
  onToggleMute,
  onToggleSpeaker,
  onToggleHold,
  onTransfer,
}) {
  return (
    <Dialog
      open={showPhonePopup}
      onClose={onClose}
      keepMounted
      sx={{ zIndex: 1200 }}
      PaperProps={{
        sx: {
          width: 380,
          maxWidth: "95vw",
          borderRadius: 2,
        },
      }}
    >
      <DialogContent>
        {/* Remote Audio */}
        <audio ref={remoteAudioRef} autoPlay playsInline />

        {/* Header */}
        <div className="phone-popup-header">
          <div className="phone-popup-title">
            <MdOutlineLocalPhone />
            <span>
              {phoneStatus === "In Call"
                ? "Active Call"
                : phoneStatus === "Ringing"
                ? "Incoming Call"
                : "Phone"}
            </span>
          </div>

          <button onClick={onClose} className="phone-popup-close">
            ×
          </button>
        </div>

        {/* Call Duration */}
        {phoneStatus === "In Call" && (
          <div className="call-status-bar">
            Duration: {formatDuration(callDuration)}
          </div>
        )}

        {/* Incoming Call */}
        {incomingCall && phoneStatus === "Ringing" && (
          <div className="incoming-call-section">
            <h3>{lastIncomingNumber || "Unknown"}</h3>

            <div className="call-actions">
              <button className="call-btn accept-btn" onClick={onAccept}>
                <FiPhoneCall /> Answer
              </button>

              <button className="call-btn reject-btn" onClick={onReject}>
                <FiPhoneOff /> Decline
              </button>
            </div>
          </div>
        )}

        {/* Dial Section */}
        {phoneStatus !== "In Call" && phoneStatus !== "Ringing" && (
          <>
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
            />

            {showKeypad && (
              <div className="keypad-grid">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(
                  (d) => (
                    <button
                      key={d}
                      onClick={() => setPhoneNumber((p) => p + d)}
                    >
                      {d}
                    </button>
                  )
                )}
              </div>
            )}
          </>
        )}

        {/* Blind Transfer */}
        {phoneStatus === "In Call" && (
          <>
            <Autocomplete
              freeSolo
              options={onlineUsers.filter(
                (u) =>
                  u.extension &&
                  String(u.extension) !== String(extension)
              )}
              getOptionLabel={(option) =>
                typeof option === "string"
                  ? option
                  : `${option.extension} — ${
                      option.name || option.username || ""
                    }`
              }
              onChange={(_, value) => {
                if (typeof value === "string") {
                  setTransferTarget(value);
                } else {
                  setTransferTarget(value?.extension || "");
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Transfer to extension"
                  size="small"
                  onChange={(e) =>
                    setTransferTarget(e.target.value)
                  }
                />
              )}
            />

            <button
              onClick={onTransfer}
              disabled={!transferTarget}
              className="transfer-btn"
            >
              <MdOutlineFollowTheSigns /> Transfer
            </button>
          </>
        )}

        {/* Controls */}
        <div className="phone-controls">
          <button onClick={onToggleMute}>
            <BsFillMicMuteFill />
            {isMuted ? "Unmute" : "Mute"}
          </button>

          <button onClick={onToggleSpeaker}>
            <HiMiniSpeakerWave />
            {isSpeakerOn ? "Speaker On" : "Speaker"}
          </button>

          <button onClick={onToggleHold}>
            <MdPauseCircleOutline />
            {isOnHold ? "Resume" : "Hold"}
          </button>

          <button onClick={() => setShowKeypad((p) => !p)}>
            <IoKeypadOutline /> Keypad
          </button>

          {phoneStatus !== "In Call" && (
            <button onClick={onDial}>
              <MdLocalPhone /> Dial
            </button>
          )}

          <button onClick={onEnd} className="end-call-btn">
            <FiPhoneOff /> End
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
