import {
  UserAgent,
  Inviter,
  Registerer
} from "sip.js";

let userAgent = null;
let registerer = null;

/* ==============================
   INITIALIZE SUPERVISOR SIP
   ============================== */
export const initSupervisorSIP = async () => {
  if (userAgent) {
    console.log("ℹ️ SIP already initialized");
    return;
  }

  console.log("🚀 Initializing Supervisor SIP...");

  userAgent = new UserAgent({
    uri: UserAgent.makeURI("sip:3001@YOUR_ASTERISK_IP"),

    transportOptions: {
      server: "wss://YOUR_ASTERISK_IP:8089/ws"
    },

    authorizationUsername: "3001",
    authorizationPassword: "3001_PASSWORD",

    sessionDescriptionHandlerFactoryOptions: {
      constraints: {
        audio: true,
        video: false
      }
    }
  });

  // 🔥 REQUIRED: start UA
  await userAgent.start();

  // 🔥 REQUIRED: register supervisor
  registerer = new Registerer(userAgent);
  await registerer.register();

  console.log("✅ Supervisor SIP registered & ready");
};

/* ==============================
   PLACE SPY CALL (LISTEN / WHISPER / BARGE)
   ============================== */
export const sipCall = async (dial) => {
  if (!userAgent) {
    console.error("❌ SIP not initialized");
    return;
  }

  console.log("📞 Calling spy dial:", dial);

  const target = UserAgent.makeURI(`sip:${dial}@YOUR_ASTERISK_IP`);

  const inviter = new Inviter(userAgent, target, {
    sessionDescriptionHandlerOptions: {
      constraints: { audio: true, video: false }
    }
  });

  // 🔊 Attach live audio AFTER call is established
  inviter.stateChange.addListener((state) => {
    console.log("📡 SIP state:", state);

    if (state === "Established") {
      const pc = inviter.sessionDescriptionHandler.peerConnection;
      const remoteStream = new MediaStream();

      pc.getReceivers().forEach((receiver) => {
        if (receiver.track) {
          remoteStream.addTrack(receiver.track);
        }
      });

      const audio = document.createElement("audio");
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      audio.controls = true;

      document.body.appendChild(audio);

      audio.play().catch(err =>
        console.error("Audio play failed:", err)
      );

      console.log("🔊 Live spy audio attached");
    }
  });

  await inviter.invite();
};
