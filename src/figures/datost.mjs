// Fig. II · Datost. A steel card-catalogue cabinet with sixteen drawers, one
// for each private repository, every one locked. Trying a drawer pulls it
// toward you; it travels two units and the cam lock stops it, then it
// springs shut.
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";

const WIDTH = 600;
const HEIGHT = 400;
const AZIMUTH = 33;

// The drawer faces look along +x. Columns run along y, rows along z.
const COLS = 4;
const ROWS = 4;
const DW = 31; // drawer front width (y)
const DH = 23; // drawer front height (z)
const GAP = 3;
const FRONT_T = 2.6; // how far a front stands proud of the carcass
const CASE = { x: -46, y: -(COLS * DW + (COLS + 1) * GAP) / 2, w: 46, d: COLS * DW + (COLS + 1) * GAP, r: 2 };
const X1 = CASE.x + CASE.w; // carcass front face
const PLINTH_H = 16;
const BODY_H = ROWS * DH + (ROWS + 1) * GAP;
const TOP = PLINTH_H + BODY_H;
const CAP_H = 5;
const STOP = 2; // the cam lock stops a drawer after two units

const P = k.fitProjection(
  [...k.boxCorners({ x: CASE.x - 4, y: CASE.y - 4, w: CASE.w + 8 + FRONT_T + 6, d: CASE.d + 8, r: 2 }, -4, TOP + CAP_H + 4)],
  WIDTH,
  HEIGHT,
  { pad: 34, azimuth: AZIMUTH },
);

const V = G.viewOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const r1 = (n) => Math.round(n * 10) / 10;

// A path on the front plane x = X, from (y, z) pairs.
const onFront = (X, points, closed = false) => k.pathOf(points.map(([y, z]) => at([X, y, z])), closed);
const rectOnFront = (X, y0, z0, w, h, r = 0) => {
  if (!r) return onFront(X, [[y0, z0], [y0 + w, z0], [y0 + w, z0 + h], [y0, z0 + h]], true);
  const pts = [];
  const corner = (cy, cz, a0) => {
    for (let i = 0; i <= 4; i++) {
      const a = a0 + (i / 4) * (Math.PI / 2);
      pts.push([cy + Math.cos(a) * r, cz + Math.sin(a) * r]);
    }
  };
  corner(y0 + w - r, z0 + r, -Math.PI / 2);
  corner(y0 + w - r, z0 + h - r, 0);
  corner(y0 + r, z0 + h - r, Math.PI / 2);
  corner(y0 + r, z0 + r, Math.PI);
  return onFront(X, pts, true);
};

// drawer n (0..15): column left to right as you face it, row top to bottom.
// Facing the fronts from +x, the viewer's left is +y.
function drawerAt(n) {
  const col = n % COLS;
  const row = Math.floor(n / COLS);
  const y0 = CASE.y + CASE.d - GAP - (col + 1) * DW - col * GAP;
  const z0 = TOP - GAP - (row + 1) * DH - row * GAP;
  return { n, col, row, y0, z0 };
}

function plinth() {
  const out = [];
  const plan = { x: CASE.x + 3, y: CASE.y + 3, w: CASE.w - 6, d: CASE.d - 6, r: 1.6 };
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: CASE.x - 2, y: CASE.y - 2, w: CASE.w + 8, d: CASE.d + 4, r: 3 }, -4, 6, P)}"/>`);
  // leveling feet: a knurled disc on a stem, at the four corners
  const feet = k.corners(plan, 6).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 4.6, -4, 2.4, P, 28, 0.3), { tone: "mid" }));
    out.push(L(k.knurl(x, y, 4.6, -4, -1.6, 26, P), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 1.8, -1.6, 2.2, P, 16), { tone: "mid", crease: "none" }));
  }
  out.push(S(k.slabOf(plan, 0.6, PLINTH_H - 0.6, P, 3, 0.4), { tone: "lo" }));
  return out.join("");
}

