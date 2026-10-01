Saya ingin kamu membangun aplikasi web POS + manajemen inventori untuk toko vape bernama:

SS VAPE

PENTING:
- Project SvelteKit SUDAH dibuat sebelumnya.
- Gunakan project yang sekarang berada di folder: `vape-store`
- JANGAN membuat project SvelteKit baru.
- JANGAN mengganti framework.
- Bekerja langsung di project yang sudah ada.
- Gunakan TypeScript.
- Gunakan MySQL dari XAMPP sebagai database.
- Pastikan aplikasi benar-benar dapat dijalankan secara lokal.
- Jangan hanya membuat mockup/static UI. Buat sistem yang benar-benar terhubung ke database dan dapat melakukan CRUD/transaksi.

==================================================
1. TECH STACK
==================================================

Gunakan:

- SvelteKit
- TypeScript
- Tailwind CSS
- shadcn/ui, tetapi gunakan pendekatan NON-COMPONENT / styling utility Tailwind secara langsung jika memungkinkan.
- MySQL/MariaDB melalui XAMPP
- Server-side API menggunakan SvelteKit server routes
- Gunakan service/repository layer agar kode terstruktur.
- Gunakan ORM/query builder yang stabil jika sudah tersedia di project. Jika belum ada, gunakan driver MySQL yang sesuai dan aman.
- Gunakan prepared statements / parameterized queries untuk mencegah SQL Injection.
- Gunakan form validation.
- Gunakan responsive design.

Jangan menggunakan framework frontend lain seperti React, Vue, Next.js, Nuxt, Laravel, atau PHP.

==================================================
2. TUJUAN APLIKASI
==================================================

Aplikasi ini adalah sistem internal pribadi untuk:

1. Mengelola pemasukan/stok barang.
2. Mengelola produk vape.
3. Menyimpan foto setiap produk.
4. Melakukan penjualan melalui sistem POS/kasir.
5. Mengurangi stok otomatis ketika terjadi penjualan.
6. Membuat dan mencetak invoice.
7. Melihat riwayat transaksi.
8. Melihat pendapatan.
9. Melihat mutasi penjualan berdasarkan hari, bulan, dan tahun.
10. Melakukan filtering laporan.
11. Menyediakan dashboard sederhana untuk pemilik toko.

Nama toko di seluruh aplikasi:

SS VAPE

==================================================
3. LOGIN DAN KEAMANAN
==================================================

Aplikasi TIDAK memiliki fitur register.

Hanya ada satu akun admin pribadi.

Username:
admin_vape

Password:
admin0208

Setelah username dan password benar, pengguna HARUS memasukkan PIN:

020804

Jadi proses login:

STEP 1:
Username + Password

STEP 2:
PIN

STEP 3:
Masuk ke Dashboard

Jangan membuat halaman Register.

Jangan menyediakan tombol "Create Account", "Sign Up", atau sejenisnya.

PENTING:
Walaupun credential awal diberikan secara eksplisit untuk aplikasi pribadi ini, jangan hard-code password/PIN di frontend atau expose di JavaScript client.

Simpan credential secara aman di server/environment/database sesuai implementasi yang digunakan.

Password harus disimpan dalam bentuk hash jika disimpan di database.

PIN juga jangan dikirim atau disimpan secara plaintext di sisi client.

Session authentication harus dilakukan server-side.

Jika belum ada sistem authentication di project, implementasikan sistem authentication sederhana yang aman untuk satu akun admin.

Tambahkan:
- Session/cookie authentication.
- Protected routes.
- Redirect user yang belum login ke `/login`.
- Logout.
- Session expiration.
- Jangan izinkan user mengakses dashboard/API admin tanpa session valid.

==================================================
4. REFERENSI DESAIN LOGIN
==================================================

Gunakan halaman berikut sebagai REFERENSI VISUAL untuk desain halaman login:

https://dribbble.com/shots/21919371-SVG-Login-Animation

