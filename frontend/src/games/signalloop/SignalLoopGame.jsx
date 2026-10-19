import React, { useState } from "react";
import LevelSelect from "../../components/LevelSelect";
import GameBoard from "../../components/GameBoard";

// SignalLoop inside the hub: level list -> board.
export default function SignalLoopGame({ playerId, onExit, onRate }) {
  const [level, setLevel] = useState(null); // null = level list

  const handleWin = (_progress, goNext) => {
    if (goNext) setLevel((n) => (n || 1) + 1);
  };

  if (level === null) {
    return <LevelSelect playerId={playerId} onPlay={setLevel} onBack={onExit} />;
  }
  return (
    <GameBoard
      levelNumber={level}
      playerId={playerId}
      onWin={handleWin}
      onExit={() => setLevel(null)}
      onRate={onRate}
    />
  );
}
