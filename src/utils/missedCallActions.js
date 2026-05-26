import { baseURL } from "../config";

export function normalizeCallbackStatus(record) {
  const raw = record?.callback_status || record?.status || "pending";
  return String(raw).toLowerCase().trim();
}

export function isPendingCallback(record) {
  return normalizeCallbackStatus(record) === "pending";
}

export function getCallbackPhone(record) {
  return (
    record?.caller_phone ||
    record?.caller_display ||
    record?.caller ||
    ""
  );
}

export function formatOutboundNumber(number) {
  if (!number) return "";
  const s = String(number).trim();
  if (s.startsWith("+255")) return `0${s.substring(4)}`;
  return s;
}

export async function markMissedCallCalledBack(missedCallId, agentExt) {
  if (!missedCallId) return;

  const body = { status: "called_back" };
  if (agentExt) {
    body.called_back_by = agentExt;
    body.called_back_at = new Date().toISOString();
  }

  const res = await fetch(`${baseURL}/missed-calls/${missedCallId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("authToken")}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to update missed call status");
  }

  return res.json();
}

export function callbackStatusLabel(status) {
  if (status === "called_back") return "Called Back";
  if (status === "ignored") return "Ignored";
  return "Pending";
}
