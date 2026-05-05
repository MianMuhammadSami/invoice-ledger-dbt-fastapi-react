import InvoiceLedger from "./components/InvoiceLedger";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice Ledger</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Powered by dbt · FastAPI · React
            </p>
          </div>
          <span className="text-sm text-gray-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <InvoiceLedger />
      </main>
    </div>
  );
}