Saya ingin mengambil inspirasi dari:
- layout
- nuansa visual
- animasi
- bentuk form
- visual interaction
- transisi
- spacing
- modern appearance

Jangan menyalin kode/aset proprietary dari halaman tersebut.

Buat versi original yang sesuai dengan identitas:

SS VAPE

Login harus terlihat modern, premium, clean, dan cocok untuk toko vape.

Gunakan animasi ringan seperti:
- floating elements
- subtle SVG animation
- fade/slide transition
- input focus animation
- button interaction

Tetapi jangan membuat animasi terlalu berat sehingga mengganggu performa.

==================================================
5. STRUKTUR PRODUK
==================================================

Produk memiliki 4 kategori utama:

1. DEVICE
2. LIQUID
3. COIL
4. CATRIDGE

Buat sistem produk yang fleksibel tetapi field yang muncul harus mengikuti kategori.

==================================================
6. INPUT PRODUK / BARANG MASUK
==================================================

Buat halaman:

/products

dan halaman:

/products/new

Untuk menambahkan produk.

Field umum:

- Kategori
- Nama produk
- Foto produk
- Harga modal
- Harga jual
- Stok
- Satuan
- Deskripsi
- Status aktif/nonaktif

Foto produk WAJIB bisa di-upload untuk SEMUA kategori:

- Device
- Liquid
- Coil
- Catridge

Foto harus bisa:
- preview sebelum disimpan
- diganti
- dihapus
- ditampilkan pada daftar produk
- ditampilkan pada detail produk

Jika menggunakan local storage untuk development, struktur file harus tetap dibuat agar nantinya mudah dipindahkan ke object storage/server.

==================================================
7. FIELD KHUSUS LIQUID
==================================================

Jika kategori = LIQUID, tampilkan:

- Nama liquid
- Tipe liquid:
  - Saltnic
  - Freebase
- Kadar nikotin (mg)
- Volume (ml)
- Harga modal
- Harga jual
- Stok
- Foto
- Deskripsi

Contoh:

Kategori:
Liquid

Nama:
Nasty Juice

Tipe:
Saltnic

Nikotin:
25 mg

Volume:
30 ml

Stok:
10

==================================================
8. FIELD KHUSUS COIL
==================================================

Jika kategori = COIL:

- Nama coil
- Harga modal
- Harga jual
- Stok
- Foto
- Deskripsi

Contoh:

Kategori:
Coil

Nama:
Voopoo PnP Coil

Stok:
20

==================================================
9. FIELD KHUSUS DEVICE
==================================================

Jika kategori = DEVICE:

- Nama device
- Harga modal
- Harga jual
- Stok
- Foto
- Deskripsi

Contoh:

Kategori:
Device

Nama:
Vaporesso XROS 4

Stok:
5

==================================================
10. FIELD KHUSUS CATRIDGE
==================================================

Jika kategori = CATRIDGE:

- Nama catridge
- Resistance / Ohm
- Harga modal
- Harga jual
- Stok
- Foto
- Deskripsi

Contoh:

Kategori:
Catridge

Nama:
XROS 4 Cartridge

Ohm:
0.8Ω

Stok:
10

==================================================
11. PRODUCT MANAGEMENT
==================================================

Buat halaman daftar produk dengan:

- Search
- Filter kategori
- Filter status
- Sorting
- Pagination
- Product image
- Product name
- Category
- Detail spesifikasi
- Harga modal
- Harga jual
- Stok
- Status stok

Berikan indikator:

- Stok tersedia
- Stok menipis
- Stok habis

Contoh threshold stok menipis:

<= 5

Namun buat threshold ini mudah diubah.

Setiap produk mempunyai:

- Detail
- Edit
- Delete/nonaktifkan

Sebelum delete, tampilkan confirmation dialog.

Jika produk sudah pernah digunakan dalam transaksi, lebih baik gunakan soft delete / inactive daripada hard delete agar histori transaksi tidak rusak.

