-- SGSI LIMS v1 · 0700 · private storage buckets for client logos and outside CoA files.
-- Only the API (service role) reads and writes them; the web gets short-lived signed links.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('logos', 'logos', false, 2097152,  array['image/png','image/jpeg','image/svg+xml','image/webp']),
  ('coa',   'coa',   false, 10485760, array['application/pdf'])
on conflict (id) do nothing;
