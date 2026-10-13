// The truth behind Fig 5A. Pure functions, no DOM: the build imports this module and the page inlines it,
// so the readout, the drawn tyre marks, the caption and every moving part come from the same numbers.
// World units are 0.2 m (U = 5 per metre); the model itself works in metres.

export const U = 5;
export const GRAV = 9.81;
export const MU = 0.78; // peak grip of damp asphalt under sea mist
export const MU_SLIDE = 0.72; // kinetic grip while the rear tyres slide
export const HALF_ROAD = 3.5; // two 3.5 m lanes
export const CAR = { length: 4.3, width: 1.68, height: 1.28, base: 2.4, track: 1.42, wheel: 0.31, lamp: 0.62, mass: 1150 };
export const SWELL = { period: 11, height: 2.4, chop: 4.2 };
export const LEVEL = { sea: 8, toe: 5, road: 33, crown: 47 }; // metres above the plinth top
export const SPRAY = { rise: 11.5 };
export const DRIFT_MAX = 32; // degrees the driver holds the tail out at full commitment // m/s at the foot of the cliff when a crest hits

// Road centreline control polygon (world units). The car leaves the far portal heading +x, runs the far leg,
// turns left round the tip of the headland and comes back along the near leg into the near portal.
export const PORTAL_X = -120;
// The road as a driver would survey it: straights and arcs (metres of radius, degrees of turn), walked
// from inside the far tunnel. A left turn is +, a right turn −. It closes on the near portal by construction.
export const ROUTE = [
  ["line", 25], ["arc", -12, 44], ["line", 8], ["arc", 12, 44], ["line", 13.9], ["arc", 180, 16.8],
  ["arc", 45, 16], ["line", 2], ["arc", -90, 15], ["line", 2], ["arc", 45, 16], ["line", 18.3],
];
export const START = [-205, -75];

export function controlOf(route = ROUTE, start = START, step = 13) {
  const out = [[...start]];
  let [x, y] = start;
  let h = 0;
  for (const [kind, a, b] of route) {
    if (kind === "line") {
      const length = a * U;
      const count = Math.max(1, Math.round(length / step));
      for (let i = 1; i <= count; i++) out.push([x + Math.cos(h) * (length * i) / count, y + Math.sin(h) * (length * i) / count]);
      x += Math.cos(h) * length;
      y += Math.sin(h) * length;
    } else {
      const turn = (a * Math.PI) / 180;
      const r = b * U;
      const side = Math.sign(turn);
      const cx = x - Math.sin(h) * r * side;
      const cy = y + Math.cos(h) * r * side;
      const count = Math.max(2, Math.round((Math.abs(turn) * r) / step));
      for (let i = 1; i <= count; i++) {
        const hh = h + (turn * i) / count;
        out.push([cx + Math.sin(hh) * r * side, cy - Math.cos(hh) * r * side]);
      }
      h += turn;
      x = out[out.length - 1][0];
      y = out[out.length - 1][1];
    }
  }
  return out;
}
export const CONTROL = controlOf();

