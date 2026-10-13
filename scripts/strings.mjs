// Writes src/type/strings.json (the lines set in Michelangelus) for
// scripts/outline.py. Run both with `npm run outline`.
import { writeFileSync } from "node:fs";
import { DISPLAY } from "../src/type/display.mjs";

writeFileSync(new URL("../src/type/strings.json", import.meta.url), JSON.stringify(DISPLAY, null, 1));
console.log(`wrote src/type/strings.json: ${DISPLAY.length} lines`);
