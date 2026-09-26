-- ====================================================================
-- SKEMA DATABASE POSTGRESQL (SUPABASE) UNTUK MGHB WORKSPACE
-- Portal Asisten Pemagangan Zaki Tri Pamungkas · BNI SSE
-- ====================================================================

-- 1. TABEL LOGBOOK HARIAN (MagangHub Kemnaker & BNI)
CREATE TABLE IF NOT EXISTS mghb_logbooks (
    id TEXT PRIMARY KEY,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL DEFAULT 'data',
    category_label TEXT,
    rough_notes TEXT,
    activity TEXT NOT NULL,
    output TEXT NOT NULL,
    obstacle TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL PENGELUARAN & ANGGARAN JAKARTA (Expense Tracker)
CREATE TABLE IF NOT EXISTS mghb_expenses (
    id TEXT PRIMARY KEY,
    tx_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL DEFAULT 'makan',
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL CENTANG & CHECKLIST STATUS (Dinas Jakarta & SOP BNI)
CREATE TABLE IF NOT EXISTS mghb_checklists (
    id TEXT PRIMARY KEY, -- id item (misal: pk1, mg1, ot6)
    tab TEXT NOT NULL, -- packing / magang
    is_checked BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL NOTULENSI RAPAT (Minutes of Meeting - MoM SSE)
CREATE TABLE IF NOT EXISTS mghb_moms (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meeting_time TEXT,
    location TEXT,
    writer TEXT,
    attendees TEXT,
    discussion TEXT,
    decisions TEXT,
    action_items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL KONFIGURASI PROFIL & BUDGET
CREATE TABLE IF NOT EXISTS mghb_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inisialisasi data default budget uang saku
INSERT INTO mghb_settings (key, value)
VALUES ('monthly_budget', '{"income": 3500000}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Indeks untuk pencarian dan performa query
CREATE INDEX IF NOT EXISTS idx_logbooks_date ON mghb_logbooks(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON mghb_expenses(tx_date DESC);
CREATE INDEX IF NOT EXISTS idx_moms_date ON mghb_moms(meeting_date DESC);

-- Enable Row Level Security (RLS) dengan akses publik untuk anon key pemagangan
ALTER TABLE mghb_logbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mghb_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mghb_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE mghb_moms ENABLE ROW LEVEL SECURITY;
ALTER TABLE mghb_settings ENABLE ROW LEVEL SECURITY;

-- Policy agar aplikasi web MGHB (dengan anon key) bisa membaca & menyimpan data
CREATE POLICY "Akses publik logbook" ON mghb_logbooks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses publik pengeluaran" ON mghb_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses publik checklist" ON mghb_checklists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses publik mom" ON mghb_moms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses publik settings" ON mghb_settings FOR ALL USING (true) WITH CHECK (true);

-- 6. TABEL TAGIHAN BULANAN TETAP (Smart Checklist Keuangan Rantau)
CREATE TABLE IF NOT EXISTS mghb_bills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    due_day INTEGER NOT NULL DEFAULT 1 CHECK (due_day BETWEEN 1 AND 31),
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    icon TEXT,
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed tagihan default (aman: ON CONFLICT DO NOTHING)
INSERT INTO mghb_bills (id, name, amount, due_day, is_custom, sort_order) VALUES
    ('bill_kos', 'Sewa Kos Benhil', 1200000, 1, FALSE, 1),
    ('bill_listrik', 'Token Listrik Kos', 150000, 5, FALSE, 2),
    ('bill_kuota', 'Paket Data / Kuota', 100000, 10, FALSE, 3),
    ('bill_laundry', 'Langganan Laundry Kiloan', 150000, 15, FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- Simpan nominal pemasukan bulanan yang dipakai form (sinkron income <-> settings)
INSERT INTO mghb_settings (key, value)
VALUES ('finance_income', '3500000'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_bills_due ON mghb_bills(due_day ASC);
ALTER TABLE mghb_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Akses publik tagihan" ON mghb_bills FOR ALL USING (true) WITH CHECK (true);
