// Fig. III · Traba. A punch time clock and a rack of eight shift cards for
// one 06:00 to 14:00 shift. Each card rides from the rack to the slot on
// top of the clock, takes its punch and goes back in, raised and marked.
// At market speed the whole shift is in before the clock reaches 06:00.
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../../kit/tube.mjs";

const WIDTH = 600;
const HEIGHT = 380;
const AZIMUTH = 38;

const PLATE = { x: -46, y: -150, w: 98, d: 198, r: 6 };
const PLATE_H = 8;
const FOOT_H = 4;

const CLOCK = { x: -24, y: -22, w: 40, d: 46, r: 3.5 };
const CLOCK_H = 74;
const CX = CLOCK.x + CLOCK.w; // front face
const DIAL = { y: 1, z: 48, r: 14 };
const SLOT = { x0: -18, x1: 10, y: 1, w: 2.6 };

const RACK = { x: -18, y: -102, w: 26, d: 52, r: 2 };
const RACK_H = 13;
const CARDS = 8;
const CARD = { w: 22, h: 30, t: 0.8 };
const PITCH = 5.6;
const cardY = (i) => RACK.y + 5 + i * PITCH;
const CARD_X = RACK.x + 2;
const RAISED = 5; // a punched card stands this much taller in the rack
const SINK = 17; // how deep a card goes into the clock

const START = 52; // the clock starts at 05:52
const SHIFT = "06:00 to 14:00";

const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [CX, 0, CLOCK_H + 34]], WIDTH, HEIGHT, { pad: 30, azimuth: AZIMUTH });

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const r1 = (n) => Math.round(n * 10) / 10;
const onFront = (points, closed = false) => k.pathOf(points.map(([y, z]) => at([CX, y, z])), closed);
const onSide = (y, points, closed = false) => k.pathOf(points.map(([x, z]) => at([x, y, z])), closed);
const circleFront = (cy, cz, r, steps = 48) => onFront(Array.from({ length: steps }, (_, i) => [cy + Math.cos((i / steps) * Math.PI * 2) * r, cz + Math.sin((i / steps) * Math.PI * 2) * r]), true);

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of k.corners(PLATE, 14).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
    out.push(S(k.cylinder(x, y, 6, -PLATE_H - FOOT_H, 1.4, P, 26), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 4.6, -PLATE_H - FOOT_H + 1.4, FOOT_H - 1.4, P, 26), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 6, 1.2), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 9);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  // a ruler along the near (+x) edge, ticks every 4 units
  const strip = { x: PLATE.x + PLATE.w - 13, y: PLATE.y + 12, w: 6, d: PLATE.d - 24, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.y + 3, strip.y + strip.d - 3, 4, 5, strip.x + strip.w, 0.6, [-1.8, -3.4], P, "y");
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  return out.join("");
}

