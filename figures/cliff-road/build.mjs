import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../anatomy/kit/iso-kit.mjs";
import * as G from "../../anatomy/kit/lathe.mjs";
import { glCamera } from "../../anatomy/kit/gl.mjs";
import { tubePieces, tubeSvg } from "../../anatomy/kit/tube.mjs";
import { kitScript, glScript } from "../../anatomy/scripts/inline-kit.mjs";
import * as M from "./model.mjs";
import * as T from "./terrain.mjs";
import * as SC from "./scene.mjs";
import { carSvg, sockSvg, windOf } from "./car.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const t0 = Date.now();

const W = 960;
const H = 860;
const AZIMUTH = 72;
const ELEVATION = 24;
const u = M.U;

// ---- world -----------------------------------------------------------------------------------------
const Z = { base: -42, bed: -18, floor: 0, sea: M.LEVEL.sea * u, toe: M.LEVEL.toe * u, road: M.LEVEL.road * u, crown: M.LEVEL.crown * u };
const BOX = [-196, -178, 338, 184];
const [X0, Y0, X1, Y1] = BOX;
const BLOCK = { x: X0, y: Y0, w: X1 - X0, d: Y1 - Y0, r: 0 };
const PLINTH = { x: X0 - 16, y: Y0 - 16, w: X1 - X0 + 32, d: Y1 - Y0 + 32, r: 6 };

const road = M.roadOf();
const profile = M.speedProfile(road);
const LIMIT = M.paceLimit(road, profile);
const LAP = M.lapOf(road, profile, LIMIT);

const P = k.fitProjection([...k.boxCorners(PLINTH, Z.base - 8, Z.bed), ...k.boxCorners(BLOCK, Z.bed, Z.crown), [X0, Y0, Z.crown + 40]], W, H, { pad: 26, azimuth: AZIMUTH, elevation: ELEVATION });
const V = G.viewOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const poly = (pts, closed = true) => k.pathOf(pts.map(at), closed);
const depth = (p) => G.dot3(p, V);

// ---- the rock body -----------------------------------------------------------------------------------
const HILL_FRONT = Y1 - 36;
const { coast, polygon } = T.coastOf(road, M, BOX, HILL_FRONT);
const sdfCoast = T.sdfOf(coast, polygon);
const STACKS = [
  { x: 276, y: 82, r: 15, top: 132, seed: 3 },
  { x: 262, y: -98, r: 7, top: 49, seed: 5 },
  { x: 36, y: 140, r: 6, top: 43, seed: 7 },
  { x: 312, y: 6, r: 5, top: 45, seed: 11 },
];
const stackSdf = (x, y, z) => {
  let d = Infinity;
  for (const s of STACKS) {
    if (z > s.top) continue;
    // a stack leans away from the swell and is cut into by it: offset centre, rough outline, waist at the notch
    const lean = (z / s.top) ** 1.5 * 4;
    const cx = s.x - lean;
    const cy = s.y + lean * 0.4;
    const rough = 1 + 0.95 * (T.fbmZ(x / 5, y / 5, z, s.seed, 14) - 0.5) + 0.35 * (T.fbm(x / 2.5, y / 2.5, s.seed + 9, 2) - 0.5);
    const waist = z > 40 && z < 62 ? 0.82 : 1;
    d = Math.min(d, Math.hypot(x - cx, y - cy) - s.r * rough * waist * (1 - 0.22 * (z / s.top) ** 2));
  }
  return d;
};
const STEP = 2;
const base = T.gridOf(BOX, STEP, (x, y) => sdfCoast(x, y));
const n = (x, y, seed, scale = 22) => 2 * T.fbm(x / scale, y / scale, seed) - 1;

// strata: thin beds of a sedimentary cliff. Each bed's outline is the coast pushed out (into the sea) by
// a slope term, slowly drifting ledges (noise continuous in height), vertical joints shared by every bed
// (buttresses and gullies), a wave-cut notch at the waterline and a talus apron under water.
// vertical jointing: blocky buttresses and recesses shared by every bed
const blocky = (v) => Math.sign(v) * Math.abs(v) ** 0.55;
const joint = (x, y) => 4.6 * blocky(2 * T.fbm(x / 8, y / 8, 41, 2) - 1) + 2.2 * (2 * T.fbm(x / 23, y / 23, 43, 2) - 1);
const ledge = (x, y, z) => 3.4 * (2 * T.fbmZ(x / 15, y / 15, z, 51, 26) - 1);
// chimneys the sea has opened along faults, and caves at the waterline: picked on the faces we see
const coastNear = (tx, ty) => coast.reduce((best, p) => (Math.hypot(p[0] - tx, p[1] - ty) < Math.hypot(best[0] - tx, best[1] - ty) ? p : best), coast[0]);
const GULLIES = [coastNear(-58, 110), coastNear(56, 112), coastNear(214, -30), coastNear(-176, 150)];
const CAVES = [coastNear(-4, 110), coastNear(150, 100), coastNear(-150, 150)];
const bowl = (list, r) => (x, y) => list.reduce((sum, [cx, cy]) => sum + Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (r * r)), 0);
const gully = bowl(GULLIES, 5.5);
const cave = bowl(CAVES, 8.5);
const cliffOff = (z) => (x, y) => 0.055 * (Z.road - z) + ledge(x, y, z) + joint(x, y) - 0.6 - (z < 150 ? 11 * gully(x, y) : 0);
const STRATA = [
  [0, 5, (x, y) => 64 + 8 * n(x, y, 11, 30)],
  [5, 10, (x, y) => 48 + 7 * n(x, y, 12, 28)],
  [10, 15, (x, y) => 34 + 6 * n(x, y, 13, 26)],
  [15, 20, (x, y) => 22 + 5 * n(x, y, 14, 22)],
  [20, 25, (x, y) => 13 + 4 * n(x, y, 15, 16)],
  [25, 32, (x, y) => 8 + 3.5 * n(x, y, 16, 12) + joint(x, y)],
  [32, 40, (x, y) => 5.5 + 3 * n(x, y, 17, 10) + joint(x, y)],
  [40, 43, (x, y) => 5 + 7 * n(x, y, 18, 14) + joint(x, y)],
  [43, 49, (x, y) => -2.2 + 0.8 * n(x, y, 19, 10) + 0.6 * joint(x, y) - 16 * cave(x, y) - 11 * gully(x, y)],
  [49, 55, (x, y) => -1.4 + 0.8 * n(x, y, 20, 10) + 0.7 * joint(x, y) - 15 * cave(x, y) - 11 * gully(x, y)],
  [55, 61, (x, y) => 0.055 * (Z.road - 58) + ledge(x, y, 58) + joint(x, y) - 0.6 - 11 * cave(x, y) - 11 * gully(x, y)],
];
for (let z = 61; z < 152; z += 7) STRATA.push([z, Math.min(152, z + 7), cliffOff(z + 3.5)]);
STRATA.push([152, 158, (x, y) => Math.max(0, 0.5 + 0.6 * joint(x, y))]);
STRATA.push([158, 165, () => 0]);
const HILL = [
  [165, 172, (x, y) => 0.5 * n(x, y, 31, 8)],
  [172, 179, (x, y) => 0.5 * n(x, y, 32, 8)],
  [179, 186, (x, y) => 0.5 * n(x, y, 33, 8)],
  [186, 193, (x, y) => 0.5 * n(x, y, 34, 8)],
  [193, 200, (x, y) => 0.5 * n(x, y, 35, 8)],
  [200, 207, (x, y) => 0.5 * n(x, y, 36, 8)],
  [207, 214, (x, y) => -8 + 3 * n(x, y, 37, 16)],
  [214, 220, (x, y) => -19 + 5 * n(x, y, 38, 20)],
  [220, 226, (x, y) => -32 + 6 * n(x, y, 39, 22)],
];

