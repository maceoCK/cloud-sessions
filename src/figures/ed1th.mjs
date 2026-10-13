// Fig. I · ED1TH. A pair of round glasses on a fitting stand, seen from the
// wearer's side: a nose rest and two ear rests hold the frame, two model eyes
// sit where a wearer's would, and a small display lives in the upper outer
// corner of the right lens. The eyes follow the pointer; when the right eye's
// gaze lands in that corner the display comes up, and when it leaves the
// display goes quiet again.
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../../kit/tube.mjs";

const WIDTH = 960;
const HEIGHT = 560;
const AZIMUTH = -57;

// World: x across the face (wearer's right is +x), y forward (the wearer
// looks along +y), z up. Units are about half a millimetre.
const ZG = 96; // lens centre height
const LENS_R = 22;
const RIM = 2.8; // rim band, radially
const RIM_D = 3.2; // rim depth along y
const LX = 34; // lens centre offset from the bridge
const HINGE_X = LX + LENS_R + RIM + 3.4;
const TEMPLE_R = 1.7;
const TEMPLE_END = -122;
const EAR_Y = -104;
const EYE_R = 12;
const EYE_Y = -27;
const IPD = 32; // half the distance between the eyes

// The display: a window in the upper outer corner of the right lens, on its
// inner face, in lens-plane coordinates (u across, v up) from the lens centre.
const DISPLAY = { u: 6.4, v: 7.2, w: 15, h: 8.6 };
const LENS_BACK = -RIM_D / 2 - 0.2;

const BASE = { x: -96, y: -150, w: 192, d: 186, r: 9 };
const BASE_H = 12;
const FOOT_H = 5;

const P = k.fitProjection(
  [...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [-HINGE_X, 4, ZG + LENS_R + 4], [HINGE_X, 4, ZG + LENS_R + 4]],
  WIDTH,
  HEIGHT,
  { pad: 30, azimuth: AZIMUTH },
);

const V = G.viewOf(P);
const at = (p) => k.iso(p, P);
const depth = (p) => G.dot3(p, V);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => depth([a[0], a[1], 0]) - depth([b[0], b[1], 0]));

// Items are painted back to front by depth, after the base.
const items = [];
const put = (where, svg, bias = 0) => items.push({ key: depth(where) + bias, svg });

