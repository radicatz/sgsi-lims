# Frames coverage check and Slice D plan (Nov 26 2026)

Scope: every FigCraft frame (Desktop 46599, Tablet 59975, Mobile Phone 59976) against the built app. Status: BUILT Nov 26, 2026 (slice D; Phase5_Build_Design.md section 14). Defaults A-1 to A-6 approved by the owner Nov 26.

## 1. Result

| Frame family | Status |
|---|---|
| 00-App-04 Sign in, 05 Forgot password, 06 Set password (all three sizes) | Built in slice D |
| Tablet Sidebar_open and the expand control on tablet frames | Built in slice D |
| Notifications panel, page, empty | Built |
| Session timeout dialog | Built |
| User menu and phone drawer | Built |
| Profile | Built (slice C) |
| No access, Menu drawer | Built |
| Job orders, Batches, My work, Dashboard (both tabs), Reports, Search | Built |
| Clients, Drill hole, Lithology, Seam, Users, Configuration, Audit log | Built |
| Dark mode | Tokens only (no switch); reviewed in the prototype; preview frame only |
| Import wizard (S-16) | On hold (owner) |
| RoA XLSX/CSV and list exports | Phase 6 |

## 2. Gaps in the auth family (D1)

Desktop is a split page: navy brand panel (white "Sentra Geo Survey Indonesia" logo, headline "Laboratory information system for coal analysis", faint mark, company name) beside the form on the shell colour. Tablet is a navy page with the white logo above the card. Phone is a shell page with the colour logo above the card.

Copy: "Coal analysis, from job order to certificate.", placeholders "name@sgsi.co.id" and "Enter your password", footer "Version 1.0" and "Privacy".

States to match:
- Locked: Warning alert "Try again at 10:42, or reset your password.", Reset password link, Sign in disabled until the lock time.
- Signed out: email prefilled, text "after 30 minutes without activity", return to the previous page after sign-in.
- Plain sign-out: Info alert "You signed out."
- Forgot: "It works for 60 minutes"; resend lock 60 s (app uses 42 s demo).
- Set password, Invite: "{Inviter} added you as {role badges}", email, ticking rules checklist.
- Set password, Reset: "For {email}".
- Expired link: reset offers Send a new link; invite says ask a Superadmin.
- After reset: success toast and email prefilled on Sign in.

Build items:
1. Auth layout component with three size variants; copy the logo assets from `.context/assets` (white and primary) into `apps/web/public`.
2. Extract the password rules checklist from Profile.tsx into a shared component.
3. `GET /auth/link-info` (token to inviter name, roles, email, purpose, expired flag). The inviter comes from the audit_log insert row actor_name. No schema change.
4. Sign in states, return-to-page, prefill, sign-out message.
5. Privacy link target.

## 3. Gap in the tablet sidebar (D2)

Add an expand control on the tablet rail. It opens the full sidebar over the content with a scrim. It closes on item click, scrim click or Esc (Dashboard plan section 9).

## 4. Tests (D3)

Extend the phase0/auth e2e at 1440, 834 and 390: layout per size, locked state (helper script to lock and unlock an account), signed-out return, invite and reset pages, tablet expand and close.

## 5. Owner decisions (approved Nov 26) and where each comes from

| # | Decision | Source |
|---|---|---|
| A-1 | Privacy opens a short dialog; the lab confirms the wording | App plan 3.1 footer "Privacy link (UU PDP No. 27/2022)"; V1 plan item 12 (staff names and emails, audit kept without expiry); spec 2252 (scope open) |
| A-2 | Resend locked for 60 s | App plan 3.3 "disabled for 60 seconds" (the frame's 0:42 is a moment in the countdown) |
| A-3 | Return to the page after sign-in | App plan 3.1 Signed out and 3.2 "or the page they were on before a timeout" |
| A-4 | Plain sign-out shows "You signed out." | App plan section 4 |
| A-5 | Inviter from the audit log; no name when none | App plan 3.4 Invite text; frame `06-Set_password-02-Invite` |
| A-6 | Other sessions stay signed in after a password change and after a sign-out elsewhere | No document covers it. Phase 5 plan 12.3 says only "the person stays signed in". Kept as the owner's default; a security review may prefer ending other sessions on a password change |

## 6. Slice C review notes

- Sign-ins are about 3,400 of about 4,400 audit rows (test-driven). C-3 shows them.
- An "All time" audit query scales with row count (phase 6 performance).
- Scatter tooltips are hover only, not keyboard accessible.
- PATCH /me prefs is a shallow merge.
- Change password on the phone is a bottom sheet, not full screen.
- The Drill holes RoA column shows RoA numbers as text, with no download link.
- seed:quality adds only RD values, so R² for CV and Ash is weak in demo data.