function clock() {
  const out = [];
  // rubber feet under the housing
  for (const [x, y] of k.corners(CLOCK, 6)) out.push(S(k.cylinder(x, y, 2.6, 0, 2, P, 18), { tone: "lo" }));
  const seams = [k.sideSeam(CLOCK, 20, P, 5), k.sideSeam(CLOCK, CLOCK_H - 10, P, 5)].join("");
  out.push(S(k.slabOf(CLOCK, 2, CLOCK_H - 2, P, 5, 1), { tone: "mid", inner: L(seams, { tone: "faint" }) }));
  // lid: a slightly smaller cap with the card throat
  const lid = k.insetPlan(CLOCK, 2);
  out.push(S(k.slabOf(lid, CLOCK_H, 3, P, 4, 0.6), { tone: "mid" }));
  const top = CLOCK_H + 3;
  // throat: a raised collar around the slot, with guide lips
  const collar = { x: SLOT.x0 - 3, y: SLOT.y - 4.5, w: SLOT.x1 - SLOT.x0 + 6, d: 9, r: 2 };
  out.push(S(k.slabOf(collar, top, 2.4, P, 4, 0.4), { tone: "hi", crease: "lo" }));
  const slotPlan = { x: SLOT.x0, y: SLOT.y - SLOT.w / 2, w: SLOT.x1 - SLOT.x0, d: SLOT.w, r: 1 };
  out.push(`<path class="iso-line" data-tone="mid" d="${k.planOutline(slotPlan, top + 2.4, P, 3)}" style="fill:var(--anatomy-shade-0)"/>`);
  out.push(D([at([collar.x + 1.6, collar.y + 1.6, top + 2.4]), at([collar.x + collar.w - 1.6, collar.y + collar.d - 1.6, top + 2.4])], { size: 0.4 }));
  // dial on the front face
  const { y: dy, z: dz, r } = DIAL;
  out.push(`<path class="iso-line" data-tone="mid" d="${circleFront(dy, dz, r + 2.6, 64)}" style="fill:var(--anatomy-top)"/>`);
  out.push(L(circleFront(dy, dz, r + 0.6, 64), { tone: "lo" }));
  const minor = [];
  const major = [];
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const len = i % 5 === 0 ? 2.6 : 1.2;
    const p0 = [dy - Math.sin(a) * (r + 0.6), dz + Math.cos(a) * (r + 0.6)];
    const p1 = [dy - Math.sin(a) * (r + 0.6 - len), dz + Math.cos(a) * (r + 0.6 - len)];
    (i % 5 === 0 ? major : minor).push(onFront([p0, p1]));
  }
  out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "mid" }));
  // twelve, three, six, nine as small numerals in the dial plane
  const numerals = [["12", 0], ["3", 3], ["6", 6], ["9", 9]]
    .map(([text, h]) => {
      const a = (h / 12) * Math.PI * 2;
      const p = at([CX, dy - Math.sin(a) * (r - 5.2), dz + Math.cos(a) * (r - 5.2) - 1.1]);
      return `<text class="tc-num" x="${r1(p[0])}" y="${r1(p[1])}" transform="${faceSkew(p)}">${text}</text>`;
    })
    .join("");
  out.push(numerals);
  // a counter window under the dial: how many are in
  const win = { y: dy - 6, z: 22, w: 12, h: 7 };
  out.push(`<path class="iso-line" data-tone="mid" d="${onFront([[win.y, win.z], [win.y + win.w, win.z], [win.y + win.w, win.z + win.h], [win.y, win.z + win.h]], true)}" style="fill:var(--tc-window)"/>`);
  const c = at([CX, win.y + win.w / 2, win.z + 1.5]);
  out.push(`<text class="tc-count" data-part="count" x="${r1(c[0])}" y="${r1(c[1])}" transform="${faceSkew(c)}">0</text>`);
  // a key lock low on the front, and a name plate band
  const lock = G.frameOf([CX, dy + 11, 12], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 1, 2.4, lock, P, { steps: 28 }), { tone: "mid" }));
  out.push(L(k.pathOf([at([CX + 1, dy + 11, 10.6]), at([CX + 1, dy + 11, 13.4])]), { tone: "hi" }));
  // vents on the +y side
  const sideY = CLOCK.y + CLOCK.d;
  const slots = [];
  for (let i = 0; i < 6; i++) {
    const x0 = CLOCK.x + 9 + i * 4;
    slots.push(onSide(sideY, [[x0, 30], [x0 + 1.8, 30], [x0 + 1.8, 50], [x0, 50]], true));
  }
  out.push(L(slots.join(""), { tone: "lo" }));
  // lever pivot boss on the +y side, near the back top
  const pivot = G.frameOf([PIVOT[0], sideY, PIVOT[2]], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 2.2, 5, pivot, P), { tone: "mid" }));
  out.push(S(G.disc(2.2, 3.6, 3.2, pivot, P), { tone: "mid" }));
  return out.join("");
}

// The display text on the front face sits in its plane: a skew that maps
// screen text onto the face, anchored at its screen point.
function faceSkew([x, y]) {
  const o = at([CX, 0, 0]);
  const u = at([CX, -1, 0]);
  const v = at([CX, 0, -1]);
  const a = u[0] - o[0];
  const b = u[1] - o[1];
  const c = v[0] - o[0];
  const d = v[1] - o[1];
  const n = Math.hypot(a, b);
  const m = Math.hypot(c, d);
  // translate to the point, apply the face axes (normalised), translate back
  return `translate(${r1(x)} ${r1(y)}) matrix(${(a / n).toFixed(4)} ${(b / n).toFixed(4)} ${(c / m).toFixed(4)} ${(d / m).toFixed(4)} 0 0) translate(${-r1(x)} ${-r1(y)})`;
}

