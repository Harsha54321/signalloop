// Neon Stack rules. No React and no DOM in here: the screen (and the
// tests) just call createGame / update / drop and read the state.
//
// Space: the playfield is W x H "logical" pixels (drawn scaled). A block
// sits on a floor `level`; level 0 is the base, level 1 the first block
// the player drops, and so on.
export const W = 320;
export const H = 480;
export const BLOCK_H = 22;
export const START_W = 180;
export const PERFECT_PX = 4; // how close counts as a perfect drop
export const MIN_W = 4; // a block thinner than this can't be stacked
export const GROUND_Y = 420; // y of the bottom of the base block
export const START_HINTS = 3;
export const SLOW_SECONDS = 5;

export function speedFor(floors) {
  return Math.min(95 + floors * 6, 280); // logical px per second
}

function newMover(g) {
  const top = g.blocks[g.blocks.length - 1];
  const fromLeft = g.floors % 2 === 0; // alternate sides so it isn't predictable
  return { x: fromLeft ? 0 : W - top.w, w: top.w, dir: fromLeft ? 1 : -1, level: g.blocks.length };
}

export function createGame() {
  const g = {
    blocks: [{ x: (W - START_W) / 2, w: START_W }],
    mover: null,
    floors: 0,
    score: 0,
    perfects: 0,
    streak: 0,
    bestStreak: 0,
    over: false,
    time: 0,
    slowLeft: 0,
    guide: false,
    hintsLeft: START_HINTS,
    debris: [], // pieces that were cut off and are falling away
    events: [], // things the renderer should show (perfect ring, miss shake...)
  };
  g.mover = newMover(g);
  return g;
}

export function update(g, dt) {
  // cut-off pieces keep falling even after the game is over
  g.debris.forEach((d) => {
    d.vy += 900 * dt;
    d.dy += d.vy * dt;
    d.alpha = Math.max(0, d.alpha - dt * 1.2);
  });
  g.debris = g.debris.filter((d) => d.alpha > 0);
  if (g.over) return;

  g.time += dt;
  g.slowLeft = Math.max(0, g.slowLeft - dt);
  const speed = speedFor(g.floors) * (g.slowLeft > 0 ? 0.5 : 1);
  const m = g.mover;
  m.x += m.dir * speed * dt;
  const maxX = W - m.w;
  if (m.x <= 0) {
    m.x = 0;
    m.dir = 1;
  } else if (m.x >= maxX) {
    m.x = maxX;
    m.dir = -1;
  }
}

// Drop the moving block on the tower. Returns what happened:
// { type: "perfect" | "good" | "miss", gained }
export function drop(g) {
  if (g.over) return { type: "miss", gained: 0 };
  const top = g.blocks[g.blocks.length - 1];
  const m = g.mover;
  const left = Math.max(m.x, top.x);
  const right = Math.min(m.x + m.w, top.x + top.w);
  const overlap = right - left;

  if (overlap < MIN_W) {
    // missed (or only a sliver landed): the whole block falls and the run ends
    g.over = true;
    g.streak = 0;
    g.debris.push({ x: m.x, w: m.w, level: m.level, dy: 0, vy: 0, alpha: 1 });
    g.events.push({ type: "miss", level: m.level, x: m.x, w: m.w });
    return { type: "miss", gained: 0 };
  }

  let x;
  let w;
  let type;
  let gained;
  if (Math.abs(m.x - top.x) <= PERFECT_PX) {
    type = "perfect";
    g.streak += 1;
    g.perfects += 1;
    g.bestStreak = Math.max(g.bestStreak, g.streak);
    x = top.x;
    w = top.w;
    if (g.streak >= 3 && w < START_W) {
      // three perfects in a row: the block grows back a little
      const grown = Math.min(START_W, w + 6);
      x = Math.max(0, Math.min(W - grown, x - (grown - w) / 2));
      w = grown;
    }
    gained = 20 + Math.min(g.streak, 5) * 5;
  } else {
    type = "good";
    g.streak = 0;
    x = left;
    w = overlap;
    gained = 10;
    // the overhanging part is cut off and falls away
    if (m.x < top.x) {
      g.debris.push({ x: m.x, w: top.x - m.x, level: m.level, dy: 0, vy: 0, alpha: 1 });
    } else {
      const cutX = top.x + top.w;
      g.debris.push({ x: cutX, w: m.x + m.w - cutX, level: m.level, dy: 0, vy: 0, alpha: 1 });
    }
  }

  g.blocks.push({ x, w });
  g.floors += 1;
  g.score += gained;
  g.guide = false; // the guide only lasts for one drop
  g.events.push({ type, level: m.level, x, w, streak: g.streak, gained });
  g.mover = newMover(g);
  return { type, gained };
}

// Hint 1: draw lines where the next block should land (for one drop).
export function activateGuide(g) {
  if (g.over || g.hintsLeft <= 0 || g.guide) return false;
  g.guide = true;
  g.hintsLeft -= 1;
  return true;
}

// Hint 2: the block moves at half speed for SLOW_SECONDS.
export function activateSlow(g) {
  if (g.over || g.hintsLeft <= 0 || g.slowLeft > 0) return false;
  g.slowLeft = SLOW_SECONDS;
  g.hintsLeft -= 1;
  return true;
}
