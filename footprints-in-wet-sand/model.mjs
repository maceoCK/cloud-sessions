export const STRIP = { length: 270, width: 160, sea: 22, rise: 1 / 12 };
export const GRAVITY = 981;
export const SLOPE = Math.atan(STRIP.rise);
export const DOWNHILL = GRAVITY * Math.sin(SLOPE);
export const surfaceAt = (y) => STRIP.sea + STRIP.rise * y;

export const GAIT = { step: 66, width: 10.4, toeOut: 7, gap: 0.9, depth: 1.6, line: 66, wander: 3 };

export const FOOT = {
  length: 24.8,
  sole: [
    [0.3, 0.0], [0.6, 1.6], [1.6, 2.7], [3.2, 3.2], [5.2, 3.3], [7.5, 3.4], [10.0, 3.7], [12.5, 4.1], [14.6, 4.6], [16.4, 4.95],
    [18.0, 4.7], [19.1, 3.9], [19.8, 2.6], [20.2, 1.0], [20.4, -0.8], [20.3, -2.4], [19.8, -3.7], [18.6, -4.6], [16.9, -4.85], [15.2, -4.4],
    [13.8, -3.2], [12.4, -1.6], [10.8, -0.6], [9.0, -0.5], [7.4, -1.2], [6.1, -2.3], [4.8, -3.0], [3.0, -3.1], [1.5, -2.6], [0.6, -1.6],
  ],
  toes: [
    { c: [22.75, -2.85], r: [1.95, 1.45], turn: 0.08, weight: 0.82 },
    { c: [22.75, -0.55], r: [1.2, 0.88], turn: 0.05, weight: 0.6 },
    { c: [22.2, 1.15], r: [1.05, 0.8], turn: -0.05, weight: 0.56 },
    { c: [21.35, 2.62], r: [0.95, 0.76], turn: -0.15, weight: 0.52 },
    { c: [20.35, 3.95], r: [0.85, 0.7], turn: -0.3, weight: 0.46 },
  ],
  pressure: { base: 0.42, heel: [4, 0.2, 9, 7, 0.58], ball: [17, -1.2, 6, 10, 0.45], outer: [16.5, 3, 5, 4, 0.25] },
  roll: [0.012, 0.13],
  lift: 0.32,
  wall: 0.5,
  rim: { height: 0.2, width: 1.25, front: 0.9 },
  pool: 0.3,
  seep: [0.5, 2.6],
  pale: { rise: [0.06, 0.18], fall: [0.5, 1.7], reach: 3 },
};

export const SWASH = { from: -60, reach: 130, spread: 6, lobes: 0.035, smooth: 1.4, drain: [1.6, 3.2] };
export const LOOP = { first: 0.9, steps: 4, collapse: 5.4, period: 14.5 };

export const ramp = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function hashOf(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export const launchOf = (reach) => Math.sqrt(2 * DOWNHILL * (reach - SWASH.from));

export function waveOf(at, index) {
  const reach = SWASH.reach + SWASH.spread * (2 * hashOf(index * 3.1 + 0.7) - 1);
  return { at, index, reach, u0: launchOf(reach), seed: hashOf(index * 7.3 + 2.1) };
}

export function lobeOf(x, seed) {
  return 0.5 * Math.sin(x / 37 + seed * 6.1) + 0.3 * Math.sin(x / 19 + seed * 13.7) + 0.2 * Math.sin(x / 11.5 + seed * 29.3);
}

export const launchAt = (wave, x) => wave.u0 * (1 + SWASH.lobes * lobeOf(x, wave.seed));

export function frontAt(wave, x, s) {
  if (s <= 0) return -Infinity;
  const u = launchAt(wave, x);
  return SWASH.from + u * s - 0.5 * DOWNHILL * s * s;
}

export const speedAt = (wave, x, s) => launchAt(wave, x) - DOWNHILL * s;
export const topOf = (wave, x) => SWASH.from + launchAt(wave, x) ** 2 / (2 * DOWNHILL);
export const turnOf = (wave, x) => launchAt(wave, x) / DOWNHILL;

export function depthAt(wave, x, y, s) {
  const front = frontAt(wave, x, s);
  if (!(y < front)) return 0;
  return (front - y) ** 2 / (9 * GRAVITY * s * s);
}

export function timesAt(wave, x, y) {
  const u = launchAt(wave, x);
  const disc = u * u - 2 * DOWNHILL * (y - SWASH.from);
  if (disc <= 0) return null;
  const root = Math.sqrt(disc);
  return [(u - root) / DOWNHILL, (u + root) / DOWNHILL];
}

export function exposureAt(wave, x, y, s, born) {
  const times = timesAt(wave, x, y);
  if (!times) return 0;
  return Math.max(0, Math.min(s, times[1]) - Math.max(times[0], born));
}

export const erosionOf = (exposure) => ramp(0, SWASH.smooth, exposure);

export function tourSteps(cycle) {
  const shift = (hashOf(cycle * 5.7 + 1.3) - 0.5) * 2 * GAIT.wander;
  const lead = hashOf(cycle * 2.9 + 4.4) < 0.5 ? 1 : -1;
  const out = [];
  const span = (LOOP.steps - 1) * GAIT.step + FOOT.length;
  const start = (STRIP.length - span) / 2;
  for (let index = 0; index < LOOP.steps; index++) {
    const x = start + index * GAIT.step;
    const side = index % 2 ? -lead : lead;
    const bend = 3.2 * Math.sin((x + cycle * 41) / 150);
    const slope = (3.2 / 150) * Math.cos((x + cycle * 41) / 150);
    out.push({ at: LOOP.first + index * GAIT.gap, ...footAt(x, GAIT.line + shift + bend, Math.atan(slope), side, hashOf(cycle * 11.1 + index * 1.7)) });
  }
  return out;
}

export function footAt(x, y, walk, side, jitter = 0.5) {
  const heading = walk + side * (GAIT.toeOut * Math.PI) / 180;
  const off = (side * GAIT.width) / 2;
  return { x: x - Math.sin(walk) * off, y: y + Math.cos(walk) * off, heading, side, scale: 0.94 + 0.12 * jitter };
}

export function toWorld(print, u, v) {
  const c = Math.cos(print.heading);
  const s = Math.sin(print.heading);
  const w = v * print.side;
  return [print.x + u * c - w * s, print.y + u * s + w * c];
}

export function regionsOf() {
  const ellipse = (toe, steps) =>
    Array.from({ length: steps }, (_, i) => {
      const a = (i / steps) * Math.PI * 2;
      const u = toe.r[0] * Math.cos(a);
      const v = toe.r[1] * Math.sin(a);
      return [toe.c[0] + u * Math.cos(toe.turn) - v * Math.sin(toe.turn), toe.c[1] + u * Math.sin(toe.turn) + v * Math.cos(toe.turn)];
    });
  return [{ name: "sole", ring: FOOT.sole, at: 0 }, ...FOOT.toes.map((toe, index) => ({ name: `toe${index}`, ring: ellipse(toe, 16), at: toe.c[0] }))];
}

export function pressOf(u, age) {
  const [lag, rise] = FOOT.roll;
  return ramp(lag * u, lag * u + rise, age);
}

export const metres = (cm) => (cm / 100).toFixed(2);
