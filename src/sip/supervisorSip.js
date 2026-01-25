import {
  UserAgent,
  Inviter,
  Registerer
} from "sip.js";

let userAgent = null;
let registerer = null;
let isReady = false;

/* =====================================
   INITIALIZE SUPERVISOR SIP (ONCE)
===================================== */
export const initSupervisorSIP = async () => {
  if (userAgent) {
    console.log("ℹ️ SIP already initialized");
    return;
  }

  try {
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

    // 🔥 REQUIRED
    await userAgent.start();

    registerer = new Registerer(userAgent);
    await registerer.register();

    isReady = true;
    console.log("✅ Supervisor SIP registered & ready");

  } catch (err) {
    console.error("❌ SIP initialization failed:", err);
    isReady = false;
  }
};

/* =====================================
   PLACE SPY CALL (ChanSpy)
===================================== */
export const sipCall = async (dial) => {
  if (!userAgent || !isReady) {
    console.error("❌ SIP not initialized");
    return;
  }

  try {
    console.log("📞 Spy call:", dial);

    // NOTE: ChanSpy is executed inside Asterisk
    const target = UserAgent.makeURI(
      `sip:${dial}@YOUR_ASTERISK_IP`
    );

    const inviter = new Inviter(userAgent, target, {
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: true,
          video: false
        }
      }
    });

    inviter.stateChange.addListener((state) => {
      console.log("📡 SIP state:", state);

      if (state === "Established") {
        const pc = inviter.sessionDescriptionHandler.peerConnection;
        const remoteStream = new MediaStream();

        pc.getReceivers().forEach((r) => {
          if (r.track) remoteStream.addTrack(r.track);
        });

        const audio = document.createElement("audio");
        audio.srcObject = remoteStream;
        audio.autoplay = true;
        audio.controls = true;

        document.body.appendChild(audio);

        audio.play().catch((e) =>
          console.error("🔇 Audio play failed:", e)
        );

        console.log("🔊 Supervisor audio attached");
      }
    });

    await inviter.invite();

  } catch (err) {
    console.error("❌ Spy call failed:", err);
  }
};
