// The model behind Fig 7: Conway's Game of Life on a bounded 12 x 12 board
// (B3/S23, cells past the edge count as dead), as in maceoCK/conway's Game.tsx.
// Also the build-time search for the idle tour: a seeded soup and a short
// script of placements that clears the board.

export const N = 12;
export const CELLS = N * N;

// Cell index is row * N + column; column runs along world x, row along world y.
export function step(board) {
  const next = new Uint8Array(CELLS);
  for (let row = 0; row < N; row++) {
    for (let col = 0; col < N; col++) {
      let around = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const r = row + dy;
        if (r < 0 || r >= N) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const c = col + dx;
          if ((dx || dy) && c >= 0 && c < N) around += board[r * N + c];
        }
      }
      const alive = board[row * N + col];
      next[row * N + col] = around === 3 || (alive && around === 2) ? 1 : 0;
    }
  }
  return next;
}

export const aliveOf = (board) => board.reduce((sum, cell) => sum + cell, 0);
const keyOf = (board) => board.join("");

// mulberry32: a small fixed PRNG, so the seed board is the same on every build.
export function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedBoard(seed, share = 0.2) {
  const random = prng(seed);
  const board = new Uint8Array(CELLS);
  for (let i = 0; i < CELLS; i++) board[i] = random() < share ? 1 : 0;
  return board;
}

// Run until the board is empty or settles into a still life or a period-2
// oscillator (or the limit). Returns the generation where that happened.
function settle(board, gen, limit) {
  const seen = [keyOf(board)];
  let at = board;
  let g = gen;
  while (g < limit) {
    if (!aliveOf(at)) return { board: at, gen: g, dead: true };
    const next = step(at);
    g++;
    const key = keyOf(next);
    if (seen.length >= 1 && seen[seen.length - 1] === key) return { board: next, gen: g, dead: !aliveOf(next), still: true };
    if (seen.length >= 2 && seen[seen.length - 2] === key) return { board: next, gen: g, dead: false, still: true };
    seen.push(key);
    at = next;
  }
  return { board: at, gen: g, dead: !aliveOf(at), still: false };
}

const advance = (board, from, to) => {
  let at = board;
  for (let g = from; g < to; g++) at = step(at);
  return at;
};

function candidates(board) {
  const out = [];
  for (let i = 0; i < CELLS; i++) {
    if (board[i]) continue;
    const row = Math.floor(i / N);
    const col = i % N;
    let near = false;
    for (let dy = -2; dy <= 2 && !near; dy++)
      for (let dx = -2; dx <= 2 && !near; dx++) {
        const r = row + dy;
        const c = col + dx;
        if (r >= 0 && r < N && c >= 0 && c < N && board[r * N + c]) near = true;
      }
    if (near) out.push(i);
  }
  return out;
}

// Beam search for a script of placements [[gen, cell], ...]: each placement
// happens a couple of generations after the board has settled, and the last
// one leaves a board that dies out by `limit`.
export function findScript(seed, { limit = 60, most = 4, beam = 8, pause = 2, first = 10 } = {}) {
  const start = settle(seedBoard(seed), 0, limit);
  if (start.dead || !start.still) return null;
  let layer = [{ board: start.board, gen: start.gen, script: [] }];
  const done = [];
  for (let depth = 0; depth < most && layer.length; depth++) {
    const next = [];
    for (const node of layer) {
      const at = Math.max(first, node.gen + pause);
      if (at >= limit) continue;
      const board = advance(node.board, node.gen, at);
      for (const cell of candidates(board)) {
        const placed = board.slice();
        placed[cell] = 1;
        const after = settle(placed, at, limit);
        const script = [...node.script, [at, cell]];
        if (after.dead) done.push({ script, end: after.gen });
        else if (after.still) next.push({ board: after.board, gen: after.gen, script, alive: aliveOf(after.board) });
      }
    }
    if (done.length) break;
    next.sort((a, b) => a.alive - b.alive || a.gen - b.gen);
    const kept = [];
    const keys = new Set();
    for (const node of next) {
      const key = keyOf(node.board);
      if (keys.has(key)) continue;
      keys.add(key);
      kept.push(node);
      if (kept.length >= beam) break;
    }
    layer = kept;
  }
  if (!done.length) return null;
  done.sort((a, b) => a.end - b.end);
  return { seed, settled: start.gen, ...done[0] };
}

// Replays a seed and a script; returns every generation's board up to the
// first empty one. Placements apply to the board shown at their generation.
export function replay(seed, script, limit = 200) {
  const boards = [];
  let board = seedBoard(seed);
  for (let gen = 0; gen <= limit; gen++) {
    for (const [at, cell] of script) if (at === gen) board = Object.assign(board.slice(), { [cell]: 1 });
    boards.push(board);
    if (!aliveOf(board)) return boards;
    board = step(board);
  }
  return boards;
}
