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
    // low beams are cut off a little above the horizontal, and the road takes them before anything far below
    const up = Math.atan2(p[2] - pose.z - 0.8, r);
    const pattern = Math.exp(-((ah / 0.4) ** 2)) * (1 + 2.2 * Math.exp(-((ah / 0.12) ** 2))) * Math.exp(-((Math.max(0, up - 0.06) / 0.12) ** 2)) * Math.exp(-((Math.min(0, up + 0.08) / 0.1) ** 2));
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

const V = G.viewOf(D.P);
const depthAt = (x, y, z) => x * V[0] + y * V[1] + z * V[2];

// on a phone the inset is hidden (its labels would be too small to read), so it isn't drawn either
const narrow = matchMedia("(max-width: 560px)");
// ---- what hides the car ----------------------------------------------------------------------------------
// The mountain's drawn height, as the build cut it into terraces. Across the car's screen width, the highest
// terrain between it and the eye is a line; the car shows only above it.
const HG = D.height;
const HQ = (() => {
  const raw = Uint8Array.from(atob(HG.bytes), (c) => c.charCodeAt(0));
  return Float32Array.from(new Uint16Array(raw.buffer), (h) => h / 10);
})();
const heightAt = (x, y) => {
  const i = Math.max(0, Math.min(HG.nx - 1, Math.round((x - HG.x0) / HG.step)));
  const j = Math.max(0, Math.min(HG.ny - 1, Math.round((y - HG.y0) / HG.step)));
  return HQ[j * HG.nx + i];
};
const CAM = cameraOf(D.P);
const SIDE = [CAM.sinA, -CAM.cosA];
const TOWARD = (() => {
  const l = Math.hypot(V[0], V[1]);
  return [V[0] / l, V[1] / l];
})();
function hiddenBelow(x, y, z, half) {
  const cols = [];
  let any = false;
  const base = iso([x, y, z], D.P);
  const [bx0, by0, bx1, by1] = D.box;
  for (let c = -half; c <= half + 0.01; c += 3) {
    const ox = x + (SIDE[0] * c) / CAM.k;
    const oy = y + (SIDE[1] * c) / CAM.k;
    let top = Infinity;
    for (let t = 3; t < 460; t += 3) {
      const px = ox + TOWARD[0] * t;
      const py = oy + TOWARD[1] * t;
      if (px < bx0 || px > bx1 || py < by0 || py > by1) break;
      const h = heightAt(px, py);
      if (h <= z + 0.5) continue;
      top = Math.min(top, iso([px, py, h], D.P)[1]);
    }
    if (top < base[1] + 1) any = true;
    cols.push([base[0] + c, top]);
  }
  return any ? cols : null;
}
// the region above that line, as a clip path (in whatever screen frame `map` puts it)
function clipD(cols, map = (p) => p) {
  const big = 4000;
  const edge = cols.map(([sx, sy]) => map([sx, Math.min(sy, big)]));
  const first = edge[0];
  const last = edge[edge.length - 1];
  return pathOf([[first[0] - big, -big], [last[0] + big, -big], [last[0] + big, last[1]], ...[...edge].reverse(), [first[0] - big, first[1]]], true);
}
const SVGNS = "http://www.w3.org/2000/svg";
const carClip = document.createElementNS(SVGNS, "clipPath");
carClip.id = "cr-car-live";
const carClipPath = document.createElementNS(SVGNS, "path");
carClip.appendChild(carClipPath);
front.appendChild(carClip);

// ---- Detail A: the car at 3:1, following it, with its path, its nose and the clearance to the edge -----
const DT = D.detail;
const detailView = stage.querySelector(".cr-detail-view");
const detailNotes = stage.querySelector(".cr-detail-notes");
const detailLead = stage.querySelector(".cr-detail-lead");
const beamGrads = [0, 1].map((i) => stage.querySelector(`#cr-beam-${i}`));
const LT = G.lightOf(D.P);
const LAYER = 7;
const trail = [];
let detailIdle = false;
let trailClock = 0;
let cache = null;
let detailWorld = null;
let detailMoving = null;

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

