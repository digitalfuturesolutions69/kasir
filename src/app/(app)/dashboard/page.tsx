import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { OverviewChart, type MonthlyPoint } from "@/components/dashboard/OverviewChart";
import { CategoryBreakdown, type CategorySlice } from "@/components/dashboard/CategoryBreakdown";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { QuickAddButton } from "@/components/dashboard/QuickAddButton";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? null : 100;
  return ((current - previous) / previous) * 100;
}

export default async function DashboardPage() {
  const session = await getSession();
  const userId = session!.userId;

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfRange = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [allTimeTotals, rangeTransactions, recentTransactions, categories] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: startOfRange } },
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.transaction.findMany({
      where: { userId },
      include: { category: { select: { name: true, color: true, icon: true } } },
      orderBy: { date: "desc" },
      take: 6,
    }),
    prisma.category.findMany({
      where: { userId },
      include: { _count: { select: { transactions: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalIncome = allTimeTotals.find((t) => t.type === "INCOME")?._sum.amount ?? 0;
  const totalExpense = allTimeTotals.find((t) => t.type === "EXPENSE")?._sum.amount ?? 0;
  const balance = totalIncome - totalExpense;

  let monthIncome = 0;
  let monthExpense = 0;
  let lastMonthIncome = 0;
  let lastMonthExpense = 0;

  const monthlyBuckets = new Map<string, MonthlyPoint>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyBuckets.set(key, { month: MONTH_LABELS[d.getMonth()], income: 0, expense: 0 });
  }

  const categoryExpenseMap = new Map<string, CategorySlice>();

  for (const t of rangeTransactions) {
    const d = t.date;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = monthlyBuckets.get(key);
    if (bucket) {
      if (t.type === "INCOME") bucket.income += t.amount;
      else bucket.expense += t.amount;
    }

    if (d >= startOfThisMonth) {
      if (t.type === "INCOME") monthIncome += t.amount;
      else monthExpense += t.amount;

      if (t.type === "EXPENSE" && t.category) {
        const existing = categoryExpenseMap.get(t.category.id);
        if (existing) {
          existing.amount += t.amount;
        } else {
          categoryExpenseMap.set(t.category.id, {
            id: t.category.id,
            name: t.category.name,
            color: t.category.color,
            icon: t.category.icon,
            amount: t.amount,
          });
        }
      }
    } else if (d >= startOfLastMonth && d < startOfThisMonth) {
      if (t.type === "INCOME") lastMonthIncome += t.amount;
      else lastMonthExpense += t.amount;
    }
  }

  const monthlyData = Array.from(monthlyBuckets.values());
  const categoryBreakdown = Array.from(categoryExpenseMap.values()).sort(
    (a, b) => b.amount - a.amount
  );

  return (
    <div>
      <PageHeader
        title={`Halo, ${session!.name.split(" ")[0]} 👋`}
        description="Berikut ringkasan keuangan Anda."
        actions={<QuickAddButton categories={categories} />}
      />

      <div className="space-y-5">
        <SummaryCards
          balance={balance}
          monthIncome={monthIncome}
          monthExpense={monthExpense}
          incomeChange={percentChange(monthIncome, lastMonthIncome)}
          expenseChange={percentChange(monthExpense, lastMonthExpense)}
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <OverviewChart data={monthlyData} />
          </div>
          <CategoryBreakdown items={categoryBreakdown} />
        </div>

        <RecentTransactions
          items={recentTransactions.map((t) => ({
            ...t,
            date: t.date.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
