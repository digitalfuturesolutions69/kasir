import Link from "next/link";
import { ArrowRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import clsx from "clsx";
import { CategoryIcon } from "@/lib/icons";
import { formatCurrency, formatDateShort } from "@/lib/format";

export type RecentTransactionItem = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: string;
  category: { name: string; color: string; icon: string } | null;
};

export function RecentTransactions({ items }: { items: RecentTransactionItem[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold text-slate-800">Transaksi Terbaru</p>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          Lihat semua
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">Belum ada transaksi</p>
      ) : (
        <div className="space-y-1">
          {items.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-xl px-1.5 py-2">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: t.category ? `${t.category.color}1a` : "#f1f5f9",
                  color: t.category?.color ?? "#64748b",
                }}
              >
                {t.category ? (
                  <CategoryIcon name={t.category.icon} className="h-4 w-4" />
                ) : t.type === "INCOME" ? (
                  <ArrowDownLeft className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">
                  {t.category?.name ?? (t.type === "INCOME" ? "Pemasukan" : "Pengeluaran")}
                </p>
                <p className="text-xs text-slate-400">{formatDateShort(t.date)}</p>
              </div>
              <p
                className={clsx(
                  "shrink-0 text-sm font-semibold",
                  t.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {t.type === "INCOME" ? "+" : "-"}
                {formatCurrency(t.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
