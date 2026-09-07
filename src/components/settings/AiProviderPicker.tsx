"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import clsx from "clsx";
import type { AiProvider } from "@prisma/client";
import { Check } from "lucide-react";
import { changeAiProviderAction, type ChangeAiProviderState } from "@/lib/actions/settings";
import { AI_PROVIDER_ORDER, AI_PROVIDERS } from "@/lib/ai-providers";

const initialState: ChangeAiProviderState = {};

export function AiProviderPicker({ currentProvider }: { currentProvider: AiProvider }) {
  const [state, formAction] = useActionState(changeAiProviderAction, initialState);

  return (
    <div className="space-y-4">
      {state.error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {AI_PROVIDER_ORDER.map((providerId) => {
          const provider = AI_PROVIDERS[providerId];
          const isCurrent = providerId === currentProvider;
          return (
            <div
              key={providerId}
              className={clsx(
                "flex flex-col gap-3 rounded-2xl border bg-white p-5",
                isCurrent ? "border-indigo-300 shadow-sm shadow-indigo-100" : "border-slate-200"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-900">{provider.name}</p>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
                    <Check className="h-3 w-3" />
                    Aktif
                  </span>
                )}
              </div>
              <p className="flex-1 text-sm text-slate-500">{provider.description}</p>
              <form action={formAction}>
                <input type="hidden" name="provider" value={providerId} />
                <ProviderSubmitButton isCurrent={isCurrent} />
              </form>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400">
        Pilihan ini menentukan AI mana yang membaca foto struk Anda. Kalau API key untuk provider
        yang dipilih belum diatur di server, foto tetap tersimpan tapi Anda perlu isi jumlah &amp;
        jenis transaksi manual.
      </p>
    </div>
  );
}

function ProviderSubmitButton({ isCurrent }: { isCurrent: boolean }) {
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
      {isCurrent ? "Sedang dipakai" : pending ? "Menyimpan..." : "Pakai provider ini"}
    </button>
  );
}
