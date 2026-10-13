import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../anatomy/kit/iso-kit.mjs";
import * as G from "../../anatomy/kit/lathe.mjs";
import { glCamera } from "../../anatomy/kit/gl.mjs";
import { kitScript, glScript } from "../../anatomy/scripts/inline-kit.mjs";
import * as M from "./model.mjs";
import * as T from "./terrain.mjs";
import * as SC from "./scene.mjs";
import { carSvg } from "./car.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const t0 = Date.now();

const W = 960;
const H = 860;
const AZIMUTH = 72;
const ELEVATION = 30;
const u = M.U;

// ---- world -----------------------------------------------------------------------------------------
const Z = { base: -42, bed: -18, floor: 0, sea: M.LEVEL.sea * u, toe: M.LEVEL.toe * u, top: M.LEVEL.top * u, bottom: M.LEVEL.bottom * u, crown: 340 };
const BOX = [-250, -205, 370, 215];
const [X0, Y0, X1, Y1] = BOX;
const BLOCK = { x: X0, y: Y0, w: X1 - X0, d: Y1 - Y0, r: 0 };
const PLINTH = { x: X0 - 16, y: Y0 - 16, w: X1 - X0 + 32, d: Y1 - Y0 + 32, r: 6 };

const road = M.roadOf();
const profile = M.speedProfile(road);
const LIMIT = M.paceLimit(road, profile);
const LAP = M.lapOf(road, profile, LIMIT);

