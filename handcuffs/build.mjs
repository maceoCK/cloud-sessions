// Fig 9 · Chain handcuffs, lock cut open. Spec: design.md (scratchpad/handcuffs). Numbers: truth.md via model.mjs.
// node examples/handcuffs/build.mjs [--light] [--audit]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import * as A from "../../kit/audit.mjs";
import { kitScript, glScript } from "../../scripts/inline-kit.mjs";
import { makeParts, makeKey } from "./parts.mjs";
import * as M from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME = process.argv.includes("--light") ? "light" : "dark";
const AUDIT = process.argv.includes("--audit");
const T = JSON.parse(readFileSync(join(HERE, "truth-geometry.json"), "utf8"));   // copy of scratch/truth/truth-geometry.json, cheek lobe corrected (S1)

// ---- truth drift guard (H): throws on any drift
M.check();
console.log("model check ✓");

// ---- world, camera (B.1, B.4)
const VW = 920, VH = 640;
const Z0 = 4.8;
const W = ([x, y, z = 0]) => [x, -y, z + Z0];
const BASE = { x: -56, y: -61, w: 284, d: 147, r: 8 };                     // W plan
const FIT = [...k.boxCorners(BASE, -16, 0),
  W([67.6, -16.5, 43.8]), W([72.55, 16.5, 44.1]),                          // key in keyhole (pin top); inverted key (barrel top)
  W([112, -50, 49.9]),                                                     // parked key top
  W([90, -12, 58.2]),                                                      // flight / flip apex
  ...T.cheekOutline.filter((_, i) => i % 6 === 0).map(([x, y]) => W([x, y, 52.3]))];  // lid lifted 48 (apart)
const P = k.fitProjection(FIT, VW, VH, { pad: 30, azimuth: 298, elevation: 48 });
const FINE = 4;                                                            // B.5 fine projection for the rebuilt mechanism parts
const P4 = { ...P, origin: P.origin.map((v) => v * FINE), scale: P.scale * FINE };
const V = G.viewOf(P), KS = G.scaleOf(P);
const VF = [V[0], -V[1], V[2]];                                            // the view direction in F (toward the viewer)
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (pts, style) => k.dotsSvg(pts, style);
const fine = (svg) => `<g class="hc-fine" transform="scale(${1 / FINE})">${svg}</g>`;

// rotation sense (B.1): screen cross of F x̂ and ŷ must be negative (CCW on a y-down screen); the build exits 1 otherwise
{
  const o = at(W([0, 0, 0])), x = at(W([1, 0, 0])), y = at(W([0, 1, 0]));
  const cross = (x[0] - o[0]) * (y[1] - o[1]) - (x[1] - o[1]) * (y[0] - o[0]);
  if (cross >= 0) { console.log(`chirality: CW ✗ (${cross.toFixed(2)})`); process.exit(1); }
  console.log(`chirality: CCW ✓ (${cross.toFixed(2)}) · origin [${P.origin.map((v) => v.toFixed(2))}] scale ${P.scale.toFixed(5)} · ${KS.toFixed(2)} px/mm`);
}

