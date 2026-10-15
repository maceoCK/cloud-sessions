# Handcuffs EPIC: final build spec

This is the spec the builders follow literally. It merges `design-realism.md` (the base, the winner for two of the three judges), the must-graft items from all three judge verdicts, and `truth.md`, which is the only source for numbers. Every choice that differs from a design or a judge is listed in section I.

**Where things live**
- Target folder: `/home/user/wheresryan22/anatomy/examples/handcuffs/` with `build.mjs`, `parts.mjs`, `model.mjs`, `live.js` and `handcuffs.css`. Imports are relative (`../../kit/iso-kit.mjs` and so on), and the layout is the same as `examples/arcade-cabinet/`.
- Truth helpers: `scratch/truth/` (`model-draft.mjs`, `truth-geometry.json`, `test-model.mjs`).
- Spec-writer checks, which reproduce every camera, visibility and fold number quoted here: `scratch/final/verify.mjs`, `layout.mjs`, `final.mjs`, `apart.mjs` and `rough.mjs`.

**Notation**
- **F** is the truth frame (truth §0): origin at the hinge of cuff A, +x toward the case, keyhole and mouth on −y, +z out of the keyhole face. Every angle is CCW-positive seen from +z.
- **W** is the kit world: `W(p) = [x_F, −y_F, z_F + 4.8]`. The board top is at W z = 0.
- All geometry is built in F and mapped to W at the projection boundary.
- Numbers are mm and degrees.

---

## 0. Facts at a glance

| Item | Value |
|---|---|
| Tier | **EPIC**. About 150 recorded solids, 4 tube routes and 2 tube eyes. Two cuffs, both fully detailed. |
| Card | `pageHtml({ width: 980 })`, figure viewBox **920 × 640**, fit at **2.69 px/mm** (pair). |
| Camera | Kit `azimuth 298`, `elevation 48`, in W. The physical viewer is on F's +x/+y side, view direction V_F = (0.314, 0.591, 0.743). |
| Chirality | True S&W. The screen cross of F x̂ and ŷ is −4.98 (CCW). Unmirrored, the kit draws +4.98 (a mirror image). |
| Framings | Two per device. `pair` is the whole viewBox. `lock` is zoom 2.60, rect `334.2 132.4 353.5 245.9`, **7.0 px/mm**. Phone: `pair-phone` is 1.33 px/mm and `lock-phone` is 4.0 px/mm. |
| Rest pose (static page, frame 0) | Jaw open at θ −100. Key parked upright on its stand. Shim tool parked. u 0. Pawl lit. Pair framing. Readout `open · key parked`. |
| Tour | Loop A, close → double-lock → unlock → open (27.5 s). Loop B, shim test → wrong-order unlock (37.8 s). They alternate A, B, A… All five ideas are shown by t = 23 s. |
| Verified | `contacts visible` passes for every key-in contact at this camera, with no barrel or bow occlusion. The chain at truth proportions passes `A.folds`. Turn 1 shows CCW on screen. |

**The 30-second read at 1×**
1. A pair of handcuffs lies on a board, the right-hand lock milled open.
2. The strand clicks in, and pulling it back fails.
3. A key pin slides a spring and the cuff is double-locked.
4. The key goes in. Turned toward the chain, it pushes the spring off. Turned back, it lifts the pawl, and the strand swings out.

---

## A. Concept, card, words

**Concept (one sentence).** A Smith & Wesson Model 100-pattern pair lies on an instructor's demonstration board with the right cuff's lock milled open. Each part does one job:
- **Closing.** The toothed single strand cams a spring-loaded pawl up and lets it snap down, click by click, so the loop only gets smaller.
- **Double-locking.** The key's pin slides the pawl's own folded leaf spring 4 mm, so that a U-bend parks over the pawl.
- **Unlocking.** The key's hollow barrel, turned first toward the chain, pushes that spring back off. Turned the other way, it rocks the pawl until its teeth clear, and the strand swings out.

