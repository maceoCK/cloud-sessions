// Fig. VII · conway. A pin table: a 12 x 12 board of wells on a plinth, one
// peg per cell, risen when alive and sunk flush when dead, stepping under
// Conway's rules (B3/S23, bounded). As in maceoCK/conway, clicking a well
// brings that cell to life, and you win when nothing is left alive.
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { CELLS, N, aliveOf, replay, seedBoard } from "./conway/life.mjs";

const WIDTH = 600;
const HEIGHT = 380;
const AZIMUTH = 38;
const ELEVATION = 36;

const PITCH = 9;
const SIDE = N * PITCH;
const BOARD = { x: -SIDE / 2 - 7, y: -SIDE / 2 - 7, w: SIDE + 14, d: SIDE + 14, r: 4 };
const ZT = 16; // board top
const PEG = { r: 2.5, h: 5.6 };
const SEED = 7;
const SCRIPT = [[22, 9], [27, 136]]; // [generation, cell]: placements that clear the board
const STEP = 0.32; // seconds per generation

const BOARDS = replay(SEED, SCRIPT, 200);
if (aliveOf(BOARDS[BOARDS.length - 1]) !== 0) throw new Error("the tour script no longer clears the board");
const CLEARED_AT = BOARDS.length - 1;

const cellXY = (i) => {
  const row = Math.floor(i / N);
  const col = i % N;
  return [-SIDE / 2 + PITCH / 2 + col * PITCH, -SIDE / 2 + PITCH / 2 + row * PITCH];
};

const TRAY = { x: BOARD.x + 26, y: BOARD.y + BOARD.d + 10, w: 62, d: 14, r: 3 };
const PLINTH = { x: BOARD.x - 4, y: BOARD.y - 4, w: BOARD.w + 8, d: BOARD.d + 8, r: 5 };

const P = k.fitProjection([...k.boxCorners({ ...PLINTH, d: PLINTH.d + 30 }, -6, ZT + 10)], WIDTH, HEIGHT, { pad: 30, azimuth: AZIMUTH, elevation: ELEVATION });

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const r1 = (n) => Math.round(n * 10) / 10;

function faceSkew(fx, [x, y]) {
  const o = at([fx, 0, 0]);
  const u = at([fx, -1, 0]);
  const v = at([fx, 0, -1]);
  const a = [u[0] - o[0], u[1] - o[1]];
  const b = [v[0] - o[0], v[1] - o[1]];
  const n = Math.hypot(...a);
  const m = Math.hypot(...b);
  return `translate(${r1(x)} ${r1(y)}) matrix(${(a[0] / n).toFixed(4)} ${(a[1] / n).toFixed(4)} ${(b[0] / m).toFixed(4)} ${(b[1] / m).toFixed(4)} 0 0) translate(${-r1(x)} ${-r1(y)})`;
}

function plinth() {
  const out = [`<path class="iso-halo" d="${k.haloOf({ ...PLINTH, d: PLINTH.d + 26 }, -6, 8, P)}"/>`];
  for (const [x, y] of k.corners(PLINTH, 10).sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P))) {
    out.push(S(k.cylinder(x, y, 5, -6, 2, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 3.8, -4, 4, P, 24), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLINTH, 0, ZT - 6, P, 5, 1), { tone: "mid", inner: L(k.sideSeam(PLINTH, 4, P, 5), { tone: "faint" }) }));
  // counter on the near (+x) face: the generation, three digits
  const fx = PLINTH.x + PLINTH.w;
  const win = { y: 12, z: 2.4, w: 22, h: 6.2 };
  out.push(`<path class="iso-line" data-tone="mid" d="${k.pathOf([[win.y, win.z], [win.y - win.w, win.z], [win.y - win.w, win.z + win.h], [win.y, win.z + win.h]].map(([y, z]) => at([fx, y, z])), true)}" style="fill:var(--lt-window)"/>`);
  const c = at([fx, win.y - win.w / 2, win.z + 1.5]);
  out.push(`<text class="lt-count" data-part="gen" x="${r1(c[0])}" y="${r1(c[1])}" transform="${faceSkew(fx, c)}">000</text>`);
  out.push(D([at([fx, win.y + 2.4, win.z + win.h / 2]), at([fx, win.y - win.w - 2.4, win.z + win.h / 2])], { size: 0.4 }));
  return out.join("");
}

