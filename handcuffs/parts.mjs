// parts.mjs: pure part builders, imported by build.mjs and inlined (in a namespace) into the page.
// makeParts(k, P, D) uses only the iso-kit functions it is handed (iso, pathOf, cameraOf, towardViewer, solidSvg, lineSvg),
// so the static picture and every live frame come from the same code.
// Geometry is built in the truth frame F (design.md B.1) and mirrored to the kit world W at the projection boundary.
export function makeParts(k, P, D) {
  const Z0 = 4.8;                                                       // F z 0 (the frame plate's mid plane) sits at W z 4.8
  const W = ([x, y, z = 0]) => [x, -y, z + Z0];
  const mir = (ring) => ring.map(([x, y]) => [x, -y]);                  // F plan → W plan (winding reverses; indices are kept)
  const rotF = ([x, y], [cx, cy], a) => { const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
    return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]; };
  const mapB = ([x, y]) => [214 - x, -y];                               // cuff B local → F (design.md C8)
  const at = (p) => k.iso(p, P);

  // ---- strap (scratch/proto/strap.mjs, proved in proto2): a flat prism whose bore walls are painted first, clipped to the bore
  const { sinA, cosA } = k.cameraOf(P);
  const V = k.towardViewer(P);
  const area = (pts) => pts.reduce((s, [x, y], i) => { const [u, v] = pts[(i + 1) % pts.length]; return s + x * v - u * y; }, 0) / 2;
  const orient = (pts) => (area(pts) < 0 ? [...pts].reverse() : pts);
  const runsBy = (keys) => {
    const n = keys.length, out = [];
    const start = keys.findIndex((key, i) => key !== keys[(i + n - 1) % n]);
    if (start < 0) return keys[0] === null ? [] : [{ key: keys[0], edges: keys.map((_, i) => i) }];
    let run = null;
    for (let s = 0; s < n; s++) {
      const i = (start + s) % n;
      if (run && keys[i] === run.key) run.edges.push(i);
      else { if (run) out.push(run); run = keys[i] === null ? null : { key: keys[i], edges: [i] }; }
    }
    if (run) out.push(run);
    return out;
  };
  // strapPaths: a flat prism (top at z + h) seen from above. Self-occlusion is resolved by painting, never by guessing:
  // the front-facing outer walls are grouped into facing runs (a run's walls advance one way across the screen, so they never
  // overlap each other), the runs are painted far → near (where two runs overlap across the screen, the one whose top edge is
  // nearer the viewer at that place goes later), each run with its own shades, bottom line and end verticals, and the top face
  // is painted after every wall, so whatever wall, line or vertical lies under the top face is hidden by it (a tooth's locking
  // face on the far flank, the tail jog at the hinge). Only the top face's own boundary is stroked above it.
  function strapPaths(ringIn, z, h, { inner = () => false, cav = () => false, bevel = 0 } = {}) {
    const n0 = ringIn.length, keep = [];
    for (let i = 0; i < n0; i++) {                                      // drop zero-length edges (duplicated vertices); flags stay per edge
      const [ax, ay] = ringIn[i], [bx, by] = ringIn[(i + 1) % n0];
      if (Math.hypot(bx - ax, by - ay) > 1e-6) keep.push(i);
    }
    const ring = keep.map((i) => ringIn[i]);
    const isIn = keep.map((i) => Boolean(inner(i)));
    const isCav = keep.map((i) => Boolean(cav(i)));
    const n = ring.length;
    const ccw = area(ring) > 0;
    const normals = ring.map(([ax, ay], i) => {
      const [bx, by] = ring[(i + 1) % n];
      const l = Math.hypot(bx - ax, by - ay) || 1;
      return ccw ? [(by - ay) / l, -(bx - ax) / l] : [-(by - ay) / l, (bx - ax) / l];
    });
    const facing = normals.map(([nx, ny]) => nx * V[0] + ny * V[1] > 1e-9);
    const shade = normals.map(([nx, ny]) => Math.min(3, Math.max(0, Math.floor(((nx * -sinA + ny * cosA + 1) / 2) * 4))));
    const top = ring.map(([x, y]) => at([x, y, z + h]));
    const bot = ring.map(([x, y]) => at([x, y, z]));
    const strip = (edges) => {
      const b = (edges[edges.length - 1] + 1) % n;
      return k.pathOf(orient([...edges.map((i) => top[i]), top[b], bot[b], ...edges.slice().reverse().map((i) => bot[i])]), true);
    };
    const line = (edges, row) => k.pathOf([...edges.map((i) => row[i]), row[(edges[edges.length - 1] + 1) % n]]);
    const vert = (i) => k.pathOf([top[i], bot[i]]);
    const topD = k.pathOf(orient(top), true);
    const fill = [topD], outline = [], crease = [], inLines = [], inShades = [[], [], [], []], walls = [];
    for (const { key, edges } of runsBy(facing.map((f, i) => (f ? (isIn[i] ? "in" : isCav[i] ? "cav" : "out") : "away")))) {
      const first = edges[0], end = (edges[edges.length - 1] + 1) % n, before = (first + n - 1) % n;
      if (key === "away") { outline.push(line(edges, top)); continue; }
      crease.push(line(edges, top));
      const shades = key === "in" ? inShades : [[], [], [], []];
      let sub = null;
      for (const i of edges) {                                          // the run's walls, one strip per shade step
        if (sub && shade[i] === shade[sub[0]]) sub.push(i);
        else { if (sub) shades[shade[sub[0]]].push(strip(sub)); sub = [i]; }
      }
      shades[shade[sub[0]]].push(strip(sub));
      if (key === "in") {                                               // bore walls: painted first, clipped to the bore (strapSvg)
        inLines.push(line(edges, bot));
        if (!facing[before] && !isIn[before]) inLines.push(vert(first));
        if (!facing[end] && !isIn[end]) inLines.push(vert(end));
        continue;
      }
      fill.push(strip(edges));
      const lines = [line(edges, bot)];
      if (!facing[before]) lines.push(vert(first));
      if (!facing[end]) lines.push(vert(end));
      const pts = [...edges, end];
      walls.push({ shades, lines, cav: key === "cav", plan: pts.map((i) => ring[i]), u: pts.map((i) => uOf(top[i])) });
    }
    let bev;
    if (bevel > 0) {
      const inset = ring.map(([x, y], i) => {
        const [ax, ay] = normals[(i + n - 1) % n];
        const [bx, by] = normals[i];
        const l = Math.hypot(ax + bx, ay + by) || 1;
        return at([x - ((ax + bx) / l) * bevel, y - ((ay + by) / l) * bevel, z + h]);
      });
      bev = runsBy(facing.map((f, i) => (f && !isIn[i] ? 1 : null))).map(({ edges }) => k.pathOf([top[edges[0]], ...edges.slice(1).map((i) => inset[i]), top[(edges[edges.length - 1] + 1) % n]])).join("") || undefined;
    }
    return {
      body: { fill: fill.join(""), strips: fill.slice(1).join(""), top: topD, outline: outline.join(""), crease: crease.join(""), bevel: bev, walls: farToNear(walls) },
      inside: { shades: inShades.map((l) => l.join("")), lines: inLines.join("") },
    };
  }
  // across-screen coordinate: perpendicular to the screen image of +z, so vertical walls overlap only where their u ranges do
  const zImg = (() => { const a = at([0, 0, 0]), b = at([0, 0, 1]), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(a[1] - b[1]) / l, (b[0] - a[0]) / l]; })();
  const uOf = ([x, y]) => x * zImg[0] + y * zImg[1];
  const nearness = ([x, y]) => x * V[0] + y * V[1];                     // plan distance toward the viewer (larger is nearer)
  function chainAt(w, u) {                                              // the run's top edge (plan) where it crosses u
    for (let j = 0; j + 1 < w.u.length; j++) {
      const a = w.u[j], b = w.u[j + 1];
      if ((a - u) * (b - u) <= 0) { const t = Math.abs(b - a) < 1e-9 ? 0 : (u - a) / (b - a); return [w.plan[j][0] + (w.plan[j + 1][0] - w.plan[j][0]) * t, w.plan[j][1] + (w.plan[j + 1][1] - w.plan[j][1]) * t]; }
    }
    return null;
  }
  function farToNear(walls) {
    const m = walls.length;
    if (m < 2) return walls;
    const span = walls.map((w) => [Math.min(...w.u), Math.max(...w.u)]);
    const mid = walls.map((w) => nearness(w.plan[Math.floor(w.plan.length / 2)]));
    const after = walls.map(() => []), deg = new Array(m).fill(0);
    for (let a = 0; a < m; a++) for (let b = a + 1; b < m; b++) {
      const lo = Math.max(span[a][0], span[b][0]), hi = Math.min(span[a][1], span[b][1]);
      if (hi - lo < 0.05) continue;                                     // no shared screen column: either order is right
      const u = (lo + hi) / 2, pa = chainAt(walls[a], u), pb = chainAt(walls[b], u);
      if (!pa || !pb) continue;
      const [far, near] = nearness(pa) <= nearness(pb) ? [a, b] : [b, a];
      after[far].push(near); deg[near]++;
    }
    const out = [], ready = walls.map((_, i) => i).filter((i) => !deg[i]);
    while (out.length < m) {
      if (!ready.length) {                                              // a cycle cannot happen for one simple ring; fall back on mid depth
        const rest = walls.map((_, i) => i).filter((i) => !out.includes(walls[i])).sort((p, q) => mid[p] - mid[q]);
        ready.push(rest[0]); deg[rest[0]] = 0;
      }
      ready.sort((p, q) => mid[q] - mid[p]);
      const i = ready.pop();
      if (out.includes(walls[i])) continue;
      out.push(walls[i]);
      for (const j of after[i]) if (--deg[j] === 0) ready.push(j);
    }
    return out;
  }
  function strapSvg(paths, clipId, clipD, style = {}) {
    const shades = paths.inside.shades.map((d, s) => (d ? `<path class="iso-shade" data-shade="${s}" d="${d}"/>` : "")).join("");
    const lines = paths.inside.lines ? `<path class="iso-line iso-crease" data-tone="${style.crease ?? "faint"}" d="${paths.inside.lines}"/>` : "";
    const inside = shades || lines ? `<clipPath id="${clipId}"><path d="${clipD}"/></clipPath><g class="iso-solid${style.boreClass ? ` ${style.boreClass}` : ""}" clip-path="url(#${clipId})">${shades}${lines}</g>` : "";
    const b = paths.body, tone = style.tone ?? "hi", crease = style.crease ?? "faint", holes = style.holes ?? "";
    // holes (the window, the keyhole, the slot) are evenodd holes in the fill and the top; the strips stay nonzero
    const parts = holes ? [`<path class="iso-fill" fill-rule="evenodd" d="${b.top}${holes}"/>`, b.strips ? `<path class="iso-fill" d="${b.strips}"/>` : ""] : [`<path class="iso-fill" d="${b.fill}"/>`];
    for (const w of b.walls) {                                          // far → near, each wall run with its own edges
      const run = [];
      w.shades.forEach((list, s) => { if (list.length) run.push(`<path class="iso-shade" data-shade="${s}" d="${list.join("")}"/>`); });
      run.push(`<path class="iso-line iso-edge" data-tone="${tone}" d="${w.lines.join("")}"/>`);
      parts.push(w.cav ? `<g class="hc-cavity">${run.join("")}</g>` : run.join(""));
    }
    const topPath = `<path class="iso-top"${holes ? ' fill-rule="evenodd"' : ""} d="${b.top}${holes}"/>`;
    parts.push(style.topClass ? `<g class="${style.topClass}">${topPath}</g>` : topPath);
    if (crease !== "none" && b.crease) parts.push(`<path class="iso-line iso-crease" data-tone="${crease}" d="${b.crease}"/>`);
    if (crease !== "none" && b.bevel) parts.push(`<path class="iso-line iso-bevel" data-tone="${crease}" d="${b.bevel}"/>`);
    if (style.holeInner) parts.push(style.holeInner);
    if (style.inner) parts.push(style.inner);
    if (b.outline || holes) parts.push(`<path class="iso-line iso-edge" data-tone="${tone}" d="${b.outline}${holes}"/>`);
    return inside + `<g class="iso-solid${style.className ? ` ${style.className}` : ""}"${style.lit ? ' data-lit=""' : ""}>${parts.join("")}</g>`;
  }

  // ---- a strap in F: mirrored to W; its bore clip is the bore opening (the inner run closed by a chord) at the top and bottom faces
  const innerOf = (runs) => (i) => runs.some(([a, b]) => i >= a && i <= b);
  function boreClip(ringF, runs, zTop, zBot) {
    return runs.map(([a, b]) => {
      const pts = Array.from({ length: b - a + 2 }, (_, i) => ringF[(a + i) % ringF.length]);
      return [zTop, zBot].map((z) => k.pathOf(pts.map(([x, y]) => at(W([x, y, z]))), true)).join("");
    }).join("");
  }
  function strapF(ringF, z, h, { runs = [], cav = () => false, bevel = 0, clipId, style = {} } = {}) {
    const paths = strapPaths(mir(ringF), z + Z0, h, { inner: innerOf(runs), cav, bevel });
    return strapSvg(paths, clipId, runs.length ? boreClip(ringF, runs, z + h, z) : "", style);
  }

  // ---- cuff parts (D carries truth-geometry.json rings and their inner runs, see build.mjs)
  const Zc = { rear: -4.3, frame: -1.9, jaw: -1.8, front: 1.9 };
  const jawRing = (theta, map = (p) => p) => D.jaw.map((p) => map(rotF(p, [0, 0], theta)));
  // anti-pry groove (C3 #64): the arc r 61.0 on the jaw top, from the nose outline to the tail step (ends land on outlines)
  function grooveOf(theta, map = (p) => p, z = 1.8) {
    const [a0, a1] = D.groove, pts = [];
    const steps = Math.max(8, Math.ceil(Math.abs(a1 - a0) / 2));
    for (let i = 0; i <= steps; i++) { const a = ((a0 + ((a1 - a0) * i) / steps + theta) * Math.PI) / 180; pts.push(map([61.0 * Math.cos(a), 61.0 * Math.sin(a)])); }
    return k.pathOf(pts.map(([x, y]) => at(W([x, y, z]))));
  }
  function jawSvg(theta, { map, clipId, tone = "hi" } = {}) {
    const ring = jawRing(theta, map);                                   // cuff B's map keeps vertex order, so the inner runs still apply
    return strapF(ring, Zc.jaw, 3.6, { runs: D.jawRuns, bevel: 0.3, clipId, style: { tone, crease: "lo", inner: k.lineSvg(grooveOf(theta, map), { tone: "faint" }) } });
  }
  function cheekSvg(which, { map, clipId, tone = "mid" } = {}) {
    const ring = map ? D.cheek.map(map) : D.cheek;
    return strapF(ring, Zc[which], 2.4, { runs: D.cheekRuns, bevel: 0.4, clipId, style: { tone, crease: "lo" } });
  }
  function frameSvg({ map, clipId, tone = "mid" } = {}) {
    const ring = map ? D.frame.map(map) : D.frame;
    return strapF(ring, Zc.frame, 3.8, { runs: D.frameRuns, bevel: 0, clipId, style: { tone, crease: "lo" } });
  }

  // ---- holes in a plate (C2 #53–55): far walls of a hole ring (the wall's normal points into the hole and toward the viewer),
  // shaded by facing, with their under-edges and the silhouette verticals at each run's ends (so every line ends on the rim)
  function holeWalls(ringF, z0, z1, keepF = () => true) {
    const n = ringF.length, flip = area(mir(ringF)) < 0;               // CCW in W: the hole is on the left of each edge
    const ring = flip ? mir(ringF).reverse() : mir(ringF);
    const keep = (i) => (flip ? keepF((2 * n - 2 - i) % n) : keepF(i)); // edge i of the reversed ring is edge n − 2 − i of the F ring
    const shades = [[], [], [], []], runs = [];
    let run = null;
    const T = (p) => at([p[0], p[1], z1 + Z0]), B = (p) => at([p[0], p[1], z0 + Z0]);
    const faces = ring.map((a, i) => {
      const b = ring[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (l < 1e-6) return null;
      const nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l;
      return keep(i) && nx * V[0] + ny * V[1] > 1e-9 ? Math.min(3, Math.max(0, Math.floor(((nx * -sinA + ny * cosA + 1) / 2) * 4))) : -1;
    });
    const start = faces.findIndex((f, i) => f === -1 && faces[(i + 1) % n] !== -1);
    for (let s = 1; s <= n; s++) {
      const i = (start + s) % n, f = faces[i];
      if (f === null) continue;
      if (f < 0) { if (run) { runs.push(run); run = null; } continue; }
      const a = ring[i], b = ring[(i + 1) % n];
      shades[f].push(k.pathOf([T(a), T(b), B(b), B(a)], true));
      if (!run) run = [a];
      run.push(b);
    }
    if (run) runs.push(run);
    const unders = runs.map((r) => k.pathOf([T(r[0]), ...r.map(B), T(r[r.length - 1])])).join("");
    return { shades: shades.map((l) => l.join("")), unders };
  }
  const holeD = (ringF, z) => k.pathOf(ringF.map(([x, y]) => at(W([x, y, z]))), true);
  function holeWallsSvg(ringF, z0, z1, clipId, cls = "hc-cut", keep) {   // walls clipped to the hole's rim (top), in their own token set
    const w = holeWalls(ringF, z0, z1, keep);
    const shades = w.shades.map((d, s) => (d ? `<path class="iso-shade" data-shade="${s}" d="${d}"/>` : "")).join("");
    return `<clipPath id="${clipId}"><path d="${holeD(ringF, z1)}"/></clipPath><g class="iso-solid ${cls}" clip-path="url(#${clipId})">${shades}` +
      (w.unders ? `<path class="iso-line iso-edge" data-tone="lo" d="${w.unders}"/>` : "") + `</g>`;
  }
  // closed outline of a ring offset into the material by d(i) per vertex (a milled chamfer at the top face)
  function offsetRing(ringF, dOf) {
    const n = ringF.length, sgn = area(ringF) > 0 ? -1 : 1;              // CCW hole: material on the right
    return ringF.map((p, i) => {
      const a = ringF[(i + n - 1) % n], b = ringF[(i + 1) % n];
      const n1 = norm([p[1] - a[1], a[0] - p[0]]), n2 = norm([b[1] - p[1], p[0] - b[0]]);
      const m = norm([n1[0] + n2[0], n1[1] + n2[1]]), c = Math.max(0.5, m[0] * n2[0] + m[1] * n2[1]), d = dOf(i) / c;
      return [p[0] - sgn * m[0] * d, p[1] - sgn * m[1] * d];
    });
  }
  const norm = ([x, y]) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };

  // ---- ribbon: a polyline (F) offset ±t/2 into a closed ring (the spring is a thin leaf on edge)
  function ribbon(line, t) {
    const pts = line.filter((p, i) => i === 0 || Math.hypot(p[0] - line[i - 1][0], p[1] - line[i - 1][1]) > 1e-6);
    const n = pts.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], p = pts[i];
      const d1 = norm(i > 0 ? [p[0] - a[0], p[1] - a[1]] : [b[0] - p[0], b[1] - p[1]]);
      const d2 = norm(i < n - 1 ? [b[0] - p[0], b[1] - p[1]] : d1);
      const m = norm([-(d1[1] + d2[1]), d1[0] + d2[0]]), c = Math.max(0.4, m[0] * -d2[1] + m[1] * d2[0]), h = t / 2 / c;
      L.push([p[0] + m[0] * h, p[1] + m[1] * h]); R.push([p[0] - m[0] * h, p[1] - m[1] * h]);
    }
    return [...L, ...R.reverse()];
  }
  // split a polyline at arc length s from its start
  function splitAt(line, s) {
    let acc = 0;
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1], b = line[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (acc + l >= s) { const t = (s - acc) / (l || 1), q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; return [[...line.slice(0, i), q], [q, ...line.slice(i)]]; }
      acc += l;
    }
    return [line, [line[line.length - 1]]];
  }
  // Sutherland–Hodgman: any subject polygon clipped by a convex polygon
  function clipConvex(subject, clip) {
    const cw = area(clip) < 0, out0 = subject;
    let out = out0;
    for (let i = 0; i < clip.length && out.length; i++) {
      const a = clip[i], b = clip[(i + 1) % clip.length];
      const inside = (p) => { const c = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); return cw ? c <= 0 : c >= 0; };
      const cross = (p, q) => { const d1 = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]), d2 = (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]), t = d1 / (d1 - d2); return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; };
      const inp = out; out = [];
      inp.forEach((p, j) => { const q = inp[(j + 1) % inp.length]; const pi = inside(p), qi = inside(q); if (pi) out.push(p); if (pi !== qi) out.push(cross(p, q)); });
    }
    return out;
  }

  // ---- lock mechanism (C4), rebuilt per frame: pawl (α about the hub), spring (centreline from model.springCentreline), tab skin
  const HUB = D.hub;
  const pawlRing = (alpha) => D.pawl.map((p) => rotF(p, HUB, alpha));
  const topD = (ringF, z) => k.pathOf(ringF.map(([x, y]) => at(W([x, y, z]))), true);
  const BIG = (() => { const a = at(W([-300, -300, 0])), b = at(W([400, 300, 0])), r = Math.max(...a.map(Math.abs), ...b.map(Math.abs)) * 4; return `M${-r} ${-r}H${r}V${r}H${-r}Z`; })();
  function hull(pts) {                                                  // screen convex hull (monotone chain)
    const q = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], hi = [];
    for (const p of q) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of q.reverse()) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    return [...lo.slice(0, -1), ...hi.slice(0, -1)];
  }
  // The strand's top face (z 1.8) is above the pawl (z ≤ 1.5) everywhere, so wherever it covers the pawl on screen the strand
  // is in front: at the mesh the teeth interleave (a painter cycle no slot can resolve), so the pawl, drawn after the strand,
  // is clipped out of the strand's top face (the evenodd hole in its clip).
  function pawlSvg(alpha, { lit = true, jaw = null, clipId = "clip-pawlA" } = {}) {
    const hubW = W([HUB[0], HUB[1], 1.5]);
    const body = strapF(pawlRing(alpha), -1.5, 3.0, { bevel: 0.2, clipId: "", style: { tone: "hi", crease: "lo", lit, inner: k.lineSvg(k.ring(hubW[0], hubW[1], 1.2, hubW[2], P, 28), { tone: "lo" }) } });
    return jaw ? `<clipPath id="${clipId}"><path clip-rule="evenodd" d="${BIG}${topD(jaw, 1.8)}"/></clipPath><g clip-path="url(#${clipId})">${body}</g>` : body;
  }
  const TAB_LEN = 0.45;
  // the region beside the pawl's notched edge (pawl-local, α 0): the V notches 59 and 61 and the open side x > edge
  const BESIDE = [[71.5, -7.1], [68.0, -7.1], [67.6, -6.7], [68.0, -6.3], [67.95, -3.1], [67.55, -2.7], [67.95, -2.3], [67.93, 0.5], [71.5, 0.5]];
  function springRings(line, alpha) {                                   // line: tab first (model.springCentreline(u, α))
    const [tab, body] = splitAt(line, TAB_LEN);
    const tabLocal = ribbon(tab, 0.5).map((p) => rotF(p, HUB, -alpha));
    const skin = clipConvex(BESIDE, area(tabLocal) < 0 ? [...tabLocal].reverse() : tabLocal).map((p) => rotF(p, HUB, alpha));
    return { body: ribbon(body, 0.5), tab: skin };
  }
  // The spring wraps the pawl's head: the U-detent and the legs are in front of it, the flange behind its shoulder once the
  // pawl lifts. The spring is drawn after the pawl; inside the flange zone Q it is clipped out of the pawl's top face.
  function springSvg(line, alpha, { lit = true, u = 0, clipId = "clip-springA" } = {}) {
    const body = strapF(springRings(line, alpha).body, -1.5, 3.0, { bevel: 0.1, clipId: "", style: { tone: "hi", crease: "lo", lit } });
    const zone = [[69.0, -16.2 - u], [72.8, -16.2 - u], [72.8, -14.5 - u], [69.0, -14.5 - u]];
    const q = hull(zone.flatMap(([x, y]) => [at(W([x, y, -1.5])), at(W([x, y, 1.5]))]));
    const qD = k.pathOf(q, true);
    return `<clipPath id="${clipId}-a"><path clip-rule="evenodd" d="${BIG}${qD}"/></clipPath><clipPath id="${clipId}-b"><path clip-rule="evenodd" d="${qD}${topD(pawlRing(alpha), 1.5)}"/></clipPath>` +
      `<g clip-path="url(#${clipId}-a)">${body}</g><g clip-path="url(#${clipId}-b)">${body}</g>`;
  }
  function tabSvg(line, alpha, { lit = true } = {}) {
    const ring = springRings(line, alpha).tab;
    return ring.length >= 3 ? strapF(ring, 1.4, 0.1, { clipId: "", style: { tone: "hi", crease: "none", lit } }) : "";
  }

  return { Z0, W, mir, rotF, mapB, strapPaths, strapSvg, strapF, jawRing, jawSvg, grooveOf, cheekSvg, frameSvg,
    holeWalls, holeWallsSvg, holeD, offsetRing, ribbon, splitAt, clipConvex, pawlRing, pawlSvg, springRings, springSvg, tabSvg };
}

