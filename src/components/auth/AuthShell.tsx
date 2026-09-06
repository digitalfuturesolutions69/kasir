import Link from "next/link";
import { Wallet, ShieldCheck, TrendingUp, PiggyBank } from "lucide-react";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white lg:flex">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl" />

        <Link href="/" className="relative z-10 flex items-center gap-2 text-xl font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <Wallet className="h-5 w-5" />
          </span>
          Duitku
        </Link>

        <div className="relative z-10 space-y-8">
          <h1 className="text-3xl font-bold leading-tight">
            Kelola keuangan Anda dengan lebih tenang.
          </h1>
          <p className="max-w-sm text-indigo-100">
            Catat setiap pemasukan dan pengeluaran, pantau arus kas, dan buat
            keputusan finansial yang lebih baik — semua dalam satu tempat.
          </p>
          <div className="space-y-4 pt-4">
            <Feature icon={TrendingUp} text="Laporan & grafik tren keuangan otomatis" />
            <Feature icon={PiggyBank} text="Kategori pemasukan & pengeluaran fleksibel" />
            <Feature icon={ShieldCheck} text="Data Anda aman & privat" />
          </div>
        </div>

        <p className="relative z-10 text-sm text-indigo-200">
          © {new Date().getFullYear()} Duitku. Semua hak dilindungi.
        </p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm animate-fade-in-up">
          <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-bold text-slate-900 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Wallet className="h-4 w-4" />
            </span>
            Duitku
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm text-indigo-50">{text}</span>
    </div>
  );
}
