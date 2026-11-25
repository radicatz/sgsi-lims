-- SGSI LIMS v1 · lockout window (App plan open point 1: 5 failed attempts within 15 minutes lock the account; Open_Points_Check_Nov25.md M-9).
-- The time of the first failed attempt in the current run, so attempts older than the window stop counting. Run by the owner. Safe to run twice.
alter table profiles add column if not exists failed_since timestamptz;
