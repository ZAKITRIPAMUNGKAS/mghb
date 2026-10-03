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

### 4. 🧭 Roadmap Magang (Roadmap Line dengan Jaring-Jaring BNI)
Pusat navigasi perjalanan dinas & milestone pemagangan Zaki di Divisi SSE BNI dengan tampilan **Roadmap Line** berbalut motif **Jaring-Jaring (JARIN Network BNI)**:
* **Roadmap Line & Checkpoint Spasial**:
  - *Garis Rel Bertingkat*: Garis alur dinamis yang menghubungkan 6 fase perjalanan dinas dari awal onboarding hingga sertifikasi akhir.
  - *Motif Jaring-Jaring BNI*: Latar belakang ambient bermotif geometris jaring-jaring (`jarin-pattern-light.svg` & `jarin-pattern.svg`) dengan simpul jaringan (*network nodes*).
* **6 Fase Perjalanan Dinas & Milestone**:
  - *Bulan 1*: Onboarding, Budaya BNI HCS & Pemahaman Kerangka ABT-Cabang-BRAVE.
  - *Bulan 2 (Aktif Berjalan)*: Olah Data CICO Leads, Cleansing Database CIF & Analisis Spasial Transit.
  - *Bulan 3*: Pengembangan Sub-Sistem Pre-Sales BCS/GIS Area BNI.
  - *Bulan 4*: Monev Tengah Periode Kemnaker & Akselerasi Pipeline Prospek.
  - *Bulan 5*: Simulasi Threshold 20% TAP Serapan Produk Mandatory & Handover BAST.
  - *Bulan 6*: Penyusunan Laporan Akhir Magang & Uji Sertifikasi BNSP.
* **Fitur Interaktif Milestone**:
  - Checklist interaktif target capaian per bulan yang tersimpan di `localStorage`.
  - Progress bar real-time yang menghitung persentase capaian pemagangan.

---

## 🗄️ Database Cloud & Offline-First

* **Supabase PostgreSQL**: Sinkronisasi lintas perangkat (Laptop kantor dan HP) untuk tabel logbook, expenses, dan inventaris.
* **100% Offline-First**: Aplikasi tetap dapat berjalan optimal tanpa internet berkat memori lokal `localStorage`.
* **Keamanan Sesi**: Dilengkapi PIN Lock Screen untuk privasi saat meninggalkan laptop di meja kerja.

---

*Dikembangkan khusus untuk mendukung efisiensi, kepatuhan, dan kesuksesan pemagangan Zaki Tri Pamungkas di PT Bank Negara Indonesia (Persero) Tbk & Program MagangHub Kemnaker RI.*
