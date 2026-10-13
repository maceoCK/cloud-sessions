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
  "I started Datost, an applied research lab backed by Y Combinator and OpenAI. We are building ED1TH: glasses that put a quiet, capable computer in the corner of your eye.",
  "Each figure below is a small machine that works the way that part of my work does.",
];
// how to work the figures, by pointer and by finger
export const HOW = { fine: "Hover, click, or use the arrow keys.", touch: "Tap them." };

// Page order: groups of figures. Each entry is keyed by figure id.
export const GROUPS = [
  { id: "now", title: "Now", figures: ["ed1th", "datost"] },
  { id: "before", title: "Before", figures: ["traba", "simon"] },
  { id: "open", title: "Open work", figures: ["pravost", "h668", "conway"] },
  { id: "school", title: "School", figures: ["school"] },
];

export const ENTRIES = {
  ed1th: {
    kicker: "Datost",
    name: "ED1TH",
    line: "The computers that come after the screen.",
    body: [],
    links: [["ed1th.com", "https://ed1th.com"]],
  },
  datost: {
    kicker: "Founder",
    name: "Datost",
    line: "Sixteen drawers, every one of them locked.",
    body: ["Sixteen of its repositories are private."],
    links: [["datost.com", "https://datost.com"]],
  },
  traba: {
    kicker: "Engineering",
    name: "Traba",
    line: "Shifts, filled at market speed.",
    body: ["The industrial labor marketplace."],
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
    kicker: "Mathematics",
    name: "h668-z37",
    line: "The smallest Hadamard order nobody has settled.",
    body: [
      "Cyclotomic nonexistence results for the conference graph of H(668).",
    ],
    links: [["github.com/maceoCK/h668-z37", "https://github.com/maceoCK/h668-z37"]],
  },
  conway: {
    kicker: "Game",
    name: "conway",
    line: "You win when nothing is left alive.",
    body: ["A strategy game grown from Conway's Game of Life."],
    links: [["github.com/maceoCK/conway", "https://github.com/maceoCK/conway"]],
  },
  school: {
    kicker: "B.S. Computer Science",
    name: "Virginia Tech",
    line: "Two years, 4.0.",
    body: ["I began at Penn State."],
    links: [],
  },
};


export const CONTACT = {
  line: "Write to me.",
  links: [["github.com/maceoCK", "https://github.com/maceoCK"]],
};

export const COLOPHON = [
  "Figures drawn in code with the Anatomy kit by wheresryan22. Set in Michelangelus by studiogusto, carried as outlines, with Crimson Pro and Geist Mono.",
];
