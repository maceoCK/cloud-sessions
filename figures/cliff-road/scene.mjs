// Parts that stand on the model: tunnel portals, wind-bent cypresses, signs, posts and boulders.
import * as k from "../../anatomy/kit/iso-kit.mjs";
import * as G from "../../anatomy/kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../../anatomy/kit/tube.mjs";
import { hash2, fbm } from "./terrain.mjs";

const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);

// ---- tunnel portal -----------------------------------------------------------------------------------
// A cast headwall on the rock face at x = face, with a horseshoe opening over the road: straight walls to the
// springing line, then a semicircle. Seen from the front-right we look into the bore: its floor, its left
// wall and the lower part of its vault, lined and lit, fading to dark.
export function portal({ P, face, yc, z, half = 20, spring = 15, thick = 4, wide = 33, tall = 46, depth = 90, id }) {
  const at = (p) => k.iso(p, P);
  const V = G.viewOf(P);
  const L = G.lightOf(P);
  const x0 = face - 1;
  const x1 = face + thick;
  const zs = z + spring;
  const arch = (x, r = half, steps = 28) => {
    const pts = [[x, yc - r, z]];
    for (let i = 0; i <= steps; i++) {
      const a = Math.PI - (i / steps) * Math.PI;
      pts.push([x, yc + r * Math.cos(a), zs + r * Math.sin(a)]);
    }
    pts.push([x, yc + r, z]);
    return pts;
  };
  const opening = k.pathOf(arch(x1).map(at), true);
  const shade = (n) => Math.min(3, G.bandOf(G.dot3(G.unit3(n), L)));
  const quad = (pts, n, cls = "") => `<path class="iso-fill" d="${k.pathOf(pts.map(at), true)}"/><path class="iso-shade${cls}" data-shade="${shade(n)}" d="${k.pathOf(pts.map(at), true)}"/>`;
  const deep = x1 - depth;
  // the bore: floor, left wall, the visible lower-left run of the vault, lamps, then darkness
  const inside = [];
  inside.push(`<path class="cr-bore-void" d="${opening}"/>`);
  inside.push(`<path class="cr-bore-floor" d="${k.pathOf([[x1, yc - half, z], [x1, yc + half, z], [deep, yc + half, z], [deep, yc - half, z]].map(at), true)}"/>`);
  inside.push(`<path class="cr-bore-paint" d="${k.pathOf([[x1, yc - 0.6, z], [x1, yc + 0.6, z], [deep, yc + 0.6, z], [deep, yc - 0.6, z]].map(at), true)}"/>`);
  for (const side of [-1, 1]) inside.push(`<path class="cr-bore-kerb" d="${k.pathOf([[x1, yc + side * (half - 2.6), z + 0.8], [x1, yc + side * half, z + 0.8], [deep, yc + side * half, z + 0.8], [deep, yc + side * (half - 2.6), z + 0.8]].map(at), true)}"/>`);
  inside.push(`<g class="cr-bore">${quad([[x1, yc - half, z], [x1, yc - half, zs], [deep, yc - half, zs], [deep, yc - half, z]], [0, 1, 0])}`);
  const steps = 10;
  for (let i = 0; i < steps; i++) {
    const a0 = Math.PI - (i / steps) * (Math.PI * 0.27);
    const a1 = Math.PI - ((i + 1) / steps) * (Math.PI * 0.27);
    const p0 = [yc + half * Math.cos(a0), zs + half * Math.sin(a0)];
    const p1 = [yc + half * Math.cos(a1), zs + half * Math.sin(a1)];
    const nm = [0, -Math.cos((a0 + a1) / 2), -Math.sin((a0 + a1) / 2)];
    if (G.dot3(nm, V) > 0) inside.push(quad([[x1, p0[0], p0[1]], [x1, p1[0], p1[1]], [deep, p1[0], p1[1]], [deep, p0[0], p0[1]]], nm));
  }
  inside.push(`</g>`);
  // lining rings every 2 m on the visible wall, and sodium lamps down the bore
  let rings = "";
  for (let x = x1 - 10; x > deep + 4; x -= 10) rings += k.pathOf([[x, yc - half, z + 0.8], [x, yc - half, zs]].map(at));
  inside.push(Ln(rings, { tone: "faint", className: "cr-bore-line" }));
  const lamps = [];
  for (let x = x1 - 9, i = 0; x > deep + 6; x -= 15, i++) lamps.push([...at([x, yc - half + 0.4, zs + 6]), Math.max(0.15, 1 - i * 0.16)]);
  inside.push(k.dotsSvg(lamps, { size: 0.9, tone: "hi" }).replace('class="iso-dots"', 'class="iso-dots cr-lamp"'));
  // darkness deepens along the bore: a gradient along the screen direction of -x
  const g0 = at([x1, yc, z]);
  const g1 = at([x1 - 60, yc, z]);
  inside.push(`<defs><linearGradient id="${id}-dark" gradientUnits="userSpaceOnUse" x1="${g0[0].toFixed(1)}" y1="${g0[1].toFixed(1)}" x2="${g1[0].toFixed(1)}" y2="${g1[1].toFixed(1)}"><stop offset="0" style="stop-color:var(--cr-bore-dark)" stop-opacity="0"/><stop offset=".55" style="stop-color:var(--cr-bore-dark)" stop-opacity=".75"/><stop offset="1" style="stop-color:var(--cr-bore-dark)" stop-opacity=".97"/></linearGradient></defs>`);
  const interior = `<clipPath id="${id}-clip"><path d="${opening}"/></clipPath><g clip-path="url(#${id}-clip)">${inside.join("")}</g>`;
  const shadeOver = `<path class="cr-bore-shadow" clip-path="url(#${id}-clip)" fill="url(#${id}-dark)" d="${opening}"/>`;

  // the headwall with its hole, the visible end, the coping and the voussoir ring
  const wall = [];
  const yl = yc - wide;
  const yr = yc + wide;
  const zt = z + tall;
  const front = [[x1, yl, z], [x1, yl, zt], [x1, yr, zt], [x1, yr, z]];
  const frontD = k.pathOf(front.map(at), true) + k.pathOf([...arch(x1)].reverse().map(at), true);
  wall.push(`<g class="iso-solid cr-concrete"><path class="iso-fill" d="${frontD}"/><path class="iso-shade" data-shade="${shade([1, 0, 0])}" d="${frontD}"/>`);
  const end = [[x0, yr, z], [x1, yr, z], [x1, yr, zt], [x0, yr, zt]];
  wall.push(`<path class="iso-fill" d="${k.pathOf(end.map(at), true)}"/><path class="iso-shade" data-shade="${shade([0, 1, 0])}" d="${k.pathOf(end.map(at), true)}"/>`);
  // the hole's left reveal through the wall thickness
  const reveal = [[x0, yc - half, z], [x1, yc - half, z], [x1, yc - half, zs], [x0, yc - half, zs]];
  wall.push(`<path class="iso-fill" d="${k.pathOf(reveal.map(at), true)}"/><path class="iso-shade" data-shade="${shade([0, 1, 0])}" d="${k.pathOf(reveal.map(at), true)}"/>`);
  wall.push(`<path class="iso-line iso-edge" data-tone="mid" d="${k.pathOf(front.map(at), true)}${k.pathOf(arch(x1).map(at))}${k.pathOf([[x1, yr, z], [x0, yr, z], [x0, yr, zt], [x1, yr, zt]].map(at))}${k.pathOf([[x1, yc - half, zs], [x0, yc - half, zs], [x0, yc - half, z]].map(at))}"/></g>`);
  // voussoirs: a ring band 3.5 deep with radial joints, keystone wider
  let joints = "";
  const ringOut = half + 3.6;
  for (let i = 1; i < 13; i++) {
    const a = Math.PI - (i / 13) * Math.PI;
    joints += k.pathOf([[x1, yc + half * Math.cos(a), zs + half * Math.sin(a)], [x1, yc + ringOut * Math.cos(a), zs + ringOut * Math.sin(a)]].map(at));
  }
  const outer = [];
  for (let i = 0; i <= 28; i++) {
    const a = Math.PI - (i / 28) * Math.PI;
    outer.push([x1, yc + ringOut * Math.cos(a), zs + ringOut * Math.sin(a)]);
  }
  joints += k.pathOf([[x1, yc - ringOut, z + 0], ...outer, [x1, yc + ringOut, z]].map(at));
  wall.push(Ln(joints, { tone: "lo" }));
  // pilasters at the ends: flush strips with a joint line, and a cast plinth course
  wall.push(Ln(k.pathOf([[x1, yl + 5, z], [x1, yl + 5, zt]].map(at)) + k.pathOf([[x1, yr - 5, z], [x1, yr - 5, zt]].map(at)) + k.pathOf([[x1, yl, z + 4], [x1, yc - ringOut, z + 4]].map(at)) + k.pathOf([[x1, yc + ringOut, z + 4], [x1, yr, z + 4]].map(at)), { tone: "faint" }));
  // coping
  wall.push(S(G.prismOf(G.frameOf([0, 0, 0], [0, 1, 0], [1, 0, 0], [0, 0, 1]), [[x0 - 0.5, zt], [x1 + 1.4, zt], [x1 + 1.4, zt + 2.4], [x0 - 0.5, zt + 3.2]], yl - 1.2, yr + 1.2, P), { tone: "mid" }));
  // name plate over the arch: rule lines stand for the tunnel's name
  const plate = [[x1 + 0.3, yc - 9, zt - 7.6], [x1 + 0.3, yc + 9, zt - 7.6], [x1 + 0.3, yc + 9, zt - 3.2], [x1 + 0.3, yc - 9, zt - 3.2]];
  wall.push(`<path class="iso-fill" d="${k.pathOf(plate.map(at), true)}"/><path class="iso-line" data-tone="mid" d="${k.pathOf(plate.map(at), true)}"/>`);
  wall.push(Ln(k.pathOf([[x1 + 0.3, yc - 6.5, zt - 5.8], [x1 + 0.3, yc + 5, zt - 5.8]].map(at)) + k.pathOf([[x1 + 0.3, yc - 6.5, zt - 4.6], [x1 + 0.3, yc + 2, zt - 4.6]].map(at)), { tone: "lo", free: true }));
  wall.push(k.dotsSvg([at([x1 + 0.3, yc - 8, zt - 5.4]), at([x1 + 0.3, yc + 8, zt - 5.4])], { size: 0.4 }));
  return { interior, facade: wall.join(""), shadow: shadeOver, plane: x1, opening: { yc, half, z, spring: zs } };
}

