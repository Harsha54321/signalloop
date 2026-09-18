import React, { useState } from "react";

export default function StarPicker({ value, onChange, size = "md" }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className={`sl-star-picker sl-star-picker--${size}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`sl-star ${n <= display ? "sl-star--filled" : ""}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          ★
        </span>
      ))}
    </div>
  );
}
