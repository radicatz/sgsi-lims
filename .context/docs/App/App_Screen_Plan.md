# App screens plan: sign in, notifications, profile

Written Nov 6, 2026. **Status: BUILT Nov 6, 2026** (section 16). Module 00 App (screens outside the sidebar), new screens 04 to 10, canvas row **N**. Builds on spec S-00 (sign in), S-12 (notifications), S-13 (profile), D-23 (authentication), D-24 (language), D-28 (notification events), F-AUTH-01 to 03 and F-NTF-01 to 02 (`../Project/Coal_LIMS_Development_Spec.md`), the SIM Lab login (`source-documents/simlab view.pptx`, slide 1), the role sidebar and No access page (`../Navigation/Navigation_Screen_Plan.md`) and the v1 queues (`../My Work/My_Work_Screen_Plan.md`, section 2).

## 1 · Goal

The screens every user passes through but no sidebar item opens: signing in and getting back in, the bell and what it tells you, your own profile and settings, and the menu behind your name in the top bar. Today the top bar draws a bell and a user chip with nothing behind them.

## 2 · Decisions this plan follows

| Topic | Decision (spec) | What it means here |
| --- | --- | --- |
| Sign in | Email and password with reset, as SIM Lab; company directory later (D-23) | Email, Password, **Forgot password?**, **Sign in**. No directory button in v1 |
| Language | English labels, Indonesian terms kept for RoA and CoA; dates `dd MMM yyyy` (D-24) | SIM Lab's "Lupa Password?" becomes **Forgot password?**; no language switch on the sign-in page; Profile shows the language as fixed |
| Session and lockout | Idle timeout; lock after repeated failures with a message (F-AUTH-03) | Defaults in section 14: sign out after 30 minutes idle with a 60-second warning; lock for 15 minutes after 5 failed attempts |
| Notifications | In-app only, one event per queue hand-off (D-28) | D-28 lists the full-flow events (supervisor gates). v1 has no gates, so the events follow the **v1 queues** (section 5.1). Email is next goal |
| Profile | Name, email (read-only), change password, sidebar preference, language (S-13) | Plus the notification switches per event, so a user can mute what does not concern them |

## 3 · Sign in and getting back in

### 3.1 Sign in `/login`

Desktop (1440): a split page.

```
┌ Brand panel (Primary/primary-deep) ──────┐┌ Form side (Surface/shell) ─────────────┐
│  [SGSI logo, white, full]                ││        ┌ Card 400 ──────────────────┐  │
│                                          ││        │ Sign in                    │  │
│  Laboratory information system           ││        │ Coal analysis, from job    │  │
│  for coal analysis                       ││        │ order to certificate.      │  │
│                                          ││        │ Email                      │  │
│                                          ││        │ [maya@sgsi.co.id        ]  │  │
│            (large logo mark, 8 %)        ││        │ Password                   │  │
│                                          ││        │ [••••••••••          (eye)]│  │
│  PT Sentra Geo Survey Indonesia          ││        │            Forgot password? │  │
│                                          ││        │ [         Sign in         ]│  │
└──────────────────────────────────────────┘│        └────────────────────────────┘  │
                                            │   Version 1.0   Privacy                │
                                            └────────────────────────────────────────┘
```

| Part | Spec |
| --- | --- |
| Brand panel (left half) | `Primary/primary-deep` fill; the **Logo** Type=Full, Color=White at the top; one line "Laboratory information system for coal analysis"; the logo mark (Type=Icon, White) large at 8 % opacity as the illustration; company name at the bottom. Hidden below tablet (S-00) |
| Card | Surface/card, radius 16, padding 32, width 400; title **Sign in** (Heading/H1), one line under it |
| Fields | **Email** (Text field, lg on desktop, touch on phone, keyboard type email); **Password** (new **Password field**, section 8, with the show/hide eye) |
| Forgot password? | Link button, right-aligned under the password; opens 3.3 |
| Sign in | Button Primary lg, full width; shows the Loading state while checking |
| Footer | Version and a Privacy link (UU PDP No. 27/2022), Caption, under the card |
| Remember me | Not shown (SIM Lab has none, spec open point); the session follows the idle timeout |

