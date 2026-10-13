const D = __DATA__;
const root = document.querySelector(".cr");
const stage = root.querySelector(".cr-stage");
const readout = root.querySelector("[data-readout]");
const said = stage.querySelector(".cr-said");
const front = stage.querySelector(".cr-front");
const itemsNode = front.querySelector(".cr-items");
const carNode = itemsNode.querySelector('[data-item="car"]');
const slots = [...front.querySelectorAll(".cr-inside")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const pale = root.closest("[data-theme]")?.getAttribute("data-theme") === "light";
const K = { iso, pathOf, solidSvg, lineSvg, dotsSvg };
const clampTo = (value, low, high) => Math.min(high, Math.max(low, value));
// the kit's spring is stable for steps under about a third of its time: split a long frame into short ones
const springTo = (state, target, dt, seconds, calm) => {
  const n = Math.max(1, Math.ceil(dt / (seconds / 3)));
  for (let i = 0; i < n; i++) settle(state, target, dt / n, seconds, calm);
};

const road = M.roadOf();
const profile = D.profile;
const paceOf = (share) => D.paceMin + share * (D.limit - D.paceMin);
const twin = carNode.cloneNode(false);
twin.removeAttribute("data-item");

const state = { target: 1, clock: 0, tourLap: 0 };
const brake = { x: 0, v: 0 };
const ease = { x: 1, v: 0 };
let car = M.carStart(road, profile, paceOf(1));
let touring = !still.matches;
let idleTimer = 0;
let sayTimer = 0;
let visible = false;
let frame = 0;
let last = 0;
let order = "";
const TOUR = [1, 0.72, 1, 0.35, 1, 0.85];
const gpu = gpuOf(D, stage, pale);
if (gpu) stage.setAttribute("data-gl", "");

const items = [...itemsNode.children].filter((node) => node !== carNode).map((node) => ({ node, key: +node.dataset.k, at: (node.dataset.at || "").split(",").map(Number), lit: 0 }));
// what the headlights fall on catches their light: the same lamp model as the road pool
function lampOn(p, pose) {
  const c = Math.cos(pose.yaw);
  const s = Math.sin(pose.yaw);
  let e = 0;
  for (const side of [1, -1]) {
    const lx = pose.x + c * 9.3 - s * side * 2.55;
    const ly = pose.y + s * 9.3 + c * side * 2.55;
    const dx = p[0] - lx;
    const dy = p[1] - ly;
    const r = Math.hypot(dx, dy) || 1;
    const ah = Math.acos(Math.max(-1, Math.min(1, (dx * c + dy * s) / r)));
    // low beams are cut off a little above the horizontal: nothing up on the hill catches them
    const up = Math.atan2(p[2] - D.road - 0.8, r);
    const pattern = Math.exp(-((ah / 0.4) ** 2)) * (1 + 2.2 * Math.exp(-((ah / 0.12) ** 2))) * Math.exp(-((Math.max(0, up - 0.06) / 0.12) ** 2));
    e += (pattern / (r * r)) * smooth(1, 6, r);
  }
  return e;
}
function lightItems() {
  const on = car.dark <= 0;
  const pose = poseOf(car);
  for (const it of items) {
    if (it.at.length < 3) continue;
    const e = on ? lampOn(it.at, pose) : 0;
    const lit = Math.round(Math.min(0.85, 1 - Math.exp(-e * 900)) * 50) / 50;
    if (lit !== it.lit) {
      it.lit = lit;
      if (lit > 0) it.node.style.setProperty("--lit", lit);
      else it.node.style.removeProperty("--lit");
      it.node.toggleAttribute("data-lit-by", lit > 0);
    }
  }
}
const sockNode = itemsNode.querySelector('[data-item="sock"]');
const pointer = stage.querySelector('[data-part="pace-pointer"]');
let pointerAt = -1;
function drawKnob() {
  const share = Math.round(ease.x * 1000) / 1000;
  if (!pointer || share === pointerAt) return;
  pointerAt = share;
  const deg = D.sweep[0] + (D.sweep[1] - D.sweep[0]) * share;
  const a = (deg * Math.PI) / 180;
  const k0 = D.knob;
  pointer.setAttribute("d", pathOf([iso([k0.x + Math.sin(a) * 1.2, k0.y + 4.45, k0.z + Math.cos(a) * 1.2], D.P), iso([k0.x + Math.sin(a) * (k0.r - 0.8), k0.y + 4.45, k0.z + Math.cos(a) * (k0.r - 0.8)], D.P)]));
}
let sockDrawn = -1;
// the trees lean away from the wind, more in the gusts (as the square of the speed), and shiver
const swaying = items.filter((it) => /^(tree|hilltree)/.test(it.node.dataset.item || "")).map((it) => {
  const base = iso([it.at[0], it.at[1], it.at[2] - 4], D.P);
  return { node: it.node, base, phase: (it.at[0] * 0.13 + it.at[1] * 0.07) % (Math.PI * 2), give: 0.8 + 0.4 * Math.abs(Math.sin(it.at[0] * 1.7)) };
});
function drawSock(t) {
  // redraw at 20 Hz: the sock's flutter is slow and its paths are not cheap
  const slot = Math.floor(t * 20);
  if (!sockNode || slot === sockDrawn) return;
  sockDrawn = slot;
  const wind = CARS.windOf(t);
  sockNode.innerHTML = CARS.sockSvg(D.sock, wind, D.P, G, K);
  const [ax, ay] = iso([0, 0, 0], D.P);
  const [bx] = iso([Math.cos(wind.heading), Math.sin(wind.heading), 0], D.P);
  const side = Math.sign(bx - ax) || 1;
  const push = (wind.speed / 10.5) ** 2;
  for (const tree of swaying) {
    const lean = side * tree.give * (2.4 * push + 1.0 * push * Math.sin(t * 4.4 + tree.phase) + 0.4 * Math.sin(t * 9.1 + tree.phase * 2));
    tree.node.setAttribute("transform", `rotate(${lean.toFixed(2)} ${tree.base[0].toFixed(1)} ${tree.base[1].toFixed(1)})`);
  }
}
const V = G.viewOf(D.P);
const depthAt = (x, y, z) => x * V[0] + y * V[1] + z * V[2];

// ---- Detail A: the car at 3:1, following it, with its path, its nose and the clearance to the edge -----
const DT = D.detail;
const detailView = stage.querySelector(".cr-detail-view");
const detailNotes = stage.querySelector(".cr-detail-notes");
const detailLead = stage.querySelector(".cr-detail-lead");
const beamGrads = [0, 1].map((i) => stage.querySelector(`#cr-beam-${i}`));
const LT = G.lightOf(D.P);
// each ring of the cliff top, with the outward normal of every edge (rings run either way round)
const TOP = D.top.map((ring) => {
  const area = ring.reduce((sum, [x, y], i) => {
    const [nx, ny] = ring[(i + 1) % ring.length];
    return sum + x * ny - nx * y;
  }, 0);
  const turn = area > 0 ? 1 : -1;
  return ring.map(([x, y], i) => {
    const [bx, by] = ring[(i + 1) % ring.length];
    const len = Math.hypot(bx - x, by - y) || 1;
    return { x, y, bx, by, nx: (turn * (by - y)) / len, ny: (-turn * (bx - x)) / len };
  });
});
const trail = [];
let detailIdle = false;
let trailClock = 0;

// a polyline cut to the inset's circle: pieces that end exactly on the rim
function inCircle(points) {
  const { cx, cy, r } = DT;
  const inside = ([x, y]) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  const roots = (a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const fx = a[0] - cx;
    const fy = a[1] - cy;
    const A = dx * dx + dy * dy || 1e-9;
    const B = 2 * (fx * dx + fy * dy);
    const C = fx * fx + fy * fy - r * r;
    const q = Math.sqrt(Math.max(0, B * B - 4 * A * C));
    return [(-B - q) / (2 * A), (-B + q) / (2 * A)].filter((t) => t >= 0 && t <= 1).map((t) => [a[0] + dx * t, a[1] + dy * t]);
  };
  const out = [];
  let cur = inside(points[0]) ? [points[0]] : null;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const ia = inside(a);
    const ib = inside(b);
    if (ia && ib) cur.push(b);
    else if (ia) {
      const x = roots(a, b);
      cur.push(x[x.length - 1] || b);
      if (cur.length > 1) out.push(cur);
      cur = null;
    } else if (ib) cur = [roots(a, b)[0] || a, b];
    else {
      const x = roots(a, b);
      if (x.length === 2) out.push(x);
    }
  }
  if (cur && cur.length > 1) out.push(cur);
  return out;
}
const clippedLine = (points, opts) => inCircle(points).map((piece) => lineSvg(pathOf(piece), opts)).join("");

