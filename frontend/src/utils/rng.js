// Small seeded random number generator used by the hub games.
// Same seed -> same sequence, so a given Word Hunt / Memory level is the
// same puzzle every time (and needs no server).
export function hashSeed(text) {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function makeRng(seed) {
  // mulberry32
  let a = seed >>> 0;
  const random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    random,
    // integer in [0, n)
    randrange: (n) => Math.floor(random() * n),
    // float in [min, max)
    between: (min, max) => min + random() * (max - min),
    choice: (items) => items[Math.floor(random() * items.length)],
    // in-place Fisher-Yates shuffle, returns the same array
    shuffle: (items) => {
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        const tmp = items[i];
        items[i] = items[j];
        items[j] = tmp;
      }
      return items;
    },
  };
}
