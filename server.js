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

const GRID_SIZE = 20;          // Grid dimensions (20×20)
const TICK_RATE = 120;         // Game loop interval in ms (~8 ticks/sec)
const FOOD_COUNT = 5;          // Max simultaneous food items

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
  cors: { origin: "*" },
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

// ─── Game State ────────────────────────────────────────────────────────────────

/**
 * players: Map<socketId, PlayerState>
 * PlayerState: { id, name, color, direction, nextDirection, snake: [{x,y}], score, alive }
 */
const players = new Map();

/**
 * food: Array<{x, y, id}>
 */
let food = [];

let colorIndex = 0;

// ─── Utility Functions ─────────────────────────────────────────────────────────

/** Returns a random integer in [0, max) */
function randInt(max) {
  return Math.floor(Math.random() * max);
}

/** Checks whether a cell {x,y} is occupied by any snake segment */
function isCellOccupied(x, y) {
  for (const player of players.values()) {
    if (!player.alive) continue;
    for (const seg of player.snake) {
      if (seg.x === x && seg.y === y) return true;
    }
  }
  return false;
}

/** Spawns a single food item at an unoccupied cell */
function spawnFood() {
  let attempts = 0;
  while (attempts < 200) {
    const x = randInt(GRID_SIZE);
    const y = randInt(GRID_SIZE);
    const occupied = isCellOccupied(x, y);
    const duplicate = food.some(f => f.x === x && f.y === y);
    if (!occupied && !duplicate) {
      food.push({ x, y, id: `${Date.now()}-${Math.random()}` });
      return;
    }
    attempts++;
  }
}

/** Fills food array up to FOOD_COUNT */
function replenishFood() {
  while (food.length < FOOD_COUNT) {
    spawnFood();
  }
}

/** Returns a safe random spawn position (not occupied) */
function getSpawnPosition() {
  let attempts = 0;
  while (attempts < 500) {
    const x = randInt(GRID_SIZE);
    const y = randInt(GRID_SIZE);
    if (!isCellOccupied(x, y)) return { x, y };
    attempts++;
  }
  // Fallback — grid may be nearly full, pick anything
  return { x: randInt(GRID_SIZE), y: randInt(GRID_SIZE) };
}

/** Creates a fresh snake for a new / respawned player */
function createSnake(spawnPos) {
  return [
    { ...spawnPos },
    { x: spawnPos.x, y: (spawnPos.y + 1) % GRID_SIZE }, // body starts below head
  ];
}

/** Resets (respawns) a player after collision */
function respawnPlayer(player) {
  const pos = getSpawnPosition();
  player.snake = createSnake(pos);
  player.direction = "UP";
  player.nextDirection = "UP";
  player.score = 0;
  player.alive = true;
}

// ─── Game Loop ─────────────────────────────────────────────────────────────────

function gameTick() {
  for (const player of players.values()) {
    if (!player.alive) {
      // Brief dead pause — respawn after 1 tick (immediate for simplicity)
      respawnPlayer(player);
      continue;
    }

    // Apply queued direction (ignore reversal)
    if (player.nextDirection !== OPPOSITES[player.direction]) {
      player.direction = player.nextDirection;
    }

    const delta = DIRECTIONS[player.direction];
    const head = player.snake[0];

    // Calculate new head position
    const newHead = {
      x: head.x + delta.x,
      y: head.y + delta.y,
    };

    // ── Wall Collision ──────────────────────────────────────────────────────
    if (
      newHead.x < 0 || newHead.x >= GRID_SIZE ||
      newHead.y < 0 || newHead.y >= GRID_SIZE
    ) {
      player.alive = false;
      continue;
    }

    // ── Self Collision ──────────────────────────────────────────────────────
    // Exclude the tail tip because it will move away this tick
    const bodyWithoutTail = player.snake.slice(0, player.snake.length - 1);
    const selfCollision = bodyWithoutTail.some(
      seg => seg.x === newHead.x && seg.y === newHead.y
    );
    if (selfCollision) {
      player.alive = false;
      continue;
    }

    // ── Other Player Collision ──────────────────────────────────────────────
    let hitOther = false;
    for (const other of players.values()) {
      if (other.id === player.id || !other.alive) continue;
      for (const seg of other.snake) {
        if (seg.x === newHead.x && seg.y === newHead.y) {
          hitOther = true;
          break;
        }
      }
      if (hitOther) break;
    }
    if (hitOther) {
      player.alive = false;
      continue;
    }

    // ── Move Snake ──────────────────────────────────────────────────────────
    player.snake.unshift(newHead);

    // ── Food Consumption ────────────────────────────────────────────────────
    const foodIdx = food.findIndex(f => f.x === newHead.x && f.y === newHead.y);
    if (foodIdx !== -1) {
      food.splice(foodIdx, 1); // Remove eaten food
      player.score += 10;
      replenishFood();          // Immediately spawn replacement
      // Do NOT pop tail — snake grows
    } else {
      player.snake.pop();       // Normal move — advance without growing
    }
  }

  // Broadcast authoritative state to all clients
  broadcastState();
}

/** Serialises and emits game state to every connected client */
function broadcastState() {
  const state = {
    players: Array.from(players.values()).map(p => ({
      id:        p.id,
      name:      p.name,
      color:     p.color,
      snake:     p.snake,
      score:     p.score,
      alive:     p.alive,
      direction: p.direction,
    })),
    food,
    gridSize: GRID_SIZE,
    timestamp: Date.now(),
  };
  io.emit("state", state);
}

// Start the server-authoritative game loop
const gameLoop = setInterval(gameTick, TICK_RATE);

// ─── Socket.IO Events ──────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log(`[+] Player connected: ${socket.id}`);

  // Assign color and create player
  const color = SNAKE_COLORS[colorIndex % SNAKE_COLORS.length];
  colorIndex++;

  const spawnPos = getSpawnPosition();
  const player = {
    id:            socket.id,
    name:          `Player ${socket.id.slice(0, 4).toUpperCase()}`,
    color,
    direction:     "UP",
    nextDirection: "UP",
    snake:         createSnake(spawnPos),
    score:         0,
    alive:         true,
  };

  players.set(socket.id, player);
  replenishFood();

  // Confirm identity to the joining client
  socket.emit("init", { playerId: socket.id, gridSize: GRID_SIZE });

  // ── Input: Direction Change ─────────────────────────────────────────────
  socket.on("move", (direction) => {
    if (!DIRECTIONS[direction]) return; // Ignore invalid payloads
    const p = players.get(socket.id);
    if (!p || !p.alive) return;
    // Queue the direction; reversal guard is applied in gameTick
    if (direction !== OPPOSITES[p.direction]) {
      p.nextDirection = direction;
    }
  });

  // ── Disconnect ──────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    console.log(`[-] Player disconnected: ${socket.id}`);
    players.delete(socket.id);
  });
});

// ─── Start Server ──────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🐍 Snake Server running at http://0.0.0.0:${PORT}\n`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  clearInterval(gameLoop);
  server.close();
});
