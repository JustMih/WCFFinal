export function buildHandoverBlockState(participants = []) {
  const blockedUserIds = new Set();
  const reasonByUserId = {};

  for (const entry of participants) {
    if (!entry?.userId) continue;
    const id = String(entry.userId);
    blockedUserIds.add(id);
    const label =
      entry.role === "initiator" ? "Handover active" : "Handover delegate";
    if (!reasonByUserId[id] || entry.role === "initiator") {
      reasonByUserId[id] = label;
    }
  }

  return { blockedUserIds, reasonByUserId };
}

export function getActorHandoverBlockMessage(participants, actorId) {
  if (!actorId) return null;
  const id = String(actorId);
  const roles = participants
    .filter((p) => String(p.userId) === id)
    .map((p) => p.role);

  if (roles.includes("initiator")) {
    return "You have an active handover. Revoke it before starting another.";
  }
  if (roles.includes("delegate")) {
    return "You are acting as a handover delegate and cannot start a new handover.";
  }
  return null;
}

export function formatHandoverUserLabel(user, reasonByUserId) {
  const base = user?.full_name
    ? `${user.full_name} (${user.role})`
    : "";
  const reason = reasonByUserId[String(user?.id)];
  return reason ? `${base} — ${reason}` : base;
}
