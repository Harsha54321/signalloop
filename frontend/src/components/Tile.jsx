import React from "react";
import { rotateEdges } from "../utils/tileShapes";

const HALF = 50;

function armPath(dir) {
  // draws a thick "arm" from the centre of a 100x100 tile out to the edge
  switch (dir) {
    case "N":
      return `M${HALF - 12},${HALF} L${HALF - 12},0 L${HALF + 12},0 L${HALF + 12},${HALF} Z`;
    case "S":
      return `M${HALF - 12},${HALF} L${HALF - 12},100 L${HALF + 12},100 L${HALF + 12},${HALF} Z`;
    case "E":
      return `M${HALF},${HALF - 12} L100,${HALF - 12} L100,${HALF + 12} L${HALF},${HALF + 12} Z`;
    case "W":
      return `M${HALF},${HALF - 12} L0,${HALF - 12} L0,${HALF + 12} L${HALF},${HALF + 12} Z`;
    default:
      return "";
  }
}

// `hint` = number of taps this tile still needs (0 / undefined = no hint on it)
export default function Tile({ shape, rotation, solved, onClick, animate, hint }) {
  const currentEdges = rotateEdges(shape, rotation);
  const hinted = hint > 0;

  return (
    <div
      className={`sl-tile ${solved ? "sl-tile--solved" : ""} ${
        animate ? "sl-tile--spin" : ""
      } ${hinted ? "sl-tile--hint" : ""}`}
      onClick={onClick}
      role="button"
      aria-label={
        hinted
          ? `Hint: tap this tile ${hint} time${hint > 1 ? "s" : ""}`
          : `Rotate tile, currently open ${currentEdges.join(",")}`
      }
    >
      <svg viewBox="0 0 100 100" className="sl-tile__svg">
        <rect x="0" y="0" width="100" height="100" className="sl-tile__bg" />
        <circle cx={HALF} cy={HALF} r="14" className="sl-tile__hub" />
        {currentEdges.map((d) => (
          <path key={d} d={armPath(d)} className="sl-tile__arm" />
        ))}
      </svg>
      {hinted && <span className="sl-tile__hint-badge">↻{hint}</span>}
    </div>
  );
}
