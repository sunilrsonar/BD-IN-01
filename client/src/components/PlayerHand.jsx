import React from "react";

import Card from "./Card";
import socket from "../socket";
import { getValidMoves, sortCards } from "../lib/gameRules";

function PlayerHand({ cards, roomId, playerId, board, isMyTurn, gameOver }) {
  const sortedCards = sortCards(cards);
  const validMoves = getValidMoves(board, cards);
  const validKeys = new Set(validMoves.map((card) => `${card.suit}-${card.value}`));
  const midpoint = sortedCards.length > 1 ? (sortedCards.length - 1) / 2 : 0;

  function playCard(card) {
    socket.emit("play_card", {
      roomId,
      playerId,
      card
    });
  }

  return (
    <div className="hand-shell">
      {cards.length === 0 && <div className="hand-empty">No cards remaining.</div>}

      <div className="combined-hand-row">
        {sortedCards.map((card, index) => {
          const cardKey = `${card.suit}-${card.value}`;
          const isPlayable = isMyTurn && validKeys.has(cardKey);
          const spread = index - midpoint;
          const rotate = spread * 2.8;
          const lift = Math.abs(spread) * 3;

          return (
            <Card
              key={`${cardKey}-${index}`}
              card={card}
              isPlayable={isPlayable}
              disabled={gameOver || !isMyTurn || !isPlayable}
              onClick={() => playCard(card)}
              style={{
                "--card-rotate": `${rotate}deg`,
                "--card-lift": `${lift}px`,
                "--card-index": index
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default PlayerHand;
