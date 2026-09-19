# MGHB — Checklist Bawaan & SOP Magang BNI

Aplikasi web interaktif (*Mobile-First Checklist*) untuk pendukung aktivitas dinas dan pemagangan **Zaki Tri Pamungkas** di **PT Bank Negara Indonesia (Persero) Tbk**, Divisi Sales Strategy & Execution (SSE).

🌐 **Repositori**: [https://github.com/ZAKITRIPAMUNGKAS/mghb](https://github.com/ZAKITRIPAMUNGKAS/mghb)

---

## 🚀 Fitur Utama

- **100% Local-First & Privacy**: Seluruh status tersimpan di peramban perangkat (`localStorage`), tanpa server database, aman dari kebocoran data dan dapat digunakan secara *offline*.
- **Penyelarasan Antar-Perangkat (Laptop ⇄ Smartphone)**:
  - 📷 **Scan QR Code**: Cukup buka modal di laptop dan pindai QR dengan kamera smartphone.
  - 🔗 **Salin Link Sinkronisasi**: Mengirimkan tautan dengan hash payload kompak ke WhatsApp pribadi. Saat dibuka di HP, centangan langsung termuat dan otomatis tersimpan permanen di HP.
- **Cadangan Berkas (Backup / Restore)**:
  - **Ekspor JSON**: Mengunduh berkas `.json` cadangan sewaktu-waktu.
  - **Impor JSON**: Memulihkan data dari berkas cadangan dengan 1 klik.
- **Dual-Workspace Checklist**:
  - 🎒 **Bawaan & Wisuda**: 36 item perlengkapan keberangkatan Jakarta & persiapan wisuda UMS (Pakaian Kerja sesuai standar BNI HCS, Dokumen PKM & tiket, Elektronik, Toiletries, Obat-obatan, dan Perlengkapan esensial).
  - 🏢 **SOP & MagangHub**: Checklist rutinitas harian MagangHub Kemnaker, absensi datang/pulang, kepatuhan grooming BNI, penugasan mentor divisi SSE, dan pelaporan logbook mingguan/bulanan.
- **Filter & Quick Search**:
  - Filter cepat status: `Semua`, `Belum`, atau `Selesai`.
  - Instant Search dengan pintasan keyboard `/` dan tombol `Esc`.
- **Ekspor Cepat**: Tombol **"Salin Sisa Item"** untuk menempelkan daftar perlengkapan yang belum siap ke catatan/chat.
- **Mode Tampilan**: Mendukung **Light & Dark Mode** dengan palet warna korporat modern (Teal `#005E6A` & Orange `#e05315`).

---

## 💻 Cara Menjalankan

Cukup buka berkas `index.html` langsung di peramban (Chrome / Safari / Edge).

Atau jalankan server lokal:
```bash
python -m http.server 8080
```

---

## ⚡ Deployment ke Vercel

Aplikasi ini siap dideploy langsung:
1. Masuk ke dashboard [Vercel](https://vercel.com/new).
2. Import repositori **`ZAKITRIPAMUNGKAS/mghb`**.
3. Klik **Deploy**.

---

*Dikembangkan untuk mendukung efisiensi & operasional program pemagangan BNI & MagangHub Kemnaker RI.*
