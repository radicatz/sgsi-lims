-- SGSI LIMS v1 · 0300 · job orders, batches, samples, results, reports

create table job_orders (                                                  -- C-3
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  company_id uuid not null references companies(id),
  contact_id uuid references company_contacts(id),
  client_reference text,                                                   -- PO or client letter number
  service_id uuid references services(id),                                -- the quick select used, with its version
  standards standard_family[] not null default '{ASTM}' check (cardinality(standards) >= 1),
  preparation boolean not null default true,
  expected_samples int check (expected_samples >= 0),
  sample_type text, due_on date, priority text not null default 'Standard', notes text,
  signatory_id uuid references profiles(id), signatory_name text, signatory_title text,  -- default signatory
  status order_status not null default 'draft',
  cso_id uuid references profiles(id),
  submitted_at timestamptz, closed_at timestamptz, cancelled_at timestamptz, cancel_reason text,
  attributes jsonb not null default '{}',
  created_by uuid references profiles(id), created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger job_orders_touch before update on job_orders for each row execute function touch_updated_at();
create table job_order_parameters (                                        -- the job order's own parameter set
  job_order_id uuid references job_orders(id) on delete cascade,
  parameter_id uuid references parameters(id),
  primary key (job_order_id, parameter_id)
);
create table job_order_group_items (                                       -- C-3: chosen items of Ash analysis, Trace elements
  job_order_id uuid references job_orders(id) on delete cascade,
  item_id uuid references parameter_group_items(id),
  primary key (job_order_id, item_id)
);
create table job_order_files (
  id uuid primary key default gen_random_uuid(),
  job_order_id uuid not null references job_orders(id) on delete cascade,
  storage_path text not null, file_name text not null, size_bytes bigint not null, sha256 text not null,
  uploaded_by uuid references profiles(id), uploaded_at timestamptz not null default now()
);

create table batches (                                                     -- C-2
  id uuid primary key default gen_random_uuid(),
  job_order_id uuid not null references job_orders(id),
  company_id uuid not null references companies(id),                      -- copied from the job order for filters
  batch_no text not null unique, batch_date date not null, deadline_on date,
  standard standard_family not null,
  coc_no text, priority text not null default 'Standard', notes text,
  status batch_status not null default 'created',
  reception_confirmed_at timestamptz, reception_confirmed_by uuid references profiles(id), expected_at_confirm int,
  prep_finished_at timestamptz,     prep_finished_by uuid references profiles(id),
  analysis_started_at timestamptz,  analysis_started_by uuid references profiles(id),
  analysis_finished_at timestamptz, analysis_finished_by uuid references profiles(id),
  completed_at timestamptz,         completed_by uuid references profiles(id),
  created_by uuid references profiles(id), created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (batch_no ~ '^B-[0-9]{4}-[0-9]{4}$'),                              -- default format until the lab fixes it (D-45)
  check (deadline_on is null or deadline_on >= batch_date)
);
create trigger batches_touch before update on batches for each row execute function touch_updated_at();
create table batch_parameters (                                            -- C-2: a batch can add or drop parameters
  batch_id uuid references batches(id) on delete cascade,
  parameter_id uuid references parameters(id),
  primary key (batch_id, parameter_id)
);
create table batch_documents (                                             -- the lab's signed RoA (D-49)
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references batches(id) on delete cascade,
  kind text not null default 'signed_roa' check (kind in ('signed_roa')),
  roa_no text not null unique, storage_path text not null, file_name text not null, size_bytes bigint not null, sha256 text not null,
  uploaded_by uuid references profiles(id), uploaded_at timestamptz not null default now(),
  unique (batch_id, kind)
);
create table batch_status_log (
  id bigint generated always as identity primary key,
  batch_id uuid not null references batches(id) on delete cascade,
  from_status batch_status, to_status batch_status not null,
  action text not null, note text,
  by_user uuid references profiles(id), at timestamptz not null default now()
);

create table samples (                                                     -- C-4
  id uuid primary key default gen_random_uuid(),
  job_order_id uuid not null references job_orders(id) on delete cascade,
  row_no int not null,
  sample_ref text not null,                                                -- Sample ID from the client
  client_description text, sample_type text, remarks text,
  drill_hole_text text, depth_from numeric(8,2), depth_to numeric(8,2),    -- as registered by the CSO
  batch_id uuid references batches(id),
  lab_code text,
  released_from_batch_id uuid references batches(id), released_at timestamptz, released_by uuid references profiles(id),  -- Awaiting arrival (D-41)
  not_received_reason text, not_received_note text, not_received_by uuid references profiles(id), not_received_at timestamptz,
  arrived_at timestamptz, arrived_by uuid references profiles(id),
  mass_received_kg numeric(10,3), condition text, condition_remark text,
  label_status text not null default 'none' check (label_status in ('none','printed')), label_print_count int not null default 0,
  on_hold boolean not null default false, hold_reason text,
  received_at timestamptz, received_by uuid references profiles(id),      -- stamped by Confirm reception
  attributes jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (job_order_id, sample_ref),
  unique (job_order_id, row_no),
  check (depth_to is null or depth_from is null or depth_to > depth_from)
);
create trigger samples_touch before update on samples for each row execute function touch_updated_at();
create unique index samples_lab_code_uq on samples (lab_code) where lab_code is not null;
create table sample_attachments (                                          -- photos at reception (D-48)
  id uuid primary key default gen_random_uuid(),
  sample_id uuid not null references samples(id) on delete cascade,
  tag text not null default 'Other',
  storage_path text not null, file_name text not null, size_bytes bigint not null, sha256 text not null,
  taken_by uuid references profiles(id), taken_at timestamptz not null default now()
);
create table sample_intervals (                                            -- C-5: created when matched to master data
  sample_id uuid primary key references samples(id) on delete cascade,
  drill_hole_id uuid not null references drill_holes(id),
  seam_id uuid references seams(id),
  lithology_id uuid references lithologies(id),
  depth_from numeric(8,2) not null, depth_to numeric(8,2) not null,
  check (depth_to > depth_from)
);

-- results: one final value per sample and parameter in v1 (D-47); ADL is parameter 'ADL' (C-6)
create table analyses (
  id uuid primary key default gen_random_uuid(),
  sample_id uuid not null references samples(id) on delete cascade,
  parameter_id uuid not null references parameters(id),
  round int not null default 1,
  method_id uuid references methods(id),
  source analysis_source not null default 'entered',
  status analysis_status not null default 'entered',                       -- 'verified' = frozen by Complete batch (C-10)
  entered_by uuid references profiles(id), entered_at timestamptz not null default now(),
  comment text,
  unique (sample_id, parameter_id, round)
);
create table analysis_values (
  analysis_id uuid references analyses(id) on delete cascade,
  basis text not null,
  value_num numeric, qualifier text check (qualifier in ('<','>')), value_text text,
  is_primary boolean not null default false,
  formula_id uuid references formulas(id),
  primary key (analysis_id, basis)
);
create unique index one_primary on analysis_values (analysis_id) where is_primary;

-- reports: the CoA in v1 (C-9)
create table reports (
  id uuid primary key default gen_random_uuid(),
  kind report_kind not null default 'coa',
  job_order_id uuid not null references job_orders(id),
  revision int not null default 1, status report_status not null default 'draft',
  report_no text unique,                                                   -- assigned on publish: CoA-{job order}-{revision}
  template_id uuid references report_templates(id),
  bases text[] not null default '{adb,ar}', parameter_ids uuid[] not null default '{}',
  attention_contact_id uuid references company_contacts(id), client_reference text,
  storage_path text, sha256 text, payload jsonb,
  signatory_id uuid references profiles(id), signatory_name text, signatory_title text, signatory_set_by uuid references profiles(id),
  drafted_by uuid references profiles(id), created_at timestamptz not null default now(),
  issued_by uuid references profiles(id), issued_at timestamptz,
  revision_reason text, superseded_at timestamptz,
  void_reason text, voided_by uuid references profiles(id), voided_at timestamptz
);
create unique index reports_one_draft on reports (job_order_id) where status = 'draft';
create table report_sources (                                              -- C-9: the completed batches a CoA is built from
  report_id uuid references reports(id) on delete cascade,
  batch_id uuid references batches(id),
  primary key (report_id, batch_id)
);
create table report_deliveries (                                           -- C-8
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id),
  sent_on date not null, channels text[] not null check (cardinality(channels) >= 1),
  recipient text not null, note text,
  by_user uuid references profiles(id), at timestamptz not null default now()
);
create table signatory_rules (                                             -- per-client default that pre-fills the signatory (D-41)
  id uuid primary key default gen_random_uuid(),
  kind report_kind not null default 'coa', company_id uuid references companies(id),
  signatory_id uuid references profiles(id), signatory_name text, signatory_title text,
  priority int not null default 100, active boolean not null default true,
  check (signatory_id is not null or signatory_name is not null)
);

-- support
create table notifications (                                               -- C-16
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  event text not null, icon text, title text not null, body text, link text,
  created_at timestamptz not null default now(), read_at timestamptz
);
create table saved_queries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade, name text not null,
  target text not null check (target in ('job_order','batch','sample','result')),
  definition jsonb not null, shared boolean not null default false,
  created_at timestamptz not null default now()
);
create table audit_log (                                                   -- C-15
  id bigint generated always as identity primary key,
  table_name text not null, record_id text not null, record_label text,
  action text not null, before jsonb, after jsonb,
  actor uuid, actor_name text, screen text, request_id text,
  at timestamptz not null default now()
);

-- indexes (spec 13.4)
create index batches_filter on batches (company_id, status, deadline_on);
create index batches_order on batches (job_order_id);
create index samples_batch on samples (batch_id);
create index samples_order on samples (job_order_id);
create index analyses_sample on analyses (sample_id, round);
create index audit_record on audit_log (table_name, record_id, at desc);
create index audit_at on audit_log (at desc);
create index notifications_user on notifications (user_id, read_at);
create index job_orders_filter on job_orders (company_id, status, due_on);
create index reports_order on reports (job_order_id, status);
