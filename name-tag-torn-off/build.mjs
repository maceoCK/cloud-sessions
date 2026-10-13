// Fig 4A · Name tag, torn off. A blank name sticker with an illegible scribble on a brushed steel
// plate, screwed to a brick wall. A corner lifts, the label rolls up into one curl, tears unevenly
// and comes away; a ragged piece and the residue stay on the plate.
// `node build.mjs` writes name-tag-torn-off.html, `--light` writes name-tag-torn-off-light.html.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";
import { PEEL } from "./model.mjs";
import { clayTexture, driftTexture, fuzzTexture, paperTexture, sandTexture } from "./textures.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const theme = argv.includes("--light") ? "light" : "dark";
const flag = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const POSE = Number(flag("s") ?? 0);
if (flag("tune")) Object.assign(PEEL.TUNE, JSON.parse(flag("tune")));

const { BRICK, JOINT, RAKE, COURSE, MODULE, BOND, PLATE, STANDOFF, Y_FACE, SCREW_IN, RESIDUE, STUCK_EDGE } = PEEL;

const WIDTH = 600;
const HEIGHT = 470;
const AZIMUTH = Number(process.env.NT_AZ ?? 58);
const ELEVATION = Number(process.env.NT_EL ?? 26);
// The wall is a crop: an ellipse of brickwork round the plate that fades into the card.
const VIEW = { x: 0, z: PLATE.z + PLATE.h / 2 - 6, rx: 290, rz: 215 };

const P = k.fitProjection(
  [
    [VIEW.x - VIEW.rx * 0.93, 0, VIEW.z], [VIEW.x + VIEW.rx * 0.93, 0, VIEW.z],
    [VIEW.x, 0, VIEW.z + VIEW.rz * 0.93], [VIEW.x, 0, VIEW.z - VIEW.rz * 0.93],
    [PLATE.x, 70, PLATE.z + PLATE.h + 30], [PLATE.x + PLATE.w, 70, PLATE.z - 40],
  ],
  WIDTH,
  HEIGHT,
  { pad: 20, azimuth: AZIMUTH, elevation: ELEVATION },
);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const pathOf = (pts, closed = false) => k.pathOf(pts, closed);
const fx = (v) => (Math.round(v * 1000) / 1000).toString();
const mix = (a, b, t) => a + (b - a) * t;

// ---- Textures: patterns drawn in a plane's own units and laid onto it by the plane's affine map ----
// The iso camera is affine, so a pattern in (x, z) units transformed by the projection of the two
// axes sits exactly in the wall plane; the same holds for the tops, the ends and the label.
const affine = (o, a, b) => {
  const O = at(o), A = at([o[0] + a[0], o[1] + a[1], o[2] + a[2]]), B = at([o[0] + b[0], o[1] + b[1], o[2] + b[2]]);
  return `matrix(${fx(A[0] - O[0])} ${fx(A[1] - O[1])} ${fx(B[0] - O[0])} ${fx(B[1] - O[1])} ${fx(O[0])} ${fx(O[1])})`;
};
const FRONT = affine([0, 0, 0], [1, 0, 0], [0, 0, -1]); // wall face: x right, z down the page
const ROOF = affine([0, 0, 0], [1, 0, 0], [0, -1, 0]); // tops: x right, y back into the wall
const END = affine([0, 0, 0], [0, -1, 0], [0, 0, -1]); // ends: y back, z down
const LABEL = affine(PEEL.onFace([0, 0]), PEEL.EX, PEEL.EY); // the label plane on the plate face

