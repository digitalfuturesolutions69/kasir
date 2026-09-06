"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { CategoryIcon } from "@/lib/icons";
import { deleteCategoryAction } from "@/lib/actions/categories";
import { Button } from "@/components/ui/Button";
import { CategoryModal, type EditingCategory } from "./CategoryModal";

export type CategoryItem = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  icon: string;
  _count: { transactions: number };
};

export function CategoriesManager({ categories }: { categories: CategoryItem[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditingCategory | null>(null);
  const [defaultType, setDefaultType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const income = categories.filter((c) => c.type === "INCOME");
  const expense = categories.filter((c) => c.type === "EXPENSE");

  function openCreate(type: "INCOME" | "EXPENSE") {
    setEditing(null);
    setDefaultType(type);
    setModalOpen(true);
  }

  function openEdit(cat: CategoryItem) {
    setEditing(cat);
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteCategoryAction(id);
      setDeletingId(null);
    });
  }

  return (
    <div className="space-y-8">
      <CategorySection
        title="Kategori Pemasukan"
        items={income}
        onAdd={() => openCreate("INCOME")}
        onEdit={openEdit}
        onDelete={setDeletingId}
      />
      <CategorySection
        title="Kategori Pengeluaran"
        items={expense}
        onAdd={() => openCreate("EXPENSE")}
        onEdit={openEdit}
        onDelete={setDeletingId}
      />

      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        defaultType={defaultType}
      />

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Hapus Kategori?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Transaksi yang menggunakan kategori ini akan menjadi tanpa
              kategori. Tindakan ini tidak dapat dibatalkan.
            </p>
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

function CategorySection({
  title,
  items,
  onAdd,
  onEdit,
  onDelete,
}: {
  title: string;
  items: CategoryItem[];
  onAdd: () => void;
  onEdit: (c: CategoryItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">{title}</h2>
        <button
          onClick={onAdd}
          className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Tambah
        </button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
          Belum ada kategori
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((cat) => (
            <div
              key={cat.id}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${cat.color}1a`, color: cat.color }}
              >
                <CategoryIcon name={cat.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{cat.name}</p>
                <p className="text-xs text-slate-400">{cat._count.transactions} transaksi</p>
              </div>
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => onEdit(cat)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(cat.id)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
