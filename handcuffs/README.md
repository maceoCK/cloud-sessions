# How handcuffs work: an Anatomy figure

An interactive isometric figure built with the [Anatomy skill](https://github.com/wheresryan22/anatomy). A Smith & Wesson Model 100-pattern pair of chain handcuffs lies on a demonstration board, and the right cuff's lock case is milled open. Each moving part is drawn from one numeric model of the lock, taken from S&W's patent US 4,287,731 and the published Model 100 specification.

Open `handcuffs.html` (dark) or `handcuffs-light.html` (light) in a browser. Each page is self-contained, with no network requests.

## What it shows

1. **Closing.** The single strand swings into the case. Its teeth cam the spring-loaded pawl up, and the pawl snaps down behind each one: 23 positions, 2.6° apart, each taking about 3 mm off the inside perimeter (213 mm at the first click, 147 mm at the last). Pulling the strand back fails because the square tooth faces meet.
2. **Double-locking.** The key's pin, pushed along the slot in the front cheek, slides the pawl's own folded leaf spring 4 mm. That parks a U-bend over the pawl, so the cuff can neither tighten nor be shimmed.
3. **Unlocking and opening.**
   - The key's hollow barrel goes over the key post.
   - Turn 1 (toward the chain): the flag meets the spring at 118° and pushes it off by 194°.
   - Turn 2 (the other way): the flag catches the pawl's shoulder at 46°, and the teeth clear at 76°. The strand swings out.
   - The key returns, and the pawl drops back onto its stud.

The readout in the card's bottom-right corner narrates each state from the model, for example `turn 2 · 86° · stop, teeth up 1.7`.

## Controls

| Input | Action |
|---|---|
| Space / Enter | Next beat of the story |
| → / ← | Tighten one click / try to pull open |
| End / Home | Squeeze to the last click / pull fully open |
| K | Key: stand → keyhole → back |
| ↑ / ↓ | Turn the seated key (Shift jumps to the next stop) |
| D | Double-lock with the key pin |
| Z | Toggle the whole-pair and lock close-up views |
| Drag | Drag the strand to swing it; drag the key's bow to turn it |
| Esc | Release; the tour resumes after 3.6 s |

An idle tour plays the whole cycle when nobody touches the figure. Under reduced motion it shows one still frame.

## Files

| Path | What |
|---|---|
| `handcuffs.html`, `handcuffs-light.html` | The built pages |
| `model.mjs` | The pure lock model: tables, laws, state machine, readout strings. It is shared by the build, the audit and the page |
| `parts.mjs`, `build.mjs` | Geometry and the page build |
| `live.js` | Motion, the tour director and input |
| `handcuffs.css` | Figure styles |
| `truth-geometry.json` | Plan outlines in mm, traced from the patent |
| `docs/truth.md` | The numeric truth model, with a source for every value |
| `docs/research-*.md` | The mechanism research and the patent geometry |
| `docs/design.md` | The build spec |
| `BUILD-LOG.md` | A stage-by-stage log, with check outputs |

## Rebuilding

The build imports the Anatomy kit with relative paths (`../../kit/…`, `../../scripts/…`). To rebuild:

1. Copy this folder into a checkout of the Anatomy repo as `examples/handcuffs/`.
2. Run `node examples/handcuffs/build.mjs` for dark, or add `--light` for light. Each build takes about 3 minutes, because it settles the painter's order over 39 poses.
3. Add `--audit` for the geometry audit and the per-pose audit.
4. Run `scripts/lines.mjs` for the line-end check. It needs Chrome or Chromium; set `CHROME_PATH` if it is not found.

Contact angles come from a solver run on the patent geometry. Real cuffs vary by a few degrees.
