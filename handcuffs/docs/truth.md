# Handcuffs: truth model (EPIC tier, with unlocking and opening)

This document reconciles `research-mechanism.md` (MECH) and `research-geometry.md` (GEO) into one model that the builder can trust. Every contact angle below was computed, not estimated. A reference solver tests polygon contact between the real outlines (flag, flange, pawl, jaw teeth, U-detent) and finds each angle by bisection.

**Helper files** (all under `scratch/truth/` next to this file):

| File | What it is |
|---|---|
| `ref-model.mjs` | Exact geometry and contact solver; it is the source of every number here. Run with `node ref-model.mjs`. |
| `model-draft.mjs` | A working draft of the figure's `model.mjs`, built from tables. |
| `test-model.mjs` | Checks the draft against the solver and replays the full cycle, including the shim attack. |
| `truth-geometry.json` | Every outline in frame F (written by `export.mjs`). |
| `lock_states.png` | 12 lock states, rendered from the solver. Look at it first. |
| `pair_check.png` | The whole pair with the chain. |

**Value tags**

| Tag | Meaning |
|---|---|
| **SOURCED** | Read from a maker, NIJ/NBS or patent document (URL given). |
| **DERIVED** | Computed from SOURCED values by the stated method. |
| **ESTIMATE** | Engineering choice consistent with everything else; not a fact. Do not caption it as one. |

---

## 0. Frame and conventions (used everywhere below)

**Figure frame F**

| Axis or point | Definition |
|---|---|
| Origin | Centre of the hinge rivet (jaw pivot, S&W "joint stud 20") of cuff A |
| +x | Along the cuff's long axis, toward the lock case and swivel |
| +y | In the plane. The jaw (single strand), keyhole and case mouth are on −y. The pawl hub and the double-lock slot are on +y. |
| +z | Out of the keyhole (front) face, so up when the pair lies keyhole-up. z = 0 is the mid-plane. |
| Units | mm and degrees. Every angle is CCW-positive as seen from +z, looking down at the keyhole face. |
| Polar angle φ | CCW from +x about the hinge. A point at (r, φ) is (r·cosφ, r·sinφ). |

**Converting from GEO.** F = GEO rotated −90° about z: x_F = y_GEO, y_F = −x_GEO, φ_F = −(GEO bearing). Rotation senses (CW/CCW) are identical in both frames.

**State variables**

| Symbol | Meaning |
|---|---|
| θ | Jaw (single strand) angle about the hinge. + closes (CCW). θ = 0 is the pose of patent Fig. 1, which is locking position 9 (θ₉ = +0.058°). |
| α | Pawl lift: CCW rotation about its hub. + lifts the teeth off the ratchet. |
| u | Double-lock spring slide in mm. 0 = OFF, 4.0 = ON. The spring moves along −y (toward the keyhole) as u grows. |
| κ | Key turn from insertion, + CCW. At κ = 0 the flag points −x, toward the hinge (patent Fig. 1: keyhole notch toward the loop). Flag direction ψ_F = 180° + κ. |

---

## 1. The model depicted, and how the two research files were reconciled

**Depict the Smith & Wesson Model 100 (nickel, slot double lock).** Both research files recommend it.

