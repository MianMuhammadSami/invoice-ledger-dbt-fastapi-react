import type { Invoice } from "../types/invoice";
import { getDisplayStatus } from "../types/invoice";

const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const fmtCurrency = (n: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

const STATUS_BADGE: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
};

const CATEGORY_BADGE: Record<string, string> = {
  small: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  large: "bg-purple-100 text-purple-700",
};

const COLUMNS = [
  "Invoice ID",
  "Vendor",
  "Invoice Date",
  "Due Date",
  "Amount",
  "Status",
  "Category",
  "Due In / Past",
];

interface Props {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

export default function InvoiceTable({
  invoices,
  loading,
  error,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: Props) {
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <strong>Error loading invoices:</strong> {error}. Ensure the stack is running and{" "}
        <code className="font-mono">make dbt-run</code> has completed.
      </div>
    );
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {COLUMNS.map((col) => (
                    <td key={col} className="px-4 py-3">
                      <div className="h-4 rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-gray-400">
                  No invoices match your filters.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const displayStatus = getDisplayStatus(inv);
                const rowClass = inv.is_overdue ? "bg-red-50/40" : "";
                return (
                  <tr key={inv.invoice_id} className={`hover:bg-gray-50 transition-colors ${rowClass}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{inv.invoice_id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{inv.vendor_name}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(inv.invoice_date)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(inv.due_date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {fmtCurrency(inv.amount, inv.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[displayStatus]}`}
                      >
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${CATEGORY_BADGE[inv.amount_category]}`}
                      >
                        {inv.amount_category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {inv.days_past_due !== null && (
                        <span className="text-red-600 font-medium">{inv.days_past_due}d overdue</span>
                      )}
                      {inv.days_until_due !== null && (
                        <span className="text-gray-600">{inv.days_until_due}d left</span>
                      )}
                      {inv.status === "paid" && (
                        <span className="text-green-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
        <span>
          {total === 0 ? "No results" : `Showing ${start}–${end} of ${total}`}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded px-3 py-1 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="rounded px-3 py-1 bg-indigo-600 text-white font-medium">
            {page} / {Math.max(totalPages, 1)}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded px-3 py-1 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
