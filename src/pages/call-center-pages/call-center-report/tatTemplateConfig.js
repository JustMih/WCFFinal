/**
 * Full TAT report columns — mirrors WCFCC/utils/tatTemplateConfig.js
 */

export const TAT_DIMENSION_COLUMNS = [
  { key: "category", header: "Category", type: "text" },
  { key: "rated", header: "Rated (Minor/Major)", type: "text" },
  { key: "channel", header: "Channel", type: "text" },
];

export const TAT_DATE_COLUMNS = [
  { key: "created_date", header: "Created", type: "date" },
  { key: "creator_forward_date", header: "Creator Fwd", type: "date" },
  { key: "coord_ass_date", header: "Coord Ass", type: "date" },
  { key: "dir_head_ass_date", header: "Dir/Head Ass", type: "date" },
  { key: "mgr_ass_date", header: "Mgr Ass", type: "date" },
  { key: "focal_ass_date", header: "Focal Ass", type: "date" },
  { key: "attendee_date", header: "Attendee", type: "date" },
  { key: "mgr_res_date", header: "Mgr Res", type: "date" },
  { key: "dir_head_res_date", header: "Dir/Head Res", type: "date" },
  { key: "dg_date", header: "DG", type: "date" },
  { key: "closing_date", header: "Closed", type: "date" },
];

export const TAT_METRIC_COLUMNS = [
  { key: "tat_ass_creator", header: "TAT Ass Creator", type: "tat" },
  { key: "tat_ass_coord", header: "TAT Ass Coord", type: "tat" },
  { key: "tat_ass_dir_head", header: "TAT Ass Dir/Head", type: "tat" },
  { key: "tat_ass_mgr", header: "TAT Ass Mgr", type: "tat" },
  { key: "tat_ass_focal", header: "TAT Ass Focal", type: "tat" },
  { key: "tat_attendee", header: "TAT Attendee", type: "tat" },
  { key: "tat_mgr_res", header: "TAT Mgr Res", type: "tat" },
  { key: "tat_dir_head_res", header: "TAT Dir/Head Res", type: "tat" },
  { key: "tat_dg", header: "TAT DG", type: "tat" },
  {
    key: "tat_overall_assigning",
    header: "Overall TAT Assigning (Created to Attendee)",
    type: "tat",
  },
  {
    key: "tat_overall_attending",
    header: "Overall TAT Attending (Attendee to Closing)",
    type: "tat",
  },
  { key: "tat_overall", header: "Overall TAT", type: "tat" },
  { key: "fin_year", header: "Fin Year", type: "fin_year" },
];

export const TAT_TEMPLATE_COLUMNS = [
  ...TAT_DIMENSION_COLUMNS,
  ...TAT_DATE_COLUMNS,
  ...TAT_METRIC_COLUMNS,
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