const tile = (id, w, h, transform, body) => `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${w}" height="${h}" patternTransform="${transform}">${body}</pattern>`;
const R = PEEL.rng(1234);
const blobPath = (cx, cy, r, n = 7, jag = 0.45, sx = 1, sy = 1, turn = 0) => {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 + jag * (R() - 0.5));
    const x = Math.cos(a) * rr * sx, y = Math.sin(a) * rr * sy;
    pts.push([cx + x * Math.cos(turn) - y * Math.sin(turn), cy + x * Math.sin(turn) + y * Math.cos(turn)]);
  }
  return pathOf(pts, true);
};
// A shape near a tile's edge is drawn again across it, so the pattern repeats with no seam.
const wrap = (w, h, cx, cy, r, make) => {
  const xs = [0, ...(cx < r ? [w] : cx > w - r ? [-w] : [])];
  const ys = [0, ...(cy < r ? [h] : cy > h - r ? [-h] : [])];
  return xs.flatMap((dx) => ys.map((dy) => make(cx + dx, cy + dy))).join("");
};
function brickTile(id, transform) {
  const w = 131, h = 97;
  let pits = "", flecks = "", grit = "";
  for (let i = 0; i < 70; i++) {
    const cx = R() * w, cy = R() * h, r = 0.35 + R() ** 2 * 1.5;
    const shape = blobPath(0, 0, r, 7, 0.6);
    pits += wrap(w, h, cx, cy, r + 1, (x, y) => `<path transform="translate(${fx(x)} ${fx(y)})" d="${shape}"/>`);
  }
  for (let i = 0; i < 46; i++) {
    const cx = R() * w, cy = R() * h, r = 0.3 + R() * 0.7;
    const shape = blobPath(0, 0, r, 6, 0.5);
    flecks += wrap(w, h, cx, cy, r + 1, (x, y) => `<path transform="translate(${fx(x)} ${fx(y)})" d="${shape}"/>`);
  }
  for (let i = 0; i < 260; i++) grit += `<circle cx="${fx(R() * w)}" cy="${fx(R() * h)}" r="${fx(0.18 + R() * 0.22)}"/>`;
  return tile(id, w, h, transform, `<g class="nt-tx-grit">${grit}</g><g class="nt-tx-pit">${pits}</g><g class="nt-tx-fleck">${flecks}</g>`);
}
function sandTile(id, transform) {
  const w = 53, h = 41;
  let dark = "", light = "";
  for (let i = 0; i < 150; i++) dark += `<circle cx="${fx(R() * w)}" cy="${fx(R() * h)}" r="${fx(0.2 + R() * 0.45)}"/>`;
  for (let i = 0; i < 70; i++) light += `<circle cx="${fx(R() * w)}" cy="${fx(R() * h)}" r="${fx(0.25 + R() * 0.5)}"/>`;
  return tile(id, w, h, transform, `<g class="nt-tx-sand">${dark}</g><g class="nt-tx-sandlight">${light}</g>`);
}
// Raster grain, each image defined once and tiled by patterns in every plane that uses it.
const IMAGES = [
  ["nt-img-fuzz", fuzzTexture(), 92],
  ["nt-img-drift", driftTexture(), 120],
  ["nt-img-clay", clayTexture(), 150],
  ["nt-img-sand", sandTexture(160, 41, true), 70],
  ["nt-img-sandlight", sandTexture(160, 43, false), 70],
  ["nt-img-paper", paperTexture(), 80],
];
const SIZE = Object.fromEntries(IMAGES.map(([id, , size]) => [id, size]));
const imageDefs = IMAGES.map(([id, href, size]) => `<image id="${id}" href="${href}" width="${size}" height="${size}" preserveAspectRatio="none"/>`).join("");
const rasterTile = (id, img, transform, cls) => tile(id, SIZE[img], SIZE[img], transform, `<use href="#${img}" class="${cls}"/>`);
const DEFS = `<defs>${imageDefs}${brickTile("nt-brick-front", FRONT)}${brickTile("nt-brick-top", ROOF)}${brickTile("nt-brick-end", END)}${sandTile("nt-sand-front", FRONT)}${sandTile("nt-sand-top", ROOF)}${sandTile("nt-sand-end", END)}${rasterTile("nt-clay-front", "nt-img-clay", FRONT, "nt-rx-clay")}${rasterTile("nt-grain-front", "nt-img-sand", FRONT, "nt-rx-sand")}${rasterTile("nt-grainlight-front", "nt-img-sandlight", FRONT, "nt-rx-sandlight")}${rasterTile("nt-fuzz-img", "nt-img-fuzz", LABEL, "nt-rx-fuzz")}${rasterTile("nt-drift-img", "nt-img-drift", LABEL, "nt-rx-drift")}${rasterTile("nt-paper-img", "nt-img-paper", LABEL, "nt-rx-paper").replace("<pattern ", '<pattern data-part="paper" ')}</defs>`;

