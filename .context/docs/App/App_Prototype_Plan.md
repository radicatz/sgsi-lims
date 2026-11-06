# App — Prototype Plan

Written Nov 6, 2026. **Status: plan, waiting for go.** Phase 1 (shell, No access) and phase 2 (the rest).

This is part of prototype v2. The shared decisions, review bar, shell, rules and checks are in `../Prototype/Prototype_Plan.md`. The screens are specified in `App_Screen_Plan.md` and `../Navigation/Navigation_Screen_Plan.md`.

## 1 · Frames

Module 00, 36 frames. D desktop, T tablet, P phone.

| Screen | States (sizes) |
| --- | --- |
| 01 Sidebar_by_role | Expanded (D), Collapsed (T) |
| 02 Menu_drawer | Lab_admin (P), CSO (P) |
| 03 No_access | Default (D P) |
| 04 Sign_in | Default (D T P), Wrong_credentials (D P), Locked (D), Signed_out (D) |
| 05 Forgot_password | Email (D P), Link_sent (D P) |
| 06 Set_password | Reset (D P), Invite (D), Link_expired (D) |
| 07 User_menu | Open (D), Drawer (P) |
| 08 Notifications | Panel (D T), Panel_unread (D), Page (D P), Empty (D) |
| 09 Profile | Default (D T P), Change_password (D P), Password_error (D) |
| 10 Session_timeout | Warning (D) |

## 2 · Screens and what they do

What the frames show, and what the prototype does with it.

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| Sign in | `#/login` | Email, Password with the eye toggle, **Sign in**, **Forgot password?**. Any demo email with any password signs in. The password "wrong" shows "The email or password is not correct.", and five tries show "Too many failed attempts" with the time to try again and the reset link. After the session timeout it shows "You were signed out" |
| Forgot password | `#/forgot` | Email, then **Send reset link**, then Link sent with **Resend link in 0:42** counting down, and **Back to sign in**. A demo link opens Set password |
| Set password | `#/set-password` | Reset (**Set password**), Invite (**Set password and sign in**), Link expired (**Send a new link**). The password rules come from Configuration, Security |
| User menu | top bar chip | **Profile**, **Notification settings** (opens Profile at the notification switches), **Sign out**. On the phone it is a drawer |
| Notifications | bell, `#/notifications` | Bell with the unread count badge (Bell frame, Elevation/xs). The panel has Tabs **All** and **Unread** with a count, **Mark all read** and **See all notifications**. An item opens its record and turns read. The page has the same tabs, **Load more** and the empty state "You're all caught up" |
| Profile | `#/profile` | Name; Sidebar **Expanded / Collapsed** (a segmented control, applied at once); **Start page**; four notification switches; **Save**. **Change password** opens a dialog with the rules text and the error state. **Sign out** |
| Session timeout | dialog | "Still there?" with a countdown, **Stay signed in** and **Sign out**. When it runs out, Sign in opens with "You were signed out". The timeout and warning values come from Configuration, Security |
| No access | any hidden route | Empty state "You don't have access to this page" with **Go to My work** or **Go to Dashboard** (the role's start page) |
| Sidebar, rail, drawer | shell | Shared plan, section 5 |

## 3 · Links to other groups

| From | To |
| --- | --- |
| Notification item (N1 to N8) | Batch page tab, job order tab or report page (Batch, Job order, Reports plans) |
| User menu, **Notification settings** | Profile |
| Set password, Invite | Comes from Add user in the Admin plan (flow AD1) |

## 4 · Notifications in the demo

The events N1 to N8 of `App_Screen_Plan.md` section 5 are raised by the flows that cause them. Each one goes to the roles that receive it, so switching role after a hand-off shows the badge.

| Event | Raised by |
| --- | --- |
| N1 Batch created | JO6, BA8 |
| N2 Samples returned to awaiting arrival | BA2 |
| N3 Preparation finished | BA4 |
| N4 Analysis finished | BA5 |
| N5 Every batch of a job order completed | BA5 |
| N6 CoA published | RE2 |
| N7, N8 Due within 24 h, past due | Seeded |

Seeded: three unread notifications for Maya Lestari (Lab admin), as in Panel_unread, and two for the Page frame.

## 5 · Flows

| ID | Flow | Role | Steps |
| --- | --- | --- | --- |
| AP1 | Sign in and land on the start page | each | Sign in → My work (roles with queues) or Dashboard |
| AP2 | Wrong password, locked | Lab admin | "wrong" → alert; five times → Locked → **Forgot password?** |
| AP3 | Forgot and set password | Analyst | Forgot password → Link sent (countdown) → demo link → Set password → Sign in |
| AP4 | Invite | Superadmin, then the new user | AD1 → sign out → demo invite link → **Set password and sign in** |
| AP5 | Notifications | Lab admin | Bell (3 unread) → panel → Unread tab → item → batch page; **Mark all read**; **See all notifications** |
| AP6 | Profile and password | Preparation | User menu → Profile → sidebar Collapsed → Change password (error, then success) → Sign out |
| AP7 | Session timeout | CSO | Review bar timer → "Still there?" → **Stay signed in**; again → signed-out alert |
| AP8 | No access | CSO | Open the Users link from the Flows panel → No access → **Go to My work** |

## 6 · Spec only

- Session timeout runs on a 60-second demo timer, started from the review bar, instead of 30 minutes.
- Notifications are not pushed in real time.
- The "link sent" screen has a demo link instead of an email.

## 7 · Open points

| # | Question | Default if not answered |
| --- | --- | --- |
| 1 | Start on Sign in, or straight in as a role? | Sign in; the Role switch skips it |
| 2 | Does the Profile's Start page choice override the role's default start page in the demo? | Yes |
