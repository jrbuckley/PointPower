-- Dev-only catalog patches (not migrations).
-- Run in Supabase SQL Editor or: supabase db query --linked -f supabase/scripts/dev-catalog-patches.sql

update public.redemption_offers
set availability_note = 'Promo ends soon. Confirm pricing in your Flying Blue account before transferring.'
where offer_key = 'offer-air-france-promo';
