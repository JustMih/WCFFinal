import {
  UserAgent,
  Inviter,
  Registerer
} from "sip.js";
import { baseURL } from "../config";

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

  // Get SIP credentials from localStorage
  const extension = localStorage.getItem("extension");
  const sipPassword = localStorage.getItem("sipPassword");

  // Extract SIP domain from baseURL (e.g., "http://192.168.21.70:5070/api" -> "192.168.21.70")
  let sipDomain = null;
  try {
    const url = new URL(baseURL);
    sipDomain = url.hostname;
  } catch (error) {
    console.error("❌ Invalid baseURL format:", baseURL);
    // Fallback to hardcoded domain if URL parsing fails
    sipDomain = "192.168.21.70";
  }

  // Validate required credentials
  if (!extension || !sipPassword) {
    console.warn("⚠️ SIP credentials not found. Skipping supervisor SIP initialization.");
    console.log("Required: extension and sipPassword in localStorage");
    return;
  }

  if (!sipDomain) {
    console.error("❌ Cannot determine SIP domain");
    return;
  }

  console.log("🚀 Initializing Supervisor SIP...");

  try {
    userAgent = new UserAgent({
      uri: UserAgent.makeURI(`sip:${extension}@${sipDomain}`),

      transportOptions: {
        server: `wss://${sipDomain}:8089/ws`
      },

      authorizationUsername: extension,
      authorizationPassword: sipPassword,

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
  } catch (error) {
    console.error("❌ Failed to initialize Supervisor SIP:", error);
    userAgent = null;
    registerer = null;
  }
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

  // Extract SIP domain from baseURL
  let sipDomain = null;
  try {
    const url = new URL(baseURL);
    sipDomain = url.hostname;
  } catch (error) {
    console.error("❌ Invalid baseURL format:", baseURL);
    sipDomain = "192.168.21.70"; // Fallback
  }

  if (!sipDomain) {
    console.error("❌ Cannot determine SIP domain");
    return;
  }

  const target = UserAgent.makeURI(`sip:${dial}@${sipDomain}`);

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
