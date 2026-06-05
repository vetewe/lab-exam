import { useMemo, useState } from "react";

export interface UsePaginationResult<T> {
  page: number;
  totalPages: number;
  pageItems: T[];
  setPage: (p: number) => void;
  next: () => void;
  prev: () => void;
  from: number;
  to: number;
  total: number;
}

/**
 * Pagination sisi klien. Otomatis reset ke halaman 1 jika jumlah data
 * mengecil di bawah halaman aktif (mis. setelah filter / hapus).
 */
export function usePagination<T>(items: T[], pageSize = 10): UsePaginationResult<T> {
  const [page, setPageState] = useState(1);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  function setPage(p: number) {
    setPageState(Math.min(Math.max(1, p), totalPages));
  }

  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return {
    page: safePage,
    totalPages,
    pageItems,
    setPage,
    next: () => setPage(safePage + 1),
    prev: () => setPage(safePage - 1),
    from,
    to,
    total,
  };
}
