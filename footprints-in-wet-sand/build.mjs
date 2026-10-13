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
const H = 560;
const AZIMUTH = 70;
const ELEVATION = 42;
const PX_PER_CM = 2.9;
const CENTRE = [M.STRIP.length / 2, 22];

const L = M.STRIP.length;
const SHORE = M.SWASH.from;

const P = (() => {
  const unit = { origin: [0, 0], scale: PX_PER_CM / Math.sqrt(1.6), azimuth: AZIMUTH, elevation: ELEVATION };
  const [cx, cy] = k.iso([CENTRE[0], CENTRE[1], M.surfaceAt(CENTRE[1])], unit);
  return { ...unit, origin: [W / 2 - cx, H / 2 - cy] };
})();
const at = (point) => k.iso(point, P);
const onSand = (x, y) => at([x, y, M.surfaceAt(y)]);
const sandPath = (points, closed = false) => k.pathOf(points.map(([x, y]) => onSand(x, y)), closed);
const Ln = (d, style) => k.lineSvg(d, style);

function planeAt(sx, sy) {
  const { sinA, cosA, sinE, cosE, k: scale } = k.cameraOf(P);
  const a = (sx - P.origin[0]) / scale;
  const b = (sy - P.origin[1]) / scale + M.STRIP.sea * cosE;
  const m11 = sinA;
  const m12 = -cosA;
  const m21 = cosA * sinE;
  const m22 = sinA * sinE - M.STRIP.rise * cosE;
  const det = m11 * m22 - m12 * m21;
  return [(a * m22 - m12 * b) / det, (m11 * b - m21 * a) / det];
}

const corners = [planeAt(0, 0), planeAt(W, 0), planeAt(W, H), planeAt(0, H)];
const VIEW = {
  x0: Math.min(...corners.map(([x]) => x)),
  x1: Math.max(...corners.map(([x]) => x)),
  y0: Math.min(...corners.map(([, y]) => y)),
  y1: Math.max(...corners.map(([, y]) => y)),
};
const span = (from, to, count) => Array.from({ length: count + 1 }, (_, i) => from + ((to - from) * i) / count);
const XS = span(VIEW.x0 - 20, VIEW.x1 + 20, 80);

function ground() {
  const dryFrom = 200;
  const sea = sandPath([...XS.map((x) => [x, SHORE]), [VIEW.x1 + 20, VIEW.y0 - 20], [VIEW.x0 - 20, VIEW.y0 - 20]], true);
  const dry = sandPath([...XS.map((x) => [x, dryFrom]), [VIEW.x1 + 20, VIEW.y1 + 20], [VIEW.x0 - 20, VIEW.y1 + 20]], true);
  return `<rect class="fp-ground" x="0" y="0" width="${W}" height="${H}"/><path class="fp-dry-ground" d="${dry}"/><path class="fp-sea" d="${sea}"/>`;
}

function fallback() {
  return `<g class="fp-fallback" aria-hidden="true">${ground()}<g data-part="prints"></g><g data-part="lines" class="fp-swash-line"></g><path data-part="sheet" class="fp-sheet" d=""/><path data-part="lace" class="fp-lace" d=""/></g>`;
}

const BAR = (() => {
  const [x, y] = planeAt(W * 0.09, H * 0.82);
  return { x: Math.round(x), y: Math.round(y), length: 50 };
})();

function scaleBar() {
  const { x, y, length } = BAR;
  const bar = sandPath([[x, y], [x + length, y]]);
  const minor = [];
  const major = [];
  for (let d = 0; d <= length; d += 10) {
    const long = d === 0 || d === length;
    (long ? major : minor).push(sandPath([[x + d, y], [x + d, y - (long ? 3.4 : 2)]]));
  }
  return `<g class="fp-scale">${Ln(bar, { tone: "mid" })}${Ln(minor.join(""), { tone: "mid" })}${Ln(major.join(""), { tone: "hi" })}</g>`;
}

const back = [fallback()];
const front = [scaleBar()];

