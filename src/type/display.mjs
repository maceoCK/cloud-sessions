// Every line set in Michelangelus. scripts/strings.mjs writes this list to
// strings.json and scripts/outline.py turns each into outlines, so the page
// carries the letterforms without ever shipping the font itself.
import { COVER, ENTRIES, GROUPS, PERSON } from "../content.mjs";

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const words = (text) => text.split(/\s+/).filter(Boolean);

export const DISPLAY = [
  { id: "cover.word", style: "italic", text: PERSON.name },
  { id: "cover.M", style: "regular", text: "M" },
  ...COVER.big.map((w, i) => ({ id: `cover.big.${i}`, style: "regular", text: w })),
  ...words(COVER.small).map((w, i) => ({ id: `cover.small.${i}`, style: "regular", text: w })),
  ...ROMAN.slice(0, 8).map((n) => ({ id: `roman.${n}`, style: "regular", text: n })),
  ...GROUPS.map((g) => ({ id: `group.${g.id}`, style: "italic", text: g.title })),
  { id: "group.record", style: "italic", text: "Record" },
  { id: "group.contact", style: "italic", text: "Contact" },
  ...Object.entries(ENTRIES).map(([id, e]) => ({ id: `name.${id}`, style: "regular", text: e.name.toUpperCase(), tracking: 0.03 })),
  { id: "contact.mail", style: "italic", text: PERSON.email },
  { id: "seal.ring", style: "regular", text: "MACEO · CARDINALE · KWIK · NEW YORK CITY · ", tracking: 0.12, glyphs: true },
  { id: "seal.mck", style: "regular", text: "MCK", tracking: 0.04 },
];
