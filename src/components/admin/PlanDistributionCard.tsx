import type { Plan } from "@prisma/client";
import { PLAN_ORDER, PLANS } from "@/lib/plans";
import { formatCurrency } from "@/lib/format";

const BAR_COLOR: Record<Plan, string> = {
  FREE: "bg-slate-300",
  PRO: "bg-indigo-500",
  UMKM: "bg-violet-500",
};

export function PlanDistributionCard({
  counts,
  totalUsers,
  mrr,
}: {
  counts: Record<Plan, number>;
  totalUsers: number;
  mrr: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4">
        <p className="font-semibold text-slate-800">Distribusi Paket</p>
        <p className="text-xs text-slate-400">Estimasi MRR {formatCurrency(mrr)}</p>
      </div>
      <div className="space-y-4">
        {PLAN_ORDER.map((planId) => {
          const count = counts[planId];
          const pct = totalUsers === 0 ? 0 : Math.round((count / totalUsers) * 100);
          return (
            <div key={planId}>
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span className="font-medium text-slate-700">{PLANS[planId].name}</span>
                <span className="text-slate-500">
                  {count.toLocaleString("id-ID")} pengguna · {pct}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${BAR_COLOR[planId]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