**States** (Inline alert at the top of the card; the fields keep what was typed, the password is cleared):

| State | Alert | Notes |
| --- | --- | --- |
| Wrong credentials | Error: "The email or password is not correct." | Generic: never says which one, never says whether the email exists |
| Locked | Warning: "Too many failed attempts. Try again at 10:42, or reset your password." | After 5 failures in 15 minutes; Sign in disabled until the time; **Reset password** link in the alert |
| Inactive | Error: "This account is inactive. Ask your Superadmin to activate it." | Same layout as Wrong credentials (no separate frame) |
| Signed out | Info: "You were signed out after 30 minutes without activity. Sign in to continue." | Email pre-filled; after sign-in the user returns to the page they were on |
| No access after sign-in | — | A page the role cannot open shows the existing **No access** page (row J) |

### 3.2 Where the user lands

My work for roles that have it, otherwise the Dashboard (spec 8.3), or the page they were on before a timeout.

### 3.3 Forgot password `/forgot-password`

Same page, the card changes: title **Reset your password**, text "Enter the email you sign in with. We send a link to set a new password.", Email, **Send reset link** (Primary lg), **Back to sign in** (Ghost). After sending: title **Check your email**, text "If an account uses maya@sgsi.co.id, a link is on its way. It works for 60 minutes.", **Resend link** (disabled for 60 seconds, then enabled), **Back to sign in**. The message is the same whether or not the account exists.

### 3.4 Set a password `/set-password?token=`

One page for two cases: a **reset** link and a **new user's invite** (S-02 add form: "initial password or invite link").

| Part | Reset | Invite |
| --- | --- | --- |
| Title | Set a new password | Welcome to SGSI LIMS |
| Text | For maya@sgsi.co.id | "Hendra Wijaya added you as **Supervisor**. Set a password to sign in." with the roles as Role badges |
| Fields | New password, Confirm password (Password fields) | Same |
| Rules | A checklist under the fields that ticks as the user types: at least 10 characters; a letter and a number; not your email | Same |
| Action | **Set password**, then a success toast on the sign-in page with the email pre-filled | **Set password and sign in**, straight into the app |
| Expired link | Card "This link has expired" (reset after 60 minutes, invite after 7 days), **Send a new link** (reset) or "Ask your Superadmin for a new invite" (invite) | |

## 4 · User menu (the name in the top bar)

Clicking the user chip opens a menu under it (width 280, Elevation/md):

```
┌──────────────────────────────┐
│ (ML) Maya Lestari            │
│      maya@sgsi.co.id         │
│      [Lab Admin]             │   Role badges, one per role (roles add up, D-02)
├──────────────────────────────┤
│ Profile                      │
│ Notification settings        │
├──────────────────────────────┤
│ Sign out                     │
└──────────────────────────────┘
```

Menu items are the library **Menu item**; Sign out signs out at once (no confirmation) and opens the sign-in page with "You signed out." (Info). On the phone the **Menu drawer** (row J) gets the same block at its bottom: avatar, name, roles, Profile, Sign out.

## 5 · Notifications

### 5.1 Events in v1 (in-app)

One notification per hand-off between queues, sent to the roles whose queue the record enters; the person who did the action does not get it.

| # | Event | Goes to | Title and text (example) | Opens |
| --- | --- | --- | --- | --- |
| N1 | Batch created | Preparation, Lab admin (Q1) | "B-2026-0422 is ready to receive" / "Created by Rina Kartika for JO-2026-0137." | Batch, Reception |
| N2 | Samples returned to awaiting arrival | CSO (Q2) | "2 samples of JO-2026-0137 did not arrive" / "Add them to a new batch when they come, or mark them not received." | Job order, Batches |
| N3 | Preparation finished | Analysts (Q4) | "B-2026-0417 is ready for data entry" / "12 samples, ADL done by Dedi Kurniawan." | Batch, Analysis |
| N4 | Analysis finished | Lab admin (Q5) | "B-2026-0417 analysis is finished" / "Upload the signed RoA to complete the batch." | Batch, RoA card |
| N5 | Every batch of a job order completed | Lab admin (Q6) | "All batches of JO-2026-0131 are completed" / "Generate the CoA." | Job order, CoA |
| N6 | CoA published or revised | CSO (Q7) | "CoA-JO-2026-0131-2 is published" / "Send it to PT Bara Nusantara Mandiri." | Report page |
| N7 | Batch due within 24 hours | The roles of the queue the batch is in | "B-2026-0422 is due within 24 h" / "It is still in reception." | Batch |
| N8 | Batch past its deadline | Supervisor, Manager (they have no queue in v1) | "B-2026-0415 is past due" / "Due 4 Nov. It is in Analysis finished." | Batch |