// ---- wind-bent Monterey cypress ----------------------------------------------------------------------
// A stout trunk that forks low into limbs reaching away from the sea wind (it blows from +x), each limb
// carrying a flat-topped mass of foliage made of a few overlapping irregular pads.
export function cypress({ P, x, y, z, height = 30, lean = 0.55, seed = 1, scale = 1 }) {
  const rnd = (i) => hash2(seed * 13 + i, seed * 7 - i, 99);
  const V = G.viewOf(P);
  const wind = [-1, 0.16];
  const h = height * scale;
  const fork = [x + wind[0] * h * 0.12 * lean, y + wind[1] * h * 0.12, z + h * 0.38];
  const trunk = G.fillet([[x, y, z], [x + wind[0] * h * 0.04 * lean, y, z + h * 0.18], fork], 4 * scale, 6);
  const limbs = [];
  const count = 2 + Math.floor(rnd(1) * 2);
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const reach = h * (0.55 + 0.35 * rnd(i + 3)) * lean;
    const side = (t - 0.5) * 2;
    const end = [fork[0] + wind[0] * reach * (0.5 + 0.6 * (1 - Math.abs(side))), fork[1] + side * h * 0.32 + wind[1] * reach, z + h * (0.7 + 0.28 * rnd(i + 7))];
    const mid = [(fork[0] + end[0]) / 2 + wind[0] * 2, (fork[1] + end[1]) / 2, (fork[2] + end[2]) / 2 + h * 0.08];
    limbs.push({ route: G.fillet([fork, mid, end], 3 * scale, 6), end, r: (1.0 - 0.15 * i) * scale });
  }
  // one short limb into the wind, clipped back by it
  limbs.push({ route: G.fillet([fork, [fork[0] + h * 0.12, fork[1] - 2, fork[2] + h * 0.18], [fork[0] + h * 0.2, fork[1] - 3, z + h * 0.66]], 2 * scale, 5), end: [fork[0] + h * 0.2, fork[1] - 3, z + h * 0.66], r: 0.7 * scale, small: true });
  const blobRing = (cx, cy, r, stretch, s0) => Array.from({ length: 13 }, (_, i) => {
    const a = (i / 13) * Math.PI * 2;
    const rr = r * (0.72 + 0.42 * hash2(i, seed * 5 + s0, 17));
    return [cx + Math.cos(a) * rr * stretch, cy + Math.sin(a) * rr];
  });
  const parts = [];
  const tube = (route, r0, r1) => tubePieces(route, (t) => r0 + (r1 - r0) * t, P, { maxLength: 80, spacing: 1.2 }).map((pc) => tubeSvg(pc, { tone: "mid", className: "cr-bark" })).join("");
  parts.push(tube(trunk, 2.1 * scale, 1.5 * scale));
  const masses = [];
  for (const [li, limb] of limbs.entries()) {
    parts.push(tube(limb.route, limb.r * 1.25, limb.r * 0.55));
    const [ex, ey, ez] = limb.end;
    const big = (limb.small ? 6 : 10 + 5 * rnd(li + 11)) * scale;
    const pads = [];
    for (let k = 0; k < 3; k++) {
      const r = big * (1 - 0.22 * k);
      const cx = ex + wind[0] * (k * 2.2 + big * 0.2) * scale;
      const cy = ey + (rnd(li * 5 + k) - 0.5) * 3;
      pads.push({ ring: blobRing(cx, cy, r, 1.35, li * 7 + k), z: ez - 1.2 + k * 2.3 * scale, h: 2.6 * scale });
    }
    masses.push({ key: G.dot3([ex, ey, ez], V), pads });
  }
  masses.sort((a, b) => a.key - b.key);
  for (const mass of masses) {
    for (const pad of mass.pads) {
      parts.push(S(k.extrude(pad.ring, pad.z, pad.h, P, { bevel: 0.5 }), { tone: "mid", className: "cr-leaf" }));
      const dots = [];
      const [cx, cy] = pad.ring.reduce((a, p) => [a[0] + p[0] / pad.ring.length, a[1] + p[1] / pad.ring.length], [0, 0]);
      for (let j = 0; j < 10; j++) {
        const u = hash2(j, seed * 31 + Math.round(pad.z * 3), 5) - 0.5;
        const v = hash2(j * 3, seed * 17 + Math.round(pad.z * 3), 6) - 0.5;
        dots.push(k.iso([cx + u * 12 * scale, cy + v * 8 * scale, pad.z + pad.h], P));
      }
      parts.push(k.dotsSvg(dots, { size: 0.45, tone: "lo" }));
    }
  }
  return { svg: parts.join(""), at: [x, y, z] };
}

