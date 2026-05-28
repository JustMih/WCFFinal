/**
 * Detect handover delegate notifications (user received tickets from another user).
 */
export function isHandoverNotification(n) {
  if (!n) return false;
  const msg = (n.message || "").toLowerCase();
  const cat = (n.category || "").toLowerCase();
  return (
    cat === "handover" ||
    msg.startsWith("handover:") ||
    (msg.includes("handed over") && msg.includes("to you"))
  );
}
