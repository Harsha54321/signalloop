// Word Hunt puzzle generator. Deterministic: the same theme + level number
// always produces the same grid, on any device, with no server.
import { hashSeed, makeRng } from "../../utils/rng";
import { getTheme } from "./words";

const DIRS = {
  E: [0, 1],
  S: [1, 0],
  SE: [1, 1],
  NE: [-1, 1],
  W: [0, -1],
  N: [-1, 0],
  NW: [-1, -1],
  SW: [1, -1],
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// How big and how crowded a level is. Levels never stop: after the grid
// and word count reach their caps, new levels keep coming with new words.
export function levelParams(level) {
  const size = Math.min(8 + Math.floor((level - 1) / 5), 12);
  const wordCount = Math.min(5 + Math.floor((level - 1) / 3), 12);
  let dirs;
  if (level < 4) dirs = ["E", "S"];
  else if (level < 8) dirs = ["E", "S", "SE"];
  else if (level < 15) dirs = ["E", "S", "SE", "NE"];
  else dirs = ["E", "S", "SE", "NE", "W", "N", "NW", "SW"];
  return { size, wordCount, dirs };
}

const reversed = (text) => text.split("").reverse().join("");

// Two words clash if one is hidden inside the other (CAKE inside PANCAKE).
const overlaps = (a, b) =>
  a.includes(b) || b.includes(a) || a.includes(reversed(b)) || b.includes(reversed(a));

export function generatePuzzle(themeId, level) {
  const theme = getTheme(themeId);
  const { size, wordCount, dirs } = levelParams(level);
  const rng = makeRng(hashSeed(`wordhunt-${theme.id}-${level}`));

  const pool = rng.shuffle(theme.words.filter((word) => word.length <= size));
  const grid = new Array(size * size).fill("");
  const placed = [];

  for (const word of pool) {
    if (placed.length >= wordCount) break;
    if (placed.some((p) => overlaps(p.word, word))) continue;

    let spot = null;
    for (let attempt = 0; attempt < 250 && !spot; attempt++) {
      const dir = rng.choice(dirs);
      const [dr, dc] = DIRS[dir];
      const r = rng.randrange(size);
      const c = rng.randrange(size);
      const endR = r + dr * (word.length - 1);
      const endC = c + dc * (word.length - 1);
      if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue;

      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const cell = grid[(r + dr * i) * size + (c + dc * i)];
        if (cell !== "" && cell !== word[i]) {
          fits = false;
          break;
        }
      }
      if (fits) spot = { r, c, dr, dc };
    }
    if (!spot) continue;

    for (let i = 0; i < word.length; i++) {
      grid[(spot.r + spot.dr * i) * size + (spot.c + spot.dc * i)] = word[i];
    }
    placed.push({ word, r: spot.r, c: spot.c, dr: spot.dr, dc: spot.dc });
  }

  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === "") grid[i] = ALPHABET[rng.randrange(26)];
  }

  // Keep the word list in alphabetical order so it is easy to scan
  placed.sort((a, b) => a.word.localeCompare(b.word));

  return { themeId: theme.id, level, size, grid, words: placed };
}

// Cells on the straight line from (r0,c0) to (r1,c1), or null when the two
// cells are not on a horizontal, vertical or diagonal line.
export function lineCells(r0, c0, r1, c1) {
  const dr = r1 - r0;
  const dc = c1 - c0;
  if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return null;
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  const cells = [];
  for (let i = 0; i <= steps; i++) cells.push([r0 + sr * i, c0 + sc * i]);
  return cells;
}

// Turn a pointer position into the nearest valid straight line from the
// start cell, so a slightly wobbly drag still selects a clean line.
export function snapLine(r0, c0, r1, c1, size) {
  let dr = r1 - r0;
  let dc = c1 - c0;
  const ar = Math.abs(dr);
  const ac = Math.abs(dc);
  if (!(dr === 0 || dc === 0 || ar === ac)) {
    if (ar > ac * 2) dc = 0;
    else if (ac > ar * 2) dr = 0;
    else {
      const len = Math.min(ar, ac) || Math.max(ar, ac);
      dr = Math.sign(dr) * len;
      dc = Math.sign(dc) * len;
    }
  }
  let endR = r0 + dr;
  let endC = c0 + dc;
  // keep the end inside the grid
  while (endR < 0 || endR >= size || endC < 0 || endC >= size) {
    dr -= Math.sign(dr);
    dc -= Math.sign(dc);
    endR = r0 + dr;
    endC = c0 + dc;
  }
  return lineCells(r0, c0, endR, endC) || [[r0, c0]];
}

// Does this selection spell one of the puzzle's words (either direction)?
// Returns the matching word entry or null. Words already found are skipped.
export function matchSelection(puzzle, cells, found) {
  if (cells.length < 2) return null;
  const text = cells.map(([r, c]) => puzzle.grid[r * puzzle.size + c]).join("");
  const back = reversed(text);
  return (
    puzzle.words.find((entry) => !found.includes(entry.word) && (entry.word === text || entry.word === back)) ||
    null
  );
}

export function wordCells(entry) {
  return Array.from({ length: entry.word.length }, (_, i) => [entry.r + entry.dr * i, entry.c + entry.dc * i]);
}

// stars + score for a finished level
export function scoreRun({ wordCount, seconds, hints }) {
  const par = wordCount * 15;
  let stars = 1;
  if (hints === 0 && seconds <= par) stars = 3;
  else if (hints <= 1 || seconds <= par * 2) stars = 2;
  const score = Math.max(50, wordCount * 100 + Math.max(0, wordCount * 25 - Math.floor(seconds)) - hints * 40);
  return { stars, score };
}
