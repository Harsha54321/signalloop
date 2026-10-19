import React, { useEffect, useState } from "react";
import NavBar from "./components/NavBar";
import HubPage from "./components/hub/HubPage";
import HowToPlay from "./components/HowToPlay";
import StatsPage from "./components/StatsPage";
import LeaderboardPage from "./components/LeaderboardPage";
import RatingPage from "./components/RatingPage";
import { getGame } from "./games/registry";
import { getPlayerId, flushPending, syncGameProgress } from "./api";

export default function App() {
  const [playerId] = useState(getPlayerId);
  const [tab, setTab] = useState("games"); // games | leaderboard | howto | stats | rate
  const [gameId, setGameId] = useState(null); // null = game hub (inside the Games tab)
  const [online, setOnline] = useState(navigator.onLine);

  // Track the connection. When internet is back, send anything that was
  // saved offline and pull this player's results from the server.
  useEffect(() => {
    const sync = () => flushPending().then(() => syncGameProgress(playerId));
    const goOnline = () => {
      setOnline(true);
      sync();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    sync(); // also once on startup
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [playerId]);

  const goToTab = (id) => {
    setTab(id);
    if (id === "games") setGameId(null);
  };

  const renderGames = () => {
    const game = gameId ? getGame(gameId) : null;
    if (!game) return <HubPage onPlay={setGameId} />;
    const Game = game.component;
    return (
      <Game
        playerId={playerId}
        onExit={() => setGameId(null)}
        onRate={() => setTab("rate")}
      />
    );
  };

  return (
    <div className="sl-app">
      {!online && (
        <div className="sl-offline-banner">
          📴 Offline mode — keep playing! Your progress is saved on this device
          and syncs when you're back online.
        </div>
      )}
      <NavBar active={tab} onNavigate={goToTab} />
      <main className="sl-page-container">
        {tab === "games" && renderGames()}
        {tab === "leaderboard" && <LeaderboardPage />}
        {tab === "howto" && <HowToPlay />}
        {tab === "stats" && <StatsPage playerId={playerId} />}
        {tab === "rate" && <RatingPage playerId={playerId} />}
      </main>
    </div>
  );
}
