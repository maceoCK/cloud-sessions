// Fig. VIII · school. A precision linear stage on a lead screw that runs two
// years end to end, from Penn State to Virginia Tech. A handwheel turns the
// screw; the carriage rides a ruler graduated in months, 0 to 24, and the
// gauge on the carriage reads the cumulative GPA: 4.0.
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";

const WIDTH = 600;
const HEIGHT = 380;
const AZIMUTH = 30;

const MONTHS = 24;
const PER_MONTH = 7.6; // world units of travel per month
const Y0 = (MONTHS * PER_MONTH) / 2; // month 0 sits at +Y0 (Penn State)
const PITCH = 15.2; // travel per turn of the screw: two months
const BED = { x: -32, y: -Y0 - 40, w: 64, d: 2 * Y0 + 92, r: 6 };
const BED_H = 10;
const RAIL_X = 16;
const SCREW_Z = BED_H + 9;
const SCREW_R = 3;
const CAR = { w: 46, d: 30 };
const CAR_Z = BED_H + 6; // carriage underside
const CAR_H = 8;
const WHEEL_Y = Y0 + 34;
const WHEEL_R = 15;
const GPA = 4.0;

const P = k.fitProjection([...k.boxCorners(BED, -BED_H - 6, 0), [0, WHEEL_Y + 4, SCREW_Z + WHEEL_R + 2], [0, Y0, CAR_Z + CAR_H + 26]], WIDTH, HEIGHT, { pad: 26, azimuth: AZIMUTH });

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const r1 = (n) => Math.round(n * 10) / 10;
const yOf = (month) => Y0 - month * PER_MONTH;
const Y_AXIS = G.frameOf([0, 0, SCREW_Z], [0, -1, 0], [1, 0, 0], [0, 0, 1]);

function bed() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BED, -BED_H - 6, BED_H, P)}"/>`];
  for (const [x, y] of k.corners(BED, 12).sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P))) {
    out.push(S(k.cylinder(x, y, 6, -BED_H - 6, 1.6, P, 26), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 4.6, -BED_H - 4.4, 4.4, P, 26), { tone: "mid" }));
  }
  out.push(S(k.slabOf(BED, -BED_H, BED_H, P, 6, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BED, 4.4), 0, P), { tone: "lo" }));
  const screws = k.corners(BED, 8);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  // the month ruler along the near edge: a tick a month, a major every six
  const strip = { x: RAIL_X + 6, y: yOf(MONTHS) - 4, w: 7, d: MONTHS * PER_MONTH + 8, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const minor = [];
  const major = [];
  for (let m = 0; m <= MONTHS; m++) {
    const y = yOf(m);
    const len = m % 6 === 0 ? 5 : 2.6;
    (m % 6 === 0 ? major : minor).push(k.lineOnTop([strip.x + strip.w, y], [strip.x + strip.w - len, y], 0.6, P));
  }
  out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "mid" }));
  out.push(L(k.lineOnTop([strip.x + strip.w - 5, yOf(0)], [strip.x + 0.8, yOf(0)], 0.6, P), { tone: "hi" }));
  return out.join("");
}

function rail(x) {
  const out = [S(k.slabOf({ x: x - 3, y: yOf(MONTHS) - 22, w: 6, d: MONTHS * PER_MONTH + 44, r: 1 }, 0, 5, P, 2, 0.4), { tone: "mid" })];
  // countersunk screws down the rail's top
  const pts = [];
  for (let m = 0; m <= MONTHS; m += 4) pts.push(at([x, yOf(m), 5]));
  out.push(D(pts, { size: 0.42 }));
  return out.join("");
}

