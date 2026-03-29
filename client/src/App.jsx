import React, { useEffect, useState } from "react";

import socket from "./socket";
import Home from "./pages/Home";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";

function App(){
  const [screen, setScreen] = useState("home");
  const [room, setRoom] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
    setPlayerId(socket.id);
    socket.on("connect", () => {
      setPlayerId(socket.id);
    });

    // Ensure we don't miss the "game_started" event (it can happen before the Game screen mounts)
    socket.on("game_started", (state) => {
      setRoom(state);
      setScreen("game");
    });

    // Keep room state updated when the server sends lobby updates.
    socket.on("lobby_update", (updatedRoom) => {
      setRoom(updatedRoom);
    });

    return () => {
      socket.off("connect");
      socket.off("game_started");
      socket.off("lobby_update");
    };
  }, []);

  if (screen === "home")
    return <Home setScreen={setScreen} setRoom={setRoom} setPlayerName={setPlayerName} />;

  if (screen === "lobby")
    return <Lobby room={room} playerId={playerId} setScreen={setScreen} setRoom={setRoom} />;

  return <Game room={room} playerId={playerId} setScreen={setScreen} />;
}

export default App;
