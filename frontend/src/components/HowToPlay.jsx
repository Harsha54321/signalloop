import React, { useState } from "react";
import { GAMES } from "../games/registry";

export default function HowToPlay() {
  const [id, setId] = useState(GAMES[0].id);
  const game = GAMES.find((g) => g.id === id);

  return (
    <div className="sl-page">
      <h1 className="sl-page__title">How to play</h1>
      <div className="sl-chips" role="group" aria-label="Choose a game">
        {GAMES.map((g) => (
          <button
            type="button"
            key={g.id}
            className={`sl-chip ${id === g.id ? "sl-chip--on" : ""}`}
            aria-pressed={id === g.id}
            onClick={() => setId(g.id)}
          >
            <span aria-hidden="true">{g.icon}</span> {g.name}
          </button>
        ))}
      </div>

      <p className="sl-subtitle sl-howto-tagline">{game.tagline}</p>

      <div className="sl-howto-grid" style={{ "--g1": game.accent }}>
        {game.howTo.map((item) => (
          <div className="sl-howto-card" key={item.title}>
            <div className="sl-howto-card__icon">{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </div>

      <div className="sl-howto-grid sl-howto-general">
        <div className="sl-howto-card">
          <div className="sl-howto-card__icon">📴</div>
          <h3>Works offline</h3>
          <p>Open the site once with internet. After that every game runs without it, and your scores sync when you're back online.</p>
        </div>
        <div className="sl-howto-card">
          <div className="sl-howto-card__icon">🏆</div>
          <h3>Leaderboards</h3>
          <p>Leaderboards and the community rating need internet. Your own scores are always saved on this device.</p>
        </div>
      </div>
    </div>
  );
}
