import React, { useEffect, useState } from "react";
import NavBar from "./components/NavBar";
import LevelSelect from "./components/LevelSelect";
import GameBoard from "./components/GameBoard";
import HowToPlay from "./components/HowToPlay";
import StatsPage from "./components/StatsPage";
import LeaderboardPage from "./components/LeaderboardPage";
import RatingPage from "./components/RatingPage";
import { getPlayerId, flushPending } from "./api";

export default function App() {
  const [playerId] = useState(getPlayerId);
  const [tab, setTab] = useState("play"); // play | leaderboard | howto | stats | rate
  const [currentLevel, setCurrentLevel] = useState(null); // null = level select screen (within Play tab)
  const [online, setOnline] = useState(navigator.onLine);

  // Track connection state; when internet comes back, sync anything saved offline.
  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      flushPending();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    flushPending(); // also try once on startup
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

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
      {!online && (
        <div className="sl-offline-banner">
          📴 Offline mode — keep playing! Your progress is saved on this device
          and syncs when you're back online.
        </div>
      )}
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
