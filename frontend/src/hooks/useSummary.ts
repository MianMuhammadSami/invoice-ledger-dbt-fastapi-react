import { useState, useEffect } from "react";
import type { InvoiceSummaryResponse } from "../types/invoice";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

interface Result {
  summary: InvoiceSummaryResponse | null;
  loading: boolean;
  error: string | null;
}

export function useSummary(): Result {
  const [summary, setSummary] = useState<InvoiceSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/v1/invoices/summary`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: HTTP ${res.status}`);
        return res.json() as Promise<InvoiceSummaryResponse>;
      })
      .then(setSummary)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { summary, loading, error };
}
