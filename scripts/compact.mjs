// Lossless path compaction for the built figures. The kit writes absolute
// commands with a decimal or two ("M475.8 226.7L475.9 225.5..."); the same
// outline in relative commands is roughly half the bytes. Coordinates are
// carried as exact integers at the path's own precision, so every point
// lands where it did. Paths of lines and quadratic curves (M L H V Q Z, the
// kit's solids and the type's outlines) are touched; anything else is left.

const SHAPE = /^[MLHVQZ0-9.\s,-]+$/;

// the shortest spelling of an integer count of 10^-places
function num(units, places) {
  const sign = units < 0 ? "-" : "";
  let s = String(Math.abs(units)).padStart(places + 1, "0");
  if (places) s = `${s.slice(0, -places)}.${s.slice(-places)}`.replace(/0+$/, "").replace(/\.$/, "");
  if (s.startsWith("0.")) s = s.slice(1);
  return sign + s;
}

export function compactPath(d) {
  if (!SHAPE.test(d)) return d;
  const tokens = d.match(/[MLHVQZ]|-?(?:\d+\.?\d*|\.\d+)/g);
  if (!tokens) return d;
  const places = Math.max(0, ...tokens.filter((t) => /\d/.test(t)).map((t) => (t.includes(".") ? t.split(".")[1].length : 0)));
  const scale = 10 ** places;
  const int = (t) => Math.round(Number(t) * scale);
  let out = "";
  let last = "";
  let prev = ""; // the previous number written, to decide on a separator
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let first = true;
  const write = (cmd, values) => {
    // a repeated command (or a lineto right after a moveto) needs no letter
    const implicit = cmd === last || (cmd === "l" && last === "m");
    if (!implicit) {
      out += cmd;
      prev = "";
    }
    for (const v of values) {
      const s = num(v, places);
      if (prev && !(s.startsWith("-") || (s.startsWith(".") && prev.includes(".")))) out += " ";
      out += s;
      prev = s;
    }
    last = cmd === "m" ? "m" : cmd;
  };
  let i = 0;
  let cmd = "";
  while (i < tokens.length) {
    if (/[MLHVQZ]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === "Z") {
      out += "z";
      last = "z";
      prev = "";
      x = sx;
      y = sy;
      cmd = "";
      continue;
    }
    if (cmd === "M" || cmd === "L") {
      const nx = int(tokens[i++]);
      const ny = int(tokens[i++]);
      if (cmd === "M") {
        if (first) write("M", [nx, ny]);
        else write("m", [nx - x, ny - y]);
        sx = nx;
        sy = ny;
        cmd = "L"; // pairs after a moveto are linetos
      } else write("l", [nx - x, ny - y]);
      first = false;
      x = nx;
      y = ny;
    } else if (cmd === "H") {
      const nx = int(tokens[i++]);
      write("h", [nx - x]);
      x = nx;
    } else if (cmd === "Q") {
      const cx = int(tokens[i++]);
      const cy = int(tokens[i++]);
      const nx = int(tokens[i++]);
      const ny = int(tokens[i++]);
      write("q", [cx - x, cy - y, nx - x, ny - y]);
      x = nx;
      y = ny;
    } else if (cmd === "V") {
      const ny = int(tokens[i++]);
      write("v", [ny - y]);
      y = ny;
    } else return d; // anything unexpected: leave the path as it was
  }
  // after "M x y", the first lineto letter was "l" relative: an absolute M
  // followed by implicit pairs would read them as absolute, so the letter
  // is only dropped after a relative "m" (handled in write)
  return out;
}

export const compactSvg = (svg) => svg.replace(/ d="([^"]*)"/g, (whole, d) => ` d="${compactPath(d)}"`);