const PIVOT = [CLOCK.x + 9, 0, CLOCK_H - 12];
const LEVER = 30;
function leverPath(angle) {
  // the arm swings in the x-z plane on the +y side, from the pivot forward
  const y = CLOCK.y + CLOCK.d + 4.2;
  const a = (-10 - angle) * (Math.PI / 180);
  const tip = [PIVOT[0] + Math.cos(a) * LEVER, y, PIVOT[2] + Math.sin(a) * LEVER];
  return { from: [PIVOT[0], y, PIVOT[2]], tip };
}

function rack() {
  const back = [];
  const front = [];
  back.push(S(k.slabOf({ x: RACK.x - 2, y: RACK.y - 2, w: RACK.w + 4, d: RACK.d + 4, r: 2.4 }, 0, 2, P, 3, 0.4), { tone: "mid" }));
  // back and far walls first
  back.push(S(k.slabOf({ x: RACK.x, y: RACK.y, w: 2, d: RACK.d, r: 0.6 }, 2, RACK_H, P, 2), { tone: "mid" }));
  back.push(S(k.slabOf({ x: RACK.x, y: RACK.y, w: RACK.w, d: 2, r: 0.6 }, 2, RACK_H, P, 2), { tone: "mid" }));
  // dividers between the cards
  for (let i = 0; i <= CARDS; i++) {
    const y = cardY(i) - (PITCH - CARD.t) / 2 - 0.3;
    back.push(`<g data-divider="${i}">${S(k.slabOf({ x: RACK.x + 2, y, w: RACK.w - 4, d: 0.6, r: 0.2 }, 2, RACK_H - 4, P, 2), { tone: "lo", crease: "none" })}</g>`);
  }
  // near walls last, so they cover the cards' feet
  front.push(S(k.slabOf({ x: RACK.x, y: RACK.y + RACK.d - 2, w: RACK.w, d: 2, r: 0.6 }, 2, RACK_H, P, 2), { tone: "mid" }));
  front.push(S(k.slabOf({ x: RACK.x + RACK.w - 2, y: RACK.y, w: 2, d: RACK.d, r: 0.6 }, 2, RACK_H, P, 2, 0.4), { tone: "mid" }));
  // numbered tabs on the near wall's top edge: ticks between slots
  const ticks = [];
  for (let i = 0; i < CARDS; i++) ticks.push(k.lineOnTop([RACK.x + RACK.w - 1, cardY(i) + CARD.t / 2], [RACK.x + RACK.w - 2, cardY(i) + CARD.t / 2], 2 + RACK_H, P));
  front.push(L(ticks.join(""), { tone: "mid" }));
  front.push(D([at([RACK.x + RACK.w - 1, RACK.y + 1.5, 2 + RACK_H]), at([RACK.x + RACK.w - 1, RACK.y + RACK.d - 1.5, 2 + RACK_H])], { size: 0.4 }));
  return { back: back.join(""), front: front.join("") };
}

