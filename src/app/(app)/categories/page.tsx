import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { CategoriesManager } from "@/components/categories/CategoriesManager";

export default async function CategoriesPage() {
  const session = await getSession();
  const categories = await prisma.category.findMany({
    where: { userId: session!.userId },
    include: { _count: { select: { transactions: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Kategori"
        description="Kelola kategori pemasukan dan pengeluaran Anda."
      />
      <CategoriesManager categories={categories} />
    </div>
  );
}
