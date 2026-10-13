// Fig. IV · SimonComputing. A small production line: an indexing belt feeds
// five sheets from a sprung feeder past an inspection gauge and a stamp
// press into an out-tray. A sheet is measured before it is stamped, and
// every stamp moves the revision counter on the press: five passes take it
// from rev 02 to rev 07.
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../../kit/tube.mjs";

const WIDTH = 600;
const HEIGHT = 380;
const AZIMUTH = 31;

const BELT_Z = 40; // belt top
const HALF = 17; // belt half-width (x)
const Y_FEED = 104; // feeder centre
const Y_MEASURE = 46;
const Y_STAMP = -14;
const Y_EXIT = -74;
const Y_OUT = -122; // out-tray centre
const ROLL = { y0: -90, y1: 90, r: 4.2 };
const SHEET = { w: 24, d: 30, t: 2 };
const SHEETS = 5;
const STEP = Y_FEED - Y_MEASURE; // one index moves a sheet one station
const REV0 = 2;
const STAMP_TOP = 88;

const BASE = { x: -44, y: -150, w: 88, d: 290, r: 7 };
const MOTOR = { x: HALF + 7, y: ROLL.y1 + 10, z: BELT_Z - 22, r: 7 };
const PULLEY = { x0: HALF + 23.6, x1: HALF + 25.6, motor: 3, roller: 3.6 };
const LAMP = { x: -29, y: 124, z: 22, tier: 5.6, r: 4 };

const P = k.fitProjection([...k.boxCorners(BASE, -12, 0), [0, Y_STAMP, STAMP_TOP + 16], [0, Y_MEASURE, STAMP_TOP], [LAMP.x, LAMP.y, LAMP.z + 20]], WIDTH, HEIGHT, { pad: 26, azimuth: AZIMUTH });

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const r1 = (n) => Math.round(n * 10) / 10;
const depth = (p) => k.depthOf(p, P);

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, -12, 8, P)}"/>`];
  out.push(S(k.slabOf(BASE, -8, 8, P, 7, 1.2), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: "faint" }));
  const screws = k.corners(BASE, 9);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  // floor markings: a walkway line along the near edge
  const strip = { x: BASE.x + BASE.w - 12, y: BASE.y + 14, w: 6, d: BASE.d - 28, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.y + 4, strip.y + strip.d - 4, 6, 5, strip.x + strip.w, 0.6, [-2, -3.6], P, "y");
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  return out.join("");
}

// The frame: legs, braces and two side rails carrying the rollers.
function frameFar() {
  const out = [];
  const legs = [ROLL.y0 + 8, 0, ROLL.y1 - 8];
  for (const y of legs) {
    out.push(S(k.slabOf({ x: -HALF - 7, y: y - 2.5, w: 5, d: 5, r: 0.8 }, 0, BELT_Z - 4, P, 2), { tone: "mid" }));
    out.push(S(k.slabOf({ x: -HALF - 9, y: y - 4.5, w: 9, d: 9, r: 1.2 }, 0, 2, P, 3), { tone: "lo" }));
  }
  out.push(S(k.slabOf({ x: -HALF - 6.5, y: ROLL.y0 + 8, w: 4, d: ROLL.y1 - ROLL.y0 - 16, r: 0.6 }, 12, 3, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -HALF - 7, y: ROLL.y0 - 6, w: 5, d: ROLL.y1 - ROLL.y0 + 12, r: 1 }, BELT_Z - 6, 8, P, 3, 0.5), { tone: "mid" }));
  return out.join("");
}

