<p align="center">
  <img src="https://img.shields.io/badge/SNAKE.IO-Multiplayer%20Platform-00ff88?style=for-the-badge&labelColor=050a0e" alt="SNAKE.IO" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/AWS-S3%20%2B%20EC2-FF9900?style=flat-square&logo=amazonaws&logoColor=white" />
</p>

---

# 🐍 SNAKE.IO

A production-ready **multiplayer Snake game platform** built on a modern React + Node.js stack. Features Google authentication, real-time room-based multiplayer via Socket.IO, a fully authoritative server-side game engine, and a modular Canvas 2D renderer — all wrapped in a cyberpunk neon aesthetic.

---

## ✨ Features

| Feature | Status |
|---------|--------|
| Google Sign-In via Firebase Auth | ✅ |
| Protected routing (auth-gated pages) | ✅ |
| Dashboard with Solo / Multiplayer options | ✅ |
| Room creation & join with 6-char codes | ✅ |
| Authoritative server-side game loop (200ms tick) | ✅ |
| Canvas 2D renderer with glow FX & particles | ✅ |
| Classic mode (solid walls, speed acceleration) | ✅ |
| Real-time multiplayer PvP (up to 4 players) | ✅ |
| Head-on combat resolution (higher score wins) | ✅ |
| Mobile touch swipe controls | ✅ |
| Keyboard (Arrow keys + WASD) controls | ✅ |
| High score persistence (localStorage) | ✅ |
| Docker multi-stage production build | ✅ |
| GitHub Actions CI/CD → AWS S3 deploy | ✅ |
| Graceful SIGTERM shutdown | ✅ |
| Antigravity mode (wrap-around walls) | 🔜 Coming Soon |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js v16+** (Docker image uses Node 20)
- A [Firebase project](https://console.firebase.google.com/) with **Google Sign-In** enabled

### 1 — Clone & Install

```bash
git clone <repo-url>
cd game

# Backend dependencies
npm install

# Frontend dependencies
cd client && npm install
```

### 2 — Configure Firebase

```bash
cp client/.env.example client/.env
```

Edit `client/.env` with your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

> **How to get these values:**
> Firebase Console → Build → Authentication → enable **Google** provider.
> Then go to Project Settings → Your Apps → Add Web App → copy the config object.

### 3 — Run (Development)

Open two terminals:

```bash
# Terminal 1 — Frontend dev server
cd client
npm run dev          # → http://localhost:5173

# Terminal 2 — Backend game server
node server.js       # → http://localhost:3000
```

The Vite dev server proxies Socket.IO requests to `localhost:3000` automatically.

---

## 🏗️ Project Structure

```
game/
├── server.js                   # Authoritative Node.js + Socket.IO game server
├── Dockerfile                  # Multi-stage production Docker build
├── .dockerignore
├── package.json                # Backend: express, socket.io, nodemon
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions: push to main → AWS S3 deploy
│
└── client/                     # React 19 frontend (Vite)
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env.example
    ├── .env                    # Your local Firebase credentials (git-ignored)
    │
    └── src/
        ├── main.jsx            # App entry point
        ├── App.jsx             # Router setup + AuthProvider
        ├── index.css           # Global styles & design tokens
        │
        ├── pages/
        │   ├── LoginPage.jsx       # Google sign-in UI
        │   ├── DashboardPage.jsx   # Mode selector, solo/multiplayer entry
        │   ├── RoomPage.jsx        # Lobby — create/join room, player list
        │   └── GamePage.jsx        # Full game view with HUD + canvas
        │
        ├── components/
        │   ├── Navbar.jsx          # Top navigation bar with user info & sign-out
        │   ├── ProtectedRoute.jsx  # Auth guard for protected pages
        │   ├── GameCanvas.jsx      # Canvas mount + resize observer
        │   ├── GameHUD.jsx         # Score, lives, mode badge overlay
        │   ├── GameOverOverlay.jsx # End-of-game modal (score, high score, actions)
        │   └── LoadingSpinner.jsx  # Reusable loading indicator
        │
        ├── game/               # Pure game logic — zero React dependency
        │   ├── engine.js       # SnakeEngine class (movement, collision, food, scoring)
        │   ├── renderer.js     # GameRenderer class (Canvas 2D, glow, particles)
        │   ├── modes.js        # Mode configs: classic, multiplayer, antigravity
        │   └── input.js        # InputHandler (keyboard + touch swipe)
        │
        ├── services/
        │   ├── firebase.js     # Firebase app init + GoogleAuthProvider
        │   ├── auth.js         # signInWithGoogle, signOut, onAuthChange
        │   └── socket.js       # SocketService singleton (Socket.IO client)
        │
        ├── context/
        │   └── AuthContext.jsx # React Context — current user, loading state
        │
        └── hooks/
            ├── useGame.js      # Integrates SnakeEngine + GameRenderer into React
            └── useSocket.js    # Reactive wrapper around SocketService
```

---

## 🎮 Game Modes

| Mode | Grid | Walls | Speed | Score/Food | Status |
|------|------|-------|-------|-----------|--------|
| **Classic** 🎮 | 20×20 | Solid (death) | 130ms → 50ms | 10 pts | ✅ Live |
| **Multiplayer** 👥 | 25×25 | Solid (death) | 100ms constant | 10 pts | ✅ Live |
| **Antigravity** 🌀 | 20×20 | Wrap-around | 110ms → 60ms | 15 pts | 🔜 Soon |

- **Classic** — Eat food, grow, don't hit walls or yourself. Speed increases with every food eaten.
- **Multiplayer** — Real-time PvP up to 4 players per room. Head-on: higher score eliminates lower. First to 500 pts or last alive wins.
- **Antigravity** — Walls wrap around. Higher score per food. Config is already defined in `modes.js`; UI coming soon.

New modes are added in `client/src/game/modes.js` only — no changes to engine or renderer required.

---

## 🔌 Socket.IO Event Reference

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `{ roomCode, playerData: { name, color } }` | Join or create a room |
| `start-game` | `roomCode` | Host starts the game (host only) |
| `move` | `'UP' \| 'DOWN' \| 'LEFT' \| 'RIGHT'` | Player direction input |
| `ping-check` | `clientTimestamp` | Latency check |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room-users` | `{ users, hostId, gameStarted }` | Room membership update |
| `game-state` | Full room state snapshot | Broadcast every 200ms tick |
| `game-started` | — | Host started the game |
| `game-over` | `{ winner: socketId }` | Game ended |
| `room-full` | — | Room at max capacity (4 players) |
| `pong-check` | `{ clientTs, serverTs, tickRate }` | Latency response |

---

## 🗺️ App Flow

```
/  (Login)
  └─ Google Sign-In
       └─ /dashboard
            ├─ Play Solo  → /game?mode=classic
            ├─ Create Room → /room/:code  (user becomes host)
            └─ Join Room   → /room/:code
                                └─ Host clicks Start
                                     └─ /game?mode=multiplayer&room=:code
                                          └─ Game Over → Play Again / Dashboard
```

All routes under `/dashboard`, `/game`, and `/room/:code` are protected by `ProtectedRoute` — unauthenticated users are redirected to `/`.

> **Room codes** are 6 characters long and use an unambiguous charset (`A-Z` excluding `I`/`O`, digits `2-9`) to prevent misreading.

---

## 🖥️ Server Architecture

`server.js` is the **single source of truth** for all multiplayer game state.

```
Express + HTTP Server
    └─ Socket.IO Server
          └─ rooms{}  (in-memory)
               ├─ players{}    — snake body, direction, score, color, alive
               ├─ food[]       — up to 3 food items per room
               ├─ gameStarted  — bool
               ├─ hostId       — socket ID of the room creator
               └─ interval     — setInterval handle (200ms tick)
```

**Tick loop logic (per 200ms):**
1. Advance every player's snake head by its current direction
2. Apply wrap-around for out-of-bounds positions
3. Check self-collision → mark dead
4. Check food collision → grow + score +10, replenish food
5. Resolve head-on player collisions → lower score player eliminated
6. Check win condition (score ≥ 500 **or** last player alive)
7. Broadcast `game-state` to the entire room

---

## 🎨 Renderer Details

`GameRenderer` (`client/src/game/renderer.js`) uses the **Canvas 2D API**:

- **Background** — dark radial gradient (`#0a1015` → `#050a0e`)
- **Grid** — subtle 0.5px lines at 40% opacity
- **Snake head** — rounded rect with direction-aware eyes, full neon glow (`shadowBlur: 24`)
- **Snake body** — tail-fade alpha (`0.4 → 1.0`), softer glow
- **Food** — pulsing radial glow + golden core (`#ffcc00`), animated with `requestAnimationFrame`
- **Particles** — burst of 10 golden particles on food consumption, physics-based fade-out
- **Multiplayer** — renders each player's snake in their assigned color

---

## 🐳 Docker Deployment

```bash
# Build image (multi-stage: builds React then bundles with Node)
docker build -t snake-io .

# Run locally
docker run -p 3000:3000 snake-io
# → open http://localhost:3000
```

### Multi-Stage Build Overview

```dockerfile
# Stage 1 — Node 20 Alpine: install deps, run vite build
FROM node:20-alpine AS frontend-build
# → outputs /app/client/dist

# Stage 2 — Node 20 Alpine: backend only + copy dist
FROM node:20-alpine
# → serves dist/ as static + runs Socket.IO on :3000
```

**Deploy to AWS EC2 via ECR:**
```bash
docker build -t snake-io .
docker tag snake-io:latest <ecr-url>/snake-io:latest
docker push <ecr-url>/snake-io:latest
# SSH into EC2, pull & run
```

---

## ⚙️ CI/CD — GitHub Actions

The repository includes a GitHub Actions workflow that automatically deploys to **AWS S3** on every push to `main`.

**Workflow file:** `.github/workflows/deploy.yml`

```yaml
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_KEY }}
          aws-region: ap-south-1
      - run: aws s3 sync . s3://aryansingh-lpu804 --delete
```

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY` | IAM user access key with S3 write permissions |
| `AWS_SECRET_KEY` | IAM user secret key |

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------| 
| ⚛️ Frontend Framework | React | 19 | UI & component model |
| ⚡ Build Tool | Vite | 5 | Dev server & production bundler |
| 🎨 Styling | Tailwind CSS | 3 | Utility-first CSS |
| 🔐 Auth | Firebase Auth | 12 | Google Sign-In |
| 🎮 Rendering | Canvas 2D API | — | Game graphics |
| 🔌 Realtime | Socket.IO | 4 (client + server) | Multiplayer sync |
| 🧭 Routing | React Router | 7 | SPA navigation |
| 🟢 Server | Node.js + Express | 20 / 4.18 | HTTP + static serving |
| 🐳 Deployment | Docker | multi-stage | Containerized production |
| 🎞️ Animations | Framer Motion | 12 | UI transitions |
| ☁️ Cloud | AWS S3 + EC2 | — | Hosting & deployment |

---

## ⌨️ Controls

| Input | Action |
|-------|--------|
| `Arrow Keys` / `W A S D` | Move snake |
| `Space` / `Escape` | Pause / Resume |
| **Touch swipe** (≥30px) | Move snake (mobile) |

---

## 🔮 Roadmap

- [ ] Antigravity mode UI (config already in `modes.js`)
- [ ] ELO-based matchmaking
- [ ] Global leaderboards (Firebase Firestore)
- [ ] Custom snake skins / colours
- [ ] Spectator mode
- [ ] Full CI/CD pipeline (GitHub Actions → Docker → ECR → EC2)
- [ ] Tournament bracket system
- [ ] Reconnection handling (mid-game rejoin)

---

## 📄 License

MIT — feel free to fork, extend, and ship.
