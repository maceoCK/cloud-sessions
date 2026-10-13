// The car: a small rear-drive coupe with pop-up lamps, built from convex prisms in its own frame and
// re-projected every frame at its yaw. Runs in Node (the build's still) and in the page (the live car):
// `G` is the kit's lathe module, `k` gives iso, pathOf, solidSvg, lineSvg and dotsSvg.
// Car frame: f forward, l left, up; units are the model's 0.2 m.

export const CAR_SHAPE = {
  half: 4.2,
  axles: [6.0, -6.0],
  track: 3.55,
  wheel: 1.55,
  tyre: 1.0,
};

// Clip a polygon whose first coordinate is the car's forward axis to one side of f = cut.
export function clipF(poly, cut, keepAbove, offset = 0) {
  if (cut === null || cut === undefined) return poly;
  const inside = (p) => (keepAbove ? p[0] + offset >= cut : p[0] + offset <= cut);
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ia = inside(a);
    const ib = inside(b);
    if (ia) out.push(a);
    if (ia !== ib) {
      const t = (cut - offset - a[0]) / (b[0] - a[0]);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

export function carSvg(pose, P, G, k, { lamps = true, brake = 0, cut = null, keepAbove = true } = {}) {
  const { x, y, z, yaw, steer = 0 } = pose;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const F = [c, s, 0];
  const Lf = [-s, c, 0];
  const UP = [0, 0, 1];
  const V = G.viewOf(P);
  const Lt = G.lightOf(P);
  const at = (f, l, u) => [x + c * f - s * l, y + s * f + c * l, z + u];
  const scr = (f, l, u) => k.iso(at(f, l, u), P);
  const side = Math.sign(G.dot3(Lf, V)) || 1; // +1 when the car's left side faces the viewer
  const frame = (o) => G.frameOf(o, Lf, F, UP);
  const keep = (f) => cut === null || (keepAbove ? f >= cut : f <= cut);
  const prism = (poly, l0, l1, origin = [x, y, z]) => {
    const clipped = clipF(poly, cut, keepAbove);
    return clipped.length > 2 ? G.prismOf(frame(origin), clipped, l0, l1, P) : null;
  };
  const solid = (paths, style) => (paths ? k.solidSvg(paths, style) : "");
  const parts = [];
  const put = (key, svg) => parts.push({ key, svg });
  const depthOf = (f, l, u) => G.dot3(at(f, l, u), V);
  const H = CAR_SHAPE.half;

  // shadow on the road
  const shadow = [[-10.6, -H - 0.4], [10.6, -H - 0.4], [10.9, 0], [10.6, H + 0.4], [-10.6, H + 0.4], [-10.9, 0]].map(([f, l]) => scr(f, l, 0));
  const halo = cut === null ? `<path class="iso-halo cr-car-halo" d="${k.pathOf(shadow, true)}"/>` : "";

  // wheels: far side first, then the arches' inner tubs
  const wheel = (fa, la, steerAngle) => {
    const cs = Math.cos(yaw + steerAngle);
    const sn = Math.sin(yaw + steerAngle);
    const centre = at(fa, la, CAR_SHAPE.wheel);
    const Fw = G.frameOf(centre, [-sn, cs, 0], [cs, sn, 0], UP);
    const ring = Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return [Math.cos(a) * CAR_SHAPE.wheel, Math.sin(a) * CAR_SHAPE.wheel];
    });
    const out = Math.sign(la);
    const clipped = clipF(ring, cut, keepAbove, fa);
    if (clipped.length < 3) return "";
    const tyre = G.prismOf(Fw, clipped, -CAR_SHAPE.tyre / 2, CAR_SHAPE.tyre / 2, P);
    let svg = k.solidSvg(tyre, { tone: "mid", className: "cr-tyre" });
    const face = Fw.a.map((v) => v * out);
    if (G.dot3(face, V) > 0.05 && keep(fa - CAR_SHAPE.wheel) && keep(fa + CAR_SHAPE.wheel)) {
      const rim = Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r = CAR_SHAPE.wheel * 0.58;
        return k.iso(G.add3(centre, G.add3(G.mul3(Fw.a, (out * CAR_SHAPE.tyre) / 2), G.add3(G.mul3(Fw.u, Math.cos(a) * r), G.mul3(Fw.v, Math.sin(a) * r)))), P);
      });
      svg += `<path class="cr-rim" d="${k.pathOf(rim, true)}"/>`;
    }
    return svg;
  };
  const near = (l) => Math.sign(l) === side;
  for (const fa of CAR_SHAPE.axles) {
    for (const l of [CAR_SHAPE.track, -CAR_SHAPE.track]) {
      const svg = wheel(fa, l, fa > 0 ? steer : 0);
      if (!near(l)) parts.push({ key: -1e6 + depthOf(fa, l, 1), svg });
      else put(depthOf(fa, l + side * 0.6, 1.5), svg);
    }
  }
  for (const fa of CAR_SHAPE.axles) put(-5e5 + depthOf(fa, 0, 2), solid(prism([[fa - 1.8, 1.6], [fa + 1.8, 1.6], [fa + 1.8, 3.25], [fa - 1.8, 3.25]], -2.8, 2.8), { tone: "lo", className: "cr-tub" }));

  // lower body in three pieces between the wheel arches
  const front = CAR_SHAPE.axles[0];
  const rear = CAR_SHAPE.axles[1];
  const arch = 1.85;
  const lower = [
    [[front + arch, 1.05], [10.35, 1.25], [10.8, 2.05], [10.75, 3.25], [front + arch, 3.25]],
    [[rear + arch, 0.95], [front - arch, 0.95], [front - arch, 3.25], [rear + arch, 3.25]],
    [[-10.55, 1.3], [rear - arch, 1.1], [rear - arch, 3.3], [-10.75, 3.3], [-10.85, 2.2]],
  ];
  for (const poly of lower) {
    const fc = poly.reduce((a, p) => a + p[0], 0) / poly.length;
    put(depthOf(fc, 0, 2) + 0.01, solid(prism(poly, -H, H), { tone: "hi", lit: true, crease: "lo", className: "cr-lower" }));
  }
  parts.sort((a, b) => a.key - b.key);
  const ordered = parts.map((p) => p.svg);
  parts.length = 0;

  // the beltline body over the arches, with door shut lines on the side we see
  const upper = [[-10.75, 3.25], [10.75, 3.25], [10.55, 3.85], [9.6, 4.15], [3.6, 4.4], [-6.6, 4.35], [-10.2, 4.25], [-10.75, 3.95]];
  const doors = [[2.5, 0.95, 4.35], [-3.4, 0.95, 4.37]].filter(([f]) => keep(f)).map(([f, u0, u1]) => k.pathOf([scr(f, side * (H + 0.02), u0 + 0.35), scr(f, side * (H + 0.02), u1 - 0.12)])).join("");
  const handle = keep(-2.2) && keep(-1.2) ? k.pathOf([scr(-2.2, side * (H + 0.03), 3.7), scr(-1.2, side * (H + 0.03), 3.7)]) : "";
  ordered.push(solid(prism(upper, -H, H), { tone: "hi", lit: true, crease: "lo", inner: k.lineSvg(doors + handle, { tone: "lo", free: true }) }));

  // cabin, glass, mirrors, lamp pods and the wing, sorted together
  const cabin = [[3.6, 4.4], [0.2, 6.35], [-4.0, 6.4], [-7.4, 4.35]];
  const cabinSvg = () => {
    let svg = solid(prism(cabin, -3.5, 3.5), { tone: "hi", lit: true, crease: "lo" });
    if (cut !== null) return svg;
    // glass on every cabin face we can see, inset from its edges
    const glassFaces = [];
    const shrink = (pts, by) => {
      const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
      const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      return pts.map(([px, py]) => [cx + (px - cx) * by, cy + (py - cy) * by]);
    };
    // windscreen and back glass
    for (const [a, b, n] of [[cabin[0], cabin[1], [0.5, 0, 0.87]], [cabin[2], cabin[3], [-0.55, 0, 0.83]]]) {
      const nw = G.add3(G.mul3(F, n[0]), G.mul3(UP, n[2]));
      if (G.dot3(nw, V) <= 0) continue;
      const quad = [scr(a[0], -3.05, a[1] + 0.15), scr(a[0], 3.05, a[1] + 0.15), scr(b[0], 3.05, b[1] - 0.15), scr(b[0], -3.05, b[1] - 0.15)];
      glassFaces.push(quad);
    }
    // side glass on the near side: front quarter, door glass and rear quarter
    const sl = side * 3.52;
    const win = shrink([[3.1, 4.6], [0.35, 6.12], [-3.85, 6.15], [-6.75, 4.55]], 0.92).map(([f, u]) => scr(f, sl, u));
    glassFaces.push(win);
    svg += `<path class="cr-glass-pane" d="${glassFaces.map((q) => k.pathOf(q, true)).join("")}"/>`;
    svg += k.lineSvg(k.pathOf([scr(-0.9, sl, 4.5), scr(-0.95, sl, 6.2)]), { tone: "lo" });
    return svg;
  };
  const group = [];
  group.push({ key: depthOf(-1.6, 0, 5.3), svg: cabinSvg() });
  for (const l of [H - 0.1, -(H - 0.1)]) {
    const m = prism([[1.6, 4.75], [2.7, 4.75], [2.7, 5.45], [1.9, 5.45]], l - 0.1, l + 0.8 * Math.sign(l) - 0.1);
    group.push({ key: depthOf(2.2, l + Math.sign(l) * 0.4, 5.1) + (near(l) ? 0.5 : -0.5), svg: solid(m, { tone: "hi", lit: true, crease: "lo" }) });
  }
  // pop-up lamps, raised: two pods on the nose, their lenses face forward
  for (const l of [2.55, -2.55]) {
    const podPoly = lamps ? [[7.6, 4.2], [9.25, 4.2], [9.25, 5.35], [7.9, 5.35]] : [[7.6, 4.2], [9.4, 4.2], [9.4, 4.45], [7.6, 4.45]];
    let svg = solid(prism(podPoly, l - 1.05, l + 1.05), { tone: "hi", lit: true, crease: "lo" });
    if (lamps && G.dot3(F, V) > 0.02 && keep(9.27)) {
      const lens = [scr(9.27, l - 0.85, 4.35), scr(9.27, l + 0.85, 4.35), scr(9.27, l + 0.85, 5.2), scr(9.27, l - 0.85, 5.2)];
      svg += `<path class="cr-lens" d="${k.pathOf(lens, true)}"/>`;
    }
    group.push({ key: depthOf(8.4, l, 4.8), svg });
  }
  // rear wing on two stands
  const wing = solid(prism([[-10.4, 5.05], [-8.5, 5.15], [-8.5, 5.4], [-10.5, 5.35]], -3.9, 3.9), { tone: "hi", lit: true, crease: "lo" });
  const stands = [2.6, -2.6].map((l) => solid(prism([[-9.8, 4.2], [-9.2, 4.2], [-9.2, 5.1], [-9.8, 5.1]], l - 0.25, l + 0.25), { tone: "mid" })).join("");
  group.push({ key: depthOf(-9.5, 0, 4.8), svg: stands + wing });
  group.sort((a, b) => a.key - b.key);
  ordered.push(...group.map((g) => g.svg));

  // lamps on the body faces: grille lamps, tail lights, plates
  const faceOver = [];
  if (G.dot3(F, V) > 0.02 && keep(10.8)) {
    faceOver.push(`<path class="cr-plate" d="${k.pathOf([scr(10.8, -1.4, 1.75), scr(10.8, 1.4, 1.75), scr(10.8, 1.4, 2.4), scr(10.8, -1.4, 2.4)], true)}"/>`);
    for (const l of [3.2, -3.2]) faceOver.push(`<path class="cr-lens cr-fog" d="${k.pathOf([scr(10.78, l - 0.55, 2.55), scr(10.78, l + 0.55, 2.55), scr(10.78, l + 0.55, 2.95), scr(10.78, l - 0.55, 2.95)], true)}"/>`);
  }
  if (G.dot3(F, V) < -0.02 && keep(-10.77)) {
    for (const l of [2.6, -2.6]) {
      const d = k.pathOf([scr(-10.77, l - 1.15, 3.3), scr(-10.77, l + 1.15, 3.3), scr(-10.77, l + 1.15, 3.9), scr(-10.77, l - 1.15, 3.9)], true);
      faceOver.push(`<path class="cr-tail" d="${d}"/>`);
      if (brake > 0.01) faceOver.push(`<path class="cr-tail cr-brake" fill-opacity="${brake.toFixed(2)}" d="${d}"/>`);
    }
    faceOver.push(`<path class="cr-plate" d="${k.pathOf([scr(-10.8, -1.4, 2.05), scr(-10.8, 1.4, 2.05), scr(-10.8, 1.4, 2.7), scr(-10.8, -1.4, 2.7)], true)}"/>`);
  }
  // tail lights wrap round the rear corners, so the near side shows a sliver from the side too
  if (keep(-10.7)) {
    const d = k.pathOf([scr(-10.7, side * H, 3.4), scr(-9.9, side * H, 3.4), scr(-9.9, side * H, 3.9), scr(-10.7, side * H, 3.9)], true);
    faceOver.push(`<path class="cr-tail cr-wrap" d="${d}"/>`);
    if (brake > 0.01) faceOver.push(`<path class="cr-tail cr-brake" fill-opacity="${brake.toFixed(2)}" d="${d}"/>`);
  }
  return halo + `<g class="cr-car-body">${ordered.join("")}${faceOver.join("")}</g>`;
}

