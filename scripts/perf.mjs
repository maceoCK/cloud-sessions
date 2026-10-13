// Frame-time probe: idle on the cover, then a slow scripted scroll through
// the page. Reports median and 95th-percentile frame times and long tasks.
import { chromium } from "playwright";
import { resolve } from "node:path";

const width = Number(process.argv[2] || 1440);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
await page.goto("file://" + resolve("dist/index.html"));
await page.waitForTimeout(1500);
const sample = (ms) =>
  page.evaluate(
    (ms) =>
      new Promise((done) => {
        const times = [];
        let last = performance.now();
        const end = last + ms;
        const tick = (now) => {
          times.push(now - last);
          last = now;
          if (now < end) requestAnimationFrame(tick);
          else done(times);
        };
        requestAnimationFrame(tick);
      }),
    ms,
  );
const stats = (label, t) => {
  const s = [...t].sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(1);
  console.log(`${label.padEnd(14)} frames ${String(s.length).padStart(4)} · median ${q(0.5)} ms · p95 ${q(0.95)} ms · max ${s[s.length - 1].toFixed(1)} ms`);
};
stats("cover idle", await sample(3000));
const height = await page.evaluate(() => document.documentElement.scrollHeight);
const scroll = page.evaluate(
  (h) =>
    new Promise((done) => {
      const start = performance.now();
      const dur = 12000;
      const step = (now) => {
        const u = Math.min(1, (now - start) / dur);
        scrollTo(0, u * (h - innerHeight));
        if (u < 1) requestAnimationFrame(step);
        else done();
      };
      requestAnimationFrame(step);
    }),
  height,
);
stats("scrolling", await sample(11500));
await scroll;
for (const id of ["ed1th", "traba", "simon", "conway"]) {
  await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: "center", behavior: "instant" }), id);
  await page.waitForTimeout(1600);
  stats(`at ${id}`, await sample(2500));
}
await browser.close();
