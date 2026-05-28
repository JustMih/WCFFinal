// on development
export const baseURL = "https://democc.wcf.go.tz/api";
export const amiURL = "http://127.0.0.1:5075";
// export const SIP_DOMAIN_CONFIG = "democc.wcf.go.tz";
export const serverURL = "http://192.168.21.70:5070";
// on development

// export const baseURL="https://democc.wcf.go.tz"
// export const amiURL = "http://127.0.0.1:5075";
// export const amiURL = "http://192.168.21.70:5075";

/**
 * Where .wav files are served (no /api).
 * When API is local but DB/files are on 192.168.21.70, point here.
 */
// export const serverURL = "http://192.168.21.70:5070";
// export const serverURL = baseURL.replace(/\/api\/?$/, "");

/** SIP / WebRTC host (must match Asterisk TLS cert on port 8089). */
export const SIP_DOMAIN_CONFIG =
  process.env.REACT_APP_SIP_DOMAIN || "democc.wcf.go.tz";

export const ASTERISK_HOST = new URL(baseURL).hostname;
export const WSS_PORT = 8089;
