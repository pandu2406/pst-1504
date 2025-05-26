# pst-1504

Aplikasi antrean digital untuk layanan PST BPS Kabupaten Buton Selatan. Proyek ini dibangun menggunakan Next.js (App Router), Prisma ORM, dan Bun sebagai package manager & runtime. Mendukung integrasi WhatsApp Bot untuk notifikasi antrean.

---

## Fitur Utama
- Formulir pengunjung untuk mengambil nomor antrean
- Tracking status antrean secara real-time
- Dashboard admin untuk monitoring dan manajemen antrean
- Integrasi WhatsApp Bot (dengan API service terpisah)
- Mode gelap/terang (dark/light mode)

---

## Persyaratan Sistem
- Node.js v18+ (disarankan Bun v1+)
- Bun (https://bun.sh/)
- PostgreSQL (atau database lain yang didukung Prisma)
- Git

---

## 1. Setup & Instalasi untuk Development

### 1.1. Clone Repository
```sh
git clone <repo-ini>
cd pst-1504
```

### 1.2. Install Dependency
```sh
bun install
```

### 1.3. Konfigurasi Environment Variable
Buat file `.env` di root project. Contoh:

```
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
NEXT_PUBLIC_WA_ADMIN_KEY="contoh_admin_key"
```

- `DATABASE_URL`: URL koneksi database PostgreSQL.
- `NEXT_PUBLIC_WA_ADMIN_KEY`: Kunci admin untuk integrasi WhatsApp Bot.

### 1.4. Setup Database
```sh
bunx prisma migrate dev --name init
bunx prisma generate
```

Untuk mengisi data awal (opsional):
```sh
bun run prisma/seed.ts
```

### 1.5. Menjalankan Project
```sh
bun dev
```
Akses di `http://localhost:3000`

---

## 2. Integrasi WhatsApp Bot (WA Bot)

Aplikasi ini **tidak** menyediakan API WhatsApp Bot secara langsung. Anda harus menjalankan service API WhatsApp Bot sendiri.

- Gunakan repo: [bot-wa-pst](https://github.com/Jstfire/bot-wa-pst)
- Ikuti petunjuk instalasi pada repo tersebut.
- Pastikan API service berjalan dan dapat diakses oleh aplikasi ini.
- Set variabel yang diperlukan pada `.env` (lihat dokumentasi bot-wa-pst untuk detail endpoint dan key).

---

## 3. Deploy/Install di Server (Production)

### 3.1. Clone & Install
```sh
git clone <repo-ini>
cd pst-1504
```

### 3.2. Konfigurasi Environment
- Buat file `.env` sesuai kebutuhan production (lihat contoh di atas).
- Pastikan database production sudah tersedia dan dapat diakses.

### 3.3. Migrasi & Generate Prisma
```sh
bunx prisma migrate deploy
bunx prisma generate
```

### 3.4. Build & Start
```sh
bun run build
bun start
```

### 3.5. (Opsional) Setup PM2/Service Manager
Agar aplikasi tetap berjalan di background:
```sh
bun add pm2 -g
pm2 start "bun start" --name pst-1504
pm2 save
```

---

## 4. Struktur Direktori Penting
- `src/app/` : Source code utama (API, halaman, komponen)
- `prisma/` : Skema dan migrasi database
- `components/` : Komponen UI dan utilitas
- `.env` : Konfigurasi environment

---

## 5. Catatan Penting
- Untuk fitur WhatsApp Bot, Anda **WAJIB** menjalankan API service sendiri (lihat bagian 2).
- Pastikan semua variabel environment sudah diatur dengan benar.
- Untuk pengembangan, gunakan Bun agar dependency dan script berjalan optimal.

---

## 6. Kontribusi
Pull request dan issue sangat diterima! Silakan fork repo ini dan ajukan perubahan jika ingin berkontribusi.

---

## 7. Lisensi
Lisensi mengikuti ketentuan pada repository ini.

---

## 8. Kontak & Bantuan
Untuk pertanyaan atau bantuan, silakan hubungi admin proyek atau buka issue di GitHub.
