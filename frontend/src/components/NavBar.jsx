import React from "react";

const TABS = [
  { id: "games", label: "🎮 Games" },
  { id: "leaderboard", label: "🏆 Leaderboard" },
  { id: "howto", label: "📘 How to Play" },
  { id: "stats", label: "📊 My Stats" },
  { id: "rate", label: "⭐ Rate Game" },
];

export default function NavBar({ active, onNavigate }) {
  return (
    <nav className="sl-navbar">
      <div className="sl-navbar__brand">
        Signal<span className="sl-title__accent">Loop</span> <span className="sl-navbar__sub">Arcade</span>
      </div>
      <div className="sl-navbar__tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`sl-navbar__tab ${active === t.id ? "sl-navbar__tab--active" : ""}`}
            onClick={() => onNavigate(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
