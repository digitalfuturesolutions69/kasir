"use client";

import { useActionState, useEffect, useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import {
  createCategoryAction,
  updateCategoryAction,
  type CategoryFormState,
} from "@/lib/actions/categories";
import { ICON_MAP, ICON_NAMES } from "@/lib/icons";
import { Label, Input, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#f59e0b", "#22c55e", "#16a34a", "#14b8a6", "#0ea5e9",
  "#3b82f6", "#64748b",
];

export type EditingCategory = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  icon: string;
};

const initialState: CategoryFormState = {};

export function CategoryModal({
  open,
  onClose,
  editing,
  defaultType,
}: {
  open: boolean;
  onClose: () => void;
  editing: EditingCategory | null;
  defaultType: "INCOME" | "EXPENSE";
}) {
  const action = editing ? updateCategoryAction : createCategoryAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [color, setColor] = useState(editing?.color ?? COLORS[0]);
  const [icon, setIcon] = useState(editing?.icon ?? ICON_NAMES[0]);
  const [type, setType] = useState<"INCOME" | "EXPENSE">(editing?.type ?? defaultType);

  useEffect(() => {
    if (open) {
      setColor(editing?.color ?? COLORS[0]);
      setIcon(editing?.icon ?? ICON_NAMES[0]);
      setType(editing?.type ?? defaultType);
    }
  }, [open, editing, defaultType]);

  useEffect(() => {
    if (state.success) {
      onClose();
    }
    // Depend on the whole state object (not state.success) so this fires on
    // every successful submission, not just the first true value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-fade-in-up">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {editing ? "Edit Kategori" : "Tambah Kategori"}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <input type="hidden" name="color" value={color} />
          <input type="hidden" name="icon" value={icon} />

          <div>
            <Label htmlFor="cat-name">Nama Kategori</Label>
            <Input
              id="cat-name"
              name="name"
              defaultValue={editing?.name}
              placeholder="Contoh: Belanja Bulanan"
              required
              maxLength={40}
            />
          </div>

          <div>
            <Label>Tipe</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["INCOME", "EXPENSE"] as const).map((t) => (
                <label
                  key={t}
                  className={clsx(
                    "flex cursor-pointer items-center justify-center rounded-xl border py-2.5 text-sm font-medium transition-colors",
                    type === t
                      ? t === "INCOME"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-rose-300 bg-rose-50 text-rose-700"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={type === t}
                    onChange={() => setType(t)}
                    className="sr-only"
                  />
                  {t === "INCOME" ? "Pemasukan" : "Pengeluaran"}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Warna</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={clsx(
                    "h-7 w-7 cursor-pointer rounded-full ring-offset-2 transition-shadow",
                    color === c && "ring-2 ring-slate-400"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Ikon</Label>
            <div className="grid grid-cols-7 gap-2">
              {ICON_NAMES.map((name) => {
                const Icon = ICON_MAP[name];
                return (
                  <button
                    type="button"
                    key={name}
                    onClick={() => setIcon(name)}
                    className={clsx(
                      "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors",
                      icon === name
                        ? "border-indigo-400 bg-indigo-50 text-indigo-600"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <FieldError>{state.error}</FieldError>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" fullWidth disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
