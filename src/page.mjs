// The page shell. A black cover after the Michelangelus announcement poster
// (wordmark, one monumental capital over two iridescent lozenges, a spaced
// line and a small line set edge to edge), then the folio on paper: the
// figures, the record, contact and colophon.
//
// Display lines are Michelangelus outlines from src/type/outlines.json (see
// scripts/outline.py); running text is Crimson Pro unless the reader has
// Michelangelus installed.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { ISO_CSS } from "../kit/iso-kit.mjs";
import { COLOPHON, CONTACT, ENTRIES, GROUPS, LEDE, META, PERSON, RECORD } from "./content.mjs";
import { ROMAN } from "./type/display.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUTLINES = JSON.parse(readFileSync(join(HERE, "type/outlines.json"), "utf8"));
const CAP = OUTLINES.metrics.cap;

const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// running text: escaped, with ED1TH kept in lining figures so its 1 reads as a 1
const txt = (text) => esc(text).replace(/ED1TH/g, '<span class="ln">ED1TH</span>');
const font = (file) => `url(data:font/woff2;base64,${readFileSync(join(HERE, "fonts", file)).toString("base64")}) format("woff2")`;
const external = (href) => /^https?:/.test(href);
const link = ([text, href], className = "") =>
  `<a${className ? ` class="${className}"` : ""} href="${esc(href)}"${external(href) ? ' rel="noopener"' : ""}>${esc(text)}</a>`;
const num = (n) => Math.round(n * 10) / 10;

// One outlined line as an inline svg whose box is the cap height (so CSS
// height sets the cap height) and the ink width; descenders and overshoot
// draw outside it.
function line(id, className = "") {
  const entry = OUTLINES.lines[id];
  if (!entry) throw new Error(`no outline for "${id}": run npm run outline`);
  const [x0, , x1] = entry.box;
  const w = num(x1 - x0);
  return `<svg class="ol${className ? ` ${className}` : ""}" viewBox="${num(x0)} ${-CAP} ${w} ${CAP}" style="aspect-ratio:${w}/${CAP}" aria-hidden="true" focusable="false"><path d="${entry.d}"/></svg>`;
}

// The seal: an inscription around a circle, MCK in the middle.
function seal(className) {
  const ring = OUTLINES.lines["seal.ring"];
  const r = 1560;
  const span = ring.width;
  // fit the inscription to the circle: one turn, letters upright to the rim
  const fit = (2 * Math.PI * r) / span;
  const glyphs = ring.glyphs
    .map((g) => {
      const mid = g.x + g.w / 2;
      const angle = (mid / span) * 360;
      return `<g transform="rotate(${num(angle)}) translate(0 ${-r}) scale(${num(fit * 100) / 100}) translate(${num(-mid)} 0)"><path d="${g.d}"/></g>`;
    })
    .join("");
  const mck = OUTLINES.lines["seal.mck"];
  const [mx0, , mx1] = mck.box;
  const scale = 1.02;
  const center = `<g transform="scale(${scale}) translate(${num(-(mx0 + mx1) / 2)} ${CAP / 2})"><path d="${mck.d}"/></g>`;
  return `<svg class="${className}" viewBox="-1960 -1960 3920 3920" aria-hidden="true" focusable="false"><circle r="1900" fill="none" stroke="currentColor" stroke-width="22"/><circle r="1240" fill="none" stroke="currentColor" stroke-width="14"/><g fill="currentColor">${glyphs}${center}</g></svg>`;
}

