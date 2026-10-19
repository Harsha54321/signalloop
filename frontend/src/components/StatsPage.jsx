import React, { useEffect, useState } from "react";
import { fetchProgress, syncGameProgress } from "../api";
import { GAMES } from "../games/registry";
import { getAllGameRecords } from "../utils/gameStore";

const fmtTime = (secs) => {
  const m = Math.floor((secs || 0) / 60);
  const s = Math.round((secs || 0) % 60);
  return `${m}m ${s}s`;
};

export default function StatsPage({ playerId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProgress(playerId), syncGameProgress(playerId)]).then(([signal]) => {
      if (!cancelled) {
        setData({ signal: signal.filter((r) => r.completed), records: getAllGameRecords() });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  if (!data) return <div className="sl-status">Loading stats…</div>;

  const { signal, records } = data;
  const levelled = new Set(GAMES.filter((g) => g.hasLevels && g.id !== "signalloop").map((g) => g.id));

  const clearedLevels =
    signal.length + records.filter((r) => levelled.has(r.game)).length;
  const totalStars =
    signal.reduce((s, r) => s + (r.stars || 0), 0) +
    records.reduce((s, r) => s + (r.stars || 0), 0);
  const gamesPlayed =
    (signal.length ? 1 : 0) + new Set(records.map((r) => r.game)).size;
  const totalTime =
    signal.reduce((s, r) => s + (r.best_time_seconds || 0), 0) +
    records.reduce((s, r) => s + (r.best_time_seconds || 0), 0);

  return (
    <div className="sl-page">
      <h1 className="sl-page__title">My stats</h1>

      <div className="sl-stats-grid">
        <div className="sl-stat-card">
          <div className="sl-stat-card__value">{gamesPlayed}</div>
          <div className="sl-stat-card__label">Games played</div>
        </div>
        <div className="sl-stat-card">
          <div className="sl-stat-card__value">{clearedLevels}</div>
          <div className="sl-stat-card__label">Levels cleared</div>
        </div>
        <div className="sl-stat-card">
          <div className="sl-stat-card__value">{totalStars}</div>
          <div className="sl-stat-card__label">Total stars</div>
        </div>
        <div className="sl-stat-card">
          <div className="sl-stat-card__value">{fmtTime(totalTime)}</div>
          <div className="sl-stat-card__label">Time in best runs</div>
        </div>
      </div>

      {gamesPlayed === 0 && (
        <p className="sl-subtitle">Nothing here yet. Pick a game on the Games tab and play a round.</p>
      )}

      {GAMES.map((game) => {
        if (game.id === "signalloop") {
          if (!signal.length) return null;
          return (
            <section className="sl-stats-section" key={game.id} style={{ "--g1": game.accent }}>
              <h2>
                <span aria-hidden="true">{game.icon}</span> {game.name}
              </h2>
              <div className="sl-table-wrap">
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
                    {signal
                      .slice()
                      .sort((a, b) => a.level_number - b.level_number)
                      .map((r) => (
                        <tr key={r.level_number}>
                          <td>{r.level_number}</td>
                          <td>{"★".repeat(r.stars)}</td>
                          <td>{r.best_moves}</td>
                          <td>{fmtTime(r.best_time_seconds)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        }

        const mine = records.filter((r) => r.game === game.id);
        if (!mine.length) return null;
        return (
          <section className="sl-stats-section" key={game.id} style={{ "--g1": game.accent }}>
            <h2>
              <span aria-hidden="true">{game.icon}</span> {game.name}
            </h2>
            <div className="sl-table-wrap">
              <table className="sl-stats-table">
                <thead>
                  <tr>
                    <th>{game.hasLevels ? "Theme" : "World"}</th>
                    {game.hasLevels && <th>Levels cleared</th>}
                    {game.hasLevels && <th>Stars</th>}
                    <th>Best score</th>
                    {!game.hasLevels && game.extraLabel && <th>Best {game.extraLabel.toLowerCase()}</th>}
                  </tr>
                </thead>
                <tbody>
                  {game.variants.map((v) => {
                    const rows = mine.filter((r) => r.variant === v.id);
                    if (!rows.length) return null;
                    const best = rows.reduce((m, r) => Math.max(m, r.best_score || 0), 0);
                    const extra = rows.reduce((m, r) => Math.max(m, r.best_extra || 0), 0);
                    const stars = rows.reduce((s, r) => s + (r.stars || 0), 0);
                    return (
                      <tr key={v.id}>
                        <td>
                          {v.icon} {v.name}
                        </td>
                        {game.hasLevels && <td>{rows.length}</td>}
                        {game.hasLevels && <td>{stars}</td>}
                        <td>{best}</td>
                        {!game.hasLevels && game.extraLabel && <td>{extra}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
