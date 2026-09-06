"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  date: z.string().min(1, "Tanggal wajib diisi"),
  categoryId: z.string().optional().or(z.literal("")),
});

export type TransactionFormState = {
  error?: string;
  success?: boolean;
};

async function requireUserId() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session.userId;
}

function revalidateAll() {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function createTransactionAction(
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const userId = await requireUserId();

  const parsed = transactionSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    date: formData.get("date"),
    categoryId: formData.get("categoryId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const { categoryId, description, ...rest } = parsed.data;

  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId, type: parsed.data.type },
    });
    if (!category) {
      return { error: "Kategori tidak valid" };
    }
  }

  await prisma.transaction.create({
    data: {
      ...rest,
      description: description || null,
      date: new Date(rest.date),
      userId,
      categoryId: categoryId || null,
    },
  });

  revalidateAll();
  return { success: true };
}

export async function updateTransactionAction(
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const userId = await requireUserId();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Transaksi tidak ditemukan" };
  }

  const parsed = transactionSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    date: formData.get("date"),
    categoryId: formData.get("categoryId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) {
    return { error: "Transaksi tidak ditemukan" };
  }

  const { categoryId, description, ...rest } = parsed.data;

  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId, type: parsed.data.type },
    });
    if (!category) {
      return { error: "Kategori tidak valid" };
    }
  }

  await prisma.transaction.update({
    where: { id },
    data: {
      ...rest,
      description: description || null,
      date: new Date(rest.date),
      categoryId: categoryId || null,
    },
  });

  revalidateAll();
  return { success: true };
}

export async function deleteTransactionAction(id: string) {
  const userId = await requireUserId();

  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new Error("Transaksi tidak ditemukan");
  }

  await prisma.transaction.delete({ where: { id } });
  revalidateAll();
}
