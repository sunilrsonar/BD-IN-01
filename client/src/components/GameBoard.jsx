import React from "react";

const playOrder = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

function valueToNumber(value) {
  return playOrder.indexOf(String(value));
}

function GameBoard({ board }) {
  const suitSymbols = {
    hearts: "♥",
    spades: "♠",
    diamonds: "♦",
    clubs: "♣"
  };

  const boardState = board || {
    hearts: [],
    spades: [],
    diamonds: [],
    clubs: []
  };

  const suits = [
    { key: "hearts", label: "Hearts", color: "#db534f", lane: "top" },
    { key: "clubs", label: "Clubs", color: "#1a1a24", lane: "right" },
    { key: "spades", label: "Spades", color: "#1a1a24", lane: "bottom" },
    { key: "diamonds", label: "Diamonds", color: "#db534f", lane: "left" }
  ];
  const totalCardsOnTable = Object.values(boardState).reduce((sum, pile) => sum + pile.length, 0);

  return (
    <div className="game-board">
      <div className="table-decor right" aria-hidden="true">
        <span className="decor-chip">Played</span>
        <strong>{totalCardsOnTable}</strong>
      </div>

      <div className="board-center-seal">
        <span className="board-center-label">Opening Card</span>
        <strong>7 Hearts</strong>
      </div>

      {suits.map((suit) => (
        <div key={suit.key} className={`board-suit lane-${suit.lane}`}>
          <div className="board-suit-header">
            <span className="board-label" style={{ color: suit.color }}>
              {suitSymbols[suit.key]} {suit.label}
            </span>
          </div>

          <div className={`board-values ${boardState[suit.key].length === 0 ? "empty" : ""}`}>
            {boardState[suit.key].length === 0 ? (
              <span className="board-empty" style={{ color: suit.color }}>
                {suitSymbols[suit.key]}
              </span>
            ) : (
              [...boardState[suit.key]]
                .sort((left, right) => valueToNumber(left) - valueToNumber(right))
                .map((value) => (
                  <span
                    key={`${suit.key}-${value}`}
                    className={`board-card ${suit.key}`}
                    style={{ color: suit.color }}
                  >
                    <span className="board-card-value">{value}</span>
                    <span className="board-card-suit">{suitSymbols[suit.key]}</span>
                  </span>
                ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default GameBoard;