// End stops, with a label plate on each: Penn State (+y), Virginia Tech (-y).
function endStop(month, side) {
  const y = yOf(month) + side * (CAR.d / 2 + 8);
  const out = [S(k.slabOf({ x: -RAIL_X - 6, y: y - 3, w: 2 * RAIL_X + 12, d: 6, r: 1.2 }, 0, 14, P, 3, 0.5), { tone: "mid" })];
  out.push(S(k.slabOf({ x: -RAIL_X + 2, y: y - 2.4, w: 2 * RAIL_X - 4, d: 4.8, r: 0.8 }, 14, 0.6, P, 2), { tone: "hi", crease: "lo" }));
  // the plate's engraving runs along x, read from the near side
  const o = at([0, y + 0.85, 14.6]);
  const ex = at([1, y + 0.85, 14.6]).map((v, i) => v - o[i]);
  const ey = at([0, y + 1.85, 14.6]).map((v, i) => v - o[i]);
  const m = [...ex, ...ey, ...o].map((v) => Math.round(v * 1000) / 1000).join(" ");
  out.push(k.faceTextSvg(`matrix(${m})`, side > 0 ? "PENN STATE" : "VIRGINIA TECH", { size: 2.3, tone: "lo", anchor: "middle" }));
  out.push(D([at([-RAIL_X - 3, y, 14]), at([RAIL_X + 3, y, 14])], { size: 0.42 }));
  return out.join("");
}

function screw() {
  const out = [];
  const s0 = -Y0 - 30; // along -y from the origin, so s runs from +y end to -y end
  // bearing blocks at both ends
  for (const y of [Y0 + 24, -Y0 - 24]) {
    out.push(S(k.slabOf({ x: -8, y: y - 5, w: 16, d: 10, r: 1.4 }, 0, SCREW_Z + 6, P, 3, 0.5), { tone: "mid" }));
    out.push(D([at([-5, y, SCREW_Z + 6]), at([5, y, SCREW_Z + 6])], { size: 0.42 }));
  }
  // the screw itself with its thread, between the blocks
  const sa = -(Y0 + 19);
  const sb = Y0 + 19;
  const body = G.disc(sa, sb, SCREW_R, Y_AXIS, P, { steps: 36 });
  const thread = G.ribsOf(Y_AXIS, sa + 1, sb - 1, SCREW_R, 14, P, { twist: (sb - sa) / PITCH, fade: [0.08, 0.55] });
  out.push(S(body, { tone: "hi", crease: "lo", inner: k.fadedSvg(thread, { tone: "lo" }) }));
  // collars at the bearings
  for (const s of [sa - 1, sb - 1]) out.push(S(G.disc(s, s + 2, SCREW_R + 1.4, Y_AXIS, P), { tone: "mid" }));
  void s0;
  return out.join("");
}