function carcass() {
  const out = [];
  const body = { ...CASE };
  const seam = k.sideSeam(body, PLINTH_H + BODY_H / 2, P, 3);
  out.push(S(k.slabOf(body, PLINTH_H, BODY_H, P, 3, 0), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  // vents on the visible side panel (+y): closed slots in that plane
  const sideY = CASE.y + CASE.d;
  const slot = (x0, z0) => {
    const pts = [];
    const w = 18;
    const h = 2.4;
    for (let i = 0; i <= 8; i++) {
      const a = -Math.PI / 2 + (i / 8) * Math.PI;
      pts.push([x0 + w - h / 2 + Math.cos(a) * h / 2, z0 + h / 2 + Math.sin(a) * h / 2]);
    }
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI / 2 + (i / 8) * Math.PI;
      pts.push([x0 + h / 2 + Math.cos(a) * h / 2, z0 + h / 2 + Math.sin(a) * h / 2]);
    }
    return k.pathOf(pts.map(([x, z]) => at([x, sideY, z])), true);
  };
  const vents = [];
  for (let i = 0; i < 5; i++) vents.push(slot(CASE.x + 14, TOP - 22 - i * 5));
  out.push(L(vents.join(""), { tone: "lo" }));
  // a label plate low on the side with three rule lines
  const lp = { x0: CASE.x + 9, z0: PLINTH_H + 10, w: 28, h: 12 };
  const plate = k.pathOf([[lp.x0, lp.z0], [lp.x0 + lp.w, lp.z0], [lp.x0 + lp.w, lp.z0 + lp.h], [lp.x0, lp.z0 + lp.h]].map(([x, z]) => at([x, sideY + 0.01, z])), true);
  out.push(`<path class="iso-line" data-tone="lo" d="${plate}" style="fill:var(--anatomy-top)"/>`);
  const rule = (z, len) => k.pathOf([at([lp.x0 + 4, sideY, z]), at([lp.x0 + 4 + len, sideY, z])]);
  out.push(L(rule(lp.z0 + 8.4, 19) + rule(lp.z0 + 5.6, 14) + rule(lp.z0 + 2.8, 17), { tone: "faint", free: true }));
  out.push(D([at([lp.x0 + 1.6, sideY, lp.z0 + lp.h - 1.6]), at([lp.x0 + lp.w - 1.6, sideY, lp.z0 + 1.6])], { size: 0.4 }));
  // the front frame: the face between the drawers, with its stiles
  const stiles = [];
  for (let c = 1; c < COLS; c++) {
    const y = CASE.y + CASE.d - GAP - c * (DW + GAP) + GAP / 2;
    stiles.push(onFront(X1, [[y, PLINTH_H], [y, TOP]]));
  }
  out.push(L(stiles.join(""), { tone: "faint" }));
  return out.join("");
}

function cap() {
  const out = [];
  const plan = { x: CASE.x - 2.4, y: CASE.y - 2.4, w: CASE.w + 4.8 + FRONT_T, d: CASE.d + 4.8, r: 2.4 };
  out.push(S(k.slabOf(plan, TOP, CAP_H, P, 4, 1), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plan, 4), TOP + CAP_H, P, 4), { tone: "faint" }));
  // an engraved plate on the cap
  const pl = { x: X1 - 22, y: -18, w: 16, d: 36, r: 1.2 };
  out.push(S(k.slabOf(pl, TOP + CAP_H, 0.8, P, 3), { tone: "hi", crease: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(pl, 1.4), TOP + CAP_H + 0.8, P, 3), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([pl.x + pl.w / 2 + 2, 0], TOP + CAP_H + 0.8, P, "y"), "DATOST", { size: 5.2, tone: "mid", anchor: "middle" }));
  out.push(D([at([pl.x + 3, pl.y + 3, TOP + CAP_H + 0.8]), at([pl.x + 3, pl.y + pl.d - 3, TOP + CAP_H + 0.8])], { size: 0.4 }));
  // a card tray at the far end of the cap: a stack of index cards and a pencil
  const z = TOP + CAP_H;
  const tray = { x: CASE.x + 5, y: CASE.y + CASE.d - 40, w: 30, d: 32, r: 2 };
  out.push(S(k.slabOf(tray, z, 1.4, P, 3, 0.3), { tone: "mid" }));
  for (const side of [{ ...tray, w: 1.6 }, { ...tray, d: 1.6 }]) out.push(S(k.slabOf(side, z + 1.4, 4, P, 2), { tone: "mid" }));
  for (let i = 0; i < 6; i++) {
    const card = { x: tray.x + 3 + (i % 2) * 0.6, y: tray.y + 3.4 - (i % 3) * 0.5, w: 24, d: 25, r: 0.4 };
    out.push(S(k.slabOf(card, z + 1.4 + i * 0.7, 0.7, P, 2), { tone: "hi", crease: "lo" }));
  }
  const top = z + 1.4 + 6 * 0.7;
  const card = { x: tray.x + 3.6, y: tray.y + 3.4 };
  out.push(L([0, 1, 2, 3].map((r) => k.lineOnTop([card.x + 4 + r * 4, card.y + 4], [card.x + 4 + r * 4, card.y + 4 + [16, 12, 18, 9][r]], top, P)).join(""), { tone: "lo", free: true }));
  for (const side of [{ x: tray.x + tray.w - 1.6, y: tray.y, w: 1.6, d: tray.d, r: 0.6 }, { x: tray.x, y: tray.y + tray.d - 1.6, w: tray.w, d: 1.6, r: 0.6 }]) out.push(S(k.slabOf(side, z + 1.4, 4, P, 2, 0.3), { tone: "mid" }));
  const a = G.unit3([0.42, -1, 0]);
  const F = G.frameOf([tray.x + 10, tray.y - 4, z + 1.6], a, [0, 0, 1], G.cross3(a, [0, 0, 1]));
  out.push(S(G.solidOf([[0, 0.5], [3.4, 1.6, 1], [4, 1.6], [26, 1.6], [26, 1.7], [29, 1.7], [29.6, 1.2, 1], [30.4, 0]], F, P), { tone: "hi", inner: L(G.arcOf(F, 26, 1.7, P), { tone: "faint" }) }));
  return out.join("");
}

