-- SGSI LIMS v1 · 0800 · C-18 sample identifiers (spec 6.1, D-51)
-- Sample ID SG.YYMMDD.CCC.BB.NNN and sample code CCC.BB.NNN.Lotxx replace the lab code; the client's own name is the client reference.

-- samples
alter table samples rename column sample_ref to client_ref;
alter table samples rename column lab_code to sample_no;
alter index samples_lab_code_uq rename to samples_sample_no_uq;
alter table samples add column sample_code text, add column lot text not null default 'Lot01';
comment on column samples.client_ref is 'The client''s own name for the sample (e.g. BNM-3507); unique within a job order';
comment on column samples.sample_no is 'Sample ID SG.YYMMDD.CCC.BB.NNN, generated at Confirm reception';

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

-- companies: a 3-digit company code, the next free number, locked after the first received sample
alter table companies add column company_code text;
update companies c set company_code = lpad(n::text, 3, '0')
  from (select id, row_number() over (order by created_at, code) as n from companies) x where x.id = c.id;
alter table companies alter column company_code set not null, add constraint companies_company_code_fmt check (company_code ~ '^[0-9]{3}$'),
  add constraint companies_company_code_uq unique (company_code);

create or replace function companies_code_assign() returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.company_code is null then
    select lpad(n::text, 3, '0') into new.company_code from generate_series(1, 999) n
      where lpad(n::text, 3, '0') not in (select company_code from companies) order by n limit 1;
    if new.company_code is null then raise exception 'All 999 company codes are used.'; end if;
  end if;
  if tg_op = 'UPDATE' and new.company_code is distinct from old.company_code and exists (
       select 1 from samples s join job_orders j on j.id = s.job_order_id where j.company_id = old.id and s.received_at is not null) then
    raise exception 'The company code is locked: this client already has received samples.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger companies_code before insert or update of company_code on companies for each row execute function companies_code_assign();

-- batches belong to one branch office
alter table batches add column branch_code text not null default 'RI' check (branch_code ~ '^[A-Z]{2}$');

-- running numbers per company, branch and day (Confirm reception calls next_sample_no)
create table sample_counters (
  company_id uuid not null references companies(id), branch_code text not null, day date not null, last int not null,
  primary key (company_id, branch_code, day)
);
alter table sample_counters enable row level security;
create policy sample_counters_read on sample_counters for select to authenticated using (is_staff());

create or replace function next_sample_no(p_company uuid, p_branch text, p_day date) returns int
language plpgsql security definer set search_path = public as $$
declare
  width int := coalesce((select (value->>'sample_no_width')::int from app_settings where key = 'numbering'), 3);
  n int;
begin
  if not has_permission('sample.receive') then raise exception 'Not allowed to number samples.' using errcode = '42501'; end if;
  insert into sample_counters as c (company_id, branch_code, day, last) values (p_company, p_branch, p_day, 1)
    on conflict (company_id, branch_code, day) do update set last = c.last + 1 returning last into n;
  if n >= power(10, width) then
    raise exception 'The running number for this client and day has reached %. Ask the Superadmin to widen the Sample ID number.', power(10, width) - 1 using errcode = 'P0001';
  end if;
  return n;
end $$;
revoke execute on function next_sample_no(uuid, text, date) from public, anon;
grant execute on function next_sample_no(uuid, text, date) to authenticated;

-- settings: branch offices, the new numbering patterns
update app_settings set value = value || '{"branches":[{"code":"RI","name":"Rapak Indah"}]}'::jsonb where key = 'laboratory';
update app_settings set value = (value - 'lab_code') || '{"sample_id":"SG.{YYMMDD}.{CCC}.{BB}.{NNN}","sample_code":"{CCC}.{BB}.{NNN}.{LOT}","sample_no_width":3}'::jsonb where key = 'numbering';

-- audit label: the Sample ID, else the client reference
create or replace function audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  b jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  a jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  uid uuid := auth.uid();
begin
  if current_setting('app.skip_audit', true) = 'on' then return coalesce(new, old); end if;   -- reference seeds only
  if tg_op = 'UPDATE' and b - 'updated_at' = a - 'updated_at' then return new; end if;   -- nothing really changed
  insert into audit_log (table_name, record_id, record_label, action, before, after, actor, actor_name, screen, request_id)
  values (
    tg_table_name,
    coalesce(r->>'id', r->>'key', r->>'code', md5(r::text)),
    coalesce(r->>'order_no', r->>'batch_no', r->>'sample_no', r->>'client_ref', r->>'report_no', r->>'roa_no', r->>'code', r->>'email', r->>'name', r->>'full_name', r->>'key', r->>'value'),
    lower(tg_op), b, a, uid,
    (select full_name from profiles where id = uid),
    nullif(current_setting('app.screen', true), ''),
    nullif(current_setting('app.request_id', true), ''));
  return coalesce(new, old);
end $$;
