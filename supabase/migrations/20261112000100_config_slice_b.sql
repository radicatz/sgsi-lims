-- SGSI LIMS v1 · 0900 · C-19 Configuration slice B: versioned services, method editions, versioned report templates
-- (Configuration_Slice_B_Plan.md section 4). Run by the owner in the SQL editor, then verified with execute_sql.

-- services: who changed a version, a note, and the version rules held by the database
alter table services
  add column if not exists created_by uuid references profiles(id),
  add column if not exists note text;
create unique index if not exists services_one_active on services (code) where status = 'active';
create unique index if not exists services_one_draft  on services (code) where status = 'draft';
create unique index if not exists services_one_default on services ((true)) where is_default and status = 'active';

-- report templates: the text fields apart from the layout (R-10), a note per version, who and when
alter table report_templates
  add column if not exists fields jsonb not null default '{}'::jsonb,
  add column if not exists note text,
  add column if not exists created_by uuid references profiles(id),
  add column if not exists created_at timestamptz not null default now();
alter table report_templates drop constraint if exists report_templates_form_code_revision_key;
alter table report_templates add constraint report_templates_revision_uq unique nulls not distinct (kind, company_id, revision);
create unique index if not exists report_templates_one_current on report_templates (kind, coalesce(company_id, '00000000-0000-0000-0000-000000000000'::uuid)) where status = 'current';
create unique index if not exists report_templates_one_draft   on report_templates (kind, coalesce(company_id, '00000000-0000-0000-0000-000000000000'::uuid)) where status = 'draft';

update report_templates
set fields = jsonb_build_object(
      'title', 'Certificate of Analysis',
      'statement', 'Samples were prepared and analysed in accordance with the methods listed. The results relate to the samples as received.',
      'terms', 'This certificate may not be reproduced except in full.'),
    note = coalesce(note, 'First version in the system')
where kind = 'coa' and form_code = 'FM-LAB-014' and revision = 3 and fields = '{}'::jsonb;