**Why this model**
- It is the only current cuff whose internals are documented by its maker: US 4,287,731 (https://patents.google.com/patent/US4287731), restated as "conventional S&W" in S&W's US 7,251,964 (https://patents.google.com/patent/US7251964).
- It has a complete published spec block: https://www.columbussupply.com/?p=53178 and https://copsplus.com/smith-and-wesson-handcuffs-model-100-nickel.
- Its lock gives one strong "aha": a single folded leaf spring is both the pawl spring and the double lock.

**Peerless 700** is the documented alternative; its deltas are in §4.1.

**Conflicts and how they were resolved** (rows 8–10 fix internal contradictions in the measured geometry; row 11 recomputes the key angles; every later number uses these resolutions)

| # | Item | MECH | GEO | **Truth** | Why |
|---|---|---|---|---|---|
| 1 | Angle per click | ≈2.5° (est.) | 2.76° (measured on the patent drawing) | **2.599°** | Fitted so that 23 positions span S&W's published 8.40 → 5.80 in inside perimeter exactly, using the closed-form loop of the patent shape (§2.2). GEO's 2.76° gives 211.7 → 141.6 mm, missing the last-notch spec by 5.7 mm. The fit also reproduces S&W's third number, "tightest inside width 1.80 in" (45.7): the model gives 45.4. Tooth pitch is 2.88 mm at the tips. |
| 2 | Positions / teeth | 23 (one dealer: 22) | 23 with 21 teeth (patent drawing shows 20) | **23 positions, 21 jaw teeth, 3 pawl teeth** | Most S&W listings say 23. One Offbase 100-1 listing says 22. |
| 3 | Swing from first to last notch | ≈55° (est.) | 60.7° | **57.18°** (θ −20.735 → +36.445) | Follows from #1. |
| 4 | Thickness | ≈10 mm | 9.2 (est.) | **8.6 mm** (2.4 / 3.8 / 2.4) | Mass check: steel 7.85 g/cm³ on the plan areas gives 135 g per cuff body. The 10.0 oz pair (283 g) minus chain and swivels (≈ 7 g) leaves ≈ 138 g per cuff. It also matches the patent cross-sections (8.6–9.1). Rivet heads add 0.5 each side, giving 9.6, which matches the 9.8 of patent Fig. 2. |
| 5 | Band width | ≈10 (photo) | 11.8 (patent) | **11.8** | Keeps the patent arcs. The outer edge does not affect the loop. The product photo shows 10.4–11.5. |
| 6 | Key length | 53–56 (photo est.) | 46 (S&W photo at cuff scale) | **45.7** | Dealer key listings give 1.8 in / 46 mm and 1.70 in (https://varusteleka.com/en/products/smith-wesson-replacement-handcuff-key). |
| 7 | Upper case rivets | — | ±7.0 (patent) / ±9.7 (product) | **±9.7** | Current product. |
| 8 | Pawl hub | — | r 1.3, not touching stud 52 (0.5 gap) | **r 1.8**, bearing on the stud | Patent text: "stud 52 and wall 54 define a bearing for hub 50". Both measured centres are kept. The stud is now also the pawl's clockwise stop (§2.3). |
| 9 | Spring upper leg | — | at y_GEO 72.3, 1.5 below the cavity roof | **bears on the roof** (x_F 73.55 centreline) | Patent: "second spring leg … bears against … the underside of frame 24". The U-detent and flange keep their measured lower ends. |
| 10 | Spring end stops | — | cavity wall at 21.6 (no stop) | **OFF stop:** fold against a frame tongue (y_F +15.35). **ON stop:** flange against a frame step (y_F −19.15). | Patent: "opposite ends of spring 42 butting the ends of frame 24 … end limits of its linear displacement". Travel is exactly 4.0. |
| 11 | Key-turn angles | — | 57 / 85 / 137 / 207° (thin flag) | **46.3 / 75.7 / 86.1 / 118.3 / 183.4 / 194.4°** | Recomputed with the real NIJ flag (1.02 thick, tip r 3.445) against the real outlines (§2.5). |
| 12 | Small fits | — | flag tip r 3.5; post Ø 2.2; keyhole notch 1.3 | **3.445 / 2.24 / 1.5** | NIJ Rev A: flag projects 0.066 in beyond the barrel. Post micrometer reading 0.088 in. The notch must pass a flag of up to 0.050 in. |
| 13 | Chain links | 19 × 10 (Peerless photo) | 21 × 9, wire 3.3 | **21.6 × 10.6, wire Ø 2.6, inner 16.4 × 5.4** | Inner 16.4 makes the taut pair span exactly 2.00 in between cases with Ø 4.6 swivel holes. Proportions from the S&W photo. |

---

## 2. Numeric specification

### 2.1 Product level

| Item | Value | Tag |
|---|---|---|
| Model | S&W Model 100, nickel, slot double lock, carbon steel | SOURCED https://www.columbussupply.com/?p=53178 |
| Pair weight | 10.0 oz (283 g) | SOURCED (same) |
| Max overall length | 8.98 in = 228.1 mm. The model gives 228.0 (lobe to lobe). | SOURCED / DERIVED |
| Between cuffs (case top to case top) | 2.00 in = 50.8 | SOURCED |
| Wrist opening | 2.04 in = 51.8. Model: mouth inner corner to hinge lobe = 50.5. With the jaw swung to θ ≤ −95° the clear gap is ≥ 56.8. | SOURCED / DERIVED |
| NIJ limits (0307.01) | ≥ 50 mm opening; inside perimeter ≥ 200 at the first notch and ≤ 165 at the last; ≤ 240 long; ≤ 425 g; 2200 N tensile, double-locked | SOURCED https://www.ojp.gov/pdffiles1/nij/082981.pdf |
| One cuff body | 88.6 (x −7.0 … 81.6) × 89.6 (y −44.79 … +44.79) | DERIVED (GEO §0) |
| Thickness | 8.6 plates (rear 2.4 / middle 3.8 / front 2.4); 9.6 over rivet heads | DERIVED (mass + patent sections) |

### 2.2 Ratchet and loop

| Item | Value | Tag |
|---|---|---|
| Locking positions N | 23 | SOURCED (S&W spec) |
| Jaw teeth / pawl teeth | 21 / 3 | ESTIMATE (21) / SOURCED patent drawing (3) |
| Pitch | **2.5991° per click** = 2.881 mm at the tips (r 63.5), 2.826 at the roots (r 62.3) | DERIVED (fit to the perimeter spec) |
| Tooth depth | 1.2 (tips r 63.5, roots r 62.3), sawtooth with a radial locking face | DERIVED (GEO, patent) |
| Position n angle | **θₙ = −20.735 + 2.5991·(n − 1)**. θ₁ = −20.735, θ₉ = +0.058, θ₂₃ = +36.445. | DERIVED |
| Jaw locking faces at θ = 0 | **φₖ = 12.636 − 2.5991·(k − 1)**, k = 1…21 (12.636 … −39.346). The steep face is radial from r 62.3 to 63.5 and faces −φ. Tooth k's ramp rises from the root at φₖ₋₁ (nose side) to the tip at φₖ. At jaw angle θ, add θ. | DERIVED |
| Pawl locking faces (fixed at α = 0) | **φⱼ = −2.900, −5.499, −8.098** (j = 1, 2, 3). Each face is radial from r 63.5 down to the tip at r 62.3 and faces +φ. Each ramp climbs back to r 63.5 at φⱼ − 2.599. The pawl ramp ends at φ −10.697. | SOURCED (patent, via GEO) / DERIVED |
| Engagement rule | At position n, pawl tooth j meshes jaw tooth k = j + n − 3 (1 ≤ k ≤ 21). Pos 1: 3:1. Pos 2: 2:1, 3:2. Pos 3–21: all three. Pos 22: 1:20, 2:21. Pos 23: 1:21. | DERIVED |
| Nose | Semicircle r 1.9 centred at (r 59.4, φ 13.74 + θ); extreme at φ 15.57 + θ. Lead-in ramp from the nose top (r 61.3) to tooth 1's tip (r 63.5 at φ₁). | DERIVED (GEO shape, shifted with #1) |
| Tail | After face 21 (φ −39.35) the outline runs along r 62.3 to φ −42.10, then follows the outer arc down (r < 62.3). Angles at θ = 0; add θ. The pawl rides it at zero lift, so the strand is free past position 23. | DERIVED |

**Loop formula (exact for the patent shape)**

The double strand's inner edge is a circle of r = 24.8 centred at (31.66, +8.19), tangent to the case edge C0 (r R₀ = 57.5) at φ +14.5. The jaw's inner edge is its mirror, centred at (31.66, −8.19) rotated by θ, tangent to C0 at φ −14.5 + θ. Both centres are R_c = 32.7 from the hinge.

Let δ = 29° − θ (the angle between the two centres), s = sin(|δ|/2), and d = 2·R_c·s.

| Regime | Inside perimeter P | Inside width W (along the line of centres) |
|---|---|---|
| θ ≤ 29° (D-shaped: two arcs plus the C0 cap) | P = 2r·(π + asin(R_c·s / r) − δ/2) + R₀·δ   (δ in radians) | W = 2r + d |
| θ > 29° (lens: intersection of the two discs) | P = 4r·acos(R_c·s / r) | W = 2r − d |

- At θ = 29.0° the two arcs coincide and the loop is a perfect Ø 49.6 circle (P 155.8).
- Equivalent diameter: ID_eq = P / π.
- Check against the spec: P(θ₁) = 213.4 (spec 8.40 in = 213.4). P(θ₂₃) = 147.3 (spec 5.80 in = 147.3). W(θ₂₃) = 45.4 (spec "tightest inside width" 45.7). DERIVED

**Every position** (θ in °; P, ID_eq, W in mm; nose φ_F = polar angle of the jaw tip)

| n | θₙ | P | ID_eq | W | meshed (pawl:jaw) | nose φ | n | θₙ | P | ID_eq | W | meshed | nose φ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | −20.735 | 213.4 | 67.9 | 77.1 | 3:1 | −5.2 | 13 | 10.454 | 177.0 | 56.3 | 60.1 | 1:11 2:12 3:13 | 26.0 |
| 2 | −18.136 | 210.3 | 66.9 | 75.7 | 2:1 3:2 | −2.6 | 14 | 13.053 | 174.0 | 55.4 | 58.7 | 1:12 2:13 3:14 | 28.6 |
| 3 | −15.537 | 207.2 | 66.0 | 74.4 | 1:1 2:2 3:3 | 0.0 | 15 | 15.652 | 171.1 | 54.5 | 57.2 | 1:13 2:14 3:15 | 31.2 |
| 4 | −12.938 | 204.1 | 65.0 | 73.0 | 1:2 2:3 3:4 | 2.6 | 16 | 18.252 | 168.1 | 53.5 | 55.7 | 1:14 2:15 3:16 | 33.8 |
| 5 | −10.339 | 201.1 | 64.0 | 71.6 | 1:3 2:4 3:5 | 5.2 | 17 | 20.851 | 165.1 | 52.6 | 54.2 | 1:15 2:16 3:17 | 36.4 |
| 6 | −7.740 | 198.0 | 63.0 | 70.2 | 1:4 2:5 3:6 | 7.8 | 18 | 23.450 | 162.2 | 51.6 | 52.8 | 1:16 2:17 3:18 | 39.0 |
| 7 | −5.141 | 195.0 | 62.1 | 68.8 | 1:5 2:6 3:7 | 10.4 | 19 | 26.049 | 159.2 | 50.7 | 51.3 | 1:17 2:18 3:19 | 41.6 |
| 8 | −2.541 | 192.0 | 61.1 | 67.4 | 1:6 2:7 3:8 | 13.0 | 20 | 28.648 | 156.2 | 49.7 | 49.8 | 1:18 2:19 3:20 | 44.2 |
| 9 | 0.058 | 189.0 | 60.2 | 65.9 | 1:7 2:8 3:9 | 15.6 | 21 | 31.247 | 153.3 | 48.8 | 48.3 | 1:19 2:20 3:21 | 46.8 |
| 10 | 2.657 | 186.0 | 59.2 | 64.5 | 1:8 2:9 3:10 | 18.2 | 22 | 33.846 | 150.3 | 47.8 | 46.8 | 1:20 2:21 | 49.4 |
| 11 | 5.256 | 183.0 | 58.3 | 63.1 | 1:9 2:10 3:11 | 20.8 | 23 | 36.445 | 147.3 | 46.9 | 45.4 | 1:21 | 52.0 |
| 12 | 7.855 | 180.0 | 57.3 | 61.6 | 1:10 2:11 3:12 | 23.4 | | | | | | | |

- Each click takes 3.0–3.1 mm off the inside perimeter (3.00 on average, matching the spec).
- From position 20 the nose pokes past the double strand's outer edge, by 4.6 mm at position 23. Carrying cuffs "loaded" at the last click shows exactly this.

**Closing poses (θ)**

| θ | Event |
|---|---|
| −100 | Open display pose |
| −39.07 | Nose passes the case mouth (φ −23.5) |
| −23.30 | Lead-in ramp first lifts the pawl |
| −20.735 | Position 1 (jaw face 1 drops behind pawl tooth 3) |
| +36.445 | Position 23 |
| > +36.445 | Free swing-through: the tail runs at the root radius. The strand can go 360° round, through the 3.8 mm gap between the cheek plates (no spacer). |

### 2.3 Pawl, spring, double lock

| Item | Value | Tag |
|---|---|---|
| Pawl (S&W "bolt 40") | Rocking lever, 31.3 long, 3.0 thick (z ±1.5). It never slides. | SOURCED patent / ESTIMATE (t) |
| Hub | Centre **(66.20, 15.70)**, r **1.8**, cradled by wall 54 (concave arc r 1.85 about the hub, frame) and by stud 52 | DERIVED (#8) |
| Stud 52 | **(64.40, 13.30)**, Ø 2.4. It spans both cheeks and shows as flush dots on both faces. Contacts at α = 0: hub at C1 (65.12, 14.26) and the heel of the pawl's underside saddle at C2 (65.25, 12.45). | SOURCED (photo/patent) / DERIVED |
| Pivot and stops | Rotation about the hub centre. **The CW stop is α = 0** (heel on the stud). This is also exactly the fully meshed pose, so with no strand present the pawl rests at α = 0. | DERIVED |
| Pawl outline (α = 0) | Hub arc; saddle over the stud; underside to (64.60, −3.20); teeth (tips at (62.22, −3.15), (62.01, −5.97), (61.68, −8.78)); ramp end (62.40, −11.79); head lower corner (64.80, −12.20); **shoulder 56** from (64.80, −12.20) to **(66.20, −14.30)**; head side y −14.30 up to x 68.90; head top (69.30, −12.40) → (69.30, −7.60); step to x 68.0; notch 61 at (67.60, −6.70); notch 59 at (67.55, −2.70); shank top back to the hub. Full polygon in `truth-geometry.json` → `pawl_alpha0`. | DERIVED (GEO, adjusted) |
| Lever arms from hub | Tooth 1 tip 19.27; tooth 3 tip 24.89; head top ≈ 28; tab 18.4 | DERIVED |
| Lift per click (closing) | Rises nearly linearly over the click to **3.57°** peak, then drops to 0 in three quick stages in the last 5.5 % of the pitch (≈ 0.14° of strand). Tooth 1 governs. Click 1→2 peaks at 3.10° (tooth 2 governs); the lead-in peaks at 2.73°. At 3.57° the tooth tips rise 1.20, the head top 1.74, the tab 1.14. | DERIVED (solver) |
| Lift to clear the ratchet | **α_clear = 3.75°**: every pawl tip ≥ r 63.55, i.e. 0.05 above the tooth-tip circle. Tips exactly on the tip circle at 3.60°. | DERIVED |
| Max lift, DL OFF | **4.97°**: the shank top near notch 61 meets the U-detent's underside. Tips then reach r 63.96 / 64.21 / 64.46. | DERIVED |
| Max lift, DL ON | **1.30°**: the head top meets the U-detent, 0.6 above it. Tooth 1 rises only **0.43 mm** of the 1.2 needed. Head top rises 0.64. | DERIVED (0.6 gap SOURCED from patent figs via GEO) |
| Lift limit vs spring slide u (mm: °) | 4.0: 1.30 · 3.0: 1.35 · 2.0: 1.41 · 1.0: 1.47 · 0.75: 2.40 · **0.64: 3.75 (functional release)** · 0.5: 4.73 · 0: 4.97 | DERIVED |
| Spring 42 (= pawl spring = double lock) | One folded flat leaf, 0.5 thick in plane, 3.0 wide in z (±1.5). Free-sliding, 4.0 travel. | SOURCED type / ESTIMATE section |
| Spring centreline, u = 0 (F) | **Tab** (67.80, −2.70) in notch 59 → (68.20, −2.30) → **lower leg** x 68.20 to y +14.30 → R0.8 bend → **fold** at y +15.10, x 69.00 … 72.75 → R0.8 bend → **upper leg** x 73.55 (top face 73.80 bears on the cavity roof) running to −y → **U-detent**: arms at y −3.95 and −6.45 (outer faces −3.70 / −6.70), bottom centreline x 70.15 (bottom face **69.90**) → upper leg continues → **flange 64** at y −14.90 (faces −14.65 / −15.15), from x 73.55 down to its free end at **x 69.60** | DERIVED (GEO + #9) |
| Spring at u | Every y above minus u. ON (u = 4.0): fold y 11.10, U-detent y −7.70 … −10.70 directly over the head top (−7.60 … −12.40), flange y −18.90, tab in notch 61. | DERIVED |
| Detent | Tab 65 seats in notch 59 (OFF) or notch 61 (ON), 4.0 apart, so impacts cannot shift the spring. The click is felt in the last ≈ 0.4 mm of travel. | SOURCED patent |
| Spring force | Unpublished; ≈ 3–6 N at the teeth | ESTIMATE (timing only) |
| Play when double-locked | Squeezing still advances the strand ≈ 0.92° (≈ 1.0 mm at the teeth) until the pawl hits its 1.30° limit. Pulling returns it to the notch. | DERIVED |

### 2.4 Key, keyhole, post (NIJ standard key, S&W pattern)

| Item | Value | Tag |
|---|---|---|
| Barrel OD / bore | 3.53 / 2.54 (0.139 / 0.100 in ± 0.010) | SOURCED https://www.ojp.gov/pdffiles1/nij/253876.pdf (Fig. 4) |
| Flag | 1.02 thick (tangential) × 3.18 long (axial, flush with the barrel tip) × 1.68 projecting beyond the barrel. **Tip radius 3.445.** It lies in the ring's plane. | SOURCED (NIJ Rev A; patent Fig. 1 and photo for the plane) |
| Pin (double-lock tip) | Ø 1.9 × 5.9 | SOURCED NIJ 2014 Ø 0.075 in, ≥ 0.213 in (https://www.ojp.gov/pdffiles1/nij/247988.pdf) / photo length |
| Exposed barrel | 24.6 | SOURCED NIJ 2014 ≥ 0.966 in / photo |
| Ring | OD 15.2, ID 10.1, ≈ 2.0 thick. "SMITH & WESSON" stamped round the face. | ESTIMATE (photo) |
| Overall | 45.7 (pin 5.9 + ring 15.2 + barrel 24.6) | DERIVED; dealer 1.8 in |
| Bore depth | 7.0 (must be ≥ 5.7) | ESTIMATE |
| Key post 78 | **(67.60, −16.50)**, Ø 2.24. Riveted flush in the rear cheek (z −4.3); tip at z +3.8, 0.5 below the front face. | SOURCED https://www.lockpicking101.com/viewtopic.php?p=439228 (0.088 in) / patent Fig. 9 |
| Fit | Bore on post: 0.15 radial clearance. Barrel in keyhole: 0.235. | DERIVED |
| Keyhole 80 | Front cheek only: Ø 4.0 on the post. Notch 1.5 wide pointing **−x** (toward the loop and hinge), out to r 3.9. | SOURCED direction (patent Fig. 1) / ESTIMATE sizes |
| Pocket for the flag | Frame cut-out r 4.2 round the post | DERIVED (GEO) |

### 2.5 Unlocking and opening: full kinematics

All angles were solved with the true flag rectangle (1.02 × r 1.715 … 3.445) against the true outlines. Each contact point is given in F so the cutaway can be cut to show it. Turn senses are as seen from +z (keyhole face up).

**K0. Insertion**
- The key comes down the post axis (67.60, −16.50) with κ = 0, flag pointing −x, so it passes the keyhole notch.
- The post enters the bore when the barrel tip reaches z +3.8.
- The barrel tip bottoms on the rear cheek's inner face at **z −1.9**. That is an insertion of 6.2 below the front face (z +4.3); 5.7 of post sits inside the bore.
- The flag then spans **z −1.9 … +1.28**, 0.62 below the front cheek's inner face. Only now can the key turn. It shares the middle layer with the pawl and spring (z ±1.5).
- With the key fully in, the ring centre is at z 30.3 and the pin tip at z 43.8.

**K1. Turn 1: double-lock release.** S&W: counter-clockwise, κ > 0. The flag swings −x → −y → +x, ending "toward the swivel".

| κ | ψ_F | What happens |
|---|---|---|
| 0 → 118.25 | 180 → 298.3 | Free sweep through the pocket. It touches nothing: no pawl, no frame, no jaw (the jaw's tips are ≥ 2.6 away). |
| **118.25** | 298.3 | **First touch.** The flag's leading face meets the flange's free-end corner at **(69.60, −19.15)**. |
| 118.25 → 194.4 | → 14.4 | The flange (and the whole spring) is pushed along +y. u(κ), mm of ON travel left: 120: 3.79 · 130: 2.94 · 140: 2.36 · 150: 1.92 · 160: 1.54 · 170: 1.18 · 180: 0.84 · 183.4: **0.64** · 186: 0.48 · 190: 0.25 · 194.4: 0 |
| **183.4** | 3.4 | **Double lock functionally released.** The U-detent's arm has left the head top enough that the pawl can lift past α_clear. |
| **194.4** | 14.4 | **End of turn 1.** The fold lands on its OFF stop (tongue face y +15.35) and the tab drops into notch 59 (detent click). The flag stops against the flange at **(70.81, −15.15)**. |

If the cuff was **not** double-locked, turn 1 moves nothing and stops at the same 194.4°.

**K2. Back to neutral.** The flag leaves the flange; nothing follows it. Turn 1 only pushes.

**K3. Turn 2: lift the pawl.** S&W: clockwise, κ < 0. The flag swings −x → +y, toward the pawl hub.

| κ | ψ_F | What happens |
|---|---|---|
| **−46.3** | 133.7 | **First touch.** The flag's leading face meets the corner of **shoulder 56** at **(66.20, −14.30)**. |
| −46.3 → | | Lift α(κ), in °: −50: 0.42 · −55: 0.92 · −60: 1.62 · −65: 2.32 · −70: 3.01 · −75: 3.66 · −80: 4.28 · −85: 4.85 (≈ 0.14° of lift per ° of key below −57°). The contact slides along the shoulder: (67.24, −13.04) at clear, (67.87, −13.03) at the end. |
| −74.5 | | Pawl tips exactly on the tooth-tip circle (α 3.60) |
| **−75.7** | 104.3 | **Teeth clear** (α 3.75): the strand can open. |
| **−86.1** | 93.9 | **End of turn 2 with DL OFF.** The pawl reaches its 4.97° limit (shank against the U-detent) and the key stops. |

**K3′. Turn 2 while double-locked.** Touch at −46.3. The pawl lifts to its 1.30° limit (head against the U-detent) and **the key stalls at κ −57.8**. The teeth stay meshed: 0.43 lift against the 1.2 needed.

**K4. The strand swings out.** Clockwise, θ decreasing, with the key held at ≤ −75.7.
- The jaw's locking faces pass under the lifted pawl tips.
- The pawl must stay lifted until **θ < −23.33**, when jaw face 1 is past the pawl's toothed end.
- The nose leaves the mouth at **θ −39.07**.
- Display open pose: **θ −100**. The clear opening to the mouth is then ≥ 56.8.
- Mechanically, the strand is free from θₙ all the way down to θ −323.6. There, after almost a full turn, tooth 21's locking face would meet pawl tooth 1 from behind.

**K5. Key back to neutral (κ → 0).**
- The pawl falls back onto its stud stop (α = 0). If the strand is still engaged, it falls into the nearest root.
- The key comes out along +z with κ = 0 (notch alignment).

### 2.6 Setting the double lock (slot model)

| Step | Value | Tag |
|---|---|---|
| Slot 82 (front cheek) | Centre **(72.90, 13.70)**: x 71.60 … 74.20, y 9.95 … 17.45 (2.6 × 7.5, long axis along y) | SOURCED (patent and photo, via GEO) |
| Key pose | Inverted. The pin goes vertically into the slot, the ring rests edge-on on the front face (ring centre z 11.9), and the barrel points up (top at z 44.1). | DERIVED |
| Pin tip depth | z −1.6 (5.9 pin from z 4.3). It engages the spring over the full z ±1.5 and clears the rear cheek (z −1.9) by 0.3. | DERIVED |
| Pin entry point | (72.55, 16.50) at the slot's +y end. The pin centre runs at x 72.55, touching the slot's −x edge (71.60), so the pin clears the cavity roof (x 73.8). | DERIVED |
| Contact | At pin y **16.30**, the pin meets the fold's outer face (y +15.35). | DERIVED |
| Travel | The pin slides −y ("pull toward the keyhole") from 16.30 to **12.30**. The fold goes 15.10 → 11.10, the U-detent slides over the head top, and the flange reaches its ON stop (frame step y −19.15). The tab clicks into notch 61 in the last ≈ 0.4 mm. | SOURCED direction (https://pelicansalessupply.com/products/smith-wesson-model-100-chain-linked-handcuffs) / DERIVED |
| One-way | The slot only reaches the outside of the fold, so the pin cannot pull the spring back OFF. Only the key's turn 1 can. | SOURCED patent |

### 2.7 Shim: insertion path and why the double lock defeats it

| Item | Value | Tag |
|---|---|---|
| Shim | Spring-steel strip, 0.25 thick × 3.0 wide (z ±1.5), bevelled tip | ESTIMATE (Kelley 1945: "watch spring", https://patents.google.com/patent/US2390885A) |
| Path | Arc concentric with the hinge at **r 63.5 … 63.75**. It lies on the jaw's tooth tips under the frame channel (r 63.8), entering through the mouth at φ −23.5. Outside the mouth it runs straight along the tangent to the fingers. | DERIVED |
| Blocked at | **φ −10.69**: the pawl's toothed end (its tips sit at r 62.3, 1.45 below the shim's top) | DERIVED |
| To get under | The pawl must be at **α ≥ 4.34** (all tips ≥ r 63.75). | DERIVED |
| Single-locked (works) | (1) Push the shim to φ −10.69. (2) Squeeze one click tighter: the strand cams the pawl to its 3.57° peak (tips on tips), and the shim's bevel wedges it the rest of the way to 4.34°. (3) The tip slides on to φ ≈ −2.0, under all three pawl teeth: about 23 mm inside the mouth. (4) Pull the strand open: its teeth slide out under the shim and nothing catches. | SOURCED principle (NBS 1980, https://www.ojp.gov/pdffiles1/Digitization/84814NCJRS.pdf; Kelley 1945) / DERIVED numbers |
| Double-locked (fails) | The pawl can rise only 1.30° (0.43 at the teeth). The squeeze stops after ≈ 1 mm of play, the pawl never reaches 3.57°, and the shim stays jammed at φ −10.69. | DERIVED |

### 2.8 Swivels and chain

| Item | Value | Tag |
|---|---|---|
| Links | **2 welded oval links** per pair | SOURCED https://heinzhistorycenter.emuseum.com/objects/28905/handcuff ("two chain links and a swivel on each cuff") + photos |
| Link size | Wire Ø 2.6; inner 16.4 × 5.4; outer 21.6 × 10.6 | ESTIMATE (photo ratios + the taut 2.00 in span) |
| Swivel | Eye OD 8.0, hole Ø 4.6, 3.4 thick, centre (88.3, 0). Shank Ø 3.4 from the case top (x 81.6) to the eye (x 84.3). Base 6.1 (y) × 2.4 (x) × 5.0 (z) captured in the frame's T-slot at x 75.8 … 78.2 (margins recessed 0.6 into each cheek). Rotates about the x axis. | SOURCED patent (shape) / ESTIMATE sizes |

### 2.9 Thickness stack (z)

| Part | z | Tag |
|---|---|---|
| Rear cheek 18 | −4.3 … −1.9 | DERIVED |
| Middle layer (frame plate 24 in the case; open gap along the double strand) | −1.9 … +1.9 | SOURCED patent (gap) |
| Front cheek 16 (keyhole, slot, logo) | +1.9 … +4.3 | DERIVED |
| Jaw | −1.8 … +1.8 | DERIVED |
| Pawl, spring | −1.5 … +1.5 | ESTIMATE |
| Stud 52, hinge stud | Through both cheeks, ends flush (stud) or domed heads Ø 5.0 proud 0.5 (hinge) | SOURCED patent |
| Case rivets | Shank Ø 2.4 through the frame; domed heads Ø 3.8, proud 0.5 on both faces | ESTIMATE |
| Key flag (inserted) | −1.9 … +1.28 | DERIVED |

### 2.10 Weight check

- Plan areas: cheek plate 2186, jaw 1263, frame plate ≈ 569 mm².
- At 2.4 / 3.6 / 3.8 thickness: 135.0 g per cuff body. Add ≈ 2 g of internals and pins, 1.7 g per swivel and 2.0 g per link.
- Pair ≈ 281 g, against 283 g published. DERIVED

---

## 3. Plan layout (frame F, mm)

### 3.1 Cuff A (keyhole face up; the working, windowed cuff)

| Part | Shape and position | Layer z |
|---|---|---|
| Hinge (joint stud 20) | Centre (0, 0). Stud Ø 4.3; domed heads Ø 5.0 on both faces; lobe r 7.0 on both cheeks and on the jaw eye | through |
| Double strand: front and rear cheek plates | Identical outlines (`cheekOutline` in the JSON). Pivot lobe r 7.0. Outer edge arc r 36.6 about (31.66, 8.19), max y +44.79. Inner edge arc r 24.8 about (31.66, 8.19), tangent to C0 at (55.67, 14.40). The two plates are separate along the strand: 3.8 open gap. | ±(1.9 … 4.3) |
| Case head (part of each cheek) | C0 lower edge r 57.5 from (55.67, 14.40) to the **mouth** at φ −23.5: inner corner (52.73, −22.93), outer corner (58.51, −25.44). Then (60.0, −25.8) → (74.5, −24.6) → R4 fillet about (74.5, −20.6) → (78.30, −21.84) → top plateau (81.6, −7.5) … (81.6, 7.5) → (78.30, 21.84) → R4 fillet about (74.5, 20.6) → (74.5, 24.6) → (63.64, 26.0) → double-strand outer arc. | ±(1.9 … 4.3) |
| Frame plate 24 | Case outline at r ≥ 63.8, minus: the cavity; the T-slot (neck y ±1.8 from x 81.6 to 78.3, base pocket y ±3.15 at x 75.7 … 78.3); boss holes | −1.9 … 1.9 |
| Lock cavity (middle-layer void) | Starts at the jaw channel at (61.35, 17.5). Wall 54 arc r 1.85 about the hub. Tongue face (OFF stop) y +15.35 for x 68.3 … 71.0. Pin pocket x 71.0 … 73.8, y 15.35 … 19.6. Roof x 73.8 from y +19.6 to −19.15. ON-stop face y −19.15 for x 73.8 … 70.6. Step to (70.6, −19.44). Flag pocket r 4.2 about the post round to (63.48, −17.3), then down to the channel at (61.41, −17.3). Open to the jaw channel (r < 63.8) between y −17.3 and +17.5. Polygon: `caseCavity_middleLayer`. | −1.9 … 1.9 |
| Jaw (single strand) at θ | `jaw_theta0`, rotated by θ about the origin. Inner arc r 24.8 about (31.66, −8.19). Concentric inner band r 57.5 from φ −14.5 to the nose. 21 teeth (§2.2). Outer arc r 36.6 about (31.66, −8.19). Anti-pry face groove on both faces along r 61.0 across the teeth, 0.5 × 0.3 (ESTIMATE). | −1.8 … 1.8 |
| Pawl, hub, stud 52, wall 54 | §2.3 (`pawl_alpha0`, rotated by α about (66.20, 15.70)) | ±1.5 |
| Spring 42 | §2.3 centreline (`spring_centreline_u0`), shifted −u in y. The lower leg bends: draw it from the fold corner (68.20, 14.30) to the tab, with the tab rotated by α about the hub. | ±1.5 |
| Key post / keyhole | §2.4 | |
| DL slot (front cheek) | §2.6 | front |
| Case rivets (bosses 28) | Heads Ø 3.8 at **(77.9, +9.7), (77.9, −9.7), (63.8, +21.3), (63.8, −21.3)**; the lower pair sits at r 67.3, outside the jaw channel | both faces |
| Swivel A | Eye centre (88.3, 0), lying **flat** (hole axis z) | z ±1.7 |
| Markings | Cuff A front face: round S&W monogram ≈ Ø 10 at ≈ (71, 0). Cuff B front face: serial stamped along y near the slot. | ESTIMATE (photo) |

**Cutaway window (recommended)**
- Remove the front cheek over the cavity and down through the jaw channel to C0, between φ −23° and +15°.
- Keep a **0.5 rim round the keyhole** (r 2.0 … 2.5) on a narrow bridge running toward ψ_F ≈ 245°. The flag is only ever in that direction mid-turn, and every flag contact happens at r ≥ 2.6 from the post, so the rim hides none of them.
- Keep the front cheek as a bar over x ≥ 71 for y > +9, so that **the slot survives**. The pin and the fold are then seen *through the slot* (fold y 15.10 → 11.10 lies under the slot's span, 9.95 … 17.45).

**Contacts the window must show** (F coordinates)

| Contact | Where |
|---|---|
| Pawl teeth ↔ jaw teeth | φ −2.9 … −10.7, r 62.3 … 63.5 |
| Shoulder ↔ flag | (66.20, −14.30) → (67.87, −13.03) |
| Flange ↔ flag | (69.60, −19.15) → (70.81, −15.15) |
| U-detent over the head top | x 69.30 … 69.90, y −7.7 … −10.7 |
| Shank ↔ U-detent at full lift | ≈ (69.90, −6.06) |
| Tab ↔ notch 59 / 61 | (67.55, −2.70) / (67.60, −6.70) |
| Fold ↔ OFF stop | y 15.35, x 69.0 … 71.0 |
| Flange ↔ ON stop | y −19.15, x 70.6 … 73.55 |
| Hub ↔ stud | C1 (65.12, 14.26) |
| Shim tip ↔ pawl toothed end | φ −10.69, r 63.5 … 63.75 |

### 3.2 Cuff B, chain and key

| Item | Placement | Tag |
|---|---|---|
| Cuff B | Same part, rotated 180° about z through (107.0, 0): **(x, y, z)_B-local → (214.0 − x, −y, z)**. Keyhole up. Hinge at (214.0, 0); case top at x 132.4; swivel eye at (125.7, 0). | DERIVED |
| Cuff B state | Suggest: open (θ −100) or closed at another position, so the pair shows both states | ESTIMATE |
| Swivel A eye | Flat, centre (88.3, 0, 0); hole x 86.0 … 90.6 | DERIVED |
| Link 1 | **On edge** (xz plane). Inner x 90.6 … 107.0, outer 89.3 … 108.3. Centre z **+1.0**, so it rests on the bench (z −4.3) and holds eye A's bar (z ±1.7) inside its opening (z −1.7 … +3.7). | DERIVED |
| Link 2 | **Flat** (xy plane). Inner x 107.0 … 123.4 × y ±2.7; outer 105.7 … 124.7 × y ±5.3. Centre z 0 (it hangs between its hooks). | DERIVED |
| Swivel B eye | **On edge** (swivel turned 90°). Centre (125.7, 0, 0); OD spans x 121.7 … 129.7 and z ±4.0; hole x 123.4 … 128.0. | DERIVED |
| Taut-chain check | Hole edge of eye A (90.6) + 16.4 + 16.4 = 123.4 = hole edge of eye B | DERIVED |
| Key in keyhole | Axis vertical at (67.60, −16.50). Barrel tip at z −1.9; ring centre z 30.3, ring plane containing the flag direction ψ_F = 180 + κ; pin top z 43.8. | DERIVED |
| Key in slot | Inverted; pin axis at (72.55, y_pin), y_pin 16.50 → 12.30 | DERIVED |
| Key at rest | Lying beside the pair (it is 45.7 long) | ESTIMATE |

### 3.3 Exploded / apart view (assembly truth)

**Stack, top to bottom**

| Layer | Contents |
|---|---|
| 1 | Front cheek (keyhole, slot, rivet heads) |
| 2 | Spring 42 (drops in last, on the pawl) |
| 3 | Pawl 40 (on stud 52 and wall 54) |
| 4 | Frame plate 24, with the swivel base in its T-slot, and the jaw (threaded on the hinge stud) |
| 5 | Rear cheek, carrying the key post 78, stud 52 and hinge stud 20 |

**What passes through what**
- Stud 52, the four bosses and the hinge stud pass through both cheeks.
- The key post is fixed in the rear cheek only.
- Patent build: brazed. Current product: exposed rivets.

**Explode order (outside first)**
1. Front cheek up (+z).
2. Spring up.
3. Pawl up.
4. Rear cheek down (−z), taking the key post, stud 52 and the hinge stud.
5. Frame stays.
6. Jaw slides out of the hinge along −y.

---

## 4. Operation state machine (true behaviour)

```
OPEN (θ ≤ −39.07, pawl α 0 on its stud)
  └─ squeeze ─► ENTERING (−39.07 < θ < −23.30): nose inside the mouth, nothing touching
       └─► LEAD-IN (−23.30 … −20.735): ramp lifts pawl 0 → 2.73°, snap
            └─► SINGLE-LOCKED n=1..23
                 ├─ squeeze: ramp cams pawl 0 → 3.57° over the click, staged snap to 0 → n+1  [event click n]
                 ├─ pull: blocked at θₙ (radial faces meet)  [event blocked:teeth]
                 ├─ past n=23: SWING-THROUGH (free, pawl rides tail at α 0)
                 ├─ pin in slot, slide −y 4.0 ─► DOUBLE-LOCKED  [event dl on, tab click]
                 ├─ shim + squeeze one click ─► SHIMMED (pawl held 4.34°) ─ pull ─► OPEN
                 └─ key in ─► KEYED(single)
DOUBLE-LOCKED (u = 4.0)
  ├─ squeeze: ≈0.92° play then blocked (pawl at its 1.30° limit)  [event blocked:double-lock]
  ├─ pull: blocked at θₙ
  ├─ shim: jams at φ −10.69 (can't get under)
  └─ key in ─► KEYED(double)
KEYED (key down on the post, κ = 0)
  ├─ turn 1 (CCW): free to 118.25 → pushes the spring OFF (u 4→0) → functional release at 183.4 → stop 194.4  [event dl off]
  │     (if u was already 0: nothing moves, stop at 194.4)
  ├─ turn 2 (CW): touch shoulder −46.3 → lift → teeth clear −75.7 → stop −86.1 ─► RELEASED
  │     (if u > 0.64: stall at −57.8 with α 1.30 → still locked)  [event blocked:double-lock]
  └─ back to κ 0, then out along +z
RELEASED (α ≥ 3.75) ─ pull ─► strand swings out; hold the key until θ < −23.33; nose clears the mouth at −39.07 ─► OPEN
  └─ key back to 0: pawl falls to its stud (α 0)
```

**Direction conventions per model**

| Model | Unlock sequence |
|---|---|
| S&W slot (this figure) | Turn 1 CCW, toward the swivel: +κ, 118 → 194°, releases the DL. Turn 2 CW: −κ, 46 → 86°, lifts the pawl. Strand closes CCW. Spring set by pulling the pin toward the keyhole. |
| Peerless 700 | Manual: "turn flag approximately 90 degrees toward the swivel", then "opposite direction approximately 180 degrees" (https://www.peerless.net/files/content/Manuals/Chain-Link-Manual-Web-0315.pdf). Keyhole at the case centre. The DL is a separate bolt under the pawl, pushed in through a hole in the case end. |
| Common rule | First toward the swivel, where the double-lock element lives. Then back the other way to the pawl. |
| Mirror warning | Seen from the rear face, every CW/CCW above is mirrored. |

### 4.1 Peerless 700 deltas (not drawn; for captions only)

| Item | Peerless 700 | Tag |
|---|---|---|
| Pawl spring | Coil spring and plunger in the pawl. The plunger tip is also the DL detent. | SOURCED patents US 1,872,857 / US 2,390,885 |
| Double-lock bolt | Separate bolt, ≈ 3 mm slide | SOURCED patents / ESTIMATE travel |
| Swivel | Flat paddle | SOURCED photo |
| Chain | 3 links | ESTIMATE (photo) |
| Spec | 8.3 → 5.9 in perimeter; 2.0 in opening; 10 oz | SOURCED https://www.peerless.net/files/content/Manuals/peerless-specifications.pdf |

---

## 5. `model.mjs` as pseudo-code (pure; a tested draft is in `scratch/truth/model-draft.mjs`)

```js
// constants (frame F, mm, deg)
PITCH = 2.5991; THETA1 = -20.735; NPOS = 23; thetaOf(n) = THETA1 + PITCH*(n-1)
THETA_LEADIN = -23.335; THETA_MOUTH = -39.07; THETA_FREE_OPEN = -23.33; THETA_OPEN = -100
ALPHA_TIPS = 3.597; ALPHA_CLEAR = 3.746; ALPHA_SHIM = 4.343; U_RELEASED = 0.64
KEY = { touchShoulder:-46.3, teethClear:-75.7, endOff:-86.1, stallOn:-57.8, touchFlange:118.25, dlReleased:183.4, endTurn1:194.4 }
SHIM = { r:63.625, t:0.25, mouthPhi:-23.5, blockedPhi:-10.69, underPhi:-2.0 };  PIN = { x:72.55, yEnter:16.5, yTouch:16.30, yEnd:12.30 }
// tables from the contact solver (linear between samples)
CLICK  = α over one click at f = 0,0.05..0.95 : 0 .16 .34 .53 .71 .89 1.08 1.26 1.45 1.64 1.83 2.02 2.21 2.41 2.60 2.80 2.99 3.19 3.39 3.57
CLICK1 = (n=1→2) 0 .14 .29 .44 .59 .74 .90 1.05 1.21 1.37 1.53 1.69 1.85 2.02 2.18 2.35 2.52 2.69 2.86 3.10
LEADIN = (θ1-PITCH→θ1) 0 .12 .25 .38 .52 .65 .79 .92 1.06 1.20 1.33 1.47 1.61 1.75 1.90 2.04 2.18 2.33 2.48 2.73
SNAP   = f 0.945..1.0 step 0.0055 : 3.57 3.16 3.07 3.09 3.10 2.86 2.71 2.73 2.74 2.39 0   (scale by peak/3.57)
KEY2   = α(κ) κ=-46..-87 step -1 : 0 .09 .20 .31 .42 .52 .62 .72 .82 .92 1.04 1.19 1.33 1.47 1.62 1.76 1.90 2.04 2.18 2.32 2.46
         2.60 2.74 2.87 3.01 3.14 3.27 3.40 3.53 3.66 3.79 3.91 4.04 4.16 4.28 4.40 4.52 4.63 4.74 4.85 4.96 5.07
KEY1   = u_max(κ) κ=116..194 step 2 : 4 4 3.79 3.59 3.40 3.24 3.08 2.94 2.81 2.69 2.57 2.46 2.36 2.27 2.17 2.08 2.00 1.92
         1.84 1.76 1.68 1.61 1.54 1.46 1.39 1.32 1.25 1.18 1.12 1.05 .98 .91 .84 .72 .60 .48 .37 .25 .13 .02
ALIM   = α_max(u) u=4..0 step -0.25 : 1.30 1.31 1.33 1.34 1.35 1.36 1.38 1.39 1.41 1.42 1.44 1.45 1.47 2.40 4.73 4.78 4.97

notchAt(θ)   = θ<THETA1 ? 0 : min(NPOS, 1+floor((θ-THETA1)/PITCH))
alphaJaw(θ)  = θ<THETA1-PITCH or θ>=thetaOf(NPOS) ? 0
             : θ<THETA1 ? LEADIN(f) : (notchAt(θ)==1 ? CLICK1 : CLICK)(f), with the SNAP over f ≥ 0.945
alphaKey(κ)  = κ>-46 ? 0 : KEY2(κ);   uLimitTurn1(κ) = κ<116 ? 4 : KEY1(κ);   alphaLimit(u) = ALIM(u)
loopAt(θ)    = { perimeter, idEq = perimeter/π, width }   // closed form, §2.2 (δ = 29-θ, R_c 32.7, r 24.8, R0 57.5)

state = { theta, alpha, u, key:{ at:'out'|'keyhole'|'slot', depth:0..1, kappa, pinY }, shim:{ phi|null, under }, notch, events:[] }

step(s, want, dt):                               // want = { jaw:θ*, key:{kappa*, pinY*}, shim:φ*|null }
  if key.at=='slot':  pinY → want (clamp 12.1..16.5);  u = max(u, min(4, PIN.yTouch - pinY));  u hits 4 → event 'dl' on
  if key in keyhole (depth 1) and want.kappa:
     κ' = move toward target at ≤ 240°/s
     κ'>0:  u = min(u, max(0, uLimitTurn1(κ'))); κ' = min(κ', 194.4)   // u crossing 0.64 → event 'dl' off
     κ'<0:  while alphaKey(κ') > alphaLimit(u): κ' += 0.05             // stall: −57.8 with DL on, −86.1 off
  aHold = max(key in & κ<0 ? alphaKey(κ) : 0, shim.under ? ALPHA_SHIM : 0)
  if want.jaw: θ' = move toward target at ≤ 90°/s;  peak = max alphaJaw over [θ, θ']
     closing: stop at the first θ where alphaJaw(θ) > alphaLimit(u) and alphaJaw > aHold   → event blocked:'double lock'
     opening: unless aHold ≥ ALPHA_CLEAR or θ ≤ THETA_FREE_OPEN or θ > thetaOf(23): θ' = max(θ', thetaOf(notchAt(θ)))  → event blocked:'teeth'
     notchAt rises and aHold < ALPHA_CLEAR → event click n
  if want.shim: tip φ moves toward target at 20 mm/s ÷ r;  if not under and φ > −10.69:
     under = (peak ≥ ALPHA_TIPS − 0.05 and alphaLimit(u) ≥ ALPHA_SHIM)  else φ = −10.69     → event shim
  alpha = min(max(alphaJaw(θ), aHold), max(alphaLimit(u), alphaJaw(θ)))
  notch = notchAt(θ)

derived readouts:
  position = notch (n of 23);  perimeter = loopAt(thetaOf(n)).perimeter;  ID ≈ perimeter/π
  lock = shim.under ? 'shimmed' : alpha ≥ ALPHA_CLEAR ? 'released' : u ≥ 3.9 ? 'double-locked'
       : u > 0.64 ? 'double lock sliding' : n>0 ? 'single-locked' : 'open'
```

**Readout lines** (narrate the true state)

| State | Line |
|---|---|
| Single-locked | `single-locked · position 9 of 23 · inside 189 mm (≈ 60 mm across)` |
| Closing | `closing · tooth 8 cams the pawl up 2.1°` / `click · position 10` |
| Pull blocked | `pull blocked · locking faces meet` |
| Double-locked | `double-locked · spring detent 0.6 mm over the pawl · can't tighten, can't be shimmed` |
| Turn 1 | `turn 1 · 118° · flag meets the spring's flange` → `pushing the spring 2.1 / 4.0 mm` → `double lock off · 183°` → `stop · 194°` |
| Turn 2 | `turn 2 · 46° · flag meets the pawl's shoulder` → `pawl up 2.3°` → `teeth clear · 76°` → `stop · 86°` |
| Turn 2 while double-locked | `turn 2 stalls at 58° · pawl can rise only 1.3°` |
| Shim | `shim stops at the pawl's teeth` / `squeezed one click · shim slips under` / `shim jammed · double lock holds the pawl` |

The test run (`node test-model.mjs`) replays the full cycle, ending with the shim succeeding single-locked. The draft is within 0.08° of the solver everywhere outside the 5.5 % snap window.

---

## 6. True, surprising facts for captions and legend

1. **One key fits them all.** NIJ fixes a standard key: barrel bore 0.100 in, outside 0.139 in, flag 0.040 × 0.125 × 0.066 in. So a standard key opens most US police cuffs, whoever made them. https://www.ojp.gov/pdffiles1/nij/253876.pdf
2. **On an S&W, the double lock is the pawl spring.** One folded leaf spring presses the pawl into the teeth. Slid 4 mm, it parks a U-shaped detent 0.6 mm above the pawl. https://patents.google.com/patent/US4287731
3. **Why double-lock at all?** A single-locked cuff keeps ratcheting tighter on a struggling wrist. The double lock "prevents the cuff from being further tightened" and stops shimming and picking. https://patents.google.com/patent/US7251964
4. **The shim attack is a 0.25 mm strip** pushed along the teeth while the cuff is squeezed one click tighter. The click lifts the pawl just long enough for the strip to slip under. Double-locked, the pawl can rise only 0.43 mm of the 1.2 needed, so the strip jams. (NBS 1980; Kelley 1945 used a "watch spring".)
5. **23 clicks, 3 mm each.** Each click is 2.6° of swing and takes 3 mm off the inside perimeter, from 8.40 in down to 5.80 in. https://www.columbussupply.com/?p=53178
6. **The whole unlock is a 5° rock.** The 31 mm pawl tips up less than 5°. Its nearest tooth rises 1.25 mm, just enough to clear the 1.2 mm tooth depth.
7. **The key has two working ends.** The hollow barrel turns in the lock. The little pin on the ring sets the double lock (S&W: in the slot, pulled toward the keyhole).
8. **Order matters.** First toward the swivel (releases the double lock), then the other way (lifts the pawl). If the cuff was not double-locked, the first turn simply stops.
9. **It swings all the way through.** The single strand passes between the two cheek plates and can spin a full turn. Officers carry cuffs "loaded" at the last click, with the jaw tip poking out the back. The design goes back to Carney's 1912 patent. https://patents.google.com/patent/US1017955A/en
10. **NIJ pulls on them with 2200 N** (495 lbf) while double-locked at the first notch, and the cuff must not open. https://www.ojp.gov/pdffiles1/nij/082981.pdf

---

## 7. Confidence notes and open items

- **Pitch 2.599°** is fitted to the S&W spec through the patent loop shape (DERIVED). It is 6 % finer than the drawn patent teeth. Tooth count 21 is an ESTIMATE that matches "23 positions" with the patent's 3-tooth pawl.
- **Unchanged from GEO:** pawl hub/stud centres, spring travel, U-detent and flange heights, slot and post positions (patent overlays and the photo, ±0.5–1 mm).
- **Mine, chosen for consistency:** hub r 1.8, spring upper leg on the roof, frame stops at y +15.35 (OFF) / −19.15 (ON), cavity tongue. All are consistent with the patent text.
- **Contact angles** are exact for this model (solver). Real cuffs will vary by a few degrees.
- **Not depicted:** the M100P push-pin variant (edge hole) and the rear-face DL slot of later production (L).
