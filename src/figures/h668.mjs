// Fig. VI · h668-z37. A rotary index table drilled with 37 holes, one per
// residue mod 37, beside a rack of eight discs: one for each multiplier
// subgroup H of the units mod 37 (orders 2, 3, 4, 6, 9, 12, 18, 36). Loading
// a disc raises a pin in every hole of H. For the six with |H| of at least 4
// no H-cyclotomic Z37-symmetric srg(333, 166, 82, 83) exists; orders 2 and 3
// are still open, and so is H(668).
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";

const WIDTH = 600;
const HEIGHT = 380;
const AZIMUTH = 34;
const ELEVATION = 36;

const N = 37;
const GEN = 2; // a primitive root mod 37
const ORDERS = [2, 3, 4, 6, 9, 12, 18, 36];
const OPEN = new Set([2, 3]);

function powmod(b, e, m) {
  let r = 1;
  let x = b % m;
  let n = e;
  while (n > 0) {
    if (n & 1) r = (r * x) % m;
    x = (x * x) % m;
    n >>= 1;
  }
  return r;
}
// the subgroup of order m: powers of g^(36/m)
function subgroup(m) {
  const step = powmod(GEN, 36 / m, N);
  const out = [];
  let x = 1;
  for (let j = 0; j < m; j++) {
    out.push(x);
    x = (x * step) % N;
  }
  return out.sort((a, b) => a - b);
}
// sanity: 2 has order 36, and every H has the size it should and is closed
{
  let order = 1;
  while (powmod(GEN, order, N) !== 1) order++;
  if (order !== 36) throw new Error("2 is not a primitive root mod 37");
  for (const m of ORDERS) {
    const h = subgroup(m);
    if (new Set(h).size !== m) throw new Error(`subgroup ${m} has the wrong size`);
    for (const a of h) for (const b of h) if (!h.includes((a * b) % N)) throw new Error(`subgroup ${m} is not closed`);
  }
}
const GROUPS = ORDERS.map((m) => ({ m, h: subgroup(m), open: OPEN.has(m), classes: 36 / m }));

// A Hadamard matrix of order 12 by Paley's construction over GF(11): the
// kind of object that is still not known to exist at order 668.
const PALEY = (() => {
  const q = 11;
  const square = new Set(Array.from({ length: q - 1 }, (_, i) => ((i + 1) * (i + 1)) % q));
  const chi = (a) => (a % q === 0 ? 0 : square.has(((a % q) + q) % q) ? 1 : -1);
  const H = Array.from({ length: q + 1 }, (_, i) =>
    Array.from({ length: q + 1 }, (_, j) => {
      if (i === 0) return 1;
      if (j === 0) return -1;
      return i === j ? 1 : chi(j - i);
    }),
  );
  // sanity: H H^T = 12 I
  for (let a = 0; a <= q; a++)
    for (let b = 0; b <= q; b++) {
      const dot = H[a].reduce((sum, v, j) => sum + v * H[b][j], 0);
      if (dot !== (a === b ? q + 1 : 0)) throw new Error("Paley H(12) is not Hadamard");
    }
  return H;
})();

const TABLE = [0, 26]; // table centre (x, y)
const R_TABLE = 46;
const R_PLATE = 38;
const R_HOLES = 31;
const Z_BODY = 16;
const Z_TABLE = Z_BODY + 7;
const Z_PLATE = Z_TABLE + 2.4;
const PIN = { r: 1.35, h: 7 };

const RACK = { x: -14, y: -112, w: 28, d: 66, r: 2 };
const DISC_R = 10;
const DISC_T = 1.6;
const RACK_PITCH = 7.6;
const discY = (i) => RACK.y + 6 + i * RACK_PITCH;
const DISC_Z = 9 + DISC_R; // disc centre height in the rack

const BASE = { x: -58, y: -126, w: 116, d: 210, r: 8 };

