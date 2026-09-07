"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import type { AiProvider } from "@prisma/client";
import { Check } from "lucide-react";
import { adminSetGlobalAiProviderAction } from "@/lib/actions/settings";
import { AI_PROVIDER_ORDER, AI_PROVIDERS } from "@/lib/ai-providers";

export function GlobalAiProviderCard({ provider }: { provider: AiProvider }) {
  const [value, setValue] = useState(provider);
  const [isPending, startTransition] = useTransition();

  function handleSelect(next: AiProvider) {
    if (next === value) return;
    const previous = value;
    setValue(next);
    startTransition(async () => {
      try {
        await adminSetGlobalAiProviderAction(next);
      } catch {
        setValue(previous);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="font-semibold text-slate-800">AI Pembaca Struk</p>
      <p className="mb-4 text-xs text-slate-400">Satu pengaturan untuk semua pengguna</p>
      <div className="space-y-2">
        {AI_PROVIDER_ORDER.map((id) => {
          const isActive = id === value;
          return (
            <button
              key={id}
              type="button"
              disabled={isPending}
              onClick={() => handleSelect(id)}
              className={clsx(
                "flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors disabled:cursor-wait",
                isActive
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <span>
                <span className="font-medium">{AI_PROVIDERS[id].name}</span>
                <span className="block text-xs text-slate-400">{AI_PROVIDERS[id].description}</span>
              </span>
              {isActive && <Check className="h-4 w-4 shrink-0 text-indigo-600" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
