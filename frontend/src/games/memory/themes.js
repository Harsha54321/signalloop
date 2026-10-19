// Card faces for Memory Match. Every theme has 18+ different symbols, enough
// for the biggest board (6x6 = 18 pairs). Only emoji that Windows, Android,
// iOS and macOS all draw are used (country flags are left out on purpose:
// Windows shows them as two letters).
const e = (text) => text.trim().split(/\s+/);

export const THEMES = [
  {
    id: "animals",
    name: "Animals",
    icon: "🐼",
    color: "#ff9f6b",
    symbols: e("🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦆 🦉 🦄 🐝 🐙 🐢"),
  },
  {
    id: "fruits",
    name: "Fruits",
    icon: "🍓",
    color: "#ff6b8b",
    symbols: e("🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🍒 🍑 🍍 🥭 🥝 🍅 🥥 🥑 🥕 🌽 🍆 🥦"),
  },
  {
    id: "space",
    name: "Space",
    icon: "🪐",
    color: "#8f8bff",
    symbols: e("🌍 🌙 🌞 ⭐ 🌟 💫 ☄️ 🚀 🛸 👽 🛰️ 🔭 🌌 🌠 🌑 🌕 🌓 🌒 🌎"),
  },
  {
    id: "vehicles",
    name: "Vehicles",
    icon: "🚗",
    color: "#4cc9ff",
    symbols: e("🚗 🚕 🚙 🚌 🚓 🚑 🚒 🚚 🚜 🏍️ 🚲 🛵 🚂 🚁 ✈️ 🚢 ⛵ 🚤 🛶 🚃 🚄"),
  },
  {
    id: "sports",
    name: "Sports",
    icon: "⚽",
    color: "#4fd69c",
    symbols: e("⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎱 🏓 🏸 🥊 🏒 🏏 ⛳ 🏹 🎳 🥅 🏆 🎯 🥋"),
  },
  {
    id: "nature",
    name: "Nature",
    icon: "🌿",
    color: "#9ad95a",
    symbols: e("🌲 🌳 🌴 🌵 🌷 🌹 🌻 🌼 🍀 🍁 🍄 🌾 🌈 ☀️ 🌧️ ⛄ ❄️ 🔥 💧 🌊"),
  },
];

export const getTheme = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
