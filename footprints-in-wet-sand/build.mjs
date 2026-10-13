import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import { glCamera } from "./kit/gl.mjs";
import * as M from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT = join(HERE, "kit");
const theme = process.argv.includes("--light") ? "light" : "dark";
const strip = (file) => readFileSync(join(KIT, file), "utf8").replace(/^export /gm, "");

const W = 880;
const H = 520;
const AZIMUTH = 70;
const ELEVATION = 42;

const L = M.STRIP.length;
const D = M.STRIP.width;
const Z0 = M.STRIP.sea;
const Z1 = M.surfaceAt(D);
const PLATE = { x: -18, y: -16, w: L + 36, d: D + 52, r: 6 };
const PLATE_H = 7;
const FOOT_H = 6;
const RULER = { x: -6, y: D + 12, w: L + 12, d: 9, r: 1 };
const LABEL = { x: L + 5.5, y: 112, w: 9.5, d: 58, r: 1.4 };
const SCALE = { x: L, y: D - 30, w: 1.4, d: 4.6, r: 0.3 };
const SCALE_FOOT = { x: L, y: D - 32, w: 5.5, d: 8.6, r: 0.8 };
const SCALE_TOP = 30;

const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, 0, Z0], [L, 0, Z0], [L, D, Z1], [0, D, Z1]], W, H, { pad: 30, azimuth: AZIMUTH, elevation: ELEVATION });
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const poly = (points, closed = false) => k.pathOf(points.map(at), closed);
const { sinA, cosA } = k.cameraOf(P);
const shadeOf = ([nx, ny]) => Math.min(3, Math.max(0, Math.floor(((nx * -sinA + ny * cosA + 1) / 2) * 4)));

const range = (from, to, step) => {
  const out = [];
  const count = Math.max(1, Math.round((to - from) / step));
  for (let i = 0; i <= count; i++) out.push(from + ((to - from) * i) / count);
  return out;
};

const MODERN = Array.from({ length: 12 }, (_, k) => ({ depth: 1.15 + 1.45 * k + 0.25 * Math.sin(k * 2.7), wave: 0.22 + 0.025 * k, band: k === 2 ? 0.75 : k === 6 ? 0.95 : k === 9 ? 0.6 : 0 }));
const sheetAt = (layer, k, x, y) => M.surfaceAt(y) - layer.depth - layer.wave * (Math.sin(x / 23 + k * 1.7) * 0.6 + Math.sin(y / 17 + k * 2.3) * 0.4);
const scourAt = (x, y) => 10.6 + 0.055 * y + 1.3 * Math.sin(x / 41 + 0.6) + 0.7 * Math.sin(x / 13 + 2.1) + 0.9 * Math.sin(y / 29 + 1.4);
const OLD = Array.from({ length: 16 }, (_, k) => -14 + 2.1 * k);
const oldAt = (c, k, x, y) => c + (1 / 8) * y + 0.02 * (x - L / 2) + 0.45 * Math.sin(x / 31 + k) + 0.3 * Math.sin(y / 21 + k * 1.3);
const TABLE = (x, y) => 12.6 + 0.032 * y + 0.4 * Math.sin(x / 57);
const FACES = [
  { name: "front", count: Math.round(L / 2), at: (t) => [t * L, D] },
  { name: "end", count: Math.round(D / 1.5), at: (t) => [L, t * D] },
];

function runsOf(face, height, inside) {
  const runs = [];
  let run = [];
  const point = (t) => {
    const [x, y] = face.at(t);
    return [x, y, height(x, y)];
  };
  const edge = (t0, t1) => {
    let a = t0;
    let b = t1;
    for (let i = 0; i < 24; i++) {
      const m = (a + b) / 2;
      if (inside(point(m)) === inside(point(a))) a = m;
      else b = m;
    }
    return point((a + b) / 2);
  };
  let prev = null;
  for (let i = 0; i <= face.count; i++) {
    const t = i / face.count;
    const p = point(t);
    const ok = inside(p);
    if (prev !== null && ok !== prev.ok) {
      const cut = edge(prev.t, t);
      if (ok) run = [cut];
      else {
        run.push(cut);
        if (run.length > 1) runs.push(run);
        run = [];
      }
    }
    if (ok) run.push(p);
    prev = { t, ok };
  }
  if (run.length > 1) runs.push(run);
  return runs;
}

