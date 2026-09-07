import Link from "next/link";
import { Wallet, ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <Link href="/" className="mb-10 flex items-center gap-2 text-lg font-bold text-slate-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Wallet className="h-4 w-4" />
        </span>
        Duitku
      </Link>

      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <SearchX className="h-8 w-8" />
      </span>

      <h1 className="text-3xl font-bold text-slate-900">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-slate-500">
        Halaman yang Anda cari tidak ada atau sudah dipindahkan.
      </p>

      <Link href="/" className="mt-8">
        <Button size="lg">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke beranda
        </Button>
      </Link>
    </div>
  );
}
