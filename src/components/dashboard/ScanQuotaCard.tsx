import Link from "next/link";
import clsx from "clsx";
import type { Plan } from "@prisma/client";
import { ScanLine } from "lucide-react";
import { PLANS } from "@/lib/plans";

export function ScanQuotaCard({
  plan,
  scansUsed,
  scanLimit,
}: {
  plan: Plan;
  scansUsed: number;
  scanLimit: number;
}) {
  const pct = Math.min(100, Math.round((scansUsed / scanLimit) * 100));
  const remaining = Math.max(0, scanLimit - scansUsed);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 font-semibold text-slate-800">
            <ScanLine className="h-4 w-4 text-indigo-500" />
            Scan Struk AI
          </p>
          <p className="text-xs text-slate-400">Paket {PLANS[plan].name} · reset tiap bulan</p>
        </div>
        <Link href="/paket" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
          Kelola paket
        </Link>
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-slate-900">{scansUsed}</span>
        <span className="text-sm text-slate-400">/ {scanLimit} terpakai</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={clsx(
            "h-full rounded-full transition-all",
            pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-indigo-600"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {remaining > 0
          ? `Sisa ${remaining} scan bulan ini`
          : "Kuota habis bulan ini — isi manual atau upgrade paket"}
      </p>
    </div>
  );
}
