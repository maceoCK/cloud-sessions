# Footprints in wet sand

An interactive isometric figure, built with the [Anatomy](https://github.com/wheresryan22/anatomy) skill: a block of beach cut from the swash zone, a strip of smooth, dark, wet sand 3.3 m long and 1.8 m across, rising 1 in 12 from the sea edge at the back.

The loop runs on its own:

1. Footprints press in one step at a time, heel first and rolling to the toes. While each foot is down, the sand around it turns pale (Reynolds' dilatancy: the sheared grains dilate and draw the water down). When the foot lifts, water seeps back and pools in the heel and the ball.
2. A bore collapses 0.9 m seaward of the strip. Its swash slides up the slope with a foam front, slowing at g·sin β, and covers the prints (Shen and Meyer's ballistic run-up).
3. Under the sheet each print is smoothed away, and the stirred-up sand clouds the water over it for a moment.
4. The backwash drains back down the same path, with a faint diamond pattern on the thin sheet, and leaves stranded foam and a swash line at the top of the run-up.
5. The sand is smooth again. The glossy film sinks in, and a few grains glint as it drains.

Tap or click the sand to press a footprint there. The right arrow key takes the next step, and Space or Enter sends a wave. The idle loop comes back about four seconds after you stop.

## Files

| File | What it is |
|---|---|
| `footprints-in-wet-sand-light.html`, `footprints-in-wet-sand.html` | The built pages, light and dark. Open either in a browser; no server needed. |
| `model.mjs` | The truth: strip geometry, gait, the footprint's sole outline and pressure map, the swash (run-up, lens depth, exposure, erosion) and the loop timeline. The build, the readout, the caption and the shader all read it. |
| `build.mjs` | Builds the SVG half with the Anatomy kit (plinth on feet, ruler, label plate, depth scale, and the beach block with its cut faces: swash laminae, heavy-mineral bands, a storm scour with a shell and pebble lag, older steeper laminae, the water table and a buried wedge clam), then writes the pages. |
| `live.js` | The WebGL layer and the loop: a heightfield march for the prints in the figure's own isometric camera, the seep pools, the dilatancy ring, the swash sheet with its foam front and ripples, erosion, the drained sheen, plus pointer and keyboard input, the SVG fallback and reduced motion. |
| `sand.css` | Theme tokens for the sand, water, foam and section. |
| `kit/` | `iso-kit.mjs` and `gl.mjs` from the Anatomy kit, MIT licensed (see `kit/LICENSE`). |

## Build

```sh
node build.mjs            # dark page
node build.mjs --light    # light page
node build.mjs --artifact out.html   # a theme-following page body for embedding
```

Node 20.10 or later; no dependencies.