// The carriage, built at month 0 and moved along y.
function carriage() {
  const y = yOf(0);
  const plan = { x: -CAR.w / 2, y: y - CAR.d / 2, w: CAR.w, d: CAR.d, r: 2.4 };
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(plan, 3), CAR_Z, 0.1, P)}" style="filter:blur(4px)"/>`);
  // bushings riding the rails
  for (const x of [-RAIL_X, RAIL_X]) for (const dy of [-CAR.d / 2 + 5, CAR.d / 2 - 5]) out.push(S(k.slabOf({ x: x - 4.4, y: y + dy - 4, w: 8.8, d: 8, r: 1.2 }, 5, CAR_Z - 5, P, 2, 0.3), { tone: "mid" }));
  // the nut block on the screw
  out.push(S(k.slabOf({ x: -7, y: y - 7, w: 14, d: 14, r: 1.6 }, SCREW_Z - 6, CAR_Z - SCREW_Z + 6, P, 3, 0.3), { tone: "mid" }));
  out.push(S(k.slabOf(plan, CAR_Z, CAR_H, P, 5, 0.8), { tone: "mid", inner: L(k.sideSeam(plan, CAR_Z + 3, P, 5), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(plan, 3), CAR_Z + CAR_H, P, 4), { tone: "faint" }));
  out.push(D(k.corners(plan, 3.4).map(([x, py]) => at([x, py, CAR_Z + CAR_H])), { size: 0.45 }));
  // the index pointer on the near side, reaching over the month ruler
  const px = CAR.w / 2;
  out.push(S(k.slabOf({ x: px, y: y - 1.6, w: 9, d: 3.2, r: 0.6 }, CAR_Z + 1.4, 2, P, 2, 0.3), { tone: "hi", crease: "lo" }));
  out.push(L(k.lineOnTop([px + 9, y], [px + 0.1, y], CAR_Z + 3.4, P), { tone: "hi", free: "start" }));
  // a gib screw on the near face
  const gib = G.frameOf([px, y + 9, CAR_Z + 4], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 1.6, 1.8, gib, P), { tone: "mid" }));
  // the gauge: a short post, a face-up dial graduated 0.0 to 4.0
  const gx = -6;
  const gy = y + 2;
  const top = CAR_Z + CAR_H + 16;
  out.push(S(k.cylinder(gx, gy, 2.4, CAR_Z + CAR_H, top - 6 - CAR_Z - CAR_H, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(gx, gy, 12, top - 6, 6, P, 64, 0.6), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(gx, gy, 12, top - 2.2, top, 60, P, 0.3), { tone: "lo" }));
  out.push(L(k.ring(gx, gy, 10, top, P, 56), { tone: "lo" }));
  // 270 degrees of sweep, 0.0 to 4.0: ticks every 0.1, majors every 1.0
  const sweep = 1.5 * Math.PI;
  const from = Math.PI + Math.PI / 4;
  const t = k.radialTicks(gx, gy, 9.6, 40, 10, top, [1, 2.2], P, from, sweep * (40 / 40));
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  const numerals = [0, 1, 2, 3, 4]
    .map((n) => {
      const a = from + (sweep * n) / 4;
      const p = [gx + Math.sin(a) * 5.4, gy - Math.cos(a) * 5.4];
      return k.faceTextSvg(k.topMatrix([p[0] - 0.9, p[1]], top, P, "y"), String(n), { size: 2.4, tone: "mid", anchor: "middle" });
    })
    .join("");
  out.push(numerals);
  const a = from + (sweep * GPA) / 4;
  out.push(L(k.lineOnTop([gx - Math.sin(a) * 2, gy + Math.cos(a) * 2], [gx + Math.sin(a) * 8.6, gy - Math.cos(a) * 8.6], top + 0.2, P), { tone: "lit", free: true }).replace("<path", '<path style="stroke-width:1.1"'));
  out.push(L(k.ring(gx, gy, 1.2, top + 0.2, P, 14), { tone: "hi" }));
  // crown
  out.push(S(k.slabOf({ x: gx - 1.4, y: gy + 11.4, w: 2.8, d: 3, r: 0.6 }, top - 4.4, 2.6, P, 2), { tone: "mid" }));
  return out.join("");
}

// The handwheel at the Penn State end, as drawn before the page script
// takes over (the live code rebuilds the same wheel as it turns).
function wheelSvg(angle) {
  const W = G.frameOf([0, WHEEL_Y, SCREW_Z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const out = [];
  out.push(S(G.disc(-8, 0, 3.6, W, P), { tone: "mid" }));
  out.push(S(G.disc(0, 4, WHEEL_R, W, P, { steps: 72 }), { tone: "hi", crease: "lo", inner: k.fadedSvg(G.ribsOf(W, 0.4, 3.6, WHEEL_R, 64, P, { fade: [0.06, 0.5], phase: angle }), { tone: "lo" }) }));
  out.push(L(G.circleOf(W, 4, WHEEL_R - 3.2, P), { tone: "lo" }) + L(G.circleOf(W, 4, 7.4, P), { tone: "faint" }));
  const holes = [];
  for (let i = 0; i < 4; i++) {
    const a = angle + (i * Math.PI) / 2 + Math.PI / 4;
    const c = [Math.cos(a) * 9.4, Math.sin(a) * 9.4];
    holes.push(k.pathOf(Array.from({ length: 16 }, (_, j) => at([c[0] + Math.cos((j / 16) * 6.2832) * 1.9, WHEEL_Y + 4, SCREW_Z + c[1] + Math.sin((j / 16) * 6.2832) * 1.9])), true));
  }
  out.push(`<path class="iso-line" data-tone="lo" style="fill:var(--anatomy-shade-0)" d="${holes.join("")}"/>`);
  out.push(S(G.disc(4, 7, 5, W, P), { tone: "hi", crease: "lo" }));
  const hx = Math.cos(angle) * (WHEEL_R - 1.7);
  const hz = Math.sin(angle) * (WHEEL_R - 1.7);
  const H = G.frameOf([hx, WHEEL_Y + 4, SCREW_Z + hz], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 9, 1.8, H, P), { tone: "hi", crease: "lo" }));
  out.push(S(G.disc(1.5, 8.5, 2.6, H, P), { tone: "hi", crease: "lo" }));
  return out.join("");
}

