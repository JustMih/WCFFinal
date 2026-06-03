/**
 * WCF CDR / MissedCalls datetimes are stored in MySQL as East Africa Time (+03:00).
 * Parse with that offset, then display in the viewer's local timezone.
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

/**
 * Full date/time in the user's local timezone.
 * @param {string|Date|null|undefined} value
 * @param {{ fallback?: string, showSeconds?: boolean }} [options]
 */
export function formatDbDateTimeLocal(value, options = {}) {
  const date = parseDbDateTime(value);
  if (!date) return options.fallback ?? "—";

  const { showSeconds = true } = options;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12: false,
  });
}

/**
 * Time only in the user's local timezone (for tables like Missed At).
 */
export function formatDbTimeLocal(value) {
  const date = parseDbDateTime(value);
  if (!date) return "—";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
