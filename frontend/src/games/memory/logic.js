// Memory Match rules: board sizes, deck building and scoring.
// Pure functions - no React, no DOM - so they are easy to test.
import { hashSeed, makeRng } from "../../utils/rng";
import { getTheme } from "./themes";

// [rows, cols] for levels 1..9. Level 9 onwards stays 6x6 (18 pairs).
const BOARDS = [
  [2, 2],
  [2, 3],
  [2, 4],
  [3, 4],
  [4, 4],
  [4, 5],
  [4, 6],
  [5, 6],
  [6, 6],
];

export function boardFor(level) {
  const [rows, cols] = BOARDS[Math.min(level, BOARDS.length) - 1];
  // Early levels show every card for a moment before the game starts.
  const previewSeconds = level <= 6 ? Math.max(0.8, 2.6 - level * 0.3) : 0;
  return { rows, cols, pairs: (rows * cols) / 2, previewSeconds };
}

// Same theme + level always gives the same layout, on any device.
export function buildDeck(themeId, level) {
  const theme = getTheme(themeId);
  const { pairs } = boardFor(level);
  const rng = makeRng(hashSeed(`memory-${theme.id}-${level}`));
  const chosen = rng.shuffle(theme.symbols.slice()).slice(0, pairs);
  const cards = [];
  chosen.forEach((symbol, pairId) => {
    cards.push({ symbol, pairId }, { symbol, pairId });
  });
  rng.shuffle(cards);
  return cards.map((card, index) => ({ ...card, index }));
}

// A "try" is turning over two cards. 3 stars for few tries, 2 for a fair
// number, 1 for finishing.
export function scoreRun({ pairs, tries, seconds, peeks }) {
  let stars = 1;
  if (tries <= Math.ceil(pairs * 1.5)) stars = 3;
  else if (tries <= Math.ceil(pairs * 2.5)) stars = 2;
  const extraTries = Math.max(0, tries - pairs);
  const timeBonus = Math.max(0, pairs * 30 - Math.floor(seconds));
  const score = Math.max(50, pairs * 100 + timeBonus - extraTries * 10 - peeks * 30);
  return { stars, score };
}
