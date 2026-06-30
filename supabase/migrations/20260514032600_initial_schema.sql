-- Core schema for Points Exchange (fresh installs).

create extension if not exists "pgcrypto";

create type public.goal_preference as enum (
  'MAX_VALUE',
  'KEEP_IT_SIMPLE',
  'TRAVEL_FOCUSED',
  'CASHLIKE',
  'CUSTOM'
);

create type public.custom_goal_code as enum (
  'INTERNATIONAL_FLIGHTS',
  'LUXURY_HOTELS',
  'DOMESTIC_FLIGHTS',
  'FAMILY_VACATION',
  'BUSINESS_TRAVEL',
  'ALL_INCLUSIVE_RESORT',
  'CRUISE_TRAVEL',
  'LAST_MINUTE_TRAVEL',
  'LOUNGE_AND_STATUS',
  'EVERYDAY_OFFSET'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Users
create table public.users_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  goal_preference public.goal_preference not null default 'KEEP_IT_SIMPLE',
  custom_goal_code public.custom_goal_code,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.users_profile.custom_goal_code is
  'Refined redemption focus when goal_preference is CUSTOM.';

create trigger set_users_profile_updated_at
before update on public.users_profile
for each row
execute function public.set_updated_at();

-- Rewards reference
create table public.reward_programs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  issuer text,
  point_name text,
  is_active boolean not null default true
);

create table public.user_reward_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  reward_program_id uuid not null references public.reward_programs(id) on delete restrict,
  balance integer not null default 0 check (balance >= 0),
  source text not null default 'manual',
  last_updated_at timestamptz not null default now(),
  unique (user_id, reward_program_id)
);

create table public.redemption_methods (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  difficulty text
);

create table public.transfer_partners (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  type text
);

create table public.reward_program_transfer_partners (
  id uuid primary key default gen_random_uuid(),
  reward_program_id uuid not null references public.reward_programs(id) on delete cascade,
  transfer_partner_id uuid not null references public.transfer_partners(id) on delete cascade,
  transfer_ratio_num integer not null default 1 check (transfer_ratio_num > 0),
  transfer_ratio_den integer not null default 1 check (transfer_ratio_den > 0),
  unique (reward_program_id, transfer_partner_id)
);

create table public.valuation_rules (
  id uuid primary key default gen_random_uuid(),
  reward_program_id uuid not null references public.reward_programs(id) on delete cascade,
  redemption_method_id uuid not null references public.redemption_methods(id) on delete cascade,
  transfer_partner_id uuid references public.transfer_partners(id) on delete cascade,
  min_cpp numeric(8, 4) not null check (min_cpp >= 0),
  max_cpp numeric(8, 4) not null check (max_cpp >= min_cpp),
  typical_cpp numeric(8, 4) not null check (
    typical_cpp >= min_cpp
    and typical_cpp <= max_cpp
  ),
  difficulty text,
  title text
);

create unique index valuation_rules_direct_unique_idx
on public.valuation_rules(reward_program_id, redemption_method_id)
where transfer_partner_id is null;

create unique index valuation_rules_transfer_unique_idx
on public.valuation_rules(
  reward_program_id,
  redemption_method_id,
  transfer_partner_id
)
where transfer_partner_id is not null;

-- Valuation graph (partner→partner transfers and bonuses)
create table public.partner_transfer_edges (
  id uuid primary key default gen_random_uuid(),
  from_partner_id uuid not null references public.transfer_partners(id) on delete cascade,
  to_partner_id uuid not null references public.transfer_partners(id) on delete cascade,
  transfer_ratio_num integer not null default 1 check (transfer_ratio_num > 0),
  transfer_ratio_den integer not null default 1 check (transfer_ratio_den > 0),
  min_transfer_points integer check (min_transfer_points is null or min_transfer_points > 0),
  transfer_delay_hours integer not null default 0 check (transfer_delay_hours >= 0),
  is_active boolean not null default true,
  notes text,
  check (from_partner_id <> to_partner_id)
);

create unique index partner_transfer_edges_unique_idx
on public.partner_transfer_edges(from_partner_id, to_partner_id);

