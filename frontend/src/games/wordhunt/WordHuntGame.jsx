import React, { useEffect, useMemo, useRef, useState } from "react";
import GameShell from "../../components/hub/GameShell";
import ThemeLevelPicker from "../../components/hub/ThemeLevelPicker";
import ResultCard from "../../components/hub/ResultCard";
import { getMeta } from "../meta";
import { THEMES, getTheme } from "./words";
import { generatePuzzle, lineCells, snapLine, matchSelection, wordCells, scoreRun } from "./generator";
import { getGameRecords } from "../../utils/gameStore";
import { submitScore } from "../../api";
import { play } from "../../utils/sfx";

const META = getMeta("wordhunt");
const HINTS = 3;
const FOUND_COLORS = 8; // number of highlight colours in the CSS
const fmtClock = (secs) =>
  `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
const keyOf = ([r, c]) => `${r},${c}`;

function WordBoard({ playerId, themeId, level, onNext, onReplay, onBack }) {
  const theme = getTheme(themeId);
  const puzzle = useMemo(() => generatePuzzle(themeId, level), [themeId, level]);
  const { size } = puzzle;

  const [found, setFound] = useState([]); // words found, in the order they were found
  const [sel, setSel] = useState([]); // cells of the line being dragged
  const [anchor, setAnchor] = useState(null); // first letter of a tap-tap selection
  const [wrong, setWrong] = useState([]); // cells of a wrong guess (flashes briefly)
  const [hintWord, setHintWord] = useState(null);
  const [hintsLeft, setHintsLeft] = useState(HINTS);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);
  const gridRef = useRef(null);
  const drag = useRef(null);
  const startedAt = useRef(Date.now());
  const timers = useRef([]);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (done) return undefined;
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // colour of every cell that belongs to a found word
  const foundCells = useMemo(() => {
    const map = new Map();
    found.forEach((word, n) => {
      const entry = puzzle.words.find((w) => w.word === word);
      if (entry) wordCells(entry).forEach((cell) => map.set(keyOf(cell), n % FOUND_COLORS));
    });
    return map;
  }, [found, puzzle]);

  const selSet = new Set(sel.map(keyOf));
  const wrongSet = new Set(wrong.map(keyOf));
  const hintEntry = hintWord ? puzzle.words.find((w) => w.word === hintWord) : null;

  const cellAt = (event) => {
    const rect = gridRef.current.getBoundingClientRect();
    const col = Math.min(size - 1, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * size)));
    const row = Math.min(size - 1, Math.max(0, Math.floor(((event.clientY - rect.top) / rect.height) * size)));
    return [row, col];
  };

  const finish = (hintsUsed) => {
    const elapsed = (Date.now() - startedAt.current) / 1000;
    const { stars, score } = scoreRun({ wordCount: puzzle.words.length, seconds: elapsed, hints: hintsUsed });
    const saved = submitScore({
      playerId,
      game: "wordhunt",
      variant: themeId,
      level,
      score,
      stars,
      moves: 0,
      timeSeconds: Math.round(elapsed * 10) / 10,
      extra: puzzle.words.length,
    });
    setDone(true);
    setSeconds(Math.floor(elapsed));
    play("win");
    timers.current.push(
      setTimeout(
        () =>
          setResult({
            stars,
            score,
            seconds: Math.round(elapsed),
            hintsUsed,
            isNewBest: saved.isNewBest,
            previousBest: saved.previousBest,
          }),
        500
      )
    );
  };

  const submit = (cells) => {
    setSel([]);
    setAnchor(null);
    if (cells.length < 2) return;
    const entry = matchSelection(puzzle, cells, found);
    if (entry) {
      play("found");
      setFound((list) => [...list, entry.word]);
      if (hintWord === entry.word) setHintWord(null);
      if (found.length + 1 === puzzle.words.length) finish(HINTS - hintsLeft);
    } else {
      play("wrong");
      setWrong(cells);
      timers.current.push(setTimeout(() => setWrong([]), 450));
    }
  };

  const onTap = (cell) => {
    if (anchor && keyOf(anchor) === keyOf(cell)) {
      setAnchor(null);
      return;
    }
    if (anchor) {
      const cells = lineCells(anchor[0], anchor[1], cell[0], cell[1]);
      if (cells) {
        submit(cells);
        return;
      }
    }
    play("tap");
    setAnchor(cell);
  };

  const onPointerDown = (event) => {
    if (done || event.button > 0) return;
    event.preventDefault();
    gridRef.current.setPointerCapture(event.pointerId);
    const start = cellAt(event);
    drag.current = { start, moved: false };
    setSel([start]);
  };

  const onPointerMove = (event) => {
    const d = drag.current;
    if (!d) return;
    const cell = cellAt(event);
    if (cell[0] !== d.start[0] || cell[1] !== d.start[1]) d.moved = true;
    setSel(snapLine(d.start[0], d.start[1], cell[0], cell[1], size));
  };

  const onPointerUp = (event) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const cell = cellAt(event);
    if (!d.moved && cell[0] === d.start[0] && cell[1] === d.start[1]) {
      setSel([]);
      onTap(cell);
      return;
    }
    submit(snapLine(d.start[0], d.start[1], cell[0], cell[1], size));
  };

  const onPointerCancel = () => {
    drag.current = null;
    setSel([]);
  };

  const showHint = () => {
    if (hintsLeft <= 0 || hintWord || done) return;
    const target = puzzle.words.find((w) => !found.includes(w.word));
    if (!target) return;
    setHintWord(target.word);
    setHintsLeft((n) => n - 1);
    play("power");
  };

  let hintText = "Stuck? A hint rings the first letter of a word you haven't found.";
  if (hintEntry) hintText = `Look for a ${hintEntry.word.length}-letter word that starts at the ringed letter.`;
  else if (hintsLeft <= 0) hintText = "No hints left on this level.";

  return (
    <GameShell
      meta={{ ...META, accent: theme.color }}
      onExit={onBack}
      backLabel="← Levels"
      subtitle={`${theme.name} · level ${level}`}
    >
      <div className="sl-board-wrap sl-wh">
        <div className="sl-hud">
          <div className="sl-hud__stat">
            Found: {found.length}/{puzzle.words.length}
          </div>
          <div className="sl-hud__stat">Time: {fmtClock(seconds)}</div>
          <div className="sl-hud__stat">Grid: {size}×{size}</div>
        </div>

        <div className="sl-wh-layout">
          <div className="sl-wh-gridwrap">
            <div
              ref={gridRef}
              className="sl-wh-grid"
              style={{ "--n": size }}
              role="group"
              aria-label="Word search grid. Drag across the letters of a word, or tap its first and last letter."
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
            >
              {puzzle.grid.map((letter, i) => {
                const r = Math.floor(i / size);
                const c = i % size;
                const key = `${r},${c}`;
                const foundColor = foundCells.get(key);
                const classes = ["sl-wh-cell"];
                if (foundColor !== undefined) classes.push("is-found", `is-found-${foundColor}`);
                if (selSet.has(key)) classes.push("is-sel");
                if (anchor && keyOf(anchor) === key) classes.push("is-anchor");
                if (wrongSet.has(key)) classes.push("is-wrong");
                if (hintEntry && hintEntry.r === r && hintEntry.c === c) classes.push("is-hint");
                return (
                  <span key={key} className={classes.join(" ")} data-r={r} data-c={c}>
                    {letter}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="sl-wh-side">
            <h2 className="sl-section-title">Words to find</h2>
            <ul className="sl-wh-words" aria-label="Words to find">
              {puzzle.words.map((entry) => {
                const n = found.indexOf(entry.word);
                return (
                  <li key={entry.word} className={n >= 0 ? `is-found is-found-${n % FOUND_COLORS}` : ""}>
                    {entry.word}
                  </li>
                );
              })}
            </ul>
            <div className="sl-wh-hint">
              <button
                type="button"
                className="sl-btn sl-btn--hint"
                onClick={showHint}
                disabled={hintsLeft <= 0 || Boolean(hintWord) || done}
              >
                💡 Hint ({hintsLeft}/{HINTS})
              </button>
              <p className={`sl-hint-msg ${hintEntry ? "sl-hint-msg--active" : ""}`} aria-live="polite">
                {hintText}
              </p>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <ResultCard
          title="Every word found!"
          subtitle={`${theme.name} · level ${level}`}
          stars={result.stars}
          badge={result.isNewBest && result.previousBest !== null ? "New best score!" : null}
          stats={[
            { label: "Score", value: result.score },
            { label: "Words", value: puzzle.words.length },
            { label: "Time", value: fmtClock(result.seconds) },
          ]}
          note={result.hintsUsed > 0 ? `Hints used: ${result.hintsUsed}` : null}
          actions={[
            { label: "Next level", primary: true, onClick: onNext },
            { label: "Play again", onClick: onReplay },
            { label: "All levels", onClick: onBack },
          ]}
        />
      )}
    </GameShell>
  );
}

// Word Hunt inside the hub: choose a theme -> choose a level -> grid.
export default function WordHuntGame({ playerId, onExit }) {
  const [pick, setPick] = useState(null); // { themeId, level, run }

  if (!pick) {
    return (
      <GameShell meta={META} onExit={onExit} subtitle="Pick a theme, then a level">
        <ThemeLevelPicker
          themes={THEMES}
          records={getGameRecords("wordhunt")}
          onPlay={(themeId, level) => setPick({ themeId, level, run: 0 })}
        />
      </GameShell>
    );
  }

  return (
    <WordBoard
      key={`${pick.themeId}-${pick.level}-${pick.run}`}
      playerId={playerId}
      themeId={pick.themeId}
      level={pick.level}
      onNext={() => setPick((p) => ({ ...p, level: p.level + 1, run: 0 }))}
      onReplay={() => setPick((p) => ({ ...p, run: p.run + 1 }))}
      onBack={() => setPick(null)}
    />
  );
}
