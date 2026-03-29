import React, { useEffect, useState } from "react";
import socket from "../socket";

function Home({ setScreen, setRoom, setPlayerName }) {
  const [mode, setMode] = useState("create");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [rounds, setRounds] = useState(5);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const savedName = window.localStorage.getItem("badam-satti-player-name");
      if (savedName) {
        setName(savedName);
      }
    } catch {
      // Ignore storage issues and keep the form usable.
    }
  }, []);

  useEffect(() => {
    const onRoomCreated = (room) => {
      setRoom(room);
      setScreen("lobby");
    };

    const onLobbyUpdate = (room) => {
      setRoom(room);
      setScreen("lobby");
    };

    const onRoomError = ({ message }) => {
      setError(message);
    };

    const onConnect = () => {
      setError(null);
    };

    const onConnectError = () => {
      setError("Unable to reach the game server. Make sure your phone and computer are on the same network.");
    };

    socket.on("connect", onConnect);
    socket.on("room_created", onRoomCreated);
    socket.on("lobby_update", onLobbyUpdate);
    socket.on("room_error", onRoomError);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("room_created", onRoomCreated);
      socket.off("lobby_update", onLobbyUpdate);
      socket.off("room_error", onRoomError);
      socket.off("connect_error", onConnectError);
    };
  }, [setRoom, setScreen]);

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name.");
      return;
    }

    if (!socket.connected) {
      setError("Server connection not ready yet. If you're on mobile, open the site using your computer's local IP.");
      return;
    }

    setError(null);
    try {
      window.localStorage.setItem("badam-satti-player-name", trimmed);
    } catch {
      // Ignore storage issues and continue creating the room.
    }
    setPlayerName(trimmed);
    socket.emit("create_room", { name: trimmed, rounds, maxPlayers });
  }

  function handleJoin() {
    const trimmed = name.trim();
    const code = roomCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4);

    if (!trimmed || !code) {
      setError("Please enter your name and room code.");
      return;
    }

    if (!socket.connected) {
      setError("Server connection not ready yet. If you're on mobile, open the site using your computer's local IP.");
      return;
    }

    setError(null);
    try {
      window.localStorage.setItem("badam-satti-player-name", trimmed);
    } catch {
      // Ignore storage issues and continue joining the room.
    }
    setPlayerName(trimmed);
    socket.emit("join_room", { roomId: code, name: trimmed });
  }

  return (
    <div className="page home-page">
      <div className="home-shell">
        <section className="panel hero-panel">
          <p className="eyebrow">Realtime card room</p>
          <h1>Badam Satti</h1>
          <p className="hero-text">
            Create a room, invite your group, and play real-time Badam Satti with multi-round
            scoring, instant table updates, and automatic point calculation.
          </p>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-label">Players</span>
              <strong>3-6 per room</strong>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-label">Rounds</span>
              <strong>1-15 selectable</strong>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-label">Start rule</span>
              <strong>7 of Hearts opens</strong>
            </div>
          </div>

          <div className="hero-notes">
            <div className="note-card">
              <h3>Quick setup</h3>
              <p>Rooms open in seconds with a shareable code for your group.</p>
            </div>
            <div className="note-card">
              <h3>Real-time gameplay</h3>
              <p>Track whose turn it is, how many cards remain, and the live round-by-round score.</p>
            </div>
          </div>
        </section>

        <section className="panel setup-panel">
          <div className="section-heading">
            <span>Start here</span>
            <h2>{mode === "create" ? "Create a new room" : "Join an existing room"}</h2>
          </div>

          <div className="mode-switch">
            <button
              type="button"
              className={mode === "create" ? "segment-button active" : "segment-button"}
              onClick={() => setMode("create")}
            >
              Create Room
            </button>
            <button
              type="button"
              className={mode === "join" ? "segment-button active" : "segment-button"}
              onClick={() => setMode("join")}
            >
              Join Room
            </button>
          </div>

          <div className="form-stack">
            <div className="form-row">
              <label className="field-label" htmlFor="player-name">Your Name</label>
              <input
                id="player-name"
                className="text-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aizen"
              />
            </div>

            {mode === "create" ? (
              <>
                <div className="requirement-box">
                  <span className="field-label">Room Format</span>
                  <strong>{maxPlayers} players, 52-card deck, score-based rounds</strong>
                </div>

                <div className="form-row">
                  <label className="field-label" htmlFor="max-players">Players</label>
                  <select
                    id="max-players"
                    className="text-input"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  >
                    <option value={3}>3 Players</option>
                    <option value={4}>4 Players</option>
                    <option value={5}>5 Players</option>
                    <option value={6}>6 Players</option>
                  </select>
                </div>

                <div className="form-row">
                  <label className="field-label" htmlFor="rounds">Rounds</label>
                  <select
                    id="rounds"
                    className="text-input"
                    value={rounds}
                    onChange={(e) => setRounds(Number(e.target.value))}
                  >
                    {Array.from({ length: 15 }, (_, index) => index + 1).map((roundCount) => (
                      <option key={roundCount} value={roundCount}>{roundCount}</option>
                    ))}
                  </select>
                </div>

                <button type="button" className="primary-button" onClick={handleCreate}>
                  Create Room
                </button>
              </>
            ) : (
              <>
                <div className="form-row">
                  <label className="field-label" htmlFor="room-code">Room Code</label>
                  <input
                    id="room-code"
                    className="text-input room-code-input"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4))}
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>

                <button type="button" className="primary-button" onClick={handleJoin}>
                  Join Room
                </button>
              </>
            )}
          </div>

          {error && <div className="error">{error}</div>}

          <div className="inline-tip">
            <span className="tip-label">Tip</span>
            <p>Share the room code with your group. The game starts once all {maxPlayers} seats are filled.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
