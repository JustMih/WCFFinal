import { baseURL } from "../config";

export async function markVoiceNotePlayed(id, durationSeconds = null) {
  const token = localStorage.getItem("authToken");
  const body =
    durationSeconds != null && durationSeconds > 0
      ? { duration_seconds: Math.round(durationSeconds) }
      : {};

  const res = await fetch(`${baseURL}/voice-notes/${id}/mark-played`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to mark voice note as played");
  }

  return res.json();
}
