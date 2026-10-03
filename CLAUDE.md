# MGHB WORKSPACE — AI AGENT RUNTIME PROTOCOL

> Baca [AI_SYSTEM_CONTEXT.md](./AI_SYSTEM_CONTEXT.md) untuk detail arsitektur lengkap.

## 1. REPO ISOLATION (JANGAN TERTUKAR!)
- Repo ini adalah **`mghb`** (`D:\GEMALA.CREATIVE\mghb\`), remote: `https://github.com/ZAKITRIPAMUNGKAS/mghb.git`.
- Repositori ini adalah asisten produktivitas harian magang, bukan workstation Pre-Sales (`mghbbni`).

## 2. STRICT 4 MODULES (TIDAK BOLEH DITAMBAH MENU LAIN DI NAVIGASI)
Sistem MGHB hanya memiliki 4 fungsi utama di navigasi sidebar dan bottom bar:
1. `berita`: **Portal Berita** (Warta & Pengumuman MagangHub Kemnaker)
2. `packing`: **Inventaris** (Barang Kost, Perlengkapan BNI, Dokumen PKM)
3. `keuangan`: **Keuangan** (Budgeting Harian Rantau Jakarta, Quick Expense 1-Klik)
4. `workflow`: **Roadmap Magang** (Roadmap Line dengan Motif Jaring-Jaring BNI & Checklist Milestone)

## 3. TECHNICAL CONSTRAINTS
- Single-page application di `index.html`.
- Bottom navigation mobile menggunakan `grid-template-columns: repeat(4, 1fr)`.
- Jangan kembalikan menu transit ke navigasi utama.
- Validasi script setelah edit: jalankan uji sintaks Node.js untuk memastikan bebas error.
