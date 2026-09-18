import React, { useEffect, useRef, useState, useCallback } from "react";
import Tile from "./Tile";
import { fetchLevel, submitResult } from "../api";
import { rotateEdges } from "../utils/tileShapes";

function cellIsSolved(cell, rotation) {
  const current = rotateEdges(cell.shape, rotation).slice().sort();
  const target = cell.shape.slice().sort();
  return current.length === target.length && current.every((v, i) => v === target[i]);
}

export default function GameBoard({ levelNumber, playerId, onWin, onExit, onRate }) {
  const [level, setLevel] = useState(null);
  const [rotations, setRotations] = useState([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setWon(false);
    setMoves(0);
    setSeconds(0);

    fetchLevel(levelNumber)
      .then((data) => {
        if (cancelled) return;
        setLevel(data);
        setRotations(data.cells.map((c) => c.rotation));
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [levelNumber]);

  useEffect(() => {
    if (loading || won) return;
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, won]);

  const checkWin = useCallback(
    (nextRotations) => {
      if (!level) return false;
      return level.cells.every((cell, idx) => cellIsSolved(cell, nextRotations[idx]));
    },
    [level]
  );

  const handleRotate = (idx) => {
    if (won || !level) return;
    setRotations((prev) => {
      const next = prev.slice();
      next[idx] = (next[idx] + 1) % 4;
      const didWin = checkWin(next);
      if (didWin) {
        clearInterval(timerRef.current);
        setWon(true);
        submitResult({
          playerId,
          levelNumber,
          moves: moves + 1,
          timeSeconds: seconds,
        })
          .then((progress) => onWin && onWin(progress))
          .catch(() => {});
      }
      return next;
    });
    setMoves((m) => m + 1);
  };

  if (loading) return <div className="sl-status">Loading level {levelNumber}…</div>;
  if (error) return <div className="sl-status sl-status--error">Error: {error}</div>;
  if (!level) return null;

  return (
    <div className="sl-board-wrap">
      <div className="sl-hud">
        <button className="sl-btn sl-btn--ghost" onClick={onExit}>
          ← Levels
        </button>
        <div className="sl-hud__stat">Level {level.level_number}</div>
        <div className="sl-hud__stat">Moves: {moves}</div>
        <div className="sl-hud__stat">
          Time: {String(Math.floor(seconds / 60)).padStart(2, "0")}:
          {String(seconds % 60).padStart(2, "0")}
        </div>
        <div className="sl-hud__stat">Par: {level.par_moves}</div>
      </div>

      <div
        className="sl-board"
        style={{
          gridTemplateColumns: `repeat(${level.cols}, 1fr)`,
          gridTemplateRows: `repeat(${level.rows}, 1fr)`,
        }}
      >
        {level.cells.map((cell, idx) => (
          <Tile
            key={`${cell.row}-${cell.col}`}
            shape={cell.shape}
            rotation={rotations[idx]}
            solved={won}
            onClick={() => handleRotate(idx)}
          />
        ))}
      </div>

      {won && (
        <div className="sl-win-overlay">
          <div className="sl-win-card">
            <h2>⚡ Circuit Complete!</h2>
            <p>
              Level {level.level_number} solved in {moves + 1} moves,{" "}
              {seconds}s.
            </p>
            <div className="sl-win-actions">
              <button className="sl-btn" onClick={onExit}>
                Level select
              </button>
              <button
                className="sl-btn sl-btn--primary"
                onClick={() => onWin && onWin(null, true)}
              >
                Next level →
              </button>
            </div>
            {level.level_number % 5 === 0 && onRate && (
              <button className="sl-win-rate-nudge" onClick={onRate}>
                Enjoying it so far? ⭐ Rate SignalLoop
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