const P = k.fitProjection([...k.boxCorners(BASE, -12, 0), [TABLE[0], TABLE[1], Z_PLATE + 30], [0, RACK.y, DISC_Z + DISC_R + 10]], WIDTH, HEIGHT, { pad: 26, azimuth: AZIMUTH, elevation: ELEVATION });

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const r1 = (n) => Math.round(n * 10) / 10;
const UP = [0, 0, 1];
// hole r sits at angle 2πr/37, counted clockwise from the far (-x) side
const holeAt = (r, radius = R_HOLES) => {
  const a = (r / N) * Math.PI * 2;
  return [TABLE[0] - Math.cos(a) * radius, TABLE[1] + Math.sin(a) * radius];
};

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, -12, 10, P)}"/>`];
  for (const [x, y] of k.corners(BASE, 16).sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P))) {
    out.push(S(k.cylinder(x, y, 6.4, -12, 1.6, P, 26), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5, -10.4, 2.4, P, 26), { tone: "mid" }));
  }
  out.push(S(k.slabOf(BASE, -8, 8, P, 8, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(BASE, 9);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  const strip = { x: BASE.x + BASE.w - 12, y: BASE.y + 14, w: 6, d: BASE.d - 28, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.y + 4, strip.y + strip.d - 4, 4, 5, strip.x + strip.w, 0.6, [-1.8, -3.4], P, "y");
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  return out.join("");
}

// The tablet: H(12) inlaid in a plate on the open front corner, +1 filled.
const TABLET = { x: 18, y: -92, w: 24, d: 24, r: 1.6 };
function tablet() {
  const out = [S(k.slabOf(TABLET, 0, 1.6, P, 3, 0.4), { tone: "mid" })];
  const cell = 1.6;
  const x0 = TABLET.x + (TABLET.w - cell * 12) / 2;
  const y0 = TABLET.y + (TABLET.d - cell * 12) / 2;
  const cells = [];
  for (let i = 0; i < 12; i++)
    for (let j = 0; j < 12; j++) {
      if (PALEY[i][j] < 0) continue;
      const a = x0 + i * cell + 0.12;
      const b = y0 + j * cell + 0.12;
      const e = cell - 0.24;
      cells.push(k.pathOf([at([a, b, 1.6]), at([a + e, b, 1.6]), at([a + e, b + e, 1.6]), at([a, b + e, 1.6])], true));
    }
  out.push(`<path class="hx-cell" d="${cells.join("")}"/>`);
  out.push(L(k.planOutline({ x: x0 - 0.8, y: y0 - 0.8, w: cell * 12 + 1.6, d: cell * 12 + 1.6, r: 0.6 }, 1.6, P), { tone: "lo" }));
  return out.join("");
}

function table() {
  const out = [];
  const [cx, cy] = TABLE;
  // the dividing head body, the turntable and its graduated rim
  out.push(S(k.cylinder(cx, cy, R_TABLE - 4, 0, Z_BODY, P, 96, 0.6), { tone: "mid", inner: L(k.sideArc(cx, cy, R_TABLE - 4, 6, P, 48), { tone: "faint" }) }));
  // worm housing and crank on the near side of the body
  const wormY = cy - R_TABLE + 2;
  out.push(S(k.slabOf({ x: cx + 6, y: wormY - 10, w: 30, d: 12, r: 2.4 }, 2, 12, P, 4, 0.6), { tone: "mid" }));
  const crank = G.frameOf([cx + 36, wormY - 4, 8], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 3, 3, crank, P), { tone: "mid" }));
  out.push(S(G.disc(3, 7, 7, crank, P), { tone: "mid" }));
  out.push(k.fadedSvg(G.ribsOf(crank, 3, 7, 7, 30, P, { fade: [0.05, 0.5] }), { tone: "lo" }));
  const handle = G.frameOf([cx + 43, wormY - 4 + 4.6, 8 + 4.6], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 7, 1.6, handle, P), { tone: "hi" }));
  out.push(S(k.cylinder(cx, cy, R_TABLE, Z_BODY, Z_TABLE - Z_BODY, P, 112, 0.8), { tone: "hi", crease: "lo" }));
  const rim = k.radialTicks(cx, cy, R_TABLE, 72, 6, Z_TABLE, [1.8, 2.8], P);
  out.push(L(rim.minor, { tone: "lo" }), L(rim.major, { tone: "mid" }));
  // T-slots in the table top, closed outlines, between plate and rim
  // the index plate, its hole circle and the zero mark
  out.push(S(k.cylinder(cx, cy, R_PLATE, Z_TABLE, Z_PLATE - Z_TABLE, P, 112, 0.5), { tone: "hi", crease: "lo" }));
  out.push(L(k.ring(cx, cy, R_HOLES + 4.4, Z_PLATE, P, 112) + k.ring(cx, cy, R_HOLES - 4.4, Z_PLATE, P, 96), { tone: "faint" }));
  const holes = [];
  for (let r = 0; r < N; r++) {
    const [x, y] = holeAt(r);
    holes.push(`<path class="hx-hole" d="${k.pathOf(Array.from({ length: 16 }, (_, i) => at([x + Math.cos((i / 16) * 6.2832) * (PIN.r + 0.35), y + Math.sin((i / 16) * 6.2832) * (PIN.r + 0.35), Z_PLATE])), true)}"/>`);
  }
  out.push(holes.join(""));
  const z0 = holeAt(0, R_HOLES + 4.4);
  const z1 = holeAt(0, R_HOLES + 8);
  out.push(L(k.lineOnTop(z0, z1, Z_PLATE, P), { tone: "hi" }));
  // the single engraved label, on the plate
  // read from the viewer: baseline along -y, glyphs standing toward -x, clear of the hub
  const lab = holeAt(N / 2, 16);
  const o = at([lab[0], lab[1], Z_PLATE]);
  const ex = at([lab[0], lab[1] - 1, Z_PLATE]).map((v, i) => v - o[i]);
  const ey = at([lab[0] + 1, lab[1], Z_PLATE]).map((v, i) => v - o[i]);
  const m = [...ex, ...ey, ...o].map((v) => Math.round(v * 1000) / 1000).join(" ");
  out.push(k.faceTextSvg(`matrix(${m})`, "Z37", { size: 5.4, tone: "lo", anchor: "middle" }));
  // hub
  out.push(S(k.cylinder(cx, cy, 7, Z_PLATE, 3, P, 40, 0.4), { tone: "mid" }));
  out.push(L(k.ring(cx, cy, 2.4, Z_PLATE + 3, P, 20), { tone: "lo" }));
  out.push(D(Array.from({ length: 4 }, (_, i) => at([cx + Math.cos(i * 1.5708 + 0.785) * 4.6, cy + Math.sin(i * 1.5708 + 0.785) * 4.6, Z_PLATE + 3])), { size: 0.45 }));
  return out.join("");
}

