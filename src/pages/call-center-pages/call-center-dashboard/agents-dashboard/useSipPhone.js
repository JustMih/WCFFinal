import { useEffect, useMemo, useRef, useState } from "react";
import { UserAgent, Inviter, Registerer, SessionState } from "sip.js";

export function useSipPhone({
  extension,
  sipPassword,
  SIP_DOMAIN,
  onIncomingNumber,
  onMissedCall,
  onCallEnded,
}) {
  // ---------- Core state ----------
  const [phoneStatus, setPhoneStatus] = useState("Idle");
  const [userAgent, setUserAgent] = useState(null);
  const [session, setSession] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isOnHold, setIsOnHold] = useState(false);

  const remoteAudioRef = useRef(null);
  const ringAudioRef = useRef(new Audio("/ringtone.mp3"));

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
      register: true,
      sessionDescriptionHandlerFactoryOptions: {
        constraints: { audio: true, video: false },
      },
    };
  }, [extension, sipPassword, SIP_DOMAIN]);

  // ---------- Helpers ----------
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
    ringAudioRef.current.pause();
    ringAudioRef.current.currentTime = 0;
  };

  const attachMediaStream = (sipSession) => {
    const pc = sipSession?.sessionDescriptionHandler?.peerConnection;
    if (!pc || !remoteAudioRef.current) return;

    const stream = new MediaStream();
    pc.getReceivers().forEach((r) => r.track && stream.addTrack(r.track));

    remoteAudioRef.current.srcObject = stream;
    remoteAudioRef.current.play().catch(() => {});

    pc.ontrack = (e) => {
      remoteAudioRef.current.srcObject =
        e.streams?.[0] || new MediaStream([e.track]);
    };
  };

  // ---------- Incoming call ----------
  const handleIncomingInvite = (invitation) => {
    wasAnsweredRef.current = false;
    const number = invitation?.remoteIdentity?.uri?.user || "";

    onIncomingNumber?.(number);

    setIncomingCall(invitation);
    setPhoneStatus("Ringing");

    ringAudioRef.current.loop = true;
    ringAudioRef.current.play().catch(() => {});

    invitation.stateChange.addListener((state) => {
      if (state === SessionState.Terminated) {
        stopRingtone();
        clearTimeout(autoRejectTimerRef.current);
        setIncomingCall(null);
        setPhoneStatus("Idle");
        if (!wasAnsweredRef.current) onMissedCall?.(number);
      }
    });

    autoRejectTimerRef.current = setTimeout(() => {
      invitation.reject().catch(() => {});
      stopRingtone();
      setIncomingCall(null);
      setPhoneStatus("Idle");
      if (!wasAnsweredRef.current) onMissedCall?.(number);
    }, 20000);
  };

  // ---------- UA startup ----------
  useEffect(() => {
    if (!sipConfig) return;

    const ua = new UserAgent(sipConfig);
    const registerer = new Registerer(ua);

    ua.delegate = {
      onInvite: handleIncomingInvite,
    };

    setUserAgent(ua);

    ua.start()
      .then(() => {
        registerer.register();
        setPhoneStatus("Idle");
      })
      .catch(() => setPhoneStatus("Connection Failed"));

    return () => {
      registerer.unregister().catch(() => {});
      ua.stop();
      stopCallTimer();
      stopRingtone();
    };
  }, [sipConfig]);

  // ---------- Actions ----------
  const acceptCall = async () => {
    if (!incomingCall) return;
    clearTimeout(autoRejectTimerRef.current);
    stopRingtone();

    await incomingCall.accept();
    wasAnsweredRef.current = true;

    attachMediaStream(incomingCall);
    setSession(incomingCall);
    setIncomingCall(null);
    setPhoneStatus("In Call");
    startCallTimer();
  };

  const rejectCall = () => {
    incomingCall?.reject().catch(() => {});
    stopRingtone();
    setIncomingCall(null);
    setPhoneStatus("Idle");
  };

  const endCall = () => {
    session?.bye?.().catch(() => {});
    setSession(null);
    stopCallTimer();
    setPhoneStatus("Idle");
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    onCallEnded?.();
  };

  const dial = (number) => {
    if (!userAgent || !number) return;

    const targetURI = UserAgent.makeURI(`sip:${number}@${SIP_DOMAIN}`);
    const inviter = new Inviter(userAgent, targetURI);

    setSession(inviter);
    inviter.invite().then(() => {
      setPhoneStatus("Dialing");
      inviter.stateChange.addListener((state) => {
        if (state === SessionState.Established) {
          attachMediaStream(inviter);
          setPhoneStatus("In Call");
          startCallTimer();
        }
        if (state === SessionState.Terminated) endCall();
      });
    });
  };
  const blindTransfer = async (targetExtension) => {
    if (!session) {
      console.warn("No active call to transfer");
      return;
    }
  
    const target = String(targetExtension || "").trim();
    if (!target) {
      console.warn("Invalid transfer target");
      return;
    }
  
    // Prevent self-transfer
    if (target === String(extension)) {
      console.warn("Cannot transfer to same extension");
      return;
    }
  
    try {
      const targetURI = UserAgent.makeURI(`sip:${target}@${SIP_DOMAIN}`);
      if (!targetURI) {
        console.warn("Failed to create target URI");
        return;
      }
  
      await session.refer(targetURI);
  
      // Clean local state AFTER REFER
      setSession(null);
      stopCallTimer();
      setPhoneStatus("Idle");
  
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
  
      onCallEnded?.();
  
    } catch (err) {
      console.error("Blind transfer failed:", err);
    }
  };
  
  const toggleMute = () => {
    const pc = session?.sessionDescriptionHandler?.peerConnection;
    pc?.getSenders().forEach((s) => {
      if (s.track?.kind === "audio") {
        s.track.enabled = !s.track.enabled;
        setIsMuted(!s.track.enabled);
      }
    });
  };

  const toggleHold = () => {
    const pc = session?.sessionDescriptionHandler?.peerConnection;
    pc?.getSenders().forEach((s) => {
      if (s.track?.kind === "audio") s.track.enabled = isOnHold;
    });
    setIsOnHold(!isOnHold);
  };

  const toggleSpeaker = () => {
    const el = remoteAudioRef.current;
    if (!el?.setSinkId) return;
    el.setSinkId(isSpeakerOn ? "communications" : "default")
      .then(() => setIsSpeakerOn(!isSpeakerOn))
      .catch(() => {});
  };

  return {
    phoneStatus,
    incomingCall,
    callDuration,
    isMuted,
    isSpeakerOn,
    isOnHold,
    remoteAudioRef,

    actions: {
      acceptCall,
      rejectCall,
      endCall,
      dial,
      blindTransfer, 
      toggleMute,
      toggleHold,
      toggleSpeaker,
    },
  };
}