function faces() {
  const out = [];
  const front = [[0, D, 0], [L, D, 0], [L, D, Z1], [0, D, Z1]];
  const end = [[L, 0, 0], [L, D, 0], [L, D, Z1], [L, 0, Z0]];
  const top = [[0, 0, Z0], [L, 0, Z0], [L, D, Z1], [0, D, Z1]];
  const fill = poly([[0, 0, Z0], [L, 0, Z0], [L, 0, 0], [L, D, 0], [0, D, 0], [0, D, Z1]], true);
  out.push(`<path class="iso-fill" d="${fill}"/>`);
  out.push(`<path class="iso-shade" data-shade="${shadeOf([0, 1])}" d="${poly(front, true)}"/>`);
  out.push(`<path class="iso-shade" data-shade="${shadeOf([1, 0])}" d="${poly(end, true)}"/>`);
  out.push(`<path class="iso-top fp-wet" d="${poly(top, true)}"/>`);
  return { svg: out.join(""), front, end, top };
}

function saturated() {
  const fills = [];
  const lines = [];
  for (const face of FACES) {
    const top = [];
    for (let i = 0; i <= face.count; i++) {
      const [x, y] = face.at(i / face.count);
      top.push([x, y, TABLE(x, y)]);
    }
    const [x0, y0] = face.at(0);
    const [x1, y1] = face.at(1);
    fills.push(poly([...top, [x1, y1, 0], [x0, y0, 0]], true));
    lines.push(poly(top));
  }
  return `<g class="fp-wet-zone">${fills.map((d) => `<path d="${d}"/>`).join("")}</g>` + Ln(lines.join(""), { tone: "faint", className: "fp-table" });
}

function laminae() {
  const modern = [];
  const old = [];
  const bands = [];
  const scour = [];
  for (const face of FACES) {
    MODERN.forEach((layer, k) => {
      const height = (x, y) => sheetAt(layer, k, x, y);
      for (const run of runsOf(face, height, ([x, y, z]) => z > scourAt(x, y))) modern.push(poly(run));
      if (layer.band) {
        const lower = (x, y) => sheetAt(layer, k, x, y) - layer.band * (0.55 + 0.45 * Math.sin((x + y) / 9 + k));
        for (const run of runsOf(face, lower, ([x, y, z]) => z > scourAt(x, y))) {
          const upper = run.map(([x, y]) => [x, y, Math.max(height(x, y), lower(x, y))]);
          bands.push(poly([...upper, ...run.reverse()], true));
        }
      }
    });
    OLD.forEach((c, k) => {
      const height = (x, y) => oldAt(c, k, x, y);
      for (const run of runsOf(face, height, ([x, y, z]) => z < scourAt(x, y) && z > 0)) old.push(poly(run));
    });
    const line = [];
    for (let i = 0; i <= face.count; i++) {
      const [x, y] = face.at(i / face.count);
      line.push([x, y, scourAt(x, y)]);
    }
    scour.push(poly(line));
  }
  return (
    `<g class="fp-bands">${bands.map((d) => `<path d="${d}"/>`).join("")}</g>` +
    Ln(old.join(""), { tone: "faint", className: "fp-lamina fp-old" }) +
    Ln(modern.join(""), { tone: "faint", className: "fp-lamina" }) +
    Ln(scour.join(""), { tone: "lo", className: "fp-scour" })
  );
}

function lag() {
  const pebbles = [];
  const shells = [];
  for (const face of FACES) {
    const span = face.name === "front" ? L : D;
    const count = Math.round(span / 9);
    for (let i = 0; i < count; i++) {
      const t = (i + 0.2 + 0.6 * M.hashOf(i * 3.7 + span)) / count;
      const [x, y] = face.at(t);
      const r = 0.42 + 0.48 * M.hashOf(i * 5.3 + span * 0.1);
      const z = scourAt(x, y) + r * 0.78 + 0.05;
      const kind = M.hashOf(i * 9.1 + span * 0.3);
      if (kind < 0.3 && face.name === "front") shells.push(shellOnFront(x, z - r * 0.5, 0.9 + r * 0.6, kind < 0.15 ? 1 : -1));
      else {
        const along = face.name === "front" ? [1, 0] : [0, 1];
        const ring = Array.from({ length: 14 }, (_, j) => {
          const a = (j / 14) * Math.PI * 2;
          const w = r * (1.25 + 0.15 * Math.sin(a * 2 + i));
          return [x + along[0] * w * Math.cos(a), y + along[1] * w * Math.cos(a), z + r * 0.78 * Math.sin(a)];
        });
        pebbles.push(poly(ring, true));
      }
    }
  }
  return `<g class="fp-pebbles">${pebbles.map((d) => `<path d="${d}"/>`).join("")}</g>` + shells.join("");
}

