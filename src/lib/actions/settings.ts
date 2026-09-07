"use server";

import { revalidatePath } from "next/cache";
import type { AiProvider } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { AI_PROVIDER_ORDER } from "@/lib/ai-providers";
import { setGlobalAiProvider } from "@/lib/app-settings";

// Which AI reads receipt photos is a single app-wide switch, not
// per-user — e.g. to steer everyone off a provider whose key just ran
// out of credit. Gated the same way the rest of /admin is: by
// ADMIN_EMAIL, not a DB role.
export async function adminSetGlobalAiProviderAction(provider: AiProvider) {
  const session = await getSession();
  if (!session || !isAdminEmail(session.email)) {
    throw new Error("Unauthorized");
  }
  if (!AI_PROVIDER_ORDER.includes(provider)) {
    throw new Error("Provider AI tidak valid");
  }

  await setGlobalAiProvider(provider);
  revalidatePath("/admin");
}
