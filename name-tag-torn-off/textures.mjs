// Raster grain for the figure's surfaces: small tileable PNGs, made here so the build has no
// dependencies. Each texture is one colour with varying alpha; the page tints it per theme and lays
// it onto its plane with the camera's affine map, so the grain sits in the plane like the lines do.
import { deflateSync } from "node:zlib";

const CRC = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return (bytes) => {
    let c = 0xffffffff;
    for (const b of bytes) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
})();
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(CRC(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
// A grey-and-alpha PNG (colour type 4) of one grey level, alpha from `alpha` in 0..1.
export function pngOf(w, h, alpha, grey = 255) {
  const raw = Buffer.alloc((w * 2 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 2 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const i = y * (w * 2 + 1) + 1 + x * 2;
      raw[i] = grey;
      raw[i + 1] = Math.max(0, Math.min(255, Math.round(alpha[y * w + x] * 255)));
    }
  }
  const head = Buffer.alloc(13);
  head.writeUInt32BE(w, 0);
  head.writeUInt32BE(h, 4);
  head[8] = 8;
  head[9] = 4;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", head), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
  return `data:image/png;base64,${png.toString("base64")}`;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Tileable value noise: a lattice of `cells` per side, wrapped, smoothly interpolated.
function lattice(cells, R) {
  const v = new Float32Array(cells * cells);
  for (let i = 0; i < v.length; i++) v[i] = R();
  return (x, y) => {
    const fx = x * cells, fy = y * cells;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = fx - x0, ty = fy - y0;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const at = (i, j) => v[(((j % cells) + cells) % cells) * cells + (((i % cells) + cells) % cells)];
    const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
function fbm(base, octaves, R, gain = 0.5) {
  const layers = Array.from({ length: octaves }, (_, o) => lattice(base << o, R));
  return (x, y) => {
    let sum = 0, amp = 1, norm = 0;
    for (const layer of layers) {
      sum += layer(x, y) * amp;
      norm += amp;
      amp *= gain;
    }
    return sum / norm;
  };
}
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// Stamp a short soft stroke into an alpha field, wrapping at the tile's edges.
function stroke(field, w, h, pts, width, value) {
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.ceil(len * 2));
    for (let k = 0; k <= n; k++) {
      const x = x0 + ((x1 - x0) * k) / n, y = y0 + ((y1 - y0) * k) / n;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const px = Math.floor(x) + dx, py = Math.floor(y) + dy;
          const d = Math.hypot(px + 0.5 - x, py + 0.5 - y);
          const a = value * (1 - smooth(width * 0.5, width * 0.5 + 0.9, d));
          if (a <= 0) continue;
          const j = (((py % h) + h) % h) * w + (((px % w) + w) % w);
          field[j] = Math.max(field[j], a);
        }
      }
    }
  }
}

// Adhesive torn through paper: a pale fibrous grain, thicker in drifts, with loose fibres.
export function fuzzTexture(size = 200, seed = 11) {
  const R = rng(seed);
  const drift = fbm(3, 4, R, 0.55);
  const grain = fbm(24, 3, R, 0.6);
  const a = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const d = drift(u, v);
      const g = grain(u, v);
      const speck = R();
      a[y * size + x] = 0.08 + 0.55 * smooth(0.42, 0.72, d) * smooth(0.35, 0.75, g) + (speck > 0.93 ? 0.35 * smooth(0.4, 0.7, d) : 0) + 0.12 * smooth(0.55, 0.8, g);
    }
  }
  // Loose fibres: short and nearly straight, the odd one kinked, as torn paper sheds them.
  for (let i = 0; i < 150; i++) {
    let x = R() * size, y = R() * size, ang = R() * Math.PI * 2;
    const pts = [[x, y]];
    const steps = 2 + Math.floor(R() * 5);
    const kink = R() < 0.25 ? 1 + Math.floor(R() * steps) : -1;
    for (let k = 0; k < steps; k++) {
      ang += (R() - 0.5) * 0.35 + (k === kink ? (R() - 0.5) * 1.6 : 0);
      x += Math.cos(ang) * 1.5;
      y += Math.sin(ang) * 1.5;
      pts.push([x, y]);
    }
    stroke(a, size, size, pts, 0.35 + R() * 0.3, 0.3 + R() * 0.35);
  }
  return pngOf(size, size, a, 255);
}
// Where the adhesive lies thick: soft dark drifts and the odd fleck of grime.
export function driftTexture(size = 200, seed = 23) {
  const R = rng(seed);
  const body = fbm(4, 5, R, 0.55);
  const fine = fbm(32, 2, R, 0.6);
  const a = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const b = body(u, v), f = fine(u, v);
      a[y * size + x] = 0.42 * smooth(0.45, 0.7, b) + 0.18 * smooth(0.5, 0.75, f) + (R() > 0.985 ? 0.5 : 0);
    }
  }
  return pngOf(size, size, a, 0);
}
// Fired clay: a fine sandy grain with pits.
export function clayTexture(size = 220, seed = 37) {
  const R = rng(seed);
  const body = fbm(5, 4, R, 0.5);
  const fine = fbm(40, 2, R, 0.6);
  const a = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      a[y * size + x] = 0.22 * smooth(0.4, 0.75, body(u, v)) + 0.3 * smooth(0.55, 0.85, fine(u, v)) + (R() > 0.975 ? 0.35 + R() * 0.3 : 0);
    }
  }
  return pngOf(size, size, a, 0);
}
// Mortar: sand in lime, light and dark grains.
export function sandTexture(size = 160, seed = 41, dark = true) {
  const R = rng(seed);
  const fine = fbm(28, 2, R, 0.6);
  const a = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const f = fine(x / size, y / size);
      const r = R();
      a[y * size + x] = (dark ? 0.25 * smooth(0.55, 0.8, f) : 0.2 * smooth(0.25, 0.5, 1 - f)) + (r > (dark ? 0.94 : 0.96) ? 0.45 + R() * 0.4 : 0);
    }
  }
  return pngOf(size, size, a, dark ? 0 : 255);
}
// Label stock: a faint cloud of paper fibre, the formation you see when paper is held to light.
export function paperTexture(size = 180, seed = 59) {
  const R = rng(seed);
  const cloud = fbm(6, 4, R, 0.55);
  const fine = fbm(36, 2, R, 0.6);
  const a = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      a[y * size + x] = 0.16 * smooth(0.42, 0.75, cloud(u, v)) + 0.1 * smooth(0.55, 0.85, fine(u, v));
    }
  }
  for (let i = 0; i < 60; i++) {
    let x = R() * size, y = R() * size, ang = R() * Math.PI * 2;
    const pts = [[x, y]];
    for (let k = 0; k < 4 + Math.floor(R() * 6); k++) {
      ang += (R() - 0.5) * 0.6;
      x += Math.cos(ang) * 2.2;
      y += Math.sin(ang) * 2.2;
      pts.push([x, y]);
    }
    stroke(a, size, size, pts, 0.5, 0.12 + R() * 0.1);
  }
  return pngOf(size, size, a, 0);
}