const P = k.fitProjection([...k.boxCorners(PLINTH, Z.base - 8, Z.bed), ...k.boxCorners(BLOCK, Z.bed, Z.sea), [X0, Y0, Z.crown], [X0 + 200, Y0, Z.crown - 30], [X0, Y0 + 120, Z.crown - 60]], W, H, { pad: 26, azimuth: AZIMUTH, elevation: ELEVATION });
const V = G.viewOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const poly = (pts, closed = true) => k.pathOf(pts.map(at), closed);
const depth = (p) => G.dot3(p, V);
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// ---- the mountain ------------------------------------------------------------------------------------
// A coastal peak: the sea along the right and the front, a rock wall at the left with both tunnel mouths,
// the summit at the back. The pass is cut into its face as benches; the rest is the mountain's own slope,
// with a knoll inside each hairpin and two spurs on the face that hide stretches of the road above them.
const STEP = 2;
const n = (x, y, seed, scale = 22) => 2 * T.fbm(x / scale, y / scale, seed) - 1;
// the coast: straight and clean where the two sea hairpins sit on the cliff top, ragged elsewhere
const nearPins = (y) => Math.max(Math.exp(-(((y + 104) / 52) ** 2)), Math.exp(-(((y - 76) / 52) ** 2)));
const coastX = (y) => 240 + 7 * (1 + n(0, y, 5, 26)) * (1 - nearPins(y));
const coastY = (x) => 150 + 4 * (1 + n(x, 0, 6, 30));
const coastSdf = (x, y) => {
  const qx = x - coastX(y) + 30;
  const qy = y - coastY(x) + 30;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - 30;
};
const BUMPS = [
  { x: 175, y: -104, r: 17, h: 36 },
  { x: -140, y: -14, r: 17, h: 34 },
  { x: 175, y: 76, r: 17, h: 35 },
  { x: -28, y: -104, r: 19, h: 30 },
  { x: -64, y: 74, r: 19, h: 30 },
  { x: 74, y: -14, r: 16, h: 24 },
  { x: 4, y: 34, r: 18, h: 30 },
];
const SLOPE = (y) => 253 - 0.433 * (y + 150) + (y < -172 ? 0.9 * (-172 - y) : 0);
const RIDGE = (y) => 338 - 0.56 * (y + 150);
// the rock wall at the left is flat only where the two headwalls stand against it
const nearPortals = (y) => Math.max(Math.exp(-(((y + 152) / 42) ** 4)), Math.exp(-(((y - 115) / 42) ** 4)));
const mountain = (x, y) => {
  let h = SLOPE(y) + 9 * n(x, y, 21, 45) + 4 * n(x, y, 22, 14);
  // knolls and spurs: rough-edged, not turned on a lathe
  for (const b of BUMPS) {
    const r = b.r * (1 + 0.38 * n(x, y, 31 + b.r, 8) + 0.12 * n(x, y, 37 + b.r, 3));
    h += b.h * Math.exp(-((x - b.x) ** 2 + (y - b.y) ** 2) / (2 * r * r));
  }
  h += 52 * Math.exp(-((x + 110) ** 2) / 9000 - ((y + 205) ** 2) / 1800);
  const face = M.PORTAL_X + 5 * n(0, y, 24, 9) * (1 - nearPortals(y));
  if (x < face) h = Math.max(h, RIDGE(y) + 7 * n(x, y, 23, 10) + 3 * n(x, y, 25, 4));
  return h;
};
// the road's nearest sample, from a bucket grid of every other sample
const ROAD_CELL = 16;
const roadCells = new Map();
for (let i = 0; i < road.n; i += 2) {
  const key = `${Math.floor(road.pts[i][0] / ROAD_CELL)},${Math.floor(road.pts[i][1] / ROAD_CELL)}`;
  if (!roadCells.has(key)) roadCells.set(key, []);
  roadCells.get(key).push(i);
}
const nearestRoad = (x, y, reach = 3) => {
  const cx = Math.floor(x / ROAD_CELL);
  const cy = Math.floor(y / ROAD_CELL);
  let best = -1;
  let bestD = Infinity;
  for (let a = -reach; a <= reach; a++) {
    for (let b = -reach; b <= reach; b++) {
      const list = roadCells.get(`${cx + a},${cy + b}`);
      if (!list) continue;
      for (const i of list) {
        const d = (road.pts[i][0] - x) ** 2 + (road.pts[i][1] - y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
    }
  }
  if (best < 0) return null;
  const h = road.heading[best];
  return { i: best, d: -(x - road.pts[best][0]) * Math.sin(h) + (y - road.pts[best][1]) * Math.cos(h), dist: Math.sqrt(bestD) };
};
// a short tunnel through a rock rib on the third leg: the car goes into the rock and comes out facing us
const TUNNEL = (() => {
  let last1 = 0;
  let first2 = road.n - 1;
  for (let i = 0; i < road.n; i++) if (road.hairpin[i] === 1) last1 = i;
  for (let i = road.n - 1; i >= 0; i--) if (road.hairpin[i] === 2) first2 = i;
  let i0 = last1;
  while (i0 < first2 && road.pts[i0][0] < -22) i0++;
  let i1 = i0;
  while (i1 < first2 && road.pts[i1][0] < 32) i1++;
  return { i0, i1, roof: 44 };
})();
// how far the bench reaches from the centreline (metres), on the drop side and on the hill side
const benchOf = (i, side) => M.HALF_ROAD + (side === road.drop[i] ? road.verge[i] : 0.8);
const ground = (x, y) => {
  const m = mountain(x, y);
  if (x < M.PORTAL_X - 1) return m;
  const near = nearestRoad(x, y);
  if (!near || near.dist > 64) return m;
  const { i, d } = near;
  const zr = road.z[i];
  // over the tunnel the rib stands highest above the road and falls away to either side, ragged
  if (i >= TUNNEL.i0 && i <= TUNNEL.i1 && Math.abs(d) < 36) return Math.max(m, zr + TUNNEL.roof - 0.006 * d * d + 6 * n(x, y, 27, 9) - 7 * smooth(10, 0, Math.min(x - road.pts[TUNNEL.i0][0], road.pts[TUNNEL.i1][0] - x)) * smooth(14, 30, Math.abs(d)));
  const side = Math.sign(d) || 1;
  const drop = side === road.drop[i];
  const c = benchOf(i, side) * u;
  const a = Math.abs(d);
  if (a <= c) return zr;
  // the drop side falls away at once; the hill side is a cut bank
  const target = drop ? Math.min(m, zr - 8) : m;
  return zr + (target - zr) * smooth(c, c + (drop ? 10 : 9), a);
};
const STACKS = [
  { x: 300, y: 64, r: 15, top: 132, seed: 3 },
  { x: 332, y: -120, r: 7, top: 49, seed: 5 },
  { x: 110, y: 192, r: 6, top: 43, seed: 7 },
  { x: 345, y: 150, r: 5, top: 45, seed: 11 },
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
const coastGrid = T.gridOf(BOX, STEP, (x, y) => coastSdf(x, y));
const groundGrid = T.gridOf(BOX, STEP, (x, y, edge) => (edge ? 0 : ground(x, y)));
const gridAt = (g, x, y) => {
  const i = Math.max(0, Math.min(g.nx - 1, Math.round((x - g.x0) / g.step)));
  const j = Math.max(0, Math.min(g.ny - 1, Math.round((y - g.y0) / g.step)));
  return g.v[j * g.nx + i];
};

// the cliffs: thin beds of sedimentary rock. Each bed's outline is the coast pushed out by a lean, slowly
// drifting ledges, vertical joints shared by every bed, a wave-cut notch at the waterline, caves and gullies
const blocky = (v) => Math.sign(v) * Math.abs(v) ** 0.55;
const joint = (x, y) => 4.6 * blocky(2 * T.fbm(x / 8, y / 8, 41, 2) - 1) + 2.2 * (2 * T.fbm(x / 23, y / 23, 43, 2) - 1);
const ledge = (x, y, z) => 3.4 * (2 * T.fbmZ(x / 15, y / 15, z, 51, 26) - 1);
const GULLIES = [[-150, coastY(-150)], [10, coastY(10)], [coastX(-10), -10], [coastX(150), 150 - 10]];
const CAVES = [[-80, coastY(-80)], [110, coastY(110)], [coastX(-160), -160]];
const bowl = (list, r) => (x, y) => list.reduce((sum, [cx, cy]) => sum + Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (r * r)), 0);
const gully = bowl(GULLIES, 5.5);
const cave = bowl(CAVES, 8.5);
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
  [55, 61, (x, y) => 0.045 * (240 - 58) + ledge(x, y, 58) + joint(x, y) - 0.6 - 11 * cave(x, y) - 11 * gully(x, y)],
];
const LAYER_STEP = 7;
for (let z = 61; z < Z.crown; z += LAYER_STEP) {
  // the lean and the ledges fade out over the top 20 units of a cliff, so its edge meets the road clean
  STRATA.push([z, z + LAYER_STEP, (x, y, top) => (0.045 * (240 - z) + ledge(x, y, z + 3.5) + joint(x, y) - 0.6 - (z < 150 ? 11 * gully(x, y) : 0)) * smooth(0, 20, top - z - LAYER_STEP)]);
}
// each layer is the coast (with its rock) where the ground stands at least as high as the layer's top
const HQ = new Float32Array(groundGrid.v.length);
const LAYERS = STRATA.map(([z0, z1, off]) => {
  const grid = T.gridOf(BOX, STEP, (x, y, edge) => {
    if (edge) return 1e3;
    const c = gridAt(coastGrid, x, y);
    const g = gridAt(groundGrid, x, y);
    const land = c > 40 ? c : c < -40 ? c : c - off(x, y, g);
    const value = z1 <= 61 ? land : Math.max(land, z1 - g);
    return Math.min(value, stackSdf(x, y, z1) - Math.max(0, z1 <= Z.sea ? off(x, y, g) * 0.35 : 0));
  });
  for (let q = 0; q < grid.v.length; q++) if (grid.v[q] < 0) HQ[q] = Math.max(HQ[q], z1);
  const rings = T.contour(grid).map((ring) => T.simplifyRing(ring, 0.5)).filter((ring) => Math.abs(T.ringArea(ring)) > 6);
  return { z0, z1, rings, grid };
});
// the drawn height at a point: the top of the highest layer there (what hides what)
const heightAt = (x, y) => gridAt({ ...groundGrid, v: HQ }, x, y);
const insideLayer = (layer, x, y) => gridAt(layer.grid, x, y) < 0;
const BLOCK_RING = [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]];

