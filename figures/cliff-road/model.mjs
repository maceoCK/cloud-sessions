// The truth behind Fig 5A. Pure functions, no DOM: the build imports this module and the page inlines it,
// so the readout, the drawn tyre marks, the caption and every moving part come from the same numbers.
// World units are 0.2 m (U = 5 per metre); the model itself works in metres.

export const U = 5;
export const GRAV = 9.81;
export const MU = 0.78; // peak grip of damp asphalt under sea mist
export const MU_SLIDE = 0.72; // kinetic grip while the rear tyres slide
export const HALF_ROAD = 3.0; // a mountain pass: two 3 m lanes
export const CAR = { length: 4.3, width: 1.68, height: 1.28, base: 2.4, track: 1.42, wheel: 0.31, lamp: 0.62, mass: 1150 };
export const SWELL = { period: 11, height: 2.4, chop: 4.2 };
export const LEVEL = { sea: 8, toe: 5, top: 54, bottom: 24 }; // metres above the plinth top: the road at the summit tunnel and at the foot
export const SPRAY = { rise: 11.5 }; // m/s at the foot of the cliff when a crest hits
export const DRIFT_MAX = 32; // degrees the driver holds the tail out at full commitment

// Both tunnel mouths are in one rock face at x = PORTAL_X, at the left of the model: the road leaves the
// summit tunnel heading +x and comes back down into the foot tunnel heading -x.
export const PORTAL_X = -210;
// The pass as a surveyor would walk it from inside the summit tunnel: straights and arcs (metres of radius,
// degrees of turn; + turns toward the sea, which is the front of the model). Four legs, each with a pair of
// S-bends, stacked down the mountain's face and joined by three 9 m hairpins: two on the sea cliff at the
// right, one on the hillside at the left.
const HAIRPIN = 9;
export const ROUTE = [
  ["line", 14], ["arc", 14, 32], ["arc", -14, 32], ["line", 30], ["arc", -10, 40], ["arc", 10, 40], ["line", 11.6],
  ["arc", 180, HAIRPIN],
  ["line", 8], ["arc", 12, 36], ["arc", -12, 36], ["line", 14], ["arc", -12, 36], ["arc", 12, 36], ["line", 11.06],
  ["arc", -180, HAIRPIN],
  ["line", 8], ["arc", -12, 36], ["arc", 12, 36], ["line", 14], ["arc", 12, 36], ["arc", -12, 36], ["line", 11.06],
  ["arc", 180, HAIRPIN],
  ["line", 16], ["arc", 10, 40], ["arc", -10, 40], ["line", 55.1],
];
export const START = [-250, -152];

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

// Verge (m) between the road edge and the unguarded drop, as a function of distance along the road (m):
// a metre and a half of gravel on the legs, narrower in the hairpins, and least on the lowest one, where
// the sea cliff has eaten in.
export const vergeAt = (s, hairpin) => (hairpin === 2 ? 0.9 : hairpin >= 0 ? 1.1 : 1.5 + 0.35 * Math.sin(s / 11) + 0.2 * Math.sin(s / 4.3 + 1));

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
  // the visible stretch runs portal to portal
  const first = out.findIndex(([x]) => x >= PORTAL_X);
  let last = n - 1;
  while (last > 0 && out[last][0] < PORTAL_X) last--;
  // which hairpin a sample is in (0, 1, 2 from the top; -1 on the legs), by its curvature
  const hairpin = new Int8Array(n).fill(-1);
  let count = -1;
  let inside = false;
  for (let i = 0; i < n; i++) {
    const tight = Math.abs(kappa[i]) > 0.075;
    if (tight && !inside) count++;
    inside = tight;
    if (tight) hairpin[i] = count;
  }
  // the drop is on the downhill side, toward the sea at the front; round a hairpin it is the outside
  const drop = heading.map((h, i) => (hairpin[i] >= 0 ? -Math.sign(kappa[i]) : Math.cos(h) >= 0 ? 1 : -1));
  const verge = out.map((_, i) => vergeAt(i * ds, hairpin[i]));
  // the road falls at a steady grade from the summit tunnel to the foot one (world units)
  const z = out.map((_, i) => (LEVEL.top - ((LEVEL.top - LEVEL.bottom) * i) / (n - 1)) * U);
  // each hairpin's first and last sample
  const pins = [];
  for (let i = 0; i < n; i++) {
    if (hairpin[i] < 0) continue;
    if (!pins[hairpin[i]]) pins[hairpin[i]] = [i, i];
    pins[hairpin[i]][1] = i;
  }
  return { pts: out, heading, kappa, verge, drop, hairpin, pins, z, n, ds, length: (n - 1) * ds, first, last, grade: (LEVEL.top - LEVEL.bottom) / ((n - 1) * ds) };
}

// A point on the road: (index, lateral metres to the left of travel) → world units
export function roadPoint(road, i, d) {
  const j = clampTo(Math.round(i), 0, road.n - 1);
  const [x, y] = road.pts[j];
  const h = road.heading[j];
  return [x - Math.sin(h) * d * U, y + Math.cos(h) * d * U];
}