function ringsOf(z0, z1, off, above = false) {
  const grid = T.gridOf(BOX, STEP, (x, y, edge) => {
    if (edge) return 1e3;
    if (above) {
      const i = Math.round((x - base.x0) / STEP);
      const j = Math.round((y - base.y0) / STEP);
      return Math.max(x - M.PORTAL_X - off(x, y), base.v[j * base.nx + i] - off(x, y));
    }
    const i = Math.round((x - base.x0) / STEP);
    const j = Math.round((y - base.y0) / STEP);
    const land = base.v[j * base.nx + i] - off(x, y);
    return Math.min(land, stackSdf(x, y, z1) - Math.max(0, z1 <= Z.sea ? off(x, y) * 0.35 : 0));
  });
  return T.contour(grid).map((ring) => T.simplifyRing(ring, 0.5)).filter((ring) => Math.abs(T.ringArea(ring)) > 6);
}

// a face is a cut (sawn section of the model) when it lies on the block boundary
const onCut = (ax, ay, bx, by, z = 0) => (z >= 40 && z < 61 && cave((ax + bx) / 2, (ay + by) / 2) > 0.25 ? "cr-cave" : sawn(ax, ay, bx, by) ? "cr-cut" : "");
const sawn = (ax, ay, bx, by) => (Math.abs(ay - Y1) < 0.6 && Math.abs(by - Y1) < 0.6) || (Math.abs(ax - X1) < 0.6 && Math.abs(bx - X1) < 0.6) || (Math.abs(ay - Y0) < 0.6 && Math.abs(by - Y0) < 0.6) || (Math.abs(ax - X0) < 0.6 && Math.abs(bx - X0) < 0.6);

const LAYERS = [];
for (const [z0, z1, off] of STRATA) LAYERS.push({ z0, z1, rings: ringsOf(z0, z1, off) });
for (const [z0, z1, off] of HILL) LAYERS.push({ z0, z1, rings: ringsOf(z0, z1, off, true), hill: true });
const BLOCK_RING = [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]];

const back = [];
const terrain = [];
const front = [];

// ---- plinth ------------------------------------------------------------------------------------------
back.push(`<path class="iso-halo" d="${k.haloOf(PLINTH, Z.base - 6, 24, P)}"/>`);
for (const [x, y] of [...k.corners(PLINTH, 26), [PLINTH.x + PLINTH.w / 2, PLINTH.y + 26], [PLINTH.x + PLINTH.w / 2, PLINTH.y + PLINTH.d - 26]].sort((a, b) => depth([a[0], a[1], 0]) - depth([b[0], b[1], 0]))) {
  back.push(S(k.cylinder(x, y, 10, Z.base - 6, 2, P, 28), { tone: "lo" }));
  back.push(S(k.cylinder(x, y, 8, Z.base - 4, 4, P, 28), { tone: "mid" }));
}
back.push(S(k.slabOf(PLINTH, Z.base, Z.bed - Z.base, P, 8, 1.6), { tone: "mid", inner: Ln(k.sideSeam(PLINTH, Z.base + 6, P, 8), { tone: "faint" }) }));
back.push(Ln(k.planOutline(k.insetPlan(PLINTH, 5), Z.bed, P), { tone: "lo" }));
const SCREWS = k.corners(PLINTH, 10);
back.push(Ln(SCREWS.map(([x, y]) => k.ring(x, y, 2.4, Z.bed, P, 16)).join(""), { tone: "lo" }));
back.push(Dots(SCREWS.map(([x, y]) => at([x, y, Z.bed])), { size: 0.5 }));
// scale bar along the front margin: a tick every metre, a long one every five
const STRIP = { x: X0 + 30, y: Y1 + 6, w: 150, d: 6, r: 1 };
back.push(S(k.slabOf(STRIP, Z.bed, 0.8, P, 3), { tone: "lo", crease: "none" }));
const TICKS = k.topTicks(STRIP.x + 5, STRIP.x + STRIP.w - 5, u, 5, STRIP.y + 0.8, Z.bed + 0.8, [1.8, 3.6], P);
back.push(Ln(TICKS.minor, { tone: "lo" }), Ln(TICKS.major, { tone: "mid" }));
back.push(Dots([at([STRIP.x + 2.4, STRIP.y + 3, Z.bed + 0.8]), at([STRIP.x + STRIP.w - 2.4, STRIP.y + 3, Z.bed + 0.8])], { size: 0.45 }));
const LABEL = { x: X1 + 5, y: Y1 - 120, w: 7, d: 70, r: 1.2 };
back.push(S(k.slabOf(LABEL, Z.bed, 0.9, P, 3), { tone: "mid" }));
back.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.4), Z.bed + 0.9, P), { tone: "faint" }));
back.push(k.faceTextSvg(k.topMatrix([LABEL.x + 4.6, LABEL.y + LABEL.d - 6], Z.bed + 0.9, P, "y"), "CLIFF ROAD · 5A", { size: 3.2, tone: "lo" }));
back.push(Dots([at([LABEL.x + LABEL.w / 2, LABEL.y + 2.4, Z.bed + 0.9]), at([LABEL.x + LABEL.w / 2, LABEL.y + LABEL.d - 2.4, Z.bed + 0.9])], { size: 0.4 }));

