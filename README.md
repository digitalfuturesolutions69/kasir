# Duitku

Duitku adalah aplikasi SaaS sederhana untuk mencatat penerimaan (pemasukan) dan
pengeluaran uang, dilengkapi dashboard ringkasan, grafik tren keuangan, dan
manajemen kategori — dibangun agar mudah digunakan dan enak dilihat.

## Fitur

- **Autentikasi**: daftar & masuk dengan email/kata sandi (sesi berbasis JWT, cookie httpOnly).
- **Multi-user**: setiap pengguna memiliki data transaksi & kategori sendiri.
- **Dashboard**: saldo saat ini, pemasukan/pengeluaran bulan ini, grafik tren 6 bulan terakhir, dan rincian pengeluaran per kategori.
- **Transaksi**: tambah, edit, hapus transaksi pemasukan/pengeluaran, lengkap dengan pencarian & filter (tipe, kategori).
- **Kategori**: kelola kategori pemasukan & pengeluaran dengan warna dan ikon kustom.
- **Responsif**: tampilan desktop (sidebar) dan mobile (bottom navigation).

## Tech Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Prisma](https://www.prisma.io) + SQLite
- Autentikasi kustom dengan [jose](https://github.com/panva/jose) (JWT) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- [Recharts](https://recharts.org) untuk grafik
- [lucide-react](https://lucide.dev) untuk ikon

## Menjalankan Secara Lokal

1. Salin `.env.example` menjadi `.env` dan sesuaikan `JWT_SECRET`:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Buat database & jalankan migrasi:

   ```bash
   npx prisma migrate dev
   ```

4. Jalankan development server:

   ```bash
   npm run dev
   ```

5. Buka [http://localhost:3000](http://localhost:3000) di browser.

## Build Produksi

```bash
npm run build
npm run start
```
