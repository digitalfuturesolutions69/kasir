"use server";

import { revalidatePath } from "next/cache";
import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { PLAN_ORDER } from "@/lib/plans";

export type ChangePlanState = { error?: string; success?: boolean };

// Self-service plan switch. There is no payment gateway wired up yet, so
// this just updates the plan directly — good enough to let quota limits
// be tested/demoed end-to-end. Once Midtrans/Xendit is integrated, an
// upgrade to a paid plan should go through checkout first and only call
// this (or an equivalent webhook-driven update) after payment succeeds.
export async function changePlanAction(
  _prevState: ChangePlanState,
  formData: FormData
): Promise<ChangePlanState> {
  const session = await getSession();
  if (!session) return { error: "Sesi Anda berakhir, silakan masuk kembali." };

  const plan = formData.get("plan");
  if (typeof plan !== "string" || !PLAN_ORDER.includes(plan as Plan)) {
    return { error: "Paket tidak valid" };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { plan: plan as Plan },
  });

  revalidatePath("/paket");
  return { success: true };
}

// Lets an admin set any user's plan directly (support/testing — e.g.
// granting a promo, or fixing a stuck account). Gated the same way the
// rest of /admin is: by ADMIN_EMAIL, not a DB role.
export async function adminChangePlanAction(userId: string, plan: Plan) {
  const session = await getSession();
  if (!session || !isAdminEmail(session.email)) {
    throw new Error("Unauthorized");
  }
  if (!PLAN_ORDER.includes(plan)) {
    throw new Error("Paket tidak valid");
  }

  await prisma.user.update({ where: { id: userId }, data: { plan } });
  revalidatePath("/admin");
}
