import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Snackbar } from "@mui/material";
import { FiPhoneCall } from "react-icons/fi";
import { MdOutlineLocalPhone } from "react-icons/md";
import { baseURL, SIP_DOMAIN_CONFIG } from "../config";
import AdvancedTicketCreateModal from "../components/ticket/AdvancedTicketCreateModal";
import { useSipPhone } from "../pages/call-center-pages/call-center-dashboard/agents-dashboard/useSipPhone";
import PhonePopup from "../pages/call-center-pages/call-center-dashboard/agents-dashboard/PhonePopup";
import { useSupervisorInterventionSocket } from "../hooks/useSupervisorInterventionSocket";
import { AgentSipPhoneContext } from "./AgentSipPhoneContext";
import "./agentSipPhone.css";

export default function AgentSipPhoneProvider({ children }) {
  const extension = localStorage.getItem("extension");
  const sipPassword = localStorage.getItem("sipPassword");
  const SIP_DOMAIN = SIP_DOMAIN_CONFIG;

  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [agentStatus, setAgentStatusState] = useState(
    () => localStorage.getItem("agentStatus") || "ready"
  );

  const [functionData, setFunctionData] = useState([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketPhoneNumber, setTicketPhoneNumber] = useState("");
  const [ticketFormData, setTicketFormData] = useState({});
  const [ticketType, setTicketType] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("warning");
  const [missedCallTick, setMissedCallTick] = useState(0);

  const showAlert = useCallback((message, severity = "warning") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const setAgentStatus = useCallback((status) => {
    setAgentStatusState(status);
    if (status) {
      localStorage.setItem("agentStatus", status);
    }
  }, []);

  const { intervention, clearIntervention } = useSupervisorInterventionSocket({
    onNotify: showAlert,
  });

  const addMissedCall = useCallback(
    (raw) => {
      const agentId = localStorage.getItem("extension");
      if (!raw || raw.trim() === "") return;
      const formattedCaller = raw.startsWith("+255")
        ? `0${raw.substring(4)}`
        : raw;
      const time = new Date();

      showAlert(`Missed Call from ${formattedCaller}`, "warning");
      setMissedCallTick((t) => t + 1);

      fetch(`${baseURL}/missed-calls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          caller: formattedCaller,
          time: time.toISOString(),
          agentId,
        }),
      }).catch((err) => console.error("Failed to post missed call:", err));
    },
    [showAlert]
  );

  const {
    phoneStatus,
    incomingCall,
    lastIncomingNumber,
    callDuration,
    isMuted,
    isSpeakerOn,
    isOnHold,
    phoneNumber,
    setPhoneNumber,
    manualTransferExt,
    setManualTransferExt,
    remoteAudioRef,
    session,
    isConsulting,
    formatDuration,
    acceptCall,
    rejectCall,
    endCall,
    dial,
    redial,
    blindTransfer,
    startConsult,
    completeConsultTransfer,
    cancelConsult,
    toggleMute,
    toggleSpeaker,
    toggleHold,
  } = useSipPhone({
    extension,
    sipPassword,
    SIP_DOMAIN,
    onIncomingCall: useCallback((number) => {
      setShowPhonePopup(true);
    }, []),
    onMissedCall: addMissedCall,
    onCallAccepted: useCallback((number) => {
      if (number) setTicketPhoneNumber(number);
    }, []),
    onCallEnded: useCallback(() => {
      clearIntervention();
    }, [clearIntervention]),
    showAlert,
    allowIncomingRinging: agentStatus === "ready",
  });

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${baseURL}/section/functions-data`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setFunctionData(json.data || []);
      } catch (err) {
        console.error("Fetch functionData error:", err);
      }
    })();
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");
    if (!userId || !token) return;

    (async () => {
      try {
        const response = await fetch(
          `${baseURL}/users/agent-status/${userId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) return;
        const data = await response.json();
        if (data.status === "pause" && data.pause_activity) {
          setAgentStatus(data.pause_activity);
        } else if (data.status === "online") {
          setAgentStatus("ready");
        }
      } catch (err) {
        console.error("Failed to restore agent status for SIP:", err);
      }
    })();
  }, [setAgentStatus]);

  const togglePhonePopup = useCallback(
    () => setShowPhonePopup((v) => !v),
    []
  );

  const handleDial = useCallback(() => {
    dial(phoneNumber);
  }, [dial, phoneNumber]);

  const handleAcceptCall = useCallback(() => {
    setTicketPhoneNumber(lastIncomingNumber || phoneNumber || "");
    setShowTicketModal(true);
    setIsTicketModalOpen(true);
    setShowPhonePopup(false);
    acceptCall();
  }, [acceptCall, lastIncomingNumber, phoneNumber]);

  const handleRejectCall = useCallback(() => {
    rejectCall();
  }, [rejectCall]);

  const handleEndCall = useCallback(() => {
    endCall();
  }, [endCall]);

  const closeTicketModal = useCallback(() => {
    setShowTicketModal(false);
    setIsTicketModalOpen(false);
  }, []);

  const swapToTicketModal = useCallback(() => {
    if (showTicketModal) return;

    setShowPhonePopup(false);
    setShowTicketModal(true);
    setIsTicketModalOpen(true);

    if (phoneStatus === "In Call" || phoneStatus === "Ringing") {
      setTicketFormData((prev) => ({
        ...prev,
        phoneNumber: lastIncomingNumber || phoneNumber,
        callStatus: phoneStatus,
        callDuration,
        timestamp: new Date().toISOString(),
      }));
    }
  }, [
    showTicketModal,
    phoneStatus,
    lastIncomingNumber,
    phoneNumber,
    callDuration,
  ]);

  const handleTicketTypeSelect = useCallback(
    (type) => {
      setTicketType(type);
      if (ticketType && ticketType !== type) {
        setTicketFormData({});
      }
      setTicketFormData({
        ticketType: type,
        phoneNumber: lastIncomingNumber || phoneNumber,
        callStatus: phoneStatus,
        callDuration,
        timestamp: new Date().toISOString(),
      });
    },
    [ticketType, lastIncomingNumber, phoneNumber, phoneStatus, callDuration]
  );

  const openTicketModal = useCallback(
    (type = null) => {
      if (type) {
        handleTicketTypeSelect(type);
      }
      setShowTicketModal(true);
      setIsTicketModalOpen(true);
    },
    [handleTicketTypeSelect]
  );

  const openPhoneAndRedial = useCallback(
    (number, missedCallId = null) => {
      setShowPhonePopup(true);
      if (number) setPhoneNumber(number);
      redial(number, missedCallId);
    },
    [redial, setPhoneNumber]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && showTicketModal) {
        event.preventDefault();
        closeTicketModal();
      }
    };
    if (showTicketModal) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showTicketModal, closeTicketModal]);

  const hasActiveCall = phoneStatus === "In Call" && session !== null;
  const isBusy =
    phoneStatus === "In Call" ||
    phoneStatus === "Ringing" ||
    phoneStatus === "Calling" ||
    phoneStatus === "Connecting";

  const value = useMemo(
    () => ({
      extension,
      agentStatus,
      setAgentStatus,
      showPhonePopup,
      setShowPhonePopup,
      togglePhonePopup,
      showKeypad,
      setShowKeypad,
      phoneStatus,
      incomingCall,
      lastIncomingNumber,
      callDuration,
      isMuted,
      isSpeakerOn,
      isOnHold,
      phoneNumber,
      setPhoneNumber,
      manualTransferExt,
      setManualTransferExt,
      remoteAudioRef,
      session,
      isConsulting,
      formatDuration,
      acceptCall,
      rejectCall,
      endCall,
      dial,
      redial,
      blindTransfer,
      startConsult,
      completeConsultTransfer,
      cancelConsult,
      toggleMute,
      toggleSpeaker,
      toggleHold,
      handleDial,
      handleAcceptCall,
      handleRejectCall,
      handleEndCall,
      swapToTicketModal,
      openTicketModal,
      closeTicketModal,
      openPhoneAndRedial,
      showTicketModal,
      setShowTicketModal,
      ticketPhoneNumber,
      setTicketPhoneNumber,
      functionData,
      isTicketModalOpen,
      ticketFormData,
      setTicketFormData,
      ticketType,
      showAlert,
      missedCallTick,
      hasActiveCall,
      intervention,
      clearIntervention,
      sipReady: Boolean(extension && sipPassword),
    }),
    [
      extension,
      sipPassword,
      agentStatus,
      setAgentStatus,
      showPhonePopup,
      togglePhonePopup,
      showKeypad,
      phoneStatus,
      incomingCall,
      lastIncomingNumber,
      callDuration,
      isMuted,
      isSpeakerOn,
      isOnHold,
      phoneNumber,
      setPhoneNumber,
      manualTransferExt,
      setManualTransferExt,
      remoteAudioRef,
      session,
      isConsulting,
      formatDuration,
      acceptCall,
      rejectCall,
      endCall,
      dial,
      redial,
      blindTransfer,
      startConsult,
      completeConsultTransfer,
      cancelConsult,
      toggleMute,
      toggleSpeaker,
      toggleHold,
      handleDial,
      handleAcceptCall,
      handleRejectCall,
      handleEndCall,
      swapToTicketModal,
      openTicketModal,
      closeTicketModal,
      openPhoneAndRedial,
      showTicketModal,
      ticketPhoneNumber,
      functionData,
      isTicketModalOpen,
      ticketFormData,
      ticketType,
      showAlert,
      missedCallTick,
      hasActiveCall,
      intervention,
      clearIntervention,
    ]
  );

  return (
    <AgentSipPhoneContext.Provider value={value}>
      {children}

      {intervention && (
        <Alert
          severity={intervention.severity || "info"}
          onClose={clearIntervention}
          className="agent-sip-intervention"
          sx={{
            fontWeight: 500,
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <strong>{intervention.title}</strong> — {intervention.message}
        </Alert>
      )}

      {hasActiveCall && !showTicketModal && !showPhonePopup && (
        <div className="agent-sip-call-banner">
          <div className="agent-sip-call-banner-info">
            <FiPhoneCall style={{ fontSize: 20 }} />
            <div>
              <div className="agent-sip-call-banner-title">Call in Progress</div>
              <div className="agent-sip-call-banner-meta">
                {ticketPhoneNumber ||
                  lastIncomingNumber ||
                  phoneNumber ||
                  "Unknown"}{" "}
                • Duration: {formatDuration(callDuration)}
              </div>
            </div>
          </div>
          <div className="agent-sip-call-banner-actions">
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                setShowTicketModal(true);
                setIsTicketModalOpen(true);
              }}
              sx={{
                backgroundColor: "white",
                color: "#4caf50",
                "&:hover": { backgroundColor: "#f5f5f5" },
              }}
            >
              Return to Ticket
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={togglePhonePopup}
              sx={{
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" },
              }}
            >
              Open Phone
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleEndCall}
              sx={{
                backgroundColor: "#f44336",
                color: "white",
                "&:hover": { backgroundColor: "#d32f2f" },
              }}
            >
              End Call
            </Button>
          </div>
        </div>
      )}

      {!showPhonePopup && (
        <button
          type="button"
          className={`agent-sip-fab${isBusy ? " agent-sip-fab--busy" : ""}${
            agentStatus !== "ready" ? " agent-sip-fab--paused" : ""
          }`}
          onClick={togglePhonePopup}
          title={
            agentStatus === "ready"
              ? isBusy
                ? `Phone (${phoneStatus})`
                : "Open phone"
              : `Paused: ${agentStatus}`
          }
          aria-label="Open SIP phone"
        >
          <MdOutlineLocalPhone size={26} />
          {isBusy && <span className="agent-sip-fab-pulse" />}
        </button>
      )}

      <PhonePopup
        showPhonePopup={showPhonePopup}
        extension={extension}
        phoneStatus={phoneStatus}
        incomingCall={incomingCall}
        lastIncomingNumber={lastIncomingNumber}
        callDuration={callDuration}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        showKeypad={showKeypad}
        setShowKeypad={setShowKeypad}
        isMuted={isMuted}
        isSpeakerOn={isSpeakerOn}
        isOnHold={isOnHold}
        manualTransferExt={manualTransferExt}
        setManualTransferExt={setManualTransferExt}
        remoteAudioRef={remoteAudioRef}
        formatDuration={formatDuration}
        isConsulting={isConsulting}
        onClose={togglePhonePopup}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        onEnd={handleEndCall}
        onDial={handleDial}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
        onToggleHold={toggleHold}
        onBlindTransfer={blindTransfer}
        onStartConsult={startConsult}
        onCompleteConsultTransfer={completeConsultTransfer}
        onCancelConsult={cancelConsult}
        onSwapToTicket={swapToTicketModal}
      />

      <AdvancedTicketCreateModal
        open={showTicketModal}
        onClose={closeTicketModal}
        onOpen={openTicketModal}
        initialPhoneNumber={ticketPhoneNumber}
        functionData={functionData}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </AgentSipPhoneContext.Provider>
  );
}
