# Navigation by Role — Design Plan

Nov 5, 2026 · plan, waiting for go

Each role sees only the sidebar items it can use. This plan sets the rule for every screen: which items each role sees, what happens at a page the role cannot open, and which frames change.

Sources: the permission grid in spec 8.2, the v1 scope in spec 1.1 and 9.2.1, My work queues in `../My Work/My_Work_Screen_Plan.md` and the Dashboard roles in spec S-01.

## 1 · The rule

1. **An item shows when the role can use its page.** It is not enough to hold a permission for one field or one action on another page. For example, a CSO picks a drill hole in the job order form but does not get the Drill hole page.
2. **Read or edit is decided on the page, not in the sidebar.** A role that sees an item but cannot edit gets the page without its write actions. No buttons are shown disabled for this; they are left out.
3. **Several roles add up (D-02).** A user with more than one role sees every item any of those roles sees.
4. **A group label shows only when at least one item under it shows.** If all its items are hidden, the label and its divider on the rail are hidden too.
5. **The sidebar order never changes.** Hidden items close up, and the module numbers in `../Design System/Frame_Naming.md` stay as they are.
6. **Next goal items are hidden from every role in v1.** Input ROA and Review ROA belong to the worksheet and review flow. In v1, results are entered on the batch page's Analysis tab (spec 9.2.1). This settles open point R6-3 of the Job Order plan.

## 2 · Sidebar items per role (v1)

✔ = sees the item. "read" = sees the page without write actions.

| Group | Item | Superadmin | CSO | Prep | Analyst | Lab admin | Supervisor | Manager | From permission |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | My work | | ✔ | ✔ | ✔ | ✔ | | | Has a v1 queue (S-19) |
| — | Dashboard | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | `dashboard.operations` |
| WORK | Job orders | ✔ | ✔ | read | read | read | read | read | `order.create` edits; everyone follows a job order |
| | Batches | ✔ | ✔ | ✔ | ✔ | ✔ | read | read | Batch actions per spec 9.2.1 |
| | Input ROA | v1: hidden from every role. Next goal: Superadmin, Analyst | | | | | | | `result.write` |
| | Review ROA | v1: hidden from every role. Next goal: Superadmin, Supervisor, Manager | | | | | | | `review.flag` |
| | Reports | ✔ | CoA only | | RoA only | ✔ | ✔ | ✔ | `roa.download`, `coa.download` |
| — | Search | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | `search.use` |
| MASTER DATA | Clients | ✔ | ✔ | | | read | | ✔ | `company.manage` |
| | Drill hole | ✔ | | | | ✔ | read | read | `master.write`, `coa.upload` |
| | Lithology | ✔ | | | | ✔ | read | read | `master.write` |
| | Seam | ✔ | | | | ✔ | read | read | `master.write` |
| ADMIN | Users | ✔ | | | | | | | `user.manage` |
| | Configuration | ✔ | | | | | | | `config.write` |
| | Audit log | ✔ | | | | | ✔ | ✔ | `audit.read` |

What each role's sidebar shows, top to bottom:

| Role | Items | Count | Start page |
| --- | --- | --- | --- |
| CSO | My work, Dashboard, Job orders, Batches, Reports, Search, Clients | 7 | My work |
| Preparation | My work, Dashboard, Job orders, Batches, Search | 5 | My work |
| Analyst | My work, Dashboard, Job orders, Batches, Reports, Search | 6 | My work |
| Lab admin | My work, Dashboard, Job orders, Batches, Reports, Search, Clients, Drill hole, Lithology, Seam | 10 | My work |
| Supervisor | Dashboard, Job orders, Batches, Reports, Search, Drill hole, Lithology, Seam, Audit log | 9 | Dashboard |
| Manager | Dashboard, Job orders, Batches, Reports, Search, Clients, Drill hole, Lithology, Seam, Audit log | 10 | Dashboard |
| Superadmin | Dashboard, Job orders, Batches, Reports, Search, Clients, Drill hole, Lithology, Seam, Users, Configuration, Audit log | 12 | Dashboard |

The start page is the first item the role sees: My work for roles with queues, Dashboard for the rest.

## 3 · Information inside pages

The sidebar is only the first layer. These rules hide information inside the pages for some roles. They come from spec 8.2 and the rule "the CSO never sees the internal RoA or raw results".

| Where | Rule | Roles affected |
| --- | --- | --- |
| Dashboard | The Quality & reports tab and its tab switch show only with `dashboard.quality` | CSO, Prep, Analyst see Operations only, with no tab switch |
| Dashboard | The "Your queues" strip shows only for roles with My work | Supervisor, Manager, Superadmin do not see it |
| Batch page, Analysis tab | Values are hidden. The tab shows progress ("26 of 36 values saved") and status only | CSO |
| Batch page, RoA card, and Reports | The signed RoA file cannot be opened or downloaded. Its number and status stay as plain text, not links | CSO, Prep |
| Job order, CoA tab, "Built from" list | The RoA number is plain text, not a link | CSO |
| Reports | The list holds only the document types the role can download | CSO sees CoAs; Analyst sees RoAs |
| Search | Results never include result values or RoA files | CSO |
| Job orders | Prep, Analyst, Lab admin, Supervisor and Manager see job orders read-only. Prep and Lab admin still add batches on the Batches tab (`batch.create`) | — |
| Links to a hidden page | A link to a page the role cannot open is shown as plain text | All |

