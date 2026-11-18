-- SGSI LIMS v1 · phase 3 (Batch_Build_Design.md section 6): private buckets for the reception photos and the signed RoA.
-- Only the API (service role) reads and writes them; the web gets one-hour signed links. No schema change: data only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('sample-photos', 'sample-photos', false, 10485760, array['image/png', 'image/jpeg', 'image/webp']),
  ('batch-documents', 'batch-documents', false, 20971520, array['application/pdf'])
on conflict (id) do nothing;