// ---- a sign on a post ----------------------------------------------------------------------------------
export function sign({ P, x, y, z, facing, kind = "chevron", height = 11, w = 9, h = 7 }) {
  const at = (p) => k.iso(p, P);
  const parts = [];
  parts.push(S(k.slabOf({ x: x - 1.6, y: y - 1.6, w: 3.2, d: 3.2, r: 0.6 }, z, 1.2, P, 2), { tone: "lo" }));
  parts.push(S(k.cylinder(x, y, 0.45, z + 1.2, height - 1.2, P, 10), { tone: "mid", crease: "none" }));
  // the plate is a thin prism facing `facing` (an angle in the plan)
  const n = [Math.cos(facing), Math.sin(facing), 0];
  const side = [-Math.sin(facing), Math.cos(facing), 0];
  const F = G.frameOf([x + n[0] * 0.5, y + n[1] * 0.5, z + height], n, side, [0, 0, 1]);
  parts.push(S(G.prismOf(F, [[-w / 2, -h], [w / 2, -h], [w / 2, 0], [-w / 2, 0]], 0, 0.5, P), { tone: "mid", className: "cr-sign" }));
  const face = (u, v) => at([x + n[0] * 1.05 + side[0] * u, y + n[1] * 1.05 + side[1] * u, z + height + v]);
  if (G.dot3(n, G.viewOf(P)) > 0) {
    const inset = [[-w / 2 + 0.8, -h + 0.8], [w / 2 - 0.8, -h + 0.8], [w / 2 - 0.8, -0.8], [-w / 2 + 0.8, -0.8]];
    parts.push(Ln(k.pathOf(inset.map(([u, v]) => face(u, v)), true), { tone: "lo" }));
    if (kind === "chevron") {
      for (const off of [-2.4, 1.4]) {
        const chev = [[off - 1, -h + 1.8], [off + 1.2, -h / 2], [off - 1, -1.8], [off + 0.4, -1.8], [off + 2.6, -h / 2], [off + 0.4, -h + 1.8]];
        parts.push(`<path class="cr-sign-mark" d="${k.pathOf(chev.map(([u, v]) => face(u, v)), true)}"/>`);
      }
    } else {
      const arrow = [[-2.6, -h + 1.6], [-0.6, -h + 1.6], [-0.6, -3.6], [1.2, -3.6], [-0.2, -1.4], [-3.6, -3.6]];
      parts.push(`<path class="cr-sign-mark" d="${k.pathOf(arrow.map(([u, v]) => face(u, v)), true)}"/>`);
    }
  }
  return { svg: parts.join(""), at: [x, y, z] };
}

