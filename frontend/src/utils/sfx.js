// Tiny sound effects made with the Web Audio API - no sound files, so
// nothing extra to download and everything works offline.
// Sound is OFF by default; the player turns it on with the speaker button.

const KEY = "signalloop_sound_v1";

let enabled = false;
try {
  enabled = localStorage.getItem(KEY) === "on";
} catch {
  enabled = false;
}

let ctx = null;
const listeners = new Set();

export function isSoundOn() {
  return enabled;
}

export function setSoundOn(value) {
  enabled = Boolean(value);
  try {
    localStorage.setItem(KEY, enabled ? "on" : "off");
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn(enabled));
}

export function onSoundChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getContext() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// [frequency Hz, seconds, waveform]
const TONES = {
  tap: [[440, 0.05, "square"]],
  flip: [[360, 0.05, "triangle"]],
  match: [[520, 0.08, "triangle"], [780, 0.12, "triangle"]],
  wrong: [[200, 0.14, "sawtooth"]],
  found: [[587, 0.08, "triangle"], [784, 0.08, "triangle"], [988, 0.14, "triangle"]],
  perfect: [[660, 0.06, "triangle"], [880, 0.07, "triangle"], [1175, 0.1, "triangle"]],
  star: [[880, 0.05, "sine"], [1320, 0.08, "sine"]],
  power: [[330, 0.06, "square"], [495, 0.06, "square"], [660, 0.1, "square"]],
  win: [[523, 0.1, "triangle"], [659, 0.1, "triangle"], [784, 0.1, "triangle"], [1047, 0.2, "triangle"]],
  over: [[300, 0.12, "sawtooth"], [220, 0.12, "sawtooth"], [150, 0.25, "sawtooth"]],
};

export function play(name) {
  if (!enabled) return;
  const tones = TONES[name];
  if (!tones) return;
  try {
    const audio = getContext();
    if (!audio) return;
    let t = audio.currentTime;
    tones.forEach(([freq, length, wave]) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.1, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(t);
      osc.stop(t + length + 0.02);
      t += length * 0.9;
    });
  } catch {
    /* sound is a bonus - never break the game */
  }
}
