/**
 * Format a duration stored in seconds for display in minutes.
 * @param {number|string|null|undefined} value - duration in seconds
 * @param {boolean} [includeUnit=true] - append " min" suffix (omit when column title already says min)
 * @returns {string}
 */
export function formatSecondsToMinutes(value, includeUnit = true) {
  const seconds = Number(value);
  if (value === null || value === undefined || value === "") return "-";
  if (!Number.isFinite(seconds) || seconds < 0) return "-";
  if (seconds === 0) return includeUnit ? "0 min" : "0";
  const minutes = seconds / 60;
  const rounded =
    minutes >= 10
      ? Math.round(minutes * 10) / 10
      : Math.round(minutes * 100) / 100;
  return includeUnit ? `${rounded} min` : String(rounded);
}

/**
 * Format voice note duration for display (numeric seconds only; unit belongs in column title).
 * @param {number|string|null|undefined} value - duration in seconds
 * @returns {string}
 */
export function formatVoiceNoteDuration(value) {
  const seconds = Math.round(Number(value));
  if (value === null || value === undefined || value === "") return "—";
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  return String(seconds);
}
