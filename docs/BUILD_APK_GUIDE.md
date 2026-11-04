# CARA BUILD APK ANDROID (diduitin)

Proyek Android native untuk **diduitin** telah berhasil digenerate menggunakan **Capacitor** di dalam folder:
📂 `C:\xampp\htdocs\apps\diduitin\android\`

---

## Opsi 1: Build APK via Android Studio (Paling Mudah & Standar)

1. **Install Android Studio** di PC/laptop (jika belum terpasang). Download dari situs resmi: [developer.android.com/studio](https://developer.android.com/studio).
2. Di terminal folder proyek, jalankan:
   ```bash
   npm run cap:open
   ```
   *(Atau buka Android Studio secara manual > pilih **Open** > arahkan ke folder `C:\xampp\htdocs\apps\diduitin\android`).*
3. Tunggu proses sinkronisasi Gradle pertama kali selesai.
4. Untuk menghasilkan file `.apk`:
   * Klik menu atas: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
   * Setelah selesai, klik notifikasi popup **"locate"** di pojok kanan bawah.
   * File `app-debug.apk` siap ditransfer dan diinstal langsung ke HP Android apa pun!

---

## Opsi 2: Build APK via Command Line (Tanpa Buka UI Android Studio)

Jika di laptop kamu sudah terpasang **Java JDK** dan **Android SDK Command-line Tools**:
1. Buka PowerShell / Terminal:
   ```bash
   cd C:\xampp\htdocs\apps\diduitin\android
   .\gradlew assembleDebug
   ```
2. File output `.apk` akan otomatis muncul di:
   📂 `C:\xampp\htdocs\apps\diduitin\android\app\build\outputs\apk\debug\app-debug.apk`

---

## Opsi 3: Install Langsung Tanpa Perlu Build APK (PWA Mode)

Ingat bahwa kamu **bisa langsung memasang aplikasi ini di HP detik ini juga tanpa perlu Android Studio**:
1. Hubungkan HP ke Wi-Fi yang sama dengan laptop.
2. Buka browser HP: `http://10.10.3.146/apps/diduitin/`
3. Pilih **"Tambahkan ke Layar Utama" / "Instal Aplikasi"**.
4. Aplikasi akan langsung terpasang di HP secara native, fullscreen, dan 100% offline.
