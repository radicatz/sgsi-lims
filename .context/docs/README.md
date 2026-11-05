# Docs

Nov 5, 2026. Plans and specifications for SGSI LIMS, one folder per screen group. Links inside the files are relative to the file's own folder.

| Folder | File | What it is | Status |
| --- | --- | --- | --- |
| Project | `Project/Coal_LIMS_Development_Spec.md` | Build-side specification: features, screens (S-00 to S-30), flows, data model, rules, decisions | Living; v1 scope in section 1.1 |
| Project | `Project/Coal_LIMS_Research_and_Project_Plan.md` | First research, scope, stack, roadmap and vendor sources (Oct 16 to 19) | Background; the spec overrides it where they differ |
| Design System | `Design System/Component_Library_Plan.md` | FigCraft component library (Revision 2) | Built Oct 30 |
| Design System | `Design System/Design_Tokens.md` | Colour, radius and elevation tokens, Light and Dark, with contrast | Current (Nov 3 values) |
| Design System | `Design System/Frame_Naming.md` | Naming of every frame and exported PNG | Rule |
| Job Order | `Job Order/Job_Order_Screen_Plan.md` | Job order screens: list, create, detail, add batch, CoA and actions (rows A to E) | Built through Revision 10 |
| Job Order | `Job Order/Job_Order_Prototype_Plan.md` | The clickable prototype (artifact) and what it still has to take | Section 14 waits for go |
| Batch | `Batch/Batch_Screen_Plan.md` | The batch page: Reception, Preparation, Analysis, RoA and Complete batch | Batch page and batch list frames built Nov 4; prototype update pending |
| My Work | `My Work/My_Work_Screen_Plan.md` | My work queues per role | Revision 2 (v1 queues) frames built Nov 4 |
| Dashboard | `Dashboard/Dashboard_v2_Screen_Plan.md` | The v1 dashboard: Operations and Quality & reports tabs, per role | Revision 2, 15 frames built Nov 5; owner edits (section 15) built into the generator and rebuilt Nov 5 |
| Navigation | `Navigation/Navigation_Screen_Plan.md` | Sidebar items and page access per role, No access page | Role sidebar and App frames built Nov 5 |
| Master Data | `Master Data/Master_Data_Screen_Plan.md` | Clients, Drill hole, Lithology and Seam: lists, forms, client page with contacts, CoA upload and history | 31 frames built Nov 5; Revision 3 (owner edits, section 15) built Nov 5 |
| Reports | `Reports/Reports_Screen_Plan.md` | Reports list (RoA and CoA), the report page, building and publishing the CoA, revise and void | Plan, waiting for go |
| archive | `archive/Reception_Preparation_Screen_Plan.md` | The first batch-page plan with Revisions B and C | Superseded by the Batch plan; kept as history |

New screen groups get their own folder and a plan named `<Group>_Screen_Plan.md`; a plan that is replaced moves to `archive/` with a banner naming its successor.
