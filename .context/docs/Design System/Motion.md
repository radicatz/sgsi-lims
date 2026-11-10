# Motion

Reference for every animation in the web app. Read this before adding or changing one, and add a row to section 5 when a new animation ships. Started Nov 10, 2026 with the sidebar.

The design file has no motion layer, so this document is the source. The tokens live in `apps/web/src/styles/app.css` (not in the generated `tokens.css`).

## 1. Tokens

| Token | Value | Use |
|---|---|---|
| `--motion-fast` | 120 ms | Fades out, hover and press colour, small state changes |
| `--motion-base` | 200 ms | Fades in, open and close of a block, rotating a caret |
| `--motion-slow` | 280 ms | Layout changes that move a lot of pixels: the sidebar width, a panel sliding |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Everything that moves or resizes. Quick start, soft landing |

Colour changes (hover, press) use `linear`.

## 2. Rules

1. **Animate transform, opacity, and a few layout properties only.** Layout properties we allow: `width`, `max-width`, `gap`, `padding`, `grid-template-rows`. Never animate `display`; it cannot be animated and causes a jump.
2. **Keep one structure for both states.** Do not swap elements in and out (`rail ? <A/> : <B/>`). Render the same elements and change a class, so the browser can interpolate. This also keeps heights equal, which the design requires for the sidebar.
3. **Hide by shrinking, not by `display: none`.** A label that must disappear gets `max-width: 0` plus `opacity: 0` and `overflow: hidden`. A group that must close uses the `grid-template-rows: 1fr to 0fr` trick.
4. **Order the fade and the move.** Content fades out fast (`--motion-fast`) while the box shrinks. Content fades in after a short delay (`--motion-fast`) while the box grows, so text never shows in a box that is too small.
5. **Hidden means unreachable.** Closed content gets `visibility: hidden` (delayed until the animation ends) and `tabIndex={-1}` on links, so keyboard and screen reader users do not land on it.
6. **Reduced motion.** `app.css` has one global rule: `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`. Do not add per-animation exceptions; do not fight it with `!important`.
7. **No motion that blocks work.** Nothing over 300 ms. No animation on first load of a page. No looping animation except the loading skeleton.

## 3. Recipe: add a transition

1. Pick the tokens from section 1.
2. Write the transition on the element that changes, listing the properties explicitly (`transition: width var(--motion-slow) var(--ease-standard)`), never `transition: all`.
3. Drive the change with a class or attribute (`.rail`, `.shut`, `aria-expanded`), set from React state.
4. If something appears or disappears, use rule 3 above.
5. Check the three widths (1440, 834, 390) and turn on "reduce motion" in the browser once.
6. Add a row to section 5.

## 4. Recipe: open and close a block (accordion, group)

```html
<div class="gitems shut?">          <!-- display: grid; grid-template-rows: 1fr (0fr when shut) -->
  <div class="gin">…items…</div>    <!-- min-height: 0; overflow: hidden; opacity 1 (0 when shut) -->
</div>
```

The row track animates between `1fr` and `0fr`, so the block grows to its real height with no measuring in JavaScript. A margin or padding on the animated block does not collapse, so put spacing on the row above it.

## 5. Where motion is used

| Where | What moves | Tokens | Notes |
|---|---|---|---|
| Sidebar collapse and expand | `.side` width 248 to 88 | slow, standard | Labels shrink to `max-width: 0` and fade; the gap and side padding shrink so each icon glides to the centre of the rail. The Collapse arrow rotates 180 degrees. |
| Sidebar group label | text, caret and gap | slow, base | A group row is always 36 px tall. In the rail only a 26 px line remains. |
| Sidebar group open and close | `grid-template-rows`, opacity, caret rotation | base, fast | Click a group label. Disabled in the rail. |
| Nav item hover and press | background | fast, linear | |
| Switch (`.sw`) | track colour, thumb position | existing, 150 ms | Predates this document; move to the tokens next time it is touched. |
| Loading skeleton | background position | existing | The only looping animation. |

## 6. Not animated on purpose

Page changes, dialogs opening, toasts, table rows. Add them only when the design asks, and write the entry above first.
