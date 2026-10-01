# SS VAPE - POS & Manajemen Inventori Toko

Aplikasi web internal Point of Sale (POS) dan Manajemen Inventori toko vape **SS VAPE**, dibangun menggunakan SvelteKit 2 (Svelte 5 Runes), TypeScript, Tailwind CSS, dan MySQL (XAMPP).

---

## 1. Fitur Utama

- **Autentikasi 2-Tahap (Dual-Factor Internal)**:
  - Step 1: Username & Password
  - Step 2: 6-Digit Security PIN
  - Enkripsi password & PIN menggunakan `bcryptjs`
  - Proteksi server-side session HttpOnly cookies
- **Dashboard Ringkasan Realtime**:
  - Metrik penjualan & pendapatan harian dan bulanan
  - Peringatan stok menipis dan stok habis
  - Grafik tren penjualan 7 hari terakhir
  - Breakdown penjualan per kategori & produk paling laris
- **Manajemen Produk (CRUD & Upload Foto)**:
  - 4 Kategori utama: **DEVICE**, **LIQUID**, **COIL**, **CATRIDGE**
  - Form dinamis mengikuti kategori (Saltnic/Freebase, kadar nikotin mg, volume ml, nilai resistance ohm)
  - Auto-generated SKU unik (`DEV-0001`, `LIQ-0001`, `COI-0001`, `CAT-0001`)
  - Upload foto produk ke `static/uploads/products/` dengan preview langsung
  - Filter kategori, status aktif/nonaktif, pencarian, dan soft-delete aman
- **Manajemen Stok & Mutasi**:
  - Input transaksi barang masuk (`/stock/in`)
  - Log mutasi stok lengkap (`/stock/mutations`) mencatat pergerakan `IN`, `OUT`, dan `ADJUSTMENT`
- **Sistem Kasir POS (Point of Sale)**:
  - Desain 2 kolom desktop-first: Katalog Produk & Keranjang Belanja
  - Filter kategori instan dan pencarian cepat
  - Kontrol kuantitas dengan validasi batas stok tersedia
  - Modal checkout dengan pilihan metode pembayaran (Cash, QRIS, Transfer, Other)
  - Fitur uang pas dan shortcut nominal uang tunai
  - Eksekusi transaksi penjualan secara **Atomic** di MySQL (ACID): simpan sale, simpan snapshot item, kurangi stok, buat mutasi OUT, dan cetak invoice `INV-YYYYMMDD-XXXX`
- **Cetak Invoice Struk**:
  - Halaman invoice di `/transactions/[id]`
  - Dukungan cetak printer thermal (58mm / 80mm) dan kertas A4 via CSS `@media print`
- **Laporan & Analisis Finansial**:
  - Laporan pendapatan, beban modal (HPP), dan estimasi laba kotor (`/reports`)
  - Log mutasi rincian barang terjual per periode (`/reports/sales`)
- **Pengaturan Toko**:
  - Ubah nama toko, alamat, nomor telepon, footer nota, dan batas threshold stok menipis

---

## 2. Kredensial Login Administrator

| Parameter | Nilai |
|---|---|
| **URL Login** | `http://localhost:5173/login` |
| **Username** | `admin_vape` |
| **Password** | `admin0208` |
| **Security PIN** | `020804` |

---

## 3. Prasyarat Sistem

1. **Node.js** v18+ (direkomendasikan v20+)
2. **XAMPP** dengan modul **MySQL / MariaDB** aktif di port 3306

---

## 4. Panduan Instalasi & Menjalankan Aplikasi

### Langkah 1: Clone atau Buka Folder Project
```bash
cd vape-store
```

### Langkah 2: Install Dependency
```bash
npm install
```

### Langkah 3: Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi default untuk XAMPP MySQL:
```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=ss_vape
SESSION_SECRET=ss_vape_super_secret_session_key_2026
```

### Langkah 4: Buat Database & Jalankan Schema Migration
Pastikan MySQL di XAMPP Control Panel sudah berjalan (Status: Running di port 3306).
Jalankan file schema SQL menggunakan command prompt / terminal:

**Windows PowerShell:**
```powershell
Get-Content database/schema.sql | & "C:\xampp\mysql\bin\mysql.exe" -u root
```
*(Atau Anda dapat mengimpor file `database/schema.sql` melalui phpMyAdmin di browser: `http://localhost/phpmyadmin`)*

### Langkah 5: Jalankan Seeding Awal
Eksekusi script seed untuk membuat akun admin `admin_vape`, pengaturan awal toko, dan sampel produk:
```bash
node database/seed.js
```

### Langkah 6: Jalankan Server Development
```bash
npm run dev
```
Aplikasi akan aktif di:
```
http://localhost:5173/
```

---

## 5. Menjalankan Build Produksi

Untuk memverifikasi atau menjalankan bundle produksi:
```bash
npm run build
npm run preview
```

---

## 6. Struktur Direktori Proyek

```
vape-store/
├── database/
│   ├── schema.sql              # Schema InnoDB lengkap dan indeks
│   └── seed.js                 # Seeding admin, settings, dan produk awal
├── static/
│   └── uploads/products/       # Folder upload foto produk fisik
├── src/
│   ├── app.css                 # Tailwind CSS v4 & custom scrollbar/print styling
│   ├── hooks.server.ts         # Middleware autentikasi session & route protection
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/             # Connection pool MySQL2
│   │   │   ├── auth/           # Layanan autentikasi bcrypt & sesi
│   │   │   └── repositories/   # Repositori: user, product, stock, sale, report, settings
│   │   ├── components/
│   │   │   ├── layout/         # Sidebar navigasi & Header bar
│   │   │   └── ui/             # Toast notifications & dialogs
│   │   └── types/              # Deklarasi tipe TypeScript
│   └── routes/
│       ├── (auth)/login/       # Halaman login modern bernuansa vape
│       ├── (auth)/login/pin/   # Halaman verifikasi 6-digit PIN
│       ├── (app)/dashboard/    # Dashboard ringkasan & grafik statistik
│       ├── (app)/products/     # Katalog produk, filter & manajemen
│       ├── (app)/products/new/ # Tambah produk baru per kategori
│       ├── (app)/stock/in/     # Transaksi barang masuk
│       ├── (app)/stock/mutations/ # Riwayat mutasi stok
│       ├── (app)/pos/          # Kasir kasir 2-kolom & checkout atomic
│       ├── (app)/transactions/ # Riwayat transaksi invoice
│       ├── (app)/transactions/[id]/ # Cetak invoice struk thermal & A4
│       ├── (app)/reports/      # Laporan laba kotor & omzet
│       ├── (app)/reports/sales/# Mutasi barang terjual
│       ├── (app)/settings/     # Pengaturan toko SS VAPE
│       └── api/                # API upload foto & transaksi checkout
└── package.json
```
