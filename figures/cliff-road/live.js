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

const road = M.roadOf();
const profile = D.profile;
const paceOf = (share) => D.paceMin + share * (D.limit - D.paceMin);
const twin = carNode.cloneNode(false);
twin.removeAttribute("data-item");

const state = { share: 1, target: 1, shareV: 0, clock: 0, laps: 0, tourLap: 0 };
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

const items = [...itemsNode.children].filter((node) => node !== carNode).map((node) => ({ node, key: +node.dataset.k }));
const sockNode = itemsNode.querySelector('[data-item="sock"]');
let sockDrawn = -1;
function drawSock(t) {
  // redraw at 20 Hz: the sock's flutter is slow and its paths are not cheap
  const slot = Math.floor(t * 20);
  if (!sockNode || slot === sockDrawn) return;
  sockDrawn = slot;
  sockNode.innerHTML = CARS.sockSvg(D.sock, CARS.windOf(t), D.P, G, K);
}
const V = G.viewOf(D.P);
const depthAt = (x, y, z) => x * V[0] + y * V[1] + z * V[2];

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
    const opts = { lamps: true, brake: car.brake };
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
  const words = M.wordsOf(car, paceOf(ease.x), D.limit);
  stage.setAttribute("aria-valuenow", String(Math.round(ease.x * 100)));
  stage.setAttribute("aria-valuetext", `Pace ${Math.round(ease.x * 100)} percent of the way to the limit`);
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
  settle(ease, state.target, dt, 0.5, calm);
  if (calm) {
    poseStill();
    placeCar();
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
  placeCar();
  drawSock(state.clock);
  if (gpu) {
    gpu.step(dt, state.clock, car, false);
    gpu.draw(smooth(0, 1, (state.clock - 0.15) / 0.9), state.clock, car, state.clock);
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