// a face is a cut (sawn section of the model) when it lies on the block boundary
const sawn = (ax, ay, bx, by) => (Math.abs(ay - Y1) < 0.6 && Math.abs(by - Y1) < 0.6) || (Math.abs(ax - X1) < 0.6 && Math.abs(bx - X1) < 0.6) || (Math.abs(ay - Y0) < 0.6 && Math.abs(by - Y0) < 0.6) || (Math.abs(ax - X0) < 0.6 && Math.abs(bx - X0) < 0.6);
const onCut = (ax, ay, bx, by, z = 0) => (z >= 40 && z < 61 && cave((ax + bx) / 2, (ay + by) / 2) > 0.25 ? "cr-cave" : sawn(ax, ay, bx, by) ? "cr-cut" : "");

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

// ---- the road, in pieces ----------------------------------------------------------------------------
// Each piece of road is drawn just after the terrace whose top is the first one above it, so the slope
// in front of it (lower) is already down and the bank behind it (higher) comes after.
const ri = (i, d) => M.roadPoint(road, i, d);
const I0 = road.first;
const I1 = road.last;
const per = Math.round(1 / road.ds);
const LT = G.lightOf(P);
const wheelsOf = (x, y, yaw) => {
  const c = Math.cos(yaw);
  const sn = Math.sin(yaw);
  const backAxle = -1.2 * u;
  const half = (M.CAR.track / 2) * u;
  return [[x + backAxle * c - half * sn, y + backAxle * sn + half * c], [x + backAxle * c + half * sn, y + backAxle * sn - half * c]];
};
// tyre marks: the rear wheels' paths wherever the model's own lap at the limit held more than 10° of drift
const MARKS = [];
{
  let cur = null;
  for (const [x, y, yaw, beta, i] of LAP.trace) {
    if (beta > (10 * Math.PI) / 180 && x > M.PORTAL_X + 4) {
      if (!cur) cur = [];
      cur.push({ i, w: wheelsOf(x, y, yaw) });
    } else if (cur) {
      if (cur.length > 8) MARKS.push(cur);
      cur = null;
    }
  }
  if (cur && cur.length > 8) MARKS.push(cur);
}
const studs = [];
for (let i = I0 + 8 * per; i < I1; i += 9 * per) studs.push(i);
function roadPiece(a, b) {
  const ids = [];
  for (let i = a; i < b; i += 3) ids.push(i);
  ids.push(b);
  const p3 = (i, d, dz = 0) => [...ri(i, d), road.z[i] + dz];
  const strip = (list, d0, d1) => poly([...list.map((i) => p3(i, d0(i))), ...[...list].reverse().map((i) => p3(i, d1(i)))]);
  const out = [];
  // the drop side's retaining face, under the unguarded edge, where it faces us
  const shades = new Map();
  for (let j = 0; j + 1 < ids.length; j++) {
    const i = ids[j];
    const i2 = ids[j + 1];
    const dd = road.drop[i];
    const h = road.heading[i];
    const nx = -Math.sin(h) * dd;
    const ny = Math.cos(h) * dd;
    if (nx * V[0] + ny * V[1] <= 0.02) continue;
    const shade = Math.min(3, G.bandOf(nx * LT[0] + ny * LT[1]));
    const e0 = dd * M.HALF_ROAD + dd * road.verge[i];
    const e1 = dd * M.HALF_ROAD + dd * road.verge[i2];
    const d = poly([p3(i, e0), p3(i2, e1), p3(i2, e1, -12), p3(i, e0, -12)]);
    shades.set(shade, (shades.get(shade) || "") + d);
  }
  for (const [shade, d] of shades) out.push(`<path class="iso-fill" d="${d}"/><path class="iso-shade" data-shade="${shade}" d="${d}"/>`);
  // the bench: gravel verge on the drop side, a strip of shoulder on the hill side
  const leftOf = (i) => benchOf(i, 1);
  const rightOf = (i) => -benchOf(i, -1);
  const bench = strip(ids, leftOf, rightOf);
  out.push(`<path class="iso-fill" d="${bench}"/><path class="iso-top cr-bench" d="${bench}"/>`);
  out.push(`<path class="cr-asphalt" d="${strip(ids, () => -M.HALF_ROAD, () => M.HALF_ROAD)}"/>`);
  out.push(`<path class="cr-paint" d="${strip(ids, () => -M.HALF_ROAD + 0.2, () => -M.HALF_ROAD + 0.35)}${strip(ids, () => M.HALF_ROAD - 0.35, () => M.HALF_ROAD - 0.2)}"/>`);
  // centre dashes, 3 m of paint and 6 m of gap
  let dashes = "";
  for (let i = I0 + 4 * per; i < I1; i += 9 * per) {
    const from = Math.max(a, i);
    const to = Math.min(b, i + 3 * per);
    if (to - from < 2) continue;
    const list = [];
    for (let q = from; q < to; q += 3) list.push(q);
    list.push(to);
    dashes += strip(list, () => -0.07, () => 0.07);
  }
  if (dashes) out.push(`<path class="cr-paint" d="${dashes}"/>`);
  // the unguarded edge, the cut at the foot of the bank, and the asphalt's two edges
  out.push(Ln(poly(ids.map((i) => p3(i, road.drop[i] * benchOf(i, road.drop[i]))), false), { tone: "mid" }));
  out.push(Ln(poly(ids.map((i) => p3(i, -road.drop[i] * benchOf(i, -road.drop[i]))), false), { tone: "lo" }));
  out.push(Ln(poly(ids.map((i) => p3(i, -M.HALF_ROAD)), false) + poly(ids.map((i) => p3(i, M.HALF_ROAD)), false), { tone: "lo" }));
  const here = studs.filter((i) => i >= a && i <= b);
  if (here.length) out.push(Dots(here.map((i) => at(p3(i, 0, 0.1))), { size: 0.42, tone: "mid" }).replace('class="iso-dots"', 'class="iso-dots cr-stud"'));
  // the tyre marks on this piece: the ramps fade only at a mark's real ends
  for (const run of MARKS) {
    const inside = run.filter((m) => m.i >= a && m.i <= b);
    if (inside.length < 2) continue;
    const step = Math.max(1, Math.floor(run.length / 60));
    const pick = inside.filter((_, q) => q % step === 0 || q === inside.length - 1);
    const startFade = inside[0] === run[0] ? 14 : 0;
    const endFade = inside[inside.length - 1] === run[run.length - 1] ? 18 : 0;
    for (const side of [0, 1]) out.push(k.fadeLineSvg(pick.map((m) => at([...m.w[side], road.z[m.i] + 0.1])), { fade: [startFade, endFade], tone: "lo", className: "cr-skid" }));
  }
  return `<g class="cr-road">${out.join("")}</g>`;
}