export function cliffEdge(road, i) {
  return roadPoint(road, i, road.drop[i] * (HALF_ROAD + road.verge[i]));
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
  // the driver plans each corner by what lies on its outside: where that is the drop, 84% of the grip;
  // where it is the hillside, all of it
  const n = road.n;
  const v = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let k = 0;
    for (let j = -6; j <= 6; j++) {
      const kj = road.kappa[clampTo(i + j, 0, n - 1)];
      if (Math.abs(kj) > Math.abs(k)) k = kj;
    }
    const attack = -Math.sign(k) === road.drop[i] ? cliff : land;
    v[i] = Math.min(vmax, Math.sqrt((attack * MU * GRAV) / Math.max(Math.abs(k), 1e-4)));
  }
  for (let i = n - 2; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[i + 1] ** 2 + 2 * brake * GRAV * road.ds));
  for (let i = 1; i < n; i++) v[i] = Math.min(v[i], Math.sqrt(v[i - 1] ** 2 + 2 * push * GRAV * road.ds));
  return Array.from(v, (x) => Math.round(x * 1000) / 1000);
}

export function carStart(road, profile, pace) {
  const i = 0;
  return { x: road.pts[i][0], y: road.pts[i][1], z: road.z[i], psi: road.heading[i], v: profile[i] * pace, beta: 0, rate: 0, cmd: 0, i, d: 0, along: 0, lat: 0, lon: 0, steer: 0, slide: 0, margin: 9, brake: 0, laps: 0, dark: 0, odo: 0, air: null };
}

// One step of the driver and the car: pure pursuit toward a racing line, a friction circle shared by
// braking and cornering, and a drift angle that opens when the demanded cornering exceeds the grip.
// With `world` ({ sea, groundAt(x, y) } in world units) the car can also leave the road: once its centre
// of mass is past the unguarded edge it tips over and falls (fallStep).
export function stepCar(road, profile, s, pace, dt, world = null) {
  if (s.air) {
    fallStep(road, profile, s, pace, dt, world);
    return s;
  }
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
  // downhill the grade adds g·sin θ, which the tyres don't pay for
  s.v = Math.max(0, s.v + (lon + GRAV * road.grade) * dt);
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
  s.z = road.z[s.i];
  s.odo += s.v * dt;
  s.margin = marginOf(road, s);
  if (s.i >= road.n - 2) s.dark = 1.6;
  // past the edge: the centre of mass is over the drop, so the car tips off it
  if (world && s.i > road.first && s.i < road.last) {
    const c = project(road, s.x, s.y, s.i);
    const centre = HALF_ROAD + road.verge[c.i] - road.drop[c.i] * c.d;
    if (centre < 0) leaveRoad(road, s, c.i);
  }
  return s;
}

// The pace control: 0 is grip, 1 the limit. Past 1 (to OVER.share) the driver holds the limit down the
// pass, then overcooks the last hairpin, from OVER.before metres out: up to 28% past the limit, where the
// slide carries the car over the edge and into the sea.
export const OVER = { share: 1.25, gain: 1.1, before: 30 };
export function paceAt(share, min, limit, road = null, i = 0) {
  if (share <= 1) return min + share * (limit - min);
  if (road && i < road.pins[road.pins.length - 1][0] - OVER.before / road.ds) return limit;
  return limit * (1 + OVER.gain * (share - 1));
}

// ---- over the edge ---------------------------------------------------------------------------------------
// The car keeps its velocity, gains an outward shove from the tyres still biting as it tips, and rolls
// toward the drop and pitches nose-down as the wheels on that side lose the road. Then it is a falling
// body: gravity, a little air drag, rock strikes that bounce it off the cliff, and the sea.
export const FALL = { roll: 2.4, pitch: 0.9, shove: 0.8, drag: 0.04, sinkTime: 3.2, bounce: 0.35 };
function leaveRoad(road, s, i) {
  const h = road.heading[i];
  const out = [-Math.sin(h) * road.drop[i], Math.cos(h) * road.drop[i]];
  const yaw = s.psi + s.beta;
  // which way the car rolls: the side facing the drop goes down
  const left = [-Math.sin(yaw), Math.cos(yaw)];
  const toward = Math.sign(out[0] * left[0] + out[1] * left[1]) || 1;
  s.air = {
    t: 0,
    vx: Math.cos(s.psi) * s.v + out[0] * FALL.shove,
    vy: Math.sin(s.psi) * s.v + out[1] * FALL.shove,
    vz: 0,
    yaw,
    yawRate: s.v * (s.lat / Math.max(s.v * s.v, 1)) + s.rate,
    roll: 0,
    rollRate: -toward * FALL.roll,
    pitch: 0,
    pitchRate: FALL.pitch,
    from: { x: s.x, y: s.y, z: s.z, i, v: s.v },
    hits: 0,
    splash: null,
  };
  s.lat = 0;
  s.lon = 0;
  s.brake = 0;
  s.steer = 0;
}

