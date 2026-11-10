-- SGSI LIMS v1 · 0400 · audit trigger, derived views, row-level security
-- The web app only talks to the API (Stack_Decision_Record S-6). The API runs each request as the signed-in user,
-- so these policies are the second line of defence; the API checks the same permission codes first.

-- ---------- audit (D-29, C-15) ----------
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
    coalesce(r->>'order_no', r->>'batch_no', r->>'sample_ref', r->>'report_no', r->>'roa_no', r->>'code', r->>'email', r->>'name', r->>'full_name', r->>'key', r->>'value'),
    lower(tg_op), b, a, uid,
    (select full_name from profiles where id = uid),
    nullif(current_setting('app.screen', true), ''),
    nullif(current_setting('app.request_id', true), ''));
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','user_roles','role_permissions','companies','company_contacts','drill_holes','seams','lithologies','coa_files',
    'lookups','app_settings','parameters','parameter_group_items','standards','methods','formulas','services','service_parameters',
    'validation_rules','report_templates','job_orders','job_order_parameters','job_order_group_items','job_order_files',
    'batches','batch_parameters','batch_documents','samples','sample_attachments','sample_intervals','analyses','analysis_values',
    'reports','report_sources','report_deliveries','signatory_rules','saved_queries']
  loop
    execute format('create trigger %I after insert or update or delete on %I for each row execute function audit_row()', t || '_audit', t);
  end loop;
end $$;

-- ---------- derived sample state (C6 states + Held) ----------
create or replace view v_samples with (security_invoker = true) as
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

-- ---------- row-level security ----------
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- reference data every signed-in staff member reads; written by configuration
do $$
declare t text;
begin
  foreach t in array array['roles','permissions','role_permissions','parameters','parameter_group_items','standards','methods',
                           'formulas','services','service_parameters','validation_rules','report_templates','lookups','app_settings','signatory_rules']
  loop
    execute format('create policy %I on %I for select to authenticated using (is_staff())', t || '_read', t);
    execute format('create policy %I on %I for all to authenticated using (has_permission(''config.write'')) with check (has_permission(''config.write''))', t || '_write', t);
  end loop;
end $$;

-- people
create policy profiles_read on profiles for select to authenticated using (is_staff() or id = auth.uid());
create policy profiles_self on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin on profiles for all to authenticated using (has_permission('user.manage')) with check (has_permission('user.manage'));
create policy user_roles_read on user_roles for select to authenticated using (is_staff() or user_id = auth.uid());
create policy user_roles_admin on user_roles for all to authenticated using (has_permission('user.manage')) with check (has_permission('user.manage'));

-- clients and master data
create policy companies_read on companies for select to authenticated using (is_staff());
create policy companies_write on companies for all to authenticated using (has_permission('company.manage')) with check (has_permission('company.manage'));
create policy contacts_read on company_contacts for select to authenticated using (is_staff());
create policy contacts_write on company_contacts for all to authenticated
  using (has_any_permission(array['company.manage','order.create','order.edit'])) with check (has_any_permission(array['company.manage','order.create','order.edit']));
do $$
declare t text;
begin
  foreach t in array array['drill_holes','seams','lithologies'] loop
    execute format('create policy %I on %I for select to authenticated using (is_staff())', t || '_read', t);
    execute format('create policy %I on %I for all to authenticated using (has_permission(''master.write'')) with check (has_permission(''master.write''))', t || '_write', t);
  end loop;
end $$;
create policy coa_files_read on coa_files for select to authenticated using (is_staff());
create policy coa_files_write on coa_files for all to authenticated using (has_permission('coa.upload')) with check (has_permission('coa.upload'));
create policy intervals_read on sample_intervals for select to authenticated using (is_staff());
create policy intervals_write on sample_intervals for all to authenticated using (has_any_permission(array['order.edit','master.write'])) with check (has_any_permission(array['order.edit','master.write']));

