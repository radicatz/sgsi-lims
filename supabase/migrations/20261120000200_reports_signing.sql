-- SGSI LIMS v1 · C-21 part 2 of 2 · phase 4 (Reports_Build_Design.md section 8). Run by the owner in the SQL editor, AFTER part 1.

-- reports: contents, print count, the footer code and who signed with which images
alter table reports
  add column if not exists remarks text,
  add column if not exists print_count int not null default 0,
  add column if not exists last_printed_at timestamptz,
  add column if not exists verify_code text,
  add column if not exists page_count int,
  add column if not exists template_revision int,
  add column if not exists supersedes_id uuid references reports(id),
  add column if not exists sent_for_signature_by uuid references profiles(id),
  add column if not exists sent_for_signature_at timestamptz,
  add column if not exists signed_by uuid references profiles(id),
  add column if not exists signed_at timestamptz,
  add column if not exists on_behalf_of text,
  add column if not exists signature_sha256 text,
  add column if not exists stamp_sha256 text,
  add column if not exists return_comment text,
  add column if not exists returned_by uuid references profiles(id),
  add column if not exists returned_at timestamptz;

-- one open CoA (draft or awaiting signature) per job order; a revision number is used once per job order
drop index if exists reports_one_draft;
create unique index reports_one_open on reports (job_order_id) where status in ('draft', 'awaiting_signature');
create unique index reports_revision_uq on reports (job_order_id, revision) where kind = 'coa';

-- the client's default bases for the next CoA (the default signatory is already in signatory_rules)
alter table companies add column if not exists coa_bases text[];

-- signatures (one per signatory) and the lab stamp. Replaced images are retired, not deleted, so older certificates stay checkable.
create table signing_assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('signature', 'stamp')),
  user_id uuid references profiles(id),
  storage_path text not null, sha256 text not null, size_bytes bigint not null,
  set_by uuid references profiles(id), set_at timestamptz not null default now(),
  retired_at timestamptz,
  check ((kind = 'signature') = (user_id is not null))
);
create unique index signing_assets_one_active on signing_assets (kind, coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) where retired_at is null;
alter table signing_assets enable row level security;   -- no policy: only the API (service connection) reads the images, so a signature never leaks
create trigger signing_assets_audit after insert or update or delete on signing_assets for each row execute function audit_row();

-- permission: the Manager uploads the lab stamp
select set_config('app.skip_audit', 'on', true);
insert into permissions (code, description) values ('signing.stamp', 'Upload the lab stamp') on conflict (code) do nothing;
insert into role_permissions (role_id, permission_code)
select r.id, 'signing.stamp' from roles r where r.code = 'manager'
on conflict do nothing;

-- reports are readable by their holders: a draft only by the Lab admin side (report.publish); a CoA waiting for signature also by its signatory
drop policy if exists reports_read on reports;
create policy reports_read on reports for select to authenticated using (
  case when status = 'draft' then has_permission('report.publish')
       when status = 'awaiting_signature' then has_permission('report.publish') or signatory_id = auth.uid()
       else has_any_permission(array['coa.download', 'report.publish']) end);

-- fixed carbon prints the proximate practice of each standard (spec 9.8 and the lab's sample CoA: ASTM D3172)
insert into standards (family, code, edition, title) values
  ('ASTM', 'D3172', '2013', 'Proximate analysis of coal'), ('ISO', '17246', '2010', 'Proximate analysis'), ('GBT', '212', '2008', 'Proximate analysis of coal')
on conflict (family, code, edition) do nothing;
insert into methods (parameter_id, standard_id)
select p.id, s.id from parameters p, standards s
where p.code = 'FC' and ((s.family = 'ASTM' and s.code = 'D3172') or (s.family = 'ISO' and s.code = '17246') or (s.family = 'GBT' and s.code = '212'))
on conflict (parameter_id, standard_id) do nothing;

-- private buckets: the stored certificates and the signature and stamp images. Only the API (service role) reads and writes them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('reports', 'reports', false, 10485760, array['application/pdf']),
  ('signing', 'signing', false, 1048576, array['image/png'])
on conflict (id) do nothing;
