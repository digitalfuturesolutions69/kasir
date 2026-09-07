import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { AiProviderPicker } from "@/components/settings/AiProviderPicker";

export default async function PengaturanPage() {
  const session = await getSession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.userId },
    select: { aiProvider: true },
  });

  return (
    <div>
      <PageHeader
        title="Pengaturan"
        description="Atur AI yang membaca foto struk Anda."
      />
      <AiProviderPicker currentProvider={user.aiProvider} />
    </div>
  );
}
