const DEDUP_WINDOW_MS = 90 * 1000;

function finalizePhone(digits) {
  if (!digits) return "";
  let phone = String(digits).replace(/[^+\d]/g, "");
  if (phone.startsWith("255")) phone = `0${phone.slice(3)}`;
  if (phone.startsWith("+255")) phone = `0${phone.slice(4)}`;
  if (phone.startsWith("+")) phone = phone.slice(1);
  if (!phone.startsWith("0") && phone.length === 9) phone = `0${phone}`;
  return phone;
}

export function normalizeCaller(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  const angle = s.match(/<([^>]+)>/);
  if (angle?.[1]) {
    const p = finalizePhone(angle[1]);
    if (p.length >= 9) return p;
  }
  let digits = s.replace(/[^+\d]/g, "");
  if (digits.length > 12) {
    const tail = digits.match(/(0\d{9})$/);
    if (tail) return tail[1];
  }
  const p = finalizePhone(digits);
  return p.length >= 9 ? p : "";
}

export function dedupeLostCallsClient(rows, timeField = "call_time") {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const sorted = [...rows].sort(
    (a, b) => new Date(a[timeField]) - new Date(b[timeField])
  );
  const lastByCaller = new Map();
  const kept = [];

  for (const row of sorted) {
    const caller = normalizeCaller(row.caller);
    if (!caller) {
      kept.push(row);
      continue;
    }
    const t = new Date(row[timeField]).getTime();
    const prev = lastByCaller.get(caller);
    if (prev != null && t - prev <= DEDUP_WINDOW_MS) continue;
    lastByCaller.set(caller, t);
    kept.push({ ...row, caller });
  }

  return kept.sort((a, b) => new Date(b[timeField]) - new Date(a[timeField]));
}
