# MASTER PROMPT: PENGEMBANGAN APLIKASI MOBILE POS & INVENTORI "SS VAPE" (NATIVESCRIPT + TYPESCRIPT)

> **Instruksi Penggunaan**: Berikan prompt ini kepada AI coding assistant atau gunakan sebagai acuan spesifikasi teknis untuk mengimplementasikan aplikasi mobile di folder `vapestoreapp`.

---

## 1. DESKRIPSI & TUJUAN PROYEK

Saya ingin membangun aplikasi mobile POS (Kasir) & Manajemen Inventori Toko Vape untuk:
**"SS VAPE"**

Aplikasi ini dibangun menggunakan **NativeScript Core dengan TypeScript** di dalam folder yang sudah disiapkan: `vapestoreapp`. Aplikasi ini bertindak sebagai klien mobile native untuk sistem web yang sudah ada di folder `vape-store`, terhubung secara real-time melalui REST API menggunakan tunnel URL:
👉 **`https://crablike-barrel-rejoin.ngrok-free.dev/`**

### Tujuan Utama:
1. Memudahkan staf kasir dan pemilik toko mengakses seluruh fitur POS, katalog produk, stok, laporan, dan riwayat transaksi langsung dari **Handphone** maupun **Tablet**.
2. Menyinkronkan seluruh data (produk, gambar produk, stok, transaksi, pengguna kasir/admin) secara real-time dengan server web `vape-store`.
3. Tampilan antarmuka modern terinspirasi dari **Tailwind CSS + shadcn/ui (non-component approach)** dengan palet Dark Mode (Slate / Zinc / Emerald) yang elegan, bersih, dan ergonomis untuk kasir.
4. Desain **responsif & adaptif** untuk 2 tipe perangkat:
   - **Handphone (Smartphone)**: Single-column scroll, bottom navigation bar, expandable/slide-up cart modal.
   - **Tablet**: Master-detail split screen layout (katalog di sisi kiri, keranjang & pembayaran di sisi kanan secara simultan).

---

## 2. SPESIFIKASI TEKNOLOGI & LINGKUNGAN

- **Framework**: NativeScript Core (`@nativescript/core` v8/v9)
- **Bahasa**: TypeScript (`.ts`)
- **Struktur Halaman**: NativeScript XML Layouts (`.xml`), ViewModel (`.ts` dengan `Observable`), dan Styling (`.css`)
- **Desain & Styling**: Tailwind CSS / Utility-first CSS dengan tema Shadcn UI Dark (`slate-950`, `slate-900`, `slate-800`, `emerald-500`, dsb.)
- **Device Support**: Android & iOS (Optimal untuk Smartphone & Tablet)
- **Komunikasi Backend**: NativeScript `Http` API / `fetch`
- **Base Backend API URL**: `https://crablike-barrel-rejoin.ngrok-free.dev`
- **Header Khusus Ngrok**: Setiap request HTTP **WAJIB** menyertakan header:
  ```http
  ngrok-skip-browser-warning: 69420
  ```
  *(Hal ini sangat penting agar ngrok tidak mengembalikan halaman HTML peringatan browser gratisan dan langsung mengembalikan payload JSON).*

---

## 3. IDENTITAS & ATURAN BISNIS (SS VAPE)

1. **Nama Toko**: **SS VAPE**
2. **Kategori Produk**:
   - `device` (Mod, Pod Kit, AIO, Disposable)
   - `liquid` (Saltnic, Freebase)
   - `coil` (Occ Coil, Prebuilt Coil)
   - `catridge` (Empty Pod / Cartridge dengan resistansi ohm)
   - `other` (Kapas, Baterai, Lanyard, Aksesoris)
3. **Format SKU Otomatis**:
   - Device: `DEV-XXXX`
   - Liquid: `LIQ-XXXX`
   - Coil: `COIL-XXXX`
   - Cartridge: `CAT-XXXX`
   - Other: `OTH-XXXX`