function board() {
  const out = [];
  out.push(S(k.slabOf(BOARD, ZT - 6, 6, P, 4, 0.8), { tone: "hi", crease: "lo" }));
  // a raised frame rim around the field
  out.push(L(k.planOutline(k.insetPlan(BOARD, 4.2), ZT, P, 3), { tone: "lo" }));
  const screws = k.corners(BOARD, 3.4);
  out.push(D(screws.map(([x, y]) => at([x, y, ZT])), { size: 0.45 }));
  // field lines between the wells, edge to edge of the inner field
  const lines = [];
  for (let i = 1; i < N; i++) {
    const t = -SIDE / 2 + i * PITCH;
    lines.push(k.lineOnTop([t, -SIDE / 2], [t, SIDE / 2], ZT, P), k.lineOnTop([-SIDE / 2, t], [SIDE / 2, t], ZT, P));
  }
  out.push(L(k.planOutline({ x: -SIDE / 2, y: -SIDE / 2, w: SIDE, d: SIDE, r: 0 }, ZT, P, 1), { tone: "lo" }));
  out.push(L(lines.join(""), { tone: "faint" }));
  // the wells
  const wells = [];
  for (let i = 0; i < CELLS; i++) {
    const [x, y] = cellXY(i);
    wells.push(k.pathOf(Array.from({ length: 14 }, (_, j) => at([x + Math.cos((j / 14) * 6.2832) * (PEG.r + 0.5), y + Math.sin((j / 14) * 6.2832) * (PEG.r + 0.5), ZT])), true));
  }
  out.push(`<path class="lt-well" d="${wells.join("")}"/>`);
  // the one engraved label, on the rim
  out.push(k.faceTextSvg(k.topMatrix([BOARD.x + BOARD.w - 2.2, -SIDE / 2 + 16], ZT, P, "y"), "B3/S23", { size: 3.4, tone: "lo", anchor: "middle" }));
  return out.join("");
}

function tray() {
  const out = [];
  out.push(S(k.slabOf(TRAY, 0, 6, P, 3, 0.5), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(TRAY, 2), 6, P, 3), { tone: "lo" }));
  // spare pegs standing in the tray
  for (let i = 0; i < 6; i++) {
    const x = TRAY.x + 7 + i * 9.6;
    out.push(S(k.cylinder(x, TRAY.y + TRAY.d / 2, PEG.r, 6, PEG.h + 2, P, 22), { tone: "hi", crease: "lo" }));
  }
  return out.join("");
}