-- job orders
create policy orders_read on job_orders for select to authenticated using (has_permission('order.read'));
create policy orders_insert on job_orders for insert to authenticated with check (has_permission('order.create'));
create policy orders_update on job_orders for update to authenticated using (has_any_permission(array['order.edit','order.cancel','report.publish','coa.mark_sent']));
do $$
declare t text;
begin
  foreach t in array array['job_order_parameters','job_order_group_items'] loop
    execute format('create policy %I on %I for select to authenticated using (has_permission(''order.read''))', t || '_read', t);
    execute format('create policy %I on %I for all to authenticated using (has_any_permission(array[''order.create'',''order.edit''])) with check (has_any_permission(array[''order.create'',''order.edit'']))', t || '_write', t);
  end loop;
end $$;
create policy order_files_read on job_order_files for select to authenticated using (has_permission('order.read'));
create policy order_files_write on job_order_files for all to authenticated using (has_any_permission(array['order.edit','batch.create'])) with check (has_any_permission(array['order.edit','batch.create']));

-- batches and samples
create policy batches_read on batches for select to authenticated using (has_permission('batch.read'));
create policy batches_insert on batches for insert to authenticated with check (has_permission('batch.create'));
create policy batches_update on batches for update to authenticated
  using (has_any_permission(array['batch.create','batch.number.edit','sample.receive','batch.transition.prep','batch.transition.analysis','batch.complete']));
create policy batch_params_read on batch_parameters for select to authenticated using (has_permission('batch.read'));
create policy batch_params_write on batch_parameters for all to authenticated using (has_permission('batch.create')) with check (has_permission('batch.create'));
create policy batch_docs_read on batch_documents for select to authenticated using (has_permission('batch.read'));   -- the file itself needs roa.download (signed URL from the API)
create policy batch_docs_write on batch_documents for all to authenticated using (has_permission('batch.document.upload')) with check (has_permission('batch.document.upload'));
create policy batch_log_read on batch_status_log for select to authenticated using (has_permission('batch.read'));
create policy samples_read on samples for select to authenticated using (has_permission('order.read'));
create policy samples_insert on samples for insert to authenticated with check (has_permission('order.edit'));
create policy samples_update on samples for update to authenticated using (has_any_permission(array['order.edit','sample.receive','batch.create','label.print']));
create policy samples_delete on samples for delete to authenticated using (has_permission('order.edit'));
create policy attachments_read on sample_attachments for select to authenticated using (has_permission('batch.read'));
create policy attachments_write on sample_attachments for all to authenticated using (has_permission('sample.photo')) with check (has_permission('sample.photo'));

-- results: hidden from roles without result.read (the CSO never sees raw results, B-3)
create policy analyses_read on analyses for select to authenticated using (has_permission('result.read'));
create policy analyses_write on analyses for all to authenticated using (has_any_permission(array['result.write','result.write.prep'])) with check (has_any_permission(array['result.write','result.write.prep']));
create policy values_read on analysis_values for select to authenticated using (has_permission('result.read'));
create policy values_write on analysis_values for all to authenticated using (has_any_permission(array['result.write','result.write.prep'])) with check (has_any_permission(array['result.write','result.write.prep']));

-- reports
create policy reports_read on reports for select to authenticated using (has_any_permission(array['coa.download','report.publish']));
create policy reports_write on reports for all to authenticated using (has_any_permission(array['report.publish','report.revise','report.void'])) with check (has_any_permission(array['report.publish','report.revise','report.void']));
create policy report_sources_read on report_sources for select to authenticated using (has_any_permission(array['coa.download','report.publish']));
create policy report_sources_write on report_sources for all to authenticated using (has_permission('report.publish')) with check (has_permission('report.publish'));
create policy deliveries_read on report_deliveries for select to authenticated using (has_any_permission(array['coa.download','report.publish']));
create policy deliveries_insert on report_deliveries for insert to authenticated with check (has_permission('coa.mark_sent'));

-- own rows
create policy notifications_own on notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_mark on notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy queries_read on saved_queries for select to authenticated using (owner_id = auth.uid() or (shared and is_staff()));
create policy queries_write on saved_queries for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- audit: read only; rows are written by the trigger
create policy audit_read on audit_log for select to authenticated using (has_permission('audit.read'));
