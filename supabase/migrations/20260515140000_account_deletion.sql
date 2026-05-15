-- Optional feedback captured before the user deletes their account (retained after delete).
create table public.account_deletion_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_email text,
  reason_code text not null,
  reason_detail text,
  created_at timestamptz not null default now()
);

create index account_deletion_feedback_created_at_idx
on public.account_deletion_feedback(created_at desc);

alter table public.account_deletion_feedback enable row level security;

create policy "Users can submit their own deletion feedback"
on public.account_deletion_feedback
for insert
with check (auth.uid() = user_id);

-- Self-service account removal (auth.users row; public data cascades via FK).
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