// ---- key (C5): S&W pattern, NIJ standard. makeKey(k, G, P) uses the iso-kit functions in k and the lathe functions in G.
// Key-local: s runs along the axis from the barrel tip (0) to the pin tip (45.7); x along the flag direction; y = the ring normal.
// keyFrame(pose) places it: pose = { tip: F xyz, phi: flip angle about F y (0 upright, 180 inverted), kappa: turn (upright only) }.
export function makeKey(k, G, P) {
  const Z0 = 4.8;
  const W = ([x, y, z = 0]) => [x, -y, z + Z0];
  const Wd = ([x, y, z]) => [x, -y, z];                                 // an F direction in W
  const V = G.viewOf(P);
  const D2R = Math.PI / 180;
  const LEN = 45.7, FLIP_S = 22.85, RING_S = 32.2;
  // profiles without smooth knots: the kit's smooth silhouette fit costs 2–4 ms a part per frame (S3 bench); at 7 px/mm the
  // 0.3 tip chamfer, the neck's cone and the pin's tip chamfer read the same faceted
  const BARREL = [[0, 1.55], [0.3, 1.765], [24.6, 1.765]];
  // the bow ring (C5 #73): 2.0 thick (|w| ≤ 1 about its plane), r 5.05 … 7.6 about s 32.2. The neck (r 2.2) and the boss (r 1.4)
  // are wider than the ring is thick, so each is a collar through the ring's rim with a lobe proud of each face (S3 gate round 3)
  const RING_IN = 5.05, RING_OUT = 7.6, RING_T = 1.0;
  const NECK_END = RING_S - Math.sqrt(RING_OUT ** 2 - 2.2 ** 2);       // 24.93: the neck's r 2.2 rim lands on the ring's outer circle
  const NECK = [[23.6, 1.765], [24.6, 2.2], [NECK_END, 2.2]];         // design C5 #72 runs to 25.3, inside the ring (design.md I.52)
  const BOSS = [[39.3, 1.4], [39.8, 1.4]];                             // s 39.3 … 39.8 (design C5 #75 says 39.4 … 40.4; see BUILD-LOG S3)
  const BOSS_IN = RING_S + Math.sqrt(RING_OUT ** 2 - 1.4 ** 2);        // 39.67: the ring's outer circle at the boss's rim
  const BOSS_CORE = [[BOSS_IN, 1.4], [39.8, 1.4]];                     // the boss outside the ring; its lobes run 39.3 … 39.8
  const PIN = [[39.8, 0.95], [45.3, 0.95], [45.7, 0.55]];
  const FLAG = [[1.715, -0.51], [3.445, -0.51], [3.445, 0.51], [1.715, 0.51]];
  const FLAG_LEN = 3.18;
  // axis, flag direction and ring normal in F for a pose
  // roll (the key turned about its own axis, after the flip): 0 for every station but the board, where the key lies flat
  // (phi 90, roll −90: axis along F +x, flag toward F +y, ring plane horizontal). It leaves the axis, so tipOfCentre is unchanged
  function axesOf({ phi = 0, kappa = 0, roll = 0 }) {
    const p = phi * D2R;
    const a = [Math.sin(p), 0, Math.cos(p)];
    const ps = (180 + kappa) * D2R;
    let u = Math.abs(phi) < 1e-9 ? [Math.cos(ps), Math.sin(ps), 0] : [-Math.cos(p), 0, Math.sin(p)];
    let v = [a[1] * u[2] - a[2] * u[1], a[2] * u[0] - a[0] * u[2], a[0] * u[1] - a[1] * u[0]];
    if (roll) {
      const c = Math.cos(roll * D2R), sn = Math.sin(roll * D2R);
      [u, v] = [u.map((x, i) => x * c + v[i] * sn), v.map((x, i) => x * c - u[i] * sn)];
    }
    return { a, u, v };
  }
  // W frame of the key: o = W(tip), a/u/v the F axes mirrored into W
  function frameOfKey(pose) {
    const { a, u, v } = axesOf(pose);
    return { o: W(pose.tip), a: Wd(a), u: Wd(u), v: Wd(v) };
  }
  const tipOfCentre = (C, pose) => { const { a } = axesOf(pose); return [C[0] - a[0] * FLIP_S, C[1] - a[1] * FLIP_S, C[2] - a[2] * FLIP_S]; };
  const centreOf = (pose) => { const { a } = axesOf(pose); return [pose.tip[0] + a[0] * FLIP_S, pose.tip[1] + a[1] * FLIP_S, pose.tip[2] + a[2] * FLIP_S]; };
  const pointAt = (pose, s) => { const { a } = axesOf(pose); return [pose.tip[0] + a[0] * s, pose.tip[1] + a[1] * s, pose.tip[2] + a[2] * s]; };
  // a lathe profile kept to s ∈ [lo, hi] (interpolated ends become flat caps)
  function clipProfile(prof, lo, hi) {
    const out = [];
    const rAt = (s) => { for (let i = 0; i + 1 < prof.length; i++) { const [s0, r0] = prof[i], [s1, r1] = prof[i + 1]; if (s >= s0 && s <= s1) return r0 + ((r1 - r0) * (s - s0)) / (s1 - s0 || 1); } return null; };
    const a = Math.max(lo, prof[0][0]), b = Math.min(hi, prof[prof.length - 1][0]);
    if (b - a < 1e-3) return null;
    out.push([a, rAt(a)]);
    for (const p of prof) if (p[0] > a + 1e-6 && p[0] < b - 1e-6) out.push(p);
    out.push([b, rAt(b)]);
    return out;
  }
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  const L = G.lightOf(P);
  const signedArea = (pts) => pts.reduce((a, [x, y], i) => { const [nx, ny] = pts[(i + 1) % pts.length]; return a + x * ny - nx * y; }, 0);
  // Sutherland–Hodgman: a polygon clipped to a convex polygon (screen)
  function clipTo(poly, clip) {
    const ccw = signedArea(clip) > 0;
    let out = poly;
    for (let i = 0; i < clip.length && out.length; i++) {
      const A = clip[i], B = clip[(i + 1) % clip.length];
      const side = (p) => { const c = (B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0]); return ccw ? c : -c; };
      const inp = out; out = [];
      for (let j = 0; j < inp.length; j++) {
        const p = inp[j], q = inp[(j + 1) % inp.length], sp = side(p), sq = side(q);
        if (sp >= 0) out.push(p);
        if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
      }
    }
    return out;
  }
  const insideConvex = (p, clip) => { const ccw = signedArea(clip) > 0; for (let i = 0; i < clip.length; i++) { const A = clip[i], B = clip[(i + 1) % clip.length]; const c = (B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0]); if (ccw ? c < 0 : c > 0) return false; } return true; };
  // the eye's bore wall (the ring's inner cylinder, 2.0 deep): the kit's ringBand cuts the face hole but draws no inner wall, so
  // anything painted before the ring showed through the whole front opening (the neck's cap at the bottom of the eye). Facets of
  // the wall that face the viewer, clipped to the front opening, plus the back rim where it is seen through the opening.
  function boreSvg(RF, face, tone, n = 96) {
    const uV = dot(RF.u, V), vV = dot(RF.v, V);
    const fr = [], bk = [];
    for (let j = 0; j < n; j++) { const t = (j / n) * 2 * Math.PI; fr.push(k.iso(G.pointOf(RF, face, RING_IN, t), P)); bk.push(k.iso(G.pointOf(RF, -face, RING_IN, t), P)); }
    const buckets = [[], [], [], [], []], all = [];
    for (let j = 0; j < n; j++) {
      const t = ((j + 0.5) / n) * 2 * Math.PI, c = Math.cos(t), sn = Math.sin(t);
      if (-(c * uV + sn * vV) <= 1e-6) continue;                         // the inward normal faces away: the near wall, hidden
      const nL = -(c * dot(RF.u, L) + sn * dot(RF.v, L));
      const q = clipTo([fr[j], fr[(j + 1) % n], bk[(j + 1) % n], bk[j]], fr);
      if (q.length < 3) continue;
      const d = k.pathOf(q, true);
      buckets[G.bandOf(nL)].push(d); all.push(d);
    }
    if (!all.length) return "";
    // the back rim inside the front opening, ended exactly on the opening's outline
    const inside = bk.map((p) => insideConvex(p, fr));
    const cross = (p, q) => { let a = 0, b = 1; for (let i = 0; i < 30; i++) { const m = (a + b) / 2, x = [p[0] + (q[0] - p[0]) * m, p[1] + (q[1] - p[1]) * m]; if (insideConvex(x, fr) === insideConvex(p, fr)) a = m; else b = m; } const m = (a + b) / 2; return [p[0] + (q[0] - p[0]) * m, p[1] + (q[1] - p[1]) * m]; };
    const chains = [];
    const start = inside.findIndex((v, j) => !v && inside[(j + 1) % n]);
    if (start >= 0) {
      let cur = null;
      for (let i = 1; i <= n; i++) {
        const j = (start + i) % n, jp = (start + i - 1 + n) % n;
        if (inside[j] && !inside[jp]) cur = [cross(bk[jp], bk[j]), bk[j]];
        else if (inside[j] && cur) cur.push(bk[j]);
        else if (!inside[j] && cur) { cur.push(cross(bk[jp], bk[j])); chains.push(cur); cur = null; }
      }
      if (cur) chains.push(cur);
    }
    const paths = { fill: all.join(""), outline: chains.map((c) => k.pathOf(c)).join(""), crease: "", top: buckets[4].join(""), shades: buckets.slice(0, 4).map((l) => l.join("")) };
    return k.solidSvg(paths, { tone });
  }
  // a collar's lobe: the part of a round collar (r, s0 … s1) proud of one ring face (σ = +1 the face toward the viewer, −1 the
  // other). A prism of the circle segment |w| ≥ 1. open: the ends that continue into the collar (no edge there; a faint crease on
  // the open end the neck's profile corner sits on); chordOpen: the end whose face continues across w = ±1 (no chord line)
  function lobeSvg(F, faceSign, sigma, r, s0, s1, { open0 = false, open1 = false, chordOpen1 = false, crease0 = false, tone }) {
    if (s1 - s0 < 1e-3) return "";
    const w0 = Math.asin(RING_T / r), m = 12, side = faceSign * sigma;
    const poly = [];
    for (let i = 0; i <= m; i++) { const t = side > 0 ? w0 + ((Math.PI - 2 * w0) * i) / m : Math.PI + w0 + ((Math.PI - 2 * w0) * i) / m; poly.push([r * Math.cos(t), r * Math.sin(t)]); }
    const paths = G.prismOf(F, poly, s0, s1, P);
    // the outline: the projected hull, less the edges on an open end and the chord on a chord-open end
    const at = (s, [x, y]) => k.iso([F.o[0] + F.a[0] * s + F.u[0] * x + F.v[0] * y, F.o[1] + F.a[1] * s + F.u[1] * x + F.v[1] * y, F.o[2] + F.a[2] * s + F.u[2] * x + F.v[2] * y], P);
    const pts = [];
    poly.forEach((q, j) => { pts.push({ p: at(s0, q), e: 0, j }); pts.push({ p: at(s1, q), e: 1, j }); });
    const sorted = pts.slice().sort((a, b) => a.p[0] - b.p[0] || a.p[1] - b.p[1]);
    const turn = (o, a, b) => (a.p[0] - o.p[0]) * (b.p[1] - o.p[1]) - (a.p[1] - o.p[1]) * (b.p[0] - o.p[0]);
    const lower = [], upper = [];
    for (const q of sorted) { while (lower.length >= 2 && turn(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
    for (const q of sorted.slice().reverse()) { while (upper.length >= 2 && turn(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
    const hull = [...lower.slice(0, -1), ...upper.slice(0, -1)];
    const last = poly.length - 1;
    const keep = (a, b) => {
      if (a.e !== b.e) return true;
      if ((a.e === 0 && open0) || (a.e === 1 && open1)) return false;
      const chord = (a.j === 0 && b.j === last) || (a.j === last && b.j === 0);
      return !(chord && a.e === 1 && chordOpen1);
    };
    const chains = [];
    const H = hull.length, k0 = hull.findIndex((a, i) => !keep(a, hull[(i + 1) % H]));
    if (k0 < 0) chains.push([...hull.map((q) => q.p), hull[0].p]);
    else {
      let cur = null;
      for (let i = 1; i <= H; i++) {
        const a = hull[(k0 + i) % H], b = hull[(k0 + i + 1) % H];
        if (keep(a, b)) { if (!cur) cur = [a.p]; cur.push(b.p); }
        else if (cur) { chains.push(cur); cur = null; }
      }
      if (cur) chains.push(cur);
    }
    paths.outline = chains.map((c) => k.pathOf(c)).join("");
    if (crease0) {                                                       // the neck's profile corner (s 24.6) runs on across the lobe
      const ex = [];
      for (let j = 0; j < last; j++) {
        const t = Math.atan2(poly[j][1] + poly[j + 1][1], poly[j][0] + poly[j + 1][0]);        // the facet's outward (radial) normal
        if (Math.cos(t) * dot(F.u, V) + Math.sin(t) * dot(F.v, V) > 1e-6) ex.push(k.pathOf([at(s0, poly[j]), at(s0, poly[j + 1])]));
      }
      paths.crease = (paths.crease || "") + ex.join("");
    }
    return k.solidSvg(paths, { tone });
  }
  // the key's solids within s ∈ [lo, hi], painted far → near: coaxial parts in s order (reversed when the axis points away from
  // the viewer); the flag beside the barrel goes after it when it is on the viewer's side of the barrel, before it otherwise
  // memo (optional, a Map): the axisymmetric parts do not change with κ, so a turning key rebuilds only its flag and its ring
  function keySvg(pose, { lo = 0, hi = LEN, tone = "hi", memo = null } = {}) {
    const F = frameOfKey(pose);
    const aV = dot(F.a, V), uV = dot(F.u, V), vV = dot(F.v, V);
    const parts = [];
    const base = `${pose.tip.map((v) => v.toFixed(4))}|${pose.phi.toFixed(4)}|${(pose.roll ?? 0).toFixed(4)}|${lo.toFixed(4)}|${hi.toFixed(4)}`;
    const memoOf = (key, make) => { if (!memo) return make(); if (!memo.has(key)) { if (memo.size > 64) memo.clear(); memo.set(key, make()); } return memo.get(key); };
    // explicit facet counts (the kit's default follows the projection's scale, which P4 multiplies by 4)
    const lathe = (prof, s, steps) => { const c = clipProfile(prof, lo, hi); if (c) parts.push({ s, svg: memoOf(`${s}|${base}`, () => k.solidSvg(G.solidOf(c, F, P, { steps }), { tone })) }); };
    lathe(BARREL, 12, 36);
    lathe(NECK, 24.5, 36);
    const ringIn = RING_S >= lo && RING_S <= hi;
    const faceSign = vV >= 0 ? 1 : -1;                                   // w = faceSign · v: the ring face toward the viewer is w = +1
    if (ringIn) {
      const RF = G.frameAlong(G.add3(F.o, G.mul3(F.a, RING_S)), F.v);
      const face = faceSign * RING_T;
      const ringPaths = G.ringBand(-RING_T, RING_T, RING_IN, RING_OUT, RF, P, { hole: [face, RING_IN], steps: 96 });
      parts.push({ s: RING_S, svg: k.solidSvg(ringPaths, { tone, inner: k.lineSvg(G.circleOf(RF, face, 6.3, P, 72), { tone: "faint" }) }) + boreSvg(RF, face, tone) });
    }
    lathe(BOSS_CORE, 39.7, 28);
    lathe(PIN, 42.7, 24);
    parts.sort((p, q) => (aV >= 0 ? p.s - q.s : q.s - p.s));
    // the collars' lobes (S3 gate round 3). A lobe behind the ring (w ≤ −1) goes before it; a lobe in front (w ≥ 1) goes after it
    // and after its collar's core. The neck's core lies on the ring's far side when aV ≥ 0 (painted before the ring), so its front
    // lobe is drawn again after the ring; with aV < 0 the whole neck already follows the ring and its lobes have no hidden part.
    if (ringIn) {
      const iR = parts.findIndex((p) => p.s === RING_S);
      const b0 = Math.max(lo, BOSS[0][0]), b1 = Math.min(hi, BOSS[1][0]);
      if (b1 - b0 > 1e-3) {
        const o = { open0: b0 > BOSS[0][0] + 1e-6, open1: b1 < BOSS[1][0] - 1e-6, chordOpen1: true, tone };
        parts.splice(iR, 0, { s: RING_S - 0.01, svg: lobeSvg(F, faceSign, -1, 1.4, b0, b1, o) });
        const iCore = parts.findIndex((p) => p.s === 39.7), iRing = parts.findIndex((p) => p.s === RING_S);
        parts.splice(Math.max(iCore, iRing) + 1, 0, { s: RING_S + 0.01, svg: lobeSvg(F, faceSign, 1, 1.4, b0, b1, o) });
      }
      const n0 = Math.max(lo, 24.6), n1 = Math.min(hi, NECK_END);
      if (aV >= 0 && n1 - n0 > 1e-3) {
        const iRing = parts.findIndex((p) => p.s === RING_S);
        parts.splice(iRing + 1, 0, { s: RING_S + 0.02, svg: lobeSvg(F, faceSign, 1, 2.2, n0, n1, { open0: true, open1: n1 < NECK_END - 1e-6, crease0: n0 <= 24.6 + 1e-6, tone }) });
      }
    }
    const f0 = Math.max(lo, 0), f1 = Math.min(hi, FLAG_LEN);
    if (f1 - f0 > 1e-3) {
      const flag = k.solidSvg(G.prismOf(F, FLAG, f0, f1, P), { tone });
      const i = parts.findIndex((p) => p.s === 12);
      if (i < 0) parts.unshift({ s: 1, svg: flag });
      else parts.splice(uV > 0 ? i + 1 : i, 0, { s: 1, svg: flag });
    }
    // the bore mouth (C5 #70): seen only when the barrel's tip end faces the viewer (the inverted key)
    let mouth = "";
    if (lo <= 0 && aV < 0) mouth = `<g class="hc-cavity"><path class="iso-fill" d="${G.circleOf(F, 0, 1.27, P)}"/>${k.lineSvg(G.circleOf(F, 0, 1.27, P), { tone: "lo" })}</g>`;
    return `<g class="hc-key">${parts.map((p) => p.svg).join("")}${mouth}</g>`;
  }
  return { LEN, FLIP_S, RING_S, NECK_END, BOSS_IN, BARREL, NECK, BOSS, PIN, FLAG, FLAG_LEN, axesOf, frameOfKey, tipOfCentre, centreOf, pointAt, clipProfile, keySvg };
}
