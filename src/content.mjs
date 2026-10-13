// Every word on the page outside the figures. Facts come only from the
// previous maceo.dev; no em dashes in visible copy.

export const PERSON = {
  name: "Maceo Cardinale Kwik",
  short: "MCK",
  city: "New York City",
  email: "maceo@datost.com",
  github: "https://github.com/maceoCK",
  url: "https://maceo.dev/",
};

export const META = {
  title: "Maceo Cardinale Kwik",
  description:
    "Maceo Cardinale Kwik, engineer and founder in New York City. Founder of Datost, an applied research lab backed by Y Combinator and OpenAI, building ED1TH: glasses that put a quiet, capable computer in the corner of your eye. Previously Traba and SimonComputing. B.S. in Computer Science from Virginia Tech in two years, 4.0.",
};

// The cover, after the Michelangelus announcement poster: a wordmark, one
// monumental capital, a spaced line, and a small line set edge to edge.
export const COVER = {
  big: ["Engineer", "and", "Founder"].map((w) => w.toUpperCase()),
  small: "FOUNDER OF DATOST, BACKED BY Y COMBINATOR AND OPENAI, IN NEW YORK CITY",
};

export const LEDE = [
  "Engineer and founder in New York City. I started Datost, an applied research lab backed by Y Combinator and OpenAI, and we are building ED1TH: glasses that put a quiet, capable computer in the corner of your eye.",
  "Everything below is a working drawing. Each figure is a small machine that does what that part of my work does. Hover, click, or use the arrow keys.",
];

// Page order: groups of figures. Each entry is keyed by figure id.
export const GROUPS = [
  { id: "now", title: "Now", figures: ["ed1th", "datost"] },
  { id: "before", title: "Before", figures: ["traba", "simon"] },
  { id: "open", title: "Open work", figures: ["pravost", "h668", "conway"] },
  { id: "school", title: "School", figures: ["school"] },
];

export const ENTRIES = {
  ed1th: {
    kicker: "Founder, Datost",
    name: "ED1TH",
    line: "The computers that come after the screen.",
    body: ["A pair of glasses that puts a quiet, capable computer in the corner of your eye. It is what we are building at Datost."],
    links: [
      ["ed1th.com", "https://ed1th.com"],
      ["datost.com", "https://datost.com"],
    ],
  },
  datost: {
    kicker: "Founder",
    name: "Datost",
    line: "Sixteen drawers, every one of them locked.",
    body: ["An applied research lab, backed by Y Combinator and OpenAI. Sixteen of its repositories are private, so the cabinet stays shut."],
    links: [["datost.com", "https://datost.com"]],
  },
  traba: {
    kicker: "Engineering",
    name: "Traba",
    line: "Shifts, filled at market speed.",
    body: ["I was an engineer at Traba, the industrial labor marketplace, where the work moves at market speed."],
    links: [],
  },
  simon: {
    kicker: "Software engineering",
    name: "SimonComputing",
    line: "A release is a promise made to strangers.",
    body: ["Production systems, built with a consultancy's discipline."],
    links: [],
  },
  pravost: {
    kicker: "Repository",
    name: "pravost",
    line: "Money held against intention.",
    body: [],
    links: [["github.com/maceoCK/pravost", "https://github.com/maceoCK/pravost"]],
  },
  h668: {
    kicker: "Repository, mathematics",
    name: "h668-z37",
    line: "The smallest Hadamard order nobody has settled.",
    body: [
      "Cyclotomic nonexistence results for the conference graph of H(668). 668 is the smallest order for which a Hadamard matrix is not known, and the question is still open.",
    ],
    links: [["github.com/maceoCK/h668-z37", "https://github.com/maceoCK/h668-z37"]],
  },
  conway: {
    kicker: "Repository, game",
    name: "conway",
    line: "You win when nothing is left alive.",
    body: ["A strategy game grown from Conway's Game of Life."],
    links: [["github.com/maceoCK/conway", "https://github.com/maceoCK/conway"]],
  },
  school: {
    kicker: "B.S. Computer Science",
    name: "Virginia Tech",
    line: "Two years, 4.0.",
    body: ["I began at Penn State and finished a B.S. in Computer Science at Virginia Tech in two years, with a 4.0."],
    links: [],
  },
};

// The record: the same facts as a plain list, for readers who skip drawings.
export const RECORD = [
  { when: "Now", what: "Founder, Datost", note: "Applied research lab backed by Y Combinator and OpenAI. Building ED1TH.", links: [["datost.com", "https://datost.com"], ["ed1th.com", "https://ed1th.com"]] },
  { when: "Before", what: "Engineering, Traba", note: "The industrial labor marketplace.", links: [] },
  { when: "Before that", what: "Software engineering, SimonComputing", note: "Production systems.", links: [] },
  { when: "School", what: "B.S. Computer Science, Virginia Tech", note: "Two years, 4.0. Began at Penn State.", links: [] },
  {
    when: "Open work",
    what: "pravost, h668-z37, conway",
    note: "Sixteen more live privately at Datost.",
    links: [
      ["pravost", "https://github.com/maceoCK/pravost"],
      ["h668-z37", "https://github.com/maceoCK/h668-z37"],
      ["conway", "https://github.com/maceoCK/conway"],
    ],
  },
];

export const CONTACT = {
  line: "Write to me.",
  links: [
    ["maceo@datost.com", "mailto:maceo@datost.com"],
    ["github.com/maceoCK", "https://github.com/maceoCK"],
    ["datost.com", "https://datost.com"],
    ["ed1th.com", "https://ed1th.com"],
  ],
};

export const COLOPHON = [
  "Every figure on this page is drawn in code: isometric SVG built from solids with the Anatomy kit by wheresryan22 (MIT), and moved by a small model whose numbers you can read in each corner.",
  "Display lines are set in Michelangelus, the typeface studiogusto drew from Michelangelo's letters for the Fabbrica di San Pietro, and carried here as outlines. Text is set in Crimson Pro, figures in Geist Mono.",
];
