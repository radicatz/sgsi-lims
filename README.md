# SGSI LIMS

Planning, research and prototype material for the SGSI Coal LIMS. Everything lives under `.context/`.

| Folder | What is in it |
| --- | --- |
| `.context/docs/` | Our written plans and specifications, one folder per screen group: `Project/` (development spec, research plan), `Design System/` (component library, design tokens, frame naming), `Job Order/`, `Batch/`, `My Work/`, `Dashboard/`, and `archive/` for superseded plans. `.context/docs/README.md` lists every file |
| `.context/design/figcraft/` | **Current design file** (rebuilt Oct 30, 2026; pages Library, Desktop, Tablet and Mobile Phone since Nov 2): `SGSI-LIMS-screens.figcraft`, open it with FigCraft (github.com/storytold/figcraft). It holds the component library (74 component sets), 28 text and effect styles, colour tokens (Light and Dark), Foundations and the Logo set; the screens were removed to start over (the old file is in `backup/`). `library/` generates the components (`node build.js`, then `node finish.js`); `tools/` is the older pen.dev converter. Fonts needed: Noto Sans, Newsreader and JetBrains Mono (install) |
| `.context/design/` | The pen.dev export the FigCraft file was built from: `screens-export.html` and `export/*.png` (the pen.dev plan limit was reached, so this is the last pen.dev state) |
| `.context/screens.pen` | The earlier design file (pen.dev, up to Revision B); frozen. Its logo fills load from `.context/images/`, so keep the two together |
| `.context/prototype/` | Clickable job order prototype: `src/` is the source, `python build.py` writes `job-order-prototype.html`; `archive/` holds older snapshots |
| `.context/source-documents/` | Documents received from the client and lab: proposal, SIM Lab deck, shipment workbook, sample CoA and RoA |
| `.context/deliverables/` | Things we produced: RoA templates and the company profile page |
| `.context/research/` | Vendor and training material: AssayNet, Clarity LIMS, a general LIMS training deck, Revol, and one design inspiration image |
| `.context/assets/`, `.context/images/` | SGSI logo files (`images/` is the copy the design file uses) |

Not tracked by git: `.context/research/` (about 710 MB of videos, screenshots and PDFs, so it exists only on this machine and is not covered by git history) and the built prototype page.
