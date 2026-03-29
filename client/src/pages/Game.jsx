import React, { useEffect, useMemo, useState } from "react";
import socket from "../socket";

import PlayerHand from "../components/PlayerHand";
import GameBoard from "../components/GameBoard";
import PlayerSeat from "../components/PlayerSeat";
import ScoreBoard from "../components/ScoreBoard";
import ChatBox from "../components/ChatBox";
import { getValidMoves } from "../lib/gameRules";

const opponentPositionMap = {
  2: ["top-left", "top-right"],
  3: ["left", "top", "right"],
  4: ["left", "top-left", "top-right", "right"],
  5: ["left", "top-left", "top", "top-right", "right"]
};

function Game({ room, playerId, setScreen }) {
  const [gameState, setGameState] = useState(room || null);
  const [error, setError] = useState(null);
  const [dismissedSummaryKey, setDismissedSummaryKey] = useState(null);

  // Keep local game state in sync when the parent updates the room (e.g. when game starts)
  useEffect(() => {
    if (room) setGameState(room);
  }, [room]);

  useEffect(() => {
    const onGameStarted = (state) => {
      setGameState(state);
    };

    const onGameUpdate = (state) => {
      setGameState(state);
    };

    const onGameError = ({ message }) => {
      setError(message);
      setTimeout(() => setError(null), 3000);
    };

    socket.on("game_started", onGameStarted);
    socket.on("game_update", onGameUpdate);
    socket.on("game_error", onGameError);

    return () => {
      socket.off("game_started", onGameStarted);
      socket.off("game_update", onGameUpdate);
      socket.off("game_error", onGameError);
    };
  }, []);

  const roundSummaryKey = useMemo(() => {
    if (!gameState?.lastRoundResult) return null;

    return `${gameState.lastRoundResult.roundNumber}-${gameState.lastRoundResult.winnerId}`;
  }, [gameState?.lastRoundResult]);

  useEffect(() => {
    if (roundSummaryKey && dismissedSummaryKey && roundSummaryKey !== dismissedSummaryKey) {
      setDismissedSummaryKey(null);
    }
  }, [roundSummaryKey, dismissedSummaryKey]);

  const myIndex = useMemo(() => {
    if (!gameState) return -1;
    return gameState.players.findIndex((p) => p.id === playerId);
  }, [gameState, playerId]);

  const me = useMemo(() => {
    if (!gameState || myIndex < 0) return null;
    return gameState.players[myIndex];
  }, [gameState, myIndex]);

  const turnPlayer = useMemo(() => {
    if (!gameState) return null;
    return gameState.players[gameState.turn];
  }, [gameState]);

  const otherPlayers = useMemo(() => {
    if (!gameState) return [];
    const opponents = gameState.players
      .map((player, index) => ({
        ...player,
        seatLabel: `Seat ${index + 1}`
      }))
      .filter((player) => player.id !== playerId);

    const positions = opponentPositionMap[opponents.length] || opponentPositionMap[5];

    return opponents.map((player, index) => ({
      ...player,
      positionClass: positions[index] || "top"
    }));
  }, [gameState, playerId]);

  const validMoves = useMemo(() => {
    if (!me) return [];
    return getValidMoves(gameState?.board, me.cards || []);
  }, [gameState?.board, me]);

  const standings = useMemo(() => {
    if (!gameState) return [];

    return [...gameState.players].sort((left, right) => {
      if ((left.score ?? 0) !== (right.score ?? 0)) {
        return (left.score ?? 0) - (right.score ?? 0);
      }

      return left.name.localeCompare(right.name);
    });
  }, [gameState]);

  function onPass() {
    if (!gameState) return;
    socket.emit("pass_turn", { roomId: gameState.id, playerId });
  }

  function leaveGame() {
    setScreen("home");
  }

  if (!gameState) {
    return (
      <div className="page game-page">
        <div className="panel loading-panel">Waiting for game to start...</div>
      </div>
    );
  }

  const isMyTurn = gameState.turn === myIndex;
  const canPass = isMyTurn && validMoves.length === 0;
  const leadPlayer = standings[0] || null;
  const cardsInPlay = Object.values(gameState.board || {}).reduce((sum, pile) => sum + pile.length, 0);
  const turnStatus = isMyTurn
    ? validMoves.length > 0
      ? `${validMoves.length} playable ${validMoves.length === 1 ? "card" : "cards"}`
      : "No playable cards"
    : `${turnPlayer?.name || "Player"} is thinking`;
  const showRoundSummary = Boolean(gameState.lastRoundResult && roundSummaryKey !== dismissedSummaryKey);

  return (
    <div className="page game-page casino-page">
      <header className="game-hud">
        <div className="hud-left">
          <button
            type="button"
            className="hud-icon-button"
            aria-label="Exit game"
            onClick={leaveGame}
          >
            ←
          </button>
          <div className="hud-icon-button decorative" aria-hidden="true">
            ≡
          </div>
        </div>

        <div className="hud-center">
          <PlayerSeat
            player={turnPlayer || me}
            isTurn
            label={isMyTurn ? "Your turn" : "Now playing"}
            compact
            hero
          />
        </div>

        <div className="hud-right">
          <div className="buy-coins-chip">Table Info</div>
          <div className="hud-stats-card">
            <div className="hud-stat-line">
              <span>Room</span>
              <strong>{gameState.id}</strong>
            </div>
            <div className="hud-stat-line">
              <span>Leader</span>
              <strong>{leadPlayer?.name || "--"}</strong>
            </div>
            <div className="hud-stat-line">
              <span>Rounds</span>
              <strong>
                {gameState.currentRound}/{gameState.rounds}
              </strong>
            </div>
            <div className="hud-stat-line">
              <span>Cards</span>
              <strong>{cardsInPlay}</strong>
            </div>
          </div>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="table-stage">
        {otherPlayers.map((player) => (
          <div key={player.id} className={`table-seat ${player.positionClass}`}>
            <PlayerSeat
              player={player}
              isTurn={turnPlayer?.id === player.id}
              label={player.seatLabel}
            />
          </div>
        ))}

        <div className="table-wrapper">
          <div className="table-rim">
            <div className="table-felt">
              <div className="table-status-strip">
                <div className={isMyTurn ? "turn-banner active" : "turn-banner"}>
                  <strong>{isMyTurn ? "Your move" : `Turn: ${turnPlayer?.name || "..."}`}</strong>
                  <span>{turnStatus}</span>
                </div>
              </div>

              <GameBoard board={gameState.board} />

              <div className="table-actions">
                <div className="table-note">
                  {canPass
                    ? "No valid move available, so pass is unlocked."
                    : isMyTurn
                      ? "A playable card is available in your hand."
                      : "Watch the table and wait for your next turn."}
                </div>
                <div className="table-timer" aria-label="Round progress">
                  <span className="table-timer-label">Round</span>
                  <strong>
                    {gameState.currentRound}/{gameState.rounds}
                  </strong>
                </div>
                <button
                  type="button"
                  className="secondary-button table-pass-button"
                  onClick={onPass}
                  disabled={!canPass}
                >
                  Pass Turn
                </button>
              </div>
            </div>
          </div>

          <aside className="table-side-panel">
            <div className="table-side-heading">Standings</div>
            <ScoreBoard players={standings} playerId={playerId} />
            <ChatBox room={gameState} playerName={me?.name} />
          </aside>
        </div>
      </section>

      <section className="hand-panel casino-hand-panel">
        <div className="you-seat-banner">
          <PlayerSeat player={me} isTurn={isMyTurn} label="Guest" isSelf compact />
        </div>
        <div className="hand-header">
          <div>
            <h2>Your Hand</h2>
            <p className="hand-subtitle">
              Build each suit outward from 7. Hearts opens the table.
            </p>
          </div>
          <span className="match-chip active">{me?.cards?.length || 0} cards left</span>
        </div>
        <PlayerHand
          cards={me?.cards || []}
          playerId={playerId}
          roomId={gameState.id}
          board={gameState.board}
          isMyTurn={isMyTurn}
          gameOver={gameState.gameOver}
        />
      </section>

      {gameState.gameOver && (
        <div className="panel game-over">
          <h2>Game Over</h2>
          <p>Champion: {gameState.winner}</p>

          {gameState.finalStandings?.length > 0 && (
            <div className="final-standings">
              {gameState.finalStandings.map((player, index) => (
                <div key={player.id} className={index === 0 ? "final-standing winner" : "final-standing"}>
                  <span className="final-standing-rank">#{index + 1}</span>
                  <strong>{player.name}</strong>
                  <b>{player.score} pts</b>
                </div>
              ))}
            </div>
          )}

          <button type="button" className="secondary-button" onClick={leaveGame}>
            Back Home
          </button>
        </div>
      )}

      {showRoundSummary && (
        <div className="round-summary-overlay">
          <div className="panel round-summary-card">
            <span className="meta-label">Round {gameState.lastRoundResult.roundNumber}</span>
            <h2>{gameState.lastRoundResult.winner} cleared their hand</h2>
            <p className="round-summary-copy">
              Penalty points have been added to the remaining players. Lowest total score still leads the table.
            </p>

            <div className="round-summary-list">
              {gameState.lastRoundResult.penalties.map((player) => (
                <div
                  key={player.id}
                  className={
                    player.id === gameState.lastRoundResult.winnerId
                      ? "round-summary-item winner"
                      : "round-summary-item"
                  }
                >
                  <strong>{player.name}</strong>
                  <span>+{player.roundPoints} round</span>
                  <b>{player.totalScore} total</b>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() => setDismissedSummaryKey(roundSummaryKey)}
            >
              {gameState.gameOver ? "View Final Result" : "Continue"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;