function drawerSvg(d) {
  const { y0, z0, n } = d;
  const front = { x: X1, y: y0, w: FRONT_T, d: DW, r: 0.8 };
  const fx = X1 + FRONT_T;
  const out = [];
  out.push(`<g data-front>${S(k.slabOf(front, z0, DH, P, 2, 0.5), { tone: "hi", crease: "lo" })}</g>`);
  // label holder: a frame with a card and two rule lines, riveted
  const hy = y0 + DW / 2 - 7.5;
  const hz = z0 + DH - 9.5;
  out.push(`<path class="iso-line" data-tone="lo" d="${rectOnFront(fx, hy, hz, 15, 6.4, 0.6)}" style="fill:var(--anatomy-top)"/>`);
  out.push(L(rectOnFront(fx, hy + 1, hz + 1, 13, 4.4, 0.3), { tone: "faint" }));
  out.push(L(onFront(fx, [[hy + 3, hz + 3.6], [hy + 3 + 6 + (n % 3) * 1.5, hz + 3.6]]) + onFront(fx, [[hy + 3, hz + 2], [hy + 3 + 4 + ((n * 7) % 4), hz + 2]]), { tone: "lo", free: true }));
  out.push(D([at([fx, hy - 0.9, hz + 3.2]), at([fx, hy + 15.9, hz + 3.2])], { size: 0.38, tone: "mid" }));
  // the cam lock, right of the label as you face it
  const lockY = y0 + 4.2;
  const lockZ = z0 + DH - 6.4;
  const F = G.frameOf([fx, lockY, lockZ], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 0.9, 2.2, F, P, { steps: 28 }), { tone: "mid" }));
  out.push(`<path class="iso-line" data-tone="hi" data-part="slot" d="${onFront(fx + 0.9, [[lockY, lockZ - 1.3], [lockY, lockZ + 1.3]])}" style="stroke-width:.8"/>`);
  // the pull: two posts and a bar below the label
  const pz = z0 + 6.4;
  const py0 = y0 + DW / 2 - 7;
  for (const py of [py0, py0 + 14]) out.push(S(k.slabOf({ x: fx, y: py - 0.9, w: 2.6, d: 1.8, r: 0.4 }, pz - 0.9, 1.8, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf({ x: fx + 2.6, y: py0 - 1.6, w: 1.6, d: 17.2, r: 0.7 }, pz - 1.1, 2.2, P, 2, 0.3), { tone: "hi", crease: "lo" }));
  return `<g data-drawer="${n}" transform="translate(0 0)">${out.join("")}</g>`;
}

