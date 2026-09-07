import type { Plan } from "@prisma/client";

export type PlanDefinition = {
  id: Plan;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number | null;
  scanLimit: number;
  features: string[];
};

// Kept in sync with the pricing design (Rp150/scan AI cost, 3% + Rp2.000
// payment-gateway fee, small shared-server allocation) — see the "Paket
// Duitku" pricing writeup. scanLimit is the number of AI receipt reads
// allowed per calendar month (see receipts.ts for enforcement).
export const PLANS: Record<Plan, PlanDefinition> = {
  FREE: {
    id: "FREE",
    name: "Gratis",
    tagline: "Coba pakai, tanpa kartu",
    priceMonthly: 0,
    priceYearly: null,
    scanLimit: 15,
    features: [
      "15 scan struk AI / bulan",
      "Kategori pemasukan & pengeluaran tanpa batas",
      "Riwayat transaksi 30 hari",
      "1 pengguna",
    ],
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    tagline: "Untuk pencatatan pribadi rutin",
    priceMonthly: 29_000,
    priceYearly: 290_000,
    scanLimit: 100,
    features: [
      "100 scan struk AI / bulan",
      "Riwayat transaksi tanpa batas",
      "Ekspor laporan CSV & PDF",
      "Pengingat tagihan berulang",
    ],
  },
  UMKM: {
    id: "UMKM",
    name: "UMKM",
    tagline: "Untuk usaha kecil & tim kecil",
    priceMonthly: 99_000,
    priceYearly: 990_000,
    scanLimit: 400,
    features: [
      "400 scan struk AI / bulan",
      "Hingga 3 anggota tim",
      "Laporan laba-rugi bulanan",
      "Dukungan prioritas via WhatsApp",
    ],
  },
};

export const PLAN_ORDER: Plan[] = ["FREE", "PRO", "UMKM"];

export function getScanLimit(plan: Plan): number {
  return PLANS[plan].scanLimit;
}

/**
 * A monthly scan-quota window resets lazily: instead of a cron job, any
 * read/write path just checks whether `periodStart` is still in the
 * current calendar month and rolls it over on the spot if not.
 */
export function isSamePeriod(periodStart: Date, now: Date): boolean {
  return (
    periodStart.getFullYear() === now.getFullYear() &&
    periodStart.getMonth() === now.getMonth()
  );
}
