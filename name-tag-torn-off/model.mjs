// A blank name sticker torn off a steel plate on a brick wall: one curl that comes away, a ragged
// piece that stays, the residue in between, and the numbers the card reads. Pure: no DOM, no
// imports. The build imports PEEL; the page inlines this file with `export` stripped, so every
// name lives inside PEEL and nothing clashes with anything else on the page.

export const PEEL = (() => {
  const MM = 2; // world units per millimetre
  const RAD = Math.PI / 180;
  const ENV = typeof process !== "undefined" && process.env ? process.env : {};

  // ---- Small vector helpers ------------------------------------------------------------------------
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const unit = (a) => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const smooth = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const mix = (a, b, t) => a + (b - a) * t;
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
  const areaOf = (ring) => {
    let a = 0;
    for (let i = 0; i < ring.length; i++) {
      const [x0, y0] = ring[i];
      const [x1, y1] = ring[(i + 1) % ring.length];
      a += x0 * y1 - x1 * y0;
    }
    return a / 2;
  };
  const inside = (ring, [x, y]) => {
    let c = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };

  // ---- Layout (world units of 0.5 mm; x along the wall, y out of it, z up) ------------------------
  // A fragment of a half-brick wall in running bond, the brick faces in the plane y = 0.
  const BRICK = { l: 388, h: 114, d: 184 }; // US modular, 194 × 57 × 92 mm
  const JOINT = 20; // 10 mm joints, raked 2 mm back
  const RAKE = 4;
  const COURSE = BRICK.h + JOINT;
  const MODULE = BRICK.l + JOINT;
  const BOND = 110; // where the bond sits along the wall
  // Each course's extent: toothed ends, as a wall left mid-build.
  const COURSES = [
    [-300, 294],
    [-298, 206],
    [-250, 294],
    [-298, 250],
  ];
  // The plate: 128 × 88 mm of 3 mm brushed stainless, 6 mm off the bricks on four spacers.
  const PLATE = { x: -128, z: 174, w: 256, h: 176, r: 8 };
  const STANDOFF = 12;
  const PLATE_T = 6;
  const Y_FACE = STANDOFF + PLATE_T;
  const SCREW_IN = 15;

  // The label: an 86 × 59 mm name badge, die-cut with 3.2 mm corners, stuck on by hand a little
  // askew. Its own plane: u to the right, v down the wall, normal N out of the plate.
  const TAG = { w: 86 * MM, h: 59 * MM, r: 3.2 * MM };
  const TAG_T = 0.45;
  const CENTRE = [5, 263]; // x, z on the plate face
  const ROT = -1.4 * RAD;
  const N = [0, 1, 0];
  const E1 = [1, 0, 0];
  const E2 = [0, 0, -1];
  const EX = add(mul(E1, Math.cos(ROT)), mul(E2, Math.sin(ROT)));
  const EY = add(mul(E1, -Math.sin(ROT)), mul(E2, Math.cos(ROT)));
  const FACE0 = [CENTRE[0], Y_FACE, CENTRE[1]]; // the plate face under the label's centre
  const onFace = ([u, v], h = 0) => add(FACE0, add(mul(EX, u), add(mul(EY, v), mul(N, h))));
  const uvDir = ([a, b]) => add(mul(EX, a), mul(EY, b));

  // Peel coordinates in the label plane: d runs from the first corner to lift (top left) toward
  // the bottom right; w runs along the peel front.
  const ALPHA = Number(ENV.NT_ALPHA ?? 45) * RAD;
  const D2 = [Math.cos(ALPHA), Math.sin(ALPHA)];
  const W2 = [-Math.sin(ALPHA), Math.cos(ALPHA)];
  const toDW = ([u, v]) => [u * D2[0] + v * D2[1], u * W2[0] + v * W2[1]];
  const toUV = ([d, w]) => [d * D2[0] + w * W2[0], d * D2[1] + w * W2[1]];
  const DW = uvDir(D2);
  const WW = uvDir(W2);
  const dwDir = ([a, b]) => add(mul(DW, a), mul(WW, b));

  // ---- Camera (the kit's projection and light, copied so this file stands alone) ----------------
  const UNIT = Math.sqrt(1.6);
  const BANDS = [0, 0.2, 0.42, 0.62];
  function camera(P) {
    const a = (P.azimuth ?? 45) * RAD;
    const e = (P.elevation ?? 30) * RAD;
    const sinA = Math.sin(a), cosA = Math.cos(a), sinE = Math.sin(e), cosE = Math.cos(e);
    return { sinA, cosA, sinE, cosE, k: P.scale * UNIT, origin: P.origin, V: [cosA * cosE, sinA * cosE, sinE], L: unit([-sinA, cosA, 1.2]) };
  }
  const project = (C, [x, y, z]) => [C.origin[0] + (x * C.sinA - y * C.cosA) * C.k, C.origin[1] + ((x * C.cosA + y * C.sinA) * C.sinE - z * C.cosE) * C.k];
  const bandOf = (score) => {
    let tone = 0;
    while (tone < BANDS.length && score >= BANDS[tone]) tone++;
    return tone;
  };

  // ---- The label, and the line it tears along ------------------------------------------------------
  function roundedRing({ w, h, r }, steps = 10) {
    const out = [];
    const corners = [[w / 2 - r, -h / 2 + r, -90], [w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 90], [-w / 2 + r, -h / 2 + r, 180]];
    for (const [cx, cy, start] of corners) {
      for (let i = 0; i <= steps; i++) {
        const a = (start + (90 * i) / steps) * RAD;
        out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
    }
    return out;
  }
  const OUTLINE = roundedRing(TAG, 10);
  const OUTLINE_DW = OUTLINE.map(toDW);
  const TAG_AREA = Math.abs(areaOf(OUTLINE));

  // The tear: from the top edge to the bottom edge, wandering, with a fine ragged walk and two
  // tongues where it ran sideways for a moment. A function of v, so it never doubles back.
  const TEAR = (() => {
    const R = rng(311);
    const top = -TAG.h / 2, bottom = TAG.h / 2;
    const n = 120;
    const out = [];
    let jag = 0;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      let u = mix(34, 4, t) + 9 * Math.sin(Math.PI * t * 1.35 + 0.4) + 3.2 * Math.sin(Math.PI * 2 * t * 2.7 + 1.2);
      u += -8 * Math.exp(-(((t - 0.36) / 0.03) ** 2)) + 6 * Math.exp(-(((t - 0.73) / 0.025) ** 2)) - 3 * Math.exp(-(((t - 0.55) / 0.05) ** 2));
      jag = jag * 0.7 + (R() - 0.5) * 1.9;
      const end = Math.min(t, 1 - t) < 0.02 ? 0 : 1;
      out.push([u + jag * end, top + (bottom - top) * t]);
    }
    return out;
  })();

  // Split the outline at the tear's two ends: the left part comes away, the right part stays.
  const SPLIT = (() => {
    const ring = OUTLINE.map((p) => [...p]);
    const insertOn = (p) => {
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i], b = ring[(i + 1) % ring.length];
        if (Math.abs(a[1] - p[1]) < 1e-6 && Math.abs(b[1] - p[1]) < 1e-6 && (p[0] - a[0]) * (p[0] - b[0]) < 0) {
          ring.splice(i + 1, 0, p);
          return;
        }
      }
      throw new Error("tear end not on an edge");
    };
    const A = TEAR[0], B = TEAR[TEAR.length - 1];
    insertOn(A);
    insertOn(B);
    const iA = ring.indexOf(A), iB = ring.indexOf(B);
    const chain = (from, to) => {
      const out = [];
      for (let i = from; ; i = (i + 1) % ring.length) {
        out.push(ring[i]);
        if (i === to) break;
      }
      return out;
    };
    const one = chain(iA, iB), two = chain(iB, iA);
    const leftOf = (c) => Math.min(...c.map((p) => p[0]));
    const left = leftOf(one) < leftOf(two) ? one : two;
    const right = left === one ? two : one;
    const inner = TEAR.slice(1, -1);
    const close = (c) => (c[0] === A ? [...inner].reverse() : inner);
    const flap = [...left, ...close(left)];
    const stuck = [...right, ...close(right)];
    const kindsOf = (c) => [...c.slice(0, -1).map(() => "die"), ...Array(inner.length + 1).fill("tear")];
    return { flap, flapKind: kindsOf(left), stuck, stuckKind: kindsOf(right) };
  })();
  const FLAP = SPLIT.flap;
  const STUCK = SPLIT.stuck;
  const FLAP_DW = FLAP.map(toDW);
  const FLAP_AREA = Math.abs(areaOf(FLAP));
  const D_MIN = Math.min(...OUTLINE_DW.map(([d]) => d));
  const D_END = Math.max(...FLAP_DW.map(([d]) => d));
  const W_MIN = Math.min(...FLAP_DW.map(([, w]) => w));
  const W_MAX = Math.max(...FLAP_DW.map(([, w]) => w));

  // Ear-clip the flap into triangles once; each keeps which of its edges are die-cut or torn.
  function triangulate(pts) {
    const sgn = areaOf(pts) > 0 ? 1 : -1;
    const idx = [...pts.keys()];
    const cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const inTri = (p, a, b, c) => cr(a, b, p) * sgn > 1e-9 && cr(b, c, p) * sgn > 1e-9 && cr(c, a, p) * sgn > 1e-9;
    const tris = [];
    let guard = 0;
    while (idx.length > 3 && guard++ < 200000) {
      let cut = -1;
      for (let i = 0; i < idx.length && cut < 0; i++) {
        const a = pts[idx[(i + idx.length - 1) % idx.length]], b = pts[idx[i]], c = pts[idx[(i + 1) % idx.length]];
        if (cr(a, b, c) * sgn <= 1e-10) continue;
        let ok = true;
        for (const j of idx) {
          const p = pts[j];
          if (p === a || p === b || p === c) continue;
          if (inTri(p, a, b, c)) {
            ok = false;
            break;
          }
        }
        if (ok) cut = i;
      }
      if (cut < 0) {
        // only collinear vertices are left to clip: drop one, the shape is unchanged
        const flat = idx.findIndex((_, i) => Math.abs(cr(pts[idx[(i + idx.length - 1) % idx.length]], pts[idx[i]], pts[idx[(i + 1) % idx.length]])) <= 1e-10);
        if (flat < 0) break;
        idx.splice(flat, 1);
        continue;
      }
      tris.push([idx[(cut + idx.length - 1) % idx.length], idx[cut], idx[(cut + 1) % idx.length]]);
      idx.splice(cut, 1);
    }
    if (idx.length === 3) tris.push([...idx]);
    return tris;
  }
  const TRIS = (() => {
    const n = FLAP_DW.length;
    const kindOf = (a, b) => ((a + 1) % n === b ? SPLIT.flapKind[a] : (b + 1) % n === a ? SPLIT.flapKind[b] : "in");
    return triangulate(FLAP_DW).map(([a, b, c]) => {
      const p = [FLAP_DW[a], FLAP_DW[b], FLAP_DW[c]];
      return { p, kind: [kindOf(a, b), kindOf(b, c), kindOf(c, a)], lo: Math.min(p[0][0], p[1][0], p[2][0]), hi: Math.max(p[0][0], p[1][0], p[2][0]) };
    });
  })();

  // Clip a convex polygon in (d, w) to lo <= d <= hi, carrying each edge's kind; cuts are "cut".
  function clipBand(pts, kinds, lo, hi) {
    let poly = pts.map((p, i) => ({ p, kind: kinds[i] }));
    const pass = (keep, value) => {
      const out = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const ia = keep(a.p), ib = keep(b.p);
        const at = () => {
          const t = (value - a.p[0]) / (b.p[0] - a.p[0]);
          return [value, a.p[1] + (b.p[1] - a.p[1]) * t];
        };
        if (ia && ib) out.push(a);
        else if (ia && !ib) {
          out.push(a);
          out.push({ p: at(), kind: "cut" });
        } else if (!ia && ib) out.push({ p: at(), kind: a.kind });
      }
      poly = out;
    };
    if (lo > -Infinity) pass((p) => p[0] >= lo - 1e-9, lo);
    if (poly.length && hi < Infinity) pass((p) => p[0] <= hi + 1e-9, hi);
    return poly;
  }
  // Long edges get extra points, so a wavy sheet bends along them too.
  function densify(poly, most = 7) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      out.push(a);
      const len = Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1]);
      const k = Math.ceil(len / most);
      for (let j = 1; j < k; j++) out.push({ p: [a.p[0] + ((b.p[0] - a.p[0]) * j) / k, a.p[1] + ((b.p[1] - a.p[1]) * j) / k], kind: a.kind });
    }
    return out;
  }

  // Area of the flap on the peeled side of d = f, and the length of the front across it.
  function peeledArea(f) {
    let a = 0;
    for (const t of TRIS) {
      if (t.lo >= f) continue;
      const poly = clipBand(t.p, t.kind, -Infinity, f);
      if (poly.length >= 3) a += Math.abs(areaOf(poly.map(({ p }) => p)));
    }
    return a;
  }
  function chordAt(f) {
    let len = 0;
    for (const t of TRIS) {
      if (t.lo > f || t.hi < f) continue;
      const ws = [];
      for (let i = 0; i < 3; i++) {
        const a = t.p[i], b = t.p[(i + 1) % 3];
        if ((a[0] - f) * (b[0] - f) <= 0 && a[0] !== b[0]) ws.push(a[1] + ((b[1] - a[1]) * (f - a[0])) / (b[0] - a[0]));
      }
      if (ws.length >= 2) len += Math.max(...ws) - Math.min(...ws);
    }
    return len;
  }

  // ---- The curl -------------------------------------------------------------------------------------
  // Paper bent at a peel front keeps the bend, printed face inside, so the flap rolls up over the
  // part still stuck: a tight bend at the front through the peel angle θ, then a slowly
  // tightening spiral. It is not quite a cylinder: worn paper curls tighter in some places than
  // others along the front, so the sheet waves.
  const DS = 0.5;
  const RC_MIN = 6;
  function profileOf({ theta, rb, k0, beta, f = 0, creases = [] }, sigmaMax) {
    const n = Math.max(2, Math.ceil(sigmaMax / DS) + 2);
    const X = new Float64Array(n), Z = new Float64Array(n), PHI = new Float64Array(n);
    const bendEnd = theta * rb;
    let x = 0, z = 0, phi = 0;
    for (let i = 1; i < n; i++) {
      const s = (i - 0.5) * DS;
      let k = s < bendEnd ? 1 / rb : Math.min(1 / RC_MIN, k0 * Math.exp(beta * Math.max(0, phi - theta)));
      for (const c of creases) if (Math.abs(s - (f - c.d)) < c.w / 2) k += c.a / c.w;
      const mid = phi + (k * DS) / 2;
      x += -Math.cos(mid) * DS;
      z += Math.sin(mid) * DS;
      phi += k * DS;
      X[i] = x;
      Z[i] = z;
      PHI[i] = phi;
    }
    return { X, Z, PHI, n };
  }
  function profileAt(pr, sigma) {
    const t = clamp(sigma / DS, 0, pr.n - 1.000001);
    const i = Math.floor(t);
    const f = t - i;
    return [pr.X[i] + (pr.X[i + 1] - pr.X[i]) * f, pr.Z[i] + (pr.Z[i + 1] - pr.Z[i]) * f, pr.PHI[i] + (pr.PHI[i + 1] - pr.PHI[i]) * f];
  }
  const W_SAMPLES = Array.from({ length: 9 }, (_, i) => W_MIN - 4 + ((W_MAX - W_MIN + 8) * i) / 8);
  const waveK = (w) => 1 + 0.17 * Math.sin(w * 0.061 + 1.1) + 0.07 * Math.sin(w * 0.17 + 0.3);
  const waveT = (w) => 1 + 0.07 * Math.sin(w * 0.045 + 2.1);

  // Where the peel is, as one number s: 0 stuck flat · LIFT the corner is up · 1 the flap tears
  // free · 1 + OFF it has fallen away. The tour and the pointer both drive s.
  const LIFT = 0.12;
  const OFF = 0.34;
  const LIFT_D = 8 * MM;
  const S_END = 1 + OFF;
  const TUNE = {
    liftAngle: 46, peelAngle: 46,
    rbLift: 7, rbPeel: 4.2,
    curlLift: 1 / 200, curlPeel: 1 / 42, curlLate: 1 / 23, // the curl tightens as more paper comes up
    betaLift: 0.03, betaPeel: 0.05,
  };
  // Creases the paper took as it was handled: a sharp one across the corner that was picked with
  // a fingernail, and a soft counter-wrinkle further in. Each is a line of the label (constant d),
  // so it travels with the paper; its angle grows as the peel works it.
  const CREASES = [
    { d: D_MIN + 13, a: 34 * RAD, w: 1.4, early: true },
    { d: D_MIN + 76, a: -13 * RAD, w: 3.2, early: false },
  ];
  function frontAt(s) {
    s = clamp(s, 0, S_END);
    const lift = smooth(0, LIFT, s);
    const peel = clamp((s - LIFT) / (1 - LIFT), 0, 1);
    const run = peel <= 0 ? 0 : peel >= 1 ? 1 : mix(peel, smooth(0, 1, peel), 0.3);
    return Math.min(D_END, D_MIN + LIFT_D * Math.pow(lift, 1.4) + (D_END - D_MIN - LIFT_D) * run);
  }
  function sAtFront(f) {
    let lo = LIFT, hi = 1;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (frontAt(m) < f) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  }
  function stateAt(s) {
    s = clamp(s, 0, S_END);
    const lift = smooth(0, LIFT, s);
    const peel = clamp((s - LIFT) / (1 - LIFT), 0, 1);
    const f = frontAt(s);
    const grow = smooth(0, 0.45, peel);
    const theta = (TUNE.liftAngle * lift + TUNE.peelAngle * grow) * RAD;
    const rb = mix(TUNE.rbLift, TUNE.rbPeel, lift);
    const k0 = mix(0, TUNE.curlLift, lift) + mix(0, TUNE.curlPeel - TUNE.curlLift, grow) + mix(0, TUNE.curlLate - TUNE.curlPeel, smooth(0.35, 1, peel));
    const beta = mix(TUNE.betaLift, TUNE.betaPeel, grow);
    const off = smooth(1, S_END, s);
    const creases = CREASES.filter((c) => c.d < f).map((c) => ({ d: c.d, w: c.w, a: c.a * (c.early ? lift : grow) }));
    return { s, f, theta, rb, k0, beta, off, creases, free: s >= 1, peeled: peeledArea(f) / TAG_AREA, chord: chordAt(f) };
  }

  // Once torn free the flap falls: it drops and swings out from the wall, rolling on about its
  // curl and turning a little as it goes.
  const PIVOT = onFace(toUV(FLAP_DW.reduce((best, q) => (q[0] > best[0] ? q : best))), TAG_T);
  function rotateAbout(p, o, a, angle) {
    const v = sub(p, o);
    const c = Math.cos(angle), s = Math.sin(angle);
    return add(o, add(mul(v, c), add(mul(cross(a, v), s), mul(a, dot(a, v) * (1 - c)))));
  }
  const rotateDir = (v, a, angle) => {
    const c = Math.cos(angle), s = Math.sin(angle);
    return add(mul(v, c), add(mul(cross(a, v), s), mul(a, dot(a, v) * (1 - c))));
  };
  function motionOf(off, place) {
    const e = off * off * (3 - 2 * off);
    return { roll: 34 * RAD * e, spin: -16 * RAD * e, move: add(mul(N, 46 * e + place), [10 * e, 0, -150 * off * off]) };
  }

  // ---- One frame of the sheet ----------------------------------------------------------------------
  function sheetOf(st, { place = 0 } = {}) {
    const sigmaMax = Math.max(0, st.f - D_MIN) + 2;
    const profiles = W_SAMPLES.map((w) => profileOf({ ...st, k0: st.k0 * waveK(w), theta: st.theta * waveT(w) }, sigmaMax));
    const base = onFace([0, 0], TAG_T);
    const m = motionOf(st.off, place);
    const moved = st.off > 0 || place > 0;
    const pose = (p) => {
      if (!moved) return p;
      let q = p;
      if (st.off > 0) q = rotateAbout(rotateAbout(q, PIVOT, WW, m.roll), PIVOT, N, m.spin);
      return add(q, m.move);
    };
    const poseDir = (v) => (st.off > 0 ? rotateDir(rotateDir(v, WW, m.roll), N, m.spin) : v);
    const step = W_SAMPLES[1] - W_SAMPLES[0];
    const shapeAt = (sigma, w) => {
      const t = clamp((w - W_SAMPLES[0]) / step, 0, W_SAMPLES.length - 1.000001);
      const i = Math.floor(t);
      const f = t - i;
      const a = profileAt(profiles[i], sigma), b = profileAt(profiles[i + 1], sigma);
      return [mix(a[0], b[0], f), mix(a[1], b[1], f), mix(a[2], b[2], f)];
    };
    const at = (d, w) => {
      if (d >= st.f) return pose(add(base, dwDir([d, w])));
      const [x, z] = shapeAt(st.f - d, w);
      return pose(add(base, add(dwDir([st.f + x, w]), mul(N, z))));
    };
    const normalAt = (d, w) => {
      if (d >= st.f) return poseDir(N);
      const [, , phi] = shapeAt(st.f - d, w);
      return poseDir(unit(add(mul(DW, Math.sin(phi)), mul(N, Math.cos(phi)))));
    };
    return { st, at, normalAt, poseDir, moved };
  }

  // Strip boundaries in d for the flap: fine through the tight bend, coarser up the curl.
  function cutsOf(st) {
    const cuts = [];
    if (st.f <= D_MIN) return cuts;
    const bend = st.theta * st.rb;
    let sigma = 0;
    cuts.push(st.f);
    while (st.f - sigma > D_MIN) {
      sigma += sigma < bend + 2 ? 0.7 : sigma < bend + 30 ? 1.3 : 2;
      cuts.push(Math.max(D_MIN, st.f - sigma));
    }
    // a cut on each crease and either side of it, so the fold is drawn where it is
    const extra = [];
    for (const c of st.creases || []) for (const d of [c.d - c.w / 2, c.d, c.d + c.w / 2]) if (d > D_MIN && d < st.f - 0.05) extra.push(d);
    if (!extra.length) return cuts;
    const all = [...cuts, ...extra].sort((a, b) => b - a);
    return all.filter((d, i) => i === 0 || all[i - 1] - d > 0.12 || extra.includes(d));
  }

  function frameOf(st, P, { place = 0 } = {}) {
    const C = camera(P);
    const sheet = sheetOf(st, { place });
    const scr = (p) => project(C, p);
    const out = { flat: null, strips: [], sheet, C };
    // Everything still flat: the label ahead of the front, or the whole of a new one coming down.
    // Once the flap is free the piece that stayed is drawn once, statically, so nothing flat moves.
    if (!st.free || place > 0) {
      const poly = clipBand(OUTLINE_DW, OUTLINE_DW.map(() => "die"), st.f, Infinity);
      if (poly.length >= 3) {
        const pts = poly.map(({ p }) => sheet.at(p[0], p[1]));
        out.flat = { pts, kind: poly.map(({ kind }) => kind), dw: poly.map(({ p }) => p) };
      }
    }
    const cuts = cutsOf(st);
    out.cuts = cuts;
    const wMid = (W_MIN + W_MAX) / 2;
    for (let i = 0; i + 1 < cuts.length; i++) {
      const hi = cuts[i], lo = cuts[i + 1];
      if (hi - lo < 1e-6) continue;
      // The torn flap is not convex, so the band's clip can come back as several pieces joined by
      // zero-width bridges along a cut; those are marked so nothing strokes them.
      const poly = clipBand(FLAP_DW, SPLIT.flapKind, lo, hi);
      if (poly.length < 3 || Math.abs(areaOf(poly.map(({ p }) => p))) < 1e-4) continue;
      const m = poly.length;
      const cutCount = poly.reduce((n, q) => n + (q.kind === "cut" ? 1 : 0), 0);
      for (let j = 0; j < m && cutCount > 2; j++) {
        if (poly[j].kind !== "cut") continue;
        const a = poly[j].p, b = poly[(j + 1) % m].p;
        const line = Math.abs(a[0] - lo) < 1e-6 ? lo : hi;
        const nudge = line === lo ? 0.03 : -0.03;
        if (!inside(FLAP_DW, [(a[0] + b[0]) / 2 + nudge, (a[1] + b[1]) / 2])) poly[j] = { p: poly[j].p, kind: "bridge" };
      }
      const dense = densify(poly);
      let wSum = 0;
      for (const { p } of dense) wSum += p[1];
      const mid = (lo + hi) / 2;
      const n = sheet.normalAt(mid, wSum / dense.length);
      const facing = dot(n, C.V);
      const side = facing >= 0 ? "face" : "back";
      out.strips.push({
        index: i, lo, hi, side,
        band: bandOf(dot(side === "face" ? n : mul(n, -1), C.L)),
        facing: Math.abs(facing),
        // Strips are near-straight lines along w; their order is their order across the curl.
        key: dot(sheet.at(mid, wMid), C.V),
        scr: dense.map(({ p }) => scr(sheet.at(p[0], p[1]))),
        kind: dense.map(({ kind }) => kind),
        dw: dense.map(({ p }) => p),
      });
    }
    return out;
  }

  // ---- The name: an illegible marker scribble -------------------------------------------------------
  // A signature dashed off in marker: a big looped capital, a run of humps and loops that never
  // settle into letters, a dropped tail and an underline flung back under the word.
  const SCRIBBLE = (() => {
    const main = [
      [-66, 2], [-61, -6], [-57, -27], [-60, -31], [-63, -22], [-60, -4], [-57, 6], [-52, 9], [-47, 1], [-49, -4],
      [-52, 1], [-46, 4], [-42, -9], [-39, -2], [-36, -10], [-33, -1], [-29, -11], [-26, 1], [-22, -6], [-19, -32],
      [-22, -35], [-23, -24], [-18, 1], [-14, -8], [-11, -10], [-13, -6], [-9, 1], [-5, -9], [-2, -3], [1, -10],
      [4, 0], [7, -5], [9, -27], [6, -29], [7, -14], [11, 1], [14, -6], [16, -1], [16, 12], [12, 18], [8, 14],
      [12, 4], [16, -3], [19, -7], [21.5, -6], [22.5, -2], [23, 1], [25, -5], [27.5, -8.5], [30, -7], [31, -2],
      [31.5, 1], [33.5, -4], [36, -7.5], [38.2, -6], [39, -1.5], [39.6, 1], [42, -4], [45, -11], [47, -14.5],
      [47.2, -10], [46.6, -4], [48.2, 0.5], [51, -1.5], [54, -4.5], [57, -3], [57.5, 2.5], [52, 8], [38, 11.5],
      [14, 13], [-14, 12], [-36, 10.5],
    ];
    const bar = [[-31, -23], [-20, -26], [-6, -25.5]];
    const tittle = [[31, -17], [32.4, -17.6]];
    const smoothStroke = (pts) => {
      const out = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
        const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        const n = Math.max(1, Math.ceil(len / 0.8));
        for (let j = 0; j < n; j++) {
          const t = j / n, t2 = t * t, t3 = t2 * t;
          const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
          out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
        }
      }
      out.push(pts[pts.length - 1]);
      return out;
    };
    // written on a slight upward drift, a little left of centre
    const drift = ([u, v]) => [u - 2, v + 4 - u * 0.06];
    return [main, bar, tittle].map((s) => smoothStroke(s.map(drift)));
  })();
  // Each stroke split where it crosses the tear: runs on the flap and on the piece that stays.
  const INK = (() => {
    const flap = [], stuck = [];
    for (const stroke of SCRIBBLE) {
      let side = inside(FLAP, stroke[0]);
      let run = [stroke[0]];
      for (let i = 1; i < stroke.length; i++) {
        const p = stroke[i];
        const s = inside(FLAP, p);
        if (s !== side) {
          let a = stroke[i - 1], b = p;
          for (let k = 0; k < 24; k++) {
            const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
            if (inside(FLAP, m) === side) a = m;
            else b = m;
          }
          const q = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          run.push(q);
          (side ? flap : stuck).push(run);
          run = [q];
          side = s;
        }
        run.push(p);
      }
      (side ? flap : stuck).push(run);
    }
    return { flap: flap.filter((r) => r.length > 1).map((r) => r.map(toDW)), stuck: stuck.filter((r) => r.length > 1), all: SCRIBBLE.map((s) => s.map(toDW)) };
  })();

  // Polylines on the label, cut where they cross strip boundaries, mapped, keyed by strip (-1 for
  // the flat part). `keep` picks which keys a set of strokes may land in.
  function runsOf(frame, sets) {
    const { sheet, C } = frame;
    const st = sheet.st;
    const cuts = frame.cuts;
    const stripOf = (d) => {
      if (d >= st.f) return -1;
      let lo = 0, hi = cuts.length - 1;
      while (hi - lo > 1) {
        const m = (lo + hi) >> 1;
        if (cuts[m] > d) lo = m;
        else hi = m;
      }
      return lo;
    };
    const runs = new Map();
    const bounds = cuts.length ? cuts : [st.f];
    for (const [strokes, keep] of sets) {
      const push = (key, pts) => {
        if (pts.length < 2 || !keep(key)) return;
        if (!runs.has(key)) runs.set(key, []);
        runs.get(key).push(pts.map((p) => project(C, sheet.at(p[0], p[1]))));
      };
      for (const stroke of strokes) {
        let run = [stroke[0]];
        let key = stripOf(stroke[0][0]);
        let keyA = key;
        for (let i = 1; i < stroke.length; i++) {
          const a = stroke[i - 1], b = stroke[i];
          const keyB = stripOf(b[0]);
          if (keyB === keyA) {
            run.push(b);
            continue;
          }
          keyA = keyB;
          const lo = Math.min(a[0], b[0]), hi = Math.max(a[0], b[0]);
          const ts = bounds.filter((c) => c > lo && c < hi).map((c) => (c - a[0]) / (b[0] - a[0])).sort((x, y) => x - y);
          for (const t of ts) {
            const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
            run.push(p);
            push(key, run);
            key = stripOf(a[0] + (b[0] - a[0]) * Math.min(1, t + 1e-4));
            run = [p];
          }
          run.push(b);
        }
        push(key, run);
      }
    }
    return runs;
  }
  // Ink: ahead of the front all of it is flat, on both sides of the tear-to-be; behind it only the
  // flap's ink moves, and the rest is drawn once, on the piece that stayed.
  function inkOf(frame) {
    const st = frame.sheet.st;
    const sets = [];
    if (frame.flat) sets.push([INK.all, (key) => key === -1]);
    if (st.f > D_MIN) sets.push([INK.flap, (key) => key >= 0]);
    return runsOf(frame, sets);
  }

  // ---- Residue ---------------------------------------------------------------------------------------
  // Where the flap was: the adhesive split, so a fuzz of paper fibre lies in it; the front stuck and
  // slipped, leaving rows of bare spots across it; clean patches where it let go; white islands of
  // paper where it held hardest, by the corner that was picked; a fingernail's scrapes. In (u, v).
  const RESIDUE = (() => {
    const R = rng(9203);
    const blob = (cx, cy, r, k, jag = 0.3, stretch = [1, 1], turn = 0) => {
      const out = [];
      const ph = R() * 6;
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2;
        const rr = r * (1 + jag * (Math.sin(a * 3 + ph) * 0.5 + (R() - 0.5)));
        const x = Math.cos(a) * rr * stretch[0], y = Math.sin(a) * rr * stretch[1];
        out.push([cx + x * Math.cos(turn) - y * Math.sin(turn), cy + x * Math.sin(turn) + y * Math.cos(turn)]);
      }
      return out;
    };
    const inFlap = (p) => inside(FLAP, p);
    const along = Math.atan2(W2[1], W2[0]);
    const stops = [];
    for (let d = D_MIN + 22; d < D_END - 6; d += 10 + R() * 8) stops.push(d);
    const tornEdge = (base, depth, amp) => {
      let pts = base;
      for (let level = 0; level < depth; level++, amp *= 0.5) {
        const next = [];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          const dx = b[0] - a[0], dy = b[1] - a[1];
          const len = Math.hypot(dx, dy) || 1;
          const t = 0.35 + R() * 0.3, off = (R() - 0.5) * 2 * amp;
          next.push(a, [a[0] + dx * t - (dy / len) * off, a[1] + dy * t + (dx / len) * off]);
        }
        pts = next;
      }
      return pts;
    };
    // Rows of bare spots along each stop: small ragged holes, some running together.
    const holes = [];
    const ragged = (cx, cy, r, n, stretch, turn) => {
      const pts = [];
      const ph = R() * 6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const rr = r * (0.62 + 0.25 * Math.sin(a * 2 + ph) + 0.35 * R());
        const x = Math.cos(a) * rr * stretch[0], y = Math.sin(a) * rr * stretch[1];
        pts.push([cx + x * Math.cos(turn) - y * Math.sin(turn), cy + x * Math.sin(turn) + y * Math.cos(turn)]);
      }
      return r > 0.6 ? tornEdge(pts, 1, r * 0.22) : pts;
    };
    for (const d of stops) {
      let w = W_MIN + R() * 4;
      while (w < W_MAX) {
        const run = R() < 0.2 ? 0 : 1;
        const r = 0.7 + R() ** 1.5 * 2.2;
        const [u, v] = toUV([d + (R() - 0.5) * 1.2, w]);
        if (run && inFlap([u, v])) holes.push(ragged(u, v, r, 11, [1.35, 0.7], along + (R() - 0.5) * 0.5));
        w += r * 1.8 + R() * 3.5;
      }
    }
    // Pinholes all over, and a few larger clean patches toward the end of the peel.
    for (let i = 0; i < 70; i++) {
      const p = [(R() - 0.5) * TAG.w, (R() - 0.5) * TAG.h];
      if (inFlap(p)) holes.push(ragged(p[0], p[1], 0.35 + R() * 0.55, 7, [1, 1], R() * 3));
    }
    for (let i = 0; i < 9; i++) {
      const [u, v] = toUV([mix(D_MIN + 50, D_END - 6, Math.sqrt(R())), mix(W_MIN, W_MAX, R())]);
      if (inFlap([u, v])) holes.push(ragged(u, v, 2 + R() * 3, 16, [1.5, 0.8], R() * Math.PI));
    }
    const corner = toUV(FLAP_DW.reduce((best, q) => (q[0] < best[0] ? q : best)));
    // Paper the adhesive kept: torn scraps, most near the corner that was picked. Each is a lumpy
    // oval, longer along the front, its edge broken up at three scales the way paper tears.
    const islands = [];
    for (let i = 0; i < 13; i++) {
      const near = i < 8;
      const [u, v] = near ? [corner[0] + 7 + R() * 24, corner[1] + 6 + R() * 18] : toUV([mix(D_MIN + 20, D_END, R()), mix(W_MIN, W_MAX, R())]);
      if (!inFlap([u, v])) continue;
      const r = near ? 1.4 + R() * 3.2 : 0.7 + R() * 1.4;
      const turn = along + (R() - 0.5) * 0.9;
      const k = 6 + Math.floor(R() * 3);
      const base = [];
      for (let j = 0; j < k; j++) {
        const a = (j / k) * Math.PI * 2 + (R() - 0.5) * 0.5;
        const rr = r * (0.75 + 0.45 * R());
        const x = Math.cos(a) * rr * 1.45, y = Math.sin(a) * rr * 0.75;
        base.push([u + x * Math.cos(turn) - y * Math.sin(turn), v + x * Math.sin(turn) + y * Math.cos(turn)]);
      }
      islands.push(tornEdge(base, 3, r * 0.32));
    }
    const scratches = [];
    for (let i = 0; i < 7; i++) {
      const [u, v] = [corner[0] + 8 + R() * 30, corner[1] + 4 + R() * 26];
      const len = 8 + R() * 20, a = -0.5 + (R() - 0.5) * 0.25;
      const half = 0.22 + R() * 0.18;
      const pts = [];
      for (let k = 0; k <= 10; k++) pts.push([u + Math.cos(a) * len * (k / 10), v + Math.sin(a) * len * (k / 10), half * Math.sin((Math.PI * k) / 10)]);
      scratches.push([...pts.map(([x, y, h]) => [x - Math.sin(a) * h, y + Math.cos(a) * h]), ...pts.map(([x, y, h]) => [x + Math.sin(a) * h, y - Math.cos(a) * h]).reverse()]);
    }
    const specks = [];
    for (let i = 0; i < 90; i++) {
      const p = [(R() - 0.5) * TAG.w, (R() - 0.5) * TAG.h];
      if (inFlap(p)) specks.push([...p, 0.2 + R() * 0.32]);
    }
    return { stops, holes, islands, scratches, specks };
  })();

  // The piece that stayed: along its torn edge the top paper split away and left the fibrous under
  // layer showing, a pale ragged band; loose fibres stand out past the tear.
  const STUCK_EDGE = (() => {
    const R = rng(5507);
    let w = 0;
    const inner = TEAR.map(([u, v], i) => {
      w = w * 0.75 + (R() - 0.2) * 1.5;
      return [u + clamp(1.4 + 2.6 * (0.5 + 0.5 * Math.sin(i * 0.21 + 0.7)) + w, 0.6, 6.5), v];
    });
    const fibres = [];
    for (let i = 2; i < TEAR.length - 2; i++) {
      if (R() < 0.45) continue;
      const [u, v] = TEAR[i];
      const len = 0.8 + R() * 2.4;
      const a = Math.PI + (R() - 0.5) * 1.2;
      fibres.push([[u + 0.2, v], [u + Math.cos(a) * len, v + Math.sin(a) * len]]);
    }
    return { band: [...TEAR, ...[...inner].reverse()], inner, fibres };
  })();

  // The flap's own torn edge: the top layer of paper tore a little beyond the layer under it, so
  // on the flap's back a pale ragged fringe runs along the tear. A line just inside it, in (d, w).
  const FRINGE = (() => {
    const R = rng(4402);
    let w = 0;
    const line = TEAR.slice(1, -1).map(([u, v]) => {
      w = w * 0.7 + (R() - 0.5) * 0.9;
      return toDW([u - 1.5 - Math.abs(w), v]);
    });
    return [line.filter((p) => inside(FLAP_DW, p))];
  })();

  // Fibre the plate did not keep, left on the flap's adhesive side: specks and short fibres in
  // (d, w), drawn wherever the back of the flap faces the viewer, so they move with the paper.
  const BACK_FUZZ = (() => {
    const R = rng(8821);
    const out = [];
    while (out.length < 300) {
      const p = [(R() - 0.5) * TAG.w, (R() - 0.5) * TAG.h];
      if (!inside(FLAP, p)) continue;
      const [d, w] = toDW(p);
      const len = R() < 0.3 ? 1.2 + R() * 2.6 : 0.05;
      const a = R() * Math.PI;
      out.push([[d - (Math.cos(a) * len) / 2, w - (Math.sin(a) * len) / 2], [d + (Math.cos(a) * len) / 2, w + (Math.sin(a) * len) / 2]]);
    }
    return out;
  })();

  // ---- The numbers -----------------------------------------------------------------------------------
  // Kendall's thin-film peel: F = G·b / (1 − cos θ), b the length of the front still on the flap.
  // A label acrylic on steel tears at about G = 100 J/m² (≈ 1.3 N per 25 mm at 180°).
  const G_ADHESIVE = 100;
  function forceAt(st) {
    const b = st.chord / MM / 1000;
    const c = 1 - Math.cos(Math.max(st.theta, 1 * RAD));
    return st.f >= D_END || st.f <= D_MIN + 0.01 ? 0 : (G_ADHESIVE * b) / c;
  }
  const SHARE_OFF = FLAP_AREA / TAG_AREA;

  // Stick-slip timing: the front lingers at each row of bare spots and jumps between them.
  let slipTable = null;
  function slipAt(t) {
    if (!slipTable) {
      const n = 400;
      const f0 = D_MIN + LIFT_D, f1 = D_END;
      const fs = [], ts = [0];
      for (let i = 0; i <= n; i++) fs.push(f0 + ((f1 - f0) * i) / n);
      const dwell = (f) => 1 + 2.2 * RESIDUE.stops.reduce((sum, c) => sum + Math.exp(-(((f - c) / 1.6) ** 2)), 0);
      for (let i = 1; i <= n; i++) ts.push(ts[i - 1] + dwell((fs[i] + fs[i - 1]) / 2) * (fs[i] - fs[i - 1]));
      slipTable = { fs, ts, n, total: ts[n] };
    }
    const { fs, ts, n, total } = slipTable;
    const want = clamp(t, 0, 1) * total;
    let lo = 1, hi = n;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (ts[m] < want) lo = m + 1;
      else hi = m;
    }
    const i = Math.max(1, lo);
    const u = (want - ts[i - 1]) / (ts[i] - ts[i - 1] || 1);
    return fs[i - 1] + (fs[i] - fs[i - 1]) * clamp(u, 0, 1);
  }

  // ---- Paint ------------------------------------------------------------------------------------------
  const fmt = (v) => {
    let n = Math.round(v * 10);
    if (n === 0) return "0";
    const neg = n < 0;
    if (neg) n = -n;
    const i = (n / 10) | 0, d = n - i * 10;
    return (neg ? "-" : "") + i + (d ? "." + d : "");
  };
  const pathOf = (pts, closed = false) => (pts.length ? pts.map(([x, y], i) => `${i ? "L" : "M"}${fmt(x)} ${fmt(y)}`).join("") + (closed ? "Z" : "") : "");
  function hull2(points) {
    const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (p.length < 3) return p;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) {
      while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
      lo.push(q);
    }
    for (let i = p.length - 1; i >= 0; i--) {
      const q = p[i];
      while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
      up.push(q);
    }
    return [...lo.slice(0, -1), ...up.slice(0, -1)];
  }
  // Runs of consecutive polygon edges that pass `want`, as point lists.
  function edgeRuns(scr, kinds, want) {
    const n = scr.length;
    const flags = kinds.map(want);
    const runs = [];
    const start = flags.findIndex((f, i) => f && !flags[(i + n - 1) % n]);
    if (start < 0) return flags.every(Boolean) ? [[...scr, scr[0]]] : [];
    let run = null;
    for (let k = 0; k < n; k++) {
      const i = (start + k) % n;
      if (flags[i]) {
        if (!run) run = [scr[i]];
        run.push(scr[(i + 1) % n]);
      } else if (run) {
        runs.push(run);
        run = null;
      }
    }
    if (run) runs.push(run);
    return runs;
  }

  // A flat piece of label on the plate: its face, the thin paper edge on the sides that face the
  // viewer, its die-cut outline and its torn edge. `flat2` are its points in a plane basis whose
  // directions `dir2` maps to the world; `nrm` is its face normal.
  function slabPaint(C, world, flat2, kinds, dir2, nrm) {
    const n = world.length;
    const sgn = areaOf(flat2) > 0 ? 1 : -1;
    const scr = world.map((p) => project(C, p));
    const below = world.map((p) => project(C, sub(p, mul(nrm, TAG_T))));
    const sides = [[], [], [], []];
    const seen = [];
    for (let i = 0; i < n; i++) {
      const a = flat2[i], b = flat2[(i + 1) % n];
      const ex = b[0] - a[0], ey = b[1] - a[1];
      const l = Math.hypot(ex, ey) || 1;
      const o3 = unit(dir2([(sgn * ey) / l, (-sgn * ex) / l]));
      const sees = kinds[i] !== "cut" && dot(o3, C.V) > 1e-6;
      seen.push(sees);
      if (sees) sides[Math.min(3, bandOf(dot(o3, C.L)))].push(pathOf([scr[i], scr[(i + 1) % n], below[(i + 1) % n], below[i]], true));
    }
    const die = edgeRuns(scr, kinds, (k) => k === "die").map((r) => pathOf(r));
    const tear = edgeRuns(scr, kinds, (k) => k === "tear").map((r) => pathOf(r));
    const lower = edgeRuns(below, kinds.map((k, i) => seen[i] && k === "die"), (k) => k).map((r) => pathOf(r));
    const lowerTear = edgeRuns(below, kinds.map((k, i) => seen[i] && k === "tear"), (k) => k).map((r) => pathOf(r));
    return {
      fill: pathOf(scr, true),
      under: pathOf(scr, true) + pathOf(below, true),
      sides: sides.map((list) => list.join("")),
      band: bandOf(dot(nrm, C.L)),
      edge: [...die, ...lower].join(""),
      tear: [...tear, ...lowerTear].join(""),
    };
  }

  const CAST = [0.22, 0, -0.33]; // shadow offset per mm of height, as the plate's: 4 mm right, 6 mm down for 18 mm
  function paintOf(st, P, { place = 0 } = {}) {
    const frame = frameOf(st, P, { place });
    const C = frame.C;
    const ink = inkOf(frame);
    const out = { halo: "", haloOpacity: 0, haloBlur: 3, flat: null, strips: [] };
    // Shadow: everything off the plate, cast back onto it by the light from the upper left. It falls
    // down and to the right, the same way the plate's own shadow falls from its spacers.
    const lifted = [];
    let heights = 0, count = 0;
    const drop = (p) => {
      const h = dot(sub(p, FACE0), N);
      lifted.push(project(C, add(sub(p, mul(N, h)), mul(CAST, Math.max(0, h)))));
      heights += h;
      count++;
    };
    frame.strips.forEach((strip, i) => {
      if (i % 3 && i !== frame.strips.length - 1) return;
      strip.dw.forEach((p, j) => j % 3 || drop(frame.sheet.at(p[0], p[1])));
    });
    if (frame.flat && place > 0) for (const p of frame.flat.pts) drop(p);
    if (lifted.length >= 3) {
      const mean = heights / count;
      out.halo = pathOf(hull2(lifted), true);
      out.haloOpacity = clamp(0.2 + mean / 70, 0.2, 0.55) * (1 - smooth(25, 95, mean)) * (1 - smooth(0.2, 0.6, st.off));
      out.haloBlur = clamp(2.5 + mean / 5, 2.5, 12);
    }
    if (frame.flat) {
      const { pts, kind, dw } = frame.flat;
      const nrm = frame.sheet.poseDir(N);
      out.flat = slabPaint(C, pts, dw, kind, (v) => frame.sheet.poseDir(dwDir(v)), nrm);
      out.flat.ink = (ink.get(-1) || []).map((r) => pathOf(r)).join("");
    }
    // The curl, far to near. A strip's outline and ink go in the slot of whichever of it and its
    // two neighbours comes last, so the neighbours' fills never notch them at the joints.
    const strips = [...frame.strips].sort((a, b) => a.key - b.key);
    const byIndex = new Map(frame.strips.map((s) => [s.index, s]));
    const order = new Map(strips.map((s, i) => [s.index, i]));
    const slots = strips.map((s) => ({
      fill: pathOf(s.scr, true),
      side: s.side, band: s.band, edge: [], tear: [], seam: [], crease: [], ink: [], ghost: [], fuzz: [], fringe: [],
      width: clamp(s.facing / dot(N, C.V), 0.3, 1.3),
    }));
    strips.forEach((s, at) => {
      const near = Math.max(at, order.get(s.index - 1) ?? -1, order.get(s.index + 1) ?? -1);
      const slot = slots[near];
      const n = s.scr.length;
      const kinds = s.kind.map((kind, i) => {
        if (kind !== "cut") return kind;
        const a = s.dw[i], b = s.dw[(i + 1) % n];
        const onLo = Math.abs(a[0] - s.lo) < 1e-6 && Math.abs(b[0] - s.lo) < 1e-6;
        const onHi = Math.abs(a[0] - s.hi) < 1e-6 && Math.abs(b[0] - s.hi) < 1e-6;
        const other = onLo ? byIndex.get(s.index + 1) : onHi ? byIndex.get(s.index - 1) : null;
        if (other && other.side !== s.side) return "fold";
        const line = onLo ? s.lo : onHi ? s.hi : null;
        return line !== null && st.creases.some((c) => Math.abs(c.d - line) < 1e-6 && Math.abs(c.a) > 4 * RAD) ? "crease" : "cut";
      });
      for (const run of edgeRuns(s.scr, kinds, (k) => k === "die" || k === "fold")) slot.edge.push(pathOf(run));
      for (const run of edgeRuns(s.scr, kinds, (k) => k === "tear")) slot.tear.push(pathOf(run));
      for (const run of edgeRuns(s.scr, kinds, (k) => k === "crease")) slot.crease.push(pathOf(run));
      // The joints with the neighbours get a hairline of the strip's own paper, so no seam shows.
      for (const run of edgeRuns(s.scr, kinds, (k) => k === "cut" || k === "crease")) slots[at].seam.push(pathOf(run));
      const d = (ink.get(s.index) || []).map((r) => pathOf(r)).join("");
      if (s.side === "face") slot.ink.push(d);
      else slot.ghost.push(d);
    });
    // The pale fringe along the torn edge, where the back of the flap shows.
    const fringe = runsOf(frame, [[FRINGE, (key) => key >= 0]]);
    for (const s of strips) {
      if (s.side !== "back") continue;
      const at = order.get(s.index);
      const near = Math.max(at, order.get(s.index - 1) ?? -1, order.get(s.index + 1) ?? -1);
      for (const r of fringe.get(s.index) || []) slots[near].fringe.push(pathOf(r));
    }
    // Fibre on the back, in the slot that draws each strip's outline.
    const cuts = frame.cuts;
    for (const [a, b] of BACK_FUZZ) {
      const m = (a[0] + b[0]) / 2;
      if (m >= st.f || !cuts.length) continue;
      let lo = 0, hi = cuts.length - 1;
      while (hi - lo > 1) {
        const k = (lo + hi) >> 1;
        if (cuts[k] > m) lo = k;
        else hi = k;
      }
      const strip = byIndex.get(lo);
      if (!strip || strip.side !== "back") continue;
      const at = order.get(lo);
      const near = Math.max(at, order.get(lo - 1) ?? -1, order.get(lo + 1) ?? -1);
      const pa = project(C, frame.sheet.at(a[0], a[1]));
      const pb = b[0] - a[0] < 0.1 && b[0] - a[0] > -0.1 && b[1] - a[1] < 0.1 && b[1] - a[1] > -0.1 ? [pa[0] + 0.05, pa[1]] : project(C, frame.sheet.at(b[0], b[1]));
      slots[near].fuzz.push(pathOf([pa, pb]));
    }
    out.strips = slots.map((slot) => ({ ...slot, edge: slot.edge.join(""), tear: slot.tear.join(""), seam: slot.seam.join(""), ink: slot.ink.join(""), ghost: slot.ghost.join(""), fuzz: slot.fuzz.join(""), crease: slot.crease.join(""), fringe: slot.fringe.join("") }));
    return out;
  }

  // The piece that stayed, painted once by the build exactly as the flat label is painted live.
  function stuckPaint(P) {
    const C = camera(P);
    const world = STUCK.map((p) => onFace(p, TAG_T));
    const paint = slabPaint(C, world, STUCK, SPLIT.stuckKind, uvDir, N);
    paint.ink = INK.stuck.map((r) => pathOf(r.map((p) => project(C, onFace(p, TAG_T))))).join("");
    return paint;
  }

  return {
    TUNE, MM, BRICK, JOINT, RAKE, COURSE, MODULE, BOND, COURSES, PLATE, STANDOFF, PLATE_T, Y_FACE, SCREW_IN,
    TAG, TAG_T, CENTRE, ROT, EX, EY, N, D_MIN, D_END, LIFT, OFF, S_END, OUTLINE, FLAP, STUCK, TEAR, SPLIT, TRIS,
    SCRIBBLE, INK, RESIDUE, STUCK_EDGE, G_ADHESIVE, TAG_AREA, FLAP_AREA, SHARE_OFF,
    frontAt, sAtFront, slipAt, toDW, toUV, onFace, uvDir, camera, project, bandOf, stateAt, sheetOf, frameOf, inkOf, cutsOf,
    paintOf, stuckPaint, pathOf, hull2, peeledArea, chordAt, forceAt, profileOf, profileAt, rng, smooth, clamp, mix, inside, areaOf,
  };
})();
