import OpenAI from "openai";

const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

// Unlike the Anthropic SDK, OpenAI's client throws synchronously at
// construction time if no key is present at all (not just at request
// time) — and this module is imported unconditionally by receipts.ts, so
// every deployment without OPENAI_API_KEY set (the common case: only one
// provider configured, or neither yet) would otherwise crash the receipt
// scan feature for ALL users, including ones who picked Claude. A
// placeholder keeps construction lazy-safe; a real call still fails
// cleanly with AuthenticationError, caught the same way as Claude's.
export const openai =
  globalForOpenAI.openai ??
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-not-configured" });

if (process.env.NODE_ENV !== "production") globalForOpenAI.openai = openai;
