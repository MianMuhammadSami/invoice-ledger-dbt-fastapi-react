import { useState, useEffect } from "react";
import type { Invoice, InvoiceListResponse, StatusFilter } from "../types/invoice";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

export const PAGE_SIZE = 10;

interface Params {
  status: StatusFilter;
  search: string;
  page: number;
}

interface Result {
  invoices: Invoice[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function useInvoices({ status, search, page }: Params): Result {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(PAGE_SIZE),
    });
    if (status !== "all") params.set("status", status);
    if (search.trim()) params.set("search", search.trim());

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/v1/invoices?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: HTTP ${res.status}`);
        return res.json() as Promise<InvoiceListResponse>;
      })
      .then((data) => {
        if (!cancelled) {
          setInvoices(data.data);
          setTotal(data.total);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, search, page]);

  return { invoices, total, loading, error };
}
