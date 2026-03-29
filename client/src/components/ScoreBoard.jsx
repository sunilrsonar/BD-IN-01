import React from "react";

function ScoreBoard({ players, playerId }) {
  return (
    <div className="score-list">
      {players.map((player, index) => (
        <div key={player.id} className={player.id === playerId ? "score-item you" : "score-item"}>
          <div className="score-player">
            <span className="score-rank">#{index + 1}</span>
            <strong>{player.id === playerId ? "You" : player.name}</strong>
          </div>
          <b>{player.score}</b>
        </div>
      ))}
    </div>
  );
}

export default ScoreBoard;
