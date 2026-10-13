// live.js: the page's one loop (design.md E.1). Inlined by build.mjs inside a block, after kitScript() + glScript(),
// the parts namespace HP and the model namespace M, so nothing declared here can collide with a kit name.
const D = __DATA__;
const P = D.P;
const stage = document.querySelector(".hc-stage");
const svg = stage.querySelector("svg");
const readoutEl = document.querySelector("[data-readout]");
const statusEl = stage.querySelector("[data-status]");
const hintEl = document.querySelector("[data-hint]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
if (hintEl && matchMedia("(pointer: coarse)").matches) hintEl.textContent = "Tap to step · drag the strand";

const KIT = { iso, pathOf, cameraOf, towardViewer, solidSvg, lineSvg, ring };
const PARTS = HP.makeParts(KIT, P, D.parts);
const PARTS4 = HP.makeParts(KIT, D.P4, D.parts);                 // B.5: the rebuilt mechanism parts use the fine projection P4
const fineWrap = (inner) => `<g class="hc-fine" transform="scale(${1 / D.FINE})">${inner}</g>`;
const jawEl = svg.querySelector('[data-part="jawA"]');
const pawlEl = svg.querySelector('[data-part="pawl"]');
const springEl = svg.querySelector('[data-part="spring"]');
const tabEl = svg.querySelector('[data-part="springTab"]');
// the key (C5): rebuilt in the page from parts.mjs makeKey with the inlined lathe module GL, in one of four slotted wrappers (D.3)
const KEYP = HP.makeKey(KIT, GL, P), KEY4 = HP.makeKey(KIT, GL, D.P4);
const keyEls = { "key.inner": "keyInner", "key.outer": "keyOuter", "key.inv.inner": "keyInvInner", "key.air": "keyAir" };
for (const n in keyEls) keyEls[n] = svg.querySelector(`[data-part="${keyEls[n]}"]`);
const keyMemo = {}, keyHtml = {};
for (const n in keyEls) { keyMemo[n] = new Map(); keyHtml[n] = null; }
const POSTF = D.key.post, PINF = D.key.pin, PARKED = D.key.parked;

// ---- state: the model is the truth; `cmd` is the follower that feeds it the jaw target
const s = M.create();
let want = s.theta;
const cmd = { x: s.theta, v: 0, mode: "key" };
let clock = 0, frame = 0, last = 0, visible = false;
let pull = null;                                   // a keyboard pull holds its target this long, then lets go
let held = { text: "", until: -1 };                // event strings are held (E.6: at least 0.6 s)
let shownText = readoutEl.textContent, shownJaw = s.theta.toFixed(3);
let said = { status: "open", valuetext: "open" };
let lastBeat = "";
// the pawl's drop is eased, never popped (E.2): `fall` follows α down critically damped (≈ 3 frames, no rebound) and rises with it
const fall = { x: s.alpha, v: 0 };
let alphaShown = s.alpha, shownMech = "";
let ridePeak = 0, ridingNotch = s.notch;            // the lift this click reached: held in the words through the staged snap
let clickAt = -10;                                  // event ages drive the bursts (E.2 envelopes)
// the key's page-side pose (keyPose): tip (F), flip angle phi about F y (0 upright, 180 inverted); κ is the model's
const kp = { tip: PARKED.tip.slice(), phi: 0 };
let kWant = 0;                                      // κ target (keys, drag, director); the model limits it (stops, stall)
let shownKey = "";
// lit (E.5): the owner switches at the contact event; --l eases 0.18 s per part
let litOwner = "pawl", litBack = -1;
const lit = { pawl: { x: 1, v: 0 }, spring: { x: 0, v: 0 } };
let eventAt = -10, eventKind = "click";

// ---- follower: keys and steps ease in and brake on a curve; inside the ratchet a click takes 0.2 s (a hand's quick squeeze);
// the pointer is followed with τ 0.09 s. The model caps everything at 90°/s and refuses what the lock refuses.
const BRAKE = 400, ACCEL = 800, FREE = 90, CLICKING = M.PITCH / 0.2;
function follow(dt, calm) {
  if (calm) { cmd.x = want; cmd.v = 0; return; }
  const d = want - cmd.x;
  if (cmd.mode === "pointer") { cmd.v = 0; cmd.x += Math.sign(d) * Math.min(Math.abs(d) * (1 - Math.exp(-dt / 0.09)), FREE * dt); return; }
  if (Math.abs(d) < 1e-4 && Math.abs(cmd.v) < 2) { cmd.x = want; cmd.v = 0; return; }
  // speed cap: free swing, or the click pace once in (or about to enter) the ratchet, braking toward it
  const toRatchet = d > 0 ? Math.max(0, M.THETA_LEADIN - cmd.x) : 0;
  const inRatchet = cmd.x >= M.THETA_LEADIN - 1e-6 && cmd.x <= M.thetaOf(M.NPOS) + 0.5;
  // outside the ratchet and swinging away from it (opening), the free pace holds; the brake toward `want` still applies below
  const cap = inRatchet ? CLICKING : d < 0 ? FREE : Math.min(FREE, Math.sqrt(CLICKING * CLICKING + 2 * BRAKE * toRatchet));
  const target = Math.sign(d) * Math.min(cap, Math.sqrt(2 * BRAKE * Math.abs(d)));
  cmd.v += Math.max(-ACCEL * dt, Math.min(ACCEL * dt, target - cmd.v));
  const next = cmd.x + cmd.v * dt;
  if ((want - next) * d <= 0) { cmd.x = want; cmd.v = 0; } else cmd.x = next;
}

// ---- drawing: rebuild a part only when its angle string changes
function draw(calm) {
  const key = s.theta.toFixed(3);
  if (key !== shownJaw) { shownJaw = key; jawEl.innerHTML = fineWrap(PARTS4.jawSvg(s.theta, { clipId: "clip-jawA", tone: "hi" })); }
  const mech = `${alphaShown.toFixed(3)}|${s.u.toFixed(3)}|${key}`;    // the pawl's clip follows the strand's top face
  if (mech !== shownMech) {
    shownMech = mech;
    const line = M.springCentreline(s.u, alphaShown);
    pawlEl.innerHTML = fineWrap(PARTS4.pawlSvg(alphaShown, { jaw: PARTS.jawRing(s.theta) }));
    springEl.innerHTML = fineWrap(PARTS4.springSvg(line, alphaShown, { u: s.u }));
    tabEl.innerHTML = fineWrap(PARTS4.tabSvg(line, alphaShown));
  }
  // envelopes (E.2) on the lit part's edge, each from its own event's age
  const env = { click: [0.03, 0.12], touch: [0.05, 0.25], stop: [0.04, 0.18], stall: [0.05, 0.3] }[eventKind] ?? [0.03, 0.12];
  let b = calm ? 0 : Math.max(burst(clock - clickAt, 0.03, 0.12), burst(clock - eventAt, env[0], env[1]));
  if (!calm && eventKind === "stall") b = Math.max(b, burst(clock - eventAt - 0.35, env[0], env[1]));
  const litEl = litOwner === "pawl" ? [pawlEl] : [springEl, tabEl];
  for (const el of [pawlEl, springEl, tabEl]) el.style.setProperty("--hc-burst", litEl.includes(el) ? b.toFixed(3) : "0");
}

// ---- words: readout, aria-valuetext and status all from the same model state (E.6)
const stemOf = (text) => text.replace(/[-−+]?\d.*$/, "");
function say() {
  // words from the shown pawl: while the strand is still on this click, the lift reached is held through the staged snap
  if (s.notch !== ridingNotch || s.dTheta <= 0) { ridePeak = 0; ridingNotch = s.notch; }
  if (s.dTheta > 0) ridePeak = Math.max(ridePeak, s.alpha);
  // events from before the current worded step began do not hold over its words (S3 gate: A4, A9, A16 and the D flight)
  const evs = s.events.filter((e) => !(e.at < wordsAt));
  const r = M.say(Object.assign({}, s, { alpha: Math.max(alphaShown, ridePeak) }), evs, said);
  // an event string holds 0.8 s; the click the strand comes to rest on holds 1.5 s, so a reader stepping by keys sees it land
  // a non-click hold ends early when the readout's wording (not just its numbers) moves on, e.g. "nose inside the case" →
  // "pawl riding up 0.9 mm", so a keyboard swing-in still shows the lead-in (U.1 A2)
  // a contact (touch) holds 0.45 s: the lift or push it starts has its own words right after (U A15, A18)
  const touchOnly = evs.length > 0 && evs.every((e) => e.type === "touch");
  if (r.event) held = { text: r.event, until: clock + (evs.some((e) => e.type === "click") && Math.abs(want - s.theta) < 1e-6 ? 1.5 : touchOnly ? 0.45 : 0.8), click: evs.some((e) => e.type === "click"), stem: stemOf(r.readout) };
  else if (!held.click && clock < held.until && stemOf(r.readout) !== held.stem) held.until = -1;
  // the key passing 0° between turn 1 and turn 2 is not a beat: keep the turn's words for that frame (no "locked …" flicker);
  // only near 0° or while the key still heads back across it, so a hand-turned key's readout follows it (gate round 3 note)
  const kNow = s.key.kappa, crossing = r.phase === "KEYED" && Math.abs(kWant - kNow) > 0.5 && (Math.abs(kNow) < 0.5 || Math.sign(kNow) !== Math.sign(kWant));
  const text = clock < held.until ? held.text : stepWords || (crossing ? shownText : r.readout);
  if (text !== shownText) { readoutEl.textContent = text; shownText = text; }
  if (r.valuetext) { stage.setAttribute("aria-valuetext", r.valuetext); said.valuetext = r.valuetext; }
  stage.setAttribute("aria-valuenow", String(s.notch));
  if (r.status) { said.status = r.status; if (document.activeElement === stage) statusEl.textContent = r.status; }
}

// one frame: the elapsed time (clamped at 0.25 s, so a background tab does not jump) is advanced in sub-steps of at most 1/30 s,
// so the tour keeps real time on a slow machine while every follower and spring keeps its stable step; parts are drawn once
function tick(now) {
  const real = last ? Math.min((now - last) / 1000, 0.25) : 1 / 60;
  last = now;
  const calm = still.matches;
  const n = Math.max(1, Math.ceil(real / (1 / 30) - 1e-9)), dt = real / n;
  const evAll = [];
  let scripted = false, litMoving = false, falling = false, cam = false;
  for (let i = 0; i < n; i++) {
    clock += dt;
    if (tourAt >= 0 && !touring && clock >= tourAt && tourAt !== Infinity) { touring = true; tourAt = Infinity; }
    if (pull && clock >= pull.until) { pull = null; want = s.theta; cmd.x = s.theta; cmd.v = 0; }
    scripted = runSteps(dt, calm) || scripted;
    if (cmd.mode === "direct" && (cur || scripted)) { cmd.x = want; cmd.v = 0; } else follow(dt, calm);
    const at = stationOf();
    const keyWant = { at, depth: at === "keyhole" && kp.tip[2] <= M.GEO.KEY_TIP_SEATED + 1e-6 ? 1 : 0, kappa: kFollow(dt, calm) };
    if (at === "slot") keyWant.pinY = kp.tip[1];
    M.step(s, { jaw: calm ? want : cmd.x, key: keyWant }, calm ? 2 : dt);
    if (Math.abs(s.theta - cmd.x) > 1e-9) { cmd.x = s.theta; cmd.v = 0; }   // the lock refused: no wind-up
    if (s.events.some((e) => e.type === "click")) clickAt = clock;
    onEvents(calm);
    for (const e of s.events) e.at = clock;
    evAll.push(...s.events);
    litMoving = stepLit(dt, calm);
    falling = false;
    if (s.alpha >= fall.x || calm) { fall.x = s.alpha; fall.v = 0; }
    else { falling = settle(fall, s.alpha, dt, 0.018, calm); if (fall.x < s.alpha) { fall.x = s.alpha; fall.v = 0; } if (!falling) { fall.x = s.alpha; fall.v = 0; } }
    alphaShown = Math.max(s.alpha, fall.x);
    cam = stepCamera(dt, calm) || cam;
  }
  if (cam || calm) writeView();
  s.events = evAll;                                   // the readout sees every event of the frame
  draw(calm);
  drawKey();
  say();
  const keyMoving = Math.abs(kWant - s.key.kappa) > 1e-6 && Math.abs(s.key.kappa - kLast) > 1e-9;
  kLast = s.key.kappa;
  const moving = cmd.v !== 0 || Math.abs(want - s.theta) > 1e-9 || pull || clock < held.until || falling || cam || clock - clickAt < 0.6 ||
    scripted || cur || queue.length || touring || keyMoving || litMoving || clock - eventAt < 0.8 || (tourAt >= 0 && tourAt !== Infinity);
  frame = visible && moving ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible && tourAt < 0 && !still.matches) tourAt = clock + 1.4;              // the tour starts 1.4 s after first view (E.4)
  if (visible) run();
}, { rootMargin: "120px 0px" }).observe(stage);

