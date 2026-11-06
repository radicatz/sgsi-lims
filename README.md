# SGSI LIMS

Planning, research and prototype material for the SGSI Coal LIMS. Everything lives under `.context/`.

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
