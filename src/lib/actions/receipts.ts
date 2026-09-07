"use server";

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import sharp from "sharp";
import type { AiProvider } from "@prisma/client";
import { anthropic } from "@/lib/anthropic";
import { openai } from "@/lib/openai";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_RECEIPT_TYPES,
  MAX_RECEIPT_SIZE_BYTES,
  saveReceiptImage,
} from "@/lib/receipt-storage";
import { PLANS, isSamePeriod } from "@/lib/plans";

export type ExtractedReceipt = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  confidence: "high" | "medium" | "low";
  categoryId: string | null;
};

export type AnalyzeReceiptResult = {
  error?: string;
  receiptPath?: string;
  extracted?: ExtractedReceipt;
};

function buildSystemPrompt(categories: { name: string; type: "INCOME" | "EXPENSE" }[]): string {
  const incomeCats = categories.filter((c) => c.type === "INCOME").map((c) => c.name);
  const expenseCats = categories.filter((c) => c.type === "EXPENSE").map((c) => c.name);

  return `Anda membantu membaca foto bukti transaksi keuangan (struk belanja, nota tulisan tangan, bukti transfer bank, slip ATM, dll) untuk aplikasi pencatatan keuangan pribadi berbahasa Indonesia.

ATURAN PALING PENTING — DILARANG MENGARANG: Anda HANYA boleh melaporkan barang/toko/nominal yang BENAR-BENAR tertulis dan bisa Anda baca di foto. Jika foto miring, terputar, buram, tulisan tangan sulit dibaca, atau Anda tidak yakin dengan isinya, Anda WAJIB menjawab confidence "low", amount 0, category null, dan description "Tidak dapat membaca foto ini dengan jelas". JANGAN PERNAH mengisi dengan tebakan generik yang masuk akal (seperti "belanja di pasar" atau "beli kopi") jika itu bukan benar-benar yang tertulis di foto — mengarang data keuangan yang salah jauh lebih berbahaya daripada mengaku tidak bisa membaca.

Jika foto terlihat miring atau terputar (rotasi 90°/180°/270°), putar dulu secara mental sebelum membaca teksnya — banyak nota difoto dalam posisi miring.

PENTING soal ketelitian angka: struk yang kusut, pudar, atau miring sering membuat digit tertukar (paling sering: 2↔7, 3↔8, 5↔6, 1↔7, 0↔8, 4↔9). Baca ulang setiap digit nominal satu per satu secara terpisah dari kiri ke kanan, jangan hanya menebak dari bentuk umum angkanya. Kalau ada beberapa baris angka (subtotal, pajak, total/jumlah, kembalian, tunai/dibayar), pastikan Anda mengambil baris "TOTAL" atau "JUMLAH" (bukan subtotal/tunai/kembalian) sebagai "amount".

Baca foto yang diberikan dan tentukan:
- "type": "INCOME" jika ini bukti UANG MASUK (transfer masuk, gaji, penjualan, dsb), atau "EXPENSE" jika UANG KELUAR (struk belanja, transfer keluar, tagihan, dsb).
- "amount": jumlah nominal transaksi dalam Rupiah, sebagai angka tanpa titik/koma/simbol mata uang (contoh: 150000, bukan "Rp150.000" atau "150.000,00").
- "description": ringkasan singkat (maksimal 8 kata) tentang transaksi ini dalam Bahasa Indonesia, HANYA berdasarkan apa yang benar-benar terlihat di foto (nama toko/barang yang tertulis), misalnya "Belanja bulanan di Indomaret" atau "Transfer dari BCA - John Doe". Jangan menambahkan detail yang tidak tertulis di foto.
- "confidence": "high" HANYA jika foto tajam, rata (tidak kusut/miring), dan setiap digit angkanya jelas tanpa keraguan sama sekali. "medium" jika foto cukup jelas tapi ada sedikit keraguan pada satu digit atau lebih. "low" jika struk kusut/buram/pencahayaan buruk/terpotong/tulisan tangan sulit dibaca, atau bukan bukti transaksi. Jangan pernah menjawab "high" hanya karena jenis transaksinya jelas — confidence harus mencerminkan keyakinan Anda pada ANGKA nominalnya secara spesifik.
- "category": pilih SATU nama kategori yang PALING cocok dari daftar kategori milik pengguna di bawah (harus persis sama dengan salah satu nama di daftar, sesuai "type" yang Anda pilih), atau null jika tidak ada yang cocok sama sekali atau Anda tidak yakin.

Daftar kategori Pemasukan (INCOME) milik pengguna: ${incomeCats.length ? incomeCats.join(", ") : "(tidak ada)"}
Daftar kategori Pengeluaran (EXPENSE) milik pengguna: ${expenseCats.length ? expenseCats.join(", ") : "(tidak ada)"}

Balas HANYA dengan JSON valid, tanpa teks lain, tanpa markdown code block. Format persis:
{"type":"INCOME"|"EXPENSE","amount":<number>,"description":"<string>","confidence":"high"|"medium"|"low","category":"<nama persis dari daftar>"|null}`;
}

