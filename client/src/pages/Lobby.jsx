import React, { useEffect, useMemo, useState } from "react";
import socket from "../socket";

function Lobby({ room, playerId, setScreen, setRoom }) {
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onLobbyUpdate = (updatedRoom) => {
      setRoom(updatedRoom);
    };

    const onRoomError = ({ message }) => {
      setError(message);
    };

    socket.on("lobby_update", onLobbyUpdate);
    socket.on("room_error", onRoomError);

    return () => {
      socket.off("lobby_update", onLobbyUpdate);
      socket.off("room_error", onRoomError);
    };
  }, [setRoom]);

  const playerList = useMemo(() => {
    return (room?.players || []).map((p) => ({
      ...p,
      isYou: p.id === playerId
    }));
  }, [room?.players, playerId]);

  if (!room) {
    return (
      <div className="page lobby-page">
        <div className="panel loading-panel">Loading lobby...</div>
      </div>
    );
  }

  const isCreator = room.creatorId === playerId;
  const connectedPlayers = room.players.filter((player) => player.connected !== false).length;
  const canStart = connectedPlayers === room.maxPlayers;

  function startGame() {
    setError(null);
    socket.emit("start_game", { roomId: room.id });
  }

  function leaveRoom() {
    setRoom(null);
    setScreen("home");
  }

  async function copyRoomCode() {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy the room code on this device.");
    }
  }

  return (
    <div className="page lobby-page">
      <div className="lobby-shell">
        <section className="panel lobby-overview">
          <div className="section-heading">
            <span>Room ready</span>
            <h1>Lobby</h1>
          </div>

          <div className="room-code-row">
            <div className="room-chip">{room.id}</div>
            <button type="button" className="secondary-button copy-button" onClick={copyRoomCode}>
              {copied ? "Copied" : "Copy Code"}
            </button>
          </div>

          <div className="meta-grid">
            <div className="meta-card">
              <span className="meta-label">Rounds</span>
              <strong>{room.currentRound} / {room.rounds}</strong>
            </div>
            <div className="meta-card">
              <span className="meta-label">Players</span>
              <strong>{connectedPlayers} / {room.maxPlayers}</strong>
            </div>
            <div className="meta-card">
              <span className="meta-label">Mode</span>
              <strong>{room.maxPlayers}-Player Room</strong>
            </div>
          </div>

          <p className="lobby-description">
            Share the room code with your friends. The room creator can start once all {room.maxPlayers} players have joined.
          </p>

          <div className="status-strip">
            <span className={canStart ? "badge badge-success" : "badge"}>
              {canStart ? "All players ready" : `${room.maxPlayers - connectedPlayers} seat(s) remaining`}
            </span>
            <span className="badge badge-accent">7 of Hearts starts the round</span>
          </div>

          <div className="actions">
            <button type="button" className="secondary-button" onClick={leaveRoom}>
              Back Home
            </button>

            {isCreator && (
              <button
                type="button"
                className="primary-button"
                onClick={startGame}
                disabled={!canStart}
              >
                Start Game
              </button>
            )}
          </div>
        </section>

        <section className="panel roster-panel">
          <div className="section-heading">
            <span>Players</span>
            <h2>Waiting at the table</h2>
          </div>

          <div className="roster-list">
            {playerList.map((p, index) => (
              <div key={p.id} className={p.isYou ? "roster-card you" : "roster-card"}>
                <div className="roster-main">
                  <span className="seat-number">Seat {index + 1}</span>
                  <strong>{p.name}</strong>
                </div>
                <div className="roster-badges">
                  {p.id === room.creatorId && <span className="badge badge-accent">Host</span>}
                  {p.isYou && <span className="badge">You</span>}
                  {p.connected === false && <span className="badge badge-muted">Disconnected</span>}
                  {p.connected !== false && <span className="badge badge-success">Ready</span>}
                </div>
              </div>
            ))}
          </div>

          {error && <div className="error">{error}</div>}

          <div className="lobby-guide">
            <div className="guide-item">
              <span className="meta-label">Turn rule</span>
              <strong>Play a valid card or pass only when no valid move exists.</strong>
            </div>
            <div className="guide-item">
              <span className="meta-label">Scoring</span>
              <strong>Face cards, 10, and Ace are 10 points. Lowest total wins.</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Lobby;
