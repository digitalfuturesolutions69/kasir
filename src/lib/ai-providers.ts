import type { AiProvider } from "@prisma/client";

export type AiProviderDefinition = {
  id: AiProvider;
  name: string;
  description: string;
};

export const AI_PROVIDERS: Record<AiProvider, AiProviderDefinition> = {
  CLAUDE: {
    id: "CLAUDE",
    name: "Claude",
    description: "Anthropic Claude Sonnet 5 — default, teliti untuk struk kusut & nota tulisan tangan.",
  },
  OPENAI: {
    id: "OPENAI",
    name: "ChatGPT",
    description: "OpenAI GPT-5.5 — alternatif lain untuk membaca struk.",
  },
};

export const AI_PROVIDER_ORDER: AiProvider[] = ["CLAUDE", "OPENAI"];
