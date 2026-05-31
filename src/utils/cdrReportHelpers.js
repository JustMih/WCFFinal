/**
 * CDR Talk Time = Total Call Duration - Agent Response Wait from IVR.
 * If agent wait is null/missing, Talk Time is 0.
 */
export function computeCdrTalkTimeSec(report) {
  const wait = report?.agent_wait_sec;
  if (wait == null || wait === "") return 0;
  const total = Number(report?.duration);
  if (!Number.isFinite(total)) return 0;
  return Math.max(0, total - Number(wait));
}