// ---- camera (B.5): two framings, eased with settle (0.42 s per axis on cx, cy and ln zoom), started only at beat boundaries;
// the viewBox is written only while it moves; data-zoomed switches the edge feather on
const [VWd, VHd] = D.view;
const camState = { cx: { x: D.framings.pair.cx, v: 0 }, cy: { x: D.framings.pair.cy, v: 0 }, lz: { x: 0, v: 0 } };
let framing = "pair";
const CAM_T = 0.2;
function writeView() {
  const z = Math.exp(camState.lz.x), w = VWd / z, h = VHd / z;
  svg.setAttribute("viewBox", `${(camState.cx.x - w / 2).toFixed(2)} ${(camState.cy.x - h / 2).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
  const css = svg.getBoundingClientRect().width || VWd;
  svg.style.setProperty("--hc-k", (w / css).toFixed(4));
  if (z > 1.05) svg.setAttribute("data-zoomed", ""); else svg.removeAttribute("data-zoomed");
}
function stepCamera(dt, calm) {
  const f = D.framings[framing];
  // 0.2 s (design B.5 says 0.42 "arrives in about 1.2 s"; the kit's settle with 0.42 is still 13–22% short at 1.2–1.8 s: S2 note)
  const a = settle(camState.cx, f.cx, dt, CAM_T, calm), b = settle(camState.cy, f.cy, dt, CAM_T, calm), c = settle(camState.lz, Math.log(f.z), dt, CAM_T, calm);
  return a || b || c;
}
function toggleFraming() { if (drag && !drag.tap) return; framing = framing === "pair" ? "lock" : "pair"; run(); }

// ---- the key's stations (C5): from its pose, where it is for the model and which slotted pieces draw it (D.3)
const near2 = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
function stationOf() {
  if (kp.phi === 0 && near2(kp.tip, POSTF) && kp.tip[2] <= 6.2 + 1e-9) return "keyhole";
  if (kp.phi === 180 && Math.abs(kp.tip[0] - PINF.x) < 1e-6 && kp.tip[2] - KEYP.LEN <= 4.3 + 1e-9) return "slot";
  if (kp.phi === 0 && near2(kp.tip, PARKED.tip) && kp.tip[2] <= PARKED.tip[2] + 1e-6) return "stand";
  return "air";
}
function keyPieces(at, pose) {
  const L = KEYP.LEN, out = { "key.inner": null, "key.outer": null, "key.inv.inner": null, "key.air": null };
  if (at === "stand") out["key.outer"] = [0, L];
  else if (at === "air") out["key.air"] = [0, L];
  else if (at === "keyhole") { const f = 4.3 - pose.tip[2]; if (f <= 0) out["key.outer"] = [0, L]; else { out["key.inner"] = [0, f]; out["key.outer"] = [f, L]; } }
  else { const f = pose.tip[2] - 4.3; if (f >= L) out["key.outer"] = [0, L]; else { out["key.inv.inner"] = [f, L]; out["key.outer"] = [0, f]; } }
  return out;
}
function drawKey() {
  const at = stationOf(), pose = { tip: kp.tip, phi: kp.phi, kappa: kp.phi === 0 ? s.key.kappa : 0 };
  const sig = `${at}|${pose.tip.map((v) => v.toFixed(3)).join(",")}|${pose.phi.toFixed(2)}|${pose.kappa.toFixed(2)}`;
  if (sig === shownKey) return;
  shownKey = sig;
  const pieces = keyPieces(at, pose);
  for (const n in pieces) {
    const r = pieces[n];
    // key.inner (the short barrel and the flag inside the case) uses the fine projection P4; the rest is built at P
    const html = !(r && r[1] > r[0]) ? "" : n === "key.inner" ? fineWrap(KEY4.keySvg(pose, { lo: r[0], hi: r[1], memo: keyMemo[n] })) : KEYP.keySvg(pose, { lo: r[0], hi: r[1], memo: keyMemo[n] });
    if (html !== keyHtml[n]) { keyHtml[n] = html; keyEls[n].innerHTML = html; }
  }
}

// ---- steps: one queue serves the tour, Space/Enter, taps, the keys and (S5) the chapter buttons. A step runs for `dur` s;
// each act(f) sets the targets for its fraction f (0…1); the model refuses what the lock refuses. Cameras switch at step starts.
const smooth01 = (f) => f * f * (3 - 2 * f);
const minjerk = (f) => f * f * f * (10 - 15 * f + 6 * f * f);
const lerp = (a, b, f) => a + (b - a) * f;
let queue = [], cur = null, stepT = 0;
const steps = (...list) => list.flat();
function jawTo(theta1, ease = smooth01) { let a; return (f, first) => { if (first) a = s.theta; cmd.mode = "direct"; want = lerp(a, theta1, ease(f)); }; }
function turnTo(kappa1) { let a; return (f, first) => { if (first) a = s.key.kappa; kWant = lerp(a, kappa1, f); }; }
// a turn whose target leaves from a fixed angle: A17 starts its lerp at 0° even when A16 (194° in 0.7 s against the model's 240°/s)
// has not quite reached 0°, so the key crosses 0° under A16's words, not "turn 1 · 20°" (S3 gate round 3 note)
function turnFrom(kappa0, kappa1) { return (f) => { kWant = lerp(kappa0, kappa1, f); }; }
// key moves: a straight translation of the tip (lift, descent, pin slide) or a flight of the flip centre (s 22.85) on a
// quadratic Bezier through `via`, the key turning about its ring normal (F y) from phi0 to phi1 (minimum jerk)
function keyLine(tip1, profile = minjerk) { let a; return (f, first) => { if (first) a = kp.tip.slice(); const g = profile(f); kp.tip = a.map((v, i) => lerp(v, tip1[i], g)); }; }
function keyFly(tip1, phi1, via) {
  let c0, c1, ctrl, phi0;
  return (f, first) => {
    if (first) {
      phi0 = kp.phi; c0 = KEYP.centreOf({ tip: kp.tip, phi: phi0 }); c1 = KEYP.centreOf({ tip: tip1, phi: phi1 });
      const mid = via ?? [(c0[0] + c1[0]) / 2, (c0[1] + c1[1]) / 2, Math.max(c0[2], c1[2]) + 8];
      ctrl = c0.map((v, i) => 2 * mid[i] - (v + c1[i]) / 2);
    }
    const g = minjerk(f), h = 1 - g;
    const c = c0.map((v, i) => h * h * v + 2 * h * g * ctrl[i] + g * g * c1[i]);
    const phi = f >= 1 ? phi1 : lerp(phi0, phi1, g);
    kp.phi = phi; kp.tip = KEYP.tipOfCentre(c, { phi });
  };
}
const ABOVE_KEYHOLE = [POSTF[0], POSTF[1], 16 - D.key.z0];          // tip at W z 16
const ABOVE_SLOT = (y) => [PINF.x, y, 8 + KEYP.LEN];                 // inverted: pin tip at F z 8
const PARK_HOVER = [PARKED.tip[0], PARKED.tip[1], PARKED.tip[2] + 6];
// the descent into the keyhole slows while the bore passes the post tip (F 3.8) and the flag passes the notch (E.2, U A12)
const descend = (f) => (f < 0.35 ? 0.5 * minjerk(f / 0.35) : f < 0.88 ? 0.5 + 0.38 * ((f - 0.35) / 0.53) : 0.88 + 0.12 * Math.sin(((f - 0.88) / 0.12) * Math.PI / 2));
const S = (dur, acts, extra = {}) => ({ dur, acts: [].concat(acts), ...extra });
// Loop A (U.1–U.3)
function loopA() {
  const t9 = M.thetaOf(9), out = [];
  out.push(S(1.2, [], { name: "A0", cam: "pair", words: "open · key parked" }));
  out.push(S(1.6, jawTo(-24.0), { name: "A1", cam: "lock" }));
  out.push(S(0.7, jawTo(M.THETA1 + 0.1, (f) => f), { name: "A2" }));
  for (let n = 1; n < 9; n++) { out.push(S(0.33, jawTo(M.thetaOf(n + 1) + 0.1), { name: "A3" })); out.push(S(0.12, [], { name: "A3" })); }
  out.push(S(0.7, [], { name: "A4", words: `locked · 9 of ${M.NPOS} · inside ${Math.round(M.loopAt(t9).perimeter)} mm` }));
  out.push(S(0.8, jawTo(t9 - 6), { name: "A5" }), S(0.4, (f, first) => { if (first) want = s.theta; }, { name: "A5" }));
  out.push(S(0.3, keyLine(PARK_HOVER), { name: "A6", words: "key · pin end down to the slot" }));
  out.push(S(1.1, keyFly(ABOVE_SLOT(PINF.yEnter), 180, [95, -30, 28]), { name: "A6", words: "key · pin end down to the slot" }));
  out.push(S(0.4, keyLine([PINF.x, PINF.yEnter, PINF.tipZ + KEYP.LEN]), { name: "A7", words: "pin in the slot" }));
  // the slide ends 0.3 s before the beat does, so the detent's words are read before A9's (S3 gate)
  out.push(S(0.9, keyLine([PINF.x, PINF.yEnd, PINF.tipZ + KEYP.LEN], smooth01), { name: "A8" }), S(0.3, [], { name: "A8" }));
  out.push(S(0.4, keyLine(ABOVE_SLOT(PINF.yEnd)), { name: "A9", words: `double-locked · 9 of ${M.NPOS} · ${Math.round(M.loopAt(t9).perimeter)} mm` }));
  // the squeeze test, then back onto the faces at θ9 (design says want θ9 − 2; that reads as a second pull test, "pull blocked")
  out.push(S(0.8, jawTo(t9 + 2.6, (f) => Math.min(1, f * 4)), { name: "A10" }), S(0.6, jawTo(t9, (f) => Math.min(1, f * 4)), { name: "A10" }));
  out.push(S(1.6, keyFly(ABOVE_KEYHOLE, 0, [85, -12, 40]), { name: "A11", words: "key to the keyhole" }));
  out.push(S(0.8, keyLine([POSTF[0], POSTF[1], M.GEO.KEY_TIP_SEATED], descend), { name: "A12", words: "key in · bore over the post" }));
  out.push(S(0.2, (f, first) => { if (first) want = s.theta; }, { name: "A13" }));
  out.push(S(0.7, turnTo(M.KEY.touchFlange), { name: "A14" }));
  out.push(S(1.4, turnTo(M.KEY.endTurn1), { name: "A15" }), S(0.4, [], { name: "A15" }));   // at the stop 0.4 s before A16 (S3 gate)
  out.push(S(0.7, turnTo(0), { name: "A16", words: "key back to 0° · spring stays off" }));
  out.push(S(0.4, turnFrom(0, M.KEY.touchShoulder), { name: "A17" }));
  out.push(S(1.1, turnTo(M.KEY.endOff), { name: "A18" }), S(0.4, [], { name: "A18" }));
  out.push(S(1.5, jawTo(-45), { name: "A19" }));
  out.push(S(0.7, turnTo(0), { name: "A20", words: "key back · pawl drops to its stud" }));
  out.push(S(0.6, keyLine(ABOVE_KEYHOLE), { name: "A21", words: "key out" }));
  out.push(S(1.2, [keyFly(PARK_HOVER, 0, [92, -36, 40]), jawTo(M.THETA_OPEN)], { name: "A22", cam: "pair", words: "open · key parked" }));
  out.push(S(0.4, keyLine(PARKED.tip), { name: "A22", words: "open · key parked" }));
  out.push(S(1.6, [], { name: "A23" }));
  return out;
}
// user moves of the key (K, D, arming): from wherever the key is, the same paths as the tour. Out of a station first (κ back
// to 0, then straight up), a flight to the target's hover point (flipping to its phi), then the descent
const SEATED = [POSTF[0], POSTF[1], M.GEO.KEY_TIP_SEATED];
function keyGo(target) {
  const out = [], at = stationOf();
  const done = target === "keyhole" ? at === "keyhole" && kp.tip[2] <= SEATED[2] + 1e-6 : at === target;
  if (done) return out;
  if (at === "keyhole" && Math.abs(s.key.kappa) > 0.5) out.push(S(0.6, turnTo(0), { words: s.key.kappa > 0 ? "key back to 0° · spring stays off" : "key back · pawl drops to its stud" }));
  if (at === "keyhole" && target !== "keyhole") out.push(S(0.6, keyLine(ABOVE_KEYHOLE), { words: "key out" }));
  else if (at === "slot") out.push(S(0.4, keyLine(ABOVE_SLOT(kp.tip[1]))));
  else if (at === "stand") out.push(S(0.3, keyLine(PARK_HOVER), { words: target === "slot" ? "key · pin end down to the slot" : "key to the keyhole" }));
  if (target === "keyhole") {
    if (at !== "keyhole") out.push(S(1.2, keyFly(ABOVE_KEYHOLE, 0, kp.phi > 90 ? [85, -12, 40] : null), { words: "key to the keyhole" }));
    out.push(S(0.8, keyLine(SEATED, descend), { words: "key in · bore over the post" }));
  } else if (target === "slot") {
    out.push(S(1.1, keyFly(ABOVE_SLOT(PINF.yEnter), 180, [95, -30, 28]), { words: "key · pin end down to the slot" }));
    out.push(S(0.4, keyLine([PINF.x, PINF.yEnter, PINF.tipZ + KEYP.LEN]), { words: "pin in the slot" }));
  } else {
    out.push(S(1.2, keyFly(PARK_HOVER, 0, kp.phi > 90 ? [95, -30, 28] : null), { words: "" }));
    out.push(S(0.4, keyLine(PARKED.tip), { words: "open · key parked" }));
  }
  return out;
}
// D: the pin into the slot, slid 4 mm toward the keyhole, out again, and the key home
const doubleLockSteps = () => [...keyGo("slot"), S(0.9, keyLine([PINF.x, PINF.yEnd, PINF.tipZ + KEYP.LEN], smooth01), { beat: "dl" }), S(0.3, []),
  S(0.4, keyLine(ABOVE_SLOT(PINF.yEnd))), S(1.4, keyFly(PARK_HOVER, 0, [95, -30, 28])), S(0.4, keyLine(PARKED.tip))];
const closeSteps = () => [S(1.6, jawTo(-24.0), { cam: "lock", beat: "close" }), S(0.7, jawTo(M.THETA1 + 0.1, (f) => f)),
  ...Array.from({ length: 8 }, (_, i) => [S(0.33, jawTo(M.thetaOf(i + 2) + 0.1)), S(0.12, [])]).flat(), S(0.7, [])];
const pullSteps = () => [S(0.8, jawTo(s.theta - 6), { beat: "pull" }), S(0.4, (f, first) => { if (first) want = s.theta; })];
const squeezeSteps = () => [S(0.8, jawTo(M.thetaOf(Math.max(1, s.notch)) + 2.6, (f) => Math.min(1, f * 4)), { beat: "squeeze" }), S(0.6, jawTo(M.thetaOf(Math.max(1, s.notch)), (f) => Math.min(1, f * 4)))];
const isRest = () => s.notch === 0 && s.theta <= M.THETA_OPEN + 5 && stationOf() === "stand" && Math.abs(s.key.kappa) < 0.5 && s.u < 0.05;   // turn 1 leaves u 0.02 (KEY1's last sample)
// next beat from the state (E.4 table)
function nextBeatSteps() {
  const at = stationOf(), n = s.notch, kap = s.key.kappa, ph = M.classify(s);
  if (at === "air") return keyGo(Math.abs(kp.phi - 180) < 1 ? "slot" : "stand");
  if (at === "slot") return s.u < 3.99 ? [S(0.9, keyLine([PINF.x, PINF.yEnd, PINF.tipZ + KEYP.LEN], smooth01)), S(0.3, []), S(0.4, keyLine(ABOVE_SLOT(PINF.yEnd))), ...[S(1.4, keyFly(PARK_HOVER, 0, [95, -30, 28])), S(0.4, keyLine(PARKED.tip))]]
    : [S(0.4, keyLine(ABOVE_SLOT(PINF.yEnd))), S(1.4, keyFly(PARK_HOVER, 0, [95, -30, 28])), S(0.4, keyLine(PARKED.tip))];
  if (at === "keyhole") {
    if (kp.tip[2] > SEATED[2] + 1e-6) return keyGo("keyhole");
    if (Math.abs(kap) <= 0.5) {
      if (s.u > M.U_RELEASED) return [S(0.7, turnTo(M.KEY.touchFlange)), S(1.4, turnTo(M.KEY.endTurn1)), S(0.4, [])];
      if (n > 0) return [S(0.4, turnTo(M.KEY.touchShoulder)), S(1.1, turnTo(M.KEY.endOff)), S(0.4, [])];
      const home = keyGo("stand");
      if (s.theta > M.THETA_OPEN + 1) home.splice(Math.max(0, home.length - 2), 1, S(1.2, [home[home.length - 2].acts[0], jawTo(M.THETA_OPEN)], { cam: "pair", words: "open · key parked" }));
      return home;
    }
    if (kap > 0) return [S(0.7, turnTo(0), { words: "key back to 0° · spring stays off" })];
    if (ph === "RELEASED" && n > 0) return [S(1.5, jawTo(-45))];
    return [S(0.7, turnTo(0), { words: n === 0 ? "key back · pawl drops to its stud" : "" })];
  }
  if (n === 0) return s.u >= 3.9 ? keyGo("keyhole") : closeSteps();
  if (ph === "LOCKED") return lastBeat !== "pull" ? pullSteps() : doubleLockSteps();
  if (ph === "DOUBLE") return lastBeat !== "squeeze" ? squeezeSteps() : keyGo("keyhole");
  return [];
}
// the runner: one step at a time; the tour refills the queue (Loop A from REST, else the next beat until REST)
let touring = false, tourAt = -1, hoverPause = false, resumeTimer = 0, stepWords = "", wordsAt = -1;
function runSteps(dt, calm) {
  if (!cur) {
    if (!queue.length && touring && !hoverPause) queue = isRest() ? loopA() : nextBeatSteps();
    if (!queue.length) { stepWords = ""; return false; }
    cur = queue.shift(); stepT = 0; cur.first = true;
    if (cur.words) { wordsAt = clock; held.until = -1; }                        // a worded step's words win over an older held event
    if (cur.cam && !(drag && !drag.tap)) framing = cur.cam;
    if (cur.beat) lastBeat = cur.beat;
  }
  stepT += calm ? cur.dur : dt;
  const f = Math.min(1, stepT / cur.dur);
  for (const act of cur.acts) act(f, cur.first);
  cur.first = false;
  stepWords = cur.words ?? "";
  if (f >= 1) cur = null;
  return true;
}
function takeOver() {
  // the visible state becomes the target only when a tour, step or queue was driving it; otherwise the reader's own targets
  // stand, so quick repeated presses add up (S3 gate round 3: three quick → land on position 3, as in S1 and S2)
  const busy = touring || cur || queue.length;
  touring = false; queue = []; cur = null; stepWords = "";
  if (tourAt >= 0) tourAt = Infinity;                                         // input before the tour's start cancels it too
  if (busy) { want = s.theta; cmd.x = s.theta; cmd.v = 0; kWant = s.key.kappa; }
  clearTimeout(resumeTimer);
  if (!still.matches) resumeTimer = setTimeout(() => { touring = true; run(); }, 3600);
}
const play = (list) => { takeOver(); queue = list; run(); };
// κ follower: the pointer is followed with τ 0.08 s; keys and the director hand the model their target (it limits to 240°/s)
let kMode = "direct", kCmd = 0, kLast = 0;
function kFollow(dt, calm) {
  if (calm || kMode !== "pointer") { kCmd = kWant; return kWant; }
  kCmd += (kWant - kCmd) * (1 - Math.exp(-dt / 0.08));
  return kCmd;
}
// lit owner switches at the contact event (E.5); bursts from each event's age (E.2)
function setOwner(o) { litOwner = o; }
function mark(kind) { eventAt = clock; eventKind = kind; }
function onEvents() {
  for (const e of s.events) {
    if (e.type === "touch") { setOwner(e.what === "shoulder" ? "pawl" : "spring"); mark("touch"); }
    else if (e.type === "stall") { setOwner("spring"); litBack = clock + 0.6; mark("stall"); if (document.activeElement === stage) statusEl.textContent = "still double-locked: turn toward the swivel first"; }
    else if (e.type === "blocked") { if (e.why === "double lock") setOwner("spring"); mark("stall"); }
    else if (e.type === "stop" || e.type === "dl" || e.type === "clear") mark("stop");
  }
  if (litBack > 0 && clock >= litBack) { litBack = -1; setOwner("pawl"); }
}
function stepLit(dt, calm) {
  const a = settle(lit.pawl, litOwner === "pawl" ? 1 : 0, dt, 0.18, calm), b = settle(lit.spring, litOwner === "spring" ? 1 : 0, dt, 0.18, calm);
  pawlEl.style.setProperty("--l", lit.pawl.x.toFixed(3));
  springEl.style.setProperty("--l", lit.spring.x.toFixed(3));
  tabEl.style.setProperty("--l", lit.spring.x.toFixed(3));
  return a || b;
}

// ---- intents
const notchOfWant = () => (want < M.THETA1 ? 0 : M.notchAt(want));
function squeeze(clicks) {
  cmd.mode = "key"; pull = null;
  const n = notchOfWant();
  want = n === 0 ? M.thetaOf(1) + M.PITCH * (clicks - 1) : M.thetaOf(Math.min(M.NPOS, n + clicks));
  want = Math.min(want, M.thetaOf(M.NPOS));
  lastBeat = "squeeze";
  run();
}
function pullOpen(clicks, full = false) {
  cmd.mode = "key";
  if (s.notch === 0 && s.theta <= M.THETA_FREE_OPEN) { want = M.THETA_OPEN; pull = null; }
  else {
    want = full ? M.THETA_OPEN : (s.notch > 0 ? M.thetaOf(s.notch) : s.theta) - M.PITCH * clicks;
    pull = { until: clock + 0.8 };                    // the hand pulls for 0.8 s, then lets go (U.1 A5)
  }
  lastBeat = "pull";
  run();
}
function release() { pull = null; want = s.theta; cmd.x = s.theta; cmd.v = 0; run(); }
function nextBeat() {                                // Space, Enter, a tap: the next beat from the state (E.4), after any step in progress
  if ((cur || queue.length) && !touring) return;                            // it waits while a beat is playing
  takeOver();                                                                  // the tour hands over from the visible state
  const list = nextBeatSteps();
  queue = list; run();
}
// key intents (E.4 keys): ↑/↓ turn 15° (Shift: to the next stop), K stand ↔ keyhole, D double-lock, 0 key back to 0°
const seated = () => stationOf() === "keyhole" && kp.tip[2] <= SEATED[2] + 1e-6;
function turnBy(dir, toStop) {
  if (!seated()) { play([...keyGo("keyhole")]); return; }                      // arming: the key goes in first
  takeOver();
  const stops = dir > 0 ? [M.KEY.touchFlange, M.KEY.dlReleased, M.KEY.endTurn1] : [M.KEY.touchShoulder, M.KEY.stallOn, M.KEY.teethClear, M.KEY.endOff].map((v) => v);
  const k0 = s.key.kappa;
  if (toStop) { const next = dir > 0 ? stops.find((v) => v > k0 + 0.5) : stops.find((v) => v < k0 - 0.5); kWant = next ?? (dir > 0 ? M.KEY.endTurn1 : M.KEY.endOff); }
  else kWant = Math.max(M.KEY.endOff - 4, Math.min(M.KEY.endTurn1 + 4, k0 + 15 * dir));
  lastBeat = "turn";
  run();
}
function keyK() {
  if (seated() && Math.abs(s.key.kappa) > 0.5) { play([S(0.7, turnTo(0))]); return; }
  play(seated() ? keyGo("stand") : keyGo("keyhole"));
}
function keyD() { play(doubleLockSteps()); }
function keyZero() { if (seated()) { takeOver(); kWant = 0; run(); } }

stage.addEventListener("keydown", (e) => {
  const map = {
    ArrowRight: () => squeeze(e.shiftKey ? 5 : 1),
    ArrowLeft: () => pullOpen(e.shiftKey ? 5 : 1),
    End: () => squeeze(M.NPOS),
    Home: () => pullOpen(0, true),
    " ": nextBeat,
    Enter: nextBeat,
    Escape: () => { takeOver(); release(); },
    ArrowUp: () => turnBy(1, e.shiftKey),
    ArrowDown: () => turnBy(-1, e.shiftKey),
    k: keyK, K: keyK, d: keyD, D: keyD, 0: keyZero,
    z: toggleFraming,
    Z: toggleFraming,
  };
  const act = map[e.key];
  if (!act) return;
  e.preventDefault();
  if (["ArrowRight", "ArrowLeft", "End", "Home"].includes(e.key)) takeOver();
  act();
});
stage.addEventListener("focus", () => { statusEl.textContent = said.status; });
stage.addEventListener("blur", () => { statusEl.textContent = ""; });

// ---- pointer: drag the strand about the hinge (E.4). Screen → viewBox → W plane at F z 0 (W z 4.8) → F
const { sinA, cosA, sinE, cosE, k: KK } = cameraOf(P);
function toF(e, zW = 4.8) {
  const box = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
  const x = vb.x + ((e.clientX - box.left) / box.width) * vb.width, y = vb.y + ((e.clientY - box.top) / box.height) * vb.height;
  const a = (x - P.origin[0]) / KK, b = ((y - P.origin[1]) / KK + zW * cosE) / sinE;
  const wx = a * sinA + b * cosA, wy = -a * cosA + b * sinA;
  return [wx, -wy];
}
const angleOf = ([x, y]) => (Math.atan2(y, x) * 180) / Math.PI;
function onJaw(p, slackMm) {
  const ring = PARTS.jawRing(s.theta);
  let inside = false, best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
    const dx = xi - xj, dy = yi - yj, l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - xj) * dx + (p[1] - yj) * dy) / l2));
    best = Math.min(best, Math.hypot(p[0] - xj - t * dx, p[1] - yj - t * dy));
  }
  return inside || best <= slackMm;
}
let drag = null;
// the key column on screen (viewBox px): the segment from the barrel tip to the pin tip, for hits on the key and the stand
function nearKey(e, slackCss) {
  const box = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
  const q = [vb.x + ((e.clientX - box.left) / box.width) * vb.width, vb.y + ((e.clientY - box.top) / box.height) * vb.height];
  const pose = { tip: kp.tip, phi: kp.phi, kappa: 0 };
  const W3 = (p) => [p[0], -p[1], p[2] + D.key.z0];
  const a = iso(W3(KEYP.pointAt(pose, 0)), P), b = iso(W3(KEYP.pointAt(pose, KEYP.LEN)), P), c = iso(W3(KEYP.pointAt(pose, KEYP.RING_S)), P);
  const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  const slack = (slackCss * vb.width) / box.width;
  return Math.hypot(q[0] - a[0] - t * dx, q[1] - a[1] - t * dy) <= slack || Math.hypot(q[0] - c[0], q[1] - c[1]) <= 7.6 * KK + slack;
}
svg.addEventListener("pointerdown", (e) => {
  const p = toF(e);
  const mmPerCss = svg.viewBox.baseVal.width / svg.getBoundingClientRect().width / KK;   // viewBox px per css px, over px per mm
  // key drag (E.4, direct manipulation): seated, within 14 css px of the column or the bow; ψ about the post at the bow height
  if (seated() && nearKey(e, 14)) {
    const q = toF(e, 35.1), psi = angleOf([q[0] - POSTF[0], q[1] - POSTF[1]]);
    drag = { key: true, id: e.pointerId, last: psi, turned: 0, kappa0: s.key.kappa, captured: false };
    stage.dataset.dragging = "";
    return;
  }
  if (stationOf() === "stand" && nearKey(e, 10)) { drag = { tap: true, stand: true, x: e.clientX, y: e.clientY }; return; }
  if (!onJaw(p, 8 * mmPerCss)) { drag = { tap: true, x: e.clientX, y: e.clientY }; return; }
  drag = { id: e.pointerId, a0: angleOf(p), last: angleOf(p), turned: 0, theta0: s.theta, captured: false };
  stage.dataset.dragging = "";
});
svg.addEventListener("pointermove", (e) => {
  if (!drag || drag.tap) return;
  if (drag.key) {
    const q = toF(e, 35.1), psi = angleOf([q[0] - POSTF[0], q[1] - POSTF[1]]);
    let d = psi - drag.last;
    if (d > 180) d -= 360; else if (d < -180) d += 360;
    drag.last = psi; drag.turned += d;
    if (!drag.captured && Math.abs(drag.turned) >= 1.5) { drag.captured = true; svg.setPointerCapture(drag.id); takeOver(); kMode = "pointer"; kCmd = s.key.kappa; }
    if (!drag.captured) return;
    kWant = Math.max(M.KEY.endOff - 30, Math.min(M.KEY.endTurn1 + 30, drag.kappa0 + drag.turned));   // the model stops the flag; it lags the pointer
    lastBeat = "turn";
    run();
    return;
  }
  const a = angleOf(toF(e));
  let d = a - drag.last;
  if (d > 180) d -= 360; else if (d < -180) d += 360;
  drag.last = a; drag.turned += d;
  if (!drag.captured && Math.abs(drag.turned) >= 1.5) { drag.captured = true; svg.setPointerCapture(drag.id); takeOver(); }
  if (!drag.captured) return;
  cmd.mode = "pointer"; pull = null;
  want = Math.max(M.THETA_OPEN - 2, Math.min(M.thetaOf(M.NPOS) + 3, drag.theta0 + drag.turned));
  lastBeat = "drag";
  run();
});
function endDrag(e) {
  if (!drag) return;
  if (drag.tap) { if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) { if (drag.stand) keyK(); else nextBeat(); } }
  else if (drag.key) { if (drag.captured && svg.hasPointerCapture(drag.id)) svg.releasePointerCapture(drag.id); kWant = s.key.kappa; kMode = "direct"; run(); }
  else { if (drag.captured && svg.hasPointerCapture(drag.id)) svg.releasePointerCapture(drag.id); want = s.theta; cmd.x = s.theta; cmd.v = 0; run(); }
  drag = null;
  delete stage.dataset.dragging;
}
svg.addEventListener("pointerup", endDrag);
svg.addEventListener("pointercancel", endDrag);

// hover pauses the tour at the next step boundary (E.4)
stage.addEventListener("pointerenter", () => { hoverPause = true; });
stage.addEventListener("pointerleave", () => { hoverPause = false; run(); });
// reduced motion (E.7): no tour; at load the still: position 9, u 0, key seated at κ −80 (teeth up 1.43), pawl lit, pair framing
if (still.matches) {
  want = M.thetaOf(9); cmd.x = want;
  M.step(s, { jaw: want }, 2);
  kp.tip = SEATED.slice(); kp.phi = 0;
  M.step(s, { key: { at: "keyhole", depth: 1 } }, 1 / 60);
  kWant = -80;
  M.step(s, { jaw: want, key: { at: "keyhole", depth: 1, kappa: -80 } }, 2);
  fall.x = s.alpha; alphaShown = s.alpha;
  draw(true); drawKey(); held.until = -1; say();
}
