// API (reports, auth, mark-played)
export const baseURL = "http://127.0.0.1:5070/api";
// export const baseURL = "http://192.168.21.69:5070/api";

export const amiURL = "http://127.0.0.1:5075";
// export const amiURL = "http://192.168.21.69:5075";

/**
 * Where .wav files are served (no /api).
 * When API is local but DB/files are on 192.168.21.69, point here.
 */
export const serverURL = "http://192.168.21.70:5070";
// export const serverURL = baseURL.replace(/\/api\/?$/, "");

export const SIP_DOMAIN_CONFIG = "democc.wcf.go.tz";
export const ASTERISK_HOST = new URL(baseURL).hostname;
export const WSS_PORT = 8089;
