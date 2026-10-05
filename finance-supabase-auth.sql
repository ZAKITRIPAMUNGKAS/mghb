-- MGHB Finance shared-PIN setup. The app PIN is 272800 and the same finance
-- rows are intentionally shared across the user's devices without email login.
-- This is convenient but NOT private against anyone who has the app/PIN.
-- Run in Supabase SQL Editor. No replacement or Auth user is required.
-- Shared owner ID: 00000000-0000-4000-8000-000000272800

-- Create canonical tables when the older project has never provisioned them.
CREATE TABLE IF NOT EXISTS public.mghb_accounts (
  id text PRIMARY KEY, name text NOT NULL, type text NOT NULL DEFAULT 'checking',
  initial_balance bigint NOT NULL DEFAULT 0, current_balance bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'IDR', include_in_liquid boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mghb_financial_goals (
  id text PRIMARY KEY, name text NOT NULL, target_amount bigint NOT NULL DEFAULT 0,
  current_amount bigint NOT NULL DEFAULT 0, start_date date NOT NULL DEFAULT current_date,
  target_date date NOT NULL DEFAULT '2099-12-31', priority text NOT NULL DEFAULT 'medium',
  monthly_target bigint NOT NULL DEFAULT 0, icon text NOT NULL DEFAULT '', color text NOT NULL DEFAULT '#005E6A',
  is_protected boolean NOT NULL DEFAULT true, status text NOT NULL DEFAULT 'active', sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mghb_commitments (
  id text PRIMARY KEY, name text NOT NULL, amount bigint NOT NULL DEFAULT 0,
  due_day integer NOT NULL DEFAULT 1, category_id text, is_recurring boolean NOT NULL DEFAULT true,
  is_mandatory boolean NOT NULL DEFAULT true, paid boolean NOT NULL DEFAULT false,
  last_paid_tx_id text, icon text, sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mghb_transactions (
  id text PRIMARY KEY, tx_type text NOT NULL, amount bigint NOT NULL CHECK (amount > 0),
  tx_date date NOT NULL DEFAULT current_date, tx_time time NOT NULL DEFAULT current_time,
  account_id text NOT NULL REFERENCES public.mghb_accounts(id), destination_account_id text REFERENCES public.mghb_accounts(id),
  category_id text, goal_id text REFERENCES public.mghb_financial_goals(id) ON DELETE SET NULL,
  commitment_id text REFERENCES public.mghb_commitments(id) ON DELETE SET NULL,
  related_tx_id text, description text NOT NULL, merchant text, status text NOT NULL DEFAULT 'completed',
  is_reimbursable boolean NOT NULL DEFAULT false, reimbursed_amount bigint NOT NULL DEFAULT 0,
  split_details jsonb, audit_notes text, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.mghb_daily_snapshots (
  snapshot_date date PRIMARY KEY, total_balance bigint NOT NULL, liquid_balance bigint NOT NULL,
  safe_to_spend bigint NOT NULL, daily_budget bigint NOT NULL, health_score integer NOT NULL,
  goals_total_saved bigint NOT NULL, projected_eom bigint NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mghb_monthly_closings (
  cycle_id text PRIMARY KEY, start_date date NOT NULL, end_date date NOT NULL,
  total_income bigint NOT NULL DEFAULT 0, total_expense bigint NOT NULL DEFAULT 0,
  needs_spent bigint NOT NULL DEFAULT 0, wants_spent bigint NOT NULL DEFAULT 0,
  savings_contributed bigint NOT NULL DEFAULT 0, goals_contributed bigint NOT NULL DEFAULT 0,
  closing_balance bigint NOT NULL DEFAULT 0, health_score integer NOT NULL DEFAULT 0,
  summary_report jsonb NOT NULL DEFAULT '{}'::jsonb, closed_at timestamptz NOT NULL DEFAULT now()
);

-- Compatibility tables may be absent on older deployments. They are retained
-- only so existing rows can be copied safely; the application no longer uses
-- them as the finance source of truth.
CREATE TABLE IF NOT EXISTS public.mghb_expenses (
  id text PRIMARY KEY, tx_date date NOT NULL DEFAULT current_date, category text NOT NULL DEFAULT 'lainnya',
  description text NOT NULL DEFAULT '', amount numeric NOT NULL DEFAULT 0, type text NOT NULL DEFAULT 'expense',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mghb_bills (
  id text PRIMARY KEY, name text NOT NULL, amount numeric NOT NULL DEFAULT 0, due_day integer NOT NULL DEFAULT 1,
  paid boolean NOT NULL DEFAULT false, icon text, is_custom boolean NOT NULL DEFAULT false, sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mghb_goals (
  id text PRIMARY KEY, name text NOT NULL, target numeric NOT NULL DEFAULT 0, saved numeric NOT NULL DEFAULT 0,
  deadline text, icon text, color text, is_preset boolean NOT NULL DEFAULT false, sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mghb_accounts ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.mghb_transactions ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.mghb_commitments ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.mghb_financial_goals ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.mghb_daily_snapshots ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.mghb_monthly_closings ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.mghb_expenses ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.mghb_bills ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.mghb_goals ADD COLUMN IF NOT EXISTS owner_id uuid;

-- Allow a fixed shared UUID even if an earlier Auth-based draft migration was run.
ALTER TABLE public.mghb_accounts DROP CONSTRAINT IF EXISTS mghb_accounts_owner_id_fkey;
ALTER TABLE public.mghb_transactions DROP CONSTRAINT IF EXISTS mghb_transactions_owner_id_fkey;
ALTER TABLE public.mghb_commitments DROP CONSTRAINT IF EXISTS mghb_commitments_owner_id_fkey;
ALTER TABLE public.mghb_financial_goals DROP CONSTRAINT IF EXISTS mghb_financial_goals_owner_id_fkey;
ALTER TABLE public.mghb_daily_snapshots DROP CONSTRAINT IF EXISTS mghb_daily_snapshots_owner_id_fkey;
ALTER TABLE public.mghb_monthly_closings DROP CONSTRAINT IF EXISTS mghb_monthly_closings_owner_id_fkey;
ALTER TABLE public.mghb_expenses DROP CONSTRAINT IF EXISTS mghb_expenses_owner_id_fkey;
ALTER TABLE public.mghb_bills DROP CONSTRAINT IF EXISTS mghb_bills_owner_id_fkey;
ALTER TABLE public.mghb_goals DROP CONSTRAINT IF EXISTS mghb_goals_owner_id_fkey;

CREATE INDEX IF NOT EXISTS idx_mghb_accounts_owner ON public.mghb_accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_mghb_transactions_owner_date ON public.mghb_transactions(owner_id, tx_date DESC);
CREATE INDEX IF NOT EXISTS idx_mghb_commitments_owner ON public.mghb_commitments(owner_id);
CREATE INDEX IF NOT EXISTS idx_mghb_financial_goals_owner ON public.mghb_financial_goals(owner_id);

CREATE TABLE IF NOT EXISTS public.mghb_finance_settings (
  owner_id uuid NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, key)
);
ALTER TABLE public.mghb_finance_settings DROP CONSTRAINT IF EXISTS mghb_finance_settings_owner_id_fkey;

-- Preserve existing canonical rows and assign them to the shared PIN owner.
UPDATE public.mghb_accounts SET owner_id = '00000000-0000-4000-8000-000000272800'::uuid WHERE owner_id IS NULL;
UPDATE public.mghb_transactions SET owner_id = '00000000-0000-4000-8000-000000272800'::uuid WHERE owner_id IS NULL;
UPDATE public.mghb_commitments SET owner_id = '00000000-0000-4000-8000-000000272800'::uuid WHERE owner_id IS NULL;
UPDATE public.mghb_financial_goals SET owner_id = '00000000-0000-4000-8000-000000272800'::uuid WHERE owner_id IS NULL;
UPDATE public.mghb_daily_snapshots SET owner_id = '00000000-0000-4000-8000-000000272800'::uuid WHERE owner_id IS NULL;
UPDATE public.mghb_monthly_closings SET owner_id = '00000000-0000-4000-8000-000000272800'::uuid WHERE owner_id IS NULL;

-- Keep legacy browser/cloud data by importing it once; do not import the old
-- demonstration balances/goals from supabase-schema.sql as personal amounts.
INSERT INTO public.mghb_accounts (id, name, type, current_balance, initial_balance, include_in_liquid, sort_order)
VALUES ('acc_bni','Rekening BNI','checking',0,0,true,1),
       ('acc_gopay','GoPay','wallet',0,0,true,2),
       ('acc_cash','Uang Tunai','cash',0,0,true,3),
       ('acc_savings','Tabungan Wondr BNI','savings',0,0,false,4),
       ('acc_shopeepay','ShopeePay','wallet',0,0,true,5)
ON CONFLICT (id) DO NOTHING;
UPDATE public.mghb_accounts SET owner_id = '00000000-0000-4000-8000-000000272800'::uuid WHERE owner_id IS NULL;

INSERT INTO public.mghb_transactions (id, owner_id, tx_type, amount, tx_date, account_id, category_id, description)
SELECT e.id, '00000000-0000-4000-8000-000000272800'::uuid,
       CASE WHEN e.category = 'saku_bni' OR e.category LIKE '%_inc' THEN 'INCOME' ELSE 'EXPENSE' END,
       GREATEST(ABS(e.amount)::bigint, 1), e.tx_date, 'acc_bni', e.category, e.description
FROM public.mghb_expenses e
WHERE e.amount <> 0
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.mghb_commitments (id, owner_id, name, amount, due_day, paid, category_id, sort_order)
SELECT b.id, '00000000-0000-4000-8000-000000272800'::uuid, b.name, b.amount::bigint, b.due_day, b.paid, 'tagihan', b.sort_order
FROM public.mghb_bills b
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.mghb_financial_goals (id, owner_id, name, target_amount, current_amount, start_date, target_date, priority, monthly_target, icon, color, is_protected, status, sort_order)
SELECT g.id, '00000000-0000-4000-8000-000000272800'::uuid, g.name, g.target::bigint, g.saved::bigint, current_date,
       CASE WHEN g.deadline ~ '^\d{4}-\d{2}-\d{2}$' THEN g.deadline::date ELSE '2099-12-31'::date END,
       'medium', 0, COALESCE(g.icon,''), COALESCE(g.color,'#005E6A'), true, 'active', g.sort_order
FROM public.mghb_goals g
ON CONFLICT (id) DO NOTHING;

-- Move user finance settings out of the legacy public settings table.
INSERT INTO public.mghb_finance_settings (owner_id, key, value)
SELECT '00000000-0000-4000-8000-000000272800'::uuid, 'legacy_' || key, value
FROM public.mghb_settings
WHERE key IN ('finance_income','finance_expenses_backup','finance_goals','fin_config','monthly_budget')
ON CONFLICT (owner_id, key) DO NOTHING;
-- Do not promote the schema's known demo income as a real user value.
INSERT INTO public.mghb_finance_settings (owner_id, key, value)
SELECT '00000000-0000-4000-8000-000000272800'::uuid, 'finance_income', value FROM public.mghb_settings
WHERE key = 'finance_income' AND value::text <> '3500000'
ON CONFLICT (owner_id, key) DO NOTHING;
INSERT INTO public.mghb_finance_settings (owner_id, key, value)
SELECT '00000000-0000-4000-8000-000000272800'::uuid, 'fin_config', value FROM public.mghb_settings WHERE key = 'fin_config'
ON CONFLICT (owner_id, key) DO NOTHING;
-- Legacy rows remain intact as a recoverable source. The application no
-- longer reads or writes these finance keys after this migration.

-- Legacy finance rows are no longer used by the app after this migration;
-- restrict them too so the old public policies cannot expose the source copy.
UPDATE public.mghb_expenses SET owner_id = '00000000-0000-4000-8000-000000272800'::uuid WHERE owner_id IS NULL;
UPDATE public.mghb_bills SET owner_id = '00000000-0000-4000-8000-000000272800'::uuid WHERE owner_id IS NULL;
UPDATE public.mghb_goals SET owner_id = '00000000-0000-4000-8000-000000272800'::uuid WHERE owner_id IS NULL;
DO $$
DECLARE t text; p record;
BEGIN
  FOREACH t IN ARRAY ARRAY['mghb_expenses','mghb_bills','mghb_goals'] LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
    END LOOP;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY finance_legacy_shared_select ON public.%I FOR SELECT TO anon, authenticated USING (owner_id = ''00000000-0000-4000-8000-000000272800''::uuid)', t);
    EXECUTE format('CREATE POLICY finance_legacy_shared_insert ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (owner_id = ''00000000-0000-4000-8000-000000272800''::uuid)', t);
    EXECUTE format('CREATE POLICY finance_legacy_shared_update ON public.%I FOR UPDATE TO anon, authenticated USING (owner_id = ''00000000-0000-4000-8000-000000272800''::uuid) WITH CHECK (owner_id = ''00000000-0000-4000-8000-000000272800''::uuid)', t);
    EXECUTE format('CREATE POLICY finance_legacy_shared_delete ON public.%I FOR DELETE TO anon, authenticated USING (owner_id = ''00000000-0000-4000-8000-000000272800''::uuid)', t);
  END LOOP;
END $$;

-- The general settings table remains available to the other MGHB modules, but
-- it must no longer expose its old finance keys through its public policy.
DROP POLICY IF EXISTS "Akses publik settings" ON public.mghb_settings;
DROP POLICY IF EXISTS "Akses publik settings non-keuangan" ON public.mghb_settings;
CREATE POLICY "Akses publik settings non-keuangan" ON public.mghb_settings
  FOR ALL
  USING (key <> ALL (ARRAY['finance_income','finance_expenses_backup','finance_goals','fin_config','monthly_budget']))
  WITH CHECK (key <> ALL (ARRAY['finance_income','finance_expenses_backup','finance_goals','fin_config','monthly_budget']));

DO $$
DECLARE t text; p record;
BEGIN
  FOREACH t IN ARRAY ARRAY['mghb_accounts','mghb_transactions','mghb_commitments','mghb_financial_goals','mghb_daily_snapshots','mghb_monthly_closings'] LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
    END LOOP;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY finance_shared_select ON public.%I FOR SELECT TO anon, authenticated USING (owner_id = ''00000000-0000-4000-8000-000000272800''::uuid)', t);
    EXECUTE format('CREATE POLICY finance_shared_insert ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (owner_id = ''00000000-0000-4000-8000-000000272800''::uuid)', t);
    EXECUTE format('CREATE POLICY finance_shared_update ON public.%I FOR UPDATE TO anon, authenticated USING (owner_id = ''00000000-0000-4000-8000-000000272800''::uuid) WITH CHECK (owner_id = ''00000000-0000-4000-8000-000000272800''::uuid)', t);
    EXECUTE format('CREATE POLICY finance_shared_delete ON public.%I FOR DELETE TO anon, authenticated USING (owner_id = ''00000000-0000-4000-8000-000000272800''::uuid)', t);
  END LOOP;
END $$;

ALTER TABLE public.mghb_finance_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_settings_owner_select ON public.mghb_finance_settings;
DROP POLICY IF EXISTS finance_settings_owner_insert ON public.mghb_finance_settings;
DROP POLICY IF EXISTS finance_settings_owner_update ON public.mghb_finance_settings;
DROP POLICY IF EXISTS finance_settings_owner_delete ON public.mghb_finance_settings;
DROP POLICY IF EXISTS finance_settings_shared_select ON public.mghb_finance_settings;
DROP POLICY IF EXISTS finance_settings_shared_insert ON public.mghb_finance_settings;
DROP POLICY IF EXISTS finance_settings_shared_update ON public.mghb_finance_settings;
DROP POLICY IF EXISTS finance_settings_shared_delete ON public.mghb_finance_settings;
CREATE POLICY finance_settings_shared_select ON public.mghb_finance_settings FOR SELECT TO anon, authenticated USING (owner_id = '00000000-0000-4000-8000-000000272800'::uuid);
CREATE POLICY finance_settings_shared_insert ON public.mghb_finance_settings FOR INSERT TO anon, authenticated WITH CHECK (owner_id = '00000000-0000-4000-8000-000000272800'::uuid);
CREATE POLICY finance_settings_shared_update ON public.mghb_finance_settings FOR UPDATE TO anon, authenticated USING (owner_id = '00000000-0000-4000-8000-000000272800'::uuid) WITH CHECK (owner_id = '00000000-0000-4000-8000-000000272800'::uuid);
CREATE POLICY finance_settings_shared_delete ON public.mghb_finance_settings FOR DELETE TO anon, authenticated USING (owner_id = '00000000-0000-4000-8000-000000272800'::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mghb_finance_settings TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
