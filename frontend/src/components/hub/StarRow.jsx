import React from "react";

export default function StarRow({ stars, max = 3 }) {
  return (
    <span className="sl-starrow" role="img" aria-label={`${stars} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < stars ? "sl-starrow__on" : "sl-starrow__off"} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}
