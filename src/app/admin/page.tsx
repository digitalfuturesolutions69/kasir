import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { AdminStatCards } from "@/components/admin/AdminStatCards";
import { SignupChart, type SignupPoint } from "@/components/admin/SignupChart";
import { RecentUsersTable } from "@/components/admin/RecentUsersTable";
import { PlanDistributionCard } from "@/components/admin/PlanDistributionCard";
import { PLAN_ORDER, PLANS } from "@/lib/plans";
import type { Plan } from "@prisma/client";

export const metadata: Metadata = {
  title: "Admin — Duitku",
};

const DAY_LABELS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default async function AdminPage() {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    newUsers7d,
    totalTransactions,
    incomeAgg,
    expenseAgg,
    recentUsers,
    recentSignups,
    planGroups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.transaction.count(),
    prisma.transaction.aggregate({ where: { type: "INCOME" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE" }, _sum: { amount: true } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        plan: true,
        _count: { select: { transactions: true } },
      },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.user.groupBy({ by: ["plan"], _count: { _all: true } }),
  ]);

  const totalVolume = (incomeAgg._sum.amount ?? 0) + (expenseAgg._sum.amount ?? 0);

  const planCounts = Object.fromEntries(PLAN_ORDER.map((p) => [p, 0])) as Record<Plan, number>;
  for (const g of planGroups) planCounts[g.plan] = g._count._all;
  const mrr = PLAN_ORDER.reduce((sum, p) => sum + planCounts[p] * PLANS[p].priceMonthly, 0);

  const buckets = new Map<string, SignupPoint>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { day: `${d.getDate()} ${DAY_LABELS_ID[d.getDay()]}`, count: 0 });
  }
  for (const u of recentSignups) {
    const key = u.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) bucket.count += 1;
  }

  return (
    <div>
      <PageHeader
        title="Dashboard Admin"
        description="Ringkasan penggunaan platform Duitku secara keseluruhan."
      />

      <div className="space-y-5">
        <AdminStatCards
          totalUsers={totalUsers}
          newUsers7d={newUsers7d}
          totalTransactions={totalTransactions}
          totalVolume={totalVolume}
          mrr={mrr}
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SignupChart data={Array.from(buckets.values())} />
          </div>
          <PlanDistributionCard counts={planCounts} totalUsers={totalUsers} mrr={mrr} />
        </div>

        <RecentUsersTable
          users={recentUsers.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            createdAt: u.createdAt.toISOString(),
            plan: u.plan,
            transactionCount: u._count.transactions,
          }))}
        />
      </div>
    </div>
  );
}
