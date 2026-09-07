import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { PlanManager } from "@/components/plans/PlanManager";
import { PLANS, isSamePeriod } from "@/lib/plans";

export default async function PaketPage() {
  const session = await getSession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.userId },
    select: { plan: true, scanCount: true, scanPeriodStart: true },
  });

  const scansUsed = isSamePeriod(user.scanPeriodStart, new Date()) ? user.scanCount : 0;

  return (
    <div>
      <PageHeader
        title="Paket"
        description="Kelola paket berlangganan dan pantau kuota scan struk AI Anda."
      />
      <PlanManager
        currentPlan={user.plan}
        scansUsed={scansUsed}
        scanLimit={PLANS[user.plan].scanLimit}
      />
    </div>
  );
}