// grass stipple on the terraces, kept off the benches
const GRASS = new Map();
for (let q = 0; q < 9000; q++) {
  const x = X0 + T.hash2(q, 1, 71) * (X1 - X0);
  const y = Y0 + T.hash2(q, 2, 72) * (Y1 - Y0);
  const h = heightAt(x, y);
  if (h <= 61 || T.hash2(q, 3, 73) > 0.6) continue;
  const near = nearestRoad(x, y, 2);
  if (near && Math.abs(near.d) < benchOf(near.i, Math.sign(near.d) || 1) * u + 1.5 && Math.abs(road.z[near.i] - h) < LAYER_STEP + 1) continue;
  if (!GRASS.has(h)) GRASS.set(h, []);
  GRASS.get(h).push(at([x, y, h]));
}

// the terraces, bottom to top: under water behind the sea, the rest with the road pieces between them
for (const layer of LAYERS) {
  const svg = T.layerSvg(layer.rings, layer.z0, layer.z1 - layer.z0, P, { joints: layer.z1 > 43 ? 0.08 : 0, seed: layer.z0, cut: onCut, tone: "lo", className: `${layer.z1 <= Z.sea ? "cr-under" : ""} cr-strata` });
  if (layer.z1 <= Z.sea) {
    back.push(svg);
    continue;
  }
  terrain.push(svg);
  const grass = GRASS.get(layer.z1);
  if (grass) terrain.push(Dots(grass, { size: 0.42, tone: "faint" }).replace('class="iso-dots"', 'class="iso-dots cr-grass"'));
  // the road whose height lies under this top and above the one below
  let a = -1;
  for (let i = 0; i < road.n; i++) {
    const inSlot = road.z[i] >= layer.z1 - LAYER_STEP && road.z[i] < layer.z1;
    if (inSlot && a < 0) a = i;
    if ((!inSlot || i === road.n - 1) && a >= 0) {
      // pieces overlap by a metre so no hairline shows where they meet
      terrain.push(roadPiece(Math.max(0, a - 2 * per), Math.min(road.n - 1, (inSlot ? i : i - 1) + per)));
      a = -1;
    }
  }
}

