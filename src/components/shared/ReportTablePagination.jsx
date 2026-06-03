import React from "react";
import { TablePagination } from "@mui/material";
import "./ReportTablePagination.css";

export const REPORT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function ReportTablePagination({
  count = 0,
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = REPORT_PAGE_SIZE_OPTIONS,
  className = "",
}) {
  if (count <= 0) return null;

  return (
    <TablePagination
      component="div"
      className={`report-table-pagination ${className}`.trim()}
      count={count}
      page={page}
      onPageChange={onPageChange}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={onRowsPerPageChange}
      rowsPerPageOptions={rowsPerPageOptions}
      labelRowsPerPage="Rows per page:"
    />
  );
}
