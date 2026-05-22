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

## New changes

Add a new file under `migrations/` with a timestamp prefix, e.g. `20260520120000_description.sql`, then run `supabase db push` again.

## Migration order

1. `20260514032600_initial_rewards_schema.sql`
2. `20260514032700_seed_rewards_reference_data.sql`
3. `20260515140000_account_deletion.sql`
4. `20260516120000_custom_goals.sql`
5. `20260517120000_saved_offers.sql`
6. `20260518120000_seed_valuations_and_offers.sql`
7. `20260519120000_offer_program_code.sql`
8. `20260521120000_refresh_catalog_copy.sql`
9. `20260522120000_drop_offer_recommendation_bucket.sql`

## Updating seed data after the DB already exists

Editing an old migration file does nothing on a database that already ran it. Use one of these:

1. **Preferred:** add a new migration with `INSERT ... ON CONFLICT DO UPDATE` (see `20260521120000_refresh_catalog_copy.sql`), then `supabase db push`.
2. **Quick test:** paste the same SQL into the Supabase SQL Editor and run once.
3. **Dev only:** `supabase db reset --linked` wipes auth + app data and reapplies all migrations.

Recommendation headlines and goal-fit copy come from the API engine, not these tables. Offers are keyed by `redemption_method_code` (transfer / portal / cashback); dashboard strategies filter offers in app code. `saved_offers.recommendation_id` stores the strategy id (e.g. `MOST_EFFECTIVE`), not a catalog bucket.

Email templates for Auth live in `email-templates/`.
