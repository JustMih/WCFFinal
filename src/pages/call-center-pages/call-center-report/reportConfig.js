export const REPORT_TYPES = {
  VOICE_NOTE: 0,
  CDR: 1,
  TICKET_CRM: 2,
  AGENT_PERFORMANCE: 3,
  CALL_SUMMARY: 4,
  IVR_INTERACTIONS: 5,
  TICKET_ASSIGNMENTS: 6,
  MISSED_CALL: 7,
  ESCALLATION: 8,
  NOTIFICATIONS: 9,
  CHATS: 10,
  PAUSE: 11,
  OFF_HOURS: 12,
  SLA_CALL_CENTER: 13,
  SLA_TICKET: 14,
};

export const REPORTS = [
  { slug: "voice-note", label: "Voice Note Report", type: REPORT_TYPES.VOICE_NOTE },
  { slug: "cdr", label: "CDR Report", type: REPORT_TYPES.CDR },
  { slug: "ticket-crm", label: "Ticket CRM Report", type: REPORT_TYPES.TICKET_CRM },
  { slug: "agent-performance", label: "Agent Performance", type: REPORT_TYPES.AGENT_PERFORMANCE },
  { slug: "call-summary", label: "Call Summary", type: REPORT_TYPES.CALL_SUMMARY },
  { slug: "ivr-interactions", label: "IVR Interactions", type: REPORT_TYPES.IVR_INTERACTIONS },
  { slug: "ticket-assignments", label: "Ticket Assignments", type: REPORT_TYPES.TICKET_ASSIGNMENTS },
  { slug: "missed-call", label: "Missed Call Report", type: REPORT_TYPES.MISSED_CALL },
  { slug: "escalation", label: "Escallation", type: REPORT_TYPES.ESCALLATION },
  { slug: "notifications", label: "Notifications", type: REPORT_TYPES.NOTIFICATIONS },
  { slug: "chats", label: "Chats", type: REPORT_TYPES.CHATS },
  { slug: "pause", label: "Pause Report", type: REPORT_TYPES.PAUSE },
  { slug: "off-hours", label: "Off-Hours Calls", type: REPORT_TYPES.OFF_HOURS },
  { slug: "call-center-sla", label: "Call Center SLA", type: REPORT_TYPES.SLA_CALL_CENTER },
  { slug: "ticket-sla", label: "Ticket SLA", type: REPORT_TYPES.SLA_TICKET },
];

const LEGACY_TAB_MAP = {
  pause: REPORT_TYPES.PAUSE,
  "pause-report": REPORT_TYPES.PAUSE,
};

export const slugToType = (slug) => {
  const found = REPORTS.find((r) => r.slug === slug);
  return found ? found.type : REPORT_TYPES.VOICE_NOTE;
};

export const typeToSlug = (type) => {
  const found = REPORTS.find((r) => r.type === type);
  return found ? found.slug : "voice-note";
};

export const getReportBySlug = (slug) =>
  REPORTS.find((r) => r.slug === slug) || REPORTS[0];

export const getReportLabel = (type) => {
  const found = REPORTS.find((r) => r.type === type);
  return found ? found.label : "Report";
};

export const resolveTypeFromLegacyTab = (tabParam) => {
  if (!tabParam) return null;
  const lower = tabParam.toLowerCase();
  if (LEGACY_TAB_MAP[lower] !== undefined) return LEGACY_TAB_MAP[lower];
  const num = Number(tabParam);
  if (!Number.isNaN(num) && num >= 0 && num <= REPORT_TYPES.SLA_TICKET) return num;
  const bySlug = REPORTS.find((r) => r.slug === lower);
  return bySlug ? bySlug.type : null;
};