// ---- The wall --------------------------------------------------------------------------------------
const ALONG_Y = G.frameOf([0, 0, 0], [0, 1, 0], [1, 0, 0], [0, 0, 1]); // prisms out of the wall
const box = (x0, x1, z0, z1, y0, y1) => G.prismOf(ALONG_Y, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y0, y1, P);
// A wall box with its faces textured: front (band 2), top (band 4) and end (band 0).
function texturedBox(paths, attrs, tex, extra = "") {
  const parts = [`<path class="iso-fill" d="${paths.fill}"/>`];
  paths.shades.forEach((d, shade) => d && parts.push(`<path class="iso-shade" data-shade="${shade}" d="${d}"/>`));
  if (paths.top) parts.push(`<path class="iso-top" d="${paths.top}"/>`);
  if (paths.shades[2] && tex === "nt-brick") parts.push(`<path class="nt-tex" d="${paths.shades[2]}" fill="url(#nt-clay-front)"/>`);
  if (paths.shades[2]) parts.push(`<path class="nt-tex" d="${paths.shades[2]}" fill="url(#${tex}-front)"/>`);
  if (paths.top) parts.push(`<path class="nt-tex" d="${paths.top}" fill="url(#${tex}-top)"/>`);
  if (paths.shades[0]) parts.push(`<path class="nt-tex" d="${paths.shades[0]}" fill="url(#${tex}-end)"/>`);
  parts.push(extra);
  if (paths.crease) parts.push(`<path class="iso-line iso-crease" data-tone="faint" d="${paths.crease}"/>`);
  parts.push(`<path class="iso-line iso-edge" data-tone="mid" d="${paths.outline}"/>`);
  return `<g class="iso-solid" ${attrs}>${parts.join("")}</g>`;
}
// A chip knocked out of a brick's face at one of its edges: a shallow, darker scar.
function chipOn(x0, x1, z0, z1) {
  const side = Math.floor(R() * 4);
  const len = 6 + R() * 16, dep = 2 + R() * 4.5;
  const t = 0.12 + R() * 0.76;
  const [cx, cz, along, inward] =
    side === 0 ? [mix(x0, x1, t), z1, [1, 0], [0, -1]] : side === 1 ? [mix(x0, x1, t), z0, [1, 0], [0, 1]] : side === 2 ? [x1, mix(z0, z1, t), [0, 1], [-1, 0]] : [x0, mix(z0, z1, t), [0, 1], [1, 0]];
  const pts = [];
  for (let i = 0; i <= 9; i++) {
    const s = i / 9;
    const a = (s - 0.5) * len;
    const d = Math.sin(Math.PI * s) ** 0.8 * dep * (0.75 + R() * 0.5);
    pts.push(at([cx + along[0] * a + inward[0] * d, 0, cz + along[1] * a + inward[1] * d]));
  }
  return `<path class="nt-chip" d="${pathOf(pts, true)}"/>`;
}
function wall() {
  const out = [];
  // The mortar plane, raked 2 mm behind the brick faces, then every brick standing proud of it.
  const x0 = VIEW.x - VIEW.rx - 40, x1 = VIEW.x + VIEW.rx + 40, z0 = VIEW.z - VIEW.rz - 40, z1 = VIEW.z + VIEW.rz + 40;
  const back = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => at([x, -RAKE, z]));
  const plane = pathOf(back, true);
  out.push(`<path class="nt-mortar" d="${plane}"/><path class="nt-tex" d="${plane}" fill="url(#nt-grain-front)"/><path class="nt-tex" d="${plane}" fill="url(#nt-grainlight-front)"/><path class="nt-tex" d="${plane}" fill="url(#nt-sand-front)"/>`);
  const inView = (x, z) => ((x - VIEW.x) / (VIEW.rx + 30)) ** 2 + ((z - VIEW.z) / (VIEW.rz + 30)) ** 2 < 1.25;
  const bricks = [];
  for (let c = Math.floor(z0 / COURSE); c * COURSE < z1; c++) {
    const zb = c * COURSE, zt = zb + BRICK.h;
    const shift = c % 2 ? -MODULE / 2 : 0;
    for (let n = -4; n <= 4; n++) {
      const b0 = BOND + shift + n * MODULE, b1 = b0 + BRICK.l;
      if (b1 < x0 || b0 > x1) continue;
      const near = [[b0, zb], [b1, zb], [b0, zt], [b1, zt], [(b0 + b1) / 2, (zb + zt) / 2]].some(([x, z]) => inView(x, z));
      if (!near) continue;
      bricks.push([b0, b1, zb, zt]);
    }
  }
  // Paint far to near: lower courses first (higher ones are nearer from above), then along x.
  bricks.sort((a, b) => a[2] - b[2] || a[0] - b[0]);
  const tints = ["a", "b", "c", "d", "e"];
  // Each brick stands 2 mm proud of the raked joints, so the light from the upper left leaves a
  // soft shadow along the joint under its lower edge and beside its right end.
  const shade = [];
  for (const [b0, b1, zb] of bricks) {
    const pts = [[b0 + 1, zb], [b1, zb], [b1, zb + 30], [b1 + 3.2, zb + 30], [b1 + 3.2, zb - 3.4], [b0 + 4, zb - 3.4]];
    shade.push(pathOf(pts.map(([x, z]) => at([x, -RAKE, z])), true));
  }
  out.push(`<path class="nt-jointshade" d="${shade.join("")}"/>`);
  let flashes = 0;
  for (const [b0, b1, zb, zt] of bricks) {
    const tint = tints[Math.floor(R() * tints.length)];
    let extra = "";
    // Fire flash: the end that sat nearest the flame in the kiln came out darker.
    if (R() < 0.3) {
      const left = R() < 0.5;
      const a = at([left ? b0 : b1, 0, (zb + zt) / 2]), b = at([left ? b0 + (b1 - b0) * 0.55 : b1 - (b1 - b0) * 0.55, 0, (zb + zt) / 2]);
      const id = `nt-flash-${flashes++}`;
      const face = pathOf([[b0, zb], [b1, zb], [b1, zt], [b0, zt]].map(([x, z]) => at([x, 0, z])), true);
      extra += `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${fx(a[0])}" y1="${fx(a[1])}" x2="${fx(b[0])}" y2="${fx(b[1])}"><stop offset="0" class="nt-flash-0"/><stop offset="1" class="nt-flash-1"/></linearGradient><path class="nt-flash" d="${face}" fill="url(#${id})"/>`;
    }
    for (let i = 0, m = R() < 0.6 ? 1 + Math.floor(R() * 2) : 0; i < m; i++) extra += chipOn(b0, b1, zb, zt);
    out.push(texturedBox(box(b0, b1, zb, zt, -RAKE, 0), `data-part="brick" data-tint="${tint}"`, "nt-brick", extra));
  }
  // Salt bloom: lime washed out of the mortar dried white on a low brick and the joint under it.
  {
    const Rb = PEEL.rng(7171);
    const cx = 160, cz = 128;
    const pts = [];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const r = 1 + 0.35 * Math.sin(a * 3 + 1) + 0.25 * (Rb() - 0.5);
      pts.push(at([cx + Math.cos(a) * 62 * r, 0.3, cz + Math.sin(a) * 30 * r]));
    }
    const d = pathOf(pts, true);
    out.push(`<path class="nt-bloom" d="${d}"/><path class="nt-bloomgrain" d="${d}" fill="url(#nt-grainlight-front)"/>`);
  }
  out.push(weathering());
  // The crop: the card's own paper closes over the brickwork in an ellipse on the wall.
  const fade = affine([VIEW.x, 0, VIEW.z], [VIEW.rx, 0, 0], [0, 0, -VIEW.rz]);
  out.push(`<radialGradient id="nt-crop" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="${fade}"><stop offset=".62" class="nt-crop-0"/><stop offset=".8" class="nt-crop-1"/><stop offset=".93" class="nt-crop-2"/><stop offset="1" class="nt-crop-3"/></radialGradient>`);
  // The wall runs on past the crop: clip it just outside the crop's opaque rim, so none of it shows
  // beside the card, then lay the crop over the rim's box, so the clip's soft edge never shows either.
  const rim = Array.from({ length: 96 }, (_, i) => {
    const a = (i / 96) * Math.PI * 2;
    return at([VIEW.x + Math.cos(a) * VIEW.rx * 1.06, 0, VIEW.z + Math.sin(a) * VIEW.rz * 1.06]);
  });
  const xs = rim.map((p) => p[0]), ys = rim.map((p) => p[1]);
  const [l, r, t, b] = [Math.min(...xs) - 2, Math.max(...xs) + 2, Math.min(...ys) - 2, Math.max(...ys) + 2];
  const cover = pathOf([[l, t], [r, t], [r, b], [l, b]], true);
  return `<g class="nt-wall"><clipPath id="nt-view"><path d="${pathOf(rim, true)}"/></clipPath><g clip-path="url(#nt-view)">${out.join("")}</g><path class="nt-crop" d="${cover}" fill="url(#nt-crop)"/></g>`;
}


