import React, { useState } from "react";
import NavBar from "./components/NavBar";
import LevelSelect from "./components/LevelSelect";
import GameBoard from "./components/GameBoard";
import HowToPlay from "./components/HowToPlay";
import StatsPage from "./components/StatsPage";
import LeaderboardPage from "./components/LeaderboardPage";
import RatingPage from "./components/RatingPage";
import { getPlayerId } from "./api";

export default function App() {
  const [playerId] = useState(getPlayerId);
  const [tab, setTab] = useState("play"); // play | leaderboard | howto | stats | rate
  const [currentLevel, setCurrentLevel] = useState(null); // null = level select screen (within Play tab)

  const goToTab = (id) => {
    setTab(id);
    if (id === "play") setCurrentLevel(null);
  };

  const handleWin = (_progress, goNext) => {
    if (goNext) {
      setCurrentLevel((n) => (n || 1) + 1);
    }
  };

  const renderPlayTab = () =>
    currentLevel === null ? (
      <LevelSelect playerId={playerId} onPlay={setCurrentLevel} />
    ) : (
      <GameBoard
        levelNumber={currentLevel}
        playerId={playerId}
        onWin={handleWin}
        onExit={() => setCurrentLevel(null)}
        onRate={() => setTab("rate")}
      />
    );

  return (
    <div className="sl-app">
      <NavBar active={tab} onNavigate={goToTab} />
      <div className="sl-page-container">
        {tab === "play" && renderPlayTab()}
        {tab === "leaderboard" && <LeaderboardPage />}
        {tab === "howto" && <HowToPlay />}
        {tab === "stats" && <StatsPage playerId={playerId} />}
        {tab === "rate" && <RatingPage playerId={playerId} />}
      </div>
    </div>
  );
}
