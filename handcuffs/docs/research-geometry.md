# Handcuff plan geometry (one cuff, millimetres)

This is the geometry deliverable for the Anatomy "handcuffs" HERO figure. It complements `research-mechanism.md`: that file says what the parts are and how they work; this one says where each part is, in mm.

**Model:** Smith & Wesson Model 100 (nickel, slot double lock), as recommended in `research-mechanism.md` §0. Its lock is the one in US 4,287,731.

**Peerless 700 deltas:** given in §6, for a builder who prefers the "textbook" layout.

**Confidence tags**
- **H**: read directly from a source.
- **M**: derived from a source and cross-checked against a second, independent source.
- **L**: derived from a single weak source.
- **ESTIMATE**: no source; engineering choice that is consistent with everything else.

**Helper files** (outside the repo, under `scratch/geo/`):
- `model.py`: the parametric model behind every number below.
- `handcuff-plan-geometry.json`: polylines exported from the model.
- `check_overlay_fig1.png`, `check_overlay_fig3.png`, `check_overlay_fig5.png`: the model drawn over the patent figures.
- `plan_states.png`: the model at positions 1, 8, 23 and open.

---

## 0. How the numbers were obtained (read once)

**1. Template.** US 4,287,731 (Kruger, Bangor Punta, later assigned to S&W; filed 1979) [P1].
- Fig. 1 is a full-face drawing of one cuff.
- Figs. 3, 5 and 6 show the lock with the front cheek removed, in 3 states.
- Fig. 2 is the edge view.
- Figs. 7–12 are cross-sections.

The figures are internally consistent:
- Figs. 3, 5 and 6 register onto Fig. 1 through the 4 case bosses, with residuals ≤ 0.4 mm. All three are at 2.00× Fig. 1.
- Fig. 2 has the same height as Fig. 1.

**2. Absolute scale.** S&W publishes the Model 100 at 8.98 in maximum overall length, with 2.00 in "between cuffs" [S1]. One cuff body, from the pivot-lobe bottom to the case top, is therefore (8.98 − 2.00)/2 = 3.49 in = **88.6 mm**.
- Fig. 1 measures 818 px over that span, so 1 px = 0.1083 mm. Figs. 3, 5 and 6 are 0.0542 mm/px.
- The "between cuffs = case-to-case gap" reading is confirmed by the Peerless maker photo [S4]. Its gap/body ratio is 0.564, against 0.58 predicted from Peerless's own 8.9 in / 2.0 in specification.

**3. Cross-check 1: real product photo** [S3: S&W M100 melonite retail photo, `refs/sw-m100-melonite-photo.png`].
- At a single scale of 4.80 px/mm, these all land within about 1 mm of the scaled patent positions:
  - the pivot rivet
  - the 4 case rivets
  - the keyhole
  - the double-lock (DL) slot
  - the bolt-stud dot
  - the swivel
- The one exception is the upper rivet pair, which sits at ±9.7 mm on the current product versus ±7.0 mm in the patent.
- At that same scale, the key barrel measures 3.4 mm. The NIJ barrel diameter is 3.53 ± 0.25 mm [S2].
- The key length measures 46 mm, matching a dealer's figure of 1.8 in (45.7 mm).
- **Conclusion: the absolute scale is good to about 3 %.** M

**4. Cross-check 2: kinematics.**
- Rotating the patent's jaw about its pivot through 22 clicks of 2.76° changes the loop's inside perimeter from **212 to 144 mm**. S&W's specification is **213 to 147 mm** for its first and last notch [S1].
- The per-click change is 3.06 mm, against 3.0 mm in the specification. M
- The patent drawing is therefore a faithful scale drawing of the real cuff's closing geometry.

**5. Idealisation.** The patent case is about 0.8° off the pivot axis. Every coordinate below has been rotated by 0.8° so that the case is mirror-symmetric about x = 0. This shifts no feature by more than 1 mm.

### Coordinate frame (used everywhere below)

| Item | Convention |
|---|---|
| Origin | Centre of the jaw pivot (S&W "joint stud 20", Peerless "single-strand rivet") |
| +y | From the pivot toward the lock case and swivel |
| +x | Toward the jaw (single-strand) side, **as seen looking at the FRONT (keyhole) face**. The keyhole is also on the +x side. |
| +z | Out of the front (keyhole) face, toward the viewer. z = 0 is the jaw's mid-plane. |
| bearing β | Angle measured **clockwise from +y**; a point is (r·sinβ, r·cosβ) |
| jaw angle θ | Rotation of the jaw about the origin, **counter-clockwise positive (= closing)**. **θ = 0 is locking position 8 of 23**, the pose drawn in patent Fig. 1. |

The orientation rule is H from [P1] Figs. 1/3 and [P2]: "jaw 12 is pivoted counter-clockwise ... to close". It is confirmed on the product photo: keyhole face up, the jaw enters at the keyhole end of the case.

---

## 1. Plan-view layout (one cuff, θ = 0 unless stated)

### 1.1 Governing circles (the whole cuff is built from these)

