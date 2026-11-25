-- SGSI LIMS v1 · Phase 5, slice C (Phase5_Build_Design.md section 12.6): the Profile's "Last changed" date, and indexes for the Audit log filters.
-- Run by the owner (the MCP declines schema changes). Safe to run twice.

-- Profile > Password shows "Last changed 12 Oct 2026"; set by POST /me/password and by the reset and invite links
alter table profiles add column if not exists password_changed_at timestamptz;

-- Audit log: the User filter (newest first) and the Record type filter (newest first); audit_at and audit_record exist already
create index if not exists audit_actor on audit_log (actor, at desc);
create index if not exists audit_table_at on audit_log (table_name, at desc);
