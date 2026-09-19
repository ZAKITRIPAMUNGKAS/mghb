# MGHB — Checklist Bawaan & SOP Magang BNI

Aplikasi web interaktif (*Mobile-First Checklist*) untuk pendukung aktivitas pemagangan **Zaki Tri Pamungkas** di **PT Bank Negara Indonesia (Persero) Tbk**, Divisi Sales Strategy & Execution (SSE).

🌐 **Demo / Repositori**: [https://github.com/ZAKITRIPAMUNGKAS/mghb](https://github.com/ZAKITRIPAMUNGKAS/mghb)

---

## 🚀 Fitur Utama

- **Dual-Tab Management**:
  - 🎒 **Packing Jakarta**: 36 item perlengkapan keberangkatan Jakarta & persiapan wisuda UMS (Pakaian Kerja sesuai standar BNI HCS, Dokumen PKM & tiket, Elektronik, Toiletries, Obat-obatan, dan Perlengkapan pribadi).
  - 🏢 **SOP & Magang**: Checklist rutinitas harian MagangHub Kemnaker, tata tertib absensi datang/pulang, kepatuhan grooming BNI, pelaporan logbook mingguan/bulanan, dan arahan mentor SSE.
- **Progress Bar & Real-time Counter**: Indikator visual progres penyelesaian item per tab secara dinamis.
- **LocalStorage Persistence**: Status centang tersimpan otomatis di peramban perangkat, aman saat refresh atau ditutup.
- **Mobile-First & Clean UI**: Desain responsif bertema korporat modern BNI (*Teal & Coral Orange*), ringan tanpa framework/dependency eksternal.
- **One-Click Reset**: Tombol reset untuk membersihkan centangan per kategori dengan dialog konfirmasi.

---

## 💻 Penggunaan Lokal

Cukup buka file `index.html` langsung di browser laptop atau ponsel Anda:

```bash
# Atau jalankan server lokal sederhana
python -m http.server 8080
```

Buka peramban di `http://localhost:8080`.

---

## ⚡ Deployment ke Vercel

Aplikasi ini dapat langsung dideploy ke Vercel tanpa konfigurasi rumit:

1. Pastikan sudah login di Vercel CLI:
   ```bash
   vercel
   ```
2. Atau sambungkan repositori GitHub ini ke dashboard [Vercel](https://vercel.com) (New Project → Import `ZAKITRIPAMUNGKAS/mghb`).

---

*Dikembangkan untuk mendukung operasional program pemagangan BNI & MagangHub Kemnaker RI.*
