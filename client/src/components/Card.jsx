import React from "react";

const suitIcons = {
  hearts: "♥",
  spades: "♠",
  diamonds: "♦",
  clubs: "♣"
};

const suitColors = {
  hearts: "#cf4f5f",
  diamonds: "#e06d52",
  spades: "#1b2940",
  clubs: "#1b2940"
};

const suitBackgrounds = {
  hearts: "linear-gradient(180deg, rgba(255, 249, 250, 0.99), rgba(243, 228, 233, 0.95))",
  diamonds: "linear-gradient(180deg, rgba(255, 250, 247, 0.99), rgba(244, 233, 227, 0.95))",
  spades: "linear-gradient(180deg, rgba(251, 253, 255, 0.99), rgba(227, 234, 243, 0.95))",
  clubs: "linear-gradient(180deg, rgba(249, 252, 255, 0.99), rgba(224, 232, 241, 0.95))"
};

function Card({ card, onClick, disabled = false, isPlayable = false, style }) {
  const icon = suitIcons[card.suit] || card.suit;
  const color = suitColors[card.suit] || "#fff";
  const background = suitBackgrounds[card.suit];

  return (
    <button
      type="button"
      className={isPlayable ? "playing-card playable" : "playing-card"}
      onClick={disabled ? undefined : onClick}
      aria-label={`Play ${card.value} of ${card.suit}`}
      disabled={disabled}
      style={{
        borderColor: color,
        color,
        background,
        ...style
      }}
    >
      <span className="card-corner top">
        {card.value}
        <span className="card-suit">{icon}</span>
      </span>
      <div className="card-center">
        <div className="card-value">{card.value}</div>
        <span className="card-suit large">{icon}</span>
      </div>
      <span className="card-corner bottom">
        {card.value}
        <span className="card-suit">{icon}</span>
      </span>
      {isPlayable && <span className="playable-badge">Play</span>}
    </button>
  );
}

export default Card;
