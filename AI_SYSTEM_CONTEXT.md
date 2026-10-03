# 🧭 AI AGENT SYSTEM PROTOCOL & CONTEXT
## MGHB Workspace — Asisten & Produktivitas Magang BNI (Kemnaker)
### Peneliti & Pengembang: Zaki Tri Pamungkas

> **PENTING UNTUK SEMUA AI AGENT (Claude, Antigravity, Cursor, Gemini, Copilot, ChatGPT, dll.)**:  
> Dokumen ini adalah panduan resmi arsitektur, peran, dan aturan sistem repositori **`mghb`**. Baca dokumen ini sebelum memodifikasi atau mengembangkan kode di direktori ini.

---

## 📌 1. Profil Pengguna & Lingkungan Kerja

- **Pengguna**: Zaki Tri Pamungkas (Mahasiswa Universitas Muhammadiyah Surakarta / UMS).
- **Posisi**: Corporate General Management Staff 3.
- **Penempatan Kerja**: PT Bank Negara Indonesia (Persero) Tbk — Divisi Sales Strategy & Execution (SSE), Menara BNI Pejompongan Lantai 3, Jakarta Pusat.
- **Program**: MagangHub Kemnaker RI Batch II 2026 (No. Perjanjian Kerja Magang: `PKM-0026-PKM-II-2026`).
- **Mentor Lapangan**: Bapak Guruh Sri Handoyo.

---

## ⚠️ 2. Pemisahan Repositori (JANGAN PERNAH TERTUKAR!)

Workspace Zaki memiliki 2 repositori terpisah dengan tujuan yang berbeda:

| Atribut | Repositori 1: `mghb` (PROJEK INI) | Repositori 2: `mghbbni` (PROJEK LAIN) |
| :--- | :--- | :--- |
| **Path Direktori** | `D:\GEMALA.CREATIVE\mghb\` | `D:\GEMALA.CREATIVE\BNI MAGANG - ZAKI\` |
| **Target GitHub** | `https://github.com/ZAKITRIPAMUNGKAS/mghb.git` | `https://github.com/ZAKITRIPAMUNGKAS/mghbbni.git` |
| **Tujuan Sistem** | Asisten produktivitas pribadi harian magang, budgeting rantau, inventaris, logbook Kemnaker, dan warta MagangHub. | Sub-Sistem Pre-Sales BCS & GIS tingkat Area BNI untuk pemantauan target sales korporasi dan institusi. |
| **Teknologi** | Single-page Application (Vanilla HTML/CSS/JS, Supabase, Leaflet). | React 18, Vite, Tailwind CSS, Lucide Icons. |

---

## 🏛️ 3. Empat Fungsi Utama Sistem MGHB (Strict 4 Modules)

Sistem ini **HANYA** memiliki 4 fungsi utama di navigasi:

```text
MGHB WORKSPACE (Tepat 4 Menu Navigasi):
├── 1. 📰 Portal Berita       (Tab: 'berita', Route: '/' atau '#berita')
├── 2. 🎒 Inventaris           (Tab: 'packing', Route: '/inventaris' atau '#inventaris')
├── 3. 💰 Keuangan             (Tab: 'keuangan', Route: '/keuangan' atau '#keuangan')
└── 4. 🧭 Plan & Workflow MGHB (Tab: 'workflow', Route: '/workflow' atau '#workflow')
```

### 1. 📰 Tab 1: Portal Berita
- **Tujuan**: Agregasi otomatis warta & pengumuman program pemagangan nasional dari Kemnaker RI, Antara News, Kompas, dan CNBC Indonesia.
- **Filter Topik**: *Semua Berita*, *Pengumuman & Batch*, *Regulasi & Uang Saku*, *Sertifikasi BNSP*, *Kemnaker & BNI*.
- **Quick Hub Grid**: 4 tombol pintasan di beranda yang mengarah 1:1 ke 4 fungsi utama sistem.
- **Quick Links**: Tautan langsung ke portal resmi MagangHub Kemnaker, SIAPkerja, dan BNI.