// ---------------------------------------------------------------- base
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(BASE, 20))) {
    out.push(S(k.cylinder(x, y, 7.4, -BASE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.6, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BASE, 6), 0, P), { tone: "lo" }));
  const screws = k.corners(BASE, 11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.3, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // ruler strip along the near edge, in millimetres (2 units)
  const strip = { x: -78, y: BASE.y + 11, w: 156, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + strip.d - 0.8, 0.6, [-2, -3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  // label plate by the near right corner
  const plate = { x: 50, y: BASE.y + 24, w: 30, d: 15, r: 1.4 };
  out.push(S(k.slabOf(plate, 0, 0.8, P, 4), { tone: "mid", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(plate, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L([k.lineOnTop([plate.x + 5, plate.y + 5], [plate.x + 26, plate.y + 5], 0.8, P), k.lineOnTop([plate.x + 5, plate.y + 8.4], [plate.x + 20, plate.y + 8.4], 0.8, P), k.lineOnTop([plate.x + 5, plate.y + 11.8], [plate.x + 23, plate.y + 11.8], 0.8, P)].join(""), { tone: "lo", free: true }));
  out.push(D([at([plate.x + 2.6, plate.y + 2.6, 0.8]), at([plate.x + plate.w - 2.6, plate.y + plate.d - 2.6, 0.8])], { size: 0.4 }));
  return out.join("");
}

// A post on a foot with a collar and a knurled lock screw; returns the parts
// as one item keyed at the post's foot.
function post(x, y, top, { r = 3.4, collarAt = null, screwSide = [1, 0], z0 = 0 } = {}) {
  const out = [];
  out.push(S(k.cylinder(x, y, r + 4, z0, 2.4, P, 32, 0.4), { tone: "mid" }));
  out.push(L(k.ring(x, y, r + 2, z0 + 2.4, P, 28), { tone: "faint" }));
  out.push(S(k.cylinder(x, y, r, z0 + 2.4, top - z0 - 2.4, P, 28), { tone: "mid", crease: "none" }));
  if (collarAt !== null) {
    out.push(S(k.cylinder(x, y, r + 1.6, collarAt, 6, P, 28, 0.3), { tone: "mid" }));
    const [sx, sy] = screwSide;
    const cx = x + sx * (r + 1.6 + 2.2);
    const cy = y + sy * (r + 1.6 + 2.2);
    out.push(S(k.slabOf({ x: cx - 1.4 - sx, y: cy - 1.4 - sy, w: 2.8, d: 2.8, r: 0.6 }, collarAt + 1.6, 2.8, P, 2), { tone: "mid", crease: "none" }));
    out.push(S(k.cylinder(cx + sx * 1.2, cy + sy * 1.2, 2.2, collarAt + 0.4, 5.2, P, 18), { tone: "mid" }));
    out.push(L(k.knurl(cx + sx * 1.2, cy + sy * 1.2, 2.2, collarAt + 0.4, collarAt + 5.6, 16, P), { tone: "lo" }));
  }
  out.push(L([0.3, 0.62].map((t) => k.sideArc(x, y, r, z0 + 2.4 + (top - z0 - 2.4) * t, P, 14)).join(""), { tone: "faint" }));
  return out.join("");
}


// ---------------------------------------------------------------- rail
const RAIL = { x: -8, y: -138, w: 16, d: 160, r: 1.6 };
const RAIL_H = 4;
const RIDER_H = 7;

function rail() {
  const out = [];
  out.push(S(k.slabOf(RAIL, 0, RAIL_H, P, 3, 0.5), { tone: "mid" }));
  out.push(L(k.lineOnTop([RAIL.x + 3, RAIL.y], [RAIL.x + 3, RAIL.y + RAIL.d], RAIL_H, P), { tone: "faint" }));
  const ticks = k.topTicks(RAIL.y + 6, RAIL.y + RAIL.d - 6, 4, 5, RAIL.x + RAIL.w, RAIL_H, [-2.2, -3.4], P, "y");
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  for (const y of [RAIL.y - 5, RAIL.y + RAIL.d]) {
    out.push(S(k.slabOf({ x: RAIL.x - 3, y, w: RAIL.w + 6, d: 5, r: 1.2 }, 0, 9, P, 3, 0.5), { tone: "mid" }));
    out.push(D([at([RAIL.x + 1, y + 2.5, 9]), at([RAIL.x + RAIL.w - 1, y + 2.5, 9])], { size: 0.45 }));
  }
  return out.join("");
}

// A rider on the rail with a knurled lock knob on its +x side.
function rider(y) {
  const plan = { x: RAIL.x - 4, y: y - 10, w: RAIL.w + 8, d: 20, r: 2 };
  const out = [S(k.slabOf(plan, RAIL_H, RIDER_H, P, 4, 0.6), { tone: "mid" })];
  out.push(L(k.planOutline(k.insetPlan(plan, 2.4), RAIL_H + RIDER_H, P, 4), { tone: "faint" }));
  const knob = G.frameOf([plan.x + plan.w, y, RAIL_H + RIDER_H / 2], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 2.2, 1.4, knob, P), { tone: "mid" }));
  out.push(S(G.disc(2.2, 6.2, 3.2, knob, P), { tone: "mid" }));
  out.push(k.fadedSvg(G.ribsOf(knob, 2.2, 6.2, 3.2, 22, P, { fade: [0.05, 0.5] }), { tone: "lo" }));
  out.push(D([at([plan.x + 2.4, plan.y + 2.4, RAIL_H + RIDER_H]), at([plan.x + plan.w - 2.4, plan.y + plan.d - 2.4, RAIL_H + RIDER_H])], { size: 0.4 }));
  return out.join("");
}


// A small interface box under the right temple, cabled up to the pod.
const BOX = { x: 46, y: -60, w: 32, d: 30, r: 3 };
const BOX_H = 18;

function box() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(BOX, 0, 2, P)}" style="filter:blur(5px)"/>`);
  out.push(S(k.slabOf(BOX, 0, BOX_H, P, 5, 0.8), { tone: "mid", inner: L(k.sideSeam(BOX, 5, P, 5), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(BOX, 3), BOX_H, P, 4), { tone: "faint" }));
  // a knurled dial and two status lamps on the lid
  const dial = [BOX.x + 9, BOX.y + 9];
  out.push(S(k.cylinder(dial[0], dial[1], 5, BOX_H, 3.4, P, 32, 0.3), { tone: "mid" }));
  out.push(L(k.knurl(dial[0], dial[1], 5, BOX_H, BOX_H + 3.4, 30, P), { tone: "lo" }));
  out.push(L(k.lineOnTop([dial[0], dial[1]], [dial[0] - 3.4, dial[1] + 3.4], BOX_H + 3.4, P), { tone: "hi", free: "end" }));
  out.push(D([at([dial[0], dial[1], BOX_H + 3.4])], { size: 0.5, tone: "hi" }));
  for (const [i, x] of [[0, BOX.x + 6], [1, BOX.x + 11]]) {
    const y = BOX.y + BOX.d - 6;
    out.push(L(k.ring(x, y, 1.5, BOX_H, P, 16), { tone: "lo" }));
    out.push(`<circle class="ed-lamp" data-lamp="${i}" cx="${at([x, y, BOX_H])[0].toFixed(1)}" cy="${at([x, y, BOX_H])[1].toFixed(1)}" r="1.1"/>`);
  }
  out.push(D(k.corners(BOX, 2.6).map(([x, y]) => at([x, y, BOX_H])), { size: 0.4 }));
  // connector boss on the lid, under the pod
  out.push(S(k.cylinder(HINGE_X, CABLE_Y, 3.2, BOX_H, 3, P, 24, 0.3), { tone: "mid" }));
  return out.join("");
}
const CABLE_Y = -40;


// An optician's corner on the bare half of the base: a parts tray with spare
// nose pads and screws, and a precision screwdriver lying beside it.
const TRAY = { x: -92, y: -58, w: 28, d: 20, r: 3 };
function tools() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(TRAY, 0, 1, P)}" style="filter:blur(4px)"/>`);
  out.push(S(k.slabOf(TRAY, 0, 3.4, P, 4, 0.5), { tone: "mid" }));
  // two wells, a divider between them
  const wells = [{ x: TRAY.x + 2.4, y: TRAY.y + 2.4, w: 12.4, d: TRAY.d - 4.8, r: 2 }, { x: TRAY.x + 15.2, y: TRAY.y + 2.4, w: 12.4, d: TRAY.d - 4.8, r: 2 }];
  for (const w of wells) out.push(`<path class="iso-line" data-tone="lo" style="fill:var(--anatomy-shade-1)" d="${k.planOutline(w, 3.4, P, 3)}"/>`);
  // spare nose pads in one well, screws in the other
  for (const [x, y] of [[TRAY.x + 6, TRAY.y + 7], [TRAY.x + 10.6, TRAY.y + 12.4]]) {
    const F = G.frameAlong([x, y, 3.4 + 0.8], [0.15, -0.1, 1]);
    out.push(S(G.disc(-0.6, 0.6, 2.4, F, P, { steps: 24 }), { tone: "hi" }));
  }
  const screws = [[TRAY.x + 19, TRAY.y + 7.4], [TRAY.x + 23.4, TRAY.y + 9], [TRAY.x + 20.6, TRAY.y + 13.2]];
  for (const [x, y] of screws) {
    out.push(S(k.cylinder(x, y, 1.1, 3.4, 0.9, P, 14), { tone: "hi", crease: "lo" }));
    out.push(L(k.lineOnTop([x - 0.7, y], [x + 0.7, y], 4.3, P), { tone: "mid" }));
  }
  // the screwdriver: a fluted handle with a swivel cap, a thin shaft, a blade
  const a = [Math.cos(0.18), Math.sin(0.18), 0];
  const o = [TRAY.x - 2, TRAY.y + TRAY.d + 7, 2.6];
  const F = G.frameOf(o, a, [0, 0, 1], G.cross3(a, [0, 0, 1]));
  out.push(S(G.solidOf([[0, 1.6], [1.2, 2.6], [3, 2.6], [3, 2.2], [17, 2.2], [18.4, 1.4]], F, P), { tone: "hi", inner: k.fadedSvg(G.ribsOf(F, 3.4, 16.6, 2.2, 12, P, { fade: [0.08, 0.5] }), { tone: "lo" }) }));
  out.push(S(G.solidOf([[18.4, 0.55], [30, 0.55], [31.2, 0.3]], F, P), { tone: "mid", crease: "none" }));
  return out.join("");
}

