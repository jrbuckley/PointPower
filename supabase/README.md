# Supabase

Apply schema changes with the [Supabase CLI](https://supabase.com/docs/guides/cli) only. Migrations in `migrations/` run once per environment via `supabase db push`.

## Setup

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

## Apply migrations

```bash
supabase db push
```

Fresh local database (reapplies all migrations; wipes auth + app data):

```bash
supabase db reset --linked
```

## Migration order

1. `20260514032600_initial_schema.sql` — enums, tables, indexes, RLS (users, rewards, valuation graph, catalog, saved offers, account deletion)
2. `20260514032700_seed_rewards_reference_data.sql` — reward programs and redemption methods
3. `20260514032800_seed_catalog.sql` — transfer partners, valuation rules, goal targets, redemption products, offers

## New changes

Add a new file under `migrations/` with a timestamp prefix, e.g. `20260520120000_description.sql`, then run `supabase db push` again.

For **catalog copy or seed tweaks** on databases that already ran migrations, prefer a new migration with `INSERT ... ON CONFLICT DO UPDATE` rather than editing files above (already-applied migrations are not re-run).

## Existing projects with old migration history

If a linked project previously applied the older multi-file migration chain, squashing to these three files will **not** match `supabase_migrations.schema_migrations`. Options:

1. **Dev / disposable:** `supabase db reset --linked` (or reset in the dashboard) and push again.
2. **Production:** repair migration history with Supabase support/docs, or add only *new* forward migrations without renaming applied versions.

## Valuation engine

Transfers are modeled in `@points-exchange/recommendations` against the fetched **valuation catalog**:

- **Products:** `redemption_products` + `redemption_offers.redemption_product_key` for concrete points → cash leaves.
- **Graph:** `reward_program_transfer_partners`, `partner_transfer_edges`, `transfer_bonuses` for multi-hop path search.
- **Ranking:** goal-weighted strategy order and transfer-path explainability live in the recommendations package, not in SQL.

Offers are keyed by `redemption_method_code` (transfer / portal / cashback). `saved_offers.recommendation_id` stores the strategy id (e.g. `MOST_EFFECTIVE`), not a legacy bucket column.

Email templates for Auth live in `email-templates/`.
