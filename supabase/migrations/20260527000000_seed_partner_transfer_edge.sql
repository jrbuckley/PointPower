-- Example partner→partner hop for multi-step transfer path UI (United → Hyatt).

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