// the pace knob on the plinth's front face: the driver's commitment, from grip (left) to the edge (right)
const KNOB = { x: X1 - 54, y: PLINTH.y + PLINTH.d, z: (Z.base + Z.bed) / 2, plate: 9.5, r: 5.4 };
const KNOB_SWEEP = [-135, 135];
{
  const F = G.frameOf([KNOB.x, KNOB.y, KNOB.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const face = (r, deg, y = 0.6) => {
    const a = (deg * Math.PI) / 180;
    return at([KNOB.x + Math.sin(a) * r, KNOB.y + y, KNOB.z + Math.cos(a) * r]);
  };
  back.push(S(G.disc(0, 0.6, KNOB.plate, F, P), { tone: "mid" }));
  let minor = "";
  let major = "";
  for (let i = 0; i <= 10; i++) {
    const deg = KNOB_SWEEP[0] + ((KNOB_SWEEP[1] - KNOB_SWEEP[0]) * i) / 10;
    const big = i % 5 === 0;
    const d = k.pathOf([face(KNOB.plate - 0.6, deg), face(KNOB.plate - (big ? 3 : 1.8), deg)]);
    if (big) major += d;
    else minor += d;
  }
  back.push(Ln(minor, { tone: "lo" }), Ln(major, { tone: "mid" }));
  back.push(Ln(k.pathOf(Array.from({ length: 41 }, (_, i) => face(KNOB.plate - 0.6, KNOB_SWEEP[0] + ((KNOB_SWEEP[1] - KNOB_SWEEP[0]) * i) / 40))), { tone: "lo" }));
  back.push(Dots([face(KNOB.plate - 4.1, KNOB_SWEEP[1])], { size: 0.7, tone: "hi" }).replace('class="iso-dots"', 'class="iso-dots cr-limit-dot"'));
  back.push(S(G.disc(0.6, 1.4, KNOB.r + 0.8, F, P), { tone: "mid" }));
  back.push(S(G.disc(1.4, 4.4, KNOB.r, F, P), { tone: "hi", crease: "lo", inner: k.fadedSvg(G.ribsOf(F, 1.7, 4.1, KNOB.r, 40, P, { fade: [0.1, 0.5] }), { tone: "lo" }) }));
  back.push(Dots([face(KNOB.plate + 3.2, -150, 0), face(KNOB.plate + 3.2, 150, 0)].map((p) => p), { size: 0.45 }));
}
const knobPointer = (share) => {
  const deg = KNOB_SWEEP[0] + (KNOB_SWEEP[1] - KNOB_SWEEP[0]) * share;
  const a = (deg * Math.PI) / 180;
  return k.pathOf([at([KNOB.x + Math.sin(a) * 1.2, KNOB.y + 4.45, KNOB.z + Math.cos(a) * 1.2]), at([KNOB.x + Math.sin(a) * (KNOB.r - 0.8), KNOB.y + 4.45, KNOB.z + Math.cos(a) * (KNOB.r - 0.8)])]);
};
back.push(`<path data-part="pace-pointer" class="iso-line" data-tone="lit" data-free="end" d="${knobPointer(1)}" style="stroke-width:1.2"/>`);

// bedrock under the whole model: a sawn section with its strata
back.push(T.layerSvg([BLOCK_RING], Z.bed, -Z.bed, P, { cut: onCut }));
back.push(Ln([-6, -12].map((z) => k.sideSeam(BLOCK, z, P, 1)).join(""), { tone: "faint" }));

// strata, bottom to top: the ones under water go behind the sea
for (const layer of LAYERS) {
  const top = layer.z1 === Z.road || layer.z1 === HILL[HILL.length - 1][1];
  const svg = T.layerSvg(layer.rings, layer.z0, layer.z1 - layer.z0, P, { joints: layer.z0 >= 43 && !layer.hill ? 0.1 : layer.hill ? 0.06 : 0, seed: layer.z0, cut: onCut, tone: top ? "mid" : "lo", className: `${layer.z1 <= Z.sea ? "cr-under" : ""}${top ? "" : " cr-strata"}` });
  if (layer.z1 <= Z.sea) back.push(svg);
  else if (layer.z1 <= Z.road) terrain.push(svg);
  else front.push(svg);
}

// the sea's glass sections on the two sawn faces we see
function heightAlong(points) {
  return points.map(([x, y]) => {
    let h = 0;
    for (const layer of LAYERS) if (!layer.hill && layer.rings.some((ring) => T.inside(ring, x, y))) h = Math.max(h, layer.z1);
    return h;
  });
}
function waterFace(points) {
  const h = heightAlong(points);
  const spans = [];
  let cur = null;
  points.forEach((p, i) => {
    if (h[i] < Z.sea - 3) {
      if (!cur) cur = [];
      cur.push([p, h[i]]);
    } else if (cur) {
      spans.push(cur);
      cur = null;
    }
  });
  if (cur) spans.push(cur);
  return spans.map((span) => {
    const low = span.map(([p, z]) => [p[0], p[1], z]);
    const high = [...span].reverse().map(([p]) => [p[0], p[1], Z.sea - 3]);
    return poly([...low, ...high]);
  }).join("");
}
const along = (a, b, step = 1) => {
  const count = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step);
  return Array.from({ length: count + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / count, a[1] + ((b[1] - a[1]) * i) / count]);
};
back.push(`<path class="cr-water-top" d="${poly([[X0, Y0, Z.sea], [X1, Y0, Z.sea], [X1, Y1, Z.sea], [X0, Y1, Z.sea]])}"/>`);
back.push(`<g class="cr-water-face"><path d="${waterFace(along([X0, Y1 - 0.01], [X1, Y1 - 0.01]))}"/><path d="${waterFace(along([X1 - 0.01, Y0], [X1 - 0.01, Y1]))}"/></g>`);

// ---- the road ----------------------------------------------------------------------------------------
const ri = (i, d) => M.roadPoint(road, i, d);
const span = (from, to, d, z = Z.road) => {
  const pts = [];
  for (let i = from; i <= to; i++) pts.push([...ri(i, d), z]);
  return pts;
};
const I0 = road.first;
const I1 = road.last;
const ribbon = (from, to, d0, d1) => poly([...span(from, to, d0), ...span(from, to, d1).reverse()]);
terrain.push(`<path class="cr-asphalt" d="${ribbon(I0, I1, -M.HALF_ROAD, M.HALF_ROAD)}"/>`);
terrain.push(`<path class="cr-paint" d="${ribbon(I0, I1, -M.HALF_ROAD + 0.2, -M.HALF_ROAD + 0.35)}${ribbon(I0, I1, M.HALF_ROAD - 0.35, M.HALF_ROAD - 0.2)}"/>`);
// centre dashes, 3 m paint and 6 m gap
const per = Math.round(1 / road.ds);
let dashes = "";
for (let i = I0 + 4 * per; i + 3 * per < I1; i += 9 * per) dashes += ribbon(i, i + 3 * per, -0.07, 0.07);
terrain.push(`<path class="cr-paint" d="${dashes}"/>`);
terrain.push(Ln(poly(span(I0, I1, -M.HALF_ROAD), false) + poly(span(I0, I1, M.HALF_ROAD), false), { tone: "lo" }));

// road studs: one in every gap of the centre line, and on both edge lines every 18 m
const studs = [];
for (let i = I0 + 8 * per; i < I1; i += 9 * per) studs.push([...ri(i, 0), Z.road]);
const edgeStuds = [];
for (let i = I0 + 6 * per; i < I1; i += 18 * per) edgeStuds.push([...ri(i, -M.HALF_ROAD + 0.28), Z.road], [...ri(i, M.HALF_ROAD - 0.28), Z.road]);
terrain.push(Dots([...studs, ...edgeStuds].map(at), { size: 0.42, tone: "mid" }).replace('class="iso-dots"', 'class="iso-dots cr-stud"'));

// tyre marks: the rear wheels' paths wherever the model's own lap at the limit held more than 10° of drift
{
  const runs = [];
  let cur = null;
  for (const [x, y, yaw, beta] of LAP.trace) {
    if (beta > (10 * Math.PI) / 180 && x > M.PORTAL_X + 4) {
      if (!cur) cur = { l: [], r: [] };
      const c = Math.cos(yaw);
      const sn = Math.sin(yaw);
      const back = -1.2 * u;
      const half = (M.CAR.track / 2) * u;
      cur.l.push(at([x + back * c - half * sn, y + back * sn + half * c, Z.road]));
      cur.r.push(at([x + back * c + half * sn, y + back * sn - half * c, Z.road]));
    } else if (cur) {
      runs.push(cur);
      cur = null;
    }
  }
  if (cur) runs.push(cur);
  const marks = [];
  for (const run of runs) {
    if (run.l.length < 8) continue;
    const step = Math.max(1, Math.floor(run.l.length / 60));
    for (const side of [run.l, run.r]) {
      const pts = side.filter((_, i) => i % step === 0);
      marks.push(k.fadeLineSvg(pts, { fade: [14, 18], tone: "lo", className: "cr-skid" }));
    }
  }
  terrain.push(`<g class="cr-skids">${marks.join("")}</g>`);
}

// ---- the plateau ------------------------------------------------------------------------------------
const heightAt = (x, y) => {
  let h = 0;
  for (const layer of LAYERS) if (layer.rings.some((ring) => T.inside(ring, x, y))) h = Math.max(h, layer.z1);
  return h;
};
// a low grassy knoll inside the hairpin
const KNOLL = (x, y) => {
  const dx = (x - 66) / 34;
  const dy = (y + 16) / 22;
  return Math.hypot(dx, dy) - 1 + 0.18 * (2 * T.fbm(x / 9, y / 9, 61) - 1);
};
const knollRings = (shrink) => T.contour(T.gridOf(BOX, STEP, (x, y, edge) => (edge ? 1 : KNOLL(x, y) + shrink))).map((r) => T.simplifyRing(r, 0.4));
terrain.push(T.layerSvg(knollRings(0), Z.road, 2.6, P, { seed: 3 }));
terrain.push(T.layerSvg(knollRings(0.42), Z.road + 2.6, 2.2, P, { seed: 4 }));

// stipple: grass on the plateau and the hill, gravel on the verge
{
  const grass = [];
  const gravel = [];
  for (let i = 0; i < 5200; i++) {
    const x = X0 + T.hash2(i, 1, 71) * (X1 - X0);
    const y = Y0 + T.hash2(i, 2, 72) * (Y1 - Y0);
    const h = heightAt(x, y);
    if (h < Z.road) continue;
    if (h === Z.road) {
      let best = Infinity;
      let bi = 0;
      for (let j = 0; j < road.n; j += 4) {
        const d = Math.hypot(road.pts[j][0] - x, road.pts[j][1] - y);
        if (d < best) {
          best = d;
          bi = j;
        }
      }
      const q = M.project(road, x, y, bi);
      if (Math.abs(q.d) < M.HALF_ROAD + 0.15 && q.i > I0 && q.i < I1) continue;
      if (x < M.PORTAL_X + 1) continue;
      if (q.d < -M.HALF_ROAD && q.i > I0 && q.i < I1) gravel.push([x, y, h]);
      else if (T.hash2(i, 3, 73) < 0.55) grass.push([x, y, h + (KNOLL(x, y) < 0 ? (KNOLL(x, y) < -0.42 ? 4.8 : 2.6) : 0)]);
    } else if (T.hash2(i, 3, 73) < 0.7) grass.push([x, y, h]);
  }
  terrain.push(Dots(gravel.map(at), { size: 0.38, tone: "lo" }));
  terrain.push(Dots(grass.filter(([, , z]) => z <= Z.road + 5).map(at), { size: 0.42, tone: "faint" }).replace('class="iso-dots"', 'class="iso-dots cr-grass"'));
  front.push(Dots(grass.filter(([, , z]) => z > Z.road + 5).map(at), { size: 0.42, tone: "faint" }).replace('class="iso-dots"', 'class="iso-dots cr-grass"'));
}

// boulders on the wave-cut platform at the foot of the cliff
{
  const platform = LAYERS.find((l) => l.z0 === 40);
  const notch = LAYERS.find((l) => l.z0 === 43);
  const rocks = [];
  for (let i = 0; i < 700 && rocks.length < 46; i++) {
    const c = coast[Math.floor(T.hash2(i, 9, 81) * coast.length)];
    const ang = T.hash2(i, 8, 82) * Math.PI * 2;
    const dist = 3 + T.hash2(i, 7, 83) * 9;
    const x = c[0] + Math.cos(ang) * dist;
    const y = c[1] + Math.sin(ang) * dist;
    const r = 1.6 + 2.6 * T.hash2(i, 6, 84);
    if (!platform.rings.some((ring) => T.inside(ring, x, y))) continue;
    if (notch.rings.some((ring) => T.inside(ring, x, y))) continue;
    if (rocks.some((q) => Math.hypot(q.x - x, q.y - y) < q.r + r + 0.6)) continue;
    // only rocks the viewer can see: nothing of the cliff between them and the eye
    let hidden = false;
    for (let t = 2; t < 320 && !hidden; t += 3) if (heightAt(x + V[0] * t, y + V[1] * t) > 43 + V[2] * t) hidden = true;
    if (hidden) continue;
    rocks.push({ x, y, r, seed: i });
  }
  rocks.sort((a, b) => depth([a.x, a.y, 0]) - depth([b.x, b.y, 0]));
  terrain.splice(terrain.findIndex((t) => t.includes("cr-asphalt")), 0, rocks.map((q) => SC.boulder({ P, x: q.x, y: q.y, z: 43, r: q.r, seed: q.seed })).join(""));
}

// ---- tunnel portals ----------------------------------------------------------------------------------
const PORTALS = [
  SC.portal({ P, face: M.PORTAL_X, yc: -75, z: Z.road, id: "portal-far" }),
  SC.portal({ P, face: M.PORTAL_X, yc: 75, z: Z.road, id: "portal-near" }),
];
for (const [index, pt] of PORTALS.entries()) {
  front.push(`<g class="cr-portal" data-portal="${index}">${pt.interior}<g class="cr-inside" data-slot="${index}" clip-path="url(#${index ? "portal-near" : "portal-far"}-clip)"></g>${pt.shadow}${pt.facade}</g>`);
}

// a post-and-rail fence along the top of the rock wall over the portals
{
  const zt = 207;
  const xs = M.PORTAL_X - 3.5;
  const posts = [];
  for (let y = -150; y <= 140; y += 9) if (heightAt(xs, y) >= zt - 0.5) posts.push(y);
  let svg = "";
  for (const y of posts) svg += S(k.slabOf({ x: xs - 0.5, y: y - 0.5, w: 1, d: 1, r: 0.2 }, zt, 5, P, 2), { tone: "mid" });
  let rails = "";
  for (let i = 0; i + 1 < posts.length; i++) if (posts[i + 1] - posts[i] < 10) for (const h of [2.4, 4.4]) rails += k.pathOf([at([xs, posts[i] + 0.5, zt + h]), at([xs, posts[i + 1] - 0.5, zt + h])]);
  front.push(`<g class="cr-fence">${Ln(rails, { tone: "lo" })}${svg}</g>`);
}

// ---- things that stand on the plateau, sorted with the car each frame -----------------------------------
const items = [];
const put = (name, at3, svg, high = 4) => items.push({ name, key: depth(at3), svg, at: [at3[0], at3[1], at3[2] + high] });
for (const [i, t] of [[66, -12, 30, 1], [82, -26, 22, 2], [48, -30, 18, 3], [-106, -14, 24, 4], [-109, -38, 15, 5]].entries()) {
  const [x, y, h, seed] = t;
  const tree = SC.cypress({ P, x, y, z: Z.road + (KNOLL(x, y) < -0.42 ? 4.8 : KNOLL(x, y) < 0 ? 2.6 : 0), height: h, seed });
  put(`tree${i}`, tree.at, tree.svg);
}
// the line runs along x ≈ -184; the trees keep clear of its wires, as a linesman would see to
for (const [i, [x, y, h, seed]] of [[-148, -130, 24, 6], [-152, -58, 28, 7], [-150, 12, 20, 8], [-154, 74, 26, 9], [-150, 132, 18, 10], [-206, -10, 16, 11], [-208, 120, 14, 12]].entries()) {
  const z = heightAt(x, y);
  const tree = SC.cypress({ P, x, y, z, height: h, seed, lean: 0.7 });
  put(`hilltree${i}`, tree.at, tree.svg);
}
// delineators round the inside of the hairpin, a chevron board on the outside of the cove's right-hander
{
  const tipFrom = road.pts.findIndex(([x], i) => i > I0 && x > 110);
  for (let i = tipFrom, j = 0; j < 9; i += Math.round(6 / road.ds), j++) {
    const [x, y] = ri(i, M.HALF_ROAD + 1.0);
    const h = road.heading[i];
    put(`post${j}`, [x, y, Z.road], SC.delineator({ P, x, y, z: Z.road, toward: h - Math.PI / 2 }).svg);
  }
  const apex = road.pts.reduce((best, [x, y], i) => (i > I0 + 900 && y < road.pts[best][1] && x < 60 ? i : best), I1 - 10);
  const [cx, cy] = ri(apex, M.HALF_ROAD + 2.4);
  put("chevron", [cx, cy, Z.road], SC.sign({ P, x: cx, y: cy, z: Z.road, facing: road.heading[apex] + Math.PI, kind: "chevron", height: 9, w: 11, h: 5 }).svg);
  const warnAt = road.pts.findIndex(([x, y], i) => i > I0 + 800 && x < 75 && y > 0);
  const [wx, wy] = ri(warnAt, -(M.HALF_ROAD + 1.4));
  put("warning", [wx, wy, Z.road], SC.sign({ P, x: wx, y: wy, z: Z.road, facing: road.heading[warnAt] + Math.PI, kind: "bend", height: 11, w: 7, h: 7 }).svg);
  const [mx, my] = ri(road.pts.findIndex(([x], i) => i > I0 && x > -60), M.HALF_ROAD + 1.2);
  put("milestone", [mx, my, Z.road], SC.milestone({ P, x: mx, y: my, z: Z.road }).svg);
}
// telegraph poles across the hill, wires sagging between them
{
  const line = [[-176, -158], [-180, -92], [-184, -26], [-188, 40], [-192, 106]];
  const poles = line.map(([x, y]) => ({ x, y, z: heightAt(x, y) }));
  const built = poles.map((p, i) => {
    const next = poles[Math.min(i + 1, poles.length - 1)];
    const prev = poles[Math.max(i - 1, 0)];
    const dir = G.unit3([next.x - prev.x, next.y - prev.y, 0]);
    return SC.pole({ P, x: p.x, y: p.y, z: p.z, height: 38, along: [dir[0], dir[1]] });
  });
  built.forEach((b, i) => {
    let svg = b.svg;
    if (i + 1 < built.length) for (const side of [0, 1]) svg = SC.wire({ P, a: b.tips[side], b: built[i + 1].tips[side], sag: 3.2 }) + svg;
    put(`pole${i}`, [poles[i].x, poles[i].y, poles[i].z], svg);
  });
}
// gorse on the headland and along the hill's foot
for (const [i, [x, y, r]] of [[20, -40, 4.2], [96, 10, 3.4], [128, -42, 3.8], [-30, -46, 3.0], [-96, -48, 3.6], [-100, 52, 3.2], [140, 36, 2.8], [-70, 20, 3.4], [6, 4, 2.6]].entries()) {
  const z = Z.road + (KNOLL(x, y) < -0.42 ? 4.8 : KNOLL(x, y) < 0 ? 2.6 : 0);
  put(`bush${i}`, [x, y, z], SC.bush({ P, x, y, z, r, seed: 300 + i }));
}
// a viewpoint between the portals: a bench, binoculars and a bin, looking out over the headland
{
  const bn = SC.bench({ P, x: -108, y: 28, z: Z.road, facing: 0 });
  put("bench", bn.at, bn.svg);
  const vw = SC.viewer({ P, x: -104, y: 44, z: Z.road, facing: 0.3 });
  put("viewer", vw.at, vw.svg);
  const bi = SC.bin({ P, x: -110, y: 14, z: Z.road });
  put("bin", bi.at, bi.svg);
}
// a windsock inside the hairpin: crosswind warning for the exposed headland
const SOCK = [146, -2, Z.road];
put("sock", SOCK, sockSvg(SOCK, windOf(0), P, G, k));
// a few loose rocks on the plateau
for (const [i, [x, y, r]] of [[-114, -50, 2.6], [150, -6, 3.6], [28, -46, 2.2], [104, 30, 2.8], [-60, -40, 3.0]].entries()) put(`rock${i}`, [x, y, Z.road], SC.boulder({ P, x, y, z: Z.road, r, seed: 200 + i }));
items.sort((a, b) => a.key - b.key);
const STILL = (() => {
  let best = 0;
  LAP.trace.forEach(([x, y, yaw, beta], i) => {
    if (x > 150 && beta > LAP.trace[best][3]) best = i;
  });
  const [x, y, yaw] = LAP.trace[best];
  return { x, y, z: Z.road, yaw, steer: -0.3, best };
})();
const carKey = depth([STILL.x, STILL.y, Z.road]);
const stillCar = `<g data-item="car" data-k="${carKey.toFixed(2)}" class="cr-car">${carSvg(STILL, P, G, k)}</g>`;
const before = items.filter((it) => it.key <= carKey);
const after = items.filter((it) => it.key > carKey);
const itemSvg = (it) => `<g data-item="${it.name}" data-k="${it.key.toFixed(2)}" data-at="${it.at.map((v) => v.toFixed(1)).join(",")}">${it.svg}</g>`;
front.push(`<g class="cr-items">${before.map(itemSvg).join("")}${stillCar}${after.map(itemSvg).join("")}</g>`);

// ---- the vitrine: glass on the two sawn sea faces, a corner post --------------------------------------
{
  const top = Z.sea + 6;
  const glass = (plan) => {
    const g = k.slabOf(plan, Z.floor, top - Z.floor, P, 1, 0);
    return `<g class="cr-glass">${Ln(g.outline + g.crease, { tone: "faint" })}</g>`;
  };
  const westEnd = X0;
  front.push(glass({ x: westEnd, y: Y1 - 0.8, w: X1 - westEnd, d: 0.8, r: 0 }));
  front.push(glass({ x: X1 - 0.8, y: Y0, w: 0.8, d: Y1 - Y0, r: 0 }));
  front.push(S(k.slabOf({ x: X1 - 2.4, y: Y1 - 2.4, w: 3.4, d: 3.4, r: 0.6 }, Z.bed, top + 1 - Z.bed, P, 3, 0.4), { tone: "mid" }));
  front.push(S(k.slabOf({ x: X1 - 2.4, y: Y0 - 1, w: 3.4, d: 3.4, r: 0.6 }, Z.bed, top + 1 - Z.bed, P, 3, 0.4), { tone: "mid" }));
  front.push(S(k.slabOf({ x: X0 - 1, y: Y1 - 2.4, w: 3.4, d: 3.4, r: 0.6 }, Z.bed, top + 1 - Z.bed, P, 3, 0.4), { tone: "mid" }));
}

// ---- data for the shaders: a coast texture, spray points, studs ---------------------------------------
const platformOff = STRATA.find((s) => s[0] === 40)[2];
const notchOff = STRATA.find((s) => s[0] === 43)[2];
const waterSdf = (x, y) => Math.min(sdfCoast(x, y) - Math.max(platformOff(x, y), notchOff(x, y)), stackSdf(x, y, 43));
const TEX = { step: 3, x0: X0, y0: Y0 };
TEX.nx = Math.ceil((X1 - X0) / TEX.step) + 1;
TEX.ny = Math.ceil((Y1 - Y0) / TEX.step) + 1;
const texBytes = new Uint8Array(TEX.nx * TEX.ny * 4);
const enc = (d) => Math.round(Math.min(1, Math.max(0, (d + 32) / 128)) * 255);
for (let j = 0; j < TEX.ny; j++) {
  for (let i = 0; i < TEX.nx; i++) {
    const x = X0 + i * TEX.step;
    const y = Y0 + j * TEX.step;
    const o = (j * TEX.nx + i) * 4;
    texBytes[o] = enc(waterSdf(x, y));
    texBytes[o + 1] = enc(Math.min(sdfCoast(x, y), stackSdf(x, y, Z.road)));
    texBytes[o + 2] = Math.round(Math.min(255, (heightAt(x, y) / 256) * 255));
    texBytes[o + 3] = 255;
  }
}
// where crests hit: the waterline, sampled every 5 units with its outward normal
const SPRAY_AT = [];
{
  for (let i = 0; i < coast.length - 1; i++) {
    const [ax, ay] = coast[i];
    const [bx, by] = coast[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    for (let t = 0; t < len; t += 5) {
      const x = ax + ((bx - ax) * t) / len;
      const y = ay + ((by - ay) * t) / len;
      if (x < X0 + 4 || x > X1 - 4 || y < Y0 + 4 || y > Y1 - 4) continue;
      const nx = (by - ay) / len;
      const ny = -(bx - ax) / len;
      // walk out along the normal to the waterline
      let d = 0;
      while (waterSdf(x + nx * d, y + ny * d) < 0 && d < 30) d += 0.5;
      SPRAY_AT.push([Math.round((x + nx * d) * 10) / 10, Math.round((y + ny * d) * 10) / 10, Math.round(nx * 100) / 100, Math.round(ny * 100) / 100]);
    }
  }
  for (const st of STACKS.filter((s) => s.top > 60)) {
    for (let a = 0; a < Math.PI * 2; a += 0.45) SPRAY_AT.push([Math.round(st.x + Math.cos(a) * (st.r + 1)), Math.round(st.y + Math.sin(a) * (st.r + 1)), Math.round(Math.cos(a) * 100) / 100, Math.round(Math.sin(a) * 100) / 100]);
  }
}

const DATA = {
  coast: { ...TEX, bytes: Buffer.from(texBytes).toString("base64") },
  sprayAt: SPRAY_AT,
  studs: studs.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]),
  portals: PORTALS.map((pt) => pt.opening),
  W,
  H,
  P,
  camera: glCamera(P),
  profile,
  limit: LIMIT,
  paceMin: 0.85,
  portal: PORTALS[0].plane,
  x0: X0,
  sock: SOCK,
  knob: KNOB,
  sweep: KNOB_SWEEP,
  road: Z.road,
  sea: Z.sea,
  box: BOX,
  still: STILL.best,
};

