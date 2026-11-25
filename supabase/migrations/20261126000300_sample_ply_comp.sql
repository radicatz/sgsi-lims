-- SGSI LIMS v1 · Ply or composite per sample (spec section 10 Information columns "Ply/Comp*", SIM Lab Input and Review ROA; Open_Points_Check_Nov25.md M-1).
-- Entered on the job order's Samples tab (typed, pasted or imported); the Dashboard's Sample type mix groups by it. Empty until someone sets it. Run by the owner. Safe to run twice.
alter table samples add column if not exists ply_comp text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'samples_ply_comp_check') then
    alter table samples add constraint samples_ply_comp_check check (ply_comp in ('ply', 'comp'));
  end if;
end $$;

-- v_samples fixes its column list when it is created, so it is rebuilt to carry ply_comp (same definition as 20261110000800; nothing depends on it)
drop view if exists v_samples;
create view v_samples with (security_invoker = true) as
select s.*,
  case
    when s.not_received_at is not null then 'not_received'
    when s.batch_id is null and s.released_from_batch_id is not null then 'awaiting_arrival'
    when s.batch_id is null then 'expected'
    when s.on_hold then 'held'
    when s.received_at is not null then 'received'
    else 'in_batch'
  end as state
from samples s;
