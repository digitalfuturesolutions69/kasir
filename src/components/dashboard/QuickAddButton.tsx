"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import type { CategoryItem } from "@/components/categories/CategoriesManager";

export function QuickAddButton({ categories }: { categories: CategoryItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Tambah Transaksi
      </Button>
      <TransactionModal
        open={open}
        onClose={() => setOpen(false)}
        editing={null}
        categories={categories}
        defaultType="EXPENSE"
      />
    </>
  );
}
