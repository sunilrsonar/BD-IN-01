const rooms = {};

function generateRoomId(){
  let roomId;

  do {
    roomId = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  } while (rooms[roomId]);

  return roomId;
}

function createRoom(socketId, name, rounds = 5, maxPlayers = 4){
  const roomId = generateRoomId();
  const totalRounds = Number.isInteger(rounds) && rounds >= 1 && rounds <= 15 ? rounds : 5;
  const totalPlayers = [3, 4, 5, 6].includes(maxPlayers) ? maxPlayers : 4;

  rooms[roomId] = {
    id: roomId,
    creatorId: socketId,
    rounds: totalRounds,
    maxPlayers: totalPlayers,
    currentRound: 1,
    dealStartIndex: 0,
    lastRoundResult: null,
    finalStandings: [],
    players: [
      {
        id: socketId,
        name,
        cards: [],
        score: 0,
        connected: true
      }
    ]
  };

  return rooms[roomId];
}

function joinRoom(roomId, socketId, name){

  const room = rooms[roomId];
  if (!room) return null;

  const existing = room.players.find(p => p.name === name);
  if (existing) {
    existing.id = socketId;
    existing.connected = true;
    return room;
  }

  if (room.players.length >= room.maxPlayers) {
    return null;
  }

  room.players.push({
    id: socketId,
    name,
    cards: [],
    score: 0,
    connected: true
  });

  return room;

}

function leaveRoom(socketId){
  const affectedRooms = [];

  Object.entries(rooms).forEach(([roomId, room]) => {
    const player = room.players.find(p => p.id === socketId);
    if (player) {
      player.connected = false;
      affectedRooms.push(roomId);
    }
  });

  return affectedRooms;
}

function getRoom(roomId){
  return rooms[roomId];
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom
};
