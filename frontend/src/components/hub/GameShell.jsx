import React from "react";
import SoundToggle from "./SoundToggle";

// Common frame for the hub games: back button, game name, sound switch.
// The game's colours are exposed as CSS variables (--g1 / --g2) so every
// child can pick them up.
export default function GameShell({ meta, onExit, backLabel = "← All games", subtitle, children }) {
  return (
    <div className="sl-shell" style={{ "--g1": meta.accent, "--g2": meta.accent2 }}>
      <div className="sl-shell__bar">
        <button type="button" className="sl-btn sl-btn--ghost" onClick={onExit}>
          {backLabel}
        </button>
        <div className="sl-shell__title">
          <span className="sl-shell__icon" aria-hidden="true">
            {meta.icon}
          </span>
          <div>
            <h1>{meta.name}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
        <SoundToggle />
      </div>
      {children}
    </div>
  );
}