==================================================
12. STOCK / PEMASUKAN BARANG
==================================================

Jangan hanya menyimpan angka stok akhir.

Buat juga sistem mutasi stok.

Ketika barang masuk, simpan:

- Produk
- Jumlah masuk
- Harga modal saat masuk
- Tanggal
- Catatan
- User/admin

Contoh:

Liquid A
+10 pcs
17 September 2026

Stok produk otomatis bertambah.

Buat halaman:

/stock/in

untuk transaksi barang masuk.

Buat juga:

/stock/mutations

untuk melihat seluruh mutasi stok.

Jenis mutasi minimal:

IN
OUT
ADJUSTMENT

==================================================
13. POS / KASIR
==================================================

Buat halaman:

/pos

Ini adalah sistem kasir utama.

Layout:

LEFT SIDE:
Daftar produk.

RIGHT SIDE:
Keranjang / cart.

Produk dapat dicari berdasarkan:
- Nama
- Kategori

Tambahkan filter kategori:
- Semua
- Device
- Liquid
- Coil
- Catridge

Klik produk:
→ masuk ke cart.

Di cart terdapat:

- Foto
- Nama
- Harga
- Quantity
- Subtotal
- tombol +/-
- tombol remove

Sistem harus mencegah quantity melebihi stok.

==================================================
14. CHECKOUT
==================================================

Pada checkout tampilkan:

Subtotal
Diskon
Grand Total
Uang Dibayar
Kembalian

Payment method:

- Cash
- QRIS
- Transfer
- Other

Untuk tahap awal, sistem pembayaran cukup dicatat sebagai metode pembayaran tanpa integrasi payment gateway.

Ketika transaksi berhasil:

1. Simpan transaksi.
2. Simpan detail transaksi.
3. Kurangi stok produk.
4. Buat mutasi stok OUT.
5. Generate nomor invoice.
6. Tampilkan halaman sukses.
7. Berikan pilihan:
   - Cetak invoice
   - Transaksi baru

Gunakan database transaction agar transaksi penjualan dan perubahan stok bersifat atomic.

Jika salah satu proses gagal:
→ rollback seluruh transaksi.

==================================================
15. NOMOR INVOICE
==================================================

Buat nomor invoice unik.

Contoh:

INV-20260917-0001

Format:

INV-YYYYMMDD-XXXX

Nomor harus unique di database.

==================================================
16. INVOICE
==================================================

Buat halaman:

/transactions/[id]

dan print invoice.

Invoice harus berisi:

SS VAPE

Nomor Invoice
Tanggal
Kasir

Daftar produk:
- Nama
- Qty
- Harga
- Subtotal

Subtotal
Diskon
Total
Pembayaran
Kembalian
Metode pembayaran

Footer:

Terima kasih telah berbelanja di SS VAPE

Buat desain invoice yang cocok untuk:

- print A4
- thermal printer 58mm/80mm jika memungkinkan

Gunakan CSS print khusus.

Saat print:
- sidebar hilang
- navbar hilang
- tombol hilang
- hanya invoice yang dicetak.

==================================================
17. RIWAYAT TRANSAKSI
==================================================

Buat:

/transactions

Tampilkan:

- Invoice
- Tanggal
- Total
- Payment method
- Jumlah item
- Kasir
- Status

Tambahkan search berdasarkan invoice.

Filter:

- Hari ini
- Kemarin
- 7 hari terakhir
- Bulan ini
- Tahun ini
- Custom date range

Klik transaksi:
→ detail invoice.

==================================================
18. DASHBOARD
==================================================

Buat dashboard:

/

atau:

/dashboard

Dashboard menampilkan:

Card:

- Penjualan Hari Ini
- Pendapatan Hari Ini
- Penjualan Bulan Ini
- Pendapatan Bulan Ini
- Total Produk
- Produk Stok Menipis
- Produk Habis

Tambahkan grafik:

