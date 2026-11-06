# SGSI LIMS — Clickable Prototype Plan (v2): shared plan

Written Nov 6, 2026. **Status: plan, waiting for go.**

The prototype plan is split the same way as the screen plans. **This file** holds what every group shares: the goal, the decisions, the review bar, the app shell, the rules, the build phases and the checks. **Each group's plan** sits next to its screen plan and holds that group's screens, links, gaps, flows and demo data:

| Group | Prototype plan | Screen plan | Frames | Phase |
| --- | --- | --- | --- | --- |
| App (sign in, notifications, profile, shell) | `../App/App_Prototype_Plan.md` | `../App/App_Screen_Plan.md`, `../Navigation/Navigation_Screen_Plan.md` | 36 | 1, 2 |
| My work | `../My Work/My_Work_Prototype_Plan.md` | `../My Work/My_Work_Screen_Plan.md` | 14 | 2 |
| Dashboard | `../Dashboard/Dashboard_Prototype_Plan.md` | `../Dashboard/Dashboard_v2_Screen_Plan.md` | 15 | 2 |
| Job orders | `../Job Order/Job_Order_Prototype_Plan.md` | `../Job Order/Job_Order_Screen_Plan.md` | 55 | 3 |
| Batches | `../Batch/Batch_Prototype_Plan.md` | `../Batch/Batch_Screen_Plan.md` | 33 | 4 |
| Reports | `../Reports/Reports_Prototype_Plan.md` | `../Reports/Reports_Screen_Plan.md` | 26 | 5 |
| Search | `../Search/Search_Prototype_Plan.md` | `../Search/Search_Screen_Plan.md` | 26 | 5 |
| Master data | `../Master Data/Master_Data_Prototype_Plan.md` | `../Master Data/Master_Data_Screen_Plan.md` | 31 | 6 |
| Admin | `../Admin/Admin_Prototype_Plan.md` | `../Admin/Admin_Screen_Plan.md` | 42 | 6 |

These plans replace the version 31 plan, now `../archive/Job_Order_Prototype_Plan_v31.md`. That plan covered one module, and version 31 was built before the FigCraft library rebuild (Oct 30). Its sections 13 and 14 were never built. They are covered here, because the new build follows the frames as they are today.

The plans were written from the frames themselves, not only from the screen plans. On Nov 6, every frame in the main file (`design/figcraft/SGSI-LIMS-screens.figcraft`) was read layer by layer: its buttons, tabs, fields, menus, dialogs and sheets. Each group plan lists what its screens must do, and what its frames leave open or show differently from other modules.

## 1 · Goal

The lab can click through the whole v1 app on a laptop, a tablet and a phone, as any of the seven roles, before production code is written. The prototype copies the built frames (rows A to O) and adds no new design.

The prototype is done when a reviewer can follow every flow in the group plans from start to end at 1440, 834 and 390 px without being told where to click.

## 2 · Decisions

| Question | Recommendation | Why |
| --- | --- | --- |
| Patch version 31 or rebuild? | **Rebuild** as version 2. Reuse version 31's logic where it still holds: parameter rules and dependants, standards and methods, coverage tags, sample states, reception and preparation rules, paste parsing | Version 31 uses the old pen.dev styles, " · " joins, side sheets and the old tab order, and it has none of the Oct 30 to Nov 6 screens. Patching it would mean touching almost every line |
| Where does it live? | The existing artifact https://claude.ai/artifact/73FDBne3B8rbFcXoa6dDZo, updated in place so the link the lab has keeps working. Version 31 stays in the artifact's history and as `.context/prototype/archive/job-order-prototype-v31.html` | One link |
| When does the lab see it? | During the build, each phase goes to a **separate private preview artifact** that only you see. The shared link is updated only after your go at the end | The shared link should not change halfway through a module |
| Stack | As in version 31: React 18.3.1 and htm 3.1.1 from cdnjs and unpkg, no build step. `build.py` inlines the files into one HTML | Proven on the artifact host |
| Components | `prototype/src/ui/` holds **one React component per library set, with the same property names**: `Button {type, size: sm/md/lg/touch, tone}`, `IconButton`, `LinkButton`, `Tabs` with Count pill, `SegmentedControl`, `FilterChip`, `Dialog {size: sm/md/lg, destructive}`, `BottomSheet`, `Card` (padding 16, head 32), `StatusBadge`, `Tag`, `RoleBadge`, `Avatar` (24 to 64, round), `TextField`, `PasswordField`, `Select`, `DateField`, `Search`, `Checkbox`, `Radio`, `Switch`, `ParameterPill`, `DropZone`, `Menu`, `Table` and its cells, `Breadcrumb`, `Stepper`, `Pager`, `StickyActionBar`, `Toast`, `InlineAlert`, `Tooltip`, `EmptyState`, `Skeleton`, `NotificationItem`, `TopBar` (Bell frame and elevated badge), `Sidebar`, `NavItem` | A token or component change in the design system becomes one edit in the prototype |
| Tokens | Generated from `design/figcraft/tokens/sgsi-tokens.css` (Light and Dark), including the elevation, radius and spacing scales | Same values as the file |
| Light and dark | A **Light / Dark** switch in the review bar, using the dark tokens. No dark frames are drawn (owner, Nov 6: the screens viewed with the dark tokens are already good) | Dark mode is reviewed in the prototype only |
| Type and icons | Google Fonts: Noto Sans, Newsreader and JetBrains Mono, with the library's text styles (section 3.1 of `../Design System/Component_Library_Plan.md`) as CSS classes. Icons are the Phosphor Regular SVGs of the library's glyph list plus eye-slash and sign-out, embedded inline (the artifact host blocks icon-font stylesheets) | Matches the library |
| Charts | Hand-drawn SVG that copies the chart shells in the frames (Dashboard plan) | Looks like the frames, needs no chart library, and stays small. The real app uses ECharts |
| Routing | Hash routes that follow the spec URLs (listed in each group plan), so a reviewer can send a link to one screen, for example `#/batches/B-2026-0422` | Links in feedback point at the exact screen |
| Backend | None. Demo data lives in the page, and changes are kept in the viewer's browser. **Reset demo** restores the start state | Same as version 31 |

