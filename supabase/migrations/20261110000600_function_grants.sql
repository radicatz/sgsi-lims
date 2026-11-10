-- SGSI LIMS v1 · 0600 · function hardening (Supabase security advisor, Nov 10, 2026)
-- Helpers stay executable by signed-in users because the RLS policies call them as that user; they only answer
-- questions about the caller's own permissions. Nobody signed out may call them, and the trigger function is not callable at all.

alter function touch_updated_at() set search_path = public;

revoke execute on function has_permission(text), has_any_permission(text[]), is_staff(), my_permissions() from public, anon;
grant execute on function has_permission(text), has_any_permission(text[]), is_staff(), my_permissions() to authenticated, service_role;

revoke execute on function audit_row() from public, anon, authenticated;
