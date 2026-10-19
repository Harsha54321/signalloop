import React, { useEffect, useState } from "react";
import { fetchProgress } from "../api";

const PAGE_SIZE = 20;

export default function LevelSelect({ playerId, onPlay, onBack }) {
  const [maxUnlocked, setMaxUnlocked] = useState(1);
  const [progressMap, setProgressMap] = useState({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    fetchProgress(playerId)
      .then((rows) => {
        const map = {};
        let highestCompleted = 0;
        rows.forEach((r) => {
          map[r.level_number] = r;
          if (r.completed && r.level_number > highestCompleted) {
            highestCompleted = r.level_number;
          }
        });
        setProgressMap(map);
        setMaxUnlocked(highestCompleted + 1);
      })
      .catch(() => {});
  }, [playerId]);

  const levels = Array.from({ length: visibleCount }, (_, i) => i + 1);

  return (
    <div className="sl-level-select">
      {onBack && (
        <button type="button" className="sl-btn sl-btn--ghost sl-back" onClick={onBack}>
          ← All games
        </button>
      )}
      <h1 className="sl-title">
        Signal<span className="sl-title__accent">Loop</span>
      </h1>
      <p className="sl-subtitle">
        Rotate every tile to reconnect the circuit. Unlimited procedurally
        generated levels — as many as you want to play.
      </p>

      <div className="sl-level-grid">
        {levels.map((n) => {
          const locked = n > maxUnlocked;
          const p = progressMap[n];
          return (
            <button
              key={n}
              className={`sl-level-card ${locked ? "sl-level-card--locked" : ""}`}
              disabled={locked}
              onClick={() => onPlay(n)}
            >
              <span className="sl-level-card__num">{n}</span>
              {p && p.completed && (
                <span className="sl-level-card__stars">
                  {"★".repeat(p.stars)}
                  {"☆".repeat(3 - p.stars)}
                </span>
              )}
              {locked && <span className="sl-level-card__lock">🔒</span>}
            </button>
          );
        })}
      </div>

      <button
        className="sl-btn sl-btn--ghost sl-load-more"
        onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
      >
        Load more levels ↓
      </button>
    </div>
  );
}
