import React from "react";

// Small hand-drawn key art for each game card (inline SVG, so it is part of
// the app bundle and works offline).
export default function GameArt({ id }) {
  switch (id) {
    case "signalloop":
      return (
        <svg viewBox="0 0 160 90" className="sl-art" aria-hidden="true">
          <rect width="160" height="90" fill="#0f1626" />
          {[0, 1, 2, 3].map((i) => (
            <line key={`v${i}`} x1={20 + i * 40} y1="0" x2={20 + i * 40} y2="90" stroke="#1d2842" strokeWidth="1" />
          ))}
          <path d="M0 45 H40 V20 H80 V70 H120 V45 H160" fill="none" stroke="#00e5c7" strokeWidth="7" strokeLinejoin="round" />
          <path d="M80 45 H100" fill="none" stroke="#7c5cff" strokeWidth="7" strokeLinecap="round" />
          {[[40, 45], [80, 20], [80, 70], [120, 70], [100, 45]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill="#00e5c7" />
          ))}
          <circle cx="100" cy="45" r="7" fill="#7c5cff" />
        </svg>
      );
    case "wordhunt": {
      const rows = ["CSTARB", "OPLATE", "NHIFWD", "ROUNDK"];
      return (
        <svg viewBox="0 0 160 90" className="sl-art" aria-hidden="true">
          <rect width="160" height="90" fill="#1b1409" />
          <rect x="22" y="15" width="94" height="17" rx="8.5" fill="#ffb547" opacity="0.9" />
          {rows.map((row, r) =>
            row.split("").map((ch, c) => (
              <text
                key={`${r}-${c}`}
                x={32 + c * 19}
                y={27 + r * 19}
                fontSize="13"
                fontWeight="700"
                textAnchor="middle"
                fontFamily="system-ui, sans-serif"
                fill={r === 0 && c >= 1 && c <= 4 ? "#1b1409" : "#e8c88f"}
              >
                {ch}
              </text>
            ))
          )}
        </svg>
      );
    }
    case "memory":
      return (
        <svg viewBox="0 0 160 90" className="sl-art" aria-hidden="true">
          <rect width="160" height="90" fill="#220f16" />
          {[0, 1, 2, 3].map((i) => {
            const faceUp = i === 0 || i === 2;
            const x = 12 + i * 37;
            return (
              <g key={i} transform={`rotate(${i % 2 ? 5 : -4} ${x + 15} 45)`}>
                <rect x={x} y="18" width="30" height="54" rx="6" fill={faceUp ? "#fff1ea" : "#ff6b8b"} />
                {faceUp ? (
                  <text x={x + 15} y="52" fontSize="24" textAnchor="middle" fill="#ff6b8b" fontFamily="system-ui, sans-serif">
                    {i === 0 ? "★" : "♥"}
                  </text>
                ) : (
                  <circle cx={x + 15} cy="45" r="8" fill="none" stroke="#ffd3c2" strokeWidth="3" />
                )}
              </g>
            );
          })}
        </svg>
      );
    case "neonstack":
      return (
        <svg viewBox="0 0 160 90" className="sl-art" aria-hidden="true">
          <defs>
            <linearGradient id="nsg" x1="0" x2="1">
              <stop offset="0" stopColor="#8b5cff" />
              <stop offset="1" stopColor="#ff4fd8" />
            </linearGradient>
          </defs>
          <rect width="160" height="90" fill="#0e0b1f" />
          {[
            [40, 70, 80],
            [48, 56, 66],
            [52, 42, 62],
            [60, 28, 48],
            [66, 14, 34],
          ].map(([x, y, w], i) => (
            <rect key={y} x={x} y={y} width={w} height="12" rx="3" fill="url(#nsg)" opacity={0.55 + i * 0.11} />
          ))}
          <rect x="112" y="14" width="22" height="12" rx="3" fill="#ff4fd8" opacity="0.35" />
        </svg>
      );
    case "stardodger":
      return (
        <svg viewBox="0 0 160 90" className="sl-art" aria-hidden="true">
          <rect width="160" height="90" fill="#08131f" />
          {[[14, 12], [48, 30], [90, 10], [132, 24], [20, 62], [112, 58], [148, 70]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#bfe9ff" />
          ))}
          <polygon points="104,16 116,12 126,22 124,36 110,40 100,30" fill="#2a3b52" stroke="#4cc9ff" strokeWidth="2" />
          <path d="M40 22 l3 7 7 .6 -5.4 4.6 1.8 7 -6.4 -3.8 -6.4 3.8 1.8 -7 -5.4 -4.6 7 -.6z" fill="#ffd166" />
          <polygon points="76,50 86,76 76,70 66,76" fill="#4cc9ff" />
          <polygon points="76,70 72,82 80,82" fill="#7cf5c2" />
        </svg>
      );
    default:
      return null;
  }
}
