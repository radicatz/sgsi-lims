-- SGSI LIMS v1 · job order files (Job_Order_Build_Design.md section 6): a private bucket for the quote, PO and client letters.
-- Only the API (service role) reads and writes it; the web gets one-hour signed links. No schema change: data only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('job-order-files', 'job-order-files', false, 20971520, array[
    'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel.sheet.macroEnabled.12', 'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'])
on conflict (id) do nothing;
