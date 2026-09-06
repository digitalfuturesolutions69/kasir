# Deploy Duitku ke VPS

Panduan singkat untuk menjalankan `deploy.sh` di VPS Ubuntu/Debian (mis. `103.175.207.51`).

## 1. Siapkan token GitHub (karena repo ini private)

1. Buka https://github.com/settings/tokens?type=beta
2. **Generate new token** → beri nama bebas (mis. "duitku-deploy")
3. **Repository access** → pilih **Only select repositories** → pilih `kasir`
4. **Permissions** → **Repository permissions** → **Contents** → **Read-only**
5. Generate, lalu salin tokennya (hanya tampil sekali)

## 2. Upload script ke VPS

Dari komputer Anda (bukan dari sini):

```bash
scp deploy/deploy.sh root@103.175.207.51:~/
```

Atau salin isi `deploy.sh` manual lalu tempel ke file baru di VPS via `nano deploy.sh`.

## 3. Jalankan di VPS

SSH ke VPS Anda:

```bash
ssh root@103.175.207.51
```

Lalu jalankan (ganti token dengan milik Anda):

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
sudo -E bash deploy.sh
```

Tanpa domain dulu (akses via IP saja):

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
sudo -E bash deploy.sh
```

Aplikasi akan bisa diakses di `http://103.175.207.51`.

## 4. Kalau nanti sudah punya domain

Arahkan A record domain Anda ke `103.175.207.51`, lalu jalankan ulang:

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
export DOMAIN=keuangan.namadomainanda.com
sudo -E bash deploy.sh
```

Setelah itu aktifkan HTTPS gratis (Let's Encrypt):

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d keuangan.namadomainanda.com
```

## Yang dilakukan script ini

- Install Node.js 22, Nginx, dan pm2 (process manager)
- Clone/pull kode dari GitHub ke `/opt/duitku`
- Buat file `.env` otomatis dengan `JWT_SECRET` acak (kalau belum ada)
- Install dependencies, jalankan migrasi database (Prisma + SQLite), build produksi
- Jalankan aplikasi lewat pm2 (otomatis restart kalau server reboot)
- Konfigurasi Nginx sebagai reverse proxy ke aplikasi

## Update aplikasi di kemudian hari

Setelah ada perubahan kode baru di GitHub, cukup jalankan ulang script yang sama
di VPS (`sudo -E bash deploy.sh`) — script akan otomatis `git pull`, install ulang
dependency, migrasi, build, dan restart aplikasi.

## Perintah berguna di VPS

```bash
pm2 status          # cek status aplikasi
pm2 logs duitku      # lihat log aplikasi
pm2 restart duitku   # restart manual
sudo nginx -t         # cek konfigurasi Nginx valid
sudo systemctl reload nginx
```
