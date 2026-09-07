"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import clsx from "clsx";
import type { Plan } from "@prisma/client";
import { Check, Sparkles } from "lucide-react";
import { changePlanAction, type ChangePlanState } from "@/lib/actions/plan";
import { PLAN_ORDER, PLANS } from "@/lib/plans";
import { formatCurrency } from "@/lib/format";

const initialState: ChangePlanState = {};

export function PlanManager({
  currentPlan,
  scansUsed,
  scanLimit,
}: {
  currentPlan: Plan;
  scansUsed: number;
  scanLimit: number;
}) {
  const [state, formAction] = useActionState(changePlanAction, initialState);
  const pct = Math.min(100, Math.round((scansUsed / scanLimit) * 100));

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Paket aktif
            </p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">{PLANS[currentPlan].name}</p>
          </div>
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{scansUsed}</span> / {scanLimit} scan
            AI terpakai bulan ini
          </p>
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
        {pct >= 100 && (
          <p className="mt-2 text-xs text-red-600">
            Kuota habis untuk bulan ini. Scan struk baru akan gagal — isi transaksi manual, atau
            upgrade paket di bawah.
          </p>
        )}
      </div>

      {state.error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = planId === currentPlan;
          return (
            <div
              key={planId}
              className={clsx(
                "flex flex-col gap-4 rounded-2xl border bg-white p-5",
                planId === "PRO" ? "border-indigo-300 shadow-sm shadow-indigo-100" : "border-slate-200"
              )}
            >
              {planId === "PRO" && (
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
                  <Sparkles className="h-3 w-3" />
                  Paling seimbang
                </span>
              )}
              <div>
                <p className="font-bold text-slate-900">{plan.name}</p>
                <p className="text-sm text-slate-500">{plan.tagline}</p>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-slate-900">
                  {plan.priceMonthly === 0 ? "Gratis" : formatCurrency(plan.priceMonthly)}
                </span>
                {plan.priceMonthly > 0 && <span className="text-sm text-slate-400">/bulan</span>}
              </div>
              <ul className="flex-1 space-y-2 text-sm text-slate-600">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <form action={formAction}>
                <input type="hidden" name="plan" value={planId} />
                <PlanSubmitButton isCurrent={isCurrent} />
              </form>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400">
        Mode uji coba: pembayaran belum terhubung, jadi perubahan paket berlaku langsung tanpa
        tagihan. Kuota scan mengikuti paket yang aktif saat itu.
      </p>
    </div>
  );
}

function PlanSubmitButton({ isCurrent }: { isCurrent: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={isCurrent || pending}
      className={clsx(
        "w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        isCurrent
          ? "bg-slate-100 text-slate-400"
          : "bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-300"
      )}
    >
      {isCurrent ? "Paket saat ini" : pending ? "Menyimpan..." : "Pilih paket ini"}
    </button>
  );
}
