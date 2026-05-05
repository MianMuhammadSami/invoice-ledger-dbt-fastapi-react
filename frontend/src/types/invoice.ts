// These interfaces mirror the Pydantic models in backend/app/schemas/invoice.py exactly.
// Any change to the backend contract must be reflected here — TypeScript will surface the mismatch.

export interface Invoice {
  invoice_id: string;
  vendor_name: string;
  vendor_id: string;
  invoice_date: string;       // ISO date string: YYYY-MM-DD
  due_date: string;           // ISO date string: YYYY-MM-DD
  amount: number;
  currency: string;
  status: "paid" | "pending"; // raw source status — use is_overdue for overdue logic
  description: string | null;
  is_overdue: boolean;
  days_past_due: number | null;
  days_until_due: number | null;
  amount_category: "small" | "medium" | "large";
  created_at: string;         // ISO datetime string
}

export interface InvoiceListResponse {
  data: Invoice[];
  total: number;
  page: number;
  page_size: number;
}

export interface InvoiceSummaryResponse {
  total_invoices: number;
  total_amount: number;
  paid_count: number;
  pending_count: number;
  overdue_count: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
}

export type StatusFilter = "all" | "paid" | "pending" | "overdue";

export type DisplayStatus = "paid" | "pending" | "overdue";

export function getDisplayStatus(invoice: Invoice): DisplayStatus {
  if (invoice.status === "paid") return "paid";
  if (invoice.is_overdue) return "overdue";
  return "pending";
}
