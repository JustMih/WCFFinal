import React from "react";
import { TextField, Button } from "@mui/material";

export default function AttendedTransferControls({
  isTransferring,
  transferTarget,
  setTransferTarget,
  handleAttendedTransferDial,
  completeAttendedTransfer,
  cancelAttendedTransfer,
  session,
  callDuration,
}) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    const pad = (n) => String(n).padStart(2, "0");
    return hrs > 0
      ? `${pad(hrs)}:${pad(mins % 60)}:${pad(secs)}`
      : `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <>
      <p>Call Duration: {formatDuration(callDuration)}</p>

      {!isTransferring ? (
        <>
          <TextField
            label="Consult Extension"
            variant="outlined"
            fullWidth
            margin="normal"
            value={transferTarget}
            onChange={(e) => setTransferTarget(e.target.value)}
          />
          <Button
            variant="contained"
            color="warning"
            onClick={handleAttendedTransferDial}
            disabled={!session || !transferTarget}
            fullWidth
            style={{ marginTop: "10px" }}
          >
            Consult Before Transfer
          </Button>
        </>
      ) : (
        <>
          <p>Consulting: {transferTarget}</p>
          <Button
            variant="contained"
            color="success"
            onClick={completeAttendedTransfer}
            fullWidth
          >
            Complete Transfer
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={cancelAttendedTransfer}
            fullWidth
            style={{ marginTop: "10px" }}
          >
            Cancel Transfer
          </Button>
        </>
      )}
    </>
  );
}
