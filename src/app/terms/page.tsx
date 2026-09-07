import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — Duitku",
};

export default function TermsPage() {
  return (
    <LegalPage title="Syarat & Ketentuan" updatedAt="6 September 2026">
      <LegalSection title="1. Penerimaan Ketentuan">
        <p>
          Dengan membuat akun dan menggunakan Duitku, Anda menyetujui Syarat
          &amp; Ketentuan ini beserta Kebijakan Privasi kami. Jika Anda tidak
          setuju, mohon untuk tidak menggunakan layanan ini.
        </p>
      </LegalSection>

      <LegalSection title="2. Akun Pengguna">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Anda bertanggung jawab menjaga kerahasiaan kata sandi dan seluruh aktivitas yang terjadi pada akun Anda.</li>
          <li>Anda wajib memberikan informasi yang akurat saat mendaftar.</li>
          <li>Satu akun hanya boleh digunakan oleh satu pengguna.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Sifat Layanan">
        <p>
          Duitku adalah alat bantu pencatatan pemasukan dan pengeluaran
          pribadi. Layanan ini <strong>bukan merupakan nasihat keuangan,
          investasi, pajak, atau hukum</strong> dalam bentuk apa pun.
          Keputusan keuangan yang Anda ambil berdasarkan data di Duitku
          sepenuhnya menjadi tanggung jawab Anda sendiri.
        </p>
      </LegalSection>

      <LegalSection title="4. Tanggung Jawab Pengguna">
        <p>
          Anda bertanggung jawab penuh atas keakuratan data transaksi yang
          Anda masukkan. Duitku hanya menampilkan dan meringkas data sesuai
          apa yang Anda catat sendiri.
        </p>
      </LegalSection>

      <LegalSection title="5. Batasan Tanggung Jawab">
        <p>
          Duitku disediakan &quot;sebagaimana adanya&quot; tanpa jaminan
          apa pun. Kami tidak bertanggung jawab atas kerugian yang timbul
          dari kesalahan pencatatan, gangguan layanan, atau keputusan
          keuangan yang diambil berdasarkan data dalam aplikasi.
        </p>
      </LegalSection>

      <LegalSection title="6. Penghentian Akun">
        <p>
          Anda dapat berhenti menggunakan layanan dan meminta penghapusan
          akun kapan saja. Kami juga berhak menangguhkan atau menghapus akun
          yang terbukti disalahgunakan atau melanggar ketentuan ini.
        </p>
      </LegalSection>

      <LegalSection title="7. Perubahan Layanan &amp; Ketentuan">
        <p>
          Kami dapat mengubah, menambah, atau menghentikan sebagian fitur
          layanan, serta memperbarui Syarat &amp; Ketentuan ini dari waktu ke
          waktu. Penggunaan layanan setelah perubahan berarti Anda menyetujui
          ketentuan yang telah diperbarui.
        </p>
      </LegalSection>

      <LegalSection title="8. Hukum yang Berlaku">
        <p>
          Syarat &amp; Ketentuan ini diatur dan ditafsirkan berdasarkan hukum
          yang berlaku di Republik Indonesia.
        </p>
      </LegalSection>

      <LegalSection title="9. Kontak">
        <p>
          Pertanyaan mengenai Syarat &amp; Ketentuan ini dapat disampaikan
          melalui halaman{" "}
          <a href="/contact" className="font-medium text-indigo-600 hover:text-indigo-700">
            Kontak
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
