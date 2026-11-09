# SGSI LIMS Prototype — Demo Video Plan

Written Nov 9, 2026. A recorded, captioned demo of the clickable prototype v2, built from `Prototype_Demo_Guide.md`. One clip per part, so a revision re-renders only that part; the clips are then merged into one video.

## Decisions

| Topic | Decision |
| --- | --- |
| Audio | Silent, captions only |
| Language | Captions and title cards in Indonesian. The app stays in English as built; on-screen names (**Submit**, **Samples**) stay in English, in bold, so viewers can match them |
| Coverage | All features, all 45 flows, about 47 minutes in 21 clips |
| Location | Tooling in `.context/demo-video/` (tracked); videos in `.context/demo-video/out/` (gitignored) |
| Size | Page laid out at 1440 × 810 (the prototype's Desktop 1440 layout), captured at 1920 × 1080, 30 fps, H.264 MP4 |

## Tools

| Tool | Role |
| --- | --- |
| Playwright (Node) | Opens `../prototype/sgsi-lims-prototype.html`, clicks and types, and captures frames |
| Injected overlay (HTML/CSS) | Cursor with smooth movement and a click ripple, the Indonesian caption bar, a highlight box, a key badge, chapter title cards |
| ffmpeg | Encodes each clip, merges without re-encoding, adds chapter markers |
| Remotion | Not used: the overlay and title cards are HTML in the same pipeline, and Remotion needs a paid company license |

Each clip runs its flow's **Start** off camera, so every clip begins from fresh demo data with the right person signed in, and no clip depends on another. The review bar stays hidden except in the clip that explains it.

## Clips

| # | Clip | Flows | Est. |
| --- | --- | --- | --- |
| 00 | Pembuka: what the prototype is, demo facts, the review bar | – | 1:00 |
| 01 | Masuk & peran: sign in, the 7 roles, sidebar per role, No access | AP1, AP8 | 2:00 |
| 02 | Membuat job order | JO1, JO3, JO4, JO2 | 3:30 |
| 03 | Daftar sampel | JO5, JO10 | 2:00 |
| 04 | Batch | JO6, BA8, BA7 | 2:00 |
| 05 | Penerimaan sampel | BA1, BA2, BA3 | 3:30 |
| 06 | Preparasi | BA4 | 1:30 |
| 07 | Analisis & RoA | BA5 | 2:30 |
| 08 | CoA: generate, publish, send | JO7, RE2, MW2 | 3:00 |
| 09 | Revisi, void, daftar laporan, halaman RoA | RE3, RE1 | 3:15 |
| 10 | Batasan CSO (what the CSO cannot see) | BA6 | 1:30 |
| 11 | My work | MW1 | 1:30 |
| 12 | Dashboard | DB1, DB2 | 3:00 |
| 13 | Pencarian | SE1, SE2, SE3 | 2:30 |
| 14 | Pengelolaan job order: edit, cancel, close, files, history, read-only | JO8, JO11, JO12 | 2:30 |
| 15 | Akun: wrong password and lockout, reset, invite | AP2, AP3, AP4 | 2:00 |
| 16 | Notifikasi, profil, session timeout | AP5, AP6, AP7 | 2:00 |
| 17 | Master data | MD1, MD2, MD3 | 2:30 |
| 18 | Admin: users, audit, configuration | AD1, AD2, AD3, AD4 | 3:30 |
| 19 | Tablet, phone, dark theme | JO9, tablet batch page, Dark | 2:00 |
| 99 | Penutup: what is not in v1, how to give feedback | – | 0:45 |

Clips 00 to 13 and 99 follow the guide's running order; 14 to 19 add the flows and the optional extras it leaves out.

## Folders

```
.context/demo-video/
  package.json, render.js, merge.js
  overlay/    cursor, caption bar, title card
  chapters/   00-pembuka.js … 99-penutup.js (steps and Indonesian captions)
  out/        gitignored
    clips/    00-pembuka.mp4 … 99-penutup.mp4
    SGSI-LIMS-Demo-ID.mp4   merged, with chapter markers
    chapters.txt            timestamps for YouTube or Drive
```

Revising one part: edit `chapters/<nn>-<name>.js`, run `npm run render <nn>`, then `npm run merge`.

## Test first

Clip 01 (Masuk & peran) is rendered first to settle the look, pace and caption style before the rest.

## Status (Nov 10, 2026)

All 21 clips are recorded and merged: `out/SGSI-LIMS-Demo-ID.mp4`, 1920 x 1080, about 57 minutes (the clips run longer than the estimates above because each caption is held long enough to read). `out/chapters.txt` has the chapter timestamps. Tooling and usage: `.context/demo-video/README.md`.

Open items:

- Revisions the owner noted on clip 05 are pending.
- The eye icon on password fields submits the form (the button has no `type="button"`), and typing in the Sample ID of a new sample row keeps one character. The clips avoid both; the prototype is unchanged.
- The RoA page was rebuilt to match the design frame (Reports plan, section 5.5 and difference D7); clip 09 shows it.

