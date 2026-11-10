# Docs

Nov 5, 2026. Plans and specifications for SGSI LIMS, one folder per screen group. Links inside the files are relative to the file's own folder.

| Folder | File | What it is | Status |
| --- | --- | --- | --- |
| Project | `Project/Coal_LIMS_Development_Spec.md` | Build-side specification: features, screens (S-00 to S-30), flows, data model, rules, decisions | Living; v1 scope in section 1.1 |
| Project | `Project/Coal_LIMS_Research_and_Project_Plan.md` | First research, scope, stack, roadmap and vendor sources (Oct 16 to 19) | Background; the spec overrides it where they differ |
| Project | `Project/Stack_Decision_Record.md` | Technology for v1: Supabase, Fastify API, React, how the web app reaches the data, PDFs, tests, deployment | Proposed Nov 10, waiting for go |
| Project | `Project/V1_Build_Plan.md` | v1 build phases 0 to 6 with gates, schema changes C-1 to C-17, what the lab and client must provide, a request ready to send | Proposed Nov 10, waiting for go |
| Design System | `Design System/Component_Library_Plan.md` | FigCraft component library (Revision 2) | Built Oct 30 |
| Design System | `Design System/Design_Tokens.md` | Colour, radius and elevation tokens, Light and Dark, with contrast | Current (Nov 3 values) |
| Design System | `Design System/Frame_Naming.md` | Naming of every frame and exported PNG | Rule |
| Job Order | `Job Order/Job_Order_Screen_Plan.md` | Job order screens: list, create, detail, add batch, CoA and actions (rows A to E) | Built through Revision 10 |
| Job Order | `Job Order/Job_Order_Prototype_Plan.md` | Prototype v2: job order screens, links, gaps, differences D1 to D5 and D8, flows JO1 to JO12 | Plan, waiting for go |
| Batch | `Batch/Batch_Screen_Plan.md` | The batch page: Reception, Preparation, Analysis, RoA and Complete batch | Batch page and batch list frames built Nov 4; prototype update pending |
| Batch | `Batch/Batch_Prototype_Plan.md` | Prototype v2: batch list and batch page, flows BA1 to BA8 | Plan, waiting for go |
| My Work | `My Work/My_Work_Screen_Plan.md` | My work queues per role | Revision 2 (v1 queues) frames built Nov 4 |
| My Work | `My Work/My_Work_Prototype_Plan.md` | Prototype v2: overview and queues, flows MW1 and MW2 | Plan, waiting for go |
| Dashboard | `Dashboard/Dashboard_v2_Screen_Plan.md` | The v1 dashboard: Operations and Quality & reports tabs, per role | Revision 2, 15 frames built Nov 5; owner edits (section 15) built into the generator and rebuilt Nov 5 |
| Dashboard | `Dashboard/Dashboard_Prototype_Plan.md` | Prototype v2: both tabs, SVG charts, flows DB1 and DB2 | Plan, waiting for go |
| Navigation | `Navigation/Navigation_Screen_Plan.md` | Sidebar items and page access per role, No access page | Role sidebar and App frames built Nov 5 |
| Master Data | `Master Data/Master_Data_Screen_Plan.md` | Clients, Drill hole, Lithology and Seam: lists, forms, client page with contacts, CoA upload and history | 31 frames built Nov 5; Revision 3 (owner edits, section 15) built Nov 5 |
| Master Data | `Master Data/Master_Data_Prototype_Plan.md` | Prototype v2: clients, drill hole, lithology, seam, difference D2, frame defect E1, flows MD1 to MD3 | Plan, waiting for go |
| Reports | `Reports/Reports_Screen_Plan.md` | Reports list (RoA and CoA), the report page, building and publishing the CoA, revise and void | 28 frames built Nov 5 |
| Reports | `Reports/Reports_Prototype_Plan.md` | Prototype v2: reports list, CoA and RoA pages, D1 and D6, flows RE1 to RE3 | Plan, waiting for go |
| Search | `Search/Search_Screen_Plan.md` | Quick search in the top bar, search results, advanced search with saved queries, sample history | 26 frames built Nov 5 |
| Search | `Search/Search_Prototype_Plan.md` | Prototype v2: quick and advanced search, sample history, flows SE1 to SE3 | Plan, waiting for go |
| App | `App/App_Screen_Plan.md` | Sign in, forgot and set password, user menu, notifications (bell, panel, page), profile, session timeout | 30 frames built Nov 6 |
| App | `App/App_Prototype_Plan.md` | Prototype v2: sign in, passwords, notifications (events N1 to N8), profile, timeout, flows AP1 to AP8 | Plan, waiting for go |
| Admin | `Admin/Admin_Screen_Plan.md` | Users and roles, audit log, configuration hub (parameters, services, methods, rules, lookups, report templates, laboratory, security, formulas) | 42 frames built Nov 6 |
| Admin | `Admin/Admin_Prototype_Plan.md` | Prototype v2: users, audit log, configuration and what it feeds, flows AD1 to AD4 | Plan, waiting for go |
| Prototype | `Prototype/Prototype_Plan.md` | Prototype v2 shared plan: decisions, review bar, shell, rules, demo data basics, the list of differences found in the frames, phases, checks; links to the group prototype plans | Built Nov 6 as a private preview; shared link waits for go |
| Prototype | `Prototype/Prototype_Demo_Guide.md` | Presenter's guide: every screen group and feature, what it does, who can see and use it, and a 40-minute demo running order | Nov 9 |
| Prototype | `Prototype/Demo_Video_Plan.md` | Plan and status of the Indonesian captioned demo video: 21 clips, tools, folders; the tooling is in `.context/demo-video/` | Nov 10 |
| archive | `archive/Job_Order_Prototype_Plan_v31.md` | The version 31 prototype plan (job orders and batches) | Replaced by the prototype v2 plans; kept as history |
| archive | `archive/Reception_Preparation_Screen_Plan.md` | The first batch-page plan with Revisions B and C | Superseded by the Batch plan; kept as history |

New screen groups get their own folder and a plan named `<Group>_Screen_Plan.md`; a plan that is replaced moves to `archive/` with a banner naming its successor.
