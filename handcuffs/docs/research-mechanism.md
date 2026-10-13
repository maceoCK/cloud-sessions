# Handcuff mechanism: research spec (chain handcuffs, standard "swing-through" type)

Status: research deliverable for the Anatomy "handcuffs" HERO figure. Every claim carries a source tag [Sx] and a confidence (H = high, M = medium, L = low). Anything marked **UNVERIFIED** or **ESTIMATE** is not stated in any source and must not be presented as fact in the figure's labels without a hedge.

Reference images (patent sheets, manufacturer photos, NIJ figures) are saved in `../handcuffs/refs/` (full path `/tmp/claude-0/-home-user-cloud-sessions/7ec0cff4-f910-5bab-ab58-99a3354d7887/scratchpad/handcuffs/refs/`). The most useful for drawing are listed in section 11.

---

## 0. Recommendation: depict the Smith & Wesson Model 100 (nickel, slot double lock)

**Depict: S&W Model 100 chain handcuff, nickel finish, slot-type double lock.** Reasons:

1. **The current product's internals are documented by S&W's own patents.** The lock is described in US 4,287,731 (Kruger, filed Dec 1979, assigned to Bangor Punta, S&W's parent at the time, later reassigned to Smith & Wesson) [S5]. S&W's own 2007 patent US 7,251,964 restates the same bolt, folded spring and slot double lock as the conventional S&W design, with the same reference numbers. Its "M&P lever lock" Model 100 is that lock with a thumb cam added [S7]. For Peerless the internals rest on 1932 and 1945 patents plus a generic 1980 NBS drawing, not on any current document.
2. **Complete published spec:** 23 locking positions, inside perimeter 8.40 in at the first notch and 5.80 in at the last, 2.04 in opening, 10.0 oz, 8.98 in maximum overall length, 2.00 in between cuffs [S9].
3. **It is the archetypal US police handcuff.** Earlier S&W models 90/91/94/938 were among the few that passed NIJ 0307.01 testing in 1982 [S2]. There is no source on the exact lineage from those models to the Model 100.
4. **It draws well.** The double lock is a single folded leaf spring. It pushes the pawl ("bolt") onto the ratchet, and when slid sideways it parks a U-shaped detent on top of the pawl. That gives one strong "aha" moment, and it can be shown in three clean states (section 5).

**Alternative: Peerless Model 700C.** Its manufacturer manual has a labelled nomenclature photo and explicit key-turn angles, and an official spec sheet gives mm dimensions [S10, S11]. Its lock is the "textbook" layout: a pivoted pawl, a coil-spring plunger, a separate sliding bolt and an end pusher pin [S12, S13, S4]. Choose it instead if the figure should match the NBS/NIJ "typical handcuff" teaching drawings exactly. Sections 6 and 9 give its full spec.

---

## 1. Sources

| ID | Source | URL |
|---|---|---|
| S1 | NIJ Standard 0307.01, *Metallic Handcuffs* (March 1982), full text | https://www.ojp.gov/pdffiles1/nij/082981.pdf |
| S2 | NIJ/TAPIC Consumer Product List + Metallic Handcuff Test Results (Feb 1986), measured S&W 90/91/94/938, Peerless 10 oz and hinged, Hiatt 2010 | https://www.ojp.gov/pdffiles1/Digitization/111387NCJRS.pdf |
| S3 | NIJ Standard 1001.00, *Criminal Justice Restraints* (2014) and Revision A (2019): definitions, Fig. 3 labelled restraint, Fig. 4 standard key dimensions, test loads | https://www.ojp.gov/pdffiles1/nij/247988.pdf ; https://www.ojp.gov/pdffiles1/nij/253876.pdf |
| S4 | NBSIR 80-1989, J. E. Harris, *A Study of Handcuff Improvements*, National Bureau of Standards, 1980: operation of a "typical handcuff", Fig. 1/2 cross-sections | https://www.ojp.gov/pdffiles1/Digitization/84814NCJRS.pdf |
| S5 | US 4,287,731 *Handcuffs* (Kruger; Bangor Punta, later Smith & Wesson), filed 1979-12-07, granted 1981-09-08: S&W Model 100 lock | https://patents.google.com/patent/US4287731 (PDF: https://patentimages.storage.googleapis.com/e1/44/a8/f3a33fee4da1f2/US4287731.pdf) |
| S6 | US 4,574,600 *Handcuff and lock therefor* (Moffett; Bangor Punta, later S&W), 1986: same bolt/spring with a keyhole bushing and key post | https://patents.google.com/patent/US4574600 |
| S7 | US 7,251,964 *Double locking handcuffs* (Wade; Smith & Wesson), 2007: background describes the S&W slot lock and push-pin variants, key directions, "prevents further tightening" | https://patents.google.com/patent/US7251964 (PDF: https://patentimages.storage.googleapis.com/2b/ac/32/b01cb3859334bf/US7251964.pdf) |
| S8 | S&W Model 100 retailer copy, consistent across sellers: "insert the double lock pin ... into the double lock slot and pull down towards the keyhole", carbon steel, finishes | https://pelicansalessupply.com/products/smith-wesson-model-100-chain-linked-handcuffs ; https://copsplus.com/smith-and-wesson-handcuffs-model-100-nickel |
| S9 | S&W Model 100 spec block (repeated identically by several dealers) | https://www.columbussupply.com/?p=53178 ; https://www.copsplus.com/smith-and-wesson-model-100-chain-linked-handcuffs-with-extra-link (100L) |
| S10 | Peerless *Chain Link Handcuff Instruction Manual* (2015): nomenclature photo, double-lock and unlock procedure | https://www.peerless.net/files/content/Manuals/Chain-Link-Manual-Web-0315.pdf |
| S11 | Peerless official specifications sheet (01/18) and M700C sheet | https://www.peerless.net/files/content/Manuals/peerless-specifications.pdf ; https://www.peerless.net/files/content/pdf/PDF-C-Series/M700C%2003-18.pdf |
| S12 | US 1,872,857 *Police Officer's Shackle* (H. Wesson & E. Pomeroy; Peerless), 1932: classic Peerless lock | https://patents.google.com/patent/US1872857A (PDF: https://patentimages.storage.googleapis.com/0c/e0/c4/91f4f0763f6945/US1872857.pdf) |
| S13 | US 2,390,885 *Handcuff* (Kelley; Peerless), 1945: anti-shim fin/groove, describes shimming | https://patents.google.com/patent/US2390885A (PDF: https://patentimages.storage.googleapis.com/e2/4f/ed/2db9c015d6063f/US2390885.pdf) |
| S14 | US 1,017,955 (Carney, 1912): original swing-through pivoted-bow ratchet cuff, later bought by Peerless | https://patents.google.com/patent/US1017955A/en |
| S15 | US 4,509,346 (Szczepanek, Universal Tool, 1985): pawl-and-bolt prior art, drift pin, key CW then CCW | https://patents.google.com/patent/US4509346 |
| S16 | Hiatt/Defense Technology 2010-H and 2010-HD sell sheets (teeth vs locking positions) | https://www.defense-technology.com/wp-content/uploads/2020/06/MON_2010H_2015H_Sell_Sheet.pdf ; https://www.defense-technology.com/wp-content/uploads/2020/06/MON_2010HD_Sell_Sheet.pdf |
| S17 | Officer.com Peerless 700 listing (older spec: 9.3 in overall, "spun rivet construction") | https://www.officer.com/command-hq/corrections/handcuffs-restraints/product/12073676/streichers-police-equipment-peerless-model-700-classic-cuffs |
| S18 | Lock Picking 101 forum, micrometer measurements of keys/posts (hobbyist) | https://www.lockpicking101.com/viewtopic.php?p=439228 |
| S19 | Heinz History Center object record: S&W cuffs "connected by two chain links and a swivel on each cuff" | https://heinzhistorycenter.emuseum.com/objects/28905/handcuff |
| S20 | Retailer product photos of the S&W Model 100, used for counting and proportions (Pelican Sales Supply CDN, images 350103 and 350155) | https://cdn.shopify.com/s/files/1/0600/5964/8157/files/350103_c3132f91-0a68-41e1-928d-1e86645566d0.png ; https://cdn.shopify.com/s/files/1/0600/5964/8157/files/350155_c2c3075f-76c1-4484-a198-371dfa102e2a.png |
| S21 | Collectors Weekly / Peerless press: Carney patent 1,017,955 (1912), Peerless founded 1914 | https://www.collectorsweekly.com/stories/149636-feb-20th-is-national-handcuff-day?in=1129 |
| S22 | LockWiki "Handcuff": general nomenclature (body = shroud/cheek plates/double strand; key post centres the key) | https://lockwiki.com/index.php/Handcuff |

---

## 2. Universal anatomy (applies to S&W and Peerless; NIJ vocabulary vs maker vocabulary)

| Part | Synonyms | What it does | Source / conf. |
|---|---|---|---|
| **Single strand** | ratchet, ratchet arm, jaw, swing arm, bow, locking arm | Curved steel bar pivoted at one end. The free end carries **ratchet teeth on its outer (convex) edge**. It swings **through** the double strand (full 360°) and its teeth pass the pawl. | S1 3.4, S3 3.2.29, S10 photo, S5 col. 3 / H |
| **Double strand** | cheek plates, cheeks (front and back), body, shroud, cheek-plate assembly | Two parallel curved plates riveted together with a spacer. One end straddles the pivot; the other end widens into the **lock case** that houses pawl, spring and double lock. The single strand passes **between** the two plates. | S3 3.2.6, S10, S22, S5 / H |
| **Pivot** | single-strand rivet, joint stud | Pin through the end of the single strand and both cheek plates. The single strand rotates on it. | S3 3.2.27, S10 ("Single Strand Rivet"), S5 (joint stud 20) / H |
| **Pawl** | bolt (S&W patents), latch (Peerless patents), detainer arm | **"A spring-loaded, pivoted bar which engages the teeth of a ratchet, permitting it to advance in the closing direction only."** It pivots on a pin, it does not slide. It has several teeth on the edge facing the single strand. | S1 3.3, S3 3.2.25, S5, S12 / H |
| **Pawl spring** | bolt spring | Pushes the pawl toward the single strand (into the teeth). In both makers' designs it also serves as the detent for the double lock. | S4 p.5, S5, S12 / H |
| **Double-locking mechanism** | double lock, bolt (Peerless/NBS), "double lock bar" (S&W: the sliding spring itself) | **"A mechanism which locks a handcuff pawl in an engaged position, and prevents the ratchet from advancing further in the closing direction."** | S1 3.1, S3 3.2.11 / H |
| **Keyhole** | keyway | Round entry with a radial notch for the key flag (bit), in one cheek plate of the lock case. | S3 3.2.15, S5 Fig. 1, S10 photo / H |
| **Key post** | key guide post, pin 78 (S&W) | **"A cylinder in the center of the keyhole that helps prevent insertion of foreign objects into the keyhole and assists with alignment of the key."** The hollow key barrel slides over it and rotates on it. It is fixed to the opposite cheek plate and spans the cavity. | S3 3.2.16, S5 col. 5, S10 / H |
| **Swivel** | | Rotating eye/shank set into the lock-case end of the double strand. The chain attaches to it. | S3 3.2.40, S5 (swivel 26 in T-slot 35), S10 / H |
| **Chain** | links | Interlinked welded links between the two swivels. | S3 3.2.5, S10 / H |
| **Key** | standard key | Hollow barrel (shaft) with a **flag** on its tip and a ring bow. A solid **pin** (double-lock tip) projects from the other side of the ring. | S3 Fig. 4, S10 photo / H |

**Spatial rule common to both makers** (patents S5, S12, NBS S4, Peerless photo S10) / H. Inside the lock case, the parts stack in layers from the loop outward toward the swivel:

`single strand teeth` | `pawl (teeth face the strand)` | `double-lock element` | `case wall` | `swivel`

- The **pawl's pivot is at the far end** of the case, away from where the single strand enters.
- The **pawl teeth are at the entry end.**
- The spring pushes the pawl **toward** the single strand (toward the wrist).
- The key moves the pawl **away** from the strand (toward the swivel).
- The double-lock element sits between the pawl and the swivel-side wall, so when it is engaged it physically fills the space the pawl would need to retreat into.

---

## 3. Ratchet geometry

| Item | Value | Source / conf. |
|---|---|---|
| Locking positions, S&W Model 100 | **23** (one dealer listing says 22) | S9 / M-H |
| Locking positions, Peerless 700 | not published. Inside-perimeter range 2.4 in at about 0.11 in per click implies about 23. **UNVERIFIED** | derived / L |
| Ratchet teeth vs positions (cross-check) | Hiatt 2010-H: **18 teeth, 23 locking positions**; 2010-HD: 19 teeth, 20 positions. "Positions" is not the same as "teeth". | S16 / H (for Hiatt) |
| Teeth on the single strand, Peerless 700B | **about 22-25**, counted on the manufacturer photo (resolution-limited). **ESTIMATE** | S10 photo / L |
| Teeth on the single strand, S&W 100 | not published. 23 positions with a 3-tooth pawl suggests about 21-25. **UNVERIFIED** | derived / L |
| Tooth profile | Sawtooth. Each tooth has one inclined (ramp) face and one steep (locking) face. On the strand the **ramps face the tip**, the direction of travel into the lock. The **steep faces face the pivot**. Pawl teeth are the mirror image: **ramps face the entry gap, steep faces face the pawl pivot**. Closing: the strand's ramps cam the pawl away against its spring, and it snaps back into the next gap ("click"). Opening: steep face meets steep face, so the strand cannot move. | S1 3.4 ("inclined teeth"), S4 p.3, S5 Fig. 3/5/6, S12 / H (principle); the face orientation is a logical consequence, drawn consistently in S5 |
| Tooth pitch (along the toothed edge) | **about 0.11-0.12 in (2.8-3.0 mm). ESTIMATE.** S&W: (8.40 − 5.80) / 22 clicks = 0.118 in (3.0 mm) of inside perimeter per click. Peerless photo: about 24 teeth over a toothed arc of about 2.7 in, giving about 0.11 in. | derived from S9, S10 / L-M |
| Angle per click | **about 2.5° (range 2.3-2.7°). ESTIMATE.** About 0.118 in per click at roughly 2.5 in from the pivot axis to the teeth at the pawl. | derived / L |
| Total swing, first to last notch | **about 55° (50-60°). ESTIMATE.** | derived / L |
| Toothed portion of the strand | Roughly the last third of the strand, from the tip back toward the pivot (about 2.6-2.8 in of edge on the Peerless). **ESTIMATE** | S10 photo, S5 Fig. 1 / L |
| Closing direction, S&W | Viewed from the **keyhole face**, with the lock case at the top and the pivot at the bottom: the jaw lies on the **right**, enters the case from the right, and closes **counter-clockwise**. The keyhole is near this entry end. | S5 Fig. 1/3/6, S7 ("jaw 12 is pivoted counter-clockwise ... to close") / H (for the patent drawing orientation) |
| Closing direction, Peerless | Peerless photo, right cuff, keyhole face: the single strand enters the lock case at the end **opposite the "pawl pin"** and closes **clockwise** in that view (1932 patent: the arm "click[s] by the ratchet pawl 8 when moving clockwise"). | S10 photo, S12 / M |
| Swing-through | The strand can rotate a full 360° through the double strand. NIJ 1001 includes a "pawl ratcheting test" for arms designed to do this. "Loaded" carry position: strand pushed through to the **last click**, so its tip sticks out above the double strand. | S3 6.12.1, S10 / H |
| Anti-pry / anti-shim grooves | Peerless strand has a **"Single Strand Groove"** along each side face near the toothed edge (labelled in the maker's photo). The 1932 patent pairs it with ridges ("blocks 30") on the cheeks that resist prying. The 1945 patent adds a slot across the teeth for a pawl fin. The S&W cross-sections (S5 Fig. 8/9) show the jaw with small side grooves interlocking with the cheek plates. | S10, S12, S13, S5 / M |

---

## 4. Shimming, picking, and why the double lock stops them (both makers)

- **Shimming** = sliding a thin flat strip (a "watch spring" in 1945; today a shim) into the clearance where the single strand enters the lock case, **between the pawl teeth and the ratchet teeth**. The strip wedges under the pawl, pushing it out of engagement so the strand slides back out over the shim.
  - NBS 1980: "a thin shim that may be inserted between the pawl and ratchet to separate the teeth" [S4] / H.
  - Kelley 1945: "work such an instrument between the latch teeth and the teeth of arm 2 ... hold the latch teeth down while he slides the swinging arm teeth back along the top of the tool" [S13] / H.
- **Picking** = using a bent wire or paper clip in the keyhole to (1) push the double lock off, then (2) lift the pawl [S4] / H.
- **Why the double lock prevents over-tightening:** to advance one notch the pawl must cam away from the strand. With the double lock engaged, a solid block sits in that escape path, so the pawl cannot move and the strand can move neither in nor out.
  - NIJ definition: the double lock "prevents the ratchet from advancing further in the closing direction" [S1 3.1].
  - NBS: "the ratchet cannot be closed further, nor can it be opened" [S4].
  - S&W: "this prevents the cuff from being further tightened" [S7].
  - Peerless: "This will prevent over tightening and make picking the locks more difficult" [S10] / H.
- **Why the double lock defeats a shim:** a shim works only if the pawl can be displaced. With the double lock on, the pawl is blocked, so the shim cannot lift it [S4, S7] / H.
- **NIJ test of the double lock:** pawl engaged at the 3rd notch from the free end, double lock set, then try to move the arm beyond the 3rd notch (must not move) [S3 6.12.2]. A double-lock impact test (5 guided drops) checks that the double lock does not jar loose [S3 6.14] / H.

---

## 5. S&W Model 100: lock in detail (recommended model)

Primary source: US 4,287,731 [S5]; confirmed as the conventional S&W design by US 7,251,964 [S7]. Patent reference numerals are given in brackets. Orientation: **front (keyhole) cheek removed, swivel at the top, keyhole/key post at the right end, pawl pivot at the left end, jaw entering from the right** (S5 Fig. 3/5/6; images `refs/sw-lock-*.png`).

### 5.1 Parts

| Part | Description | Conf. |
|---|---|---|
| Jaw [12] (single strand) | Arcuate. "Ratchet-like teeth [14]" at the free end, on the outer edge. Pivots on joint stud [20] between the cheeks at the bottom of the cuff. | H |
| Front cheek [16] / rear cheek [18] (double strand) | Arcuate plates ending in enlarged heads [16a, 18a] that form the lock case. **The keyhole [80] and double-lock slot [82] are both in the front cheek head [16a].** | H |
| Frame [24] (spacer plate) | Metal plate between the cheek heads, same outline. Bosses [28] on the cheek heads pass through apertures [30]. Its underside recess forms the lock cavity [38]. A **T-shaped slot [35]** through its top holds the swivel. The patent says brazed; current product listings say "exposed rivets" at these positions [S9]. | H (patent) / M (rivets today) |
| Bolt [40] = **pawl** | Long shank [44] with an enlarged round **hub [50] at the left (far) end**. Head [46] at the right (entry) end with **teeth [48] on its underside**: **3 teeth** drawn in Fig. 6. **Pivots** on stud [52] plus a curved wall [54] of the frame; it does **not slide**. Shoulder [56] on the forward edge of the head is the key's lifting point. The upper surface has two detent notches [59, 61]. | H pivoting / M "3 teeth" (patent drawing) |
| Bolt spring [42] = **pawl spring AND double lock** | One **folded flat leaf spring** (a strip bent back on itself). First leg [58] bears on top of the bolt shank and pushes the bolt toward the jaw. Second leg [60] bears on the underside of the frame (swivel side). The second leg carries a **U-shaped detent [62]** and ends in a turned-up **flange [64]** next to the key post. Tab [65] on leg 58 clicks into bolt notches [59 or 61] so the spring cannot shift under impact. **The whole spring slides lengthwise** in the cavity between two stops (the cavity ends). | H |
| Key post [78] | Pin fixed in the rear cheek head [18a]. It crosses the cavity and stands in the centre of the keyhole [80] in the front cheek. US 4,574,600 later adds a slotted bushing [59] around the post [S6]. | H |
| Double-lock slot [82] | Elongated slot through the front cheek head near the **far (left) end** of the cavity, over the end of the spring. Photo evidence suggests current pairs also have a slot on the rear face (see section 10). | H (front) / L (rear) |
| Swivel [26] | Round eye on a shank [32] with a base [34] captured in T-slot [35] between the cheek heads (recesses [36]). | H |
| Key [70] | Shank [72] with radial projection (flag) [74] at one end; axial **pin [76]** at the ring end. The flag end is axially bored to fit over post [78]. | H |

### 5.2 Operation (S&W)

1. **Close (single lock).** Push the jaw through. Its teeth ride under the bolt teeth "in a ratchet-like manner": the bolt pivots up against the spring and snaps down at each tooth. Released, the spring holds bolt teeth [48] in jaw teeth [14]. The jaw can now only tighten. [S5 col. 5, S7] / H
2. **Double lock.** Insert key pin [76] through slot [82] behind the spring and **slide the key toward the keyhole** (left to right in Fig. 3). Dealer wording: "pull down towards the keyhole" [S8]. The spring slides right until U-detent [62] sits **directly over the bolt head [46]**. Tab [65] clicks into notch [61]. The bolt can no longer pivot up, so the jaw is frozen both ways. Once shifted, the spring end lies past the slot and the pin can no longer reach it. [S5 col. 5-6, S7] / H
3. **Release the double lock.** Key in the keyhole over the post. **Turn the key counter-clockwise** (keyhole-face view), i.e. **flag toward the swivel side / away from the bolt**. The flag catches spring flange [64] and pushes the spring back left, so detent [62] moves off the bolt head. [S5 col. 5, S7: "first turned counter-clockwise towards the spring flange 68"] / H
4. **Unlock.** **Turn the key the other way (clockwise)**. The flag swings down past the post, catches **bolt shoulder [56]** and pivots the bolt up about stud [52], lifting teeth [48] off teeth [14]. The jaw swings open. [S5 col. 6, S7] / H
5. **Model 100P (push-pin variant):** the slot is replaced by "a small bore or hole that extends through the side of the frame". The key pin pushes either the spring end directly or an internal pin that pushes the spring. The hole is on the cuff's edge "where the single strand swings through" (dealer). [S7, S8] / M

---

## 6. Peerless Model 700: lock in detail (alternative model)

Sources: manufacturer manual and spec [S10, S11]; internals from Peerless patents US 1,872,857 (1932) [S12] and US 2,390,885 (1945) [S13]; NBS "typical handcuff" Fig. 1/2 [S4] shows the same layout. **Caveat: no source documents the internals of the current 700C directly.** Peerless says only that the 700C has an "updated internal lock mechanism" (dealer copy). Treat internal shapes as M/L.

### 6.1 Parts

| Part | Description | Conf. |
|---|---|---|
| Single strand | Pivoted on the "Single Strand Rivet". Teeth on the outer edge plus a "Single Strand Groove" along the face. Swings through (classic "swing through design"). | H (S10, S11) |
| Double strand | Two plates, "spun rivet construction". 4 domed **cheek rivets** per lock case are visible on the keyhole face. | H (S10 photo, S11, S17) |
| Pawl (latch [8]) | **Long straight bar pivoted on a pin at one end** ([9]; this is the **"Pawl Pin"** visible flush on the case face near the far end in S10's photo). Teeth on its upper edge at the opposite (entry) end. A semicircular cut-out in its underside lets the key turn, and a small **ledge [19]** at one end of the cut-out is what the key flag pushes. The 1945 version shows **2-3 teeth** plus a thin **anti-shim fin [16]** riding in a slot across the strand's teeth. | M (patent) |
| Pawl spring | **Coil spring** inside a hole in the underside of the pawl near its toothed end. It pushes a **pin [17]** down onto the bolt, which forces the pawl up into the teeth. The pin tip also **clicks into one of two notches [16] on the bolt**, so one spring is both the pawl spring and the double-lock detent. NBS describes the same "two-fold" pawl spring. The 1945 drawing calls it a "spring in detent plunger 7". | M (S12, S13, S4) |
| Bolt [13] (double-lock bolt) | Straight bar lying **on the floor of the lock case under the pawl** (swivel side), sliding lengthwise. It has a **shoulder [22]** that, when slid forward, sits directly **under the pawl** ("to effectively block any downward movement"), and a shoulder [20] for the key to push it back. | M |
| Pusher [15] | Pin with a head, butting the bolt end, protruding into **a small hole through the end wall of the lock case at the pawl-pivot end**. Peerless's manual calls this the "small hole on the side of the body" / "Double Lock hole". | M (location from patent plus S10 photo of the key pushed into the case edge) |
| Key post | Labelled "Key Post" in S10. The manual warns "do not over torque the key guide post ... causing it to fall out". | H |
| Keyhole | **Centre of the lock-case face**; round with a notch (S10 photo). | H |
| Swivel | **Flat paddle with an eye hole** (not a round eye like S&W), rotating in the end of the lock case. | H (S10 photo) |
| Chain | **3 links** between the two swivel paddles (photo count). **UNVERIFIED** | L-M |

### 6.2 Operation (Peerless; manufacturer wording)

1. **Close:** "Press the single strand firmly against the wrist causing it to swing through the double strand and reengage." [S10] / H
2. **Double lock:** "inserting the tip of the key into the small hole on the side of the body of the handcuff. Press inward until it is possible to feel the double lock click into place." Inside, the pusher drives the bolt toward the entry end until shoulder [22] underlies the pawl, and the spring pin clicks into the second bolt notch. [S10 / H; internals S12 / M]
3. **Release the double lock:** "Insert key and turn flag approximately **90 degrees toward the swivel**. There will be a noticeable release of tension or 'click'." The flag pushes bolt shoulder [20] back toward the pusher end. Warning: "If the key is forced past 90 degrees it may be possible to bend the internal spring." [S10] / H
4. **Unlock:** "turn the flag in the **opposite direction approximately 180 degrees** or until the single strand is disengaged." The flag catches pawl ledge [19] and presses the pawl away from the strand. [S10 / H; S12 mechanism / M]
5. Patent and NBS direction convention: **clockwise first (bolt off), then counter-clockwise (lift pawl)** [S12, S4, S15] / H.
6. **Unifying rule for both makers:** first turn the flag **toward the swivel**, where the double-lock element lives. Then turn it back the other way, toward the strand side, to catch the pawl's ledge or shoulder and lift the pawl. Consistent with S5, S7, S10, S12. / M-H

---

## 7. S&W vs Peerless: differences at a glance

| Aspect | S&W Model 100 (slot) | Peerless 700C |
|---|---|---|
| Pawl | Pivoting "bolt", hub on a stud at the far end, **3 teeth** under its head (patent) | Pivoting "latch" on a "pawl pin" at the far end, 2-3+ teeth on top at the entry end (patents) |
| Pawl spring | **Folded flat leaf spring** riding on the pawl shank | **Coil spring plus plunger pin** in the pawl |
| Double-lock element | **The same leaf spring slides sideways**; its U-detent sits over the pawl head | **Separate sliding bolt** under the pawl; its shoulder blocks the pawl |
| Detent holding the DL position | Spring tab in 2 notches on top of the pawl | Spring pin in 2 notches on the bolt |
| How DL is set | Key pin in a **slot in the face**, slid **toward the keyhole** (100P: push pin in an edge hole) | Key pin **pushed into a hole in the case edge**; internal pusher pin |
| Keyhole position | Near the **entry end** of the case | **Centre** of the case |
| DL release / unlock | CCW (flag toward the swivel), then CW | Flag 90° toward the swivel, then 180° the other way |
| Swivel | Round eye on a shank, base in a T-slot | Flat paddle with a hole |
| Chain | **2 links** (photos + 100L arithmetic; see section 8.4) | **3 links** (photo) |
| Construction | Front cheek + frame plate + rear cheek; 4 rivets/bosses at the case corners | "Spun rivet construction", 4 domed cheek rivets per case |

---

## 8. Dimensions

### 8.1 NIJ Standard 0307.01 (1982) limits [S1] / H

The standard covers double-locking metallic handcuffs only.

| Requirement | Value |
|---|---|
| Pair weight | ≤ **425 g (15.0 oz)** |
| Minimum opening (wrist insertion) | ≥ **50 mm (2.0 in)** |
| Inside perimeter at the **first** notch | ≥ **200 mm (7.9 in)** |
| Inside perimeter at the **last** notch | ≤ **165 mm (6.5 in)** |
| Maximum overall length of the pair | ≤ **240 mm (9.4 in)** |
| Tensile strength | **2200 N (495 lbf)** for 30 s, double-locked at the first notch, both along the chain and across one cuff; must not open or deform |
| Cheek-plate tamper | **23.0 N·m (204 lbf·in)** torque bit between the cheek plates next to the pivot pin, with the pawl in the 3rd notch from the free end |
| Salt spray | 12 h, ASTM B117, 5 % NaCl, 35 °C |
| Marking | Maker name/trademark, model number, **serial number** |
| Not specified | Locking positions, key dimensions, chain links |

### 8.2 NIJ Standard 1001.00 (2014) / Rev A (2019) [S3] / H

- Type 3 restraint: standard-key double-locking cuffs. Labelled parts in its Fig. 3: cheek plates, ratchet, pawl, pivot, keyhole and key post, swivel, chain (`refs/nij1001-2014-fig3-type3.png`).
- Loads:
  - static loop load 1668 N (375 lbf)
  - dynamic: 10 lb weight dropped 13.5 in
  - longitudinal and locking-mechanism tension 2200 N (495 lbf)
  - **swivel pry** 445 N (100 lbf) at 90°
  - **double-lock impact** (5 guided drops)
  - compression 222 N (50 lbf)
- Standard key, **Figure 4** (tolerance ±0.010 in unless noted):

| Key dimension | 2014 edition | 2019 Rev A |
|---|---|---|
| Overall length | no requirement | no requirement |
| Shaft (barrel) length | ≥ 0.966 in (24.5 mm) | no requirement |
| Pin (double-lock tip) length | ≥ 0.213 in (5.4 mm) | ≥ 0.195 in (5.0 mm) |
| Pin diameter | 0.075 in (1.9 mm) | ≤ 0.09 in (2.3 mm) |
| Flag thickness | 0.040 in (1.02 mm) | 0.040 ± 0.010 in |
| Flag length (along the axis) | 0.125 in (3.2 mm) | 0.125 ± 0.020 in |
| Flag width (radial projection) | 0.062 in (1.6 mm) | 0.066 ± 0.010 in (1.7 mm) |
| Barrel inside diameter (bore) | **0.100 in (2.54 mm)** | 0.100 ± 0.010 in |
| Barrel outside diameter | **0.139 in (3.53 mm)** | 0.139 ± 0.010 in |
| Barrel wall (derived) | (0.139 − 0.100) / 2 = 0.0195 in (0.50 mm) | same |

### 8.3 Model specs (manufacturer or dealer)

| Item | S&W Model 100 [S9] | Peerless 700C official [S11] |
|---|---|---|
| Material | carbon steel ("heat-treated", dealer) | carbon steel |
| Weight (pair) | 10.0 oz (283 g) | 10 oz (283 g) |
| Max overall length | **8.98 in (228 mm)** | **8.9 in (227 mm)**; older listing 9.3 in (236 mm) [S17] |
| Length / distance between cuffs | 2.00 in (51 mm) | 2.0 in (51 mm) |
| Wrist opening (minimum opening) | 2.04 in (51.8 mm) | 2.0 in (51 mm) |
| Inside perimeter, first notch | **8.40 in (213 mm)**, about 2.67 in (68 mm) equivalent diameter | **8.3 in (211 mm)** |
| Inside perimeter, last notch | **5.80 in (147 mm)**, about 1.85 in (47 mm) equivalent diameter | **5.9 in (150 mm)** |
| Tightest inside width / min. diameter at last tooth | 1.80 in (45.7 mm) | 1.9 in (48 mm) |
| Max. diameter at first tooth | not given | 3.0 in (76 mm), likely the long inside axis of the then-oval loop (interpretation, L) |
| Locking positions | 23 | not given |
| 100L / extended variant | 100L "4 link": 3.25 in between cuffs, 10.23 in overall | 700C-6X: 5.3 in between cuffs, 12.5 in overall |

CopQuest lists the S&W 100 at 236 mm / 150 mm / 211 mm. These are identical to the older Peerless figures and are probably copy-paste; **do not use**.

### 8.4 NIJ 1982 measured samples [S2] / H

Five samples each, in inches/oz. These are useful as real tolerances.

| Model | Weight | Opening | Perimeter, 1st notch | Perimeter, last notch | Overall length |
|---|---|---|---|---|---|
| S&W 90 | 9.2-9.5 | 2.0 | 8.3-8.4 | 5.9 | 8.8-9.0 |
| S&W 94 | 11.1-11.2 | 2.0 | 8.1-8.3 | 5.8-6.0 | 9.3-9.4 |
| S&W 938 | 7.8-8.2 | 2.0-2.2 | 8.2 | 5.7-6.2 | 8.7-8.8 |
| Peerless "10 oz" | 9.5-9.6 | 2.0-2.1 | 8.3 | 5.9 | 9.3-9.4 |
| Hiatt 2010 | 9.5 | 2.05 | 8.25 | 5.8 | 8.75 |

### 8.5 Per-cuff geometry. **ALL ESTIMATES**: derived from photos (scale set by the key barrel OD 0.139 in and by the published 2.0 in chain span) and from patent-drawing ratios

| Item | Estimate | Basis / conf. |
|---|---|---|
| Single cuff length, pivot end to swivel end of the case (excluding swivel) | **about 3.5 in (89 mm)**; Peerless photo 3.6-3.8 in | (8.98 − 2.00) / 2 = 3.49 in (S&W); Peerless photo / M |
| Cuff outer width across the loop (perpendicular to the case-pivot axis) | about 3.0-3.4 in (76-86 mm) | S&W photo 3.48 in; Peerless photo 3.0 in / L |
| Strand band width seen face-on (radial) | **about 0.40 in (10 mm)**; range 0.37-0.45 | both photos / L-M |
| Total thickness at the lock case (edge view) | **about 0.40 in (10 mm)** | S&W patent Fig. 2 thickness/height ratio 0.116 × about 3.5 in / L |
| Cheek plate thickness, each | about 0.12-0.13 in (3 mm) | S&W patent Fig. 9: plate : frame : plate ≈ 1 : 1.15 : 1 / L |
| Single strand (jaw) thickness | about 0.14-0.15 in (3.5-4 mm); fits between the cheeks | same / L |
| Lock case face (S&W) | about 2.0 in long × 0.95 in tall (51 × 24 mm), plus a short taper into the strands | S&W patent Fig. 1 ratios scaled / L |
| Lock case face (Peerless) | about 1.25 × 2.1 in incl. the flared strand ends | Peerless photo / L |
| Cheek rivet heads | about 0.23 in (6 mm) diameter, domed | Peerless photo / L |
| Pivot rivet head / pivot boss | about 0.27 in head on a rounded boss of about 0.55 in | Peerless photo / L |
| Keyhole bore | about 0.15-0.17 in (must pass the 0.139 in barrel) plus a flag notch about 0.07 in wide | NIJ key + photo / M |
| **Key post diameter** | **about 0.08-0.09 in (2.0-2.3 mm)**: must fit the 0.100 ± 0.010 in barrel bore. A hobbyist micrometer reading on an S&W cuff is 0.088 in [S18]. | derived S3 + S18 / M |
| S&W swivel eye | about 0.44 in outer diameter (patent ratio) | L |
| Chain link | wire about 0.12-0.13 in (3-3.3 mm); link about 0.75 × 0.40 in outer (19 × 10 mm) | Peerless photo / L |
| Chain count, S&W 100 | **2 links + 2 swivels.** Photo; the "100L 4-link" adds 1.25 in between cuffs (about 2 links); museum S&W "two chain links and a swivel on each cuff" [S19] | M |
| Chain count, Peerless 700 | **3 links + 2 swivels** (photo) | L-M |
| Key overall length | **about 2.1-2.2 in (53-56 mm)**. One dealer lists the S&W key at 1.8 in / 46 mm (unclear what was measured). | photos (S&W and Peerless) / L-M |
| Key ring | outer diameter about 0.70 in (18 mm), inner diameter about 0.42-0.45 in (11 mm), band about 0.14 in | photos / L |
| Key exposed barrel | about 1.1-1.3 in (28-33 mm); 2014 NIJ minimum 0.966 in | photos / L |
| Key pin (double-lock tip) | about 0.2-0.26 in long, about 0.075 in diameter | photo + NIJ / M |

---

## 9. Materials, finishes, markings, visible hardware

- **Material:** carbon steel, both makers [S9, S11, S10] / H. S&W keys and cuffs: some dealers say "heat-treated carbon steel" / M.
- **Finishes**
  - S&W: **nickel-plated**, **blued (black oxide)**, **Melonite** (carbon nitride, case-hardened black) [S8] / H.
  - Peerless: **nickel** (700C), **black oxide** (701C), **color-plated** (750C: orange, pink, blue, yellow, red) [S11] / H.
  - Peerless notes black oxide needs more oiling and may rust [S10].
- **Markings (NIJ requires maker, model, serial)** [S1 4.3] / H:
  - Peerless 700B (maker photo): "PEERLESS HANDCUFF CO. SPRINGFIELD MA." arched on one cuff's double-strand bow; "MADE IN U.S.A. PATENTED" on the other bow; **serial number stamped vertically on one lock-case face** ("25124"); **"Model 700B" stamped on the other cuff's case face** [S10] / H.
  - S&W Model 100 (dealer photos): S&W logo stamped on one case face; serial number stamped on the case face of the other cuff [S20] / M.
- **Visible hardware per lock case**
  - Peerless keyhole face [S10] / H: 4 domed cheek rivets (2 flanking the swivel end, 1 at the pawl-pin end, 1 at the entry end); 1 single-strand (pivot) rivet at the far end of the cuff; a flush **pawl pin** near the far end; the keyhole with the key post visible; plus one small unidentified hole near the entry end on the loop-side edge (UNVERIFIED purpose).
  - S&W [S5 Fig. 1, S20 photos] / M: 4 rivet or boss heads at the case corners (2 flanking the swivel, 2 lower corners); the double-lock slot near the far end; the keyhole near the entry end; small flush pin ends (bolt stud [52], key post [78] on the rear face); the pivot rivet at the bottom.

---

## 10. Flagged / unverified items

1. Exact tooth count on either single strand: not published. Photo count for Peerless about 22-25; S&W inferred 21-25.
2. Tooth pitch (about 0.11-0.12 in), angle per click (about 2.5°) and total swing (about 55°) are **derived**, not published.
3. Pawl tooth count in **current** production: S&W patent drawing shows 3; Peerless patents show 2-3. Not confirmed on current parts.
4. Peerless 700C internals (coil spring + plunger, separate bolt, pusher in the end wall) are inferred from the 1932/1945 Peerless patents and the NBS "typical handcuff" drawing. Peerless only says the 700C has an "updated internal lock mechanism".
5. Location of the Peerless double-lock hole: the manual says "small hole on the side of the body" and its photo shows the key pushed into the narrow end edge of the case. Placing it at the pawl-pivot end follows the 1932 patent (M-L).
6. Whether current S&W Model 100s have a double-lock slot on **both** faces. A collector-forum summary says a double-sided slot came in later production, and product photos show a slot on the non-keyhole face. Not confirmed by S&W (L).
7. All per-cuff dimensions in section 8.5 (thicknesses, plate thickness, band width, case size, rivet sizes, link sizes, key length, key post diameter) are estimates from photos and patent proportions.
8. Chain link counts: S&W 2, Peerless 3. From photos and inference, not stated by either maker.
9. The S&W key-turn directions (CCW to release the double lock, CW to unlock) are as viewed from the keyhole face in the patent's orientation. A real cuff held differently will appear mirrored.
10. "Locking positions" are counted differently by different makers (Hiatt: 18 teeth vs 23 positions), so 23 positions does not mean 23 teeth.

---

## 11. Notes for the figure builder (not research claims)

- **Reference images to trace** (all in `refs/`):
  - `sw-lock-unlocked-fig5.png`, `sw-lock-ratcheting-fig6.png`, `sw-patent-4287731-sheet2-fig5-12.png`: the S&W lock internals in 3 states.
  - `sw-face-fig1.png`: exterior face with slot, keyhole and key.
  - `sw-edge-fig2.png`, `sw-cross-sections.png`: thickness stack.
  - `sw-m100-nickel-photo.png`, `sw-m100-case-chain-zoom.png`, `sw-m100-chain-zoom.png`: exterior and chain.
  - `peerless-nomenclature-*.png`: maker's labelled photo.
  - `nbs1980-fig1/2-*.png`: textbook DL off / DL on.
  - `nij1001-*-fig4-key.png`: key.
- **Suggested states to show:**
  - (A) open
  - (B) ratcheting: strand teeth camming the pawl up, spring compressed
  - (C) single-locked
  - (D) double-locked: S&W spring slid so the U-detent caps the bolt head
  - (E) unlocking: key CCW pushes the spring flange back, then CW lifts the bolt by its shoulder
  - Optional: (F) shim inserted at the entry gap, defeated when (D) is active.
- **Suggested part inventory for one S&W pair (HERO 80-150):** per cuff:
  - front cheek plate, rear cheek plate, frame plate
  - jaw body and its ~23 teeth
  - pivot stud with 2 heads
  - 4 corner rivets with front and back heads (8)
  - bolt (pawl) with 3 teeth, hub, shoulder
  - bolt stud
  - leaf spring (legs, U-detent, flange, tab)
  - key post, keyhole, double-lock slot
  - swivel (eye, shank, base)
  - serial/logo stamping
  - Plus: 2 chain links; 1 key (ring, barrel, bore, flag, pin).
  - Counting the teeth individually, this comes to roughly 110-140 parts for a pair plus key.
