-- Saved offer bookmarks (reference offer_key + recommendation path; live data resolved at read time).

create table public.saved_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  offer_key text not null,
  recommendation_id text not null,
  created_at timestamptz not null default now(),
  remind_at timestamptz,
  unique (user_id, offer_key)
);

create index saved_offers_user_id_idx on public.saved_offers(user_id);

comment on table public.saved_offers is
  'User bookmarks for redemption offers. Stores stable keys only; points/coverage/expiry are resolved dynamically.';

alter table public.saved_offers enable row level security;

create policy "Users can read their own saved offers"
on public.saved_offers
for select
using (auth.uid() = user_id);

create policy "Users can insert their own saved offers"
on public.saved_offers
for insert
with check (auth.uid() = user_id);

create policy "Users can delete their own saved offers"
on public.saved_offers
for delete
using (auth.uid() = user_id);
