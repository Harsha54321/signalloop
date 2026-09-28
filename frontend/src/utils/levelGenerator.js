/**
 * Client-side level generator - lets the game run fully OFFLINE.
 *
 * This is an exact twin of backend/game/level_generator.py. Both use the
 * same FNV-1a hash and the same mulberry32 PRNG, so level N is the
 * identical puzzle in the browser and on the server. If you change the
 * algorithm here, change it in the Python file too.
 */

const DIRS = ["N", "E", "S", "W"]; // clockwise order
const OPPOSITE = { N: "S", S: "N", E: "W", W: "E" };
const DELTA = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };

function hashSeed(text) {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function makeRng(seed) {
  // mulberry32
  let a = seed >>> 0;
  const random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    randrange: (n) => Math.floor(random() * n),
    choice: (items) => items[Math.floor(random() * items.length)],
    shuffle: (items) => {
      // in-place Fisher-Yates
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        const tmp = items[i];
        items[i] = items[j];
        items[j] = tmp;
      }
    },
  };
}

function gridDims(levelNumber) {
  const size = Math.min(3 + Math.floor((levelNumber - 1) / 4), 10);
  return [size, size];
}

function extraLoopCount(levelNumber, totalCells) {
  const base = Math.floor((levelNumber - 1) / 3);
  return Math.min(base, Math.floor(totalCells / 3));
}

function shapeName(edges) {
  const n = edges.length;
  if (n === 0) return "isolated";
  if (n === 1) return "end";
  if (n === 2) return OPPOSITE[edges[0]] === edges[1] ? "straight" : "corner";
  if (n === 3) return "tee";
  return "cross";
}

export function generateLevel(levelNumber) {
  if (!Number.isInteger(levelNumber) || levelNumber < 1) {
    throw new Error("levelNumber must be an integer >= 1");
  }

  const rng = makeRng(hashSeed(`signalloop-level-${levelNumber}`));
  const [rows, cols] = gridDims(levelNumber);
  const totalCells = rows * cols;
  const key = (cell) => `${cell[0]},${cell[1]}`;

  // --- 1. Randomized Prim's algorithm -> spanning tree ---
  const connections = new Map();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) connections.set(`${r},${c}`, new Set());
  }
  const visited = new Set();
  const startRow = rng.randrange(rows);
  const startCol = rng.randrange(cols);
  const start = [startRow, startCol];
  visited.add(key(start));

  let frontier = [];
  const addFrontier = (cell) => {
    const [r, c] = cell;
    for (const d of DIRS) {
      const [dr, dc] = DELTA[d];
      const nb = [r + dr, c + dc];
      if (
        nb[0] >= 0 &&
        nb[0] < rows &&
        nb[1] >= 0 &&
        nb[1] < cols &&
        !visited.has(key(nb))
      ) {
        frontier.push([cell, d, nb]);
      }
    }
  };
  addFrontier(start);

  while (visited.size < totalCells) {
    rng.shuffle(frontier);
    const [cell, d, nb] = frontier.pop();
    if (visited.has(key(nb))) continue;
    connections.get(key(cell)).add(d);
    connections.get(key(nb)).add(OPPOSITE[d]);
    visited.add(key(nb));
    addFrontier(nb);
    frontier = frontier.filter((f) => !visited.has(key(f[2])));
  }

  // --- 2. Extra edges -> loops for higher difficulty ---
  const extra = extraLoopCount(levelNumber, totalCells);
  const allPairs = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c + 1 < cols) allPairs.push([[r, c], "E", [r, c + 1]]);
      if (r + 1 < rows) allPairs.push([[r, c], "S", [r + 1, c]]);
    }
  }
  rng.shuffle(allPairs);

  let added = 0;
  for (const [cell, d, nb] of allPairs) {
    if (added >= extra) break;
    const cellSet = connections.get(key(cell));
    const nbSet = connections.get(key(nb));
    if (cellSet.has(d)) continue;
    if (cellSet.size >= 3 || nbSet.size >= 3) continue;
    cellSet.add(d);
    nbSet.add(OPPOSITE[d]);
    added += 1;
  }

  // --- 3. Cells: solved shape + scrambled rotation ---
  const cells = [];
  let parTotal = 0; // minimum number of taps needed to solve the whole board
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const solved = connections.get(`${r},${c}`);
      const shape = DIRS.filter((d) => solved.has(d));
      const name = shapeName(shape);

      let period = 4;
      if (name === "straight") period = 2;
      else if (name === "cross") period = 1;

      let rotation = 0;
      if (period !== 1) {
        const choices = [];
        for (let k = 1; k < period; k++) choices.push(k);
        rotation = rng.choice(choices);
      }
      // taps this tile needs to get back to its solved orientation
      parTotal += period === 1 ? 0 : (period - rotation) % period;

      cells.push({ row: r, col: c, shape, rotation });
    }
  }

  const difficulty = 1 + Math.floor((levelNumber - 1) / 4) + (extra ? 1 : 0);

  return {
    level_number: levelNumber,
    rows,
    cols,
    difficulty,
    extra_loops: extra,
    par_moves: Math.max(parTotal, 1),
    cells,
  };
}
