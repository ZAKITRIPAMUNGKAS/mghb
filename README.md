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

## 📱 Dukungan Progressive Web App (PWA) & Install di HP

Aplikasi MGHB kini berstatus **Full Progressive Web App (PWA)**:
* **Web App Manifest (`manifest.json`)**: Konfigurasi nama, tema warna Deep Teal BNI (`#005E6A`), dan ikon multi-ukuran (192px, 512px, serta maskable icon).
* **Service Worker (`sw.js`)**: Cache aset shell (HTML, stylesheet, data JSON berita, dan ikon) untuk performa instan dan fungsionalitas offline penuh.
* **Tombol Install di HP**:
  - *Android / Chrome / Edge*: Tombol **"Install di HP"** di header & utility bar, serta floating banner interaktif yang langsung memicu dialog install native.
  - *iOS Safari*: Panduan otomatis untuk opsi *'Tambah ke Layar Utama' (Add to Home Screen)*.

---

## 🗄️ Database Cloud & Offline-First

* **Supabase PostgreSQL**: Sinkronisasi lintas perangkat (Laptop kantor dan HP) untuk tabel logbook, expenses, dan inventaris.
* **100% Offline-First**: Aplikasi tetap dapat berjalan optimal tanpa internet berkat memori lokal `localStorage`.
* **Keamanan Sesi**: Dilengkapi PIN Lock Screen untuk privasi saat meninggalkan laptop di meja kerja.

---

*Dikembangkan khusus untuk mendukung efisiensi, kepatuhan, dan kesuksesan pemagangan Zaki Tri Pamungkas di PT Bank Negara Indonesia (Persero) Tbk & Program MagangHub Kemnaker RI.*

---

# 🚆 Laku — Perencana Perjalanan Multimoda Transit Jabodetabek

**Laku** (bahasa Jawa: *"perjalanan"*) adalah subsistem Progressive Web App (PWA) perencana perjalanan transportasi umum terintegrasi Jabodetabek yang menggabungkan seluruh moda utama dalam satu pencarian rute terpadu:
- **TransJakarta** (BRT Koridor 1–14 & Non-BRT Metrotrans)
- **Mikrotrans (JakLingko)** (Rute JAK, tarif integrasi Rp0)
- **KRL Commuter Line** (Bogor, Cikarang, Rangkasbitung, Tangerang, Tanjung Priok)
- **MRT Jakarta** (North-South Line: Lebak Bulus – Bundaran HI)
- **LRT Jakarta** (Pegangsaan Dua – Velodrome)
- **LRT Jabodebek** (Cibubur Line & Bekasi Line)
- **Angkot Non-Integrasi** (Daftar trayek Satu Data Jakarta & pendataan survei GPS lapangan)

---

## 🏛️ Arsitektur Monorepo (`pnpm`)

Proyek dibangun dengan struktur monorepo terstandarisasi:
```text
mghb/
├── apps/
│   ├── api/             # Backend API (Hono + Node 22 + TypeScript + Redis + PostGIS)
│   └── web/             # Frontend PWA (React + Vite + TypeScript + MapLibre GL)
├── packages/
│   └── pipeline/        # ETL Data Pipeline (Fetcher, Merger, Normalizer GTFS & Importer)
├── infra/
│   ├── docker-compose.yml # PostgreSQL 16 + PostGIS, Redis, OpenTripPlanner 2 (Blue/Green)
│   └── otp/             # Konfigurasi build-config.json & router-config.json OTP2
└── data/
    ├── raw/             # Snapshot GTFS asli harian
    ├── out/             # gtfs-jabodetabek.zip (feed gabungan terstandarisasi)
    └── survey-todo.csv  # Daftar antrean trayek angkot untuk survei lapangan
```

---

## 📋 Aturan Data Real (Zero Hallucination)
1. **Audit Provenance Wajib**: Setiap entitas data menyimpan dan menampilkan `source_url`, `fetched_at`, dan `method` (`gtfs` | `sync` | `survei`).
2. **Tanpa Data Fiktif**: Moda yang belum memiliki sumber resmi aktif otomatis disembunyikan dari perencana rute aktif (misal trayek angkot non-integrasi yang masih menunggu hasil survei track GPS).

---

## ⚡ Panduan Menjalankan Sistem Lokal

### 1. Menjalankan Infrastruktur Docker
```bash
docker compose -f infra/docker-compose.yml up -d
```
Layanan yang dijalankan:
- PostgreSQL 16 + PostGIS pada port `5432`
- Redis 7.2 pada port `6379`
- OpenTripPlanner 2 pada port `8080` (Blue) / `8081` (Green)

### 2. Menjalankan Data Pipeline (ETL GTFS)
Unduh feed resmi, sinkronisasi jadwal kereta, normalisasi prefix, dan ekspor `gtfs-jabodetabek.zip`:
```bash
pnpm pipeline:run
```

### 3. Menjalankan API & Web App
```bash
# Menjalankan seluruh aplikasi secara bersamaan
pnpm dev

# Atau menjalankan secara terpisah:
pnpm dev:api   # Hono API pada http://localhost:3000
pnpm dev:web   # Vite Web pada http://localhost:5173
```

### 4. Menjalankan Automated Test Suite
```bash
# Menjalankan seluruh pengujian unit & integrasi di seluruh workspace
pnpm test

# Menjalankan 10 kasus uji rute nyata (Agent 2 test cases):
pnpm --filter @laku/api test
```