// ---------------------------------------------------------------- the stand
function nose() {
  // nose rest: a post under the bridge, topped by a saddle the pads sit on
  const top = ZG - 26;
  put([0, 4, 0], rider(4) + post(0, 4, top, { collarAt: top - 30, screwSide: [1, 0], z0: RAIL_H + RIDER_H }), -2);
  const F = G.frameOf([0, -6, top], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const wedge = [[-7, 0], [7, 0], [3.6, 13], [-3.6, 13]];
  put([0, -2, top + 6], S(G.prismOf(F, wedge, 0, 16, P), { tone: "mid" }), -1);
  put([0, -2, top + 12], L(k.segment([0, -6, top + 13], [0, 10, top + 13], P), { tone: "faint" }), -0.9);
}

function earRest(side) {
  const x = side * HINGE_X;
  const top = ZG - TEMPLE_R - 6;
  const svg = [post(x, EAR_Y, top, { collarAt: top - 30, screwSide: [side, 0] })];
  // a V cradle on top: two jaws either side of the temple
  for (const s of [-1, 1]) {
    svg.push(S(k.slabOf({ x: x + s * 3.2 - 1.2, y: EAR_Y - 5, w: 2.4, d: 10, r: 0.8 }, top, 6 + TEMPLE_R - 0.4, P, 2, 0.3), { tone: "mid" }));
  }
  svg.push(S(k.slabOf({ x: x - 4.4, y: EAR_Y - 5, w: 8.8, d: 10, r: 1.2 }, top - 2, 2, P, 3), { tone: "mid" }));
  put([x, EAR_Y, 0], svg.join(""));
}

function eyeStand() {
  // a post behind the nose rest carries a crossbar; two cups hold the eyes
  const y = EYE_Y;
  const bar = ZG - EYE_R - 16;
  put([0, y + 3, 0], rider(y) + post(0, y, bar - 4, { collarAt: bar - 22, screwSide: [0, -1], z0: RAIL_H + RIDER_H }), -3);
  const barPlan = { x: -IPD - 7, y: y - 4, w: IPD * 2 + 14, d: 8, r: 2 };
  const svg = [S(k.slabOf(barPlan, bar - 4, 5, P, 4, 0.5), { tone: "mid" })];
  // a pupil-distance scale on the bar's top face
  const scale = k.topTicks(-IPD + 6, IPD - 6, 2, 5, y + 3.4, bar + 1, [-1.4, -2.6], P);
  svg.push(L(scale.minor, { tone: "lo" }), L(scale.major, { tone: "mid" }));
  svg.push(L(k.lineOnTop([-IPD + 6, y + 3.4], [IPD - 6, y + 3.4], bar + 1, P), { tone: "lo" }));
  svg.push(D([at([-IPD - 3.6, y, bar + 1]), at([IPD + 3.6, y, bar + 1])], { size: 0.45 }));
  put([0, y, bar - 8], svg.join(""), -2);
  for (const side of [-1, 1]) {
    const x = side * IPD;
    const cupTop = ZG - EYE_R + 2.2;
    const parts = [
      S(k.cylinder(x, y, 2.2, bar + 1, cupTop - 4 - bar - 1, P, 18), { tone: "mid", crease: "none" }),
      S(k.cylinder(x, y, 6.2, cupTop - 4, 4, P, 32, 0.3), { tone: "mid" }),
      L(k.ring(x, y, 4.6, cupTop, P, 28), { tone: "lo" }),
    ];
    put([x, y, bar + 4], parts.join(""), -1);
  }
}

// ---------------------------------------------------------------- the glasses
const lensFrame = (side) => G.frameOf([side * LX, 0, ZG], [0, 1, 0], [1, 0, 0], [0, 0, 1]);

function glasses() {
  for (const side of [-1, 1]) {
    const F = lensFrame(side);
    const centre = [side * LX, 0, ZG];
    // lens, then rim around it
    put(centre, `<g class="ed-glass">${S(G.disc(-RIM_D / 2 + 0.4, RIM_D / 2 - 0.4, LENS_R + 0.4, F, P), { tone: "hi", crease: "none" })}</g>`, -0.5);
    put(centre, S(G.ringBand(-RIM_D / 2, RIM_D / 2, LENS_R, LENS_R + RIM, F, P), { tone: "hi" }), 0.4);
    // end piece and hinge at the outer rim
    const hx = side * (LX + LENS_R + RIM - 0.6);
    const ep = { x: Math.min(hx, side * HINGE_X) - (side < 0 ? 0.4 : 0), y: -RIM_D / 2 - 6, w: Math.abs(side * HINGE_X - hx) + 0.4, d: 6 + RIM_D / 2, r: 0.8 };
    put([side * HINGE_X, -3, ZG], S(k.slabOf(ep, ZG - 2.6, 5.2, P, 2, 0.3), { tone: "hi" }), 0.6);
    const barrel = G.frameOf([side * HINGE_X, -RIM_D / 2 - 3, ZG - 4], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    put([side * HINGE_X, -5, ZG], S(G.disc(0, 8, 1.6, barrel, P), { tone: "mid" }), 0.7);
    // pad arm and nose pad on the inner rim
    const pad = [side * 9.5, -6.5, ZG - 13];
    const arm = G.fillet([[side * (LX - LENS_R - RIM * 0.4), -RIM_D / 2, ZG - 10], [side * 12, -4, ZG - 10], pad], 2.4, 6);
    for (const piece of tubePieces(arm, 0.55, P, { maxLength: 8 })) put(piece.mid, tubeSvg(piece, { tone: "mid" }), 0.2);
    const padFrame = G.frameAlong(pad, [-side * 0.8, 0.2, 0.3]);
    put(pad, S(G.disc(-0.7, 0.7, 2.6, padFrame, P), { tone: "hi" }), 0.5);
  }
  // keyhole bridge: an arch from rim to rim
  const bridge = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const a = Math.PI * (1 - t);
    bridge.push([Math.cos(a) * (LX - LENS_R - RIM * 0.5), 0, ZG + 5 + Math.sin(a) * 5]);
  }
  for (const piece of tubePieces(bridge, 1.6, P, { maxLength: 10 })) put(piece.mid, tubeSvg(piece, { tone: "hi" }), 0.5);
  // brow bar across the top, tying the rims
  for (const side of [-1, 1]) {
    const brow = [[side * (LX - 12), -0.4, ZG + LENS_R + RIM - 0.6], [side * (LX + 10), -0.4, ZG + LENS_R + RIM - 1.2]];
    for (const piece of tubePieces(brow, 0.7, P, { maxLength: 10, caps: true })) put(piece.mid, tubeSvg(piece, { tone: "mid" }), 0.9);
  }
}

// The right temple carries the computer: a pod from the hinge back.
const POD = { y0: -RIM_D / 2 - 7, y1: -50, half: [3.2, 4.6] };

function temples() {
  for (const side of [-1, 1]) {
    const x = side * HINGE_X;
    const route = [[x, -RIM_D / 2 - 6, ZG], [x, EAR_Y + 4, ZG], [x, TEMPLE_END + 2, ZG - 6], [x, TEMPLE_END - 12, ZG - 22]];
    const path = G.fillet(route, 14, 10);
    const gaps = side > 0 ? [[0, Math.abs(POD.y1 - POD.y0) + 1]] : [];
    for (const piece of tubePieces(path, TEMPLE_R, P, { maxLength: 9, gaps })) put(piece.mid, tubeSvg(piece, { tone: "hi" }), 0.8);
  }
  // the pod on the right temple: a rounded box with a seam and a button
  const x = HINGE_X;
  const F = G.frameOf([x, POD.y0, ZG], [0, -1, 0], [1, 0, 0], [0, 0, 1]);
  const [hw, hh] = POD.half;
  const section = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    section.push([Math.sign(c) * Math.pow(Math.abs(c), 0.5) * hw, Math.sign(s) * Math.pow(Math.abs(s), 0.5) * hh]);
  }
  const length = POD.y0 - POD.y1;
  put([x, (POD.y0 + POD.y1) / 2, ZG], `<g data-part="pod">${S(G.prismOf(F, section, 0, length, P), { tone: "hi", inner: L(k.segment([x + hw, POD.y0 - 8, ZG + hh * 0.2], [x + hw, POD.y1 + 3, ZG + hh * 0.2], P), { tone: "faint", free: true }) })}</g>`, 1.4);
  put([x + hw, POD.y1 + 8, ZG + 1], S(k.cylinder(x + hw + 0.4, POD.y1 + 8, 1.2, ZG + hh - 0.2, 0.9, P, 14), { tone: "mid" }), 1.6);
  // the cable from the interface box rises to a plug under the pod
  const plug = G.frameOf([x, CABLE_Y, ZG - hh - 3.4], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  put([x, CABLE_Y, ZG - hh - 2], S(G.disc(0, 3.4, 1.8, plug, P), { tone: "mid" }), 1.2);
  const cable = [[x, CABLE_Y, BOX_H + 3], [x, CABLE_Y, ZG - hh - 3.4]];
  for (const piece of tubePieces(cable, 0.9, P, { maxLength: 12 })) put(piece.mid, tubeSvg(piece, { tone: "mid" }), 1.1);
}

// The display window, drawn in the plane of the right lens's inner face.
function displayMatrix() {
  const o = at([LX, LENS_BACK, ZG]);
  const u = at([LX - 1, LENS_BACK, ZG]); // screen-right runs along -x from behind
  const v = at([LX, LENS_BACK, ZG - 1]);
  const m = [u[0] - o[0], u[1] - o[1], v[0] - o[0], v[1] - o[1], o[0], o[1]].map((n) => Math.round(n * 1e4) / 1e4);
  return `matrix(${m.join(" ")})`;
}

function display() {
  // In the matrix's local space, +u runs toward the outer edge (the wearer's
  // right) and +v runs down. The window sits up and out.
  const { u, v, w, h } = DISPLAY;
  const x0 = -u - w / 2;
  const y0 = -v - h / 2;
  return `<g data-part="display" transform="${displayMatrix()}">
<clipPath id="ed-lens"><circle cx="0" cy="0" r="${LENS_R}"/></clipPath>
<g clip-path="url(#ed-lens)">
<rect class="ed-glow" x="${x0 - 4}" y="${y0 - 4}" width="${w + 8}" height="${h + 8}" rx="5" fill="url(#ed-glow)"/>
<rect class="ed-window" x="${x0}" y="${y0}" width="${w}" height="${h}" rx="1.1"/>
<g class="ed-screen">
<text class="ed-time" x="${x0 + 1.5}" y="${y0 + 4.9}">9:41</text>
<path class="ed-rule" d="M${x0 + 1.4} ${y0 + h - 1.6}h${w - 2.8}"/>
<path class="ed-bar" d="M${x0 + 1.4} ${y0 + h - 1.6}h${(w - 2.8) * 0.38}"/>
<circle class="ed-dot" cx="${x0 + w - 1.8}" cy="${y0 + 2.8}" r=".7"/>
</g>
</g>
</g>`;
}

// ---------------------------------------------------------------- eyes
const EYES = [-1, 1].map((side) => [side * IPD, EYE_Y, ZG]);

const display0 = display();

export default {
  id: "ed1th",
  fig: "Fig 1",
  title: "ED1TH fitting stand",
  hint: "Look around",
  width: WIDTH,
  height: HEIGHT,
  label:
    "A pair of round glasses on a fitting stand, seen from the wearer's side. A nose rest and two ear rests hold the frame, two model eyes on cups sit where a wearer's eyes would be, a small computer pod rides the right temple, and a small display window sits in the upper outer corner of the right lens.",
  stage: { role: "group", label: "ED1TH fitting stand. Move the pointer or use the arrow keys to turn the model eyes; Enter glances into the corner of the right lens.", attrs: {} },
  css: `
#fig-ed1th{--ed-light:#18181a;--ed-glass:#ececea;--ed-window:#ffffff}
[data-theme="dark"] #fig-ed1th{--ed-light:#ededea;--ed-glass:#1c1c1c;--ed-window:#0b0b0b}
#fig-ed1th .ed-glass .iso-fill{fill:var(--ed-glass);fill-opacity:.42}
#fig-ed1th .ed-glass .iso-shade,#fig-ed1th .ed-glass .iso-top{opacity:.35}
#fig-ed1th .ed-glass .iso-edge{stroke:var(--anatomy-mid)}
#fig-ed1th .ed-window{fill:var(--ed-window);fill-opacity:calc(.06 + var(--on,0) * .5);stroke:var(--ed-light);stroke-width:.25;stroke-opacity:calc(.25 + var(--on,0) * .6)}
#fig-ed1th .ed-glow{opacity:calc(var(--on,0) * .9)}
#fig-ed1th .ed-screen{opacity:calc(.08 + var(--on,0) * .92)}
#fig-ed1th .ed-time{font:600 4.3px/1 var(--anatomy-mono);fill:var(--ed-light);letter-spacing:.02em}
#fig-ed1th .ed-rule{stroke:var(--ed-light);stroke-opacity:.3;stroke-width:.35;fill:none}
#fig-ed1th .ed-bar{stroke:var(--ed-light);stroke-width:.5;fill:none;stroke-linecap:round}
#fig-ed1th .ed-dot{fill:var(--ed-light)}
#fig-ed1th .ed-gaze{stroke:var(--anatomy-mid);stroke-width:.6;stroke-dasharray:2 2.4;fill:none}
#fig-ed1th .ed-gaze[data-on]{stroke:var(--ed-light)}
#fig-ed1th .ed-hit{fill:var(--anatomy-mid)}
#fig-ed1th .ed-hit[data-on]{fill:var(--ed-light)}
#fig-ed1th .ed-lamp{fill:var(--anatomy-lo)}
#fig-ed1th .ed-lamp[data-lamp="1"]{fill:var(--ed-light);opacity:calc(.25 + var(--on,0) * .75)}
`,
  build() {
    nose();
    earRest(-1);
    earRest(1);
    eyeStand();
    glasses();
    temples();
    put([BOX.x + BOX.w / 2, BOX.y + BOX.d / 2, 0], box(), -6);
    put([TRAY.x + TRAY.w / 2, TRAY.y, 0], tools(), -40);
    // live slots: gaze lines behind the eyes, eyes, display on the right lens
    const slots = [];
    EYES.forEach((eye, index) => {
      put([eye[0], eye[1] + EYE_R * 0.6, eye[2]], `<g data-part="gaze-${index}"></g>`, 0.05);
      put(eye, `<g data-part="eye-${index}"></g>`, 0);
    });
    put([LX, LENS_BACK - 0.5, ZG], display0, 0.45);
    items.sort((a, b) => a.key - b.key);
    const defs = `<defs><radialGradient id="ed-glow"><stop offset="0" stop-color="var(--ed-light)" stop-opacity=".55"/><stop offset=".55" stop-color="var(--ed-light)" stop-opacity=".18"/><stop offset="1" stop-color="var(--ed-light)" stop-opacity="0"/></radialGradient></defs>`;
    const svg = defs + base() + rail() + items.map((item) => item.svg).join("");
    const lensHit = { x: LX, y: LENS_BACK, z: ZG };
    return {
      svg,
      readout: "gaze ahead · display quiet",
      data: { P, EYES, EYE_R, LENS_BACK, LX, ZG, DISPLAY, LENS_R, lensHit },
    };
  },
  live(root, rt, D) {
    const stage = root.querySelector(".iso-stage");
    const svg = stage.querySelector("svg");
    const readout = root.querySelector("[data-readout]");
    const shown = svg.querySelector('[data-part="display"]');
    const eyes = [0, 1].map((i) => svg.querySelector(`[data-part="eye-${i}"]`));
    const gazes = [0, 1].map((i) => svg.querySelector(`[data-part="gaze-${i}"]`));
    const deg = Math.PI / 180;
    const dirOf = (yaw, pitch) => [Math.sin(yaw) * Math.cos(pitch), Math.cos(yaw) * Math.cos(pitch), Math.sin(pitch)];
    // the display window's centre, seen from the right eye, as yaw and pitch
    const right = D.EYES[1];
    const target = [D.LX + D.DISPLAY.u, D.LENS_BACK, D.ZG + D.DISPLAY.v];
    const toTarget = [target[0] - right[0], target[1] - right[1], target[2] - right[2]];
    const CORNER = { yaw: Math.atan2(toTarget[0], toTarget[1]), pitch: Math.atan2(toTarget[2], Math.hypot(toTarget[0], toTarget[1])) };
    const gaze = { yaw: 0, pitch: 0 };
    let want = { yaw: 0, pitch: 0 };
    let on = 0;
    let last = "";
    const hitOf = (eye, dir) => {
      const t = (D.LENS_BACK - eye[1]) / dir[1];
      return [eye[0] + dir[0] * t, D.LENS_BACK, eye[2] + dir[2] * t];
    };
    const inWindow = (p) => {
      const u = p[0] - D.LX;
      const v = p[2] - D.ZG;
      return Math.abs(u - D.DISPLAY.u) <= D.DISPLAY.w / 2 + 1.5 && Math.abs(v - D.DISPLAY.v) <= D.DISPLAY.h / 2 + 1.5;
    };
    function draw() {
      const dir = dirOf(gaze.yaw, gaze.pitch);
      D.EYES.forEach((eye, i) => {
        const front = [eye[0] + dir[0] * D.EYE_R, eye[1] + dir[1] * D.EYE_R, eye[2] + dir[2] * D.EYE_R];
        const hit = hitOf(eye, dir);
        const looking = i === 1 && inWindow(hit);
        const a = iso(front, D.P);
        const b = iso(hit, D.P);
        gazes[i].innerHTML = `<path class="ed-gaze"${looking ? " data-on" : ""} d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}"/><circle class="ed-hit"${looking ? " data-on" : ""} cx="${b[0].toFixed(1)}" cy="${b[1].toFixed(1)}" r=".9"/>`;
        // the eye: cornea (a small cap ahead of the ball), the ball, and the
        // optic nerve leaving the back, which is what we see from behind
        const cornea = G.sphereOf([eye[0] + dir[0] * (D.EYE_R - 4.2), eye[1] + dir[1] * (D.EYE_R - 4.2), eye[2] + dir[2] * (D.EYE_R - 4.2)], 6.4, D.P, { steps: 36 });
        const ball = G.sphereOf(eye, D.EYE_R, D.P, { steps: 56 });
        const back = [-dir[0], -dir[1], -dir[2]];
        const nerveFrame = G.frameAlong([eye[0] + back[0] * (D.EYE_R - 1.2), eye[1] + back[1] * (D.EYE_R - 1.2), eye[2] + back[2] * (D.EYE_R - 1.2)], back);
        const nerve = G.disc(0, 3.4, 2.4, nerveFrame, D.P, { steps: 28 });
        const nerveVisible = G.dot3(back, G.viewOf(D.P)) > 0;
        const parts = [solidSvg(cornea, { tone: "hi" }), solidSvg(ball, { tone: "hi" })];
        if (nerveVisible) parts.push(solidSvg(nerve, { tone: "mid" }));
        else parts.unshift(solidSvg(nerve, { tone: "mid" }));
        eyes[i].innerHTML = parts.join("");
      });
      shown.style.setProperty("--on", on.toFixed(3));
      const yawText = Math.abs(gaze.yaw / deg) < 0.5 ? "" : Math.abs(gaze.yaw / deg).toFixed(0) + "° " + (gaze.yaw > 0 ? "right" : "left");
      const pitchText = Math.abs(gaze.pitch / deg) < 0.5 ? "" : Math.abs(gaze.pitch / deg).toFixed(0) + "° " + (gaze.pitch > 0 ? "up" : "down");
      const where = [yawText, pitchText].filter(Boolean).join(", ") || "ahead";
      const text = "gaze " + where + " · display " + (on > 0.5 ? "on" : "quiet");
      rt.say(readout, text);
      const state = on > 0.5 ? "on" : "quiet";
      if (state !== last) {
        last = state;
        stage.setAttribute("aria-valuetext", "Display " + state);
      }
    }
    // the tour: ahead, a glance into the corner, a look across, back
    const TOUR = [
      [0, 0, 1.6],
      [CORNER.yaw, CORNER.pitch, 2.6],
      [CORNER.yaw * 0.2, -6 * deg, 1.4],
      [-18 * deg, 4 * deg, 1.6],
      [CORNER.yaw, CORNER.pitch, 2.2],
      [0, 0, 1.2],
    ];
    const total = TOUR.reduce((sum, step) => sum + step[2], 0);
    const tourAt = (clock) => {
      let t = clock % total;
      for (const [yaw, pitch, hold] of TOUR) {
        if (t < hold) return { yaw, pitch };
        t -= hold;
      }
      return { yaw: 0, pitch: 0 };
    };
    const tour = rt.tour(stage, { onResume: () => run.kick() });
    const run = rt.loop(stage, (dt, calm) => {
      tour.advance(dt);
      if (tour.active) want = tourAt(tour.clock);
      gaze.yaw = rt.follow(gaze.yaw, want.yaw, dt, 0.16, calm);
      gaze.pitch = rt.follow(gaze.pitch, want.pitch, dt, 0.16, calm);
      const looking = inWindow(hitOf(D.EYES[1], dirOf(gaze.yaw, gaze.pitch)));
      on = rt.follow(on, looking ? 1 : 0, dt, looking ? 0.12 : 0.5, calm);
      draw();
      return tour.running || gaze.yaw !== want.yaw || gaze.pitch !== want.pitch || (on !== 0 && on !== 1);
    });
    const steer = (yaw, pitch) => {
      tour.hold();
      want = { yaw: rt.clamp(yaw, -32 * deg, 32 * deg), pitch: rt.clamp(pitch, -24 * deg, 24 * deg) };
      run.kick();
    };
    stage.addEventListener("pointermove", (event) => {
      const [fx, fy] = rt.fractionOf(svg, event);
      // the pointer is a point in front of the face: left of centre looks left
      steer((0.5 - fx) * 64 * deg, (0.5 - fy) * 48 * deg);
    });
    stage.addEventListener("pointerdown", (event) => {
      const [fx, fy] = rt.fractionOf(svg, event);
      steer((0.5 - fx) * 64 * deg, (0.5 - fy) * 48 * deg);
    });
    stage.addEventListener("keydown", (event) => {
      const step = (event.shiftKey ? 10 : 4) * deg;
      let { yaw, pitch } = want;
      if (event.key === "ArrowLeft") yaw += step;
      else if (event.key === "ArrowRight") yaw -= step;
      else if (event.key === "ArrowUp") pitch += step;
      else if (event.key === "ArrowDown") pitch -= step;
      else if (event.key === "Enter" || event.key === " ") ({ yaw, pitch } = CORNER);
      else if (event.key === "Home" || event.key === "Escape") yaw = pitch = 0;
      else return;
      event.preventDefault();
      steer(yaw, pitch);
    });
    draw();
  },
};
