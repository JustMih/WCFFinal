export function getTicketInstitutionName(ticket) {
  if (!ticket) return null;

  if (typeof ticket.institution === "string" && ticket.institution.trim() !== "") {
    return ticket.institution.trim();
  }

  if (
    ticket.institution &&
    typeof ticket.institution === "object" &&
    typeof ticket.institution.name === "string" &&
    ticket.institution.name.trim() !== ""
  ) {
    return ticket.institution.name.trim();
  }

  if (typeof ticket.employer === "string" && ticket.employer.trim() !== "") {
    return ticket.employer.trim();
  }

  if (
    ticket.employer &&
    typeof ticket.employer === "object" &&
    typeof ticket.employer.name === "string" &&
    ticket.employer.name.trim() !== ""
  ) {
    return ticket.employer.name.trim();
  }

  return null;
}

/** Matches TicketDetailsModal Name field: person name, then representative, then institution. */
export function getTicketEmployeeDisplayName(ticket) {
  if (!ticket) return "N/A";

  if (ticket.first_name && ticket.first_name.trim() !== "") {
    return `${ticket.first_name} ${ticket.middle_name || ""} ${ticket.last_name || ""}`.trim();
  }

  if (ticket.representative_name && ticket.representative_name.trim() !== "") {
    return ticket.representative_name.trim();
  }

  return getTicketInstitutionName(ticket) || "N/A";
}
