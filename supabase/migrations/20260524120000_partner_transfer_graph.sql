-- Phase 3: partner→partner transfer graph and time-boxed transfer bonuses.

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

create index partner_transfer_edges_from_idx
  on public.partner_transfer_edges(from_partner_id);

create index partner_transfer_edges_to_idx
  on public.partner_transfer_edges(to_partner_id);

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

create index transfer_bonuses_active_window_idx
  on public.transfer_bonuses(starts_at, ends_at)
  where is_active = true;

comment on table public.partner_transfer_edges is
  'Curated partner→partner transfer routes for multi-hop valuation (Phase 3). Seed only verified edges.';

comment on table public.transfer_bonuses is
  'Time-boxed % bonus on issuer→partner or partner→partner transfers. Applied at valuation time when starts_at <= now <= ends_at.';

alter table public.partner_transfer_edges enable row level security;
alter table public.transfer_bonuses enable row level security;

create policy "Partner transfer edges are readable"
on public.partner_transfer_edges
for select
using (true);

create policy "Transfer bonuses are readable"
on public.transfer_bonuses
for select
using (true);
