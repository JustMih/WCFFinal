import { useCallback, useMemo, useState } from "react";

export default function useReportTablePagination(items = [], defaultRowsPerPage = 10) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  const resetPage = useCallback(() => {
    setPage(0);
  }, []);

  const paginatedItems = useMemo(() => {
    const start = page * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  }, [items, page, rowsPerPage]);

  const handleChangePage = useCallback((_, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const paginationProps = {
    count: items.length,
    page,
    rowsPerPage,
    onPageChange: handleChangePage,
    onRowsPerPageChange: handleChangeRowsPerPage,
  };

  return {
    page,
    rowsPerPage,
    paginatedItems,
    paginationProps,
    resetPage,
    setPage,
    setRowsPerPage,
  };
}
