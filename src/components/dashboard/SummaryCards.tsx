import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import clsx from "clsx";
import { formatCurrency } from "@/lib/format";

function ChangeBadge({ change }: { change: number | null }) {
  if (change === null) return null;
  const positive = change >= 0;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
        positive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
      )}
    >
      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(change).toFixed(0)}%
    </span>
  );
}

export function SummaryCards({
  balance,
  monthIncome,
  monthExpense,
  incomeChange,
  expenseChange,
}: {
  balance: number;
  monthIncome: number;
  monthExpense: number;
  incomeChange: number | null;
  expenseChange: number | null;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Wallet className="h-5 w-5" />
          </span>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500">Saldo Saat Ini</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(balance)}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </span>
          <ChangeBadge change={incomeChange} />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500">Pemasukan Bulan Ini</p>
        <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(monthIncome)}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <TrendingDown className="h-5 w-5" />
          </span>
          <ChangeBadge change={expenseChange} />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500">Pengeluaran Bulan Ini</p>
        <p className="mt-1 text-2xl font-bold text-rose-600">{formatCurrency(monthExpense)}</p>
      </div>
    </div>
  );
}
