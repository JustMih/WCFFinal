export function isPublicRelationUnit(name) {
  return String(name || "").toLowerCase().includes("public relation");
}

/**
 * Reviewer who heads Public Relation Unit acts as head-of-unit after rating + forward.
 */
export function isReviewerActingAsHeadOfUnit({
  userRole,
  userId,
  userUnitSection,
  ticket,
}) {
  if (!ticket || userRole !== "reviewer" || !userId) {
    return false;
  }

  if (!ticket.complaint_type) {
    return false;
  }

  if (String(ticket.assigned_to_id || "") !== String(userId)) {
    return false;
  }

  const ticketUnit =
    ticket.sub_section || ticket.responsible_unit_name || ticket.section || "";
  const storedUnit =
    userUnitSection ||
    (typeof localStorage !== "undefined"
      ? localStorage.getItem("unit_section")
      : "") ||
    "";

  if (!isPublicRelationUnit(ticketUnit) && !isPublicRelationUnit(storedUnit)) {
    return false;
  }

  const assignedRole = String(ticket.assigned_to_role || "").toLowerCase();
  if (assignedRole === "head-of-unit") {
    return true;
  }

  return ["forwarded", "assigned"].includes(
    String(ticket.status || "").toLowerCase()
  );
}

export function getEffectiveActionRole({ userRole, userId, userUnitSection, ticket }) {
  if (
    isReviewerActingAsHeadOfUnit({ userRole, userId, userUnitSection, ticket })
  ) {
    return "head-of-unit";
  }

  return userRole || "";
}
