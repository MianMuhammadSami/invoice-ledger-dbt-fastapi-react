import type { StatusFilter } from "../types/invoice";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "overdue", label: "Overdue" },
];

interface Props {
  status: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  search: string;
  onSearchChange: (s: string) => void;
}

export default function InvoiceFilters({ status, onStatusChange, search, onSearchChange }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
      <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onStatusChange(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              status === tab.value
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search vendor…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-56 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
