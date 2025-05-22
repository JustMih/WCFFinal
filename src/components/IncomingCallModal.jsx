import React from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography } from "@mui/material";
import { MdCallEnd, MdCall } from "react-icons/md";

export default function IncomingCallModal({ open, caller, onAccept, onReject, onHangup, phoneStatus, callDurationFormatted }) {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle>
        {phoneStatus === "Ringing" ? "📞 Incoming Call" : "📞 Call In Progress"}
      </DialogTitle>

      <DialogContent>
        <Typography variant="h5" align="center" gutterBottom>
          {caller || "Unknown Caller"}
        </Typography>

        {phoneStatus === "In Call" && (
          <Typography variant="h6" align="center" color="primary">
            Duration: {callDurationFormatted}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        {phoneStatus === "Ringing" ? (
          <>
            <Button
              variant="contained"
              color="error"
              onClick={onReject}
              startIcon={<MdCallEnd />}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={onAccept}
              startIcon={<MdCall />}
            >
              Accept
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            color="error"
            onClick={onHangup}
            startIcon={<MdCallEnd />}
          >
            Hang Up
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
