# Configuration — Build Design

Written Nov 10, 2026, for phase 1 of `../Project/V1_Build_Plan.md`. The screens are specified in `Admin_Screen_Plan.md` section 6; this file says how they are built and tested. It also covers schema change C-18 (sample identifiers, spec 6.1), which phase 1 starts.

## 1 · Scope and order

Two slices, each committed when its checks pass.

| Slice | Sections | Why first or second |
| --- | --- | --- |
| A | C-18 migration; hub; **Security**, **Laboratory** (with branch offices and numbering), **Lookups**, **Parameters**, **Validation rules**, **Formulas** (view) | Settings and plain lists; the sign-in lock, reception and the job order form read them |
| B | **Services** (versioned), **Methods and standards** (matrix), **Report templates** (versioned, text fields and preview) | Versioning rules: a change makes a new version; old job orders and CoAs keep theirs |

Next goal sections (Result tabs, Field definitions) show in the hub with a tag and are not clickable.

## 2 · Three perspectives

| Perspective | Design |
| --- | --- |
| Backend | `apps/api/src/routes/config.ts`. Reads need `config.write` (the hub is the Superadmin's); the job order form and other screens read the same tables through their own routes later. Writes need `config.write`, run as the user (`asUser`), so the `*_write` policies (`has_permission('config.write')`) check again and the audit trigger records the change with the screen name. Every body is a zod schema: settings are validated field by field (numbers within bounds, patterns from a fixed token list); list items have length limits and enums |
| Frontend | `apps/web/src/features/admin/Config.tsx`: the hub (section list left at 260, content right; a Select on the tablet; the list then full-screen sections on the phone, read-only cards there), one component per section, list items edited in centered dialogs (md), settings pages with **Save** and **Restore defaults**. Client-side checks mirror the server's and show inline; the server's field errors land on the same fields |
| Security | No secrets or user data leave these routes. Inputs are parameterised (postgres.js tagged queries; the one dynamic table name comes from a fixed list, never from the request). Settings that weaken sign-in (lock after more than 10 attempts, passwords under 8 characters) are refused by the schema. A parameter in use is deactivated, never deleted, and its code is locked. Formulas are read-only (S-15). Each save writes an audit row; changes to Security are also logged by the API |

## 3 · C-18 migration (0800)

| Change | Detail |
| --- | --- |
| `samples` | `sample_ref` → `client_ref`; `lab_code` → `sample_no` (the Sample ID, unique); new `sample_code`, `lot` (default `Lot01`) |
| `companies.company_code` | 3 digits, unique, the next free number when a client is created; editable by a Superadmin until the client's first received sample, then locked |
| `batches.branch_code` | 2 letters, default `RI` |
| `sample_counters` and `next_sample_no(company, branch, day)` | Numbers per company and date from 001; refuses past the width's maximum (999) with a message |
| Settings | `laboratory.branches` = `[{code: RI, name: Rapak Indah}]`; `numbering.sample_id` = `SG.{YYMMDD}.{CCC}.{BB}.{NNN}`, `numbering.sample_code` = `{CCC}.{BB}.{NNN}.{LOT}`, `numbering.sample_no_width` = 3; `lab_code` removed |
| Audit label and `v_samples` | Use `sample_no` and `client_ref` |

## 4 · Acceptance

- A Superadmin changes the lock-after count; the next wrong passwords lock at the new count. A lab admin cannot open Configuration (No access) and gets 403 from every route.
- Lookups: add, rename, reorder, deactivate a value; a condition's "needs a remark" switch saves.
- Parameters: edit name, unit, decimals, typical range; deactivate; the code of a parameter in use cannot change; group chips and search filter the table.
- Validation rules: severity Warn or Block and bounds save; fixed rules are read-only.
- Laboratory: name, place of issue, numbering patterns (only known tokens), branch offices add and rename.
- Formulas: listed with expression and version; no edit control.
- Every save writes an audit row with the screen "Configuration".
- Live API checks and browser tests at 1440, 834 and 390 pass; screenshots reviewed.
