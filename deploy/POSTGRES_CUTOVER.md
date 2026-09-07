# Migrasi Duitku dari SQLite ke PostgreSQL

Duitku sudah pindah dari SQLite ke PostgreSQL (dijalankan di instance Postgres
native yang sudah ada di VPS, port `5433`) untuk menghindari batas concurrency
SQLite (satu penulis dalam satu waktu — lihat commit yang menambahkan WAL
mode sebelum migrasi ini, yang jadi tidak relevan lagi setelah pindah).

**Perkiraan downtime: beberapa menit** (aplikasi perlu dihentikan sebentar
supaya tidak ada tulisan baru ke SQLite selagi datanya dipindah).

Jalankan semua langkah ini sebagai user `deploy`, di `~/duitku`.

## 0. Cadangan dulu (jaring pengaman)

```bash
cp ~/duitku/prisma/prisma/prod.db ~/duitku-prod-backup-$(date +%Y%m%d).db
```

## 1. Buat password acak untuk role database baru

```bash
openssl rand -base64 24
```

Salin hasilnya — dipakai di langkah 2 dan 4.

## 2. Buat database & role khusus Duitku di Postgres yang sudah ada

Instance Postgres di port 5433 ini dipakai bersama aplikasi lain di server —
jadi Duitku dapat database & role sendiri, bukan numpang ke punya aplikasi
lain.

```bash
sudo -u postgres psql -p 5433 -c "CREATE ROLE duitku WITH LOGIN PASSWORD 'TEMPEL_PASSWORD_DARI_LANGKAH_1';"
sudo -u postgres psql -p 5433 -c "CREATE DATABASE duitku OWNER duitku;"
```

## 3. Hentikan aplikasi (bekukan data lama)

```bash
pm2 stop duitku
```

## 4. Tarik kode terbaru & perbarui `.env`

```bash
cd ~/duitku
git pull origin main
nano .env
```

Ganti baris `DATABASE_URL` (baris lain — `JWT_SECRET`, `ADMIN_EMAIL`,
`ANTHROPIC_API_KEY`, `OPENAI_API_KEY` — biarkan seperti semula):

```
DATABASE_URL="postgresql://duitku:TEMPEL_PASSWORD_DARI_LANGKAH_1@127.0.0.1:5433/duitku"
```

## 5. Install dependency & buat skema di database baru

```bash
npm ci --no-audit --no-fund
npx prisma migrate deploy
```

Ini membuat semua tabel di database Postgres baru — masih kosong, belum ada
data pengguna.

## 6. Pindahkan data dari SQLite lama ke Postgres

```bash
npm install better-sqlite3 --no-save
SQLITE_SOURCE_PATH=./prisma/prisma/prod.db node prisma/migrate-to-postgres.mjs
```

Perhatikan ringkasan di akhir — jumlah `migrated` untuk `users`,
`categories`, `transactions` harus masuk akal (bandingkan dengan jumlah
pengguna yang Anda tahu sudah daftar). Aman dijalankan ulang kalau perlu
(baris yang sudah ada dilewati, tidak dobel).

## 7. Build & jalankan ulang

```bash
npm run build
pm2 restart duitku
```

## 8. Verifikasi

Buka **https://duitku.click**, login dengan akun yang sudah ada sebelumnya,
pastikan transaksi & kategori muncul semua seperti sebelum migrasi. Cek juga
Dashboard Admin (kalau Anda admin) untuk memastikan jumlah pengguna cocok.

## 9. Simpan cadangan SQLite untuk sementara

**Jangan hapus** `~/duitku/prisma/prisma/prod.db` atau
`~/duitku-prod-backup-*.db` dulu — simpan beberapa minggu sampai yakin
migrasinya benar-benar mulus, baru boleh dihapus.

## Setelah ini

Deploy berikutnya cukup `bash ~/deploy.sh` seperti biasa — `.env` sudah ada
jadi tidak akan dibuat ulang, dan `npx prisma migrate deploy` di dalam
`deploy.sh` otomatis jalan terhadap Postgres.