1. Penjualan per hari
2. Pendapatan per hari
3. Produk paling sering terjual
4. Penjualan berdasarkan kategori

Gunakan chart library yang ringan dan kompatibel dengan SvelteKit jika diperlukan.

Dashboard harus mengambil data nyata dari database.

Jangan gunakan data dummy setelah database selesai dibuat.

==================================================
19. LAPORAN PENDAPATAN
==================================================

Buat:

/reports

Sistem laporan dapat difilter berdasarkan:

- Hari
- Minggu
- Bulan
- Tahun
- Custom date range

Tampilkan:

Total transaksi
Total item terjual
Total pendapatan
Total modal
Estimasi laba kotor

Perhitungan:

Laba kotor =
Total penjualan - total modal barang terjual

Tambahkan breakdown berdasarkan kategori:

Device
Liquid
Coil
Catridge

Tampilkan juga produk yang paling banyak terjual berdasarkan periode yang dipilih.

==================================================
20. MUTASI PENJUALAN
==================================================

Buat halaman:

/reports/sales

User dapat memilih:

Hari ini
Bulan ini
Tahun ini
Custom range

Kemudian tampilkan semua barang yang terjual.

Contoh:

17 September 2026

Liquid A - 3
Liquid B - 2
Coil C - 5
Device D - 1

Tampilkan:

- Produk
- Kategori
- Quantity
- Harga jual
- Total
- Tanggal transaksi
- Invoice

==================================================
21. DATABASE
==================================================

Gunakan database MySQL dari XAMPP.

Nama database:

ss_vape

Buat schema/database migration yang jelas.

Minimal tabel:

users

products

stock_mutations

sales

sale_items

sessions

Jika diperlukan tambahkan:

product_images

settings

audit_logs

==================================================
22. PRODUCTS TABLE
==================================================

products minimal memiliki:

id
sku
category
name
description
photo
purchase_price
selling_price
stock
unit
status
created_at
updated_at

category:

device
liquid
coil
catridge

Untuk field spesifik, gunakan desain database yang masuk akal.

Boleh menggunakan kolom nullable seperti:

liquid_type
nicotine_mg
volume_ml
resistance_ohm

Field tersebut hanya digunakan untuk kategori yang relevan.

Pastikan database mudah dikembangkan nantinya.

==================================================
23. STOCK MUTATIONS TABLE
==================================================

Minimal:

id
product_id
type
quantity
purchase_price
reference_type
reference_id
note
created_by
created_at

type:

IN
OUT
ADJUSTMENT

==================================================
24. SALES TABLE
==================================================

Minimal:

id
invoice_number
subtotal
discount
grand_total
paid_amount
change_amount
payment_method
status
created_by
created_at

==================================================
25. SALE ITEMS TABLE
==================================================

Minimal:

id
sale_id
product_id
product_name
quantity
unit_price
purchase_price
subtotal

PENTING:

Simpan `product_name`, `unit_price`, dan `purchase_price` pada sale_items sebagai snapshot saat transaksi.

Tujuannya agar histori transaksi tidak berubah jika nama atau harga produk diubah di kemudian hari.

==================================================
26. SKU
==================================================

Setiap produk harus memiliki SKU unik otomatis.

Contoh:

DEV-0001
LIQ-0001
COI-0001
CAT-0001

SKU otomatis berdasarkan kategori.

==================================================
27. UI / UX
==================================================

Gunakan desain modern dan clean.

Brand:

SS VAPE

Gunakan:
- Tailwind
- shadcn/ui styling
- card
- dialog
- dropdown
- tabs
- input
- select
- table
- badge
- toast
- button
- sidebar

Tampilan desktop harus menjadi prioritas karena sistem ini digunakan untuk kasir.

Tetapi tetap responsive untuk tablet/mobile.

Gunakan sidebar:

Dashboard
Produk
  - Semua Produk
  - Tambah Produk

Stok
  - Barang Masuk
  - Mutasi Stok