export default {
  id: "conway",
  fig: "Fig 7",
  title: "Life table",
  hint: "Click a well to place a peg",
  width: WIDTH,
  height: HEIGHT,
  label:
    "A pin table: a twelve by twelve board of wells on a plinth, with a peg in each well that stands up when its cell is alive and sinks flush when it dies. A three-digit counter on the plinth shows the generation, and a tray beside it holds spare pegs.",
  stage: { role: "group", label: "Life table. Click a well to bring that cell to life. Arrow keys move a cursor, Space places a peg, Enter pauses or plays, Home starts over.", attrs: { "aria-valuetext": `${aliveOf(seedBoard(SEED))} alive` } },
  keys: [
    { mark: "lit", label: "A peg you placed" },
    { mark: "raised", label: "Live cells, B3/S23 on a bounded board" },
  ],
  caption: "conway is a strategy game grown from Life: the board runs on Conway's rules, and you win by placing cells until nothing is left alive.",
  css: `
#fig-conway{--lt-window:#26262a;--lt-digit:#f4f4f1}
[data-theme="dark"] #fig-conway{--lt-window:#050505;--lt-digit:#e6e6e6}
#fig-conway .lt-count{font:600 4.4px/1 var(--anatomy-mono);fill:var(--lt-digit);text-anchor:middle;letter-spacing:.06em}
#fig-conway .lt-well{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo);stroke-width:.4}
#fig-conway .lt-cursor{fill:none;stroke:var(--anatomy-lit);stroke-width:.9}
`,
  build() {
    const order = Array.from({ length: CELLS }, (_, i) => i).sort((a, b) => k.depthOf([...cellXY(a), ZT], P) - k.depthOf([...cellXY(b), ZT], P));
    const pegs = order.map((i) => `<g data-peg="${i}"></g>`).join("");
    const svg = [plinth(), tray(), board(), `<g data-part="cursor"></g>`, pegs].join("");
    // screen -> board: the board's top plane is an affine image of (x, y)
    const o = at([0, 0, ZT]);
    const ex = at([1, 0, ZT]);
    const ey = at([0, 1, ZT]);
    const m = [ex[0] - o[0], ex[1] - o[1], ey[0] - o[0], ey[1] - o[1]];
    const det = m[0] * m[3] - m[2] * m[1];
    const inv = [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det];
    return {
      svg,
      readout: `gen 000 · ${aliveOf(seedBoard(SEED))} alive · 0 placed`,
      data: { P, N, PITCH, SIDE, ZT, PEG, STEP, SCRIPT, CLEARED_AT, seed: [...seedBoard(SEED)], origin: o, inv },
    };
  },
  live(root, rt, D) {
    const stage = root.querySelector(".iso-stage");
    const svg = stage.querySelector("svg");
    const readout = root.querySelector("[data-readout]");
    const genText = svg.querySelector('[data-part="gen"]');
    const cursorG = svg.querySelector('[data-part="cursor"]');
    const N = D.N;
    const CELLS = N * N;
    const pegs = new Array(CELLS);
    svg.querySelectorAll("[data-peg]").forEach((g) => (pegs[Number(g.dataset.peg)] = g));
    const xy = (i) => [-D.SIDE / 2 + D.PITCH / 2 + (i % N) * D.PITCH, -D.SIDE / 2 + D.PITCH / 2 + Math.floor(i / N) * D.PITCH];
    function step(board) {
      const next = new Uint8Array(CELLS);
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const rr = r + dy;
          const cc = c + dx;
          if (rr >= 0 && rr < N && cc >= 0 && cc < N) n += board[rr * N + cc];
        }
        const alive = board[r * N + c];
        next[r * N + c] = n === 3 || (alive && n === 2) ? 1 : 0;
      }
      return next;
    }
    let board = Uint8Array.from(D.seed);
    let gen = 0;
    let placed = 0;
    let mine = new Uint8Array(CELLS); // pegs the visitor (or the tour) placed
    let playing = false;
    let clock = 0;
    let cursor = -1;
    let hold = 0;
    const height = new Float32Array(CELLS).map((_, i) => (board[i] ? 1 : 0));
    const drawn = new Float32Array(CELLS).fill(-1);
    const drawnLit = new Uint8Array(CELLS);
    const alive = () => board.reduce((s, v) => s + v, 0);
    function pegSvg(i, h, lit) {
      const [x, y] = xy(i);
      const up = 0.3 + h * D.PEG.h;
      return solidSvg(cylinder(x, y, D.PEG.r, D.ZT, up, D.P, 22), { tone: "hi", crease: "lo", lit });
    }
    function drawPegs() {
      for (let i = 0; i < CELLS; i++) {
        const h = Math.round(height[i] * 40) / 40;
        const lit = mine[i] && board[i] ? 1 : 0;
        if (h === drawn[i] && lit === drawnLit[i]) continue;
        drawn[i] = h;
        drawnLit[i] = lit;
        pegs[i].innerHTML = pegSvg(i, h, Boolean(lit));
      }
    }
    function drawCursor() {
      if (cursor < 0) return void (cursorG.innerHTML = "");
      const [x, y] = xy(cursor);
      const d = Array.from({ length: 20 }, (_, j) => iso([x + Math.cos((j / 20) * 6.2832) * (D.PEG.r + 1.6), y + Math.sin((j / 20) * 6.2832) * (D.PEG.r + 1.6), D.ZT], D.P));
      cursorG.innerHTML = `<path class="lt-cursor" d="M${d.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L")}Z"/>`;
    }
    function say() {
      const g = String(gen).padStart(3, "0");
      genText.textContent = g;
      const n = alive();
      rt.say(readout, n === 0 ? "gen " + g + " · 0 alive · cleared with " + placed : "gen " + g + " · " + n + " alive · " + placed + " placed");
    }
    function place(i) {
      if (board[i]) return;
      board = Uint8Array.from(board);
      board[i] = 1;
      mine[i] = 1;
      placed++;
      stage.setAttribute("aria-valuetext", "Placed a peg: " + alive() + " alive, " + placed + " placed");
    }
    function reset() {
      board = Uint8Array.from(D.seed);
      gen = 0;
      placed = 0;
      mine = new Uint8Array(CELLS);
      clock = 0;
      hold = 0;
      stage.setAttribute("aria-valuetext", alive() + " alive");
    }
    const tour = rt.tour(stage, { onResume: () => { reset(); playing = true; run.kick(); } });
    const run = rt.loop(stage, (dt, calm) => {
      tour.advance(dt);
      const running = (tour.active || playing) && !calm;
      if (running) {
        if (alive() === 0) {
          hold += dt;
          if (hold > 2.4 && tour.active) reset();
        } else {
          clock += dt;
          while (clock >= D.STEP) {
            clock -= D.STEP;
            board = step(board);
            gen++;
            if (tour.active) for (const [g, cell] of D.SCRIPT) if (g === gen) place(cell);
            if (alive() === 0) stage.setAttribute("aria-valuetext", "Cleared at generation " + gen + " with " + placed + " placed");
          }
        }
      }
      let moving = false;
      for (let i = 0; i < CELLS; i++) {
        const want = board[i] ? 1 : 0;
        const next = rt.follow(height[i], want, dt, 0.07 + (i % 7) * 0.006, calm);
        if (next !== want) moving = true;
        height[i] = next;
      }
      drawPegs();
      say();
      return moving || running || tour.running;
    });
    const cellAt = (event) => {
      const box = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const sx = ((event.clientX - box.left) / box.width) * vb.width - D.origin[0];
      const sy = ((event.clientY - box.top) / box.height) * vb.height - D.origin[1];
      const x = D.inv[0] * sx + D.inv[2] * sy;
      const y = D.inv[1] * sx + D.inv[3] * sy;
      const col = Math.floor((x + D.SIDE / 2) / D.PITCH);
      const row = Math.floor((y + D.SIDE / 2) / D.PITCH);
      return col >= 0 && col < N && row >= 0 && row < N ? row * N + col : -1;
    };
    stage.addEventListener("pointermove", (event) => {
      const c = cellAt(event);
      if (c !== cursor) {
        cursor = c;
        drawCursor();
      }
    });
    stage.addEventListener("pointerleave", () => {
      cursor = -1;
      drawCursor();
    });
    stage.addEventListener("pointerdown", (event) => {
      const c = cellAt(event);
      if (c < 0) return;
      tour.hold();
      if (alive() === 0) reset();
      place(c);
      playing = true;
      run.kick();
    });
    stage.addEventListener("keydown", (event) => {
      const c = cursor < 0 ? Math.floor(N / 2) * N + Math.floor(N / 2) : cursor;
      const row = Math.floor(c / N);
      const col = c % N;
      let next = c;
      if (event.key === "ArrowRight") next = row * N + Math.min(N - 1, col + 1);
      else if (event.key === "ArrowLeft") next = row * N + Math.max(0, col - 1);
      else if (event.key === "ArrowDown") next = Math.min(N - 1, row + 1) * N + col;
      else if (event.key === "ArrowUp") next = Math.max(0, row - 1) * N + col;
      else if (event.key === " ") {
        event.preventDefault();
        tour.hold();
        place(c);
        run.kick();
        return;
      } else if (event.key === "Enter") {
        event.preventDefault();
        tour.hold();
        if (rt.calm()) {
          board = step(board);
          gen++;
        } else playing = !playing;
        run.kick();
        return;
      } else if (event.key === "Home" || event.key === "Escape") {
        event.preventDefault();
        tour.hold();
        reset();
        playing = false;
        run.kick();
        return;
      } else return;
      event.preventDefault();
      cursor = next;
      drawCursor();
    });
    drawPegs();
    say();
  },
};
