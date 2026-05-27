-- Valuation catalog, transfer graph reference data, offers, and goal targets.

-- Transfer partners
insert into public.transfer_partners (code, name, type)
values
  ('united', 'United MileagePlus', 'airline'),
  ('hyatt', 'World of Hyatt', 'hotel'),
  ('flying_blue', 'Air France / KLM Flying Blue', 'airline')
on conflict (code) do update
set name = excluded.name, type = excluded.type;

-- Issuer → partner edges (1:1 baseline)
insert into public.reward_program_transfer_partners (
  reward_program_id,
  transfer_partner_id,
  transfer_ratio_num,
  transfer_ratio_den
)
select rp.id, tp.id, 1, 1
from public.reward_programs rp
cross join public.transfer_partners tp
where rp.code in ('chase_ur', 'amex_mr', 'capital_one_miles', 'citi_ty')
on conflict (reward_program_id, transfer_partner_id) do nothing;

-- Valuation rules (per program × method)
insert into public.valuation_rules (
  reward_program_id,
  redemption_method_id,
  transfer_partner_id,
  min_cpp,
  max_cpp,
  typical_cpp,
  difficulty,
  title
)
select
  rp.id,
  rm.id,
  null,
  v.min_cpp,
  v.max_cpp,
  v.typical_cpp,
  v.difficulty,
  v.title
from (
  values
    ('amex_mr', 'cashback', 0.8, 1.0, 1.0, 'easy', 'Statement credit'),
    ('amex_mr', 'portal', 1.0, 1.45, 1.3, 'easy', 'Amex Travel'),
    ('amex_mr', 'transfer', 1.4, 2.2, 2.0, 'advanced', 'Transfer partners'),
    ('chase_ur', 'cashback', 0.8, 1.0, 1.0, 'easy', 'Statement credit'),
    ('chase_ur', 'portal', 1.0, 1.4, 1.25, 'easy', 'Chase Travel'),
    ('chase_ur', 'transfer', 1.4, 2.0, 1.75, 'advanced', 'Transfer partners'),
    ('capital_one_miles', 'cashback', 0.8, 1.0, 1.0, 'easy', 'Statement credit'),
    ('capital_one_miles', 'portal', 1.0, 1.35, 1.2, 'easy', 'Capital One Travel'),
    ('capital_one_miles', 'transfer', 1.3, 1.9, 1.65, 'advanced', 'Transfer partners'),
    ('citi_ty', 'cashback', 0.8, 1.0, 1.0, 'easy', 'Statement credit'),
    ('citi_ty', 'portal', 1.0, 1.35, 1.22, 'easy', 'Citi Travel'),
    ('citi_ty', 'transfer', 1.3, 1.95, 1.7, 'advanced', 'Transfer partners'),
    ('cashback', 'cashback', 1.0, 1.0, 1.0, 'easy', 'Cash back')
) as v(program_code, method_code, min_cpp, max_cpp, typical_cpp, difficulty, title)
join public.reward_programs rp on rp.code = v.program_code
join public.redemption_methods rm on rm.code = v.method_code
on conflict do nothing;

-- Partner-specific transfer valuations
insert into public.valuation_rules (
  reward_program_id,
  redemption_method_id,
  transfer_partner_id,
  min_cpp,
  max_cpp,
  typical_cpp,
  difficulty,
  title
)
select
  rp.id,
  rm.id,
  tp.id,
  v.min_cpp,
  v.max_cpp,
  v.typical_cpp,
  'advanced',
  v.title
from (
  values
    ('chase_ur', 'united', 1.5, 2.1, 1.92, 'United saver awards'),
    ('chase_ur', 'hyatt', 1.6, 2.3, 2.05, 'Hyatt premium nights'),
    ('chase_ur', 'flying_blue', 1.4, 2.0, 1.82, 'Flying Blue promos'),
    ('amex_mr', 'united', 1.5, 2.2, 1.95, 'United saver awards'),
    ('amex_mr', 'hyatt', 1.6, 2.4, 2.1, 'Hyatt premium nights'),
    ('amex_mr', 'flying_blue', 1.4, 2.1, 1.88, 'Flying Blue promos')
) as v(program_code, partner_code, min_cpp, max_cpp, typical_cpp, title)
join public.reward_programs rp on rp.code = v.program_code
join public.redemption_methods rm on rm.code = 'transfer'
join public.transfer_partners tp on tp.code = v.partner_code
on conflict do nothing;

