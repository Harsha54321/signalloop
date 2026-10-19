// Star Dodger worlds and ships. Scores (not floors) unlock things.
export const WORLDS = [
  {
    id: "asteroid-belt",
    name: "Asteroid Belt",
    icon: "☄️",
    desc: "Rocky and fast. The classic.",
    colors: ["#4cc9ff", "#7cf5c2"],
    sky: ["#050a1c", "#0d1f3f"],
    rock: "#8b93a8",
    unlockFrom: null,
    unlockScore: 0,
    spawnScale: 1,
    pull: 0,
  },
  {
    id: "nebula",
    name: "Nebula",
    icon: "🌌",
    desc: "Dense clouds, more rocks",
    colors: ["#b56bff", "#ff6fb5"],
    sky: ["#14072e", "#3a1060"],
    rock: "#c3a3e8",
    unlockFrom: "asteroid-belt",
    unlockScore: 300,
    spawnScale: 1.25,
    pull: 0,
  },
  {
    id: "black-hole",
    name: "Black Hole",
    icon: "🕳️",
    desc: "Gravity pulls everything in",
    colors: ["#ff8a3d", "#ff3d6e"],
    sky: ["#060308", "#1c0a14"],
    rock: "#d9a07a",
    unlockFrom: "nebula",
    unlockScore: 400,
    spawnScale: 1.1,
    pull: 38,
  },
];

export const SKINS = [
  { id: "rocket", name: "Rocket", icon: "🚀", unlockScore: 0, color: "#ff7a45" },
  { id: "saucer", name: "Saucer", icon: "🛸", unlockScore: 500, color: "#7cf5c2" },
  { id: "comet", name: "Comet", icon: "☄️", unlockScore: 1500, color: "#4cc9ff" },
];

export const getWorld = (id) => WORLDS.find((w) => w.id === id) || WORLDS[0];

// bestMap: { worldId: best score in that world }
export function isWorldUnlocked(index, bestMap) {
  const w = WORLDS[index];
  if (!w || !w.unlockFrom) return true;
  return (bestMap[w.unlockFrom] || 0) >= w.unlockScore;
}

export function isSkinUnlocked(skin, bestOverall) {
  return bestOverall >= skin.unlockScore;
}
