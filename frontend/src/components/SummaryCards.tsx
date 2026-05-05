import { useSummary } from "../hooks/useSummary";
import type { StatusFilter } from "../types/invoice";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

interface Props {
  onStatusFilter: (status: StatusFilter) => void;
}

interface CardProps {
  label: string;
  count: number | string;
  amount: number;
  colorClass: string;
  onClick: () => void;
}

function StatCard({ label, count, amount, colorClass, onClick }: CardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[160px] rounded-xl border ${colorClass} p-5 text-left transition-transform hover:scale-[1.02] cursor-pointer`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-bold">{count}</p>
      <p className="mt-1 text-sm font-medium opacity-80">{fmt(amount)}</p>
    </button>
  );
}

export default function SummaryCards({ onStatusFilter }: Props) {
  const { summary, loading, error } = useSummary();

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Could not load summary. Have you run <code className="font-mono">make dbt-run</code>?
      </div>
    );
  }

  const s = summary;

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <StatCard
        label="Total"
        count={loading ? "—" : s!.total_invoices}
        amount={loading ? 0 : s!.total_amount}
        colorClass="border-gray-200 bg-white text-gray-900"
        onClick={() => onStatusFilter("all")}
      />
      <StatCard
        label="Paid"
        count={loading ? "—" : s!.paid_count}
        amount={loading ? 0 : s!.paid_amount}
        colorClass="border-green-200 bg-green-50 text-green-900"
        onClick={() => onStatusFilter("paid")}
      />
      <StatCard
        label="Pending"
        count={loading ? "—" : s!.pending_count}
        amount={loading ? 0 : s!.pending_amount}
        colorClass="border-yellow-200 bg-yellow-50 text-yellow-900"
        onClick={() => onStatusFilter("pending")}
      />
      <StatCard
        label="Overdue"
        count={loading ? "—" : s!.overdue_count}
        amount={loading ? 0 : s!.overdue_amount}
        colorClass="border-red-200 bg-red-50 text-red-900"
        onClick={() => onStatusFilter("overdue")}
      />
    </div>
  );
}