POS / Kasir

Transaksi

Laporan
  - Penjualan
  - Pendapatan

Settings

Logout

==================================================
28. DASHBOARD SIDEBAR
==================================================

Sidebar harus menunjukkan:

SS VAPE

[icon] Dashboard
[icon] Produk
[icon] Stok
[icon] POS
[icon] Transaksi
[icon] Laporan

Di bagian bawah:

Admin
admin_vape

Logout

Gunakan icon library yang kompatibel dengan Svelte.

==================================================
29. SEARCH & FILTER
==================================================

Semua tabel utama harus mempunyai:

Search
Filter
Sorting
Pagination

Jangan mengambil semua data sekaligus jika jumlah data besar.

Gunakan server-side pagination untuk data transaksi dan produk jika memungkinkan.

==================================================
30. VALIDATION
==================================================

Validasi:

Nama produk wajib.
Kategori wajib.
Harga wajib >= 0.
Stok tidak boleh negatif.
Liquid:
- tipe wajib
- nicotine mg >= 0
- volume ml > 0

Catridge:
- resistance/ohm harus valid.

Penjualan:
- quantity > 0
- quantity tidak boleh melebihi stok.

Pastikan validasi dilakukan:
- frontend
- server

Jangan hanya mengandalkan validasi frontend.

==================================================
31. ERROR HANDLING
==================================================

Berikan error message yang jelas.

Contoh:

"Stok tidak mencukupi."

"Produk tidak ditemukan."

"Transaksi gagal disimpan."

"Username atau password salah."

"PIN salah."

"Harga jual harus lebih besar atau sama dengan 0."

Jangan tampilkan stack trace kepada user.

Error detail hanya untuk server log.

==================================================
32. LOADING STATE
==================================================

Setiap operasi asynchronous harus memiliki:

- Loading state
- Disabled state
- Success feedback
- Error feedback

Contoh:

Simpan Produk
→ Loading
→ Berhasil
→ Toast "Produk berhasil ditambahkan."

==================================================
33. FOTO PRODUK
==================================================

Upload foto harus memiliki:

- preview
- validasi tipe file
- validasi ukuran
- nama file aman
- unique filename

Minimal dukung:

JPG
JPEG
PNG
WEBP

Jangan menyimpan file dengan nama asli jika berpotensi menyebabkan collision.

Jika memungkinkan, gunakan struktur:

uploads/products/

dan database hanya menyimpan path/URL foto.

==================================================
34. RESPONSIVE POS
==================================================

POS harus nyaman digunakan untuk kasir.

Desktop:

------------------------------------------------
Sidebar | Product Grid | Cart
------------------------------------------------

Product card:

[Foto]
Nama
Kategori
Harga
Stok

Click:
→ Add to cart

Cart:

Product
Qty
Price
Subtotal

Bottom:

Subtotal
Discount
TOTAL

[Bayar]

==================================================
35. DATABASE CONFIG
==================================================

Gunakan environment variables.

Contoh:

DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=ss_vape

Jangan hard-code credential database.

Buat `.env.example`.

Jangan commit `.env`.

==================================================
36. PROJECT STRUCTURE
==================================================

Usahakan struktur seperti:

src/
  lib/
    server/
      db/
      services/
      repositories/
      auth/
    components/
    types/

  routes/
    login/
    dashboard/
    products/
    stock/
    pos/
    transactions/
    reports/

Gunakan SvelteKit conventions dengan benar.

Jangan membuat satu file besar yang menangani seluruh sistem.

Pisahkan:

UI
API
Business logic
Database access

==================================================
37. API
==================================================

Gunakan SvelteKit server routes untuk operasi database.

Contoh endpoint:

/api/products
/api/products/[id]
/api/stock/in
/api/stock/mutations
/api/pos/products
/api/sales
/api/sales/[id]
/api/reports/sales
/api/reports/revenue

Pastikan semua endpoint admin membutuhkan authentication.

