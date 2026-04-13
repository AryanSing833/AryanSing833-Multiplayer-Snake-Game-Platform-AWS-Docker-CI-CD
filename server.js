/**
 * server.js — Multiplayer Snake Game Server
 * Single source of truth for all game state.
 * Handles: movement, collision detection, food spawning, scoring.
 */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID_SIZE = 20;
const TICK_RATE = 200;
const FOOD_COUNT = 3;
const MAX_PLAYERS = 4;

// Palette for snake colors — one per player slot
const SNAKE_COLORS = [
  "#00FF88", "#FF4466", "#00CCFF", "#FFB700",
  "#CC44FF", "#FF6600", "#00FFCC", "#FF0099",
];

// Cardinal directions mapped to delta vectors
const DIRECTIONS = {
  UP:    { x: 0,  y: -1 },
  DOWN:  { x: 0,  y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x: 1,  y:  0 },
};

// Prevent 180° reversal
const OPPOSITES = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };

// ─── App & Socket Setup ────────────────────────────────────────────────────────

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const clientDistPath = "/app/client/dist";

// 🔥 Serve index.html explicitly for root
app.get("/", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// Serve static files AFTER
app.use(express.static(clientDistPath));

// Fallback for React routes
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// ─── Authoritative Room State ─────────────────────────────────────────────────

const rooms = {};
const socketToRoom = new Map();
let colorIndex = 0;

function randInt(max) {
  return Math.floor(Math.random() * max);
}

function createPlayer(socketId) {
  const x = randInt(GRID_SIZE);
  const y = randInt(GRID_SIZE);
  const color = SNAKE_COLORS[colorIndex % SNAKE_COLORS.length];
  colorIndex++;
  return {
    id: socketId,
    x,
    y,
    direction: { ...DIRECTIONS.RIGHT },
    body: [
      { x, y },
      { x: Math.max(0, x - 1), y },
    ],
    score: 0,
    color,
    alive: true,
  };
}

function getOrCreateRoom(roomCode) {
  if (!rooms[roomCode]) {
    rooms[roomCode] = {
      players: {},
      food: [],
      gameStarted: false,
      hostId: null,
      interval: null,
    };
  }
  return rooms[roomCode];
}

function spawnFood(room) {
  while (room.food.length < FOOD_COUNT) {
    room.food.push({ x: randInt(GRID_SIZE), y: randInt(GRID_SIZE), id: `${Date.now()}-${Math.random()}` });
  }
}

function buildRoomState(roomCode) {
  const room = rooms[roomCode];
  return {
    roomCode,
    hostId: room.hostId,
    gameStarted: room.gameStarted,
    tickRate: TICK_RATE,
    gridSize: GRID_SIZE,
    food: room.food,
    players: Object.keys(room.players).reduce((acc, id) => {
      const p = room.players[id];
      acc[id] = {
        id: p.id,
        snake: p.body,
        direction: p.direction,
        score: p.score,
        color: p.color,
        alive: p.alive,
        name: `Player ${p.id.slice(0, 4).toUpperCase()}`,
      };
      return acc;
    }, {}),
    timestamp: Date.now(),
  };
}

function tickRoom(roomCode) {
  const room = rooms[roomCode];
  if (!room || !room.gameStarted) return;

  const players = Object.values(room.players);
  if (players.length === 0) return;

  for (const player of players) {
    player.x += player.direction.x;
    player.y += player.direction.y;
    const nextHead = { x: player.x, y: player.y };

    if (nextHead.x < 0) nextHead.x = GRID_SIZE - 1;
    if (nextHead.x >= GRID_SIZE) nextHead.x = 0;
    if (nextHead.y < 0) nextHead.y = GRID_SIZE - 1;
    if (nextHead.y >= GRID_SIZE) nextHead.y = 0;

    const hitSelf = player.body.some((seg) => seg.x === nextHead.x && seg.y === nextHead.y);
    if (hitSelf) {
      player.alive = false;
      continue;
    }

    player.body.unshift(nextHead);
    player.x = nextHead.x;
    player.y = nextHead.y;

    const foodIdx = room.food.findIndex((f) => f.x === nextHead.x && f.y === nextHead.y);
    if (foodIdx >= 0) {
      room.food.splice(foodIdx, 1);
      player.score += 10;
    } else {
      player.body.pop();
    }
    player.alive = true;
  }

  spawnFood(room);
  io.to(roomCode).emit("game-state", buildRoomState(roomCode));
}

function startRoomLoop(roomCode) {
  const room = rooms[roomCode];
  if (!room || room.interval) return;
  room.interval = setInterval(() => tickRoom(roomCode), TICK_RATE);
}

function stopRoomLoop(roomCode) {
  const room = rooms[roomCode];
  if (!room || !room.interval) return;
  clearInterval(room.interval);
  room.interval = null;
}

// ─── Socket.IO Events ──────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomCode) => {
    console.log("Joining room:", roomCode);
    const room = getOrCreateRoom(roomCode);
    if (Object.keys(room.players).length >= MAX_PLAYERS && !room.players[socket.id]) {
      socket.emit("room-full");
      return;
    }
    if (!room.hostId) room.hostId = socket.id;
    room.players[socket.id] = room.players[socket.id] || createPlayer(socket.id);
    spawnFood(room);

    socket.join(roomCode);
    socketToRoom.set(socket.id, roomCode);

    const clients = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
    console.log("Users in room:", clients);
    io.to(roomCode).emit("room-users", {
      users: clients,
      hostId: room.hostId,
      gameStarted: room.gameStarted,
    });
    io.to(roomCode).emit("game-state", buildRoomState(roomCode));
  });

  socket.on("start-game", (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return;
    if (socket.id !== room.hostId) return;
    room.gameStarted = true;
    startRoomLoop(roomCode);
    io.to(roomCode).emit("game-started");
  });

  socket.on("move", (direction) => {
    const nextDirection = DIRECTIONS[direction];
    if (!nextDirection) return;
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode || !rooms[roomCode]) return;
    const player = rooms[roomCode].players[socket.id];
    if (!player) return;
    const currentDirectionKey = Object.keys(DIRECTIONS).find(
      (key) => DIRECTIONS[key].x === player.direction.x && DIRECTIONS[key].y === player.direction.y
    );
    if (currentDirectionKey && direction !== OPPOSITES[currentDirectionKey]) {
      player.direction = { ...nextDirection };
    }
  });

  socket.on("ping-check", (clientTs) => {
    socket.emit("pong-check", {
      clientTs,
      serverTs: Date.now(),
      tickRate: TICK_RATE,
    });
  });

  socket.on("disconnect", () => {
    console.log(`[-] Player disconnected: ${socket.id}`);
    socketToRoom.delete(socket.id);
    for (const roomCode in rooms) {
      const room = rooms[roomCode];

      if (room.players[socket.id]) {
        delete room.players[socket.id];
      }

      if (room.hostId === socket.id) {
        const remaining = Object.keys(room.players);
        room.hostId = remaining[0] || null;
      }

      if (Object.keys(room.players).length === 0) {
        clearInterval(room.interval);
        delete rooms[roomCode];
        continue;
      }

      const clients = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
      io.to(roomCode).emit("room-users", {
        users: clients,
        hostId: room.hostId,
        gameStarted: room.gameStarted,
      });
      io.to(roomCode).emit("game-state", buildRoomState(roomCode));
    }
  });
});

// ─── Start Server ──────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🐍 Snake Server running at http://0.0.0.0:${PORT}\n`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  Object.keys(rooms).forEach((roomCode) => stopRoomLoop(roomCode));
  server.close();
});
