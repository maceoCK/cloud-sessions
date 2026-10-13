// Fig. V · pravost: money held against intention. An equal-arm beam balance:
// coins go onto the near pan one at a time, a sealed intention weight sits on
// the far pan. While they differ the beam leans on its stop; when the money
// matches the intention the beam levels and a pawl swings up into the notch
// under it, holding it there.
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../../kit/tube.mjs";

const WIDTH = 600;
const HEIGHT = 380;
const AZIMUTH = 28;

const PIVOT_Z = 116;
const ARM = 68; // half the beam
const HANG = 50; // hanger length from beam end to pan rim
const PAN_R = 20;
const COINS = 5;
const COIN = { r: 7.4, t: 1.8 };
const STOP = 9; // degrees: the beam rests on its stop beyond this
const PER_COIN = 3.2; // degrees per coin of imbalance

const BASE = { x: -40, y: -98, w: 80, d: 196, r: 8 };
const BASE_H = 10;
const DISH = { x: 22, y: 30, r: 12 };

const P = k.fitProjection([...k.boxCorners(BASE, -BASE_H - 6, 0), [0, 0, PIVOT_Z + 14], [0, ARM + 8, PIVOT_Z + 12], [0, -ARM - 8, PIVOT_Z + 12]], WIDTH, HEIGHT, { pad: 26, azimuth: AZIMUTH });

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const r1 = (n) => Math.round(n * 10) / 10;
const UP = [0, 0, 1];

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - 6, BASE_H, P)}"/>`];
  // three leveling feet: knurled screws
  const feet = [[BASE.x + 14, BASE.y + 18], [BASE.x + 14, BASE.y + BASE.d - 18], [BASE.x + BASE.w - 12, 0]].sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P));
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 5, -BASE_H - 6, 3, P, 28, 0.3), { tone: "mid" }));
    out.push(L(k.knurl(x, y, 5, -BASE_H - 6, -BASE_H - 3, 26, P), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 1.8, -BASE_H - 3, 3, P, 14), { tone: "mid", crease: "none" }));
  }
  out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(BASE, 9);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  // spirit level: a vial along y in a small block, with its bubble
  const vial = { x: 22, y: -62, w: 10, d: 30, r: 2 };
  out.push(S(k.slabOf(vial, 0, 4, P, 3, 0.4), { tone: "mid" }));
  const F = G.frameOf([vial.x + vial.w / 2, vial.y + 4, 6.2], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  out.push(S(G.solidOf([[0, 1.4], [1.2, 2.6, 1], [vial.d - 9.2, 2.6, 1], [vial.d - 8, 1.4]], F, P), { tone: "hi", crease: "none" }));
  out.push(L([k.lineOnTop([vial.x + 3.4, vial.y + 13], [vial.x + 6.6, vial.y + 13], 8.8, P), k.lineOnTop([vial.x + 3.4, vial.y + 17], [vial.x + 6.6, vial.y + 17], 8.8, P)].join(""), { tone: "mid" }));
  out.push(`<path class="pv-bubble" d="${k.pathOf(Array.from({ length: 20 }, (_, i) => at([vial.x + 5 + Math.cos((i / 20) * 6.283) * 1.4, vial.y + 15 + Math.sin((i / 20) * 6.283) * 2.4, 8.8])), true)}"/>`);
  // label plate on the near corner, three rules
  const lp = { x: 24, y: 52, w: 12, d: 30, r: 1.2 };
  out.push(S(k.slabOf(lp, 0, 0.8, P, 3), { tone: "mid", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(lp, 1.4), 0.8, P, 3), { tone: "faint" }));
  out.push(L([0, 1, 2].map((i) => k.lineOnTop([lp.x + 3.4 + i * 2.6, lp.y + 4], [lp.x + 3.4 + i * 2.6, lp.y + 4 + [20, 14, 18][i]], 0.8, P)).join(""), { tone: "lo", free: true }));
  return out.join("");
}

function dish() {
  // the coin dish on the base: a shallow turned cup with a rolled lip
  const out = [S(k.cylinder(DISH.x, DISH.y, DISH.r, 0, 2.6, P, 48, 0.4), { tone: "hi", crease: "lo" })];
  out.push(L(k.ring(DISH.x, DISH.y, DISH.r - 1.6, 2.6, P, 48), { tone: "lo" }));
  out.push(`<path class="pv-floor" d="${k.pathOf(Array.from({ length: 40 }, (_, i) => at([DISH.x + Math.cos((i / 40) * 6.2832) * (DISH.r - 1.6), DISH.y + Math.sin((i / 40) * 6.2832) * (DISH.r - 1.6), 2.6])), true)}"/>`);
  return out.join("");
}