create table public.transfer_bonuses (
  id uuid primary key default gen_random_uuid(),
  reward_program_id uuid references public.reward_programs(id) on delete cascade,
  from_partner_id uuid references public.transfer_partners(id) on delete cascade,
  to_partner_id uuid not null references public.transfer_partners(id) on delete cascade,
  bonus_percent numeric(5, 2) not null check (bonus_percent > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  notes text,
  check (ends_at > starts_at),
  check (
    (
      reward_program_id is not null
      and from_partner_id is null
    )
    or (
      reward_program_id is null
      and from_partner_id is not null
    )
  )
);

comment on table public.partner_transfer_edges is
  'Curated partner→partner transfer routes for multi-hop valuation. Seed only verified edges.';

comment on table public.transfer_bonuses is
  'Time-boxed % bonus on issuer→partner or partner→partner transfers.';

-- Catalog
create table public.goal_redemption_targets (
  id uuid primary key default gen_random_uuid(),
  goal_preference public.goal_preference,
  custom_goal_code public.custom_goal_code,
  label_suffix text not null,
  points_required integer not null check (points_required > 0),
  cash_value_usd numeric(12, 2) not null check (cash_value_usd > 0),
  constraint goal_redemption_targets_goal_key check (
    (
      goal_preference is not null
      and goal_preference <> 'CUSTOM'
      and custom_goal_code is null
    )
    or (
      goal_preference = 'CUSTOM'
      and custom_goal_code is not null
    )
  )
);

create unique index goal_redemption_targets_preset_unique_idx
on public.goal_redemption_targets(goal_preference)
where custom_goal_code is null;

create unique index goal_redemption_targets_custom_unique_idx
on public.goal_redemption_targets(custom_goal_code)
where custom_goal_code is not null;

create table public.redemption_products (
  id uuid primary key default gen_random_uuid(),
  product_key text not null unique,
  redemption_method_id uuid not null references public.redemption_methods(id) on delete restrict,
  reward_program_id uuid references public.reward_programs(id) on delete cascade,
  partner_id uuid references public.transfer_partners(id) on delete cascade,
  title text not null,
  points_required integer not null check (points_required > 0),
  cash_value_usd numeric(12, 2) not null check (cash_value_usd > 0),
  highlight_goal_preference public.goal_preference,
  highlight_custom_goal_code public.custom_goal_code,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  constraint redemption_products_program_xor_partner check (
    (
      reward_program_id is not null
      and partner_id is null
    )
    or (
      reward_program_id is null
      and partner_id is not null
    )
  )
);

comment on table public.redemption_products is
  'Catalog leaves for valuation: concrete points → cash pairs.';

create table public.redemption_offers (
  id uuid primary key default gen_random_uuid(),
  offer_key text not null unique,
  redemption_method_code text not null references public.redemption_methods(code),
  reward_program_code text references public.reward_programs(code),
  redemption_product_key text references public.redemption_products(product_key) on delete set null,
  title text not null,
  partner_name text not null,
  points_required integer not null check (points_required > 0),
  estimated_cash_value_usd numeric(12, 2) not null check (estimated_cash_value_usd > 0),
  expires_in_days integer not null default 30 check (expires_in_days > 0),
  availability_note text not null,
  highlight_label text,
  highlight_goal_preference public.goal_preference,
  highlight_custom_goal_code public.custom_goal_code,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

comment on table public.redemption_offers is
  'Promotional offer templates. Grouped by redemption_method_code; strategies filter in app code.';

-- Saved offers
create table public.saved_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  offer_key text not null,
  recommendation_id text not null,
  created_at timestamptz not null default now(),
  remind_at timestamptz,
  unique (user_id, offer_key)
);

comment on table public.saved_offers is
  'User bookmarks. recommendation_id stores strategy id (e.g. MOST_EFFECTIVE).';

comment on column public.saved_offers.recommendation_id is
  'Strategy id from the recommendations engine, not a catalog bucket.';

-- Account deletion
create table public.account_deletion_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_email text,
  reason_code text not null,
  reason_detail text,
  created_at timestamptz not null default now()
);

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

-- Indexes
create index user_reward_balances_user_id_idx
on public.user_reward_balances(user_id);

