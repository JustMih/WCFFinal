const sipConfig = {
  uri: UserAgent.makeURI(`sip:${extension}@10.52.0.19`),
  transportOptions: {
    server: "wss://10.52.0.19:8089/ws",
  },
  authorizationUsername: extension,
  authorizationPassword: sipPassword,
  register: true,
  registerExpires: 300,
  sessionDescriptionHandlerFactoryOptions: {
    constraints: { audio: true, video: false },
  },
  userAgentString: `SIP.js/0.20.0 ${extension}`,
  hackIpInContact: true
};

useEffect(() => {
  const savedStatus = localStorage.getItem("agentStatus");
  if (savedStatus) {
    setAgentStatus(savedStatus);
  }

  ringAudio.loop = true;
  ringAudio.volume = 0.7;
  remoteAudio.autoplay = true;

  const ua = new UserAgent(sipConfig);
  const registerer = new Registerer(ua);
  setUserAgent(ua);

  // Handle registration state changes
  registerer.stateChange.addListener((state) => {
    console.log("Registration state changed:", state);
    if (state === RegistererState.Registered) {
      console.log("✅ SIP UA Registered successfully");
      setPhoneStatus("Idle");
    } else if (state === RegistererState.Unregistered) {
      console.log("❌ SIP UA Unregistered");
      setPhoneStatus("Unregistered");
    } else if (state === RegistererState.Terminated) {
      console.log("❌ SIP UA Registration terminated");
      setPhoneStatus("Registration Failed");
    }
  });

  ua.start()
    .then(() => {
      console.log("✅ SIP UA Started");
      registerer.register()
        .then(() => {
          console.log("✅ Registration request sent");
        })
        .catch((error) => {
          console.error("❌ Registration failed:", error);
          setPhoneStatus("Registration Failed");
        });
    })
    .catch((error) => {
      console.error("❌ UA failed to start:", error);
      setPhoneStatus("Connection Failed");
    });

  ua.delegate = {
    onInvite: (invitation) => {
      console.log("📞 Incoming call");
      setIncomingCall(invitation);
      setCallerId(
        invitation.remoteIdentity.displayName ||
        invitation.remoteIdentity.uri.user ||
        "Unknown Caller"
      );
      setIncomingModalOpen(true);
      setPhoneStatus("Ringing");
      ringAudio.play().catch((err) => console.error("🔇 Ringtone error:", err));

      invitation.stateChange.addListener((state) => {
        console.log("📈 Call state changed:", state);

        if (state === SessionState.Terminated) {
          console.log("📴 Call terminated detected by listener.");
          stopRingtone();
          clearTimeout(autoRejectTimerRef.current);
          setIncomingCall(null);
          setIncomingModalOpen(false);
          setPhoneStatus("Idle");

          if (phoneStatus === "Ringing") {
            addMissedCall(callerId);
          }
        }
      });

      autoRejectTimerRef.current = setTimeout(() => {
        if (incomingCall) {
          console.log("⏰ No answer within 20 seconds, auto-rejecting...");
          incomingCall.reject().catch(console.error);
          addMissedCall(callerId);
          setIncomingModalOpen(false);
          setPhoneStatus("Idle");
          stopRingtone();
          setIncomingCall(null);
        }
      }, 20000);
    },
  };

  return () => {
    registerer.unregister().catch(console.error);
    ua.stop();
    stopRingtone();
    stopTimer();
  };
}, []);

const handleAcceptCall = () => {
  if (!incomingCall) return;
  clearTimeout(autoRejectTimerRef.current);
  incomingCall
    .accept()
    .then(() => {
      setSession(incomingCall);
      setIncomingCall(null);
      setPhoneStatus("In Call");
      stopRingtone();
      startTimer();

      incomingCall.stateChange.addListener((state) => {
        if (state === SessionState.Established) {
          console.log("📞 Call accepted");
        } else if (state === SessionState.Terminated) {
          console.log("📴 Call ended after accept");
          setPhoneStatus("Idle");
          setSession(null);
          setIncomingCall(null);
          stopTimer();
        }
      });
    })
    .catch((error) => {
      console.error("❌ Failed to accept call:", error);
      setPhoneStatus("Idle");
      setIncomingModalOpen(false);
    });
};

const handleDial = () => {
  if (!userAgent || !phoneNumber) return;

  const target = `sip:${phoneNumber}@10.52.0.19`;
  const targetURI = UserAgent.makeURI(target);
  if (!targetURI) return;

  const inviter = new Inviter(userAgent, targetURI);

  setSession(inviter);

  inviter
    .invite()
    .then(() => {
      setPhoneStatus("Dialing");
      inviter.stateChange.addListener((state) => {
        if (state === SessionState.Established) {
          console.log("📞 Outgoing call established");
          setPhoneStatus("In Call");
          startTimer();
        } else if (state === SessionState.Terminated) {
          console.log("📴 Call ended");
          setPhoneStatus("Idle");
          setSession(null);
          stopTimer();
        }
      });
    })
    .catch((error) => {
      console.error("❌ Call failed:", error);
      setPhoneStatus("Call Failed");
    });
}; 