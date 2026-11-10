# SGSI LIMS

The SGSI Coal LIMS: the v1 application (code at the root) and the planning, research, design and prototype material under `.context/`.

## Code

| Folder | What is in it |
| --- | --- |
| `apps/web` | The web app: React 19, Vite, React Router, TanStack Query. Styles and components are ported from prototype v2; tokens come from the design file (`pnpm --filter @sgsi/web tokens`) |
| `apps/api` | The API: Fastify, running each request as the signed-in user so the database's row-level security applies |
| `packages/shared` | Shared by both: permission codes and the sidebar by role, status labels, request shapes, calculations (FC, NCV, basis conversion) in exact decimals |
| `supabase/migrations` | The database, SQL first: schema, audit trigger, row-level security, reference data. Applied to the Supabase project `sgsi-lims` |

Run it locally (Node 22 or newer, pnpm 10):

1. Copy `.env.example` to `.env` and fill the two secrets as its comments explain. Add `DEMO_PASSWORD=` for the demo accounts.
2. `pnpm install`, then `pnpm seed:demo` once (creates the demo accounts: wahyu@, maya@, hendra@, bambang@, rina@, dedi@, fitri@ … sgsi.co.id).
3. `pnpm dev` starts the API on port 4000 and the web app on http://localhost:5173.
4. Checks: `pnpm test` (unit tests), `pnpm exec playwright test` (browser tests at 1440, 834 and 390; starts both servers and needs the demo accounts), and `pnpm --filter @sgsi/api exec tsx --env-file=../../.env scripts/check-roles.ts` (live role and sign-in lock check against a running API).

The plan for the build is `.context/docs/Project/V1_Build_Plan.md`; the technology choices are in `Stack_Decision_Record.md`.

## Planning and design material

Everything below lives under `.context/`.

| Folder | What is in it |
| --- | --- |
| `.context/docs/` | Our written plans and specifications, one folder per screen group: `Project/` (development spec, research plan), `Design System/` (component library, design tokens, frame naming), `Navigation/`, `My Work/`, `Dashboard/`, `Job Order/`, `Batch/`, `Master Data/`, `Reports/`, `Search/`, `App/`, `Admin/`, `Prototype/`, and `archive/` for superseded plans. `.context/docs/README.md` lists every file |
| `.context/design/figcraft/` | **Current design file**: `SGSI-LIMS-screens.figcraft`, open it with FigCraft (github.com/storytold/figcraft). Pages Library, Desktop, Tablet and Mobile Phone: the component library, styles, colour tokens (Light and Dark) and every v1 screen group (canvas rows A to O). `library/` holds the generators, `library/screens/` the screen builders, `tokens/` the exported tokens, `tools/` the older pen.dev converter; `backup/` keeps only the stage-base file that `library/build.js` starts from. Fonts needed: Noto Sans, Newsreader and JetBrains Mono |
| `.context/design/export/` | PNG of every frame, one folder per size (`desktop/`, `tablet/`, `phone/`), written by `library/scratch/export_all.js` on request. `v1/` and `../screens-export.html` are the last pen.dev state the FigCraft file was first built from |
| `.context/screens.pen` | The earlier design file (pen.dev, up to Revision B); frozen |
| `.context/prototype/` | Clickable prototype v2 of the whole v1 app: `src/` is the source, `python build.py` writes `sgsi-lims-prototype.html`; `archive/` holds the v1 job order prototype sources |
| `.context/source-documents/` | Documents received from the client and lab: proposal, SIM Lab deck, shipment workbook, sample CoA and RoA |
| `.context/deliverables/` | Things we produced: RoA templates and the company profile page |
| `.context/research/` | Vendor and training material: AssayNet, Clarity LIMS, a general LIMS training deck, Revol, and one design inspiration image |
| `.context/assets/` | SGSI and client logos (SVG and PNG); `images/` holds the PNG copies the pen.dev file used |

Not tracked by git: `.context/research/` (about 710 MB of videos, screenshots and PDFs, so it exists only on this machine and is not covered by git history) and FigCraft's working files (`figcraft/scratch/`, `figcraft/backup/`, `figcraft/library/scratch/` except its scripts).
