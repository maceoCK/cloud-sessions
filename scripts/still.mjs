// Full-page stills with motion off, to prove a change moved nothing.
//   node scripts/still.mjs save    # keep the current build's stills in shots/still
//   node scripts/still.mjs check   # compare the current build against them
// Chromium encodes the same pixels to the same bytes, so equal files mean an
// identical render.
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const mode = process.argv[2] === "save" ? "save" : "check";
const dir = resolve("shots/still");
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium" });
let changed = 0;
for (const theme of ["light", "dark"]) {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce", colorScheme: theme });
    await page.goto("file://" + resolve("dist/index.html"));
    await page.waitForTimeout(800);
    const shot = await page.screenshot({ fullPage: true });
    const file = `${dir}/${width}-${theme}.png`;
    if (mode === "save" || !existsSync(file)) {
      writeFileSync(file, shot);
      console.log(`saved  ${width}-${theme}`);
    } else {
      const same = Buffer.compare(shot, readFileSync(file)) === 0;
      if (!same) changed++;
      console.log(`${same ? "same   " : "CHANGED"} ${width}-${theme}`);
      if (!same) writeFileSync(`${dir}/${width}-${theme}.new.png`, shot);
    }
    await page.close();
  }
}
await browser.close();
process.exitCode = changed ? 1 : 0;
