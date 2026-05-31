import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * @param {Array<Record<string, unknown>>} rows
 * @param {string} filename
 */
export function exportRowsToCsv(rows, filename) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

/**
 * @param {Array<Record<string, unknown>>} rows
 * @param {string} filename
 * @param {string} [sheetName]
 */
export function exportRowsToExcel(rows, filename, sheetName = "Report") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(
    wb,
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
  );
}

/**
 * @param {Object} options
 * @param {string} options.title
 * @param {string} [options.subtitle]
 * @param {Array<{ key: string, label: string }>} options.columns
 * @param {Array<Record<string, unknown>>} options.rows
 * @param {string} options.filename
 * @param {boolean} [options.landscape]
 * @param {number} [options.startY]
 */
export function exportRowsToPdf({
  title,
  subtitle,
  columns,
  rows,
  filename,
  landscape = true,
  startY = 30,
}) {
  const doc = new jsPDF({ orientation: landscape ? "landscape" : "portrait" });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  if (subtitle) {
    doc.setFontSize(10);
    doc.text(subtitle, 14, 24);
  }

  autoTable(doc, {
    startY: subtitle ? startY : 22,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) =>
      columns.map((c) => String(row[c.key] ?? row[c.label] ?? "—"))
    ),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [99, 102, 241] },
  });

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

/**
 * Build export rows from column defs and data rows.
 * @param {Array<{ key: string, label: string }>} columns
 * @param {Array<Record<string, unknown>>} dataRows - objects keyed by column label
 */
export function buildLabelKeyedExportRows(columns, dataRows) {
  return dataRows.map((row) => {
    const out = {};
    columns.forEach((col) => {
      out[col.label] = row[col.key] ?? row[col.label] ?? "—";
    });
    return out;
  });
}

/**
 * @param {Array<{ key: string, label: string }>} columns
 * @param {Array<Record<string, unknown>>} dataRows
 * @param {(row: Record<string, unknown>, index: number) => Record<string, unknown>} mapRow
 */
export function buildExportRowsFromMapper(columns, dataRows, mapRow) {
  return dataRows.map((row, index) => {
    const mapped = mapRow(row, index);
    const out = {};
    columns.forEach((col) => {
      out[col.label] = mapped[col.key] ?? "—";
    });
    return out;
  });
}