// ---- geometry (F)
const D2R = Math.PI / 180;
const R638 = 63.8;
const rOf = (p) => Math.hypot(p[0], p[1]);
const angOf = (p) => (Math.atan2(p[1], p[0]) * 180) / Math.PI;
const polar = (c, r, a) => [c[0] + r * Math.cos(a * D2R), c[1] + r * Math.sin(a * D2R)];
const arcAbout = (c, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => polar(c, r, a0 + ((a1 - a0) * i) / n));
const arcPts = (R, a0, a1, step = 2) => arcAbout([0, 0], R, a0, a1, Math.max(1, Math.ceil(Math.abs(a1 - a0) / step)));
const near2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6;
const cheek = T.cheekOutline;
const cav = T.caseCavity_middleLayer;
const POST = M.GEO.POST, STUD = M.GEO.STUD, HUB = M.GEO.HUB;
const RIVETS = T.rivets;                                                    // (77.9, ±9.7), (63.8, ±21.3)
// the bore (inner) run starts at the inner edge's nearest point to the hinge (7.648, 1.978) (S1 gate, I.48)
const CHEEK_RUNS = [[cheek.findIndex(([x, y]) => x === 7.648 && y === 1.978), cheek.length - 1]];
if (CHEEK_RUNS[0][0] < 0) throw new Error("cheek ring: inner edge start not found");
const JAW_RUNS = [[0, 77]];                                                                                                      // inner arc r 24.8 + the r 57.5 band
const ci = (x, y) => { const i = cheek.findIndex((p) => Math.hypot(p[0] - x, p[1] - y) < 0.006); if (i < 0) throw new Error(`cheek point ${x},${y}`); return i; };
const vi = (x, y) => { const i = cav.findIndex((p) => Math.hypot(p[0] - x, p[1] - y) < 0.006); if (i < 0) throw new Error(`cavity point ${x},${y}`); return i; };
// frame ring, unsplit (cuff B, C8 #97): the case head at r ≥ 63.8 minus the cavity and the T-slot
function frameRing() {
  const ring = [];
  const iEnd = ci(81.6, -7.5);
  for (let i = 1; i <= iEnd; i++) ring.push(cheek[i]);
  ring.push(...[...T.tSlot_middleLayer].reverse());
  let i = iEnd + 1;
  for (; rOf(cheek[i + 1]) >= R638; i++) ring.push(cheek[i]);
  ring.push(cheek[i]);
  const a = cheek[i], b = cheek[i + 1], t = (rOf(a) - R638) / (rOf(a) - rOf(b));
  const X = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const innerFrom = ring.length;
  const cEnd = vi(61.41, -17.3);
  ring.push(...arcPts(R638, angOf(X), angOf(cav[0])).slice(0, -1));
  for (let j = 0; j <= cEnd; j++) ring.push(cav[j]);
  ring.push(...arcPts(R638, angOf(cav[cEnd]), angOf(cheek[1])).slice(1, -1));
  return { ring, runs: [[innerFrom, ring.length - 1]], X, xIndex: i };
}
const FRAME = frameRing();
// frame split (D.3): cut 1 on y −19.15 from the roof (x 73.8) to the case edge, cut 2 on x 72.0 from y 19.6 to the case edge.
// Each piece is a list of { p, cav } vertices; an edge whose two ends lie on the cavity is a cavity wall (cav tokens).
const FRAME_SPLIT = (() => {
  const lerpY = (a, b, y) => { const t = (y - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * t, y]; };
  const lerpX = (a, b, x) => { const t = (x - a[0]) / (b[0] - a[0]); return [x, a[1] + (b[1] - a[1]) * t]; };
  const i11 = ci(78.3, -21.84), i12 = ci(81.6, -7.5), i13 = ci(81.6, 7.5), i21 = 21, i23 = ci(63.64, 26);
  if (Math.hypot(cheek[i21][0] - 74.5, cheek[i21][1] - 24.6) > 0.006) throw new Error("cheek 21");
  const C1 = lerpY(cheek[i11], cheek[i12], -19.15), C2 = lerpX(cheek[i21], cheek[i23], 72.0);
  const v = (p, isCav = false) => ({ p, cav: isCav });
  const cEnd = vi(61.41, -17.3), cRoofS = vi(73.8, -19.15), cRoofN = vi(73.8, 19.6), cTongue = vi(71, 19.6);
  const far = [...cheek.slice(1, i11 + 1).map((p) => v(p)), v(C1), ...cav.slice(cRoofS, cEnd + 1).map((p) => v(p, true)),
    ...arcPts(R638, angOf(cav[cEnd]), angOf(cheek[1])).slice(1, -1).map((p) => v(p))];
  const nearE = [v(C1), v(cheek[i12]), ...[...T.tSlot_middleLayer].reverse().map((p) => v(p)), ...cheek.slice(i13, i21 + 1).map((p) => v(p)),
    v(C2), v([72.0, 19.6], true), v(cav[cRoofN], true), v(cav[cRoofS], true)];
  const nearW = [v(C2), ...cheek.slice(i23, FRAME.xIndex + 1).map((p) => v(p)), v(FRAME.X), ...arcPts(R638, angOf(FRAME.X), angOf(cav[0])).slice(1, -1).map((p) => v(p)),
    ...cav.slice(0, cTongue + 1).map((p) => v(p, true)), v([72.0, 19.6], true)];
  const piece = (list) => ({ ring: list.map((q) => q.p), cav: (i) => list[i].cav && list[(i + 1) % list.length].cav });
  return { far: piece(far), nearW: piece(nearW), nearE: piece(nearE), C1, C2 };
})();
// HOLE (C2a): window W0 minus the island (C-ring, neck, rivet boss), plus the keyhole bore and notch, as one simple ring.
// kinds: "w" window rim (chamfered 0.4), "i" island, "b" bore and notch (keyhole.walls draws those walls)
const HOLE = (() => {
  const out = [], push = (p, kind) => out.push({ p, kind });
  arcAbout([0, 0], 59.1, -23, 15, 24).forEach((p) => push(p, "w"));
  [[60.6, 17.9], [66.9, 17.9], [67.4, 19.8], [70.6, 19.8], [70.6, 9.0], [75.5, 9.0], [75.5, -19.15], [70.6, -19.15], [70.6, -21.8]].forEach((p) => push(p, "w"));
  const RIV = [63.8, -21.3], RB = 3.0, B0 = [70.6, -21.8], B1 = polar([0, 0], 59.1, -23);
  const dx = B1[0] - B0[0], dy = B1[1] - B0[1], fx = B0[0] - RIV[0], fy = B0[1] - RIV[1];
  const qa = dx * dx + dy * dy, qb = 2 * (fx * dx + fy * dy), qc = fx * fx + fy * fy - RB * RB, qd = Math.sqrt(qb * qb - 4 * qa * qc);
  const E = [B0[0] + (dx * (-qb - qd)) / (2 * qa), B0[1] + (dy * (-qb - qd)) / (2 * qa)], Wt = [B0[0] + (dx * (-qb + qd)) / (2 * qa), B0[1] + (dy * (-qb + qd)) / (2 * qa)];
  const L = Math.hypot(RIV[0] - POST[0], RIV[1] - POST[1]), u = [(RIV[0] - POST[0]) / L, (RIV[1] - POST[1]) / L], nR = [-u[1], u[0]];
  const HW = 0.7, sRing = Math.sqrt(2.5 * 2.5 - HW * HW), sBoss = L - Math.sqrt(RB * RB - HW * HW);
  const edge = (s, side) => [POST[0] + u[0] * s + side * HW * nR[0], POST[1] + u[1] * s + side * HW * nR[1]];
  const angP = (p, c) => (Math.atan2(p[1] - c[1], p[0] - c[0]) * 180) / Math.PI;
  const wrapUp = (a, from) => { while (a < from) a += 360; return a; };
  const arcN = (c, r, a0, a1) => arcAbout(c, r, a0, a1, Math.max(2, Math.ceil(Math.abs(a1 - a0) / 6)));
  push(E, "i");
  const aE = angP(E, RIV), aRB = wrapUp(angP(edge(sBoss, 1), RIV), aE);
  arcN(RIV, RB, aE, aRB).slice(1).forEach((p) => push(p, "i"));               // over the boss's top to the neck's right edge
  push(edge(sRing, 1), "i");                                                    // up the neck to r 2.5
  const nOut = (Math.asin(0.75 / 2.5) * 180) / Math.PI, nIn = (Math.asin(0.75 / 2.0) * 180) / Math.PI;
  const aRR = angP(edge(sRing, 1), POST);
  arcN(POST, 2.5, aRR, wrapUp(180 - nOut, aRR)).slice(1).forEach((p) => push(p, "i"));   // round the ring through +y to the notch
  arcN(POST, 2.0, 180 - nIn, -180 + nIn).forEach((p) => push(p, "b"));         // in along the notch, the bore the long way round
  const aRL = wrapUp(angP(edge(sRing, -1), POST), 180 + nOut);
  arcN(POST, 2.5, 180 + nOut, aRL).forEach((p) => push(p, "i"));               // out along the notch, on round the ring to the neck
  push(edge(sBoss, -1), "i");                                                   // down the neck
  const aLB = angP(edge(sBoss, -1), RIV);
  arcN(RIV, RB, aLB, wrapUp(angP(Wt, RIV), aLB)).slice(1).forEach((p) => push(p, "i"));   // round the boss's top to its left intersection
  return { ring: out.map((q) => q.p), kind: out.map((q) => q.kind), neck: { psi: (Math.atan2(u[1], u[0]) * 180) / Math.PI + 360, len: L - 2.5 - RB } };
})();
// keyhole (C2 #53): the bore r 2.0 the long way round and the notch's two edges through the C-ring; the chord across the
// notch mouth (r 2.5) is not a wall
const KEYHOLE = (() => {
  const nOut = (Math.asin(0.75 / 2.5) * 180) / Math.PI, nIn = (Math.asin(0.75 / 2.0) * 180) / Math.PI;
  const ring = [...arcAbout(POST, 2.0, 180 - nIn, -180 + nIn, 54), polar(POST, 2.5, 180 + nOut), polar(POST, 2.5, 180 - nOut)];
  return { ring, keep: (i) => i !== ring.length - 2 };
})();
const SLOT = (() => {                                                       // C2 #54 / I.47: rectangular, corner r 0.3
  const { x0, x1, y0, y1 } = M.GEO.SLOT, r = 0.3;
  // a vertex at x 73.8 on the far edge (y0): slot.walls splits there, at the roof face (x 73.8), so its west part can sit
  // between frame.nearW and the inverted key's pin and its east part (over the roof) after frame.nearE (D.2, S2 note)
  return [...arcAbout([x1 - r, y0 + r], r, -90, 0, 4), ...arcAbout([x1 - r, y1 - r], r, 0, 90, 4), ...arcAbout([x0 + r, y1 - r], r, 90, 180, 4), ...arcAbout([x0 + r, y0 + r], r, 180, 270, 4), [73.8, y0]];
})();
// build assertions (C2a): material at the ring, the neck and every rivet head rim; open at the bore, the notch and the contacts
{
  const inPoly = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c; } return c; };
  const openAt = (p) => inPoly(p, HOLE.ring) || inPoly(p, SLOT) || !inPoly(p, cheek);
  const mid = polar(POST, 2.5 + HOLE.neck.len / 2, HOLE.neck.psi);
  const solid = [[POST[0] + 2.25, POST[1]], mid, [72, 18], ...RIVETS.flatMap((c) => [0, 90, 180, 270].map((a) => polar(c, 1.9, a)))];
  const open = [POST, [64.6, -16.5], [62.22, -3.15], [61.68, -8.78], [69.6, -9.2], [65.15, 14.3], [70.0, 14.95], [71.5, -18.75], [67.6, -2.7], [67.65, -6.7]];
  const bad = [...solid.filter(openAt).map((p) => `material ${p}`), ...open.filter((p) => !openAt(p)).map((p) => `open ${p}`)];
  if (bad.length) throw new Error(`HOLE assertions: ${bad.join("; ")}`);
  console.log(`HOLE ✓ ${HOLE.ring.length} vertices · neck ψ ${HOLE.neck.psi.toFixed(1)}° · ${HOLE.neck.len.toFixed(2)} mm`);
}
// anti-pry groove: r 61.0 crossings of the jaw outline at θ 0 (nose 14.71°, tail step −44.61°)
const GROOVE = (() => {
  const jw = T.jaw_theta0, hits = [];
  jw.forEach((a, i) => { const b = jw[(i + 1) % jw.length], ra = rOf(a) - 61, rb = rOf(b) - 61;
    if (ra * rb < 0) { const t = ra / (ra - rb); hits.push(angOf([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])); } });
  if (hits.length !== 2) throw new Error(`groove: ${hits.length} crossings`);
  return [Math.max(...hits) - 0.15, Math.min(...hits) + 0.15].map((v) => Math.round(v * 1000) / 1000);   // ends just inside the outlines
})();
const PD = { cheek, cheekRuns: CHEEK_RUNS, jaw: T.jaw_theta0, jawRuns: JAW_RUNS, frame: FRAME.ring, frameRuns: FRAME.runs, groove: GROOVE, pawl: T.pawl_alpha0, hub: HUB };
const PARTS = makeParts(k, P, PD);
const KEY = makeKey(k, G, P);
const KEY4 = makeKey(k, G, P4);
const PARTS4 = makeParts(k, P4, PD);
const mirW = (ring) => ring.map(([x, y]) => [x, -y]);

