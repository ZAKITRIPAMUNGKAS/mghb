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

-- 2. TABEL PENGELUARAN & PEMASUKAN JAKARTA (Cash Flow & Expense Tracker - Legacy Compatible)
CREATE TABLE IF NOT EXISTS mghb_expenses (
    id TEXT PRIMARY KEY,
    tx_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL DEFAULT 'makan',
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'expense',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mghb_expenses ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'expense';

-- 3. TABEL CENTANG & CHECKLIST STATUS (Dinas Jakarta & SOP BNI)
CREATE TABLE IF NOT EXISTS mghb_checklists (
    id TEXT PRIMARY KEY,
    tab TEXT NOT NULL,
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

INSERT INTO mghb_settings (key, value)
VALUES ('finance_income', '3500000'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 6. TABEL TAGIHAN BULANAN TETAP (Legacy Bills)
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

INSERT INTO mghb_bills (id, name, amount, due_day, is_custom, sort_order) VALUES
    ('bill_kos', 'Sewa Kos Benhil', 1200000, 1, FALSE, 1),
    ('bill_listrik', 'Token Listrik Kos', 150000, 5, FALSE, 2),
    ('bill_kuota', 'Paket Data / Kuota', 100000, 10, FALSE, 3),
    ('bill_laundry', 'Langganan Laundry Kiloan', 150000, 15, FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- 7. TABEL TUJUAN KEUANGAN & SISIHAN (Legacy Goals)
CREATE TABLE IF NOT EXISTS mghb_goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target NUMERIC(14, 2) NOT NULL DEFAULT 0,
    saved NUMERIC(14, 2) NOT NULL DEFAULT 0,
    deadline TEXT,
    icon TEXT,
    color TEXT,
    is_preset BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO mghb_goals (id, name, target, saved, deadline, icon, color, is_preset, sort_order) VALUES
    ('goal_iphone18', 'iPhone 18 Fund', 20000000, 2500000, '2026-12', 'phone', '#005E6A', TRUE, 1),
    ('goal_darurat', 'Dana Darurat (3× pengeluaran)', 4500000, 0, NULL, 'shield', '#10b981', FALSE, 2),
    ('goal_mudik', 'Mudik Solo (Tiket KA PP)', 900000, 0, NULL, 'train', '#0284c7', FALSE, 3),
    ('goal_ortu', 'Kirim ke Orang Tua', 600000, 0, NULL, 'heart', '#ec4899', FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- SISTEM BARU: ADAPTIVE GOAL-BASED BUDGETING & LEDGER (FinOS)
-- ====================================================================

-- 8. TABEL REKENING / DOMPET KAS (Multi-Account Ledger)
CREATE TABLE IF NOT EXISTS mghb_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'checking' CHECK (type IN ('checking', 'savings', 'wallet', 'cash', 'investment', 'credit')),
    initial_balance BIGINT NOT NULL DEFAULT 0,
    current_balance BIGINT NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'IDR',
    include_in_liquid BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed akun default pemagangan
INSERT INTO mghb_accounts (id, name, type, initial_balance, current_balance, currency, include_in_liquid, is_active, sort_order) VALUES
    ('acc_bni', 'Rekening BNI Utama', 'checking', 3500000, 3500000, 'IDR', TRUE, TRUE, 1),
    ('acc_cash', 'Dompet Tunai / Cash', 'cash', 150000, 150000, 'IDR', TRUE, TRUE, 2),
    ('acc_gopay', 'GoPay / Ojek Online', 'wallet', 50000, 50000, 'IDR', TRUE, TRUE, 3),
    ('acc_savings', 'Tabungan Wondr BNI', 'savings', 0, 0, 'IDR', FALSE, TRUE, 4)
ON CONFLICT (id) DO NOTHING;

-- 9. TABEL FINANCIAL GOALS (Configurable Sinking Funds)
CREATE TABLE IF NOT EXISTS mghb_financial_goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_amount BIGINT NOT NULL,
    current_amount BIGINT NOT NULL DEFAULT 0,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_date DATE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    monthly_target BIGINT NOT NULL DEFAULT 0,
    icon TEXT NOT NULL DEFAULT 'fluent-emoji-flat:target',
    color TEXT NOT NULL DEFAULT '#005E6A',
    is_protected BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'paused')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO mghb_financial_goals (id, name, target_amount, current_amount, start_date, target_date, priority, monthly_target, icon, color, is_protected, status, sort_order) VALUES
    ('goal_iphone18', 'iPhone 18 Fund', 20000000, 2500000, '2026-10-01', '2026-12-31', 'medium', 1000000, 'fluent-emoji-flat:mobile-phone', '#005E6A', TRUE, 'active', 1),
    ('goal_darurat', 'Dana Darurat (3 Bulan)', 4500000, 500000, '2026-10-01', '2027-04-30', 'critical', 500000, 'fluent-emoji-flat:shield', '#10B981', TRUE, 'active', 2),
    ('goal_mudik', 'Mudik Solo (Tiket KA PP)', 900000, 150000, '2026-10-01', '2027-03-31', 'high', 150000, 'fluent-emoji-flat:bullet-train', '#0284C7', TRUE, 'active', 3)
ON CONFLICT (id) DO NOTHING;

-- 10. TABEL COMMITMENTS / TAGIHAN KONTRAKTUAL
CREATE TABLE IF NOT EXISTS mghb_commitments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount BIGINT NOT NULL,
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    category_id TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    last_paid_tx_id TEXT,
    icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO mghb_commitments (id, name, amount, due_day, is_recurring, is_mandatory, paid, icon, sort_order) VALUES
    ('com_kos', 'Sewa Kos Benhil', 1200000, 1, TRUE, TRUE, FALSE, 'fluent-emoji-flat:house', 1),
    ('com_listrik', 'Token Listrik Kos', 150000, 5, TRUE, TRUE, FALSE, 'fluent-emoji-flat:high-voltage', 2),
    ('com_kuota', 'Paket Data / Kuota', 100000, 10, TRUE, TRUE, FALSE, 'fluent-emoji-flat:antenna-bars', 3),
    ('com_laundry', 'Langganan Laundry Kiloan', 150000, 15, TRUE, TRUE, FALSE, 'fluent-emoji-flat:basket', 4)
ON CONFLICT (id) DO NOTHING;

-- 11. TABEL TRANSAKSI BUKU BESAR (Double-Entry Capable Ledger)
CREATE TABLE IF NOT EXISTS mghb_transactions (
    id TEXT PRIMARY KEY,
    tx_type TEXT NOT NULL CHECK (tx_type IN ('INCOME', 'EXPENSE', 'TRANSFER', 'SAVING', 'GOAL_CONTRIBUTION', 'BILL_PAYMENT', 'REFUND', 'REIMBURSEMENT', 'ADJUSTMENT')),
    amount BIGINT NOT NULL CHECK (amount > 0),
    tx_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tx_time TIME NOT NULL DEFAULT CURRENT_TIME,
    account_id TEXT NOT NULL REFERENCES mghb_accounts(id) ON DELETE RESTRICT,
    destination_account_id TEXT REFERENCES mghb_accounts(id) ON DELETE RESTRICT,
    category_id TEXT,
    goal_id TEXT REFERENCES mghb_financial_goals(id) ON DELETE SET NULL,
    commitment_id TEXT REFERENCES mghb_commitments(id) ON DELETE SET NULL,
    related_tx_id TEXT,
    description TEXT NOT NULL,
    merchant TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    is_reimbursable BOOLEAN NOT NULL DEFAULT FALSE,
    reimbursed_amount BIGINT NOT NULL DEFAULT 0,
    split_details JSONB,
    audit_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 12. TABEL SNAPSHOT HARIAN & CLOSING BULANAN
CREATE TABLE IF NOT EXISTS mghb_daily_snapshots (
    snapshot_date DATE PRIMARY KEY,
    total_balance BIGINT NOT NULL,
    liquid_balance BIGINT NOT NULL,
    safe_to_spend BIGINT NOT NULL,
    daily_budget BIGINT NOT NULL,
    health_score INTEGER NOT NULL,
    goals_total_saved BIGINT NOT NULL,
    projected_eom BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mghb_monthly_closings (
    cycle_id TEXT PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_income BIGINT NOT NULL,
    total_expense BIGINT NOT NULL,
    needs_spent BIGINT NOT NULL,
    wants_spent BIGINT NOT NULL,
    savings_contributed BIGINT NOT NULL,
    goals_contributed BIGINT NOT NULL,
    closing_balance BIGINT NOT NULL,
    health_score INTEGER NOT NULL,
    summary_report JSONB NOT NULL,
    closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. INDEKS & PERFORMA
CREATE INDEX IF NOT EXISTS idx_logbooks_date ON mghb_logbooks(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON mghb_expenses(tx_date DESC);
CREATE INDEX IF NOT EXISTS idx_moms_date ON mghb_moms(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_bills_due ON mghb_bills(due_day ASC);
CREATE INDEX IF NOT EXISTS idx_goals_sort ON mghb_goals(sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_ledger_tx_date ON mghb_transactions(tx_date DESC, tx_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_account ON mghb_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_commitments_due ON mghb_commitments(due_day ASC);

-- 14. ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS POLICIES
ALTER TABLE mghb_logbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mghb_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mghb_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE mghb_moms ENABLE ROW LEVEL SECURITY;
ALTER TABLE mghb_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mghb_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE mghb_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mghb_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mghb_financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mghb_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mghb_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mghb_daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE mghb_monthly_closings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Akses publik logbook" ON mghb_logbooks FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Akses publik pengeluaran" ON mghb_expenses FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Akses publik checklist" ON mghb_checklists FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Akses publik mom" ON mghb_moms FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Akses publik settings" ON mghb_settings FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Akses publik tagihan" ON mghb_bills FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Akses publik tujuan" ON mghb_goals FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Akses publik accounts" ON mghb_accounts FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Akses publik financial goals" ON mghb_financial_goals FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Akses publik commitments" ON mghb_commitments FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Akses publik ledger tx" ON mghb_transactions FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Akses publik snapshots" ON mghb_daily_snapshots FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Akses publik closings" ON mghb_monthly_closings FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