// on a phone the inset is hidden (its labels would be too small to read), so it isn't drawn either
const narrow = matchMedia("(max-width: 560px)");
function drawDetail(pose, hidden) {
  if (!detailView || narrow.matches) return;
  if (hidden) {
    if (!detailIdle) {
      detailIdle = true;
      detailLead.innerHTML = "";
      detailView.classList.add("is-idle");
      detailNotes.innerHTML = faceTextSvg(`translate(${DT.cx} ${DT.cy - DT.r * 0.55})`, "in the tunnel", { size: 9, tone: "hi", anchor: "middle" });
      trail.length = 0;
    }
    return;
  }
  if (detailIdle) {
    detailIdle = false;
    detailView.classList.remove("is-idle");
  }
  const scale = DT.scale;
  const P2 = { scale, azimuth: D.P.azimuth, elevation: D.P.elevation, origin: [0, 0] };
  const ahead = 4;
  const [u0, v0] = iso([car.x + Math.cos(car.psi) * ahead, car.y + Math.sin(car.psi) * ahead, D.road], P2);
  P2.origin = [DT.cx - u0, DT.cy - v0];
  const at = (x, y, z = D.road) => iso([x, y, z], P2);
  const near = (x, y) => Math.abs(x - car.x) < 140 && Math.abs(y - car.y) < 140;
  const parts = [];

  // the cliff top, then the faces that turn toward us, drawn down past the rim
  const land = TOP.map((ring) => pathOf(ring.map(({ x, y }) => at(x, y)), true)).join("");
  parts.push(`<path class="cr-d-land" fill-rule="evenodd" d="${land}"/>`);
  const faces = { 1: [], 2: [], 3: [] };
  for (const ring of TOP) {
    for (const e of ring) {
      if (!near(e.x, e.y) || e.nx * V[0] + e.ny * V[1] <= 0.02) continue;
      const light = e.nx * LT[0] + e.ny * LT[1];
      const band = light > 0.25 ? 3 : light > -0.25 ? 2 : 1;
      faces[band].push(pathOf([at(e.x, e.y), at(e.bx, e.by), at(e.bx, e.by, D.road - 90), at(e.x, e.y, D.road - 90)], true));
    }
  }
  for (const band of [1, 2, 3]) if (faces[band].length) parts.push(`<path class="cr-d-face" data-shade="${band}" d="${faces[band].join("")}"/>`);
  parts.push(TOP.map((ring) => lineSvg(pathOf(ring.map(({ x, y }) => at(x, y)), true), { tone: "hi" })).join(""));

  // the road: asphalt, edge lines, the centre dashes
  const ids = [];
  for (let j = -320; j <= 320; j += 4) if (car.i + j >= 0 && car.i + j < road.n) ids.push(car.i + j);
  const rp = (i, d) => M.roadPoint(road, i, d);
  const strip = (d0, d1, list = ids) => pathOf([...list.map((i) => at(...rp(i, d0))), ...list.slice().reverse().map((i) => at(...rp(i, d1)))], true);
  parts.push(`<path class="cr-asphalt" d="${strip(-M.HALF_ROAD, M.HALF_ROAD)}"/>`);
  parts.push(`<path class="cr-paint" d="${strip(-M.HALF_ROAD + 0.15, -M.HALF_ROAD + 0.3)}${strip(M.HALF_ROAD - 0.3, M.HALF_ROAD - 0.15)}"/>`);
  const dash = Math.round(3 / road.ds);
  let dashes = "";
  for (let i = Math.max(0, ids[0] - (ids[0] % (dash * 3))); i < ids[ids.length - 1]; i += dash * 3) {
    const run = [];
    for (let j = i; j <= Math.min(road.n - 1, i + dash); j += 2) run.push(j);
    if (run.length > 1) dashes += strip(-0.08, 0.08, run);
  }
  parts.push(`<path class="cr-paint" d="${dashes}"/>`);
  for (const d of [-M.HALF_ROAD, M.HALF_ROAD]) parts.push(clippedLine(ids.map((i) => at(...rp(i, d))), { tone: "lo" }));

  // fresh tyre marks: the rear wheels' last three seconds, darker where the tail was out
  if (trail.length) {
    const bins = [[], [], []];
    for (let j = 1; j < trail.length; j++) {
      const a = trail[j - 1];
      const b = trail[j];
      if (b.t - a.t > 0.2 || b.slip < 0.1) continue;
      const age = trailClock - b.t;
      const bin = age < 1 ? 0 : age < 2 ? 1 : 2;
      for (const side of [0, 1]) {
        const ax = a.w[side];
        const bx = b.w[side];
        const w = 0.45;
        const dx = bx[0] - ax[0];
        const dy = bx[1] - ax[1];
        const len = Math.hypot(dx, dy) || 1;
        const ox = (-dy / len) * w;
        const oy = (dx / len) * w;
        bins[bin].push(pathOf([at(ax[0] + ox, ax[1] + oy), at(bx[0] + ox, bx[1] + oy), at(bx[0] - ox, bx[1] - oy), at(ax[0] - ox, ax[1] - oy)], true));
      }
    }
    bins.forEach((list, bin) => {
      if (list.length) parts.push(`<path class="cr-d-trail" opacity="${[0.75, 0.45, 0.2][bin]}" d="${list.join("")}"/>`);
    });
  }

  // the headlights on the ground, kept to the cliff top
  const c = Math.cos(pose.yaw);
  const s = Math.sin(pose.yaw);
  let beams = "";
  [1, -1].forEach((side, n) => {
    const lx = car.x + c * 9.3 - s * side * 2.55;
    const ly = car.y + s * 9.3 + c * side * 2.55;
    // three nested fans, so the beam's edges fall off instead of stopping
    const fanOf = (spread) => {
      const fan = [at(lx, ly)];
      for (let i = 0; i <= 10; i++) {
        const a = -spread + (2 * spread * i) / 10;
        fan.push(at(lx + Math.cos(pose.yaw + a) * 80, ly + Math.sin(pose.yaw + a) * 80));
      }
      return pathOf(fan, true);
    };
    const [x1, y1] = at(lx, ly);
    const [x2, y2] = at(lx + c * 80, ly + s * 80);
    const g = beamGrads[n];
    if (g) {
      g.setAttribute("x1", x1.toFixed(1));
      g.setAttribute("y1", y1.toFixed(1));
      g.setAttribute("x2", x2.toFixed(1));
      g.setAttribute("y2", y2.toFixed(1));
    }
    for (const spread of [0.42, 0.3, 0.17]) beams += `<path class="cr-d-beam" fill="url(#cr-beam-${n})" opacity="0.4" d="${fanOf(spread)}"/>`;
  });
  parts.push(`<g class="cr-d-beams"><clipPath id="cr-detail-land"><path fill-rule="evenodd" d="${land}"/></clipPath><g clip-path="url(#cr-detail-land)">${beams}</g></g>`);

  // the delineators round the inside of the hairpin, the car, and the tyre smoke, in depth order
  const things = [];
  for (const [x, y, toward] of D.posts) {
    if (!near(x, y)) continue;
    const slab = solidSvg(slabOf({ x: x - 0.7, y: y - 0.7, w: 1.4, d: 1.4, r: 0.3 }, D.road, 5.2, P2, 2, 0.2), { tone: "mid", className: "cr-post" });
    const rx = x + Math.cos(toward) * 0.75;
    const ry = y + Math.sin(toward) * 0.75;
    things.push({ key: depthAt(x, y, D.road), svg: `${slab}<path class="cr-reflector" d="${pathOf([at(rx, ry, D.road + 3.4), at(rx, ry, D.road + 4.6)])}"/>` });
  }
  const opts = { lamps: true, brake: brake.x };
  const plane = D.portal;
  const half = 10.9;
  const lo = Math.min(car.x - c * half, car.x + c * half);
  let inner = "";
  let open = "";
  if (lo >= plane) open = CARS.carSvg(pose, P2, G, K, opts);
  else {
    const cut = (plane - car.x) / c;
    open = CARS.carSvg(pose, P2, G, K, { ...opts, cut, keepAbove: c > 0 });
    inner = CARS.carSvg(pose, P2, G, K, { ...opts, cut, keepAbove: c <= 0 });
  }
  things.push({ key: depthAt(car.x, car.y, D.road + 2), svg: open });
  const puffs = gpu && gpu.puffs ? gpu.puffs() : [];
  for (const p of puffs) {
    if (!near(p.x, p.y)) continue;
    const [px, py] = at(p.x, p.y, p.z);
    const rr = p.r * scale * 1.2;
    things.push({ key: depthAt(p.x, p.y, p.z), svg: `<circle fill="url(#cr-puff)" opacity="${Math.min(0.85, p.a * 0.8).toFixed(2)}" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${rr.toFixed(1)}"/>` });
  }

  // a portal in view: the rock face of the hill, the headwall and its opening, the car's far part inside
  let wall = "";
  if (ids.some((i) => road.pts[i][0] < plane + 70 && near(...road.pts[i]))) {
    const hw = D.headwall;
    const x1 = plane;
    const top = D.road + hw.tall;
    const rock = [[hw.face - 1, D.box[1]], [hw.face - 1, D.hillFront]];
    wall += `<path class="cr-d-wall" data-shade="1" d="${pathOf([at(rock[0][0], rock[0][1]), at(rock[1][0], rock[1][1]), at(rock[1][0], rock[1][1], D.wallTop), at(rock[0][0], rock[0][1], D.wallTop)], true)}"/>`;
    wall += `<path class="cr-d-wall" data-shade="3" d="${pathOf([at(rock[0][0], rock[0][1], D.wallTop), at(rock[1][0], rock[1][1], D.wallTop), at(D.box[0], rock[1][1], D.wallTop), at(D.box[0], rock[0][1], D.wallTop)], true)}"/>`;
    // the hill's own front, facing the sea, below and beside the portal face
    wall += `<path class="cr-d-wall" data-shade="2" d="${pathOf([at(rock[1][0], rock[1][1], D.road - 90), at(D.box[0], rock[1][1], D.road - 90), at(D.box[0], rock[1][1], D.wallTop), at(rock[1][0], rock[1][1], D.wallTop)], true)}"/>`;
    wall += clippedLine([at(rock[0][0], rock[0][1], D.wallTop), at(rock[1][0], rock[1][1], D.wallTop), at(D.box[0], rock[1][1], D.wallTop)], { tone: "lo" });
    wall += clippedLine([at(rock[1][0], rock[1][1], D.road - 90), at(rock[1][0], rock[1][1], D.wallTop)], { tone: "lo" });
    const arches = [];
    for (const o of D.portals) {
      const pts = [[x1, o.yc - o.half, o.z]];
      for (let i = 0; i <= 24; i++) {
        const a = Math.PI - (i / 24) * Math.PI;
        pts.push([x1, o.yc + o.half * Math.cos(a), o.spring + o.half * Math.sin(a)]);
      }
      pts.push([x1, o.yc + o.half, o.z]);
      arches.push(pathOf(pts.map((p) => at(...p)), true));
      const front = [[x1, o.yc - hw.wide, o.z], [x1, o.yc + hw.wide, o.z], [x1, o.yc + hw.wide, top], [x1, o.yc - hw.wide, top]];
      const side = [[x1, o.yc + hw.wide, o.z], [x1 - hw.thick, o.yc + hw.wide, o.z], [x1 - hw.thick, o.yc + hw.wide, top], [x1, o.yc + hw.wide, top]];
      const lid = [[x1, o.yc - hw.wide, top], [x1, o.yc + hw.wide, top], [x1 - hw.thick, o.yc + hw.wide, top], [x1 - hw.thick, o.yc - hw.wide, top]];
      wall += `<path class="cr-d-bore" d="${arches[arches.length - 1]}"/>`;
      if (inner && (car.i < road.n / 2) === (o === D.portals[0])) wall += `<clipPath id="cr-detail-arch"><path d="${arches[arches.length - 1]}"/></clipPath><g clip-path="url(#cr-detail-arch)">${inner}</g>`;
      wall += `<path class="cr-d-wall" fill-rule="evenodd" d="${pathOf(front.map((p) => at(...p)), true)}${arches[arches.length - 1]}"/>`;
      wall += `<path class="cr-d-wall" data-shade="1" d="${pathOf(side.map((p) => at(...p)), true)}"/>`;
      wall += `<path class="cr-d-wall" data-shade="3" d="${pathOf(lid.map((p) => at(...p)), true)}"/>`;
      wall += lineSvg(pathOf(front.map((p) => at(...p)), true), { tone: "mid" }) + lineSvg(arches[arches.length - 1], { tone: "mid" });
    }
  }
  things.sort((a, b) => a.key - b.key);
  parts.push(wall);
  parts.push(things.map((t) => t.svg).join(""));
  detailView.innerHTML = parts.join("");

  // the notes: where the car is going (its path), where it points (its nose), the angle between, and the edge
  const zn = D.road + 7;
  const [cx0, cy0] = at(car.x, car.y, zn);
  const notes = [];
  const reach = 30;
  const pathTip = at(car.x + Math.cos(car.psi) * reach, car.y + Math.sin(car.psi) * reach, zn);
  const noseTip = at(car.x + c * reach, car.y + s * reach, zn);
  const beta = car.beta;
  const deg = Math.round(Math.abs(beta) * 180 / Math.PI);
  if (deg >= 8) {
    const arc = [];
    for (let i = 0; i <= 16; i++) {
      const a = car.psi + (beta * i) / 16;
      arc.push(at(car.x + Math.cos(a) * 21, car.y + Math.sin(a) * 21, zn));
    }
    notes.push(clippedLine(arc, { tone: "red" }));
    const mid = car.psi + beta / 2;
    const [tx, ty] = at(car.x + Math.cos(mid) * 27, car.y + Math.sin(mid) * 27, zn);
    notes.push(`<text class="iso-face-text cr-d-red" font-size="9" text-anchor="middle" x="${tx.toFixed(1)}" y="${(ty + 3).toFixed(1)}">β ${deg}°</text>`);
  }
  notes.push(clippedLine([[cx0, cy0], noseTip], { tone: "mid", dashed: true, free: "end" }));
  notes.push(clippedLine([[cx0, cy0], pathTip], { tone: "hi" }));
  {
    const ux = pathTip[0] - cx0;
    const uy = pathTip[1] - cy0;
    const len = Math.hypot(ux, uy) || 1;
    const ex = ux / len;
    const ey = uy / len;
    const head = [[pathTip[0] + ex * 2, pathTip[1] + ey * 2], [pathTip[0] - ex * 5 - ey * 2.6, pathTip[1] - ey * 5 + ex * 2.6], [pathTip[0] - ex * 5 + ey * 2.6, pathTip[1] - ey * 5 - ex * 2.6]];
    if (head.every(([x, y]) => (x - DT.cx) ** 2 + (y - DT.cy) ** 2 < DT.r * DT.r)) notes.push(`<path class="cr-d-arrow" d="${pathOf(head, true)}"/>`);
    const [lx, ly] = [pathTip[0] + ex * 9, pathTip[1] + ey * 9 + 3];
    if ((lx - DT.cx) ** 2 + (ly - DT.cy) ** 2 < (DT.r - 12) ** 2) notes.push(faceTextSvg(`translate(${lx.toFixed(1)} ${ly.toFixed(1)})`, "path", { size: 7.5, tone: "hi", anchor: "middle" }));
    const [nx, ny] = [noseTip[0] + (noseTip[0] - cx0) * 0.3, noseTip[1] + (noseTip[1] - cy0) * 0.3 + 3];
    if (deg >= 6 && (nx - DT.cx) ** 2 + (ny - DT.cy) ** 2 < (DT.r - 12) ** 2) notes.push(faceTextSvg(`translate(${nx.toFixed(1)} ${ny.toFixed(1)})`, "nose", { size: 7.5, tone: "mid", anchor: "middle" }));
  }
  notes.push(`<circle class="cr-d-pivot" cx="${cx0.toFixed(1)}" cy="${cy0.toFixed(1)}" r="1.6"/>`);
  // the clearance from the corner nearest the drop to the edge, when it's close
  if (car.margin < 4.5) {
    let best = null;
    for (const [x, y] of M.cornersOf(car)) {
      const pr = M.project(road, x, y, car.i);
      const m = pr.d + M.HALF_ROAD + road.verge[pr.i];
      if (!best || m < best.m) best = { x, y, i: pr.i, m };
    }
    const [ex2, ey2] = rp(best.i, -(M.HALF_ROAD + road.verge[best.i]));
    // the foot of the perpendicular from that corner to the edge
    const h = road.heading[best.i];
    const along = (best.x - ex2) * Math.cos(h) + (best.y - ey2) * Math.sin(h);
    const a = at(best.x, best.y);
    const b = at(ex2 + Math.cos(h) * along, ey2 + Math.sin(h) * along);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len > 3) {
      const tx = (-dy / len) * 3;
      const ty = (dx / len) * 3;
      notes.push(clippedLine([a, b], { tone: "red" }));
      notes.push(clippedLine([[a[0] - tx, a[1] - ty], [a[0] + tx, a[1] + ty]], { tone: "red" }));
      notes.push(clippedLine([[b[0] - tx, b[1] - ty], [b[0] + tx, b[1] + ty]], { tone: "red" }));
      const [mx, my] = [(a[0] + b[0]) / 2 + tx * 2.6, (a[1] + b[1]) / 2 + ty * 2.6 + 3];
      if ((mx - DT.cx) ** 2 + (my - DT.cy) ** 2 < (DT.r - 10) ** 2) notes.push(`<text class="iso-face-text cr-d-red" font-size="8.5" text-anchor="middle" x="${mx.toFixed(1)}" y="${my.toFixed(1)}">${Math.max(0, best.m).toFixed(1)} m</text>`);
    }
  }
  detailNotes.innerHTML = notes.join("");

  // in the main view: a ring round the car and a leader up to the inset
  const [mx0, my0] = iso([car.x, car.y, D.road + 3], D.P);
  const ring = 15;
  const ux = DT.cx - mx0;
  const uy = DT.cy - my0;
  const gap = Math.hypot(ux, uy) || 1;
  const circle = Array.from({ length: 41 }, (_, i) => [mx0 + ring * Math.cos((i / 40) * Math.PI * 2), my0 + ring * Math.sin((i / 40) * Math.PI * 2)]);
  detailLead.innerHTML = lineSvg(pathOf(circle, true), { tone: "mid", className: "cr-detail-mark" }) + (gap > DT.r + ring + 8 ? lineSvg(pathOf([[mx0 + (ux / gap) * ring, my0 + (uy / gap) * ring], [DT.cx - (ux / gap) * (DT.r + 4), DT.cy - (uy / gap) * (DT.r + 4)]]), { tone: "faint", dashed: true }) : "") + faceTextSvg(`translate(${(mx0 - ring - 3).toFixed(1)} ${(my0 - ring + 2).toFixed(1)})`, "A", { size: 7.5, tone: "mid", anchor: "end" });
}