export async function analyzeReceiptAction(
  formData: FormData
): Promise<AnalyzeReceiptResult> {
  const session = await getSession();
  if (!session) return { error: "Sesi Anda berakhir, silakan masuk kembali." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "File tidak ditemukan" };
  }
  if (!ALLOWED_RECEIPT_TYPES[file.type]) {
    return { error: "Format file harus JPG, PNG, atau WEBP" };
  }
  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    return { error: "Ukuran file maksimal 5MB" };
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());

  // Normalize before storing/sending to the AI provider:
  // - auto-rotate based on EXIF orientation (phone camera JPEGs are often
  //   stored "sideways" with a flag telling viewers how to rotate them,
  //   which a raw byte read — as sent to a vision API — ignores unless
  //   we bake the rotation into the pixels)
  // - cap the longest edge at 1568px, Anthropic's own recommended max for
  //   vision input (also comfortably inside OpenAI's limits) — larger
  //   images get downscaled server-side before the model reads them
  //   anyway, so this only trims upload size/bandwidth without losing any
  //   detail the model would actually use. This also shrinks full-
  //   resolution camera captures (often 3000px+, several MB) down to a
  //   few hundred KB, so manual compression is never needed.
  let normalizedBuffer: Buffer;
  try {
    normalizedBuffer = await sharp(rawBuffer)
      .rotate()
      .resize({ width: 1568, height: 1568, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
  } catch (err) {
    console.error("Failed to normalize receipt image", err);
    normalizedBuffer = rawBuffer;
  }

  let receiptPath: string;
  try {
    receiptPath = await saveReceiptImage(session.userId, normalizedBuffer, "image/jpeg");
  } catch (err) {
    console.error("saveReceiptImage failed", err);
    return { error: "Gagal menyimpan foto. Coba lagi." };
  }

  const quota = await consumeScanQuota(session.userId);
  if (!quota.ok) {
    return {
      receiptPath,
      error: `Kuota scan AI paket ${quota.planName} (${quota.limit}/bulan) sudah habis. Foto tersimpan, isi manual di bawah atau upgrade paket di menu Paket.`,
    };
  }

  const categories = await prisma.category.findMany({
    where: { userId: session.userId },
    select: { id: true, name: true, type: true },
  });
  const systemPrompt = buildSystemPrompt(categories);

  try {
    const parsed =
      quota.provider === "OPENAI"
        ? await analyzeWithOpenAI(systemPrompt, normalizedBuffer)
        : await analyzeWithClaude(systemPrompt, normalizedBuffer);

    if (!parsed) {
      return {
        receiptPath,
        error: "Foto tersimpan, tapi AI tidak berhasil membaca nominalnya. Isi manual di bawah.",
      };
    }

    const matchedCategory = categories.find(
      (c) => c.type === parsed.type && c.name.toLowerCase() === parsed.categoryName?.toLowerCase()
    );

    return {
      receiptPath,
      extracted: {
        type: parsed.type,
        amount: parsed.amount,
        description: parsed.description,
        confidence: parsed.confidence,
        categoryId: matchedCategory?.id ?? null,
      },
    };
  } catch (err) {
    console.error(`analyzeReceiptAction: ${quota.provider} call failed`, err);
    return { receiptPath, error: receiptErrorMessage(err) };
  }
}

async function analyzeWithClaude(
  systemPrompt: string,
  imageBuffer: Buffer
): Promise<ParsedReceipt | null> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageBuffer.toString("base64"),
            },
          },
          { type: "text", text: "Baca bukti transaksi ini." },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text" ? parseExtractedJson(textBlock.text) : null;
}