// The index plunger: a post at the rim beside hole 0 with an arm over it.
function plungerParts() {
  const [hx, hy] = holeAt(0, R_TABLE + 9);
  const [px, py] = holeAt(0, R_HOLES);
  const post = [S(k.slabOf({ x: hx - 4, y: hy - 4, w: 8, d: 8, r: 1.4 }, 0, 3, P, 3, 0.4), { tone: "lo" }), S(k.cylinder(hx, hy, 2.6, 3, Z_PLATE + 14, P, 22), { tone: "mid", crease: "none" })];
  const arm = S(k.slabOf({ x: Math.min(px, hx) - 2, y: py - 3, w: Math.abs(hx - px) + 4, d: 6, r: 1.4 }, Z_PLATE + 14, 4, P, 3, 0.5), { tone: "mid" });
  const knobAt = [px, py];
  const plunger = [S(k.cylinder(px, py, 1.1, Z_PLATE + 0.4, 14, P, 14), { tone: "hi", crease: "none" }), S(k.cylinder(px, py, 3.2, Z_PLATE + 18, 4, P, 28, 0.3), { tone: "hi" }), L(k.knurl(px, py, 3.2, Z_PLATE + 18, Z_PLATE + 22, 22, P), { tone: "lo" })];
  return { post: post.join(""), arm, plunger: plunger.join(""), knobAt };
}

