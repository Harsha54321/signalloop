import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameShell from "../../components/hub/GameShell";
import WorldPicker from "../../components/hub/WorldPicker";
import ResultCard from "../../components/hub/ResultCard";
import { getMeta } from "../meta";
import { submitScore } from "../../api";
import { getGameRecords } from "../../utils/gameStore";
import { makeRng, hashSeed } from "../../utils/rng";
import { play } from "../../utils/sfx";
import { WORLDS, SKINS, getWorld, isWorldUnlocked, isSkinUnlocked } from "./worlds";
import { createGame, update, setTarget, W, H } from "./engine";
import { makeStarfield, createFx, stepFx, draw } from "./render";

const meta = getMeta("stardodger");
const SKIN_KEY = "signalloop_stardodger_skin_v1";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function loadSkin() {
  try {
    return localStorage.getItem(SKIN_KEY) || "rocket";
  } catch {
    return "rocket";
  }
}

function bestMapFrom(records) {
  const map = {};
  records.forEach((r) => {
    map[r.variant] = Math.max(map[r.variant] || 0, r.best_score || 0);
  });
  return map;
}
const bestOverall = (map) => Object.values(map).reduce((m, v) => Math.max(m, v), 0);

const KEY_DIRS = {
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
};

function StarDodgerPlay({ playerId, worldId, skinId, onBack }) {
  const world = getWorld(worldId);
  const skin = SKINS.find((s) => s.id === skinId) || SKINS[0];
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const fxRef = useRef(null);
  const phaseRef = useRef("ready");
  const dragRef = useRef(null);
  const keysRef = useRef({});
  const starsRef = useMemo(() => makeStarfield(), []);
  const [phase, setPhase] = useState("ready");
  const [hud, setHud] = useState({ score: 0, stars: 0, shield: 0, magnet: 0, slow: 0 });
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(0);

  const syncHud = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    const next = {
      score: g.score,
      stars: g.stars,
      shield: Math.ceil(g.shield),
      magnet: Math.ceil(g.magnet),
      slow: Math.ceil(g.slow),
    };
    setHud((h) =>
      h.score === next.score &&
      h.stars === next.stars &&
      h.shield === next.shield &&
      h.magnet === next.magnet &&
      h.slow === next.slow
        ? h
        : next
    );
  }, []);

  const finish = useCallback(
    (g) => {
      const beforeMap = bestMapFrom(getGameRecords("stardodger"));
      const prevBest = beforeMap[world.id] || 0;
      let saved = null;
      if (g.score > 0) {
        saved = submitScore({
          playerId,
          game: "stardodger",
          variant: world.id,
          level: 0,
          score: g.score,
          stars: 0,
          timeSeconds: Math.round(g.time),
          extra: g.stars,
        });
      }
      const afterMap = { ...beforeMap, [world.id]: Math.max(prevBest, g.score) };
      const unlockedWorlds = WORLDS.filter(
        (w, i) => i > 0 && !isWorldUnlocked(i, beforeMap) && isWorldUnlocked(i, afterMap)
      );
      const unlockedSkins = SKINS.filter(
        (s) => !isSkinUnlocked(s, bestOverall(beforeMap)) && isSkinUnlocked(s, bestOverall(afterMap))
      );
      const unlocks = [
        ...unlockedWorlds.map((w) => `${w.icon} ${w.name} world`),
        ...unlockedSkins.map((s) => `${s.icon} ${s.name} ship`),
      ];
      setResult({
        score: g.score,
        stars: g.stars,
        seconds: Math.round(g.time),
        isNewBest: !!(saved && saved.isNewBest),
        previousBest: prevBest,
        unlocks,
      });
      phaseRef.current = "over";
      setPhase("over");
      play(unlocks.length ? "win" : "over");
    },
    [playerId, world.id]
  );

  useEffect(() => {
    gameRef.current = createGame({ world, rng: makeRng(hashSeed(`sd-${Date.now()}-${round}`)).random });
    fxRef.current = createFx();
    phaseRef.current = "ready";
    setPhase("ready");
    setResult(null);
    setHud({ score: 0, stars: 0, shield: 0, magnet: 0, slow: 0 });
  }, [world, round]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const reduced = reducedMotion();
    let raf = 0;
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = gameRef.current;
      if (g) {
        if (phaseRef.current === "playing") {
          const keys = keysRef.current;
          let dx = 0;
          let dy = 0;
          Object.keys(keys).forEach((code) => {
            if (keys[code] && KEY_DIRS[code]) {
              dx += KEY_DIRS[code][0];
              dy += KEY_DIRS[code][1];
            }
          });
          if (dx || dy) setTarget(g, g.ship.x + dx * 220, g.ship.y + dy * 220);
          update(g, dt);
          syncHud();
          if (g.over) finish(g);
        }
        stepFx(fxRef.current, g, dt, reduced);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw(ctx, g, world, skin, fxRef.current, starsRef);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [world, skin, starsRef, syncHud, finish]);

  useEffect(() => {
    const keys = keysRef.current;
    const down = (e) => {
      if (KEY_DIRS[e.code]) {
        e.preventDefault();
        keys[e.code] = true;
        if (phaseRef.current === "ready") {
          phaseRef.current = "playing";
          setPhase("playing");
        }
      } else if ((e.code === "Space" || e.code === "Enter") && phaseRef.current === "ready") {
        const t = e.target;
        if (t && (t.tagName === "BUTTON" || t.tagName === "INPUT")) return;
        e.preventDefault();
        phaseRef.current = "playing";
        setPhase("playing");
      }
    };
    const up = (e) => {
      keys[e.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Relative dragging: the ship moves by how far the finger moved, so the
  // finger never hides the ship.
  const toLogical = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
  };
  const onDown = (e) => {
    e.preventDefault();
    const g = gameRef.current;
    if (!g) return;
    if (phaseRef.current === "ready") {
      phaseRef.current = "playing";
      setPhase("playing");
    }
    if (phaseRef.current !== "playing") return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    dragRef.current = { start: toLogical(e), sx: g.ship.x, sy: g.ship.y };
  };
  const onMove = (e) => {
    const d = dragRef.current;
    const g = gameRef.current;
    if (!d || !g || phaseRef.current !== "playing") return;
    const p = toLogical(e);
    setTarget(g, d.sx + (p.x - d.start.x), d.sy + (p.y - d.start.y));
  };
  const onUp = () => {
    dragRef.current = null;
  };

  const power = (label, secs, cls) =>
    secs > 0 ? (
      <span className={`sl-arcade__power sl-arcade__power--${cls}`} key={cls}>
        {label} {secs}s
      </span>
    ) : null;

  return (
    <GameShell meta={meta} onExit={onBack} backLabel="← Worlds" subtitle={`${world.icon} ${world.name}`}>
      <div className="sl-arcade">
        <div className="sl-arcade__hud" aria-live="off">
          <span>
            Score <b>{hud.score}</b>
          </span>
          <span>
            Stars <b>{hud.stars}</b>
          </span>
          <span className="sl-arcade__powers">
            {power("🛡️ Shield", hud.shield, "shield")}
            {power("🧲 Magnet", hud.magnet, "magnet")}
            {power("⏳ Slow", hud.slow, "slow")}
          </span>
        </div>
        <div className="sl-arcade__stage" style={{ aspectRatio: `${W} / ${H}` }}>
          <canvas
            ref={canvasRef}
            className="sl-arcade__canvas"
            aria-label="Star Dodger play area. Drag to steer, or use the arrow keys."
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
          {phase === "ready" && (
            <div className="sl-arcade__overlay">
              <h2>Touch to start</h2>
              <p>Drag to steer. Arrow keys or WASD also work. Grab stars and power-ups, avoid rocks.</p>
            </div>
          )}
        </div>
      </div>

      {phase === "over" && result && (
        <ResultCard
          title={result.isNewBest ? "New best!" : "Ship destroyed"}
          subtitle={`${world.icon} ${world.name}`}
          badge={result.unlocks.length ? `Unlocked: ${result.unlocks.join(", ")}` : null}
          stats={[
            { label: "Score", value: result.score },
            { label: "Stars", value: result.stars },
            { label: "Time", value: `${result.seconds}s` },
          ]}
          note={!result.isNewBest && result.previousBest ? `Your best here is ${result.previousBest}.` : null}
          actions={[
            { label: "Fly again", primary: true, onClick: () => setRound((r) => r + 1) },
            { label: "Worlds", onClick: onBack },
          ]}
        />
      )}
    </GameShell>
  );
}

export default function StarDodgerGame({ playerId, onExit }) {
  const [worldId, setWorldId] = useState(null);
  const [records, setRecords] = useState(() => getGameRecords("stardodger"));
  const [skinId, setSkinId] = useState(loadSkin);

  const map = bestMapFrom(records);
  const overall = bestOverall(map);

  const chooseSkin = (s) => {
    setSkinId(s.id);
    try {
      localStorage.setItem(SKIN_KEY, s.id);
    } catch {
      /* ignore */
    }
  };

  if (worldId) {
    const skin = SKINS.find((s) => s.id === skinId && isSkinUnlocked(s, overall)) || SKINS[0];
    return (
      <StarDodgerPlay
        key={worldId}
        playerId={playerId}
        worldId={worldId}
        skinId={skin.id}
        onBack={() => {
          setRecords(getGameRecords("stardodger"));
          setWorldId(null);
        }}
      />
    );
  }

  const items = WORLDS.map((w, i) => {
    const rows = records.filter((r) => r.variant === w.id);
    const stars = rows.reduce((m, r) => Math.max(m, r.best_extra || 0), 0);
    const from = i > 0 ? WORLDS[i - 1] : null;
    return {
      id: w.id,
      name: w.name,
      icon: w.icon,
      desc: w.desc,
      colors: w.colors,
      locked: !isWorldUnlocked(i, map),
      lockText: from ? `Score ${w.unlockScore} in ${from.name}` : "",
      bestText: map[w.id] ? `Best ${map[w.id]} · ${stars} stars` : "Not played yet",
    };
  });

  return (
    <GameShell meta={meta} onExit={onExit}>
      <WorldPicker worlds={items} onPlay={setWorldId}>
        <p className="sl-subtitle">{meta.tagline}</p>
        <h2 className="sl-section-title">Your ship</h2>
        <div className="sl-skins" role="group" aria-label="Choose a ship">
          {SKINS.map((s) => {
            const open = isSkinUnlocked(s, overall);
            return (
              <button
                type="button"
                key={s.id}
                className={`sl-skin ${skinId === s.id && open ? "sl-skin--on" : ""}`}
                disabled={!open}
                aria-pressed={skinId === s.id && open}
                onClick={() => chooseSkin(s)}
              >
                <span aria-hidden="true">{s.icon}</span>
                <b>{s.name}</b>
                <small>{open ? "Ready" : `🔒 Score ${s.unlockScore}`}</small>
              </button>
            );
          })}
        </div>
      </WorldPicker>
    </GameShell>
  );
}
