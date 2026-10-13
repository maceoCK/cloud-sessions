// Renders the share image (public/og.jpg, 1200 x 630) from the built cover.
// Run after a build: node scripts/og.mjs
import { chromium } from "playwright";
import { resolve } from "node:path";

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
await page.goto("file://" + resolve("dist/index.html"));
await page.addStyleTag({ content: ".cover{height:630px!important;min-height:0!important;grid-template-rows:auto 1fr auto!important}.cover-bar{display:none}.cover-word{margin-top:34px!important}.cover-foot{padding-bottom:30px!important}" });
await page.waitForTimeout(800);
await page.locator(".cover").screenshot({ path: resolve("public/og.jpg"), type: "jpeg", quality: 88 });
await browser.close();
console.log("wrote public/og.jpg");