function rack() {
  const back = [];
  const front = [];
  back.push(S(k.slabOf(RACK, 0, 4, P, 3, 0.5), { tone: "mid" }));
  back.push(S(k.slabOf({ x: RACK.x + 2, y: RACK.y + 2, w: 4, d: RACK.d - 4, r: 1 }, 4, 10, P, 2, 0.4), { tone: "mid" }));
  for (let i = 0; i < ORDERS.length; i++) {
    const y = discY(i);
    back.push(L(k.lineOnTop([RACK.x + 8, y - 1.6], [RACK.x + RACK.w - 3, y - 1.6], 4, P) + k.lineOnTop([RACK.x + 8, y + DISC_T + 1.6], [RACK.x + RACK.w - 3, y + DISC_T + 1.6], 4, P), { tone: "faint", free: true }));
  }
  front.push(S(k.slabOf({ x: RACK.x + RACK.w - 6, y: RACK.y + 2, w: 4, d: RACK.d - 4, r: 1 }, 4, 6, P, 2, 0.4), { tone: "mid" }));
  front.push(D([at([RACK.x + RACK.w - 4, RACK.y + 4, 10]), at([RACK.x + RACK.w - 4, RACK.y + RACK.d - 4, 10])], { size: 0.4 }));
  return { back: back.join(""), front: front.join("") };
}

