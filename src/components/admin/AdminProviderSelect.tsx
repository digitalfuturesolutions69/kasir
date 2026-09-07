"use client";

import { useState, useTransition } from "react";
import type { AiProvider } from "@prisma/client";
import { adminChangeAiProviderAction } from "@/lib/actions/settings";
import { AI_PROVIDER_ORDER, AI_PROVIDERS } from "@/lib/ai-providers";

export function AdminProviderSelect({ userId, provider }: { userId: string; provider: AiProvider }) {
  const [value, setValue] = useState(provider);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: AiProvider) {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      try {
        await adminChangeAiProviderAction(userId, next);
      } catch {
        setValue(previous);
      }
    });
  }

  return (
    <select
      value={value}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as AiProvider)}
      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 disabled:cursor-wait disabled:opacity-60"
    >
      {AI_PROVIDER_ORDER.map((p) => (
        <option key={p} value={p}>
          {AI_PROVIDERS[p].name}
        </option>
      ))}
    </select>
  );
}
