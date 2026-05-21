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

Email templates for Auth live in `email-templates/`.
