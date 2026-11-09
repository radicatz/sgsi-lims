# SGSI LIMS demo video

Records the clickable prototype v2 (`../prototype/sgsi-lims-prototype.html`) in Chromium and writes one MP4 per chapter, then merges them. Captions and title cards are in Indonesian; the app itself stays in English. The plan is `../docs/Prototype/Demo_Video_Plan.md`.

## Use

```
npm install                  # Playwright (Chromium is expected under %USERPROFILE%\AppData\Local\ms-playwright, or set CHROME_PATH)
node render.js 05            # one chapter (the number is the file prefix in chapters/)
node render.js all           # every chapter
node merge.js                # joins out/clips/*.mp4 into out/SGSI-LIMS-Demo-ID.mp4 with chapter markers
```

Output goes to `out/`: `out/clips/<nn>-<name>.mp4` (the 21 clips, tracked by git as plain files, each well under GitHub's 100 MB limit), and `out/SGSI-LIMS-Demo-ID.mp4` with `out/chapters.txt` (timestamps for YouTube or Drive). The merged video is 327 MB, over that limit, so it is not tracked: rebuild it with `node merge.js` after pulling. The rest of `out/` (scratch frames, temp files) is ignored.

## Files

| Path | What it is |
| --- | --- |
| `chapters/<nn>-<name>.js` | One chapter: the steps and the Indonesian captions. Edit this to revise a part, then render only that chapter and run the merge |
| `lib.js` | Helpers a chapter uses: `move`, `click`, `type`, `select`, `upload`, `say`, `step`, `hl`, `card`, `bar`, `go`, `startFlow` |
| `overlay/overlay.js` | Cursor, click ripple, caption bar, highlight box, key badge and title card, injected into the page |
| `render.js` | Records one chapter (1440 x 810 layout, encoded to 1920 x 1080, 30 fps) |
| `merge.js` | Joins the clips and writes the chapter markers |

## Writing a chapter

- Start with `await d.startFlow("<ID>")` under the opening card: it picks the demo flow, role and screen off camera.
- Prefer `d.step({ say, pos, hl }, action)`: the caption and the highlight appear together, the action runs while they are on screen, and both clear together. Do not navigate inside a step that has a highlight.
- Captions at the bottom by default; `pos: "top"` when the screen content is at the bottom. Keep a caption off the part being explained.
- Native `<select>` popups and file choosers are not drawn in a recording: use `d.select` and `d.upload`.
- The failed-sign-in count is kept in the browser: do the lockout last in a chapter.
- A highlight whose selector is missing is skipped after 1.5 s with a `WARN` in the log. A missing click target fails the render and saves `out/<chapter>-FAIL.png`.
- The renderer loads a copy of the page with `<meta charset="utf-8">`; the built page has none, and from disk Chromium would misread the typography characters.
