/**
 * WCF datetimes are stored in MySQL as East Africa Time (+03:00).
 * Parse with that offset and always display in East Africa Time.
 */
export const WCF_DB_UTC_OFFSET = "+03:00";
export const WCF_DB_TIMEZONE = "Africa/Dar_es_Salaam";

/**
 * @param {string|Date|number|null|undefined} value
 * @returns {Date|null}
 */
export function parseDbDateTime(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  let s = String(value).trim();
  if (!s) return null;

  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) {
    const normalized = s.includes("T") ? s : s.replace(" ", "T");
    const d = new Date(normalized);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  s = s.replace(" ", "T");
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) {
    s += ":00";
  }

  const d = new Date(`${s}${WCF_DB_UTC_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatInEat(date, options = {}) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: WCF_DB_TIMEZONE,
    year: options.year ?? "numeric",
    month: options.month ?? "2-digit",
    day: options.day ?? "2-digit",
    hour: options.hour ?? "2-digit",
    minute: options.minute ?? "2-digit",
    second: options.showSeconds ? "2-digit" : undefined,
    hour12: options.hour12 ?? false,
  }).format(date);
}

/**
 * Full date/time in East Africa Time.
 * @param {string|Date|null|undefined} value
 * @param {{ fallback?: string, showSeconds?: boolean }} [options]
 */
export function formatDbDateTimeLocal(value, options = {}) {
  const date = parseDbDateTime(value);
  if (!date) return options.fallback ?? "—";

  const { showSeconds = true } = options;
  return formatInEat(date, { showSeconds, hour12: false });
}

/**
 * Time only in East Africa Time.
 */
export function formatDbTimeLocal(value) {
  const date = parseDbDateTime(value);
  if (!date) return "—";
  return formatInEat(date, {
    year: undefined,
    month: undefined,
    day: undefined,
    showSeconds: true,
    hour12: false,
  });
}

export function formatDbDateTime12h(value, options = {}) {
  const date = parseDbDateTime(value);
  if (!date) return options.fallback ?? "—";
  return formatInEat(date, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    showSeconds: false,
    hour12: true,
  });
}

export function parseDbDateOnlyRange(dateValue, endOfDay = false) {
  if (!dateValue) return null;
  const suffix = endOfDay ? "T23:59:59" : "T00:00:00";
  return parseDbDateTime(`${dateValue}${suffix}`);
}

/**
 * Elapsed mm:ss since a WCF DB datetime (queue wait / talk time).
 * @param {string|Date|null|undefined} startTime
 */
export function formatElapsedMmSs(startTime) {
  const start = parseDbDateTime(startTime);
  if (!start) return "00:00";
  const diff = Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000));
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
