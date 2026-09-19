# MGHB — Checklist Bawaan & Asisten Magang BNI

Aplikasi web produktivitas (*Mobile-First Productivity App*) yang dirancang sebagai asisten harian pemagangan **Zaki Tri Pamungkas** di **PT Bank Negara Indonesia (Persero) Tbk**, Divisi Sales Strategy & Execution (SSE), Menara BNI Pejompongan.

🌐 **Repositori GitHub**: [https://github.com/ZAKITRIPAMUNGKAS/mghb](https://github.com/ZAKITRIPAMUNGKAS/mghb)

---

## 🚀 5 Modul Utama Asisten Magang

### 1. 🎒 Bawaan & Wisuda UMS (38 Item)
* Checklist perlengkapan keberangkatan dinas Jakarta & wisuda sarjana UMS (24–27 September 2026).
* Standar pakaian formal BNI HCS: Kemeja putih hari pertama, Senin–Selasa Business Formal, Rabu–Kamis Batik lengan panjang (tidak boleh dilipat), Jumat Business Casual lapis blazer berkerah, celana bahan gelap (jeans dilarang keras).
* Dokumen PKM-0026-PKM-II-2026, tiket KA, pakta integritas, elektronik, toiletries grooming, obat, dan esensial.

### 2. 📋 SOP Kerja & Kepatuhan BNI (17 Item)
* Alur operasional harian: Presensi GPS MagangHub Kemnaker, absensi internal DigiHC BNI, penggunaan TPP (Lanyard/ID Card), dan briefing penugasan mentor Pak Guruh Sri Handoyo.
* Evaluasi berkala: Prosedur izin wisuda ("Tidak Hadir Dengan Keterangan"), surat dokter jika sakit >1 hari, approval logbook mingguan, dan rekap bulanan.
* Tata tertib perbankan: Kerahasiaan data nasabah (*Banking Secrecy* / NDA), larangan konten medsos pribadi di area kerja, penolakan gratifikasi, dan disiplin K3 Menara BNI.

### 3. ✍️ Daily Logbook Formulator & Quick Scratchpad
* **Catatan Cepat Harian & Rapat (Scratchpad)**: Notepads auto-save real-time untuk mencatat arahan mentor, data sales, atau kendala lapangan saat jam kerja. Dilengkapi tombol satu-klik *"Pindahkan ke Formulator"*.
* Masukkan poin-poin kasar aktivitas pekerjaan Anda dalam bahasa santai/cepat.
* Sistem otomatis memformulasikannya menjadi kalimat formal perbankan terstruktur:
  1. **Uraian Pekerjaan / Aktivitas** (kosakata korporat profesional).
  2. **Hasil / Capaian Output** (terukur dan berorientasi hasil).
  3. **Kendala & Solusi** (opsional / terstandardisasi).
* Tombol **"Salin Semua ke Clipboard"** untuk langsung ditempelkan ke portal MagangHub Kemnaker.
* **Arsip Riwayat Logbook Lokal**: Menyimpan catatan hari-hari sebelumnya di memori browser.
* **Ekspor Ringkasan Bulanan (Executive Summary)**: Mengagregasi seluruh riwayat logbook harian menjadi draf laporan bulanan resmi berstandar Kemnaker & BNI, siap diekspor ke Microsoft Word atau diunduh sebagai berkas `.md`.

### 4. 💬 Asisten SSE & Panduan Menara BNI
* **Banner Anti-Lupa Pulang & Ritme Kantor**: Indikator real-time jam operasional kantor Menara BNI (07.30 - 17.00 WIB) dengan alert otomatis pada pukul 16.30 - 17.30 WIB untuk presensi pulang di MagangHub & DigiHC serta submit logbook harian.
* **Panduan Gedung Menara BNI & Survival Pejompongan**:
  - Akses gerbang gedung, lift zoning (Low Zone vs High Zone), etika TPP (ID Card).
  - Transit & mobilitas: KRL Palmerah (1.8 km / ojol 5 mnt), MRT Bendungan Hilir, TransJakarta Koridor 9 Halte Slipi Petamburan, Mikrotrans JakLingko.
  - Spot makan siang ramah kantong: Kantin karyawan basement Menara BNI & sentra kuliner Jalan Penjernihan / Pasar Benhil.
* **Template Chat WhatsApp Mentor**:
  - *Permohonan Izin Wisuda UMS (Jumat 25 Sep)* (disertai lampiran izin resmi).
  - *Pemberitahuan Izin Sakit & Surat Dokter*.
  - *Konfirmasi Selesai Penugasan Harian*.
  - *Reminder Approval Logbook Mingguan ke Mentor*.
* **Kamus Kilat Istilah Perbankan & Divisi SSE**:
  - Glosarium istilah perbankan: CASA, DPK, Sales Pipeline, NPL, Achievement Rate, Data Cleansing, Cross-Selling.
  - Dilengkapi kolom **💡 Tips Peran Zaki (IT/Data)**: Cara mengaplikasikan analisis data, Excel, dan pembersihan data pada setiap istilah bisnis tersebut.

### 5. 📰 Kabar & Warta MagangHub (Auto-Sync News Feed)
* **Agregasi Otomatis Berita Kredibel**: Menarik pembaruan warta terkini secara otomatis dari sumber-sumber terpercaya:
  - **Kementerian Ketenagakerjaan RI (Kemnaker)**: Rilis resmi, pengumuman batch, dan regulasi.
  - **ANTARA News**: Kebijakan pemagangan nasional & sertifikasi BNSP.
  - **Kompas.com, Detikcom, & CNBC Indonesia**: Jadwal seleksi, aturan hak & uang saku peserta, serta liputan program BNI.
* **Fitur Live Refresh & Offline Cache**:
  - Mengambil feed dinamis secara berkala tanpa membebani browser.
  - Tetap dapat dibaca meski sedang offline berkat arsip lokal terverifikasi.
  - Filter kategori cepat: *Semua*, *Pengumuman*, *Regulasi & Uang Saku*, *Sertifikasi BNSP*, *Kemnaker & BNI*.
  - Tautan langsung ke portal resmi: MagangHub, SIAPkerja, Kemnaker News, dan BNI.

---

## 🔒 100% Local-First & Sinkronisasi Lintas Perangkat

* **Privat & Bebas Biaya**: Seluruh data centang dan arsip logbook tersimpan secara lokal di browser (`localStorage`), tanpa database eksternal dan aman dari kebocoran data.
* **Buka di HP via QR Code**: Pindai kode QR dari layar laptop untuk menyelaraskan status centang ke smartphone secara instan.
* **Cadangan Berkas (Backup / Restore)**: Unduh atau pulihkan berkas data `.json` kapan saja.
* **Filter Cepat & Search**: Filter status `Semua`, `Belum`, `Selesai` serta pintasan keyboard `/` untuk pencarian cepat.

---

*Dikembangkan khusus untuk mendukung efisiensi, kepatuhan, dan kesuksesan pemagangan Zaki Tri Pamungkas di BNI & MagangHub Kemnaker RI.*