// the rear wheels' track, for the inset's fresh tyre marks
function trackWheels(dt) {
  trailClock += dt;
  const yaw = car.psi + car.beta;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const w = [1, -1].map((side) => [car.x - c * 6 - s * side * 3.55, car.y - s * 6 + c * side * 3.55]);
  const last = trail[trail.length - 1];
  if (!last || Math.hypot(w[0][0] - last.w[0][0], w[0][1] - last.w[0][1]) > 1.2 || trailClock - last.t > 0.15) trail.push({ t: trailClock, w, slip: Math.abs(car.beta) });
  while (trail.length && trailClock - trail[0].t > 3) trail.shift();
}

function poseOf(s) {
  return { x: s.x, y: s.y, z: D.road, yaw: s.psi + s.beta, steer: s.steer };
}

// which side of a portal's face the car is on: the far portal at the start of the road, the near one at the end
function placeCar() {
  const pose = poseOf(car);
  const hidden = car.dark > 0;
  const c = Math.cos(pose.yaw);
  const half = 10.9;
  const xs = [car.x - c * half, car.x + c * half];
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  const plane = D.portal;
  const slot = car.i < road.n / 2 ? slots[0] : slots[1];
  let open = "";
  let inner = "";
  if (!hidden) {
    const opts = { lamps: true, brake: brake.x };
    if (hi <= plane) inner = CARS.carSvg(pose, D.P, G, K, opts);
    else if (lo >= plane) open = CARS.carSvg(pose, D.P, G, K, opts);
    else {
      const cut = (plane - car.x) / c;
      open = CARS.carSvg(pose, D.P, G, K, { ...opts, cut, keepAbove: c > 0 });
      inner = CARS.carSvg(pose, D.P, G, K, { ...opts, cut, keepAbove: c <= 0 });
    }
  }
  carNode.innerHTML = open;
  twin.innerHTML = inner;
  if (inner && twin.parentNode !== slot) slot.appendChild(twin);
  if (!inner && twin.parentNode) twin.remove();
  // the open car takes its place among the trees, posts and signs by depth
  const key = depthAt(car.x, car.y, D.road + 2);
  let before = null;
  for (const item of items) {
    if (item.key > key) {
      before = item.node;
      break;
    }
  }
  const want = before ? before.dataset.item : "end";
  if (want !== order) {
    itemsNode.insertBefore(carNode, before);
    order = want;
  }
}