function pillar() {
  // a turned foot, then a shaft with two collars, built from short pieces so
  // no hull bridges the waist
  const F = G.frameOf([0, 0, 0], UP, [1, 0, 0], [0, 1, 0]);
  const out = [];
  out.push(S(G.solidOf([[0, 16], [3, 16], [3, 13.4], [4.2, 12.6, 1], [5.6, 10.6, 1], [7, 9.4]], F, P), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 6, 7, 3, P, 40, 0.3), { tone: "mid" }));
  const shaftTop = PIVOT_Z - 14;
  out.push(S(k.cylinder(0, 0, 4.2, 10, shaftTop - 10, P, 32), { tone: "mid", crease: "none", inner: L([34, 62].map((z) => k.sideArc(0, 0, 4.2, z, P, 18)).join(""), { tone: "faint" }) }));
  for (const z of [PIVOT_Z - 40, PIVOT_Z - 22]) out.push(S(k.cylinder(0, 0, 5.8, z, 4, P, 36, 0.3), { tone: "mid" }));
  return out.join("");
}

// The fork that carries the knife edge: two cheeks either side of the beam.
function cheek(side) {
  const x = side * 4.6;
  return S(k.slabOf({ x: x - 1.2, y: -4.6, w: 2.4, d: 9.2, r: 0.8 }, PIVOT_Z - 12, 16, P, 2, 0.4), { tone: "mid" });
}

function yoke() {
  return S(k.slabOf({ x: -6.4, y: -5.2, w: 12.8, d: 10.4, r: 1.6 }, PIVOT_Z - 14, 3, P, 3, 0.5), { tone: "mid" });
}

// The scale the pointer reads, an arc plate on the near side of the pillar.
const SCALE_X = 6.6;
const NEEDLE = 52;
function scale() {
  const out = [];
  const zc = PIVOT_Z;
  const arc = (r, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, i) => a0 + ((a1 - a0) * i) / n).map((a) => [Math.sin(a) * r, zc - Math.cos(a) * r]);
  const deg = Math.PI / 180;
  const outer = arc(NEEDLE + 4, -14 * deg, 14 * deg);
  const inner = arc(NEEDLE - 5, 14 * deg, -14 * deg);
  const plate = [...outer, ...inner].map(([y, z]) => at([SCALE_X, y, z]));
  out.push(`<path class="iso-line" data-tone="mid" d="${k.pathOf(plate, true)}" style="fill:var(--anatomy-top)"/>`);
  const ticks = [];
  const major = [];
  for (let d = -12; d <= 12; d += 2) {
    if (Math.abs(d) === 12) continue;
    const a = d * deg;
    const len = d % 6 === 0 ? 4.4 : 2.4;
    const p0 = [Math.sin(a) * (NEEDLE + 4), zc - Math.cos(a) * (NEEDLE + 4)];
    const p1 = [Math.sin(a) * (NEEDLE + 4 - len), zc - Math.cos(a) * (NEEDLE + 4 - len)];
    (d % 6 === 0 ? major : ticks).push(k.pathOf([at([SCALE_X, ...p0]), at([SCALE_X, ...p1])]));
  }
  out.push(L(ticks.join(""), { tone: "lo" }), L(major.join(""), { tone: "mid" }));
  // the plate's bracket to the pillar
  out.push(S(k.slabOf({ x: 3.6, y: -2, w: 3, d: 4, r: 0.6 }, zc - NEEDLE - 5, 7, P, 2), { tone: "mid" }));
  return out.join("");
}

// The pawl's pivot boss on the pillar, on the near side below the yoke.
const PAWL = { x: 5.6, z: PIVOT_Z - 34, len: 22 };

