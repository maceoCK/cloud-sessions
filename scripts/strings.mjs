// Writes src/type/strings.json (the text set in Michelangelus) for
// scripts/outline.py. Run both with `npm run outline`.
import { writeFileSync } from "node:fs";
import ORDER from "../src/figures/index.mjs";
import { DISPLAY, FLOWS } from "../src/type/display.mjs";

// the contents list names each figure by its title, which lives with the figure
const titles = [];
for (const id of ORDER) {
  const fig = (await import(`../src/figures/${id}.mjs`)).default;
  titles.push({ id: `flow.title.${id}`, style: "italic", text: fig.title, flow: true });
}
const all = [...DISPLAY, ...FLOWS, ...titles];
writeFileSync(new URL("../src/type/strings.json", import.meta.url), JSON.stringify(all, null, 1));
console.log(`wrote src/type/strings.json: ${DISPLAY.length} lines, ${FLOWS.length + titles.length} flows`);