// the sea's glass sections on the two sawn faces we see
function waterFace(points) {
  const h = points.map(([x, y]) => heightAt(x, y));
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

// the coastline as the sea sees it (the land's outline at sea level, inside the box)
const COAST = (() => {
  const rings = T.contour(T.gridOf(BOX, STEP, (x, y, edge) => (edge ? 1e3 : gridAt(coastGrid, x, y))));
  const ring = rings.reduce((best, r) => (Math.abs(T.ringArea(r)) > Math.abs(T.ringArea(best)) ? r : best), rings[0]);
  const area = T.ringArea(ring);
  const ordered = area > 0 ? ring : [...ring].reverse();
  return ordered.filter(([x, y]) => x > X0 + 3 && x < X1 - 3 && y > Y0 + 3 && y < Y1 - 3);
})();

// boulders on the wave-cut platform at the foot of the cliff
{
  const platform = LAYERS.find((l) => l.z0 === 40);
  const notch = LAYERS.find((l) => l.z0 === 43);
  const rocks = [];
  for (let i = 0; i < 900 && rocks.length < 46; i++) {
    const c = COAST[Math.floor(T.hash2(i, 9, 81) * COAST.length)];
    const ang = T.hash2(i, 8, 82) * Math.PI * 2;
    const dist = 3 + T.hash2(i, 7, 83) * 9;
    const x = c[0] + Math.cos(ang) * dist;
    const y = c[1] + Math.sin(ang) * dist;
    const r = 1.6 + 2.6 * T.hash2(i, 6, 84);
    if (!insideLayer(platform, x, y) || insideLayer(notch, x, y)) continue;
    if (rocks.some((q) => Math.hypot(q.x - x, q.y - y) < q.r + r + 0.6)) continue;
    // only rocks the viewer can see: nothing of the cliff between them and the eye
    let hidden = false;
    for (let t = 2; t < 400 && !hidden; t += 3) if (heightAt(x + V[0] * t, y + V[1] * t) > 43 + V[2] * t) hidden = true;
    if (hidden) continue;
    rocks.push({ x, y, r, seed: i });
  }
  rocks.sort((a, b) => depth([a.x, a.y, 0]) - depth([b.x, b.y, 0]));
  const first = terrain.findIndex((t) => t.includes("cr-strata"));
  terrain.splice(first + 1, 0, rocks.map((q) => SC.boulder({ P, x: q.x, y: q.y, z: 43, r: q.r, seed: q.seed })).join(""));
}

// ---- tunnel portals ----------------------------------------------------------------------------------
const PORTALS = [
  SC.portal({ P, face: M.PORTAL_X, yc: Math.round(road.pts[I0][1]), z: road.z[I0], id: "portal-far" }),
  SC.portal({ P, face: M.PORTAL_X, yc: Math.round(road.pts[I1][1]), z: road.z[I1], id: "portal-near" }),
  SC.portal({ P, face: road.pts[TUNNEL.i1][0] - 4, yc: Math.round(road.pts[TUNNEL.i1][1]), z: road.z[TUNNEL.i1], tall: TUNNEL.roof, id: "portal-mid" }),
];
const PORTAL_TALL = [46, 46, TUNNEL.roof];
for (const [index, pt] of PORTALS.entries()) {
  front.push(`<g class="cr-portal" data-portal="${index}">${pt.interior}<g class="cr-inside" data-slot="${index}" clip-path="url(#${["portal-far", "portal-near", "portal-mid"][index]}-clip)"></g>${pt.shadow}${pt.facade}</g>`);
}

// ---- what the slopes in front hide -------------------------------------------------------------------
// For a thing standing at (x, y, z): across its screen width, the highest terrain between it and the eye.
// It shows only above that line. The page does the same for the car each frame.
const KPX = k.cameraOf(P).k;
const SIDE = [Math.sin((AZIMUTH * Math.PI) / 180), -Math.cos((AZIMUTH * Math.PI) / 180)];
const TOWARD = (() => {
  const l = Math.hypot(V[0], V[1]);
  return [V[0] / l, V[1] / l];
})();
function hiddenBelow(x, y, z, half) {
  const cols = [];
  let any = false;
  const base = at([x, y, z]);
  for (let c = -half; c <= half + 0.01; c += 2) {
    const ox = x + (SIDE[0] * c) / KPX;
    const oy = y + (SIDE[1] * c) / KPX;
    let top = Infinity;
    for (let t = 3; t < 460; t += 2) {
      const px = ox + TOWARD[0] * t;
      const py = oy + TOWARD[1] * t;
      if (px < X0 || px > X1 || py < Y0 || py > Y1) break;
      const h = heightAt(px, py);
      if (h <= z + 0.5) continue;
      top = Math.min(top, at([px, py, h])[1]);
    }
    if (top < base[1] + 1) any = true;
    cols.push([base[0] + c, top]);
  }
  return any ? cols : null;
}
const clipDefs = [];
function clipFor(id, cols) {
  if (!cols) return "";
  const big = 4000;
  const edge = cols.map(([sx, sy]) => [sx, Math.min(sy, big)]);
  const first = edge[0];
  const last = edge[edge.length - 1];
  const pts = [[first[0] - big, -big], [last[0] + big, -big], [last[0] + big, last[1]], ...[...edge].reverse(), [first[0] - big, first[1]]];
  clipDefs.push(`<clipPath id="${id}"><path d="${k.pathOf(pts, true)}"/></clipPath>`);
  return ` clip-path="url(#${id})"`;
}

// ---- things that stand on the mountain, sorted with the car each frame ------------------------------------
const items = [];
const put = (name, at3, svg, high = 4, half = 14) => items.push({ name, key: depth(at3), svg, at: [at3[0], at3[1], at3[2] + high], clip: clipFor(`clip-${name}`, hiddenBelow(at3[0], at3[1], at3[2], half)) });
// the forest on the face: trees wherever the slope is free of the road and the cliffs
{
  const placed = [];
  for (let q = 0; q < 4000 && placed.length < 62; q++) {
    const x = X0 + 30 + T.hash2(q, 1, 91) * (X1 - X0 - 40);
    const y = Y0 + 12 + T.hash2(q, 2, 92) * (Y1 - Y0 - 20);
    if (x < M.PORTAL_X + 6 || gridAt(coastGrid, x, y) > -14) continue;
    const z = heightAt(x, y);
    if (z <= 61) continue;
    const near = nearestRoad(x, y, 3);
    if (near && Math.abs(near.d) < benchOf(near.i, Math.sign(near.d) || 1) * u + 9) continue;
    if (placed.some((p) => Math.hypot(p[0] - x, p[1] - y) < 15)) continue;
    // a level spot: the same terrace a little either side
    if ([[-2.5, 0], [2.5, 0], [0, -2.5], [0, 2.5]].some(([dx, dy]) => Math.abs(heightAt(x + dx, y + dy) - z) > 0.5)) continue;
    placed.push([x, y]);
    const tree = SC.cypress({ P, x, y, z, height: 16 + 12 * T.hash2(q, 3, 93), seed: q, lean: 0.4 });
    put(`tree${placed.length}`, tree.at, `<g>${tree.svg}</g>`, 4, 20);
  }
  // the steep slope under the summit: narrow terraces, so no level spots; the trees stand on the steps
  for (let q = 0; q < 1500 && placed.length < 80; q++) {
    const x = M.PORTAL_X + 14 + T.hash2(q, 4, 95) * (X1 - M.PORTAL_X - 60);
    const y = Y0 + 6 + T.hash2(q, 5, 96) * 30;
    const z = heightAt(x, y);
    if (gridAt(coastGrid, x, y) > -14 || z <= 61) continue;
    const near = nearestRoad(x, y, 3);
    if (near && Math.abs(near.d) < benchOf(near.i, Math.sign(near.d) || 1) * u + 9) continue;
    if (placed.some((p) => Math.hypot(p[0] - x, p[1] - y) < 16)) continue;
    placed.push([x, y]);
    const tree = SC.cypress({ P, x, y, z, height: 14 + 10 * T.hash2(q, 6, 97), seed: 900 + q, lean: 0.4 });
    put(`tree${placed.length}`, tree.at, `<g>${tree.svg}</g>`, 4, 20);
  }
}
const POSTS = [];
// a tree on the crown of each hairpin's knoll, like the wooded humps a pass winds round
for (const [q, b] of BUMPS.slice(0, 3).entries()) {
  let best = [b.x, b.y, heightAt(b.x, b.y)];
  for (let dx = -8; dx <= 8; dx += 2) for (let dy = -8; dy <= 8; dy += 2) if (heightAt(b.x + dx, b.y + dy) > best[2]) best = [b.x + dx, b.y + dy, heightAt(b.x + dx, b.y + dy)];
  const tree = SC.cypress({ P, x: best[0], y: best[1], z: best[2], height: 24, seed: 700 + q, lean: 0.3 });
  put(`knolltree${q}`, tree.at, `<g>${tree.svg}</g>`, 4, 20);
}
// delineators round the inside of each hairpin, a chevron board on the outside of the two over the sea,
// and a bend sign on the hill side before each one
for (let pin = 0; pin < 3; pin++) {
  const list = [];
  for (let i = 0; i < road.n; i++) if (road.hairpin[i] === pin) list.push(i);
  const a = list[0];
  const b = list[list.length - 1];
  for (let j = 0; j < 7; j++) {
    const i = Math.round(a + ((b - a) * (j + 0.5)) / 7);
    const inner = -road.drop[i];
    const [x, y] = ri(i, inner * (M.HALF_ROAD + 0.9));
    const toward = road.heading[i] - (inner * Math.PI) / 2;
    POSTS.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10, Math.round(road.z[i] * 10) / 10, Math.round(toward * 1000) / 1000]);
    put(`post${pin}-${j}`, [x, y, road.z[i]], SC.delineator({ P, x, y, z: road.z[i], toward }).svg, 4, 6);
  }
  const apex = list[Math.round(list.length / 2)];
  // a curve mirror inside the bend, turned to the traffic coming into it
  {
    const at0 = Math.round(a + (b - a) * 0.8);
    const inner = -road.drop[at0];
    const [mx, my] = ri(at0, inner * (M.HALF_ROAD + 2.2));
    const [ex, ey] = ri(Math.max(0, a - Math.round(14 / road.ds)), 0);
    put(`mirror${pin}`, [mx, my, road.z[at0]], SC.mirror({ P, x: mx, y: my, z: road.z[at0], facing: Math.atan2(ey - my, ex - mx) }).svg, 6, 10);
  }
  if (pin !== 1) {
    const [cx, cy] = ri(apex, road.drop[apex] * (M.HALF_ROAD + road.verge[apex] * 0.55));
    put(`chevron${pin}`, [cx, cy, road.z[apex]], SC.sign({ P, x: cx, y: cy, z: road.z[apex], facing: road.heading[apex] + Math.PI, kind: "chevron", height: 9, w: 11, h: 5 }).svg, 4, 12);
  }
  const warnAt = Math.max(0, a - Math.round(22 / road.ds));
  const [wx, wy] = ri(warnAt, -road.drop[warnAt] * (M.HALF_ROAD + 1.3));
  put(`warning${pin}`, [wx, wy, road.z[warnAt]], SC.sign({ P, x: wx, y: wy, z: road.z[warnAt], facing: road.heading[warnAt] + Math.PI, kind: "bend", height: 11, w: 7, h: 7 }).svg, 4, 10);
}
// a trig pillar on the summit
{
  let best = [0, 0, 0];
  for (let x = -200; x < 0; x += 4) for (let y = -200; y < -165; y += 4) if (heightAt(x, y) > best[2]) best = [x, y, heightAt(x, y)];
  const tg = SC.trig({ P, x: best[0], y: best[1], z: best[2] });
  put("trig", tg.at, tg.svg, 6, 6);
}
items.sort((a, b) => a.key - b.key);
const STILL = (() => {
  let best = 0;
  LAP.trace.forEach(([, , , beta, i], q) => {
    if (road.hairpin[i] === 2 && beta > LAP.trace[best][3]) best = q;
  });
  const [x, y, yaw, , i] = LAP.trace[best];
  return { x, y, z: road.z[i], yaw, steer: -0.3, best };
})();
const carKey = depth([STILL.x, STILL.y, STILL.z]);
const stillCar = `<g data-item="car" data-k="${carKey.toFixed(2)}" class="cr-car"${clipFor("cr-car-clip", hiddenBelow(STILL.x, STILL.y, STILL.z, 30))}>${carSvg(STILL, P, G, k)}</g>`;
const before = items.filter((it) => it.key <= carKey);
const after = items.filter((it) => it.key > carKey);
const itemSvg = (it) => `<g data-item="${it.name}" data-k="${it.key.toFixed(2)}" data-at="${it.at.map((v) => v.toFixed(1)).join(",")}"${it.clip}>${it.svg}</g>`;
front.push(`<defs>${clipDefs.join("")}</defs>`);
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
const waterSdf = (x, y) => Math.min(coastSdf(x, y) - Math.max(platformOff(x, y), notchOff(x, y)), stackSdf(x, y, 43));
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
    texBytes[o + 1] = enc(coastSdf(x, y));
    // the drawn height, 0..512 units
    texBytes[o + 2] = Math.round(Math.min(255, (heightAt(x, y) / 512) * 255));
    // the distance the swell refracts round: the mountain and the tall stack, not the small rocks (-16..240)
    texBytes[o + 3] = Math.round(Math.min(1, Math.max(0, (Math.min(coastSdf(x, y) - Math.max(platformOff(x, y), notchOff(x, y)), stackSdf(x, y, 100)) + 16) / 256)) * 255);
  }
}
// where crests hit: the waterline, sampled every 7 units of its length with its outward normal
const SPRAY_AT = [];
{
  const EVERY = 7;
  let carry = 0;
  for (let i = 0; i < COAST.length - 1; i++) {
    const [ax, ay] = COAST[i];
    const [bx, by] = COAST[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 1e-6 || len > 8) continue;
    const from = carry;
    carry = (carry - len) % EVERY;
    if (carry < 0) carry += EVERY;
    for (let t = from; t < len; t += EVERY) {
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
  for (const st of STACKS.filter((q) => q.top > 60)) {
    for (let a = 0; a < Math.PI * 2; a += 0.45) SPRAY_AT.push([Math.round(st.x + Math.cos(a) * (st.r + 1)), Math.round(st.y + Math.sin(a) * (st.r + 1)), Math.round(Math.cos(a) * 100) / 100, Math.round(Math.sin(a) * 100) / 100]);
  }
}
// the drawn height for the page: what hides the car, the lights and the smoke (tenths of a unit)
const HEIGHT = { x0: groundGrid.x0, y0: groundGrid.y0, step: STEP, nx: groundGrid.nx, ny: groundGrid.ny, bytes: Buffer.from(new Uint16Array(Array.from(HQ, (h) => Math.round(h * 10))).buffer).toString("base64") };

const DATA = {
  coast: { ...TEX, bytes: Buffer.from(texBytes).toString("base64") },
  sprayAt: SPRAY_AT,
  studs: studs.map((i) => [...ri(i, 0).map((v) => Math.round(v * 10) / 10), Math.round(road.z[i] * 10) / 10]),
  portals: PORTALS.map((pt, index) => ({ ...pt.opening, face: pt.plane, tall: PORTAL_TALL[index] })),
  W,
  H,
  P,
  camera: glCamera(P),
  profile,
  limit: LIMIT,
  paceMin: 0.85,
  portal: PORTALS[0].plane,
  x0: X0,
  knob: KNOB,
  sweep: KNOB_SWEEP,
  sea: Z.sea,
  box: BOX,
  still: STILL.best,
  detail: null,
  posts: POSTS,
  height: HEIGHT,
};

// ---- Detail A: a 3:1 view that follows the car, in the card's empty top-right -----------------------------
// the live code fills the view each frame; the build draws its frame, label and scale
const DETAIL = { cx: 868, cy: 150, r: 94, scale: Math.round(P.scale * 3 * 1000) / 1000 };
DATA.detail = DETAIL;
DATA.headwall = { face: M.PORTAL_X, thick: 4, wide: 33, tall: 46 };
const detailSvg = (() => {
  const { cx, cy, r } = DETAIL;
  const ring = (rr) => Array.from({ length: 120 }, (_, i) => [cx + rr * Math.cos((i / 120) * Math.PI * 2), cy + rr * Math.sin((i / 120) * Math.PI * 2)]);
  const parts = [];
  parts.push(`<defs><clipPath id="cr-detail-clip"><path d="${k.pathOf(ring(r), true)}"/></clipPath>`);
  parts.push(`<linearGradient id="cr-beam-0" gradientUnits="userSpaceOnUse"><stop offset="0" class="cr-beam-stop" stop-opacity="0.5"/><stop offset="0.3" class="cr-beam-stop" stop-opacity="0.2"/><stop offset="1" class="cr-beam-stop" stop-opacity="0"/></linearGradient>`);
  parts.push(`<linearGradient id="cr-beam-1" gradientUnits="userSpaceOnUse"><stop offset="0" class="cr-beam-stop" stop-opacity="0.5"/><stop offset="0.3" class="cr-beam-stop" stop-opacity="0.2"/><stop offset="1" class="cr-beam-stop" stop-opacity="0"/></linearGradient>`);
  // the sea far below the edge: a scatter of glints, so the drop never reads as road
  parts.push(`<pattern id="cr-far-sea" patternUnits="userSpaceOnUse" width="23" height="11"><rect class="cr-far-sea" width="23" height="11"/><path class="cr-far-glint" d="M2 3h3M13 8h2.5M19 2.5h2"/></pattern>`);
  parts.push(`<radialGradient id="cr-puff"><stop offset="0" class="cr-puff-stop" stop-opacity="0.9"/><stop offset="0.55" class="cr-puff-stop" stop-opacity="0.45"/><stop offset="1" class="cr-puff-stop" stop-opacity="0"/></radialGradient></defs>`);
  parts.push(`<g class="cr-detail-lead"></g>`);
  parts.push(`<path class="cr-detail-ground" fill="url(#cr-far-sea)" d="${k.pathOf(ring(r), true)}"/>`);
  parts.push(`<g clip-path="url(#cr-detail-clip)"><g class="cr-detail-view"></g></g>`);
  parts.push(`<g class="cr-detail-notes"></g>`);
  parts.push(k.lineSvg(k.pathOf(ring(r), true), { tone: "mid", className: "cr-detail-rim" }));
  parts.push(k.lineSvg(k.pathOf(ring(r + 4), true), { tone: "faint" }));
  // the label and a 2 m scale bar under the view, at the view's own scale
  parts.push(k.faceTextSvg(`translate(${cx - r + 2} ${cy - r - 10})`, "DETAIL A · 3:1", { size: 8, tone: "mid" }));
  parts.push(k.faceTextSvg(`translate(${cx - r + 2} ${cy - r + 0.5})`, "follows the car", { size: 6.5, tone: "lo" }));
  const bar = 2 * M.U * DETAIL.scale;
  const bx = cx + r - bar - 4;
  const by = cy + r + 14;
  const ticks = [];
  for (let i = 0; i <= 4; i++) ticks.push(k.lineSvg(k.pathOf([[bx + (bar * i) / 4, by], [bx + (bar * i) / 4, by - (i % 2 ? 2.5 : 4)]]), { tone: "mid" }));
  parts.push(k.lineSvg(k.pathOf([[bx, by], [bx + bar, by]]), { tone: "mid" }) + ticks.join(""));
  parts.push(k.faceTextSvg(`translate(${bx - 5} ${by + 2.5})`, "2 m", { size: 7, tone: "mid", anchor: "end" }));
  return parts.join("");
})();

// ---- assemble ----------------------------------------------------------------------------------------
const LABEL_TEXT = "A diorama of a mountain pass at night: a road with no guard rails winds down a sea cliff through three hairpins, between a tunnel at the summit and one at the foot, and the sea breaks against the rock below.";
const backSvg = k.figureSvg({ width: W, height: H, label: LABEL_TEXT, body: back, className: "cr-back" });
const layerSvg = (name, body) => `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg cr-layer ${name}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${body.join("")}</svg>`;
const stage = `<div class="cr-stage" tabindex="0" role="slider" aria-label="Cliff road. Move the pointer across the figure, or press the left and right arrow keys, to set how hard the driver pushes." aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><span class="cr-said" aria-live="polite"></span>${backSvg}<canvas class="cr-layer cr-gl cr-sea-gl" aria-hidden="true"></canvas>${layerSvg("cr-terrain", terrain)}<canvas class="cr-layer cr-gl cr-light-gl" aria-hidden="true"></canvas>${layerSvg("cr-front", front)}<canvas class="cr-layer cr-gl cr-fx-gl" aria-hidden="true"></canvas>${layerSvg("cr-detail", [detailSvg])}</div>`;

const SWELL_SLANT_FOR_CAPTION = 0.35;
// ---- the card: every number below is computed from the model ---------------------------------------
const kmh = (v) => Math.round(v * 3.6);
const PIN_R = M.ROUTE.find((r) => r[0] === "arc" && Math.abs(r[1]) === 180)[2];
const vGrip = Math.sqrt(M.MU * M.GRAV * PIN_R);
const lapAt = (pace) => M.lapOf(road, profile, pace);
const CALM = lapAt(0.85);
const swell6 = M.swellOf(6);
const sweep = (SWELL_SLANT_FOR_CAPTION * (236 - M.PORTAL_X)) / u / swell6.c;
const sprayTop = M.SPRAY.rise ** 2 / (2 * M.GRAV);
const visible = road.length - (road.first + road.n - 1 - road.last) * road.ds;
const fall = (road.z[road.first] - road.z[road.last]) / u;
const pinZ = (pin) => {
  const list = [];
  for (let i = 0; i < road.n; i++) if (road.hairpin[i] === pin) list.push(i);
  return Math.round((road.z[list[Math.round(list.length / 2)]] - Z.sea) / u);
};
const caption = `A mountain pass on a plinth, at night: ${Math.round(visible)} m of road with no guard rail winds down a sea cliff from the summit tunnel to the one at its foot, falling ${Math.round(fall)} m at ${(road.grade * 100).toFixed(0)}% through three ${PIN_R} m hairpins. Two of them sit on the cliff edge, ${pinZ(0)} m and ${pinZ(2)} m above the sea. Damp asphalt under sea mist grips at μ ${M.MU}, so a hairpin holds on grip up to √(μgR) = ${kmh(vGrip)} km/h. Downhill the car runs up to ${Math.round(LAP.top)} km/h on the legs, brakes hard, and turns in faster than grip allows. The rear tyres then slide at μ ${M.MU_SLIDE}, the path widens to v²/(μg), and the car drifts out toward the drop with its nose held into the bend, up to ${Math.round(LAP.peakDrift)}°. Near the edge the driver lifts, which tightens the line. At the top of the control the model's line clears the edge by ${LAP.least.toFixed(1)} m; at the bottom the car corners on grip, with ${Math.round(CALM.peakDrift)}° of tyre slip at most. The knolls inside the hairpins, the spurs on the face and the trees hide the car as it passes behind them, and on the third leg it runs through a rock rib in a short tunnel. The tyre marks are the rear wheels' path on that fastest lap. The swell has an ${M.SWELL.period} s period; in 6 m of water its crests are ${Math.round(swell6.lambda)} m apart and travel ${swell6.c.toFixed(1)} m/s. Refraction wraps them round the mountain, so each one breaks under the hairpins first and runs along the front cliff in about ${sweep.toFixed(0)} s, throwing spray up the rock at up to ${M.SPRAY.rise} m/s, ${sprayTop.toFixed(1)} m high. Detail A follows the car at 3:1: the arrow is its path, the dashed line is where its nose points, and the red angle between them is the drift. The red dimension runs from the corner nearest the drop to the edge.`;
const body = `<div class="cr">${k.plateHtml({
  fig: "Fig 5A",
  title: "Cliff road at night",
  hint: "Move across to push harder",
  readout: M.readoutOf({ ...M.carStart(road, profile, 1), margin: 3 }),
  keys: [
    { mark: "lit", label: "The car: a 1,150 kg rear-drive coupe, lamps up" },
    { mark: "dashed", label: "Tyre marks from the model's fastest lap" },
    { mark: "raised", label: `The pass falls ${Math.round(fall)} m through three hairpins` },
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
// the contouring helpers, for the inset's local terraces
const terrainSource = readFileSync(join(HERE, "terrain.mjs"), "utf8");
const TR = `const TR = (() => {\n${terrainSource.slice(terrainSource.indexOf("function segDist"), terrainSource.indexOf("// ---- drawing a layer")).replace(/^export /gm, "")}\nreturn { inside, gridOf, contour, simplifyRing, ringArea };\n})();\n`;
const SCRIPT = kitScript() + LATHE + TR + asObject("model.mjs", "M") + asObject("car.mjs", "CARS") + glScript() + SHADERS + LIVE;
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
