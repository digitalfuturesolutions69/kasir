import Link from "next/link";
import { Wallet, LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";

export function MobileTopbar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md lg:hidden">
      <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Wallet className="h-3.5 w-3.5" />
        </span>
        Duitku
      </Link>
      <form action={logoutAction}>
        <button
          type="submit"
          aria-label="Keluar"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </header>
  );
}