function frameNear() {
  const out = [];
  const legs = [ROLL.y0 + 8, 0, ROLL.y1 - 8];
  // cross braces under the belt
  for (const y of legs) out.push(S(k.slabOf({ x: -HALF - 4, y: y - 1.5, w: HALF * 2 + 8, d: 3, r: 0.5 }, 12, 3, P, 2), { tone: "mid" }));
  for (const y of legs) {
    out.push(S(k.slabOf({ x: HALF + 2, y: y - 4.5, w: 9, d: 9, r: 1.2 }, 0, 2, P, 3), { tone: "lo" }));
    out.push(S(k.slabOf({ x: HALF + 2, y: y - 2.5, w: 5, d: 5, r: 0.8 }, 0, BELT_Z - 4, P, 2), { tone: "mid" }));
  }
  out.push(S(k.slabOf({ x: HALF + 2.5, y: ROLL.y0 + 8, w: 4, d: ROLL.y1 - ROLL.y0 - 16, r: 0.6 }, 12, 3, P, 2), { tone: "mid" }));
  const rail = { x: HALF + 2, y: ROLL.y0 - 6, w: 5, d: ROLL.y1 - ROLL.y0 + 12, r: 1 };
  out.push(S(k.slabOf(rail, BELT_Z - 6, 8, P, 3, 0.5), { tone: "mid" }));
  // bearing blocks for the roller axles, with screws
  for (const y of [ROLL.y0, ROLL.y1]) {
    out.push(S(k.slabOf({ x: HALF + 7, y: y - 5, w: 5, d: 10, r: 1 }, BELT_Z - 9, 8, P, 2, 0.4), { tone: "mid" }));
    const F = G.frameOf([HALF + 12, y, BELT_Z - ROLL.r], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
    out.push(S(G.disc(0, 1.6, 2.2, F, P, { steps: 24 }), { tone: "hi" }));
    out.push(D([at([HALF + 12, y - 3.2, BELT_Z - 1.6]), at([HALF + 12, y + 3.2, BELT_Z - 1.6])], { size: 0.4 }));
  }
  // the motor on the feed end, on a foot, belted to the roller by a round belt
  out.push(S(k.slabOf({ x: MOTOR.x + 0.6, y: MOTOR.y - 6, w: 7, d: 12, r: 1 }, 0, 2, P, 3, 0.4), { tone: "lo" }));
  out.push(S(k.slabOf({ x: MOTOR.x + 2, y: MOTOR.y - 3, w: 4.4, d: 6, r: 0.6 }, 2, MOTOR.z - MOTOR.r - 1.6, P, 2), { tone: "mid" }));
  const mF = G.frameOf([MOTOR.x, MOTOR.y, MOTOR.z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 14, MOTOR.r, mF, P), { tone: "mid" }));
  out.push(k.fadedSvg(G.ribsOf(mF, 2, 12, MOTOR.r, 20, P, { fade: [0.05, 0.5], seams: true }), { tone: "lo" }));
  out.push(S(G.disc(14, 16, 4, mF, P), { tone: "mid" }));
  out.push(S(G.disc(16, PULLEY.x1 - MOTOR.x, PULLEY.motor, mF, P, { steps: 28 }), { tone: "mid" }));
  // the roller's axle runs out past its bearing to the driven pulley
  const aF = G.frameOf([HALF + 12, ROLL.y1, BELT_Z - ROLL.r], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  out.push(S(G.disc(1.6, PULLEY.x0 - HALF - 12, 0.9, aF, P, { steps: 16 }), { tone: "mid", crease: "none" }));
  out.push(S(G.disc(PULLEY.x0 - HALF - 12, PULLEY.x1 - HALF - 12, PULLEY.roller, aF, P, { steps: 28 }), { tone: "mid" }));
  const pins = [[MOTOR.y, MOTOR.z], [ROLL.y1, BELT_Z - ROLL.r]];
  out.push(D(pins.map(([y, z]) => at([PULLEY.x1, y, z])), { size: 0.4 }));
  // the belt: the hull of the two pulley rims, in the pulleys' mid-plane
  const rim = (c, r) => Array.from({ length: 48 }, (_, i) => [c[0] + Math.cos((i / 48) * Math.PI * 2) * r, c[1] + Math.sin((i / 48) * Math.PI * 2) * r]);
  const loop = G.hullOf([...rim(pins[0], PULLEY.motor + 0.3), ...rim(pins[1], PULLEY.roller + 0.3)]);
  const bx = (PULLEY.x0 + PULLEY.x1) / 2;
  for (const piece of tubePieces(loop.map(([y, z]) => [bx, y, z]), 0.5, P, { closed: true, maxLength: 8, spacing: 0.5 })) out.push(tubeSvg(piece, { tone: "mid" }));
  return out.join("");
}

// A stack light on the far corner of the feed end: running, stamping, shipped.
function stackLight() {
  const { x, y } = LAMP;
  const out = [];
  out.push(S(k.slabOf({ x: x - 5.5, y: y - 5.5, w: 11, d: 11, r: 1.4 }, 0, 2, P, 3, 0.4), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 3.4, 2, 2.4, P, 24, 0.3), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, 1.3, 4.4, LAMP.z - 5.6, P, 14), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(x, y, LAMP.r + 0.4, LAMP.z - 1.2, 1.2, P, 28, 0.3), { tone: "mid" }));
  for (let i = 0; i < 3; i++) {
    const z = LAMP.z + i * (LAMP.tier + 0.8);
    out.push(`<g data-lamp="${i}">${S(k.cylinder(x, y, LAMP.r, z, LAMP.tier, P, 28), { tone: "mid", className: "pl-lamp" })}</g>`);
    out.push(S(k.cylinder(x, y, LAMP.r + 0.3, z + LAMP.tier, 0.8, P, 28, 0.2), { tone: "mid" }));
  }
  const top = LAMP.z + 3 * (LAMP.tier + 0.8);
  out.push(S(G.solidOf([[0, LAMP.r], [0.9, LAMP.r - 0.2, 1], [1.8, LAMP.r - 1.2, 1], [2.4, 0]], G.frameOf([x, y, top], [0, 0, 1], [1, 0, 0], [0, 1, 0]), P), { tone: "mid" }));
  return out.join("");
}