function shellPath(map, size, flip) {
  const outline = [];
  for (let i = 0; i <= 16; i++) {
    const t = (i / 16) * Math.PI;
    outline.push([-Math.cos(t) * 1.3 * size, Math.sin(t) * 0.75 * size * (1 - 0.25 * Math.cos(t) * flip)]);
  }
  const ribs = [0.45, 0.75].map((f) => {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const t = (i / 10) * Math.PI;
      pts.push([-Math.cos(t) * 1.3 * size * f, Math.sin(t) * 0.75 * size * f * (1 - 0.25 * Math.cos(t) * flip)]);
    }
    return pts;
  });
  const fill = k.pathOf(outline.map(map), true);
  const rib = ribs.map((pts) => k.pathOf(pts.map(map))).join("");
  return `<g class="fp-shell"><path class="fp-shell-body" d="${fill}"/>${Ln(rib, { tone: "faint" })}${Ln(fill, { tone: "lo" })}</g>`;
}
const shellOnFront = (x, z, size, flip) => shellPath(([u, v]) => at([x + u, D, z + v]), size, flip);

function donax() {
  const x = 236;
  const z = Z1 - 4.4;
  const length = 2.7;
  const lean = 0.22;
  const at3 = (u, v) => [x + u * Math.cos(lean) - v * Math.sin(lean), D, z + u * Math.sin(lean) + v * Math.cos(lean)];
  const outline = [];
  for (let i = 0; i <= 28; i++) {
    const t = (i / 28) * Math.PI * 2;
    const u = Math.cos(t) * (length / 2);
    const v = Math.sin(t) * 0.66 * (1 + 0.32 * Math.cos(t)) * (Math.sin(t) > 0 ? 1 : 0.86);
    outline.push(at3(u, v));
  }
  const growth = [0.42, 0.72].map((f) =>
    Array.from({ length: 13 }, (_, i) => {
      const t = Math.PI * (0.08 + 0.84 * (i / 12));
      const u = Math.cos(t) * (length / 2) * (0.35 + 0.65 * f);
      const v = Math.sin(t) * 0.66 * (1 + 0.32 * Math.cos(t)) * f - 0.66 * 0.86 * (1 - f);
      return at3(u, v);
    }),
  );
  const tip = at3(length / 2 - 0.15, 0.32);
  const siphon = [tip, [tip[0] + 0.5, D, tip[2] + 1.2], [tip[0] + 0.7, D, tip[2] + 2.6], [tip[0] + 0.75, D, Z1]];
  return `<g class="fp-shell"><path class="fp-shell-body" d="${poly(outline, true)}"/>${Ln(growth.map((g) => poly(g)).join(""), { tone: "faint" })}${Ln(poly(outline, true), { tone: "lo" })}${Ln(poly(siphon), { tone: "faint", className: "fp-siphon" })}</g>`;
}

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = byDepth([...k.corners(PLATE, 24), [PLATE.x + PLATE.w / 2, PLATE.y + 24], [PLATE.x + PLATE.w / 2, PLATE.y + PLATE.d - 24]]);
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 9, -PLATE_H - FOOT_H, 1.8, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H + 1.8, FOOT_H - 1.8, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "mid" }));
  out.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(Dots(screws.map(([x, y]) => at([x, y, 0])), { size: 0.55 }));
  const side = k.sideTicks(PLATE.x + 28, PLATE.x + PLATE.w - 28, 10, 5, PLATE.y + PLATE.d, 0, [2, 3.4], P, "x");
  out.push(Ln(side.minor, { tone: "faint" }), Ln(side.major, { tone: "lo" }));
  out.push(S(k.slabOf(RULER, 0, 0.7, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(0, L, 10, 5, RULER.y + 0.9, 0.7, [2.6, 4.6], P);
  out.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
  const half = k.topTicks(5, L - 5, 10, 1, RULER.y + 0.9, 0.7, [1.6, 1.6], P);
  out.push(Ln(half.minor + half.major, { tone: "faint" }));
  out.push(Dots([at([RULER.x + 2.6, RULER.y + RULER.d / 2, 0.7]), at([RULER.x + RULER.w - 2.6, RULER.y + RULER.d / 2, 0.7])], { size: 0.45 }));
  out.push(S(k.slabOf(LABEL, 0, 0.9, P, 3), { tone: "mid" }));
  out.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.6), 0.9, P), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([LABEL.x + 6.2, LABEL.y + LABEL.d - 6], 0.9, P, "y"), "SWASH ZONE 1:12", { size: 3.4, tone: "lo" }));
  out.push(Ln(k.onTop([[LABEL.x + 3, LABEL.y + 7], [LABEL.x + 3, LABEL.y + 24]], 0.9, P), { tone: "lo", free: true }));
  out.push(Dots([at([LABEL.x + LABEL.w / 2, LABEL.y + 3, 0.9]), at([LABEL.x + LABEL.w / 2, LABEL.y + LABEL.d - 3, 0.9])], { size: 0.45 }));
  return out.join("");
}

