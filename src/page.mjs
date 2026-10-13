// The page shell. A cover after the Michelangelus announcement poster, kept
// to ink on paper (wordmark, one monumental capital drawn in outline, a
// spaced line and a small line set edge to edge), then the folio: the
// contents, the figures, contact and colophon.
//
// Display lines are Michelangelus outlines from src/type/outlines.json (see
// scripts/outline.py), and so are the standfirst, the entries' lines and
// the contents, set as words that wrap. Body text is
// Crimson Pro unless the reader has Michelangelus installed.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ISO_CSS } from "../kit/iso-kit.mjs";
import { COLOPHON, CONTACT, COVER, ENTRIES, GROUPS, LEDE, META, PERSON } from "./content.mjs";
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

// Display text that wraps: each word an inline svg of <use> glyphs from one
// shared atlas (emitted once per page by atlas()), the words themselves
// beside it for screen readers. If the copy changed since the outlines were
// made, the text is set plainly until `npm run outline` runs again.
const USED = new Map(); // atlas key -> element id
function flow(id, text) {
  const f = OUTLINES.flows?.[id];
  if (!f || f.text !== text) {
    console.warn(`outline for "${id}" is ${f ? "stale" : "missing"}: run npm run outline; setting it in Crimson Pro`);
    return txt(text);
  }
  const words = f.words.map(([w, glyphs]) => {
    const uses = glyphs
      .map(([key, x, y]) => {
        if (!USED.has(key)) USED.set(key, `mg${USED.size.toString(36)}`);
        return `<use href="#${USED.get(key)}"${x ? ` x="${x}"` : ""}${y ? ` y="${y}"` : ""}/>`;
      })
      .join("");
    return `<svg class="fw" viewBox="0 ${-CAP} ${w} ${CAP}" style="width:${Math.round((w / OUTLINES.metrics.upm) * 1000) / 1000}em" focusable="false">${uses}</svg>`;
  });
  // the gaps are real spaces, so words wrap; they are set in Geist Mono (a
  // fixed 0.6em, always embedded) and word-spacing brings each to the
  // face's own space
  const gap = Math.round((f.space / OUTLINES.metrics.upm - 0.6) * 1000) / 1000;
  return `<span class="vh">${esc(text)}</span><span class="fl" style="word-spacing:${gap}em" aria-hidden="true">${words.join(" ")}</span>`;
}
const atlas = () =>
  `<svg class="atlas" aria-hidden="true" focusable="false" width="0" height="0"><defs>${[...USED].map(([key, el]) => `<path id="${el}" d="${OUTLINES.atlas[key]}"/>`).join("")}</defs></svg>`;

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

