# Figure contract

Every figure on the site is one module, `src/figures/<id>.mjs`, drawn with the
Anatomy kit (vendored in `kit/`, MIT). `src/figures/_example.mjs` is the
kit's dial indicator ported to this contract: copy its shape.

```js
import * as k from "../../kit/iso-kit.mjs";        // floor prisms, lines, parts, camera
import * as G from "../../kit/lathe.mjs";          // optional: turned parts on any axis, prismOf, sphereOf
import { tubePieces, tubeSvg } from "../../kit/tube.mjs"; // optional: pipes and cables

export default {
  id: "datost",                 // matches the file name; the mount is #fig-<id>
  fig: "Fig 2",                 // card corner, top left
  title: "Sixteen drawers",     // card corner, top right (shown uppercase)
  hint: "Hover a drawer to try it",   // card corner, bottom left (shown uppercase)
  touch: "Tap a drawer to try it",    // optional: the hint on touch screens (default: hover/click become tap)
  width: 600, height: 380,      // the svg viewBox
  label: "…",                   // the svg's aria-label: what the object is and what it shows
  stage: { role: "slider" | "group", label: "…controls in words…", attrs: { "aria-valuetext": "…" } },
  css: "",                      // optional; scope every rule under #fig-<id>; light first, dark via [data-theme="dark"] #fig-<id> …
  build() {                     // runs in Node at build time
    return { svg: "<g>…</g>", readout: "initial readout text", data: { /* JSON for live */ } };
  },
  live(root, rt, D) { … },      // runs in the browser; see below
};
```

## Build and check

```sh
node scripts/build.mjs --only <id>         # writes dist/fig/<id>.html (light) and dist/fig/<id>-dark.html
export CHROME_PATH=/opt/pw-browsers/chromium
A=/home/user/wheresryan22/anatomy/scripts
node $A/capture.mjs dist/fig/<id>.html --out shots/<id>/light.png --width 900
node $A/capture.mjs dist/fig/<id>.html --out shots/<id>/phone.png --width 390
node $A/capture.mjs dist/fig/<id>-dark.html --out shots/<id>/dark.png --width 900
node $A/capture.mjs dist/fig/<id>.html --out shots/<id>/zoom.png --width 900 --zoom 300,200,180,120
node $A/capture.mjs dist/fig/<id>.html --out shots/<id>/hover.png --width 900 --hover 0.6,0.5 --times 600,1500
node $A/capture.mjs dist/fig/<id>.html --out shots/<id>/still.png --width 900 --reduced
node $A/lines.mjs dist/fig/<id>.html --out shots/<id>/lines.png   # must print "line ends: 0"
```

Read every PNG you make. `shots/` is git-ignored.

## The browser side

`live(root, rt, D)` is serialised with `Function.prototype.toString`, so it may
only use its arguments, browser globals, and the inlined libraries:

- every export of `kit/iso-kit.mjs` as a global (`translateAlong`, `lineOnTop`,
  `iso`, `slabOf`, `cylinder`, `solidSvg`, `lineSvg`, `holdStill`, …);
- `G`: every export of `kit/lathe.mjs` (`G.prismOf`, `G.disc`, `G.frameAlong`, …);
- `T`: every export of `kit/tube.mjs`;
- `rt`: the shared runtime in `src/runtime.js`:
  - `rt.loop(stage, (dt, calm) => keepGoing)` → `{ kick() }`: one rAF loop that runs only while the stage is on screen;
  - `rt.tour(stage, { delay, resume, onResume })` → `{ active, running, clock, advance(dt), hold() }`: the idle tour (`running` is true while it waits to start or plays: keep the loop going on it);
  - `rt.follow(x, target, dt, tau, calm)`, `rt.spring({ at, rate }, target, dt, k, c, calm)` → settled;
  - `rt.clamp`, `rt.lerp`, `rt.smooth`, `rt.say(el, text)`, `rt.fractionOf(svg, event)` → `[fx, fy]`, `rt.calm()`.

Never touch anything outside `root`. Query with `root.querySelector`. Several
figures share one page and one module script.

## Rules for this site

- Follow the Anatomy skill (`/home/user/wheresryan22/anatomy/SKILL.md` and its
  `references/craft.md`, `motion.md`, `verify.md`). The object is the
  explanation; many small precise parts; light theme first; one `lit` part.
- viewBox 600 × 380 unless your spec says otherwise; the object fills 55–65 %
  of the card and must read at 390 px wide.
- Visible copy never uses an em dash. No invented facts: only the facts in
  your brief.
- At most one tiny engraved label in the drawing. Text the machine itself
  displays (a counter, a clock face) is allowed and must fit its window.
- Live: idle tour after ~1.4 s, pauses on interaction and resumes 3.6 s
  later; pointer hover/drag and tap (keep `touch-action: pan-y` on the stage);
  keyboard (arrows, Home/End, Space/Enter); under reduced motion it holds one
  still pose and still answers input; the loop stops when settled.
- The readout is true to the figure's own model, short, in the kit's style
  (`block 2 · reads 14.0 px`).
- Keep the svg under about 350 KB.
- `lines.mjs` must print `line ends: 0` in both themes.