// ---- the windsock: a striped truncated cone on a swivel, streaming downwind --------------------------
// `wind` is metres per second, `heading` the direction it blows toward. A sock is full at 7.7 m/s (15 kn).
export function windOf(t) {
  const speed = 10.5 + 2.4 * Math.sin(t * 0.71) + 1.4 * Math.sin(t * 1.93 + 1.1) + 0.7 * Math.sin(t * 4.3 + 0.4);
  const heading = Math.PI + 0.16 + 0.1 * Math.sin(t * 1.27) + 0.05 * Math.sin(t * 3.1);
  return { speed, heading };
}

export function sockSvg(at, wind, P, G, k) {
  const [x, y, z] = at;
  const top = z + 30;
  const fill = Math.min(1, wind.speed / 7.7);
  const droop = (1 - fill) * 1.05 + 0.04 * Math.sin(wind.speed * 3.1);
  const dir = [Math.cos(wind.heading) * Math.cos(droop), Math.sin(wind.heading) * Math.cos(droop), -Math.sin(droop)];
  const V = G.viewOf(P);
  const parts = [];
  parts.push(k.solidSvg(G.disc(0, 1.2, 1.6, G.frameOf([x, y, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]), P), { tone: "lo" }));
  parts.push(k.solidSvg(G.disc(1.2, 31, 0.45, G.frameOf([x, y, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]), P), { tone: "mid", crease: "none" }));
  const mouth = [x + dir[0] * 0.8, y + dir[1] * 0.8, top + dir[2] * 0.8];
  const F = G.frameAlong(mouth, dir);
  const length = 18;
  const bands = [];
  for (let i = 0; i < 5; i++) {
    const s0 = (i / 5) * length;
    const s1 = ((i + 1) / 5) * length;
    const r = (s) => 2.3 - (1.3 * s) / length;
    const paths = G.lathe([[s0, 0], [s0, r(s0)], [s1, r(s1)], [s1, 0]], F, P, { steps: 24, rims: i === 0 ? "first" : i === 4 ? "last" : "none" });
    bands.push({ key: G.dot3(G.add3(mouth, G.mul3(dir, (s0 + s1) / 2)), V), svg: k.solidSvg(paths, { tone: "hi", crease: "lo", className: i % 2 ? "cr-sock" : "cr-sock cr-sock-band" }) });
  }
  // the ring that holds the mouth open, and the swivel arm to the pole
  parts.push(k.lineSvg(k.pathOf([k.iso([x, y, top], P), k.iso(mouth, P)]), { tone: "mid" }));
  bands.sort((a, b) => a.key - b.key);
  parts.push(...bands.map((b) => b.svg));
  return parts.join("");
}
