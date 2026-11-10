-- SGSI LIMS v1 · 0500 · reference data: roles, permissions, catalogue, services, lookups, settings
-- Demo people, clients and job orders are not here; they are loaded by supabase/seed (staging only).
select set_config('app.skip_audit', 'on', true);

-- Values the lab has not confirmed yet (methods, decimals, ranges, lookups) follow the prototype and spec 11 (V1_Build_Plan section 4, items 3 and 4).

insert into roles (code, name, description, sort_order) values
  ('superadmin','Superadmin','Users, roles and configuration',1),
  ('cso','CSO','Job orders, clients, sending CoAs',2),
  ('prep','Preparation','Receives samples, enters ADL',3),
  ('analyst','Analyst','Enters analysis values',4),
  ('lab_admin','Lab admin','Runs the lab day to day, RoA and CoA',5),
  ('supervisor','Supervisor','Oversees work, reads the audit log',6),
  ('manager','Manager','Head of laboratory, signs CoAs',7),
  ('client','Client','Dormant until a client portal exists (D-35)',99);

insert into permissions (code, description) values
  ('user.manage','Add, edit and deactivate accounts'), ('role.manage','Change the permission grid'),
  ('company.read','See clients and contacts'), ('company.manage','Manage clients and contacts'),
  ('master.read','See drill holes, lithologies, seams'), ('master.write','Edit drill holes, lithologies, seams'),
  ('order.read','See job orders and their samples'), ('order.create','Create job orders'), ('order.edit','Edit job orders and their sample list'), ('order.cancel','Cancel and close job orders'),
  ('batch.read','See batches'), ('batch.create','Add batches to a job order'), ('batch.number.edit','Edit a batch number while Created'),
  ('sample.receive','Arrival, mass, condition and Confirm reception'), ('sample.photo','Add and remove reception photos'), ('label.print','Print and reprint labels'),
  ('batch.transition.prep','Finish preparation'), ('result.write.prep','Enter ADL'),
  ('batch.transition.analysis','Finish analysis'), ('result.write','Enter analysis values'), ('result.read','See result values'),
  ('batch.document.upload','Upload the signed RoA'), ('batch.complete','Complete a batch'),
  ('report.publish','Generate and publish CoAs'), ('report.revise','Revise a published CoA'), ('report.void','Void a CoA'), ('report.sign','Can be chosen as signatory'),
  ('coa.download','Download CoAs'), ('coa.mark_sent','Mark CoAs as sent'), ('roa.download','Open signed RoAs'), ('coa.upload','Upload a drill hole CoA'),
  ('dashboard.operations','Operations dashboard'), ('dashboard.quality','Quality and reports dashboard'),
  ('search.use','Search and saved queries'), ('work.use','My work queues'),
  ('config.write','Change configuration'), ('audit.read','Read the audit log');

-- grid: spec 8.2 (v1) plus the read codes the sidebar needs (Navigation plan section 2)
insert into role_permissions (role_id, permission_code)
select r.id, p
from (values
  ('superadmin', array['user.manage','role.manage','company.read','company.manage','master.read','master.write','order.read','order.create','order.edit','order.cancel',
     'batch.read','batch.create','batch.number.edit','sample.receive','sample.photo','label.print','batch.transition.prep','result.write.prep','batch.transition.analysis',
     'result.write','result.read','batch.document.upload','batch.complete','report.publish','report.revise','report.void','coa.download','coa.mark_sent','roa.download',
     'coa.upload','dashboard.operations','dashboard.quality','search.use','config.write','audit.read']),
  ('cso', array['company.read','company.manage','order.read','order.create','order.edit','order.cancel','batch.read','batch.create','batch.number.edit','sample.receive',
     'sample.photo','coa.download','coa.mark_sent','dashboard.operations','search.use','work.use']),
  ('prep', array['order.read','batch.read','batch.create','batch.number.edit','sample.receive','sample.photo','label.print','batch.transition.prep','result.write.prep',
     'result.read','dashboard.operations','search.use','work.use']),
  ('analyst', array['order.read','batch.read','batch.transition.analysis','result.write','result.read','roa.download','dashboard.operations','search.use','work.use']),
  ('lab_admin', array['company.read','master.read','master.write','order.read','batch.read','batch.create','batch.number.edit','sample.receive','sample.photo','label.print',
     'result.read','batch.document.upload','batch.complete','report.publish','report.revise','coa.download','roa.download','coa.upload','dashboard.operations',
     'dashboard.quality','search.use','work.use']),
  ('supervisor', array['master.read','order.read','batch.read','batch.transition.prep','batch.transition.analysis','result.read','report.sign','coa.download','roa.download',
     'dashboard.operations','dashboard.quality','search.use','audit.read']),
  ('manager', array['company.read','company.manage','master.read','order.read','batch.read','result.read','report.sign','coa.download','roa.download','dashboard.operations',
     'dashboard.quality','search.use','audit.read'])
) as g(role, ps)
join roles r on r.code = g.role
cross join lateral unnest(g.ps) as p;