// A hard hat resting on the open corner of the plate: brim, dome, and a raised
// crown ridge with two side ribs drawn as meridians over the visible face.
const HAT = { o: [6, -126, 0], brim: 16.2, lip: 1.4, R: 12.4, H: 14.2 };
const domeR = (s) => HAT.R * Math.sqrt(Math.max(0, 1 - ((s - HAT.lip) / HAT.H) ** 2));
function hardHat() {
  const F = G.frameOf(HAT.o, [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const dome = [];
  for (let i = 0; i <= 12; i++) {
    const s = HAT.lip + HAT.H * Math.sin((i / 12) * (Math.PI / 2));
    dome.push(i === 12 ? [s, 0] : [s, domeR(s), 1]);
  }
  const brim = [[0, HAT.brim], [0.7, HAT.brim], [1.1, HAT.brim - 0.8, 1], [HAT.lip, HAT.R + 1.4]];
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: -10, y: -142, w: 32, d: 32, r: 16 }, 0, 1, P)}" style="filter:blur(5px)"/>`];
  // a meridian over the dome, kept only where it faces the viewer
  const V = G.viewOf(P);
  const meridian = (t) => {
    const runs = [[]];
    for (let i = 0; i <= 40; i++) {
      const s = HAT.lip + HAT.H * (i / 40);
      const r = domeR(s);
      const slope = -(HAT.R ** 2 / HAT.H ** 2) * (s - HAT.lip) / Math.max(r, 0.01);
      const n = [Math.cos(t), Math.sin(t), -slope];
      const facing = (n[0] * V[0] + n[1] * V[1] + n[2] * V[2]) / Math.hypot(...n);
      if (facing > 0.06) runs[runs.length - 1].push(at(G.pointOf(F, s, r, t)));
      else if (runs[runs.length - 1].length) runs.push([]);
    }
    return runs.filter((run) => run.length > 1).map((run) => k.pathOf(run)).join("");
  };
  const A = Math.atan2(V[1], V[0]);
  const ridge = [meridian(A + 0.9 - 0.05), meridian(A + 0.9 + 0.05)].join("");
  const ribs = [meridian(A + 0.9 - 0.75), meridian(A + 0.9 + 0.75)].join("");
  out.push(S(G.solidOf(brim, F, P), { tone: "mid" }));
  out.push(S(G.solidOf([[HAT.lip, HAT.R], ...dome.slice(1)], F, P), { tone: "mid", inner: L(ridge, { tone: "lo" }) + L(ribs, { tone: "faint" }) }));
  return out.join("");
}

// A card, built at the origin: its plane is x-z, its face looks along +y.
function cardSvg(i) {
  const out = [];
  out.push(S(k.slabOf({ x: 0, y: 0, w: CARD.w, d: CARD.t, r: 0.2 }, 0, CARD.h, P, 2), { tone: "hi", crease: "lo" }));
  const fy = CARD.t;
  const rule = (z, x0, x1) => k.pathOf([at([x0, fy, z]), at([x1, fy, z])]);
  // header band, then the time rows
  out.push(L(k.pathOf([at([0.2, fy, CARD.h - 6]), at([CARD.w - 0.2, fy, CARD.h - 6])]), { tone: "lo", free: true }));
  out.push(L(rule(CARD.h - 3, 3, 13 + (i % 3) * 2), { tone: "lo", free: true }));
  const rows = [];
  for (let r = 0; r < 4; r++) rows.push(rule(CARD.h - 10 - r * 4.2, 3, CARD.w - 3));
  out.push(L(rows.join(""), { tone: "faint", free: true }));
  // the punch: a short bar in the first row, shown once punched
  const p0 = at([5, fy, CARD.h - 8.1]);
  const p1 = at([10.5, fy, CARD.h - 8.1]);
  out.push(`<path class="tc-punch" d="M${r1(p0[0])} ${r1(p0[1])}L${r1(p1[0])} ${r1(p1[1])}"/>`);
  return out.join("");
}

// Where card i sits, as a world offset of its origin corner.
const restOf = (i) => [CARD_X, cardY(i), 2];
const slotOf = () => [SLOT.x0 + (SLOT.x1 - SLOT.x0 - CARD.w) / 2, SLOT.y - CARD.t / 2, CLOCK_H + 3 + 2.4 - SINK];