export function fallStep(road, profile, s, pace, dt, world) {
  const a = s.air;
  a.t += dt;
  if (a.splash) {
    // in the water: the way comes off at once, and the car settles and goes down nose first
    const k = Math.exp(-dt / 0.15);
    a.vx *= k;
    a.vy *= k;
    a.rollRate *= Math.exp(-dt / 0.6);
    a.yawRate *= Math.exp(-dt / 0.6);
    a.pitchRate = 0.5 * (1.1 - a.pitch);
    const sunk = a.t - a.splash.t;
    a.vz = -(0.35 + 0.9 * Math.min(1, sunk / a.sinkFor)) * U;
  } else {
    a.vz -= GRAV * dt;
    const drag = Math.exp(-FALL.drag * dt);
    a.vx *= drag;
    a.vy *= drag;
  }
  s.x += a.vx * dt * U;
  s.y += a.vy * dt * U;
  s.z += a.vz * dt * U;
  a.yaw += a.yawRate * dt;
  a.roll += a.rollRate * dt;
  a.pitch += a.pitchRate * dt;
  s.psi = a.yaw;
  s.beta = 0;
  s.v = Math.hypot(a.vx, a.vy, a.vz);
  if (!world) return s;
  const ground = world.groundAt(s.x, s.y);
  if (!a.splash && ground > world.sea + 1 && s.z < ground + 1) {
    // a rock strike: thrown back up and outward, down the slope, spinning harder
    const e = 2;
    const gx = world.groundAt(s.x + e, s.y) - world.groundAt(s.x - e, s.y);
    const gy = world.groundAt(s.x, s.y + e) - world.groundAt(s.x, s.y - e);
    const gl = Math.hypot(gx, gy) || 1;
    s.z = ground + 1;
    a.vz = Math.abs(a.vz) * FALL.bounce;
    a.vx = a.vx * 0.6 - (gx / gl) * 3;
    a.vy = a.vy * 0.6 - (gy / gl) * 3;
    a.rollRate *= -1.3;
    a.pitchRate *= 1.2;
    a.hits++;
    a.hit = { t: a.t, x: s.x, y: s.y, z: s.z };
  }
  if (!a.splash && s.z <= world.sea && ground <= world.sea) {
    a.splash = { t: a.t, x: s.x, y: s.y, speed: Math.hypot(a.vx, a.vy, a.vz), fall: (a.from.z - world.sea) / U };
    a.sinkFor = FALL.sinkTime;
    s.z = world.sea;
  }
  // the glass of the model's sea is as far as anything goes
  if (world.box) {
    s.x = Math.min(world.box[2] - 12, Math.max(world.box[0] + 12, s.x));
    s.y = Math.min(world.box[3] - 12, Math.max(world.box[1] + 12, s.y));
  }
  // gone under (or, on land, come to rest): the next car leaves the summit tunnel
  if ((a.splash && a.t - a.splash.t > FALL.sinkTime) || a.t > 12) Object.assign(s, carStart(road, profile, pace), { laps: s.laps + 1, odo: s.odo });
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

// metres from the car's outermost corner to the unguarded edge, on whichever side the drop is
export function marginOf(road, s) {
  let least = Infinity;
  for (const [x, y] of cornersOf(s)) {
    const at = project(road, x, y, s.i);
    least = Math.min(least, HALF_ROAD + road.verge[at.i] - road.drop[at.i] * at.d);
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

export function readoutOf(s, sea = 0) {
  if (s.dark > 0) return "in the tunnel";
  if (s.air && s.air.splash) return `in the sea · it fell ${Math.round(s.air.splash.fall)} m and hit the water at ${Math.round(s.air.splash.speed * 3.6)} km/h`;
  if (s.air) return `over the edge · ${Math.max(0, Math.round((s.z - sea) / U))} m above the sea · ${Math.round(s.v * 3.6)} km/h`;
  const kmh = Math.round(s.v * 3.6);
  const drift = Math.round((Math.abs(s.beta) * 180) / Math.PI);
  const g = (Math.abs(s.lat) / GRAV).toFixed(2);
  const edge = s.margin.toFixed(1);
  return `${kmh} km/h · drift ${drift}° · ${g} g · edge ${edge} m`;
}

export function wordsOf(s, share) {
  if (s.air) return s.air.splash ? "The car has gone into the sea." : "Over the edge: the car is falling toward the sea.";
  const deg = Math.round((Math.abs(s.beta) * 180) / Math.PI);
  const where = s.dark > 0 ? "In the tunnel." : `${Math.round(s.v * 3.6)} kilometres an hour, drifting ${deg} ${deg === 1 ? "degree" : "degrees"}, ${s.margin.toFixed(1)} metres from the edge.`;
  return `Pace ${Math.round(share * 100)} percent of the way from grip to the limit. ${where}`;
}
