import { LayoutDashboard, ArrowLeftRight, Tags, CreditCard, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/categories", label: "Kategori", icon: Tags },
  { href: "/paket", label: "Paket", icon: CreditCard },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
];
