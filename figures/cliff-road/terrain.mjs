// The mountain as a layered rock body: noise, marching squares and the drawing of one layer. Every layer is
// a vertical prism whose outline is a contour of the ground (and of the coast, pushed out or cut back by that
// stratum's erosion), so the cliffs, the wave-cut notch, the seabed and the terraces are one body drawn
// bottom to top.
import * as k from "../../anatomy/kit/iso-kit.mjs";
import * as G from "../../anatomy/kit/lathe.mjs";

export const hash2 = (x, y, seed = 0) => {
  let h = Math.imul((x | 0) ^ Math.imul(seed + 0x9e37, 0x85ebca6b), 0xc2b2ae35) ^ Math.imul((y | 0) + 0x632be5ab, 0x27d4eb2f);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
};

export function noise2(x, y, seed = 0) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

// noise continuous in height: neighbouring strata share most of their outline, ledges drift slowly
export function fbmZ(x, y, z, seed = 0, zScale = 30, octaves = 3) {
  const k = Math.floor(z / zScale);
  const t = z / zScale - k;
  const e = t * t * (3 - 2 * t);
  return fbm(x, y, seed + k * 101, octaves) * (1 - e) + fbm(x, y, seed + (k + 1) * 101, octaves) * e;
}

export function fbm(x, y, seed = 0, octaves = 3) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2(x, y, seed + i * 17);
    norm += amp;
    x = x * 2.03 + 11.7;
    y = y * 2.03 + 5.3;
    amp *= 0.5;
  }
  return sum / norm;
}

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - ax - dx * t, py - ay - dy * t);
}

export function inside(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// A grid of values over the block, one cell beyond it on every side
export function gridOf(box, step, fn) {
  const [x0, y0, x1, y1] = box;
  const nx = Math.round((x1 - x0) / step) + 3;
  const ny = Math.round((y1 - y0) / step) + 3;
  const v = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const x = x0 + (i - 1) * step;
      const y = y0 + (j - 1) * step;
      v[j * nx + i] = fn(x, y, i === 0 || j === 0 || i === nx - 1 || j === ny - 1);
    }
  }
  return { v, nx, ny, x0: x0 - step, y0: y0 - step, step };
}

// Marching squares at level 0 (region where value < 0), assembled into closed rings
export function contour(grid) {
  const { v, nx, ny, x0, y0, step } = grid;
  const at = (i, j) => v[j * nx + i];
  const edgeKey = (i, j, dir) => (j * nx + i) * 2 + dir;
  const point = (i, j, dir) => {
    if (dir === 0) {
      const a = at(i, j);
      const b = at(i + 1, j);
      const t = a / (a - b);
      return [x0 + (i + t) * step, y0 + j * step];
    }
    const a = at(i, j);
    const b = at(i, j + 1);
    const t = a / (a - b);
    return [x0 + i * step, y0 + (j + t) * step];
  };
  const next = new Map();
  const where = new Map();
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = at(i, j) < 0;
      const b = at(i + 1, j) < 0;
      const c = at(i + 1, j + 1) < 0;
      const d = at(i, j + 1) < 0;
      const code = (a ? 1 : 0) | (b ? 2 : 0) | (c ? 4 : 0) | (d ? 8 : 0);
      if (code === 0 || code === 15) continue;
      const top = edgeKey(i, j, 0);
      const right = edgeKey(i + 1, j, 1);
      const bottom = edgeKey(i, j + 1, 0);
      const left = edgeKey(i, j, 1);
      where.set(top, [i, j, 0]);
      where.set(right, [i + 1, j, 1]);
      where.set(bottom, [i, j + 1, 0]);
      where.set(left, [i, j, 1]);
      // walk with the region on the left: segments from edge to edge
      const centre = (at(i, j) + at(i + 1, j) + at(i + 1, j + 1) + at(i, j + 1)) / 4 < 0;
      const segs = {
        1: [[left, top]],
        2: [[top, right]],
        3: [[left, right]],
        4: [[right, bottom]],
        5: centre ? [[left, bottom], [right, top]] : [[left, top], [right, bottom]],
        6: [[top, bottom]],
        7: [[left, bottom]],
        8: [[bottom, left]],
        9: [[bottom, top]],
        10: centre ? [[top, left], [bottom, right]] : [[top, right], [bottom, left]],
        11: [[bottom, right]],
        12: [[right, left]],
        13: [[right, top]],
        14: [[top, left]],
      }[code];
      for (const [s, e] of segs) next.set(s, e);
    }
  }
  const rings = [];
  const used = new Set();
  for (const start of next.keys()) {
    if (used.has(start)) continue;
    const ring = [];
    let key = start;
    while (key !== undefined && !used.has(key)) {
      used.add(key);
      const [i, j, dir] = where.get(key);
      ring.push(point(i, j, dir));
      key = next.get(key);
    }
    if (ring.length > 3) rings.push(ring);
  }
  return rings;
}