export default {
  id: "school",
  fig: "Fig 8",
  title: "Two-year stage",
  hint: "Hover to turn the crank",
  width: WIDTH,
  height: HEIGHT,
  label:
    "A precision linear stage: a bed with two rails, a lead screw between two bearing blocks, a handwheel at one end and end stops at both. A carriage rides the screw past a ruler graduated in months from 0 to 24. A dial gauge on the carriage, graduated 0.0 to 4.0, reads 4.0.",
  stage: { role: "slider", label: "Two-year stage. Arrow keys move the carriage three months, Shift six, Home and End go to the ends.", attrs: { "aria-valuemin": 0, "aria-valuemax": 24, "aria-valuenow": 0, "aria-valuetext": "Month 0, Penn State" } },
  keys: [
    { mark: "lit", label: "The gauge needle, reading 4.0" },
    { mark: "raised", label: "The carriage, on a lead screw that runs 24 months end to end" },
  ],
  caption: "A lead-screw stage that runs two years end to end, from Penn State to a B.S. in Computer Science at Virginia Tech. The gauge on the carriage reads the cumulative GPA, 4.0.",
  build() {
    const svg = [
      bed(),
      rail(-RAIL_X),
      endStop(MONTHS, -1),
      screw(),
      rail(RAIL_X),
      `<g data-part="carriage" transform="translate(0 0)">${carriage()}</g>`,
      endStop(0, 1),
      `<g data-part="wheel">${wheelSvg(0)}</g>`,
    ].join("");
    return {
      svg,
      readout: "month 00 · Penn State · 4.0",
      data: { P, MONTHS, PER_MONTH, PITCH, unitY: k.axisVector(P, [0, -1, 0]), WHEEL_Y, SCREW_Z, WHEEL_R },
    };
  },
  live(root, rt, D) {
    const stage = root.querySelector(".iso-stage");
    const svg = stage.querySelector("svg");
    const readout = root.querySelector("[data-readout]");
    const car = svg.querySelector('[data-part="carriage"]');
    const wheel = svg.querySelector('[data-part="wheel"]');
    let month = 0;
    let target = 0;
    let lastAngle = NaN;
    let said = -1;
    // the handwheel turns once per screw pitch, redrawn with the kit
    function wheelSvg(angle) {
      const { WHEEL_Y, SCREW_Z, WHEEL_R, P } = D;
      const W = G.frameOf([0, WHEEL_Y, SCREW_Z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
      const out = [];
      out.push(solidSvg(G.disc(-8, 0, 3.6, W, P), { tone: "mid" }));
      // a dished wheel: knurled rim, a recessed face ring, the hub
      out.push(solidSvg(G.disc(0, 4, WHEEL_R, W, P, { steps: 72 }), { tone: "hi", crease: "lo", inner: fadedSvg(G.ribsOf(W, 0.4, 3.6, WHEEL_R, 64, P, { fade: [0.06, 0.5], phase: angle }), { tone: "lo" }) }));
      out.push(lineSvg(G.circleOf(W, 4, WHEEL_R - 3.2, P), { tone: "lo" }) + lineSvg(G.circleOf(W, 4, 7.4, P), { tone: "faint" }));
      // four lightening holes that turn with the wheel
      const holes = [];
      for (let i = 0; i < 4; i++) {
        const a = angle + (i * Math.PI) / 2 + Math.PI / 4;
        const c = [Math.cos(a) * 9.4, Math.sin(a) * 9.4];
        holes.push(Array.from({ length: 16 }, (_, j) => iso([c[0] + Math.cos((j / 16) * 6.2832) * 1.9, WHEEL_Y + 4, SCREW_Z + c[1] + Math.sin((j / 16) * 6.2832) * 1.9], P)));
      }
      out.push(`<path class="iso-line" data-tone="lo" style="fill:var(--anatomy-shade-0)" d="${holes.map((h) => "M" + h.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + "Z").join("")}"/>`);
      out.push(solidSvg(G.disc(4, 7, 5, W, P), { tone: "hi", crease: "lo" }));
      const hx = Math.cos(angle) * (WHEEL_R - 1.7);
      const hz = Math.sin(angle) * (WHEEL_R - 1.7);
      const H = G.frameOf([hx, WHEEL_Y + 4, SCREW_Z + hz], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
      out.push(solidSvg(G.disc(0, 9, 1.8, H, P), { tone: "hi", crease: "lo" }));
      out.push(solidSvg(G.disc(1.5, 8.5, 2.6, H, P), { tone: "hi", crease: "lo" }));
      return out.join("");
    }
    function draw() {
      const d = month * D.PER_MONTH;
      car.setAttribute("transform", `translate(${(D.unitY[0] * d).toFixed(2)} ${(D.unitY[1] * d).toFixed(2)})`);
      const angle = -(d / D.PITCH) * Math.PI * 2;
      if (!(Math.abs(angle - lastAngle) <= 0.02)) {
        lastAngle = angle;
        wheel.innerHTML = wheelSvg(angle);
      }
      const m = Math.round(month);
      const mm = String(m).padStart(2, "0");
      const text = m === 0 ? "month 00 · Penn State · 4.0" : m === D.MONTHS ? "month 24 · Virginia Tech · B.S. CS · 4.0" : "month " + mm + " · 4.0";
      rt.say(readout, text);
      if (Math.abs(month - target) < 0.01 && Math.round(target) !== said) {
        said = Math.round(target);
        stage.setAttribute("aria-valuenow", String(said));
        stage.setAttribute("aria-valuetext", "Month " + said + (said === 0 ? ", Penn State" : said === D.MONTHS ? ", Virginia Tech" : ""));
      }
    }
    const TOUR = [[0, 1.2], [24, 6.2], [24, 2.2], [0, 3.4]];
    const tour = rt.tour(stage, { onResume: () => run.kick() });
    let leg = 0;
    let legClock = 0;
    let from = 0;
    const run = rt.loop(stage, (dt, calm) => {
      tour.advance(dt);
      if (tour.active) {
        legClock += dt;
        const [to, dur] = TOUR[leg];
        const u = Math.min(1, legClock / dur);
        target = from + (to - from) * (u * u * (3 - 2 * u));
        if (u >= 1) {
          from = to;
          leg = (leg + 1) % TOUR.length;
          legClock = 0;
        }
        month = target;
      } else month = rt.follow(month, target, dt, 0.3, calm);
      draw();
      return tour.running || month !== target;
    });
    const steer = (m) => {
      tour.hold();
      target = rt.clamp(m, 0, D.MONTHS);
      from = target;
      leg = 0;
      legClock = 0;
      run.kick();
    };
    stage.addEventListener("pointermove", (event) => {
      const [fx] = rt.fractionOf(svg, event);
      steer(Math.round(rt.clamp((fx - 0.2) / 0.6, 0, 1) * D.MONTHS * 4) / 4);
    });
    stage.addEventListener("pointerdown", (event) => {
      const [fx] = rt.fractionOf(svg, event);
      steer(Math.round(rt.clamp((fx - 0.2) / 0.6, 0, 1) * D.MONTHS));
    });
    stage.addEventListener("keydown", (event) => {
      const step = event.shiftKey ? 6 : 3;
      let m = Math.round(target);
      if (event.key === "ArrowRight" || event.key === "ArrowUp") m += step;
      else if (event.key === "ArrowLeft" || event.key === "ArrowDown") m -= step;
      else if (event.key === "Home") m = 0;
      else if (event.key === "End") m = D.MONTHS;
      else return;
      event.preventDefault();
      steer(m);
    });
    draw();
  },
};