| Circle | Centre | Radius | Role | Conf. |
|---|---|---|---|---|
| C0 | origin | **57.5** | Lower (loop-side) edge of the lock case. Also the inner edge of the jaw's toothed band, which is concentric with the pivot. | M |
| Tooth tips | origin | **63.5** | Jaw tooth tips. This is also the **jaw sweep circle**: nothing that bridges the two cheek plates may lie inside it, other than the pivot. | M |
| Tooth roots | origin | **62.3** | Jaw tooth roots, giving a tooth depth of 1.2 | M |
| Frame channel | origin | **63.8** | Lower edge of the frame spacer plate. The jaw runs in the 57.5–63.8 channel between the cheek heads. | M |
| DS inner | (−8.19, 31.66) | **24.8** | Inner edge of the double strand. **Internally tangent to C0 at β = −14.5°.** Patent fit residual 0.08 mm. | H (shape) / M (size) |
| DS outer | (−8.19, 31.66) | **36.6** | Outer edge of the double strand; concentric with DS inner, band 11.8 | M |
| Jaw inner (θ = 0) | (+8.19, 31.66) | **24.8** | Mirror of DS inner. Tangent to C0 at β = +14.5°. Fit residual 0.11 mm. | H/M |
| Jaw outer (θ = 0) | (+8.19, 31.66) | **36.6** | Mirror of DS outer. The patent fit is (6.7, 32.7) r 37.4; the concentric simplification moves the edge by ≤ 1 mm. | M |
| Pivot lobe | origin | **7.0** | Rounded ends of both cheek plates and the jaw eye | M |

**Loop at θ = 0**
- Inside: x from −33.0 to +33.0 (**66.0 across**); y from about 7.3 to 57.5 (**about 50.5 along the axis**).
- The along-axis figure is fixed, because the pivot and the case are on the same part. S&W's "opening 2.04 in" (51.8 mm) matches it. M

**Outside of the cuff**
- x ±44.8 (**89.6 wide**).
- y from −7.0 to +81.6 (**88.6 body**); +92.3 to the top of the swivel eye.
- Pair length check: 2 × 88.6 + 50.8 between cuffs = 228 mm = 8.98 in. M

### 1.2 Double strand (two cheek plates, front 16 and rear 18, identical outline)

Outline, going round the plate (M; patent Fig. 1 overlay):
1. Pivot lobe: r 7.0 round the bottom of the origin. Lowest point (0, −7.0).
2. DS outer arc: from the lobe junction at (−5.08, −4.81), up the left side. Leftmost point (−44.79, 31.66). It meets the case's left wall at (−26.0, 63.64).
3. DS inner arc: from its point nearest the pivot at (−1.98, 7.65), round the left. Leftmost point (−32.99, 31.66). It blends tangentially into C0 at (−14.40, 55.67).
4. Band width: 11.8 mm. The product photo shows 10.4–11.5. Treat this as 11 ± 1. M/L

**There is no spacer between the plates anywhere along the double strand.** The plates are held together only at the pivot and in the case. The jaw swings through this 3.8 mm gap. H ([P1]; NBS: "the gap between the two existing cheek plates" [P5]).

### 1.3 Lock case (the cheek "heads" 16a/18a plus the frame plate 24 between them)

Outline polygon (cheek heads; the frame shares it). M from the patent overlay.

```
(22.93, 52.73)  ← C0 at β=+23.5°  (inner corner of the jaw MOUTH)
(25.44, 58.51)  ← r 63.8 at β=+23.5° (outer corner of the mouth)
(25.8, 60.0) → (24.6, 74.5) → fillet R4 centre (20.6, 74.5) → (21.84, 78.30)
→ (7.5, 81.6)  top plateau  (−7.5, 81.6)
→ (−21.84, 78.30) → fillet R4 centre (−20.6, 74.5) → (−24.6, 74.5) → (−26.0, 63.64)
→ [DS outer arc]
lower (loop-side) edge = C0 arc r 57.5 from β −14.5° (−14.40, 55.67) to β +23.5° (22.93, 52.73)
```

- **Case size:** about 51.6 wide (x −26.0 to +25.8), and 24.1 tall at the centreline (y 57.5 to 81.6).
- **Top:** a 15 mm flat plateau, sloping about 13° down to the shoulders.

**Jaw mouth (where the single strand enters the case)**
- A radial opening at **β = +23.5°**, spanning **r 57.5 to 63.8** (6.3 mm) by the 3.8 mm gap between the cheek heads.
- It is on the **right-hand (+x) end of the case, at its lower corner.** M

**Frame plate 24 (middle layer, case only).** Its outline is the case outline minus four cut-outs:
1. **The jaw channel:** everything at r < 63.8 from the origin. The frame's lower edge is the arc r 63.8, and in Figs. 3/5/6 it measures 63.7–64.5. M
2. **The lock cavity 38:**
   - Roof at y 73.8, from x −19.6 to +21.6.
   - Left wall x −19.6, down to y 67.2, then slanting to the stud seat at (−17.8, 64.2).
   - Right end: wall x 21.6 down to y 70.0, then a **circular key pocket r 4.2 round the key post** down to (17.3, 63.5).
   - The cavity floor is open to the jaw channel between x ≈ −17.5 and +17.3.
   - Conf. M (Fig. 5 mapped; ±0.5).
3. **The T-slot 35 for the swivel:**
   - Neck 3.6 wide, from the top (y 81.6) down to y 78.3.
   - Base pocket 6.3 wide × 2.6, at y 75.7–78.3, centred on x = 0.
   - Conf. M.
4. **Four boss apertures 30**, at the rivet positions (§1.9).

### 1.4 Jaw (the single strand) at θ = 0

**Eye:** lobe r 7.0, bore Ø 4.3 on the pivot stud. Conf. M (dashed stud circle in Fig. 1: 4.3).

**Inner edge**
- Arc r 24.8 about (8.19, 31.66), from (1.98, 7.65) round the right. Rightmost point (32.99, 31.66).
- At the tangent point (14.40, 55.67), β +14.5°, it becomes **concentric with the pivot (r 57.5)**.
- It stays concentric from β +14.5° back to the nose. M