// A hanger and pan, built at rest (beam level) and moved as a group.
function pan(side) {
  const y = side * ARM;
  const top = PIVOT_Z - 3;
  const rim = top - HANG;
  const out = [];
  // bail: a short rod from the beam's end bow, a ring, three struts to the rim
  const bail = top - 14;
  const rod = tubePieces([[0, y, top], [0, y, bail]], 0.7, P, { maxLength: 40 });
  out.push(rod.map((p) => tubeSvg(p, { tone: "mid" })).join(""));
  const ring = G.frameOf([0, y, bail - 1.2], UP, [1, 0, 0], [0, 1, 0]);
  out.push(S(G.ringBand(-0.8, 0.8, 1.6, 2.6, ring, P), { tone: "mid" }));
  const struts = [0, 1, 2].map((i) => {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    return [[0, y, bail - 2.2], [Math.cos(a) * (PAN_R - 1.6), y + Math.sin(a) * (PAN_R - 1.6), rim + 1.2]];
  });
  // far struts behind the pan's bowl, near ones in front
  const F = G.frameOf([0, y, rim - 4], UP, [1, 0, 0], [0, 1, 0]);
  // the dish's top: a rolled lip, a shallow well and the hanger's boss
  const dish = L(G.circleOf(F, 5, PAN_R - 1.6, P, 96), { tone: "lo" }) + L([G.circleOf(F, 5, PAN_R - 5, P, 96), G.circleOf(F, 5, 2.4, P, 32)].join(""), { tone: "faint" });
  const bowl = S(G.solidOf([[0, 6], [0.8, 6], [1.4, 9, 1], [2.6, 14, 1], [3.6, 18, 1], [4.2, PAN_R], [5, PAN_R]], F, P), { tone: "hi", inner: dish });
  const depthOf = (p) => k.depthOf(p, P);
  const strutSvg = (s) => tubePieces(s, 0.45, P, { maxLength: 80 }).map((p) => tubeSvg(p, { tone: "mid" })).join("");
  const far = struts.filter((s) => depthOf(s[1]) < depthOf([0, y, rim]));
  const near = struts.filter((s) => depthOf(s[1]) >= depthOf([0, y, rim]));
  return { svg: out.join("") + far.map(strutSvg).join("") + bowl, near: near.map(strutSvg).join(""), rim: rim + 1 };
}

// The intention weight: a turned body with a knob, sealed on top.
function weight(y, z) {
  const F = G.frameOf([0, y, z], UP, [1, 0, 0], [0, 1, 0]);
  const profile = [[0, 8.6], [1.2, 9.2], [10, 9.2], [11.2, 8, 1], [12.4, 4.6], [13.2, 3.4], [15.6, 3.4], [16.4, 4.2, 1], [18.4, 4.2, 1], [19.4, 0]];
  const out = [S(G.solidOf(profile, F, P), { tone: "hi", inner: L(G.arcOf(F, 5, 9.2, P), { tone: "faint" }) })];
  // the seal: a disc on the shoulder face, pressed with a P
  out.push(k.faceTextSvg(k.topMatrix([2.2, y], z + 10.6, P, "x"), "P", { size: 7, tone: "mid", anchor: "middle" }));
  return out.join("");
}

function coinSvg() {
  const F = G.frameOf([0, 0, 0], UP, [1, 0, 0], [0, 1, 0]);
  return S(G.disc(0, COIN.t, COIN.r, F, P, { steps: 40 }), { tone: "hi", inner: k.fadedSvg(G.ribsOf(F, 0.2, COIN.t - 0.2, COIN.r, 44, P, { fade: [0.05, 0.5] }), { tone: "lo" }) });
}

