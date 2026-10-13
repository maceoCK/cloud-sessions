// Fig 4A live: one loop drives the peel from the model. The tour lifts a corner, peels the label
// into its curl with the front lingering at each stick-slip band, lets it go, holds on the residue,
// then lays a new label down. A drag or the arrow keys take over at any moment.
const { P, POOL, inkWidth } = DATA;
const { LIFT, OFF, S_END } = PEEL;
const stage = document.querySelector(".nt-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const announcer = document.querySelector(".nt-live");
const still = matchMedia("(prefers-reduced-motion: reduce)");

const tagG = svg.querySelector('[data-part="tag"]');
const halo = svg.querySelector('[data-part="halo"]');
const flatG = svg.querySelector('[data-part="flat"]');
const flat = {
  g: flatG,
  under: flatG.querySelector(".nt-under"),
  sides: [...flatG.querySelectorAll(".nt-side")],
  fill: flatG.querySelector(".nt-face"),
  ink: flatG.querySelector(".nt-ink"),
  edge: flatG.querySelector(".nt-edge"),
};
const slots = [...svg.querySelectorAll(".nt-slot")].map((g) => ({
  g,
  fill: g.querySelector(".nt-strip"),
  seam: g.querySelector(".nt-seam"),
  ghost: g.querySelector(".nt-ghost"),
  tear: g.querySelector(".nt-tear"),
  ink: g.querySelector(".nt-ink"),
  edge: g.querySelector(".nt-edge"),
  memo: {},
}));

const memoFlat = {};
const put = (memo, key, el, name, value) => {
  if (memo[key] === value) return;
  memo[key] = value;
  if (value === null) el.removeAttribute(name);
  else el.setAttribute(name, value);
};

// ---- Tour --------------------------------------------------------------------------------------
// Times in seconds. The peel runs on the stick-slip clock: steady, with a pause at every band.
const T = { rest: 1.5, lift: 1.5, peel: 4.2, off: 1.4, hold: 2.4, place: 1.7, settle: 0.9 };
const CYCLE = Object.values(T).reduce((a, b) => a + b, 0);
const ease = (x) => x * x * (3 - 2 * x);
const easeOut = (x) => 1 - (1 - x) ** 3;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
function tourAt(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  let at = 0;
  const span = (name) => {
    const from = at;
    at += T[name];
    return t >= from && t < at ? (t - from) / T[name] : null;
  };
  let u;
  if ((u = span("rest")) !== null) return { s: 0, place: 0, alpha: 1, phase: "stuck" };
  if ((u = span("lift")) !== null) return { s: LIFT * ease(u), place: 0, alpha: 1, phase: "lift" };
  if ((u = span("peel")) !== null) {
    // ease in and out of the stick-slip clock
    const v = u < 0.08 ? 0.08 * ease(u / 0.08) * 0.5 + 0 : u;
    const clock = clamp((v - 0.04) / 0.96, 0, 1);
    return { s: PEEL.sAtFront(PEEL.slipAt(clock)), place: 0, alpha: 1, phase: "peel" };
  }
  if ((u = span("off")) !== null) return { s: 1 + OFF * ease(u), place: 0, alpha: 1 - ease(clamp((u - 0.35) / 0.65, 0, 1)), phase: "off" };
  if ((u = span("hold")) !== null) return { s: S_END, place: 0, alpha: 0, phase: "gone" };
  if ((u = span("place")) !== null) {
    // A fresh label comes down flat, fading in high up, and is pressed onto the residue.
    // It is held out in front, fades in while still well off the plate, and is pressed on.
    const drop = 1 - easeOut(u);
    return { s: 0, place: 120 * drop, alpha: ease(clamp(u / 0.22, 0, 1)), phase: "place" };
  }
  return { s: 0, place: 0, alpha: 1, phase: "stuck" };
}

// ---- State ---------------------------------------------------------------------------------------
let state = { s: 0, place: 0, alpha: 1 };
let target = { s: 0, place: 0, alpha: 1 };
let touring = !still.matches;
let clock = 0;
let frame = 0, last = 0, visible = false, idleTimer = 0;
let drawn = null;
let phaseShown = "";

function phaseOf(st) {
  if (st.alpha < 0.02) return "gone";
  if (st.place > 0.5) return "place";
  if (st.s <= 0.0005) return "stuck";
  if (st.s < LIFT) return "lift";
  if (st.s < 1) return "peel";
  return "off";
}

const WORDS = {
  stuck: "Stuck down, the scribble on it",
  lift: "A corner is lifting",
  peel: "Peeling: the label rolls up into one curl and starts to tear",
  off: "Torn: the curl comes away and falls, a ragged piece stays stuck",
  gone: "Gone: a torn piece and residue are left on the plate",
  place: "A new label is being laid down",
};

function say(st) {
  const peelState = PEEL.stateAt(st.s);
  const phase = phaseOf(st);
  let text;
  if (phase === "stuck") text = "stuck · name on";
  else if (phase === "place") text = "new label · laying down";
  else if (phase === "lift") text = `corner lifting · θ ${Math.round((peelState.theta * 180) / Math.PI)}°`;
  else if (phase === "peel") text = `peel ${Math.round(peelState.peeled * 100)}% · ${PEEL.forceAt(peelState).toFixed(1)} N`;
  else text = `torn · ${Math.round((1 - PEEL.SHARE_OFF) * 100)}% still stuck`;
  if (readout.textContent !== text) readout.textContent = text;
  const pct = Math.round(Math.min(1, st.s) * 100);
  if (stage.getAttribute("aria-valuenow") !== String(pct)) stage.setAttribute("aria-valuenow", String(pct));
  if (phase !== phaseShown) {
    phaseShown = phase;
    stage.setAttribute("aria-valuetext", WORDS[phase]);
    if (document.activeElement === stage) announcer.textContent = WORDS[phase];
  }
}

function draw() {
  const key = `${state.s.toFixed(5)}|${state.place.toFixed(3)}`;
  if (key !== drawn) {
    drawn = key;
    const paint = PEEL.paintOf(PEEL.stateAt(state.s), P, { place: state.place });
    put(memoFlat, "halo", halo, "d", paint.halo || "M0 0");
    halo.style.opacity = paint.halo ? paint.haloOpacity.toFixed(3) : "0";
    if (paint.haloBlur) halo.style.filter = `blur(${paint.haloBlur.toFixed(1)}px)`;
    const f = paint.flat;
    put(memoFlat, "flatHidden", flat.g, "style", f ? null : "display:none");
    if (f) {
      put(memoFlat, "under", flat.under, "d", f.under);
      f.sides.forEach((d, i) => put(memoFlat, `side${i}`, flat.sides[i], "d", d));
      put(memoFlat, "band", flat.g, "data-band", String(f.band));
      put(memoFlat, "fill", flat.fill, "d", f.fill);
      put(memoFlat, "ink", flat.ink, "d", f.ink);
      put(memoFlat, "edge", flat.edge, "d", f.edge);
    }
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const s = paint.strips[i];
      if (!s) {
        put(slot.memo, "empty", slot.g, "data-empty", "");
        continue;
      }
      put(slot.memo, "empty", slot.g, "data-empty", null);
      put(slot.memo, "side", slot.g, "data-side", s.side);
      put(slot.memo, "band", slot.g, "data-band", String(s.band));
      put(slot.memo, "fill", slot.fill, "d", s.fill);
      put(slot.memo, "seam", slot.seam, "d", s.seam);
      put(slot.memo, "ghost", slot.ghost, "d", s.ghost);
      put(slot.memo, "tear", slot.tear, "d", s.tear);
      put(slot.memo, "ink", slot.ink, "d", s.ink);
      put(slot.memo, "edge", slot.edge, "d", s.edge);
      put(slot.memo, "w", slot.ink, "style", `stroke-width:${(inkWidth * s.width).toFixed(2)}px`);
    }
  }
  const alpha = state.alpha >= 0.999 ? "" : state.alpha.toFixed(3);
  if (tagG.style.opacity !== alpha) tagG.style.opacity = alpha;
  say(state);
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) {
    clock += dt;
    const t = tourAt(clock);
    target = { s: t.s, place: t.place, alpha: t.alpha };
    state = { ...target };
  } else {
    const k = calm ? 1 : 1 - Math.exp(-dt / 0.2);
    const ka = calm ? 1 : 1 - Math.exp(-dt / 0.3);
    state = {
      s: state.s + (target.s - state.s) * k,
      place: state.place + (target.place - state.place) * k,
      alpha: state.alpha + (target.alpha - state.alpha) * ka,
    };
    if (Math.abs(state.s - target.s) < 1e-4) state.s = target.s;
    if (Math.abs(state.place - target.place) < 0.01) state.place = target.place;
    if (Math.abs(state.alpha - target.alpha) < 0.002) state.alpha = target.alpha;
  }
  draw();
  const settled = !touring && state.s === target.s && state.place === target.place && state.alpha === target.alpha;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
};

