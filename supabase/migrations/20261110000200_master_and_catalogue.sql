-- SGSI LIMS v1 · 0200 · clients, master data, lookups, settings, parameter catalogue, services, standards, rules, templates

create table companies (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, name text not null, address text, billing_address text,
  logo_path text,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger companies_touch before update on companies for each row execute function touch_updated_at();

create table company_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  full_name text not null, position text, email text, phone text,
  is_default boolean not null default false, archived_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index company_one_default_contact on company_contacts (company_id) where is_default and archived_at is null;

create table drill_holes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  code text not null, description text, archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (company_id, code)
);
create trigger drill_holes_touch before update on drill_holes for each row execute function touch_updated_at();
create table seams (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  code text not null, description text, sort_order int, archived_at timestamptz,
  unique (company_id, code)
);
create table lithologies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  name text not null, kind text not null check (kind in ('coal','parting','no_lithology')),
  archived_at timestamptz, unique (company_id, name)
);
create table coa_files (                                                   -- outside CoA on a drill hole (section 9.7)
  id uuid primary key default gen_random_uuid(),
  drill_hole_id uuid not null references drill_holes(id) on delete cascade,
  storage_path text not null, file_name text not null, size_bytes bigint not null,
  sha256 text not null, is_current boolean not null default true,
  uploaded_by uuid references profiles(id), uploaded_at timestamptz not null default now()
);
create unique index coa_one_current on coa_files (drill_hole_id) where is_current;

create table lookups (                                                     -- C-7
  id uuid primary key default gen_random_uuid(),
  list_key text not null check (list_key in ('sample_condition','hold_reason','photo_tag','lithology_kind','send_channel','not_received_reason','sample_type')),
  value text not null, needs_remark boolean not null default false,
  sort_order int not null default 0, active boolean not null default true,
  unique (list_key, value)
);
create table app_settings (key text primary key, value jsonb not null, updated_at timestamptz not null default now()); -- C-17

-- catalogue
create table parameters (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, name text not null,
  label text not null,                                                     -- pill and column text ("AFT red.", "CSN (Crucible Swelling Number)")
  category text not null,                                                  -- Preparation, Moisture, Proximate, ... (group on the job order form)
  unit text, kind param_kind not null default 'numeric',
  measured_basis text check (measured_basis in ('ar','adb','db','daf','ash')),
  decimals int not null default 2, allows_qualifier boolean not null default false,
  typical_low numeric, typical_high numeric,                               -- C-13
  is_group boolean not null default false,                                 -- Ash analysis, Trace elements (checklists)
  is_subcontracted boolean not null default false,
  sort_order int not null default 0, active boolean not null default true
);
create table parameter_group_items (                                       -- items of a group pill (Ash analysis, Trace elements)
  id uuid primary key default gen_random_uuid(),
  parameter_id uuid not null references parameters(id) on delete cascade,
  section text not null, code text not null, is_preset boolean not null default false, sort_order int not null default 0,
  unique (parameter_id, code)
);
create table standards (
  id uuid primary key default gen_random_uuid(),
  family standard_family not null, code text not null, edition text not null, title text,
  active boolean not null default true,
  unique (family, code, edition)
);
create table methods (
  id uuid primary key default gen_random_uuid(),
  parameter_id uuid not null references parameters(id),
  standard_id uuid not null references standards(id),
  repeatability numeric, reproducibility numeric, detection_limit numeric,
  is_default boolean not null default true,
  unique (parameter_id, standard_id)
);
create table formulas (
  id uuid primary key default gen_random_uuid(),
  parameter_id uuid not null references parameters(id),
  target_basis text not null, version int not null,
  expression text not null, inputs jsonb not null,
  valid_from date not null default current_date, status text not null default 'active',
  unique (parameter_id, target_basis, version)
);
create table services (                                                    -- C-12: quick-select bundles
  id uuid primary key default gen_random_uuid(),
  code text not null, name text not null, version int not null default 1,
  status text not null default 'active' check (status in ('draft','active','retired')),
  is_default boolean not null default false, turnaround_days int not null default 5,
  sort_order int not null default 0, created_at timestamptz not null default now(),
  unique (code, version)
);
create table service_parameters (
  service_id uuid references services(id) on delete cascade,
  parameter_id uuid references parameters(id),
  primary key (service_id, parameter_id)
);
create table validation_rules (
  code text primary key, description text not null,
  parameter_id uuid references parameters(id),
  severity text not null check (severity in ('block','warn')),
  params jsonb not null default '{}', active boolean not null default true
);
create table report_templates (                                            -- C-14
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id), kind report_kind not null,
  name text not null, form_code text not null, revision int not null,
  status text not null default 'current' check (status in ('draft','current','retired')),
  since date not null default current_date, html text not null default '',
  unique (form_code, revision)
);