-- parameter catalogue (job order form groups; Preparation first; ADL for the Preparation tab, C-6)
insert into parameters (code, name, label, category, unit, kind, measured_basis, decimals, allows_qualifier, typical_low, typical_high, is_group, is_subcontracted, sort_order) values
  ('PREP','Sample preparation','Preparation','Preparation',null,'text',null,0,false,null,null,false,false,1),
  ('ADL','Air-dried loss','ADL','Preparation','%','numeric','ar',2,false,0,15,false,false,2),
  ('TM','Total moisture','TM','Moisture','%','numeric','ar',1,false,2,45,false,false,10),
  ('IM','Inherent moisture','IM','Moisture','%','numeric','adb',2,false,0.5,25,false,false,11),
  ('EQM','Equilibrium moisture','EQM','Moisture','%','numeric','adb',2,false,1,40,false,false,12),
  ('ASH','Ash','Ash','Proximate','%','numeric','adb',2,false,0,45,false,false,20),
  ('VM','Volatile matter','VM','Proximate','%','numeric','adb',2,false,5,55,false,false,21),
  ('FC','Fixed carbon','FC','Proximate','%','calculated','adb',2,false,20,80,false,false,22),
  ('TS','Total sulfur','TS','Sulfur','%','numeric','adb',2,false,0,6,false,false,30),
  ('SFORMS','Forms of sulfur','Forms of sulfur','Sulfur','%','numeric','adb',2,false,0,6,false,false,31),
  ('GCV','Gross calorific value','GCV','Calorific','kcal/kg','numeric','adb',0,false,2500,8000,false,false,40),
  ('NCV','Net calorific value','NCV','Calorific','kcal/kg','calculated','ar',0,false,2000,7500,false,false,41),
  ('C','Carbon','C','Ultimate','%','numeric','daf',2,false,50,92,false,false,50),
  ('H','Hydrogen','H','Ultimate','%','numeric','daf',2,false,2,7,false,false,51),
  ('N','Nitrogen','N','Ultimate','%','numeric','daf',2,false,0.5,2.5,false,false,52),
  ('O','Oxygen','O','Ultimate','%','calculated','daf',2,false,2,25,false,false,53),
  ('HGI','Hardgrove grindability index','HGI','Physical',null,'numeric',null,0,false,30,110,false,false,60),
  ('RD','Relative density','RD','Physical',null,'numeric','adb',2,false,1.2,1.9,false,false,61),
  ('SIZING','Size distribution','Sizing','Physical','%','numeric','ar',1,false,0,100,false,false,62),
  ('AFT_RED','Ash fusion temperature, reducing','AFT red.','Ash','°C','numeric',null,0,false,1000,1600,false,false,70),
  ('AFT_OX','Ash fusion temperature, oxidising','AFT ox.','Ash','°C','numeric',null,0,false,1000,1600,false,false,71),
  ('ASH_ANALYSIS','Ash analysis','Ash analysis','Ash','%','numeric','ash',2,false,0,100,true,false,72),
  ('METAL_ASH','Metal in ash','Metal in ash','Ash','%','numeric','ash',2,false,0,100,false,false,73),
  ('CL','Chlorine','Cl','Chemical','%','numeric','adb',3,true,0,1,false,false,80),
  ('P','Phosphorus','P','Chemical','%','numeric','adb',3,true,0,1,false,false,81),
  ('F','Fluorine','F','Chemical','ppm','numeric','adb',0,true,0,500,false,false,82),
  ('HG','Mercury','Hg','Chemical','ppm','numeric','adb',3,true,0,2,false,false,83),
  ('TRACE','Trace elements','Trace elements','Chemical','ppm','numeric','adb',1,true,0,1000,true,false,84),
  ('CSN','Crucible swelling number','CSN (Crucible Swelling Number)','Coking coal',null,'numeric',null,1,false,0,9,false,false,90),
  ('GIESELER','Gieseler plastometer','Gieseler Plastometer','Coking coal',null,'numeric',null,0,false,null,null,false,false,91),
  ('GRAY_KING','Gray-King coke type','Gray King Coke Type','Coking coal',null,'text',null,0,false,null,null,false,false,92),
  ('DILATOMETER','Dilatometer test','Dilatometer Test','Coking coal','%','numeric',null,0,false,null,null,false,false,93),
  ('SAPOZHNIKOV','Sapozhnikov test (Y value)','Sapozhnikov Test','Coking coal','mm','numeric',null,0,false,null,null,false,false,94),
  ('G_INDEX','G caking index','G – Index (G Caking Index Test)','Coking coal',null,'numeric',null,0,false,0,110,false,false,95),
  ('CRI_CSR','Coke reactivity index and strength after reaction','CRI/CSR (Coke Reactivity Index/Coke Strength After Reaction)','Coking coal','%','numeric',null,1,false,null,null,false,true,96),
  ('MACERAL','Maceral analysis (petrographic)','Maceral Analysis (Petrographic)','Coking coal','%','numeric',null,1,false,null,null,false,false,97);

