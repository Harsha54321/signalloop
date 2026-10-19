// The five Neon Stack worlds. Reach UNLOCK_FLOORS floors in one world to
// open the next. Colours are plain hex so the canvas can blend them.
export const UNLOCK_FLOORS = 20;

export const WORLDS = [
  {
    id: "neon-city",
    name: "Neon City",
    icon: "🌃",
    desc: "Purple skyline, pink glow",
    kind: "city",
    colors: ["#8b5cff", "#ff4fd8"],
    sky: { lowTop: "#120b2b", lowBottom: "#34185e", highTop: "#04020c", highBottom: "#150a30" },
    hue: { base: 285, swing: 60, speed: 0.22 },
    sat: 92,
    light: 62,
    glow: "#ff4fd8",
  },
  {
    id: "sunset",
    name: "Sunset",
    icon: "🌅",
    desc: "Warm hills, slow clouds",
    kind: "sunset",
    colors: ["#ff7a45", "#ff4f8b"],
    sky: { lowTop: "#3a1560", lowBottom: "#ff8a4c", highTop: "#120a2e", highBottom: "#8a2f6e" },
    hue: { base: 18, swing: 24, speed: 0.3 },
    sat: 94,
    light: 60,
    glow: "#ffb067",
  },
  {
    id: "ocean",
    name: "Ocean",
    icon: "🌊",
    desc: "Deep blue, rising bubbles",
    kind: "ocean",
    colors: ["#2bb6ff", "#25e0c4"],
    sky: { lowTop: "#0a4a7a", lowBottom: "#0b2a55", highTop: "#5fd0ff", highBottom: "#1a8ac2" },
    hue: { base: 192, swing: 30, speed: 0.25 },
    sat: 88,
    light: 60,
    glow: "#7cf5ee",
  },
  {
    id: "space",
    name: "Space",
    icon: "🚀",
    desc: "Stars, planets, no gravity jokes",
    kind: "space",
    colors: ["#4c6bff", "#9b8cff"],
    sky: { lowTop: "#050816", lowBottom: "#101a40", highTop: "#010208", highBottom: "#080c24" },
    hue: { base: 225, swing: 50, speed: 0.2 },
    sat: 82,
    light: 72,
    glow: "#a9b8ff",
  },
  {
    id: "candy",
    name: "Candy",
    icon: "🍬",
    desc: "Sweet pastels and sprinkles",
    kind: "candy",
    colors: ["#ff7bb6", "#ffc46b"],
    sky: { lowTop: "#ffd6ea", lowBottom: "#ffb3d4", highTop: "#b9a6ff", highBottom: "#ff9fc8" },
    hue: { base: 335, swing: 55, speed: 0.28 },
    sat: 88,
    light: 70,
    glow: "#ffffff",
  },
];

export const getWorld = (id) => WORLDS.find((w) => w.id === id) || WORLDS[0];

// Block colour for a floor: the hue drifts along a sine wave so the tower
// shifts colour as it grows.
export function blockColor(world, level, lightBoost = 0) {
  const { base, swing, speed } = world.hue;
  const hue = Math.round((base + swing * Math.sin(level * speed) + 360) % 360);
  return `hsl(${hue} ${world.sat}% ${Math.min(90, world.light + lightBoost)}%)`;
}

// bestFloors: { [worldId]: best floors reached }. World 0 is always open.
export function isUnlocked(index, bestFloors) {
  if (index === 0) return true;
  return (bestFloors[WORLDS[index - 1].id] || 0) >= UNLOCK_FLOORS;
}
