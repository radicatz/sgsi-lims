-- Phase 5, slice B (Phase5_Build_Design.md section 10): fast "contains" matching for quick search and the results page.
-- Trigram indexes on every ID column search matches, so typing "0417" or "bnm-35" stays fast as the tables grow.
-- Run once by the owner (the MCP declines schema changes). Safe to run again.

create extension if not exists pg_trgm with schema extensions;

create index if not exists samples_sample_no_trgm   on samples      using gin (lower(sample_no)   extensions.gin_trgm_ops);
create index if not exists samples_sample_code_trgm on samples      using gin (lower(sample_code) extensions.gin_trgm_ops);
create index if not exists samples_client_ref_trgm  on samples      using gin (lower(client_ref)  extensions.gin_trgm_ops);
create index if not exists samples_drill_hole_trgm  on samples      using gin (lower(drill_hole_text) extensions.gin_trgm_ops);
create index if not exists batches_no_trgm          on batches      using gin (lower(batch_no)    extensions.gin_trgm_ops);
create index if not exists job_orders_no_trgm       on job_orders   using gin (lower(order_no)    extensions.gin_trgm_ops);
create index if not exists job_orders_ref_trgm      on job_orders   using gin (lower(client_reference) extensions.gin_trgm_ops);
create index if not exists drill_holes_code_trgm    on drill_holes  using gin (lower(code)        extensions.gin_trgm_ops);
create index if not exists reports_no_trgm          on reports      using gin (lower(report_no)   extensions.gin_trgm_ops);
create index if not exists batch_documents_roa_trgm on batch_documents using gin (lower(roa_no)   extensions.gin_trgm_ops);
create index if not exists companies_name_trgm      on companies    using gin (lower(name)        extensions.gin_trgm_ops);

-- saved queries: the list per owner, and the shared ones
create index if not exists saved_queries_owner on saved_queries (owner_id, created_at desc);
create index if not exists saved_queries_shared on saved_queries (shared) where shared;