insert into parameter_group_items (parameter_id, section, code, is_preset, sort_order)
select p.id, i.section, i.code, i.preset, i.ord
from parameters p
join (values
  ('ASH_ANALYSIS','Oxides','SiO₂',true,1),('ASH_ANALYSIS','Oxides','Al₂O₃',true,2),('ASH_ANALYSIS','Oxides','Fe₂O₃',true,3),('ASH_ANALYSIS','Oxides','CaO',true,4),
  ('ASH_ANALYSIS','Oxides','MgO',true,5),('ASH_ANALYSIS','Oxides','Na₂O',true,6),('ASH_ANALYSIS','Oxides','K₂O',true,7),('ASH_ANALYSIS','Oxides','TiO₂',true,8),
  ('ASH_ANALYSIS','Oxides','P₂O₅',false,9),('ASH_ANALYSIS','Oxides','SO₃',false,10),('ASH_ANALYSIS','Oxides','Mn₃O₄',false,11),('ASH_ANALYSIS','Oxides','BaO',false,12),
  ('ASH_ANALYSIS','Oxides','SrO',false,13),('ASH_ANALYSIS','Oxides','Cr₂O₃',false,14),
  ('ASH_ANALYSIS','Ratios and indices','Base/acid ratio',true,20),('ASH_ANALYSIS','Ratios and indices','Silica ratio',false,21),('ASH_ANALYSIS','Ratios and indices','SiO₂/Al₂O₃',false,22),
  ('ASH_ANALYSIS','Ratios and indices','Fe₂O₃/CaO',false,23),('ASH_ANALYSIS','Ratios and indices','Slagging index Rs',false,24),('ASH_ANALYSIS','Ratios and indices','Fouling index Rf',false,25),
  ('ASH_ANALYSIS','Ratios and indices','Alkali index',false,26),('ASH_ANALYSIS','Ratios and indices','Total alkalis (Na₂O eq.)',false,27),('ASH_ANALYSIS','Ratios and indices','Basicity index',false,28),
  ('ASH_ANALYSIS','Ratios and indices','Silica value',false,29),('ASH_ANALYSIS','Ratios and indices','Viscosity index Sr',false,30),('ASH_ANALYSIS','Ratios and indices','Ash loading',false,31),
  ('ASH_ANALYSIS','Ratios and indices','Dolomite ratio',false,32),('ASH_ANALYSIS','Ratios and indices','Iron + calcium',false,33),('ASH_ANALYSIS','Ratios and indices','Fusion index',false,34)
) as i(param, section, code, preset, ord) on p.code = i.param;
insert into parameter_group_items (parameter_id, section, code, is_preset, sort_order)
select p.id, 'Elements', e.code, e.code in ('As','Cd','Cr','Pb','Se'), e.ord
from parameters p cross join unnest(array['As','B','Ba','Be','Cd','Co','Cr','Cu','Ga','Ge','Li','Mn','Mo','Ni','Pb','Rb','Sb','Sc','Se','Sn','Sr','Th','Tl','U','V','W','Zn','Zr','Ag','Bi','Cs','Nb','Ta','Y','La','Ce'])
  with ordinality as e(code, ord)
where p.code = 'TRACE';