4. **Keamanan & Login 2-Tahap**:
   - **Step 1**: Username (`admin_vape` / kasir) + Password
   - **Step 2**: 6-Digit Numeric PIN (Default: `020804`)
   - Role-based:
     - `admin`: Akses penuh (Dashboard, Produk, Stok, POS, Transaksi, Laporan Keuangan, Pengaturan).
     - `kasir`: Akses POS, Riwayat Transaksi, dan Mutasi Penjualan (diblokir dari pengaturan sensitif dan master produk modal).
5. **Metode Pembayaran POS**:
   - `Cash` (Uang Tunai dengan tombol cepat pecahan: Pas, 50.000, 100.000, 200.000, dll.)
   - `QRIS` (Tampilkan kode QR atau input referensi)
   - `Transfer` (BCA / Mandiri)
   - `Other`

---

## 4. INTEGRASI API DENGAN BACKEND (VAPE-STORE)

Aplikasi mobile berkomunikasi dengan backend SvelteKit `vape-store`. Endpoint-endpoint berikut harus dipanggil (dan dipastikan tersedia pada server `vape-store`):

### 4.1. Endpoint Autentikasi
- `POST /api/auth/login`
  - Body: `{ username, password }`
  - Response: `{ success: true, requirePin: true, tempToken: "..." }`
- `POST /api/auth/pin`
  - Body: `{ tempToken, pin }`
  - Response: `{ success: true, token: "...", user: { id, username, name, role } }`
- `GET /api/auth/me`
  - Header: `Authorization: Bearer <token>` atau session cookie
  - Response: Data user aktif.
- `POST /api/auth/logout`

### 4.2. Endpoint Master Produk
- `GET /api/products?search=&category=&status=&stockStatus=&page=&limit=`
  - Mengambil daftar produk paginasi, pencarian nama/SKU, dan filter kategori.
- `GET /api/products/:id`
  - Detail produk lengkap beserta riwayat mutasi / stok.
- `POST /api/products` (Multipart Form-Data / JSON)
  - Tambah produk baru (SKU otomatis, kategori, harga beli, harga jual, stok awal, tipe liquid/cartridge).
- `PUT /api/products/:id`
  - Edit produk yang ada.
- `DELETE /api/products/:id`
  - Hapus produk (soft-delete jika sudah ada riwayat penjualan, hard-delete jika belum).
- `POST /api/upload` (Multipart)
  - Unggah foto produk ke server `static/uploads/products/` dan mengembalikan public URL (misal: `/uploads/products/prod_xxx.jpg`).

### 4.3. Endpoint POS (Kasir)
- `GET /api/pos/products`
  - Mengambil seluruh produk aktif yang siap dijual di kasir (stok > 0).
- `POST /api/pos/checkout`
  - Body:
    ```json
    {
      "items": [
        { "product_id": 1, "product_name": "Oxva Xlim Pro", "quantity": 1, "unit_price": 320000, "purchase_price": 250000, "subtotal": 320000 }
      ],
      "discount": 0,
      "paidAmount": 350000,
      "paymentMethod": "Cash"
    }
    ```
  - Response: `{ success: true, saleId: 123, invoiceNumber: "INV-20261002-001" }`

### 4.4. Endpoint Transaksi & Invoice
- `GET /api/sales?search=&startDate=&endDate=&paymentMethod=&page=&limit=`
  - Daftar riwayat transaksi penjualan.
- `GET /api/sales/:id`
  - Detail lengkap invoice dan daftar item belanja.
- `DELETE /api/sales/:id`
  - Batalkan / void transaksi (mengembalikan stok produk ke database).

### 4.5. Endpoint Stok & Mutasi
- `POST /api/stock/in`
  - Input stok masuk / koreksi barang: `{ productId, quantity, purchasePrice, note }`.
- `GET /api/stock/mutations?search=&type=&startDate=&endDate=&page=`
  - Riwayat mutasi stok (IN, OUT, ADJUSTMENT).
- `GET /api/stock/alerts`
  - Daftar produk dengan stok menipis (di bawah batas ambang `low_stock_threshold`).

