const { createDeck, shuffle } = require("./deck");
const { getRoom } = require("./roomManager");
const { calculateScore } = require("./score");

const playOrder = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

const valueToNumber = value => {
  return playOrder.indexOf(String(value));
};

function getFinalStandings(players) {
  return [...players]
    .map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score
    }))
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));
}

function getNextPlayerIndex(room, currentIndex){
  const total = room.players.length;
  let next = (currentIndex + 1) % total;

  // Skip disconnected players if any
  for (let i = 0; i < total; i++) {
    const player = room.players[next];
    if (player && player.connected !== false) {
      return next;
    }
    next = (next + 1) % total;
  }

  return next;
}

function buildBoard(){
  return {
    hearts: [],
    spades: [],
    diamonds: [],
    clubs: []
  };
}

function isValidPlay(room, card){
  const board = room.board;
  const suitBoard = board[card.suit];
  const cardNum = valueToNumber(card.value);

  if (!suitBoard) return false;

  // First move must be 7 of hearts
  const isFirstMove = Object.values(board).every(arr => arr.length === 0);
  if (isFirstMove) {
    return card.suit === "hearts" && card.value === "7";
  }

  // If suit never started, only allow 7 once hearts started
  if (suitBoard.length === 0) {
    return card.value === "7" && board.hearts.length > 0;
  }

  const nums = suitBoard.map(valueToNumber).sort((a, b) => a - b);
  const min = nums[0];
  const max = nums[nums.length - 1];

  return cardNum === min - 1 || cardNum === max + 1;
}

function getValidMoves(room, player){
  return player.cards.filter(card => isValidPlay(room, card));
}

function startGame(roomId){
  const room = getRoom(roomId);

  let deck = shuffle(createDeck());
  const dealStartIndex = room.dealStartIndex ?? 0;

  room.players.forEach(p => {
    p.cards = [];
  });

  let i = 0;
  while (deck.length) {
    const playerIndex = (dealStartIndex + i) % room.players.length;
    room.players[playerIndex].cards.push(deck.pop());
    i++;
  }

  room.dealStartIndex = (dealStartIndex + 1) % room.players.length;

  room.board = buildBoard();

  const starterIndex = room.players.findIndex(p =>
    p.cards.some(c => c.suit === "hearts" && c.value === "7")
  );

  room.turn = starterIndex >= 0 ? starterIndex : 0;
  room.roundOver = false;
  room.gameOver = false;
  room.winner = null;
  room.finalStandings = [];
  if (room.currentRound === 1) {
    room.lastRoundResult = null;
  }

  return room;
}

function endRound(room, winnerIndex){
  const winner = room.players[winnerIndex];
  const penalties = [];

  room.players.forEach((player, idx) => {
    const points = idx === winnerIndex ? 0 : calculateScore(player.cards);
    if (idx !== winnerIndex) {
      player.score += points;
    }

    penalties.push({
      id: player.id,
      name: player.name,
      roundPoints: points,
      totalScore: player.score
    });
  });

  room.lastRoundResult = {
    roundNumber: room.currentRound,
    winner: winner.name,
    winnerId: winner.id,
    penalties
  };

  if (room.currentRound >= room.rounds) {
    const finalStandings = getFinalStandings(room.players);
    room.gameOver = true;
    room.finalStandings = finalStandings;
    room.winner = finalStandings[0]?.name || winner.name;
    return;
  }

  const previousScores = room.players.map(p => p.score);
  room.currentRound += 1;
  const newRoom = startGame(room.id);

  room.players.forEach((player, idx) => {
    player.score = previousScores[idx];
  });

  room.board = newRoom.board;
  room.turn = newRoom.turn;
  room.roundOver = false;
  room.finalStandings = [];
}

function playCard(roomId, playerId, card){
  const room = getRoom(roomId);
  if (!room || room.gameOver) return null;

  const playerIndex = room.players.findIndex(p => p.id === playerId);
  if (playerIndex < 0) return null;

  if (room.turn !== playerIndex) return null;

  const player = room.players[playerIndex];
  const hasCard = player.cards.some(c => c.suit === card.suit && c.value === card.value);
  if (!hasCard) return null;

  if (!isValidPlay(room, card)) return null;

  player.cards = player.cards.filter(c => !(c.suit === card.suit && c.value === card.value));
  room.board[card.suit].push(card.value);

  if (player.cards.length === 0) {
    endRound(room, playerIndex);
    return room;
  }

  room.turn = getNextPlayerIndex(room, playerIndex);
  return room;
}

function passTurn(roomId, playerId){
  const room = getRoom(roomId);
  if (!room || room.gameOver) return null;

  const playerIndex = room.players.findIndex(p => p.id === playerId);
  if (playerIndex < 0) return null;
  if (room.turn !== playerIndex) return null;

  const player = room.players[playerIndex];
  const validMoves = getValidMoves(room, player);
  if (validMoves.length > 0) return null;

  room.turn = getNextPlayerIndex(room, playerIndex);
  return room;
}

module.exports = {
  startGame,
  playCard,
  passTurn,
  isValidPlay
};
