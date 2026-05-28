/** YYYY-MM-DD strings for report API paths and query params */

export const formatDateForApi = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const parseApiDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const todayApiDate = () => formatDateForApi(new Date());

export const isValidReportDateRange = (startDate, endDate, { requireBoth = true } = {}) => {
  if (requireBoth) {
    if (!startDate || !endDate) return false;
  } else if (!startDate && !endDate) {
    return true;
  }
  if (startDate && endDate && startDate > endDate) return false;
  return true;
};
