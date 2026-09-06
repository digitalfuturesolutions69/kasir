"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ICON_NAMES } from "@/lib/icons";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi").max(40),
  type: z.enum(["INCOME", "EXPENSE"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna tidak valid"),
  icon: z.enum(ICON_NAMES as [string, ...string[]]),
});

export type CategoryFormState = {
  error?: string;
  success?: boolean;
};

async function requireUserId() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session.userId;
}

export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const userId = await requireUserId();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    color: formData.get("color"),
    icon: formData.get("icon"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const existing = await prisma.category.findFirst({
    where: { userId, name: parsed.data.name, type: parsed.data.type },
  });
  if (existing) {
    return { error: "Kategori dengan nama dan tipe ini sudah ada" };
  }

  await prisma.category.create({
    data: { ...parsed.data, userId },
  });

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const userId = await requireUserId();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Kategori tidak ditemukan" };
  }

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    color: formData.get("color"),
    icon: formData.get("icon"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) {
    return { error: "Kategori tidak ditemukan" };
  }

  await prisma.category.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteCategoryAction(id: string) {
  const userId = await requireUserId();

  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) {
    throw new Error("Kategori tidak ditemukan");
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}
