import React from "react";

function PlayerSeat({ player, isTurn, label, isSelf = false, compact = false, hero = false }) {
  if (!player) return null;

  const initials = player.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

  const cardCount = player.cardsCount ?? player.cards?.length ?? 0;
  const score = player.score ?? 0;

  return (
    <div
      className={
        "player-seat" +
        (isTurn ? " current" : "") +
        (isSelf ? " self" : "") +
        (compact ? " compact" : "") +
        (hero ? " hero" : "")
      }
    >
      <div className="seat-avatar" aria-hidden="true">
        <span>{initials}</span>
        <span className="seat-level">{cardCount}</span>
      </div>

      <div className="seat-content">
        <div className="seat-header">
          <div className="seat-name-block">
            <span className="seat-tag">{label || "Player"}</span>
            <div className="player-name">{player.name}</div>
          </div>
          {isTurn && <span className="turn-badge">Turn</span>}
        </div>

        <div className="player-info">
          <span>{cardCount} cards</span>
          <span>{score} pts</span>
          {player.connected === false && <span className="disconnected">Offline</span>}
        </div>
      </div>
    </div>
  );
}

export default PlayerSeat;
