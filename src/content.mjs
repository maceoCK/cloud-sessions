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

// The cover, after the Michelangelus announcement poster: a wordmark, one
// monumental capital, a spaced line, and a small line set edge to edge.
export const COVER = {
  big: ["Engineer", "and", "Founder"].map((w) => w.toUpperCase()),
  small: ["DATOST", "NEW YORK CITY"],
  said: "Engineer and founder. Datost, New York City.",
};

export const LEDE = [
  "Building ED1TH at Datost: glasses that put a quiet, capable computer in the corner of your eye.",
  "Everything below works. Poke it.",
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
    body: ["Some of it does not exist."],
    links: [["github.com/maceoCK/h668-z37", "https://github.com/maceoCK/h668-z37"]],
  },
  conway: {
    kicker: "Game",
    name: "conway",
    line: "You win when nothing is left alive.",
    body: ["A game grown from Life."],
    links: [["github.com/maceoCK/conway", "https://github.com/maceoCK/conway"]],
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