// Years on a wall: rain has run grime off the plate's lower edge down the bricks below it, and
// an earlier sign left two wall plugs in the brick to the right.
function weathering() {
  const out = [];
  const Rw = PEEL.rng(606);
  const top = PLATE.z - 2;
  const down = at([0, 0, -1]);
  const o = at([0, 0, 0]);
  const dir = [down[0] - o[0], down[1] - o[1]];
  for (let i = 0; i < 7; i++) {
    const x = PLATE.x + 14 + Rw() * (PLATE.w - 28);
    const len = 40 + Rw() * 110, w0 = 3 + Rw() * 7;
    const pts = [];
    const n = 12;
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const wob = Math.sin(t * 5 + i) * 1.2;
      pts.push([x - w0 * (1 - 0.6 * t) + wob, top - len * t]);
    }
    for (let k = n; k >= 0; k--) {
      const t = k / n;
      const wob = Math.sin(t * 5 + i) * 1.2;
      pts.push([x + w0 * (1 - 0.6 * t) + wob, top - len * t]);
    }
    const a = at([x, 0, top]), b = at([x, 0, top - len]);
    const id = `nt-run-${i}`;
    out.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${fx(a[0])}" y1="${fx(a[1])}" x2="${fx(b[0])}" y2="${fx(b[1])}"><stop offset="0" class="nt-run-0" style="stop-opacity:${(0.24 + Rw() * 0.16).toFixed(2)}"/><stop offset=".5" class="nt-run-0" style="stop-opacity:${(0.06 + Rw() * 0.06).toFixed(2)}"/><stop offset="1" class="nt-run-0" style="stop-opacity:0"/></linearGradient>`);
    out.push(`<path class="nt-run" d="${pathOf(pts.map(([px, pz]) => at([px, 0.2, pz])), true)}" fill="url(#${id})"/>`);
  }
  void dir;
  // the old plugs: a drilled hole, a grey plastic rim, one with a snapped screw in it
  for (const [x, z, screw] of [[214, 300, false], [218, 212, true]]) {
    out.push(`<path class="nt-plug" d="${faceRing(x, z, 4.2, 0.1, 24)}"/>`);
    out.push(`<path class="nt-plughole" d="${faceRing(x + 0.4, z - 0.3, 2.6, 0.1, 20)}"/>`);
    if (screw) out.push(`<path class="nt-plugscrew" d="${faceRing(x + 0.3, z - 0.2, 1.4, 0.15, 14)}"/>`);
  }
  return `<g class="nt-weather">${out.join("")}</g>`;
}