### 4.6. Endpoint Dashboard & Laporan
- `GET /api/dashboard/stats`
  - Statistik ringkasan: Penjualan hari ini, pendapatan hari ini, pendapatan bulan ini, total produk, stok menipis.
- `GET /api/reports/summary?period=today|month|year|custom`
  - Ringkasan omset kotor, modal (HPP), dan laba bersih.

### 4.7. Endpoint Pengaturan
- `GET /api/settings`
  - Mengambil data profil toko (`store_name`, `address`, `phone`, `invoice_footer`, `low_stock_threshold`).
- `PUT /api/settings`
  - Simpan perubahan pengaturan toko.

---

## 5. TAMPILAN & PENGALAMAN PENGGUNA (SHADCN UI / DARK MODE THEME)

Terapkan tema modern dengan gaya **shadcn/ui Dark Mode** menggunakan utility class:

- **Background Utama**: `#020617` (Slate 950) / `#0f172a` (Slate 900)
- **Card / Surface**: `#0f172a` (Slate 900) dengan border halus `#1e293b` (Slate 800) dan border radius besar (`rounded-2xl`).
- **Warna Aksen / Brand**:
  - Hijau Emerald (`#10b981` / `#059669`) untuk tombol aksi utama, kasir checkout, status aktif, dan indikator laba.
  - Biru Cyan (`#06b6d4` / `#0ea5e9`) untuk device vape & SKU tag.
  - Ungu Indigo (`#8b5cf6`) untuk liquid Saltnic.
  - Oranye Amber (`#f59e0b`) untuk liquid Freebase & peringatan stok menipis.
  - Rose Merah (`#f43f5e`) untuk stok habis, tombol hapus/void, dan error.
- **Tipografi**:
  - Warna teks utama: `#f8fafc` (Slate 50), teks sekunder: `#94a3b8` (Slate 400).
  - Label badge kecil dengan uppercase tracking (`text-xs font-bold uppercase tracking-wider`).
- **Micro-Interactions**:
  - Efek tap / ripple halus pada kartu produk dan tombol kalkulator.
  - Dialog pop-up konfirmasi pembayaran dengan ringkasan kembalian yang besar dan jelas.
  - Loading skeleton / shimmer saat memuat data produk dan gambar.

---

## 6. STRATEGI RESPONSIF: SMARTPHONE VS TABLET

Gunakan pendeteksian tipe perangkat melalui NativeScript Core:
```typescript
import { Device, Screen } from '@nativescript/core';

export const isTablet = Device.deviceType === 'Tablet' || Screen.mainScreen.widthDIPs >= 600;
```

### 6.1. Pengalaman Smartphone (Handphone)
1. **Navigasi Bawah (Bottom Navigation Bar)**:
   - 🏷️ **Kasir (POS)**: Tampilan katalog produk single/2 kolom kartu.
   - 📦 **Produk**: Daftar inventori dengan search bar & filter kategori floating pills.
   - 🧾 **Transaksi**: List riwayat transaksi dengan badge status.
   - 📊 **Laporan**: Kartu ringkasan omset & filter harian/bulanan.
   - ⚙️ **Menu/Akun**: Profil user, stok masuk, alerts, pengaturan toko, dan tombol Logout.
2. **Alur Kasir di Handphone**:
   - Katalog produk memenuhi layar.
   - Di bagian bawah terdapat **Floating Cart Bar**: Menampilkan jumlah item dan total harga (`Rp XXX.XXX`).
   - Mengetuk cart bar akan membuka **Modal / Bottom Sheet Keranjang** untuk mengubah kuantiti, diskon, memilih metode pembayaran, dan menyelesaikan transaksi.

