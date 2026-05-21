-- Tie catalog offers to a specific reward program (null = clone for each eligible program).

alter table public.redemption_offers
add column if not exists reward_program_code text references public.reward_programs(code);

create index if not exists redemption_offers_program_idx
on public.redemption_offers(reward_program_code);
