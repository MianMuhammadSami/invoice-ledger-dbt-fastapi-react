import { useState, useCallback, useEffect, useRef } from "react";
import type { StatusFilter } from "../types/invoice";
import { useInvoices, PAGE_SIZE } from "../hooks/useInvoices";
import SummaryCards from "./SummaryCards";
import InvoiceFilters from "./InvoiceFilters";
import InvoiceTable from "./InvoiceTable";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebounced(value), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  return debounced;
}

export default function InvoiceLedger() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const handleStatusChange = useCallback((s: StatusFilter) => {
    setStatus(s);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((s: string) => {
    setSearch(s);
    setPage(1);
  }, []);

  const { invoices, total, loading, error } = useInvoices({
    status,
    search: debouncedSearch,
    page,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <SummaryCards onStatusFilter={handleStatusChange} />
      <InvoiceFilters
        status={status}
        onStatusChange={handleStatusChange}
        search={search}
        onSearchChange={handleSearchChange}
      />
      <InvoiceTable
        invoices={invoices}
        loading={loading}
        error={error}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