// ---- key pieces and recorded shapes (C5): every piece is the key's true solids cut at the face plane (z 4.3)
const KEY_PART = { "key.inner": "keyInner", "key.outer": "keyOuter", "key.inv.inner": "keyInvInner", "key.air": "keyAir" };
function keyPieces(key) {
  const L = KEY.LEN, all = Object.keys(KEY_PART);
  const out = new Map(all.map((n) => [n, [n, 0, 0]]));                  // every slot exists in every pose (empty when unused)
  if (key.at === "stand") out.set("key.outer", ["key.outer", 0, L]);
  else if (key.at === "air") out.set("key.air", ["key.air", 0, L]);
  else if (key.at === "keyhole") {
    const sFace = 4.3 - key.tip[2];
    if (sFace <= 0) out.set("key.outer", ["key.outer", 0, L]);
    else { out.set("key.inner", ["key.inner", 0, sFace]); out.set("key.outer", ["key.outer", sFace, L]); }
  } else if (key.at === "slot") {
    const sFace = key.tip[2] - 4.3;
    if (sFace >= L) out.set("key.outer", ["key.outer", 0, L]);
    else { out.set("key.inv.inner", ["key.inv.inner", sFace, L]); out.set("key.outer", ["key.outer", 0, sFace]); }
  }
  return [...out.values()];
}
function keyShapes(key, lo, hi, name) {
  const F = KEY.frameOfKey(key), meta = { name, owner: "key" }, out = [];
  const span = (a, b) => [Math.max(lo, a), Math.min(hi, b)];
  // the barrel recorded solid; a post inside its bore carries the barrel as its cut (scene: barrelCut)
  let [a, b] = span(0, 24.6);
  if (b - a > 1e-3) out.push(A.disc(F, a, b, M.GEO.BARREL.r, meta));
  [a, b] = span(0, KEY.FLAG_LEN);
  if (b - a > 1e-3) out.push(A.prism(F, KEY.FLAG, a, b, meta));
  for (const prof of [KEY.NECK, KEY.BOSS, KEY.PIN]) { const c = KEY.clipProfile(prof, lo, hi); if (c) out.push(A.solid(F, c, meta)); }
  if (KEY.RING_S >= lo && KEY.RING_S <= hi) out.push(A.ring(G.frameAlong(G.add3(F.o, G.mul3(F.a, KEY.RING_S)), F.v), -1.0, 1.0, 5.05, 7.6, meta));
  return out;
}