// a white delineator post with a reflector, angled to the road
export function delineator({ P, x, y, z, toward }) {
  const at = (p) => k.iso(p, P);
  const parts = [S(k.slabOf({ x: x - 0.7, y: y - 0.7, w: 1.4, d: 1.4, r: 0.3 }, z, 5.2, P, 2, 0.2), { tone: "mid", className: "cr-post" })];
  const r = [x + Math.cos(toward) * 0.75, y + Math.sin(toward) * 0.75];
  parts.push(`<path class="cr-reflector" d="${k.pathOf([[r[0], r[1], z + 3.4], [r[0], r[1], z + 4.6]].map(at))}"/>`);
  return { svg: parts.join(""), at: [x, y, z] };
}

// a kilometre stone: a squat rounded block with a red cap band
export function milestone({ P, x, y, z }) {
  const parts = [];
  parts.push(S(k.slabOf({ x: x - 2, y: y - 1.3, w: 4, d: 2.6, r: 1 }, z, 4.4, P, 4, 0.3), { tone: "mid" }));
  parts.push(S(k.slabOf({ x: x - 2, y: y - 1.3, w: 4, d: 2.6, r: 1 }, z + 4.4, 1.6, P, 4, 0.3), { tone: "mid", className: "cr-cap" }));
  return { svg: parts.join(""), at: [x, y, z] };
}

// a boulder: two stacked irregular prisms, the upper one smaller and offset
export function boulder({ P, x, y, z, r = 4, seed = 1, h = 0 }) {
  const ring = (rad, s) => Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + hash2(i, seed, s) * 0.5;
    const rr = rad * (0.72 + 0.4 * hash2(i, seed, s + 3));
    return [x + rr * Math.cos(a), y + rr * Math.sin(a)];
  });
  const hh = h || r * 0.9;
  return S(k.extrude(ring(r, 1), z, hh * 0.6, P, { bevel: 0.4 }), { tone: "mid" }) + S(k.extrude(ring(r * 0.7, 7).map(([px, py]) => [px - r * 0.12, py + r * 0.05]), z + hh * 0.6, hh * 0.4, P, { bevel: 0.3 }), { tone: "mid" });
}

export const fbmAt = fbm;
