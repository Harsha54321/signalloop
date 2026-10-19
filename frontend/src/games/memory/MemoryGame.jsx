import React, { useEffect, useRef, useState } from "react";
import GameShell from "../../components/hub/GameShell";
import ThemeLevelPicker from "../../components/hub/ThemeLevelPicker";
import ResultCard from "../../components/hub/ResultCard";
import { getMeta } from "../meta";
import { THEMES, getTheme } from "./themes";
import { boardFor, buildDeck, scoreRun } from "./logic";
import { getGameRecords } from "../../utils/gameStore";
import { submitScore } from "../../api";
import { play } from "../../utils/sfx";

const META = getMeta("memory");
const PEEKS = 3;
const fmtClock = (secs) =>
  `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

function MemoryBoard({ playerId, themeId, level, onNext, onReplay, onBack }) {
  const theme = getTheme(themeId);
  const board = boardFor(level);
  const [deck] = useState(() => buildDeck(themeId, level));
  const [faceUp, setFaceUp] = useState([]); // cards turned over and not matched yet
  const [matched, setMatched] = useState([]);
  const [tries, setTries] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const [previewing, setPreviewing] = useState(board.previewSeconds > 0);
  const [peeking, setPeeking] = useState(false);
  const [peeksLeft, setPeeksLeft] = useState(PEEKS);
  const [result, setResult] = useState(null);
  const locked = useRef(false); // true while a pair is being checked
  const startedAt = useRef(0);
  const timers = useRef([]);

  const later = (fn, ms) => {
    timers.current.push(setTimeout(fn, ms));
  };

  // show every card briefly before the game starts
  useEffect(() => {
    if (board.previewSeconds <= 0) return undefined;
    const id = setTimeout(() => setPreviewing(false), board.previewSeconds * 1000);
    return () => clearTimeout(id);
  }, [board.previewSeconds]);

  // clock
  useEffect(() => {
    if (!started || result) return undefined;
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [started, result]);

  // stop any pending flip-back when the board closes
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const finish = (finalTries) => {
    const elapsed = (Date.now() - startedAt.current) / 1000;
    const { stars, score } = scoreRun({
      pairs: board.pairs,
      tries: finalTries,
      seconds: elapsed,
      peeks: PEEKS - peeksLeft,
    });
    const saved = submitScore({
      playerId,
      game: "memory",
      variant: themeId,
      level,
      score,
      stars,
      moves: finalTries,
      timeSeconds: Math.round(elapsed * 10) / 10,
      extra: board.pairs,
    });
    play("win");
    setSeconds(Math.floor(elapsed));
    later(
      () =>
        setResult({
          stars,
          score,
          tries: finalTries,
          seconds: Math.round(elapsed),
          isNewBest: saved.isNewBest,
          previousBest: saved.previousBest,
        }),
      450
    );
  };

  const flip = (index) => {
    if (locked.current || previewing || peeking || result) return;
    if (faceUp.includes(index) || matched.includes(index)) return;
    if (!started) {
      startedAt.current = Date.now();
      setStarted(true);
    }
    play("flip");
    const next = [...faceUp, index];
    setFaceUp(next);
    if (next.length < 2) return;

    locked.current = true;
    const [a, b] = next;
    const newTries = tries + 1;
    setTries(newTries);
    if (deck[a].pairId === deck[b].pairId) {
      later(() => {
        setMatched((m) => [...m, a, b]);
        setFaceUp([]);
        locked.current = false;
        play("match");
        if (matched.length + 2 === deck.length) finish(newTries);
      }, 350);
    } else {
      later(() => {
        setFaceUp([]);
        locked.current = false;
        play("wrong");
      }, 800);
    }
  };

  const peek = () => {
    if (peeksLeft <= 0 || peeking || previewing || locked.current || result) return;
    setPeeksLeft((n) => n - 1);
    setPeeking(true);
    play("power");
    later(() => setPeeking(false), 1500);
  };

  const dense = board.cols >= 5;
  const showAll = previewing || peeking;
  let hint = "Turn over two cards and find the matching pair.";
  if (previewing) hint = "Memorise the cards. They turn over in a moment.";
  else if (peeking) hint = "Peeking...";
  else if (peeksLeft <= 0) hint = "No peeks left on this level.";

  return (
    <GameShell
      meta={{ ...META, accent: theme.color }}
      onExit={onBack}
      backLabel="← Levels"
      subtitle={`${theme.name} · level ${level}`}
    >
      <div className="sl-board-wrap sl-mm">
        <div className="sl-hud">
          <div className="sl-hud__stat">Tries: {tries}</div>
          <div className="sl-hud__stat">
            Pairs: {matched.length / 2}/{board.pairs}
          </div>
          <div className="sl-hud__stat">Time: {fmtClock(seconds)}</div>
        </div>

        <div
          className={`sl-mm-board ${dense ? "sl-mm-board--dense" : ""}`}
          style={{ "--cols": board.cols, "--rows": board.rows }}
        >
          {deck.map((card, i) => {
            const isMatched = matched.includes(i);
            const up = showAll || isMatched || faceUp.includes(i);
            return (
              <button
                type="button"
                key={card.index}
                className={`sl-mm-card ${up ? "is-up" : ""} ${isMatched ? "is-matched" : ""}`}
                onClick={() => flip(i)}
                aria-label={up ? `Card ${i + 1}: ${card.symbol}` : `Card ${i + 1}, face down`}
              >
                <span className="sl-mm-card__inner" aria-hidden="true">
                  <span className="sl-mm-card__back" />
                  <span className="sl-mm-card__face">{card.symbol}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="sl-hint-bar">
          <button
            type="button"
            className="sl-btn sl-btn--hint"
            onClick={peek}
            disabled={peeksLeft <= 0 || peeking || previewing || Boolean(result)}
          >
            👀 Peek ({peeksLeft}/{PEEKS})
          </button>
          <p className={`sl-hint-msg ${peeking ? "sl-hint-msg--active" : ""}`} aria-live="polite">
            {hint}
          </p>
        </div>
      </div>

      {result && (
        <ResultCard
          title="All pairs found!"
          subtitle={`${theme.name} · level ${level}`}
          stars={result.stars}
          badge={result.isNewBest && result.previousBest !== null ? "New best score!" : null}
          stats={[
            { label: "Score", value: result.score },
            { label: "Tries", value: result.tries },
            { label: "Time", value: fmtClock(result.seconds) },
          ]}
          note={PEEKS - peeksLeft > 0 ? `Peeks used: ${PEEKS - peeksLeft}` : null}
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

// Memory Match inside the hub: choose a theme -> choose a level -> board.
export default function MemoryGame({ playerId, onExit }) {
  const [pick, setPick] = useState(null); // { themeId, level, run }

  if (!pick) {
    return (
      <GameShell meta={META} onExit={onExit} subtitle="Pick a theme, then a level">
        <ThemeLevelPicker
          themes={THEMES}
          records={getGameRecords("memory")}
          onPlay={(themeId, level) => setPick({ themeId, level, run: 0 })}
        />
      </GameShell>
    );
  }

  return (
    <MemoryBoard
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