export default {
  id: "traba",
  fig: "Fig 3",
  title: "Time clock",
  hint: "Hover a card to punch it in",
  width: WIDTH,
  height: HEIGHT,
  label:
    "A punch time clock on a desk plate, with a dial on its front, a card throat on top and a punch lever on its side, beside a rack of eight shift cards. Each card rides to the clock, takes its punch, and returns to the rack raised and marked.",
  stage: { role: "group", label: "Time clock. Arrow keys choose a card, Space or Enter punches it in, Escape starts the shift over.", attrs: { "aria-valuetext": "0 of 8 in" } },
  keys: [
    { mark: "lit", label: "The card being punched" },
    { mark: "raised", label: `Eight cards for one shift, ${SHIFT}` },
  ],
  caption: "A time clock and a rack of eight shift cards. At Traba, the industrial labor marketplace, shifts fill at market speed: each card rides to the clock, takes its punch and goes back in.",
  css: `
#fig-traba{--tc-window:#26262a;--tc-digit:#f4f4f1;--tc-punch:#26262a}
[data-theme="dark"] #fig-traba{--tc-window:#050505;--tc-digit:#e6e6e6;--tc-punch:#e6e6e6}
#fig-traba .tc-num{font:500 3.6px/1 var(--anatomy-mono);fill:var(--anatomy-mid);text-anchor:middle}
#fig-traba .tc-count{font:600 4.6px/1 var(--anatomy-mono);fill:var(--tc-digit);text-anchor:middle}
#fig-traba .tc-punch{stroke:var(--tc-punch);stroke-width:1.4;stroke-linecap:butt;opacity:0}
#fig-traba [data-punched] .tc-punch{opacity:1}
`,
  build() {
    const r = rack();
    const cards = Array.from({ length: CARDS }, (_, i) => `<g data-card="${i}"><g data-move transform="${k.translateAlong(P, restOf(i))}">${cardSvg(i)}</g></g>`);
    // the clip that hides a card below the lid: the slot outline, extruded up
    const top = CLOCK_H + 3 + 2.4;
    const slotPlan = { x: SLOT.x0 - 0.2, y: SLOT.y - SLOT.w / 2, w: SLOT.x1 - SLOT.x0 + 0.4, d: SLOT.w, r: 0 };
    const ring = k.ringOf(slotPlan, 1);
    const hull = G.hullOf([...ring.map(([x, y]) => at([x, y, top])), ...ring.map(([x, y]) => at([x, y, top + 80]))]);
    const clip = `<clipPath id="tc-slot"><path d="${k.pathOf(hull, true)}"/></clipPath>`;
    const lever = leverPath(0);
    const svg = [
      `<defs>${clip}</defs>`,
      plate(),
      hardHat(),
      r.back,
      `<g data-layer="rack">${cards.join("")}</g>`,
      r.front,
      clock(),
      `<g data-part="lever"></g>`,
      `<g data-layer="air"></g>`,
    ].join("");
    return {
      svg,
      readout: `05:${START} · 0 of ${CARDS} in`,
      data: {
        P,
        CARDS,
        rest: Array.from({ length: CARDS }, (_, i) => restOf(i)),
        slot: slotOf(),
        lift: CLOCK_H + 3 + 2.4 + 4,
        RAISED,
        START,
        dial: { x: 0, ...DIAL, cx: CX },
        lever,
        pivot: PIVOT,
        leverLen: LEVER,
        leverY: CLOCK.y + CLOCK.d + 4.2,
        // hit boxes: each card's screen quad at rest, for hover
        quads: Array.from({ length: CARDS }, (_, i) => {
          const [x, y, z] = restOf(i);
          return [[x, y + CARD.t, z + RACK_H - 2], [x + CARD.w, y + CARD.t, z + RACK_H - 2], [x + CARD.w, y + CARD.t, z + CARD.h + RAISED], [x, y + CARD.t, z + CARD.h + RAISED]].map((p) => at(p).map(r1));
        }),
      },
    };
  },
  live(root, rt, D) {
    const stage = root.querySelector(".iso-stage");
    const svg = stage.querySelector("svg");
    const readout = root.querySelector("[data-readout]");
    const cards = [...svg.querySelectorAll("[data-card]")];
    const rackLayer = svg.querySelector('[data-layer="rack"]');
    const air = svg.querySelector('[data-layer="air"]');
    const leverG = svg.querySelector('[data-part="lever"]');
    const count = svg.querySelector('[data-part="count"]');
    const hands = document.createElementNS("http://www.w3.org/2000/svg", "g");
    leverG.before(hands);
    const punched = new Array(D.CARDS).fill(false);
    // one card in flight at a time: phase times in seconds
    const PHASES = [["lift", 0.2], ["over", 0.32], ["down", 0.16], ["punch", 0.26], ["up", 0.16], ["back", 0.32], ["drop", 0.2]];
    const TOTAL = PHASES.reduce((s, p) => s + p[1], 0);
    let flight = null; // { i, t }
    let queue = [];
    let minutes = D.START; // clock minutes past 05:00
    let shownMinutes = D.START;
    let lever = 0;
    let chosen = 0;
    const ease = (t) => t * t * (3 - 2 * t);
    const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const above = (p) => [p[0], p[1], D.lift];
    function poseOf(i, t) {
      const rest = D.rest[i];
      const home = [rest[0], rest[1], rest[2] + (punched[i] ? D.RAISED : 0)];
      const slot = D.slot;
      let s = t;
      for (const [name, dur] of PHASES) {
        if (s <= dur) {
          const e = ease(s / dur);
          if (name === "lift") return { p: lerp3([rest[0], rest[1], rest[2] + (punched[i] ? D.RAISED : 0)], above(rest), e), name };
          if (name === "over") return { p: lerp3(above(rest), above(slot), e), name };
          if (name === "down") return { p: lerp3(above(slot), slot, e), name, clip: true };
          if (name === "punch") return { p: slot, name, clip: true, punch: s / dur };
          if (name === "up") return { p: lerp3(slot, above(slot), e), name, clip: true };
          if (name === "back") return { p: lerp3(above(slot), above(rest), e), name };
          return { p: lerp3(above(rest), [rest[0], rest[1], rest[2] + D.RAISED], e), name };
        }
        s -= dur;
      }
      return { p: home, name: "home" };
    }
    // the clip sits on the card's outer group, the motion on its inner one,
    // so the slot's clip stays put while the card slides through it
    function place(card, p) {
      card.firstElementChild.setAttribute("transform", translateAlong(D.P, p));
    }
    function handsAt(mins) {
      const { y, z, r, cx } = D.dial;
      const hour = 5 + mins / 60;
      const mA = (mins / 60) * Math.PI * 2;
      const hA = (hour / 12) * Math.PI * 2;
      const hand = (a, len, tail) => {
        const p0 = iso([cx + 0.2, y + Math.sin(a) * tail, z - Math.cos(a) * tail], D.P);
        const p1 = iso([cx + 0.2, y - Math.sin(a) * len, z + Math.cos(a) * len], D.P);
        return `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)}L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`;
      };
      const hub = iso([cx + 0.2, y, z], D.P);
      hands.innerHTML = `<path class="iso-line" data-tone="hi" data-free="" d="${hand(hA, r * 0.55, 1.6)}" style="stroke-width:1.3"/><path class="iso-line" data-tone="hi" data-free="" d="${hand(mA, r * 0.86, 2.4)}" style="stroke-width:.8"/><circle cx="${hub[0].toFixed(1)}" cy="${hub[1].toFixed(1)}" r="1" fill="var(--anatomy-hi)"/>`;
    }
    function leverAt(angle) {
      const a = (-10 - angle) * (Math.PI / 180);
      const from = [D.pivot[0], D.leverY, D.pivot[2]];
      const tip = [from[0] + Math.cos(a) * D.leverLen, D.leverY, from[2] + Math.sin(a) * D.leverLen];
      const pieces = T.tubePieces([from, tip], 1.4, D.P, { maxLength: 40 });
      const knob = G.sphereOf(tip, 3.4, D.P, { steps: 32 });
      leverG.innerHTML = pieces.map((p) => T.tubeSvg(p, { tone: "hi" })).join("") + solidSvg(knob, { tone: "hi", lit: lever > 0.5 });
    }
    const timeText = (mins) => {
      const h = 5 + Math.floor(mins / 60);
      const m = Math.floor(mins % 60);
      return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
    };
    function say() {
      const n = punched.filter(Boolean).length;
      const text = timeText(shownMinutes) + " · " + n + " of " + D.CARDS + " in" + (n === D.CARDS ? " · shift filled" : "");
      rt.say(readout, text);
      count.textContent = String(n);
    }
    function start(i) {
      if (flight || punched[i]) return false;
      flight = { i, t: 0 };
      const card = cards[i];
      card.querySelector(".iso-solid")?.setAttribute("data-lit", "");
      air.appendChild(card);
      return true;
    }
    function land(i) {
      const card = cards[i];
      card.querySelector(".iso-solid")?.removeAttribute("data-lit");
      card.removeAttribute("clip-path");
      // back into the rack in index order, under the near walls
      const after = cards.slice(i + 1).find((c) => c.parentNode === rackLayer);
      rackLayer.insertBefore(card, after || null);
      place(card, [D.rest[i][0], D.rest[i][1], D.rest[i][2] + D.RAISED]);
    }
    function reset() {
      punched.fill(false);
      cards.forEach((card, i) => {
        card.removeAttribute("data-punched");
        place(card, D.rest[i]);
      });
      minutes = D.START;
      shownMinutes = D.START;
      stage.setAttribute("aria-valuetext", "0 of 8 in");
    }
    let hold = 0;
    const tour = rt.tour(stage, { onResume: () => run.kick() });
    const run = rt.loop(stage, (dt, calm) => {
      tour.advance(dt);
      if (tour.active && !flight) {
        const next = punched.indexOf(false);
        if (next >= 0) start(next);
        else {
          hold += dt;
          if (hold > 2.6) {
            hold = 0;
            reset();
          }
        }
      }
      if (!flight && queue.length) start(queue.shift());
      if (flight) {
        flight.t += calm ? TOTAL : dt;
        const pose = poseOf(flight.i, Math.min(flight.t, TOTAL));
        const card = cards[flight.i];
        place(card, pose.p);
        if (pose.clip) card.setAttribute("clip-path", "url(#tc-slot)");
        else card.removeAttribute("clip-path");
        lever = pose.name === "punch" ? Math.sin(Math.PI * pose.punch) : 0;
        if (pose.name === "punch" && pose.punch > 0.5 && !card.hasAttribute("data-punched")) {
          card.setAttribute("data-punched", "");
          punched[flight.i] = true;
          minutes = Math.min(59, minutes + 1);
          const n = punched.filter(Boolean).length;
          stage.setAttribute("aria-valuetext", n + " of 8 in");
        }
        if (flight.t >= TOTAL) {
          if (!card.hasAttribute("data-punched")) {
            card.setAttribute("data-punched", "");
            punched[flight.i] = true;
            minutes = Math.min(59, minutes + 1);
          }
          land(flight.i);
          flight = null;
        }
      }
      shownMinutes = rt.follow(shownMinutes, minutes, dt, 0.25, calm);
      handsAt(shownMinutes);
      leverAt(lever * 24);
      say();
      return Boolean(flight) || queue.length > 0 || tour.running || shownMinutes !== minutes;
    });
    const pointAt = (event) => {
      const box = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      return [((event.clientX - box.left) / box.width) * vb.width, ((event.clientY - box.top) / box.height) * vb.height];
    };
    const inside = (poly, [x, y]) => {
      let hit = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
      }
      return hit;
    };
    const ask = (i) => {
      tour.hold();
      chosen = i;
      if (!punched[i] && !queue.includes(i) && (!flight || flight.i !== i)) queue.push(i);
      run.kick();
    };
    stage.addEventListener("pointermove", (event) => {
      const p = pointAt(event);
      for (let i = D.CARDS - 1; i >= 0; i--) if (inside(D.quads[i], p)) return ask(i);
    });
    stage.addEventListener("pointerdown", (event) => {
      const p = pointAt(event);
      for (let i = D.CARDS - 1; i >= 0; i--) if (inside(D.quads[i], p)) return ask(i);
    });
    stage.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") chosen = Math.min(D.CARDS - 1, chosen + 1);
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") chosen = Math.max(0, chosen - 1);
      else if (event.key === "Home") chosen = 0;
      else if (event.key === "End") chosen = D.CARDS - 1;
      else if (event.key === " " || event.key === "Enter") return event.preventDefault(), ask(chosen);
      else if (event.key === "Escape") {
        event.preventDefault();
        tour.hold();
        if (!flight) reset();
        run.kick();
        return;
      } else return;
      event.preventDefault();
      stage.setAttribute("aria-valuetext", "Card " + (chosen + 1) + (punched[chosen] ? ", punched in" : ", not yet in"));
    });
    handsAt(minutes);
    leverAt(0);
    say();
  },
};