function readoutOf() {
  if (car.dark > 0 || car.x < D.portal - 6) return `in the tunnel · lap ${car.laps + 1} · pace ${Math.round(ease.x * 100)}% of the limit`;
  return M.readoutOf(car);
}

function describe() {
  const words = M.wordsOf(car, ease.x);
  stage.setAttribute("aria-valuenow", String(Math.round(ease.x * 100)));
  stage.setAttribute("aria-valuetext", `Pace ${Math.round(ease.x * 100)} percent of the way from grip to the limit`);
  return words;
}

function announce() {
  clearTimeout(sayTimer);
  sayTimer = setTimeout(() => {
    const words = describe();
    if (said && said.textContent !== words) said.textContent = words;
  }, 700);
}

// under reduced motion: one still, representative frame, the slide at the tip at the chosen pace
function poseStill() {
  const lap = M.lapOf(road, profile, paceOf(ease.x));
  let best = 0;
  lap.trace.forEach(([x, , , beta], i) => {
    if (x > 150 && beta >= lap.trace[best][3]) best = i;
  });
  car = M.carStart(road, profile, paceOf(ease.x));
  for (let i = 0; i <= best; i++) M.stepCar(road, profile, car, paceOf(ease.x), 1 / 120);
}

function tick(now) {
  const dt = (last ? Math.min((now - last) / 1000, 0.1) : 1 / 60) * (window.__crWarp || 1);
  last = now;
  const calm = still.matches;
  state.clock += dt;
  springTo(ease, state.target, dt, 0.5, calm);
  if (calm) {
    poseStill();
    placeCar();
    drawKnob();
    lightItems();
    drawDetail(poseOf(car), false);
    readout.textContent = readoutOf();
    if (gpu) {
      gpu.step(0, 6.2, car, true);
      gpu.draw(1, 6.2, car, 6.2);
    }
    frame = 0;
    return;
  }
  const lapBefore = car.laps;
  const steps = Math.max(1, Math.round(dt * 240));
  for (let i = 0; i < steps; i++) M.stepCar(road, profile, car, paceOf(ease.x), dt / steps);
  if (car.laps !== lapBefore && touring) {
    state.tourLap = (state.tourLap + 1) % TOUR.length;
    state.target = TOUR[state.tourLap];
  }
  springTo(brake, car.brake, dt, 0.06);
  brake.x = clampTo(brake.x, 0, 1);
  placeCar();
  drawSock(state.clock);
  drawKnob();
  lightItems();
  if (car.dark <= 0) trackWheels(dt);
  drawDetail(poseOf(car), car.dark > 0 || car.x < D.portal - 6);
  if (gpu) {
    gpu.step(dt, state.clock, car, false);
    gpu.draw(smooth(0, 1, (state.clock - 0.15) / 0.9), state.clock, { ...car, brake: brake.x }, state.clock);
  }
  const text = readoutOf();
  if (readout.textContent !== text) readout.textContent = text;
  frame = visible ? requestAnimationFrame(tick) : 0;
}