// Each drawer's front as a screen polygon, for hit testing.
function polygonOf(d) {
  const { y0, z0 } = d;
  return [[y0, z0], [y0 + DW, z0], [y0 + DW, z0 + DH], [y0, z0 + DH]].map(([y, z]) => at([X1 + FRONT_T, y, z]).map(r1));
}

export default {
  id: "datost",
  fig: "Fig 2",
  title: "Card cabinet",
  hint: "Try a drawer",
  width: WIDTH,
  height: HEIGHT,
  label:
    "A steel card-catalogue cabinet on a plinth with leveling feet, holding sixteen drawers in four rows of four. Every drawer has a label holder, a pull and a cam lock, and every lock is shut.",
  stage: { role: "group", label: "Sixteen drawers. Arrow keys choose a drawer, Space or Enter tries it. Every drawer is locked.", attrs: { "aria-valuetext": "16 of 16 drawers locked" } },
  build() {
    const drawers = Array.from({ length: COLS * ROWS }, (_, n) => drawerAt(n));
    // paint fronts far to near: low rows and far columns first
    const order = [...drawers].sort((a, b) => k.depthOf([X1, a.y0 + DW / 2, a.z0 + DH / 2], P) - k.depthOf([X1, b.y0 + DW / 2, b.z0 + DH / 2], P));
    const svg = [plinth(), carcass(), order.map(drawerSvg).join(""), cap()].join("");
    const unit = k.axisVector(P, [1, 0, 0]);
    const slotOf = (d, angle) => {
      const lockY = d.y0 + 4.2;
      const lockZ = d.z0 + DH - 6.4;
      return { y: lockY, z: lockZ };
    };
    return {
      svg,
      readout: "16 of 16 locked",
      data: {
        P,
        unit,
        polys: drawers.map(polygonOf),
        locks: drawers.map((d) => slotOf(d)),
        X: X1 + FRONT_T + 0.9,
        STOP,
      },
    };
  },
  live(root, rt, D) {
    const stage = root.querySelector(".iso-stage");
    const svg = stage.querySelector("svg");
    const readout = root.querySelector("[data-readout]");
    const groups = [...svg.querySelectorAll("[data-drawer]")].sort((a, b) => a.dataset.drawer - b.dataset.drawer);
    const fronts = groups.map((g) => g.querySelector("[data-front] .iso-solid") || g.querySelector("[data-front] > g"));
    const slots = groups.map((g) => g.querySelector('[data-part="slot"]'));
    // each drawer: offset along +x and its rate; a try pulls past the stop
    const state = groups.map(() => ({ at: 0, rate: 0, pull: 0 }));
    let chosen = -1;
    let trying = -1;
    const name = (n) => "drawer " + String(n + 1).padStart(2, "0");
    const inside = (poly, [x, y]) => {
      let hit = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
      }
      return hit;
    };
    const slotPath = (n, angle) => {
      const { y, z } = D.locks[n];
      const dy = Math.sin(angle) * 1.3;
      const dz = Math.cos(angle) * 1.3;
      const a = iso([D.X, y - dy, z - dz], D.P);
      const b = iso([D.X, y + dy, z + dz], D.P);
      return `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    };
    function light(n) {
      fronts.forEach((f, i) => {
        if (!f) return;
        if (i === n) f.setAttribute("data-lit", "");
        else f.removeAttribute("data-lit");
      });
    }
    function tryDrawer(n) {
      trying = n;
      chosen = n;
      state[n].pull = 0.34; // seconds of pulling
      light(n);
      stage.setAttribute("aria-valuetext", name(n) + ": locked");
      run.kick();
    }
    function draw() {
      groups.forEach((g, i) => {
        const s = state[i];
        g.setAttribute("transform", `translate(${(D.unit[0] * s.at).toFixed(2)} ${(D.unit[1] * s.at).toFixed(2)})`);
        slots[i].setAttribute("d", slotPath(i, (Math.min(s.at, D.STOP) / D.STOP) * 0.26));
      });
      const moving = state.some((s) => s.at > 0.02);
      rt.say(readout, trying >= 0 && moving ? name(trying) + " · locked" : chosen >= 0 && !tour.active ? name(chosen) + " · locked" : "16 of 16 locked");
    }
    // the tour tries drawers along a path through the grid
    const PATH = [5, 2, 11, 12, 7, 0, 14, 9];
    let next = 0;
    const tour = rt.tour(stage, { onResume: () => run.kick() });
    let tourWait = 0.4;
    const run = rt.loop(stage, (dt, calm) => {
      tour.advance(dt);
      if (tour.active) {
        tourWait -= dt;
        if (tourWait <= 0) {
          tryDrawer(PATH[next % PATH.length]);
          next++;
          tourWait = 1.15;
        }
      }
      let busy = false;
      state.forEach((s) => {
        if (s.pull > 0) s.pull -= dt;
        const target = s.pull > 0 ? D.STOP + 0.8 : 0;
        if (calm) {
          s.at = s.pull > 0 ? D.STOP : 0;
          s.rate = 0;
        } else {
          rt.spring(s, target, dt, 260, 16, false);
          if (s.at > D.STOP) {
            s.at = D.STOP;
            if (s.rate > 0) s.rate = -s.rate * 0.35;
          }
          if (s.at < 0) {
            s.at = 0;
            s.rate = 0;
          }
        }
        if (s.pull > 0 || Math.abs(s.at) > 1e-3 || Math.abs(s.rate) > 1e-3) busy = true;
      });
      if (!busy && trying >= 0) {
        trying = -1;
        if (tour.active) light(-1);
      }
      draw();
      return busy || tour.running;
    });
    const pointAt = (event) => {
      const box = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      return [((event.clientX - box.left) / box.width) * vb.width, ((event.clientY - box.top) / box.height) * vb.height];
    };
    let hovered = -1;
    stage.addEventListener("pointermove", (event) => {
      const p = pointAt(event);
      const n = D.polys.findIndex((poly) => inside(poly, p));
      stage.style.cursor = n >= 0 ? "pointer" : "";
      if (n !== hovered) {
        hovered = n;
        if (n >= 0) {
          tour.hold();
          tryDrawer(n);
        }
      }
    });
    stage.addEventListener("pointerleave", () => (hovered = -1));
    stage.addEventListener("pointerdown", (event) => {
      const n = D.polys.findIndex((poly) => inside(poly, pointAt(event)));
      if (n >= 0) {
        tour.hold();
        tryDrawer(n);
      }
    });
    stage.addEventListener("keydown", (event) => {
      let n = chosen < 0 ? 0 : chosen;
      const col = n % 4;
      const row = Math.floor(n / 4);
      if (event.key === "ArrowRight") n = row * 4 + Math.min(3, col + 1);
      else if (event.key === "ArrowLeft") n = row * 4 + Math.max(0, col - 1);
      else if (event.key === "ArrowDown") n = Math.min(3, row + 1) * 4 + col;
      else if (event.key === "ArrowUp") n = Math.max(0, row - 1) * 4 + col;
      else if (event.key === "Home") n = 0;
      else if (event.key === "End") n = 15;
      else if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        tour.hold();
        tryDrawer(n);
        return;
      } else return;
      event.preventDefault();
      tour.hold();
      chosen = n;
      light(n);
      stage.setAttribute("aria-valuetext", name(n) + ": locked");
      draw();
    });
    draw();
  },
};
