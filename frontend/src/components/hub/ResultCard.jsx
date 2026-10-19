import React from "react";
import StarRow from "./StarRow";

// End-of-run card shared by the hub games.
export default function ResultCard({ title, subtitle, stars, stats, badge, note, actions }) {
  return (
    <div className="sl-win-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sl-win-card sl-result">
        <h2>{title}</h2>
        {subtitle && <p className="sl-result__sub">{subtitle}</p>}
        {typeof stars === "number" && (
          <div className="sl-result__stars">
            <StarRow stars={stars} />
          </div>
        )}
        {badge && <p className="sl-result__badge">{badge}</p>}
        {stats && stats.length > 0 && (
          <dl className="sl-result__stats">
            {stats.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {note && <p className="sl-result__note">{note}</p>}
        <div className="sl-win-actions">
          {actions.map((a) => (
            <button
              type="button"
              key={a.label}
              className={`sl-btn ${a.primary ? "sl-btn--primary" : "sl-btn--ghost"}`}
              onClick={a.onClick}
              autoFocus={a.primary}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