// ---- The plate on its spacers -----------------------------------------------------------------------
const SCREWS = [
  [PLATE.x + SCREW_IN, PLATE.z + SCREW_IN],
  [PLATE.x + PLATE.w - SCREW_IN, PLATE.z + SCREW_IN],
  [PLATE.x + SCREW_IN, PLATE.z + PLATE.h - SCREW_IN],
  [PLATE.x + PLATE.w - SCREW_IN, PLATE.z + PLATE.h - SCREW_IN],
];
const roundedXZ = ({ x, z, w, h, r }, steps = 8) => k.roundedPlan({ x, y: z, w, d: h, r }, steps);
const faceRing = (cx, cz, r, y, steps = 40) => pathOf(k.circleRing(cx, cz, r, steps).map(([a, b]) => at([a, y, b])), true);
function plate() {
  const out = [];
  const shadow = roundedXZ({ x: PLATE.x + 4, z: PLATE.z - 6, w: PLATE.w, h: PLATE.h, r: PLATE.r }).map(([x, z]) => at([x, 0, z]));
  out.push(`<path class="nt-plate-halo" d="${pathOf(shadow, true)}"/>`);
  for (const [x, z] of [...SCREWS].sort((a, b) => k.depthOf([a[0], 0, a[1]], P) - k.depthOf([b[0], 0, b[1]], P))) {
    out.push(S(G.disc(0, STANDOFF, 7.5, G.frameAlong([x, 0, z], [0, 1, 0]), P), { tone: "mid" }));
  }
  const ring = roundedXZ(PLATE, 8);
  const slab = G.prismOf(ALONG_Y, ring, STANDOFF, Y_FACE, P);
  // brushed grain: fine lines along x across the face, each running edge to edge
  const span = (z) => {
    const xs = [];
    for (let i = 0; i < ring.length; i++) {
      const [x0, z0] = ring[i], [x1, z1] = ring[(i + 1) % ring.length];
      if ((z0 - z) * (z1 - z) <= 0 && z0 !== z1) xs.push(x0 + ((x1 - x0) * (z - z0)) / (z1 - z0));
    }
    return xs.length >= 2 ? [Math.min(...xs), Math.max(...xs)] : null;
  };
  const grain = [[], [], []];
  const Rg = PEEL.rng(77);
  for (let z = PLATE.z + 1.6; z < PLATE.z + PLATE.h - 1.2; z += 1.3 + Rg() * 2.2) {
    const s = span(z);
    if (s) grain[Math.floor(Rg() * 3)].push(pathOf([at([s[0], Y_FACE, z]), at([s[1], Y_FACE, z])]));
  }
  const grainSvg = `<g class="nt-grain">${grain.map((list, i) => `<g data-weight="${i}">${L(list.join(""), { tone: "faint" })}</g>`).join("")}</g>`;
  const chamfer = L(pathOf(roundedXZ({ x: PLATE.x + 1.8, z: PLATE.z + 1.8, w: PLATE.w - 3.6, h: PLATE.h - 3.6, r: PLATE.r - 1.8 }).map(([x, z]) => at([x, Y_FACE, z])), true), { tone: "faint" });
  // Stainless sheen: a soft band of light across the brushed face, dark toward the far corners.
  const g0 = at([PLATE.x, Y_FACE, PLATE.z + PLATE.h]), g1 = at([PLATE.x + PLATE.w, Y_FACE, PLATE.z]);
  const sheen = `<linearGradient id="nt-sheen" gradientUnits="userSpaceOnUse" x1="${fx(g0[0])}" y1="${fx(g0[1])}" x2="${fx(g1[0])}" y2="${fx(g1[1])}"><stop offset="0" class="nt-sheen-dark"/><stop offset=".3" class="nt-sheen-none"/><stop offset=".44" class="nt-sheen-light"/><stop offset=".56" class="nt-sheen-none"/><stop offset=".78" class="nt-sheen-soft"/><stop offset="1" class="nt-sheen-dark"/></linearGradient><path class="nt-sheen" d="${slab.shades[2]}" fill="url(#nt-sheen)"/>`;
  out.push(S(slab, { tone: "mid", className: "nt-steel", inner: sheen + grainSvg + chamfer }));
  for (const [x, z] of SCREWS) {
    out.push(L(faceRing(x, z, 6.4, Y_FACE), { tone: "lo" }));
    out.push(`<path class="nt-screw" d="${faceRing(x, z, 5.3, Y_FACE)}"/>`);
    out.push(L(faceRing(x, z, 5.3, Y_FACE), { tone: "mid" }));
    const a = 0.5 + R() * 0.8, r = 5.3;
    const seg = (c, s) => pathOf([at([x - c * r, Y_FACE, z - s * r]), at([x + c * r, Y_FACE, z + s * r])]);
    out.push(L(seg(Math.cos(a), Math.sin(a)) + seg(Math.cos(a + Math.PI / 2), Math.sin(a + Math.PI / 2)), { tone: "mid" }));
    out.push(L(faceRing(x, z, 1.4, Y_FACE, 16), { tone: "lo" }));
  }
  // Dust has settled on the plate's top edge.
  if (slab.top) out.push(`<path class="nt-dust" d="${slab.top}" fill="url(#nt-grain-front)"/>`);
  // Light scratches in the steel, from keys and cleaning; each fades out at both ends.
  const Rs = PEEL.rng(919);
  for (let i = 0; i < 7; i++) {
    const x = PLATE.x + 14 + Rs() * (PLATE.w - 28), z = PLATE.z + 12 + Rs() * (PLATE.h - 24);
    const a = -0.4 + Rs() * 0.8, len = 10 + Rs() * 26;
    const pts = [];
    for (let k = 0; k <= 6; k++) pts.push(at([x + Math.cos(a) * len * (k / 6 - 0.5), Y_FACE, z + Math.sin(a) * len * (k / 6 - 0.5) + Math.sin(k) * 0.3]));
    out.push(k.fadeLineSvg(pts, { fade: [len * 0.3, len * 0.35], tone: "lo", className: "nt-scratch" }));
  }
  return `<g class="nt-plate">${out.join("")}</g>`;
}

