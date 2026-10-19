import React, { useCallback, useEffect, useRef, useState } from "react";
import GameShell from "../../components/hub/GameShell";
import WorldPicker from "../../components/hub/WorldPicker";
import ResultCard from "../../components/hub/ResultCard";
import { getMeta } from "../meta";
import { submitScore } from "../../api";
import { getGameRecords } from "../../utils/gameStore";
import { play } from "../../utils/sfx";
import { WORLDS, UNLOCK_FLOORS, getWorld, isUnlocked } from "./worlds";
import { createGame, update, drop, activateGuide, activateSlow, W, H } from "./engine";
import { makeDecor, createFx, stepFx, draw } from "./render";

const meta = getMeta("neonstack");

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function bestFloorsFor(records, worldId) {
  return records
    .filter((r) => r.variant === worldId)
    .reduce((m, r) => Math.max(m, r.best_extra || 0), 0);
}

function NeonStackPlay({ playerId, worldId, worlds, onBack, onSwitchWorld }) {
  const world = getWorld(worldId);
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const fxRef = useRef(null);
  const decorRef = useRef(null);
  const phaseRef = useRef("ready");
  const [phase, setPhase] = useState("ready");
  const [hud, setHud] = useState({ score: 0, floors: 0, hintsLeft: 3, guide: false, slow: false });
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(0);

  const setPhaseBoth = (p) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const syncHud = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    setHud((h) => {
      const next = {
        score: g.score,
        floors: g.floors,
        hintsLeft: g.hintsLeft,
        guide: g.guide,
        slow: g.slowLeft > 0,
      };
      return h.score === next.score &&
        h.floors === next.floors &&
        h.hintsLeft === next.hintsLeft &&
        h.guide === next.guide &&
        h.slow === next.slow
        ? h
        : next;
    });
  }, []);

  const finish = useCallback(
    (g) => {
      const records = getGameRecords("neonstack");
      const before = bestFloorsFor(records, world.id);
      let saved = null;
      if (g.score > 0) {
        saved = submitScore({
          playerId,
          game: "neonstack",
          variant: world.id,
          level: 0,
          score: g.score,
          stars: 0,
          timeSeconds: Math.round(g.time),
          extra: g.floors,
        });
      }
      const nextWorld = worlds.find((w, i) => i > 0 && worlds[i - 1].id === world.id);
      const unlockedNow =
        nextWorld && before < UNLOCK_FLOORS && g.floors >= UNLOCK_FLOORS ? nextWorld : null;
      setResult({
        score: g.score,
        floors: g.floors,
        perfects: g.perfects,
        bestStreak: g.bestStreak,
        isNewBest: !!(saved && saved.isNewBest),
        previousBest: saved ? saved.previousBest : null,
        unlocked: unlockedNow,
      });
      setPhaseBoth("over");
      play(g.floors >= 10 ? "win" : "over");
    },
    [playerId, world.id, worlds]
  );

  // fresh game + scenery whenever the world changes or the player restarts
  useEffect(() => {
    gameRef.current = createGame();
    fxRef.current = createFx();
    decorRef.current = makeDecor(world);
    phaseRef.current = "ready";
    setPhase("ready");
    setResult(null);
    setHud({ score: 0, floors: 0, hintsLeft: 3, guide: false, slow: false });
  }, [world, round]);

  // animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const reduced = prefersReducedMotion();
    let raf = 0;
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = gameRef.current;
      if (g) {
        if (phaseRef.current === "playing") update(g, dt);
        else update({ ...g, over: true, debris: g.debris }, dt); // only debris falls
        stepFx(fxRef.current, g, dt, reduced);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw(ctx, g, world, decorRef.current, fxRef.current);
        if (phaseRef.current === "playing") syncHud();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [world, syncHud]);

  const doDrop = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    if (phaseRef.current === "ready") {
      phaseRef.current = "playing";
      setPhase("playing");
      return;
    }
    if (phaseRef.current !== "playing") return;
    const res = drop(g);
    syncHud();
    if (res.type === "perfect") play("perfect");
    else if (res.type === "good") play("tap");
    if (g.over) finish(g);
  }, [finish, syncHud]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      const t = e.target;
      if (t && (t.tagName === "BUTTON" || t.tagName === "INPUT" || t.tagName === "SELECT")) return;
      e.preventDefault();
      if (phaseRef.current === "over") return;
      doDrop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doDrop]);

  const onGuide = () => {
    const g = gameRef.current;
    if (g && phaseRef.current === "playing" && activateGuide(g)) {
      play("power");
      syncHud();
    }
  };
  const onSlow = () => {
    const g = gameRef.current;
    if (g && phaseRef.current === "playing" && activateSlow(g)) {
      play("power");
      syncHud();
    }
  };

  const nextIdx = worlds.findIndex((w) => w.id === world.id) + 1;
  const nextWorld = worlds[nextIdx];

  return (
    <GameShell meta={meta} onExit={onBack} backLabel="← Worlds" subtitle={`${world.icon} ${world.name}`}>
      <div className="sl-arcade">
        <div className="sl-arcade__hud" aria-live="off">
          <span>
            Score <b>{hud.score}</b>
          </span>
          <span>
            Floors <b>{hud.floors}</b>
          </span>
          <span className="sl-arcade__hints">
            <button
              type="button"
              className="sl-btn sl-btn--hint"
              onClick={onGuide}
              disabled={phase !== "playing" || hud.hintsLeft <= 0 || hud.guide}
            >
              📐 Guide
            </button>
            <button
              type="button"
              className="sl-btn sl-btn--hint"
              onClick={onSlow}
              disabled={phase !== "playing" || hud.hintsLeft <= 0 || hud.slow}
            >
              🐢 Slow
            </button>
            <small>{hud.hintsLeft} left</small>
          </span>
        </div>

        <div className="sl-arcade__stage" style={{ aspectRatio: `${W} / ${H}` }}>
          <canvas
            ref={canvasRef}
            className="sl-arcade__canvas"
            aria-label="Neon Stack play area. Tap or press Space to drop the block."
            onPointerDown={(e) => {
              e.preventDefault();
              doDrop();
            }}
          />
          {phase === "ready" && (
            <div className="sl-arcade__overlay">
              <h2>Tap to start</h2>
              <p>Tap, click or press Space to drop the moving block. Line it up with the tower.</p>
            </div>
          )}
        </div>
      </div>

      {phase === "over" && result && (
        <ResultCard
          title={result.isNewBest ? "New best!" : "Tower fell"}
          subtitle={`${world.icon} ${world.name}`}
          badge={
            result.unlocked ? `${result.unlocked.icon} ${result.unlocked.name} world unlocked!` : null
          }
          stats={[
            { label: "Score", value: result.score },
            { label: "Floors", value: result.floors },
            { label: "Perfect drops", value: result.perfects },
            { label: "Best streak", value: result.bestStreak },
          ]}
          note={
            result.previousBest != null && !result.isNewBest
              ? `Your best here is ${result.previousBest}.`
              : nextWorld && !isUnlocked(nextIdx, { [world.id]: result.floors })
              ? `Reach ${UNLOCK_FLOORS} floors to open ${nextWorld.name}.`
              : null
          }
          actions={[
            { label: "Play again", primary: true, onClick: () => setRound((r) => r + 1) },
            ...(result.unlocked
              ? [{ label: `Play ${result.unlocked.name}`, onClick: () => onSwitchWorld(result.unlocked.id) }]
              : []),
            { label: "Worlds", onClick: onBack },
          ]}
        />
      )}
    </GameShell>
  );
}

