"use client";

import { useState, useTransition } from "react";
import type { Plan } from "@prisma/client";
import { adminChangePlanAction } from "@/lib/actions/plan";
import { PLAN_ORDER, PLANS } from "@/lib/plans";

export function AdminPlanSelect({ userId, plan }: { userId: string; plan: Plan }) {
  const [value, setValue] = useState(plan);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: Plan) {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      try {
        await adminChangePlanAction(userId, next);
      } catch {
        setValue(previous);
      }
    });
  }

  return (
    <select
      value={value}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as Plan)}
      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 disabled:cursor-wait disabled:opacity-60"
    >
      {PLAN_ORDER.map((p) => (
        <option key={p} value={p}>
          {PLANS[p].name}
        </option>
      ))}
    </select>
  );
}
