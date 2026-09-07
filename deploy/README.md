# Deploy Duitku ke VPS

Duitku **sudah live** di **https://duitku.click**, berjalan lewat pm2
(proses `duitku`) di port **5001** pada VPS (`103.175.207.51`) yang juga
menjalankan beberapa aplikasi lain (`chatbot-namelume`, `uniportal`, dll),
dikelola lewat user `deploy`. Port 4001 sempat jadi pilihan pertama tapi
ternyata sudah dipakai aplikasi lain di server ini, jadi dipindah ke 5001.

Bagian di bawah ini untuk **update** ke commit terbaru. Untuk setup dari nol
di server lain, lihat bagian "Setup dari nol" di paling bawah.

## Update ke commit terbaru

```bash
ssh deploy@103.175.207.51
export APP_PORT=5001
export DOMAIN=duitku.click
bash deploy.sh
```

Script otomatis `git pull`, install ulang dependency, migrasi database, build,
lalu restart pm2 — aplikasi lain di server ini tidak disentuh sama sekali.
Cek hasilnya di **https://duitku.click**.

## Setup dari nol (server lain / port 5001 sudah terpakai)

```bash
curl -O https://raw.githubusercontent.com/digitalfuturesolutions69/kasir/main/deploy/check-server.sh
bash check-server.sh
```

Pilih `APP_PORT` yang masih kosong dari hasil di atas (jangan asumsikan 5001
kosong di server lain), lalu login sebagai user `deploy`:

```bash
ssh deploy@103.175.207.51
# atau, kalau sedang login sebagai root:
su - deploy
```

Repo `kasir` sudah **public**, jadi tidak perlu token GitHub:

```bash
curl -O https://raw.githubusercontent.com/digitalfuturesolutions69/kasir/main/deploy/deploy.sh
export APP_PORT=<port-bebas-hasil-check-server.sh>
bash deploy.sh
```

Script akan minta password sudo **sekali** di awal (untuk install
git/curl dan, kalau nanti diisi `DOMAIN`, untuk konfigurasi Nginx) — bagian
lain (clone kode, install dependency, build, jalankan pm2) berjalan sebagai
user `deploy` biasa, sama seperti aplikasi lain di server ini.

Setelah selesai, aplikasi bisa diakses di `http://<ip-server>:<APP_PORT>`.

Kalau sudah punya (sub)domain khusus untuk Duitku (Nginx butuh subdomain
sendiri karena domain-domain lain sudah "memiliki" port 80), arahkan A
record subdomain itu ke IP server, lalu jalankan ulang dengan `DOMAIN` diisi:

```bash
export APP_PORT=<port-bebas>
export DOMAIN=duitku.namadomainanda.com
bash deploy.sh
```

Script menambahkan **site Nginx baru** (`/etc/nginx/sites-available/duitku`)
tanpa mengubah/menghapus site domain lain yang sudah ada. Setelah itu
aktifkan HTTPS gratis (Let's Encrypt) — ini juga hanya menyentuh domain
Duitku:

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

## Perintah berguna di VPS

```bash
pm2 status           # cek status semua aplikasi (termasuk yang lain)
pm2 logs duitku       # lihat log Duitku saja
pm2 restart duitku    # restart manual Duitku saja
sudo nginx -t          # cek konfigurasi Nginx masih valid
sudo systemctl reload nginx
```
