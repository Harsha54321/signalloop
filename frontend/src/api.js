// API layer - OFFLINE FIRST.
//  * Levels are generated in the browser (no network needed).
//  * Progress is always saved on this device first, then synced to the
//    Django backend whenever the internet is available.
//  * Leaderboard / rating summary need the server and say so when offline.
import { generateLevel } from "./utils/levelGenerator";
import {
  getLocalProgress,
  replaceLocalProgress,
  saveLocalResult,
  mergeProgress,
  getPending,
  setPending,
  saveMyRating,
  getMyRating,
  savePendingRating,
  getPendingRating,
  clearPendingRating,
} from "./utils/storage";
import { saveGameResult, mergeRemoteRecords } from "./utils/gameStore";

const API_BASE = process.env.REACT_APP_API_BASE || "/api";
const JSON_HEADERS = { "Content-Type": "application/json" };

// A saved result is only dropped from the offline queue when the server
// accepted it (or rejected it as invalid, which retrying can't fix).
// Server errors, a sleeping/old backend (404) and rate limits are retried.
const shouldRetry = (res) => res.status >= 500 || res.status === 404 || res.status === 429 || res.status === 408;

function getPlayerId() {
  let id = localStorage.getItem("signalloop_player_id");
  if (!id) {
    id =
      "player-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 10);
    localStorage.setItem("signalloop_player_id", id);
  }
  return id;
}

// fetch that gives up after `ms` so a bad connection never freezes the UI
async function fetchWithTimeout(url, options = {}, ms = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------- levels: fully offline ----------
async function fetchLevel(levelNumber) {
  return generateLevel(levelNumber);
}

// ---------- progress: local first, server sync when possible ----------
async function fetchProgress(playerId) {
  const local = getLocalProgress();
  try {
    const res = await fetchWithTimeout(`${API_BASE}/progress/${playerId}/`, {}, 8000);
    if (!res.ok) throw new Error("bad status");
    const remote = await res.json();
    const merged = mergeProgress(remote, local);
    replaceLocalProgress(merged);
    return merged;
  } catch {
    return local; // offline / server asleep -> use what's on this device
  }
}

async function submitResult({ playerId, levelNumber, moves, timeSeconds, parMoves }) {
  // 1. always save on the device first
  const local = saveLocalResult({ levelNumber, moves, timeSeconds, parMoves });

  // 2. try to tell the server; if that fails, queue it for later
  const payload = {
    player_id: playerId,
    level_number: levelNumber,
    moves,
    time_seconds: timeSeconds,
  };
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/progress/`,
      { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(payload) },
      15000
    );
    if (res.status >= 500) throw new Error("server error");
    return { ...local, synced: true };
  } catch {
    setPending([...getPending(), payload]);
    return { ...local, synced: false };
  }
}

// Send everything that was saved while offline. Safe to call any time.
async function flushPending() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;

  const queue = getPending();
  const remaining = [];
  for (const item of queue) {
    // items queued by older versions have no "kind" - they are SignalLoop results
    const path = item.kind === "score" ? "score" : "progress";
    try {
      const res = await fetchWithTimeout(
        `${API_BASE}/${path}/`,
        { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(item) },
        20000
      );
      if (shouldRetry(res)) remaining.push(item);
    } catch {
      remaining.push(item);
    }
  }
  setPending(remaining);

  const pendingRating = getPendingRating();
  if (pendingRating) {
    try {
      const res = await fetchWithTimeout(
        `${API_BASE}/rating/`,
        { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(pendingRating) },
        20000
      );
      if (res.status < 500) clearPendingRating();
    } catch {
      /* keep it queued */
    }
  }
}

// ---------- hub games (Word Hunt, Memory Match, Neon Stack, Star Dodger) ----------
// Same offline-first idea as SignalLoop: save on the device first, then
// tell the server; if that fails, queue it and send it when online again.
function submitScore({
  playerId,
  game,
  variant = "",
  level = 0,
  score,
  stars = 0,
  moves = 0,
  timeSeconds = 0,
  extra = 0,
}) {
  // 1. Save on the device straight away and return, so the result screen
  //    never waits for the network (a sleeping free server can take a minute).
  const saved = saveGameResult({ game, variant, level, score, stars, moves, timeSeconds, extra });

  // 2. Tell the server in the background; if that fails, queue it for later.
  postScore({
    kind: "score",
    player_id: playerId,
    game,
    variant,
    level_number: level,
    score,
    stars,
    moves,
    time_seconds: timeSeconds,
    extra,
  });
  return saved;
}

async function postScore(payload) {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/score/`,
      { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(payload) },
      15000
    );
    if (shouldRetry(res)) throw new Error("server not ready");
  } catch {
    setPending([...getPending(), payload]);
  }
}

// Pull this player's results for every game from the server and merge them
// into the device (so progress follows the player to another device).
async function syncGameProgress(playerId) {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/progress/${playerId}/?game=all`, {}, 8000);
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) mergeRemoteRecords(rows);
  } catch {
    /* offline - the device copy is used */
  }
}

// ---------- online-only features ----------
async function fetchLeaderboard(levelNumber) {
  const res = await fetchWithTimeout(`${API_BASE}/leaderboard/${levelNumber}/`, {}, 60000);
  if (!res.ok) throw new Error("Failed to load leaderboard");
  return res.json();
}

async function fetchScores(game, variant, level) {
  const params = new URLSearchParams({ variant: variant || "", level: String(level || 0) });
  const res = await fetchWithTimeout(`${API_BASE}/scores/${game}/?${params}`, {}, 60000);
  if (!res.ok) throw new Error("Failed to load scores");
  return res.json();
}

async function submitRating({ playerId, stars, comment }) {
  const payload = { player_id: playerId, stars, comment: comment || "" };
  saveMyRating(payload); // remember it on this device either way
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/rating/`,
      { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(payload) },
      20000
    );
    if (!res.ok) throw new Error("Failed to submit rating");
    clearPendingRating();
    return { ...(await res.json()), queued: false };
  } catch {
    savePendingRating(payload); // send later, when internet is back
    return { ...payload, queued: true };
  }
}

async function fetchRatingSummary() {
  const res = await fetchWithTimeout(`${API_BASE}/rating/summary/`, {}, 60000);
  if (!res.ok) throw new Error("Failed to load rating summary");
  return res.json();
}

async function fetchMyRating(playerId) {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/rating/${playerId}/`, {}, 8000);
    if (!res.ok) throw new Error("bad status");
    const mine = await res.json();
    if (mine) return mine;
  } catch {
    /* fall through to the copy stored on this device */
  }
  return getMyRating();
}

export {
  getPlayerId,
  fetchLevel,
  fetchProgress,
  submitResult,
  flushPending,
  submitScore,
  syncGameProgress,
  fetchScores,
  fetchLeaderboard,
  submitRating,
  fetchRatingSummary,
  fetchMyRating,
};
