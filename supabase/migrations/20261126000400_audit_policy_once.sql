-- Audit log: check the reader's permission once per query, not once per row (owner feedback Nov 26, 2026).
-- has_permission() is security definer, so Postgres cannot inline it and ran it for every audit row: with about 15,600 rows a read took 1.1 s
-- against 0.3 s without the check, and the Audit log page made two reads (the count and the page), so a sample's log took 4 s to open.
-- Wrapped in a sub-select, the call runs once per statement (an InitPlan). Who may read is unchanged: people whose roles have audit.read.
drop policy if exists audit_read on audit_log;
create policy audit_read on audit_log for select to authenticated using ((select has_permission('audit.read')));
