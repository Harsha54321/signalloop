const API_BASE = process.env.REACT_APP_API_BASE || "/api";

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

async function fetchLevel(levelNumber) {
  const res = await fetch(`${API_BASE}/level/${levelNumber}/`);
  if (!res.ok) throw new Error("Failed to load level " + levelNumber);
  return res.json();
}

async function fetchProgress(playerId) {
  const res = await fetch(`${API_BASE}/progress/${playerId}/`);
  if (!res.ok) throw new Error("Failed to load progress");
  return res.json();
}

async function submitResult({ playerId, levelNumber, moves, timeSeconds }) {
  const res = await fetch(`${API_BASE}/progress/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      player_id: playerId,
      level_number: levelNumber,
      moves,
      time_seconds: timeSeconds,
    }),
  });
  if (!res.ok) throw new Error("Failed to submit result");
  return res.json();
}

async function fetchLeaderboard(levelNumber) {
  const res = await fetch(`${API_BASE}/leaderboard/${levelNumber}/`);
  if (!res.ok) throw new Error("Failed to load leaderboard");
  return res.json();
}

async function submitRating({ playerId, stars, comment }) {
  const res = await fetch(`${API_BASE}/rating/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_id: playerId, stars, comment: comment || "" }),
  });
  if (!res.ok) throw new Error("Failed to submit rating");
  return res.json();
}

async function fetchRatingSummary() {
  const res = await fetch(`${API_BASE}/rating/summary/`);
  if (!res.ok) throw new Error("Failed to load rating summary");
  return res.json();
}

async function fetchMyRating(playerId) {
  const res = await fetch(`${API_BASE}/rating/${playerId}/`);
  if (!res.ok) throw new Error("Failed to load your rating");
  return res.json();
}

export {
  getPlayerId,
  fetchLevel,
  fetchProgress,
  submitResult,
  fetchLeaderboard,
  submitRating,
  fetchRatingSummary,
  fetchMyRating,
};
