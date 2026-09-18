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

export default function Tile({ shape, rotation, solved, onClick, animate }) {
  const currentEdges = rotateEdges(shape, rotation);

  return (
    <div
      className={`sl-tile ${solved ? "sl-tile--solved" : ""} ${
        animate ? "sl-tile--spin" : ""
      }`}
      onClick={onClick}
      role="button"
      aria-label={`Rotate tile, currently open ${currentEdges.join(",")}`}
    >
      <svg viewBox="0 0 100 100" className="sl-tile__svg">
        <rect x="0" y="0" width="100" height="100" className="sl-tile__bg" />
        <circle cx={HALF} cy={HALF} r="14" className="sl-tile__hub" />
        {currentEdges.map((d) => (
          <path key={d} d={armPath(d)} className="sl-tile__arm" />
        ))}
      </svg>
    </div>
  );
}