-- standards and methods (a coking test is available under a standard when a method exists: Revision 9 coverage tags)
insert into standards (family, code, edition, title) values
  ('ASTM','D3302','2022','Total moisture'), ('ASTM','D3173','2017','Moisture in the analysis sample'), ('ASTM','D3174','2023','Ash in the analysis sample'),
  ('ASTM','D3175','2020','Volatile matter'), ('ASTM','D4239','2018','Sulfur by high-temperature combustion'), ('ASTM','D5865','2019','Gross calorific value'),
  ('ASTM','D409','2016','Hardgrove grindability'), ('ASTM','D720','2015','Free-swelling index'), ('ASTM','D2639','2016','Gieseler plastometer'),
  ('ASTM','D5515','2014','Dilatometer'), ('ASTM','D5341','2017','Coke reactivity and strength after reaction'), ('ASTM','D2799','2013','Maceral analysis'),
  ('ISO','1171','2010','Ash'), ('ISO','11722','2013','Moisture in the analysis sample'), ('ISO','562','2010','Volatile matter'), ('ISO','19579','2006','Sulfur by IR spectrometry'),
  ('ISO','1928','2020','Gross calorific value'), ('ISO','501','2012','Crucible swelling number'), ('ISO','10329','2009','Gieseler plastometer'), ('ISO','502','2015','Gray-King coke type'),
  ('ISO','349','2016','Dilatometer'), ('ISO','20362','2022','Sapozhnikov (Y value)'), ('ISO','15585','2006','G caking index'), ('ISO','18894','2018','Coke reactivity and strength after reaction'),
  ('ISO','7404-3','2009','Maceral group composition'),
  ('GBT','212','2008','Proximate analysis'), ('GBT','5448','2014','Crucible swelling number'), ('GBT','25213','2010','Gieseler plastometer'), ('GBT','1341','2007','Gray-King assay'),
  ('GBT','5450','2014','Dilatometer'), ('GBT','479','2016','Plastometric indices (Y value)'), ('GBT','5447','2014','G caking index'), ('GBT','4000','2017','Coke reactivity and strength after reaction'),
  ('GBT','8899','2013','Maceral analysis');

insert into methods (parameter_id, standard_id, repeatability, reproducibility)
select p.id, s.id, m.r, m.rr
from (values
  ('TM','ASTM','D3302',0.3,0.6), ('IM','ASTM','D3173',0.1,0.2), ('ASH','ASTM','D3174',0.15,0.30), ('VM','ASTM','D3175',0.5,1.0), ('TS','ASTM','D4239',0.05,0.1),
  ('GCV','ASTM','D5865',120,240), ('HGI','ASTM','D409',2,4), ('CSN','ASTM','D720',0.5,1), ('GIESELER','ASTM','D2639',null,null), ('DILATOMETER','ASTM','D5515',null,null),
  ('CRI_CSR','ASTM','D5341',null,null), ('MACERAL','ASTM','D2799',null,null),
  ('ASH','ISO','1171',0.2,0.3), ('IM','ISO','11722',0.1,0.2), ('VM','ISO','562',0.3,0.6), ('TS','ISO','19579',0.05,0.1), ('GCV','ISO','1928',120,300),
  ('CSN','ISO','501',null,null), ('GIESELER','ISO','10329',null,null), ('GRAY_KING','ISO','502',null,null), ('DILATOMETER','ISO','349',null,null),
  ('SAPOZHNIKOV','ISO','20362',null,null), ('G_INDEX','ISO','15585',null,null), ('CRI_CSR','ISO','18894',null,null), ('MACERAL','ISO','7404-3',null,null),
  ('ASH','GBT','212',0.2,0.3), ('VM','GBT','212',0.3,0.6), ('CSN','GBT','5448',null,null), ('GIESELER','GBT','25213',null,null), ('GRAY_KING','GBT','1341',null,null),
  ('DILATOMETER','GBT','5450',null,null), ('SAPOZHNIKOV','GBT','479',null,null), ('G_INDEX','GBT','5447',2,4), ('CRI_CSR','GBT','4000',null,null), ('MACERAL','GBT','8899',null,null)
) as m(param, fam, code, r, rr)
join parameters p on p.code = m.param
join standards s on s.family = m.fam::standard_family and s.code = m.code;

