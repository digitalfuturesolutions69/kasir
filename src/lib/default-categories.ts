export const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  icon: string;
}> = [
  { name: "Gaji", type: "INCOME", color: "#16a34a", icon: "banknote" },
  { name: "Bonus", type: "INCOME", color: "#22c55e", icon: "gift" },
  { name: "Penjualan", type: "INCOME", color: "#0ea5e9", icon: "shopping-bag" },
  { name: "Investasi", type: "INCOME", color: "#8b5cf6", icon: "trending-up" },
  { name: "Lainnya", type: "INCOME", color: "#64748b", icon: "circle-plus" },

  { name: "Makanan & Minuman", type: "EXPENSE", color: "#f97316", icon: "utensils" },
  { name: "Transportasi", type: "EXPENSE", color: "#3b82f6", icon: "car" },
  { name: "Belanja", type: "EXPENSE", color: "#ec4899", icon: "shopping-cart" },
  { name: "Tagihan", type: "EXPENSE", color: "#ef4444", icon: "receipt" },
  { name: "Hiburan", type: "EXPENSE", color: "#a855f7", icon: "clapperboard" },
  { name: "Kesehatan", type: "EXPENSE", color: "#14b8a6", icon: "heart-pulse" },
  { name: "Pendidikan", type: "EXPENSE", color: "#6366f1", icon: "graduation-cap" },
  { name: "Lainnya", type: "EXPENSE", color: "#64748b", icon: "circle-minus" },
];