function belt() {
  const out = [];
  // rollers under the ends, the belt wrapping them
  for (const y of [ROLL.y0, ROLL.y1]) {
    const F = G.frameOf([-HALF - 1, y, BELT_Z - ROLL.r], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
    out.push(S(G.disc(0, HALF * 2 + 2, ROLL.r, F, P), { tone: "mid" }));
  }
  const plan = { x: -HALF, y: ROLL.y0, w: HALF * 2, d: ROLL.y1 - ROLL.y0, r: 0 };
  out.push(S(k.slabOf(plan, BELT_Z - 1.6, 1.6, P, 2), { tone: "lo", crease: "faint" }));
  // side guides on the belt edges
  for (const x of [-HALF - 2, HALF]) out.push(S(k.slabOf({ x, y: ROLL.y0 + 4, w: 2, d: ROLL.y1 - ROLL.y0 - 8, r: 0.5 }, BELT_Z, 3, P, 2, 0.3), { tone: "mid" }));
  out.push(`<g data-part="cleats"></g>`);
  return out.join("");
}

// The feeder at the head and the out-tray at the tail.
function tray(y, z, near) {
  const out = [];
  const plan = { x: -SHEET.w / 2 - 4, y: y - SHEET.d / 2 - 4, w: SHEET.w + 8, d: SHEET.d + 8, r: 2 };
  if (!near) {
    out.push(S(k.slabOf(plan, z - 2, 2, P, 3, 0.4), { tone: "mid" }));
    out.push(S(k.slabOf({ ...plan, w: 2 }, z, 9, P, 2), { tone: "mid" }));
    out.push(S(k.slabOf({ ...plan, d: 2 }, z, 9, P, 2), { tone: "mid" }));
  } else {
    out.push(S(k.slabOf({ ...plan, y: plan.y + plan.d - 2, d: 2 }, z, 9, P, 2), { tone: "mid" }));
    out.push(S(k.slabOf({ ...plan, x: plan.x + plan.w - 2, w: 2 }, z, 9, P, 2, 0.3), { tone: "mid" }));
  }
  return out.join("");
}

function trayStand(y, top) {
  const out = [];
  out.push(S(k.slabOf({ x: -8, y: y - 8, w: 16, d: 16, r: 2 }, 0, 3, P, 3, 0.4), { tone: "lo" }));
  out.push(S(k.cylinder(0, y, 3.4, 3, top - 5, P, 24), { tone: "mid", crease: "none" }));
  out.push(L([0.4, 0.7].map((t) => k.sideArc(0, y, 3.4, 3 + (top - 5) * t, P, 14)).join(""), { tone: "faint" }));
  return out.join("");
}

// A gantry: two posts and a crossbar at a station.
function gantryPost(x, y, top) {
  const out = [];
  out.push(S(k.slabOf({ x: x - 4, y: y - 4, w: 8, d: 8, r: 1.2 }, 0, 2.4, P, 3, 0.4), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 2.6, 2.4, top - 2.4, P, 22), { tone: "mid", crease: "none" }));
  out.push(L(k.sideArc(x, y, 2.6, BELT_Z + 6, P, 12), { tone: "faint" }));
  return out.join("");
}

