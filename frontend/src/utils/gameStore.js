// On-device save data for the hub games (Word Hunt, Memory Match,
// Neon Stack, Star Dodger). SignalLoop keeps its own store in storage.js.
//
// One record per (game, variant, level):
//   game      "wordhunt" | "memory" | "neonstack" | "stardodger"
//   variant   theme / world id ("animals", "neon-city", ...)
//   level_number  level inside the variant (0 for single-run arcade games)
// Field names match the Django API so records can be merged with the server.

const KEY = "signalloop_games_v1";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function write(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* storage full or blocked - the game still works in memory */
  }
}

export const recordKey = (game, variant, level) => `${game}|${variant || ""}|${level || 0}`;

export function getAllGameRecords() {
  return Object.values(read());
}

export function getGameRecords(game) {
  return getAllGameRecords().filter((r) => r.game === game);
}

export function getRecord(game, variant, level) {
  return read()[recordKey(game, variant, level)] || null;
}

// Save a finished run. The best score wins; stars and the secondary stat
// (floors / stars collected / words found) keep their own maximum.
export function saveGameResult({
  game,
  variant = "",
  level = 0,
  score = 0,
  stars = 0,
  moves = 0,
  timeSeconds = 0,
  extra = 0,
}) {
  const all = read();
  const key = recordKey(game, variant, level);
  const prev = all[key] || null;
  const isNewBest = !prev || score > (prev.best_score ?? -1);

  const record = {
    game,
    variant,
    level_number: level,
    completed: true,
    best_score: isNewBest ? score : prev.best_score,
    best_moves: isNewBest ? moves : prev.best_moves,
    best_time_seconds: isNewBest ? timeSeconds : prev.best_time_seconds,
    stars: Math.max(prev ? prev.stars || 0 : 0, stars),
    best_extra: Math.max(prev ? prev.best_extra || 0 : 0, extra),
    plays: (prev ? prev.plays || 0 : 0) + 1,
  };
  all[key] = record;
  write(all);
  return { record, isNewBest, previousBest: prev ? prev.best_score ?? null : null };
}

// Merge rows from the server (?game=all) into this device, keeping the
// best of both. SignalLoop rows are ignored - storage.js handles those.
export function mergeRemoteRecords(rows) {
  const all = read();
  let changed = false;
  rows.forEach((row) => {
    if (!row.game || row.game === "signalloop") return;
    const key = recordKey(row.game, row.variant, row.level_number);
    const prev = all[key];
    if (!prev) {
      all[key] = {
        game: row.game,
        variant: row.variant || "",
        level_number: row.level_number || 0,
        completed: true,
        best_score: row.best_score || 0,
        best_moves: row.best_moves ?? 0,
        best_time_seconds: row.best_time_seconds ?? 0,
        stars: row.stars || 0,
        best_extra: row.best_extra || 0,
        plays: 1,
      };
      changed = true;
      return;
    }
    if ((row.best_score || 0) > (prev.best_score || 0)) {
      prev.best_score = row.best_score;
      prev.best_moves = row.best_moves ?? prev.best_moves;
      prev.best_time_seconds = row.best_time_seconds ?? prev.best_time_seconds;
      changed = true;
    }
    if ((row.stars || 0) > (prev.stars || 0)) {
      prev.stars = row.stars;
      changed = true;
    }
    if ((row.best_extra || 0) > (prev.best_extra || 0)) {
      prev.best_extra = row.best_extra;
      changed = true;
    }
  });
  if (changed) write(all);
  return Object.values(all);
}