// ---- Residue and the piece that stayed ---------------------------------------------------------------
const onPlate = (ring, h = 0, closed = true) => pathOf(ring.map((p) => at(PEEL.onFace(p, h))), closed);
// A ring offset outward from a convex outline, each vertex pushed along its corner's bisector.
function offsetRing(ring, o) {
  const n = ring.length;
  const sgn = Math.sign(ring.reduce((a, p, i) => a + p[0] * ring[(i + 1) % n][1] - ring[(i + 1) % n][0] * p[1], 0));
  return ring.map((p, i) => {
    const a = ring[(i + n - 1) % n], b = ring[(i + 1) % n];
    const ex = b[0] - a[0], ey = b[1] - a[1];
    const l = Math.hypot(ex, ey) || 1;
    return [p[0] + (sgn * ey * o) / l, p[1] - (sgn * ex * o) / l];
  });
}
function residue() {
  const out = [];
  // Years on the wall: adhesive crept a hair past the die-cut edge and caught dust, most along the
  // top edge, where dust settles. It was there before the peel and stays after it.
  const ring = offsetRing(PEEL.OUTLINE, 0.7);
  const top = ring.map((p, i) => [p, i]).filter(([p]) => p[1] < -PEEL.TAG.h / 2 + PEEL.TAG.r * 0.6);
  const runTop = [...top.filter(([, i]) => i > ring.length / 2), ...top.filter(([, i]) => i <= ring.length / 2)].map(([p]) => p);
  out.push(`<path class="nt-ooze" d="${onPlate(ring)}"/><path class="nt-ooze nt-ooze-top" d="${onPlate(runTop, 0, false)}"/>`);
  const region = onPlate(PEEL.FLAP);
  // The clip is the region with every bare spot and scrape cut out of it, so the steel and its
  // grain show through the holes in the residue.
  const cuts = [...RESIDUE.holes, ...RESIDUE.scratches].map((h) => onPlate(h)).join("");
  out.push(`<clipPath id="nt-where"><path clip-rule="evenodd" d="${region}${cuts}"/></clipPath>`);
  out.push(`<g clip-path="url(#nt-where)">`);
  out.push(`<path class="nt-film" d="${region}"/>`);
  out.push(`<path class="nt-tex" d="${region}" fill="url(#nt-drift-img)"/>`);
  out.push(`<path class="nt-tex" d="${region}" fill="url(#nt-fuzz-img)"/>`);
  out.push(`<g class="nt-islands">${RESIDUE.islands.map((s) => `<path d="${onPlate(s)}"/>`).join("")}</g>`);
  out.push(`<g class="nt-specks">${RESIDUE.specks.map(([u, v, r]) => {
    const [x, y] = at(PEEL.onFace([u, v]));
    return `<circle cx="${fx(x)}" cy="${fx(y)}" r="${fx(r)}"/>`;
  }).join("")}</g>`);
  out.push(`</g>`);
  // the torn edge of the piece that stayed lifts a hair and throws a thin shadow on the residue
  out.push(`<path class="nt-lift" d="${onPlate(PEEL.TEAR.map(([u, v]) => [u - 1.1, v + 0.5]), 0, false)}"/>`);
  // the line the label's die-cut edge left in the adhesive, from one end of the tear to the other
  const n = PEEL.FLAP.length;
  const kinds = PEEL.SPLIT.flapKind;
  const die = PEEL.FLAP.filter((_, i) => kinds[i] === "die" || kinds[(i + n - 1) % n] === "die");
  out.push(L(onPlate(die, 0, false), { tone: "lo" }));
  return `<g class="nt-residue">${out.join("")}</g>`;
}
function stuck() {
  const paint = PEEL.stuckPaint(P);
  const band = onPlate(STUCK_EDGE.band, PEEL.TAG_T);
  const fibres = STUCK_EDGE.fibres.map((f) => onPlate(f, PEEL.TAG_T * 0.5, false)).join("");
  return `<g class="nt-stuck" data-band="${paint.band}"><path class="nt-under" d="${paint.under}"/>${paint.sides.map((d, i) => `<path class="nt-side" data-shade="${i}" d="${d}"/>`).join("")}<path class="nt-face" d="${paint.fill}"/><path class="nt-tex" d="${paint.fill}" fill="url(#nt-paper-img)"/><path class="nt-delam" d="${band}"/><path class="nt-tex" d="${band}" fill="url(#nt-fuzz-img)"/><path class="nt-bleed" d="${paint.ink}"/><path class="nt-ink" d="${paint.ink}" style="stroke-width:${INK_W}px"/>${L(fibres, { tone: "lo", className: "nt-fibre" })}<path class="nt-tear" d="${paint.tear}"/><path class="nt-edge" d="${paint.edge}"/></g>`;
}