const GX = HALF + 9; // gantry posts sit outside the frame
function gaugeHead() {
  // inspection: a crossbar with a dial gauge face up, its plunger down
  const top = STAMP_TOP - 12;
  const out = [];
  out.push(S(k.slabOf({ x: -GX - 3, y: Y_MEASURE - 3, w: GX * 2 + 6, d: 6, r: 1.2 }, top, 5, P, 3, 0.5), { tone: "mid" }));
  out.push(S(k.cylinder(0, Y_MEASURE, 2.4, top - 10, 10, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(0, Y_MEASURE, 11, top + 5, 7, P, 56, 0.6), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(0, Y_MEASURE, 11, top + 9.4, top + 12, 60, P, 0.3), { tone: "lo" }));
  out.push(L(k.ring(0, Y_MEASURE, 9, top + 12, P, 56), { tone: "lo" }));
  const t = k.radialTicks(0, Y_MEASURE, 8.6, 40, 5, top + 12, [1.1, 2.2], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(D([at([-GX, Y_MEASURE, top + 5]), at([GX, Y_MEASURE, top + 5])], { size: 0.45 }));
  return out.join("");
}

function pressHead() {
  // the stamp press: a crosshead block with the gland the ram slides from,
  // and the revision counter on its near face
  const out = [];
  const head = { x: -GX - 3, y: Y_STAMP - 7, w: GX * 2 + 6, d: 14, r: 2 };
  out.push(S(k.slabOf(head, STAMP_TOP, 12, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(head, STAMP_TOP + 4, P, 4), { tone: "faint" }) }));
  out.push(S(k.cylinder(0, Y_STAMP, 6.4, STAMP_TOP - 3, 3, P, 32, 0.4), { tone: "mid" }));
  // the cylinder on top that drives the ram
  out.push(S(k.cylinder(0, Y_STAMP, 7, STAMP_TOP + 12, 9, P, 36, 0.6), { tone: "mid" }));
  out.push(L(k.sideArc(0, Y_STAMP, 7, STAMP_TOP + 17, P, 18), { tone: "faint" }));
  out.push(S(k.cylinder(0, Y_STAMP, 4, STAMP_TOP + 21, 3, P, 24, 0.3), { tone: "mid" }));
  out.push(D([at([-GX, Y_STAMP, STAMP_TOP + 12]), at([GX, Y_STAMP, STAMP_TOP + 12])], { size: 0.45 }));
  // counter box on the near (+x) face
  const box = { x: GX + 3, y: Y_STAMP - 7, w: 6, d: 14, r: 1 };
  out.push(S(k.slabOf(box, STAMP_TOP + 1.5, 9, P, 2, 0.4), { tone: "mid" }));
  const fx = box.x + box.w;
  const win = [[Y_STAMP + 5, STAMP_TOP + 3.4], [Y_STAMP - 5, STAMP_TOP + 3.4], [Y_STAMP - 5, STAMP_TOP + 8.8], [Y_STAMP + 5, STAMP_TOP + 8.8]];
  out.push(`<path class="iso-line" data-tone="mid" d="${k.pathOf(win.map(([y, z]) => at([fx, y, z])), true)}" style="fill:var(--pl-window)"/>`);
  const c = at([fx, Y_STAMP, STAMP_TOP + 4.6]);
  out.push(`<text class="pl-count" data-part="rev" x="${r1(c[0])}" y="${r1(c[1])}" transform="${faceSkew(fx, c)}">${String(REV0).padStart(2, "0")}</text>`);
  return out.join("");
}

function faceSkew(fx, [x, y]) {
  const o = at([fx, 0, 0]);
  const u = at([fx, -1, 0]);
  const v = at([fx, 0, -1]);
  const a = [u[0] - o[0], u[1] - o[1]];
  const b = [v[0] - o[0], v[1] - o[1]];
  const n = Math.hypot(...a);
  const m = Math.hypot(...b);
  return `translate(${r1(x)} ${r1(y)}) matrix(${(a[0] / n).toFixed(4)} ${(a[1] / n).toFixed(4)} ${(b[0] / m).toFixed(4)} ${(b[1] / m).toFixed(4)} 0 0) translate(${-r1(x)} ${-r1(y)})`;
}

// A sheet built at its rest corner (0,0,0), moved with translateAlong.
function sheetSvg(i) {
  const plan = { x: -SHEET.w / 2, y: -SHEET.d / 2, w: SHEET.w, d: SHEET.d, r: 0.6 };
  const out = [S(k.slabOf(plan, 0, SHEET.t, P, 2, 0.3), { tone: "hi", crease: "lo" })];
  const rule = (y, x0, x1) => k.lineOnTop([x0, y], [x1, y], SHEET.t, P);
  out.push(L([rule(-SHEET.d / 2 + 5, -8, 6 - (i % 3) * 2), rule(-SHEET.d / 2 + 8, -8, 8), rule(-SHEET.d / 2 + 11, -8, 3 + (i % 2) * 3)].join(""), { tone: "faint", free: true }));
  // the stamp: a square seal, hidden until stamped
  const sq = { x: -2, y: 2, w: 9, d: 9, r: 1 };
  out.push(`<g class="pl-mark">${L(k.planOutline(sq, SHEET.t, P, 2), { tone: "hi" })}${L(k.planOutline(k.insetPlan(sq, 1.6), SHEET.t, P, 2), { tone: "hi" })}</g>`);
  return out.join("");
}

export default {
  id: "simon",
  fig: "Fig 4",
  title: "Production line",
  hint: "Hover to run the line",
  width: WIDTH,
  height: HEIGHT,
  label:
    "A small production line: a belt conveyor on a frame, fed from a sprung stack of five sheets, carries each sheet under an inspection gauge and then a stamp press into an out-tray. A two-digit counter on the press shows the revision, and a three-tier stack light on the far corner shows the line running, the stamp coming down, and the batch shipped.",
  stage: { role: "group", label: "Production line. Space or Enter runs one pass, Home starts over.", attrs: { "aria-valuetext": "rev 02, 0 of 5 shipped" } },
  css: `
#fig-simon .iso-stage{cursor:pointer}
#fig-simon{--pl-window:#26262a;--pl-digit:#f4f4f1;--pl-glow:#3a3a3f}
[data-theme="dark"] #fig-simon{--pl-window:#050505;--pl-digit:#e6e6e6;--pl-glow:#ededea}
#fig-simon .pl-lamp>path{transition:fill .2s}
#fig-simon [data-on] .pl-lamp>.iso-fill,#fig-simon [data-on] .pl-lamp>.iso-shade,#fig-simon [data-on] .pl-lamp>.iso-top{fill:var(--pl-glow)}
#fig-simon .pl-count{font:600 4.4px/1 var(--anatomy-mono);fill:var(--pl-digit);text-anchor:middle}
#fig-simon .pl-mark{opacity:0}
#fig-simon [data-stamped] .pl-mark{opacity:1}
`,
  build() {
    const feedTop = BELT_Z;
    const outZ = 14;
    const layers = {
      under: [base(), stackLight(), trayStand(Y_FEED, feedTop - 2), trayStand(Y_OUT, outZ - 2), frameFar(), belt(), tray(Y_FEED, feedTop - SHEETS * SHEET.t, false), tray(Y_OUT, outZ, false)].join(""),
      farPosts: [gantryPost(-GX, Y_MEASURE, STAMP_TOP - 12), gantryPost(-GX, Y_STAMP, STAMP_TOP)].join(""),
      near: [frameNear(), tray(Y_FEED, feedTop - SHEETS * SHEET.t, true), tray(Y_OUT, outZ, true), gantryPost(GX, Y_MEASURE, STAMP_TOP - 12), gantryPost(GX, Y_STAMP, STAMP_TOP)].join(""),
      heads: [gaugeHead(), pressHead()].join(""),
    };
    // ram and probe: built at rest, moved in z
    const ram = [S(k.cylinder(0, Y_STAMP, 2.6, STAMP_TOP - 34, 34, P, 24), { tone: "hi", crease: "none", lit: true }), S(k.slabOf({ x: -5.5, y: Y_STAMP - 5.5, w: 11, d: 11, r: 1.4 }, STAMP_TOP - 38, 4, P, 3, 0.5), { tone: "hi", lit: true })].join("");
    const probe = [S(k.cylinder(0, Y_MEASURE, 1.1, BELT_Z + 1, STAMP_TOP - 22 - BELT_Z - 1, P, 16), { tone: "hi", crease: "none" }), S(k.cylinder(0, Y_MEASURE, 2, BELT_Z, 1.4, P, 18), { tone: "hi" })].join("");
    const sheets = Array.from({ length: SHEETS }, (_, i) => `<g data-sheet="${i}"><g data-move>${sheetSvg(i)}</g></g>`).join("");
    const needleTop = STAMP_TOP - 12 + 12.2;
    const svg = [
      layers.under,
      layers.farPosts,
      `<g data-layer="sheets">${sheets}</g>`,
      `<g data-part="probe">${probe}</g>`,
      `<g data-part="ram">${ram}</g>`,
      layers.near,
      layers.heads,
      `<path class="iso-line" data-tone="lit" data-free="start" data-part="needle" d="" style="stroke-width:1"/>`,
    ].join("");
    return {
      svg,
      readout: `rev ${String(REV0).padStart(2, "0")} · 0 of ${SHEETS} shipped`,
      data: { P, SHEETS, SHEET, BELT_Z, Y_FEED, Y_MEASURE, Y_STAMP, Y_EXIT, Y_OUT, STEP, REV0, feedTop, outZ, HALF, ROLL, needleTop, stampDrop: STAMP_TOP - 38 - (BELT_Z + SHEET.t) },
    };
  },
  live(root, rt, D) {
    const stage = root.querySelector(".iso-stage");
    const svg = stage.querySelector("svg");
    const readout = root.querySelector("[data-readout]");
    const sheetEls = [...svg.querySelectorAll("[data-sheet]")];
    const layer = svg.querySelector('[data-layer="sheets"]');
    const ram = svg.querySelector('[data-part="ram"]');
    const probe = svg.querySelector('[data-part="probe"]');
    const needle = svg.querySelector('[data-part="needle"]');
    const rev = svg.querySelector('[data-part="rev"]');
    const cleats = svg.querySelector('[data-part="cleats"]');
    const lamps = [...svg.querySelectorAll("[data-lamp]")];
    // Each sheet has a slot on the line: -1 in the feeder, 0..3 the belt
    // stations (feed, measure, stamp, exit), 4 shipped. One index moves every
    // sheet on the belt one station, and feeds the next.
    const STATIONS = [D.Y_FEED, D.Y_MEASURE, D.Y_STAMP, D.Y_EXIT];
    let slot = new Array(D.SHEETS).fill(-1);
    let shipped = 0;
    let revision = D.REV0;
    let measured = new Array(D.SHEETS).fill(false);
    let stamped = new Array(D.SHEETS).fill(false);
    // the cycle: move 0.7 s, dwell 0.9 s (probe and stamp work in the dwell)
    const MOVE = 0.7;
    const DWELL = 0.9;
    let phase = "idle";
    let clock = 0;
    let beltRun = 0; // distance the belt has run, for the cleats
    let ramAt = 0;
    let probeAt = 0;
    let passes = 0; // passes left to run
    const ease = (t) => t * t * (3 - 2 * t);
    const pad = (n) => String(n).padStart(2, "0");
    const sheetZ = (i, s) => (s < 0 ? D.feedTop - (D.SHEETS - i) * D.SHEET.t : s >= 4 ? D.outZ + shippedIndex[i] * D.SHEET.t : D.BELT_Z);
    let shippedIndex = new Array(D.SHEETS).fill(0);
    function positionOf(i, t) {
      // where sheet i is during a move at fraction t (0..1)
      const s = slot[i];
      if (s < 0) {
        // the sprung feeder keeps its top sheet just under the belt
        const left = slot.filter((v) => v < 0).length;
        const rank = slot.filter((v, j) => v < 0 && j < i).length;
        return [0, D.Y_FEED, D.feedTop - (left - rank) * D.SHEET.t];
      }
      if (s >= 4) return [0, D.Y_OUT, D.outZ + shippedIndex[i] * D.SHEET.t];
      return [0, STATIONS[s], D.BELT_Z];
    }
    function moveOf(i, t) {
      // sheets on the belt slide one station; the exit sheet drops into the tray
      const s = slot[i];
      const e = ease(t);
      if (s === 3) {
        const y = D.Y_EXIT + (D.Y_OUT - D.Y_EXIT) * e;
        const z = D.BELT_Z + (D.outZ + shipped * D.SHEET.t - D.BELT_Z) * (e * e);
        return [0, y, z];
      }
      if (s >= 0 && s < 3) return [0, STATIONS[s] + (STATIONS[s + 1] - STATIONS[s]) * e, D.BELT_Z];
      return positionOf(i, t);
    }
    function place(i, p) {
      sheetEls[i].firstElementChild.setAttribute("transform", translateAlong(D.P, p));
    }
    function order() {
      // nearer (larger y) later; stacked sheets by height
      const keyed = sheetEls.map((el, i) => {
        const tr = positions[i];
        return { el, key: tr[1] * 0.5 + tr[2] * 0.866 };
      });
      keyed.sort((a, b) => a.key - b.key).forEach(({ el }) => layer.appendChild(el));
    }
    let positions = sheetEls.map((_, i) => positionOf(i, 0));
    function drawCleats() {
      const pitch = 12;
      const off = ((beltRun % pitch) + pitch) % pitch;
      let d = "";
      for (let y = D.ROLL.y1 - off; y > D.ROLL.y0 + 1; y -= pitch) {
        const a = iso([-D.HALF, y, D.BELT_Z], D.P);
        const b = iso([D.HALF, y, D.BELT_Z], D.P);
        d += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
      }
      cleats.innerHTML = `<path class="iso-line" data-tone="faint" d="${d}"/>`;
    }
    function draw() {
      sheetEls.forEach((_, i) => place(i, positions[i]));
      order();
      ram.setAttribute("transform", translateAlong(D.P, [0, 0, -ramAt * D.stampDrop]));
      probe.setAttribute("transform", translateAlong(D.P, [0, 0, probeAt * D.SHEET.t]));
      const turn = probeAt * 0.3 + 0.02;
      const a = turn * Math.PI * 2;
      const c = [0, D.Y_MEASURE];
      const p0 = iso([c[0] - Math.sin(a) * 2, c[1] + Math.cos(a) * 2, D.needleTop], D.P);
      const p1 = iso([c[0] + Math.sin(a) * 7.4, c[1] - Math.cos(a) * 7.4, D.needleTop], D.P);
      needle.setAttribute("d", `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)}L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`);
      rev.textContent = pad(revision);
      drawCleats();
      lamps[0].toggleAttribute("data-on", phase !== "idle");
      lamps[1].toggleAttribute("data-on", ramAt > 0.15);
      lamps[2].toggleAttribute("data-on", shipped === D.SHEETS);
      const at = slot.indexOf(2);
      const doing = phase === "dwell" && at >= 0 ? (stamped[at] ? " · stamped" : " · measured") : "";
      const which = at >= 0 && phase === "dwell" ? "sheet " + (D.SHEETS - at) + " of " + D.SHEETS + doing + " · rev " + pad(revision) : "";
      rt.say(readout, which || (shipped === D.SHEETS ? D.SHEETS + " of " + D.SHEETS + " shipped · rev " + pad(revision) : "rev " + pad(revision) + " · " + shipped + " of " + D.SHEETS + " shipped"));
    }
    function startPass() {
      if (phase !== "idle") return;
      if (shipped === D.SHEETS) return reset();
      phase = "move";
      clock = 0;
    }
    function reset() {
      slot = new Array(D.SHEETS).fill(-1);
      shipped = 0;
      revision = D.REV0;
      measured.fill(false);
      stamped.fill(false);
      shippedIndex.fill(0);
      sheetEls.forEach((el) => el.removeAttribute("data-stamped"));
      positions = sheetEls.map((_, i) => positionOf(i, 0));
      phase = "idle";
      stage.setAttribute("aria-valuetext", "rev 02, 0 of 5 shipped");
    }
    let hold = 0;
    const tour = rt.tour(stage, { onResume: () => run.kick() });
    const run = rt.loop(stage, (dt, calm) => {
      tour.advance(dt);
      if (tour.active && phase === "idle") {
        if (shipped === D.SHEETS) {
          hold += dt;
          if (hold > 2.4) {
            hold = 0;
            reset();
          }
        } else startPass();
      }
      if (phase === "idle" && passes > 0) {
        passes--;
        startPass();
      }
      if (phase === "move") {
        // the feeder pushes the top sheet onto the belt as everything indexes
        if (clock === 0) {
          // the top of the stack is the highest index still in the feeder
          feeding = -1;
          for (let i = D.SHEETS - 1; i >= 0; i--) if (slot[i] < 0) { feeding = i; break; }
        }
        clock += calm ? MOVE : dt;
        const t = Math.min(1, clock / MOVE);
        beltRun += (calm ? 0 : dt / MOVE) * D.STEP;
        positions = sheetEls.map((_, i) => {
          if (i === feeding && slot[i] < 0) {
            const z0 = D.feedTop - D.SHEET.t;
            return [0, D.Y_FEED, z0 + (D.BELT_Z - z0) * Math.min(1, t * 2)];
          }
          return moveOf(i, t);
        });
        if (t >= 1) {
          slot = slot.map((s, i) => {
            if (s === 3) {
              shippedIndex[i] = shipped;
              shipped++;
              return 4;
            }
            if (s >= 0 && s < 4) return s + 1;
            if (i === feeding) return 0;
            return s;
          });
          // the remaining stack rises one sheet
          positions = sheetEls.map((_, i) => positionOf(i, 0));
          phase = "dwell";
          clock = 0;
        }
      } else if (phase === "dwell") {
        clock += calm ? DWELL : dt;
        const t = Math.min(1, clock / DWELL);
        const m = slot.indexOf(1);
        const s = slot.indexOf(2);
        // the probe rides onto the sheet under it; the stamp comes down on a measured sheet
        probeAt = m >= 0 ? rt.smooth(Math.min(1, t * 3)) : 0;
        if (m >= 0 && t > 0.3) measured[m] = true;
        const stroke = s >= 0 && measured[s] ? Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.15) / 0.6))) : 0;
        ramAt = stroke;
        if (s >= 0 && measured[s] && !stamped[s] && t > 0.45) {
          stamped[s] = true;
          sheetEls[s].setAttribute("data-stamped", "");
          revision++;
          stage.setAttribute("aria-valuetext", "rev " + pad(revision) + ", sheet " + (D.SHEETS - s) + " stamped");
        }
        if (t >= 1) {
          phase = "idle";
          probeAt = 0;
          ramAt = 0;
          if (shipped === D.SHEETS) stage.setAttribute("aria-valuetext", "5 of 5 shipped, rev " + pad(revision));
        }
      }
      draw();
      return phase !== "idle" || passes > 0 || tour.running;
    });
    let feeding = -1;
    const ask = () => {
      tour.hold();
      if (phase === "idle") startPass();
      else passes = Math.min(passes + 1, 1);
      run.kick();
    };
    let lastHover = 0;
    stage.addEventListener("pointermove", () => {
      const now = performance.now();
      if (now - lastHover > 300) {
        lastHover = now;
        ask();
      }
    });
    stage.addEventListener("pointerdown", ask);
    stage.addEventListener("keydown", (event) => {
      if (event.key === " " || event.key === "Enter" || event.key === "ArrowRight") {
        event.preventDefault();
        ask();
      } else if (event.key === "Home" || event.key === "Escape") {
        event.preventDefault();
        tour.hold();
        if (phase === "idle") reset();
        draw();
      }
    });
    draw();
  },
};