## 4 · A page the role cannot open

If someone opens a hidden page by URL, an old bookmark or a shared link, they get a **No access** page inside the normal app shell. The sidebar has no item active.

| Part | Content |
| --- | --- |
| Empty state (Size=Page) | Icon `lock-simple`; title "You don't have access to this page"; text "Your role doesn't include this page. Ask your lab admin if you need it."; button **Go to My work** (or **Go to Dashboard**, the role's start page) |
| Audit | The attempt is not an error and is not logged as one |

## 5 · Frames

**New module 00 App** holds screens that are outside the sidebar: this plan's frames, and later Sign in, Notifications and Profile. Its row in `Frame_Naming.md` is added on go.

| SS | Screen | VV | Variant | Sizes | What it shows |
| --- | --- | --- | --- | --- | --- |
| 01 | Sidebar_by_role | 01 | Expanded | D | A board with seven expanded sidebars side by side, each labeled with its role and demo persona |
| 01 | Sidebar_by_role | 02 | Collapsed | T | The same board for the collapsed rail (tablet) |
| 02 | Menu_drawer | 01 | Lab_admin | P | Phone drawer open, Lab admin items |
| 02 | Menu_drawer | 02 | CSO | P | Phone drawer open, CSO items |
| 03 | No_access | 01 | Default | D, P | Section 4 |

That makes **6 new frames** in a new canvas row **J  App** below the Dashboard row (I).

### Built frames that change

Every built desktop and tablet frame gets the sidebar of the persona shown in its top bar. The phone frames have no sidebar drawn, so they don't change.

| Frames | Persona | Sidebar change |
| --- | --- | --- |
| Job orders, rows A to E (28 desktop, 9 tablet) | Rina Kartika, CSO | Hide Input ROA, Review ROA, Drill hole, Lithology, Seam, and the whole ADMIN group |
| Batch list (5 D, 1 T) and the Lab admin batch frames (2 D) | Maya Lestari, Lab admin | Hide Input ROA, Review ROA, and the ADMIN group |
| Batch list Batches_to_prepare (1 D) and Reception and Preparation frames (10 D, 3 T) | Dedi Kurniawan, Preparation | Hide Input ROA, Review ROA, Reports, MASTER DATA and ADMIN groups |
| Analysis frames (1 D, 1 T) | Fitri Handayani, Analyst | Hide Input ROA, Review ROA, MASTER DATA and ADMIN groups |
| My work (7 D, 3 T) | The role of each frame | As in section 2 |

Content changes from section 3 that touch built frames:

- CoA Sent frames (`03-Job_orders-05-CoA_and_actions-02-Sent`): the RoA number in "Built from" changes from Primary/primary to Text/text-secondary, because the persona is the CSO.
- No other built frame shows a CSO an RoA file or result values. The job order Batches tab shows RoA numbers as plain text already.

## 6 · How it is built

- **No new library variant.** Each frame's Sidebar instance gets visibility overrides: hidden Nav items and group labels. A helper `sidebarFor(role)` in the shell builder (`library/screens/`) returns the list, from the table in section 2, and every row generator calls it with its persona's role.
- **Tablet rail:** the same items are hidden, and so are the group dividers when their group is empty.
- **Phone drawer:** built for the two frames in section 5, from the expanded sidebar layout.
- **Order of work:** the shell helper and the retrofit of all built frames first, then row J. Then the Dashboard frames (row I, `../Dashboard/Dashboard_v2_Screen_Plan.md`) use the helper from the start.
- **Docs on go:** spec 8.3 "Navigation by role" with the table in section 2. S-14 changes to match the grid: the audit log is for Superadmin, Supervisor and Manager, where it now says "Superadmin only". My Work plan open point 1 is updated (see section 7, point 1). The Job Order plan's R6-3 is marked settled. `Frame_Naming.md` gets module 00.
- **Prototype:** the review bar already has a role switch. Applying these rules there is part of the deferred prototype update.

## 7 · Open points (defaults used until answered)

| # | Question | Default |
| --- | --- | --- |
| 1 | Supervisor, Manager and Superadmin have no v1 queue. Should My work still show for them? | **Hidden.** It would always be empty. This changes My Work plan open point 1, which kept it showing "All caught up" |
| 2 | Input ROA and Review ROA in v1 | Hidden from every role until the next goal |
| 3 | Analyst and Prep: see Job orders? | **Read-only.** They can see the client's parameters, standard and due date. The job order link in the batch header keeps working |
| 4 | Audit log: spec S-14 says Superadmin only, but the grid in 8.2 adds Supervisor and Manager | Follow the grid |
| 5 | Lab admin and Clients | Read-only. Client defaults such as the signatory are saved from the report flow, not on the Clients page |