const DATA = {
  W,
  H,
  P,
  camera: glCamera(P),
  view: VIEW,
  strip: M.STRIP,
};

const wave = M.waveOf(0, 0);
const tops = [];
for (let index = 0; index < 200; index++) {
  const each = M.waveOf(0, index);
  for (let x = 0; x <= L; x += 3) tops.push(M.topOf(each, x) - SHORE);
}
const meanTop = tops.reduce((sum, top) => sum + top, 0) / tops.length;
let deepest = 0;
for (let s = 0.3; s < 5; s += 0.02) for (let y = M.GAIT.line - 20; y < M.GAIT.line + 20; y += 2) deepest = Math.max(deepest, M.depthAt(wave, L / 2, y, s));

const LABEL_TEXT = `Looking down on a beach that rises 1 in 12: the sea at the back, a strip of smooth, dark, wet sand where the swash runs, and drier sand toward you. Footprints press into the wet strip one step at a time, each ringed for a moment by pale, drained sand. A bore runs in through the shallows and collapses at the water's edge; its thin sheet of swash slides up the beach with a foam edge, covers the prints, smooths them away and draws back, leaving the sand glossy and smooth again.`;

const caption = `A stretch of beach that rises 1 in 12, seen from above: the sea at the back, the strip of dark sand the swash keeps wet, and drier sand toward you. Someone walks along the strip at ${((M.GAIT.step / 100) / M.GAIT.gap).toFixed(2)} m/s, ${M.metres(M.GAIT.step)} m a step, and each bare heel sinks ${(M.GAIT.depth * 10).toFixed(0)} mm. While the foot is down, the sand around it turns pale: shearing makes the packed grains dilate, and the water drains down into the new pore space (Reynolds' dilatancy). When the foot lifts, the water comes back and pools in the heel and the ball. Then a bore runs in through the shallows and collapses at the water's edge. Its swash leaves at ${(wave.u0 / 100).toFixed(1)} m/s and slows at g·sin β = ${(M.DOWNHILL / 100).toFixed(2)} m/s², so it turns ${M.turnOf(wave, L / 2).toFixed(1)} s later, about ${M.metres(meanTop)} m up the beach (${M.metres(Math.min(...tops))} to ${M.metres(Math.max(...tops))} m along its lobes, from wave to wave), and drains back the same way (Shen and Meyer's ballistic swash). Over the prints the sheet is never more than ${(deepest * 10).toFixed(0)} mm deep, yet it smooths each one away within a second or two of covering it. The film it leaves sinks into the sand, and the sheen fades.`;

const backSvg = k.figureSvg({ width: W, height: H, label: LABEL_TEXT, body: back, className: "fp-back" });
const frontSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg fp-layer fp-front" viewBox="0 0 ${W} ${H}" aria-hidden="true">${front.join("")}</svg>`;
const stage = `<div class="fp-stage" tabindex="0" role="group" aria-roledescription="beach" aria-label="Footprints in wet sand. Tap or click the sand to press a footprint there; press the right arrow key to take the next step, and Space or Enter to send a wave up the beach."><span class="fp-said" aria-live="polite"></span>${backSvg}<canvas class="fp-layer fp-gl" aria-hidden="true"></canvas>${frontSvg}</div>`;

const body = `<div class="fp">${k.plateHtml({
  fig: "Fig 1",
  title: "Footprints in wet sand",
  hint: "Click the sand to step · Space sends a wave",
  readout: "smooth",
  keys: [
    { mark: "lit", label: "Wet sand of the swash zone, rising 1 in 12" },
    { mark: "flat", label: "Sea, a few centimetres deep at its edge" },
    { mark: "dotted", label: "Swash line: foam stranded where the wave turned" },
    { mark: "edge", label: `Scale bar, ${M.metres(BAR.length)} m in 10 cm steps` },
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
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, "view", Object.values(VIEW).map((v) => v.toFixed(0)).join(" "), "bar", BAR.x, BAR.y);
