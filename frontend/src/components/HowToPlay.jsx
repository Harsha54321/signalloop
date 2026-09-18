import React from "react";

export default function HowToPlay() {
  return (
    <div className="sl-page">
      <h1 className="sl-page__title">How to Play</h1>

      <div className="sl-howto-grid">
        <div className="sl-howto-card">
          <div className="sl-howto-card__icon">🔄</div>
          <h3>Rotate tiles</h3>
          <p>Click any tile to spin it 90° clockwise. Each tile is a piece of circuit — an end, a corner, a straight line, a T, or a cross.</p>
        </div>
        <div className="sl-howto-card">
          <div className="sl-howto-card__icon">⚡</div>
          <h3>Reconnect the grid</h3>
          <p>The puzzle is solved the instant every tile lines up so the whole board forms one connected circuit with no dangling or mismatched ends.</p>
        </div>
        <div className="sl-howto-card">
          <div className="sl-howto-card__icon">⭐</div>
          <h3>Earn stars</h3>
          <p>Every level has a par move count. Finish at or under par for 3 stars, within 1.5× par for 2 stars, and any solve still earns 1 star.</p>
        </div>
        <div className="sl-howto-card">
          <div className="sl-howto-card__icon">♾️</div>
          <h3>Unlimited levels</h3>
          <p>Levels are generated on the fly — the grid grows and extra loops get added as you climb, so difficulty keeps rising forever.</p>
        </div>
        <div className="sl-howto-card">
          <div className="sl-howto-card__icon">🏆</div>
          <h3>Compete</h3>
          <p>Check the Leaderboard tab for the fastest solve times on any level number, across every player.</p>
        </div>
        <div className="sl-howto-card">
          <div className="sl-howto-card__icon">💾</div>
          <h3>Progress is saved</h3>
          <p>Your best moves, times and stars are saved automatically per browser — come back any time and pick up where you left off.</p>
        </div>
      </div>
    </div>
  );
}
