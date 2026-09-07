import { Users, Receipt, Wallet, UserPlus } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export function AdminStatCards({
  totalUsers,
  newUsers7d,
  totalTransactions,
  totalVolume,
}: {
  totalUsers: number;
  newUsers7d: number;
  totalTransactions: number;
  totalVolume: number;
}) {
  const cards = [
    {
      label: "Total Pengguna",
      value: totalUsers.toLocaleString("id-ID"),
      icon: Users,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Pengguna Baru (7 hari)",
      value: `+${newUsers7d.toLocaleString("id-ID")}`,
      icon: UserPlus,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Total Transaksi Tercatat",
      value: totalTransactions.toLocaleString("id-ID"),
      icon: Receipt,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Total Volume Transaksi",
      value: formatCurrency(totalVolume),
      icon: Wallet,
      color: "text-violet-600 bg-violet-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.color}`}>
            <c.icon className="h-5 w-5" />
          </span>
          <p className="mt-4 text-sm font-medium text-slate-500">{c.label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
