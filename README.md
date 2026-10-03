# MGHB — Asisten & Workspace Magang BNI (Kemnaker)

Aplikasi web produktivitas (*Mobile-First Productivity App*) yang dirancang khusus sebagai sistem asisten harian pemagangan **Zaki Tri Pamungkas** di **PT Bank Negara Indonesia (Persero) Tbk**, Divisi Sales Strategy & Execution (SSE), Menara BNI Pejompongan.

🌐 **Repositori GitHub**: [https://github.com/ZAKITRIPAMUNGKAS/mghb](https://github.com/ZAKITRIPAMUNGKAS/mghb)

---

## 🚀 4 Fungsi Utama Sistem MGHB

Sistem ini dirampingkan dan difokuskan ke dalam **4 fungsi inti** terpadu:

```text
MGHB WORKSPACE
├── 1. 📰 Portal Berita       (Warta & Pengumuman MagangHub Kemnaker)
├── 2. 🎒 Inventaris           (Inventaris Kost & Kantor, Perlengkapan Dinas BNI)
├── 3. 💰 Keuangan             (Budgeting Rantau Jakarta & Tracker Pengeluaran)
└── 4. 🧭 Plan & Workflow MGHB (Roadmap 6 Bulan, SOP Jam Kerja BNI, Daily Logbook & Mentor)
```

---

### 1. 📰 Portal Berita (Kabar & Warta MagangHub)
* **Agregasi Otomatis Berita Kredibel**: Menarik pembaruan berita dan regulasi pemagangan secara otomatis dari sumber-sumber terpercaya:
  - **Kementerian Ketenagakerjaan RI (Kemnaker)**: Rilis pers resmi, jadwal batch, dan ketentuan uang saku.
  - **ANTARA News**: Kebijakan pemagangan nasional & sertifikasi kompetensi BNSP.
  - **Media Nasional (Kompas, Detikcom, CNBC Indonesia)**: Liputan program BNI dan dunia kerja.
* **Filter Kategori Topik**: *Semua Berita*, *Pengumuman & Batch*, *Regulasi & Uang Saku*, *Sertifikasi BNSP*, *Kemnaker & BNI*.
* **Portal Layanan Resmi Terkait**: Akses cepat 1-klik ke portal MagangHub Kemnaker, SIAPkerja, dan BNI.

---

### 2. 🎒 Inventaris (Inventaris Rantau & Kantor)
* **Daftar Barang & Kategori**:
  - Pakaian Formal & Batik BNI (HCS compliance).
  - Perlengkapan Kamar Kost & Elektronik (Laptop dinas, charger, TPP Lanyard).
  - Dokumen Legal (PKM-0026-PKM-II-2026, LoA, Surat Penempatan, Kartu Identitas).
  - Obat-obatan pribadi & toiletries grooming.
* **Fitur Interaktif**: Filter ketersediaan barang (*Tersedia / Di Kost / Dibawa ke Kantor / Perlu Beli*), pencarian instan, dan tombol **"Salin Inventaris"** siap bagikan.

---

### 3. 💰 Keuangan (Manajemen Finansial Rantau Jakarta)
* **Kalkulator Budgeting Realistis**: Input uang saku / pemasukan bulanan, kalkulasi otomatis sisa anggaran harian aman, dan indikator batas pengeluaran (*Aman*, *Waspada*, *Defisit*).
* **Quick Expense Tracker (1-Klik)**: Pencatat pengeluaran instan dengan preset riil Menara BNI Pejompongan:
  - `+15rb` Kantin Basement Menara BNI
  - `+20rb` Warteg Penjernihan Benhil
  - `+3rb` KRL Stasiun Palmerah
  - `+10rb` Ojek Online Stasiun - Kantor
  - `+25rb` Laundry Kiloan
* **Pola Alokasi 50/30/20**: Pembagian pos kebutuhan pokok (kos & listrik), operasional (makan & transport), serta tabungan/dana darurat di rekening BNI / Wondr.
* **Salin Rekap Finansial**: Satu klik untuk menyalin rekapitulasi pengeluaran ke clipboard WhatsApp.

---

### 4. 🧭 Plan & Workflow Selama MGHB
Pusat kendali dan panduan operasional pemagangan Zaki di Divisi SSE BNI:
* **Roadmap 6 Bulan Pemagangan**:
  - *Bulan 1*: Onboarding, Budaya BNI HCS & Pemahaman Kerangka ABT-Cabang-BRAVE.
  - *Bulan 2*: Olah Data CICO Leads, Cleansing Database Nasabah & Analisis Spasial.
  - *Bulan 3*: Pengembangan Sub-Sistem Pre-Sales BCS/GIS Area BNI.
  - *Bulan 4*: Monev Tengah Periode Kemnaker & Akselerasi Pipeline Prospek.
  - *Bulan 5*: Simulasi Threshold 20% TAP Serapan Produk Mandatory & Handover BAST.
  - *Bulan 6*: Penyusunan Laporan Akhir Magang & Uji Sertifikasi BNSP.
  - *Target Milestone Checklist*: Checklist progresif interaktif yang tersimpan di `localStorage`.
* **Daily Logbook Formulator & Scratchpad**:
  - Scratchpad pencatat cepat aktivitas harian (auto-save).
  - Formulator Laporan Harian Kemnaker 3 bagian: *Uraian Aktivitas*, *Hasil/Output*, *Kendala*.
  - Generator AI (Claude via API) & Generator Template Offline.
  - Ekspor Riwayat & Draf Laporan Bulanan Resmi.
* **SOP & Jam Kerja Menara BNI**:
  - Jam Operasional Kantor: 07.30 – 17.00 WIB.
  - Presensi Ganda: Aplikasi internal **DigiHC BNI** + GPS Portal **MagangHub Kemnaker**.
  - Standar Busana HCS (Senin-Selasa Formal, Rabu-Kamis Batik, Jumat Casual/Blazer).
  - Kepatuhan Kerahasiaan Bank (Banking Secrecy / NDA).
* **Template Chat WhatsApp Mentor**:
  - Izin Wisuda UMS, Izin Sakit / Surat Dokter, Laporan Selesai Penugasan Harian, Pengajuan Approval Logbook Mingguan ke Mentor (Bapak Guruh Sri Handoyo).
* **Kamus & Toolkit SSE**:
  - Rumus Excel Olah Data Sales (VLOOKUP, INDEX-MATCH, SUMIFS, Pivot Table).
  - Kamus Istilah Bisnis Perbankan (CASA, DPK, Pipeline, NPL, dll.).
  - Panduan Gedung Menara BNI & Lingkungan Kuliner Pejompongan / Benhil.

---

## 🗄️ Database Cloud & Offline-First

* **Supabase PostgreSQL**: Sinkronisasi lintas perangkat (Laptop kantor dan HP) untuk tabel logbook, expenses, dan inventaris.
* **100% Offline-First**: Aplikasi tetap dapat berjalan optimal tanpa internet berkat memori lokal `localStorage`.
* **Keamanan Sesi**: Dilengkapi PIN Lock Screen untuk privasi saat meninggalkan laptop di meja kerja.

---

*Dikembangkan khusus untuk mendukung efisiensi, kepatuhan, dan kesuksesan pemagangan Zaki Tri Pamungkas di PT Bank Negara Indonesia (Persero) Tbk & Program MagangHub Kemnaker RI.*