## 3 · What the reviewer sees

The page has the app and a slim review bar that can be hidden, as in version 31.

| Review bar control | Does |
| --- | --- |
| **Width:** Desktop 1440, Tablet 834, Phone 390, Fit | Shows the app at that width. The layout switches as the frames do: expanded sidebar at 1440 (or collapsed, as the user's profile choice), rail at 834, top bar and menu drawer at 390. Fit is the default on a real phone or tablet |
| **Role:** Superadmin, Lab admin, Supervisor, Manager, CSO, Preparation, Analyst | Signs in as the persona (section 7). The sidebar, start page, page actions and hidden information follow `../Navigation/Navigation_Screen_Plan.md` sections 2 to 4 |
| **Theme:** Light, Dark | Swaps the token set |
| **Flows** | The flows of every group plan, grouped by module. **Start** sets the role, data and screen for step 1 |
| **Spec only** | Lists what the prototype shows but does not do (section 6.2), so a gap is not mistaken for a decision |
| **Reset demo** | Restores the demo data and signs out |

The prototype opens on **Sign in** (App plan).

## 4 · The frames

278 frames: 167 desktop, 42 tablet and 69 phone, in 14 modules. Each group plan lists its screens with their states and sizes.

Where a state is drawn only on desktop, the prototype builds the tablet and phone versions from the patterns the module already has at those sizes: the dialog becomes a bottom sheet or a full-screen step on the phone, tables become cards, and filters move into a Filters sheet. Those views are tagged "Built from the pattern" in the Spec only list.

## 5 · App shell and navigation

| Part | In the prototype |
| --- | --- |
| Sidebar | Items per role from Navigation section 2, in sidebar order; active item per route; collapse toggle on desktop; the user's Expanded or Collapsed choice from the Profile |
| Tablet | Rail (Sidebar Collapsed, Breakpoint Tablet) |
| Phone | Top bar with the menu; menu drawer with the profile block (Menu_drawer frames) |
| Top bar | Quick search (Search plan), the Bell frame with the elevated unread badge (App plan), the user chip with name and role |
| Start page | My work for roles with queues, Dashboard for the others, or the Profile's Start page choice |
| Hidden pages | A direct link to a page the role cannot open shows No access in the shell, with no sidebar item active |

## 6 · Rules for every screen

### 6.1 Behaviour

| Rule | In the prototype |
| --- | --- |
| No " · " joins (rule 8.1) | A test fails the build if any rendered view contains " · " |
| Centered dialogs only | Dialog sm 400, md 560 or lg 800 on desktop and tablet; bottom sheet or full-screen steps on the phone, as each frame shows |
| Card anatomy | Padding 16, head 32 with title, actions and short texts; notes below the head |
| Overlays | Esc closes the innermost layer; focus is trapped and returned; "Discard changes?" when a form has input; only one menu or popover open at a time |
| Row menus | Drawn closed in every frame; the prototype opens them with the library's Dropdown menu and the items each group plan names. Tagged "Built from the pattern" |
| Hidden information | Per Navigation section 3: the CSO sees no result values or RoA files, links to a page the role cannot open are plain text, and a direct link to such a page shows No access |
| Read-only roles | No Add, Import, Edit, row menu or upload buttons |
| Toasts | Sentences, with **Undo** where the plan has it |
| Audit | Every change made in the demo writes an audit entry, so the Audit log and the History views show what the reviewer did |
| Notifications | The events N1 to N8 (App plan) create notifications for the roles that receive them, so switching role after a hand-off shows the bell badge |
| List filters (difference D7) | The owner rule of Nov 6 puts filters such as All / Unread on page Tabs (Notifications). The status filters of Job orders, Batches, Reports, Clients, Master data, Users, Parameters and the Dashboard Active batches card are still Filter chips. The prototype keeps them as drawn until you decide (open point 6) |

### 6.2 Spec only

These apply across groups. Each group plan adds its own.

- PDFs are sample images.
- Uploads keep only the file name.
- Import list and Import (S-16) show a toast.
- Input ROA and Review ROA are hidden, as in v1.
- Saved filters live in the browser.

## 7 · Demo data shared by every group

One data module, `prototype/src/data/`, holds the records the frames show. Where two modules draw the same record differently, the group plans settle it (differences D1 to D8).

| Item | Values |
| --- | --- |
| Today | **Thursday 5 November 2026**, the "Today" of the dashboard week strip and the Admin frames. Version 31 used 27 October. Records keep their history dates and new forms default to today (difference D5, Job order plan) |
| People | The ten accounts of the Admin frames. Role personas: Wahyu Pratama (Superadmin), Maya Lestari (Lab admin), Hendra Wijaya, S.T. (Supervisor), Ir. Bambang Sutrisno, M.T. (Manager, Head of Laboratory), Rina Kartika (CSO), Dedi Kurniawan (Preparation), Fitri Handayani (Analyst) |
| Clients | PT Bara Nusantara Mandiri, PT Kaltara Energi Prima, CV Sumber Batu Hitam, PT Mahakam Coal Resources, PT Bukit Asam Tbk (with the logo), PT Tambang Sentosa Abadi (archived) |
| Counts | Counts on chips, tabs and pagers are computed from the data, so they can differ from the numbers drawn ("128 job orders") |

## 8 · Differences and defects found in the frames

The details are in the group plan named in the last column.

| # | What | Plan |
| --- | --- | --- |
| D1 | JO-2026-0142 belongs to two clients (Job orders vs Reports) | Job order, Reports |
| D2 | PT Bara Nusantara Mandiri has two different contact lists | Job order, Master data |
| D3 | JO-2026-0141's Mark sent recipient is another client's contact | Job order |
| D4 | BNM-3507 sits on two job orders | Job order, Search |
| D5 | Job order and batch frames are dated about 10 days earlier than the rest | Job order, Batch |
| D6 | Draft CoA has "Type manually" for the signatory; the job order form does not | Reports |
| D7 | Filter chips vs page Tabs for list filters | This file, 6.1 |
| D8 | Signatory title | Job order |
| E1 | Phone client and drill hole forms show a stray **Start Preparation** button | Master data |

## 9 · Build phases and files

Each phase ends with a publish to the private preview artifact and a short note of what to try.

| Phase | Content |
| --- | --- |
| 1 · Foundation | Tokens Light and Dark, text styles, icons, the component layer, the app shell (section 5), router, review bar, demo data with the D1 to D8 decisions, No access |
| 2 · App, My work, Dashboard | App, My work and Dashboard plans |
| 3 · Job orders | Job order plan |
| 4 · Batches | Batch plan |
| 5 · Reports, Search | Reports and Search plans |
| 6 · Master data, Admin | Master data and Admin plans |
| 7 · Polish and hand-over | Skeletons on navigation, toasts, keyboard (`/` focuses search, Esc), reduced motion, Spec only list; all checks; after your go, publish to the shared link |

The source is split as follows, and `build.py` joins the files into one HTML:

- `src/ui/`: the components.
- `src/data/`: the demo data and rules.
- `src/modules/`: one file per group.
- `src/shell.js` and `src/review.js`.
- `src/styles/`: the generated tokens and text styles.

Version 31's `src` moves to `prototype/archive/src_v31/`.

## 10 · Checks

1. **Flows:** a headless run (jsdom, as in version 31) clicks every flow of every group plan at 1440, 834 and 390, with no console errors.
2. **Rules:**
   - No " · " in any view.
   - The sidebar of each role matches Navigation section 2.
   - No access appears on every hidden route.
   - The CSO sees no result values and no RoA links.
   - Read-only roles see no edit controls.
   - Every route in the group plans opens.
3. **Coverage:** every frame listed in the group plans is matched to a prototype view and state, checked by a script against the frame list of the main file.
4. **Looks:** for each screen, a headless Edge screenshot of the prototype sits next to a FigCraft render of its frame. Both stay in the scratchpad and are not exported to the docs. Differences are fixed or listed under Spec only.
5. **Theme:** each phase is checked once in Dark.

## 11 · Open points (shared)

Each group plan has its own open points as well.

| # | Question | Default if not answered |
| --- | --- | --- |
| 1 | Build in a private preview artifact, and update the shared link only at the end? | Yes |
| 2 | Is the phase order in section 9 right, or should a group you want to show the lab first come earlier? | Order as in section 9 |
| 3 | Gaps the frames leave open (row menus, the job order Files and History tabs, the Audit and History links): build them in the prototype from existing patterns, or draw frames first? | Build in the prototype, tagged "Built from the pattern"; draw frames later if you want them |
| 4 | Differences D1 to D8: also fix the frames to match the prototype data? | Yes, in one FigCraft pass after the prototype, together with E1 |
| 5 | Should the Flows panel also hold a short guided tour for first-time reviewers? | No; Flows and Start are enough |
| 6 | D7: should the status filters of the other lists also become page Tabs, like Notifications? | No; keep Filter chips as drawn |
