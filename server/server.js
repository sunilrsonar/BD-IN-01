const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const { createRoom, joinRoom, leaveRoom, getRoom } = require("./roomManager");
const { startGame, playCard, passTurn } = require("./gameEngine");

const app = express();
const server = http.createServer(app);
const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT) || 5000;

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

function maskGameStateForPlayer(state, socketId) {
  if (!state) return state;

  const players = state.players.map((p) => {
    if (p.id === socketId) return p;
    return {
      ...p,
      cards: [],
      cardsCount: p.cards?.length ?? 0
    };
  });

  return {
    ...state,
    players
  };
}

async function broadcastToRoom(roomId, event, state) {
  const sockets = await io.in(roomId).fetchSockets();
  sockets.forEach((s) => {
    s.emit(event, maskGameStateForPlayer(state, s.id));
  });
}

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  socket.on("create_room", ({ name, rounds, maxPlayers }) => {
    const room = createRoom(socket.id, name, rounds, maxPlayers);

    socket.join(room.id);

    socket.emit("room_created", room);
    io.to(room.id).emit("lobby_update", room);

  });

  socket.on("join_room", ({ roomId, name }) => {
    const normalizedRoomId = String(roomId ?? "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4);

    const room = joinRoom(normalizedRoomId, socket.id, name);
    if (!room) {
      socket.emit("room_error", { message: "Room not found or full" });
      return;
    }

    socket.join(normalizedRoomId);
    io.to(normalizedRoomId).emit("lobby_update", room);

  });

  socket.on("start_game", ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room) {
      socket.emit("room_error", { message: "Room not found" });
      return;
    }

    if (room.creatorId !== socket.id) {
      socket.emit("room_error", { message: "Only the room creator can start the game" });
      return;
    }

    const connectedPlayers = room.players.filter((player) => player.connected !== false).length;
    if (connectedPlayers !== room.maxPlayers) {
      socket.emit("room_error", { message: `This room starts when all ${room.maxPlayers} players are connected` });
      return;
    }

    const gameState = startGame(roomId);

    broadcastToRoom(roomId, "game_started", gameState);
  });

  socket.on("play_card", ({ roomId, playerId, card }) => {
    const state = playCard(roomId, playerId, card);
    if (!state) {
      socket.emit("game_error", { message: "Invalid move" });
      return;
    }

    broadcastToRoom(roomId, "game_update", state);
  });

  socket.on("pass_turn", ({ roomId, playerId }) => {
    const state = passTurn(roomId, playerId);
    if (!state) {
      socket.emit("game_error", { message: "Cannot pass right now" });
      return;
    }

    broadcastToRoom(roomId, "game_update", state);
  });

  socket.on("send_message", ({ roomId, name, message }) => {
    io.to(roomId).emit("receive_message", { name, message });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const affectedRooms = leaveRoom(socket.id);
    affectedRooms.forEach(async (roomId) => {
      const room = getRoom(roomId);
      io.to(roomId).emit("lobby_update", room);
      if (room && room.board) {
        await broadcastToRoom(roomId, "game_update", room);
      }
    });
  });

});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
