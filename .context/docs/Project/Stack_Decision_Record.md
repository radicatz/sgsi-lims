# SGSI LIMS — Stack Decision Record

Written Nov 10, 2026. **Status: proposed, waiting for go** (open points in section 4).

This record fixes the technology for the v1 build. It replaces the "Technical architecture & stack" and "v1 shortcuts" sections of `Coal_LIMS_Research_and_Project_Plan.md`, which left several choices open ("NestJS or Fastify", "Keycloak or Supabase Auth", "MinIO or Supabase Storage"). The spec's decisions D-22 (Supabase Storage), D-23 (email and password), D-25 (containers that run on a vendor cloud or a client server) and D-29 (audit of every Core table) stand. The build order is in `V1_Build_Plan.md`.

## 1 · What v1 has to do

The choices below follow from what the v1 screens need, not from the original four-week plan:

- Around 30 screens at three widths, with seven roles and different data per role (Navigation plan).
- Server-side rules: job order, batch and report state machines, sample states, the FC calculation, range warnings, locking after reception and completion, numbering.
- Files: signed RoAs, drill hole CoAs, job order files, reception photos, client logos. One generated PDF type, the CoA, plus label sheets.
- In-app notifications at each hand-off, an audit log of every change, and saved searches.
- Sign-in with invites, reset links, a lock after failed attempts and idle sign-out. All of these are on the App screens.

## 2 · Decisions

