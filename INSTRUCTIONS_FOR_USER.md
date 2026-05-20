# Panduan Setup Google Apps Script (v3.6)

Pembaruan v3.6 mendukung fitur **Menu Recipes** dan **Auto-create Sheet**. Pastikan Anda melakukan langkah-langkah di bawah ini:

### Langkah Update Script:
1.  **Hapus Kode Lama**: Buka editor Apps Script Anda, hapus semua kode yang ada.
2.  **Paste Kode Baru**: Salin isi file `BACKEND_GOOGLE_APPS_SCRIPT.js` v3.6 dari aplikasi ini dan tempel di sana.
3.  **Klik Save** (ikon disket).
4.  **Deploy sebagai Versi Baru (PENTING)**:
    - Klik tombol biru **Deploy** -> **New Deployment**.
    - Deskripsi: `v3.6 - Recipes Support`.
    - **Execute as**: Me.
    - **Who has access**: **Anyone**.
    - Klik **Deploy**.
5.  **Perbarui URL**: Salin URL baru yang muncul dan masukkan ke menu **Settings** di aplikasi (VITE_GAS_API_URL).

---
**Catatan**: Fitur Resep Menu memerlukan script v3.6. Jika Anda melihat error "Sheet tidak ditemukan", pastikan Anda telah mengupdate script Anda ke versi terbaru (v3.6).
