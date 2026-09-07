import type { AiProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Single row, always this id — see the AppSettings model in schema.prisma.
const SETTINGS_ID = "singleton";

export async function getGlobalAiProvider(): Promise<AiProvider> {
  const settings = await prisma.appSettings.findUnique({ where: { id: SETTINGS_ID } });
  return settings?.aiProvider ?? "CLAUDE";
}

export async function setGlobalAiProvider(provider: AiProvider): Promise<void> {
  await prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, aiProvider: provider },
    update: { aiProvider: provider },
  });
}
