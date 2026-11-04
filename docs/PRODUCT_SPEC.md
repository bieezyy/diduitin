# PRODUCT_SPEC.md — diduitin (Catatan Keuangan Gen-Z)

## 1. Visi Produk
**diduitin** adalah aplikasi pencatatan keuangan pribadi dengan orientasi *local-first*, privasi 100%, cepat (<5 detik per pencatatan), dan mengusung estetika visual *Clean Neo-Brutalism Gen-Z*. Dirancang agar pengguna tidak merasa sedang mengisi formulir akuntansi yang membosankan, melainkan mengontrol arus kas dengan visual tegas dan santai.

## 2. Target Pengguna
- Generasi Z & Milenial muda (Mahasiswa, Freelancer, First Jobber).
- Pengguna yang menginginkan privasi mutlak (anti-cloud tracking, tanpa login pihak ketiga yang ribet).
- Pengguna yang sering transaksi via e-wallet (GoPay, OVO, ShopeePay, Dana) dan rekening bank digital (BCA, Mandiri, SeaBank, Jago).

## 3. Fitur Utama (MVP Scope)

### 3.1. Fast Entry (Pencatatan Kilat)
- Numpad instan di layar atau input field besar.
- Tipe transaksi: Pengeluaran (Expense), Pemasukan (Income), Pindah Dana (Transfer antar dompet).
- Kategori kasual Gen-Z: `#ngopi`, `#healing`, `#fomo`, `#makan`, `#kostan`, `#invest`, `#belanja`, `#subs`, `#darurat`.
- Pemilihan dompet/sumber dana satu ketukan.
- Catatan pendek opsional.

### 3.2. Realiti Check (Dashboard)
- **Net Balance**: Total uang ril di seluruh dompet.
- **Boncos Bar (Monthly Burn Rate)**: Visual meter persentase anggaran bulanan yang terpakai dengan indikator peringatan warna tegas (Aman: Hijau/Neo-Lime, Waspada: Kuning/Cyber-Yellow, Boncos: Merah/Crimson-Coral).
- **Dompet Matrix**: Tampilan kartu dompet (Bank Utama, E-wallet, Uang Fisik).
- **Feed Transaksi**: Riwayat transaksi kronologis dengan filter waktu (Hari ini, Minggu ini, Bulan ini).

### 3.3. Dompet & Kantong (Wallets)
- Tambah/edit/hapus dompet.
- Pilihan ikon & warna unik per dompet.
- Mutasi saldo otomatis saat ada transaksi/transfer.

### 3.4. Keamanan & Backup Data
- **Offline / Local-First**: Semua data tersimpan di IndexedDB browser perangkat pengguna.
- **Export / Backup JSON**: Cadangkan data lokal ke file JSON terenkripsi/terbaca kapan saja.
- **Import JSON**: Pulihkan data di perangkat lain tanpa perlu server cloud.
- **Export CSV**: Untuk pengguna yang ingin audit via spreadsheet (Excel / Google Sheets).

### 3.5. Mobile & PWA Ready
- Installable via browser (Android Chrome, iOS Safari).
- Fullscreen mode tanpa navigasi browser.
- Service Worker caching untuk performa 100% offline.
