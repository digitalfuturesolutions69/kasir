import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { TransactionsManager } from "@/components/transactions/TransactionsManager";

export default async function TransactionsPage() {
  const session = await getSession();
  const userId = session!.userId;

  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany({
      where: { userId },
      include: { _count: { select: { transactions: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Transaksi"
        description="Kelola seluruh catatan pemasukan dan pengeluaran Anda."
      />
      <TransactionsManager
        transactions={transactions.map((t) => ({
          ...t,
          date: t.date.toISOString(),
        }))}
        categories={categories}
      />
    </div>
  );
}
