<p align="center">
  <img src="https://img.shields.io/badge/SNAKE.IO-Multiplayer%20Platform-00ff88?style=for-the-badge&labelColor=050a0e" alt="SNAKE.IO" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" />
</p>

---

# 🐍 SNAKE.IO

A scalable, production-ready multiplayer Snake game platform with Google authentication, room-based gameplay, and a modular game engine — wrapped in a cyberpunk neon aesthetic.

---

## ✨ Features

| Feature | Status |
|---------|--------|
| Google Sign-In (Firebase) | ✅ |
| Dashboard with Solo / Multiplayer options | ✅ |
| Room creation & join with 6-char codes | ✅ |
| Canvas-based snake game engine | ✅ |
| Classic mode (walls, speed progression) | ✅ |
| Multiplayer mode (UI ready) | 🔧 |
| Antigravity mode (wrap-around) | 🔮 |
| Responsive mobile + desktop | ✅ |
| Docker deployment | ✅ |
| Socket.IO integration layer | 🔧 |

---

## 🚀 Quick Start

### Prerequisites

- Node.js **v20+**
- A [Firebase project](https://console.firebase.google.com/) with Google Sign-In enabled

### 1 — Clone & install

```bash
git clone <repo-url>
cd game

# Backend
npm install

# Frontend
cd client
npm install
```

### 2 — Configure Firebase

Copy the example env and fill in your Firebase credentials:

```bash
cp client/.env.example client/.env
```

```env
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000
VITE_FIREBASE_APP_ID=1:000:web:abc
VITE_SOCKET_URL=http://localhost:3000
```

> **Need help?** In Firebase Console → Build → Authentication → enable Google provider. Then Project Settings → Your Apps → add a Web app to get the config.

### 3 — Run

```bash
# Terminal 1 — Frontend (dev server)
cd client && npm run dev          # → http://localhost:5173

# Terminal 2 — Backend (multiplayer server)
node server.js                    # → http://localhost:3000
```

---

## 🏗️ Project Structure

```
game/
│
├── server.js               # Node.js + Express + Socket.IO game server
├── Dockerfile              # Multi-stage production build
├── .dockerignore
├── package.json
│
├── index.html              # Legacy vanilla JS frontend
├── script.js               #   (kept for backward compatibility)
├── style.css
│
└── client/                 # ← Modern React frontend
    ├── src/
    │   ├── pages/          # LoginPage, Dashboard, RoomPage, GamePage
    │   ├── components/     # GameCanvas, GameHUD, GameOverOverlay, Navbar
    │   ├── game/           # Modular engine (decoupled from React)
    │   │   ├── engine.js   #   Core logic: movement, collision, food, scoring
    │   │   ├── renderer.js #   Canvas 2D rendering with glow effects
    │   │   ├── modes.js    #   Mode configs (classic, multiplayer, antigravity)
    │   │   └── input.js    #   Keyboard + touch swipe handler
    │   ├── services/       # firebase.js, auth.js, socket.js
    │   ├── context/        # AuthContext (React Context)
    │   └── hooks/          # useGame, useSocket
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## 🎮 Game Modes

| Mode | Grid | Walls | Speed | Description |
|------|------|-------|-------|-------------|
| **Classic** | 20×20 | Solid | Accelerates | Eat, grow, survive. Beat your high score. |
| **Multiplayer** | 25×25 | Solid | Constant | Real-time PvP. Last snake standing wins. |
| **Antigravity** | 20×20 | Wrap | Accelerates | Walls wrap around. Master the chaos. |

New modes can be added by extending `src/game/modes.js` — zero changes to existing code.

---

## 🗺️ App Flow

```
Login  →  Dashboard  →  Play Solo     →  Game (Classic)
                     →  Create Room   →  Lobby  →  Game (Multiplayer)
                     →  Join Room     →  Lobby  →  Game (Multiplayer)

Game Over  →  Play Again  /  Back to Dashboard
```

---

## 🐳 Docker Deployment

```bash
# Build
docker build -t snake-io .

# Run
docker run -p 3000:3000 snake-io
```

The multi-stage Dockerfile:
1. Builds the React frontend (`npm run build`)
2. Bundles it with the Node.js server
3. Serves everything from a single container on port 3000

**Deploy to AWS EC2:**
```bash
docker build -t snake-io .
docker tag snake-io:latest <ecr-url>/snake-io:latest
docker push <ecr-url>/snake-io:latest
```

**Static frontend only (S3):**
```bash
cd client && npm run build
# Upload dist/ to S3 bucket with CloudFront
```

---

## 🛠️ Tech Stack

| | Technology | Purpose |
|---|---|---|
| ⚛️ | React 19 | UI framework |
| ⚡ | Vite 5 | Build tool & dev server |
| 🎨 | Tailwind CSS 3 | Styling |
| 🔐 | Firebase Auth | Google Sign-In |
| 🎮 | Canvas 2D API | Game rendering |
| 🔌 | Socket.IO | Real-time multiplayer |
| 🧭 | React Router 7 | Client-side routing |
| 🟢 | Node.js + Express | Backend server |
| 🐳 | Docker | Containerized deployment |

---

## 🔮 Roadmap

- [ ] Backend multiplayer game logic via Socket.IO
- [ ] Matchmaking & ELO ranking
- [ ] Global leaderboards
- [ ] Antigravity game mode
- [ ] Custom snake skins
- [ ] Spectator mode
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Tournament system

---

## 📄 License

MIT
