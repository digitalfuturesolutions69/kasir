import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Kontak",
  description:
    "Punya pertanyaan atau butuh bantuan soal Duitku? Hubungi kami lewat email atau WhatsApp.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <LegalPage title="Tentang & Kontak" updatedAt="6 September 2026">
      <LegalSection title="Tentang Duitku">
        <p>
          Duitku dibuat untuk membantu individu maupun pelaku usaha kecil
          mencatat pemasukan dan pengeluaran dengan mudah, cepat, dan rapi —
          tanpa perlu spreadsheet yang rumit.
        </p>
      </LegalSection>

      <LegalSection title="Hubungi Kami">
        <p>Punya pertanyaan, masukan, atau butuh bantuan? Silakan hubungi kami:</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <a
            href="mailto:halo@duitku.click"
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-indigo-200 hover:bg-indigo-50"
          >
            <Mail className="h-4 w-4 text-indigo-600" />
            halo@duitku.click
          </a>
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-indigo-200 hover:bg-indigo-50"
          >
            <MessageCircle className="h-4 w-4 text-indigo-600" />
            WhatsApp
          </a>
        </div>
      </LegalSection>

      <LegalSection title="Permintaan Hapus Akun">
        <p>
          Kalau Anda ingin akun beserta seluruh data Duitku Anda dihapus
          secara permanen, kirimkan email dari alamat yang terdaftar ke{" "}
          <a href="mailto:halo@duitku.click" className="font-medium text-indigo-600 hover:text-indigo-700">
            halo@duitku.click
          </a>{" "}
          dengan subjek &quot;Hapus Akun&quot;.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