function block() {
  const f = faces();
  const crease = poly([[0, D, Z1], [L, D, Z1]]) + poly([[L, 0, Z0], [L, D, Z1]]);
  const corner = poly([[L, D, 0], [L, D, Z1]]);
  const outline = poly([[0, D, Z1], [0, D, 0], [L, D, 0], [L, 0, 0], [L, 0, Z0]]);
  const inner = saturated() + laminae() + lag() + donax();
  return `<g class="iso-solid fp-cut">${f.svg}<g class="fp-section">${inner}</g>${Ln(corner, { tone: "lo" })}<path class="iso-line iso-edge" data-tone="hi" d="${outline}"/></g><path class="iso-line fp-crease-under" data-tone="lo" d="${crease}"/>`;
}

function scale() {
  const out = [];
  out.push(S(k.slabOf(SCALE_FOOT, 0, 1.6, P, 2, 0.3), { tone: "mid" }));
  out.push(Dots([at([SCALE_FOOT.x + 3.6, SCALE_FOOT.y + 1.6, 1.6]), at([SCALE_FOOT.x + 3.6, SCALE_FOOT.y + SCALE_FOOT.d - 1.6, 1.6])], { size: 0.4 }));
  out.push(S(k.slabOf(SCALE, 1.6, SCALE_TOP - 1.6, P, 1, 0), { tone: "hi", crease: "lo" }));
  const face = SCALE.x + SCALE.w;
  const edge = SCALE.y + SCALE.d;
  const minor = [];
  const major = [];
  for (let z = 2; z < SCALE_TOP - 0.5; z += 1) {
    const long = z % 5 === 0;
    (long ? major : minor).push(poly([[face, edge, z], [face, edge - (long ? 2.6 : 1.4), z]]));
  }
  out.push(Ln(minor.join(""), { tone: "lo" }), Ln(major.join(""), { tone: "mid" }));
  return out.join("");
}

function fallback() {
  return `<g class="fp-fallback" aria-hidden="true"><g data-part="prints"></g><path data-part="sheet" class="fp-sheet" d=""/><path data-part="lace" class="fp-lace" d=""/></g>`;
}

const topEdges = poly([[L, 0, Z0], [0, 0, Z0], [0, D, Z1]]);
const topCreases = poly([[0, D, Z1], [L, D, Z1], [L, 0, Z0]]);

const back = [plate(), block(), scale(), fallback()];
const front = [Ln(topCreases, { tone: "lo" }), `<path class="iso-line iso-edge" data-tone="hi" d="${topEdges}"/>`];

const QUAD = [[0, 0, Z0], [L, 0, Z0], [L, D, Z1], [0, D, Z1]].map(at);

const DATA = {
  W,
  H,
  P,
  camera: glCamera(P),
  quad: QUAD,
  strip: M.STRIP,
};

const LABEL_TEXT =
  "A block of beach cut from the swash zone and set on a plinth: a strip of smooth, dark, wet sand 3.6 m long and 1.8 m across, rising 1 in 12 from the sea edge at the back. Its cut faces show the swash laminae, two dark heavy-mineral bands, an older storm scour with a shell and pebble lag, a buried wedge clam and the water table. Footprints press into the sand one step at a time, each ringed for a moment by pale, drained sand; then a thin sheet of swash slides up from the sea edge with a foam front, covers the prints, smooths them away and drains back, leaving the sand glossy and smooth again.";

const backSvg = k.figureSvg({ width: W, height: H, label: LABEL_TEXT, body: back, className: "fp-back" });
const frontSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg fp-layer fp-front" viewBox="0 0 ${W} ${H}" aria-hidden="true">${front.join("")}</svg>`;
const stage = `<div class="fp-stage" tabindex="0" role="group" aria-roledescription="beach strip" aria-label="Footprints in wet sand. Tap or click the sand to press a footprint there; press the right arrow key to take the next step, and Space or Enter to send a wave up the beach."><span class="fp-said" aria-live="polite"></span>${backSvg}<canvas class="fp-layer fp-gl" aria-hidden="true"></canvas>${frontSvg}</div>`;

