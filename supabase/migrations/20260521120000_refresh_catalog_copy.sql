-- Refresh seeded catalog copy (safe to re-run; upserts by natural keys).

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

insert into public.redemption_offers (
  offer_key,
  recommendation_id,
  redemption_method_code,
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
    'BEST_VALUE',
    'transfer',
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
    'BEST_VALUE',
    'transfer',
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
    'BEST_VALUE',
    'transfer',
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
    'BEST_FOR_TRAVEL',
    'portal',
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
    'BEST_FOR_TRAVEL',
    'portal',
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
    'BEST_FOR_TRAVEL',
    'portal',
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
    'EASIEST',
    'cashback',
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
    'EASIEST',
    'cashback',
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
    'EASIEST',
    'cashback',
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
  recommendation_id = excluded.recommendation_id,
  redemption_method_code = excluded.redemption_method_code,
  title = excluded.title,
  partner_name = excluded.partner_name,
  points_required = excluded.points_required,
  estimated_cash_value_usd = excluded.estimated_cash_value_usd,
  expires_in_days = excluded.expires_in_days,
  availability_note = excluded.availability_note,
  highlight_label = excluded.highlight_label,
  highlight_goal_preference = excluded.highlight_goal_preference,
  highlight_custom_goal_code = excluded.highlight_custom_goal_code,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