create index user_reward_balances_reward_program_id_idx
on public.user_reward_balances(reward_program_id);

create index reward_program_transfer_partners_reward_program_id_idx
on public.reward_program_transfer_partners(reward_program_id);

create index reward_program_transfer_partners_transfer_partner_id_idx
on public.reward_program_transfer_partners(transfer_partner_id);

create index valuation_rules_reward_program_id_idx
on public.valuation_rules(reward_program_id);

create index valuation_rules_redemption_method_id_idx
on public.valuation_rules(redemption_method_id);

create index valuation_rules_transfer_partner_id_idx
on public.valuation_rules(transfer_partner_id);

create index partner_transfer_edges_from_idx
on public.partner_transfer_edges(from_partner_id);

create index partner_transfer_edges_to_idx
on public.partner_transfer_edges(to_partner_id);

create index transfer_bonuses_active_window_idx
on public.transfer_bonuses(starts_at, ends_at)
where is_active = true;

create index redemption_products_method_idx
on public.redemption_products(redemption_method_id);

create index redemption_products_partner_idx
on public.redemption_products(partner_id)
where partner_id is not null;

create index redemption_products_reward_program_idx
on public.redemption_products(reward_program_id)
where reward_program_id is not null;

create index redemption_offers_method_idx
on public.redemption_offers(redemption_method_code);

create index redemption_offers_program_idx
on public.redemption_offers(reward_program_code);

create index redemption_offers_product_key_idx
on public.redemption_offers(redemption_product_key)
where redemption_product_key is not null;

create index saved_offers_user_id_idx on public.saved_offers(user_id);

create index account_deletion_feedback_created_at_idx
on public.account_deletion_feedback(created_at desc);

-- RLS
alter table public.users_profile enable row level security;
alter table public.user_reward_balances enable row level security;
alter table public.reward_programs enable row level security;
alter table public.redemption_methods enable row level security;
alter table public.transfer_partners enable row level security;
alter table public.reward_program_transfer_partners enable row level security;
alter table public.valuation_rules enable row level security;
alter table public.partner_transfer_edges enable row level security;
alter table public.transfer_bonuses enable row level security;
alter table public.goal_redemption_targets enable row level security;
alter table public.redemption_products enable row level security;
alter table public.redemption_offers enable row level security;
alter table public.saved_offers enable row level security;
alter table public.account_deletion_feedback enable row level security;

create policy "Users can read their own profile"
on public.users_profile for select using (auth.uid() = id);

create policy "Users can insert their own profile"
on public.users_profile for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.users_profile for update
using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can read their own reward balances"
on public.user_reward_balances for select using (auth.uid() = user_id);

create policy "Users can insert their own reward balances"
on public.user_reward_balances for insert with check (auth.uid() = user_id);

create policy "Users can update their own reward balances"
on public.user_reward_balances for update
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete their own reward balances"
on public.user_reward_balances for delete using (auth.uid() = user_id);

create policy "Reward programs are readable"
on public.reward_programs for select using (true);

create policy "Redemption methods are readable"
on public.redemption_methods for select using (true);

create policy "Transfer partners are readable"
on public.transfer_partners for select using (true);

create policy "Reward program transfer partners are readable"
on public.reward_program_transfer_partners for select using (true);

create policy "Valuation rules are readable"
on public.valuation_rules for select using (true);

create policy "Partner transfer edges are readable"
on public.partner_transfer_edges for select using (true);

create policy "Transfer bonuses are readable"
on public.transfer_bonuses for select using (true);

create policy "Goal redemption targets are readable"
on public.goal_redemption_targets for select using (true);

create policy "Redemption products are readable"
on public.redemption_products for select using (true);

create policy "Redemption offers are readable"
on public.redemption_offers for select using (true);

create policy "Users can read their own saved offers"
on public.saved_offers for select using (auth.uid() = user_id);

create policy "Users can insert their own saved offers"
on public.saved_offers for insert with check (auth.uid() = user_id);

create policy "Users can delete their own saved offers"
on public.saved_offers for delete using (auth.uid() = user_id);

create policy "Users can submit their own deletion feedback"
on public.account_deletion_feedback for insert with check (auth.uid() = user_id);