export default {
  id: "pravost",
  fig: "Fig 5",
  title: "Beam balance",
  hint: "Add a coin",
  width: WIDTH,
  height: HEIGHT,
  label:
    "An equal-arm beam balance on a leveling base. The near pan takes coins one at a time from a dish on the base; the far pan carries a sealed, turned weight. A pointer on the beam reads the tilt against a scale, and a pawl on the pillar latches the beam when it levels.",
  stage: { role: "slider", label: "Beam balance. Space or Enter adds a coin, Backspace takes one off, Home clears the pan.", attrs: { "aria-valuemin": 0, "aria-valuemax": 5, "aria-valuenow": 0, "aria-valuetext": "0 of 5 coins, tilted" } },
  css: `
#fig-pravost .iso-stage{cursor:pointer}
#fig-pravost .pv-floor{fill:var(--anatomy-shade-2)}
#fig-pravost .pv-bubble{fill:var(--anatomy-top);stroke:var(--anatomy-mid);stroke-width:.5}
`,
  build() {
    const near = pan(1);
    const far = pan(-1);
    const coinsAt = Array.from({ length: COINS }, (_, i) => [0, ARM, near.rim + 0.6 + i * COIN.t]);
    const dishCoins = Array.from({ length: COINS }, (_, i) => [DISH.x, DISH.y, 1.8 + i * COIN.t]);
    const coins = Array.from({ length: COINS }, (_, i) => `<g data-coin="${i}"><g data-move transform="${k.translateAlong(P, dishCoins[i])}">${coinSvg()}</g></g>`).join("");
    const svg = [
      base(),
      `<g data-part="pan-far">${far.svg}${weight(-ARM, far.rim + 0.6)}${far.near}</g>`,
      cheek(-1),
      pillar(),
      yoke(),
      `<g data-part="beam"></g>`,
      scale(),
      `<g data-part="needle"></g>`,
      cheek(1),
      `<g data-part="pawl"></g>`,
      dish(),
      `<g data-part="pan-near">${near.svg}<g data-layer="pan-coins"></g>${near.near}</g>`,
      `<g data-layer="dish">${coins}</g>`,
      `<g data-layer="air"></g>`,
    ].join("");
    return {
      svg,
      readout: `0 of ${COINS} coins · tilt ${STOP.toFixed(1)}°`,
      data: { P, ARM, PIVOT_Z, COINS, COIN, STOP, PER_COIN, coinsAt, dishCoins, NEEDLE, SCALE_X, PAWL },
    };
  },
  live(root, rt, D) {
    const stage = root.querySelector(".iso-stage");
    const svg = stage.querySelector("svg");
    const readout = root.querySelector("[data-readout]");
    const beamG = svg.querySelector('[data-part="beam"]');
    const needleG = svg.querySelector('[data-part="needle"]');
    const pawlG = svg.querySelector('[data-part="pawl"]');
    const panNear = svg.querySelector('[data-part="pan-near"]');
    const panFar = svg.querySelector('[data-part="pan-far"]');
    const panCoins = svg.querySelector('[data-layer="pan-coins"]');
    const dishLayer = svg.querySelector('[data-layer="dish"]');
    const air = svg.querySelector('[data-layer="air"]');
    const coins = [...svg.querySelectorAll("[data-coin]")];
    const deg = Math.PI / 180;
    const V = G.viewOf(D.P);
    let onPan = 0; // coins resting on the pan
    let flying = null; // { i, t, from, to, up }
    const queue = [];
    const beam = { at: D.STOP, rate: 0 };
    let latch = 0;
    let latched = false;
    const target = () => Math.max(-D.STOP, Math.min(D.STOP, (D.COINS - onPan) * D.PER_COIN));
    function beamSvg(theta) {
      // tilt about x: positive theta lowers the far (-y) end
      const t = theta * deg;
      const a = [0, Math.cos(t), Math.sin(t)];
      const v = [0, -Math.sin(t), Math.cos(t)];
      const F = G.frameOf([0, 0, D.PIVOT_Z], a, [1, 0, 0], v);
      const bar = G.prismOf(F, [[-1.6, -3.4], [1.6, -3.4], [1.6, 2.6], [-1.6, 2.6]], -D.ARM - 3, D.ARM + 3, D.P);
      const parts = [solidSvg(bar, { tone: "hi", crease: "lo" })];
      // graduations on the near face of the beam
      const ticks = [];
      for (let s = 10; s <= D.ARM - 6; s += 6) for (const side of [-1, 1]) {
        const p = G.pointOf(F, side * s, 0, 0);
        const q0 = [p[0] + 1.6, p[1] + v[1] * 1.6, p[2] + v[2] * 1.6];
        const q1 = [p[0] + 1.6, p[1] + v[1] * (s % 18 === 4 ? -1.6 : 0.2), p[2] + v[2] * (s % 18 === 4 ? -1.6 : 0.2)];
        const A = iso(q0, D.P);
        const B = iso(q1, D.P);
        ticks.push(`M${A[0].toFixed(1)} ${A[1].toFixed(1)}L${B[0].toFixed(1)} ${B[1].toFixed(1)}`);
      }
      parts.push(`<path class="iso-line" data-tone="lo" d="${ticks.join("")}"/>`);
      // the central boss on the knife edge, and the notch block underneath
      const boss = G.frameOf([-2.6, 0, D.PIVOT_Z], [1, 0, 0], a, v);
      parts.unshift(solidSvg(G.disc(0, 5.2, 4.2, boss, D.P, { steps: 32 }), { tone: "mid" }));
      const notch = G.frameOf(G.pointOf(F, 0, 0, 0).map((c, i) => c - v[i] * 3.4), [-v[0], -v[1], -v[2]], [1, 0, 0], a);
      parts.push(solidSvg(G.prismOf(notch, [[-1.4, -3.2], [1.4, -3.2], [1.4, 3.2], [-1.4, 3.2]], 0, 3, D.P), { tone: "mid" }));
      // end bows the hangers hang from
      for (const side of [-1, 1]) {
        const end = G.pointOf(F, side * D.ARM, 0, 0);
        parts.push(solidSvg(G.sphereOf([end[0], end[1], end[2] - 3.4], 1.8, D.P, { steps: 24 }), { tone: "mid" }));
      }
      return parts.join("");
    }
    function needleSvg(theta) {
      const t = theta * deg;
      const tip = [D.SCALE_X + 1, D.NEEDLE * Math.sin(t), D.PIVOT_Z - D.NEEDLE * Math.cos(t)];
      const root = [D.SCALE_X + 1, 0, D.PIVOT_Z - 6];
      const A = iso(root, D.P);
      const B = iso(tip, D.P);
      return `<path class="iso-line" data-tone="hi" data-free="" d="M${A[0].toFixed(1)} ${A[1].toFixed(1)}L${B[0].toFixed(1)} ${B[1].toFixed(1)}" style="stroke-width:.9"/>`;
    }
    function pawlSvg(on) {
      // a sprung pawl leaning off to one side; when the beam levels it swings
      // upright into the notch block under the beam
      const a = (128 - on * 38) * deg;
      const root = [D.PAWL.x, 0, D.PAWL.z];
      const dir = [0, Math.cos(a), Math.sin(a)];
      const len = D.PIVOT_Z - 7.2 - D.PAWL.z;
      const F = G.frameOf(root, dir, [1, 0, 0], G.unit3(G.cross3(dir, [1, 0, 0])));
      const arm = G.prismOf(F, [[-1, -1.3], [1, -1.3], [1, 1.3], [-1, 1.3]], 0, len, D.P);
      const tooth = G.prismOf(F, [[-1, -1.3], [1, -1.3], [1, 0.4], [-1, 2.2]], len, len + 1.6, D.P);
      const boss = G.frameOf([D.PAWL.x - 1.2, 0, D.PAWL.z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
      return solidSvg(G.disc(0, 2.6, 3, boss, D.P), { tone: "mid" }) + solidSvg(arm, { tone: "hi", lit: on > 0.9 }) + solidSvg(tooth, { tone: "hi", lit: on > 0.9 });
    }
    function panOffset(side, theta) {
      const t = theta * deg;
      return [0, side * D.ARM * (Math.cos(t) - 1), side * D.ARM * Math.sin(t)];
    }
    function draw() {
      const theta = beam.at;
      beamG.innerHTML = beamSvg(theta);
      needleG.innerHTML = needleSvg(theta);
      pawlG.innerHTML = pawlSvg(latch);
      const n = panOffset(1, theta);
      const f = panOffset(-1, theta);
      panNear.setAttribute("transform", translateAlong(D.P, n));
      panFar.setAttribute("transform", translateAlong(D.P, f));
      const tilt = Math.abs(theta);
      const text = latched && latch > 0.9 ? onPan + " of " + D.COINS + " · level · latched" : onPan + " of " + D.COINS + " coins · tilt " + tilt.toFixed(1) + "°";
      rt.say(readout, text);
    }
    function moveCoin(i, p) {
      coins[i].firstElementChild.setAttribute("transform", translateAlong(D.P, p));
    }
    // coins on the pan sit in pan space: their own offsets plus the pan's
    function seat(i, slot) {
      panCoins.appendChild(coins[i]);
      moveCoin(i, D.coinsAt[slot]);
    }
    function add() {
      if (onPan + queue.filter((q) => q > 0).length + (flying && flying.up ? 1 : 0) >= D.COINS) return;
      queue.push(1);
      run.kick();
    }
    function remove() {
      if (onPan - (flying && !flying.up ? 1 : 0) <= 0) return;
      queue.push(-1);
      run.kick();
    }
    function launch(dir) {
      if (dir > 0) {
        // the top coin of the dish
        const i = coins.findIndex((c) => c.parentNode === dishLayer && c === [...dishLayer.children].slice(-1)[0]);
        const from = D.dishCoins[D.COINS - 1 - onPan];
        const panNow = panOffset(1, beam.at);
        const slot = D.coinsAt[onPan];
        const to = [slot[0] + panNow[0], slot[1] + panNow[1], slot[2] + panNow[2]];
        air.appendChild(coins[i]);
        flying = { i, t: 0, from, to, up: true, slot: onPan };
      } else {
        const i = Number([...panCoins.children].slice(-1)[0].dataset.coin);
        const panNow = panOffset(1, beam.at);
        const slot = D.coinsAt[onPan - 1];
        const from = [slot[0] + panNow[0], slot[1] + panNow[1], slot[2] + panNow[2]];
        const to = D.dishCoins[D.COINS - onPan];
        onPan--;
        if (latched) unlatch();
        air.appendChild(coins[i]);
        flying = { i, t: 0, from, to, up: false };
      }
    }
    function unlatch() {
      latched = false;
      stage.setAttribute("aria-valuetext", onPan + " of 5 coins, tilted");
    }
    let hold = 0;
    let clearing = false;
    const tour = rt.tour(stage, { onResume: () => run.kick() });
    let tourWait = 0.2;
    const run = rt.loop(stage, (dt, calm) => {
      tour.advance(dt);
      if (tour.active && !flying && !queue.length) {
        if (clearing) {
          if (onPan > 0) queue.push(-1);
          else clearing = false;
        } else if (onPan < D.COINS) {
          tourWait -= dt;
          if (tourWait <= 0) {
            queue.push(1);
            tourWait = 0.9;
          }
        } else {
          hold += dt;
          if (hold > 2.6) {
            hold = 0;
            clearing = true;
          }
        }
      }
      if (!flying && queue.length) launch(queue.shift());
      if (flying) {
        const dur = 0.55;
        flying.t += calm ? dur : dt;
        const u = Math.min(1, flying.t / dur);
        const e = u * u * (3 - 2 * u);
        const lift = Math.sin(Math.PI * u) * 26;
        const p = flying.from.map((c, j) => c + (flying.to[j] - c) * e);
        p[2] += lift;
        moveCoin(flying.i, p);
        if (u >= 1) {
          if (flying.up) {
            onPan++;
            seat(flying.i, flying.slot);
            stage.setAttribute("aria-valuenow", String(onPan));
            stage.setAttribute("aria-valuetext", onPan + " of 5 coins" + (onPan === D.COINS ? ", level" : ", tilted"));
          } else {
            dishLayer.appendChild(coins[flying.i]);
            moveCoin(flying.i, flying.to);
            stage.setAttribute("aria-valuenow", String(onPan));
          }
          flying = null;
        }
      }
      // the beam: a damped pendulum toward the balance of torques, on its stops
      const want = latched ? 0 : target();
      const settled = rt.spring(beam, want, dt, 30, 6.2, calm);
      if (beam.at > D.STOP) { beam.at = D.STOP; beam.rate = Math.min(0, -beam.rate * 0.3); }
      if (beam.at < -D.STOP) { beam.at = -D.STOP; beam.rate = Math.max(0, -beam.rate * 0.3); }
      if (!latched && onPan === D.COINS && Math.abs(beam.at) < 0.25 && Math.abs(beam.rate) < 2) {
        latched = true;
        stage.setAttribute("aria-valuetext", "5 of 5 coins, level, latched");
      }
      latch = rt.follow(latch, latched ? 1 : 0, dt, 0.18, calm);
      draw();
      return Boolean(flying) || queue.length > 0 || !settled || (latch !== 0 && latch !== 1) || tour.running;
    });
    stage.addEventListener("pointerdown", () => {
      tour.hold();
      clearing = false;
      if (onPan + (flying && flying.up ? 1 : 0) + queue.filter((q) => q > 0).length >= D.COINS) queue.push(-1), queue.push(-1), queue.push(-1), queue.push(-1), queue.push(-1);
      else add();
      run.kick();
    });
    stage.addEventListener("keydown", (event) => {
      if (event.key === " " || event.key === "Enter" || event.key === "ArrowUp" || event.key === "ArrowRight") add();
      else if (event.key === "Backspace" || event.key === "ArrowDown" || event.key === "ArrowLeft") remove();
      else if (event.key === "Home" || event.key === "Escape") for (let i = 0; i < D.COINS; i++) queue.push(-1);
      else return;
      event.preventDefault();
      tour.hold();
      clearing = false;
      run.kick();
    });
    draw();
  },
};
