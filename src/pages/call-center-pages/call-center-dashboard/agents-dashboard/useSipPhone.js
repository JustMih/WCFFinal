import { useEffect, useMemo, useRef, useState } from "react";
import { UserAgent, Inviter, Registerer, SessionState } from "sip.js";

export function useSipPhone({
  extension,
  sipPassword,
  SIP_DOMAIN = "192.168.21.69",
  onIncomingCall,
  onMissedCall,
  onCallAccepted,
  onCallEnded,
  showAlert,
  allowIncomingRinging = true,
}) {
  // ---------- Core state ----------
  const [phoneStatus, setPhoneStatus] = useState("Idle");
  const [userAgent, setUserAgent] = useState(null);
  const [session, setSession] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [lastIncomingNumber, setLastIncomingNumber] = useState("");
  const [callDuration, setCallDuration] = useState(0);

  const allowRingingRef = useRef(allowIncomingRinging);
  allowRingingRef.current = allowIncomingRinging;

  // --------- Call control ---------
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isOnHold, setIsOnHold] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [manualTransferExt, setManualTransferExt] = useState("");

  // --------- Consult Transfer ---------
  const [consultSession, setConsultSession] = useState(null);
  const [isConsulting, setIsConsulting] = useState(false);

  const remoteAudioRef = useRef(null);
  const [ringAudio] = useState(() => new Audio("/ringtone.mp3"));

  const callTimerRef = useRef(null);
  const autoRejectTimerRef = useRef(null);
  const wasAnsweredRef = useRef(false);

  // ---------- SIP config ----------
  const sipConfig = useMemo(() => {
    if (!extension || !sipPassword) return null;
    return {
      uri: UserAgent.makeURI(`sip:${extension}@${SIP_DOMAIN}`),
      transportOptions: {
        server: `wss://${SIP_DOMAIN}:8089/ws`,
        keepAliveInterval: 30,
        connectionTimeout: 10000,
      },
      authorizationUsername: extension,
      authorizationPassword: sipPassword,
      traceSip: true,
      sessionDescriptionHandlerFactoryOptions: {
        constraints: { audio: true, video: false },
        codecs: ["PCMU", "opus"],
        peerConnectionConfiguration: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            {
              urls: "turn:openrelay.metered.ca:80",
              username: "openrelayproject",
              credential: "openrelayproject",
            },
          ],
          iceTransportPolicy: "all",
          rtcpMuxPolicy: "require",
          bundlePolicy: "balanced",
          iceGatheringTimeout: 500,
        },
      },
      hackIpInContact: true,
      register: true,
      log: {
        level: "debug",
        builtinEnabled: true,
      },
      allowLegacyNotifications: true,
      hackViaReceived: true,
    };
  }, [extension, sipPassword, SIP_DOMAIN]);

  // ---------- Helpers ----------
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    const pad = (n) => String(n).padStart(2, "0");
    return hrs > 0
      ? `${pad(hrs)}:${pad(mins % 60)}:${pad(secs)}`
      : `${pad(mins)}:${pad(secs)}`;
  };

  const startCallTimer = () => {
    stopCallTimer();
    callTimerRef.current = setInterval(
      () => setCallDuration((p) => p + 1),
      1000
    );
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = null;
    setCallDuration(0);
  };

  const stopRingtone = () => {
    ringAudio.pause();
    ringAudio.currentTime = 0;
  };

  const startRingtone = () => {
    stopRingtone(); // Stop any existing ringtone first
    ringAudio.loop = true;
    ringAudio.volume = 0.7;
    ringAudio.play().catch(() => {});
  };

  const attachMediaStream = (sipSession) => {
    if (!sipSession) return;

    const pc = sipSession.sessionDescriptionHandler?.peerConnection;
    if (!pc) {
      console.warn("No peer connection found on session");
      return;
    }

    const remoteElement = remoteAudioRef.current;
    if (!remoteElement) {
      console.warn("No remote audio element found");
      return;
    }

    // Prepare a MediaStream for existing tracks
    const existing = new MediaStream();
    pc.getReceivers().forEach((r) => {
      if (r.track) existing.addTrack(r.track);
    });

    // Attach any pre-existing tracks
    if (existing.getTracks().length > 0) {
      remoteElement.srcObject = existing;
      remoteElement
        .play()
        .catch((err) => console.warn("Autoplay blocked:", err));
    }

    // Handle future incoming tracks
    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      const stream = event.streams?.[0] || new MediaStream([event.track]);
      remoteElement.srcObject = stream;
      remoteElement
        .play()
        .catch((err) => console.warn("Autoplay blocked:", err));
    };
  };

  // ---------- Incoming call ----------
  const handleIncomingInvite = (invitation) => {
    if (!allowRingingRef.current) {
      invitation.reject().catch(console.error);
      return;
    }

    wasAnsweredRef.current = false;

    const number = invitation?.remoteIdentity?.uri?.user || "";
    setLastIncomingNumber(number);
    setIncomingCall(invitation);
    setPhoneStatus("Ringing");

    onIncomingCall?.(number);

    ringAudio.loop = true;
    ringAudio.volume = 0.7;
    ringAudio.play().catch(() => {});

    invitation.stateChange.addListener((state) => {
      if (state === SessionState.Terminated) {
        stopRingtone();
        clearTimeout(autoRejectTimerRef.current);
        setIncomingCall(null);
        setPhoneStatus("Idle");
        if (!wasAnsweredRef.current) {
          onMissedCall?.(number);
        }
      }
    });

    autoRejectTimerRef.current = setTimeout(() => {
      invitation.reject().catch(console.error);
      setPhoneStatus("Idle");
      stopRingtone();
      setIncomingCall(null);
      if (!wasAnsweredRef.current) {
        onMissedCall?.(number);
      }
    }, 20000);
  };

  // ---------- UA startup ----------
  useEffect(() => {
    if (!sipConfig) {
      setPhoneStatus("Not configured");
      return;
    }

    const ua = new UserAgent(sipConfig);
    const registerer = new Registerer(ua);

    ua.delegate = {
      onInvite: (incomingSession) => {
        console.log("Incoming call", incomingSession);
        handleIncomingInvite(incomingSession);
      },
    };

    setUserAgent(ua);

    ua.start()
      .then(() => {
        registerer.register();
        setPhoneStatus("Idle");
      })
      .catch((error) => {
        console.error("UA failed to start:", error);
        setPhoneStatus("Connection Failed");
      });

    return () => {
      registerer.unregister().catch(console.error);
      ua.stop();
      stopRingtone();
      stopCallTimer();
    };
  }, [sipConfig]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCallTimer();
    };
  }, []);

  // ---------- Actions ----------
  const acceptCall = async () => {
    if (!incomingCall) return;

    clearTimeout(autoRejectTimerRef.current);
    stopRingtone();

    console.log("Accepting call...");

    try {
      await incomingCall.accept();
      wasAnsweredRef.current = true;

      attachMediaStream(incomingCall);
      setSession(incomingCall);
      setIncomingCall(null);
      setPhoneStatus("In Call");
      startCallTimer();

      localStorage.setItem(
        "activeCallState",
        JSON.stringify({
          phoneStatus: "In Call",
          phoneNumber: lastIncomingNumber || "",
          callStartTime: new Date().toISOString(),
          hasActiveCall: true,
        })
      );

      onCallAccepted?.(lastIncomingNumber);

      incomingCall.stateChange.addListener((state) => {
        console.log("Call state:", state);
        if (state === SessionState.Terminated) {
          setPhoneStatus("Idle");
          setSession(null);
          stopCallTimer();
          localStorage.removeItem("activeCallState");
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
          }
          onCallEnded?.();
        }
      });
    } catch (error) {
      console.error("Accept failed:", error);
      setPhoneStatus("Idle");
      setIncomingCall(null);
      localStorage.removeItem("activeCallState");
    }
  };

  const rejectCall = () => {
    if (!incomingCall) return;
    clearTimeout(autoRejectTimerRef.current);
    incomingCall.reject().catch(console.error);
    onMissedCall?.(lastIncomingNumber);
    setIncomingCall(null);
    setPhoneStatus("Idle");
    stopRingtone();
  };

  const endCall = () => {
    if (session) {
      session.bye().catch(console.error);
      setSession(null);
      setPhoneStatus("Idle");
      localStorage.removeItem("activeCallState");
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
      stopRingtone();
      stopCallTimer();
      setIncomingCall(null);
      onCallEnded?.();
    } else if (incomingCall) {
      incomingCall.reject().catch(console.error);
      setIncomingCall(null);
      setPhoneStatus("Idle");
      localStorage.removeItem("activeCallState");
      stopRingtone();
      stopCallTimer();
      onCallEnded?.();
    }
  };

  const dial = (number) => {
    if (!userAgent || !number) return;
    const targetURI = UserAgent.makeURI(`sip:${number}@${SIP_DOMAIN}`);

    if (!targetURI) return;

    const inviter = new Inviter(userAgent, targetURI, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
    });

    setSession(inviter);
    inviter
      .invite()
      .then(() => {
        setPhoneStatus("Dialing");
        startRingtone(); // Start ringing when dialing
        inviter.stateChange.addListener((state) => {
          if (state === SessionState.Established) {
            stopRingtone(); // Stop ringing when call is answered
            attachMediaStream(inviter);
            setPhoneStatus("In Call");
            startCallTimer();

            localStorage.setItem(
              "activeCallState",
              JSON.stringify({
                phoneStatus: "In Call",
                phoneNumber: number || "",
                callStartTime: new Date().toISOString(),
                hasActiveCall: true,
              })
            );
          }

          if (state === SessionState.Terminated) {
            stopRingtone(); // Stop ringing when call is terminated
            setPhoneStatus("Idle");
            setSession(null);
            localStorage.removeItem("activeCallState");
            if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
            stopCallTimer();
            onCallEnded?.();
          }
        });
      })
      .catch((error) => {
        console.error("Call failed:", error);
        stopRingtone(); // Stop ringing if call fails
        setPhoneStatus("Call Failed");
      });
  };

  const redial = (number, missedCallId = null) => {
    if (!userAgent || !number) return;
    const formatted = number.startsWith("+255")
      ? `0${number.substring(4)}`
      : number;
    console.log("formatted", formatted);
    const targetURI = UserAgent.makeURI(`sip:${formatted}@${SIP_DOMAIN}`);
    if (!targetURI) return;

    const inviter = new Inviter(userAgent, targetURI, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
    });

    setSession(inviter);
    inviter
      .invite()
      .then(() => {
        setPhoneStatus("Dialing");
        startRingtone(); // Start ringing when redialing
        inviter.stateChange.addListener((state) => {
          if (state === SessionState.Established) {
            stopRingtone(); // Stop ringing when call is answered
            attachMediaStream(inviter);
            setPhoneStatus("In Call");
            startCallTimer();

            localStorage.setItem(
              "activeCallState",
              JSON.stringify({
                phoneStatus: "In Call",
                phoneNumber: formatted || "",
                callStartTime: new Date().toISOString(),
                hasActiveCall: true,
              })
            );
          }

          if (state === SessionState.Terminated) {
            stopRingtone(); // Stop ringing when call is terminated
            setPhoneStatus("Idle");
            setSession(null);
            localStorage.removeItem("activeCallState");
            if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
            stopCallTimer();
            onCallEnded?.();
          }
        });
      })
      .catch((error) => {
        console.error("Redial invite failed:", error);
        stopRingtone(); // Stop ringing if redial fails
        setPhoneStatus("Call Failed");
      });
  };

  const blindTransfer = async (targetExt) => {
    const target = String(targetExt || "").trim();

    if (!session) {
      showAlert?.("No active call to transfer", "warning");
      return;
    }

    if (!target) {
      showAlert?.("Please enter an extension", "warning");
      return;
    }

    if (target === String(extension)) {
      showAlert?.("You cannot transfer to your own extension", "error");
      return;
    }

    try {
      const targetURI = UserAgent.makeURI(`sip:${target}@${SIP_DOMAIN}`);
      if (!targetURI) {
        showAlert?.("Invalid extension format", "error");
        return;
      }

      await session.refer(targetURI);

      showAlert?.(`Call transferred to extension ${target}`, "success");

      setManualTransferExt("");
      setTimeout(() => {
        endCall();
      }, 300);
    } catch (err) {
      console.error("Blind transfer failed:", err);
      showAlert?.("Transfer failed. Try again.", "error");
    }
  };

  // ---------- Consult & Transfer (Attended Transfer) ----------
  const startConsult = (targetExt) => {
    const target = String(targetExt || "").trim();

    if (!session) {
      showAlert?.("No active call to consult", "warning");
      return;
    }

    if (!target) {
      showAlert?.("Please enter an extension", "warning");
      return;
    }

    if (target === String(extension)) {
      showAlert?.("You cannot consult your own extension", "error");
      return;
    }

    if (!userAgent) {
      showAlert?.("Phone not ready", "error");
      return;
    }

    const targetURI = UserAgent.makeURI(`sip:${target}@${SIP_DOMAIN}`);
    if (!targetURI) {
      showAlert?.("Invalid extension format", "error");
      return;
    }

    const inviter = new Inviter(userAgent, targetURI, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
    });

    setConsultSession(inviter);
    setIsConsulting(true);
    setPhoneStatus("Consulting");

    // Put original call on hold
    if (!isOnHold) {
      toggleHold();
    }

    inviter
      .invite()
      .then(() => {
        inviter.stateChange.addListener((state) => {
          if (state === SessionState.Established) {
            attachMediaStream(inviter);
            showAlert?.(`Consulting with ${target}`, "info");
          }
          if (state === SessionState.Terminated) {
            console.log("Consult call ended");
            setConsultSession(null);
            setIsConsulting(false);
            setPhoneStatus("In Call");
            // Resume original call if still on hold
            if (isOnHold) {
              toggleHold();
            }
          }
        });
      })
      .catch((err) => {
        console.error("Consult call failed:", err);
        setIsConsulting(false);
        setConsultSession(null);
        setPhoneStatus("In Call");
        showAlert?.("Consult call failed. Try again.", "error");
        // Resume original call
        if (isOnHold) {
          toggleHold();
        }
      });
  };

  const completeConsultTransfer = () => {
    if (!session || !consultSession) {
      showAlert?.("No active consult session", "warning");
      return;
    }

    try {
      const targetURI = consultSession.remoteIdentity?.uri;
      if (!targetURI) {
        showAlert?.("Invalid consult session", "error");
        return;
      }

      const targetExt = consultSession.remoteIdentity?.uri?.user || "";

      // Step 1: Transfer the original call to the consulted agent
      session
        .refer(targetURI)
        .then(() => {
          console.log("Transfer initiated, ending consult call...");
          
          // Step 2: End the consult call (second call)
          consultSession
            .bye()
            .then(() => {
              console.log("Consult call ended successfully");
              setIsConsulting(false);
              setConsultSession(null);
              setManualTransferExt("");
              
              showAlert?.(`Call transferred to extension ${targetExt}`, "success");
              
              // Step 3: End the original call after a short delay to allow transfer to complete
              setTimeout(() => {
                if (session) {
                  session.bye().catch(console.error);
                  setSession(null);
                  setPhoneStatus("Idle");
                  localStorage.removeItem("activeCallState");
                  if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
                  stopCallTimer();
                  onCallEnded?.();
                }
              }, 500);
            })
            .catch((err) => {
              console.error("Failed to end consult call:", err);
              // Still proceed with ending the original call
              setIsConsulting(false);
              setConsultSession(null);
              setManualTransferExt("");
              showAlert?.(`Call transferred to extension ${targetExt}`, "success");
              setTimeout(() => {
                if (session) {
                  session.bye().catch(console.error);
                  setSession(null);
                  setPhoneStatus("Idle");
                  localStorage.removeItem("activeCallState");
                  if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
                  stopCallTimer();
                  onCallEnded?.();
                }
              }, 500);
            });
        })
        .catch((err) => {
          console.error("Transfer failed:", err);
          showAlert?.("Transfer failed. Try again.", "error");
        });
    } catch (err) {
      console.error("Complete transfer failed:", err);
      showAlert?.("Transfer failed. Try again.", "error");
    }
  };

  const cancelConsult = () => {
    if (consultSession) {
      consultSession.bye().catch(console.error);
      setConsultSession(null);
    }
    setIsConsulting(false);
    setPhoneStatus("In Call");
    setManualTransferExt("");
    // Resume original call
    if (isOnHold) {
      toggleHold();
    }
  };

  const toggleMute = () => {
    if (!session) return;
    const pc = session.sessionDescriptionHandler.peerConnection;
    pc.getSenders().forEach((sender) => {
      if (sender.track && sender.track.kind === "audio") {
        sender.track.enabled = !sender.track.enabled;
        setIsMuted(!sender.track.enabled);
      }
    });
  };

  const toggleSpeaker = () => {
    const el = remoteAudioRef.current;
    if (el && el.setSinkId) {
      const deviceId = isSpeakerOn ? "communications" : "default";
      el.setSinkId(deviceId)
        .then(() => setIsSpeakerOn(!isSpeakerOn))
        .catch(() => {});
    }
  };

  const toggleHold = () => {
    if (!session) return;
    const pc = session.sessionDescriptionHandler.peerConnection;
    const senders = pc.getSenders();
    if (isOnHold)
      senders.forEach((s) => {
        if (s.track && s.track.kind === "audio") s.track.enabled = true;
      });
    else
      senders.forEach((s) => {
        if (s.track && s.track.kind === "audio") s.track.enabled = false;
      });
    setIsOnHold(!isOnHold);
  };

  const sendDTMF = (digit) => {
    if (!session?.sessionDescriptionHandler) return;
    const sender = session.sessionDescriptionHandler.peerConnection
      .getSenders()
      .find((s) => s.dtmf);
    if (sender?.dtmf) sender.dtmf.insertDTMF(digit);
  };

  // Check for active call state on mount
  useEffect(() => {
    const activeCallState = localStorage.getItem("activeCallState");
    if (activeCallState && phoneStatus === "Idle" && !session) {
      try {
        const callState = JSON.parse(activeCallState);
        if (callState.hasActiveCall && callState.phoneStatus === "In Call") {
          console.log("Restoring active call state from localStorage");
        }
      } catch (e) {
        console.error("Error parsing active call state:", e);
      }
    }
  }, [phoneStatus, session]);

  // Clear call state when call ends
  useEffect(() => {
    if (phoneStatus === "Idle" && !session) {
      localStorage.removeItem("activeCallState");
    }
  }, [phoneStatus, session]);

  return {
    // State
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
    consultSession,
    isConsulting,

    // Helpers
    formatDuration,

    // Actions
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
    sendDTMF,
  };
}