// ---- The label: a pool of paths the page rewrites every frame; the build fills it once --------------
const POOL = 130;
const INK_W = 1.7;
function tagLayer(s) {
  const st = PEEL.stateAt(s);
  const paint = PEEL.paintOf(st, P);
  const flat = paint.flat ?? { fill: "", under: "", sides: ["", "", "", ""], edge: "", ink: "", band: 2 };
  const slots = [];
  for (let i = 0; i < POOL; i++) {
    const x = paint.strips[i];
    slots.push(
      `<g class="nt-slot" data-side="${x?.side ?? "face"}" data-band="${x?.band ?? 2}"${x ? "" : ' data-empty=""'}><path class="nt-strip" d="${x?.fill ?? ""}"/><path class="nt-seam" d="${x?.seam ?? ""}"/><path class="nt-backspot" d="${x?.spots ?? ""}"/><path class="nt-ghost" d="${x?.ghost ?? ""}"/><path class="nt-backfuzz" d="${x?.fuzz ?? ""}"/><path class="nt-fringe" d="${x?.fringe ?? ""}"/><path class="nt-ink" d="${x?.ink ?? ""}" style="stroke-width:${(INK_W * (x?.width ?? 1)).toFixed(2)}px"/><path class="nt-crease" d="${x?.crease ?? ""}"/><path class="nt-tear" d="${x?.tear ?? ""}"/><path class="nt-edge" d="${x?.edge ?? ""}"/></g>`,
    );
  }
  return `<g class="nt-tag" data-part="tag"><g class="nt-flat" data-part="flat" data-band="${flat.band}"${paint.flat ? "" : ' style="display:none"'}><path class="nt-under" d="${flat.under}"/>${flat.sides.map((d, i) => `<path class="nt-side" data-shade="${i}" d="${d}"/>`).join("")}<path class="nt-face" d="${flat.fill}"/><path class="nt-seam" d="${flat.seam}"/><path class="nt-tex nt-grainpaper" d="${flat.fill}" fill="url(#nt-paper-img)"/><path class="nt-seamgrain" d="${flat.seam}" style="stroke:url(#nt-paper-img)"/><path class="nt-bleed" d="${flat.ink}"/><path class="nt-ink" d="${flat.ink}" style="stroke-width:${INK_W}px"/><path class="nt-edge" d="${flat.edge}"/></g><path class="nt-halo" data-part="halo" d="${paint.halo || "M0 0"}" style="opacity:${paint.haloOpacity.toFixed(2)};filter:blur(${paint.haloBlur.toFixed(1)}px)"/><path class="nt-halo nt-contact" data-part="contact" d="${paint.contact || "M0 0"}" style="opacity:${paint.contactOpacity.toFixed(2)}"/><g class="nt-curl" data-part="curl">${slots.join("")}</g></g>`;
}

const CSS = readFileSync(join(HERE, "name-tag.css"), "utf8");
const STATIC = () => [DEFS, wall(), plate(), residue(), stuck()].join("");
const LABEL_TEXT =
  "A section of brick wall with a brushed stainless steel plate screwed to it on four spacers. Stuck to the plate is a blank 86 by 59 millimetre name sticker with an illegible marker scribble. A corner lifts and the sticker rolls up into one curl, adhesive side out; it tears unevenly, so about three fifths come away and fall while a ragged piece with the end of the scribble stays stuck. Where it came off, the plate holds a fuzz of adhesive and paper fibre with rows of bare spots.";