-- Goal redemption targets
insert into public.goal_redemption_targets (
  goal_preference,
  custom_goal_code,
  label_suffix,
  points_required,
  cash_value_usd
)
values
  ('MAX_VALUE', null, 'high-value partner redemption', 75000, 1500),
  ('KEEP_IT_SIMPLE', null, 'straightforward statement credit', 10000, 100),
  ('TRAVEL_FOCUSED', null, 'round-trip economy flight + hotel night', 55000, 1100),
  ('CASHLIKE', null, '$500+ in cash back or credits', 50000, 500)
on conflict (goal_preference) where (custom_goal_code is null) do update
set
  label_suffix = excluded.label_suffix,
  points_required = excluded.points_required,
  cash_value_usd = excluded.cash_value_usd;

insert into public.goal_redemption_targets (
  goal_preference,
  custom_goal_code,
  label_suffix,
  points_required,
  cash_value_usd
)
values
  ('CUSTOM', 'INTERNATIONAL_FLIGHTS', 'round-trip premium cabin', 88000, 3200),
  ('CUSTOM', 'LUXURY_HOTELS', '4 to 5 night premium stay', 120000, 2800),
  ('CUSTOM', 'DOMESTIC_FLIGHTS', 'domestic round-trip', 25000, 450),
  ('CUSTOM', 'FAMILY_VACATION', 'family of 4, peak week', 140000, 2400),
  ('CUSTOM', 'BUSINESS_TRAVEL', 'last-minute business fare', 45000, 900),
  ('CUSTOM', 'ALL_INCLUSIVE_RESORT', '7-night package', 100000, 2100),
  ('CUSTOM', 'CRUISE_TRAVEL', 'balcony cabin', 80000, 1800),
  ('CUSTOM', 'LAST_MINUTE_TRAVEL', 'short-notice trip', 35000, 650),
  ('CUSTOM', 'LOUNGE_AND_STATUS', 'premium card + lounge access', 60000, 1200),
  ('CUSTOM', 'EVERYDAY_OFFSET', '$1,000 in statement credits', 100000, 1000)
on conflict (custom_goal_code) where (custom_goal_code is not null) do update
set
  label_suffix = excluded.label_suffix,
  points_required = excluded.points_required,
  cash_value_usd = excluded.cash_value_usd;

-- Redemption products (valuation leaves)
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
      'product-united-saver-europe',
      'transfer',
      'united',
      'United Saver, U.S. to Europe',
      60000,
      1150.00,
      null::public.goal_preference,
      'INTERNATIONAL_FLIGHTS'::public.custom_goal_code,
      1
    ),
    (
      'product-hyatt-premium-3n',
      'transfer',
      'hyatt',
      'Hyatt premium category, 3 nights',
      75000,
      1400.00,
      null::public.goal_preference,
      'LUXURY_HOTELS'::public.custom_goal_code,
      2
    ),
    (
      'product-flying-blue-promo',
      'transfer',
      'flying_blue',
      'Flying Blue promo award',
      45000,
      820.00,
      null::public.goal_preference,
      null::public.custom_goal_code,
      3
    )
) as v(
  product_key,
  method_code,
  partner_code,
  title,
  points_required,
  cash_value_usd,
  highlight_goal_preference,
  highlight_custom_goal_code,
  sort_order
)
join public.redemption_methods rm on rm.code = v.method_code
join public.transfer_partners tp on tp.code = v.partner_code
on conflict (product_key) do update set
  title = excluded.title,
  points_required = excluded.points_required,
  cash_value_usd = excluded.cash_value_usd,
  highlight_goal_preference = excluded.highlight_goal_preference,
  highlight_custom_goal_code = excluded.highlight_custom_goal_code,
  sort_order = excluded.sort_order;