Gunakan HTTP methods dengan benar:

GET
POST
PUT/PATCH
DELETE

==================================================
38. BUSINESS LOGIC
==================================================

Jangan menaruh business logic kompleks langsung di component Svelte.

Contoh:

sales.service.ts

harus menangani:

- validasi produk
- cek stok
- hitung subtotal
- hitung total
- insert sale
- insert sale_items
- update stock
- insert stock mutation
- commit/rollback transaction

Gunakan database transaction.

==================================================
39. AUDIT LOG
==================================================

Jika memungkinkan tambahkan audit log.

Catat:

- login
- logout
- tambah produk
- edit produk
- barang masuk
- penjualan
- perubahan stok
- penghapusan/nonaktif produk

==================================================
40. SETTINGS
==================================================

Buat halaman Settings sederhana untuk data toko:

Nama toko:
SS VAPE

Alamat:
bisa dikosongkan dulu

Nomor telepon:
bisa dikosongkan dulu

Footer invoice:
Terima kasih telah berbelanja di SS VAPE

Jangan terlalu banyak membuat settings sekarang.

==================================================
41. SEED DATA
==================================================

Buat seed data untuk testing.

Contoh beberapa produk:

DEVICE:
- Vaporesso XROS 4

LIQUID:
- Contoh Liquid Saltnic 30ml 25mg
- Contoh Liquid Freebase 60ml 3mg

COIL:
- Voopoo PnP Coil

CATRIDGE:
- XROS Cartridge 0.8 Ohm

Gunakan foto placeholder hanya untuk development jika diperlukan.

Buat seed yang mudah dihapus.

==================================================
42. LOGIN FLOW
==================================================

Flow:

/login

Tampilkan:

SS VAPE

Username
[________________]

Password
[________________]

[Continue]

Jika benar:

/login/pin

Tampilkan:

Enter Security PIN

[ _ _ _ _ _ _ ]

[Verify]

Jika PIN benar:

/dashboard

Jika salah:

"PIN yang dimasukkan salah."

Tambahkan tombol logout di dashboard.

==================================================
43. LOGIN ANIMATION
==================================================

Gunakan referensi visual dari:

https://dribbble.com/shots/21919371-SVG-Login-Animation

Buat versi original.

Nuansa:

modern
dark/premium
clean
smooth
vape store aesthetic

Tetapi jangan menggunakan desain yang terlalu ramai.

Login harus terasa profesional seperti dashboard inventory modern.

==================================================
44. DARK MODE
==================================================

Sediakan dark mode.

Default boleh dark mode karena brand vape.

Pastikan:
- text readable
- contrast baik
- table readable
- modal readable
- input readable
- invoice tetap cocok untuk print putih.

==================================================
45. ACCESSIBILITY
==================================================

Pastikan:

- input memiliki label
- button memiliki accessible name
- keyboard navigation
- focus state
- contrast cukup
- jangan menggunakan warna sebagai satu-satunya indikator status.

==================================================
46. PERFORMANCE
==================================================

Hindari:

- query database berulang
- loading semua transaksi
- loading semua produk jika tidak diperlukan
- giant component
- giant API route

Gunakan:
- pagination
- indexing
- efficient queries
- database transaction
- lazy loading jika diperlukan

Tambahkan index pada:

products.sku
products.category
products.name
sales.invoice_number
sales.created_at
sale_items.sale_id
sale_items.product_id
stock_mutations.product_id
stock_mutations.created_at

==================================================
47. SECURITY
==================================================

Pastikan:

- SQL injection protection
- XSS protection
- CSRF consideration
- secure cookies
- HttpOnly cookies
- SameSite cookies
- server-side authorization
- password hashing
- input validation
- upload validation
- jangan expose password/PIN
- jangan expose database credentials

==================================================
48. PRINT
==================================================

Buat print stylesheet khusus.

Invoice harus dapat:

- Print
- Save as PDF