**Nose (free end)**
- Semicircle r 1.9, centred at r 59.4 / β −12.0°. **The tip's extreme is at β −13.8°.**
- A lead-in ramp runs from the nose top (r 61.3) up to the first tooth tip. M

**Teeth (on the outer, convex edge)**
- **21 sawteeth (ESTIMATE, chosen to give S&W's published 23 locking positions with a 3-tooth pawl). The patent drawing shows 20.**
- Steep (locking) faces are radial, at **β_k = −10.90° + 2.76°·(k−1), k = 1…21**. That puts face 1 at −10.90°, face 6 at +2.90°, and face 21 at +44.30°.
- Each ramp rises from (r 62.3, β_{k−1}) to (r 63.5, β_k). Ramps face the nose (the direction of travel); steep faces face the pivot.
- **Pitch is 2.76° = 3.06 mm at the tips (3.00 mm at the roots).** Depth 1.2. Ramp about 21° to the tangent.
- Toothed span is β −13.7° to +44.3° (58°, about 64 mm of edge).
- Conf.:
  - Pitch: M. Patent faces were measured at 2.76° ± 0.1°; perimeter per click is 3.0 mm [S1].
  - Count: L.
  - Peerless photo for comparison: about 21 teeth over 58° at r ≈ 60.

**Tail**
- After face 21, the edge steps from r 62.3 to the outer arc, at about (43.0, 43.0) (r 60.8, β 45°).
- The outer arc (r 36.6 about (8.19, 31.66)) then runs down the right. Rightmost point (44.79, 31.66). It meets the lobe at (5.0, −4.8). M

**Widths**
- Main band: 11.8.
- Toothed section: 6.0 (57.5–63.5), with 4.8 mm of solid metal under the roots.
- The whole jaw lies inside r ≤ 63.5. That is what lets it swing through. M

**Face grooves (anti-pry)**
- A groove on each face along r ≈ 61.0, across the toothed section. It is drawn as the second arc under the teeth in Fig. 5, and as the side notches in Figs. 8/9.
- Size: 0.5 wide × 0.3 deep. Conf. L (ESTIMATE for size). Peerless has the same feature, labelled "Single Strand Groove" [S4].

### 1.5 Pawl (S&W "bolt 40") in the engaged state

**Type:** a **rocking lever**, not a slider. It pivots on its round **hub 50**, which is cradled between **stud 52** (below and right) and the frame's curved **wall 54** (above and left). H [P1]

| Feature | Coordinates | Conf. |
|---|---|---|
| Hub (pivot) centre | **(−15.7, 66.2)**, hub r 1.3 | M |
| Stud 52 | **(−13.3, 64.4)**, Ø 2.4. Bridges the two cheek heads; its ends show on both faces. Note r = 65.8, which is outside the sweep circle. | M |
| Shank 44, top edge | (−15.7, 67.5) to (2.3, 67.95) | M |
| Shank 44, bottom edge | (−14.4, 65.0) to (3.2, 64.6) | M |
| Detent notches on the shank top | **59 at x 2.7** and **61 at x 6.7**, 4.0 apart, V 0.4 deep | L |
| Head 46 | Top (7.6, 69.3) to (12.4, 69.3) to (14.3, 68.9); right side x 14.3 from 68.9 down to 66.2 | M |
| **Shoulder 56** (where the key lifts) | Slanted face from (14.3, 66.2) to (12.2, 64.8), facing down and right toward the key post | M |
| Pawl teeth 48 | **3 teeth** on the head's underside, the same sawtooth as the jaw. The profile in (β, r) runs: (2.90°, 63.5) ↓ (2.90°, 62.3) ↗ (5.66°, 63.5) ↓ (5.66°, 62.3) ↗ (8.42°, 63.5) ↓ (8.42°, 62.3) ↗ (11.18°, 63.5). In x, the teeth run from about 3.2 to 12.3. | M (3 teeth: H drawing) |
| Size | Length 31.3 (x −17.0 to +14.3). Head 6.7 wide at the top, 9 wide at the teeth, 7.0 tall (y 62.3 to 69.3). | M |
| Lever arms from the hub | To the teeth centre: 21.9. To the head top: 26.7. To the spring tab: 18.4. | derived |

**Travel (rotation about the hub; counter-clockwise lifts the head)**
- **Ratchet click: +3.1°** peak. That lifts the teeth 1.2 mm, raises the head top 1.45 mm and deflects the spring tab 1.0 mm.
- **Key lift: up to +3.8°.** That is 1.45 mm at the teeth and 1.8 mm at the head top. Fig. 5 vs Fig. 3 measures the head top at 71.2 vs 69.4.
- **Double-locked: ≤ about +1.4°.** The U-detent sits 0.6 mm above the head top, at a lever of about 25 mm, which allows only about 0.5 mm at the teeth. That is short of the 1.2 mm needed to clear, so the jaw is frozen both ways.
- Conf. M (derived from the patent figures).

### 1.6 Pawl spring = double lock (S&W "bolt spring 42")

**What it is**
- **One folded flat leaf spring**, reverse-bent, 0.5 thick × 3.0 wide in z (ESTIMATE).
- It floats in the cavity; nothing anchors it. It **slides along x by 4.0 mm** between two detented positions.
- Conf. H (type) [P1]; M (travel: the fold, the U and the flange each measure 4.0 ± 0.2 mm between Fig. 6 and Fig. 3).

**How it bears**
- **Upper leg 60** bears up against the cavity roof, which is the underside of the frame.
- **Lower leg 58** bears down on the pawl shank. Its end **tab 65** sits in notch 59 or notch 61, so impacts cannot shift it.
- The spring therefore pushes the pawl clockwise, head down into the teeth. H [P1]

| Part of the spring | **DL OFF** (position 1) | **DL ON** (position 2 = +4.0 in x) |
|---|---|---|
| Fold (left end), vertical, y 67.9 to 72.3, corner radius R0.8 | x **−15.1** | x **−11.1** |
| Upper leg, at y 72.3 | x −15.1 to +14.9 | x −11.1 to +18.9 |
| **U-detent 62** (bottom at y 69.9, 3.0 wide) | x 3.7 to 6.7, just left of the head top | x **7.7 to 10.7**, directly over the head top (7.6 to 14.3), 0.6 mm above it |
| **Flange 64** (turned down, y 72.3 to 69.6) | x **14.9**, which is 1.6 left of the key post | x **18.9**, which is 2.4 right of the key post |
| Tab 65 at the end of the lower leg | x 2.7, in notch 59 | x 6.7, in notch 61 |

**Notes**
- The spring is 30 mm long from fold to flange. The legs are 4.4 apart at the fold.
- The DL "butts against" the top face of the pawl head through the U-detent.

### 1.7 Key post, keyhole, key-bit sweep

| Item | Value | Conf. |
|---|---|---|
| Key post 78 | **(16.5, 67.6)**, Ø 2.2 | M. Patent drawing Ø 2.2; hobbyist micrometer reading on an S&W post 0.088 in = 2.24 [S5]. |
| Post mounting | Fixed in the **rear** cheek; crosses the cavity; its end sits inside the front-cheek keyhole, about 0.5 below the front face | H [P1] Fig. 9 |
| Keyhole 80 | **Front cheek only**, centred on the post. Round bore Ø 4.0, against Ø 4.9 in the patent drawing. | M (ESTIMATE on bore) |
| Keyhole notch | 1.3 wide, pointing **−y (6 o'clock, toward the jaw)**, out to r 3.9 | H (direction, from Fig. 1 and the photo) |
| Flag (bit) sweep circle | **r 3.5** about the post (patent 3.8). Key barrel OD 3.53 and bore 2.54; flag 1.6–1.7 radial × 3.2 axial × 1.0 thick. | M [S2] |
| Frame pocket around the post | r 4.2 | M |
| Pawl relative to the post | The shoulder 56 is about 2.6–5.1 mm from the post, at 7–8 o'clock. The flag first touches it at about **(13.6, 65.7)**. | M |

**Which way the key turns (front / keyhole-face view)** [P1] col. 5–6; [P2]
- The key always goes in with the **flag at 6 o'clock** (H).
- **Lift the pawl (unlock): turn CLOCKWISE.**
  - The flag swings from 6 o'clock toward 9.
  - It meets shoulder 56 at about 7:50, which is about **57°** after insertion.
  - It levers the pawl head up. The teeth are clear by about 8:50 (**about 85°**).
  - Conf. H (direction); M (angles).
- **Release the double lock first: turn COUNTER-CLOCKWISE** (toward the swivel side).
  - The flag swings 6 → 3 → 12.
  - It meets the DL-ON flange at x_rel +2.4, about 1:30 (**about 137°**).
  - It sweeps the flange over the top of the post to x_rel −1.6, about 11 o'clock (**about 207°**). The spring is then back in DL-OFF.
  - Then turn back clockwise, past 6 o'clock to about 8:50, to lift the pawl.
  - Conf. H (direction); M (angles). The angles are implied by the geometry; S&W publishes none. Peerless says "about 90°" for its own layout, see §6.
- **While double-locked**, the clockwise turn stalls at the shoulder, because the U-detent blocks the lift.

### 1.8 Double-lock slot (S&W slot model)

**Front-cheek slot 82**
- Centre **(−13.7, 72.9)**, **7.5 × 2.6**, long axis along x (spans x −17.45 to −9.95).
- The patent slot maps to −13.1; the photo slot is at −14.3. M

**How it is used**
- The key's **pin (Ø 1.9)** goes in at the slot's left end, just left of the spring fold (fold at −15.1).
- The pin is then slid **+4.0 mm toward the keyhole (+x)**. Dealers describe this as "pull down towards the keyhole" [S1].
- The slot reaches only the outside of the fold, so the pin can push the spring ON but cannot pull it back OFF. H [P1] / M

**Rear face:** later production also shows a slot near the same place (product photo [S3]). L

**Push-pin variant (Model 100P):** instead of the slot, a small hole through the case's edge [P2]. Put it on the left (−x) end edge of the case at about (−26, 70). L

### 1.9 Rivets and pins visible on the outside (both faces unless stated)

| Item | Position | Size | Conf. |
|---|---|---|---|
| Pivot rivet / joint stud 20 | (0, 0) | Head Ø 5.0, on a lobe of r 7.0 | M (photo) |
| Upper case rivets (flank the swivel) | **(±9.7, 77.9)** on the current product; (±7.0, 78.2) in the patent | Head Ø 3.8, domed about 0.4 | M |
| Lower case rivets | **(±21.3, 63.8)**, at r 67.3, outside the sweep circle | Head Ø 3.8 | M (patent and photo agree within 0.3) |
| Pawl stud 52 ends | (−13.3, 64.4) | Flush dot Ø 2.4 | M (visible on the photo) |
| Key post end, rear face | (16.5, 67.6) | Flush dot Ø 2.2 | M (photo of the rear face) |

### 1.10 Swivel and chain (the "lug" is on the case top, centred, not on a case end)

**Swivel 26** (M from Fig. 5 scaled; eye OD cross-checked on the photo as 7.3–8.3)
- The swivel sits at the **middle of the case's outer long edge (y 81.6, x 0)**. The chain axis therefore runs pivot → loop centre → case → swivel.
- **Base 34:** 6.1 × 2.4 × about 3.6, captured in the T-slot at y 75.8–78.2.
- **Shank 32:** Ø 3.4, rising through the case top.
- **Eye:** centre **(0, 88.3)**, OD 8.0, hole Ø 4.6, about 3.4 thick.
- It rotates about the y-axis.

**Chain (S&W): 2 welded links** (M: photo, plus the 100L arithmetic in `research-mechanism.md` §8.4)
- About 21 × 9 mm outside, wire Ø 3.3. ESTIMATE / L
- Case top to case top is 50.8 mm (2.00 in). H [S1]

---

## 2. Layer stack across the thickness (z)

**Patent proportions** (all from [P1])
- Fig. 2, the edge view at the same scale as Fig. 1: front cheek 2.8 / middle 3.9 / rear cheek 3.1, **total 9.8**.
- Cross-sections Figs. 7–10, each scaled by its own height: **8.6–9.1**, in the ratio 1 : 1.25 : 1.
- **Weight check:** the published 10.0 oz pair implies about 137 g per cuff. The volume of this plan model gives 156 g at 8.5 mm total and 173 g at 9.4 mm total. **The real cuff is probably at the thin end of the range, or slightly narrower in band.**
- Recommendation: **2.7 / 3.8 / 2.7 = 9.2 mm total** (ESTIMATE within the measured 8.6–9.9 range).

| Layer / part | z range (mm) | Notes | Conf. |
|---|---|---|---|
| Front cheek 16 / 16a (keyhole face) | +1.9 … +4.6 (t 2.7) | Carries the keyhole and the DL slot | M / ESTIMATE |
| **Middle layer** (gap) | −1.9 … +1.9 (3.8) | In the case this is the frame plate 24, the cavity and the jaw channel. Along the double strand it is the open gap. | M |
| Jaw (single strand) | −1.8 … +1.8 (t **3.6**) | 0.1 clearance each side | M |
| Frame plate 24 | −1.9 … +1.9 | Same thickness as the gap; brazed in the patent, riveted per current listings | H / M |
| Pawl (bolt 40) | −1.5 … +1.5 (t 3.0) | | ESTIMATE |
| Spring 42 | Strip 3.0 wide in z (−1.5 … +1.5), 0.5 thick in-plane | | ESTIMATE |
| Pawl stud 52 | −4.6 … +4.6 | Through both cheeks; ends flush | H (Fig. 7) |
| Key post 78 | −4.6 … about +4.1 | Riveted in the rear cheek; tip about 0.5 below the front face | H (Fig. 9) |
| Key flag when inserted | about −1.3 … +1.9 | The flag (3.2 long axially) sits in the middle layer, level with the pawl and spring | M [S2] |
| Rear cheek 18 / 18a | −4.6 … −1.9 (t 2.7) | Serial number stamped on the case head | M |
| Rivet heads / pivot heads | Proud about 0.4–0.6 on both faces | | L |
| Swivel eye | About ±1.7 when turned flat | | ESTIMATE |

---

## 3. Sequence of positions

Jaw angle θ is counter-clockwise positive. θ = 0 is position 8. Where the text says "nose", it means the jaw tip's bearing, which is −13.8° − θ.

### 3.1 Key poses

| State | θ | What is happening | Conf. |
|---|---|---|---|
| **Open (display pose)** | **−90°** | Nose at β 76° (about (57.7, 14.2)). The gap from the nose to the mouth corner (25.4, 58.5) is **about 55 mm**, which meets NIJ's ≥ 50 mm and S&W's 51.8 mm opening. The jaw sticks out to the right. Any θ from about −80° to −150° reads as "open". | M |
| Nose enters the mouth | −37.3° | The nose reaches β 23.5°. | M |
| Lead-in meets the pawl | −25.0° | The nose ramp reaches the right end of the pawl teeth (β 11.2°) and starts to lift the pawl. | M |
| **First locking position (pos. 1)** | **−19.32°** | Jaw face 1 drops behind pawl tooth 3. | M |
| Each further click | **+2.76°** | Jaw advances 3.06 mm at the tips. Loop perimeter −3.06 mm. | M |
| Patent Fig. 1 / Fig. 5 pose (pos. 8) | 0° | Jaw teeth 6, 7, 8 are meshed with pawl teeth 1, 2, 3. | H |
| Teeth start poking past the double strand's outer edge | about +25.8° (pos. 17–18) | The DS outer edge is below r 63.5 beyond β −39.6°. | M |
| **Last locking position (pos. 23)** | **+41.40°** | Jaw face 21 is held by pawl tooth 1. Nose at β −55.2°. **The nose and the last teeth stick out about 3–9 mm beyond the double strand's outer edge** (the "stowed / loaded" look). | M |
| Free (swing-through) | ≥ about +44.2° | The last tooth clears the pawl. The jaw continues counter-clockwise **through the double-strand gap** for a full 360°. | H (principle) / M (angle) |

### 3.2 Locking positions

**Engagement rule:** jaw face k meets pawl tooth j when β_k − θ equals that tooth's face bearing (2.90°, 5.66° or 8.42°).
- Position 1 has 1 tooth meshed.
- Position 2 has 2.
- Positions 3–21 have 3.
- Position 22 has 2, and position 23 has 1.

Perimeters below are inside perimeters from the patent-shape model, with the line-centre correction applied. S&W's specification is 213 at the first notch and 147 at the last [S1].

| Pos. | θ (°) | Nose β (°) | Meshed (pawl tooth : jaw tooth) | Inside perimeter (mm) | Inside width across x (mm) |
|---|---|---|---|---|---|
| 1 | −19.32 | +5.5 | 3:1 | **212** | 76 |
| 3 | −13.80 | 0.0 | 1:1, 2:2, 3:3 | 205 | 74 |
| 5 | −8.28 | −5.5 | 1:3, 2:4, 3:5 | 199 | 71 |
| 7 | −2.76 | −11.0 | 1:5, 2:6, 3:7 | 193 | 68 |
| 8 | 0.00 | −13.8 | 1:6, 2:7, 3:8 | 190 | 66 |
| 9 | +2.76 | −16.6 | 1:7, 2:8, 3:9 | 187 | 65 |
| 11 | +8.28 | −22.1 | 1:9, 2:10, 3:11 | 181 | 61 |
| 13 | +13.80 | −27.6 | 1:11, 2:12, 3:13 | 175 | 58 |
| 15 | +19.32 | −33.1 | 1:13, 2:14, 3:15 | 169 | 55 |
| 17 | +24.84 | −38.6 | 1:15, 2:16, 3:17 | 163 | 52 |
| 19 | +30.36 | −44.2 | 1:17, 2:18, 3:19 | 157 | 49 |
| 21 | +35.88 | −49.7 | 1:19, 2:20, 3:21 | 151 | **46** |
| 23 | +41.40 | −55.2 | 1:21 | **144** | 43 |

**How the specification compares**
- Positions 1–21 track S&W's first-notch figure and its 3.0 mm-per-click rate.
- S&W's "tightest inside width 1.80 in (45.7 mm)" and "5.80 in last-notch perimeter" both fall at about position 21–22 here.
- Two explanations are possible:
  - **S&W measures differently**, or
  - **the real jaw has 20 teeth**, as drawn in the patent. That would give 22 positions, with the last at θ +38.64° and a perimeter of about 148.
- Either choice is defensible. Keep 21 teeth if the label "23 locking positions" is shown.

**Loop shape**
- At θ = 0 the loop is the outline of the two mirrored r 24.8 arcs, capped by the r 57.5 arc.
- Toward position 23 it becomes a lens of about 43 × 47.5. Toward position 1 it becomes a D of about 76 × 55.

### 3.3 What the pawl and spring do on each click

| Stage of a click | Pawl rotation | Teeth lift | Head top rise | Spring lower leg at tab | Notes |
|---|---|---|---|---|---|
| Rest (engaged) | 0° | 0 | 0 | Preloaded | Pawl teeth bottomed in the jaw gaps |
| Jaw advances 2.76° | Ramps cam the pawl up to +3.1° | 1.2 mm | 1.45 mm | Lifted about 1.0 mm (extra compression) | The DL-OFF U-detent is left of the head, so there is about 2.7 mm of headroom under the upper leg |
| Tooth tip passes | Snaps back to 0° | — | — | Back to preload | The audible click |
| Key lift | Up to +3.8° | 1.45 mm | 1.8 mm | About 1.2 mm | Patent Fig. 5 |
| DL ON | Blocked at about +1.4° | About 0.5 mm (< 1.2 needed) | 0.6 mm | — | Cannot click in, cannot pull out |

**Spring numbers.** The rate and force are unpublished. A plausible design is about 3–6 N at the teeth (ESTIMATE). It only matters for animation timing.

---

## 4. Exterior: what is visible from outside

**Front (keyhole) face (cheek 16), S&W.** M (patent Fig. 1 plus the product photo)
- Keyhole at (16.5, 67.6), notch toward the loop, with the post visible inside.
- Double-lock slot at (−13.7, 72.9), horizontal.
- 4 domed rivet heads.
- Small flush pawl-stud dot at (−13.3, 64.4).
- S&W logo stamped on the case head, about centre (0, 71) (L).
- Pivot rivet head Ø 5 at (0, 0).
- The jaw (middle layer) is visible only outside the case: the toothed band emerging at the mouth (right end, lower corner) and running round the right side to the pivot.
- With the jaw at positions 17 and above, its nose also shows beyond the double strand's upper-left outer edge.

**Rear face (cheek 18).**
- Same outline and 4 rivets.
- Flush post-end dot at (16.5, 67.6) and stud dot at (−13.3, 64.4).
- **Serial number** stamped on the case head (H for S&W pairs; the photo shows "U…").
- **No keyhole.** H (patent Fig. 9: the rear cheek is solid at the post).
- A second DL slot in later production. L

**Edges**
- Along the whole double strand, two plate edges with **a 3.8 mm open gap** between them, through which the jaw passes. H
- At the case's right lower corner, the **mouth slot**: 6.3 radial × 3.8 z. H/M
- The case's top edge with the swivel shank, centred.
- The case's left end edge is plain on the slot model. On the 100P and on Peerless it carries the DL push-hole (§6).

**Pair arrangement**
- The two cuffs face each other across the chain, with the swivel ends together.
- On the S&W photo, one cuff lies keyhole-up and the other serial-up. The two cuffs are identical parts.

---

## 5. ASCII plan sketch (θ = 0, front face, 1 char = 2 mm in x, 1 row = 4 mm in y)

```
   y                                              legend:  # cheek-plate outline (double strand + case)
  92                                                       j jaw (single strand), teeth on its outer edge
  88                         @  swivel eye (0,88.3)        @ swivel eye   R case rivet   = DL slot
  84                                                       H pawl hub/pivot (-15.7,66.2)  S pawl stud (-13.3,64.4)
  80              #######################   case top y 81.6, plateau x +-7.5
  76             #      R         R      #   upper rivets (+-9.7,77.9)
  72            ##   ===sssssssssssss    #   DL slot (-13.7,72.9) | spring upper leg y 72.3
  68            #    Hbbbbbbbbbbb bb K    #  pawl b ; key post K (16.5,67.6), flag sweep r 3.5
  64           ## R   Sjjjjjjjjvjvjj    R #  lower rivets (+-21.3,63.8); pawl teeth v at beta 2.9..11.2
  60        ####      jjjj      j vjjjjjjj#  jaw teeth on r 63.5 (21 teeth, 2.76 deg)
  56       ##       #################### #jjjj   case lower edge = arc r 57.5 ; MOUTH at beta +23.5 (x~24, y~55)
  52     ##      ###                   ###   jjjj
  48    ##     ##                         jj    jjj
  44   ##     ##                           jj     jj
  40   #     ##       LOOP 66 x 50.5         j     j
  36   #     #        (pos. 8)               j     j   jaw band 11.8 wide
  32   #     #                               j     j   (inner arc r 24.8 about (8.19,31.66))
  28   #     #   double strand: two plates   j     j
  24   #     #   with a 3.8 mm open gap      j     j
  20   ##     #  (inner arc r 24.8 about    jj     jj
  16    ##     ##  (-8.19,31.66), outer    jj     jj
  12     ##     ####  r 36.6)          jjjj     jj
   8      ###      ############jjjjjjjjj      jjj
   4        ###           ##                jjj
   0          #####       #  O  pivot (0,0)    jjjjj        O = joint stud, lobe r 7.0
  -4              #########j   jjjjjjjjjj
  -8                       jjjjj
     ----+----+----+----+----+----+----+----+----+----+
         -40       -20       0         20        40      x (mm)
```

**Key coordinates at a glance** (mm, θ = 0)

| Group | Points |
|---|---|
| Pivot and loop | Pivot (0, 0). Loop inside x ±33.0, y about 7.3 to 57.5. Outside x ±44.8, y −7.0 to 81.6. |
| Case | Case top 81.6; case sides x about ±25.8. Mouth (22.9, 52.7) to (25.4, 58.5). |
| Lock internals | Cavity x −19.6 … +21.6, y about 63.5 … 73.8. Pawl hub (−15.7, 66.2). Pawl teeth x 3.2 … 12.3, y about 62.3–63.5. Key post (16.5, 67.6). |
| Spring | Fold x −15.1 (off) / −11.1 (on). U-detent x 3.7–6.7 (off) / 7.7–10.7 (on). |
| Front-face features | DL slot centre (−13.7, 72.9). Rivets (±9.7, 77.9) and (±21.3, 63.8). |
| Swivel | Eye (0, 88.3). |

---

## 6. Peerless 700 deltas (if the builder prefers the "textbook" lock)

**Scale.** Measured on Peerless's own nomenclature photo [S4], at 6.47 px/mm. The scale was set from 8.9 in overall and 2.0 in between cuffs. The frame and handedness are the same as above: keyhole face, case up, jaw on the right. Conf. L–M (photo, 1 px = 0.15 mm, mild perspective).

**Geometry, same frame as S&W**

| Item | Peerless (photo) | Compared with S&W |
|---|---|---|
| Toothed edge of the single strand | Arc r about **60** about the rivet, about **21 teeth over about 58°** (pitch about 2.9 mm, 2.75°) | S&W 63.5 / 21 / 58° |
| Strand width | About 6 mm at the toothed part, tapering to the nose; 9–10 mm near the rivet | S&W 6 / 11.8 |
| Band width | About 10 | S&W 11.8 |
| Cheek rivets (4, domed, Ø about 5.5) | (−21.6, 63.0), (−11.2, 76.6), (4.4, 77.2), (17.4, 64.4). The case is centred at x about −3. | — |
| **Pawl pin** (flush, visible on the face) | **(−15.1, 63.8)**, at the double-strand end | The same place as S&W's pawl hub |
| **Keyhole / key post** | **(−2.7, 69.9)**, the centre of the case | S&W keyhole is at the entry end |
| Small unexplained hole on the face | (13.9, 58.0), at the entry end | — |
| Swivel | **Flat paddle** with a hole, at about y 84, centred | S&W uses a round-eye swivel |
| Case extent | About x −27 … +23, y about 56 … 81.5 | — |

**Internals.** These come from the 1932 and 1945 Peerless patents [P3, P4] and NBS [P5]. Positions are an ESTIMATE fitted to the photo.

**Pawl ("latch 8")**
- A straight bar about 28 long, pivoted on the pawl pin (−15.1, 63.8).
- It lies along the jaw channel just outside r 60. **Teeth (2–3) are on its loop-facing edge at the entry end**, x about +5 … +12.
- A **semicircular cut-out** in its outer edge, round the key post, ends in a **ledge 19** that the flag lifts.

**Pawl spring**
- A **coil spring and plunger 17** in a bore in the pawl near its teeth, at about x +8.
- The plunger presses outward (+y) against the DL bolt. This forces the pawl down onto the teeth.
- The plunger tip is also **the DL detent**: it clicks into one of two notches 16 on the bolt.

**Double-lock bolt 13**
- A flat bar lying **between the pawl and the case's outer wall**, at y about 70–73, running x about −20 … +12. It slides about 3 mm along x (ESTIMATE).
- **When ON, its shoulder 22 sits directly outboard of the pawl's toothed end**, so the pawl cannot rise.
- It is pushed ON by **pusher pin 15** through a **small hole in the case's left (−x, double-strand) end edge**, at about (−27, 71). The manual calls this "the small hole on the side of the body".
- Conf. M (side) / L (position).

**Key**
- The manual says: "turn the flag approximately 90° toward the swivel" to release the DL, then about 180° the other way to lift the pawl [S4].
- In this frame, toward the swivel means the flag swings up, +y.
- Because the keyhole is at the centre of the case, both the bolt shoulder and the pawl ledge sit within the r 3.5 sweep circle.

---

## 7. Cut-away / training cuffs (what exists, where the window is)

No milled-window product was found whose window location is documented. What was found:

1. **American Handcuff Co. (Rockford, IL) factory demonstration cut-away**, 1960s–70s (seller's dating).
   - Half a cuff on an aluminium panel (4 × 1 × 4.25 in), "**outer side removed** to expose the pawl, ratchet, and lock assembly".
   - That is a whole cheek plate taken off over the lock case, the same view as patent Figs. 3/5/6.
   - Source: Chairish listing [S6]. L
2. **SouthOrd Clear Practice Handcuff:** a transparent polycarbonate body with metal locking parts. The whole mechanism is visible; there is no window [S6]. L
3. An Art of Manliness picking guide uses a cut-away handcuff photo to show where a pick acts on the single lock and the double lock [S6]. The text only is available. L
4. **The patent's own Figs. 3, 5 and 6 are "front cheek removed" views** [P1]. They are the authoritative cut-away. H

**Recommendation (ESTIMATE)**
- Cut the window in the **front (keyhole) cheek head**.
- Bound it by the cavity outline (x −19.6 … +21.6, y 63.5 … 73.8).
- Extend it down through the jaw channel to the C0 arc between β −15° and +23°.
- That one window shows all of these:
  - the pawl hub and stud
  - the folded spring with its U-detent and flange
  - the pawl head and its 3 teeth meshing with the jaw teeth
  - the key post with its flag sweep
  - the mouth
- Leave the keyhole rim as a ring round the post so the key still reads.

---

## 8. Sources

| ID | Source | Used for |
|---|---|---|
| P1 | US 4,287,731 *Handcuffs* (Kruger; Bangor Punta, later Smith & Wesson), 1981. https://patents.google.com/patent/US4287731. PDF: https://patentimages.storage.googleapis.com/e1/44/a8/f3a33fee4da1f2/US4287731.pdf | All S&W shapes, Figs. 1–12 measured (local copy `scratch/dl/US4287731.pdf`, rendered 300 dpi in `scratch/geo/`) |
| P2 | US 7,251,964 *Double locking handcuffs* (Smith & Wesson), 2007. https://patents.google.com/patent/US7251964 | Key directions, the "conventional S&W" lock, the 100P edge hole |
| P3 | US 1,872,857 (Peerless), 1932. https://patents.google.com/patent/US1872857A | Peerless pawl / plunger / bolt / pusher layout |
| P4 | US 2,390,885 (Peerless), 1945. https://patents.google.com/patent/US2390885A | Peerless anti-shim fin, pawl teeth |
| P5 | NBSIR 80-1989, Harris, *A Study of Handcuff Improvements*, NBS 1980. https://www.ojp.gov/pdffiles1/Digitization/84814NCJRS.pdf | "Typical handcuff" Figs. 1/2, the gap between the cheek plates, pusher hole |
| S1 | S&W Model 100 dealer specification block: 8.98 in, 2.00 in between cuffs, opening 2.04 in, perimeter 8.40 / 5.80 in, tightest 1.80 in, 23 positions, 10.0 oz. https://www.columbussupply.com/?p=53178 ; https://copsplus.com/smith-and-wesson-handcuffs-model-100-nickel | Absolute scale, kinematic check |
| S2 | NIJ Std 0307.01 (1982) and NIJ 1001.00 / Rev A, standard key Fig. 4. https://www.ojp.gov/pdffiles1/nij/082981.pdf ; https://www.ojp.gov/pdffiles1/nij/247988.pdf | Barrel 3.53 / 2.54, flag, pin, ≥ 50 mm opening |
| S3 | S&W M100 retail photos (Pelican Sales Supply CDN), `refs/sw-m100-melonite-photo.png`, `refs/sw-m100-case-chain-zoom.png` | Photo scale check, rivet / keyhole / slot / stud positions, both faces, key length 46 mm |
| S4 | Peerless *Chain Link Handcuff Instruction Manual* (nomenclature photo) and specification sheet. https://www.peerless.net/files/content/Manuals/Chain-Link-Manual-Web-0315.pdf ; https://www.peerless.net/files/content/Manuals/peerless-specifications.pdf | Peerless geometry (§6), "90° toward the swivel" |
| S5 | Lock Picking 101 forum, micrometer reading on an S&W key post (0.088 in). https://www.lockpicking101.com/viewtopic.php?p=439228 (via `research-mechanism.md`) | Post Ø |
| S6 | Chairish, American Handcuff Co. cut-away. https://www.chairish.com/product/36699465/vintage-handcuff-cutaway-demonstration-model-by-american-handcuff-co ; SouthOrd clear cuff: https://clksupplies.com/products/cutaway-practice-cuff-by-southord ; Art of Manliness: https://www.artofmanliness.com/skills/tactical/how-to-pick-your-way-out-of-handcuffs/ | §7 |

**Searched without useful result:**
- Thickness or plate gauge for any S&W or Peerless cuff.
- Tooth count or pitch stated in any patent (US 5,660,064 and others give no dimensions).
- A milled-window cut-away product with a documented window.
- Spring rates.

These remain ESTIMATES above.