// The world round the car, drawn once in a fixed frame and slid under the circle as the car moves: the
// terraces bottom to top, each road piece after the first terrace above it, then the portal if it's near.
function worldAround(P2, cx, cy, zc) {
  const at = (x, y, z) => iso([x, y, z], P2);
  const win = 96;
  const box = [cx - win, cy - win, cx + win, cy + win];
  const tops = [];
  for (let T = 61; T < 420; T += LAYER) if (T >= zc - 34 && T <= zc + 48) tops.push(T);
  const rp = (i, d) => M.roadPoint(road, i, d);
  const bench = (i, side) => M.HALF_ROAD + (side === road.drop[i] ? road.verge[i] : 0.8);
  // road samples in the window, in runs
  const runs = [];
  let run = null;
  for (let i = 0; i < road.n; i += 3) {
    const [x, y] = road.pts[i];
    const inWin = Math.abs(x - cx) < win + 10 && Math.abs(y - cy) < win + 10;
    if (inWin) {
      if (!run) run = [];
      run.push(i);
    } else if (run) {
      runs.push(run);
      run = null;
    }
  }
  if (run) runs.push(run);
  const p3 = (i, d) => at(...rp(i, d), road.z[i]);
  const strip = (list, d0, d1) => pathOf([...list.map((i) => p3(i, d0(i))), ...[...list].reverse().map((i) => p3(i, d1(i)))], true);
  const roadSvg = (list) => {
    const out = [];
    let faces = "";
    for (let j = 0; j + 1 < list.length; j++) {
      const i = list[j];
      const i2 = list[j + 1];
      const dd = road.drop[i];
      const h = road.heading[i];
      if (-Math.sin(h) * dd * V[0] + Math.cos(h) * dd * V[1] <= 0.02) continue;
      const e0 = dd * bench(i, dd);
      const e1 = dd * bench(i2, dd);
      faces += pathOf([p3(i, e0), p3(i2, e1), at(...rp(i2, e1), road.z[i2] - 12), at(...rp(i, e0), road.z[i] - 12)], true);
    }
    if (faces) out.push(`<path class="cr-d-face" data-shade="2" d="${faces}"/>`);
    out.push(`<path class="cr-d-land" d="${strip(list, (i) => bench(i, 1), (i) => -bench(i, -1))}"/>`);
    out.push(`<path class="cr-asphalt" d="${strip(list, () => -M.HALF_ROAD, () => M.HALF_ROAD)}"/>`);
    out.push(`<path class="cr-paint" d="${strip(list, () => -M.HALF_ROAD + 0.15, () => -M.HALF_ROAD + 0.3)}${strip(list, () => M.HALF_ROAD - 0.3, () => M.HALF_ROAD - 0.15)}"/>`);
    let dashes = "";
    const per = Math.round(3 / road.ds);
    for (let a = list[0] - (list[0] % (per * 3)); a < list[list.length - 1]; a += per * 3) {
      const dash = list.filter((i) => i >= a && i <= a + per);
      if (dash.length > 1) dashes += strip(dash, () => -0.08, () => 0.08);
    }
    if (dashes) out.push(`<path class="cr-paint" d="${dashes}"/>`);
    // the unguarded edge, as a fine dark band
    out.push(`<path class="cr-d-edge" d="${strip(list, (i) => road.drop[i] * bench(i, road.drop[i]), (i) => road.drop[i] * (bench(i, road.drop[i]) - 0.12))}"/>`);
    return out.join("");
  };
  const parts = [];
  let floor = "";
  tops.forEach((T, n) => {
    const grid = TR.gridOf(box, 3, (x, y, edge) => (edge ? 1e3 : T - 0.5 - heightAt(x, y)));
    const rings = TR.contour(grid).map((r) => TR.simplifyRing(r, 0.7)).filter((r) => Math.abs(TR.ringArea(r)) > 10);
    const deep = n === 0 ? 120 : LAYER;
    const faces = { 1: "", 2: "", 3: "" };
    let topD = "";
    for (const raw of rings) {
      const ring = TR.ringArea(raw) < 0 ? [...raw].reverse() : raw;
      for (let q = 0; q < ring.length; q++) {
        const [ax, ay] = ring[q];
        const [bx, by] = ring[(q + 1) % ring.length];
        const len = Math.hypot(bx - ax, by - ay) || 1;
        const nx = (by - ay) / len;
        const ny = -(bx - ax) / len;
        if (nx * V[0] + ny * V[1] <= 0.02) continue;
        const light = nx * LT[0] + ny * LT[1];
        const band = light > 0.25 ? 3 : light > -0.25 ? 2 : 1;
        faces[band] += pathOf([at(ax, ay, T), at(bx, by, T), at(bx, by, T - deep), at(ax, ay, T - deep)], true);
      }
      topD += pathOf(ring.map(([x, y]) => at(x, y, T)), true);
    }
    for (const band of [1, 2, 3]) if (faces[band]) parts.push(`<path class="cr-d-face" data-shade="${band}" d="${faces[band]}"/>`);
    if (topD) parts.push(`<path class="cr-d-land" d="${topD}"/>`, lineSvg(topD, { tone: "lo" }));
    if (T > zc && T - LAYER <= zc) floor = topD;
    // the road whose height lies under this top and above the one below
    for (const list of runs) {
      let piece = [];
      for (const i of list) {
        if (road.z[i] >= T - LAYER && road.z[i] < T) piece.push(i);
        else if (piece.length) {
          if (piece.length > 1) parts.push(roadSvg(piece));
          piece = [];
        }
      }
      if (piece.length > 1) parts.push(roadSvg(piece));
    }
  });
  // a portal in view: the headwall and its opening, over the rock face the terraces already drew
  let arches = "";
  const hw = D.headwall;
  for (const o of D.portals) {
    if (Math.abs(o.face - cx) > win + 20 || Math.abs(o.yc - cy) > win + 20) continue;
    const x1 = o.face;
    const top = o.z + (o.tall || hw.tall);
    const pts = [[x1, o.yc - o.half, o.z]];
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI - (i / 24) * Math.PI;
      pts.push([x1, o.yc + o.half * Math.cos(a), o.spring + o.half * Math.sin(a)]);
    }
    pts.push([x1, o.yc + o.half, o.z]);
    const arch = pathOf(pts.map((p) => at(...p)), true);
    arches += arch;
    const frontWall = [[x1, o.yc - hw.wide, o.z], [x1, o.yc + hw.wide, o.z], [x1, o.yc + hw.wide, top], [x1, o.yc - hw.wide, top]];
    const side = [[x1, o.yc + hw.wide, o.z], [x1 - hw.thick, o.yc + hw.wide, o.z], [x1 - hw.thick, o.yc + hw.wide, top], [x1, o.yc + hw.wide, top]];
    const lid = [[x1, o.yc - hw.wide, top], [x1, o.yc + hw.wide, top], [x1 - hw.thick, o.yc + hw.wide, top], [x1 - hw.thick, o.yc - hw.wide, top]];
    parts.push(`<path class="cr-d-bore" d="${arch}"/><g class="cr-d-inside" data-portal="${o.yc}"></g>`);
    parts.push(`<path class="cr-d-wall" fill-rule="evenodd" d="${pathOf(frontWall.map((p) => at(...p)), true)}${arch}"/>`);
    parts.push(`<path class="cr-d-wall" data-shade="1" d="${pathOf(side.map((p) => at(...p)), true)}"/>`);
    parts.push(`<path class="cr-d-wall" data-shade="3" d="${pathOf(lid.map((p) => at(...p)), true)}"/>`);
    parts.push(lineSvg(pathOf(frontWall.map((p) => at(...p)), true), { tone: "mid" }) + lineSvg(arch, { tone: "mid" }));
  }
  return { svg: parts.join(""), floor, arches };
}

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
  const zc = car.z;
  const P2 = { scale, azimuth: D.P.azimuth, elevation: D.P.elevation, origin: [0, 0] };
  const ahead = 4;
  const [u0, v0] = iso([car.x + Math.cos(car.psi) * ahead, car.y + Math.sin(car.psi) * ahead, zc], P2);
  P2.origin = [DT.cx - u0, DT.cy - v0];
  const at = (x, y, z) => iso([x, y, z], P2);
  const near = (x, y) => Math.abs(x - car.x) < 120 && Math.abs(y - car.y) < 120;
  // the world round the car is parsed once and slid; only the car and what moves with it are redrawn
  if (!detailWorld) {
    detailWorld = document.createElementNS(SVGNS, "g");
    detailMoving = document.createElementNS(SVGNS, "g");
    detailView.replaceChildren(detailWorld, detailMoving);
  }
  if (!cache || Math.hypot(car.x - cache.x, car.y - cache.y) > 34 || Math.abs(zc - cache.z) > 6) {
    const world = worldAround(P2, car.x, car.y, zc);
    cache = { x: car.x, y: car.y, z: zc, origin: [...P2.origin], ...world };
    detailWorld.innerHTML = world.svg;
  }
  const shift = `translate(${(P2.origin[0] - cache.origin[0]).toFixed(1)} ${(P2.origin[1] - cache.origin[1]).toFixed(1)})`;
  detailWorld.setAttribute("transform", shift);
  const parts = [];

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
        bins[bin].push(pathOf([at(ax[0] + ox, ax[1] + oy, a.z), at(bx[0] + ox, bx[1] + oy, b.z), at(bx[0] - ox, bx[1] - oy, b.z), at(ax[0] - ox, ax[1] - oy, a.z)], true));
      }
    }
    bins.forEach((list, bin) => {
      if (list.length) parts.push(`<path class="cr-d-trail" opacity="${[0.75, 0.45, 0.2][bin]}" d="${list.join("")}"/>`);
    });
  }

  // the headlights on the ground, kept to the terrace the car is on
  const c = Math.cos(pose.yaw);
  const s = Math.sin(pose.yaw);
  let beams = "";
  [1, -1].forEach((side, n) => {
    const lx = car.x + c * 9.3 - s * side * 2.55;
    const ly = car.y + s * 9.3 + c * side * 2.55;
    // three nested fans, so the beam's edges fall off instead of stopping
    const fanOf = (spread) => {
      const fan = [at(lx, ly, zc)];
      for (let i = 0; i <= 10; i++) {
        const a = -spread + (2 * spread * i) / 10;
        fan.push(at(lx + Math.cos(pose.yaw + a) * 80, ly + Math.sin(pose.yaw + a) * 80, zc));
      }
      return pathOf(fan, true);
    };
    const [x1, y1] = at(lx, ly, zc);
    const [x2, y2] = at(lx + c * 80, ly + s * 80, zc);
    const g = beamGrads[n];
    if (g) {
      g.setAttribute("x1", x1.toFixed(1));
      g.setAttribute("y1", y1.toFixed(1));
      g.setAttribute("x2", x2.toFixed(1));
      g.setAttribute("y2", y2.toFixed(1));
    }
    for (const spread of [0.42, 0.3, 0.17]) beams += `<path class="cr-d-beam" fill="url(#cr-beam-${n})" opacity="0.4" d="${fanOf(spread)}"/>`;
  });
  parts.push(`<g class="cr-d-beams"><clipPath id="cr-detail-land"><path transform="${shift}" d="${cache.floor}"/></clipPath><g clip-path="url(#cr-detail-land)">${beams}</g></g>`);

  // the delineators round the inside of the hairpins, the car, and the tyre smoke, in depth order
  const things = [];
  for (const [x, y, z, toward] of D.posts) {
    if (!near(x, y)) continue;
    const slab = solidSvg(slabOf({ x: x - 0.7, y: y - 0.7, w: 1.4, d: 1.4, r: 0.3 }, z, 5.2, P2, 2, 0.2), { tone: "mid", className: "cr-post" });
    const rx = x + Math.cos(toward) * 0.75;
    const ry = y + Math.sin(toward) * 0.75;
    things.push({ key: depthAt(x, y, z), svg: `${slab}<path class="cr-reflector" d="${pathOf([at(rx, ry, z + 3.4), at(rx, ry, z + 4.6)])}"/>` });
  }
  const opts = { lamps: true, brake: brake.x };
  const plane = D.portal;
  const half = 10.9;
  const lo = Math.min(car.x - c * half, car.x + c * half);
  let inner = "";
  let open = "";
  const pose2 = { ...pose, z: zc };
  if (lo >= plane) open = CARS.carSvg(pose2, P2, G, K, opts);
  else {
    const cut = (plane - car.x) / c;
    open = CARS.carSvg(pose2, P2, G, K, { ...opts, cut, keepAbove: c > 0 });
    inner = CARS.carSvg(pose2, P2, G, K, { ...opts, cut, keepAbove: c <= 0 });
  }
  // what hides the car in the main view hides it here too: the same line, scaled about the camera
  const cols = hiddenBelow(car.x, car.y, zc, 36);
  const k2 = scale / D.P.scale;
  const map = ([x, y]) => [P2.origin[0] + (x - D.P.origin[0]) * k2, P2.origin[1] + (y - D.P.origin[1]) * k2];
  const carClipSvg = cols ? `<clipPath id="cr-detail-car"><path d="${clipD(cols, map)}"/></clipPath>` : "";
  things.push({ key: depthAt(car.x, car.y, zc + 2), svg: `${carClipSvg}<g${cols ? ' clip-path="url(#cr-detail-car)"' : ""}>${open}</g>` });
  const puffs = gpu && gpu.puffs ? gpu.puffs() : [];
  for (const p of puffs) {
    if (!near(p.x, p.y)) continue;
    const [px, py] = at(p.x, p.y, p.z);
    const rr = p.r * scale * 1.2;
    things.push({ key: depthAt(p.x, p.y, p.z), svg: `<circle fill="url(#cr-puff)" opacity="${Math.min(0.85, p.a * 0.8).toFixed(2)}" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${rr.toFixed(1)}"/>` });
  }
  things.sort((a, b) => a.key - b.key);
  if (inner && cache.arches) parts.push(`<clipPath id="cr-detail-arch"><path transform="${shift}" d="${cache.arches}"/></clipPath><g clip-path="url(#cr-detail-arch)">${inner}</g>`);
  parts.push(things.map((t) => t.svg).join(""));
  detailMoving.innerHTML = parts.join("");

  // the notes: where the car is going (its path), where it points (its nose), the angle between, and the edge
  const zn = zc + 7;
  const [cx0, cy0] = at(car.x, car.y, zn);
  const notes = [];
  const reach = 30;
  const pathTip = at(car.x + Math.cos(car.psi) * reach, car.y + Math.sin(car.psi) * reach, zn);
  const noseTip = at(car.x + c * reach, car.y + s * reach, zn);
  const beta = car.beta;
  const deg = Math.round((Math.abs(beta) * 180) / Math.PI);
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
      const m = M.HALF_ROAD + road.verge[pr.i] - road.drop[pr.i] * pr.d;
      if (!best || m < best.m) best = { x, y, i: pr.i, m };
    }
    const [ex2, ey2] = M.roadPoint(road, best.i, road.drop[best.i] * (M.HALF_ROAD + road.verge[best.i]));
    // the foot of the perpendicular from that corner to the edge
    const h = road.heading[best.i];
    const along = (best.x - ex2) * Math.cos(h) + (best.y - ey2) * Math.sin(h);
    const a = at(best.x, best.y, zc);
    const b = at(ex2 + Math.cos(h) * along, ey2 + Math.sin(h) * along, zc);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len > 3) {
      const tx = (-dy / len) * 3;
      const ty = (dx / len) * 3;
      notes.push(clippedLine([a, b], { tone: "red" }));
      // end ticks, each drawn out from the dimension line's end so it stands on it
      for (const [ex, ey] of [a, b]) for (const sgn of [1, -1]) notes.push(clippedLine([[ex, ey], [ex + sgn * tx, ey + sgn * ty]], { tone: "red" }));
      const [mx, my] = [(a[0] + b[0]) / 2 + tx * 2.6, (a[1] + b[1]) / 2 + ty * 2.6 + 3];
      if ((mx - DT.cx) ** 2 + (my - DT.cy) ** 2 < (DT.r - 10) ** 2) notes.push(`<text class="iso-face-text cr-d-red" font-size="8.5" text-anchor="middle" x="${mx.toFixed(1)}" y="${my.toFixed(1)}">${Math.max(0, best.m).toFixed(1)} m</text>`);
    }
  }
  detailNotes.innerHTML = notes.join("");

  // in the main view: a ring round the car and a leader up to the inset
  const [mx0, my0] = iso([car.x, car.y, zc + 3], D.P);
  const ring = 15;
  const ux = DT.cx - mx0;
  const uy = DT.cy - my0;
  const gap = Math.hypot(ux, uy) || 1;
  const circle = Array.from({ length: 41 }, (_, i) => [mx0 + ring * Math.cos((i / 40) * Math.PI * 2), my0 + ring * Math.sin((i / 40) * Math.PI * 2)]);
  // the ring goes dashed while the car is out of sight behind the mountain
  const mid = cols ? cols[Math.floor(cols.length / 2)][1] : Infinity;
  const out = mid < iso([car.x, car.y, zc + 2], D.P)[1];
  detailLead.innerHTML = lineSvg(pathOf(circle, true), { tone: "mid", className: "cr-detail-mark", dashed: out }) + (gap > DT.r + ring + 8 ? lineSvg(pathOf([[mx0 + (ux / gap) * ring, my0 + (uy / gap) * ring], [DT.cx - (ux / gap) * (DT.r + 4), DT.cy - (uy / gap) * (DT.r + 4)]]), { tone: "faint", dashed: true }) : "") + faceTextSvg(`translate(${(mx0 - ring - 3).toFixed(1)} ${(my0 - ring + 2).toFixed(1)})`, "A", { size: 7.5, tone: "mid", anchor: "end" });
}