// A rack disc, built at its slot: its plane is x-z, its face looks along +y.
function discSvg(i) {
  const g = GROUPS[i];
  const y = discY(i);
  const F = G.frameOf([0, y, DISC_Z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const out = [S(G.disc(0, DISC_T, DISC_R, F, P, { steps: 48 }), { tone: "hi", crease: "lo" })];
  const fy = y + DISC_T;
  // the subgroup's holes, as dots at their residues
  const dots = g.h.map((r) => {
    const a = (r / N) * Math.PI * 2;
    return at([-Math.cos(a) * 6.6, fy, DISC_Z + Math.sin(a) * 6.6]);
  });
  out.push(D(dots, { size: 0.42, tone: "hi" }));
  out.push(`<path class="iso-line" data-tone="faint" d="${k.pathOf(Array.from({ length: 40 }, (_, j) => at([Math.cos((j / 40) * 6.2832) * 8.2, fy, DISC_Z + Math.sin((j / 40) * 6.2832) * 8.2])), true)}"/>`);
  // status: a filled dot for a closed case, an open ring for an open one
  const s = at([0, fy, DISC_Z]);
  out.push(g.open ? `<circle class="hx-open" cx="${r1(s[0])}" cy="${r1(s[1])}" r="1.5"/>` : `<circle class="hx-closed" cx="${r1(s[0])}" cy="${r1(s[1])}" r="1.5"/>`);
  return out.join("");
}

// Each pin is clipped to its own hole's column, extruded up from the plate,
// so a sunk pin never shows below the plate or through another hole.
function pinClips() {
  const out = [];
  for (let r = 0; r < N; r++) {
    const [x, y] = holeAt(r);
    const ring = Array.from({ length: 12 }, (_, i) => [x + Math.cos((i / 12) * 6.2832) * (PIN.r + 0.05), y + Math.sin((i / 12) * 6.2832) * (PIN.r + 0.05)]);
    const hull = G.hullOf([...ring.map(([a, b]) => at([a, b, Z_PLATE])), ...ring.map(([a, b]) => at([a, b, Z_PLATE + 40]))]);
    out.push(`<clipPath id="hx-pin-${r}"><path d="${k.pathOf(hull, true)}"/></clipPath>`);
  }
  return out.join("");
}

function pinSvg(r) {
  const [x, y] = holeAt(r);
  return S(k.cylinder(x, y, PIN.r, Z_PLATE - PIN.h + 0.2, PIN.h, P, 16), { tone: "hi", crease: "none" });
}

export default {
  id: "h668",
  fig: "Fig 6",
  title: "Cyclotomic sieve",
  hint: "Load a disc",
  width: WIDTH,
  height: HEIGHT,
  label:
    "A rotary index table whose plate is drilled with 37 holes, one per residue mod 37, beside a rack of eight discs, one for each multiplier subgroup of the units mod 37. Each disc carries dots at its subgroup's residues and a mark: filled for a closed case, an open ring for an open one. Loading a disc raises a pin in each of its holes. A tablet on the front corner is inlaid with a Hadamard matrix of order 12, the kind of object still not known to exist at order 668.",
  stage: { role: "slider", label: "Cyclotomic sieve. Arrow keys load the next or previous subgroup.", attrs: { "aria-valuemin": 2, "aria-valuemax": 36, "aria-valuenow": 12, "aria-valuetext": "Order 12 subgroup: 3 classes, no solution" } },
  css: `
#fig-h668 .hx-hole{fill:var(--anatomy-shade-0);stroke:var(--anatomy-lo);stroke-width:.4}
#fig-h668 .hx-closed{fill:var(--anatomy-hi)}
#fig-h668 .hx-cell{fill:var(--anatomy-hi);opacity:.82}
#fig-h668 .hx-open{fill:var(--anatomy-paper);stroke:var(--anatomy-hi);stroke-width:.7}
`,
  build() {
    const pl = plungerParts();
    const r = rack();
    // pins: an outer group carries the clip, an inner one moves
    const pinOrder = Array.from({ length: N }, (_, i) => i).sort((a, b) => k.depthOf([...holeAt(a), 0], P) - k.depthOf([...holeAt(b), 0], P));
    const pins = pinOrder.map((i) => `<g data-pin="${i}" clip-path="url(#hx-pin-${i})"><g data-move>${pinSvg(i)}</g></g>`).join("");
    const discs = GROUPS.map((_, i) => `<g data-disc="${i}"><g data-move>${discSvg(i)}</g></g>`).join("");
    const svg = [
      `<defs>${pinClips()}</defs>`,
      base(),
      r.back,
      discs,
      r.front,
      tablet(),
      table(),
      pins,
      pl.post,
      `<g data-part="plunger">${pl.plunger}</g>`,
      pl.arm,
    ].join("");
    const discBoxes = GROUPS.map((_, i) => {
      const y = discY(i) + DISC_T;
      return Array.from({ length: 16 }, (_, j) => at([Math.cos((j / 16) * 6.2832) * DISC_R, y, DISC_Z + Math.sin((j / 16) * 6.2832) * DISC_R]).map(r1));
    });
    return {
      svg,
      readout: "|H| = 12 · 3 classes · no solution",
      data: { P, PIN_H: PIN.h, groups: GROUPS, discBoxes, start: ORDERS.indexOf(12) },
    };
  },
  live(root, rt, D) {
    const stage = root.querySelector(".iso-stage");
    const svg = stage.querySelector("svg");
    const readout = root.querySelector("[data-readout]");
    const pins = [...svg.querySelectorAll("[data-pin]")].sort((a, b) => a.dataset.pin - b.dataset.pin);
    const discs = [...svg.querySelectorAll("[data-disc]")];
    const plunger = svg.querySelector('[data-part="plunger"]');
    const pinState = pins.map(() => ({ at: 0, rate: 0, delay: 0 }));
    const discLift = discs.map(() => 0);
    let loaded = D.start;
    let click = 0;
    const want = () => new Set(D.groups[loaded].h);
    const say = () => {
      const g = D.groups[loaded];
      rt.say(readout, "|H| = " + g.m + " · " + g.classes + (g.classes === 1 ? " class" : " classes") + " · " + (g.open ? "open" : "no solution"));
    };
    function load(i) {
      if (i === loaded) return;
      loaded = i;
      const h = want();
      // pins stagger around the circle, so the change sweeps the plate
      pinState.forEach((s, r) => (s.delay = (r / 37) * 0.35 + (h.has(r) ? 0.12 : 0)));
      click = 1;
      const g = D.groups[i];
      stage.setAttribute("aria-valuenow", String(g.m));
      stage.setAttribute("aria-valuetext", "Order " + g.m + " subgroup: " + g.classes + (g.classes === 1 ? " class, " : " classes, ") + (g.open ? "open" : "no solution"));
      run.kick();
    }
    function draw() {
      const h = want();
      pins.forEach((pin, r) => {
        pin.firstElementChild.setAttribute("transform", translateAlong(D.P, [0, 0, pinState[r].at * D.PIN_H]));
        const solid = pin.querySelector(".iso-solid");
        if (h.has(r)) solid.setAttribute("data-lit", "");
        else solid.removeAttribute("data-lit");
      });
      discs.forEach((d, i) => d.firstElementChild.setAttribute("transform", translateAlong(D.P, [0, 0, discLift[i] * 7])));
      plunger.setAttribute("transform", translateAlong(D.P, [0, 0, click * 4]));
      say();
    }
    const tour = rt.tour(stage, { onResume: () => run.kick() });
    let wait = 0.8;
    const run = rt.loop(stage, (dt, calm) => {
      tour.advance(dt);
      if (tour.active) {
        wait -= dt;
        if (wait <= 0) {
          load((loaded + 1) % D.groups.length);
          wait = 2.4;
        }
      }
      const h = want();
      let busy = false;
      pinState.forEach((s, r) => {
        if (s.delay > 0) {
          s.delay -= dt;
          busy = true;
          if (!calm) return;
        }
        if (!rt.spring(s, h.has(r) ? 1 : 0, dt, 320, 22, calm)) busy = true;
      });
      discLift.forEach((v, i) => {
        discLift[i] = rt.follow(v, i === loaded ? 1 : 0, dt, 0.14, calm);
        if (discLift[i] !== (i === loaded ? 1 : 0)) busy = true;
      });
      click = rt.follow(click, 0, dt, 0.18, calm);
      if (click !== 0) busy = true;
      draw();
      return busy || tour.running;
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
    const pick = (event) => {
      const p = pointAt(event);
      for (let i = D.discBoxes.length - 1; i >= 0; i--) if (inside(D.discBoxes[i], p)) {
        stage.style.cursor = "pointer";
        tour.hold();
        load(i);
        return;
      }
      stage.style.cursor = "";
    };
    // a tap takes the nearest disc within reach: they are small under a finger
    const centres = D.discBoxes.map((poly) => [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length]);
    const tap = (event) => {
      const p = pointAt(event);
      let best = -1;
      let near = 26;
      centres.forEach(([x, y], i) => {
        const d = Math.hypot(x - p[0], y - p[1]);
        if (d < near) {
          near = d;
          best = i;
        }
      });
      if (best < 0) return pick(event);
      tour.hold();
      load(best);
    };
    stage.addEventListener("pointermove", pick);
    stage.addEventListener("pointerdown", (event) => (event.pointerType === "mouse" ? pick(event) : tap(event)));
    stage.addEventListener("keydown", (event) => {
      let i = loaded;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") i = Math.min(D.groups.length - 1, i + 1);
      else if (event.key === "ArrowLeft" || event.key === "ArrowDown") i = Math.max(0, i - 1);
      else if (event.key === "Home") i = 0;
      else if (event.key === "End") i = D.groups.length - 1;
      else return;
      event.preventDefault();
      tour.hold();
      load(i);
    });
    // start with the pins of the first disc already up
    const h0 = want();
    pinState.forEach((s, r) => (s.at = h0.has(r) ? 1 : 0));
    discLift[loaded] = 1;
    draw();
  },
};
