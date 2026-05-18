-- Custom goal preference + refined use-case codes (separate from future trip experiences).

alter type public.goal_preference add value if not exists 'CUSTOM';

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

alter table public.users_profile
  add column if not exists custom_goal_code public.custom_goal_code;

comment on column public.users_profile.custom_goal_code is
  'Refined redemption focus when goal_preference is CUSTOM. Not used for TRAVEL_FOCUSED trip planning (future feature).';