-- Offer catalog
insert into public.redemption_offers (
  offer_key,
  redemption_method_code,
  redemption_product_key,
  title,
  partner_name,
  points_required,
  estimated_cash_value_usd,
  expires_in_days,
  availability_note,
  highlight_label,
  highlight_goal_preference,
  highlight_custom_goal_code,
  sort_order
)
values
  (
    'offer-united-saver',
    'transfer',
    'product-united-saver-europe',
    'United Saver, U.S. to Europe',
    'United MileagePlus',
    60000,
    1150,
    34,
    'Saver space limited; flexible dates improve odds.',
    'Matches your focus',
    null,
    'INTERNATIONAL_FLIGHTS',
    1
  ),
  (
    'offer-hyatt-premium',
    'transfer',
    'product-hyatt-premium-3n',
    'Hyatt premium category, 3 nights',
    'World of Hyatt',
    75000,
    1400,
    72,
    'Transfer 1:1 from most bank programs; book within 24h of transfer.',
    'Matches your focus',
    null,
    'LUXURY_HOTELS',
    2
  ),
  (
    'offer-air-france-promo',
    'transfer',
    'product-flying-blue-promo',
    'Flying Blue promo award',
    'Air France / KLM',
    45000,
    820,
    12,
    'Promo ends soon. Verify logged-in pricing before transferring.',
    'Limited-time',
    null,
    null,
    3
  ),
  (
    'offer-portal-economy-rt',
    'portal',
    null,
    'Round-trip economy, bank travel portal',
    'Issuer travel portal',
    32000,
    480,
    34,
    'Pay with points at checkout; prices track cash fares.',
    null,
    null,
    null,
    1
  ),
  (
    'offer-portal-hotel-bundle',
    'portal',
    null,
    'Flight + hotel bundle',
    'Issuer travel portal',
    48000,
    720,
    72,
    'Often better than booking separately in the portal.',
    'Good fit for your goal',
    'TRAVEL_FOCUSED',
    null,
    2
  ),
  (
    'offer-portal-lastminute',
    'portal',
    null,
    'Last-minute weekend getaway',
    'Issuer travel portal',
    22000,
    330,
    12,
    'Inventory changes daily. Lock a refundable fare if unsure.',
    'Matches your focus',
    null,
    'LAST_MINUTE_TRAVEL',
    3
  ),
  (
    'offer-statement-500',
    'cashback',
    null,
    '$500 statement credit',
    'Card issuer',
    50000,
    500,
    72,
    'No blackout dates; posts in 1 to 2 billing cycles.',
    null,
    null,
    null,
    1
  ),
  (
    'offer-cash-deposit',
    'cashback',
    null,
    'Deposit to linked bank account',
    'Card issuer',
    25000,
    250,
    34,
    'Minimum redemption may apply depending on issuer.',
    null,
    null,
    null,
    2
  ),
  (
    'offer-shop-with-points',
    'cashback',
    null,
    'Shop with points, everyday purchases',
    'Card issuer',
    5000,
    50,
    12,
    'Lower value per point; useful for small offsets.',
    'Quick win',
    'CASHLIKE',
    null,
    3
  )
on conflict (offer_key) do update
set
  redemption_method_code = excluded.redemption_method_code,
  redemption_product_key = excluded.redemption_product_key,
  title = excluded.title,
  partner_name = excluded.partner_name,
  points_required = excluded.points_required,
  estimated_cash_value_usd = excluded.estimated_cash_value_usd,
  expires_in_days = excluded.expires_in_days,
  availability_note = excluded.availability_note,
  highlight_label = excluded.highlight_label,
  highlight_goal_preference = excluded.highlight_goal_preference,
  highlight_custom_goal_code = excluded.highlight_custom_goal_code,
  sort_order = excluded.sort_order;

-- Partner→partner edge (enables multi-hop path examples in valuation UI).
insert into public.partner_transfer_edges (
  from_partner_id,
  to_partner_id,
  transfer_ratio_num,
  transfer_ratio_den,
  is_active
)
select fp.id, tp.id, 1, 1, true
from public.transfer_partners fp
join public.transfer_partners tp on tp.code = 'hyatt'
where fp.code = 'united'
on conflict (from_partner_id, to_partner_id) do nothing;
