import React, { useState } from "react";
import { GAMES, CATEGORIES } from "../../games/registry";
import { getLocalProgress } from "../../utils/storage";
import { getGameRecords } from "../../utils/gameStore";
import GameArt from "./GameArt";

function summaryFor(game) {
  if (game.id === "signalloop") {
    const done = getLocalProgress().filter((r) => r.completed);
    if (!done.length) return "Not played yet";
    const stars = done.reduce((s, r) => s + (r.stars || 0), 0);
    return `${done.length} levels cleared · ${stars} ★`;
  }
  const rows = getGameRecords(game.id);
  if (!rows.length) return "Not played yet";
  if (game.hasLevels) {
    const stars = rows.reduce((s, r) => s + (r.stars || 0), 0);
    return `${rows.length} levels cleared · ${stars} ★`;
  }
  const best = rows.reduce((m, r) => Math.max(m, r.best_score || 0), 0);
  return `Best score ${best}`;
}

export default function HubPage({ onPlay }) {
  const [category, setCategory] = useState("All");
  const visible = GAMES.filter((g) => category === "All" || g.category === category);

  return (
    <div className="sl-hub">
      <header className="sl-hub__head">
        <h1 className="sl-hub__title">Pick a game</h1>
        <p className="sl-hub__sub">
          {GAMES.length} games. After your first visit they all work without internet.
        </p>
      </header>

      <div className="sl-chips" role="group" aria-label="Filter games by category">
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c}
            className={`sl-chip ${category === c ? "sl-chip--on" : ""}`}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="sl-hub__grid">
        {visible.map((g) => (
          <button
            type="button"
            key={g.id}
            className="sl-gamecard"
            style={{ "--g1": g.accent, "--g2": g.accent2 }}
            onClick={() => onPlay(g.id)}
          >
            <span className="sl-gamecard__art">
              <GameArt id={g.id} />
              <span className="sl-gamecard__cat">{g.category}</span>
            </span>
            <span className="sl-gamecard__body">
              <span className="sl-gamecard__name">{g.name}</span>
              <span className="sl-gamecard__tag">{g.tagline}</span>
              <span className="sl-gamecard__foot">
                <span className="sl-gamecard__progress">{summaryFor(g)}</span>
                <span className="sl-gamecard__play">Play</span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