// The reader takes over: the label comes back if the tour had sent it away, and the tour resumes
// a little after the last input, from the start of its cycle.
function steer(next) {
  touring = false;
  target = { s: clamp(next, 0, S_END), place: 0, alpha: 1 };
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (still.matches) return;
    // Resume from wherever the label is: an unpeeled label starts the cycle, a peeled one goes on.
    touring = true;
    clock = state.s <= 0.001 ? 0 : resumeClock(state.s);
    run();
  }, 3600);
  run();
}
// The tour time at which it shows peel s (for a smooth hand-back).
function resumeClock(s) {
  const t0 = T.rest;
  if (s < LIFT) return t0 + T.lift * inverse((u) => LIFT * ease(u), s);
  if (s <= 1) {
    const t1 = t0 + T.lift;
    return t1 + T.peel * inverse((u) => tourAt(t1 + T.peel * u).s, s);
  }
  return t0 + T.lift + T.peel + T.off * inverse((u) => 1 + OFF * ease(u), s);
}
function inverse(fn, y) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (fn(m) < y) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) run();
}, { rootMargin: "120px 0px" }).observe(stage);

// Pointer: across the figure is along the peel. Hover previews, a press drags.
const REACH = [0.18, 0.86];
const sOfPointer = (event) => {
  const box = svg.getBoundingClientRect();
  const x = (event.clientX - box.left) / box.width;
  const share = clamp((x - REACH[0]) / (REACH[1] - REACH[0]), 0, 1);
  return share * (1 + OFF * 0.55);
};
let pressed = false;
stage.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch" && !pressed) return;
  steer(sOfPointer(event));
});
stage.addEventListener("pointerdown", (event) => {
  pressed = true;
  try { stage.setPointerCapture(event.pointerId); } catch {}
  steer(sOfPointer(event));
});
const release = (event) => {
  pressed = false;
  try { stage.releasePointerCapture(event.pointerId); } catch {}
};
stage.addEventListener("pointerup", release);
stage.addEventListener("pointercancel", release);
stage.addEventListener("pointerleave", () => { if (!pressed) steer(target.s); });
stage.addEventListener("focus", () => { announcer.textContent = WORDS[phaseOf(state)]; });
stage.addEventListener("keydown", (event) => {
  const from = touring ? state.s : target.s;
  const step = event.shiftKey ? 0.2 : 0.05;
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") to = from + step;
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = from - step;
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = 1;
  if (event.key === " " || event.key === "Enter") to = from < 0.5 ? 1 + OFF * 0.55 : 0;
  if (event.key === "Escape") {
    clearTimeout(idleTimer);
    touring = !still.matches;
    clock = state.s <= 0.001 ? 0 : resumeClock(state.s);
    run();
    event.preventDefault();
    return;
  }
  if (to === null) return;
  event.preventDefault();
  steer(to);
});

if (still.matches || DATA.hold !== null) {
  touring = false;
  state = { s: DATA.hold ?? 0.55, place: 0, alpha: 1 };
  target = { ...state };
}
still.addEventListener?.("change", () => {
  if (still.matches) {
    touring = false;
    target = { s: state.s, place: 0, alpha: 1 };
  }
  run();
});
draw();