Next goal (D-28 as written): results to approve, RoA returned or approved, recheck flagged, escalations, and email.

### 5.2 Bell and panel (desktop, tablet)

- **Bell:** the top bar bell gets an unread badge (Count pill, Tone=Alert, "3"; "9+" above nine). No badge when everything is read.
- **Panel** under the bell (width 400, Elevation/md): header **Notifications** with **Mark all read** (Link button); a **Segmented control** All / Unread; up to 6 **Notification items** (section 8); footer **See all notifications**. Clicking an item opens its record and marks it read.
- **Notification item:** event icon in a round tint (package, warning-circle, flask, upload-simple, certificate, paper-plane-tilt, alarm), title (Body small/SemiBold), text (Caption), time ("10 min ago", "3 h ago", then "5 Nov 2026, 14:20"), and an unread dot on the right. Read items have no dot and a lighter title.

### 5.3 Notifications page `/notifications`

The full list, grouped **Today**, **Yesterday**, **Earlier** (Card per group); Segmented control All / Unread; **Mark all read** (Secondary md) in the header; 20 items, then **Load more**. Empty: Empty state "You're all caught up" ("New hand-offs to your queues appear here."). On the phone the bell opens this page directly (no panel).

## 6 · Profile `/profile`

```
Profile
(ML 64) Maya Lestari   [Lab Admin]                               [Sign out]
        maya@sgsi.co.id
┌ Personal ─────────────────────┐ ┌ Preferences ───────────────────────────────┐
│ Name   [Maya Lestari       ]  │ │ Sidebar     [Expanded | Collapsed]           │
│ Email  maya@sgsi.co.id        │ │ Language    English (Indonesian terms kept   │
│        (only a Superadmin can │ │             for RoA and CoA)                 │
│         change it)            │ │ Start page  My work                          │
│ [Save]                        │ └──────────────────────────────────────────────┘
└───────────────────────────────┘ ┌ Notifications ──────────────────────────────┐
┌ Password ─────────────────────┐ │ Batch ready to receive              (on)    │
│ Last changed 12 Oct 2026      │ │ Analysis finished, RoA to upload    (on)    │
│ [Change password]             │ │ Job order ready for its CoA         (on)    │
└───────────────────────────────┘ │ Batch due within 24 h               (on)    │
                                  └──────────────────────────────────────────────┘
```

| Card | Content |
| --- | --- |
| Header | Avatar 64 (round, initials), name (Display/XL), Role badges, email; **Sign out** (Secondary) |
| Personal | Name (Text field), Email (read-only text with the note "Only a Superadmin can change it"), **Save** (Primary md, enabled when the name changed) |
| Password | "Last changed 12 Oct 2026"; **Change password** opens a dialog (md): Current password, New password, Confirm, the rules checklist; **Change password**. Error state: "The current password is not correct." On the phone: a full-screen form |
| Preferences | **Sidebar**: Segmented control Expanded / Collapsed (desktop default; tablet always collapsed); **Language**: English, read-only, with the D-24 note; **Start page**: My work or Dashboard (Select; only roles with My work get the choice) |
| Notifications | One Switch per event that reaches the user's roles (section 5.1), all on by default; "Notifications are in the app only." |

## 7 · Session timeout warning

After 29 minutes without activity a centered Dialog (sm): "Still there?" / "You will be signed out in 60 seconds to keep the lab's data safe." **Sign out** (Secondary) and **Stay signed in** (Primary). The seconds count down; at 0 the sign-in page shows the Signed out state (3.1).

## 8 · Library additions