// ---- the scene (D.1–D.4): one function of the pose, so the page, the rest settle and the pose audit share every item
const RULER = { x: -24, y: -53.5, w: 250, d: 6.5, r: 1 };
const Zc = { rear: [-4.3, 2.4], frame: [-1.9, 3.8], jaw: [-1.8, 3.6], front: [1.9, 2.4], pawl: [-1.5, 3.0] };
const ex = (ringF, [z, h], meta) => A.extruded(mirW(ringF), z + Z0, h, meta);
const DOME = [[0, 1.9], [0.18, 1.85, 1], [0.36, 1.55, 1], [0.48, 0.9, 1], [0.5, 0]];
const DOME_H = DOME.map(([s, r, f]) => (f ? [s, (r * 2.5) / 1.9, f] : [s, (r * 2.5) / 1.9]));
const PIN_DOME = [[0, 1.6], [0.35, 1.45, 1], [0.62, 1.0, 1], [0.76, 0.45, 1], [0.8, 0]];
const LOCATORS = [[66.13, -26.9], [72.13, -26.4]];
// key stations (C5 poses, F): parked on the stand (tip on the collar top, W z 9), seated in the keyhole, inverted in the slot
const STAND = [112, -50];
const KEY_PARKED = { at: "stand", tip: [STAND[0], STAND[1], 9.0 - Z0], phi: 0, kappa: 0 };
const keySeated = (kappa = 0, tipZ = M.GEO.KEY_TIP_SEATED) => ({ at: "keyhole", tip: [POST[0], POST[1], tipZ], phi: 0, kappa });
const keyInSlot = (pinY, pinTipZ = M.PIN.tipZ) => ({ at: "slot", tip: [M.PIN.x, pinY, pinTipZ + 45.7], phi: 180, kappa: 0 });
const poseOf = (p = {}) => ({ theta: M.THETA_OPEN, alpha: 0, u: 0, key: KEY_PARKED, ...p });
const REST = M.create();
const upF = (o) => G.frameOf(W(o), [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const downF = (o) => G.frameOf(W(o), [0, 0, -1], [1, 0, 0], [0, -1, 0]);
// the far walls of an opening (keyhole, slot), drawn on their own and clipped to the opening's rim. Their recorded shape is the
// 0.3 mm wall layer on the far side of the opening, and the front cheek's recorded shape leaves out everything seen through the
// opening (its view tube: the rim swept away from the viewer), because those far walls are the walls item's, not the cheek's
const FAR_DIR = (Math.atan2(-VF[1], -VF[0]) * 180) / Math.PI;
const NOTCH_BOX = [[POST[0] - 4.2, POST[1] - 0.75], [POST[0], POST[1] - 0.75], [POST[0], POST[1] + 0.75], [POST[0] - 4.2, POST[1] + 0.75]];
const FAR_KEYHOLE = [...arcAbout(POST, 2.0, FAR_DIR - 90, FAR_DIR + 90, 24), ...arcAbout(POST, 2.3, FAR_DIR + 90, FAR_DIR - 90, 24)];
const FAR_SLOT = (() => { const { x0, y0, y1 } = M.GEO.SLOT; return [[x0, y1], [x0, y0], [73.8, y0], [73.8, y0 - 0.3], [x0 - 0.3, y0 - 0.3], [x0 - 0.3, y1]]; })();
const FAR_SLOT_E = (() => { const { x1, y0 } = M.GEO.SLOT; return [[73.8, y0], [x1, y0], [x1, y0 - 0.3], [73.8, y0 - 0.3]]; })();
const SLOT_E = (i) => { const a = SLOT[i], b = SLOT[(i + 1) % SLOT.length]; return (a[0] + b[0]) / 2 > 73.8 && (a[1] + b[1]) / 2 < M.GEO.SLOT.y0 + 0.35; };
function viewTube(ringF) {
  const Vw = G.unit3(V), u = G.unit3(G.cross3(Vw, [0, 0, 1])), v = G.cross3(Vw, u), o = W([ringF[0][0], ringF[0][1], 4.3]);
  const poly = ringF.map((p) => { const d = G.sub3(W([p[0], p[1], 4.3]), o); return [G.dot3(d, u), G.dot3(d, v)]; });
  return A.prism({ o, a: Vw, u, v }, poly, -4.5, 0.05);
}
const wallsOnly = ({ ring, keep }, clipId) => PARTS.holeWallsSvg(ring, 1.9, 4.3, clipId, "hc-cut", keep);

function scene(pose) {
  const R = A.recorder(P);
  const record = R.solid;
  const putW = (name, refW, svg, shapes = [], rest = {}) => R.put({ name, at: refW, svg, shapes, piece: "cuffs", ...rest });
  const put = (name, refF, svg, shapes, rest) => putW(name, W(refF), svg, shapes, rest);
  // ground: the board and the ruler (drawn in the back group, recorded here)
  for (const [x, y] of k.corners(BASE, 22)) {
    record(A.cylinder(x, y, 7, -16, 1.6, { name: "stand.flange", ground: true }));
    record(A.cylinder(x, y, 5.4, -14.4, 2.4, { name: "stand.foot", ground: true }));
  }
  record(A.slab(BASE, -12, 12, { name: "stand.board", ground: true }, 8));
  record(A.slab(RULER, 0, 0.6, { name: "stand.ruler", ground: true }, 3));
  // locator pins (C1 #33–34): tangent to case A's lower edge, standing on the board
  LOCATORS.forEach(([x, y], i) => {
    const name = `stand.locator${i + 1}`, cap = upF([x, y, 6.6 - Z0]);
    putW(name, W([x, y, 3.7 - Z0]), S(k.cylinder(x, -y, 1.6, 0, 6.6, P, 24), { tone: "mid" }) + S(G.solidOf(PIN_DOME, cap, P), { tone: "mid" }),
      [record(A.cylinder(x, -y, 1.6, 0, 6.6, { name, ground: true })), record(A.solid(cap, PIN_DOME, { name: `${name}.cap`, ground: true }))]);
  });
  // domes (C2 #42, #58–62; C8): lathes on the cheek faces; the rear ones carry the cuff on the board
  const domes = (id, map) => {
    [...RIVETS.map((p) => [map(p), DOME]), [map([0, 0]), DOME_H]].forEach(([[x, y], prof], i) => {
      const FR = downF([x, y, -4.3]), FF = upF([x, y, 4.3]);
      putW(`${id}.domeR${i + 1}`, G.add3(FR.o, [0, 0, -0.25]), S(G.solidOf(prof, FR, P), { tone: "mid" }), [record(A.solid(FR, prof, { name: `${id}.domeR${i + 1}`, owner: id }))]);
      putW(`${id}.domeF${i + 1}`, G.add3(FF.o, [0, 0, 0.25]), S(G.solidOf(prof, FF, P), { tone: "mid" }), [record(A.solid(FF, prof, { name: `${id}.domeF${i + 1}`, owner: id }))]);
    });
  };
  const cyl = (name, [x, y], r, [z, h], style, owner, extra = "", meta = {}) =>
    put(name, [x, y, z + h / 2], S(k.cylinder(x, -y, r, z + Z0, h, P, 28), style) + extra, [record(A.cylinder(x, -y, r, z + Z0, h, { name, owner, ...meta }))]);
  // a post inside the key's bore (seated in the keyhole, or parked on the stand): the barrel is recorded solid, so the post is
  // recorded with the barrel as its cut and `seated` (playbook §4.2): it is hidden inside the bore, never in front of the barrel
  // The cut starts 0.05 above the post's base, so the post keeps its seat on what it stands on (supports), and it names the
  // barrel's item and piece (seats)
  const barrelCut = (at, baseZ) => pose.key.at === at && pose.key.tip[2] <= (at === "stand" ? KEY_PARKED.tip[2] : 3.8) + 1e-6
    ? { cut: A.disc(KEY.frameOfKey(pose.key), Math.max(0, baseZ + 0.05 - pose.key.tip[2]), 24.6, M.GEO.BARREL.r, { name: at === "stand" ? "key.outer" : "key.inner", owner: "key", piece: "cuffs" }), seated: true } : {};

  // key stand (C1 #26–30): flange, body with its seam, knurled collar with the index mark, the dummy post the parked bore sits on
  {
    const [sx, sy] = STAND, wy = -sy, base = upF([sx, sy, -Z0]);
    putW("stand.key.flange", [sx, wy, 0.5], S(k.cylinder(sx, wy, 6, 0, 1.0, P, 40), { tone: "lo" }), [record(A.cylinder(sx, wy, 6, 0, 1.0, { name: "stand.key.flange", ground: true }))]);
    putW("stand.key.body", [sx, wy, 3.5], S(k.cylinder(sx, wy, 3.6, 1.0, 5.0, P, 32), { tone: "mid", inner: Ln(k.sideArc(sx, wy, 3.6, 3.5, P), { tone: "faint" }) }),
      [record(A.cylinder(sx, wy, 3.6, 1.0, 5.0, { name: "stand.key.body", ground: true }))]);
    const knurl = k.fadedSvg(G.ribsOf(base, 6.4, 8.6, 4.6, 40, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" });
    const index = Ln(k.lineOnTop([sx - 1.12, wy], [sx - 4.6, wy], 9.0, P), { tone: "hi" });
    putW("stand.key.collar", [sx, wy, 7.5], S(G.disc(6.0, 9.0, 4.6, base, P), { tone: "mid", inner: knurl + index }), [record(A.disc(base, 6.0, 9.0, 4.6, { name: "stand.key.collar", ground: true }))]);
    putW("stand.key.post", [sx, wy, 11.85], S(k.cylinder(sx, wy, 1.12, 9.0, 5.7, P, 24), { tone: "mid" }), [record(A.cylinder(sx, wy, 1.12, 9.0, 5.7, { name: "stand.key.post", ground: true, ...barrelCut("stand", 9.0 - Z0) }))]);
  }

  // ---- cuff A (C2, C3, C4): the lock cut open
  const A_ = "cuffA", o = [40, 0];
  domes(A_, (p) => p);
  const floorRings = Ln(k.ring(STUD[0], -STUD[1], 1.6, -1.9 + Z0, P, 32) + k.ring(POST[0], -POST[1], 1.6, -1.9 + Z0, P, 32), { tone: "faint" });
  put(`${A_}.rear`, [o[0], o[1], -4.3], PARTS.strapF(cheek, -4.3, 2.4, { runs: CHEEK_RUNS, bevel: 0.4, clipId: `clip-${A_}-rear`, style: { tone: "mid", crease: "lo", topClass: "hc-cavity", inner: `<g class="hc-cavity">${floorRings}</g>` } }),
    [record(ex(cheek, Zc.rear, { name: `${A_}.rear`, owner: A_ }))]);
  cyl(`${A_}.stud`, STUD, M.GEO.STUD_R, [-1.9, 3.4], { tone: "mid", className: "hc-cut" }, A_);
  cyl(`${A_}.post.lower`, POST, M.GEO.POST_R, [-1.9, 3.8], { tone: "mid" }, A_, "", barrelCut("keyhole", -1.9));
  put(`${A_}.jaw`, [o[0], o[1], 0], `<g data-part="jawA">${fine(PARTS4.jawSvg(pose.theta, { clipId: "clip-jawA", tone: "hi" }))}</g>`,
    [record(ex(PARTS.jawRing(pose.theta), Zc.jaw, { name: `${A_}.jaw`, owner: A_, cut: A.cylinder(0, 0, 2.15, Z0 - 1.9, 3.8) }))]);
  const piece = (name, pc, ref, more = []) => put(`${A_}.frame.${name}`, ref, PARTS.strapF(pc.ring, -1.9, 3.8, { cav: pc.cav, bevel: 0, clipId: "", style: { tone: "mid", crease: "lo" } }),
    [record(ex(pc.ring, Zc.frame, { name: `${A_}.frame.${name}`, owner: A_ })), ...more]);
  piece("far", FRAME_SPLIT.far, [68, -22, 0]);
  piece("nearW", FRAME_SPLIT.nearW, [64, 22, 0]);
  // the swivel base (C2 #48) sits in nearE's T-slot pocket; hidden assembled, it is recorded with nearE (one item, no interlock)
  piece("nearE", FRAME_SPLIT.nearE, [78, 0, 0], [record(ex(T.swivelBase, [-1.9, 3.8], { name: `${A_}.swivelBase`, owner: A_ }))]);
  // keyhole.walls and slot.walls (D.3): the far walls of the openings, recorded as the thin wall layer of the cheek round them
  put(`${A_}.keyhole.walls`, [POST[0], POST[1], 3.1], wallsOnly(KEYHOLE, "clip-keyholeA"),
    [record(ex(FAR_KEYHOLE, [1.9, 2.4], { name: `${A_}.keyhole.walls`, owner: A_, cut: ex(NOTCH_BOX, [1.8, 2.6]) }))]);
  cyl(`${A_}.post.tip`, POST, M.GEO.POST_R, [1.9, 1.9], { tone: "mid" }, A_, Ln(k.ring(POST[0], -POST[1], 0.8, 3.8 + Z0, P, 24), { tone: "faint" }), barrelCut("keyhole", 1.9));
  // the lock mechanism (C4): pawl, spring, spring.tab, rebuilt per frame in the page from parts.mjs (P4); the pawl is lit
  const line = M.springCentreline(pose.u, pose.alpha);
  const rings = PARTS.springRings(line, pose.alpha);
  put(`${A_}.pawl`, [HUB[0] - 2, 2, 0], `<g data-part="pawl" class="hc-litable" style="--l:1">${fine(PARTS4.pawlSvg(pose.alpha, { jaw: PARTS.jawRing(pose.theta) }))}</g>`,
    [record(ex(PARTS.pawlRing(pose.alpha), Zc.pawl, { name: `${A_}.pawl`, owner: A_ }))]);
  put(`${A_}.spring`, [71.5, 0, 0], `<g data-part="spring" class="hc-litable" style="--l:0">${fine(PARTS4.springSvg(line, pose.alpha, { u: pose.u }))}</g>`,
    [record(ex(rings.body, Zc.pawl, { name: `${A_}.spring`, owner: A_ }))]);
  const tc = rings.tab.length ? rings.tab.reduce((s, p) => [s[0] + p[0] / rings.tab.length, s[1] + p[1] / rings.tab.length], [0, 0]) : [68, -2.7 - pose.u];
  put(`${A_}.spring.tab`, [tc[0], tc[1], 1.45], `<g data-part="springTab" class="hc-litable" style="--l:0">${fine(PARTS4.tabSvg(line, pose.alpha))}</g>`,
    rings.tab.length >= 3 ? [record(ex(rings.tab, [1.4, 0.1], { name: `${A_}.spring.tab`, owner: A_ }))] : []);
  put(`${A_}.slot.walls`, [72.9, 13.7, 3.1], wallsOnly({ ring: SLOT, keep: (i) => !SLOT_E(i) }, "clip-slotA"),
    [record(ex(FAR_SLOT, [1.9, 2.4], { name: `${A_}.slot.walls`, owner: A_ }))]);
  put(`${A_}.slot.wallsE`, [74.0, 9.9, 3.1], wallsOnly({ ring: SLOT, keep: SLOT_E }, "clip-slotAE"),
    [record(ex(FAR_SLOT_E, [1.9, 2.4], { name: `${A_}.slot.wallsE`, owner: A_ }))]);
  // front cheek A with the HOLE (window + keyhole) and the SLOT; the window's far walls inside the hole clip, in cut tokens
  const holes = PARTS.holeD(HOLE.ring, 4.3) + PARTS.holeD(SLOT, 4.3);
  const nH = HOLE.ring.length;
  const win = PARTS.holeWallsSvg(HOLE.ring, 1.9, 4.3, "clip-windowA", "hc-cut", (i) => HOLE.kind[i] !== "b" && HOLE.kind[(i + 1) % nH] !== "b");
  const chamfers = Ln(PARTS.holeD(PARTS.offsetRing(HOLE.ring, (i) => (HOLE.kind[i] === "w" ? 0.4 : 0)), 4.3) + PARTS.holeD(PARTS.offsetRing(SLOT, () => 0.3), 4.3), { tone: "faint" });
  put(`${A_}.front`, [o[0], o[1], 1.9], PARTS.strapF(cheek, 1.9, 2.4, { runs: CHEEK_RUNS, bevel: 0.4, clipId: `clip-${A_}-front`, style: { tone: "mid", crease: "lo", holes, holeInner: win + chamfers } }),
    [record(ex(cheek, Zc.front, { name: `${A_}.front`, owner: A_, cut: [ex(HOLE.ring, [1.8, 2.6]), ex(SLOT, [1.8, 2.6]), viewTube(KEYHOLE.ring), viewTube(SLOT)] }))]);

  // ---- the key (C5, D.3): one rigid body in up to two slotted pieces. At the keyhole key.inner (the barrel up to the face and
  // the flag) sits in the middle slot and key.outer (the rest) over the front cheek; inverted at the slot key.inv.inner (the pin
  // below the face) sits between the slot walls and frame.nearE; parked it is key.outer; in flight it is key.air (topmost)
  for (const [name, lo, hi] of keyPieces(pose.key)) {
    const svg = hi <= lo ? "" : name === "key.inner" ? fine(KEY4.keySvg(pose.key, { lo, hi })) : KEY.keySvg(pose.key, { lo, hi });   // P4 only inside the case (live.js)
    const mid = KEY.pointAt(pose.key, (lo + hi) / 2);
    const ref = name === "key.inner" ? [POST[0], POST[1], 1.0] : name === "key.inv.inner" ? [M.PIN.x, 14, 1.0] : name === "key.air" && hi <= lo ? [90, -12, 40] : mid;
    put(name, ref, `<g data-part="${KEY_PART[name]}">${svg}</g>`, hi > lo ? keyShapes(pose.key, lo, hi, name).map(record) : []);
  }

  // ---- cuff B (static, unsplit; S4 details it): sandwich + domes so it rests on the board
  const B_ = "cuffB", map = PARTS.mapB, oB = map([40, 0]), cB = map([70, 0]);
  domes(B_, map);
  const m = (ring) => ring.map(map);
  put(`${B_}.rear`, [oB[0], oB[1], -4.3], PARTS.strapF(m(cheek), -4.3, 2.4, { runs: CHEEK_RUNS, bevel: 0.4, clipId: `clip-${B_}-rear`, style: { tone: "mid", crease: "lo", topClass: "hc-cavity" } }),
    [record(ex(m(cheek), Zc.rear, { name: `${B_}.rear`, owner: B_ }))]);
  put(`${B_}.frame`, [cB[0], cB[1], 0], PARTS.frameSvg({ map, clipId: `clip-${B_}-frame`, tone: "mid" }), [record(ex(m(FRAME.ring), Zc.frame, { name: `${B_}.frame`, owner: B_ }))]);
  const thetaB = M.thetaOf(M.NPOS), hingeB = map([0, 0]);
  put(`${B_}.jaw`, [oB[0], oB[1], 0], PARTS.jawSvg(thetaB, { map, clipId: "clip-jawB", tone: "hi" }),
    [record(ex(PARTS.jawRing(thetaB, map), Zc.jaw, { name: `${B_}.jaw`, owner: B_, cut: A.cylinder(hingeB[0], -hingeB[1], 2.15, Z0 - 1.9, 3.8) }))]);
  put(`${B_}.front`, [oB[0], oB[1], 1.9], PARTS.cheekSvg("front", { map, clipId: `clip-${B_}-front`, tone: "mid" }), [record(ex(m(cheek), Zc.front, { name: `${B_}.front`, owner: B_ }))]);
  return R;
}

// ---- 1. back group: board and ruler (C1 #1–20)
const back = [];
back.push(`<path class="iso-halo" d="${k.haloOf(BASE, -16, 12, P)}"/>`);
const feet = k.corners(BASE, 22).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
for (const [x, y] of feet) {
  back.push(S(k.cylinder(x, y, 7, -16, 1.6, P, 32), { tone: "lo" }));
  back.push(S(k.cylinder(x, y, 5.4, -14.4, 2.4, P, 32), { tone: "mid" }));
}
back.push(S(k.slabOf(BASE, -12, 12, P, 8, 1.6), { tone: "mid", inner: Ln(k.sideSeam(BASE, -4, P, 8), { tone: "faint" }) }));
back.push(Ln(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: "lo" }));
for (const [x, y] of k.corners(BASE, 10)) back.push(Ln(k.ring(x, y, 2.2, 0, P, 32), { tone: "lo" }) + Dots([at([x, y, 0])], { size: 0.5, tone: "mid" }));
// ruler strip: F y 47 … 53.5 (front edge on F y 53.5), ticks rooted on the front edge, minor 5 / major 25, zero tick under hinge A
back.push(S(k.slabOf(RULER, 0, 0.6, P, 3), { tone: "lo", crease: "faint" }));     // the near top edge is drawn: every tick roots on it
// majors 3.0 (not 3.6): at this camera 3.6 mm is 7.8 px, past the line check's 7 px "tick" limit, and a longer mark needs both ends rooted
const TICK = [2, 3.0];
const ticks = k.topTicks(0, 225, 5, 5, RULER.y, 0.6, TICK, P);
back.push(Ln(ticks.minor, { tone: "lo" }) + Ln(ticks.major, { tone: "mid" }));
back.push(Ln(k.lineOnTop([0, RULER.y], [0, RULER.y + TICK[1]], 0.6, P), { tone: "hi" }));
back.push(Dots([at([-20, RULER.y + RULER.d / 2, 0.6]), at([222, RULER.y + RULER.d / 2, 0.6])], { size: 0.45, tone: "mid" }));

// ---- 2. sorted scene. One slot per item serves every pose the page shows (D.4), so the settle merges the overlaps of the rest
// scene with those of each pose's lock scene (the moving items and every static item their screen boxes meet)
const MOVING = new Set(["cuffA.jaw", "cuffA.pawl", "cuffA.spring", "cuffA.spring.tab", "key.inner", "key.outer", "key.inv.inner", "key.air"]);
const STEP = 0.5;                                                          // raster step (px) for every overlap pass
const th9 = M.thetaOf(9);
const POSES = [
  ["1 rest", {}],
  ["2 θ −39.07", { theta: M.THETA_MOUTH }],
  ["3 θ −23.30 lead-in touch", { theta: -23.3 }],
  ["4 θ −20.78 lead-in peak", { theta: -20.78 }],
  ["5 θ9", { theta: th9 }],
  ["6 θ9 + 0.944 pitch", { theta: th9 + 0.944 * M.PITCH }],
  ["7 θ23", { theta: M.thetaOf(M.NPOS) }],
  ["23 squeeze double-locked", { theta: th9 + 0.92, alpha: M.ALPHA_MAX_ON, u: M.U_ON }],
  // S3: the key (U.2, U.3); α and u from the model at each κ
  ["8 inverted key, pin y 16.5", { theta: th9, key: keyInSlot(M.PIN.yEnter) }],
  ["9 inverted key, pin y 12.3", { theta: th9, u: M.U_ON, key: keyInSlot(M.PIN.yEnd) }],
  ["10 key mid-flip apex", { theta: th9, key: { at: "air", tip: KEY.tipOfCentre([95, -30, 28], { phi: 90 }), phi: 90, kappa: 0 } }],
  ["11 key half-inserted", { theta: th9, u: M.U_ON, key: keySeated(0, 3.8) }],
  ["12 κ 0 seated", { theta: th9, u: M.U_ON, key: keySeated(0) }],
  ["13 κ 118.25", { theta: th9, kappa: M.KEY.touchFlange }],
  ["14 κ 160", { theta: th9, kappa: 160 }],
  ["15 κ 194.4", { theta: th9, kappa: M.KEY.endTurn1 }],
  ["16 κ −46.3", { theta: th9, kappa: M.KEY.touchShoulder, u: 0 }],
  ["17 κ −57.8 stall", { theta: th9, kappa: M.KEY.stallOn, u: M.U_ON }],
  ["18 κ −75.7", { theta: th9, kappa: M.KEY.teethClear, u: 0 }],
  ["19 κ −86.1", { theta: th9, kappa: M.KEY.endOff, u: 0 }],
  ["20 θ −30 κ −86.1", { theta: -30, kappa: M.KEY.endOff, u: 0 }],
  ["21 θ −45 κ −86.1", { theta: -45, kappa: M.KEY.endOff, u: 0 }],
  ["22 θ −100 seated κ 0", { theta: M.THETA_OPEN, kappa: 0, u: 0 }],
  ["29 key over the chain", { theta: -45, key: { at: "air", tip: [90, -10, 16 - Z0], phi: 0, kappa: 0 } }],
].map(([label, p]) => [label, poseFrom(p)]);
// a pose from the model: u from turn 1 (KEY1) when κ > 0, α = min(max(alphaJaw, alphaKey), max(alphaLimit(u), alphaJaw)) (E.2)
function poseFrom(p) {
  const theta = p.theta ?? M.THETA_OPEN;
  if (p.kappa === undefined) return poseOf({ ...p, theta, alpha: p.alpha ?? M.alphaJaw(theta) });
  const u = p.kappa > 0 ? Math.max(0, Math.min(M.U_ON, M.uLimitTurn1(p.kappa))) : p.u ?? 0;
  const aJ = M.alphaJaw(theta), aK = p.kappa < 0 ? M.alphaKey(p.kappa) : 0;
  return poseOf({ theta, u, alpha: Math.min(Math.max(aJ, aK), Math.max(M.alphaLimit(u), aJ)), key: keySeated(p.kappa) });
}
// the swing between the listed poses (free and ratchet) also has to keep its slot
const SWEEP = [...POSES.slice(1).map(([, p]) => p), ...[-80, -60, -30, -10, 10, 20, 30].map((theta) => poseOf({ theta, alpha: M.alphaJaw(theta) })),
  // the key's flights between its stations (U.2 A6, A11; U.3 A22): upright over the keyhole and the stand, inverted over the slot
  poseOf({ theta: th9, key: { at: "air", tip: [POST[0], POST[1], 16 - Z0], phi: 0, kappa: 0 } }),
  poseOf({ theta: th9, key: { at: "air", tip: [M.PIN.x, M.PIN.yEnter, 8 + 45.7], phi: 180, kappa: 0 } }),
  poseOf({ theta: th9, key: keySeated(0, 6.0) }), poseOf({ theta: th9, key: keyInSlot(M.PIN.yEnter, 3.0) }),
  poseFrom({ theta: th9, kappa: 60 }), poseFrom({ theta: th9, kappa: -30 }), poseFrom({ theta: th9, kappa: 140 }), poseFrom({ theta: th9, kappa: -64 })];
function lockScene(items) {
  const box = (it) => A.markupBox(it.svg);
  const mv = items.filter((it) => MOVING.has(it.name)).map(box).filter(Boolean);
  const meets = (b) => b && mv.some((q) => !(b[2] < q[0] || q[2] < b[0] || b[3] < q[1] || q[3] < b[1]));
  return items.filter((it) => MOVING.has(it.name) || meets(box(it)));
}
const movingSkip = (a, b) => A.sameRun(a, b) || (!MOVING.has(a.name) && !MOVING.has(b.name));
let t0 = Date.now();
const R = scene(poseOf());
// `--keys <file>` (a dev speed-up, not used by the shipped build): reuse the settled keys of an earlier run of this same source
const KEYS_AT = process.argv.indexOf("--keys"), KEYS_FILE = KEYS_AT > 0 ? process.argv[KEYS_AT + 1] : "";
const SCENE_VERSION = 5;                                                   // bump when scene() or the settle changes (the cache key)
const SRC_SIG = `${SCENE_VERSION}:` + ["parts.mjs", "model.mjs"].map((f) => readFileSync(join(HERE, f), "utf8")).join("").length + ":" + R.items.map((it) => it.name).join(",");
let cached = null;
try { if (KEYS_FILE) { const c = JSON.parse(readFileSync(KEYS_FILE, "utf8")); if (c.sig === SRC_SIG) cached = c.keys; } } catch {}
if (cached) R.items.forEach((it) => (it.key = cached[it.name]));
else {
  const items = R.items.slice(), index = new Map(items.map((it, i) => [it.name, i]));   // a copy: R.items is sorted below
  const base = A.overlapsOf(items, P, { step: STEP, states: [0], skip: A.sameRun });
  const pairs = [...base.pairs];
  for (const pose of SWEEP) {
    const sub = lockScene(scene(pose).items);
    for (const pr of A.overlapsOf(sub, P, { step: STEP, states: [0], skip: movingSkip }).pairs) pairs.push({ ...pr, a: index.get(sub[pr.a].name), b: index.get(sub[pr.b].name) });
  }
  const overlaps = { ...base, pairs };
  const solved = A.orderKeys(items, overlaps);
  items.forEach((it, i) => (it.key = solved.keys[i]));
  R.settled = { items, overlaps, solved, states: [0] };
}
if (KEYS_FILE && !cached) writeFileSync(KEYS_FILE, JSON.stringify({ sig: SRC_SIG, keys: Object.fromEntries(R.items.map((it) => [it.name, it.key])) }));
R.items.sort((a, b) => a.key - b.key);
console.log("order key:", R.items.filter((it) => /^(key|stand)\./.test(it.name) || /cuffA\.(post\.tip|pawl|slot|frame\.near|front$)/.test(it.name)).map((it) => it.name).join(" < "), cached ? "· keys from cache" : "");
console.log("order A:", R.items.filter((it) => it.name.startsWith("cuffA")).map((it) => it.name.replace("cuffA.", "")).join(" < "), `· settle over ${SWEEP.length + 1} poses ${((Date.now() - t0) / 1000).toFixed(1)} s`);
const groups = R.items.map((item) => `<g class="it" data-name="${item.name}"${item.attrs ?? ""}>${item.svg}</g>`);

const LABEL = "A pair of chain handcuffs lying on a demonstration board, seen from above and to the side: the right cuff open with its toothed single strand swung out and a window milled in its lock case showing the pawl and its folded spring, the left cuff closed, a ruler along the front edge.";
const svg = k.figureSvg({ width: VW, height: VH, label: LABEL, className: "hc-svg", body: [...back, `<g class="hc">${groups.join("")}</g>`] });

// ---- card (A): built by hand like the Raptor's, because the legend carries the chapter buttons
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const swatch = (mark) => (mark === "raised" || mark === "flat" || mark === "lit")
  ? `<svg class="iso-swatch" data-mark="${mark}" viewBox="0 0 16 10" aria-hidden="true"><path d="${mark === "flat" ? "M2 6.5 8 3.5 14 6.5 8 9.5Z" : "M2 4.5 8 1.5 14 4.5 14 6 8 9 2 6Z"}"/>${mark === "flat" ? "" : `<path class="iso-swatch-crease" d="M2 4.5 8 7.5 14 4.5"/>`}</svg>`
  : `<svg class="iso-swatch" data-mark="${mark}" viewBox="0 0 16 10" aria-hidden="true"><path d="M1.5 5h13"/></svg>`;
const KEYS = [
  { mark: "lit", label: "Lit: the lock part doing the work now: pawl, spring or shim" },
  { mark: "raised", label: `Single strand: ${M.NPOS} positions, ${M.PITCH.toFixed(1)}° apart` },
  { mark: "edge", label: "One folded leaf spring is both pawl spring and double lock" },
  { mark: "flat", label: "Standard key: hollow barrel on a post, the flag does the work" },
  { mark: "dim", label: "Left cuff: at its last click and double-locked" },
];
const CHAPTERS = ["Close", "Double-lock", "Unlock", "Shim test"];       // 05 Apart only if S6 ships
const chapters = CHAPTERS.map((name, i) => `<button type="button" class="hc-chapter" data-chapter="${i + 1}"><span class="hc-num">${String(i + 1).padStart(2, "0")}</span>${esc(name)}</button>`).join("");
const P1 = M.loopAt(M.thetaOf(1)).perimeter, P23 = M.loopAt(M.thetaOf(M.NPOS)).perimeter;
const CAPTION = `A Smith & Wesson Model 100-pattern pair on a demonstration board, the right cuff's lock milled open. Swung in, the single strand clicks through ${M.NPOS} positions ${M.PITCH.toFixed(1)}° apart, and each click takes 3 mm off the inside, from ${Math.round(P1)} mm round at the first to ${Math.round(P23)} mm at the last. Its teeth cam a 31 mm pawl up ${M.ALPHA_TIPS.toFixed(1)}° and the pawl snaps down behind each one, so square faces stop the strand being pulled back. Pushed along the slot toward the keyhole, the key's pin slides the pawl's own folded leaf spring ${M.U_ON} mm and parks a U-bend 0.6 mm above the pawl: the teeth can now rise only ${M.tipRise(M.ALPHA_MAX_ON).toFixed(2)} mm of the ${M.GEO.TOOTH_DEPTH} mm they need, so the cuff can neither tighten nor be shimmed. To open it, the key's ${(2 * M.GEO.BARREL.bore).toFixed(2)} mm bore slides over a ${(2 * M.GEO.POST_R).toFixed(2)} mm post. Turned toward the chain, its flag meets the spring at ${Math.round(M.KEY.touchFlange)}° and pushes it off by ${Math.round(M.KEY.endTurn1)}°. Turned back the other way, it catches the pawl's shoulder at ${Math.round(-M.KEY.touchShoulder)}°, the teeth clear at ${Math.round(-M.KEY.teethClear)}°, and the strand swings out. Contact angles come from a solver on the patent geometry (US 4,287,731); real cuffs vary by a few degrees.`;
const STAGE_LABEL = "Chain handcuffs, right lock cut open. Drag the open strand or use the arrow keys: right closes one click, left pulls the strand back; Home and End swing it fully open or shut. Z zooms to the lock and back. Space or Enter steps through the story.";
const stage = `<div class="iso-stage hc-stage" tabindex="0" role="slider" aria-label="${esc(STAGE_LABEL)}" aria-valuemin="0" aria-valuemax="${M.NPOS}" aria-valuenow="0" aria-valuetext="open">${svg}<span class="hc-sr" role="status" aria-live="polite" data-status></span></div>`;
const corners = `<div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 9</span><span class="iso-plate-corner" data-corner="title">Chain handcuffs, lock cut open</span><span class="iso-plate-corner" data-corner="hint" data-hint>Drag the strand or key · space steps</span><span class="iso-plate-corner" data-corner="readout" data-readout>${esc(M.say(REST).readout)}</span></div>`;
const legend = `<figcaption class="iso-legend"><span class="iso-keys">${KEYS.map((key) => `<span class="iso-key">${swatch(key.mark)}${esc(key.label)}</span>`).join("")}</span><span class="hc-chapters" role="group" aria-label="Chapters">${chapters}</span><span class="iso-caption">${esc(CAPTION)}</span></figcaption>`;
const body = `<figure class="iso-figure hc-figure"><div class="iso-plate">${corners}${stage}</div>${legend}</figure>`;

// ---- page: kit + gl helpers, parts and model in their own namespaces, then live.js
const FRAMINGS = { pair: { cx: VW / 2, cy: VH / 2, z: 1 }, lock: { cx: 510.9, cy: 255.3, z: 2.6 } };   // B.5
const DATA = { P, P4, FINE, parts: PD, rest: { theta: REST.theta }, base: BASE, view: [VW, VH], framings: FRAMINGS, key: { parked: KEY_PARKED, post: POST, pin: M.PIN, z0: Z0 } };
const CSS = readFileSync(join(HERE, "handcuffs.css"), "utf8");
const strip = (src) => src.replace(/^export /gm, "").replace(/^if \(typeof process.*$/m, "");
const partsScript = `const HP = (() => {${strip(readFileSync(join(HERE, "parts.mjs"), "utf8"))}\nreturn { makeParts, makeKey };})();\n`;
// the lathe module in its own namespace (arcade pattern): the key is rebuilt in the page from parts.mjs makeKey
const latheScript = `const GL = (() => {${readFileSync(join(HERE, "..", "..", "kit", "lathe.mjs"), "utf8").replace(/^import .*$/m, "").replace(/^export /gm, "")}\nreturn { viewOf, lightOf, bandOf, scaleOf, frameAlong, frameOf, pointOf, disc, ringBand, solidOf, prismOf, circleOf, arcOf, dot3, add3, sub3, mul3, unit3, cross3, len3 };})();\n`;
const modelScript = `const M = (() => {${strip(readFileSync(join(HERE, "model.mjs"), "utf8"))}\nreturn { ${Object.keys(M).join(", ")} };})();\n`;
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));
const page = k.pageHtml({ title: "Chain handcuffs", theme: THEME, body: `<style>${CSS}</style>${body}`, script: kitScript() + glScript() + latheScript + partsScript + modelScript + `{\n${LIVE}\n}\n`, width: 980 });
const name = THEME === "light" ? "handcuffs-light.html" : "handcuffs.html";
writeFileSync(join(HERE, name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `${R.items.length} items`, `scale ${KS.toFixed(3)} px/mm`);

// ---- verification pages: `--poses-out <dir>` writes each audit pose as a static page (rest keys, no script) for 4× crops
{
  const at_ = process.argv.indexOf("--poses-out");
  if (at_ > 0) {
    const dir = process.argv[at_ + 1], keyOf = new Map(R.items.map((it) => [it.name, it.key]));
    for (const [label, pose] of POSES) {
      const Rp = scene(pose);
      Rp.items.forEach((it) => (it.key = keyOf.get(it.name)));
      Rp.items.sort((a, b) => a.key - b.key);
      const svgP = k.figureSvg({ width: VW, height: VH, label: LABEL, className: "hc-svg", body: [...back, `<g class="hc">${Rp.items.map((it) => `<g class="it" data-name="${it.name}">${it.svg}</g>`).join("")}</g>`] });
      const bodyP = `<figure class="iso-figure hc-figure"><div class="iso-plate">${corners.replace(/data-readout>[^<]*</, `data-readout>pose ${esc(label)}<`)}<div class="iso-stage hc-stage">${svgP}</div></div></figure>`;
      writeFileSync(join(dir, `pose-${label.split(" ")[0]}-${THEME}.html`), k.pageHtml({ title: `pose ${label}`, theme: THEME, body: `<style>${CSS}</style>${bodyP}`, width: 980 }));
    }
    console.log(`wrote ${POSES.length} pose pages to ${dir}`);
  }
}

// ---- audits (D.4, D.5): rest, every pose the page can show (S2: POSES 1–7 and 23), and the contacts' visibility
// Excuses, each after an 8× look (BUILD-LOG S2):
// · jaw ↔ pawl: at the mesh the teeth interleave (each pawl tooth sits between two strand teeth), a cycle no slot resolves. The
//   pawl is drawn after the strand and clipped out of the strand's top face (z 1.8 > pawl top 1.5), which is exactly where the
//   strand is in front (parts.mjs pawlSvg).
// · pawl ↔ spring: the spring wraps the pawl's head (U-detent and legs in front, flange behind the lifted shoulder). The spring is
//   drawn after the pawl and, in the flange zone only, clipped out of the pawl's top face (parts.mjs springSvg).
const only = (name) => (n) => n === name;
// S3, three contact-line pairs of 0.5–4 px² each (8× crops of the static pose pages in both themes, BUILD-LOG S3: z8-cycles.png;
// nothing shows in the drawing):
// · key.inv.inner ↔ front (pose 8, 4 px² against 36.75 the other way): the pin touches the slot's −x edge (x 71.60, truth) and its
//   top cap is coplanar with the face (z 4.3); the pin is seen only through the slot, which the cheek's fill leaves open.
// · key.inner ↔ front (pose 11, 0.5 px²): the half-inserted barrel's cut cap is coplanar with the face at the bore.
// · keyhole.walls ↔ key.inner (pose 13, 0.75 px² against 22.5): at κ 118 the flag under the C-ring's far side; the cheek covers it.
const ALLOW = [[only("cuffA.jaw"), only("cuffA.pawl")], [only("cuffA.pawl"), only("cuffA.spring")],
  [only("key.inv.inner"), only("cuffA.front")], [only("key.inner"), only("cuffA.front")], [only("cuffA.keyhole.walls"), only("key.inner")]];
const CROWD_OK = [];
// a live slot that is empty in a pose (no svg, no shapes: key.inner while the key is parked, …) draws nothing: the audits skip it
function dropEmpty(settled) {
  const keep = settled.items.map((it) => !(it.shapes?.length === 0 && !/<(path|g class)/.test(it.svg.replace(/^<g data-part="[^"]*">/, ""))));
  const index = []; let j = 0;
  keep.forEach((k_, i) => (index[i] = k_ ? j++ : -1));
  const pairs = settled.overlaps.pairs.filter((pr) => keep[pr.a] && keep[pr.b]).map((pr) => ({ ...pr, a: index[pr.a], b: index[pr.b] }));
  return { ...settled, items: settled.items.filter((_, i) => keep[i]), overlaps: { ...settled.overlaps, pairs }, solved: { ...settled.solved, keys: settled.solved.keys.filter((_, i) => keep[i]) } };
}
if (R.settled) R.settled = dropEmpty(R.settled);
A.auditOrExit(R, P, { crowd: CROWD_OK, allow: ALLOW });
if (AUDIT) {
  const started = Date.now();
  const keys = new Map(R.items.map((it) => [it.name, it.key]));
  let total = 0;
  for (const [label, pose] of POSES) {
    const Rp = scene(pose);
    Rp.items.forEach((it) => (it.key = keys.get(it.name)));
    // lockScene: the moving items plus every static item whose screen box meets theirs (pairs of statics are the rest audit's)
    Rp.items = lockScene(Rp.items).filter((it) => it.shapes?.length || /<(path|g class)/.test(it.svg.replace(/^<g data-part="[^"]*">/, "")));
    const overlaps = A.overlapsOf(Rp.items, P, { step: STEP, states: [0], skip: movingSkip });
    Rp.settled = { items: Rp.items, overlaps, solved: { keys: Rp.items.map((i) => i.key), dropped: [], rules: 0, cycles: [] }, states: [0] };
    const result = A.audit(Rp, P, { crowd: CROWD_OK, allow: ALLOW });
    // D.4: in the air poses the key is held by a hand that is not drawn: only `supports` is excused, for key.* only
    if (pose.key.at === "air") result.supports.loose = result.supports.loose.filter((e) => !/^key\./.test(e.name ?? e.shape?.name ?? String(e)));
    const n = A.failures(result);
    total += n;
    console.log(`pose ${label} (θ ${pose.theta.toFixed(3)} α ${pose.alpha.toFixed(2)} u ${pose.u}): ${n ? `${n} problems` : "ok"} · ${Rp.items.length} items · ${overlaps.pairs.length} overlaps`);
    if (n) console.log(A.report(result));
  }
  console.log(total ? `pose audit failed: ${total}` : "pose audit passed", `· ${((Date.now() - started) / 1000).toFixed(1)} s`);
  if (total) process.exitCode = 1;

  // D.5 contact visibility: from samples on the lower part's top face near the contact, march toward the viewer (p + t·V_F)
  // through the recorded occluders at that pose (front cheek A with its HOLE and SLOT cuts, the frame pieces, the front domes)
  const rot = (p, a) => M.rotF(p, HUB, a);
  const c9 = th9 + 0.944 * M.PITCH, a9 = M.alphaJaw(c9), aLead = M.alphaJaw(-22.0);
  const contacts = [
    ["pawl tooth 1 ↔ jaw tooth", { theta: c9, alpha: a9 }, [rot(M.GEO.TIP1, a9)]],
    ["pawl tooth 3 ↔ jaw tooth", { theta: c9, alpha: a9 }, [rot([61.68, -8.78], a9)]],
    ["lead-in ramp ↔ pawl tooth 3", { theta: -22.0, alpha: aLead }, [rot([61.68, -8.78], aLead)]],
    ["locking faces (pull blocked)", { theta: th9 }, [M.GEO.TIP1]],
    ["tab ↔ notch 59", { u: 0 }, [M.tabLocal(0)]],
    ["tab ↔ notch 61", { u: M.U_ON, theta: th9 }, [M.tabLocal(M.U_ON)]],
    ["U-detent over head top", { u: M.U_ON, theta: th9 }, [[69.6, -9.2]]],
    ["head top ↔ U-detent", { u: M.U_ON, alpha: M.ALPHA_MAX_ON, theta: th9 + 0.92 }, [rot([69.3, -10.0], M.ALPHA_MAX_ON)]],
    // the spec's sample y (fold top inner edge, 14.95) at three points along the contact; at x 70.0 the ray meets the slot bar,
    // nearer the hub it leaves through the window's raised rim (y 19.8 for x < 70.6)
    ["fold ↔ OFF stop", { u: 0 }, [[70.0, 14.95], [69.6, 14.95], [69.2, 14.95]]],
    ["flange ↔ ON stop", { u: M.U_ON, theta: th9 }, [[71.5, -18.75]]],
    ["hub ↔ stud", {}, [[65.15, 14.3]]],
  ];
  // key contacts (S3): the lower part's top is the flag top (z 1.28) for flag contacts, the pawl/spring top (z 1.5) otherwise
  const post = (r, kappa) => [POST[0] + r * Math.cos(((180 + kappa) * Math.PI) / 180), POST[1] + r * Math.sin(((180 + kappa) * Math.PI) / 180)];
  for (const kap of [M.KEY.touchFlange, 140, 160, M.KEY.dlReleased, M.KEY.endTurn1]) {
    const pz = poseFrom({ theta: th9, kappa: kap });
    contacts.push([`flag ↔ flange κ ${kap}`, pz, [[69.65, -15.1 - pz.u], post(3.3, kap)], 1.28 - 0.05]);
  }
  for (const [kap, u] of [[M.KEY.touchShoulder, 0], [M.KEY.stallOn, M.U_ON], [M.KEY.teethClear, 0], [M.KEY.endOff, 0]]) {
    const pz = poseFrom({ theta: th9, kappa: kap, u });
    contacts.push([`flag ↔ shoulder κ ${kap}`, pz, [...[[66.2, -14.3], [66.7, -13.7], [67.24, -13.04], [67.87, -13.03]].map((q) => rot(q, pz.alpha)), post(3.3, kap)], 1.28 - 0.05]);
  }
  { const pz = poseFrom({ theta: th9, kappa: M.KEY.endOff, u: 0 }); contacts.push(["shank ↔ U-detent α 4.97", pz, [[69.85, -6.06]]]); }
  for (const pinY of [M.PIN.yTouch, 14.3, M.PIN.yEnd]) {
    const u = M.PIN.yTouch - pinY;
    // the fold's top in the window west of the slot bar (as for fold ↔ OFF stop) and the pin's +x side in the slot under the boss
    contacts.push([`pin ↔ fold pin y ${pinY}`, poseOf({ theta: th9, u, key: keyInSlot(pinY) }), [[70.2, 14.95 - u], [69.2, 14.95 - u], [73.45, pinY, 3.0]]]);
  }
  { const pz = poseFrom({ theta: -10, kappa: M.KEY.endOff, u: 0 }); contacts.push(["jaw faces under the lifted tips", pz, [rot(M.GEO.TIP1, pz.alpha), M.rotF(M.GEO.TIP1, [0, 0], 0)]]); }
  const OCC = /^(cuffA\.(front|frame\.|domeF)|key\.(outer|air)|stand\.key)/;
  let seen = 0;
  for (const [label, p, samples, zs] of contacts) {
    const occ = scene(p.key ? p : poseOf(p)).solids.filter((s) => OCC.test(s.name ?? ""));
    const z = zs ?? 1.5 - 0.05;                                             // the closing contacts' lower top is the pawl/spring top (z 1.5)
    const hitBy = (q) => { const z0 = q[2] ?? z; for (let t = 0.02; t < 120; t += 0.02) { const f = [q[0] + VF[0] * t, q[1] + VF[1] * t, z0 + VF[2] * t]; if (f[2] > 60) return ""; for (const s of occ) if (A.sdf(s, W(f)) < 0) return s.name; } return ""; };
    const res = samples.map(hitBy);
    const ok = res.some((r) => r === "");
    if (ok) seen++;
    console.log(`  ${ok ? "ok " : "HID"} ${label.padEnd(30)} ${res.map((r) => r || "visible").join(" · ")}`);
  }
  console.log(`contacts visible: ${seen} of ${contacts.length}`, `· ${((Date.now() - started) / 1000).toFixed(1)} s`);
  if (seen < contacts.length) process.exitCode = 1;
}
