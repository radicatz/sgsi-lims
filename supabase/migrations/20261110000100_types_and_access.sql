-- SGSI LIMS v1 · 0100 · types, roles, permissions, profiles, access helpers
-- Source: spec 13.3 with the v1 changes C-1 to C-17 (V1_Build_Plan.md section 3).

create extension if not exists pgcrypto with schema extensions;

-- enums only where code branches on the value
create type batch_status    as enum ('created','receiving','preparation','prep_finished','analysis','analysis_finished','completed'); -- C-1
create type order_status    as enum ('draft','awaiting_samples','in_progress','reported','delivered','closed','cancelled');
create type analysis_source as enum ('entered','imported','calculated');
create type analysis_status as enum ('entered','verified','superseded');
create type param_kind      as enum ('numeric','calculated','text','list');
create type report_kind     as enum ('roa','coa');
create type report_status   as enum ('draft','issued','superseded','void');                                   -- C-9 (v1 CoA states)
create type standard_family as enum ('ASTM','ISO','GBT');

-- access
create table roles (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, name text not null, description text,
  is_system boolean not null default true, sort_order int not null default 0
);
create table permissions (code text primary key, description text not null);
create table role_permissions (
  role_id uuid references roles(id) on delete cascade,
  permission_code text references permissions(code) on delete cascade,
  primary key (role_id, permission_code)
);

create table profiles (                                                    -- C-11
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique, full_name text not null,
  title text, phone text,
  status text not null default 'invited' check (status in ('invited','active','inactive','locked')),
  failed_attempts int not null default 0, locked_until timestamptz,
  invited_at timestamptz, invite_expires_at timestamptz, last_sign_in_at timestamptz,
  prefs jsonb not null default '{}',                                       -- sidebar, start page, notification switches
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table user_roles (                                                  -- several roles per user (D-02)
  user_id uuid references profiles(id) on delete cascade,
  role_id uuid references roles(id) on delete cascade,
  primary key (user_id, role_id)
);

-- helpers used by policies and functions
create or replace function has_permission(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles ur
    join role_permissions rp on rp.role_id = ur.role_id
    join profiles pr on pr.id = ur.user_id and pr.status = 'active'
    where ur.user_id = auth.uid() and rp.permission_code = p)
$$;
create or replace function has_any_permission(ps text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles ur
    join role_permissions rp on rp.role_id = ur.role_id
    join profiles pr on pr.id = ur.user_id and pr.status = 'active'
    where ur.user_id = auth.uid() and rp.permission_code = any(ps))
$$;
create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and status = 'active')
$$;
create or replace function my_permissions() returns text[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(distinct rp.permission_code order by rp.permission_code), '{}')
  from user_roles ur join role_permissions rp on rp.role_id = ur.role_id
  where ur.user_id = auth.uid()
$$;

-- updated_at keeper
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger profiles_touch before update on profiles for each row execute function touch_updated_at();