| # | Area | Decision | Why | Instead of |
| --- | --- | --- | --- | --- |
| S-1 | Repository | One repo (the existing GitHub repo), pnpm workspaces. `apps/web`, `apps/api`, `packages/shared`, `supabase/` (migrations, seed, config), `infra/` (Compose, Caddy). Docs stay in `.context/` | Web and API share types, permission codes, state machines and the calculation; one pull request changes all three | Separate repos |
| S-2 | Language | TypeScript 5 (strict) everywhere, Node.js 22 LTS | One language from the database types to the screen | — |
| S-3 | Database, auth, storage | **Supabase**: Postgres, Auth (email and password, invite, reset), Storage (S3 API), row-level security | Removes auth and file plumbing; the spec's schema and policies are written for it. Local development runs the same stack through the Supabase CLI | Keycloak, MinIO, plain Postgres |
| S-4 | API | **Fastify 5** with zod schemas (`fastify-type-provider-zod`) and generated OpenAPI | Small and fast; schemas double as validation and documentation; little ceremony for a small team | NestJS (more structure, more boilerplate) |
| S-5 | Data access | SQL-first migrations in `supabase/migrations` (the spec's DDL is SQL). **Drizzle ORM** for typed queries, with its schema introspected from the database | The database stays the source of truth for constraints, triggers and policies; the code gets types without hand-written models | ORM-generated migrations |
| S-6 | Who talks to the database | **The web app calls only our API.** The API runs each request as the signed-in user (JWT claims set per transaction), so row-level security still applies. Status changes and other privileged steps run in `security definer` functions (`transition_order`, `transition_batch`, `transition_report`) | One permission model, one audit `request_id` per action, no rules in the browser. RLS remains a second line of defence | The browser calling Supabase REST directly for simple CRUD (spec 14.1): two access paths to secure and test |
| S-7 | Front end | **React 19 + Vite**, React Router 7, **TanStack Query** for server state, react-hook-form + zod (shared schemas), TanStack Table + TanStack Virtual for lists and the analysis grid, `@phosphor-icons/react`, date-fns | Matches the prototype's structure; the query cache gives the refetch and optimistic updates the screens need | Next.js (server rendering is not needed for an internal tool) |
| S-8 | Styling | The design tokens from `design/figcraft/tokens/sgsi-tokens.css` as CSS variables (Light and Dark) and **CSS Modules**, porting the prototype's `styles.css` component by component. Fonts: Noto Sans, Newsreader, JetBrains Mono | The prototype already maps every library component to CSS; nothing to translate into another system | Tailwind (would re-encode the tokens a second time) |
| S-9 | Charts | **ECharts 5** (through a thin React wrapper) | Spec 15; tooltips, zoom and large scatter sets come built in | Hand-drawn SVG (fine for the prototype, costly to extend) |
| S-10 | Calculation | `packages/shared/calc` with **decimal.js**; the same function runs in the browser for preview and on the server for the saved value | Spec 12.2: no float drift on certificates, one implementation | — |
| S-11 | PDF | **Gotenberg 8** container. The API renders HTML from the active report template (Handlebars), Gotenberg turns it into PDF; the API stores the file and its SHA-256 | Spec 14.3; pixel-stable output | Browser printing, PDF libraries in Node |
| S-12 | Files | Supabase Storage buckets: `signed-roa`, `coa-drill-hole`, `job-order-files`, `sample-photos`, `client-logos`, `reports`. Downloads through short-lived signed URLs issued by the API | D-22 | — |
| S-13 | Notifications | A `notifications` row per recipient, written in the same transaction as the hand-off; the web app polls every 30 s through TanStack Query | Enough for in-app hand-offs (D-28); Realtime can replace polling later without a schema change | Supabase Realtime now |
| S-14 | Audit | One generic trigger on every Core table writes `audit_log` with the actor from the JWT, the API's `request_id` and the screen name sent by the web app | D-29; cannot be bypassed by an application bug | Application-level logging |
| S-15 | Sign-in rules | Sign-in goes through `POST /auth/sign-in` on the API, which counts failed attempts per account (`profiles.failed_attempts`, `locked_until`) and then calls Supabase Auth. Idle sign-out is a client-side timer using the Security setting, with refresh tokens limited server-side | The lock after 5 tries and the warning dialog are on the App screens; Supabase Auth does not count per-account failures on its own | Relying on Supabase rate limits only |
| S-16 | Time | Store timestamps in UTC; show them in the lab's time zone from Configuration, default **Asia/Makassar (WITA, UTC+8)** for Samarinda. Dates without time (due dates, batch dates) are plain `date` columns | Avoids the off-by-one-day errors a UTC conversion causes for date-only values | Browser time zone |
| S-17 | Testing | Vitest for `shared` (calculation, state machines) and the API against a real local Supabase; permission and RLS tests per role; **Playwright** end-to-end tests at 1440, 834 and 390, starting from the prototype's 49 flows | Spec 16; the prototype flows are already a test script | — |
| S-18 | CI | GitHub Actions on every pull request: lint, typecheck, unit tests, migrations applied to a fresh database, end-to-end tests. Images pushed to GitHub Container Registry | The repo is already on GitHub | — |
| S-19 | Deployment | Docker Compose behind **Caddy** (TLS): `web` (static files), `api`, `gotenberg`. Supabase runs beside it, as Supabase Cloud or self-hosted, per open point 2. Nightly database dump and storage copy, restore tested before go-live | D-25; the same files run on a VPS or the client's server | Kubernetes |
| S-20 | Logs and errors | pino JSON logs, `/health` endpoints; an error tracker is optional | Enough for one site | — |

### What changes from the spec and research plan

| Earlier text | Now |
| --- | --- |
| Spec 14.1: CRUD through Supabase REST with RLS | Every call goes through the API (S-6); RLS stays on as defence in depth |
| Spec 15: AG Grid community for entry | Not needed in v1: the Analysis tab enters one final value per sample and parameter (D-47). TanStack Table + Virtual; revisit AG Grid when the worksheet (S-09) is built |
| Spec 15: tokens and components from `screens.pen` | From the FigCraft library and `sgsi-tokens.css`, through the prototype's component layer |
| Research plan: BullMQ + Redis worker | Not in v1. Gotenberg is called directly; a queue arrives with email notifications |
| Research plan: "NestJS or Fastify", "Keycloak or Supabase Auth", "MinIO or Supabase Storage" | Fastify, Supabase Auth, Supabase Storage |

## 3 · Risks to check early (in phase 0)

| Risk | Check | Fallback |
| --- | --- | --- |
| Running every request as the user through the API (S-6) is slower or harder than expected | Spike: one list endpoint with RLS through Drizzle, measured | Use the service role in the API and enforce permissions in code, keeping RLS for direct database access only |
| Supabase Auth invite and reset emails need an SMTP sender | Configure the client's mail domain or a transactional mail service | Reset links shown to the Superadmin to pass on manually |
| Self-hosted Supabase is heavy for a small on-site server (about ten containers) | Size it if the client chooses its own server | Supabase Cloud, region Singapore |
| Label printing on the lab's printer (Zebra ZD421 on the screens) | Print one PDF label sheet from the browser on the real printer | ZPL output from the API |

## 4 · Open points

| # | Question | Default if not answered |
| --- | --- | --- |
| 1 | API framework: Fastify (lean) or NestJS (more structure)? | Fastify |
| 2 | Where does production run: Supabase Cloud (Singapore) with our containers on a VPS, or everything on the client's own server? Data protection under UU PDP may decide it (R-11) | Cloud for development and staging now; production waits for R-11 |
| 3 | The web app calls only the API (S-6), or also Supabase directly for simple lists? | API only |
| 4 | Charts in ECharts (S-9), or keep the prototype's SVG charts? | ECharts |
| 5 | Lab time zone: Asia/Makassar (WITA) for Samarinda? | Asia/Makassar |
| 6 | Who builds: Claude builds phase by phase and you review each phase on a staging link, or a development team takes over with this record and the plan? | Claude builds, you review each phase |