function run() {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
}

function hold() {
  touring = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (still.matches) return;
    touring = true;
    run();
  }, 3600);
}

function steer(share) {
  state.target = clampTo(share, 0, 1);
  hold();
  announce();
  run();
}

new IntersectionObserver(
  (entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible) run();
  },
  { rootMargin: "120px 0px" },
).observe(stage);

stage.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch" && !event.buttons) return;
  const box = stage.getBoundingClientRect();
  steer(((event.clientX - box.left) / box.width - 0.12) / 0.76);
});
stage.addEventListener("pointerdown", (event) => {
  const box = stage.getBoundingClientRect();
  steer(((event.clientX - box.left) / box.width - 0.12) / 0.76);
});
stage.addEventListener("keydown", (event) => {
  const from = touring ? ease.x : state.target;
  const big = event.shiftKey ? 0.25 : 0.1;
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") to = from + big;
  else if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = from - big;
  else if (event.key === "Home") to = 0;
  else if (event.key === "End") to = 1;
  if (to === null) return;
  event.preventDefault();
  if (touring) ease.v = 0;
  steer(to);
});
stage.addEventListener("focus", () => {
  if (said) said.textContent = describe();
});
still.addEventListener("change", () => {
  touring = !still.matches;
  run();
});
if (matchMedia("(hover: none)").matches) {
  const hint = root.querySelector('[data-corner="hint"]');
  if (hint) hint.textContent = "Drag across to push harder";
}
if (still.matches) touring = false;
describe();
// read-only hook for the figure's own checks (where the car is along the road)
Object.defineProperty(window, "__crState", { configurable: true, get: () => ({ i: car.i, n: road.n, x: car.x, y: car.y, dark: car.dark, share: ease.x, clock: state.clock }) });
