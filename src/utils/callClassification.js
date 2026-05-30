/** Lost vs dropped threshold (seconds) — must match WCFCC missedCallHelper.js */
export const LOST_MIN_DURATION_SECONDS = 5 * 60;

export function classifyQueueWaitSeconds(totalSeconds) {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return "Unknown";
  return Number(totalSeconds) >= LOST_MIN_DURATION_SECONDS ? "Lost" : "Dropped";
}