| Component | Why | Variants and properties |
| --- | --- | --- |
| **Password field** | Sign in, set password and change password all need a password input with show/hide | State (Default, Filled, Error, Disabled) × Size (md, lg, touch); Label, Value (dots), Helper, Show helper; an Icon button (eye, eye-slash) at the right. The icon library needs `eye-slash` (it has `eye`) |
| **Notification item** | Panel and page show the same row | State (Unread, Read); Icon (instance swap), Title, Text, Time |
| **Top bar** (change) | The bell needs an unread badge | Boolean **Unread** (default off) and a text **Unread count**: a Count pill (Alert) on the bell's top-right corner, on all three breakpoints |
| Icons | `eye-slash`, `sign-out` | Size 14 and 20, as the other glyphs |

Used as they are: Text field, Button, Link button, Inline alert, Menu item, Role badge, Avatar, Segmented control, Switch, Select, Checklist item (password rules), Dialog, Bottom sheet, Empty state, Toast, Logo (Full and Icon, White).

## 9 · Tablet (834) and phone (390)

| Screen | Tablet | Phone |
| --- | --- | --- |
| Sign in, forgot, set password | No brand panel: the page is `Primary/primary-deep` with the white logo on top and the card centred (S-00) | Card full width on Surface/shell, logo (Full, Default) above it; fields and buttons touch size |
| User menu | Same menu under the user chip | Block at the bottom of the Menu drawer |
| Notifications | Panel under the bell | The bell opens the page |
| Profile | Cards in one column | Cards stacked; change password as a full-screen form |

## 10 · Frames (module 00 App, row N)

Existing screens 01 Sidebar_by_role, 02 Menu_drawer, 03 No_access stay on row J.

| SS | Screen | VV Variant | Sizes | Persona | Content |
| --- | --- | --- | --- | --- | --- |
| 04 | Sign_in | 01 Default | D, T, P | — | Empty fields |
| | | 02 Wrong_credentials | D, P | — | Error alert, email kept |
| | | 03 Locked | D | — | Warning alert with the unlock time, Sign in disabled |
| | | 04 Signed_out | D | — | Info alert, email pre-filled |
| 05 | Forgot_password | 01 Email | D, P | — | Reset your password |
| | | 02 Link_sent | D, P | — | Check your email, Resend in 0:42 |
| 06 | Set_password | 01 Reset | D, P | Maya Lestari | Rules checklist partly ticked |
| | | 02 Invite | D | Hendra Wijaya (new Supervisor) | Welcome, roles shown |
| | | 03 Link_expired | D | — | Expired card |
| 07 | User_menu | 01 Open | D | Maya Lestari | Menu over the Dashboard |
| | | 02 Drawer | P | Maya Lestari | Menu drawer with the profile block |
| 08 | Notifications | 01 Panel | D, T | Maya Lestari | 3 unread of 6, over the Dashboard |
| | | 02 Panel_unread | D | Maya Lestari | Unread filter on |
| | | 03 Page | D, P | Rina Kartika | Today, Yesterday, Earlier |
| | | 04 Empty | D | Fitri Handayani | All caught up |
| 09 | Profile | 01 Default | D, T, P | Maya Lestari | All four cards |
| | | 02 Change_password | D, P | Maya Lestari | Dialog (phone: full-screen form) |
| | | 03 Password_error | D | Maya Lestari | Current password wrong, rule not met |
| 10 | Session_timeout | 01 Warning | D | Maya Lestari | Dialog with the countdown over My work |

Totals: 18 desktop, 3 tablet and 9 phone frames: **30 frames** (above the earlier estimate of 20 to 25 because of the user menu, the invite and the timeout warning).

## 11 · Demo data

- People from spec 8.1; emails `firstname@sgsi.co.id` (maya@sgsi.co.id, rina@sgsi.co.id).
- Maya Lestari's notifications (unread first): N4 "B-2026-0417 analysis is finished" (10 min ago), N5 "All batches of JO-2026-0131 are completed" (1 h ago), N7 "B-2026-0422 is due within 24 h" (3 h ago); read: N1 "B-2026-0418 is ready to receive" (yesterday), N4 "B-2026-0416 analysis is finished" (4 Nov 2026), N1 "B-2026-0415 is ready to receive" (3 Nov 2026).
- Rina Kartika's page: N6 "CoA-JO-2026-0131-2 is published", N2 "2 samples of JO-2026-0137 did not arrive", and older sends.
- Locked until 10:42; password last changed 12 Oct 2026.

