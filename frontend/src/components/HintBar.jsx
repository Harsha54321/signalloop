import React from "react";

export default function HintBar({ hintsLeft, hintsTotal, active, message, onHint, disabled }) {
  const noneLeft = hintsLeft <= 0;
  return (
    <div className="sl-hint-bar">
      <button
        className="sl-btn sl-btn--hint"
        onClick={onHint}
        disabled={disabled || active || noneLeft}
        title={
          active
            ? "Fix the highlighted tile first"
            : noneLeft
            ? "No hints left on this level"
            : "Highlight a wrong tile"
        }
      >
        💡 Hint ({hintsLeft}/{hintsTotal})
      </button>
      <p className={`sl-hint-msg ${active ? "sl-hint-msg--active" : ""}`} aria-live="polite">
        {message}
      </p>
    </div>
  );
}
