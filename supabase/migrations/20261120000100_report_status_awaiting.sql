-- SGSI LIMS v1 · C-21 part 1 of 2 · phase 4 (Reports_Build_Design.md section 8). Run by the owner in the SQL editor, FIRST and alone.
-- A new enum value cannot be used in the transaction that adds it, so the rest is in 20261120000200_reports_signing.sql, run after this one.
alter type report_status add value if not exists 'awaiting_signature' before 'issued';
