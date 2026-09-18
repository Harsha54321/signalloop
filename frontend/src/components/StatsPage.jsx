import React, { useEffect, useState } from "react";
import { fetchProgress } from "../api";

export default function StatsPage({ playerId }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProgress(playerId)
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [playerId]);

  if (error) return <div className="sl-status sl-status--error">Error: {error}</div>;
  if (!rows) return <div className="sl-status">Loading stats…</div>;

  const completed = rows.filter((r) => r.completed);
  const totalStars = completed.reduce((s, r) => s + r.stars, 0);
  const perfect = completed.filter((r) => r.stars === 3).length;
  const highestLevel = completed.reduce((m, r) => Math.max(m, r.level_number), 0);
  const totalTime = completed.reduce((s, r) => s + (r.best_time_seconds || 0), 0);

  const fmtTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="sl-page">
      <h1 className="sl-page__title">My Stats</h1>

      <div className="sl-stats-grid">
        <div className="sl-stat-card">
          <div className="sl-stat-card__value">{completed.length}</div>
          <div className="sl-stat-card__label">Levels completed</div>
        </div>
        <div className="sl-stat-card">
          <div className="sl-stat-card__value">{totalStars}</div>
          <div className="sl-stat-card__label">Total stars</div>
        </div>
        <div className="sl-stat-card">
          <div className="sl-stat-card__value">{perfect}</div>
          <div className="sl-stat-card__label">Perfect (3★) solves</div>
        </div>
        <div className="sl-stat-card">
          <div className="sl-stat-card__value">{highestLevel || "–"}</div>
          <div className="sl-stat-card__label">Highest level reached</div>
        </div>
        <div className="sl-stat-card">
          <div className="sl-stat-card__value">{fmtTime(totalTime)}</div>
          <div className="sl-stat-card__label">Total time played</div>
        </div>
      </div>

      {completed.length === 0 && (
        <p className="sl-subtitle">
          No levels completed yet — head to the Play tab and solve your first circuit!
        </p>
      )}

      {completed.length > 0 && (
        <table className="sl-stats-table">
          <thead>
            <tr>
              <th>Level</th>
              <th>Stars</th>
              <th>Best moves</th>
              <th>Best time</th>
            </tr>
          </thead>
          <tbody>
            {completed
              .slice()
              .sort((a, b) => a.level_number - b.level_number)
              .map((r) => (
                <tr key={r.level_number}>
                  <td>{r.level_number}</td>
                  <td>{"★".repeat(r.stars)}</td>
                  <td>{r.best_moves}</td>
                  <td>{fmtTime(r.best_time_seconds || 0)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