const FONTS = `
@font-face{font-family:"Text";src:local("Michelangelus"),local("Michelangelus-Regular"),${font("CrimsonPro-Regular.woff2")};font-weight:400;font-display:swap}
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
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{margin:0;background:var(--anatomy-page);color:var(--anatomy-text);font:400 19px/1.5 var(--serif);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overflow-x:hidden;font-variant-numeric:oldstyle-nums proportional-nums}
::selection{background:var(--ink);color:var(--anatomy-page)}
a{color:inherit;text-decoration-line:underline;text-decoration-thickness:1px;text-underline-offset:.2em;text-decoration-color:var(--anatomy-lo);transition:text-decoration-color .2s,color .2s}
a:hover{text-decoration-color:var(--ink)}
:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.wrap{width:var(--wrap);margin-inline:auto}
.skip{position:absolute;left:var(--gutter);top:-80px;z-index:20;background:var(--anatomy-card);color:var(--ink);padding:10px 14px;font:13px var(--mono);box-shadow:0 0 0 1px var(--anatomy-mid)}
.skip:focus{top:12px}
.ol{display:block;height:1em;width:auto;overflow:visible;fill:currentColor}
.sc{font-variant:small-caps;font-variant-caps:all-small-caps;font-size:1.12em;letter-spacing:.11em;font-variant-numeric:lining-nums}

/* cover: a monogram, centred, with nothing else to say */
.cover{min-height:600px;height:100svh;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto 1fr;color:var(--ink)}
.cover-bar{display:flex;align-items:center;gap:24px;padding:22px 0;font:12px/1 var(--mono);letter-spacing:.02em;color:var(--anatomy-muted)}
.cover-bar nav{display:flex;gap:24px}
.cover-bar nav a{text-decoration:none;color:var(--anatomy-text)}
.cover-bar nav a:hover{color:var(--ink)}
.theme{display:inline-flex;gap:14px;margin-left:auto}
.theme button{all:unset;cursor:pointer;font:12px/1 var(--mono);color:var(--anatomy-muted);padding:4px 0;border-bottom:1px solid transparent}
.theme button[aria-pressed="true"]{color:var(--ink);border-bottom-color:currentColor}
.theme button:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:4px}
.cover-lockup{display:flex;flex-direction:column;align-items:center;justify-content:center;padding-bottom:clamp(40px,8vh,96px)}
.cover-m .ol{height:min(38svh,420px,58vw);width:auto;fill:none;stroke:currentColor;stroke-width:1px}
.cover-m .ol path{vector-effect:non-scaling-stroke}
.cover-word{margin:clamp(36px,6vh,64px) 0 0}
.cover-line{margin:clamp(14px,2vh,20px) 0 0;color:var(--anatomy-muted)}
.cover-word .ol{height:clamp(22px,2.5vw,36px)}
.cover-line .ol{height:clamp(6.5px,.6vw,8.5px)}
@media (max-width:640px){
  .cover{height:auto;min-height:100svh}
  .cover-bar{gap:16px;font-size:11px}
  .cover-m .ol{height:min(34svh,58vw)}
}

/* standfirst */
.standfirst{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:clamp(20px,3vw,48px);padding-top:clamp(56px,8vw,120px)}
.standfirst .lead{grid-column:1/9;margin:0;font:400 clamp(22px,2.2vw,32px)/1.25 var(--serif);color:var(--ink);letter-spacing:-.003em;text-wrap:pretty}
.standfirst .lead + p{grid-column:9/13;align-self:end;margin:0;font-size:15px;line-height:1.5;color:var(--anatomy-muted)}
@media (max-width:899px){.standfirst{display:block}.standfirst .lead + p{margin-top:20px}}

/* contents */
.contents{margin:clamp(56px,8vw,110px) 0 0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--rule)}
.contents li{border-bottom:1px solid var(--rule)}
.contents a{display:flex;flex-direction:column;gap:10px;padding:18px 18px 20px 0;text-decoration:none;color:var(--anatomy-text);min-height:118px}
.contents li:not(:nth-child(4n+1)) a{padding-left:18px}
.contents .n{color:var(--ink);transition:color .2s}
.contents .n .ol{height:26px}
.contents .t{font-style:italic;font-size:20px;line-height:1.15;color:var(--ink)}
.contents .s{font-size:14px;color:var(--anatomy-muted)}
.contents .t{transition:color .2s}
.contents a:hover .n,.contents a:hover .t{color:var(--anatomy-muted)}
@media (max-width:899px){
  .contents{grid-template-columns:1fr 1fr}
  .contents li:not(:nth-child(4n+1)) a{padding-left:0}
  .contents li:nth-child(even) a{padding-left:14px}
}

/* groups and entries */
.group{margin-top:clamp(80px,10vw,150px)}
.group-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;border-top:1px solid var(--rule);padding-top:16px;color:var(--ink)}
.group-head h2{margin:0;padding-bottom:.18em}
.group-head h2 .ol{height:clamp(18px,1.7vw,24px)}
.entry{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,8fr);column-gap:clamp(28px,4vw,64px);margin-top:clamp(44px,5vw,76px);scroll-margin-top:24px}
.entry.flip{grid-template-columns:minmax(0,8fr) minmax(0,4fr)}
.entry.flip .entry-text{order:2}
.entry-text{align-self:start;position:sticky;top:32px;padding-top:4px;color:var(--ink)}
.entry .numeral{display:block;margin:0 0 20px;color:var(--ink)}
.entry .numeral .ol{height:clamp(40px,3.6vw,56px);fill:none;stroke:currentColor;stroke-width:1.1px;vector-effect:non-scaling-stroke}
.entry .numeral .ol path{vector-effect:non-scaling-stroke}
.entry .kicker{margin:0 0 10px;font-size:15px;color:var(--anatomy-muted)}
.entry h3{margin:0}
.entry h3 .ol{height:clamp(17px,1.5vw,22px);max-width:100%}
.entry .line{margin:14px 0 0;font:italic 400 clamp(20px,1.7vw,24px)/1.2 var(--serif);color:var(--ink);max-width:20ch;text-wrap:balance}
.entry .body{margin:16px 0 0;max-width:38ch;color:var(--anatomy-text)}
.entry .body p{margin:0 0 .6em}
.entry .links{display:flex;flex-wrap:wrap;gap:6px 18px;margin:14px 0 0;padding:0;list-style:none;font:13px/1.5 var(--mono)}
.entry .iso-figure{margin:0}
.entry.wide{grid-template-columns:minmax(0,3fr) minmax(0,9fr)}
.entry.wide .entry-text .line{max-width:16ch}
@media (max-width:899px){
  .entry,.entry.flip,.entry.wide{display:block}
  .entry-text,.entry.wide .entry-text{position:static;display:block;margin-bottom:26px}
  .entry .numeral .ol{height:40px}
  .entry.wide .entry-text .line{margin-top:18px}
}
.iso-plate{border-radius:0;box-shadow:0 0 0 1px var(--rule)}
.iso-plate-corner[data-corner="fig"]{display:none}
.iso-plate-corner[data-corner="title"]{left:0;right:auto}
@media (max-width:560px){.iso-plate{overflow:hidden}.iso-plate .iso-svg{width:118%;max-width:none;margin-left:-9%}}
.ln{font-variant-numeric:lining-nums}
.iso-stage{touch-action:pan-y;outline:none}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:-10px}


/* contact */
/* display text set as Michelangelus words (see flow()) */
.fl{font-family:"Geist Mono",monospace;letter-spacing:0}
.fw{height:.7em;overflow:visible;fill:currentColor;vertical-align:baseline}
.atlas{position:absolute;width:0;height:0;overflow:hidden}
.contact{margin-top:clamp(100px,12vw,180px)}
.contact .mail{display:block;margin-top:clamp(24px,3vw,40px);padding-bottom:12px;color:var(--ink);text-decoration:none;width:min(100%,520px)}
.contact .mail .ol{width:100%;height:auto;transition:fill .3s}
.contact .mail:hover .ol{fill:var(--anatomy-muted)}
.contact ul{display:flex;flex-wrap:wrap;gap:6px 22px;margin:22px 0 0;padding:0;list-style:none;font:13px/1.5 var(--mono)}

/* colophon */
.colophon{margin:clamp(56px,7vw,96px) 0 0;padding:28px 0 56px;border-top:1px solid var(--rule);display:grid;grid-template-columns:auto minmax(0,1fr);gap:clamp(20px,3vw,48px);align-items:center;font-size:15px;line-height:1.55;color:var(--anatomy-muted)}
.colophon .seal{width:112px;height:112px;color:var(--ink);display:block}
.colophon p{margin:0 0 .6em;max-width:64ch}
@media (max-width:899px){.colophon{grid-template-columns:1fr}}

`;