// the rear wheels' track, for the inset's fresh tyre marks
function trackWheels(dt) {
  trailClock += dt;
  const yaw = car.psi + car.beta;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const w = [1, -1].map((side) => [car.x - c * 6 - s * side * 3.55, car.y - s * 6 + c * side * 3.55]);
  const last = trail[trail.length - 1];
  if (!last || Math.hypot(w[0][0] - last.w[0][0], w[0][1] - last.w[0][1]) > 1.2 || trailClock - last.t > 0.15) trail.push({ t: trailClock, w, z: car.z, slip: Math.abs(car.beta) });
  while (trail.length && trailClock - trail[0].t > 3) trail.shift();
}

function poseOf(s) {
  return { x: s.x, y: s.y, z: s.z, yaw: s.psi + s.beta, steer: s.steer };
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
  // the slopes, knolls and spurs in front of the car hide it
  const cols = hidden ? null : hiddenBelow(car.x, car.y, car.z, 34);
  if (cols) {
    carClipPath.setAttribute("d", clipD(cols));
    carNode.setAttribute("clip-path", "url(#cr-car-live)");
  } else carNode.removeAttribute("clip-path");
  const key = depthAt(car.x, car.y, car.z + 2);
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

// the slider reports the setting the reader chose, not the eased value on its way there
function describe() {
  const words = M.wordsOf(car, state.target);
  stage.setAttribute("aria-valuenow", String(Math.round(state.target * 100)));
  stage.setAttribute("aria-valuetext", `Pace ${Math.round(state.target * 100)} percent of the way from grip to the limit`);
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
  lap.trace.forEach(([, , , beta, i], q) => {
    if (road.hairpin[i] === 2 && beta >= lap.trace[best][3]) best = q;
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
    describe();
  }
  springTo(brake, car.brake, dt, 0.06);
  brake.x = clampTo(brake.x, 0, 1);
  placeCar();
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
