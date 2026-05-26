-- Phase 2: named redemption leaves (award/credit templates) for valuation and optional offer linkage.

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

create index redemption_products_method_idx
on public.redemption_products(redemption_method_id);

create index redemption_products_partner_idx
on public.redemption_products(partner_id)
where partner_id is not null;

create index redemption_products_reward_program_idx
on public.redemption_products(reward_program_id)
where reward_program_id is not null;

comment on table public.redemption_products is
  'Catalog leaves for deterministic valuation: concrete points → cash pairs. Transfer products use partner_id; issuer-only products use reward_program_id (portal/cashback).';

alter table public.redemption_offers
  add column if not exists redemption_product_key text references public.redemption_products(product_key) on delete set null;

create index redemption_offers_product_key_idx
on public.redemption_offers(redemption_product_key)
where redemption_product_key is not null;

-- Seed transfer partner products (matches typical offer rows; abstract rules may still cap higher).
insert into public.redemption_products (
  product_key,
  redemption_method_id,
  partner_id,
  title,
  points_required,
  cash_value_usd,
  highlight_goal_preference,
  highlight_custom_goal_code,
  sort_order
)
select
  v.product_key,
  rm.id,
  tp.id,
  v.title,
  v.points_required,
  v.cash_value_usd,
  v.highlight_goal_preference,
  v.highlight_custom_goal_code,
  v.sort_order
from (
  values
    (
      'product-united-saver-europe'::text,
      'transfer'::text,
      'united'::text,
      'United Saver, U.S. to Europe'::text,
      60000::integer,
      1150.00::numeric,
      null::public.goal_preference,
      'INTERNATIONAL_FLIGHTS'::public.custom_goal_code,
      1::integer
    ),
    (
      'product-hyatt-premium-3n'::text,
      'transfer'::text,
      'hyatt'::text,
      'Hyatt premium category, 3 nights'::text,
      75000::integer,
      1400.00::numeric,
      null::public.goal_preference,
      'LUXURY_HOTELS'::public.custom_goal_code,
      2::integer
    ),
    (
      'product-flying-blue-promo'::text,
      'transfer'::text,
      'flying_blue'::text,
      'Flying Blue promo award'::text,
      45000::integer,
      820.00::numeric,
      null::public.goal_preference,
      null::public.custom_goal_code,
      3::integer
    )
) as v(product_key, method_code, partner_code, title, points_required, cash_value_usd, highlight_goal_preference, highlight_custom_goal_code, sort_order)
join public.redemption_methods rm on rm.code = v.method_code
join public.transfer_partners tp on tp.code = v.partner_code
on conflict (product_key) do update set
  title = excluded.title,
  points_required = excluded.points_required,
  cash_value_usd = excluded.cash_value_usd,
  highlight_goal_preference = excluded.highlight_goal_preference,
  highlight_custom_goal_code = excluded.highlight_custom_goal_code,
  sort_order = excluded.sort_order;

update public.redemption_offers ro
set redemption_product_key = p.product_key
from public.redemption_products p
where ro.offer_key = 'offer-united-saver' and p.product_key = 'product-united-saver-europe';

update public.redemption_offers ro
set redemption_product_key = p.product_key
from public.redemption_products p
where ro.offer_key = 'offer-hyatt-premium' and p.product_key = 'product-hyatt-premium-3n';

update public.redemption_offers ro
set redemption_product_key = p.product_key
from public.redemption_products p
where ro.offer_key = 'offer-air-france-promo' and p.product_key = 'product-flying-blue-promo';

alter table public.redemption_products enable row level security;

create policy "Redemption products are readable"
on public.redemption_products
for select
using (true);

