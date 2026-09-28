// Everything the game needs to keep working without internet lives here.
// Data is stored in the browser's localStorage on this device.

const PROGRESS_KEY = "signalloop_progress_v1";
const PENDING_KEY = "signalloop_pending_v1";
const PENDING_RATING_KEY = "signalloop_pending_rating_v1";
const MY_RATING_KEY = "signalloop_my_rating_v1";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked - ignore, game still works in memory */
  }
}

// Same star rule as the backend (game/views.py -> _stars_for)
export function starsFor(moves, parMoves) {
  if (moves <= parMoves) return 3;
  if (moves <= parMoves * 1.5) return 2;
  return 1;
}

// ---------- progress ----------
export function getLocalProgress() {
  const all = read(PROGRESS_KEY, {});
  return Object.values(all).sort((a, b) => a.level_number - b.level_number);
}

export function replaceLocalProgress(records) {
  const map = {};
  records.forEach((r) => {
    map[r.level_number] = r;
  });
  write(PROGRESS_KEY, map);
}

export function saveLocalResult({ levelNumber, moves, timeSeconds, parMoves }) {
  const all = read(PROGRESS_KEY, {});
  const prev = all[levelNumber];
  const stars = starsFor(moves, parMoves);

  // Same "is this a better result?" rule the backend uses
  const isBetter =
    !prev ||
    prev.best_moves == null ||
    moves < prev.best_moves ||
    stars > prev.stars;

  const record = {
    level_number: levelNumber,
    completed: true,
    best_moves: isBetter ? moves : prev.best_moves,
    best_time_seconds: isBetter ? timeSeconds : prev.best_time_seconds,
    stars: isBetter ? stars : prev.stars,
  };
  all[levelNumber] = record;
  write(PROGRESS_KEY, all);
  return record;
}

function betterRecord(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (a.completed !== b.completed) return a.completed ? a : b;
  if (a.stars !== b.stars) return a.stars > b.stars ? a : b;
  if (
    a.best_moves != null &&
    b.best_moves != null &&
    a.best_moves !== b.best_moves
  ) {
    return a.best_moves < b.best_moves ? a : b;
  }
  return a;
}

// Combine server progress with on-device progress, keeping the best of each level
export function mergeProgress(remoteRows, localRows) {
  const map = {};
  [...remoteRows, ...localRows].forEach((r) => {
    map[r.level_number] = betterRecord(map[r.level_number], r);
  });
  return Object.values(map).sort((a, b) => a.level_number - b.level_number);
}

// ---------- pending sync queue (results finished while offline) ----------
export function getPending() {
  return read(PENDING_KEY, []);
}

export function setPending(list) {
  write(PENDING_KEY, list);
}

// ---------- rating ----------
export function saveMyRating(rating) {
  write(MY_RATING_KEY, rating);
}

export function getMyRating() {
  return read(MY_RATING_KEY, null);
}

export function savePendingRating(rating) {
  write(PENDING_RATING_KEY, rating);
}

export function getPendingRating() {
  return read(PENDING_RATING_KEY, null);
}

export function clearPendingRating() {
  try {
    localStorage.removeItem(PENDING_RATING_KEY);
  } catch {
    /* ignore */
  }
}
