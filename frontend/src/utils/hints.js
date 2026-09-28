// Hint logic for SignalLoop. Everything here runs in the browser using the
// level data the game already has, so hints work fully OFFLINE.
import { rotateEdges } from "./tileShapes";

// Hints you get on every level (each level starts with a fresh set)
export const HINTS_PER_LEVEL = 3;

function sameEdges(a, b) {
  const x = a.slice().sort();
  const y = b.slice().sort();
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

// How many clockwise taps until this tile is in a solved position.
// 0 = already correct. Straight pieces look the same after 2 taps, so their
// answer is never more than 1.
export function tapsToSolve(shape, rotation) {
  for (let taps = 0; taps < 4; taps++) {
    if (sameEdges(rotateEdges(shape, rotation + taps), shape)) return taps;
  }
  return 0;
}

// Pick which tile to reveal: any wrong tile, preferring ones with more open
// sides (T-pieces, corners) because fixing them narrows down their
// neighbours the most. Returns -1 when every tile is already correct.
export function pickHintTile(cells, rotations) {
  let best = -1;
  let bestScore = -1;
  cells.forEach((cell, idx) => {
    if (tapsToSolve(cell.shape, rotations[idx]) === 0) return;
    const score = cell.shape.length;
    if (score > bestScore) {
      best = idx;
      bestScore = score;
    }
  });
  return best;
}