### 6.2. Pengalaman Tablet (Split-Screen Master-Detail)
1. **Layout Kasir Tablet**:
   - **Sisi Kiri (65% Layar)**: Grid katalog produk 3 hingga 4 kolom dengan gambar produk jelas, filter kategori horizontal, dan kolom pencarian instan / scan barcode.
   - **Sisi Kanan (35% Layar)**: Panel Keranjang Aktif permanen.
     - Daftar item dalam keranjang (dengan tombol `+`, `-`, dan hapus item).
     - Rincian Subtotal, Diskon, dan Grand Total.
     - Numeric Keypad cepat untuk memasukkan nominal uang tunai kasir.
     - Tombol cepat uang pas / pecahan (`Rp 50.000`, `Rp 100.000`, dll.).
     - Tombol "Bayar Sekarang" yang langsung memproses checkout tanpa perlu berpindah layar.
2. **Layout Manajemen Produk & Stok Tablet**:
   - Master list di sisi kiri dan form input detail / preview foto di sisi kanan.

---

## 7. STRUKTUR FOLDER & ARSITEKTUR KODE (VAPESTOREAPP)

Susun kode di folder `vapestoreapp/app/` dengan arsitektur yang rapi dan modular:

```text
vapestoreapp/
├── app/
│   ├── app.ts                  # Inisialisasi aplikasi & konfigurasi tema
│   ├── app.css                 # Master Tailwind / Shadcn UI utility classes
│   ├── app-root.xml            # Frame utama / Root navigasi
│   ├── models/                 # TypeScript Interfaces (mirror dari web vape-store)
│   │   ├── product.model.ts
│   │   ├── sale.model.ts
│   │   ├── stock.model.ts
│   │   ├── user.model.ts
│   │   └── settings.model.ts
│   ├── services/               # HTTP client & business logic
│   │   ├── api.service.ts      # Base HTTP client (URL ngrok, header ngrok, token auth)
│   │   ├── auth.service.ts     # Login 2 langkah (username/pwd + PIN) & session storage
│   │   ├── product.service.ts  # Fetch katalog, add, edit, delete, upload image
│   │   ├── pos.service.ts      # Keranjang belanja, kalkulasi, & checkout
│   │   ├── sale.service.ts     # Riwayat penjualan & struk transaksi
│   │   ├── stock.service.ts    # Stok masuk & mutasi
│   │   └── report.service.ts   # Statistik dashboard & laporan pendapatan
│   ├── utils/
│   │   ├── formatters.ts       # Format mata uang Rupiah (Rp), tanggal lokal WIB
│   │   ├── device.helper.ts    # Deteksi tablet vs handphone
│   │   └── dialogs.helper.ts   # Custom toast / modal alert bergaya shadcn
│   └── views/                  # XML views & ViewModels
│       ├── auth/
│       │   ├── login-page.xml & .ts      # Step 1: Username & Password
│       │   └── pin-page.xml & .ts        # Step 2: 6-Digit PIN Keypad
│       ├── dashboard/
│       │   └── dashboard-page.xml & .ts  # Kartu metrik & ringkasan
│       ├── pos/
│       │   ├── pos-phone-page.xml & .ts  # Layout kasir smartphone
│       │   ├── pos-tablet-page.xml & .ts # Layout kasir split-screen tablet
│       │   └── cart-modal-page.xml & .ts # Modal pembayaran & kembalian
│       ├── products/
│       │   ├── product-list-page.xml & .ts
│       │   ├── product-form-page.xml & .ts # Tambah/Edit Produk + Ambil Foto Kamera/Galeri
│       │   └── product-detail-page.xml & .ts
│       ├── stock/
│       │   ├── stock-in-page.xml & .ts     # Form input stok masuk
│       │   ├── stock-mutations-page.xml & .ts
│       │   └── stock-alerts-page.xml & .ts
│       ├── transactions/
│       │   ├── transaction-list-page.xml & .ts
│       │   └── receipt-page.xml & .ts      # Tampilan struk nota belanja
│       ├── reports/
│       │   └── report-page.xml & .ts
│       └── settings/
│           └── settings-page.xml & .ts
```

---

## 8. RINCIAN IMPLEMENTASI KUNCI