// Film grain for the cover: a small seeded noise tile, as a PNG data URL.
function grainPng(size = 160, seed = 7) {
  let s = seed >>> 0;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const raw = Buffer.alloc((size + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const v = (rand() + rand() + rand()) / 3;
      raw[y * (size + 1) + 1 + x] = Math.round(v * 255);
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 0;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
  return `data:image/png;base64,${png.toString("base64")}`;
}

// The iridescent band, one cycle, sampled from the announcement poster.
const BAND = [
  [0, "#070807"], [0.07, "#0b2a26"], [0.15, "#175461"], [0.24, "#8f83a3"], [0.33, "#df9fc9"], [0.42, "#e3c2cd"],
  [0.5, "#e8e0d4"], [0.58, "#dfc6a5"], [0.68, "#d39d68"], [0.77, "#bd7e47"], [0.88, "#4a2a16"], [1, "#070807"],
];
const bandStops = BAND.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("");

function lozenges() {
  const L = "300,-40 650,560 300,1160 -50,560";
  const R = "700,90 1050,690 700,1290 350,690";
  return `<svg class="lozenges" viewBox="0 0 1000 1250" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
<defs>
<linearGradient id="band-l" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="640" spreadMethod="repeat">${bandStops}</linearGradient>
<linearGradient id="band-r" gradientUnits="userSpaceOnUse" x1="0" y1="320" x2="0" y2="960" spreadMethod="repeat">${bandStops}</linearGradient>
<filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.4"/></filter>
</defs>
<polygon points="${L}" fill="url(#band-l)"/>
<polygon points="${R}" fill="url(#band-r)"/>
<polygon points="${L}" fill="none" stroke="#e8dcc6" stroke-opacity=".55" stroke-width="2"/>
<polygon points="${R}" fill="none" stroke="#e8dcc6" stroke-opacity=".55" stroke-width="2"/>
</svg>`;
}

const FONTS = `
@font-face{font-family:"Text";src:local("Michelangelus"),local("Michelangelus-Regular"),${font("CrimsonPro-Regular.woff2")};font-weight:400;font-display:swap}
@font-face{font-family:"Text";src:local("Michelangelus Italic"),local("Michelangelus-Italic"),${font("CrimsonPro-Italic.woff2")};font-weight:400;font-style:italic;font-display:swap}
@font-face{font-family:"Text";src:local("Michelangelus Bold"),local("Michelangelus-Bold"),${font("CrimsonPro-Bold.woff2")};font-weight:700;font-display:swap}
@font-face{font-family:"Geist Mono";src:${font("GeistMono-Regular.woff2")};font-weight:400;font-display:swap}
`;

// Theme tokens: light on bare :root, dark when the system prefers it and no
// explicit choice says otherwise, and dark again for an explicit choice.
const isoBlock = (selector) => ISO_CSS.slice(ISO_CSS.indexOf(selector + "{") + selector.length + 1, ISO_CSS.indexOf("}", ISO_CSS.indexOf(selector + "{"))).replace(/\s+/g, "");
const DARK = isoBlock(".iso") + "--anatomy-muted:#8f8f8f;--anatomy-text:#b4b4b4;--ink:#ecebe6;--rule:#2b2b2b;color-scheme:dark;";
const LIGHT = isoBlock('.iso[data-theme="light"]') + "--anatomy-page:#edede9;--anatomy-card:#f8f8f5;--anatomy-paper:#f8f8f5;--anatomy-muted:#646469;--anatomy-text:#4a4a4e;--ink:#141414;--rule:#cfcfc8;";
const THEME = `:root{${isoBlock(".iso")}${LIGHT}--anatomy-mono:var(--mono)}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${DARK}}}:root[data-theme="dark"]{${DARK}}`;

// A figure's dark rules, written [data-theme="dark"] #fig-x{…}, also apply
// when the system is dark and no explicit choice is set.
const darkify = (css) =>
  css.replace(/\[data-theme="dark"\]\s*([^{]+)\{([^}]*)\}/g, (_, sel, body) => `:root[data-theme="dark"] ${sel.trim()}{${body}}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) ${sel.trim()}{${body}}}`);

const CSS = `
:root{
  --serif:"Text","Iowan Old Style",Garamond,Georgia,serif;
  --mono:"Geist Mono",ui-monospace,"SF Mono",Menlo,monospace;
  --gutter:clamp(16px,4vw,56px);
  --wrap:min(1360px,100% - 2*var(--gutter));
  --pink:#ff80eb;--cover:#070807;--cover-ink:#f4f0e8;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{margin:0;background:var(--anatomy-page);color:var(--anatomy-text);font:400 19px/1.5 var(--serif);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overflow-x:hidden;font-variant-numeric:oldstyle-nums proportional-nums}
::selection{background:var(--pink);color:#141414}
a{color:inherit;text-decoration-line:underline;text-decoration-thickness:1px;text-underline-offset:.2em;text-decoration-color:var(--anatomy-lo);transition:text-decoration-color .2s,color .2s}
a:hover{text-decoration-color:var(--pink)}
:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.wrap{width:var(--wrap);margin-inline:auto}
.skip{position:absolute;left:var(--gutter);top:-80px;z-index:20;background:var(--anatomy-card);color:var(--ink);padding:10px 14px;font:13px var(--mono);box-shadow:0 0 0 1px var(--anatomy-mid)}
.skip:focus{top:12px}
.ol{display:block;height:1em;width:auto;overflow:visible;fill:currentColor}
.sc{font-variant:small-caps;font-variant-caps:all-small-caps;font-size:1.12em;letter-spacing:.11em;font-variant-numeric:lining-nums}

/* cover */
.cover{position:relative;isolation:isolate;overflow:hidden;background:var(--cover);color:var(--cover-ink);min-height:640px;height:min(100svh,1100px);display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto 1fr auto;color-scheme:dark}
.cover a{color:var(--cover-ink)}
.lozenges{position:absolute;z-index:-2;left:50%;top:0;height:100%;width:auto;aspect-ratio:1000/1250;transform:translateX(-50%)}
.grain{position:absolute;inset:0;z-index:3;pointer-events:none;background-size:160px;mix-blend-mode:overlay;opacity:.42}
.cover-bar{display:flex;align-items:center;gap:22px;padding:18px 0;font:12px/1 var(--mono);letter-spacing:.02em;color:#bdb8ad;position:relative;z-index:4}
.cover-bar .seal-mini{width:40px;height:40px;color:var(--cover-ink);display:block}
.cover-bar .where{flex:1;margin:0}
.cover-bar nav{display:flex;gap:20px}
.cover-bar nav a{text-decoration:none;color:#d9d4c9}
.cover-bar nav a:hover{color:#fff}
.theme{display:inline-flex;border:1px solid #5a5850}
.theme button{all:unset;cursor:pointer;padding:6px 9px;font:11px/1 var(--mono);color:#a29e94}
.theme button[aria-pressed="true"]{background:var(--cover-ink);color:var(--cover)}
.theme button:focus-visible{outline:1px solid #a29e94;outline-offset:2px}
.cover-word{margin:clamp(6px,2vh,24px) auto 0;width:min(84%,940px);position:relative;z-index:2}
.cover-word .ol{width:100%;height:auto}
.cover-m{position:relative;z-index:1;display:grid;place-items:center;min-height:0}
.cover-m .ol{height:min(50svh,560px,56vw);width:auto;fill:#fbf8f1;filter:drop-shadow(0 0 1px rgba(0,0,0,.4))}
.cover-foot{position:relative;z-index:2;padding:0 0 clamp(18px,3.2vh,34px)}
.cover-big,.cover-small{display:flex;justify-content:space-between;align-items:flex-end;margin:0}
.cover-big .ol{height:clamp(15px,4.4vw,62px)}
.cover-small{margin-top:clamp(16px,2.6vh,30px);flex-wrap:wrap;row-gap:8px;column-gap:10px}
.cover-small .ol{height:clamp(6.5px,.72vw,10px)}
@media (max-width:640px){
  .cover{height:auto;min-height:100svh}
  .cover-bar{gap:12px;font-size:11px}
  .cover-bar .seal-mini{width:34px;height:34px}
  .cover-bar .where{display:none}
  .cover-bar nav{gap:12px;flex:1;justify-content:flex-end}
  .theme button{padding:6px 7px}
  .cover-word{width:92%}
  .cover-m .ol{height:min(46svh,72vw)}
  .cover-small{justify-content:flex-start;column-gap:9px}
}

/* standfirst */
.standfirst{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:clamp(20px,3vw,48px);padding-top:clamp(56px,8vw,120px)}
.standfirst .lead{grid-column:1/9;margin:0;font:400 clamp(26px,2.9vw,42px)/1.18 var(--serif);color:var(--ink);letter-spacing:-.003em}
.standfirst .lead + p{grid-column:9/13;align-self:end;margin:0;font-size:16px;line-height:1.5;color:var(--anatomy-muted)}
@media (max-width:899px){.standfirst{display:block}.standfirst .lead + p{margin-top:20px}}

/* contents */
.contents{margin:clamp(56px,8vw,110px) 0 0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--anatomy-hi)}
.contents li{border-bottom:1px solid var(--rule)}
.contents li:not(:nth-child(4n)){border-right:1px solid var(--rule)}
.contents a{display:flex;flex-direction:column;gap:10px;padding:18px 18px 20px 0;text-decoration:none;color:var(--anatomy-text);min-height:118px}
.contents li:not(:nth-child(4n+1)) a{padding-left:18px}
.contents .n{color:var(--ink);transition:color .2s}
.contents .n .ol{height:26px}
.contents .t{font-style:italic;font-size:20px;line-height:1.15;color:var(--ink)}
.contents .s{font-size:14px;color:var(--anatomy-muted)}
.contents a:hover .n{color:#c13fae}
@media (max-width:899px){
  .contents{grid-template-columns:1fr 1fr}
  .contents li:not(:nth-child(4n)){border-right:0}
  .contents li:nth-child(odd){border-right:1px solid var(--rule)}
  .contents li:not(:nth-child(4n+1)) a{padding-left:0}
  .contents li:nth-child(even) a{padding-left:14px}
}

/* groups and entries */
.group{margin-top:clamp(80px,10vw,150px)}
.group-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;border-top:1px solid var(--anatomy-hi);padding-top:18px;color:var(--ink)}
.group-head h2{margin:0;padding-bottom:.18em}
.group-head h2 .ol{height:clamp(30px,3.3vw,46px)}
.group-head span{font-size:16px;color:var(--anatomy-muted);padding-bottom:6px}
.entry{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,8fr);column-gap:clamp(28px,4vw,64px);margin-top:clamp(44px,5vw,76px);scroll-margin-top:24px}
.entry.flip{grid-template-columns:minmax(0,8fr) minmax(0,4fr)}
.entry.flip .entry-text{order:2}
.entry-text{align-self:start;position:sticky;top:32px;padding-top:4px;color:var(--ink)}
.entry .numeral{display:block;margin:0 0 22px;color:var(--ink)}
.entry .numeral .ol{height:clamp(72px,7.4vw,112px);fill:none;stroke:currentColor;stroke-width:1.1px;vector-effect:non-scaling-stroke}
.entry .numeral .ol path{vector-effect:non-scaling-stroke}
.entry .kicker{margin:0 0 12px;font-size:17px;color:var(--anatomy-muted)}
.entry h3{margin:0}
.entry h3 .ol{height:clamp(26px,2.6vw,38px);max-width:100%}
.entry .line{margin:18px 0 0;font:italic 400 clamp(25px,2.3vw,33px)/1.12 var(--serif);color:var(--ink);max-width:20ch}
.entry .body{margin:16px 0 0;max-width:38ch;color:var(--anatomy-text)}
.entry .body p{margin:0 0 .6em}
.entry .links{display:flex;flex-wrap:wrap;gap:6px 18px;margin:14px 0 0;padding:0;list-style:none;font:13px/1.5 var(--mono)}
.entry .iso-figure{margin:0}
.entry.wide{grid-template-columns:minmax(0,3fr) minmax(0,9fr)}
.entry.wide .entry-text .line{max-width:16ch}
@media (max-width:899px){
  .entry,.entry.flip,.entry.wide{display:block}
  .entry-text,.entry.wide .entry-text{position:static;display:block;margin-bottom:26px}
  .entry .numeral .ol{height:64px}
  .entry.wide .entry-text .line{margin-top:18px}
}
.iso-plate{border-radius:0}
@media (max-width:560px){.iso-plate{overflow:hidden}.iso-plate .iso-svg{width:118%;max-width:none;margin-left:-9%}}
.ln{font-variant-numeric:lining-nums}
.iso-legend{font-family:var(--serif);font-size:15px}
.iso-caption{color:var(--anatomy-text)}
.iso-stage{touch-action:pan-y;outline:none}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:-10px}

/* record */
.record{margin-top:clamp(100px,12vw,180px)}
.record dl{margin:18px 0 0;display:grid;grid-template-columns:minmax(120px,2fr) minmax(0,4fr) minmax(0,4fr) minmax(0,2fr)}
.record .row{display:contents}
.record dt,.record dd{margin:0;padding:16px 16px 18px 0;border-bottom:1px solid var(--rule)}
.record dt{font-size:16px;color:var(--anatomy-muted);padding-top:19px}
.record .what{font-size:22px;line-height:1.3;color:var(--ink)}
.record .note{color:var(--anatomy-text)}
.record .rl{font:12px/1.9 var(--mono);display:flex;flex-direction:column;align-items:flex-start;padding-top:19px}
@media (max-width:899px){
  .record dl{grid-template-columns:1fr}
  .record dt{border-bottom:0;padding-bottom:0}
  .record dd{border-bottom:0;padding:4px 0 0}
  .record .rl{flex-direction:row;flex-wrap:wrap;gap:4px 16px;padding:6px 0 18px;border-bottom:1px solid var(--rule)}
}

/* contact */
.contact{margin-top:clamp(100px,12vw,180px)}
.contact .say{margin:clamp(24px,3vw,44px) 0 0;font:italic 400 clamp(26px,3vw,42px)/1.1 var(--serif);color:var(--ink)}
.contact .mail{display:block;margin-top:18px;color:var(--ink);text-decoration:none;width:min(100%,1180px)}
.contact .mail .ol{width:100%;height:auto;transition:fill .3s}
.contact .mail:hover .ol{fill:#c13fae}
.contact ul{display:flex;flex-wrap:wrap;gap:6px 22px;margin:34px 0 0;padding:0;list-style:none;font:13px/1.5 var(--mono)}

/* colophon */
.colophon{margin:clamp(100px,12vw,170px) 0 0;padding:28px 0 56px;border-top:1px solid var(--rule);display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:clamp(20px,3vw,48px);align-items:start;font-size:15px;line-height:1.55;color:var(--anatomy-muted)}
.colophon .seal{width:112px;height:112px;color:var(--ink);display:block}
.colophon p{margin:0 0 .6em;max-width:64ch}
.colophon .end{text-align:right;font:12px/1.7 var(--mono)}
@media (max-width:899px){.colophon{grid-template-columns:1fr}.colophon .end{text-align:left}}

/* ruler: a fixed scale on the right edge, one major tick per figure */
.ruler{position:fixed;right:clamp(10px,1.4vw,22px);top:50%;transform:translateY(-50%);z-index:5;height:min(56vh,520px);width:34px;opacity:0;transition:opacity .4s;pointer-events:none}
.ruler.on{opacity:1;pointer-events:auto}
.ruler::before{content:"";position:absolute;right:0;top:0;bottom:0;border-right:1px solid var(--anatomy-mid)}
.ruler a{position:absolute;right:0;display:flex;align-items:center;gap:6px;transform:translateY(-50%);text-decoration:none;font:12px/1 var(--serif);font-variant:small-caps;letter-spacing:.06em;color:var(--anatomy-muted)}
.ruler a::after{content:"";width:10px;border-top:1px solid var(--anatomy-mid)}
.ruler a:hover,.ruler a[aria-current="true"]{color:var(--ink)}
.ruler a[aria-current="true"]::after{border-color:var(--ink)}
.ruler i{position:absolute;right:0;width:5px;border-top:1px solid var(--anatomy-lo)}
.ruler .ptr{position:absolute;right:-1px;width:0;height:0;border-style:solid;border-width:4px 0 4px 6px;border-color:transparent transparent transparent #e05ccd;transform:translate(-14px,-50%)}
@media (max-width:1279px),(max-height:520px){.ruler{display:none}}
`;

// Restore an explicit theme choice before first paint; otherwise follow the system.
const THEME_INIT = `(()=>{let t;try{t=localStorage.getItem("theme")}catch(e){}if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)})()`;

const CONTENTS_SUBJECT = { ed1th: "Datost", datost: "Datost", traba: "Traba", simon: "SimonComputing", pravost: "pravost", h668: "h668-z37", conway: "conway", school: "Virginia Tech" };

function entryHtml(rendered, index, flip, wide) {
  const fig = rendered.fig;
  const e = ENTRIES[fig.id];
  const links = e.links.length ? `<ul class="links">${e.links.map((l) => `<li>${link(l)}</li>`).join("")}</ul>` : "";
  const body = e.body.length ? `<div class="body">${e.body.map((p) => `<p>${txt(p)}</p>`).join("")}</div>` : "";
  const who = `<span class="numeral" aria-hidden="true">${line(`roman.${ROMAN[index]}`)}</span><p class="kicker sc">${esc(e.kicker)}</p><h3 id="h-${fig.id}"><span class="vh">${esc(e.name)}</span>${line(`name.${fig.id}`)}</h3>`;
  const what = `<p class="line">${txt(e.line)}</p>${body}${links}`;
  const text = `<div class="entry-text">${who}${what}</div>`;
  return `<article class="entry${flip ? " flip" : ""}${wide ? " wide" : ""}" id="${fig.id}" aria-labelledby="h-${fig.id}">${text}${rendered.html}</article>`;
}

export function sitePage({ figures, script, fragment = false }) {
  const byId = Object.fromEntries(figures.map((r) => [r.fig.id, r]));
  const order = GROUPS.flatMap((g) => g.figures).filter((id) => byId[id]);
  const numberOf = (id) => order.indexOf(id);

  const contents = `<ol class="contents" aria-label="Figures">${order
    .map((id) => {
      const fig = byId[id].fig;
      return `<li><a href="#${id}"><span class="n"><span class="vh">Figure ${numberOf(id) + 1}</span>${line(`roman.${ROMAN[numberOf(id)]}`)}</span><span class="t">${txt(fig.title)}</span><span class="s sc">${esc(CONTENTS_SUBJECT[id] ?? "")}</span></a></li>`;
    })
    .join("")}</ol>`;

  let flip = false;
  const groups = GROUPS.map((group) => {
    const ids = group.figures.filter((id) => byId[id]);
    if (!ids.length) return "";
    const nums = ids.map((id) => ROMAN[numberOf(id)]);
    const range = nums.length === 1 ? `Fig. ${nums[0]}` : `Figs. ${nums.slice(0, -1).join(", ")} and ${nums[nums.length - 1]}`;
    const entries = ids
      .map((id) => {
        const wide = id === "ed1th";
        const html = entryHtml(byId[id], numberOf(id), !wide && flip, wide);
        if (!wide) flip = !flip;
        return html;
      })
      .join("");
    return `<section class="group" id="${group.id}" aria-labelledby="g-${group.id}"><header class="group-head"><h2 id="g-${group.id}"><span class="vh">${esc(group.title)}</span>${line(`group.${group.id}`)}</h2><span class="sc">${range}</span></header>${entries}</section>`;
  }).join("");

  const record = `<section class="record" id="record" aria-labelledby="g-record"><header class="group-head"><h2 id="g-record"><span class="vh">Record</span>${line("group.record")}</h2><span>The same, in plain text</span></header><dl>${RECORD.map(
    (r) =>
      `<div class="row"><dt class="sc">${esc(r.when)}</dt><dd class="what">${txt(r.what)}</dd><dd class="note">${txt(r.note)}</dd><dd class="rl">${r.links.map((l) => link(l)).join("")}</dd></div>`,
  ).join("")}</dl></section>`;

  const contact = `<section class="contact" id="contact" aria-labelledby="g-contact"><header class="group-head"><h2 id="g-contact"><span class="vh">Contact</span>${line("group.contact")}</h2><span class="sc">${esc(PERSON.city)}</span></header><p class="say">${esc(CONTACT.line)}</p><a class="mail" href="mailto:${PERSON.email}"><span class="vh">${esc(PERSON.email)}</span>${line("contact.mail")}</a><ul>${CONTACT.links.map((l) => `<li>${link(l)}</li>`).join("")}</ul></section>`;

  const colophon = `<footer class="colophon">${seal("seal")}<div>${COLOPHON.map((p) => `<p>${esc(p)}</p>`).join("")}</div><div class="end"><p>${esc(PERSON.name)}<br>${esc(PERSON.city)}</p></div></footer>`;

  const ruler = `<nav class="ruler" aria-label="Figure scale">${order
    .map((id, i) => {
      const at = order.length > 1 ? (i / (order.length - 1)) * 100 : 50;
      return `<a href="#${id}" style="top:${at.toFixed(3)}%" data-ruler="${id}">${ROMAN[i].toLowerCase()}</a>`;
    })
    .join("")}${order
    .slice(0, -1)
    .flatMap((_, i) => [1, 2, 3, 4].map((j) => `<i style="top:${(((i + j / 5) / (order.length - 1)) * 100).toFixed(3)}%"></i>`))
    .join("")}<span class="ptr"></span></nav>`;

  const ld = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PERSON.name,
    url: PERSON.url,
    email: `mailto:${PERSON.email}`,
    jobTitle: "Engineer and founder",
    worksFor: { "@type": "Organization", name: "Datost", url: "https://datost.com" },
    alumniOf: [{ "@type": "CollegeOrUniversity", name: "Virginia Tech" }, { "@type": "CollegeOrUniversity", name: "Penn State" }],
    sameAs: [PERSON.github],
  };

  const pageScript = `
(() => {
  const root = document.documentElement;
  const buttons = [...document.querySelectorAll(".theme button")];
  const system = matchMedia("(prefers-color-scheme: dark)");
  const effective = () => root.getAttribute("data-theme") || (system.matches ? "dark" : "light");
  const show = () => buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.set === effective())));
  buttons.forEach((b) => b.addEventListener("click", () => {
    root.setAttribute("data-theme", b.dataset.set);
    try { localStorage.setItem("theme", b.dataset.set); } catch (error) {}
    show();
  }));
  system.addEventListener?.("change", show);
  show();

  // the lozenges drift like foil, and lean with the pointer
  const cover = document.querySelector(".cover");
  const bands = [document.getElementById("band-l"), document.getElementById("band-r")];
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  let lean = 0, want = 0, shown = true, frame = 0, last = 0, phase = 0;
  const paint = () => {
    bands[0].setAttribute("gradientTransform", "translate(0 " + (phase + lean).toFixed(2) + ")");
    bands[1].setAttribute("gradientTransform", "translate(0 " + (-phase * 0.8 - lean).toFixed(2) + ")");
  };
  const tick = (now) => {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    phase = (phase + dt * 14) % 640;
    lean += (want - lean) * (1 - Math.exp(-dt / 0.6));
    paint();
    frame = shown && !still.matches && !document.hidden ? requestAnimationFrame(tick) : 0;
  };
  const run = () => { if (!frame && shown && !still.matches) { last = 0; frame = requestAnimationFrame(tick); } };
  new IntersectionObserver((e) => { shown = e[e.length - 1].isIntersecting; run(); }).observe(cover);
  cover.addEventListener("pointermove", (event) => {
    const box = cover.getBoundingClientRect();
    want = ((event.clientY - box.top) / box.height - 0.5) * 160 + ((event.clientX - box.left) / box.width - 0.5) * 60;
    run();
  });
  document.addEventListener("visibilitychange", run);
  still.addEventListener?.("change", run);
  paint();
  run();

  const ruler = document.querySelector(".ruler");
  const ptr = ruler.querySelector(".ptr");
  const marks = [...ruler.querySelectorAll("a")];
  const entries = marks.map((a) => document.getElementById(a.dataset.ruler));
  let ticking = false;
  const place = () => {
    ticking = false;
    const mid = innerHeight * 0.45;
    const tops = entries.map((e) => e.getBoundingClientRect().top + scrollY);
    const y = scrollY + mid;
    let at = 0;
    if (y <= tops[0]) at = 0;
    else if (y >= tops[tops.length - 1]) at = tops.length - 1;
    else {
      const i = tops.findIndex((t, k) => y >= t && y < tops[k + 1]);
      at = i + (y - tops[i]) / (tops[i + 1] - tops[i]);
    }
    ptr.style.top = (at / Math.max(1, tops.length - 1)) * 100 + "%";
    const near = Math.round(at);
    marks.forEach((a, k) => a.setAttribute("aria-current", String(k === near)));
    const first = entries[0].getBoundingClientRect().top;
    const last = document.getElementById("record").getBoundingClientRect().top;
    ruler.classList.toggle("on", first < innerHeight * 0.9 && last > innerHeight * 0.5);
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(place); } }, { passive: true });
  addEventListener("resize", place);
  place();
})();
`;

  const STYLE = `${FONTS}${ISO_CSS}${THEME}${CSS}${figures.map((f) => darkify(f.css)).join("")}`;
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(META.title)}</title><meta name="description" content="${esc(META.description)}"><link rel="canonical" href="${PERSON.url}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(PERSON.name)}"><meta property="og:description" content="${esc(META.description)}"><meta property="og:url" content="${PERSON.url}"><meta property="og:image" content="${PERSON.url}og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#070807"><link rel="icon" href="data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#070807"/><g transform="translate(16 25.5) scale(.026) translate(${-(OUTLINES.lines["cover.M"].box[0] + OUTLINES.lines["cover.M"].box[2]) / 2} 0)"><path fill="#f4f0e8" d="${OUTLINES.lines["cover.M"].d}"/></g></svg>`,
  )}"><script>${THEME_INIT}</script><script type="application/ld+json">${JSON.stringify(ld)}</script><style>${STYLE}</style>`;

  const small = OUTLINES.lines;
  const smallWords = Object.keys(small).filter((k) => k.startsWith("cover.small.")).sort((a, b) => Number(a.split(".")[2]) - Number(b.split(".")[2]));
  const bigWords = Object.keys(small).filter((k) => k.startsWith("cover.big.")).sort((a, b) => Number(a.split(".")[2]) - Number(b.split(".")[2]));

  const cover = `<header class="cover" id="top">
${lozenges()}
<div class="grain" style="background-image:url(${grainPng()})"></div>
<div class="cover-bar wrap"><a href="#top" aria-label="Maceo Cardinale Kwik, top of page">${seal("seal-mini")}</a><p class="where">New York City</p><nav aria-label="Sections"><a href="#figures">Figures</a><a href="#record">Record</a><a href="#contact">Contact</a></nav><div class="theme" role="group" aria-label="Theme"><button type="button" data-set="light" aria-pressed="false">Paper</button><button type="button" data-set="dark" aria-pressed="false">Carbon</button></div></div>
<h1 class="cover-word"><span class="vh">${esc(PERSON.name)}</span>${line("cover.word")}</h1>
<div class="cover-m" aria-hidden="true">${line("cover.M")}</div>
<div class="cover-foot wrap"><p class="cover-big"><span class="vh">Engineer and founder.</span>${bigWords.map((k) => line(k)).join("")}</p><p class="cover-small"><span class="vh">Founder of Datost, backed by Y Combinator and OpenAI, in New York City.</span>${smallWords.map((k) => line(k)).join("")}</p></div>
</header>`;

  const standfirst = `<section class="standfirst wrap" aria-label="Introduction"><p class="lead">${txt(LEDE[0])}</p><p>${txt(LEDE[1])}</p></section>`;

  const body = `<a class="skip" href="#figures">Skip to the figures</a>${cover}<main>${standfirst}<div class="wrap" id="figures">${contents}${groups}${record}${contact}${colophon}</div></main>${ruler}<script type="module">${script}\n${pageScript}</script>`;
  // a fragment for hosts that supply their own document around the page
  if (fragment) return `<title>${esc(META.title)}</title><style>${STYLE}</style><script>${THEME_INIT}</script>${body}`;
  return `<!doctype html><html lang="en"><head>${head}</head><body>${body}</body></html>`;
}
