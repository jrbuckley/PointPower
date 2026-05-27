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
4. `20260527000000_seed_partner_transfer_edge.sql` — example United → Hyatt partner hop (multi-step path UI)

## New changes

Add a new file under `migrations/` with a timestamp prefix, e.g. `20260520120000_description.sql`, then run `supabase db push` again.

For **catalog copy or seed tweaks** on databases that already ran migrations, prefer a new migration with `INSERT ... ON CONFLICT DO UPDATE` rather than editing files above (already-applied migrations are not re-run).

## Repair migration history after a squash

If `supabase db push` fails with **“Remote migration versions not found in local migrations directory”**, the remote `supabase_migrations.schema_migrations` table still lists migration files you deleted locally. Mark those versions as reverted (this updates history only; it does not roll back applied SQL):

```bash
supabase migration repair --status reverted \
  20260515140000 20260516120000 20260517120000 20260518120000 \
  20260519120000 20260521120000 20260522120000 20260523140000 \
  20260524120000

supabase migration list   # local and remote columns should align
supabase db push          # applies any new local-only migrations
```

**Note:** `20260514032600` may still show as applied on remote even though the file was replaced with the squashed `initial_schema.sql`. That is OK if the old incremental migrations already created the same tables; only *new* forward migrations run on push.

If you need a clean slate (dev only):

```bash
supabase db reset --linked
```

## Valuation engine

Transfers are modeled in `@points-exchange/recommendations` against the fetched **valuation catalog**:

- **Products:** `redemption_products` + `redemption_offers.redemption_product_key` for concrete points → cash leaves.
- **Graph:** `reward_program_transfer_partners`, `partner_transfer_edges`, `transfer_bonuses` for multi-hop path search.
- **Ranking:** goal-weighted strategy order and transfer-path explainability live in the recommendations package, not in SQL.

Offers are keyed by `redemption_method_code` (transfer / portal / cashback). `saved_offers.recommendation_id` stores the strategy id (e.g. `MOST_EFFECTIVE`), not a legacy bucket column.

Email templates for Auth live in `email-templates/`.
