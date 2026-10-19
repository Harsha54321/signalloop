// Plain data about every game in the hub (no React imports, so any file can
// use it without creating import loops).

export const CATEGORIES = ["All", "Logic", "Words", "Memory", "Arcade"];

export const GAME_META = [
  {
    id: "signalloop",
    name: "SignalLoop",
    category: "Logic",
    icon: "⚡",
    accent: "#00e5c7",
    accent2: "#7c5cff",
    tagline: "Rotate the tiles until the whole circuit is connected.",
    hasLevels: true,
    levelsLabel: "Unlimited levels",
    howTo: [
      { icon: "🔄", title: "Rotate tiles", text: "Tap a tile to turn it 90°. Every tile is a piece of circuit: an end, a corner, a straight line, a T or a cross." },
      { icon: "⚡", title: "Connect everything", text: "The level is solved when every tile lines up into one connected circuit with no loose ends." },
      { icon: "⭐", title: "Earn stars", text: "Finish in par moves for 3 stars, within 1.5× par for 2 stars. Any solve earns at least 1." },
      { icon: "💡", title: "Hints", text: "3 hints per level. A hint glows one wrong tile and shows how many taps it needs. They work offline." },
    ],
  },
  {
    id: "wordhunt",
    name: "Word Hunt",
    category: "Words",
    icon: "🔎",
    accent: "#ffb547",
    accent2: "#ff7a45",
    tagline: "Drag across the grid to find every hidden word.",
    hasLevels: true,
    levelsLabel: "7 themes, unlimited levels",
    howTo: [
      { icon: "👆", title: "Drag to select", text: "Press on the first letter, drag in a straight line to the last letter, then let go. Words can run sideways, up, down and diagonally." },
      { icon: "🔁", title: "Backwards too", text: "From level 15 words can also be hidden backwards. Dragging either way counts." },
      { icon: "📈", title: "Levels grow", text: "The grid gets bigger and holds more words as you climb. Every theme has its own endless levels." },
      { icon: "💡", title: "Hints", text: "3 hints per level. A hint rings the first letter of a word you haven't found. Hints cost a few points but work offline." },
    ],
  },
  {
    id: "memory",
    name: "Memory Match",
    category: "Memory",
    icon: "🃏",
    accent: "#ff6b8b",
    accent2: "#ffa36b",
    tagline: "Flip cards and find every matching pair.",
    hasLevels: true,
    levelsLabel: "6 themes, boards up to 6×6",
    howTo: [
      { icon: "🃏", title: "Flip two cards", text: "Tap a card to flip it, then tap a second one. A matching pair stays face up. A mismatch flips back." },
      { icon: "🧠", title: "Fewer tries, more stars", text: "Stars depend on how many tries you take compared with the number of pairs." },
      { icon: "📐", title: "Bigger boards", text: "Level 1 is 2×2. The board grows to 6×6, and early levels show the cards for a moment before the game starts." },
      { icon: "👀", title: "Hints", text: "3 peeks per level: every card shows for 1.5 seconds. Peeks cost a few points and work offline." },
    ],
  },
  {
    id: "neonstack",
    name: "Neon Stack",
    category: "Arcade",
    icon: "🧱",
    accent: "#8b5cff",
    accent2: "#ff4fd8",
    tagline: "Tap to drop each block and build the tallest tower.",
    hasLevels: false,
    extraLabel: "Floors",
    levelsLabel: "5 worlds",
    howTo: [
      { icon: "👆", title: "Tap to drop", text: "A block slides left and right. Tap, click or press Space to drop it on the tower." },
      { icon: "✂️", title: "Overhang gets cut", text: "Any part that hangs over the edge is cut off, so the next block is narrower. Miss completely and the run ends." },
      { icon: "✨", title: "Perfect drops", text: "Land within a few pixels for a perfect drop. Three perfects in a row make your block grow back." },
      { icon: "🔓", title: "Unlock worlds", text: "Reach 20 floors in a world to unlock the next one. Every world has its own colours and background." },
      { icon: "💡", title: "Hints", text: "3 per run: Guide draws lines where the next block should land, Slow makes the block move at half speed for 5 seconds." },
    ],
  },
  {
    id: "stardodger",
    name: "Star Dodger",
    category: "Arcade",
    icon: "🚀",
    accent: "#4cc9ff",
    accent2: "#7cf5c2",
    tagline: "Dodge asteroids, grab stars and survive.",
    hasLevels: false,
    extraLabel: "Stars",
    levelsLabel: "3 worlds, 3 ships",
    howTo: [
      { icon: "🖐️", title: "Steer your ship", text: "Drag with a finger or mouse, or use the arrow keys / WASD. Your ship follows." },
      { icon: "☄️", title: "Don't get hit", text: "One hit ends the run. Asteroids fall faster the longer you survive." },
      { icon: "⭐", title: "Collect stars", text: "Each star adds 25 points. Staying alive adds points every second." },
      { icon: "🛡️", title: "Power-ups", text: "Shield blocks one hit, Magnet pulls stars in, Slow-mo slows everything else down. They appear now and then and work as your hints." },
      { icon: "🔓", title: "Unlock more", text: "Score 300 in Asteroid Belt to unlock Nebula, 400 in Nebula to unlock Black Hole. Ships unlock at 500 and 1500 points." },
    ],
  },
];

export const getMeta = (id) => GAME_META.find((g) => g.id === id);
