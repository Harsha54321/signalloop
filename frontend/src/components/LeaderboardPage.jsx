import React, { useState } from "react";
import { fetchLeaderboard } from "../api";

export default function LeaderboardPage() {
  const [levelInput, setLevelInput] = useState("1");
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = (levelNumber) => {
    setLoading(true);
    setError(null);
    fetchLeaderboard(levelNumber)
      .then(setRows)
      .catch((e) =>
        setError(
          navigator.onLine
            ? e.message
            : "You're offline - the leaderboard needs an internet connection. Keep playing, it will work again once you're back online."
        )
      )
      .finally(() => setLoading(false));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const n = parseInt(levelInput, 10);
    if (n >= 1) load(n);
  };

  return (
    <div className="sl-page">
      <h1 className="sl-page__title">Leaderboard</h1>
      <p className="sl-subtitle">Fastest solve times for any level, across every player.</p>

      <form className="sl-leaderboard-search" onSubmit={handleSearch}>
        <input
          type="number"
          min="1"
          value={levelInput}
          onChange={(e) => setLevelInput(e.target.value)}
          className="sl-input"
          placeholder="Level number"
        />
        <button className="sl-btn sl-btn--primary" type="submit">
          Search
        </button>
      </form>

      {loading && <div className="sl-status">Loading…</div>}
      {error && <div className="sl-status sl-status--error">Error: {error}</div>}

      {rows && !loading && (
        <table className="sl-stats-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Stars</th>
              <th>Moves</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan="5">No completions yet for this level — be the first!</td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{r.player_id}</td>
                <td>{"★".repeat(r.stars)}</td>
                <td>{r.best_moves}</td>
                <td>{Math.round(r.best_time_seconds)}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
