// Shared live helpers for every figure. Inlined once, after the kit, into the
// page's single module script. Each figure's live(root, rt, data) receives RT.
const RT = (() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => {
    const x = clamp(t, 0, 1);
    return x * x * (3 - 2 * x);
  };

  // Exponential follow toward a target; jumps when calm (reduced motion).
  function follow(current, target, dt, tau, calm) {
    if (calm) return target;
    const next = current + (target - current) * (1 - Math.exp(-dt / tau));
    return Math.abs(target - next) < 5e-4 ? target : next;
  }

  // Sub-stepped spring on { at, rate }. Returns true once settled.
  function spring(state, target, dt, stiffness, damping, calm) {
    if (calm) {
      state.at = target;
      state.rate = 0;
      return true;
    }
    const steps = Math.max(1, Math.ceil(dt * 240));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      state.rate += ((target - state.at) * stiffness - state.rate * damping) * h;
      state.at += state.rate * h;
    }
    if (Math.abs(target - state.at) < 5e-4 && Math.abs(state.rate) < 5e-4) {
      state.at = target;
      state.rate = 0;
      return true;
    }
    return false;
  }

  // One frame loop per figure. tick(dt, calm) returns true to keep running.
  // The loop only runs while the stage is on screen and the page is visible.
  function loop(stage, tick) {
    let frame = 0;
    let last = 0;
    let visible = false;
    const step = (now) => {
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      const going = tick(dt, still.matches);
      frame = visible && going && !document.hidden ? requestAnimationFrame(step) : 0;
    };
    const kick = () => {
      if (!frame && visible && !document.hidden) {
        last = 0;
        frame = requestAnimationFrame(step);
      }
    };
    new IntersectionObserver(
      (entries) => {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible) kick();
      },
      { rootMargin: "120px 0px" },
    ).observe(stage);
    document.addEventListener("visibilitychange", kick);
    still.addEventListener?.("change", kick);
    return { kick, get visible() { return visible; } };
  }

  // Idle tour: runs after `delay` ms in view, pauses on any interaction and
  // resumes `resume` ms after the last one. Never runs under reduced motion.
  function tour(stage, { delay = 1400, resume = 3600, onResume } = {}) {
    let held = false;
    let timer = 0;
    let since = -delay / 1000;
    const state = {
      clock: 0,
      get active() {
        return !held && !still.matches && since >= 0;
      },
      advance(dt) {
        if (held || still.matches) return;
        since += dt;
        if (since >= 0) state.clock += dt;
      },
      hold() {
        held = true;
        clearTimeout(timer);
        timer = setTimeout(() => {
          held = false;
          state.clock = 0;
          since = 0;
          onResume?.();
        }, resume);
      },
    };
    return state;
  }

  function say(element, text) {
    if (element && element.textContent !== text) element.textContent = text;
  }

  // Map a pointer event to fractions of the svg box.
  function fractionOf(svg, event) {
    const box = svg.getBoundingClientRect();
    return [(event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height];
  }

  return { still, clamp, lerp, smooth, follow, spring, loop, tour, say, fractionOf, calm: () => still.matches };
})();