// ---- assemble ----------------------------------------------------------------------------------------
const LABEL_TEXT = "A diorama of a headland at night: a road with no guard rails loops round the cliff top between two tunnel portals, and the sea breaks against the foot of the cliff.";
const backSvg = k.figureSvg({ width: W, height: H, label: LABEL_TEXT, body: back, className: "cr-back" });
const layerSvg = (name, body) => `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg cr-layer ${name}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${body.join("")}</svg>`;
const stage = `<div class="cr-stage" tabindex="0" role="slider" aria-label="Cliff road. Move the pointer across the figure, or press the left and right arrow keys, to set how hard the driver pushes." aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><span class="cr-said" aria-live="polite"></span>${backSvg}<canvas class="cr-layer cr-gl cr-sea-gl" aria-hidden="true"></canvas>${layerSvg("cr-terrain", terrain)}<canvas class="cr-layer cr-gl cr-light-gl" aria-hidden="true"></canvas>${layerSvg("cr-front", front)}<canvas class="cr-layer cr-gl cr-fx-gl" aria-hidden="true"></canvas></div>`;

const SWELL_SLANT_FOR_CAPTION = 0.35;
// ---- the card: every number below is computed from the model ---------------------------------------
const kmh = (v) => Math.round(v * 3.6);
const TIP_R = M.ROUTE.find((r) => r[0] === "arc" && r[1] === 180)[2];
const COVE_R = M.ROUTE.find((r) => r[0] === "arc" && r[1] === -90)[2];
const vGrip = Math.sqrt(M.MU * M.GRAV * TIP_R);
const lapAt = (pace) => M.lapOf(road, profile, pace);
const CALM = lapAt(0.85);
const swell6 = M.swellOf(6);
const sweep = (SWELL_SLANT_FOR_CAPTION * (236 - M.PORTAL_X)) / u / swell6.c;
const sprayTop = M.SPRAY.rise ** 2 / (2 * M.GRAV);
const roadAbove = (Z.road - Z.sea) / u;
const gusts = Array.from({ length: 2000 }, (_, i) => windOf(i * 0.05).speed);
const windLo = Math.min(...gusts);
const windHi = Math.max(...gusts);
const caption = `A headland on a plinth, at night: ${Math.round(road.length - (road.first + road.n - 1 - road.last) * road.ds)} m of road with no guard rail runs ${roadAbove} m above the sea between two tunnel portals. Damp asphalt under sea mist grips at μ ${M.MU}, so the ${TIP_R} m hairpin holds on grip up to √(μgR) = ${kmh(vGrip)} km/h and the ${COVE_R} m cove bend up to ${kmh(Math.sqrt(M.MU * M.GRAV * COVE_R))} km/h. The driver brakes hard from up to ${Math.round(LAP.top)} km/h on the far leg, and turns in faster than grip allows. The rear tyres then slide at μ ${M.MU_SLIDE}, the path widens to v²/(μg), and the car drifts out toward the drop with its nose held into the bend, up to ${Math.round(LAP.peakDrift)}°. Near the edge the driver lifts, which tightens the line. At the top of the control the model's line clears the edge by ${LAP.least.toFixed(1)} m; at the bottom the car corners on grip, with ${Math.round(CALM.peakDrift)}° of tyre slip at most. The tyre marks are the rear wheels' path on that fastest lap. The swell has an ${M.SWELL.period} s period; in 6 m of water its crests are ${Math.round(swell6.lambda)} m apart and travel ${swell6.c.toFixed(1)} m/s. Refraction wraps them round the headland, so each one breaks on the tip first and runs back along both cliffs in about ${sweep.toFixed(0)} s, throwing spray up the rock at up to ${M.SPRAY.rise} m/s, ${sprayTop.toFixed(1)} m high. An onshore wind gusting ${windLo.toFixed(0)} to ${windHi.toFixed(0)} m/s holds the windsock in the hairpin straight out, since a sock fills at 7.7 m/s (15 knots), and carries the spray and the tyre smoke inland.`;
const body = `<div class="cr">${k.plateHtml({
  fig: "Fig 5A",
  title: "Cliff road at night",
  hint: "Move across to push harder",
  readout: M.readoutOf({ ...M.carStart(road, profile, 1), margin: 3 }),
  keys: [
    { mark: "lit", label: "The car: a 1,150 kg rear-drive coupe, lamps up" },
    { mark: "dashed", label: "Tyre marks from the model's fastest lap" },
    { mark: "raised", label: `Chalk cliff, ${roadAbove} m from road to sea` },
    { mark: "flat", label: `Sea: ${M.SWELL.period} s swell breaking on the rock` },
    { mark: "edge", label: "Knob on the plinth: how hard the driver pushes" },
  ],
  caption,
  body: stage,
})}</div>`;

