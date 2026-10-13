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
    "Engineer and founder in New York City, building ED1TH at Datost: glasses that put a quiet, capable computer in the corner of your eye.",
};

// The cover: a monogram. The M in outline, the name, one quiet line.
export const COVER = {
  line: "Engineer and founder · New York City",
};

export const LEDE = [
  "Building ED1TH at Datost: glasses that put a quiet, capable computer in the corner of your eye.",
  "Everything below works. Poke it.",
];

// Page order: groups of figures. Each entry is keyed by figure id.
export const GROUPS = [
  { id: "now", title: "Now", figures: ["ed1th", "datost"] },
  { id: "before", title: "Before", figures: ["traba", "simon"] },
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
    line: "Sixteen drawers. All locked.",
    body: ["Backed by Y Combinator and OpenAI."],
    links: [["datost.com", "https://datost.com"]],
  },
  traba: {
    kicker: "Engineering",
    name: "Traba",
    line: "Shifts, filled at market speed.",
    body: ["Industrial labor marketplace."],
    links: [],
  },
  simon: {
    kicker: "Software engineering",
    name: "SimonComputing",
    line: "A release is a promise made to strangers.",
    body: [],
    links: [],
  },
  school: {
    kicker: "B.S. Computer Science",
    name: "Virginia Tech",
    line: "Two years, start to finish.",
    body: ["Started at Penn State."],
    links: [],
  },
};


export const CONTACT = {
  links: [["github.com/maceoCK", "https://github.com/maceoCK"]],
};

export const COLOPHON = ["Drawn with the Anatomy kit by wheresryan22. Set in Michelangelus."];