// Restore an explicit theme choice before first paint; otherwise follow the system.
const THEME_INIT = `(()=>{let t;try{t=localStorage.getItem("theme")}catch(e){}if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)})()`;


function entryHtml(rendered, index, flip, wide) {
  const fig = rendered.fig;
  const e = ENTRIES[fig.id];
  const links = e.links.length ? `<ul class="links">${e.links.map((l) => `<li>${link(l)}</li>`).join("")}</ul>` : "";
  const body = e.body.length ? `<div class="body">${e.body.map((p) => `<p>${txt(p)}</p>`).join("")}</div>` : "";
  const who = `<span class="numeral" aria-hidden="true">${line(`roman.${ROMAN[index]}`)}</span><p class="kicker sc">${esc(e.kicker)}</p><h3 id="h-${fig.id}"><span class="vh">${esc(e.name)}</span>${line(`name.${fig.id}`)}</h3>`;
  const what = `<p class="line">${flow(`flow.line.${fig.id}`, e.line)}</p>${body}${links}`;
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
      return `<li><a href="#${id}"><span class="n"><span class="vh">Figure ${numberOf(id) + 1}</span>${line(`roman.${ROMAN[numberOf(id)]}`)}</span><span class="t">${flow(`flow.name.${id}`, ENTRIES[id].name)}</span><span class="s sc">${esc(ENTRIES[id].kicker)}</span></a></li>`;
    })
    .join("")}</ol>`;

  let flip = false;
  const groups = GROUPS.map((group) => {
    const ids = group.figures.filter((id) => byId[id]);
    if (!ids.length) return "";
    const entries = ids
      .map((id) => {
        const wide = id === "ed1th";
        const html = entryHtml(byId[id], numberOf(id), !wide && flip, wide);
        if (!wide) flip = !flip;
        return html;
      })
      .join("");
    return `<section class="group" id="${group.id}" aria-labelledby="g-${group.id}"><header class="group-head"><h2 id="g-${group.id}"><span class="vh">${esc(group.title)}</span>${line(`group.${group.id}`)}</h2></header>${entries}</section>`;
  }).join("");

  const contact = `<section class="contact" id="contact" aria-labelledby="g-contact"><header class="group-head"><h2 id="g-contact" class="vh">Contact</h2></header><a class="mail" href="mailto:${PERSON.email}"><span class="vh">${esc(PERSON.email)}</span>${line("contact.mail")}</a><ul>${CONTACT.links.map((l) => `<li>${link(l)}</li>`).join("")}</ul></section>`;

  const colophon = `<footer class="colophon">${seal("seal")}<div>${COLOPHON.map((p) => `<p>${esc(p)}</p>`).join("")}</div></footer>`;

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
})();
`;

  const STYLE = `${FONTS}${ISO_CSS}${THEME}${CSS}${figures.map((f) => darkify(f.css)).join("")}`;
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(META.title)}</title><meta name="description" content="${esc(META.description)}"><link rel="canonical" href="${PERSON.url}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(PERSON.name)}"><meta property="og:description" content="${esc(META.description)}"><meta property="og:url" content="${PERSON.url}"><meta property="og:image" content="${PERSON.url}og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" media="(prefers-color-scheme: light)" content="#edede9"><meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0b0b0b"><link rel="icon" href="data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><style>path{fill:#141414}@media (prefers-color-scheme:dark){path{fill:#ededea}}</style><g transform="translate(16 27) scale(.04) translate(${-(OUTLINES.lines["cover.M"].box[0] + OUTLINES.lines["cover.M"].box[2]) / 2} 0)"><path d="${OUTLINES.lines["cover.M"].d}"/></g></svg>`,
  )}"><script>${THEME_INIT}</script><script type="application/ld+json">${JSON.stringify(ld)}</script><style>${STYLE}</style>`;


  const cover = `<header class="cover" id="top">
<div class="cover-bar wrap"><nav aria-label="Sections"><a href="#figures">Figures</a><a href="#contact">Contact</a></nav><div class="theme" role="group" aria-label="Theme"><button type="button" data-set="light" aria-pressed="false">Paper</button><button type="button" data-set="dark" aria-pressed="false">Carbon</button></div></div>
<div class="cover-lockup wrap"><div class="cover-m" aria-hidden="true">${line("cover.M")}</div><h1 class="cover-word"><span class="vh">${esc(PERSON.name)}</span>${line("cover.word")}</h1><p class="cover-line"><span class="vh">${esc(COVER.line)}</span>${line("cover.line")}</p></div>
</header>`;

  const standfirst = `<section class="standfirst wrap" aria-label="Introduction"><p class="lead">${flow("flow.lede", LEDE[0])}</p><p>${txt(LEDE[1])}</p></section>`;

  const body = `<a class="skip" href="#figures">Skip to the figures</a>${atlas()}${cover}<main>${standfirst}<div class="wrap" id="figures">${contents}${groups}${contact}${colophon}</div></main><script type="module">${script}\n${pageScript}</script>`;
  // a fragment for hosts that supply their own document around the page
  if (fragment) return `<title>${esc(META.title)}</title><style>${STYLE}</style><script>${THEME_INIT}</script>${body}`;
  return `<!doctype html><html lang="en"><head>${head}</head><body>${body}</body></html>`;
}
