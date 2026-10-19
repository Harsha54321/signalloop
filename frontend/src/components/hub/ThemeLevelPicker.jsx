import React, { useState } from "react";
import StarRow from "./StarRow";

const PAGE = 10;

function statsFor(records, themeId) {
  const rows = records.filter((r) => r.variant === themeId && r.completed);
  return {
    cleared: rows.length,
    stars: rows.reduce((sum, r) => sum + (r.stars || 0), 0),
    maxLevel: rows.reduce((m, r) => Math.max(m, r.level_number), 0),
    byLevel: Object.fromEntries(rows.map((r) => [r.level_number, r])),
  };
}

// Two-step picker used by Word Hunt and Memory Match:
// choose a theme, then choose a level (levels never run out).
export default function ThemeLevelPicker({ themes, records, onPlay }) {
  const [themeId, setThemeId] = useState(null);
  const [visible, setVisible] = useState(20);

  const openTheme = (id) => {
    const { maxLevel } = statsFor(records, id);
    setVisible(Math.max(20, Math.ceil((maxLevel + 1) / PAGE) * PAGE));
    setThemeId(id);
  };

  if (themeId === null) {
    return (
      <div className="sl-themes">
        <h2 className="sl-section-title">Choose a theme</h2>
        <div className="sl-theme-grid">
          {themes.map((t) => {
            const st = statsFor(records, t.id);
            return (
              <button
                type="button"
                key={t.id}
                className="sl-theme"
                style={{ "--t1": t.color }}
                onClick={() => openTheme(t.id)}
              >
                <span className="sl-theme__icon" aria-hidden="true">
                  {t.icon}
                </span>
                <span className="sl-theme__name">{t.name}</span>
                <span className="sl-theme__meta">
                  {st.cleared > 0 ? `${st.cleared} cleared · ${st.stars} ★` : "Not played yet"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const theme = themes.find((t) => t.id === themeId);
  const st = statsFor(records, themeId);
  const levels = Array.from({ length: visible }, (_, i) => i + 1);

  return (
    <div className="sl-themes" style={{ "--t1": theme.color }}>
      <div className="sl-themes__head">
        <button type="button" className="sl-btn sl-btn--ghost" onClick={() => setThemeId(null)}>
          ← Themes
        </button>
        <h2 className="sl-section-title">
          <span aria-hidden="true">{theme.icon}</span> {theme.name}
        </h2>
      </div>
      <div className="sl-level-grid">
        {levels.map((n) => {
          const locked = n > st.maxLevel + 1;
          const rec = st.byLevel[n];
          return (
            <button
              type="button"
              key={n}
              className={`sl-level-card ${locked ? "sl-level-card--locked" : ""}`}
              disabled={locked}
              onClick={() => onPlay(themeId, n)}
            >
              <span className="sl-level-card__num">{n}</span>
              {rec && (
                <span className="sl-level-card__stars">
                  <StarRow stars={rec.stars || 0} />
                </span>
              )}
              {locked && <span className="sl-level-card__lock">🔒</span>}
            </button>
          );
        })}
      </div>
      <button type="button" className="sl-btn sl-btn--ghost sl-load-more" onClick={() => setVisible((v) => v + PAGE)}>
        Load more levels ↓
      </button>
    </div>
  );
}