export default function NeonStackGame({ playerId, onExit }) {
  const [worldId, setWorldId] = useState(null);
  const [records, setRecords] = useState(() => getGameRecords("neonstack"));

  const backToPicker = () => {
    setRecords(getGameRecords("neonstack"));
    setWorldId(null);
  };

  if (worldId) {
    return (
      <NeonStackPlay
        key={worldId}
        playerId={playerId}
        worldId={worldId}
        worlds={WORLDS}
        onBack={backToPicker}
        onSwitchWorld={setWorldId}
      />
    );
  }

  const bestOverall = records.reduce((m, r) => Math.max(m, r.best_extra || 0), 0);
  const bestMap = {};
  WORLDS.forEach((w) => {
    bestMap[w.id] = bestFloorsFor(records, w.id);
  });
  const items = WORLDS.map((w, i) => {
    const bestFloors = bestFloorsFor(records, w.id);
    const best = records
      .filter((r) => r.variant === w.id)
      .reduce((m, r) => Math.max(m, r.best_score || 0), 0);
    return {
      id: w.id,
      name: w.name,
      icon: w.icon,
      desc: w.desc,
      colors: w.colors,
      locked: !isUnlocked(i, bestMap),
      lockText: `Reach ${UNLOCK_FLOORS} floors in ${WORLDS[i - 1] ? WORLDS[i - 1].name : ""}`,
      bestText: best ? `Best ${best} · ${bestFloors} floors` : "Not played yet",
    };
  });

  return (
    <GameShell meta={meta} onExit={onExit}>
      <WorldPicker worlds={items} onPlay={setWorldId}>
        <p className="sl-subtitle">
          {meta.tagline} {bestOverall ? `Tallest tower: ${bestOverall} floors.` : ""}
        </p>
      </WorldPicker>
    </GameShell>
  );
}
