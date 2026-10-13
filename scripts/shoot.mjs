// Screenshots of the built site with Playwright's Chromium.
//   node scripts/shoot.mjs [--out dir] [--width 1440] [--height 900] [--theme light|dark] [--reduced] [--full] [--at selector]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const out = resolve(opt("--out", "shots/site"));
const width = Number(opt("--width", 1440));
const height = Number(opt("--height", 900));
const theme = opt("--theme", "light");
const at = opt("--at", null);
const name = opt("--name", `${width}-${theme}${args.includes("--full") ? "-full" : ""}${at ? "-" + at.replace(/[^a-z0-9]/gi, "") : ""}`);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: Number(opt("--scale", 1)), colorScheme: theme, reducedMotion: args.includes("--reduced") ? "reduce" : "no-preference" });
const problems = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") problems.push(`${m.type()}: ${m.text()}`); });
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
if (!args.includes("--system")) await page.addInitScript((t) => { try { localStorage.setItem("theme", t); } catch {} }, theme);
await page.goto("file://" + resolve("dist/index.html"));
await page.waitForTimeout(Number(opt("--wait", 1500)));
if (at) {
  await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: "start", behavior: "instant" }), at);
  await page.waitForTimeout(Number(opt("--settle", 1800)));
}
const file = join(out, `${name}.png`);
await page.screenshot({ path: file, fullPage: args.includes("--full") });
const sideways = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
console.log(`saved ${file} · scrolls sideways: ${sideways ? "YES" : "no"} · console: ${problems.length ? "\n  " + problems.join("\n  ") : "clean"}`);
await browser.close();