// Structured Outputs (json_schema, strict) instead of the prompt-only JSON
// instruction Claude relies on — GPT vision models are more prone to
// wrapping JSON in prose/markdown without this, and the schema is cheap
// to define once. All fields are required (per strict mode's rules);
// "category" being nullable is expressed via a ["string","null"] type
// rather than by omitting it from "required".
const RECEIPT_JSON_SCHEMA = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["INCOME", "EXPENSE"] },
    amount: { type: "number" },
    description: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    category: { type: ["string", "null"] },
  },
  required: ["type", "amount", "description", "confidence", "category"],
  additionalProperties: false,
};

async function analyzeWithOpenAI(
  systemPrompt: string,
  imageBuffer: Buffer
): Promise<ParsedReceipt | null> {
  const response = await openai.responses.create({
    model: "gpt-5.5",
    instructions: systemPrompt,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_image",
            image_url: `data:image/jpeg;base64,${imageBuffer.toString("base64")}`,
            detail: "high",
          },
          { type: "input_text", text: "Baca bukti transaksi ini." },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "ekstraksi_struk",
        schema: RECEIPT_JSON_SCHEMA,
        strict: true,
      },
    },
  });

  return parseExtractedJson(response.output_text);
}

/**
 * Atomically checks and consumes one unit of the user's monthly AI
 * scan quota, rolling the period over first if it has crossed into a
 * new calendar month. Runs before the (paid) AI call so an over-quota
 * user never triggers billable usage. Also returns which provider to
 * use, read in the same transaction to avoid a second round trip.
 */
async function consumeScanQuota(
  userId: string
): Promise<
  | { ok: true; remaining: number; provider: AiProvider }
  | { ok: false; limit: number; planName: string }
> {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { plan: true, scanCount: true, scanPeriodStart: true, aiProvider: true },
    });

    const inCurrentPeriod = isSamePeriod(user.scanPeriodStart, now);
    const currentCount = inCurrentPeriod ? user.scanCount : 0;
    const { scanLimit: limit, name: planName } = PLANS[user.plan];

    if (currentCount >= limit) {
      return { ok: false, limit, planName };
    }

    await tx.user.update({
      where: { id: userId },
      data: inCurrentPeriod
        ? { scanCount: { increment: 1 } }
        : { scanCount: 1, scanPeriodStart: now },
    });

    return { ok: true, remaining: limit - currentCount - 1, provider: user.aiProvider };
  });
}

function receiptErrorMessage(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError || err instanceof OpenAI.AuthenticationError) {
    return "Foto tersimpan, tapi fitur baca otomatis belum aktif (API key belum diatur). Isi manual di bawah.";
  }
  // Both providers surface "no credit/quota left" as a 429, same as a
  // plain rate limit — but it needs its own message since "coba lagi
  // sebentar" is misleading when the real fix is topping up billing.
  // Anthropic marks this `error.type: "billing_error"`, OpenAI
  // `type: "insufficient_quota"`; both land on `err.type` directly.
  const errorType = (err as { type?: unknown } | null)?.type;
  if (errorType === "billing_error" || errorType === "insufficient_quota") {
    return "Foto tersimpan, tapi saldo/kredit API AI sudah habis. Isi ulang billing provider AI-nya (lihat log server untuk detail), atau isi manual di bawah.";
  }
  if (err instanceof Anthropic.RateLimitError || err instanceof OpenAI.RateLimitError) {
    return "Foto tersimpan, tapi layanan AI sedang sibuk (terlalu banyak permintaan). Coba lagi sebentar, atau isi manual.";
  }
  if (err instanceof Anthropic.APIError || err instanceof OpenAI.APIError) {
    return "Foto tersimpan, tapi AI gagal membaca bukti ini. Isi manual di bawah.";
  }
  return "Foto tersimpan, tapi terjadi kesalahan saat membaca. Isi manual di bawah.";
}

type ParsedReceipt = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  confidence: "high" | "medium" | "low";
  categoryName: string | null;
};

function parseExtractedJson(text: string): ParsedReceipt | null {
  const cleaned = text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  try {
    const obj = JSON.parse(cleaned);
    if (
      (obj.type === "INCOME" || obj.type === "EXPENSE") &&
      typeof obj.amount === "number" &&
      Number.isFinite(obj.amount) &&
      typeof obj.description === "string" &&
      (obj.confidence === "high" || obj.confidence === "medium" || obj.confidence === "low") &&
      (obj.category === null || typeof obj.category === "string")
    ) {
      return {
        type: obj.type,
        amount: obj.amount,
        description: obj.description,
        confidence: obj.confidence,
        categoryName: obj.category ?? null,
      };
    }
    return null;
  } catch {
    return null;
  }
}
