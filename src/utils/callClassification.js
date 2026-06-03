/**
 * Lost vs dropped — must match WCFCC utils/queueTimingConstants.js
 * Queue dialplan: Queue(...,300,queue-exit); CDR sum may be ~294–299s.
 */
export const QUEUE_EXIT_TIMEOUT_SECONDS = 300;
export const LOST_CLASSIFY_GRACE_SECONDS = 6;
export const LOST_MIN_DURATION_SECONDS =
  QUEUE_EXIT_TIMEOUT_SECONDS - LOST_CLASSIFY_GRACE_SECONDS;

export function normalizeQueueWaitSeconds(totalSeconds) {
  const w = Math.floor(Number(totalSeconds) || 0);
  if (w <= 0) return 0;
  if (w >= LOST_MIN_DURATION_SECONDS) return QUEUE_EXIT_TIMEOUT_SECONDS;
  return w;
}

export function classifyQueueWaitSeconds(totalSeconds) {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return "Unknown";
  return Number(totalSeconds) >= LOST_MIN_DURATION_SECONDS ? "Lost" : "Dropped";
}
