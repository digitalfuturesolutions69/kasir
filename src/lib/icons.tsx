import {
  Banknote,
  Gift,
  ShoppingBag,
  TrendingUp,
  CirclePlus,
  Utensils,
  Car,
  ShoppingCart,
  Receipt,
  Clapperboard,
  HeartPulse,
  GraduationCap,
  CircleMinus,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  banknote: Banknote,
  gift: Gift,
  "shopping-bag": ShoppingBag,
  "trending-up": TrendingUp,
  "circle-plus": CirclePlus,
  utensils: Utensils,
  car: Car,
  "shopping-cart": ShoppingCart,
  receipt: Receipt,
  clapperboard: Clapperboard,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  "circle-minus": CircleMinus,
  wallet: Wallet,
};

export const ICON_NAMES = Object.keys(ICON_MAP);

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name] ?? Wallet;
  return <Icon className={className} />;
}
