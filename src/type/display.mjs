// Every line set in Michelangelus. scripts/strings.mjs writes this list to
// strings.json and scripts/outline.py turns each into outlines, so the page
// carries the letterforms without ever shipping the font itself.
import { COLOPHON, COVER, ENTRIES, GROUPS, LEDE, PERSON } from "../content.mjs";

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export const DISPLAY = [
  { id: "cover.word", style: "italic", text: PERSON.name },
  { id: "cover.M", style: "regular", text: "M" },
  { id: "cover.line", style: "regular", text: COVER.line.toUpperCase(), tracking: 0.16 },
  ...ROMAN.slice(0, 8).map((n) => ({ id: `roman.${n}`, style: "regular", text: n })),
  ...GROUPS.map((g) => ({ id: `group.${g.id}`, style: "italic", text: g.title })),
  ...Object.entries(ENTRIES).map(([id, e]) => ({ id: `name.${id}`, style: "regular", text: e.name.toUpperCase(), tracking: 0.03 })),
  { id: "contact.mail", style: "italic", text: PERSON.email },
  { id: "seal.ring", style: "regular", text: "MACEO · CARDINALE · KWIK · NEW YORK CITY · ", tracking: 0.12, glyphs: true },
  { id: "seal.mck", style: "regular", text: "MCK", tracking: 0.04 },
];

// Running text, set as words that wrap (see "flow" in outline.py): the
// standfirst, each entry's line and body, the contents' names and the
// colophon. Everything serif on the page is Michelangelus.
export const FLOWS = [
  { id: "flow.lede", style: "regular", text: LEDE[0] },
  { id: "flow.aside", style: "regular", text: LEDE[1] },
  ...Object.entries(ENTRIES).map(([id, e]) => ({ id: `flow.kicker.${id}`, style: "regular", text: e.kicker.toUpperCase(), tracking: 0.14 })),
  ...Object.entries(ENTRIES).flatMap(([id, e]) => e.body.map((text, i) => ({ id: `flow.body.${id}.${i}`, style: "regular", text }))),
  ...COLOPHON.map((text, i) => ({ id: `flow.colophon.${i}`, style: "regular", text })),
  ...Object.entries(ENTRIES).map(([id, e]) => ({ id: `flow.line.${id}`, style: "italic", text: e.line })),
  ...Object.entries(ENTRIES).map(([id, e]) => ({ id: `flow.name.${id}`, style: "italic", text: e.name })),
].map((item) => ({ ...item, flow: true }));
