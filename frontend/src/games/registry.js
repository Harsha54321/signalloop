import { GAME_META, CATEGORIES } from "./meta";
import SignalLoopGame from "./signalloop/SignalLoopGame";
import WordHuntGame from "./wordhunt/WordHuntGame";
import MemoryGame from "./memory/MemoryGame";
import NeonStackGame from "./neonstack/NeonStackGame";
import StarDodgerGame from "./stardodger/StarDodgerGame";
import { THEMES as WORD_THEMES } from "./wordhunt/words";
import { THEMES as MEMORY_THEMES } from "./memory/themes";
import { WORLDS as STACK_WORLDS } from "./neonstack/worlds";
import { WORLDS as DODGER_WORLDS } from "./stardodger/worlds";

// To add a game: add its metadata in meta.js, build its component, and
// register the component (and its themes/worlds, if any) here.
const COMPONENTS = {
  signalloop: SignalLoopGame,
  wordhunt: WordHuntGame,
  memory: MemoryGame,
  neonstack: NeonStackGame,
  stardodger: StarDodgerGame,
};

const pick = (list) => list.map(({ id, name, icon }) => ({ id, name, icon }));

// themes / worlds of each game (used by the leaderboard and stats pages)
const VARIANTS = {
  signalloop: [],
  wordhunt: pick(WORD_THEMES),
  memory: pick(MEMORY_THEMES),
  neonstack: pick(STACK_WORLDS),
  stardodger: pick(DODGER_WORLDS),
};

export { CATEGORIES };

export const GAMES = GAME_META.map((meta) => ({
  ...meta,
  component: COMPONENTS[meta.id],
  variants: VARIANTS[meta.id],
}));

export const getGame = (id) => GAMES.find((g) => g.id === id) || null;