### 8.1. Base API Service dengan Penanganan Ngrok
```typescript
// app/services/api.service.ts
import { Http, HttpRequestOptions, ApplicationSettings } from '@nativescript/core';

export class ApiService {
  public static BASE_URL = 'https://crablike-barrel-rejoin.ngrok-free.dev';

  public static async request<T>(options: {
    endpoint: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    isFormData?: boolean;
  }): Promise<T> {
    const token = ApplicationSettings.getString('auth_token', '');
    const url = `${this.BASE_URL}${options.endpoint}`;

    const headers: Record<string, string> = {
      // Wajib untuk bypass landing page warning dari ngrok free
      'ngrok-skip-browser-warning': '69420',
      'Accept': 'application/json'
    };

    if (!options.isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['Cookie'] = `ss_vape_session=${token}`;
    }

    const requestOptions: HttpRequestOptions = {
      url,
      method: options.method || 'GET',
      headers,
      content: options.body ? (options.isFormData ? options.body : JSON.stringify(options.body)) : undefined,
      timeout: 15000
    };

    const response = await Http.request(requestOptions);
    const statusCode = response.statusCode;

    if (statusCode === 401) {
      // Sesi berakhir / butuh login ulang
      ApplicationSettings.remove('auth_token');
      // Navigate to login...
      throw new Error('Sesi telah berakhir. Silakan login kembali.');
    }

    const result = response.content?.toJSON();
    if (statusCode < 200 || statusCode >= 300) {
      throw new Error(result?.error || result?.message || `Request gagal dengan status ${statusCode}`);
    }

    return result as T;
  }

  public static getImageUrl(path: string | null | undefined): string {
    if (!path) return 'res://placeholder_vape';
    if (path.startsWith('http')) return path;
    return `${this.BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
  }
}
```

### 8.2. Input Foto Produk (Kamera & Galeri)
Gunakan plugin media NativeScript (seperti `@nativescript/imagepicker` atau `@nativescript/camera`) untuk memungkinkan staf toko mengambil foto fisik produk langsung di toko lalu mengunggahnya ke endpoint `/api/upload` server web.

### 8.3. Format Struk Transaksi / Invoice Kasir
Pada halaman selesai transaksi (`receipt-page`), tampilkan struk kasir profesional dengan font monospace yang berisi:
- Logo / Nama Toko: `SS VAPE`
- Alamat & Nomor Telepon (dari `Settings`)
- Nomor Invoice: `INV-YYYYMMDD-XXX`
- Tanggal & Nama Kasir
- Tabel Item: Nama Produk, Qty, Harga Satuan, Subtotal
- Diskon, Grand Total, Nominal Bayar, Kembalian
- Footer Note (misal: "Barang yang sudah dibeli tidak dapat ditukar/dikembalikan. Terima kasih!").
- Tombol aksi: **Cetak Struk (Bluetooth Thermal Printer)** dan **Bagikan Struk (WhatsApp / PDF image)**.

---

## 9. CHECKLIST VALIDASI SEBELUM RILIS

- [ ] Aplikasi sukses login dengan akun `admin_vape` + PIN `020804` melalui endpoint web ngrok.
- [ ] Header `ngrok-skip-browser-warning` berfungsi sehingga data JSON diterima tanpa terblokir.
- [ ] Foto produk yang diunggah di web muncul di aplikasi mobile, dan foto yang difoto via handphone berhasil tersimpan di server web.
- [ ] Transaksi di POS kasir mobile langsung memotong stok di database MySQL web secara akurat.
- [ ] Pengurangan stok dan penambahan stok masuk (Stock In) tercatat di tabel `stock_mutations`.
- [ ] Layout otomatis berganti ke split-screen ketika dijalankan pada tablet / iPad / layar lebar.
- [ ] Validasi form produk: kategori Liquid wajib memilih tipe (Saltnic/Freebase) & mg nikotin; Cartridge wajib mengisi nilai Ohm.

---

**Silakan jalankan implementasi tahap demi tahap di dalam direktori `vapestoreapp/` sesuai panduan di atas!**
