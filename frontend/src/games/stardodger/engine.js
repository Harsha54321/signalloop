// Star Dodger rules. Pure logic (no DOM): the screen and the tests call
// createGame / update / setTarget and read the state.
export const W = 320;
export const H = 480;
export const SHIP_R = 11;
export const STAR_POINTS = 25;
export const SHIELD_SECONDS = 8; // a shield that is not used fades after this long
export const MAGNET_SECONDS = 6;
export const SLOW_SECONDS = 5;
const SHIP_SPEED = 420; // max px per second when chasing the finger
const HOLE = { x: W / 2, y: H * 0.38, r: 16 };

export const POWER_TYPES = ["shield", "magnet", "slow"];

export function createGame({ world, rng = Math.random }) {
  return {
    world,
    rng,
    time: 0,
    score: 0,
    stars: 0,
    over: false,
    ship: { x: W / 2, y: H - 80, tx: W / 2, ty: H - 80 },
    asteroids: [],
    pickups: [], // { kind: "star" | "shield" | "magnet" | "slow", x, y, vy }
    shield: 0, // seconds left (0 = none)
    magnet: 0,
    slow: 0,
    nextRock: 0.6,
    nextStar: 1.2,
    nextPower: 8,
    events: [],
    hole: world.pull > 0 ? HOLE : null,
  };
}

export function setTarget(g, x, y) {
  g.ship.tx = Math.max(SHIP_R, Math.min(W - SHIP_R, x));
  g.ship.ty = Math.max(SHIP_R + 40, Math.min(H - SHIP_R, y));
}

// Difficulty: rocks get faster and more frequent the longer you survive.
export function rockSpeed(t) {
  return Math.min(95 + t * 3.2, 270);
}
export function rockInterval(t, scale = 1) {
  return Math.max(0.26, (0.95 - t * 0.012) / scale);
}

function spawnRock(g) {
  const r = g.rng() * 12 + 10;
  g.asteroids.push({
    x: g.rng() * (W - 2 * r) + r,
    y: -r - 4,
    r,
    vy: rockSpeed(g.time) * (0.85 + g.rng() * 0.4),
    vx: (g.rng() - 0.5) * 50,
    rot: g.rng() * 6,
    spin: (g.rng() - 0.5) * 3,
  });
}

function spawnPickup(g, kind) {
  g.pickups.push({ kind, x: g.rng() * (W - 40) + 20, y: -14, vy: 80 });
}

const hit = (ax, ay, ar, bx, by, br) => {
  const dx = ax - bx;
  const dy = ay - by;
  const rr = ar + br;
  return dx * dx + dy * dy < rr * rr;
};

export function update(g, dt) {
  if (g.over) return;
  g.time += dt;
  g.shield = Math.max(0, g.shield - dt);
  g.magnet = Math.max(0, g.magnet - dt);
  g.slow = Math.max(0, g.slow - dt);
  const world = g.world;
  const k = g.slow > 0 ? 0.5 : 1; // slow-mo only slows the world, not the ship

  // ship chases the target
  const s = g.ship;
  const dx = s.tx - s.x;
  const dy = s.ty - s.y;
  const dist = Math.hypot(dx, dy);
  const step = Math.min(dist, SHIP_SPEED * dt);
  if (dist > 0.001) {
    s.x += (dx / dist) * step;
    s.y += (dy / dist) * step;
  }
  if (g.hole) {
    // gravity: pulls the ship toward the hole (strongest when close)
    const hx = g.hole.x - s.x;
    const hy = g.hole.y - s.y;
    const d = Math.max(30, Math.hypot(hx, hy));
    const pull = (world.pull * 60) / d;
    s.x += (hx / d) * pull * dt;
    s.y += (hy / d) * pull * dt;
    s.x = Math.max(SHIP_R, Math.min(W - SHIP_R, s.x));
    s.y = Math.max(SHIP_R, Math.min(H - SHIP_R, s.y));
    if (hit(s.x, s.y, SHIP_R * 0.6, g.hole.x, g.hole.y, g.hole.r * 0.7)) {
      g.over = true;
      g.events.push({ type: "crash", x: s.x, y: s.y });
      finalize(g);
      return;
    }
  }

  // spawning
  g.nextRock -= dt;
  while (g.nextRock <= 0) {
    spawnRock(g);
    g.nextRock += rockInterval(g.time, world.spawnScale);
  }
  g.nextStar -= dt;
  if (g.nextStar <= 0) {
    spawnPickup(g, "star");
    g.nextStar += 1.3 + g.rng() * 1.2;
  }
  g.nextPower -= dt;
  if (g.nextPower <= 0) {
    spawnPickup(g, POWER_TYPES[Math.floor(g.rng() * POWER_TYPES.length)]);
    g.nextPower += 9 + g.rng() * 5;
  }

  // move rocks
  g.asteroids.forEach((a) => {
    a.y += a.vy * k * dt;
    a.x += a.vx * k * dt;
    a.rot += a.spin * dt;
    if (g.hole) {
      const hx = g.hole.x - a.x;
      const hy = g.hole.y - a.y;
      const d = Math.max(40, Math.hypot(hx, hy));
      a.x += (hx / d) * (world.pull * 40 / d) * dt * 4;
    }
    if (a.x < a.r) {
      a.x = a.r;
      a.vx = Math.abs(a.vx);
    } else if (a.x > W - a.r) {
      a.x = W - a.r;
      a.vx = -Math.abs(a.vx);
    }
  });
  g.asteroids = g.asteroids.filter((a) => a.y < H + a.r + 10);

  // move pickups (the magnet drags stars toward the ship)
  g.pickups.forEach((p) => {
    p.y += p.vy * k * dt;
    if (g.magnet > 0 && p.kind === "star") {
      const mx = s.x - p.x;
      const my = s.y - p.y;
      const d = Math.max(1, Math.hypot(mx, my));
      if (d < 150) {
        p.x += (mx / d) * 230 * dt;
        p.y += (my / d) * 230 * dt;
      }
    }
  });

  // collect
  g.pickups = g.pickups.filter((p) => {
    if (p.y > H + 20) return false;
    if (!hit(s.x, s.y, SHIP_R + 4, p.x, p.y, 10)) return true;
    if (p.kind === "star") {
      g.stars += 1;
      g.events.push({ type: "star", x: p.x, y: p.y });
    } else {
      if (p.kind === "shield") g.shield = SHIELD_SECONDS;
      if (p.kind === "magnet") g.magnet = MAGNET_SECONDS;
      if (p.kind === "slow") g.slow = SLOW_SECONDS;
      g.events.push({ type: "power", kind: p.kind, x: p.x, y: p.y });
    }
    return false;
  });

  // crash (a shield absorbs one hit and destroys that rock)
  for (let i = 0; i < g.asteroids.length; i++) {
    const a = g.asteroids[i];
    if (!hit(s.x, s.y, SHIP_R * 0.8, a.x, a.y, a.r * 0.85)) continue;
    if (g.shield > 0) {
      g.shield = 0;
      g.asteroids.splice(i, 1);
      g.events.push({ type: "shield-break", x: a.x, y: a.y });
      i -= 1;
      continue;
    }
    g.over = true;
    g.events.push({ type: "crash", x: s.x, y: s.y });
    break;
  }
  finalize(g);
}

function finalize(g) {
  g.score = Math.floor(g.time * 10) + g.stars * STAR_POINTS;
}
