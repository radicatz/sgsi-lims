-- SGSI LIMS v1 · C-20 · phase 3 (Batch_Build_Design.md section 6). Run by the owner in the SQL editor.

-- C-20a: each batch step writes its log row in the same transaction as the status change
create policy batch_log_insert on batch_status_log for insert to authenticated
  with check (has_permission('batch.read') and by_user = auth.uid());

-- C-20b: values of the Ash analysis and Trace elements items chosen on the job order
alter table analyses add column item_id uuid references parameter_group_items(id);
alter table analyses drop constraint analyses_sample_id_parameter_id_round_key;
create unique index analyses_sample_param_item_round_uq
  on analyses (sample_id, parameter_id, coalesce(item_id, '00000000-0000-0000-0000-000000000000'::uuid), round);