Pastikan saat print hanya invoice yang muncul.

==================================================
49. SEBELUM CODING
==================================================

Sebelum mulai mengubah file:

1. Inspect project `vape-store`.
2. Cek package.json.
3. Cek struktur folder.
4. Cek apakah Tailwind sudah terinstall.
5. Cek apakah shadcn/ui sudah tersedia.
6. Cek konfigurasi SvelteKit.
7. Jangan menghapus konfigurasi yang sudah ada tanpa alasan.
8. Gunakan dependency yang sudah ada jika sesuai.
9. Hanya install dependency yang memang diperlukan.

Setelah memahami project, baru implementasikan.

==================================================
50. IMPLEMENTATION ORDER
==================================================

Kerjakan secara bertahap:

PHASE 1
Project inspection + database setup

PHASE 2
Database schema + migrations

PHASE 3
Authentication

PHASE 4
Main layout + sidebar + dashboard

PHASE 5
Product CRUD

PHASE 6
Photo upload

PHASE 7
Stock management

PHASE 8
POS

PHASE 9
Sales transaction

PHASE 10
Invoice + print

PHASE 11
Reports

PHASE 12
Polishing UI/UX

PHASE 13
Testing

==================================================
51. TESTING
==================================================

Setelah implementasi:

- jalankan aplikasi
- pastikan build berhasil
- pastikan TypeScript tidak error
- pastikan tidak ada Svelte compile error
- test login
- test PIN
- test logout
- test tambah device
- test tambah liquid
- test tambah coil
- test tambah catridge
- test upload foto
- test edit produk
- test stok masuk
- test POS
- test checkout
- test stok berkurang
- test invoice
- test print
- test transaksi
- test filter laporan

Jika menemukan error, perbaiki.

Jangan berhenti hanya karena UI sudah selesai.

==================================================
52. SQL DATABASE
==================================================

Jika database `ss_vape` belum ada, buat SQL initialization/migration yang dapat dijalankan di MySQL XAMPP.

Sediakan file:

database/schema.sql

atau sistem migration yang sesuai.

Pastikan foreign key benar.

Gunakan InnoDB.

==================================================
53. README
==================================================

Update README agar menjelaskan:

1. Cara install dependency.
2. Cara membuat database MySQL.
3. Cara menjalankan schema/migration.
4. Cara konfigurasi `.env`.
5. Cara menjalankan development server.
6. Cara menjalankan seed.
7. Credential login development.
8. Struktur fitur aplikasi.

==================================================
54. HASIL AKHIR YANG SAYA INGINKAN
==================================================

Saya ingin hasil akhirnya berupa aplikasi SS VAPE yang benar-benar usable.

Flow utama:

LOGIN
↓
PIN
↓
DASHBOARD
↓
PRODUCT MANAGEMENT
↓
STOCK IN
↓
POS
↓
CHECKOUT
↓
INVOICE
↓
STOCK OTOMATIS BERKURANG
↓
TRANSACTION HISTORY
↓
SALES / REVENUE REPORT

Jangan membuat fitur yang belum saya minta seperti:
- marketplace
- customer registration
- customer account
- multi-store
- online payment gateway
- supplier management
- loyalty program

Buat fondasi sistem yang clean dan mudah saya kembangkan sendiri nanti.

==================================================
55. IMPORTANT DEVELOPMENT RULE
==================================================

Jika ada bagian yang belum jelas, gunakan implementasi paling sederhana, maintainable, dan mudah dikembangkan.

Jangan over-engineering.

Jangan membuat fitur tambahan yang tidak diperlukan.

Utamakan:

CORRECTNESS
SECURITY
DATABASE INTEGRITY
MAINTAINABILITY
GOOD UX

daripada sekadar membuat banyak fitur.

Mulai dengan memeriksa project `vape-store` yang sudah ada, kemudian implementasikan sistem SS VAPE secara bertahap sampai dapat dijalankan.