insert into formulas (parameter_id, target_basis, version, expression, inputs)
select p.id, f.basis, 1, f.expr, f.inputs::jsonb
from (values
  ('FC','adb','100 - IM - ASH - VM','["IM","ASH","VM"]'),
  ('NCV','ar','GCV * (100 - TM) / (100 - IM) - 5.85 * (9 * H + TM)','["GCV","TM","IM","H"]')
) as f(param, basis, expr, inputs)
join parameters p on p.code = f.param;

-- quick-select services (version 1)
insert into services (code, name, is_default, turnaround_days, sort_order) values
  ('basic','TM + Prox + TS + CV',true,5,1), ('prox','Prox only',false,3,2), ('full','Full analysis',false,10,3),
  ('coking','Coking coal',false,12,4), ('prep','Preparation only',false,2,5);
insert into service_parameters (service_id, parameter_id)
select s.id, p.id
from (values
  ('basic', array['TM','IM','ASH','VM','FC','TS','GCV']),
  ('prox',  array['IM','ASH','VM','FC']),
  ('full',  array['TM','IM','ASH','VM','FC','TS','GCV','NCV','C','H','N','O','HGI','AFT_RED','AFT_OX','ASH_ANALYSIS']),
  ('coking',array['TM','IM','ASH','VM','FC','TS','GCV','CSN','GIESELER','DILATOMETER','MACERAL','P','ASH_ANALYSIS']),
  ('prep',  array[]::text[])
) as x(svc, codes)
join services s on s.code = x.svc
cross join lateral unnest(x.codes) as c
join parameters p on p.code = c;

-- lookups (Configuration, Lookups)
insert into lookups (list_key, value, needs_remark, sort_order) values
  ('sample_condition','Good',false,1), ('sample_condition','Damp',true,2), ('sample_condition','Wet',true,3), ('sample_condition','Damaged bag',true,4), ('sample_condition','Contaminated',true,5),
  ('hold_reason','Damaged',false,1), ('hold_reason','Insufficient',false,2), ('hold_reason','Client request',false,3), ('hold_reason','Other',true,4),
  ('photo_tag','Condition',false,1), ('photo_tag','Weighing',false,2), ('photo_tag','Other',false,3),
  ('lithology_kind','Coal',false,1), ('lithology_kind','Parting',false,2), ('lithology_kind','No lithology',false,3),
  ('send_channel','Hard copy',false,1), ('send_channel','Email',false,2), ('send_channel','WhatsApp',false,3), ('send_channel','Other',true,4),
  ('not_received_reason','Client did not send it',false,1), ('not_received_reason','Lost in transit',false,2), ('not_received_reason','Other',true,3),
  ('sample_type','Exploration cores',false,1), ('sample_type','Shipment',false,2), ('sample_type','Stockpile',false,3), ('sample_type','Channel samples',false,4);

-- validation rules (spec 12.3)
insert into validation_rules (code, description, severity, params) values
  ('V-01','Total of IM + Ash + VM + FC equals 100 ± 0.05 %','block','{"tolerance":0.05}'),
  ('V-12','Total moisture is not below inherent moisture','block','{}'),
  ('V-31','Ash (ADB) within the typical range','warn','{"parameter":"ASH"}'),
  ('V-32','VM (ADB) within the typical range','warn','{"parameter":"VM"}'),
  ('V-40','GCV (ADB) within the typical range','warn','{"parameter":"GCV"}'),
  ('V-44','TS (ADB) within the typical range','warn','{"parameter":"TS"}'),
  ('V-50','ADL within the typical range','warn','{"parameter":"ADL"}');

-- report template (the layout comes with R-10)
insert into report_templates (kind, name, form_code, revision, status, since) values
  ('coa','Certificate of Analysis','FM-LAB-014',3,'current','2026-10-01');

-- settings (Configuration, Laboratory and Security; Stack_Decision_Record S-16)
insert into app_settings (key, value) values
  ('laboratory', '{"name":"PT Sentra Geo Survey Indonesia","accreditation":"LP-1234-IDN","place_of_issue":"Samarinda"}'),
  ('numbering',  '{"job_order":"JO-{YYYY}-{NNNN}","batch":"B-{YYYY}-{NNNN}","lab_code":"B{batch4}-{NN}","coa":"CoA-{job_order}-{revision}"}'),
  ('security',   '{"lock_after_attempts":5,"lock_minutes":15,"idle_sign_out_minutes":30,"warn_before_seconds":60,"min_password_length":10,"require_letter_and_number":true,"forbid_email_in_password":true,"require_special_character":false,"reset_link_minutes":60,"invite_days":7}'),
  ('timezone',   '"Asia/Makassar"');
