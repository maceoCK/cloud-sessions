// Writes src/type/strings.json (the text set in Michelangelus) for
// scripts/outline.py. Run both with `npm run outline`.
import { writeFileSync } from "node:fs";
import { DISPLAY, FLOWS } from "../src/type/display.mjs";

writeFileSync(new URL("../src/type/strings.json", import.meta.url), JSON.stringify([...DISPLAY, ...FLOWS], null, 1));
console.log(`wrote src/type/strings.json: ${DISPLAY.length} lines, ${FLOWS.length} flows`);
