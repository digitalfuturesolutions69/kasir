# Deploy Duitku ke VPS

Panduan untuk menjalankan Duitku di VPS Ubuntu/Debian (`103.175.207.51`) yang
**sudah punya aplikasi lain berjalan di sana**. Script di folder ini dibuat
supaya tidak mengganggu aplikasi yang sudah ada — Duitku dipasang di direktori,
port, dan (kalau perlu) proses pm2 miliknya sendiri.

## 0. Cek dulu kondisi server (wajib, sebelum deploy)

Upload dan jalankan `check-server.sh` — ini **read-only**, tidak mengubah
apa pun, hanya menampilkan info:

```bash
scp deploy/check-server.sh root@103.175.207.51:~/
ssh root@103.175.207.51
sudo bash check-server.sh
```

Perhatikan bagian **"Ports currently listening"** — catat port mana yang
sudah dipakai aplikasi lain, lalu pilih port lain yang masih kosong untuk
Duitku (default script: `3001`, ganti kalau ternyata sudah dipakai).

## 1. Siapkan token GitHub (karena repo ini private)

1. Buka https://github.com/settings/tokens?type=beta
2. **Generate new token** → beri nama bebas (mis. "duitku-deploy")
3. **Repository access** → pilih **Only select repositories** → pilih `kasir`
4. **Permissions** → **Repository permissions** → **Contents** → **Read-only**
5. Generate, lalu salin tokennya (hanya tampil sekali)

## 2. Upload deploy.sh ke VPS

Dari komputer Anda:

```bash
scp deploy/deploy.sh root@103.175.207.51:~/
```

## 3. Jalankan di VPS

```bash
ssh root@103.175.207.51
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
export APP_PORT=3001   # sesuaikan dari hasil check-server.sh
sudo -E bash deploy.sh
```

Karena belum ada domain khusus untuk Duitku, dan port 80 di server ini sudah
dipakai aplikasi lain, langkah di atas **tidak menyentuh Nginx sama sekali**.
Duitku akan bisa diakses langsung di:

```
http://103.175.207.51:3001
```

(ganti `3001` sesuai `APP_PORT` yang Anda pakai)

## 4. Kalau nanti sudah punya (sub)domain khusus untuk Duitku

Karena port 80 sudah "dimiliki" aplikasi lain, Duitku butuh domain/subdomain
sendiri (bukan akses lewat IP polos) supaya Nginx bisa membedakan berdasarkan
nama domain — misalnya `duitku.namadomainanda.com`. Arahkan A record subdomain
itu ke `103.175.207.51`, lalu jalankan ulang:

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
export APP_PORT=3001
export DOMAIN=duitku.namadomainanda.com
sudo -E bash deploy.sh
```

Script akan menambahkan **site Nginx baru** khusus untuk domain tersebut
(`/etc/nginx/sites-available/duitku`) tanpa mengubah/menghapus site yang
sudah ada untuk aplikasi lain.

Setelah itu aktifkan HTTPS gratis (Let's Encrypt) — ini juga hanya menyentuh
domain Duitku, bukan domain aplikasi lain:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d duitku.namadomainanda.com
```

## Yang dilakukan script ini (dan yang TIDAK dilakukan)

Dilakukan:
- Cek dulu apakah `APP_PORT` sudah dipakai — berhenti dengan pesan error kalau bentrok
- Kalau Node.js versi berbeda sudah terpasang secara global, **tidak** menimpanya —
  Duitku akan pakai Node.js sendiri lewat nvm supaya tidak mengganggu aplikasi lain
- Clone/pull kode ke direktori terpisah `/opt/duitku`
- Buat `.env` otomatis dengan `JWT_SECRET` acak (kalau belum ada)
- Install dependencies, migrasi database (Prisma + SQLite), build produksi
- Jalankan aplikasi lewat pm2 dengan nama proses `duitku` (proses pm2 aplikasi
  lain, kalau ada, tidak disentuh)
- Nginx **hanya** disentuh kalau `DOMAIN` diisi, dan hanya menambah site baru —
  tidak pernah menghapus/mengubah `sites-enabled/default` atau site lain

## Update aplikasi di kemudian hari

Jalankan ulang perintah yang sama di langkah 3 (atau 4 kalau sudah pakai
domain) — script otomatis `git pull`, install ulang dependency, migrasi,
build, dan restart aplikasi.

## Perintah berguna di VPS

```bash
pm2 status           # cek status semua aplikasi (termasuk yang lain)
pm2 logs duitku       # lihat log Duitku saja
pm2 restart duitku    # restart manual Duitku saja
sudo nginx -t          # cek konfigurasi Nginx masih valid
sudo systemctl reload nginx
```
