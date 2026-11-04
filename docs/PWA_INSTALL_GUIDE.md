# PWA_INSTALL_GUIDE.md — Panduan Install di HP (Android & iOS)

Aplikasi **diduitin** dibangun sebagai **Progressive Web App (PWA)**. Artinya aplikasi ini bisa dipasang langsung ke layar utama HP kamu tanpa perlu download dari Google Play Store atau Apple App Store, serta dapat berjalan penuh meski tanpa koneksi internet (offline).

---

## 1. Menghubungkan HP ke Komputer (Localhost XAMPP)

Jika aplikasi ini berjalan di XAMPP komputer kamu, pastikan HP dan laptop/komputer terhubung ke jaringan **Wi-Fi yang sama**.

1. **Cek IP Komputer kamu:**
   * Buka terminal / command prompt di komputer: ketik `ipconfig` (di Windows).
   * Cari bagian `IPv4 Address` pada koneksi Wi-Fi (misalnya: `192.168.1.15`).
2. **Buka dari Browser HP:**
   * Buka browser di HP kamu (Chrome / Brave di Android, Safari di iOS).
   * Ketik alamat: `http://192.168.1.15/apps/diduitin/` (sesuaikan dengan IP komputer kamu).

---

## 2. Cara Install di HP Android (Chrome / Brave / Edge)

1. Buka `diduitin` di browser Chrome HP.
2. Biasanya akan muncul banner kecil di bagian bawah: **"Tambahkan diduitin ke Layar Utama"** atau tombol **"Install"**.
3. Jika banner tidak muncul otomatis:
   * Ketuk ikon **Titik Tiga (⋮)** di pojok kanan atas browser.
   * Pilih menu **"Tambahkan ke Layar Utama"** (Add to Home screen) atau **"Instal Aplikasi"** (Install App).
4. Konfirmasi dengan memilih **Install**.
5. Ikon **diduitin** akan muncul di app drawer dan layar utama HP layaknya aplikasi bawaan.

---

## 3. Cara Install di iPhone / iPad (Safari)

1. Buka `diduitin` di aplikasi **Safari** (PWA di iOS membutuhkan Safari untuk instalasi awal).
2. Ketuk ikon **Bagikan (Share)** berupa kotak dengan panah ke atas di bagian bawah layar.
3. Gulir ke bawah dan ketuk opsi **"Tambahkan ke Layar Utama"** (Add to Home Screen).
4. Beri nama (default: *diduitin*), lalu ketuk **Tambah** (Add) di pojok kanan atas.
5. Aplikasi siap dibuka langsung dari Home Screen iOS tanpa frame/address bar Safari.

---

## 4. Opsi Jangka Panjang: Konversi Menjadi File APK Resmi

Jika suatu saat kamu ingin mendistribusikan aplikasi ini sebagai file `.apk` standalone:
1. Pasang **Capacitor**:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init diduitin com.diduitin.app --web-dir dist
   npx cap add android
   npx cap sync
   ```
2. Buka folder `android/` di Android Studio, lalu pilih **Build > Build APK**.
3. File `.apk` siap diinstal di perangkat Android mana pun tanpa tergantung browser.
