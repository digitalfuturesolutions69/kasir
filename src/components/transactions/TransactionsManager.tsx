"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Search, ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import clsx from "clsx";
import { CategoryIcon } from "@/lib/icons";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteTransactionAction } from "@/lib/actions/transactions";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import type { CategoryItem } from "@/components/categories/CategoriesManager";
import { TransactionModal, type EditingTransaction } from "./TransactionModal";

export type TransactionItem = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string | null;
  date: string;
  category: { id: string; name: string; color: string; icon: string } | null;
  receiptPath: string | null;
};

type TypeFilter = "ALL" | "INCOME" | "EXPENSE";

export function TransactionsManager({
  transactions,
  categories,
}: {
  transactions: TransactionItem[];
  categories: CategoryItem[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditingTransaction | null>(null);
  const [defaultType, setDefaultType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== "ALL" && t.type !== typeFilter) return false;
      if (categoryFilter !== "ALL") {
        if (categoryFilter === "NONE" && t.category) return false;
        if (categoryFilter !== "NONE" && t.category?.id !== categoryFilter) return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesCat = t.category?.name.toLowerCase().includes(q);
        if (!matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, categoryFilter, query]);

  const totals = useMemo(() => {
    const income = filtered.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    return { income, expense };
  }, [filtered]);

  const groups = useMemo(() => {
    const map = new Map<string, TransactionItem[]>();
    for (const t of filtered) {
      const key = t.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  function openCreate() {
    setEditing(null);
    setDefaultType("EXPENSE");
    setModalOpen(true);
  }

  function openEdit(t: TransactionItem) {
    setEditing({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      date: t.date,
      categoryId: t.category?.id ?? null,
      receiptPath: t.receiptPath,
    });
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTransactionAction(id);
      setDeletingId(null);
    });
  }

  return (
    <div>
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <p className="text-xs font-medium text-emerald-700">Total Pemasukan (terfilter)</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatCurrency(totals.income)}</p>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
          <p className="text-xs font-medium text-rose-700">Total Pengeluaran (terfilter)</p>
          <p className="mt-1 text-xl font-bold text-rose-700">{formatCurrency(totals.expense)}</p>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari transaksi atau kategori..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-xl border border-slate-200 p-1">
            {(["ALL", "INCOME", "EXPENSE"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={clsx(
                  "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  typeFilter === t ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {t === "ALL" ? "Semua" : t === "INCOME" ? "Masuk" : "Keluar"}
              </button>
            ))}
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-40"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="NONE">Tanpa Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          Tambah
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-500">Belum ada transaksi yang cocok.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([date, items]) => (
            <div key={date}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {formatDate(date)}
              </p>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {items.map((t, idx) => (
                  <div
                    key={t.id}
                    className={clsx(
                      "group flex items-center gap-3 p-4",
                      idx !== items.length - 1 && "border-b border-slate-100"
                    )}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: t.category ? `${t.category.color}1a` : "#f1f5f9",
                        color: t.category?.color ?? "#64748b",
                      }}
                    >
                      {t.category ? (
                        <CategoryIcon name={t.category.icon} className="h-5 w-5" />
                      ) : t.type === "INCOME" ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-800">
                        <span className="truncate">
                          {t.category?.name ?? (t.type === "INCOME" ? "Pemasukan" : "Pengeluaran")}
                        </span>
                        {t.receiptPath && (
                          <a
                            href={`/api/receipts/${t.receiptPath}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Lihat foto bukti"
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 text-slate-300 hover:text-indigo-500"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </p>
                      {t.description && (
                        <p className="truncate text-xs text-slate-400">{t.description}</p>
                      )}
                    </div>
                    <p
                      className={clsx(
                        "shrink-0 text-sm font-semibold",
                        t.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                      )}
                    >
                      {t.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </p>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => openEdit(t)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(t.id)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        categories={categories}
        defaultType={defaultType}
      />

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Hapus Transaksi?</h3>
            <p className="mt-2 text-sm text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setDeletingId(null)}>
                Batal
              </Button>
              <Button
                variant="danger"
                fullWidth
                disabled={isPending}
                onClick={() => handleDelete(deletingId)}
              >
                {isPending ? "Menghapus..." : "Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
