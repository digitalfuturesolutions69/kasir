# Deploy Duitku ke VPS

Panduan menjalankan Duitku di VPS (`103.175.207.51`) yang **sudah punya banyak
aplikasi lain berjalan di sana**, dikelola lewat user `deploy` + pm2. Script di
folder ini dibuat supaya Duitku dipasang berdampingan tanpa mengganggu
aplikasi yang sudah ada.

## 0. Cek dulu kondisi server (kalau belum)

```bash
curl -O https://raw.githubusercontent.com/digitalfuturesolutions69/kasir/main/deploy/check-server.sh
bash check-server.sh
```

Port `4001` sudah dicek kosong di server ini — kalau ternyata terpakai lain
waktu, cek ulang dengan:

```bash
sudo ss -tlnp | grep ':4001'
```

## 1. Login sebagai user `deploy` (bukan root)

Karena semua aplikasi lain di server ini dijalankan lewat pm2 milik user
`deploy`, Duitku juga dijalankan dengan cara yang sama supaya konsisten dan
muncul bareng di `pm2 list`.

```bash
ssh deploy@103.175.207.51
# atau, kalau sedang login sebagai root:
su - deploy
```

## 2. Download & jalankan deploy.sh

Repo `kasir` sudah **public**, jadi tidak perlu token GitHub lagi:

```bash
curl -O https://raw.githubusercontent.com/digitalfuturesolutions69/kasir/main/deploy/deploy.sh
export APP_PORT=4001
bash deploy.sh
```

Script akan minta password sudo **sekali** di awal (untuk install
git/curl dan, kalau nanti diisi `DOMAIN`, untuk konfigurasi Nginx) — bagian
lain (clone kode, install dependency, build, jalankan pm2) berjalan sebagai
user `deploy` biasa, sama seperti aplikasi lain di server ini.

Setelah selesai, Duitku bisa diakses di:

```
http://103.175.207.51:4001
```

## 3. Kalau nanti sudah punya (sub)domain khusus untuk Duitku

Karena domain-domain lain sudah "memiliki" port 80 di Nginx, Duitku butuh
subdomain sendiri — misalnya `duitku.namadomainanda.com` — supaya Nginx bisa
membedakan berdasarkan nama domain. Arahkan A record subdomain itu ke
`103.175.207.51`, lalu jalankan ulang (masih sebagai user `deploy`):

```bash
export APP_PORT=4001
export DOMAIN=duitku.namadomainanda.com
bash deploy.sh
```

Script menambahkan **site Nginx baru** (`/etc/nginx/sites-available/duitku`)
tanpa mengubah/menghapus site domain lain yang sudah ada.

Setelah itu aktifkan HTTPS gratis (Let's Encrypt) — ini juga hanya menyentuh
domain Duitku:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d duitku.namadomainanda.com
```

## Mengaktifkan fitur "baca foto bukti transaksi otomatis"

Fitur upload foto struk/bukti transfer (yang otomatis mengisi jumlah &
jenis transaksi via AI) butuh `ANTHROPIC_API_KEY`. Tanpa ini, upload foto
tetap tersimpan sebagai lampiran, tapi pengguna harus isi jumlah & jenis
secara manual.

1. Ambil API key di https://console.anthropic.com/
2. Di VPS, edit `.env` aplikasi (dibuat otomatis oleh `deploy.sh` di `~/duitku/.env`):
   ```bash
   nano ~/duitku/.env
   ```
   Tambahkan baris:
   ```
   ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxxxxx"
   ```
3. Restart aplikasi supaya env baru terbaca:
   ```bash
   pm2 restart duitku
   ```

## Yang dilakukan script ini (dan yang TIDAK dilakukan)

Dilakukan:
- Jalan sebagai user `deploy`, konsisten dengan aplikasi lain di server ini
- Cek dulu apakah `APP_PORT` sudah dipakai — berhenti dengan pesan error kalau bentrok
- Pakai Node.js & pm2 yang sudah ada di akun `deploy` (tidak install ulang kalau sudah ada)
- Clone/pull kode ke `~/duitku` (folder terpisah dari app lain)
- Buat `.env` otomatis dengan `JWT_SECRET` acak (kalau belum ada)
- Install dependencies, migrasi database (Prisma + SQLite), build produksi
- Jalankan aplikasi lewat pm2 dengan nama proses `duitku` — proses pm2 aplikasi
  lain tidak disentuh sama sekali
- Nginx **hanya** disentuh kalau `DOMAIN` diisi, dan hanya menambah site baru —
  tidak pernah menghapus/mengubah site domain lain

## Update aplikasi di kemudian hari

Login sebagai `deploy`, lalu jalankan ulang perintah yang sama di langkah 2
(atau 3 kalau sudah pakai domain) — script otomatis `git pull`, install ulang
dependency, migrasi, build, dan restart aplikasi.

## Perintah berguna di VPS

```bash
pm2 status           # cek status semua aplikasi (termasuk yang lain)
pm2 logs duitku       # lihat log Duitku saja
pm2 restart duitku    # restart manual Duitku saja
sudo nginx -t          # cek konfigurasi Nginx masih valid
sudo systemctl reload nginx
```
