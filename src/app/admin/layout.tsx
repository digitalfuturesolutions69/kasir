import { redirect } from "next/navigation";
import Link from "next/link";
import { Wallet, ArrowLeft, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { logoutAction } from "@/lib/actions/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!isAdminEmail(session.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Wallet className="h-4 w-4" />
              </span>
              Duitku
            </Link>
            <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              <ShieldCheck className="h-3 w-3" />
              Admin
            </span>
          </div>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Dashboard Saya
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="cursor-pointer hover:text-red-600">
                Keluar
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
