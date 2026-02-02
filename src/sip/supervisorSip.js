import { UserAgent, Registerer, Inviter } from "sip.js";
import { baseURL } from "../config";

let userAgent = null;
let registerer = null;
let isReady = false;

export const isSipReady = () => isReady;

/* =====================================
   INITIALIZE SUPERVISOR SIP
===================================== */
export const initSupervisorSIP = async () => {
  if (userAgent && isReady) {
    console.log("ℹ️ SIP already initialized");
    return;
  }

  try {
    console.log("🚀 Initializing Supervisor SIP...");

    const supervisorExt = "3001";
    const supervisorPass = "wcf12345";
    const asteriskIP = "192.168.21.69";

    userAgent = new UserAgent({
      uri: UserAgent.makeURI(`sip:${supervisorExt}@${asteriskIP}`),
      transportOptions: {
        server: `wss://${asteriskIP}:8089/ws`,
      },
      authorizationUsername: supervisorExt,
      authorizationPassword: supervisorPass,
      sessionDescriptionHandlerFactoryOptions: {
        constraints: { audio: true, video: false },
      },
    });

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
 
export const sipCall = async (channel, mode = "q") => {
  if (!userAgent || !isReady) {
    console.error("❌ SIP not initialized");
    return;
  }

  try {
    console.log("🎧 Starting ChanSpy on:", channel);

    const target = UserAgent.makeURI(
      `sip:chanspy@${userAgent.configuration.uri.host}`
    );

    const inviter = new Inviter(userAgent, target, {
      extraHeaders: [
        `X-Spy-Channel: ${channel}`,
        `X-Spy-Mode: ${mode}`
      ],
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false }
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

        audio.play().catch(() => {
          alert("🔊 Click anywhere to enable supervisor audio");
        });

        console.log("🔊 Supervisor audio attached");
      }
    });

    await inviter.invite();

  } catch (err) {
    console.error("❌ Spy call failed:", err);
  }
};
