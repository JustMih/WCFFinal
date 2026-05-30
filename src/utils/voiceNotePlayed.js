import { baseURL } from "../config";

export const PLAYED_VOICE_NOTES_KEY = "playedVoiceNotes";
export const VOICE_NOTE_PLAYED_EVENT = "voiceNotePlayed";

export function getPlayedVoiceNotesMap() {
  try {
    return JSON.parse(localStorage.getItem(PLAYED_VOICE_NOTES_KEY)) || {};
  } catch {
    return {};
  }
}

export function isVoiceNotePlayed(note, playedMap = getPlayedVoiceNotesMap()) {
  if (!note) return false;
  if (Number(note.is_played) === 1 || note.is_played === true) return true;
  return Boolean(playedMap[note.id]);
}

export function countUnplayedVoiceNotes(notes) {
  if (!Array.isArray(notes)) return 0;
  const playedMap = getPlayedVoiceNotesMap();
  return notes.filter((note) => !isVoiceNotePlayed(note, playedMap)).length;
}

export function setVoiceNotePlayedLocally(id) {
  const map = getPlayedVoiceNotesMap();
  map[id] = true;
  localStorage.setItem(PLAYED_VOICE_NOTES_KEY, JSON.stringify(map));
}

/** Notify agent dashboard badge and call-history voicemail counts (same tab). */
export function notifyVoiceNotePlayed(id) {
  window.dispatchEvent(
    new CustomEvent(VOICE_NOTE_PLAYED_EVENT, { detail: { id } })
  );
}

/** Build query string for GET /voice-notes */
export function buildVoiceNotesQuery({ agentId, unplayedOnly } = {}) {
  const params = new URLSearchParams();
  if (agentId) params.set("agentId", String(agentId));
  if (unplayedOnly) params.set("unplayedOnly", "true");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchVoiceNotes({ agentId, unplayedOnly = false } = {}) {
  const token = localStorage.getItem("authToken");
  const url = `${baseURL}/voice-notes${buildVoiceNotesQuery({
    agentId,
    unplayedOnly,
  })}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error("Failed to fetch voice notes");
  const data = await res.json();
  return data.voiceNotes || [];
}

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

  const data = await res.json();
  setVoiceNotePlayedLocally(id);
  notifyVoiceNotePlayed(id);
  return data;
}
