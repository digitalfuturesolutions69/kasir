import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Pelajari data apa saja yang dikumpulkan Duitku, bagaimana data itu digunakan dan diamankan, serta hak Anda atas data pribadi Anda.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Kebijakan Privasi" updatedAt="6 September 2026">
      <LegalSection title="1. Data yang Kami Kumpulkan">
        <p>Untuk menyediakan layanan Duitku, kami mengumpulkan data berikut:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Nama dan alamat email saat Anda mendaftar akun.</li>
          <li>Kata sandi Anda, yang disimpan dalam bentuk terenkripsi (hash) — kami tidak pernah menyimpan kata sandi dalam bentuk teks biasa.</li>
          <li>Data transaksi keuangan yang Anda catat sendiri (jumlah, tanggal, kategori, dan catatan pemasukan/pengeluaran).</li>
          <li>Data teknis dasar seperti cookie sesi untuk menjaga Anda tetap masuk ke akun.</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Bagaimana Kami Menggunakan Data Anda">
        <p>
          Data yang Anda berikan digunakan semata-mata untuk menjalankan
          fungsi inti Duitku: mengautentikasi akun Anda dan menampilkan
          ringkasan, grafik, serta riwayat transaksi keuangan Anda sendiri.
          Kami tidak menjual, menyewakan, atau membagikan data pribadi maupun
          data keuangan Anda kepada pihak ketiga untuk tujuan pemasaran.
        </p>
      </LegalSection>

      <LegalSection title="3. Penyimpanan &amp; Keamanan Data">
        <p>
          Data Anda tersimpan di server yang kami kelola. Kami menerapkan
          langkah-langkah keamanan yang wajar, termasuk enkripsi kata sandi
          dan sesi login berbasis token yang aman (httpOnly cookie), untuk
          melindungi data Anda dari akses tidak sah. Meskipun demikian, tidak
          ada sistem yang sepenuhnya bebas risiko — gunakan kata sandi yang
          kuat dan unik untuk akun Anda.
        </p>
      </LegalSection>

      <LegalSection title="4. Hak Anda atas Data">
        <p>Anda berhak untuk:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Mengakses dan memperbarui data transaksi serta kategori Anda kapan saja melalui aplikasi.</li>
          <li>Menghapus transaksi atau kategori yang sudah Anda buat.</li>
          <li>Meminta penghapusan akun beserta seluruh data terkait dengan menghubungi kami (lihat bagian Kontak).</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Cookie">
        <p>
          Kami hanya menggunakan satu cookie esensial (sesi login) yang
          diperlukan agar Anda tetap masuk ke akun. Cookie ini bersifat
          httpOnly dan tidak digunakan untuk pelacakan iklan.
        </p>
      </LegalSection>

      <LegalSection title="6. Perubahan Kebijakan">
        <p>
          Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu.
          Perubahan akan tercermin pada tanggal &quot;Terakhir diperbarui&quot;
          di halaman ini.
        </p>
      </LegalSection>

      <LegalSection title="7. Kontak">
        <p>
          Ada pertanyaan tentang privasi data Anda? Hubungi kami melalui
          halaman{" "}
          <a href="/contact" className="font-medium text-indigo-600 hover:text-indigo-700">
            Kontak
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
