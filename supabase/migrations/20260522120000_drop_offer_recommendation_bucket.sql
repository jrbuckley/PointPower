-- Offers are grouped by redemption_method_code; dashboard strategies filter in app code.

drop index if exists public.redemption_offers_recommendation_idx;

alter table public.redemption_offers
drop column if exists recommendation_id;