// one module script: the kit, the lathe as G, the model as M, the car, the WebGL layer, then the live code
function asObject(file, name) {
  const source = readFileSync(join(HERE, file), "utf8").replace(/^import .*$/gm, "");
  const names = [...source.matchAll(/^export (?:const|function) (\w+)/gm)].map((m) => m[1]);
  return `const ${name} = (() => {\n${source.replace(/^export /gm, "")}\nreturn { ${names.join(", ")} };\n})();\n`;
}
const latheSource = readFileSync(join(HERE, "../../anatomy/kit/lathe.mjs"), "utf8").replace(/^import .*$/gm, "");
const latheNames = [...latheSource.matchAll(/^export (?:const|function) (\w+)/gm)].map((m) => m[1]);
const LATHE = `const G = (() => {\n${latheSource.replace(/^export /gm, "")}\nreturn { ${latheNames.join(", ")} };\n})();\n`;
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));
const SHADERS = readFileSync(join(HERE, "shaders.js"), "utf8");
const SCRIPT = kitScript() + LATHE + asObject("model.mjs", "M") + asObject("car.mjs", "CARS") + glScript() + SHADERS + LIVE;
const CSS = readFileSync(join(HERE, "cliff.css"), "utf8");
const page = k.pageHtml({ title: "Cliff road at night", theme, body: `<style>${CSS}</style>${body}`, script: SCRIPT, width: 1000 });
const name = theme === "light" ? "cliff-road-light.html" : "cliff-road.html";
writeFileSync(join(HERE, name), page);
// the published artifact: page content only (the host adds the document shell), committed to the night look
if (theme === "dark") {
  const SITE_CSS = `:root{color-scheme:dark}*{box-sizing:border-box}body{background:#090c0f;color:#a3a3a3;font:14px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}.iso-page{width:min(1000px,100% - 32px);margin:40px auto 72px}.iso{background:#090c0f;--anatomy-page:#090c0f}`;
  const artifact = `<title>Cliff Road at Night</title><style>${k.ISO_CSS}${SITE_CSS}${CSS}</style><div class="iso" data-theme="dark"><main class="iso-page">${body}</main></div><script type="module">${SCRIPT.replace(/<\/(script)/gi, "<\\/$1")}</script>`;
  writeFileSync(join(HERE, "cliff-road-artifact.html"), artifact);
}
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `scale ${P.scale.toFixed(3)}`, `limit ${LIMIT.toFixed(3)}`, `${((Date.now() - t0) / 1000).toFixed(1)} s`);
