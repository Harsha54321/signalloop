import React from "react";

// World / mode picker for the arcade games. `worlds` items:
// { id, name, icon, desc, colors: [a, b], locked, lockText, bestText }
export default function WorldPicker({ worlds, onPlay, children }) {
  return (
    <div className="sl-worlds">
      {children}
      <h2 className="sl-section-title">Choose a world</h2>
      <div className="sl-world-grid">
        {worlds.map((w) => (
          <button
            type="button"
            key={w.id}
            className={`sl-world ${w.locked ? "sl-world--locked" : ""}`}
            style={{ "--w1": w.colors[0], "--w2": w.colors[1] }}
            disabled={w.locked}
            onClick={() => onPlay(w.id)}
          >
            <span className="sl-world__icon" aria-hidden="true">
              {w.icon}
            </span>
            <span className="sl-world__name">{w.name}</span>
            <span className="sl-world__desc">{w.desc}</span>
            <span className="sl-world__best">{w.locked ? `🔒 ${w.lockText}` : w.bestText}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
