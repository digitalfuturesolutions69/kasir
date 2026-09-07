import Link from "next/link";
import clsx from "clsx";
import {
  Wallet,
  ArrowRight,
  TrendingUp,
  PieChart,
  ShieldCheck,
  Zap,
  Tags,
  BarChart3,
  Check,
  Sparkles,
  ScanLine,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { PLAN_ORDER, PLANS } from "@/lib/plans";
import { formatCurrency } from "@/lib/format";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: PLAN_ORDER.map((planId) => {
    const plan = PLANS[planId];
    return {
      "@type": "Offer",
      name: plan.name,
      price: String(plan.priceMonthly),
      priceCurrency: "IDR",
    };
  }),
};

export default async function Home() {
  const session = await getSession();
  const primaryHref = session ? "/dashboard" : "/register";

  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav isAuthed={!!session} />
      <Hero primaryHref={primaryHref} isAuthed={!!session} />
      <LogoStrip />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTA primaryHref={primaryHref} isAuthed={!!session} />
      <Footer />
    </div>
  );
}

function Nav({ isAuthed }: { isAuthed: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Wallet className="h-4 w-4" />
          </span>
          Duitku
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#fitur" className="hover:text-slate-900">Fitur</a>
          <a href="#cara-kerja" className="hover:text-slate-900">Cara Kerja</a>
          <a href="#harga" className="hover:text-slate-900">Harga</a>
        </nav>
        <div className="flex items-center gap-3">
          {isAuthed ? (
            <Link href="/dashboard">
              <Button size="sm">Buka Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block">
                Masuk
              </Link>
              <Link href="/register">
                <Button size="sm">Daftar Gratis</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero({ primaryHref, isAuthed }: { primaryHref: string; isAuthed: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-white" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-2 lg:pt-24">
        <div className="animate-fade-in-up">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <Zap className="h-3.5 w-3.5" />
            Catat keuangan tanpa ribet
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Catat penerimaan &amp; pengeluaran{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              secepat mengetik
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-slate-600">
            Duitku membantu Anda dan bisnis Anda memantau arus kas secara
            real-time. Cukup catat, dan biarkan grafik serta ringkasan
            otomatis menjelaskan sisanya.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href={primaryHref}>
              <Button size="lg">
                {isAuthed ? "Buka Dashboard" : "Mulai Gratis Sekarang"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {!isAuthed && (
              <Link href="/login">
                <Button size="lg" variant="secondary">
                  Saya sudah punya akun
                </Button>
              </Link>
            )}
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> Gratis selamanya</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> Tanpa kartu kredit</span>
          </div>
        </div>

        <DashboardMockup />
      </div>
    </section>
  );
}

function DashboardMockup() {
  const bars = [40, 65, 45, 80, 55, 90, 70];
  return (
    <div className="relative animate-fade-in-up [animation-delay:150ms]">
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-indigo-200/60 to-violet-200/60 blur-2xl" />
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-indigo-900/10">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Ringkasan Bulan Ini</p>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">+12.4%</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-medium text-emerald-700">Pemasukan</p>
            <p className="mt-1 text-lg font-bold text-emerald-700">Rp 24.500.000</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-4">
            <p className="text-xs font-medium text-rose-700">Pengeluaran</p>
            <p className="mt-1 text-lg font-bold text-rose-700">Rp 11.200.000</p>
          </div>
        </div>
        <div className="mt-5 flex h-32 items-end gap-2 rounded-xl bg-slate-50 p-4">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-600 to-violet-500" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="mt-4 space-y-2.5">
          {[
            { label: "Gaji Bulanan", amount: "+Rp 18.000.000", positive: true },
            { label: "Belanja Bulanan", amount: "-Rp 2.150.000", positive: false },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-lg px-1 py-1.5 text-sm">
              <span className="text-slate-600">{row.label}</span>
              <span className={row.positive ? "font-medium text-emerald-600" : "font-medium text-rose-600"}>
                {row.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LogoStrip() {
  return (
    <div className="border-y border-slate-200 bg-white py-6">
      <p className="text-center text-xs font-medium uppercase tracking-wider text-slate-400">
        Dipercaya oleh individu &amp; pelaku usaha kecil untuk mengelola keuangan harian
      </p>
    </div>
  );
}

const features = [
  {
    icon: ScanLine,
    title: "Scan Struk dengan AI",
    desc: "Foto struk belanja atau bukti transfer, dan AI otomatis mengisi jumlah, jenis transaksi, hingga kategorinya — tak perlu ketik manual.",
  },
  {
    icon: PieChart,
    title: "Ringkasan Otomatis",
    desc: "Lihat total saldo, pemasukan, dan pengeluaran Anda diperbarui secara otomatis setiap saat.",
  },
  {
    icon: BarChart3,
    title: "Grafik Tren Keuangan",
    desc: "Pahami pola keuangan Anda dari waktu ke waktu lewat grafik yang mudah dibaca.",
  },
  {
    icon: Tags,
    title: "Kategori Fleksibel",
    desc: "Kelompokkan transaksi sesuai kebutuhan Anda: gaji, belanja, tagihan, dan lainnya.",
  },
  {
    icon: TrendingUp,
    title: "Riwayat Transaksi Lengkap",
    desc: "Cari, filter, dan telusuri seluruh riwayat transaksi kapan saja Anda butuhkan.",
  },
  {
    icon: ShieldCheck,
    title: "Privat & Aman",
    desc: "Data keuangan Anda tersimpan aman dan hanya dapat diakses oleh Anda sendiri.",
  },
];

function Features() {
  return (
    <section id="fitur" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Semua yang Anda butuhkan untuk kelola uang
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Fitur yang dirancang sederhana namun lengkap, agar Anda fokus pada
          keputusan keuangan yang lebih baik.
        </p>
      </div>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-slate-200/60"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const steps = [
  { n: "1", title: "Buat Akun", desc: "Daftar gratis hanya dengan nama, email, dan kata sandi." },
  { n: "2", title: "Catat Transaksi", desc: "Tambahkan pemasukan atau pengeluaran beserta kategorinya." },
  { n: "3", title: "Pantau & Analisa", desc: "Lihat ringkasan, grafik, dan riwayat lengkap secara instan." },
];

function HowItWorks() {
  return (
    <section id="cara-kerja" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Mulai dalam 3 langkah mudah
          </h2>
        </div>
        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="harga" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Paket yang sesuai kebutuhan Anda
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Mulai gratis, upgrade kapan saja saat kebutuhan scan struk AI Anda bertambah.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {PLAN_ORDER.map((planId) => {
            const plan = PLANS[planId];
            const featured = planId === "PRO";
            return (
              <div
                key={planId}
                className={clsx(
                  "relative flex flex-col gap-5 rounded-2xl border bg-white p-7",
                  featured
                    ? "border-indigo-300 shadow-xl shadow-indigo-900/10"
                    : "border-slate-200"
                )}
              >
                {featured && (
                  <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                    <Sparkles className="h-3 w-3" />
                    Paling Populer
                  </span>
                )}
                <div>
                  <p className="font-semibold text-slate-900">{plan.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>
                </div>
                <div>
                  <span className="text-3xl font-bold text-slate-900">
                    {plan.priceMonthly === 0 ? "Gratis" : formatCurrency(plan.priceMonthly)}
                  </span>
                  {plan.priceMonthly > 0 && (
                    <span className="text-sm text-slate-400">/bulan</span>
                  )}
                </div>
                <ul className="flex-1 space-y-2.5 text-sm text-slate-600">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button variant={featured ? "primary" : "secondary"} fullWidth>
                    {plan.priceMonthly === 0 ? "Mulai Gratis" : "Pilih Paket"}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
          Semua paket termasuk kategori tak terbatas dan grafik keuangan otomatis. Harga dalam
          Rupiah, bisa upgrade/downgrade kapan saja setelah masuk.
        </p>
      </div>
    </section>
  );
}

function CTA({ primaryHref, isAuthed }: { primaryHref: string; isAuthed: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-8 py-16 text-center shadow-xl">
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />
        <h2 className="relative text-3xl font-bold text-white sm:text-4xl">
          Siap mengambil kendali atas keuangan Anda?
        </h2>
        <p className="relative mx-auto mt-3 max-w-md text-indigo-100">
          Bergabung sekarang dan mulai catat setiap rupiah yang masuk dan keluar.
        </p>
        <Link
          href={primaryHref}
          className="relative mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50"
        >
          {isAuthed ? "Buka Dashboard" : "Daftar Gratis Sekarang"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-500 sm:flex-row">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white">
            <Wallet className="h-3.5 w-3.5" />
          </span>
          Duitku
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/contact" className="hover:text-slate-900">Kontak</Link>
          <Link href="/privacy" className="hover:text-slate-900">Kebijakan Privasi</Link>
          <Link href="/terms" className="hover:text-slate-900">Syarat &amp; Ketentuan</Link>
        </nav>
        <p>© {new Date().getFullYear()} Duitku. Semua hak dilindungi.</p>
      </div>
    </footer>
  );
}