function simplify(points, tol) {
  if (points.length < 4) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let best = -1;
    let far = tol;
    for (let i = a + 1; i < b; i++) {
      const d = segDist(points[i][0], points[i][1], points[a][0], points[a][1], points[b][0], points[b][1]);
      if (d > far) {
        far = d;
        best = i;
      }
    }
    if (best > 0) {
      keep[best] = 1;
      stack.push([a, best], [best, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

export function simplifyRing(ring, tol = 0.45) {
  // split the closed ring at its two farthest points so both halves simplify cleanly
  let far = 0;
  let at = 0;
  for (let i = 1; i < ring.length; i++) {
    const d = Math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1]);
    if (d > far) {
      far = d;
      at = i;
    }
  }
  const a = simplify(ring.slice(0, at + 1), tol);
  const b = simplify([...ring.slice(at), ring[0]], tol);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

export const ringArea = (ring) => ring.reduce((s, [x, y], i) => {
  const [nx, ny] = ring[(i + 1) % ring.length];
  return s + x * ny - nx * y;
}, 0) / 2;

// ---- drawing a layer ---------------------------------------------------------------------------------
const tenth = (v) => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, "");
const pathOf = (pts, closed) => pts.map(([x, y], i) => `${i ? "L" : "M"}${tenth(x)} ${tenth(y)}`).join("") + (closed ? "Z" : "");

// Paint a stack of rings extruded from z to z + h. Faces are painted far to near (each with its paper and
// its shade), then the top, then the top's boundary. Optional `joints` adds vertical fissures on faces.
export function layerSvg(rings, z, h, P, { joints = 0, seed = 1, className = "", tone = "mid", crease = "faint", topClass = "", cut = null } = {}) {
  const V = G.viewOf(P);
  const L = G.lightOf(P);
  const faces = [];
  const lines = [];
  const tops = [];
  const bounds = [];
  for (const raw of rings) {
    const ring = ringArea(raw) < 0 ? [...raw].reverse() : raw; // counter-clockwise: outward normal is (dy, -dx)
    tops.push(ring);
    const n = ring.length;
    const facing = [];
    for (let i = 0; i < n; i++) {
      const [ax, ay] = ring[i];
      const [bx, by] = ring[(i + 1) % n];
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const nx = (by - ay) / len;
      const ny = -(bx - ax) / len;
      const dot = nx * V[0] + ny * V[1];
      facing.push(dot > 1e-6);
      if (dot <= 1e-6) continue;
      const shade = G.bandOf(nx * L[0] + ny * L[1]);
      const isCut = cut ? cut(ax, ay, bx, by, z) || false : false;
      const quad = [k.iso([ax, ay, z + h], P), k.iso([bx, by, z + h], P), k.iso([bx, by, z], P), k.iso([ax, ay, z], P)];
      faces.push({ depth: ((ax + bx) / 2) * V[0] + ((ay + by) / 2) * V[1], shade: Math.min(3, shade), quad, len, a: [ax, ay], b: [bx, by], cut: isCut });
    }
    // silhouette verticals where facing changes, and the bottom edge of every facing run
    for (let i = 0; i < n; i++) {
      const prev = facing[(i + n - 1) % n];
      if (prev !== facing[i]) bounds.push({ depth: ring[i][0] * V[0] + ring[i][1] * V[1], d: pathOf([k.iso([ring[i][0], ring[i][1], z + h], P), k.iso([ring[i][0], ring[i][1], z], P)]) });
    }
  }
  faces.sort((a, b) => a.depth - b.depth);
  const out = [];
  // group consecutive faces of one shade into one path pair, keeping the depth order
  let run = null;
  const flush = () => {
    if (!run) return;
    out.push(`<path class="iso-fill" d="${run.d}"/><path class="iso-shade${run.cut ? ` ${run.cut === true ? "cr-cut" : run.cut}` : ""}" data-shade="${run.shade}" d="${run.d}"/>`);
    if (run.bottom) out.push(`<path class="iso-line" data-tone="${tone}" d="${run.bottom}"/>`);
    if (run.joints) out.push(`<path class="iso-line" data-tone="faint" d="${run.joints}"/>`);
    run = null;
  };
  let index = 0;
  for (const f of faces) {
    if (!run || run.shade !== f.shade || run.cut !== f.cut) {
      flush();
      run = { shade: f.shade, cut: f.cut, d: "", bottom: "", joints: "" };
    }
    run.d += pathOf(f.quad, true);
    run.bottom += pathOf([f.quad[3], f.quad[2]]);
    if (joints && !f.cut && h > 6) {
      const r = hash2(Math.round(f.a[0] * 3), Math.round(f.a[1] * 3), seed);
      if (r < joints) {
        const t = 0.2 + 0.6 * hash2(index, seed, 7);
        const x = f.a[0] + (f.b[0] - f.a[0]) * t;
        const y = f.a[1] + (f.b[1] - f.a[1]) * t;
        const reach = r < joints * 0.45 ? z : z + h * (0.25 + 0.4 * hash2(index, seed, 9));
        run.joints += pathOf([k.iso([x, y, z + h], P), k.iso([x, y, reach], P)]);
      }
    }
    index++;
  }
  flush();
  for (const b of bounds) out.push(`<path class="iso-line" data-tone="${tone}" d="${b.d}"/>`);
  const topD = tops.map((ring) => pathOf(ring.map(([x, y]) => k.iso([x, y, z + h], P)), true)).join("");
  out.push(`<path class="iso-fill" d="${topD}"/><path class="iso-top${topClass ? ` ${topClass}` : ""}" d="${topD}"/>`);
  // the top boundary: creases on edges whose face we see, outline elsewhere
  for (const ring of tops) {
    const n = ring.length;
    let creaseRun = [];
    let edgeRun = [];
    const creases = [];
    const edges = [];
    for (let i = 0; i <= n; i++) {
      const a = ring[i % n];
      const b = ring[(i + 1) % n];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const see = ((b[1] - a[1]) / len) * V[0] + (-(b[0] - a[0]) / len) * V[1] > 1e-6;
      const p = k.iso([a[0], a[1], z + h], P);
      if (i === n) {
        if (creaseRun.length) creaseRun.push(p);
        if (edgeRun.length) edgeRun.push(p);
        break;
      }
      if (see) {
        if (edgeRun.length) {
          edgeRun.push(p);
          edges.push(edgeRun);
          edgeRun = [];
        }
        creaseRun.push(p);
      } else {
        if (creaseRun.length) {
          creaseRun.push(p);
          creases.push(creaseRun);
          creaseRun = [];
        }
        edgeRun.push(p);
      }
    }
    if (creaseRun.length > 1) creases.push(creaseRun);
    if (edgeRun.length > 1) edges.push(edgeRun);
    if (creases.length) out.push(`<path class="iso-line iso-crease" data-tone="${crease}" d="${creases.map((r) => pathOf(r)).join("")}"/>`);
    if (edges.length) out.push(`<path class="iso-line" data-tone="${tone}" d="${edges.map((r) => pathOf(r)).join("")}"/>`);
  }
  return `<g class="iso-solid cr-layer${className ? ` ${className}` : ""}">${out.join("")}</g>`;
}
