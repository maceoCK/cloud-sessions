// Close-up contact sheet of one figure's standalone page: the whole card at
// 1x plus a 3 x 2 grid of 4x tiles over the drawing, to review detail.
//   node scripts/zoom.mjs <id> [--dark] [--wait ms]
import { chromium } from "playwright";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";

const id = process.argv[2];
const dark = process.argv.includes("--dark");
const wait = Number(process.argv[process.argv.indexOf("--wait") + 1]) || 400;
const out = resolve(`shots/${id}`);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 4, reducedMotion: "reduce" });
await page.goto("file://" + resolve(`dist/fig/${id}${dark ? "-dark" : ""}.html`));
await page.waitForTimeout(wait);
const svg = await page.locator(".iso-svg").boundingBox();
const cols = 3, rows = 2;
const w = svg.width / cols, h = svg.height / rows;
for (let r = 0; r < rows; r++)
  for (let c = 0; c < cols; c++)
    await page.screenshot({ path: `${out}/z-${r}${c}.png`, clip: { x: svg.x + c * w, y: svg.y + r * h, width: w, height: h } });
await browser.close();
console.log(`wrote ${rows * cols} tiles to shots/${id}/z-*.png (${Math.round(w * 4)} x ${Math.round(h * 4)} px each)`);