## 12 · Data each screen needs (v1)

`users` (name, email, password hash, status, failed attempts, locked until, password changed at, preferences JSON: sidebar, start page, muted events), `user_roles`, `password_tokens` (kind reset or invite, expires, used), `sessions` (last activity), `notifications` (user, event, record, title, text, link, created, read at). Auth runs through Supabase Auth or the service (spec 14); the screens do not depend on which.

## 13 · Design rules that apply

Card anatomy (padding 16 in the app; the sign-in card uses 32 as a standalone card); centered dialogs, Bottom sheet or full-screen form on the phone; Button sizes lg 40, md 32, sm 28, touch 44; avatars round (64 on Profile, 32 in the top bar, 40 in the menu); Segmented control for two-way switches; no " · " between values; no count subtitles under titles.

## 14 · Open points (defaults used until answered)

| # | Question | Default |
| --- | --- | --- |
| 1 | Lockout | 5 failed attempts within 15 minutes lock the account for 15 minutes |
| 2 | Idle timeout | 30 minutes, with a 60-second warning |
| 3 | Password rules | At least 10 characters, a letter and a number, not the email |
| 4 | Link validity | Reset 60 minutes; invite 7 days |
| 5 | Remember me | Not offered |
| 6 | Who gets "past due" | Supervisor and Manager (N8); the queue owners get "due within 24 h" (N7) |
| 7 | Notification retention | 90 days, then removed |
| 8 | Can a user change their own name | Yes; email only by a Superadmin |
| 9 | Brand panel illustration | The SGSI logo mark at 8 % on navy, no photo |

## 15 · Build steps (after go)

1. Library (`library/applib.js`, a patch on the main file like `segcontrol.js`): icons `eye-slash` and `sign-out`; **Password field**; **Notification item**; the Top bar **Unread** badge. Document them in the Component Library plan.
2. `library/screens/rowN.js` builds row N; `build-screens.js` gets the N entry; row J's Menu drawer gets the profile block.
3. `naming.js` needs no rules (final names); `cards.js`, `fit.js` as usual.
4. Deploy (dirty check, backup, swap), commit. No export unless asked.
5. Docs: build status here; spec S-00, S-12, S-13 v1 notes and D-28 v1 events; `Frame_Naming.md` module 00 screens 04 to 10; Navigation plan; README.

## 16 · Build status (Nov 6, 2026)

All 30 frames are built on row **N** with `library/screens/rowN.js` (module 00, screens 04 to 10, final names), plus the profile block at the bottom of both phone Menu drawers on row J. The open points of section 14 were used with their defaults. Deployed to the main file (backup `backup/SGSI-LIMS-screens.before-app-screens.figcraft`).

**Library additions** (`library/applib.js`, three passes on the main file): icons `eye-slash` and `sign-out` (Phosphor Regular, 14 and 20); **Password field** (State Default, Filled, Error, Disabled × Size md, touch; Label, Value, Helper, Show helper; the eye as a Ghost Icon button); **Notification item** (State Unread, Read; Title, Text, Time; icon in a round `Primary/primary-50` tint; unread dot); the **Top bar** got a hidden **Unread** Count pill (Tone=Alert) on the bell of each breakpoint, pinned to the right edge. Screens show it and set the count.

Deviations from the plan:

- **Password values** are set through the component's Value property (the text follows the property, not the variant).
- **Inline alert and Notification item** texts are set by position, because both have a frame and a text named "Text".
- **Logo** on the sign-in pages is scaled with its vectors (`transform.scale`); resizing the instance distorted it.
- **Phone profile** stacks the header (avatar and name, then a full-width Sign out).
- **Tablet** frames: Sign in, Notifications panel and Profile; the other states are desktop or phone only, as planned.
- **Row J** filter now matches screens 01 to 03 only, so rebuilding row J never removes row N.
