import { CategoryIcon } from "@/lib/icons";
import { formatCurrency } from "@/lib/format";

export type CategorySlice = {
  id: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
};

export function CategoryBreakdown({ items }: { items: CategorySlice[] }) {
  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="mb-1 font-semibold text-slate-800">Pengeluaran per Kategori</p>
      <p className="mb-4 text-xs text-slate-400">Bulan ini</p>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">Belum ada pengeluaran bulan ini</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const pct = total > 0 ? (item.amount / total) * 100 : 0;
            return (
              <div key={item.id}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${item.color}1a`, color: item.color }}
                  >
                    <CategoryIcon name={item.icon} className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                    {item.name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-slate-800">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
