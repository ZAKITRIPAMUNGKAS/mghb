# Finance Supabase Source of Truth — Design

Date: 2026-10-05  
Status: Proposed for user review  
Scope: MGHB finance workspace (`index.html`, `supabase-schema.sql`)

## Goal

Make Supabase the authoritative persistent source for every finance value in MGHB: account balances, income, transactions, commitments/bills, goals, finance mode/configuration, and derived snapshots/closings. The UI must never present seeded defaults as if they were the user's saved data when cloud loading fails.

## Current findings

- `initApp()` starts `initSupabaseClient()` without waiting, then calls `initFinanceManager()`. `FinOS.syncSupabase()` therefore may run before `supabaseClient` exists and immediately return. A later `syncAllDataWithCloud()` handles legacy finance tables but does not guarantee the FinOS ledger has loaded.
- Finance state currently has overlapping legacy tables (`mghb_expenses`, `mghb_bills`, `mghb_goals`, and `finance_income` in `mghb_settings`) and FinOS tables (`mghb_accounts`, `mghb_transactions`, `mghb_commitments`, `mghb_financial_goals`, and `mghb_daily_snapshots`). Their read/write paths merge local defaults and cloud rows differently.
- The client account mapping writes `account_type` and `balance`; `supabase-schema.sql` defines `type` and `current_balance`. Other FinOS mappings also need reconciliation with their SQL columns before cloud reads/writes can be trusted.
- Several methods silently catch or ignore Supabase errors, while the connection badge only checks a read against `mghb_settings`. It can show connected even when a finance table operation fails.
- Finance is stored in `localStorage` and seeded defaults are returned when a local record is absent. This makes browser state appear authoritative and can render default figures during or after an unsuccessful cloud load.
- Existing RLS policies grant public `USING (true)` / `WITH CHECK (true)` access to finance tables. A public anonymous client is therefore not an acceptable isolation boundary for personal financial records.

## Design

### Data ownership and access

- Add a Supabase Auth sign-in gate for the finance workspace. Use email magic-link/OTP so no password is stored in the static client.
- Add an `owner_id uuid references auth.users(id)` to finance tables and scope every select, insert, update, and delete to the authenticated user.
- Replace permissive public policies with authenticated owner policies (`owner_id = auth.uid()`). Keep the public anon key in the client only; never expose a service-role key.
- Assign existing unowned finance rows to the owner's authenticated UUID through a one-time migration before enabling restrictive policies. Do not delete or overwrite existing cloud rows during migration.

### Canonical persistence

- Use the FinOS tables as the only canonical finance store: accounts, transactions, commitments, financial goals, settings/configuration, daily snapshots, and monthly closings.
- Keep legacy finance tables readable only during a one-time compatibility migration. After data is copied and verified, the application stops writing to them; removal is a separate later migration.
- Use one mapping layer between JS models and SQL columns. Reconcile the account, transaction, commitment, goal, and snapshot columns in `supabase-schema.sql` with the fields actually used by the UI.
- Treat balances as persisted account state updated with each relevant operation; preserve initial balances and transaction history so reconciliation remains possible.

### Startup and failure behavior

1. Render a finance loading state; do not initialize finance defaults yet.
2. Initialize Supabase and establish authenticated identity.
3. Load all canonical finance rows and check every query result for errors.
4. Only after successful load, hydrate the UI and calculate derived metrics.
5. If the cloud is unavailable or a required table/query fails, show a clear unavailable state with retry. Do not silently switch to defaults or accept writes that appear saved.

All finance writes become awaited operations. A UI success state appears only after the corresponding Supabase write succeeds. `localStorage` may retain a non-authoritative render cache, but it cannot be used to decide that a finance write succeeded or to overwrite newer cloud data on startup.

### Existing data migration

- Provide a guarded, idempotent one-time migration from existing browser keys and legacy tables into canonical rows.
- Resolve duplicate transaction IDs by preserving the canonical cloud row and reporting conflicts for review; do not silently choose local values.
- Do not auto-import a browser's seeded defaults as user data. Only explicit, non-default local records may be offered for import.
- Preserve a recoverable export/backup before any migration or policy change. No reset or destructive cleanup is part of this change.

## Alternatives considered

1. Keep local-first behavior and repair background sync: lowest code disruption, but still allows stale/default values and ambiguous write success. Rejected because the requested behavior is cloud-authoritative.
2. Make Supabase authoritative with authenticated ownership and fail-closed loading: selected. It matches the request and protects this personal finance data.
3. Keep a public single-user Supabase dataset protected only by the page PIN: simpler, but the PIN and anon key are delivered to browsers and public RLS policies expose the rows. Rejected for financial data.

## Boundaries

- This change covers finance persistence and access. The AI finance-advice endpoint remains a stateless advisor that receives a user-provided summary; it does not become a database or persist finance data.
- No bank integration or automatic transaction import is introduced.
- Non-finance MGHB modules retain their current storage behavior unless a shared authentication change requires a narrow integration update.

## Acceptance criteria

- A signed-in owner sees the same saved accounts, balances, transactions, income, bills/commitments, goals, and finance settings across browsers/devices.
- A new browser loads cloud values without first showing finance defaults as real values.
- When offline, signed out, or when a required table fails, the finance UI clearly reports unavailable state and does not claim changes were saved.
- Every finance read/write is owner-scoped by RLS; anonymous users cannot read or mutate finance rows.
- Schema and client mappings agree for every canonical finance table.
- Legacy and browser migration is repeatable without duplicate rows or silent overwrites, and existing cloud values remain recoverable.

## Open implementation detail

The Supabase project must have an Auth provider enabled and an owner account available. The implementation should use the project's configured email provider; credentials and service-role secrets stay outside the repository.
