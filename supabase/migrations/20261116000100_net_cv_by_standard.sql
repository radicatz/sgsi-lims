-- SGSI LIMS v1 · 1000 · Net CV per standard, hydrogen by Seyler, TM to 2 decimals (data only; owner answers Nov 16, 2026).
-- Safe to run more than once. Checked against the shipment workbook (Test Report #2): ISO 4745, ASTM 4730 kcal/kg.
-- The calculation itself is packages/shared/src/calc.ts (netCalorific, hydrogenSeyler); these rows are what Configuration > Formulas shows.

-- NCV (ar): version 1 used a simplified formula (GCV ar − 5.85 × (9H + TM)) that gave 4696 for the workbook's coal; no result used it.
update formulas set status = 'retired'
where target_basis = 'ar' and version = 1 and parameter_id = (select id from parameters where code = 'NCV');

insert into formulas (parameter_id, target_basis, version, expression, inputs, valid_from, status)
select p.id, 'ar', 2,
  'By the job order''s standard. ISO 1928: (GCV ar × 4.1868 − 206 × H ar − 23.05 × TM) / 4.1868. GB/T 213: the same with 23 × TM. ASTM D5865: GCV ar − 5.72 × 9 × (H ar + 0.1119 × TM). X ar = X adb × (100 − TM) / (100 − IM)',
  '["GCV","TM","IM","H"]'::jsonb, current_date, 'active'
from parameters p
where p.code = 'NCV'
  and not exists (select 1 from formulas f where f.parameter_id = p.id and f.target_basis = 'ar' and f.version = 2);

-- H (adb): estimated when hydrogen is not measured (the owner: the lab estimates it for Net CV)
insert into formulas (parameter_id, target_basis, version, expression, inputs, valid_from, status)
select p.id, 'adb', 1,
  'Seyler, when H is not measured: H daf = 0.069 × (GCV daf / 100 + VM daf) − 2.86; H adb = H daf × (100 − IM − Ash) / 100',
  '["GCV","VM","IM","ASH"]'::jsonb, current_date, 'active'
from parameters p
where p.code = 'H'
  and not exists (select 1 from formulas f where f.parameter_id = p.id and f.target_basis = 'adb' and f.version = 1);

-- Decimals: the lab reports 2 decimals as on its own RoA (pdf-roa-contoh: TM 29.60, IM 12.32, Ash 0.69); IM, Ash, VM and FC were already 2
update parameters set decimals = 2 where code = 'TM' and decimals <> 2;
