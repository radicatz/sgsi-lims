# Configuration slice B: plan

Written Nov 12, 2026. Slice B of `Configuration_Build_Design.md`: **Services**, **Methods and standards**, **Report templates**. The screens come from `Admin_Screen_Plan.md` §6.2 and the row O frames listed in §6 below. Waiting for go before building.

## 1 · What versioning means here

| Section | One "thing" | A version | Rule |
| --- | --- | --- | --- |
| Services | A service code (`basic`, `coking`, …) | A `services` row with that code and a version number | At most one **Active** and one **Draft** per code. Editing an Active service saves a new version. Editing a Draft changes it in place. Activating a version archives the previous Active one. Job orders point to the row they used, so they keep their version. A version used by a job order is never deleted. |
| Methods and standards | A parameter and a standard family (Ash, ASTM) | A `standards` row (code and edition) with its `methods` row | **New edition** adds a standard row and a method row, and moves `is_default` to the new one. The old one stays for results entered before. A cell shows the default method only. |
| Report templates | The house CoA template (v1 has one) | A `report_templates` row (revision) | At most one **Draft** and one **Active**. **New version** copies the Active one into a Draft. **Activate** archives the previous Active one. CoAs point to the revision they used. |

Status words on screen: Draft, Active, Archived. The database keeps its words (`retired` for services, `current`/`retired` for templates) and the API maps them.

## 2 · Screens

### Services (frames 03-01 List D/T, 03-02 Edit D)

- **Desktop table:**
  - Columns: Name, Parameters ("7 parameters"), Turnaround ("5 days"), Version ("v3"), Status badge, a Default tag, and a ⋯ menu.
  - One row per version that is Active or Draft. A code with both shows two rows, as in the frame (Coking coal v2 Active, v3 Draft).
- **⋯ menu:** Edit, Activate (Draft), Set as default (Active), Archive (Active, not the default), Delete (a Draft never used).
- **Add service / Edit service dialog (lg):**
  - Fields: Name, Turnaround target (days), Status (Draft or Active).
  - **Parameters**: pills grouped by category, as on the job order form, with "(16 selected)" in the label.
  - **Default for new job orders** switch.
  - A note: "Saving makes version N. Job orders keep the version they used."
  - Buttons: Cancel, and "Save as version N" (or "Save" for a Draft).
- **Tablet:** the frame's columns Name, Parameters, Status, ⋯.
- **Phone:** read-only cards with name, version, status, parameter count and turnaround.

### Methods and standards (frames 04-01 Matrix D, 04-02 Edit D)

- **Matrix:** one row per parameter that has at least one method. Columns: Parameter, ASTM, ISO, GB/T. A cell shows `D3174-12` or `ISO 1171:2010` in mono, or a muted "No method".
- **Clicking a cell with a method** opens **New edition** (md). The fields are:
  - The parameter, read-only.
  - Standard, read-only.
  - Method, prefilled.
  - Edition.
  - Title.
  - Repeatability r and Reproducibility R.
  - A note: "The 2012 edition stays on results entered before."
  - It also has **Edit**, to fix a typo in r, R or the title without a new edition.
- **Clicking an empty cell or "Add method"** opens the same dialog with Parameter and Standard to choose.
- **Tablet:** the same matrix, which fits at 834.
- **Phone:** one card per parameter listing its three methods.

### Report templates (frames 06-01 List D, 06-02 New_version D)

- **Header:** the card is titled "House CoA template", with the line "One template in v1; templates per client are next goal. Activating a version changes new CoAs only."
- **List:** Version, Status, Changed by, Date, Note, ⋯ (Open, Activate for a Draft, Delete for a Draft).
- **New version / Open draft:** a page inside the section, as in the frame. It has two cards:
  - **Version N (draft)** card with the fields Title, Form code, Statement, Terms line, and Note (what changed). Its buttons are Save draft, Activate and Cancel.
  - **Preview** card: an A4-width drawing of the certificate with demo results. The fields update it as you type.
