"use server";

import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "@/lib/anthropic";
import { getSession } from "@/lib/auth";
import {
  ALLOWED_RECEIPT_TYPES,
  MAX_RECEIPT_SIZE_BYTES,
  saveReceiptImage,
} from "@/lib/receipt-storage";

export type ExtractedReceipt = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  confidence: "high" | "medium" | "low";
};

export type AnalyzeReceiptResult = {
  error?: string;
  receiptPath?: string;
  extracted?: ExtractedReceipt;
};

const SYSTEM_PROMPT = `Anda membantu membaca foto bukti transaksi keuangan (struk belanja, bukti transfer bank, slip ATM, dll) untuk aplikasi pencatatan keuangan pribadi berbahasa Indonesia.

PENTING soal ketelitian angka: struk thermal yang kusut, pudar, atau miring sering membuat digit tertukar (paling sering: 2↔7, 3↔8, 5↔6, 1↔7, 0↔8, 4↔9). Sebelum menjawab, baca ulang setiap digit nominal satu per satu secara terpisah dari kiri ke kanan, jangan hanya menebak dari bentuk umum angkanya. Kalau ada beberapa baris angka (subtotal, pajak, total, kembalian, tunai), pastikan Anda mengambil baris "TOTAL" (bukan subtotal/tunai/kembalian) sebagai "amount".

Baca foto yang diberikan dan tentukan:
- "type": "INCOME" jika ini bukti UANG MASUK (transfer masuk, gaji, penjualan, dsb), atau "EXPENSE" jika UANG KELUAR (struk belanja, transfer keluar, tagihan, dsb).
- "amount": jumlah nominal transaksi dalam Rupiah, sebagai angka tanpa titik/koma/simbol mata uang (contoh: 150000, bukan "Rp150.000" atau "150.000,00").
- "description": ringkasan singkat (maksimal 8 kata) tentang transaksi ini dalam Bahasa Indonesia, misalnya "Belanja bulanan di Indomaret" atau "Transfer dari BCA - John Doe".
- "confidence": "high" HANYA jika foto tajam, rata (tidak kusut/miring), dan setiap digit angkanya jelas tanpa keraguan sama sekali. "medium" jika foto cukup jelas tapi ada sedikit keraguan pada satu digit atau lebih. "low" jika struk kusut/buram/pencahayaan buruk/terpotong, atau bukan bukti transaksi. Jangan pernah menjawab "high" hanya karena jenis transaksinya jelas — confidence harus mencerminkan keyakinan Anda pada ANGKA nominalnya secara spesifik.

Balas HANYA dengan JSON valid, tanpa teks lain, tanpa markdown code block. Format persis:
{"type":"INCOME"|"EXPENSE","amount":<number>,"description":"<string>","confidence":"high"|"medium"|"low"}

Jika gambar sama sekali bukan bukti transaksi atau tidak bisa dibaca, balas dengan confidence "low", amount 0, dan description "Tidak dapat membaca foto ini".`;

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

  const buffer = Buffer.from(await file.arrayBuffer());

  let receiptPath: string;
  try {
    receiptPath = await saveReceiptImage(session.userId, buffer, file.type);
  } catch (err) {
    console.error("saveReceiptImage failed", err);
    return { error: "Gagal menyimpan foto. Coba lagi." };
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: file.type as "image/jpeg" | "image/png" | "image/webp",
                data: buffer.toString("base64"),
              },
            },
            { type: "text", text: "Baca bukti transaksi ini." },
          ],
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const extracted = textBlock && textBlock.type === "text" ? parseExtractedJson(textBlock.text) : null;

    if (!extracted) {
      return {
        receiptPath,
        error: "Foto tersimpan, tapi AI tidak berhasil membaca nominalnya. Isi manual di bawah.",
      };
    }

    return { receiptPath, extracted };
  } catch (err) {
    console.error("analyzeReceiptAction: Claude call failed", err);
    return { receiptPath, error: receiptErrorMessage(err) };
  }
}

function receiptErrorMessage(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) {
    return "Foto tersimpan, tapi fitur baca otomatis belum aktif (API key belum diatur). Isi manual di bawah.";
  }
  if (err instanceof Anthropic.RateLimitError) {
    return "Foto tersimpan, tapi layanan AI sedang sibuk. Coba lagi sebentar, atau isi manual.";
  }
  if (err instanceof Anthropic.APIError) {
    return "Foto tersimpan, tapi AI gagal membaca bukti ini. Isi manual di bawah.";
  }
  return "Foto tersimpan, tapi terjadi kesalahan saat membaca. Isi manual di bawah.";
}

function parseExtractedJson(text: string): ExtractedReceipt | null {
  const cleaned = text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  try {
    const obj = JSON.parse(cleaned);
    if (
      (obj.type === "INCOME" || obj.type === "EXPENSE") &&
      typeof obj.amount === "number" &&
      Number.isFinite(obj.amount) &&
      typeof obj.description === "string" &&
      (obj.confidence === "high" || obj.confidence === "medium" || obj.confidence === "low")
    ) {
      return obj as ExtractedReceipt;
    }
    return null;
  } catch {
    return null;
  }
}
