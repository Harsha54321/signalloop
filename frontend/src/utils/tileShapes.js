// Clockwise direction order must match the backend (N, E, S, W)
export const DIRS = ["N", "E", "S", "W"];

// Rotate a set of absolute directions clockwise by `steps` * 90deg
export function rotateEdges(shape, steps) {
  const s = ((steps % 4) + 4) % 4;
  return shape.map((d) => DIRS[(DIRS.indexOf(d) + s) % 4]);
}

export function shapeName(edges) {
  const n = edges.length;
  if (n === 0) return "isolated";
  if (n === 1) return "end";
  if (n === 2) {
    const opposite = { N: "S", S: "N", E: "W", W: "E" };
    return opposite[edges[0]] === edges[1] ? "straight" : "corner";
  }
  if (n === 3) return "tee";
  return "cross";
}

// How many distinct-looking rotation states a tile has (used to know
// when a tile is "solved" even if it isn't at rotation 0)
export function rotationPeriod(shapeType) {
  if (shapeType === "cross") return 1;
  if (shapeType === "straight") return 2;
  return 4;
}