### 2. 🎒 Tab 2: Inventaris
- **Tujuan**: Manajemen inventaris barang rantau, kos, dan kantor.
- **Kategori**: Pakaian formal & batik BNI HCS, perlengkapan kost, dokumen legal (PKM, LoA), obat-obatan, dan grooming.
- **Fitur**: Filter ketersediaan (*Tersedia, Di Kost, Dibawa ke Kantor, Perlu Beli*), pencarian instan, dan tombol salin inventaris ke clipboard WhatsApp.

### 3. 💰 Tab 3: Keuangan
- **Tujuan**: Manajemen finansial anak magang di Jakarta.
- **Fitur Utama**:
  - Kalkulator budgeting realistis (input uang saku bulanan, kalkulasi batas harian aman).
  - Quick Expense Tracker 1-klik dengan preset pengeluaran riil Menara BNI Pejompongan (Kantin basement BNI, Warteg Benhil, KRL Stasiun Palmerah, Ojol kantor, Laundry).
  - Pola alokasi 50/30/20 (pokok, operasional, tabungan/darurat di rekening BNI/Wondr).
  - Tombol salin rekap pengeluaran bulanan.

### 4. 🧭 Tab 4: Roadmap Magang (Roadmap Line dengan Jaring-Jaring BNI)
Pusat navigasi visual perjalanan dinas Zaki di Divisi SSE BNI dengan tampilan **Roadmap Line bertingkat** dan motif geometris **Jaring-Jaring (JARIN Network)**:
1. **Roadmap Track & Jaring-Jaring**: Spine line vertikal dinamis dengan gradient BNI Teal-Coral yang menghubungkan simpul node 6 bulan pemagangan, berlatar belakang motif batik jaring-jaring (`jarin-pattern-light.svg` & `jarin-pattern.svg`).
2. **6 Node Checkpoint**:
   - *Bulan 1*: Onboarding, Budaya BNI HCS & Kerangka ABT-Cabang-BRAVE (Selesai).
   - *Bulan 2*: Olah Data Leads CICO, Cleansing Database CIF & Analisis Spasial Transit (Aktif Berjalan dengan pulsating glow).
   - *Bulan 3*: Pengembangan Sub-Sistem Pre-Sales BCS/GIS Area BNI.
   - *Bulan 4*: Monev Tengah Periode Kemnaker & Akselerasi Pipeline Prospek.
   - *Bulan 5*: Simulasi Threshold 20% TAP Serapan Produk Mandatory & Handover BAST.
   - *Bulan 6*: Laporan Akhir Magang & Uji Sertifikasi Kompetensi BNSP.
3. **Interactive Deliverables & Progress Tracker**:
   - Checklist capaian tugas per fase yang dapat dicentang langsung dan disimpan ke `localStorage`.
   - Real-time progress bar persentase capaian dinas magang.

---

## 💻 4. Arsitektur Teknis & Aturan Pengembang

1. **Struktur File**:
   - Seluruh UI dan logika client-side berpusat pada [`index.html`](file:///D:/GEMALA.CREATIVE/mghb/index.html).
   - Data feed berita lokal disimpan pada [`berita_maganghub.json`](file:///D:/GEMALA.CREATIVE/mghb/berita_maganghub.json).
2. **Navigasi 4 Tombol**:
   - Desktop: Sidebar navigasi dengan tepat 4 menu (`berita`, `packing`, `keuangan`, `workflow`).
   - Mobile: Fixed Bottom Navigation Bar dengan 4 kolom seimbang (`grid-template-columns: repeat(4, 1fr)`).
3. **Routing & Backward-Compatibility**:
   - Rute dikelola via `TAB_CONFIG`, `getTabFromLocation()`, `selectTab(tab)`, dan `_doSelectTab(tab)`.
   - Jika dipanggil legacy tab seperti `selectTab('logbook')` atau `selectTab('asisten')`, sistem otomatis mengalihkannya ke `selectTab('workflow')` dan mengaktifkan sub-tab terkait via `switchWorkflowSubtab(sub)`.
4. **Validasi Sintaks**:
   - Setiap kali mengubah script pada `index.html`, **wajib** melakukan uji sintaks (`node -c`) untuk menjamin tidak ada `SyntaxError`.
5. **Aturan Tegas**:
   - DILARANG menambahkan kembali menu lama (misalnya menu transit) ke navigasi utama.
   - Pertahankan kesederhanaan, kecepatan akses, dan responsivitas mobile-first.
