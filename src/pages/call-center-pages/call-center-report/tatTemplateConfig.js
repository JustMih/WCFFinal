/**
 * Compact TAT report columns — mirrors WCFCC/utils/tatTemplateConfig.js
 */

export const TAT_TEMPLATE_COLUMNS = [
  { key: "created_date", header: "Created", type: "date" },
  { key: "creator_forward_date", header: "Creator Fwd", type: "date" },
  { key: "attendee_forwarded", header: "Attendee Fwd", type: "date" },
  { key: "coordinator_forwarded", header: "Coord Fwd", type: "date" },
  { key: "director_head_forwarded", header: "Dir/Head Fwd", type: "date" },
  { key: "manager_forwarded", header: "Mgr Fwd", type: "date" },
  { key: "director_general_forwarded", header: "DG Fwd", type: "date" },
  { key: "closing_date", header: "Closed", type: "date" },
  { key: "tat_creator", header: "TAT Creator", type: "tat" },
  { key: "tat_attendee", header: "TAT Attendee", type: "tat" },
  { key: "tat_coordinator", header: "TAT Coord", type: "tat" },
  { key: "tat_director_head", header: "TAT Dir/Head", type: "tat" },
  { key: "tat_manager", header: "TAT Mgr", type: "tat" },
  { key: "tat_director_general", header: "TAT DG", type: "tat" },
  { key: "tat_overall", header: "TAT Total", type: "tat" },
  { key: "fin_year", header: "Fin Year", type: "fin_year" },
];

export const UI_ONLY_COLUMNS = [{ key: "ticket_number", label: "Ticket ID" }];

export const EXCEL_EXPORT_COLUMNS = TAT_TEMPLATE_COLUMNS;

export function dateToExcelSerial(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const epoch = new Date(Date.UTC(1899, 11, 30));
  return (d.getTime() - epoch.getTime()) / 86400000;
}

export function formatDisplayDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export function formatTatDays(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}