**Card** (built by hand like the Raptor's `body`, because the legend carries chapter buttons; corners as in `plateHtml`)

| Element | Text |
|---|---|
| Fig | `Fig 9` |
| Title (CSS uppercases it) | `Chain handcuffs, lock cut open` |
| Hint, fine pointer | `Drag the strand or key · space steps` (36 chars) |
| Hint, `pointer: coarse` (live.js swaps it at load) | `Tap to step · drag the strand` |
| Readout at load (static HTML) | `open · key parked` |

**Readout rules**
- At most **36 characters**. Shape: `phase · number · what touches`.
- The text is written only when it changes.
- The phase word and every number come from the same `model.mjs` state in the same frame (motion.md).
- Pawl lift is shown as **tooth rise in mm against the 1.2 mm tooth depth**, `tipRise(α)` (H), never as degrees.
- Key angles are shown unsigned, with the turn number.
- Event strings are held for at least 0.6 s unless a newer event replaces them.
- The full list of strings is in E.6 and U.

**Legend keys** (`swatchSvg` marks, then the chapter buttons)
- `lit`: "Lit: the lock part doing the work now: pawl, spring or shim"
- `raised`: "Single strand: 23 positions, 2.6° apart"
- `edge`: "One folded leaf spring is both pawl spring and double lock"
- `flat`: "Standard key: hollow barrel on a post, the flag does the work"
- `dim`: "Left cuff: at its last click and double-locked"

**Chapter buttons** (Raptor `rp-part` pattern, class `hc-chapter`, numbered; their behaviour is in E.4)
`01 Close` · `02 Double-lock` · `03 Unlock` · `04 Shim test` · `05 Apart`. Button 05 exists only if stage S6 ships.

**Caption** (everything in it is SOURCED or DERIVED; the ESTIMATE tooth count is not quoted)
> A Smith & Wesson Model 100-pattern pair on a demonstration board, the right cuff's lock milled open. Swung in, the single strand clicks through 23 positions 2.6° apart, and each click takes 3 mm off the inside, from 213 mm round at the first to 147 mm at the last. Its teeth cam a 31 mm pawl up 3.6° and the pawl snaps down behind each one, so square faces stop the strand being pulled back. Pushed along the slot toward the keyhole, the key's pin slides the pawl's own folded leaf spring 4 mm and parks a U-bend 0.6 mm above the pawl: the teeth can now rise only 0.43 mm of the 1.2 mm they need, so the cuff can neither tighten nor be shimmed. To open it, the key's 2.54 mm bore slides over a 2.24 mm post. Turned toward the chain, its flag meets the spring at 118° and pushes it off by 194°. Turned back the other way, it catches the pawl's shoulder at 46°, the teeth clear at 76°, and the strand swings out. Contact angles come from a solver on the patent geometry (US 4,287,731); real cuffs vary by a few degrees.

**Words never used:** "drags" (the flag only pushes), "visible gap" at 76° (the margin there is 0.05 mm), "21 teeth" (an ESTIMATE), or calling θ −60 or −75 "open".

---

## B. World, camera, framings, composition, phone

### B.1 Frames and mapping
- `const Z0 = 4.8; const W = ([x, y, z = 0]) => [x, -y, z + Z0];` One helper in `parts.mjs`. Everything else calls it.
- **Rings:** `ringW = k.oriented(ringF.map(([x, y]) => [x, -y]))`. Mirroring reverses the winding. Strap `inner(i)` flags are computed in F, then remapped to the reversed indices (`i → n − 2 − i`).
- **Frames:** `G.frameAlong(W(o), [a0, -a1, a2])`. `prismOf` hulls, so the polygon winding does not matter.
- **Rotations:** rotate in F (θ, α, κ, the shim angle) and then mirror. Never rotate in W.
- **Pointer:** screen → current viewBox → W floor plane at height h (playbook §5.3 formulas with `cameraOf(P)`) → F = (x_W, −y_W).
- **Rotation-sense check:** `build.mjs` prints it, and S1 acceptance requires it. It is the screen cross product of `iso(W([1,0,0]))−iso(W([0,0,0]))` and `iso(W([0,1,0]))−…`, which must be **negative** (CCW on a y-down screen), so that the strand closing (θ+) and turn 1 (κ+) both turn CCW on screen. The build exits 1 if it is positive.

### B.2 z stack (F z; W z = F z + 4.8)

| Band | Contents |
|---|---|
| −16 … −12 (W) | feet |
| −12 … 0 (W) | board plate |
| −4.8 … −4.3 | rear dome heads (they stand on the board) |
| −4.3 … −1.9 | rear cheek (its top face uses cavity tokens) |
| −1.9 … +1.9 | frame plate (case head only); jaw −1.8 … +1.8 |
| −1.5 … +1.5 | pawl, spring, shim strip |
| −1.9 … +1.28 | key flag when inserted |
| −1.9 … +3.8 | key post |
| +1.9 … +4.3 | front cheek (window, keyhole, slot) |
| +4.3 … +4.8 | front domes |
| 30.3 / 43.8 | key in the keyhole: bow centre / pin tip |
| 11.9 / 44.1 | inverted key in the slot: ring centre / barrel top |

### B.3 Board (F; W plan `{ x: −56, y: −61, w: 284, d: 147, r: 8 }`)
- F x −56 … 228, y −86 … 61, top at W z 0, 12 thick, on four feet.
- Its stations are listed in C1. The extent is forced by:
  - the open jaw (x −50.2),
  - the shim grip at park (y −78),
  - cuff B's lobe (x 221),
  - the ruler (y 53.5).

### B.4 Camera and fit
```js
const BASE = { x: -56, y: -61, w: 284, d: 147, r: 8 };              // W plan
const FIT = [...k.boxCorners(BASE, -16, 0),
  W([67.6, -16.5, 43.8]), W([72.55, 16.5, 44.1]),                   // key in keyhole (pin top); inverted key (barrel top)
  W([112, -50, 49.9]),                                              // parked key top: tip on the collar (W z 9.0) + 45.7 = W z 54.7
  W([90, -12, 58.2]),                                               // flight / flip apex (key top, W z 63)
  ...cheekOutlineF.filter((_, i) => i % 6 === 0).map(([x, y]) => W([x, y, 52.3]))];  // lid lifted 48 (apart)
const P = k.fitProjection(FIT, 920, 640, { pad: 30, azimuth: 298, elevation: 48 });
// measured: origin [680.00, 246.97], scale 2.12619 -> G.scaleOf(P) = 2.69 px/mm
```

**Why this camera.** It is the only physical direction of the three designs that keeps the turn-1 catch in view.
- The judge scan: β 20–80° keeps every key-in contact clear of the barrel and bow, and β ≥ 85° hides the flag at κ 118. β 62 is used here.
- The key column stands on the far (−y) side of the case and rises up-screen, behind the mechanism, never in front of it.

**Measured landmarks (viewBox px)**

| Landmark | Position |
|---|---|
| hinge A | 680, 231 |
| keyhole | 499, 265 |
| window centre | 523, 293 |
| slot | 524, 323 |
| key bow centre (key in) | 499, 218 |
| swivel A | 470, 321 |
| chain middle | 426, 339 |
| hinge B | 172, 431 |
| key stand | 351, 264 (key top 351, 165) |
| open nose (θ −100) | 592, 139 |
| bumper | 776, 203 |
| board vertices | 30, 309 · 704, 43 · 890, 302 · 216, 569 |

**Composition**
- Cuff A (windowed) is on the right and cuff B on the left, with B nearer the viewer and lower on screen.
- The window sits 63 px right of the card centre.
- The pair, open jaw, key and tool span x 150 … 776, which is 68% of the width. The board takes about 93%, and its regions are filled by the stations in C1.

### B.5 Framings and the camera (two per device; camera state `{cx, cy, lnZ}`)

| Framing | Desktop rect / zoom | px/mm (css) | Used for |
|---|---|---|---|
| `pair` | `0 0 920 640`, zoom 1 | 2.73 | static page, no-JS, rest, reduced-motion default, swing-out end, apart from pair |
| `lock` | centre = midpoint of the window centre and the bow centre (510.9, 255.3); zoom **2.60**; rect `334.2 132.4 353.5 245.9` | **7.0** | every mechanism beat; the apart view |

- `lock` contains the whole cuff A case, the mouth, the window, the slot, the key column with its bow, the key stand with the parked key, the flip apex, swivel A and the chain start.
- In `lock`, a tooth is 20 px, the 1.25 mm clearing lift 8.8 px, the 0.6 mm U gap 4.2 px and the 0.43 mm double-locked lift 3 px.
- The camera eases with the kit's `settle` (critically damped, **0.42 s** per axis on cx, cy and ln zoom; it arrives in about 1.2 s).
- It starts **only at beat boundaries**, never during a contact, a drag or a pointer capture. Under reduced motion it cuts.
- `svg.setAttribute("viewBox", …)` is written only while the camera moves.

**Constant line weight**
- Every frame the camera moves, live code writes `--hc-k = viewBoxWidth / svgCssWidth` on the `<svg>`.
- CSS:
  - `.hc-svg { --anatomy-weight: calc(var(--hc-w, .6px) * var(--hc-k, 1)); }`
  - `.hc-svg .tb-ring { stroke-width: calc(.45px * var(--hc-k, 1)); }`
- The seamless `.4` seam-hiding strokes stay in user units. Dots, halos and fills scale physically.

**Fine projection P4.** The rebuilt mechanism parts (jaw, pawl, spring, spring.tab, key.inner, shim) are built with `P4 = { ...P, origin: P.origin.map(v => v * FINE), scale: P.scale * FINE }`, with `FINE = 4`.
- They are wrapped in `<g transform="scale(.25)" class="hc-fine">`.
- `.hc-fine { --anatomy-weight: calc(var(--hc-w, .6px) * var(--hc-k, 1) * 4) }`, and inside it `.iso-solid[data-seamless] > .iso-shade, > .iso-top { stroke-width: 1.6 }` and `.tb-ring` × 4.
- Dot sizes inside are × 4.
- `FINE = 1` disables it. Keep it unless a slowed sheet at `lock` shows no difference.

**Edge feather.** When zoom > 1.05, the svg gets `data-zoomed`, and CSS applies `mask-image` (four 24 px linear-gradient fades on the svg box). A crop then reads as a camera crop and no line ends on a hard edge.

### B.6 Phone (stage < 560 px; card inner svg ≈ 334 css px)
- CSS sets `aspect-ratio: 1 / 1.1` on the svg, and live code rewrites both framings for that aspect:
  - `pair-phone`: rect 680 × 748 centred at (460, 305), **1.33 px/mm**. The whole pair is visible and the board ends fade under the feather. It is the load view: the first view is the whole, recognisable pair.
  - `lock-phone`: zoom 4.1 about the `lock` centre, rect ≈ 224 × 247, **4.0 px/mm**. It is the tour's working view.
- Readouts are ≤ 36 chars (about 227 px of 10.5 px mono). The kit's media rule stacks the hint above the readout.
- A tap is "next beat". `touch-action: pan-y`. The capture must report `scrolls sideways: no`.

---

## C. Parts list (about 115 named parts, about 150 solids; F coordinates unless marked W)

Recipe keys:
- "strap" is `makeStrap(k, P).strapPaths` from `scratch/proto/strap.mjs`, copied into `parts.mjs` and inline-safe.
- "lathe" is `G.solidOf` on a W frame.
- "rebuilt" means the part is rebuilt per frame in the page from `parts.mjs` (P4).

Tones:
- `lo` for base and feet, `mid` for structure, `hi` for the subject, `faint` for grooves.
- `cav` is the `.hc-cavity` token set (darker paper, faces, shades and lines, with light and dark values).
- `cut` is the `.hc-cut` section token set (milled faces, a touch lighter than `mid` faces, light and dark values).
- Exactly one `lit` (E.5).

Every solid is recorded with its true shape (playbook §4.2).

### C1. Board and stations (`stand.*`; ground)

| # | Part | Recipe | Where / size | Tone | Sits on |
|---|---|---|---|---|---|
| 1 | board halo | `haloOf(BASE, -16, 12, P)` | — | halo | — |
| 2–5 | foot flanges ×4 | `cylinder r7 h1.6`, W z −16 … −14.4, `corners(BASE, 22)`, sorted by `depthOf` | — | lo | bench |
| 6–9 | feet ×4 | `cylinder r5.4`, W z −14.4 … −12 | — | mid | flanges |
| 10 | board plate | `slabOf(BASE, -12, 12, P, 8, 1.6)`, `inner: lineSvg(sideSeam(BASE, -4, P, 8), faint)` | 284 × 147 × 12 | mid | feet |
| 11 | groove | `planOutline(insetPlan(BASE, 5), 0, P)` | closed | lo | 10 |
| 12–15 | corner screws ×4 | `ring r2.2` + dot 0.5, `corners(BASE, 10)` | — | lo / mid | 10 |
| 16 | ruler strip | `slabOf({x −24, y −53.5, w 250, d 6.5, r 1} (W), 0, 0.6, P, 3)`, crease none | F y 47 … 53.5; front edge F y 53.5 | lo | 10 |
| 17 | ruler ticks | `topTicks(0, 225, 5, 5, edge = strip front edge, 0.6, [2, 3.6], P)`: minor every 5 mm, major every 25, rooted on the edge | x 0 … 225 | lo / mid | 16 |
| 18 | zero tick | one tick at x 0 (under hinge A), length 3.6, from the edge | — | hi | 16 |
| 19–20 | ruler screws | dots 0.45 at x −20 and 222 on the strip | — | mid | 16 |
| 21 | label plate | `slabOf` F x 160 … 200, y −74 … −60, W z 0 … 0.8, r 1.4 | back-right | lo | 10 |
| 22 | label inset | `planOutline(insetPlan(plate, 1.6), 0.8)` | closed | faint | 21 |
| 23 | label rule lines ×3 | `lineOnTop`, lengths 28 / 22 / 15, **`free: true`** | — | lo | 21 |
| 24–25 | label screws | dot 0.45 + `ring r1` at both ends | — | mid | 21 |
| 26 | key stand flange | `cylinder r6`, W z 0 … 1.0 at F (112, −50) | — | lo | 10 |
| 27 | key stand body | `cylinder r3.6`, W z 1.0 … 6.0, `inner` `sideArc` seam at W z 3.5 (faint) | — | mid | 26 |
| 28 | key stand collar | lathe disc r 4.6, W z 6.0 … 9.0; knurl `ribsOf(F, 6.4, 8.6, 4.6, 40, P, { fade: [.1, .55], seams: true })` | top at W z 9 | mid; knurl lo | 27 |
| 29 | index mark | `lineOnTop` on the collar top along F −x from r 1.12 (post outline) to r 4.6 (rim) | where the flag points at κ 0 | hi | 28 |
| 30 | dummy post | `cylinder r1.12`, W z 9.0 … 14.7. Ø 2.24, the same as key post 78, and 5.7 sits inside the parked bore. Record it with `cut` = barrel ring + `seated`. | — | mid | 28 |
| 31 | bumper post | `cylinder r2.6`, W z 0 … 6.6 at **F (−41.91, −2.68)**, `sideArc` seam at W 3.0 | tangent to the jaw's outer arc at θ −100 (measured: the jaw at −101.5 would reach it) | mid | 10 |
| 32 | bumper cap | lathe dome r 2.9 → 0 (smooth), W z 6.6 … 8.0 | rubber | lo | 31 |
| 33–34 | locator pins A ×2 | `cylinder r1.6`, W z 0 … 6.6, plus lathe dome r 1.6 → 0, z 6.6 … 7.4 | **F (66.13, −26.90), (72.13, −26.40)**: tangent to case A's lower edge (60.0, −25.8)–(74.5, −24.6) | mid | 10; touches case A |
| 35 | tool pocket | closed `planOutline` of the shim grip's park footprint, inset −1.2 (inlay) | around C6 at park | faint | 10 |
| 36–39 | halos | cuff A, cuff B, chain (blurred stadium), stand; `filter: blur(4px)` | — | halo | 10 |
| 40 | jaw halo (live) | blurred jaw floor outline at W z 0.05, rewritten when θ changes | — | halo | 10 |
| 41 | key halo (live) | blurred ellipse under the key, only while it is parked or its tip is below W z 30 | — | halo | 10 |

### C2. Cuff A: double strand, case, frame and cutaway
F z throughout; W = +4.8.

| # | Part | Recipe | Where / size | Tone | Sits on |
|---|---|---|---|---|---|
| 42 | rear domes ×5 | lathe `[[0,1.9],[0.18,1.85,1],[0.36,1.55,1],[0.48,0.9,1],[0.5,0]]` (hinge: scale r × 2.5/1.9) pointing −z, z −4.8 … −4.3 | rivets (77.9, ±9.7), (63.8, ±21.3); hinge (0, 0) Ø 5.0 | mid | board |
| 43 | rear cheek | strap of `cheekOutline` (truth-geometry.json), z −4.3, h 2.4, bevel 0.4. **The top face uses `cav` tokens.** It is only ever seen through the window, in the double-strand gap and in the empty channel. Side walls use normal tokens. `inner`: faint floor rings r 1.6 around stud 52 and around the post foot. | — | mid / cav top | 42 |
| 44 | frame.far | extrude (concave, strap without `inner`) of **frame ∩ far part**, z −1.9 … 1.9. The frame ring is the case head at r ≥ 63.8 minus `caseCavity_middleLayer` and minus `tSlot_middleLayer`. The far part is the component south of the cut line y −19.15 for x ≥ 73.8 (D.3): the ON-step, the flag pocket rim and the mouth region. Cavity-facing walls use `cav`; the top is mid. | — | mid / cav walls | 43 |
| 45 | frame.nearW | the frame north of the pin pocket and west of the cut x 72.0 (y ≥ 19.6): tongue (OFF-stop face y 15.35, x 68.3 … 71.0), wall 54 (arc r 1.85 about the hub), and the +y channel side | — | mid / cav walls | 43 |
| 46 | frame.nearE | the frame east of the cut x 72.0: pin pocket east part, roof (face x 73.8), plateau, T-slot neck (y ±1.8, x 78.3 … 81.6) and pocket (y ±3.15, x 75.7 … 78.3) | — | mid / cav walls | 43 |
| 47 | rivet shank tops | `inner` faint rings r 1.2 plus a mid disc, flush at z 1.9 on 44–46 at the four rivets. Hidden under the front cheek; they show only apart. | — | faint | 44–46 |
| 48 | swivel base | slab 2.4 × 6.1 × **3.8** (z ±1.9), x 75.8 … 78.2, y ±3.05, in the T-slot pocket. Hidden; recorded so the swivel is supported. | — | mid | 46 |
| 49 | stud 52 | `cylinder r1.2`, z −1.9 … **1.5** (milled flush with the pawl top) at (64.40, 13.30). Its top is a `cut` section face with a faint `ring` r 1.2. | — | mid / cut top | 43 |
| 50 | post.lower | `cylinder r1.12`, z −1.9 … 1.9 at (67.60, −16.50) | — | mid | 43 |
| 51 | post.tip | `cylinder r1.12`, z 1.9 … 3.8, plus a faint top chamfer ring r 0.8. Its own item, in its own slot (D.2). | — | mid | 50 |
| 52 | hinge stud stub | `cylinder r2.15`, z −1.9 … 1.9 through the jaw eye. Hidden assembled; seen apart. | — | mid | 43 |
| 53 | keyhole.walls | far walls (inward normal toward the viewer) of the keyhole bore (r 2.0) and of the notch (1.5 wide, toward −x, to r 3.9), z 1.9 … 4.3, shaded by facing, under-edges lo. **Its own item**, before post.tip. | — | cut | 55 |
| 54 | slot.walls | far walls of the double-lock slot (x 71.6 … 74.2, y 9.95 … 17.45, corner r 0.3), z 1.9 … 4.3, shaded by facing, under-edges lo. **Its own item**, before key.inv.inner. | — | cut | 55 |
| 55 | front cheek A | strap of `cheekOutline`, z 1.9, h 2.4, bevel 0.4. The **HOLE** (C2a) and the **SLOT** are evenodd holes in `fill` and `top`. The window's far walls are drawn inside the HOLE clip (the `windowed()` pattern, playbook §2.8, concave-plate variant), shaded by facing in `cut` tokens, with lo under-edges clipped to the hole. The cut edge is stroked (it is in the outline). Recorded `A.extruded(cheekOutline, 1.9, 2.4, { cut: [A.extruded(HOLE, 1.8, 2.6), A.extruded(SLOT, 1.8, 2.6)] })`. | — | mid | 44–46 |
| 56 | window chamfer | closed outline of HOLE offset 0.4 into the material at z 4.3 | — | faint | 55 |
| 57 | slot chamfer | closed outline of SLOT offset 0.3, z 4.3 | — | faint | 55 |
| 58–61 | front case domes ×4 | lathe as 42, pointing +z, z 4.3 … 4.8 | (77.9, ±9.7), (63.8, ±21.3) | mid | 55 |
| 62 | front hinge dome | Ø 5.0, proud 0.5 | (0, 0) | mid | 55 lobe |

The three plates (rear cheek, frame, front cheek) are separate solids, so the 2.4 / 3.8 / 2.4 riveted sandwich shows on every case wall without extra seams. Along the double strand, the 3.8 gap between the cheeks shows the rear cheek's dark top.

#### C2a. The HOLE (window + keyhole) in the front cheek of cuff A
Build it once in `parts.mjs` as one simply connected ring (F), then orient and mirror it.

**W0 (outer window outline):**
1. The arc r 59.1 about the hinge from φ −23° (54.40, −23.09) to φ +15° (57.09, 15.30), at least 20 segments. This keeps a 1.6 mm **C0 rim strip** (r 57.5 … 59.1) so the cheek's loop silhouette stays whole.
2. (60.6, 17.9) → (66.9, 17.9): the near rim over the hub. It clears the hub top y 17.5, and rays from z 1.5 clear the rim.
3. (67.4, 19.8) → (70.6, 19.8): raised over the tongue so the OFF-stop ledge shows.
4. (70.6, 9.0): the slot bar keeps x ≥ 70.6 for y > 9.
5. **(75.5, 9.0)**: the +x edge moved out from 73.6 (judge 1). It clears the rivet heads at (77.9, ±9.7) by 0.5, so the spring's upper leg on the roof (x 73.3 … 73.8) is seen whole from z 1.5. Measured: the leg's top is visible up to x 73.63.
6. **(75.5, −19.15) → (70.6, −19.15)**: this edge runs on the ON-stop face line. The cheek's window wall and the frame's ON-stop face then form one wall, and the frame near/far seam lies on its base line (D.3).
7. (70.6, −21.8) → straight back to (54.40, −23.09).

**ISLAND (material kept inside W0):**
- the **C-ring**, r 2.0 … 2.5 about the post (67.6, −16.5), open toward −x where the 1.5-wide notch cuts it (|y + 16.5| < 0.75, x < 67.6);
- the **neck**, half-width 0.7, along the line post → rivet (63.8, −21.3) at **ψ 231.6°**, 0.62 long between the ring (r 2.5) and the boss;
- the **rivet boss**, a disc r 3.0 about (63.8, −21.3). It crosses W0's bottom edge, which is how the island is joined to the cheek.

**HOLE = (W0 − ISLAND) ∪ bore (r < 2.0) ∪ notch (to r 3.9).**

Ring walk, starting at the arc start:
1. the arc north;
2. the near rims east;
3. the +x edge south;
4. the ON-stop line west;
5. down x 70.6;
6. the bottom edge west to the boss's right intersection;
7. over the boss's top to the neck's right edge;
8. up the neck to r 2.5;
9. round the ring's outer circle (through +y) to the notch's lower edge;
10. in along the notch edge to r 2.0;
11. the bore the long way round;
12. out along the notch's upper edge;
13. on round the ring's outer circle to the neck's left edge;
14. down the neck, round the boss's top to its left intersection;
15. along the bottom edge back to the start.

Every flag contact is at r ≥ 2.6 from the post. The flag passes under the neck only mid-way through turn 1's free sweep (κ ≈ 52), where nothing touches.

**Build assertions** (`openAt(p)` = inside HOLE or SLOT, or outside the cheek):
- `openAt` is false at the ring (ψ 0, r 2.25), the neck midpoint, every rivet head rim (r 1.9) and the slot bar (72, 18).
- `openAt` is true at the bore centre, the notch (64.6, −16.5) and every contact sample in D.5.

### C3. Cuff A single strand

| # | Part | Recipe | Where | Tone | Sits on |
|---|---|---|---|---|---|
| 63 | jaw | **rebuilt** strap of `jaw_theta0` rotated by θ about (0, 0), z −1.8, h 3.6, bevel 0.3. `inner` = the inner arc r 24.8 run plus the r 57.5 band. Exact teeth: the 216-point outline from truth-geometry.json, with radial locking faces facing −φ, tips r 63.5 and roots r 62.3. Clip id `clip-jawA`. Recorded `A.extruded(…, { cut: A.cylinder(0, 0, 2.15, …) })`. | θ ∈ [−100, 36.445] (θ > 36.445 swings through and is allowed) | **hi** (never lit) | hinge stud; 0.1 off each cheek |
| 64 | anti-pry groove | **rebuilt** line on the jaw top (z 1.8) along r 61.0, from the nose outline to the tail step (both ends land on outlines). One faint line. | — | faint | 63 |

### C4. Lock mechanism (all rebuilt, P4)

| # | Part | Recipe | Where | Tone | Sits on |
|---|---|---|---|---|---|
| 65 | pawl 40 | strap (no `inner`, bevel 0.2) of `pawl_alpha0` rotated by α about the hub (66.20, 15.70), z −1.5, h 3.0. Tips at (62.22, −3.15), (62.01, −5.97), (61.68, −8.78); shoulder 56 (64.80, −12.20)→(66.20, −14.30); head top x 69.30; notch 59 (67.55, −2.70) and notch 61 (67.60, −6.70), each a V 0.4 deep and 0.8 wide. Recorded with `cut` = stud 52. | 31.3 long | **lit** by default | stud 52 (C1 (65.12, 14.26)), wall 54 (0.05) |
| 66 | hub mark | `inner` lo `ring` r 1.2 about the hub on the pawl top. Invariant under α. | — | lo | 65 |
| 67 | spring 42 | centreline `springCentreline(u, α)` (H) offset ±0.25, closed, strap z −1.5, h 3.0, bevel 0.1. Parts: lower leg (a cubic from the fold corner (68.20, 14.30 − u), leaving along −y, to the tab); fold y 15.10 − u, x 69.00 … 72.75, R 0.8 bends; upper leg x 73.55 (top face 73.80 bears on the roof); U-detent (arms y −3.95/−6.45 − u, bottom face x 69.90); flange 64 (y −14.90 − u, from x 73.55 to its free end x 69.60). The item **excludes the last 0.45 mm of the tab** (that is #68). | — | hi; **lit** while the pin or flag moves it (E.5) | roof (touch); tab in the notch |
| 68 | spring.tab | the tab tip inside the pawl notch, drawn and recorded as a **top skin only**: a 0.1 slab z 1.4 … 1.5 of the tab outline clipped to the notch polygon. Tab centre = `rot(tabLocal(u), α, HUB)` (H). | — | as 67 | 65 notch |

### C5. Key: S&W pattern, NIJ standard (`key.*`, owner `key`)
- The axis `s` runs from the barrel tip (0) to the pin tip (45.7).
- Frame: `F_key = G.frameAlong(W(tip), W-dir(axis))`, with `u` = the W flag direction ψ_F = 180° + κ.
- Every part is rebuilt when the key's frame or κ changes. key.inner uses P4.

| # | Part | Recipe | Size | Tone |
|---|---|---|---|---|
| 69 | barrel | lathe `[[0, 1.55], [0.3, 1.765, 1], [24.6, 1.765]]`; recorded hollow: `A.ring(F, 0, 7.0, 1.27, 1.765)` + `A.disc(F, 7.0, 24.6, 1.765)` | OD 3.53, bore 2.54 × 7.0 | hi |
| 70 | bore mouth | filled `circleOf` r 1.27 at s 0 (cav) + `arcOf(…, { inward: true })`. Seen only when the key is inverted. | — | cav |
| 71 | flag | `G.prismOf(F_key, [[1.715, −0.51], [3.445, −0.51], [3.445, 0.51], [1.715, 0.51]], 0, 3.18, P)` in the (u, v) plane at the tip | 1.02 × 1.68 proud × 3.18 | hi |
| 72 | neck | lathe `[[23.6, 1.765], [24.3, 1.95, 1], [24.9, 2.2, 1], [25.3, 2.2]]`, rim on the ring. **I.52: ends at s 24.93 (the r 2.2 rim on the ring's outer circle); its front lobe (s 24.6 … 24.93, w ≥ 1) is drawn after the ring** | — | hi |
| 73 | bow ring | `G.ringBand(−1.0, 1.0, 5.05, 7.6, F_ring, P, { hole })` plus the eye's bore wall (I.52), centre s 32.2, ring normal = horizontal ⊥ to the flag direction (so the plane contains the axis and the flag). `.hc-key .iso-fill, .iso-top { fill-rule: evenodd }`. Fallback: solid paddle + `circleOf` ring. Check at 8× in both themes. | OD 15.2, ID 10.1, 2.0 thick | hi |
| 74 | ring face line | `circleOf(F_ring, +1.0 or −1.0 (the face toward the viewer), 6.3)`. No text. | — | faint |
| 75 | pin boss | lathe disc r 1.4, s 39.4 … 40.4. **S3: s 39.3 … 39.8 (it sits on the cheek face in the slot). I.52: drawn as a core s 39.67 … 39.8 plus a lobe proud of each ring face** | — | hi |
| 76 | pin | lathe `[[39.8, 0.95], [45.2, 0.95], [45.7, 0.55, 1]]` | Ø 1.9 × 5.9 | hi |

The key is **never lit**. It stays `hi`.

**Key poses** (exact; these are what `keyPose()` in `parts.mjs` must return; flights in U)

| Pose | Barrel tip / axis | Bow | Notes |
|---|---|---|---|
| parked | tip at F (112, −50, −4.8 + 9.0) = W z 9.0 on the collar top; axis +z | ring plane xz (flag along −x on the index) | bore over the dummy post; top at W 54.7 |
| keyhole, seated | tip at (67.6, −16.5, −1.9); axis +z | ring centre z 30.3 | flag z −1.9 … 1.28; turns only here |
| inverted, slot | pin axis −z at (72.55, pinY); pin tip z −1.6 | ring plane xz, centre z 11.9, rim on the face (z 4.3) | barrel top z 44.1 |

### C6. Shim tool (`shim.*`; one rigid body)
The whole tool is the park geometry rotated about the **hinge axis** by (φ_tip − φ_park). It is one degree of freedom (H: `shim.phi` = tip angle).

| # | Part | Recipe | Size | Tone |
|---|---|---|---|---|
| 77 | strip | **rebuilt** ribbon 0.25 (radial) × 3.0 (z ±1.5). Centreline: the arc r 63.625 from the tip at φ_t back **28 mm** (25.21°) to φ_tail; then an S-jog outward (two R 1.5 bends) to **r 71.0**; then 3 mm along the CW tangent into the ferrule. The tip is bevelled (end cut at 30°). Split **shim.inner / shim.outer** on the drawn mouth edge line (52.73, −22.93)→(58.51, −25.44) with complementary half-plane clips whose cut lies on the case's own mouth edge (a clip cut is an edge). | 0.25 × 3.0 × about 41 | hi; **lit** in the shim chapter |
| 78 | ferrule | lathe along the grip axis, Ø 4 × 3 | — | mid |
| 79 | grip | lathe Ø 9.6 × 16, rounded ends (smooth knots); knurl `ribsOf(…, { fade: [.1, .55], seams: true })` over its middle 10. Axis at W z 4.8, so it rests on the board (tangent). | — | mid; knurl lo |
| 80 | grip halo | blurred under the grip | — | halo |

- **Park:** φ_tip −50, so the tail is at −75.21. The grip front is at (18.1, −68.6), the back at (−0.3, −73.5), and the footprint reaches y −78 (inside the groove at −81).
- At the mouth: φ_tip −23.5. Blocked: −10.69. Under: −2.0, where the grip front is at (63.1, −32.5), 2.8 clear of locator pin 1.
- The strip at r ≥ 63.5 and the grip's inner edge at r ≥ 66.2 stay clear of the jaw's swept band (r ≤ 63.5) in every pose.
- The parked strip (φ −50 … −75) sits on screen 30 + mm above and 8.5 + mm beside the key column, clear of the bow.
- Truth says the strip outside the mouth runs straight; here it is pre-curved like a watch-spring piece (Kelley 1945). This is decision I.19.

### C7. Swivels and chain (owner `chain`)

| # | Part | Recipe | Where | Tone |
|---|---|---|---|---|
| 81 | swivel A collar | lathe disc along +x, r 2.6, x 81.6 … 82.4 (rim flush on the case end) | — | mid |
| 82 | swivel A shank + neck | lathe `[[82.4, 1.7], [83.9, 1.7], [84.3, 1.2, 1], [84.67, 0.7, 1]]` along +x. The neck's rim r 0.7 lands on the eye tube (rim-on-round, 0.48 from the wire axis). | — | mid |
| 83 | swivel A eye (flat) | closed `tubePieces` loop: centreline circle r 3.15 about (88.3, 0, 0) in the xy plane, wire r 0.85, `maxLength: 3`; `R.route(…, { closed: true, limp: false, touch: ['chain.link1'] })` | OD 8.0, hole 4.6 | mid |
| 84 | link 1 | closed stadium tube, inner 16.4 × 5.4, wire r 1.3, centre (98.8, 0, 0); plane contains x, **rolled 25° from vertical toward the viewer** (W roll 65°, normal (0, −0.906, 0.423) in W), so f = 0.850. Lowest point on the board (W z 0). `maxLength 3`, `R.route(…, { closed: true, limp: true, touch })`. | inner x 90.6 … 107.0 | mid |
| 85 | link 1 weld | `tubePieces(…, { rings })`: one ring at the midpoint of the near long side | — | lo |
| 86 | link 2 | flat stadium tube, inner 16.4 × 5.4, wire r 1.3, centre (115.2, 0, 0) (f = 0.743) | inner x 107.0 … 123.4 | mid |
| 87 | link 2 weld | one ring | — | lo |
| 88 | swivel B eye (on edge) | tube loop r 3.15 in the xz plane about (125.7, 0, 0), wire r 0.85 | — | mid |
| 89 | swivel B shank + neck | as 82, mirrored, from the eye (rim at x 129.33) to x 131.6 | — | mid |
| 90 | swivel B collar | x 131.6 … 132.4, r 2.6, on B's case end | — | mid |

- Taut check: eye A hole edge 90.6 + 16.4 + 16.4 = 123.4 = eye B hole edge (truth §3.2).
- Measured with `A.folds` at this camera, truth proportions: flat link pass, link rolled 65° pass, on-edge eye pass, flat eye pass. The opposite roll (115°) pinches: never use it.

### C8. Cuff B (static, unsplit; `hc-dim` class steps tones down one; closed at position 23, θ 36.445, double-locked u 4)
B-local → F: (x, y) → (214 − x, −y).

| # | Part | Note |
|---|---|---|
| 91–95 | rear domes ×5 | as 42 |
| 96 | rear cheek | as 43 (cav top) |
| 97 | frame plate | one piece, the true cavity cut, no window (no B internals are drawn except 101 and 103) |
| 98 | jaw at θ 36.445 | static strap, sandwiched. **The nose pokes 4.6 mm past the double strand's outer edge** through the cheek gap, at F (176.3, −48.3). It is the true "carried loaded" pose (truth §2.2, §6.9). Includes its anti-pry groove (drawn full length before the front cheek, which hides its ends). |
| 99 | keyhole.walls B | far walls of the bore Ø 4.0 + notch (toward F +x) |
| 100 | post B lower | hidden |
| 101 | post.tip B | z 1.9 … 3.8, seen down the keyhole over the cav floor |
| 102 | slot.walls B | slot F x 139.8 … 142.4, y −17.45 … −9.95 |
| 103 | fold B | a solid prism of the spring fold at u 4 under the slot (B-local fold y 11.10, x 71.6 … 72.75), top z 1.5. Hi before the step-down. |
| 104 | front cheek B | strap with KEYHOLE and SLOT holes (no window) |
| 105–109 | front domes ×4 + hinge dome | — |
| 110 | stud 52 B | flush `ring` r 1.2 + dot on B's front face at F (149.6, −13.3) |
| 111 | **serial `No 41207`** | the one engraved label: `faceTextSvg(\`${k.topMatrix([134.5, 0] W, 4.3+4.8, P, "y")} rotate(…)\`, "No 41207", { size: 2.2, tone: "lo", anchor: "middle" })` on B's case face between the rivets (|y| ≤ 6), oriented to read left-to-right on screen |
| 112 | cuff B halo | — |

### C9. Live slots (wrappers, not parts)
- `key.inner`, `key.outer`, `key.air`, `key.inv.inner` (the inverted key's outer part reuses the `key.outer` slot), `shim.inner`, `shim.outer`.
- The jaw, pawl, spring and spring.tab are ordinary `put` items whose svg is a wrapper `<g data-part="…">` that live code refills (playbook §1.2).

---

## D. Painter's order

### D.1 Layers
1. **Back group** (static, unsorted, still recorded): board halo, feet, plate, groove, screws, ruler, label plate, tool pocket, halos, key halo slot, jaw halo slot.
2. **Sorted scene:** one `A.recorder(P, { order, spring })` (order and spring only if S6 ships), then `A.settle`, then sort. Every item is recorded with its true shape.

### D.2 Expected order inside cuff A, far → near
`A.settle` is the judge. Print the order and compare it with this list; if they differ, look at the overlap before accepting.

```
rear domes < rear cheek (cav top + floor rings) < stud 52 < post.lower <
  jawA < hinge stud stub < [shim.inner] < frame.far < keyhole.walls < post.tip < [key.inner] < pawl < spring < spring.tab <
  frame.nearW < slot.walls < [key.inv.inner] < frame.nearE < front cheek A (+ window walls, chamfers) <
  front domes, hinge dome < [key.outer] (and the inverted key's outer part) < … < [key.air] (topmost)
[shim.outer] sorts with the board stations (behind case A); the grip sorts by settle.
```

**Why this holds in every pose.** At this camera V_F = (0.314, 0.591, 0.743): larger x is nearer, and larger y is nearer. Wherever two parts overlap on screen, the nearer one is also the higher one.
- **jaw < pawl.** The pawl is radially outside the jaw (+x), and its lift moves its teeth further +x.
- **jaw < shim.inner < pawl.** The shim lies on the tips at r 63.5 … 63.75; the shimmed pawl's tips are at r ≥ 63.75.
- **shim.inner, jaw < frame.far.** The frame channel lip (r ≥ 63.8) near the mouth is nearer and higher.
- **frame.far < key.inner < pawl < spring.** The flag pushes the shoulder and the flange from their −y (far) side. Pocket rim and ON-step are south of the flag.
- **keyhole.walls < post.tip < key.inner.** The bore walls are behind what stands in the bore. key.inner includes the barrel up to the face (z 4.3), so no barrel segment is missing in the 0.235 annulus. The post tip inside the barrel is hidden by order.
- **spring < frame.nearW.** The tongue lip (y > 15.35, z 1.9) is in front of the fold, and wall 54 in front of the hub.
- **nearW < slot.walls < key.inv.inner < nearE.** The pin is in front of the tongue's east face and of the slot's −x far wall, and behind the roof (x ≥ 73.8).
- **front cheek after every internal.** Its far window walls are higher than any internal part, and so are in front wherever they overlap on screen.

### D.3 Splits (no bias anywhere)

| Split | Why | How |
|---|---|---|
| Frame plate → far / nearW / nearE | The frame wraps the cavity. Unsplit, the roof is in front of the spring while the ON-step is behind the flange (cycle). With one near piece, the tongue is behind the pin and the roof in front of it (cycle). | Cut 1: y = −19.15 from x 73.8 east to the case edge (x 78.9). It lies on the window edge 6 base line for x 73.8 … 75.5 and under the cheek beyond. Cut 2: x = 72.0 from y 19.6 north to the case edge, under the slot bar. Both cuts are invisible. |
| spring.tab | The tab in the V notch is in front of the far notch wall and behind the near one. | Its own item after the pawl. It draws and records only its top skin (z 1.4 … 1.5) inside the notch. The spring item stops 0.45 short. |
| Key at the keyhole | The barrel passes through the C-ring. | `key.inner` = barrel tip → z 4.3, plus the flag, middle slot; clip = everything **below** the face plane on the rod (`G.rodOut`-style clip, `data-hold`). `key.outer` = barrel from z 4.3 up + neck + bow + pin; clip = rod silhouette from the face **up** (`G.rodOut(F, gland, tip, 1.765, P)`), with `data-hold`. While the key slides, call `k.holdStill(el, [dx, dy])` on both. The cut edge is stroked (hidden under the ring). `key.air` = the whole key, unclipped, top slot; handover air → outer when the tip is at W z 11.0 (F 6.2) going down. Record with `A.slide` (barrel from the gland) + the bow's ring shape + the pin. |
| Inverted key at the slot | The 2.6 mm slot shows the pin between z 1.9 and 4.3; its −x far wall is behind the pin. | `slot.walls` is its own item (before). `key.inv.inner` = pin from its tip (z −1.6) to z 4.3, with a clip below the face plane at the pin (holdStill during the descent; the clip moves with the pin during the y-slide). The rest (pin above 4.3, boss, ring, barrel) goes in the `key.outer` slot, unclipped except a rod clip on the pin. |
| Shim at the mouth | Inside it sits between the cheeks; outside it is in the open. | `shim.inner` / `shim.outer`, complementary half-plane clips on the mouth edge line. |
| Chain through the eyes | Interlinked loops. | Per-chunk `tubePieces` (`maxLength 3`), `touch` between neighbours, `crowd: [["chain.*", "chain.*"]]` only after an 8× look. |
| Post and stud through plates | They pass through. | post.lower / post.tip split at z 1.9; stud 52 is milled at 1.5 (never above the pawl top: a stud/hub interlock otherwise). |
| Cuff B | Static and closed. | Unsplit except its own keyhole.walls / post.tip / slot.walls / fold items, ordered like A's. |

**Jaw slot.** The jaw needs no split: wherever it overlaps a cheek on screen it lies between them, and the HOLE is a recorded `cut`.

### D.4 Settle and audits
- **Rest settle:** `A.settle(R, P)` at the REST pose (θ −100, α 0, u 0, key parked, shim parked).
- **Live-only items** (key.inner, key.outer, key.inv.inner, shim.inner) are given slots with arcade's `slots.set(index, '<g data-part="…"></g>')` immediately after the neighbour named in D.2. For the pose audit, give each a key at the midpoint between its two slot neighbours' rest keys.
- **Then** `A.auditOrExit(R, P, { crowd: CROWD_OK })` after writing the page.

**Pose audit** (playbook §4.4, interaction's harness):
- Settle the full scene once at rest. Re-audit every pose on a `lockScene(pose)` subset: cuff A, the key, the stand, the shim tool, the bumper, the locator pins, eye A and link 1, plus every static item whose screen bbox meets a moving item's swept bbox over all poses (the build computes this).
- Force the rest keys. Use `A.overlapsOf(items, P, { states: [0], skip: A.sameRun })`, then `A.audit`. Each pose's failures add to the exit code.
- Target: about 3 min per run.

**POSES** (all from `model.mjs`; every one is a pose the page can show)
1. REST
2. θ −39.07
3. θ −23.30 (lead-in touch)
4. θ −20.78 (lead-in peak, α 2.73)
5. θ₉ (α 0)
6. θ₉ + 0.944·pitch (α 3.57)
7. θ₂₃
8. inverted key, pin y 16.5, u 0
9. inverted key, pin y 12.3, u 4
10. key mid-flip apex (key.air)
11. key half-inserted (tip at z 3.8)
12. κ 0 seated, u 4
13. κ 118.25, u 3.97
14. κ 160, u 1.54
15. κ 194.4, u 0
16. κ −46.3
17. κ −57.8, u 4 (α 1.30)
18. κ −75.7 (α 3.75)
19. κ −86.1 (α 4.97)
20. θ −30 with κ −86.1
21. θ −45 with κ −86.1
22. θ −100 with key seated, κ 0
23. squeeze while double-locked: θ₉ + 0.92, α 1.30, u 4
24. shim at the mouth (−23.5), θ₁₂
25. shim blocked (−10.69), θ₁₂
26. shim under (−2.0), α 4.34, θ₁₃ peak
27. shim under, θ −30
28. shim parked, θ₉
29. key in flight over the chain (tip W z 16 at (90, −10))

`allow` only `supports` for `key.*` in the air poses (no hand is drawn).

**Pass criteria:** `audit passed`, `pose audit passed`, and `contacts visible: N of N` (D.5). `crowd` / `allow` / `cover` excuses only after an 8× look, each listed in `build.mjs` with a comment.

### D.5 Contact-visibility test (inside `--audit`; prints `contacts visible: N of N`)

**Method**
- For each contact below, at its pose, take 1–3 sample points: on the top face of the **lower** of the two touching parts at `z = min(topA, topB) − 0.05`, within 0.3 mm of the contact, on its near side.
- Ray-march from each sample toward the viewer (`p + t·V_F`, t from 0.02 to 120, step 0.02).
- **Occluders** use the recorded shapes at that pose through `A.sdf`: the front cheek A (with HOLE and SLOT cuts), frame.far / nearW / nearE, the front domes, key.outer and the inverted key's outer part, the shim grip and ferrule, the stand and the parked key.
- The two touching parts are **not** occluders.
- A contact passes if any sample's ray hits nothing.

**Contacts** (F; poses from the model)

| Contact | Pose | Sample point(s) |
|---|---|---|
| pawl tooth ↔ jaw tooth | θ₉ + 0.944·pitch | pawl tips 1 and 3 rotated by α |
| lead-in ramp ↔ pawl tooth 3 | θ −22.0 | (61.68, −8.78) rotated |
| locking faces (pull blocked) | θ₉, want θ₉ − 6 | pawl tip 1 |
| pin ↔ fold | pin y 16.30 / 14.3 / 12.3 | fold top in the window (70.2, 14.95 − u) and pin top at the slot mouth |
| tab ↔ notch 59 / 61 | u 0 / u 4 | tab skin centre |
| U-detent over head top | u 4 | (69.60, −9.20) |
| head top ↔ U-detent | α 1.30 (stall and squeeze) | (69.30, −10.0) rotated |
| flag ↔ flange | κ 118.25, 140, 160, 183.4, 194.4 | flange top at its free end (69.65, −15.10 − u) + flag top (z 1.23) at r 3.3 |
| flag ↔ shoulder 56 | κ −46.3, −57.8 (u 4), −75.7, −86.1 | shoulder top near (66.2, −14.3)…(67.87, −13.03) + flag top |
| shank ↔ U-detent | α 4.97 | (69.85, −6.06) |
| fold ↔ OFF stop | u 0 | fold top inner edge (70.0, 14.95) |
| flange ↔ ON stop | u 4 | flange top (71.5, −18.75) |
| hub ↔ stud C1 | rest | (65.15, 14.30) |
| shim tip ↔ pawl toothed end | φ −10.69 | shim top at φ −10.75, r 63.625 |
| shim under the teeth | φ −2.0, α 4.34 | shim top at φ −5.0 |
| jaw faces under the lifted tips | θ −10, κ −86.1 | pawl tip 1 + jaw tip below it |

Spec-writer pre-check (`scratch/final/verify.mjs`) with these occluders:
- Every flag↔flange, flag-tip and flag↔shoulder sample at every κ is visible.
- The turn-1 flange top at z 1.4 is under the C-ring for κ 140–183, and visible at z ≤ 0.6.
- Pawl teeth, U-detent, tab, hub/stud, the ON stop and the shim are visible.
- At pin y 16.30 the pin↔fold line itself is behind the pin (it is the near part); the fold's window part and the pin in the slot are visible.

---

## E. Motion, state machine, director, interaction, readouts

### E.1 One loop
Use the vanilla skeleton (playbook §5.1): `dt` clamped to 1/30; `touring`; `stepModel` → `draw` → `say`; `IntersectionObserver` (newest entry, `rootMargin 120px 0px`). It stops when settled and offscreen.

`live.js` inlines `kitScript() + glScript()`, a lathe IIFE (arcade pattern), `tube.mjs` (tubePieces, tubeSvg), `parts.mjs` and `model.mjs` (export-stripped). Use `glScript()`'s `smooth`, `burst` and `settle`; never declare them again. **No live.js top-level name may collide with the kit list** (playbook §1.4): `ring`, `corners`, `segment`, `rise`, `coil`, `fine` and so on are taken.

### E.2 Every moving part, with its true law

| Part | Driven by | Law (from truth, through `M.step`) | Shown as |
|---|---|---|---|
| jaw θ | drag, keys, director | Closing needs α to rise along CLICK (peak 3.57; 3.10 on 1→2; LEADIN 2.73). It is blocked where `alphaJaw > alphaLimit(u)`, and with the double lock on only 0.92° of play remains. Opening is blocked at θₙ unless the hold α ≥ 3.746, or θ ≤ −23.33, or θ > θ₂₃. Rate ≤ 90°/s. | `want` is followed with τ 0.09 s (pointer) or a scripted smoothstep (director). Rebuilt when θ changes by ≥ 0.002°. |
| pawl α | geometry | `alpha = min(max(alphaJaw, hold), max(alphaLimit(u), alphaJaw))` | `alphaShown = max(alpha, fall)`. `fall` eases down toward `alpha` with `settle(…, 0.018, calm)`: critically damped, about 3 frames, **no rebound**, never below the contact. On a rise it equals `alpha` at once. |
| spring u | pin (u = max(u, min(4, 16.30 − pinY))) or flag (u ≤ KEY1(κ)) | 0 … 4.0 along −y. The tab rides 0.4 out of its V notch (`tabBump`) and drops in over the last 0.4 mm (detent). | Rebuilt on (u, α). Detent `burst`. |
| key κ | drag, ↑/↓, director | Turn 1: free to 118.25, pushes to 194.4 (stop). Turn 2: touch −46.3, clear −75.7, stop −86.1, or **stall −57.8** when u > 0.64. ≤ 240°/s. Turns only when fully seated. | `want` is followed with τ 0.08 s (pointer) or by the director. Rebuilt. |
| key pose | director (U.2) | Paths in `parts.mjs` `keyPose(path, t)`: minimum-jerk lift, travel, descend, and the flip about the ring normal. | `key.air`, or the outer/inner split. |
| pin y | D, director | 16.50 → touch 16.30 → 12.30 | Translate (`translateAlong`), plus `holdStill` on the clips. |
| shim φ_tip | S, director | 20 mm/s along r 63.625 = **18.0°/s**. Blocked at −10.69 unless the step's click `peak ≥ 3.547` and `alphaLimit(u) ≥ 4.343`, then under → −2.0. Retracting past −10.69 clears `under`. | The rigid tool is rotated about (0, 0) and rebuilt. |
| camera | director, Z | (cx, cy, lnZ) `settle` 0.42 s | viewBox, `--hc-k`, `data-zoomed` |
| lit owner | director / events | E.5 | `--l` per part, `settle` 0.18 s |
| apart (S6) | A, 05 | 3 springs (stiffness 64, damping 14.2, substeps 4), stagger 35 ms: front, spring, pawl | `translateAlong(move · share)`, per-frame re-sort only when the order changes (motion.md) |

**Envelopes** (`burst`; 0 under reduced motion). They drive `--hc-burst` on the **lit** part's wrapper, whose edge widens 0.6 → 1.1 css px (`stroke-width: calc(var(--anatomy-weight) * (1 + var(--hc-burst, 0) * .8))`).

| Event | Rise / fall (s) |
|---|---|
| click | 0.03 / 0.12 |
| touch | 0.05 / 0.25 |
| stop or detent | 0.04 / 0.18 |
| stall or blocked | 0.05 / 0.30, twice 0.35 s apart |

Every envelope is computed from its own event's age.

### E.3 State machine (true behaviour; `classify(s)` in `model.mjs`)
```
OPEN (notch 0, θ ≤ −39.07)            ── squeeze ─►  ENTERING (−39.07 < θ < −23.30, nothing touching)
                                                       └─► LEAD-IN (ramp lifts pawl 0→2.73°, snap) ─► LOCKED(1)
DOUBLE_OPEN (notch 0, u ≥ 3.9)        ── squeeze ─►  blocked at the lead-in (θ ≈ −22.1)   "closing blocked · double lock on"
LOCKED(n), u ≤ 0.64
  ├ squeeze: CLICK ramp to 3.57°, staged SNAP → LOCKED(n+1)  (n=23 → SWING-THROUGH, free)
  ├ pull: blocked at θn (radial faces)                       "pull blocked · square faces meet"
  ├ pin in slot, slide −y 4.0 ─► DOUBLE(n)                    (tab clicks into notch 61 in the last 0.4)
  ├ shim to −10.69 + squeeze one click ─► SHIMMED (α held 4.343) ── pull ─► OPEN
  └ key seated ─► KEYED
DOUBLE(n), u = 4.0
  ├ squeeze: 0.92° of play, then blocked (α at 1.30)          "squeeze stops · pawl up 0.4 of 1.2"
  ├ pull: blocked at θn
  ├ shim: stops at −10.69; squeeze cannot lift past 1.30     "shim jammed · pawl up 0.4 of 1.2"
  └ key seated ─► KEYED
KEYED (κ = 0, depth 1)
  ├ turn 1 (κ+): free → 118.25 touch flange → u from KEY1 → 0.64 at 183.4 (released) → stop 194.4
  │      (u already 0: free to 194.4, stop: "nothing to release")
  ├ turn 2 (κ−): touch shoulder −46.3 → α = KEY2(κ) → teeth clear −75.7 → stop −86.1 ─► RELEASED
  │      (u > 0.64: stall at −57.8, α 1.30, teeth up 0.43)
  └ κ back to 0 (pawl falls: onto its stud if the strand is out, into the nearest root if not = relock)
RELEASED (hold α ≥ 3.746) ── pull ─► strand swings out; hold κ until θ < −23.33; nose out at −39.07 ─► OPEN
APART (S6; only from REST)
```

### E.4 Director, chapters, input

**Beats.** One list of beats (U) serves the tour, Space/Enter, taps and the chapter buttons. Each beat has:
- `want(s)`: targets for jaw, key path or κ, pinY and shim;
- `until(s)`: the model condition that ends it;
- `hold`;
- `camera` (`pair` | `lock`), switched only at the beat's start;
- `lit` (the owner switch happens at the beat's contact event, E.5).

**`nextBeat(s)`** (Space, Enter, a tap on empty stage, a click with no drag) picks from the state. It waits while anything is moving or the key is in flight.

| State | Next beat |
|---|---|
| APART | together |
| shim out of park | `under` → pull open; blocked and single-locked → squeeze; blocked and double-locked (after a squeeze) → withdraw |
| key in the keyhole, κ 0 | u > 0.64 → turn 1; notch > 0 → turn 2; open → key home |
| key in the keyhole, κ > 0 | back to 0 |
| key in the keyhole, κ < 0 | released and notch > 0 → swing out; stalled → back to 0; open → back to 0 |
| key at the slot | u < 4 → slide; else → pin out and key home |
| key parked, OPEN, u 0 | close to position 9 |
| key parked, LOCKED(n) | last beat ≠ pull → pull test; else → double-lock |
| key parked, DOUBLE(n) | last beat ≠ squeeze → squeeze test; else → key in |
| key parked, DOUBLE_OPEN | key in (turn 1 is needed before the strand can enter) |

**Arming** (motion.md). D, K, S, A and the chapter buttons first play the beats that bring the state to their precondition, at 1.6× speed, with readout `arming · …`. They never snap.
- D needs the key at the stand.
- S needs the key at the stand and the cuff locked.
- 03 needs DOUBLE(n) with the key parked; from OPEN it closes to 9 and double-locks.
- 04 needs LOCKED(12) with u 0; from DOUBLE it unlocks first.
- 05 (A) needs REST.

**Chapters**

| Button | Beats |
|---|---|
| 01 Close | A0–A5 |
| 02 Double-lock | A6–A10 |
| 03 Unlock | A11–A22 |
| 04 Shim test | B1–B10 |
| 05 Apart | X1–X3 |

The active chapter button gets `data-on`, and the legend lists them as numbered buttons.

**Tour**
- It starts 1.4 s after first view and plays Loop A, Loop B, Loop A, …
- Hover pauses it at the next beat boundary.
- Press, drag, keys and buttons take over at once from the **visible** state.
- It resumes 3.6 s after the last input, from `nextBeat(state)` (Loop A order).
- Esc releases at once and resumes the tour after 3.6 s.

**Pointer** (`touch-action: pan-y`, `setPointerCapture`, released on `pointerup` / `pointercancel`; capture after 1.5°)
- **Jaw drag.** Hit = the jaw's current screen polygon + 8 css px, or inside cuff A's loop. Map the pointer to the W plane at z 4.8 with the current viewBox, take the angle about the hinge in F, and set `θ* = θ_press + Δ`. The model refuses what the lock refuses, and the readout says why.
- **Key drag (direct manipulation)** when the key is seated. Hit = within 14 css px of the key column or bow. Map the pointer to the horizontal plane at the bow height (W z 35.1) and take ψ about the post: `κ* = κ_press + unwrap(ψ − ψ_press)`. When the model stops the key, the flag lags the pointer. That lag is the "it won't turn" feedback, and the status says `still double-locked: turn toward the swivel first` at a stall.
- **Tap or click on the parked key or stand** = K. **On the shim grip** = S. **Elsewhere** = next beat.
- The camera never moves during a drag. Cursors: `grab` / `grabbing` on the jaw and bow, `pointer` on the key, stand and grip.

**Keys** (focusable stage, focus ring `outline: 1px solid var(--anatomy-muted); outline-offset: 6px`)

| Key | Action |
|---|---|
| Space / Enter | next beat |
| → / ← | one click tighter (from open: swing in to position 1) / pull open (Shift ×5) |
| End / Home | squeeze to 23 / pull fully open (refused while locked) |
| ↑ / ↓ | key seated: turn 15° toward the swivel (turn-1 sense) / the other way; Shift = to the next stop. Key parked: inserts first (arming). |
| 0 | key back to 0° |
| K | key: stand → keyhole; seated at 0 → back to the stand; turned → back to 0 |
| D | double-lock with the pin |
| S | shim attempt |
| Z | toggle `pair` ↔ `lock` (phone: the phone pair) |
| A | apart / together (S6) |
| 1–5 | chapters |
| Esc | release; the tour resumes after 3.6 s |

### E.5 Lit (exactly one; the lock part doing the work)
- **Owners:** the pawl (default; closing, turn 2, swing-out, the pawl's drop), the spring (the double-lock slide, turn 1, a stall or squeeze stopped by the detent), and the shim (the shim chapter, from the moment its strip lies on the tips at the mouth).
- **Never lit:** the jaws and the key.
- **Handover happens at the contact event**, never before it:
  - pin touches the fold at y 16.30 → spring;
  - flag touches the flange at κ 118.25 → spring;
  - flag touches the shoulder at −46.3 → pawl;
  - the stall at −57.8 → spring for 0.6 s, then back to the pawl;
  - a double-locked squeeze stops → spring;
  - the shim reaches the mouth → shim;
  - the shim withdraws past −10.69 → pawl.
  - Between contacts the owner stays where it was.

**Rendering.** The pawl, spring, spring.tab and shim strip are always rendered with `lit: true`. Each wrapper carries `--l` (0 … 1), eased with `settle` 0.18 s. CSS mixes the lit and hi token pairs:
```css
.hc-litable > .iso-solid[data-lit] > .iso-top   { fill: color-mix(in srgb, var(--anatomy-lit-top)  calc(var(--l,0)*100%), var(--anatomy-top)); }
.hc-litable > .iso-solid[data-lit] > .iso-shade { fill: color-mix(in srgb, var(--anatomy-lit-shade) calc(var(--l,0)*100%), var(--hc-shade-n)); }   /* per data-shade */
.hc-litable > .iso-solid[data-lit] > .iso-fill  { fill: color-mix(in srgb, var(--anatomy-face) calc(var(--l,0)*100%), var(--anatomy-paper)); }
.hc-litable > .iso-solid[data-lit] > .iso-edge  { stroke: color-mix(in srgb, var(--anatomy-lit) calc(var(--l,0)*100%), var(--anatomy-hi)); }
```
- The seamless strokes are matched the same way.
- Check the light-theme midpoint (l = 0.5) at 4× for a grey smear.
- Fallback: a hard `data-lit` switch at beat boundaries.
- The static page has the pawl at l = 1.

### E.6 Readout, value text, status (all from one model state)

| Shown | Source |
|---|---|
| position n | `notchAt(θ)` |
| inside mm | `loopAt(thetaOf(n)).perimeter`, rounded (189 at 9, 213 at 1, 147 at 23) |
| teeth up x of 1.2 | `tipRise(alphaShown)`, one decimal |
| pawl riding up (closing) | `tipRise(alphaShown)` |
| pushed x of 4 mm (turn 1) | `4 − u` |
| slid x of 4 mm (pin) | `u` |
| key ° | `|κ|`, rounded; the turn number from the sign of κ |
| shim mm in | `63.625 · (φ − (−23.5)) · π/180` |
| words | `M.say(s, events)` (H) |

**Strings** (≤ 36 chars; the full beat mapping is in U)
- `open · key parked`
- `closing · nose at the mouth`
- `closing · nose inside the case`
- `closing · pawl riding up 0.9 mm`
- `click · position 10 of 23`
- `locked · 9 of 23 · inside 189 mm`
- `pull blocked · square faces meet`
- `key · pin end down to the slot`
- `pin in the slot`
- `double-locking · slid 2.6 of 4 mm`
- `detent parked 0.6 mm over pawl`
- `double-locked · 9 of 23 · 189 mm`
- `squeeze stops · pawl up 0.4 of 1.2`
- `key to the keyhole`
- `key in · bore over the post`
- `key in · turn toward the swivel`
- `turn 1 · 60° · flag swings free`
- `turn 1 · 118° · flag meets spring`
- `turn 1 · 150° · pushed 2.1 of 4 mm`
- `turn 1 · 183° · double lock off`
- `turn 1 · 194° · stop`
- `turn 1 · 194° · nothing to release`
- `key back to 0° · spring stays off`
- `turn 2 · 30° · flag swings free`
- `turn 2 · 46° · flag meets pawl`
- `turn 2 · 64° · teeth up 0.7 of 1.2`
- `turn 2 · 76° · teeth clear`
- `turn 2 · 86° · stop, teeth up 1.7`
- `turn 2 stalls · 58° · up 0.4 of 1.2`
- `double-locked · turn 1 first`
- `pull blocked · teeth not clear yet`
- `opening · teeth pass under pawl`
- `open · strand clear of the case`
- `key back · pawl drops to its stud`
- `key out`
- `pawl dropped · locked at 5 of 23`
- `closing blocked · double lock on`
- `shim in · 8 mm along the teeth`
- `shim stops at the pawl's teeth`
- `squeeze · shim slips under`
- `shimmed · strand pulls free`
- `shim jammed · pawl up 0.4 of 1.2`
- `shim out · pawl back on its stud`
- `apart · cheek, spring, pawl lifted`
- `closing up`
- Reduced motion: `turn 2 · 80° · teeth up 1.4 of 1.2`

**Accessibility**
- The stage is `role="slider"` (`aria-valuemin 0`, `aria-valuemax 23`, `aria-valuenow` = n) with an `aria-label` that names every control. `aria-valuetext` is written **only on a state change**, for example "locked at position 9 of 23, inside 189 millimetres", "double-locked", "released, pawl lifted clear", "open".
- `[data-status]` (`aria-live=polite`) is empty at load, filled on focus, and gets phases only: `open`, `locked at position n of 23`, `double-locked`, `double lock released`, `teeth clear`, `strand out, open`, `shim stopped by the pawl`, `shimmed open`, `shim jammed`, `still double-locked: turn toward the swivel first`, `apart`, `assembled`. Continuous drags announce after 700 ms of quiet.
- The `<svg>` carries `role="img"` and a label describing the object.

### E.7 Reduced motion and offscreen
- **Reduced motion:** no tour, no bursts, no camera tween (Z jumps), no fall easing.
- At load, live.js jumps to the **still**: position 9, u 0, key seated at κ −80, α 4.28 (teeth up 1.43), flag on shoulder 56, pawl lit, `pair` framing, readout `turn 2 · 80° · teeth up 1.4 of 1.2`.
- Inputs still work and jump to their targets. Key transport teleports between stations.
- **Offscreen:** the loop stops and the tour clock freezes.

---

## U. Choreography, beat by beat (full precision)

Times are tour seconds from the loop's start, with durations in brackets. "Cam" is the framing at the beat's start. All values are model values at the end of the beat. Loop A starts from REST.

### U.1 Loop A, part 1: close and lock (chapter 01)

| Beat | t (dur) | What moves (truth) | Cam | Lit | Readout |
|---|---|---|---|---|---|
| A0 | 0.0 (1.2) | nothing. θ −100 against the bumper, key on the stand, shim parked. | pair | pawl | `open · key parked` |
| A1 | 1.2 (1.6) | swing in θ −100 → −24.0 (smoothstep). The nose passes the mouth at −39.07. **The dolly pair → lock runs over 1.2–2.8 s; nothing touches before −23.30.** | pair→lock | pawl | `closing · nose at the mouth` → (at −39.07) `closing · nose inside the case` |
| A2 | 2.8 (0.7) | lead-in θ −24.0 → θ₁ + 0.1 (−20.635). α follows LEADIN to 2.73 (tips up 0.91), staged SNAP, click 1. | lock | pawl | `closing · pawl riding up 0.9 mm` → `click · position 1 of 23` |
| A3 | 3.5 (3.6) | clicks 2–9: each is θₙ + 0.1 → θₙ₊₁ + 0.1 in 0.33 s (7.9°/s) plus a 0.12 s dwell. α rises along CLICK1 (peak 3.10) for 1→2 and CLICK (peak 3.57, tips on tips) after, then the SNAP stages in the last 5.5% of the pitch. Tick burst at each click. The tooth tips step 2.88 mm (20 px). | lock | pawl | `click · position n of 23` (held) |
| A4 | 7.1 (0.7) | hold at θ₉ | lock | pawl | `locked · 9 of 23 · inside 189 mm` |
| A5 | 7.8 (1.2) | pull test: want θ₉ − 6 for 0.8 s. The model holds θ₉ (radial faces), so blocked. Double burst. Release 0.4 s. | lock | pawl | `pull blocked · square faces meet` |

### U.2 Loop A, part 2: double-lock (chapter 02)

| Beat | t (dur) | What moves | Cam | Lit | Readout |
|---|---|---|---|---|---|
| A6 | 9.0 (1.4) | Key lifts 6.0 along +z (0.3 s; the bore leaves the dummy post). It travels and **flips 180° about its ring normal (F y axis) through s 22.85**: the flip centre passes (95, −30, F z 28) (W z 32.8), clear of everything by ≥ 10. It arrives inverted above the slot, pin tip at F z 8, pin axis at (72.55, 16.5). Ring plane xz. | lock | pawl | `key · pin end down to the slot` |
| A7 | 10.4 (0.4) | The pin descends through the slot's +y end (touching its −x edge 71.6) to tip F z −1.6. The ring's lowest point lands on the face (ring centre z 11.9). | lock | pawl | `pin in the slot` |
| A8 | 10.8 (1.2) | Pin y 16.50 → 12.30 (ease). At 16.30 it **touches the fold's outer face (y 15.35): lit → spring**. Then u = 16.30 − pinY. The fold goes 15.10 → 11.10; the U-detent slides over the head top (y −7.7 … −10.7 over −7.6 … −12.4); the flange reaches the ON stop (y −19.15). The tab rides 0.4 out of notch 59 and drops into notch 61 over the last 0.4 mm (detent burst). Event `dl on`. | lock | **spring** | `double-locking · slid 2.6 of 4 mm` → `detent parked 0.6 mm over pawl` |
| A9 | 12.0 (0.4) | The pin lifts out to tip F z 8 and the key hovers. The pin cannot pull the spring back: the slot reaches only the fold's outside. | lock | spring | `double-locked · 9 of 23 · 189 mm` |
| A10 | 12.4 (1.4) | **Squeeze test:** want θ₉ + 2.6 for 0.8 s. The strand gains **0.92° (1.0 mm at the teeth)**, and α reaches **1.30** when the head top meets the U-detent: blocked, double burst. Then want θ₉ − 2 for 0.6 s and it returns to θ₉ (it settles on the faces). | lock | spring | `squeeze stops · pawl up 0.4 of 1.2` |

### U.3 Loop A, part 3: unlock and open (chapter 03)

| Beat | t (dur) | What moves (truth) | Cam | Lit | Readout |
|---|---|---|---|---|---|
| A11 | 13.8 (1.6) | The key flips back (about the ring normal again) and flies to above the keyhole, tip at W z 16, κ → 0 en route (flag −x, aligned with the notch; ring plane xz). | lock | spring | `key to the keyhole` |
| A12 | 15.4 (0.8) | Descent along the post axis. The tip passes the face (W 9.1), and the air → outer/inner split switches on at tip F 6.2. It slows to 6 mm/s while the bore passes the post tip (F z 3.8) and the flag passes the notch. The tip bottoms at F z −1.9 (6.2 below the face; 5.7 of post in the bore; the flag spans −1.9 … +1.28, 0.62 under the front cheek). | lock | spring | `key in · bore over the post` |
| A13 | 16.2 (0.2) | hold | lock | spring | `key in · turn toward the swivel` |
| A14 | 16.4 (0.7) | **Turn 1, free:** κ 0 → 118.25 at about 170°/s. The flag sweeps −x → −y → +x through the pocket. It passes under the neck (κ ≈ 52), and the jaw's tips stay ≥ 2.6 away: nothing touched. On screen it turns **CCW**. | lock | spring | `turn 1 · 60° · flag swings free` (live) |
| A15 | 17.1 (1.8) | **Turn 1, contact:** at **118.25 the flag's leading face meets the flange's free-end corner (69.60, −19.15)**, touch burst. κ → 194.4 at about 42°/s; u follows KEY1: 140: 2.36 · 150: 1.92 · 160: 1.54 · 180: 0.84. The whole spring slides +y, the U-detent leaves the head top, and the tab rides out of notch 61. **At 183.4, u = 0.64: double lock off** (burst). **At 194.4 the fold lands on the OFF stop (y 15.35), the tab drops into notch 59 (detent burst), and the flag rests on the flange at (70.81, −15.15): stop.** | lock | spring | `turn 1 · 118° · flag meets spring` → `turn 1 · 150° · pushed 2.1 of 4 mm` → `turn 1 · 183° · double lock off` → `turn 1 · 194° · stop` |
| A16 | 18.9 (0.7) | κ 194.4 → 0. The flag leaves the flange and nothing follows (turn 1 only pushes). | lock | spring | `key back to 0° · spring stays off` |
| A17 | 19.6 (0.4) | **Turn 2, free:** κ 0 → −46.3. The flag swings −x → +y toward the pawl head, in front of the barrel, fully visible. On screen it turns **CW**. | lock | spring | `turn 2 · 30° · flag swings free` |
| A18 | 20.0 (1.5) | **Turn 2, lift:** at **−46.3 the flag meets the corner of shoulder 56 (66.20, −14.30): lit → pawl**, touch burst. κ → −86.1 at about 27°/s; α = KEY2: −55: 0.92 · −60: 1.62 · −64: 2.18 (up 0.73) · −70: 3.01 (up 1.00). The contact slides along the shoulder to (67.24, −13.04); the lower spring leg flexes (the cubic follows the tab about the hub); the teeth rise off the ratchet. At −74.5 the tips are on the tip circle. **At −75.7, α 3.746: teeth clear** (burst; the margin is 0.05 mm, so no gap is claimed). **At −86.1, α 4.97 (up 1.66): the shank meets the U-detent's underside at (69.90, −6.06); the key stops** (burst). | lock | **pawl** | `turn 2 · 46° · flag meets pawl` → `turn 2 · 64° · teeth up 0.7 of 1.2` → `turn 2 · 76° · teeth clear` → `turn 2 · 86° · stop, teeth up 1.7` |
| A19 | 21.5 (1.5) | **Swing out, key held at −86.1** (the tips stay 0.46 mm over the tip circle, the clearance the strand passes under). θ θ₉ → −45 (smoothstep). The locking faces pass under the lifted tips; past −23.33 face 1 clears the toothed end; the nose leaves the mouth at −39.07. | lock | pawl | `opening · teeth pass under pawl` → `open · strand clear of the case` |
| A20 | 23.0 (0.7) | κ −86.1 → 0. α follows `alphaKey` down to 0, and the pawl falls onto its stud stop (C1) with the critically damped fall. Tick. | lock | pawl | `key back · pawl drops to its stud` |
| A21 | 23.7 (0.6) | The key rises along +z (κ 0; the flag through the notch); the split switches off above F 6.2. | lock | pawl | `key out` |
| A22 | 24.3 (1.6) | Flight home; the key seats on the stand (bore over the dummy post, flag on the index). In parallel, θ −45 → −100 and the dolly lock → pair (24.3–25.9). | lock→pair | pawl | `open · key parked` |
| A23 | 25.9 (1.6) | hold | pair | pawl | `open · key parked` |

### U.4 Loop B: shim test (chapter 04), then the wrong-order unlock

| Beat | t (dur) | What moves | Cam | Lit | Readout |
|---|---|---|---|---|---|
| B0 | 0.0 (1.0) | hold REST; dolly → lock over 0.4–1.6 | pair→lock | pawl | `open · key parked` |
| B1 | 1.0 (4.2) | swing in plus fast clicks to **position 12** (0.25 s per click) | lock | pawl | `click · position 12 of 23` |
| B2 | 5.2 (2.2) | The shim tool rotates in about the hinge axis: the tip goes −50 → −23.5 (**mouth: lit → shim**) → along the tips at r 63.625 to **−10.69, against the pawl's toothed end: stopped** (burst). | lock | **shim** | `shim in · 8 mm along the teeth` → `shim stops at the pawl's teeth` |
| B3 | 7.4 (0.8) | **Squeeze one click** θ₁₂ → θ₁₃. The ramp cams the pawl to 3.57 (tips on tips); at α ≥ 3.547 the bevel wedges it to **4.343** and the tip slides on to **−2.0**, under all three pawl teeth (≈ 23.9 mm inside the mouth). No click: the pawl is held. | lock | shim | `squeeze · shim slips under` |
| B4 | 8.2 (1.8) | **Pull open** θ₁₃ → −45: the teeth slide out under the shim; nothing catches. | lock | shim | `shimmed · strand pulls free` |
| B5 | 10.0 (1.4) | The shim withdraws to park. Passing −10.69 clears `under`, so **the pawl drops** onto its stud (lit → pawl, tick). | lock | pawl | `shim out · pawl back on its stud` |
| B6 | 11.4 (2.4) | close to position 12 again (fast) | lock | pawl | `click · position 12 of 23` |
| B7 | 13.8 (3.1) | double-lock, fast (A6–A9 at 1.5×), then the key goes home | lock | spring | `detent parked 0.6 mm over pawl` |
| B8 | 16.9 (2.2) | shim in again → stopped at −10.69 | lock | shim | `shim stops at the pawl's teeth` |
| B9 | 19.1 (1.2) | **Squeeze:** the strand gains 0.92° and stops with α at **1.30** (0.43 of 1.2): the head top is on the U-detent. **Lit → spring** at the stop, double burst. The shim stays jammed. | lock | **spring** | `shim jammed · pawl up 0.4 of 1.2` |
| B10 | 20.3 (1.4) | shim back to park | lock | spring | `double-locked · 13 of 23 · 177 mm` (n from the model) |
| B11 | 21.7 (2.3) | key to the keyhole and in (A11–A12, 1.3×) | lock | spring | `key in · bore over the post` |
| B12 | 24.0 (1.4) | **Wrong order: turn 2 first.** κ 0 → −46.3 (touch: lit → pawl) → α rises to **1.30**, and the **key stalls at −57.8** (teeth up 0.43). The director keeps pushing for 0.5 s (the flag lags); lit borrows the spring for 0.6 s. | lock | pawl → spring → pawl | `turn 2 stalls · 58° · up 0.4 of 1.2` |
| B13 | 25.4 (0.8) | hold | lock | pawl | `double-locked · turn 1 first` |
| B14 | 26.2 (0.6) | κ → 0 (the double lock is still on) | lock | pawl | `key in · turn toward the swivel` |
| B15 | 26.8 (2.5) | turn 1 (as A14–A15) | lock | spring | as A15 |
| B16 | 29.3 (0.7) | back to 0 | lock | spring | `key back to 0° · spring stays off` |
| B17 | 30.0 (1.9) | turn 2 (as A17–A18): now it lifts and clears | lock | pawl | as A18 |
| B18 | 31.9 (1.5) | swing out to −45 | lock | pawl | as A19 |
| B19 | 33.4 (0.7) | key back, pawl drops | lock | pawl | as A20 |
| B20 | 34.1 (2.2) | key out and home, θ → −100, dolly → pair | lock→pair | pawl | `open · key parked` |
| B21 | 36.3 (1.5) | hold | pair | pawl | `open · key parked` |

### U.5 Apart (chapter 05; S6; only from REST; plays in `lock`)

| Beat | What moves | Readout |
|---|---|---|
| X1 | Arming (to REST if needed), then a dolly to `lock`. | `arming · …` |
| X2 | Springs (stiffness 64, damping 14.2, substeps 4), stagger 35 ms, outside first (truth §3.3). **front** (front cheek A + 4 front domes + hinge front dome) moves W +z **48**; **spring** (spring + spring.tab) +z **16**; **pawl** +z **7**. All moves are straight +z: the lid's holes rise off the post tip (z 3.8), stud 52 (1.5), the shank tops and the hinge stub (1.9) with nothing in the way, because the swivel base is 3.8 tall. Measured: at 48 the lid's silhouette covers 0% of the cavity, the lifted spring and the lifted pawl in `lock`. The whole spring (tab, lower leg, fold, upper leg, U-detent, flange) and the whole pawl read as single parts above the open frame: tongue (OFF stop), roof, ON step, wall 54, stud 52, the post and the shank tops. | `apart · cheek, spring, pawl lifted` |
| X3 | Together: the reverse order (pawl, spring, front). | `closing up` → `open · key parked` |

### U.6 Reader-only variants (true refusals, with the readout saying why)
- **Turn 1 when single-locked:** free to 194.4, the stop against the parked flange → `turn 1 · 194° · nothing to release`.
- **Pull before the teeth clear** (κ between −46.3 and −75.7): blocked at θₙ → `pull blocked · teeth not clear yet`.
- **Key returned mid-swing** (θ > −23.33): the pawl falls onto the current ramp, and a pull lands on the nearest notch → `pawl dropped · locked at n of 23`.
- **Close an open cuff that is double-locked:** blocked at the lead-in (θ ≈ −22.1) → `closing blocked · double lock on`.
- **Turn 2 stall by hand:** the flag lags the pointer at −57.8; the status says `still double-locked: turn toward the swivel first`.
- **Squeeze past 23:** swing-through (free, the pawl rides the tail at α 0) → `click · position 23 of 23` then `swing-through · strand passes free`.

---

## F. Risks and how this spec avoids them

1. **Mirror bug.** W = (x, −y, z + 4.8). Rings are re-oriented after mirroring. The build asserts that the chirality cross is negative.
2. **Turn-1 catch hidden.** The camera is at β 62 (the measured safe band is β 20–80). The D.5 test runs in `--audit`.
3. **Spring's upper leg hidden.** The window's +x edge is at 75.5 (measured: the leg top is visible to x 73.63).
4. **Interlocks.**
   - The frame is in three pieces with the cuts on drawn edges or under metal.
   - spring.tab draws only its skin.
   - keyhole.walls and slot.walls are separate items.
   - post.lower and post.tip are split.
   - stud 52 is flush at 1.5.
   - Chain eyes are tube loops.
   - No bias is used anywhere.
5. **Moving camera vs calm.**
   - Only two framings, moved only at beat boundaries, critically damped.
   - Never during a drag.
   - Constant line weight and an edge feather.
   - It cuts under reduced motion.
   - Fallback: a static `pair` plus Z.
6. **Sub-pixel shimmer at 7 px/mm.** P4 on the six rebuilt mechanism parts. `FINE = 1` if a slowed sheet shows no gain.
7. **Lines resolve.**
   - The anti-pry groove ends on outlines.
   - Ticks hang only from the ruler edge, and the zero tick is hi.
   - The label lines are the only `free` lines.
   - The chamfers, slot, keyhole and ring face line are closed.
   - The index mark ends on the post and the rim.
   - Welds are `rings`; knurls use `ribsOf` with fade and seams.
   - Run `lines.mjs` on both themes and in every resting pose listed in G.
8. **Thin parts.** The 0.5 spring and the 0.25 shim are solids with a 3.0 wall; at `lock` they are 3.5 / 1.8 px. They are lit only while they act.
9. **Painter's order of the moving key vs the bow.** The key is in the topmost slot only in the air. The keyhole uses the split. The parked shim tool sits clear of the bow on screen.
10. **Light theme ships.**
    - Every colour is a token: `.hc-cavity`, `.hc-cut` and `.hc-dim` have light values and dark overrides.
    - The lit crossfade is color-mix of tokens, checked at the midpoint at 4×.
11. **Performance.**
    - The strand ring is about 216 vertices, about 2 ms to rebuild. The pawl, spring and flag are under 0.3 ms each. The key frame (lathes) is 2–3 ms while flying.
    - Rebuild only when an angle string changes.
    - A fixed node structure if needed.
    - Halos are not toggled during dollies.
12. **Truth drift.** `M.check()` (H) runs in every build and asserts the KEY, ALIM and loop numbers. Readouts come only from the model. The caption avoids ESTIMATE values.
13. **Interaction dead ends.** `nextBeat` covers every state. Arming exists for D, K, S, A and the chapters. Esc always works. Test every key in every chapter.
14. **Budget overrun.** Drop in this order:
    1. S6 apart;
    2. Loop B's wrong-order half (B11–B21 become a fast unlock);
    3. the key direct-manipulation drag (keep the keys);
    4. P4;
    5. the bumper cap and the tool pocket.

    **Never drop:** truth, the window, the splits, the D.5 test, closing/double-lock/unlock/shim, or both themes.

---

## G. Staged build plan (≈ 4 h 35 build + 2 h 30 critique = the 8 h job's remainder)

Run `date` at each boundary. If a stage runs past 1.5× its share, cut from F.14 and say so. Commands run from `/home/user/wheresryan22/anatomy` after `export CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Shots go to `S=/tmp/claude-0/-home-user-cloud-sessions/7ec0cff4-f910-5bab-ab58-99a3354d7887/scratchpad/handcuffs/scratch/build`.

| Stage | Time | Build | Acceptance (all must hold) |
|---|---|---|---|
| **S1 A page that opens** | 0:00–0:40 | `model.mjs` (H; the draft promoted, with additions and `check()`); `parts.mjs` with `W()`, strap, cheek/jaw builders; `build.mjs` with P, board (1–20), both cuffs as plain strap sandwiches (no window), the jaw live (drag + ←/→ + ratchet), card, legend, caption, inert chapter buttons, readout; `live.js` loop. | `node examples/handcuffs/build.mjs` and `--light` write both pages and print `chirality: CCW ✓` and `model check ✓`. `capture` desktop and `--width 390`: console clean, `scrolls sideways: no`. `capture --key ArrowRight,ArrowRight,ArrowRight` on an open cuff reads `click · position 3 of 23` after a swing; ArrowLeft reads `pull blocked · square faces meet`. |
| **S2 The lock, cut open** | 0:40–1:40 | C2 entire (HOLE with the island, keyhole.walls, slot.walls, frame far/nearW/nearE, rear cheek cav top, stud, post split, domes, locator pins); C4 pawl (lit, P4), spring (u, α, cubic leg, tab bump), spring.tab; `.hc-cavity`, `.hc-cut`; recorder + settle + `auditOrExit`; the pose-audit harness with POSES 1–7 and 23; the D.5 test for the closing contacts; framings + `--hc-k` + feather + dolly on Z; the fall easing; click bursts. | `build.mjs --audit`: `audit passed`, `pose audit passed`, `contacts visible: N of N`. `lines.mjs` reports 0 on both pages. A slowed sheet (`["slow",0.05]`, `["sheet",…,100,16]`) across click 8→9 at `lock` shows the ramp ride and the staged snap with no pop and no rebound. 4× crops in both themes: teeth mesh, U-detent over the head, tab in notch, hub on stud, window walls and chamfer, C-ring and neck, the slot with the fold. |
| **S3 Key and unlock (the heart)** | 1:40–2:50 | C5 key (all parts, bow hole or fallback); stand (26–30); `keyPose` paths (upright, flip); key.air/outer/inner with gland clips and `holdStill`; turn 1 / turn 2 with stops and stall; the inverted key in the slot with key.inv.inner; the director with Loop A (A0–A23); lit crossfade; the camera at beat boundaries; direct key drag. | Slowed sheets: the readout reads 118, 183, 194, 46, 76 and 86 within 0.5° of truth, and the stall reads 58 with u 4 (`drive` with K, D, ↑, ↓). The pose audit adds POSES 8–22 and 29 and passes. `contacts visible` covers every key contact. `lines` 0 at κ 0, 194 and −86 and with the key inverted at the slot. 4× crops: the flag behind the lit flange at 183 and 194 (I.50: the turn-1 push is taught by the lit spring's slide, not by a 118 crop), flag on shoulder at 46 and 86, barrel in the C-ring, bow hole, pin in the slot. `capture --times 1400,3000,9500,11500,17500,21000,23000,27000` readouts match U.1–U.3. |
| **S4 Shim, chain, cuff B, stations** | 2:50–3:35 | C6 shim tool + Loop B; C7 chain and swivels (tubes, welds, eyes); C8 cuff B (nose out, keyhole and post tip, slot and fold, serial, dim); bumper, label plate, tool pocket, halos; POSES 24–28. | Full audit with chain: 0, with `crowd` only after an 8× look. The pose audit passes. A drive script shows the shim works single-locked (B3 readout) and jams double-locked (B9). A 4× grid sweep of the whole `pair` drawing in both themes, adding real parts where a face is bare (board regions: §B.3 / C1). |
| **S5 Hands, phone, access** | 3:35–4:10 | Pointer (jaw, key, taps on key, stand, grip), all keys, chapter buttons with arming, `nextBeat`, takeover and resume, aria (slider, valuetext, live status), reduced-motion still, offscreen stop, phone aspect and framings, hint swap. | A `drive.mjs --actions` script: `drag` jaw closed → `D` → `K` → `drag` key turn 1 → `drag` key turn 2 → `drag` jaw open; `eval` of `aria-valuetext` and the readout at each step. `--reduced` shows the still with its readout. Phone captures at `pair-phone` and `lock-phone`; the lift is ≥ 4 px at lock-phone. `capture --hover` pauses at a beat boundary. Console clean. |
| **S6 Apart (only if S1–S5 passed)** | 4:10–4:35 | Recorder `{ order: ["front","spring","pawl"], spring: { stagger: 0.035, stiffness: 64, damping: 14.2, substeps: 4 } }`; pieces and moves (U.5); `explodeStates` through settle; the A key and button 05; re-sort. | `--audit`: through in mid-flight 0, clearance apart 0, depth order 0 (with replayed frames). `lines` 0 apart. 4× crops apart in both themes. |

**Critique and fix rounds (2 h 30).** Compare with `examples/test-rig` (drawing craft) and `examples/arcade-cabinet` (cutaway composition), at `pair` and `lock`, in both themes.
- **R1 (60 min):**
  - a 30-second first-view test (`capture --times 0…30000` every 2 s: the five ideas in order);
  - slowed contact sheets of every U contact;
  - 4× junction crops (verify.md list: rivet domes on cheeks, the jaw at the mouth, the mesh, window rim and walls, spring fold, flag on post, barrel in the C-ring, swivel and link crossings at 8×, label plate, strap bore tangents at three θ);
  - fix everything found.
- **R2 (50 min):** light theme first; phone; readout truth audit (every string against the model); lit timing (no accent before its contact).
- **R3 (40 min):** final 4× grid sweep; re-run audit, pose audit, contacts and lines on both themes and every resting pose (rest, locked 9, double-locked, κ 194, κ −86 + open, inverted key, shim under, apart); `git -C /home/user/wheresryan22/anatomy status --short` shows only `examples/handcuffs/`.

---

## H. Model module: `examples/handcuffs/model.mjs` (pure; shared by the build, the pose audit and the page)

It is `scratch/truth/model-draft.mjs` **verbatim** in tables, constants and laws, plus the additions marked **+**. Only `export` lines are inlined into the page (with `export` stripped), so no name may collide with the kit's top-level names.

```js
// ---- constants (F, mm, deg) — from truth §5 / model-draft
export const PITCH = 2.5991, THETA1 = -20.735, NPOS = 23;
export const thetaOf = (n) => THETA1 + PITCH * (n - 1);                 // θ9 = 0.058, θ23 = 36.445
export const THETA_LEADIN = -23.335, THETA_MOUTH = -39.07, THETA_FREE_OPEN = -23.33, THETA_OPEN = -100;
export const ALPHA_TIPS = 3.597, ALPHA_CLEAR = 3.746, ALPHA_SHIM = 4.343;
export const ALPHA_PEAK = 3.572, ALPHA_MAX_OFF = 4.972, ALPHA_MAX_ON = 1.300;           // +
export const U_ON = 4.0, U_RELEASED = 0.64, U_DETENT = 0.4;                              // + (U_ON, U_DETENT)
export const KEY = { touchShoulder: -46.3, tipsOnTips: -74.5, teethClear: -75.7, endOff: -86.1, stallOn: -57.8,
                     touchFlange: 118.25, dlReleased: 183.4, endTurn1: 194.4 };          // + tipsOnTips
export const SHIM = { r: 63.625, t: 0.25, w: 3.0, mouthPhi: -23.5, blockedPhi: -10.69, underPhi: -2.0,
                      parkPhi: -50, arcLen: 28, jogR: 71.0, rate: 18.0 /* deg/s = 20 mm/s */ };   // + park, arcLen, jogR, rate
export const PIN = { x: 72.55, yEnter: 16.5, yTouch: 16.30, yEnd: 12.30, tipZ: -1.6 };   // + tipZ
export const GEO = {                                                                      // +
  HUB: [66.20, 15.70], HUB_R: 1.8, STUD: [64.40, 13.30], STUD_R: 1.2, POST: [67.60, -16.50], POST_R: 1.12,
  TIP1: [62.22, -3.15], R_TIP: 63.5, R_ROOT: 62.3, TOOTH_DEPTH: 1.2,
  SLOT: { x0: 71.6, x1: 74.2, y0: 9.95, y1: 17.45 }, KEYHOLE_R: 2.0, NOTCH_W: 1.5, NOTCH_R: 3.9,
  FLAG: { r0: 1.715, r1: 3.445, half: 0.51, len: 3.18 }, BARREL: { r: 1.765, bore: 1.27, boreDepth: 7.0, len: 24.6 },
  Z: { rearCheek: [-4.3, -1.9], middle: [-1.9, 1.9], frontCheek: [1.9, 4.3], jaw: [-1.8, 1.8], pawl: [-1.5, 1.5], flag: [-1.9, 1.28], postTop: 3.8 },
  KEY_TIP_SEATED: -1.9, RING_CENTRE_SEATED: 30.3, RING_CENTRE_SLOT: 11.9,
};
// ---- tables (verbatim from model-draft: linear between samples)
// CLICK, CLICK1, LEADIN (21 samples, f = 0..1 step .05), SNAP (f .945..1 step .0055), KEY2 (κ -46..-87 step -1),
// KEY1 (κ 116..194 step 2), ALIM (u 4..0 step -.25)  — copy the arrays exactly as in scratch/truth/model-draft.mjs
// ---- laws (verbatim)
export function alphaJaw(theta) { /* draft */ }
export const alphaKey = (kappa) => /* draft */;
export const uLimitTurn1 = (kappa) => /* draft */;
export const alphaLimit = (u) => /* draft */;
export const notchAt = (theta) => /* draft */;
export function loopAt(theta) { /* draft: { perimeter, idEq, width } */ }
// ---- + geometry-truth helpers
export const tipRise = (alpha) => Math.hypot(...rotF(GEO.TIP1, GEO.HUB, alpha)) - GEO.R_ROOT;  // 0.43@1.30, 1.25@3.746, 1.43@4.28, 1.66@4.97
export const tabBump = (u) => Math.max(0, Math.min(u, U_DETENT, U_ON - u));                    // tab rides 0.4 out of the V notches
export const tabLocal = (u) => [67.80 + tabBump(u), -2.70 - u];                                  // pawl-local (α = 0)
export function springCentreline(u, alpha) {
  // truth §2.3 centreline (spring_centreline_u0) with every y − u; the lower leg replaced by a cubic Bézier
  // from the fold corner c0 = (68.20, 14.30 − u) with tangent (0, −1) to the tab t = rotF(tabLocal(u), HUB, alpha)
  // with tangent (−0.5, −0.5)/√… (into the notch); control lengths 1/3 of |c0 − t|. Returns the polyline (F), ≥ 24 samples on the cubic.
}
export const rotF = ([x, y], [cx, cy], a) => { const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]; };
// ---- state
export function create() {
  return { theta: THETA_OPEN, alpha: 0, u: 0, notch: 0, peak: 0,
           key: { at: "stand", depth: 0, kappa: 0, pinY: PIN.yEnter },     // + 'stand' | 'air' | 'keyhole' | 'slot'
           shim: { phi: SHIM.parkPhi, under: false },                       // + phi is never null; park = −50
           events: [] };
}
// ---- one physics step (draft logic + the + lines)
export function step(s, want, dt) {
  // want = { jaw?: θ*, key?: { at?, depth?, kappa?, pinY? }, shim?: φ* }
  // + key.at/depth are set by the page's transport (keyPose); the model refuses depth changes unless |κ| ≤ 0.5
  //   (κ is driven to 0 first) and refuses κ changes unless at === 'keyhole' && depth === 1.
  // 1. spring by pin (draft)          2. key turn with the turn-1 stop and turn-2 stall (draft)
  // 3. holds: aKey, aShim (draft)     4. jaw with closing block / opening block / click events (draft)
  // 5. shim: rate SHIM.rate (+ fixes the draft's 20°/s); blocked unless peak ≥ ALPHA_TIPS − 0.05 && alphaLimit(u) ≥ ALPHA_SHIM;
  //    + retracting past blockedPhi − 0.01 sets under = false.
  // 6. alpha = min(max(alphaJaw(θ), hold), max(alphaLimit(u), alphaJaw(θ)))  (draft)
  // + 7. events (compare before/after; each { type, ... }):
  //   click{n} · blocked{why:'teeth'|'double lock'|'closing'} · dl{on:true at u reaching 4 | off at u crossing ≤ 0.64}
  //   touch{what:'flange' at κ ≥ 118.25 with u > 0 | 'shoulder' at κ ≤ −46.3 | 'fold' at pinY ≤ 16.30}
  //   stop{turn:1 at 194.4 | 2 at −86.1} · stall{at −57.8 when u > 0.64} · clear{α crossing 3.746 up with the key}
  //   mouth{in|out at θ crossing −39.07} · shim{'mouth'|'blocked'|'under'|'out'|'jammed'} · drop{to:'stud'|'root'}
  //   relock{n} (key hold falls below 3.746 while notch > 0 && θ > THETA_FREE_OPEN)
  return s;
}
// ---- + derived words
export function classify(s) { /* 'APART' is page-side; returns OPEN | ENTERING | LOCKED | DOUBLE | DOUBLE_OPEN | KEYED | RELEASED | SHIMMED */ }
export function say(s, events, prev) { /* returns { readout (≤ 36 chars), status (phase or ''), valuetext (on change) } per E.6 / U */ }
// ---- + truth-drift guard, run by every build (throws on failure) and by `node model.mjs --check`
export function check() {
  const near = (a, b, e, what) => { if (Math.abs(a - b) > e) throw new Error(`model check: ${what} ${a} vs ${b}`); };
  near(loopAt(thetaOf(1)).perimeter, 213.4, 0.2, "P(θ1)"); near(loopAt(thetaOf(23)).perimeter, 147.3, 0.2, "P(θ23)");
  near(loopAt(thetaOf(9)).perimeter, 189.0, 0.2, "P(θ9)"); near(loopAt(thetaOf(23)).width, 45.4, 0.2, "W(θ23)");
  near(alphaKey(KEY.teethClear), ALPHA_CLEAR, 0.02, "clear"); near(alphaKey(KEY.endOff), ALPHA_MAX_OFF, 0.06, "end off");
  near(alphaKey(KEY.stallOn), alphaLimit(4), 0.03, "stall"); near(alphaKey(KEY.tipsOnTips), ALPHA_TIPS, 0.03, "tips");
  near(uLimitTurn1(KEY.dlReleased), U_RELEASED, 0.03, "release"); near(uLimitTurn1(KEY.endTurn1), 0, 0.03, "end 1");
  near(uLimitTurn1(KEY.touchFlange), 4, 0.06, "touch"); near(alphaLimit(0), ALPHA_MAX_OFF, 0.01, "ALIM 0");
  near(alphaLimit(4), ALPHA_MAX_ON, 0.01, "ALIM 4"); near(tipRise(1.30), 0.43, 0.01, "rise on"); near(tipRise(4.97), 1.66, 0.01, "rise off");
  // + replay of scratch/truth/test-model.mjs (without the reference solver): close to 9, pull blocked, pin ON, squeeze blocked
  //   (θ advance 0.92 ± 0.05), shim jammed, turn 2 stalls at −57.8 ± 0.1, turn 1 to 194.4 (u 0), turn 2 to −86.1, pull open,
  //   key back, close again, shim under after one squeeze, pull open over the shim.
  return true;
}
```

**Tables (exact copies; do not retype; import the text from `model-draft.mjs`)**
- `CLICK = [0,.16,.34,.53,.71,.89,1.08,1.26,1.45,1.64,1.83,2.02,2.21,2.41,2.60,2.80,2.99,3.19,3.39,3.57,0]`
- `CLICK1 = [0,.14,.29,.44,.59,.74,.90,1.05,1.21,1.37,1.53,1.69,1.85,2.02,2.18,2.35,2.52,2.69,2.86,3.10,0]`
- `LEADIN = [0,.12,.25,.38,.52,.65,.79,.92,1.06,1.20,1.33,1.47,1.61,1.75,1.90,2.04,2.18,2.33,2.48,2.73,0]`
- `SNAP = [3.57,3.16,3.07,3.09,3.10,2.86,2.71,2.73,2.74,2.39,0]`
- `KEY2 = [0,.09,.20,.31,.42,.52,.62,.72,.82,.92,1.04,1.19,1.33,1.47,1.62,1.76,1.90,2.04,2.18,2.32,2.46,2.60,2.74,2.87,3.01,3.14,3.27,3.40,3.53,3.66,3.79,3.91,4.04,4.16,4.28,4.40,4.52,4.63,4.74,4.85,4.96,5.07]`
- `KEY1 = [4,4,3.79,3.59,3.40,3.24,3.08,2.94,2.81,2.69,2.57,2.46,2.36,2.27,2.17,2.08,2.00,1.92,1.84,1.76,1.68,1.61,1.54,1.46,1.39,1.32,1.25,1.18,1.12,1.05,.98,.91,.84,.72,.60,.48,.37,.25,.13,.02]`
- `ALIM = [1.30,1.31,1.33,1.34,1.35,1.36,1.38,1.39,1.41,1.42,1.44,1.45,1.47,2.40,4.73,4.78,4.97]`

**Reference values the readouts must reproduce** (measured from these tables)

| Quantity | Values |
|---|---|
| tipRise (mm) | 1.30° → 0.43 · 2.32 → 0.77 · 3.01 → 1.00 · 3.57 → 1.19 · 3.746 → 1.25 · 4.28 → 1.43 · 4.343 → 1.45 · 4.97 → 1.66 |
| turn 2, κ → α (up) | −55 → 0.92° (0.31) · −57.8 → 1.30 (0.43) · −60 → 1.62 (0.54) · −64 → 2.18 (0.73) · −70 → 3.01 (1.00) · −74.5 → 3.59 (1.20) · −75.7 → 3.75 (1.25) · −80 → 4.28 (1.43) · −86.1 → 4.97 (1.66) |
| turn 1, κ → u left / pushed | 118.25 → 3.97 / 0.03 · 130 → 2.94 / 1.06 · 140 → 2.36 / 1.64 · 150 → 1.92 / 2.08 · 152 → 1.84 / 2.16 · 160 → 1.54 / 2.46 · 170 → 1.18 / 2.82 · 180 → 0.84 / 3.16 · 183.4 → 0.64 / 3.36 · 190 → 0.25 / 3.75 · 194.4 → 0 / 4.00 |
| loop | P(θ₁) 213.4 · P(θ₉) 189.0 · P(θ₁₂) 180.0 · P(θ₁₃) 177.0 · P(θ₂₃) 147.3 mm |

**Page-side, not model**
- `alphaShown` (fall easing);
- key transport `keyPose(path, t)` and the flip (in `parts.mjs`);
- camera, lit and bursts;
- apart springs.

The model is the only source of every number shown.

---

## I. Decisions log (every departure from a design or a judge, with the reason)

| # | Topic | Options (source) | Decision | Reason |
|---|---|---|---|---|
| 1 | Base | realism (2 judges), mechanism (1 judge) | **realism**, with every compatible graft | Majority winner; its camera is the only one that keeps the turn-1 catch in view. |
| 2 | World mapping | F straight into the kit (realism, interaction) vs W = (x, −y, z) (mechanism) | **W = (x, −y, z + 4.8)**, rings re-oriented, build chirality assert | All judges: the kit's iso is left-handed (verified: kit cross +4.98; mapped −4.98 = CCW). |
| 3 | Camera | az 248 W (mechanism), az 112 F (interaction), β 62 (realism) | **β 62 = W az 298, el 48** | Judge scans: β ≥ 85 hides the flag at κ 118; β 62 is clear for every key-in contact (re-verified in `verify.mjs`). |
| 4 | Canvas | 600 × 430 (realism), 932 × 700 (mechanism), 920 × 580 (interaction) | **920 × 640 in a 980 card, 2.69 px/mm** | Judges 2 and 3: an EPIC card with the lock legible at 1×; 640 tall holds the key column. |
| 5 | Framings | 2 (realism, interaction) vs 5 (mechanism) | **2 per device**: pair, lock at **7.0 px/mm** (zoom 2.60) | Judges 2 and 3 cap at two; judge 1 wants the lock near BENCH 7 px/mm. |
| 6 | Line weight | scaling strokes (realism) vs constant (mechanism, interaction) | **constant via `--hc-k`** | Judges 2 and 3 (must avoid: 1.9 px lines at zoom). |
| 7 | P4 fine projection | yes (mechanism; judges 1, 2) vs only if needed (judge 3) | **yes, scoped to 6 rebuilt parts, `FINE` switch** | Majority; cheap; the switch honours judge 3. |
| 8 | Edge feather | SVG mask (interaction) vs CSS mask-image (mechanism) | **CSS mask-image when zoom > 1.05** | Judge 3: simpler; no per-frame mask rewrites. |
| 9 | Window +x edge | 73.6 (realism) | **75.5** for y −19.15 … 9.0 | Judge 1: shows the spring's upper leg as one leaf (verified: top visible to x 73.63). |
| 10 | Window lower-right | to y −21.8 (judge 1's wording) | **edge on y −19.15 for x 70.6 … 75.5** | Lays the frame near/far seam on the window wall's base line (invisible). The flange↔ON-stop contact remains visible; the flag's first-touch tip (69.23, −19.53) is west of x 70.6 and visible. |
| 11 | Keyhole bridge | ψ 245, 1.2–2.4 wide (truth, realism, mechanism, interaction) | **0.62 mm neck to the rivet boss at ψ 231.6** | A ψ 245 bridge would land on the rivet (63.8, −21.3) boss (0.78 from the rivet centre). ψ 231.6 is still inside turn 1's free sweep only. |
| 12 | Keyhole ring | full ring (realism) vs C-ring open at −x (mechanism) | **C-ring** | The 1.5 notch toward −x cuts the 0.5 rim (truth §2.4). |
| 13 | Frame split | none (realism, interaction) vs near/far at y 12.6 (mechanism) | **far / nearW / nearE**, cuts at y −19.15 (x ≥ 73.8) and x 72.0 (y ≥ 19.6) | At this camera the roof is in front of the spring and the ON step behind it, and the tongue is behind the pin while the roof is in front. Both cuts lie under metal or on a drawn wall line. |
| 14 | Key split height | gland at the face (realism, interaction) vs inner cut at z 1.9 (mechanism, judge 3) | **key.inner to z 4.3 with keyhole.walls as its own item** | Removes judge 3's interlock (the walls are behind the barrel) without leaving the barrel missing in the 0.235 annulus. |
| 15 | Pin in the slot | pin.inner cut at 1.9 (judge 3) | **key.inv.inner to z 4.3 with slot.walls as its own item** | The 2.6 mm slot shows the pin between 1.9 and 4.3; a cut at 1.9 would leave a visible gap in the pin. |
| 16 | Stud 52 | top at 1.9 (mechanism), pillar to the face (interaction) | **milled flush at 1.5** | Judge 3 interlock. |
| 17 | Swivel base | 5.0 tall (truth ESTIMATE) | **3.8 (±1.9), hidden** | Keeps the straight +z lid lift collision-free; the base is invisible assembled. |
| 18 | Supports | 6 standoffs (realism) | **cuffs rest on their rear domes** (mechanism, interaction) | Judge 3 must avoid; true for a cuff lying on a table. |
| 19 | Shim tool | straight tangent tool on the bench (mechanism, judge 3); rail (realism); flying strip (interaction) | **a pre-curved strip on the tooth-tip circle + jog + bench grip, rotating about the hinge axis (1 DOF)** | At this camera the tangent line runs 4.5° from the view: a straight tool would show end-on, standing behind the key column (seen in `rough-locked.png`). Kept from the judges: it rests on the bench, has one degree of freedom, never flies, and has no rail at the mouth. Inside the case the path is truth's (r 63.625, blocked −10.69, under −2.0). |
| 20 | Wrist mandrel | yes (realism; judge 1 praise) vs no (judges 2, 3) | **no** | Two of three judges; painter's-order cost. Scale comes from the ruler and the mm readout. |
| 21 | Cuff B | open (truth suggestion), pos 20 on a mandrel (realism), pos 12 (interaction), pos 23 nose out (mechanism) | **pos 23, double-locked, nose 4.6 out, unsplit, `hc-dim`** | Judges 2 and 3; the true "carried loaded" fact. |
| 22 | Open pose | −60 (mechanism), −75 (realism), −100 (interaction, truth) | **−100 + bumper tangent there** | Judge 1 (gap ≈ 56.8 ≥ NIJ 50 mm); the bumper is a mechanism-design part relocated (F (−41.91, −2.68), measured). |
| 23 | Key parking | lying flat (mechanism), front-left stand (realism), park pin (interaction) | **upright stand (realism recipe) at back-centre F (112, −50)** | Upright only (judge 3). Back-centre fills the prominent upper-centre board region, keeps flights inside `lock`, and never stands in front of the window. |
| 24 | Chain | wire 2.2 / inner 8.0 (realism), link 1 tilted 25° (mechanism) | **truth proportions (2.6 / 5.4), link 1 rolled 25° toward the viewer** | Judge 3, and verified at this camera: the flat link passes at f 0.743 and the rolled link at f 0.850; roll 115° pinches. |
| 25 | Swivel eyes | ringBand (mechanism), 12 segments (realism), tube loops (interaction) | **closed tube loops** (round section Ø 1.7 instead of truth's 3.4 × 1.7 ESTIMATE flat ring) | Judge 3 interlock (ringBand); segments would show radial seams. |
| 26 | Lit method | duplicate lit copies (realism) vs color-mix (mechanism, interaction) | **color-mix variable, 0.18 s; hard switch fallback** | Judges 2 and 3. |
| 27 | Lit owners | realism's rule | **pawl / spring / shim only; the handover at the contact event** | Judges 1 and 2; mechanism's jaw/key lit rejected. |
| 28 | Pawl lift wording | degrees (realism, mechanism) | **tooth rise in mm of 1.2** (`tipRise`) | All judges. |
| 29 | Readout length | 32 (mechanism) – 46 (realism) | **≤ 36 chars** | Judges: 32–40; fits the phone row. |
| 30 | Turn-1 words | `double lock off · 194°` (realism), `drags` (mechanism) | **`meets spring` 118 → `pushed x of 4 mm` → `double lock off` 183 → `stop` 194** | Truth §5; the judges. |
| 31 | Tour | 56 s single loop (realism) | **Loop A (27.5 s) + Loop B (37.8 s)**; squeeze-after-DL in A; wrong order in B | Judge 1 grafts; all ideas by 23 s. |
| 32 | Reduced motion | still pair (judge 3) vs D3 still | **D3's κ −80 still in the `pair` framing** | Combines both grafts. |
| 33 | Chapter buttons | path-planning buttons (realism) | **buttons that arm through the director's own beats** | Judge 1 keeps the buttons; judge 3 rejects path planners. |
| 34 | Apart view | Raptor z-stack (realism; judges 1, 2) vs lid-lift last or none (judge 3) | **3 assemblies straight +z (48 / 16 / 7), in `lock`, from REST, last (S6)** | Measured: at 48 the lid covers 0% of the cavity and the lifted parts. It is truth's §3.3 direction and order, it has no lateral collisions, and the spring reads as one part (judge 1's "aha"). |
| 35 | Phone default | lock-phone (interaction) | **pair-phone at load; lock-phone for mechanism beats** | Judge 2 (the first view must be the whole pair) + judge 3 (lock is the working view). |
| 36 | ARIA role | group (realism, interaction) vs slider (mechanism) | **slider** | verify.md asks for `aria-valuetext`. |
| 37 | Space | squeeze (realism) vs next beat (mechanism, interaction) | **next beat**; → squeezes | Judge 1 graft (state-aware `nextBeat`). |
| 38 | Toe clamp | yes (mechanism) | **no** | It collides with the ruler and its zero tick; it costs S4 time (judge 3). The locator pins already show that cuff A is held. |
| 39 | Board | 286 × 150 (realism), 276 × 156 (mechanism), 280 × 138 (interaction) | **F x −56 … 228, y −86 … 61** with stations in every region | Forced by the open jaw, the parked grip and cuff B. Label plate back-right; ruler front; stand back-centre; bumper and tool back-left. |
| 40 | Rear cheek top | separate floor overlay (all designs) | **the rear cheek's top face uses cavity tokens** | It is only ever seen through openings and gaps; this also gives mechanism's double-strand gap shading. |
| 41 | Pawl drop | rebound 0.15 (interaction) | **critically damped, τ 0.018 s, no rebound** | Judges (truth: staged snap, no overshoot). |
| 42 | Shim rate | 20°/s (model-draft code) | **18.0°/s (20 mm/s)** | Truth §5 says 20 mm/s ÷ r. |
| 43 | Key state names | `'out'` (draft) | **`'stand' | 'air' | 'keyhole' | 'slot'`** | The key has real stations. |
| 44 | Resume delay | 6 s (interaction) | **3.6 s** | motion.md. |
| 45 | Camera time constant | 0.42 (mechanism), 0.7 (interaction), 1.0 (realism) | **0.42 s** | Arrives in about 1.2 s and only moves at boundaries. |
| 46 | Monogram on cuff A | truth markings | **omitted** | No logos (craft); the window mills that spot away anyway. |
| 47 | Pin entry | slot with rounded ends (realism) | **rectangular slot, corner r 0.3** | A semicircular end would cut into the pin's entry pose (72.55, 16.5) on the slot's −x edge. |
| 48 | Cheek hinge lobe (truth-geometry correction, S1 gate) | `cheekOutline` idx 84–113: the r 7.0 arc about the hinge run the short way (φ 133.3 → 91 → −20, over +y), a cup that left the hinge outside both cheeks | **the figure's copy `examples/handcuffs/truth-geometry.json` replaces idx 84–113 with the mirror of the jaw eye: the r 7.0 arc from φ 133.3 CCW through 180° and 270° to φ 374.5 (= 14.5°) in 36 segments, then the jaw's own 0.9 mm radial step to the inner arc's nearest point (7.648, 1.978). The ring goes 204 → 211 vertices; `CHEEK_RUNS` (bore) now starts at (7.648, 1.978); the lobe and the step are outer walls.** | Truth §1 ("lobe r 7.0 on both cheeks and on the jaw eye"; hinge stud through both cheeks with domed heads) and C2 #42/#62 (domes on the lobe). After the fix the hinge and all 72 samples of r 6.9 are inside the cheek. `scratch/truth/truth-geometry.json` is unchanged (the build reads only the figure's copy); `scratch/s1fix/patch-cheek.mjs` reproduces the edit. |
| 49 | Strap self-occlusion | playbook §2.3 ("self-occlusion is sub-pixel, leave the teeth in the body"); every wall line stroked above the top face | **`strapPaths` paints the front-facing outer walls as facing runs, far → near (by the nearer top edge over each shared screen column), each with its own shades, bottom line and end verticals, then the top face over all of them; only the top face's boundary is stroked above it** | S1 gate: the tooth locking faces and the hinge jog drew through the jaw's top face (a comb at 1×, a Z ladder at the mouth). Checked by `scratch/s1fix/check-walls.mjs`: runs monotone across the screen, 0 pairs in the wrong order at 8 jaw angles, both cheeks and the frame. |
| 50 | Turn-1 first touch (κ 118.25) as a 4× crop (S3 gate) | mill the C-ring's far side open (gate fix 1); drop the 118 crop and teach the push by the lit spring's slide and the 183–194 view (gate fix 2) | **fix 2: the 118 crop is dropped from G; turn 1 is read from the lit spring sliding +y (u 4 → 0, `pushed x of 4 mm`), the readout's 118 / 183 / 194 words and the flag behind the lit flange at 183–194** | At this camera (view from F ψ 62) the flag at 118 points ψ 298, 56° from straight away. Rays from its middle meet the C-ring's underside (e.g. the flag centre r 2.58, z −0.3 → the ring at r 2.2, z 1.9); only its outer tip and lower edge show, light on light beside the window walls. A through-cut of the ring over ψ ≈ 300–350 would leave the arc ψ ≈ 350 → 162 (through +y, to the notch) floating: the island is held only by the neck at ψ 231.6 (C2a), so the cut is not a true shape; an undercut from below would leave a non-physical bridge and needs a 3-D cut the extruded HOLE does not have. D.5 still proves the contact samples are seen (`flag ↔ flange 118.25 visible`). |
| 51 | Beat-end events vs the next beat's words (S3 gate) | U as written: the slide, turn 1 and turn 2 reach their end exactly at the beat's end | **A8 = slide 0.9 s + 0.3 s still; A15 = κ 118.25 → 194.4 in 1.4 s (54°/s, U says about 42) + 0.4 s at the stop; A18 = κ −46.3 → −86.1 in 1.1 s (36°/s, U says about 27) + 0.4 s at the stop. A worded step's words win over an event held from before it began; event words carry the κ and α of the sub-step they fired in** | Beat starts and lengths are unchanged. Without the still tails, `detent parked …`, `turn 1 · 194° · stop` and `turn 2 · 86° · stop …` showed for one frame (or were held over the next beat's words, e.g. A16, or read a κ the key had already left). |
| 52 | Key bow: neck and pin boss through the 2.0 mm ring (S3 gate round 3) | C5 #72 neck lathe to s 25.3 and #75 boss drawn whole, each painted on one side of the ring; #73 `ringBand` with `hole` (the kit draws no inner wall) | **Neck lathe ends at s 24.93, where its r 2.2 rim meets the ring's outer circle ("rim on the ring"); the boss is recorded whole (s 39.3 … 39.8) and drawn as a core outside the ring (s 39.67 … 39.8) plus a lobe proud of each face (\|w\| ≥ 1, s 39.3 … 39.8); the neck's front lobe (s 24.6 … 24.93) is drawn again after the ring when the neck lies behind it (aV ≥ 0). Back lobes go before the ring, front lobes after it. The ring draws its eye's bore wall (inner cylinder facets that face the viewer, clipped to the front opening) and the back rim seen through the opening** | Both collars are wider (Ø 4.4, Ø 2.8) than the ring is thick (2.0), so each has a lobe proud of each face. Painted whole on one side of the ring, the neck's front lump was hidden by the band and its cap (and, inverted, the boss's cap) showed through the eye, where in truth the 2 mm bore wall hides it (gate ray check: from behind the back face the ray meets the slab at r ≥ 5.39 > 5.05). The neck past s 24.93 lies inside the ring except its lobes; ending it there leaves no neck surface inside the ring for the inverted pose, where the neck is painted after the ring. Pieces are split by the ring's face planes, so each paints on its true side in every pose (upright, inverted, flights). |