const wave = M.waveOf(0, 0);
const tops = [];
for (let index = 0; index < 200; index++) {
  const each = M.waveOf(0, index);
  for (let x = 0; x <= L; x += 3) tops.push(M.topOf(each, x));
}
const meanTop = tops.reduce((sum, top) => sum + top, 0) / tops.length;
let deepest = 0;
for (let s = 0.5; s < 5; s += 0.02) for (let y = 0; y < D; y += 2) deepest = Math.max(deepest, M.depthAt(wave, L / 2, y, s));
const entry = M.speedAt(wave, L / 2, M.timesAt(wave, L / 2, 0)[0]);
const caption = `A strip of the swash zone, ${M.metres(L)} m along the shore and ${M.metres(D)} m up it, cut from a beach that rises 1 in 12. Someone walks across at ${((M.GAIT.step / 100) / M.GAIT.gap).toFixed(2)} m/s, ${M.metres(M.GAIT.step)} m a step, and each bare heel sinks ${(M.GAIT.depth * 10).toFixed(0)} mm. While the foot is down, the sand around it turns pale: shearing makes the packed grains dilate, and the water drains down into the new pore space (Reynolds' dilatancy). When the foot lifts, the water comes back and pools in the heel and the ball. Then a bore collapses ${M.metres(-M.SWASH.from)} m seaward of the strip. Its swash crosses the sea edge at ${(entry / 100).toFixed(1)} m/s and slows at g·sin β = ${(M.DOWNHILL / 100).toFixed(2)} m/s², so it turns ${M.turnOf(wave, L / 2).toFixed(1)} s after the collapse, about ${M.metres(meanTop)} m up the strip (${M.metres(Math.min(...tops))} to ${M.metres(Math.max(...tops))} m along its lobes, from wave to wave), and drains back the same way (Shen and Meyer's ballistic swash). The sheet is never more than ${(deepest * 10).toFixed(0)} mm deep, yet it smooths each print away within a second or two of covering it. The film it leaves sinks into the sand, and the sheen fades.`;

const body = `<div class="fp">${k.plateHtml({
  fig: "Fig 1",
  title: "Footprints in wet sand",
  hint: "Click the sand to step · Space sends a wave",
  readout: "smooth",
  keys: [
    { mark: "raised", label: "Beach block, cut to show its laminae and water table" },
    { mark: "edge", label: "Storm scour with a shell and pebble lag" },
    { mark: "flat", label: "Ruler, 10 cm ticks; scale on the end, 1 cm" },
  ],
  caption,
  body: stage,
})}</div>`;

const CSS = readFileSync(join(HERE, "sand.css"), "utf8");
const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));
const page = k.pageHtml({ title: "Footprints in wet sand", theme, body: `<style>${CSS}</style>${body}`, script: strip("iso-kit.mjs") + strip("gl.mjs") + MODEL + LIVE, width: 1000 });
const target = process.argv.indexOf("--artifact");
if (target > 0) {
  const script = (strip("iso-kit.mjs") + strip("gl.mjs") + MODEL + LIVE).replace(/<\/(script)/gi, "<\\/$1");
  const shell = `<title>Footprints in Wet Sand</title>
<style>
:root{--page:#f2f2ef;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--page:#0b0b0b;color-scheme:dark}}
:root[data-theme="dark"]{--page:#0b0b0b;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--page)}
${k.ISO_CSS}
.fp-shell{background:var(--anatomy-page);color:var(--anatomy-text);font:14px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;padding-block:40px 72px}
.fp-shell .iso-page{width:min(1000px,100% - 32px);margin:0 auto}
.fp-shell .iso-figure{margin:0}
${CSS}
</style>
<div class="iso fp-shell" data-theme="light"><main class="iso-page">${body}</main></div>
<script>(()=>{const host=document.currentScript.previousElementSibling;const media=matchMedia("(prefers-color-scheme: dark)");const pick=()=>{const forced=document.documentElement.getAttribute("data-theme");const next=forced==="dark"||forced==="light"?forced:media.matches?"dark":"light";if(host.getAttribute("data-theme")!==next)host.setAttribute("data-theme",next);};pick();media.addEventListener("change",pick);new MutationObserver(pick).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});})();</script>
<script type="module">${script}</script>
`;
  writeFileSync(process.argv[target + 1], shell);
  console.log("wrote artifact", process.argv[target + 1], `${(shell.length / 1024).toFixed(0)} KB`);
  process.exit(0);
}
const name = theme === "light" ? "footprints-in-wet-sand-light.html" : "footprints-in-wet-sand.html";
writeFileSync(join(HERE, name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `k ${(P.scale * Math.sqrt(1.6)).toFixed(3)}`);
