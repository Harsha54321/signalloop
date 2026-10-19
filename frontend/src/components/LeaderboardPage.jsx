import React, { useState } from "react";
import { fetchLeaderboard, fetchScores } from "../api";
import { GAMES, getGame } from "../games/registry";

const fmtTime = (secs) => `${Math.round(secs || 0)}s`;

export default function LeaderboardPage() {
  const [gameId, setGameId] = useState("signalloop");
  const [variant, setVariant] = useState("");
  const [levelInput, setLevelInput] = useState("1");
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const game = getGame(gameId);

  const chooseGame = (id) => {
    const g = getGame(id);
    setGameId(id);
    setVariant(g.variants.length ? g.variants[0].id : "");
    setRows(null);
    setError(null);
  };

  const load = (e) => {
    e.preventDefault();
    const level = parseInt(levelInput, 10);
    if (game.hasLevels && !(level >= 1)) return;
    setLoading(true);
    setError(null);
    const request =
      game.id === "signalloop"
        ? fetchLeaderboard(level)
        : fetchScores(game.id, variant, game.hasLevels ? level : 0);
    request
      .then(setRows)
      .catch((err) =>
        setError(
          navigator.onLine
            ? err.message
            : "You're offline - the leaderboard needs an internet connection. Keep playing, it will work again once you're back online."
        )
      )
      .finally(() => setLoading(false));
  };

  const isSignal = game.id === "signalloop";

  return (
    <div className="sl-page">
      <h1 className="sl-page__title">Leaderboard</h1>
      <p className="sl-subtitle">Top 10 results from every player. Needs internet.</p>

      <div className="sl-chips" role="group" aria-label="Choose a game">
        {GAMES.map((g) => (
          <button
            type="button"
            key={g.id}
            className={`sl-chip ${gameId === g.id ? "sl-chip--on" : ""}`}
            aria-pressed={gameId === g.id}
            onClick={() => chooseGame(g.id)}
          >
            <span aria-hidden="true">{g.icon}</span> {g.name}
          </button>
        ))}
      </div>

      <form className="sl-leaderboard-search" onSubmit={load}>
        {game.variants.length > 0 && (
          <select
            className="sl-input"
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            aria-label={game.hasLevels ? "Theme" : "World"}
          >
            {game.variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.icon} {v.name}
              </option>
            ))}
          </select>
        )}
        {game.hasLevels && (
          <input
            type="number"
            min="1"
            value={levelInput}
            onChange={(e) => setLevelInput(e.target.value)}
            className="sl-input"
            placeholder="Level number"
            aria-label="Level number"
          />
        )}
        <button className="sl-btn sl-btn--primary" type="submit">
          Show top 10
        </button>
      </form>

      {loading && <div className="sl-status">Loading…</div>}
      {error && <div className="sl-status sl-status--error">Error: {error}</div>}

      {rows && !loading && (
        <div className="sl-table-wrap">
          <table className="sl-stats-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                {!isSignal && <th>Score</th>}
                <th>Stars</th>
                {isSignal && <th>Moves</th>}
                {!isSignal && game.extraLabel && <th>{game.extraLabel}</th>}
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan="6">No results yet. Be the first!</td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={`${r.player_id}-${i}`}>
                  <td>{i + 1}</td>
                  <td>{r.player_id}</td>
                  {!isSignal && <td>{r.best_score}</td>}
                  <td>{"★".repeat(r.stars || 0) || "–"}</td>
                  {isSignal && <td>{r.best_moves}</td>}
                  {!isSignal && game.extraLabel && <td>{r.best_extra ?? "–"}</td>}
                  <td>{fmtTime(r.best_time_seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
