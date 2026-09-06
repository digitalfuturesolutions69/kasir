"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import {
  createTransactionAction,
  updateTransactionAction,
  type TransactionFormState,
} from "@/lib/actions/transactions";
import { Label, Input, Select, Textarea, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { toDateInputValue } from "@/lib/format";
import type { CategoryItem } from "@/components/categories/CategoriesManager";

export type EditingTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string | null;
  date: string;
  categoryId: string | null;
};

const initialState: TransactionFormState = {};

export function TransactionModal({
  open,
  onClose,
  editing,
  categories,
  defaultType,
}: {
  open: boolean;
  onClose: () => void;
  editing: EditingTransaction | null;
  categories: CategoryItem[];
  defaultType: "INCOME" | "EXPENSE";
}) {
  const action = editing ? updateTransactionAction : createTransactionAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [type, setType] = useState<"INCOME" | "EXPENSE">(editing?.type ?? defaultType);

  useEffect(() => {
    if (open) {
      setType(editing?.type ?? defaultType);
    }
  }, [open, editing, defaultType]);

  useEffect(() => {
    if (state.success) onClose();
    // Depend on the whole state object (not state.success) so this fires on
    // every successful submission, not just the first true value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-fade-in-up">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {editing ? "Edit Transaksi" : "Tambah Transaksi"}
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

          <div>
            <Label htmlFor="amount">Jumlah (Rp)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min={1}
              step="1"
              inputMode="numeric"
              defaultValue={editing?.amount}
              placeholder="0"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Tanggal</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={
                  editing ? toDateInputValue(editing.date) : toDateInputValue(new Date())
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="categoryId">Kategori</Label>
              <Select id="categoryId" name="categoryId" defaultValue={editing?.categoryId ?? ""}>
                <option value="">Tanpa kategori</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Catatan (opsional)</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={editing?.description ?? ""}
              placeholder="Contoh: Belanja bulanan di supermarket"
            />
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