const TAU = Math.PI * 2;
const clampTo = (value, low, high) => Math.min(high, Math.max(low, value));
const smoothStep = (a, b, x) => {
  const t = clampTo((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function bspline(points, per = 24) {
  const pts = [points[0], points[0], ...points, points[points.length - 1], points[points.length - 1]];
  const out = [];
  for (let i = 0; i < pts.length - 3; i++) {
    const [p0, p1, p2, p3] = [pts[i], pts[i + 1], pts[i + 2], pts[i + 3]];
    for (let j = 0; j < per; j++) {
      const t = j / per;
      const a = (1 - t) ** 3 / 6;
      const b = (3 * t ** 3 - 6 * t * t + 4) / 6;
      const c = (-3 * t ** 3 + 3 * t * t + 3 * t + 1) / 6;
      const d = t ** 3 / 6;
      out.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

function resampled(points, spacing) {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  const total = lengths[lengths.length - 1];
  const count = Math.round(total / spacing);
  const out = [];
  let j = 1;
  for (let i = 0; i <= count; i++) {
    const at = (i / count) * total;
    while (j < points.length - 1 && lengths[j] < at) j++;
    const t = (at - lengths[j - 1]) / (lengths[j] - lengths[j - 1] || 1);
    out.push([points[j - 1][0] + (points[j][0] - points[j - 1][0]) * t, points[j - 1][1] + (points[j][1] - points[j - 1][1]) * t]);
  }
  return { out, total };
}

// Verge (m) between the outer road edge and the cliff edge, as a function of the share of the visible road.
// Wide by the portals, narrowest where the cliff has eaten into the tip and the cove.
export const vergeAt = (share) => 2.4 - 1.5 * Math.exp(-(((share - 0.5) / 0.07) ** 2)) - 0.9 * Math.exp(-(((share - 0.79) / 0.05) ** 2)) - 0.5 * Math.exp(-(((share - 0.24) / 0.05) ** 2));

export function roadOf(control = CONTROL) {
  const dense = bspline(control, 12);
  const { out, total } = resampled(dense, 0.5);
  const n = out.length;
  const ds = total / (n - 1) / U;
  const heading = out.map((_, i) => {
    const a = out[Math.max(0, i - 1)];
    const b = out[Math.min(n - 1, i + 1)];
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  });
  const raw = heading.map((_, i) => wrapAngle(heading[Math.min(n - 1, i + 1)] - heading[Math.max(0, i - 1)]) / (((Math.min(n - 1, i + 1) - Math.max(0, i - 1)) * ds) || 1));
  const kappa = raw.map((_, i) => {
    let sum = 0;
    let weight = 0;
    for (let j = -8; j <= 8; j++) {
      const w = Math.exp(-((j / 4) ** 2));
      sum += raw[clampTo(i + j, 0, n - 1)] * w;
      weight += w;
    }
    return sum / weight;
  });
  // the visible stretch runs portal to portal; shares measure along it
  const first = out.findIndex(([x]) => x >= PORTAL_X);
  let last = n - 1;
  while (last > 0 && out[last][0] < PORTAL_X) last--;
  const verge = out.map((_, i) => vergeAt((i - first) / (last - first)));
  return { pts: out, heading, kappa, verge, n, ds, length: (n - 1) * ds, first, last };
}

// A point on the road: (index, lateral metres to the left of travel) → world units
export function roadPoint(road, i, d) {
  const j = clampTo(Math.round(i), 0, road.n - 1);
  const [x, y] = road.pts[j];
  const h = road.heading[j];
  return [x - Math.sin(h) * d * U, y + Math.cos(h) * d * U];
}

export function cliffEdge(road, i) {
  return roadPoint(road, i, -(HALF_ROAD + road.verge[i]));
}

export function project(road, x, y, hint) {
  let best = hint;
  let bestD = Infinity;
  const from = Math.max(0, hint - 60);
  const to = Math.min(road.n - 1, hint + 60);
  for (let i = from; i <= to; i++) {
    const dx = road.pts[i][0] - x;
    const dy = road.pts[i][1] - y;
    const dd = dx * dx + dy * dy;
    if (dd < bestD) {
      bestD = dd;
      best = i;
    }
  }
  const h = road.heading[best];
  const lateral = (-(x - road.pts[best][0]) * Math.sin(h) + (y - road.pts[best][1]) * Math.cos(h)) / U;
  return { i: best, d: lateral };
}

// Speed the driver aims for at each sample, before the pace multiplier: the grip-limited corner speed
// (with a small attack factor), then braking and traction limits run back and forth along the road.
export function speedProfile(road, { cliff = 0.84, land = 1.0, vmax = 27, brake = 0.82, push = 0.34 } = {}) {
  // the driver plans each corner by what lies on its outside: the drop (left-handers, the cliff is always on
  // the right) gets 84% of the grip; a corner whose outside is rock or grass gets all of it
  const n = road.n;
  const v = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let k = 0;
    for (let j = -6; j <= 6; j++) {
      const kj = road.kappa[clampTo(i + j, 0, n - 1)];
      if (Math.abs(kj) > Math.abs(k)) k = kj;
    }
    const attack = k > 0 ? cliff : land;
    v[i] = Math.min(vmax, Math.sqrt((attack * MU * GRAV) / Math.max(Math.abs(k), 1e-4)));
  }
  for (let i = n - 2; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[i + 1] ** 2 + 2 * brake * GRAV * road.ds));
  for (let i = 1; i < n; i++) v[i] = Math.min(v[i], Math.sqrt(v[i - 1] ** 2 + 2 * push * GRAV * road.ds));
  return Array.from(v, (x) => Math.round(x * 1000) / 1000);
}

export function carStart(road, profile, pace) {
  const i = 0;
  return { x: road.pts[i][0], y: road.pts[i][1], psi: road.heading[i], v: profile[i] * pace, beta: 0, rate: 0, cmd: 0, i, d: 0, along: 0, lat: 0, lon: 0, steer: 0, slide: 0, margin: 9, brake: 0, laps: 0, dark: 0, odo: 0 };
}

// One step of the driver and the car: pure pursuit toward a racing line, a friction circle shared by
// braking and cornering, and a drift angle that opens when the demanded cornering exceeds the grip.
export function stepCar(road, profile, s, pace, dt) {
  const at = project(road, s.x, s.y, s.i);
  s.i = at.i;
  s.d = at.d;
  if (s.dark > 0) {
    s.dark -= dt;
    if (s.dark <= 0) Object.assign(s, carStart(road, profile, pace), { laps: s.laps + 1, odo: s.odo });
    return s;
  }
  const v = Math.max(s.v, 1);
  const look = clampTo(0.75 * v, 7, 18);
  const ahead = Math.min(road.n - 1, s.i + Math.round(look / road.ds));
  const room = HALF_ROAD - CAR.width / 2 - 0.35;
  const line = clampTo(10 * road.kappa[ahead], -room, room);
  const [tx, ty] = roadPoint(road, ahead, line);
  const alpha = wrapAngle(Math.atan2(ty - s.y, tx - s.x) - s.psi);
  const pursuit = (2 * Math.sin(alpha)) / (Math.hypot(tx - s.x, ty - s.y) / U);
  s.cmd += (pursuit - s.cmd) * (1 - Math.exp(-dt / 0.1));
  // near the unguarded edge the driver lifts, which shrinks the slide: commitment, not suicide
  const lift = s.slide > 0.95 ? smoothStep(3.4, 0.5, s.margin) : 0;
  const want = profile[Math.min(road.n - 1, s.i + Math.round((0.3 * v) / road.ds))] * pace * (1 - 0.5 * lift);
  const lon = clampTo((want - s.v) / 0.35, Math.abs(s.beta) > 0.1 ? -(0.12 + 0.3 * lift) * GRAV : -0.86 * GRAV, 0.36 * GRAV * (1 - lift));
  const grip = s.slide > 1.05 ? MU_SLIDE : MU;
  const lateralCap = Math.sqrt(Math.max(0, (grip * GRAV) ** 2 - lon * lon));
  const asked = v * v * s.cmd;
  const lat = clampTo(asked, -lateralCap, lateralCap);
  s.slide += (Math.abs(asked) / (MU * GRAV) - s.slide) * (1 - Math.exp(-dt / 0.3));
  s.v = Math.max(0, s.v + lon * dt);
  s.psi = wrapAngle(s.psi + (lat / v) * dt);
  s.x += Math.cos(s.psi) * s.v * dt * U;
  s.y += Math.sin(s.psi) * s.v * dt * U;
  // drift angle: a little tyre slip in grip, a held slide past the limit (the driver's throttle holds it)
  const sign = Math.sign(lat) || 1;
  const target = sign * ((3.5 * Math.abs(lat)) / (MU * GRAV) + DRIFT_MAX * smoothStep(1.04, 1.5, s.slide)) * (Math.PI / 180);
  s.rate += (34 * (target - s.beta) - 9.6 * s.rate) * dt;
  s.beta += s.rate * dt;
  s.lat = lat;
  s.lon = lon;
  s.brake = lon < -1.2 ? 1 : 0;
  // front wheels follow the velocity at the front axle: countersteer when the tail is out
  s.steer = clampTo(Math.atan((CAR.base * lat) / (v * v)) - s.beta, -0.6, 0.6);
  s.along = s.i * road.ds;
  s.odo += s.v * dt;
  s.margin = marginOf(road, s);
  if (s.i >= road.n - 2) s.dark = 1.6;
  return s;
}

export function cornersOf(s) {
  const yaw = s.psi + s.beta;
  const c = Math.cos(yaw);
  const n = Math.sin(yaw);
  const hl = (CAR.length / 2) * U;
  const hw = (CAR.width / 2) * U;
  return [
    [hl, hw],
    [hl, -hw],
    [-hl, -hw],
    [-hl, hw],
  ].map(([a, b]) => [s.x + a * c - b * n, s.y + a * n + b * c]);
}

// metres from the car's outermost corner to the unguarded cliff edge
export function marginOf(road, s) {
  let least = Infinity;
  for (const [x, y] of cornersOf(s)) {
    const at = project(road, x, y, s.i);
    least = Math.min(least, at.d + HALF_ROAD + road.verge[at.i]);
  }
  return least;
}

export function lapOf(road, profile, pace, dt = 1 / 120) {
  const s = carStart(road, profile, pace);
  const trace = [];
  let least = Infinity;
  let peakDrift = 0;
  let peakLat = 0;
  let top = 0;
  let time = 0;
  while (s.dark <= 0 && time < 60) {
    stepCar(road, profile, s, pace, dt);
    time += dt;
    if (s.i > road.first && s.i < road.last) {
      least = Math.min(least, s.margin);
      peakDrift = Math.max(peakDrift, Math.abs(s.beta));
      peakLat = Math.max(peakLat, Math.abs(s.lat));
      top = Math.max(top, s.v);
    }
    trace.push([s.x, s.y, s.psi + s.beta, Math.abs(s.beta), s.i]);
  }
  return { least, peakDrift: (peakDrift * 180) / Math.PI, peakLat: peakLat / GRAV, top: top * 3.6, time, trace };
}

// The fastest pace at which the line still clears the edge by `keep` metres.
export function paceLimit(road, profile, keep = 0.3) {
  let lo = 0.7;
  let hi = 1.8;
  for (let k = 0; k < 22; k++) {
    const mid = (lo + hi) / 2;
    if (lapOf(road, profile, mid).least >= keep) lo = mid;
    else hi = mid;
  }
  return lo;
}

// ---- the sea -------------------------------------------------------------------------------------
export const swellOf = (depth) => {
  // linear dispersion ω² = g k tanh(k h), solved by fixed point
  const omega = TAU / SWELL.period;
  let k = (omega * omega) / GRAV;
  for (let i = 0; i < 40; i++) k = (omega * omega) / (GRAV * Math.tanh(k * depth));
  const c = omega / k;
  const n = 0.5 * (1 + (2 * k * depth) / Math.sinh(2 * k * depth));
  return { k, lambda: TAU / k, c, group: n * c };
};

export function readoutOf(s) {
  if (s.dark > 0) return "in the tunnel";
  const kmh = Math.round(s.v * 3.6);
  const drift = Math.round((Math.abs(s.beta) * 180) / Math.PI);
  const g = (Math.abs(s.lat) / GRAV).toFixed(2);
  const edge = s.margin.toFixed(1);
  return `${kmh} km/h · drift ${drift}° · ${g} g · edge ${edge} m`;
}

export function wordsOf(s, share) {
  const where = s.dark > 0 ? "In the tunnel." : `${Math.round(s.v * 3.6)} kilometres an hour, drifting ${Math.round((Math.abs(s.beta) * 180) / Math.PI)} degrees, ${s.margin.toFixed(1)} metres from the cliff edge.`;
  return `Pace ${Math.round(share * 100)} percent of the way from grip to the limit. ${where}`;
}
