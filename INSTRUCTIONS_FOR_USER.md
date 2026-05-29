# Panduan Setup Google Apps Script (v3.7)

Pembaruan v3.7 mendukung fitur **Menu Recipes**, **Dev Tasks Sync** (mencegah hilangnya data Dev Tracker akibat pergantian domain/browser session), dan **Auto-create Sheet**. Pastikan Anda melakukan langkah-langkah di bawah ini:

### Langkah Update Script:
1.  **Hapus Kode Lama**: Buka editor Apps Script Anda, hapus semua kode yang ada.
2.  **Paste Kode Baru**: Salin isi file `BACKEND_GOOGLE_APPS_SCRIPT.js` v3.7 dari aplikasi ini dan tempel di sana.
3.  **Klik Save** (ikon disket).
4.  **Deploy sebagai Versi Baru (PENTING)**:
5.  Klik tombol biru **Deploy** -> **New Deployment**.
    - Deskripsi: `v3.7 - Dev Tasks Sync & Recipes`.
    - **Execute as**: Me.
    - **Who has access**: **Anyone**.
    - Klik **Deploy**.
6.  **Perbarui URL**: Salin URL baru yang muncul dan masukkan ke menu **Settings** di aplikasi (VITE_GAS_API_URL).

---
**Catatan Penting**: Mengapa data Dev Tracker Anda gampang hilang sebelumnya?
- Karena link preview di Google AI Studio sewaktu-waktu mengalami pergantian domain sandbox otomatis (misal saat container restart atau reload session). Browser menganggap domain baru memiliki `localStorage` yang terpisah, sehingga data Anda tampak "hilang".
- Dengan memperbarui ke script v3.7, data pekerjaan pengembangan di Dev Tracker akan ditarik dan disimpan (sinkronisasi dua arah secara realtime) secara aman langsung di file Google Sheets Anda (pada tab `dev_tasks`). Data Anda dijamin abadi dan tidak akan hilang lagi!
