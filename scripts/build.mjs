// Builds the site: dist/index.html (every figure in the page shell) and one
// standalone page per figure in dist/fig/ (light and dark) for close checks.
//
//   node scripts/build.mjs                 everything
//   node scripts/build.mjs --only ed1th    one figure's standalone pages (and skip the site)
import { compactSvg } from "./compact.mjs";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import ORDER from "../src/figures/index.mjs";
import { sitePage } from "../src/page.mjs";
import { ROMAN } from "../src/type/display.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const args = process.argv.slice(2);
const onlyAt = args.indexOf("--only");
const only = onlyAt >= 0 ? args[onlyAt + 1].split(",") : null;

const KIT = readFileSync(join(ROOT, "kit/iso-kit.mjs"), "utf8").replace(/^export /gm, "");
// lathe.mjs and tube.mjs go in as namespaces G and T, so their names never
// collide with the kit's globals or with each other.
function namespace(name, file) {
  const source = readFileSync(join(ROOT, "kit", file), "utf8");
  const names = [...source.matchAll(/^export (?:async )?(?:function\*?|const|let|class) ([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  const body = source.replace(/^import .*$/gm, "").replace(/^export /gm, "");
  return `const ${name} = (() => {\n${body}\nreturn { ${names.join(", ")} };\n})();`;
}
const LATHE = namespace("G", "lathe.mjs");
const TUBE = namespace("T", "tube.mjs");
const RUNTIME = readFileSync(join(ROOT, "src/runtime.js"), "utf8");
const BOOT = `
if (location.search.includes("debug")) Object.assign(window, { G, T, RT, iso, translateAlong, solidSvg });
for (const [id, data, live] of FIGS) {
  const root = document.getElementById("fig-" + id);
  if (!root) continue;
  try { live(root, RT, data); } catch (error) { console.error("figure " + id, error); }
}
`;

const escape = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function sourceOf(fn) {
  const text = fn.toString();
  return /^(async\s+)?live\s*\(/.test(text) ? text.replace(/^(async\s+)?live/, "$1function") : text;
}

export function render(fig, label = fig.fig) {
  const built = fig.build();
  const svg = k.figureSvg({ width: fig.width, height: fig.height, label: fig.label, body: compactSvg(built.svg) });
  const extra = Object.entries(fig.stage?.attrs ?? {})
    .map(([key, value]) => ` ${key}="${escape(value)}"`)
    .join("");
  const stage = `<div class="iso-stage" tabindex="0" role="${fig.stage?.role ?? "group"}" aria-label="${escape(fig.stage?.label ?? fig.title)}"${extra}>${svg}</div>`;
  const plate = k.plateHtml({ fig: label, title: fig.title, hint: fig.hint, readout: built.readout ?? "", body: stage });
  const html = `<div class="fig-mount" id="fig-${fig.id}" data-fig="${fig.id}">${plate}</div>`;
  const boot = fig.live ? `FIGS.push([${JSON.stringify(fig.id)}, ${JSON.stringify(built.data ?? {})}, ${sourceOf(fig.live)}]);` : "";
  return { fig, html, boot, css: fig.css ?? "", bytes: svg.length };
}

export function scriptOf(rendered) {
  const script = `${KIT}\n${LATHE}\n${TUBE}\n${RUNTIME}\nconst FIGS = [];\n${rendered.map((r) => r.boot).join("\n")}\n${BOOT}`;
  return script.replace(/<\/(script)/gi, "<\\/$1");
}

// A full build skips a figure that fails to load or render (and says so), so
// one broken figure never blocks the page; --only fails loudly instead.
const ids = only ?? ORDER;
const rendered = [];
for (const id of ids) {
  try {
    const fig = (await import(`../src/figures/${id}.mjs`)).default;
    rendered.push(render(fig, only ? fig.fig : `Fig. ${ROMAN[ids.indexOf(id)]}`));
  } catch (error) {
    if (only) throw error;
    console.warn(`skipped ${id}: ${error.message.split("\n")[0]}`);
    // --stub stands the example in for a missing figure, to lay out the page.
    if (args.includes("--stub")) {
      const example = (await import("../src/figures/_example.mjs")).default;
      rendered.push(render({ ...example, id, title: `${id} (stand-in)` }, `Fig. ${ROMAN[ids.indexOf(id)]}`));
    }
  }
}

// Standalone pages only for --only (or --pages): a full build never
// overwrites a page someone is checking.
mkdirSync(join(DIST, "fig"), { recursive: true });
for (const r of only || args.includes("--pages") ? rendered : []) {
  for (const theme of ["light", "dark"]) {
    let page = k.pageHtml({ title: `${r.fig.fig} · ${r.fig.title}`, theme, body: r.html, script: "", width: 760 });
    page = page.replace("</head>", `<style>${r.css}</style></head>`).replace("</body>", `<script type="module">${scriptOf([r])}</script></body>`);
    writeFileSync(join(DIST, "fig", `${r.fig.id}${theme === "dark" ? "-dark" : ""}.html`), page);
  }
  console.log(`${r.fig.id.padEnd(10)} svg ${(r.bytes / 1024).toFixed(0).padStart(5)} KB`);
}

if (!only) {
  const html = sitePage({ figures: rendered, script: scriptOf(rendered) });
  writeFileSync(join(DIST, "index.html"), html);
  writeFileSync(join(DIST, "fragment.html"), sitePage({ figures: rendered, script: scriptOf(rendered), fragment: true }));
  // static files (the share image) ship next to the page
  if (existsSync(join(ROOT, "public"))) cpSync(join(ROOT, "public"), DIST, { recursive: true });
  console.log(`index.html ${(html.length / 1024).toFixed(0)} KB`);
}
