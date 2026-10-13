# Name tag, torn off (Fig 4A)

An interactive isometric figure, built with the [Anatomy](https://github.com/wheresryan22/anatomy) skill: a blank 86 × 59 mm name sticker with an illegible marker scribble, stuck on a brushed stainless steel plate that is screwed to a brick wall on four spacers.

The loop runs on its own:

1. A corner lifts.
2. The label rolls up into one curl, printed face inside, so the scribble goes into the roll and the adhesive side faces out. The curl is not a perfect cylinder: worn paper curls tighter in some places than others, so the sheet waves.
3. It tears unevenly. About three fifths of the label comes away with half the scribble; a ragged piece stays stuck, its torn edge pale and fibrous where the top layer of paper split away.
4. The torn-off curl falls. Where it was, the plate keeps a fuzz of adhesive and paper fibre, rows of bare spots where the peel front stuck and slipped, white islands of paper by the corner that was picked, and a fingernail's scrapes.
5. A new label is laid down and the loop starts again.

Drag across the figure (or use the arrow keys) to peel by hand; Space tears it off or lays a new one, and the idle loop comes back a few seconds after you stop.

## Files

| File | What it is |
|---|---|
| `name-tag-torn-off-light.html`, `name-tag-torn-off.html` | The built pages, light and dark. Open either in a browser; no server needed. |
| `model.mjs` | The truth: the label and the line it tears along, the developable curl (a tight bend at the front, then a tightening spiral), the strips the flap is drawn in, the scribble, the residue, the stick-slip timing and the numbers (Kendall's peel force, the share that comes away). The build and the page both run it. |
| `build.mjs` | Builds the static half with the Anatomy kit: the brick wall (bricks standing 2 mm proud of raked joints, chips, grime run off the plate, two old wall plugs), the plate on its spacers with its sheen, grain and scratches, the residue and the piece that stays. Every texture is an SVG pattern laid onto its plane by the iso camera's affine map, so it sits in that plane. Then it writes the pages. |
| `textures.mjs` | Makes the raster grain as small tileable PNGs, with no dependencies: adhesive with paper fibre, adhesive drifts, clay and mortar sand. |
| `live.js` | The loop: the idle tour (the peel runs on a stick-slip clock that lingers at each row of bare spots), pointer and keyboard input, the readout, the aria value and reduced motion. |
| `name-tag.css` | Theme tokens for the bricks, mortar, steel, label and residue. |
| `kit/` | `iso-kit.mjs` and `lathe.mjs` from the Anatomy kit, MIT licensed (see `kit/LICENSE`). |

## Build

```sh
node build.mjs                         # dark page
node build.mjs --light                 # light page
node build.mjs --artifact out.html     # a theme-following page body for embedding
node build.mjs --light --sheet=0,0.5,1 # a contact sheet of poses, for checking the curl
```

Node 20.10 or later; no dependencies.