- **Archived and Active versions** open read-only, with the preview.
- **Tablet:** list without Note; the page stacks the same way.
- **Phone:** version cards; opening one shows the fields read-only and the preview scaled down.

### Hub

The three sections lose the "Built in the next slice" text. They show counts:
- **Services:** active services.
- **Methods:** default methods.
- **Templates:** template versions.

They also show "Last changed …" like the others.

## 3 · Backend (`apps/api/src/routes/config.ts`)

Every write needs `config.write`, runs as the user (RLS `*_write` policies check again) and writes an audit row with the screen "Configuration". Bodies are zod schemas.

| Route | Does |
| --- | --- |
| `GET /config/services` | Active and Draft versions with parameter ids, counts, default flag |
| `POST /config/services` | New service (version 1) |
| `PUT /config/services/:id` | Draft: update in place. Active: insert version N+1 with the parameters; if saved as Active, archive the old one |
| `POST /config/services/:id/activate`, `/default`, `/archive`; `DELETE` (draft, unused) | |
| `GET /config/methods` | Matrix: parameters × families with the default method, plus all editions for the dialog |
| `POST /config/methods` | New method or new edition (standard row upsert, method row, default moved) |
| `PUT /config/methods/:id` | r, R, title only |
| `GET /config/templates`, `GET /config/templates/:id` | Versions; one version with its fields |
| `POST /config/templates/:id/draft` | Copy into a new Draft (refused if a Draft exists) |
| `PUT /config/templates/:id` | Save a Draft's fields |
| `POST /config/templates/:id/activate`; `DELETE` (draft) | |

## 4 · Schema change C-19 (the owner runs it in the SQL editor, as with C-18)

| Table | Change | Why |
| --- | --- | --- |
| `services` | add `created_by uuid references users`, `note text`; partial unique indexes: one `active` and one `draft` per `code`; one `is_default` among `active` | Changed by, and the version rules held by the database |
| `report_templates` | add `fields jsonb not null default '{}'` (title, statement, terms), `note text`, `created_by`, `created_at`; replace `unique (form_code, revision)` with `unique (kind, company_id, revision)` (nulls not distinct); partial unique indexes: one `current` and one `draft` per kind and company | Form code may change between versions (the frame's v3 note); text fields stored apart from the future HTML layout (R-10) |
| `methods` | none; one default per parameter and family is held by the API | |
| Seed | fill `fields` of FM-LAB-014 rev 3 with the frame's text | |

## 5 · Tests

- **`apps/api/scripts/check-config.ts` gets slice B checks:**
  - Version on edit, and in-place edit of a draft.
  - One active per code.
  - The default switch.
  - Archive refused on the default.
  - Delete refused on a used or active version.
  - A new edition moves the default and keeps the old one.
  - Template draft copy, activate and archive.
  - 403 for a lab admin on every route.
- **`e2e/phase1-config.spec.ts` gets flows at 1440, 834 and 390:**
  - Edit a service into a new version, then activate it.
  - Add an ASTM edition.
  - Make a template draft, edit its title, see the preview update, then activate it.
  - Phone read-only cards.
- Test data cleanup extended (services and templates with a `ZT ` name or note).

## 6 · Frames

The six desktop frames and the tablet Services frame exist (row O). These are not drawn: Services phone, Methods tablet and phone, Report templates tablet and phone, Add service, Add method. The app follows the slice A patterns for them (tablet table, phone read-only cards).

## 7 · Open points (defaults used unless you say otherwise)

| # | Question | Default |
| --- | --- | --- |
| 1 | Editing an Active service | Saves a new version, Draft or Active as chosen in the dialog |
| 2 | Archived service versions | Hidden from the list; a "Show archived" chip shows them |
| 3 | Methods: fix a typo without a new edition | Allowed for title, r and R; method code and edition only through New edition |
| 4 | Template footer text | Not editable; v1 fields are Title, Form code, Statement, Terms line, Note (the frame) |
| 5 | Draw the missing frames first | No; build the app on the slice A patterns, draw frames later if you want them |
| 6 | Schema change C-19 | I write the SQL file; you run it in the Supabase SQL editor, I verify |
