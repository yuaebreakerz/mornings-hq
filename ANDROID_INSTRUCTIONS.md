# Panduan Install & Notifikasi Android/Tablet - Mornings HQ

Dokumen ini menjelaskan dua cara untuk menginstal aplikasi **Mornings HQ** di Handphone maupun Tablet Android dapur Anda, serta cara mengaktifkan system bunyi ringing & pemberitahuan otomatis.

---

## ✭ Metode 1: Instalasi Instan (PWA - Direkomendasikan!)
Aplikasi ini sudah diprogram sebagai **Progressive Web App (PWA)** dengan kinerja maksimal yang setara dengan aplikasi native `.apk`. Metode ini adalah metode termudah dan tercepat karena tidak membutuhkan proses kompilasi kode pemrograman.

### Langkah-Langkah:
1. **Buka Web**: Jalankan browser **Google Chrome** di handphone atau tablet Android Anda.
2. **Kunjungi Alamat Portal**: Masuk ke tautan aplikasi Mornings HQ Anda.
3. **Menu Browser**: Tekan tombol menu titik tiga **(⋮)** di pojok kanan atas browser Google Chrome.
4. **Instal**: Pilih menu **"Tambahkan ke Layar Utama"** atau **"Instal Aplikasi"**.
5. **Selesai**: Ikon logo Mornings HQ akan otomatis terpasang di beranda / app drawer Android Anda. 
   - *Saat dibuka, aplikasi tidak memiliki url-bar browser (tampilan penuh layaknya aplikasi native) dan berjalan sangat ringan.*

---

## Metode 2: Kompilasi APK Mandiri (Capacitor Native)
Source code project ini telah dilengkapi konfigurasi **Capacitor** dari Ionic, yang menjembatani aplikasi web React + Vite menjadi file native Android `.apk`. 

### Prasyarat Laptop/Komputer:
- Node.js terinstal.
- Android Studio & Android SDK terinstal.

### Langkah Build APK:
1. **Build Web Assets**:
   ```bash
   npm run build
   ```
2. **Tambahkan Platform Android**:
   ```bash
   npx cap add android
   ```
3. **Sinkronisasi Asset**:
   ```bash
   npx cap sync
   ```
4. **Buka dan Build melalui Android Studio**:
   ```bash
   npx cap open android
   ```
   - Perintah di atas akan membuka Android Studio dengan project native Android yang sudah digenerasi otomatis.
   - Di Android Studio, klik **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   - File APK hasil kompilasi siap dipasang langsung di tablet diletakkan di folder output Android Studio.

---

## Pusat Notifikasi Ganda
Sistem notifikasi pada aplikasi ini dibagi menjadi dua kategori:

1. **Notifikasi Sistem (Status Check)**:
   - Digunakan untuk menguji keandalan transmisi suara perangkat, status sinkronisasi, dan diagnostik data.
   - Menghasilkan nada tri-tone bersuara halus.
2. **Notifikasi Orderan Masuk**:
   - Berjalan otomatis di latar belakang dengan melakukan pencarian order baru (polling) dari Google Sheets secara realtime setiap 35 detik.
   - Ketika ada produk / pesanan baru dideteksi, sistem berdering keras dengan ringtone alarm *"Ting Ting Tong!"* yang menarik perhatian, memunculkan jendela notifikasi push banner di layar handphone / tablet (baik kondisi tertutup maupun terbuka) agar pesanan segera dapat diproses di dapur ritual pagi.

### Cara Mengaktifkan Nada Dering:
1. Ketuk ikon **Lonceng Bell (Kanan Atas)** di portal panel.
2. Di bagian **Izin Push Notifications**, ketuk tombol **"Izinkan Notifikasi Di Sini"**.
3. Ketuk kedua tombol uji coba **"Tes Sistem"** dan **"Tes Orderan Baru"** untuk memastikan sistem suara berbunyi pada handphone/tablet yang Anda uji.