const sheetArg = flag("sheet");
if (sheetArg) {
  // A contact sheet of static poses, for looking at the curl without the live page.
  const poses = sheetArg.split(",").map(Number);
  const art = STATIC();
  const cells = poses
    .map((s) => {
      const tag = `p${String(s).replace(".", "_")}-`;
      const body = (art + tagLayer(s)).replace(/id="nt-/g, `id="${tag}nt-`).replace(/url\(#nt-/g, `url(#${tag}nt-`).replace(/href="#nt-/g, `href="#${tag}nt-`);
      return `<div class="cell"><div class="lab">s ${s}</div>${k.figureSvg({ width: WIDTH, height: HEIGHT, className: "nt-svg", label: "pose", body: [`<style>${CSS}</style>`, body] })}</div>`;
    })
    .join("");
  const page = k.pageHtml({ title: "poses", theme, body: `<style>.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.cell{background:var(--anatomy-card);box-shadow:0 0 0 1px var(--anatomy-faint);position:relative}.lab{position:absolute;left:8px;top:6px;font:11px monospace;color:var(--anatomy-muted)}</style><div class="grid iso-plate" style="padding:8px">${cells}</div>`, width: 1500 });
  writeFileSync(join(HERE, flag("out") ?? "poses.html"), page);
  console.log("wrote sheet");
  process.exit(0);
}

// `--artifact <file>` writes a theme-following page body for embedding (an Artifact).
const ARTIFACT = argv.includes("--artifact") ? argv[argv.indexOf("--artifact") + 1] || "artifact.html" : null;
const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, className: "nt-svg", label: LABEL_TEXT, body: [ARTIFACT ? "" : `<style>${CSS}</style>`, STATIC(), tagLayer(POSE)] });
// `--hold=<s>` builds a page that rests at one pose, for close-ups.
const DATA = { P, POOL, inkWidth: INK_W, label: LABEL, hold: flag("hold") === undefined ? null : Number(flag("hold")) };
const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8");
const script = MODEL + `\nconst DATA = ${JSON.stringify(DATA)};\n` + LIVE;
const body = k.plateHtml({
  fig: "Fig 4A",
  title: "Name tag, torn off",
  hint: "Drag across to peel",
  readout: "stuck · name on",
  keys: [
    { mark: "lit", label: "The label: a blank name sticker, 86 × 59 mm" },
    { mark: "flat", label: "Residue: adhesive and paper fibre left on the steel" },
  ],
  caption: `A blank name sticker on a brushed steel plate, screwed to a brick wall. Picked at one corner, it rolls up into a single curl with the printed face inside, then tears unevenly: ${Math.round(PEEL.SHARE_OFF * 100)}% comes away with most of the scribble and the rest stays, a ragged piece with a fibrous torn edge. Where it came off, the adhesive split and kept a fuzz of paper fibre, broken by rows of bare spots where the front stuck and slipped. The force is Kendall's peel, F = G·b / (1 − cos θ), with G = 100 J/m² and b the length of the front.`,
  body: `<div class="iso-stage nt-stage" tabindex="0" role="slider" aria-label="Name tag peel: drag across or use the arrow keys to peel the sticker; Space tears it off or lays a new one" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="Stuck down, the scribble on it">${svg}</div><p class="nt-live" aria-live="polite"></p>`,
});
if (ARTIFACT) {
  // The page for an Artifact: no document shell, and both themes from the viewer's setting. The
  // kit's tokens and this figure's are re-keyed onto :root, light first, with the dark set under
  // prefers-color-scheme and again under an explicit data-theme="dark".
  const block = (css, selector) => {
    const at = css.indexOf(selector + "{") >= 0 ? css.indexOf(selector + "{") : css.indexOf(selector + " {");
    const open = css.indexOf("{", at), close = css.indexOf("}", open);
    return { body: css.slice(open + 1, close).trim(), rest: css.slice(0, at) + css.slice(close + 1) };
  };
  const kitDark = block(k.ISO_CSS, ".iso");
  const kitLight = block(kitDark.rest, '.iso[data-theme="light"]');
  const ntLight = block(CSS, ".iso");
  const ntDark = block(ntLight.rest, '.iso[data-theme="dark"]');
  const light = `${kitLight.body}\n${ntLight.body}`;
  const dark = `${kitDark.body.replace(/--anatomy-weight[^;]*;|--anatomy-ease[^;]*;|--anatomy-mono[^;]*;/g, "")}\n${ntDark.body}`;
  const page = `
body{margin:0;background:var(--anatomy-page);color:var(--anatomy-text);font:14px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.nt-page{box-sizing:border-box;width:min(760px,100%);margin-inline:auto;padding-inline:16px;padding-block:32px 56px}
.nt-page *{box-sizing:border-box}
.iso-figure{margin:0}`;
  const css = `:root{\n${light}\n--anatomy-weight:.6px;--anatomy-ease:cubic-bezier(.32,.72,0,1);--anatomy-mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){\n${dark}\ncolor-scheme:dark}}
:root[data-theme="dark"]{\n${dark}\ncolor-scheme:dark}
${kitLight.rest}\n${ntDark.rest}\n${page}`;
  const html = `<title>Name Tag, Torn Off</title>\n<style>${css}</style>\n<main class="iso nt-page">${body}</main>\n<script type="module">${script.replace(/<\/(script)/gi, "<\\/$1")}</script>\n`;
  writeFileSync(ARTIFACT, html);
  console.log("wrote", ARTIFACT);
  process.exit(0);
}
const name = flag("out") ?? (theme === "light" ? "name-tag-torn-off-light.html" : "name-tag-torn-off.html");
writeFileSync(join(HERE, name), k.pageHtml({ title: "Name tag, torn off", theme, body, script, width: 680 }));
console.log("wrote", name);
